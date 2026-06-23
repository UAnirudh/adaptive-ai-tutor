import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, sessionId } = parsed.data;

    const studentContext = await getStudentContext(session.user.id);
    if (!studentContext) {
      return NextResponse.json(
        { error: "Please complete onboarding first" },
        { status: 400 }
      );
    }

    // Get or create tutor session
    let tutorSession;
    if (sessionId) {
      tutorSession = await prisma.tutorSession.findUnique({
        where: { id: sessionId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
      });
    }

    if (!tutorSession) {
      tutorSession = await prisma.tutorSession.create({
        data: { userId: session.user.id },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.sessionMessage.create({
      data: {
        tutorSessionId: tutorSession.id,
        role: "user",
        content: message,
      },
    });

    // Build context and generate response
    const systemPrompt = buildTutorSystemPrompt(studentContext);
    const history = (tutorSession.messages || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await generateTutorResponse(systemPrompt, history, message);

    // Save assistant message
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
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
