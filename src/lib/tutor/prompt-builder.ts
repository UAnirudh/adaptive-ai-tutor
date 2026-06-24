import type {
  LearnerMemory,
  MemoryImport,
  StudentProfile,
  SubjectMastery,
  MistakePattern,
  TutorSession,
} from "@/generated/prisma/client";

interface StudentContext {
  profile: StudentProfile;
  mastery: SubjectMastery[];
  mistakes: MistakePattern[];
  recentSessions: TutorSession[];
  learnerMemory: LearnerMemory | null;
  memoryImports: MemoryImport[];
}

export function buildTutorSystemPrompt(ctx: StudentContext): string {
  const { profile, mastery, mistakes, recentSessions, learnerMemory, memoryImports } = ctx;

  const styleMap: Record<string, string> = {
    concise: "Be concise and direct. Skip unnecessary filler.",
    balanced:
      "Provide clear explanations with moderate detail. Balance depth with brevity.",
    detailed:
      "Give thorough, detailed explanations. Include background context and reasoning.",
  };

  const lengthMap: Record<string, string> = {
    short: "Keep responses short — 2-4 sentences for simple concepts.",
    medium: "Use moderate response length — a few paragraphs when needed.",
    long: "Feel free to write longer explanations with full step-by-step breakdowns.",
  };

  const difficultyMap: Record<string, string> = {
    easy: "Start with fundamentals. Use simple language and lots of examples.",
    medium:
      "Assume some baseline knowledge. Build on what the student knows.",
    hard: "Challenge the student. Introduce edge cases and deeper reasoning.",
    adaptive:
      "Adapt difficulty based on how the student responds. Start moderate and adjust.",
  };

  const sections: string[] = [];

  sections.push(`You are a skilled, adaptive AI tutor. Your role is to help this specific student learn effectively by personalizing every response to their profile, preferences, and history.`);

  sections.push(`\n## Student Profile`);
  sections.push(`- Grade Level: ${profile.gradeLevel || "Not specified"}`);
  sections.push(`- Subjects: ${profile.subjects.length > 0 ? profile.subjects.join(", ") : "Not specified"}`);
  sections.push(`- Short-term Goals: ${profile.shortTermGoals || "Not specified"}`);
  sections.push(`- Long-term Goals: ${profile.longTermGoals || "Not specified"}`);

  if (profile.interests.length > 0) {
    sections.push(`- Interests & Hobbies: ${profile.interests.join(", ")}`);
    sections.push(`  → Use these interests in examples and analogies when relevant.`);
  }

  sections.push(`\n## Response Style Preferences`);
  sections.push(`- Style: ${styleMap[profile.explanationStyle] || styleMap.balanced}`);
  sections.push(`- Length: ${lengthMap[profile.explanationLength] || lengthMap.medium}`);
  sections.push(`- Difficulty: ${difficultyMap[profile.difficultyLevel] || difficultyMap.medium}`);

  if (learnerMemory) {
    sections.push(`\n## Durable Learner Memory`);
    sections.push(`- Learner Type: ${learnerMemory.learnerType || "Still learning"}`);
    sections.push(`- Confidence: ${Math.round(learnerMemory.confidence * 100)}%`);
    if (learnerMemory.summary) {
      sections.push(`- Memory Summary: ${learnerMemory.summary}`);
    }
    if (learnerMemory.strengths.length > 0) {
      sections.push(`- Strengths: ${learnerMemory.strengths.join("; ")}`);
    }
    if (learnerMemory.frictionPoints.length > 0) {
      sections.push(`- Friction Points: ${learnerMemory.frictionPoints.join("; ")}`);
    }
    if (learnerMemory.preferredPatterns.length > 0) {
      sections.push(`- Preferred Explanation Patterns: ${learnerMemory.preferredPatterns.join("; ")}`);
    }
    if (learnerMemory.recommendedStrategies.length > 0) {
      sections.push(`- Recommended Tutor Strategies: ${learnerMemory.recommendedStrategies.join("; ")}`);
    }
    sections.push(
      `  -> Treat this as durable memory. Use it to choose examples, pacing, checks for understanding, and how much scaffolding to provide.`
    );
  }

  if (memoryImports.length > 0) {
    sections.push(`\n## Imported AI Memory Sources`);
    for (const memory of memoryImports.slice(0, 6)) {
      sections.push(
        `- ${memory.provider}${memory.sourceLabel ? ` (${memory.sourceLabel})` : ""}: ${
          memory.extractedSummary || memory.rawText.slice(0, 240)
        }`
      );
    }
  }

  if (mastery.length > 0) {
    sections.push(`\n## Subject Mastery`);
    const sortedMastery = [...mastery].sort((a, b) => b.masteryScore - a.masteryScore);
    for (const m of sortedMastery.slice(0, 15)) {
      const level =
        m.masteryScore >= 80
          ? "strong"
          : m.masteryScore >= 50
            ? "developing"
            : "needs work";
      sections.push(
        `- ${m.subject} > ${m.topic}: ${Math.round(m.masteryScore)}% (${level}, confidence: ${Math.round(m.confidenceLevel)}%)`
      );
    }
    sections.push(
      `  → For weak topics, provide more scaffolding. For strong topics, increase challenge.`
    );
  }

  if (mistakes.length > 0) {
    const activeMistakes = mistakes.filter((m) => !m.resolved);
    if (activeMistakes.length > 0) {
      sections.push(`\n## Recurring Mistakes`);
      for (const m of activeMistakes.slice(0, 10)) {
        sections.push(
          `- ${m.subject} > ${m.topic}: "${m.mistakeType}" — ${m.description} (seen ${m.frequency}x)`
        );
      }
      sections.push(
        `  → Watch for these patterns. If the student makes a similar mistake, address it directly and review prerequisites.`
      );
    }
  }

  if (recentSessions.length > 0) {
    sections.push(`\n## Recent Session Context`);
    for (const s of recentSessions.slice(0, 3)) {
      if (s.summaryText) {
        sections.push(`- Session (${s.startedAt.toLocaleDateString()}): ${s.summaryText}`);
      }
      if (s.struggled.length > 0) {
        sections.push(`  Struggled with: ${s.struggled.join(", ")}`);
      }
      if (s.reviewNext.length > 0) {
        sections.push(`  Should review: ${s.reviewNext.join(", ")}`);
      }
    }
  }

  sections.push(`\n## Behavioral Guidelines`);
  sections.push(`- Explain clearly and check understanding frequently.`);
  sections.push(`- Ask follow-up questions to verify comprehension.`);
  sections.push(`- Give concrete examples, especially using the student's interests when relevant.`);
  sections.push(`- If the student seems confused, slow down and try a different approach.`);
  sections.push(`- If the student is doing well, gradually increase complexity.`);
  sections.push(`- Update your behavior as new evidence appears. The product promise is memory: remember patterns, avoid repeating failed approaches, and make continuity obvious.`);
  sections.push(`- After explaining a concept, offer a quick practice question.`);
  sections.push(`- Never be condescending. Be encouraging but honest about mistakes.`);
  sections.push(`- Use LaTeX notation (wrapped in $ or $$) for mathematical expressions.`);

  return sections.join("\n");
}
