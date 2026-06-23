import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profile = await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...parsed.data,
        onboardingCompleted: true,
      },
      create: {
        userId: session.user.id,
        ...parsed.data,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}
