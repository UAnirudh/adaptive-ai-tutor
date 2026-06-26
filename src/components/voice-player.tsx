"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, Pause, Play, Loader2, VolumeX } from "lucide-react";

interface VoicePlayerProps {
  text: string;
  voiceId?: string;
  autoPlay?: boolean;
}

export function VoicePlayer({ text, voiceId, autoPlay = false }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, [audioUrl]);

  useEffect(() => () => cleanup(), [cleanup]);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    if (audio.duration > 0) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
    animRef.current = requestAnimationFrame(updateProgress);
  }, []);

  async function loadAndPlay() {
    if (status === "loading") return;

    if (audioRef.current && audioUrl) {
      if (status === "paused") {
        audioRef.current.play();
        setStatus("playing");
        animRef.current = requestAnimationFrame(updateProgress);
        return;
      }
      if (status === "playing") {
        audioRef.current.pause();
        setStatus("paused");
        return;
      }
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Voice generation failed" }));
        console.error("TTS error:", data.error);
        setStatus("error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        setStatus("idle");
        setProgress(0);
      });

      audio.addEventListener("error", () => {
        setStatus("error");
      });

      await audio.play();
      setStatus("playing");
      animRef.current = requestAnimationFrame(updateProgress);
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (autoPlay && status === "idle") {
      loadAndPlay();
    }
    // Only on mount when autoPlay is true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = {
    idle: <Volume2 className="h-4 w-4" />,
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    playing: <Pause className="h-4 w-4" />,
    paused: <Play className="h-4 w-4" />,
    error: <VolumeX className="h-4 w-4" />,
  }[status];

  const label = {
    idle: "Listen",
    loading: "Generating voice…",
    playing: "Pause",
    paused: "Resume",
    error: "Voice unavailable",
  }[status];

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={loadAndPlay}
        disabled={status === "loading" || status === "error"}
        className="flex items-center gap-2 rounded-lg border border-[#e7dfce]/20 bg-[#e7dfce]/[0.06] px-3 py-2 text-sm text-[#e7dfce] transition hover:bg-[#e7dfce]/[0.12] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {icon}
        <span>{label}</span>
      </button>

      {(status === "playing" || status === "paused") && (
        <div className="flex-1 max-w-48">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#e7dfce] transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "error" && (
        <button
          onClick={() => { setStatus("idle"); setAudioUrl(null); }}
          className="text-xs text-white/40 hover:text-white/60"
        >
          Retry
        </button>
      )}
    </div>
  );
}
