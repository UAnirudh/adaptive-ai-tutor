export type Modality = "auditory" | "visual" | "reading";
export type ModalityMode = "auto" | "auditory" | "visual" | "reading" | "blended";

export interface ModalityWeights {
  auditory: number;
  visual: number;
  reading: number;
}

export const DEFAULT_WEIGHTS: ModalityWeights = {
  auditory: 0.33,
  visual: 0.33,
  reading: 0.34,
};

export function getDominantModality(weights: ModalityWeights): Modality {
  if (weights.auditory >= weights.visual && weights.auditory >= weights.reading) return "auditory";
  if (weights.visual >= weights.reading) return "visual";
  return "reading";
}

export function isBlended(weights: ModalityWeights): boolean {
  const sorted = [weights.auditory, weights.visual, weights.reading].sort((a, b) => b - a);
  return sorted[0] - sorted[1] < 0.15;
}

export function getActiveModalities(mode: ModalityMode, weights: ModalityWeights): {
  useVoice: boolean;
  useArtifacts: boolean;
  useText: boolean;
} {
  if (mode === "auditory") return { useVoice: true, useArtifacts: true, useText: true };
  if (mode === "visual") return { useVoice: false, useArtifacts: true, useText: true };
  if (mode === "reading") return { useVoice: false, useArtifacts: false, useText: true };
  if (mode === "blended") return { useVoice: true, useArtifacts: true, useText: true };

  // auto mode — use detected weights, but require clear signal before enabling voice
  const dominant = getDominantModality(weights);
  const blended = isBlended(weights);

  if (blended && weights.auditory > 0.4) return { useVoice: true, useArtifacts: true, useText: true };
  if (blended) return { useVoice: false, useArtifacts: true, useText: true };

  return {
    useVoice: dominant === "auditory" && weights.auditory > 0.4,
    useArtifacts: dominant === "visual" || weights.visual > 0.35,
    useText: true,
  };
}

export const MODALITY_LABELS: Record<ModalityMode, { label: string; description: string; icon: string }> = {
  auto: { label: "Auto", description: "AI detects your best learning style", icon: "✨" },
  auditory: { label: "Auditory", description: "Voice explanations read aloud", icon: "🎧" },
  visual: { label: "Visual", description: "Interactive diagrams and quizzes", icon: "📊" },
  reading: { label: "Reading", description: "Text-based explanations", icon: "📖" },
  blended: { label: "Blended", description: "All modes combined", icon: "🔀" },
};

export const VOICE_OPTIONS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Warm, clear female voice" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Soft, gentle female voice" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Calm, articulate male voice" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", description: "Deep, authoritative male voice" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Conversational male voice" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", description: "Youthful, energetic male voice" },
];
