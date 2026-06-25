"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Maximize2, Minimize2, Play, Code } from "lucide-react";
import type { Artifact } from "@/lib/tutor/artifact-parser";

function buildSandboxHtml(artifact: Artifact): string {
  const isQuiz = artifact.type === "quiz";
  const isVisualization = artifact.type === "visualization";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1916;
    color: #e8e3d8;
    padding: 20px;
    line-height: 1.6;
    min-height: 100vh;
  }
  h1, h2, h3 { color: #f5f0e5; margin-bottom: 12px; }
  h1 { font-size: 1.4em; }
  h2 { font-size: 1.2em; }
  button {
    background: #e7dfce;
    color: #15130f;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.15s;
  }
  button:hover { background: #fff4dc; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  input, select, textarea {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 10px 14px;
    color: #e8e3d8;
    font-size: 14px;
    width: 100%;
  }
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: rgba(231,223,206,0.4);
  }
  .quiz-option {
    display: block;
    width: 100%;
    text-align: left;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: #e8e3d8;
    padding: 12px 16px;
    margin: 8px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .quiz-option:hover { background: rgba(255,255,255,0.08); border-color: rgba(231,223,206,0.3); }
  .quiz-option.correct { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.5); color: #6ee7b7; }
  .quiz-option.incorrect { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.5); color: #fca5a5; }
  .quiz-option.disabled { pointer-events: none; }
  .feedback { padding: 12px 16px; border-radius: 8px; margin-top: 12px; font-size: 14px; }
  .feedback.correct { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: #6ee7b7; }
  .feedback.incorrect { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #fca5a5; }
  .card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 20px;
    margin: 12px 0;
  }
  canvas { border-radius: 8px; max-width: 100%; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); }
  th { color: #e7dfce; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); }
  ${isVisualization ? `
  .chart-container { position: relative; width: 100%; height: 300px; }
  .bar { fill: #e7dfce; rx: 4; transition: fill 0.15s; }
  .bar:hover { fill: #fff4dc; }
  .axis text { fill: rgba(255,255,255,0.5); font-size: 12px; }
  .axis line, .axis path { stroke: rgba(255,255,255,0.1); }
  ` : ""}
  ${isQuiz ? `
  .score-display { font-size: 1.5em; font-weight: 700; color: #e7dfce; }
  .progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin: 16px 0; }
  .progress-fill { height: 100%; background: #e7dfce; border-radius: 3px; transition: width 0.3s; }
  ` : ""}
</style>
</head>
<body>
${artifact.content}
<script>
  function sendHeight() {
    const h = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'artifact-resize', height: h }, '*');
  }
  new ResizeObserver(sendHeight).observe(document.body);
  sendHeight();
</script>
</body>
</html>`;
}

interface ArtifactRendererProps {
  artifact: Artifact;
}

export function ArtifactRenderer({ artifact }: ArtifactRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [height, setHeight] = useState(320);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type === "artifact-resize" && typeof event.data.height === "number") {
        const newHeight = Math.min(Math.max(event.data.height + 20, 200), expanded ? 800 : 500);
        setHeight(newHeight);
      }
    },
    [expanded]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const html = buildSandboxHtml(artifact);
  const srcDoc = html;

  const typeLabel = {
    html: "Interactive",
    quiz: "Quiz",
    code: "Code",
    visualization: "Visualization",
  }[artifact.type];

  const typeIcon = {
    html: "🧩",
    quiz: "📝",
    code: "💻",
    visualization: "📊",
  }[artifact.type];

  return (
    <div
      className={`my-3 overflow-hidden rounded-xl border border-[#e7dfce]/20 bg-[#171511] ${
        expanded ? "fixed inset-4 z-50 flex flex-col" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{typeIcon}</span>
          <span className="text-sm font-medium text-[#e7dfce]">{artifact.title}</span>
          <span className="rounded-md bg-[#e7dfce]/10 px-2 py-0.5 text-xs text-[#e7dfce]/60">
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCode(!showCode)}
            className="grid h-7 w-7 place-items-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
            title={showCode ? "Show preview" : "View source"}
          >
            {showCode ? <Play className="h-3.5 w-3.5" /> : <Code className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="grid h-7 w-7 place-items-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {showCode ? (
        <pre className="overflow-auto p-4 text-xs leading-5 text-white/60" style={{ maxHeight: expanded ? "100%" : 400 }}>
          <code>{artifact.content}</code>
        </pre>
      ) : (
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          className="w-full border-0 bg-[#1a1916]"
          style={{ height: expanded ? "calc(100% - 44px)" : height }}
          title={artifact.title}
        />
      )}

      {expanded && (
        <div
          className="fixed inset-0 -z-10 bg-black/60"
          onClick={() => setExpanded(false)}
        />
      )}
    </div>
  );
}
