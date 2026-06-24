import { prisma } from "@/lib/db";
import type {
  LearnerMemory,
  MemoryImport,
  MistakePattern,
  StudentProfile,
  SubjectMastery,
  TutorSession,
} from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import type { LearnerMemoryAnalysis } from "@/lib/tutor/gemini";

export interface StudentContext {
  profile: StudentProfile;
  mastery: SubjectMastery[];
  mistakes: MistakePattern[];
  recentSessions: TutorSession[];
  learnerMemory: LearnerMemory | null;
  memoryImports: MemoryImport[];
}

export async function getStudentContext(userId: string): Promise<StudentContext | null> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const [mastery, mistakes, recentSessions, learnerMemory, memoryImports] = await Promise.all([
    prisma.subjectMastery.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.mistakePattern.findMany({
      where: { studentProfileId: profile.id, resolved: false },
      orderBy: { frequency: "desc" },
      take: 15,
    }),
    prisma.tutorSession.findMany({
      where: { userId, summarized: true },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.learnerMemory.findUnique({
      where: { studentProfileId: profile.id },
    }),
    prisma.memoryImport.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return { profile, mastery, mistakes, recentSessions, learnerMemory, memoryImports };
}

export async function saveMemoryImport(
  profileId: string,
  input: {
    provider: string;
    sourceLabel?: string | null;
    rawText: string;
    extractedSummary?: string | null;
    learnerSignals?: Record<string, unknown>;
  }
): Promise<void> {
  await prisma.memoryImport.create({
    data: {
      studentProfileId: profileId,
      provider: input.provider,
      sourceLabel: input.sourceLabel || null,
      rawText: input.rawText,
      extractedSummary: input.extractedSummary || null,
      learnerSignals: input.learnerSignals as unknown as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function upsertLearnerMemory(
  profileId: string,
  analysis: LearnerMemoryAnalysis,
  sourceCount: number
): Promise<void> {
  await prisma.learnerMemory.upsert({
    where: { studentProfileId: profileId },
    update: {
      learnerType: analysis.learnerType,
      confidence: analysis.confidence,
      summary: analysis.summary,
      strengths: analysis.strengths,
      frictionPoints: analysis.frictionPoints,
      preferredPatterns: analysis.preferredPatterns,
      recommendedStrategies: analysis.recommendedStrategies,
      evidenceCount: { increment: 1 },
      sourceCount,
      rawSignals: analysis.learnerSignals as Prisma.InputJsonValue | undefined,
      lastAnalyzedAt: new Date(),
    },
    create: {
      studentProfileId: profileId,
      learnerType: analysis.learnerType,
      confidence: analysis.confidence,
      summary: analysis.summary,
      strengths: analysis.strengths,
      frictionPoints: analysis.frictionPoints,
      preferredPatterns: analysis.preferredPatterns,
      recommendedStrategies: analysis.recommendedStrategies,
      evidenceCount: 1,
      sourceCount,
      rawSignals: analysis.learnerSignals as Prisma.InputJsonValue | undefined,
      lastAnalyzedAt: new Date(),
    },
  });
}

export async function updateMastery(
  profileId: string,
  subject: string,
  topic: string,
  correct: boolean
): Promise<void> {
  const existing = await prisma.subjectMastery.findUnique({
    where: {
      studentProfileId_subject_topic: { studentProfileId: profileId, subject, topic },
    },
  });

  if (existing) {
    const newAttempts = existing.totalAttempts + 1;
    const newCorrect = existing.correctAttempts + (correct ? 1 : 0);
    const rawScore = (newCorrect / newAttempts) * 100;
    // Weighted moving average: recent performance matters more
    const newScore = existing.masteryScore * 0.7 + rawScore * 0.3;
    // Confidence grows with more attempts
    const newConfidence = Math.min(100, 20 + newAttempts * 8);

    await prisma.subjectMastery.update({
      where: { id: existing.id },
      data: {
        totalAttempts: newAttempts,
        correctAttempts: newCorrect,
        masteryScore: Math.round(newScore * 100) / 100,
        confidenceLevel: newConfidence,
        lastPracticed: new Date(),
      },
    });
  } else {
    await prisma.subjectMastery.create({
      data: {
        studentProfileId: profileId,
        subject,
        topic,
        totalAttempts: 1,
        correctAttempts: correct ? 1 : 0,
        masteryScore: correct ? 60 : 20,
        confidenceLevel: 20,
      },
    });
  }
}

export async function recordMistake(
  profileId: string,
  mistake: { subject: string; topic: string; mistakeType: string; description: string }
): Promise<void> {
  const existing = await prisma.mistakePattern.findFirst({
    where: {
      studentProfileId: profileId,
      subject: mistake.subject,
      topic: mistake.topic,
      mistakeType: mistake.mistakeType,
      resolved: false,
    },
  });

  if (existing) {
    await prisma.mistakePattern.update({
      where: { id: existing.id },
      data: {
        frequency: existing.frequency + 1,
        lastSeen: new Date(),
      },
    });
  } else {
    await prisma.mistakePattern.create({
      data: {
        studentProfileId: profileId,
        ...mistake,
      },
    });
  }
}

export async function summarizeAndCloseSession(
  sessionId: string,
  summary: {
    summaryText: string;
    topicsCovered: string[];
    understood: string[];
    struggled: string[];
    reviewNext: string[];
  }
): Promise<void> {
  await prisma.tutorSession.update({
    where: { id: sessionId },
    data: {
      ...summary,
      summarized: true,
      endedAt: new Date(),
    },
  });
}
