import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [profile, mastery, mistakes, recentSessions] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId },
      }),
      prisma.subjectMastery.findMany({
        where: {
          studentProfile: { userId },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.mistakePattern.findMany({
        where: {
          studentProfile: { userId },
          resolved: false,
        },
        orderBy: { frequency: "desc" },
        take: 10,
      }),
      prisma.tutorSession.findMany({
        where: { userId, summarized: true },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
    ]);

    const weakTopics = mastery
      .filter((m) => m.masteryScore < 50)
      .sort((a, b) => a.masteryScore - b.masteryScore)
      .slice(0, 5)
      .map((m) => `${m.subject}: ${m.topic}`);

    const reviewFromSessions = recentSessions
      .flatMap((s) => s.reviewNext)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5);

    const recommended = [...new Set([...reviewFromSessions, ...weakTopics])].slice(0, 5);

    const totalSessions = recentSessions.length;
    const avgMastery =
      mastery.length > 0
        ? Math.round(mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length)
        : 0;
    const topicsStudied = mastery.length;
    const activeMistakes = mistakes.length;

    return NextResponse.json({
      profile,
      mastery,
      mistakes,
      recentSessions,
      recommended,
      stats: {
        totalSessions,
        avgMastery,
        topicsStudied,
        activeMistakes,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Dashboard error:", message, error);

    if (message.includes("Database") || message.includes("connect")) {
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load dashboard. Please try again." },
      { status: 500 }
    );
  }
}
