"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { MODALITY_LABELS, type ModalityMode, type ModalityWeights } from "@/lib/tutor/modality";

interface ModalitySwitcherProps {
  mode: ModalityMode;
  onModeChange: (mode: ModalityMode) => void;
  detectedWeights?: ModalityWeights | null;
}

export function ModalitySwitcher({ mode, onModeChange, detectedWeights }: ModalitySwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = MODALITY_LABELS[mode];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:text-white"
      >
        <span>{current.icon}</span>
        <span>{current.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-white/10 bg-[#1a1916] p-1.5 shadow-2xl shadow-black/40">
          {(Object.entries(MODALITY_LABELS) as [ModalityMode, typeof current][]).map(([key, info]) => {
            const isActive = key === mode;
            return (
              <button
                key={key}
                onClick={() => { onModeChange(key); setOpen(false); }}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  isActive
                    ? "bg-[#e7dfce]/[0.08] text-[#e7dfce]"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <span className="mt-0.5 text-base">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{info.description}</p>
                  {key === "auto" && detectedWeights && (
                    <div className="mt-2 flex gap-1">
                      {(["auditory", "visual", "reading"] as const).map((m) => (
                        <div key={m} className="flex-1">
                          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#e7dfce]"
                              style={{ width: `${Math.round(detectedWeights[m] * 100)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-white/30 text-center capitalize">
                            {m.slice(0, 3)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isActive && (
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#e7dfce]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
