import { NextResponse } from "next/server";
import { ensureDbUser, getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStudentContext, upsertLearnerMemory } from "@/lib/tutor/student-model";
import { buildTutorSystemPrompt } from "@/lib/tutor/prompt-builder";
import { analyzeLearnerMemory, generateTutorResponse } from "@/lib/tutor/gemini";
import { getActiveModalities, DEFAULT_WEIGHTS, type ModalityMode, type ModalityWeights } from "@/lib/tutor/modality";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  modalityMode: z.enum(["auto", "auditory", "visual", "reading", "blended"]).optional(),
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
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, sessionId, modalityMode = "auto" } = parsed.data;

    const studentContext = await getStudentContext(userId);
    if (!studentContext) {
      return NextResponse.json(
        { error: "Please complete onboarding first" },
        { status: 400 }
      );
    }

    const storedWeights = studentContext.learnerMemory?.modalityScores as ModalityWeights | null;
    const weights: ModalityWeights = storedWeights ?? DEFAULT_WEIGHTS;
    const { useVoice, useArtifacts } = getActiveModalities(modalityMode as ModalityMode, weights);

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

    const systemPrompt = buildTutorSystemPrompt(studentContext, { useVoice, useArtifacts });
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

    try {
      const memoryAnalysis = await analyzeLearnerMemory({
        existingSummary: studentContext.learnerMemory?.summary,
        profile: studentContext.profile,
        importedMemories: studentContext.memoryImports.map((memory) => ({
          provider: memory.provider,
          sourceLabel: memory.sourceLabel,
          text: memory.extractedSummary || memory.rawText,
        })),
        recentTranscript: [
          ...history.slice(-8),
          { role: "user", content: message },
          { role: "assistant", content: response },
        ],
      });

      await upsertLearnerMemory(
        studentContext.profile.id,
        memoryAnalysis,
        studentContext.memoryImports.length
      );
    } catch (memoryError) {
      console.error("Learner memory update failed:", memoryError);
    }

    return NextResponse.json({
      response,
      sessionId: tutorSession.id,
      modalityWeights: weights,
      activeModalities: { useVoice, useArtifacts },
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
