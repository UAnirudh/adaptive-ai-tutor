import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

const ttsSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
});

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — clear, warm female voice

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice service not configured. Add ELEVENLABS_API_KEY to environment." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = ttsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { text, voiceId } = parsed.data;

  const cleanText = text
    .replace(/:::artifact\{[^}]*\}[\s\S]*?:::/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "[mathematical expression]")
    .replace(/\$[^$]+\$/g, "[math]")
    .replace(/[#*_~`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanText) {
    return NextResponse.json({ error: "No speakable content" }, { status: 400 });
  }

  const truncated = cleanText.slice(0, 4500);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || DEFAULT_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: truncated,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs error:", response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json({ error: "Voice API key is invalid" }, { status: 503 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Voice quota exceeded. Try again later." }, { status: 429 });
      }

      return NextResponse.json({ error: "Voice generation failed" }, { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "Voice service unavailable" }, { status: 503 });
  }
}
