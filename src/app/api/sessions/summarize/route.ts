import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSessionSummary, extractMistakes } from "@/lib/tutor/gemini";
import {
  summarizeAndCloseSession,
  recordMistake,
  updateMastery,
} from "@/lib/tutor/student-model";
import { z } from "zod";

const summarizeSchema = z.object({
  sessionId: z.string(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = summarizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const tutorSession = await prisma.tutorSession.findUnique({
      where: { id: parsed.data.sessionId, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!tutorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (tutorSession.summarized) {
      return NextResponse.json({ error: "Session already summarized" }, { status: 400 });
    }

    if (tutorSession.messages.length < 2) {
      return NextResponse.json({ error: "Not enough messages to summarize" }, { status: 400 });
    }

    const messages = tutorSession.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Generate summary and extract mistakes in parallel
    const [summary, mistakes] = await Promise.all([
      generateSessionSummary(messages),
      extractMistakes(messages),
    ]);

    // Get student profile
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (profile) {
      // Record mistakes
      for (const mistake of mistakes) {
        await recordMistake(profile.id, mistake);
        await updateMastery(profile.id, mistake.subject, mistake.topic, false);
      }

      // Update mastery for understood topics
      for (const topic of summary.understood) {
        const subject = summary.topicsCovered[0] || "General";
        await updateMastery(profile.id, subject, topic, true);
      }
    }

    // Save summary
    await summarizeAndCloseSession(tutorSession.id, summary);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json({ error: "Failed to summarize session" }, { status: 500 });
  }
}
