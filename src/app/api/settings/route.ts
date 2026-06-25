import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const settingsSchema = z.object({
  gradeLevel: z.string().min(1),
  subjects: z.array(z.string()).min(1),
  shortTermGoals: z.string().nullable().optional(),
  longTermGoals: z.string().nullable().optional(),
  explanationStyle: z.enum(["concise", "balanced", "detailed"]),
  explanationLength: z.enum(["short", "medium", "long"]),
  difficultyLevel: z.enum(["easy", "medium", "hard", "adaptive"]),
  interests: z.array(z.string()),
});

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: admin.userId },
  });

  const learnerMemory = profile
    ? await prisma.learnerMemory.findUnique({
        where: { studentProfileId: profile.id },
      })
    : null;

  return NextResponse.json({ profile, learnerMemory });
}

export async function PATCH(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = await prisma.studentProfile.update({
    where: { userId: admin.userId },
    data: parsed.data,
  });

  return NextResponse.json({ profile });
}
