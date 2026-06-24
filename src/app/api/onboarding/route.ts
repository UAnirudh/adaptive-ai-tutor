import { NextResponse } from "next/server";
import { ensureDbUser, getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzeLearnerMemory } from "@/lib/tutor/gemini";
import { saveMemoryImport, upsertLearnerMemory } from "@/lib/tutor/student-model";
import { z } from "zod";

const onboardingSchema = z.object({
  gradeLevel: z.string().min(1),
  subjects: z.array(z.string()).min(1),
  shortTermGoals: z.string().optional(),
  longTermGoals: z.string().optional(),
  explanationStyle: z.enum(["concise", "balanced", "detailed"]),
  explanationLength: z.enum(["short", "medium", "long"]),
  difficultyLevel: z.enum(["easy", "medium", "hard", "adaptive"]),
  interests: z.array(z.string()),
  memoryImports: z
    .array(
      z.object({
        provider: z.string().min(1).max(80),
        sourceLabel: z.string().max(120).optional(),
        rawText: z.string().min(20).max(50000),
      })
    )
    .max(12)
    .optional(),
});

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const userId = admin.userId;
    await ensureDbUser(userId, admin.email);

    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { memoryImports = [], ...profileInput } = parsed.data;

    const profile = await prisma.studentProfile.upsert({
      where: { userId },
      update: {
        ...profileInput,
        onboardingCompleted: true,
      },
      create: {
        userId,
        ...profileInput,
        onboardingCompleted: true,
      },
    });

    if (memoryImports.length > 0) {
      const existingMemory = await prisma.learnerMemory.findUnique({
        where: { studentProfileId: profile.id },
      });

      const analysis = await analyzeLearnerMemory({
        existingSummary: existingMemory?.summary,
        profile,
        importedMemories: memoryImports.map((memory) => ({
          provider: memory.provider,
          sourceLabel: memory.sourceLabel,
          text: memory.rawText,
        })),
      });

      for (const memory of memoryImports) {
        await saveMemoryImport(profile.id, {
          provider: memory.provider,
          sourceLabel: memory.sourceLabel,
          rawText: memory.rawText,
          extractedSummary: analysis.summary,
          learnerSignals: analysis.learnerSignals,
        });
      }

      const sourceCount = await prisma.memoryImport.count({
        where: { studentProfileId: profile.id },
      });

      await upsertLearnerMemory(profile.id, analysis, sourceCount);
    }

    const learnerMemory = await prisma.learnerMemory.findUnique({
      where: { studentProfileId: profile.id },
    });

    return NextResponse.json({ profile, learnerMemory });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Onboarding error:", message, error);

    if (message.includes("Database") || message.includes("connect")) {
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save profile. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: admin.userId },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Onboarding GET error:", message, error);

    if (message.includes("Database") || message.includes("connect")) {
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load profile. Please try again." },
      { status: 500 }
    );
  }
}
