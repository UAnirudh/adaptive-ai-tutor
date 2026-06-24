import { NextResponse } from "next/server";
import { getAuthUserId, ensureDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStudentContext } from "@/lib/tutor/student-model";
import { buildTutorSystemPrompt } from "@/lib/tutor/prompt-builder";
import { generateTutorResponse } from "@/lib/tutor/gemini";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDbUser(userId);

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, sessionId } = parsed.data;

    const studentContext = await getStudentContext(userId);
    if (!studentContext) {
      return NextResponse.json(
        { error: "Please complete onboarding first" },
        { status: 400 }
      );
    }

    let tutorSession;
    if (sessionId) {
      tutorSession = await prisma.tutorSession.findUnique({
        where: { id: sessionId, userId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
      });
    }

    if (!tutorSession) {
      tutorSession = await prisma.tutorSession.create({
        data: { userId },
        include: { messages: true },
      });
    }

    await prisma.sessionMessage.create({
      data: {
        tutorSessionId: tutorSession.id,
        role: "user",
        content: message,
      },
    });

    const systemPrompt = buildTutorSystemPrompt(studentContext);
    const history = (tutorSession.messages || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await generateTutorResponse(systemPrompt, history, message);

    await prisma.sessionMessage.create({
      data: {
        tutorSessionId: tutorSession.id,
        role: "assistant",
        content: response,
      },
    });

    return NextResponse.json({
      response,
      sessionId: tutorSession.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Chat error:", message, error);

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
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
