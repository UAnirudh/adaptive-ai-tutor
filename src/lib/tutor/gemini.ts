import { GoogleGenAI, type Content } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateTutorResponse(
  systemPrompt: string,
  messages: TutorMessage[],
  userMessage: string
): Promise<string> {
  const history: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await genai.models.generateContent({
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

  const response = await genai.models.generateContent({
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
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

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

  const response = await genai.models.generateContent({
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
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
