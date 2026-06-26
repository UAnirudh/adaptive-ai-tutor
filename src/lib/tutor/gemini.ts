import { GoogleGenAI, type Content } from "@google/genai";

let genai: GoogleGenAI | null = null;

function getGenai() {
  if (!genai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    genai = new GoogleGenAI({ apiKey });
  }

  return genai;
}

function cleanJson(text: string) {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ModalityScores {
  auditory: number;
  visual: number;
  reading: number;
  reasoning: string;
}

export interface LearnerMemoryAnalysis {
  learnerType: string;
  confidence: number;
  summary: string;
  strengths: string[];
  frictionPoints: string[];
  preferredPatterns: string[];
  recommendedStrategies: string[];
  learnerSignals: Record<string, unknown>;
  modalityScores?: ModalityScores;
}

const fallbackLearnerMemory: LearnerMemoryAnalysis = {
  learnerType: "adaptive mixed learner",
  confidence: 0.35,
  summary:
    "There is not enough evidence yet for a precise learner model. Keep collecting sessions and imported context.",
  strengths: [],
  frictionPoints: [],
  preferredPatterns: [],
  recommendedStrategies: [
    "Ask short diagnostic questions before long explanations.",
    "Reflect back uncertainty and adjust difficulty after each answer.",
  ],
  learnerSignals: {},
};

export async function generateTutorResponse(
  systemPrompt: string,
  messages: TutorMessage[],
  userMessage: string
): Promise<string> {
  const history: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await getGenai().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      ...history,
      { role: "user", parts: [{ text: userMessage }] },
    ],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  return response.text ?? "I'm sorry, I couldn't generate a response. Please try again.";
}

export async function generateSessionSummary(
  messages: TutorMessage[]
): Promise<{
  summaryText: string;
  topicsCovered: string[];
  understood: string[];
  struggled: string[];
  reviewNext: string[];
}> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const response = await getGenai().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze this tutoring session transcript and return a JSON object with these fields:
- summaryText: A 2-3 sentence summary of what was covered
- topicsCovered: Array of specific topics discussed
- understood: Array of concepts the student demonstrated understanding of
- struggled: Array of concepts the student had difficulty with
- reviewNext: Array of topics that should be reviewed in the next session

Transcript:
${transcript}

Return ONLY valid JSON, no markdown fences.`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text ?? "{}";
  const cleaned = cleanJson(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      summaryText: "Session completed.",
      topicsCovered: [],
      understood: [],
      struggled: [],
      reviewNext: [],
    };
  }
}

export async function extractMistakes(
  messages: TutorMessage[]
): Promise<
  Array<{
    subject: string;
    topic: string;
    mistakeType: string;
    description: string;
  }>
> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const response = await getGenai().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze this tutoring session and identify any mistakes or misconceptions the student demonstrated.

Return a JSON array of objects with:
- subject: The broad subject area (e.g., "Mathematics", "Physics")
- topic: The specific topic (e.g., "Quadratic Equations", "Newton's Laws")
- mistakeType: A short label for the mistake type (e.g., "sign error", "conceptual confusion", "formula misapplication")
- description: A brief description of what the student got wrong

If no mistakes were found, return an empty array [].

Transcript:
${transcript}

Return ONLY valid JSON, no markdown fences.`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text ?? "[]";
  const cleaned = cleanJson(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function analyzeLearnerMemory(input: {
  existingSummary?: string | null;
  profile?: {
    gradeLevel?: string | null;
    subjects?: string[];
    shortTermGoals?: string | null;
    longTermGoals?: string | null;
    explanationStyle?: string;
    explanationLength?: string;
    difficultyLevel?: string;
    interests?: string[];
  };
  importedMemories?: Array<{
    provider: string;
    sourceLabel?: string | null;
    text: string;
  }>;
  recentTranscript?: TutorMessage[];
}): Promise<LearnerMemoryAnalysis> {
  const imported = (input.importedMemories ?? [])
    .slice(0, 8)
    .map((memory) => {
      const compactText = memory.text.replace(/\s+/g, " ").slice(0, 5000);
      return `Provider: ${memory.provider}\nLabel: ${memory.sourceLabel || "import"}\nText: ${compactText}`;
    })
    .join("\n\n---\n\n");

  const transcript = (input.recentTranscript ?? [])
    .slice(-12)
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const profile = input.profile
    ? JSON.stringify(input.profile, null, 2)
    : "No structured profile yet.";

  const response = await getGenai().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Build a durable learner memory for an adaptive AI tutor.

Use the structured profile, imported AI-provider chat logs/memory, existing learner summary, and latest tutor transcript. Infer how this person learns, what explanations help, what causes friction, and what the tutor should remember in future sessions.

Return ONLY valid JSON with this exact shape:
{
  "learnerType": "short useful label",
  "confidence": 0.0,
  "summary": "concise durable memory paragraph",
  "strengths": ["specific learning strengths"],
  "frictionPoints": ["specific recurring difficulties or blockers"],
  "preferredPatterns": ["ways explanations should be shaped"],
  "recommendedStrategies": ["actions the tutor should take"],
  "learnerSignals": {
    "pace": "string",
    "motivation": "string",
    "bestExamples": ["string"],
    "avoid": ["string"]
  },
  "modalityScores": {
    "auditory": 0.0,
    "visual": 0.0,
    "reading": 0.0,
    "reasoning": "brief explanation of modality detection"
  }
}

For modalityScores, assess the learner's preferred modality (scores must sum to 1.0):
- auditory: prefers listening, verbal explanations, discusses by talking through problems, asks for things to be "explained" or "walked through"
- visual: prefers diagrams, charts, interactive examples, asks for visualizations, likes step-by-step visual breakdowns
- reading: prefers written text, detailed written explanations, reads carefully, asks follow-up questions about text content

Rules:
- Do not invent private facts that are not supported by evidence.
- Prefer stable learning traits over one-off mood or wording.
- If evidence is weak, lower confidence and say what to observe next.
- Keep arrays to at most 8 items each.

Existing learner summary:
${input.existingSummary || "None yet."}

Structured profile:
${profile}

Imported AI-provider memories:
${imported || "No imported memory provided."}

Latest tutor transcript:
${transcript || "No latest tutor transcript provided."}`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.2,
      maxOutputTokens: 1600,
    },
  });

  const text = response.text ?? "{}";
  const cleaned = cleanJson(text);

  try {
    const parsed = JSON.parse(cleaned) as Partial<LearnerMemoryAnalysis>;
    return {
      learnerType: parsed.learnerType || fallbackLearnerMemory.learnerType,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : fallbackLearnerMemory.confidence,
      summary: parsed.summary || fallbackLearnerMemory.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 8) : [],
      frictionPoints: Array.isArray(parsed.frictionPoints)
        ? parsed.frictionPoints.slice(0, 8)
        : [],
      preferredPatterns: Array.isArray(parsed.preferredPatterns)
        ? parsed.preferredPatterns.slice(0, 8)
        : [],
      recommendedStrategies: Array.isArray(parsed.recommendedStrategies)
        ? parsed.recommendedStrategies.slice(0, 8)
        : fallbackLearnerMemory.recommendedStrategies,
      learnerSignals:
        parsed.learnerSignals && typeof parsed.learnerSignals === "object"
          ? parsed.learnerSignals
          : {},
      modalityScores: parsed.modalityScores,
    };
  } catch {
    return fallbackLearnerMemory;
  }
}
