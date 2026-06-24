import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
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
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = summarizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const tutorSession = await prisma.tutorSession.findUnique({
      where: { id: parsed.data.sessionId, userId },
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

    const [summary, mistakes] = await Promise.all([
      generateSessionSummary(messages),
      extractMistakes(messages),
    ]);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (profile) {
      for (const mistake of mistakes) {
        await recordMistake(profile.id, mistake);
        await updateMastery(profile.id, mistake.subject, mistake.topic, false);
      }

      for (const topic of summary.understood) {
        const subject = summary.topicsCovered[0] || "General";
        await updateMastery(profile.id, subject, topic, true);
      }
    }

    await summarizeAndCloseSession(tutorSession.id, summary);

    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Summarization error:", message, error);

    if (message.includes("API") || message.includes("Gemini")) {
      return NextResponse.json(
        { error: "AI service unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (message.includes("Database") || message.includes("connect")) {
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to summarize session. Please try again." },
      { status: 500 }
    );
  }
}
