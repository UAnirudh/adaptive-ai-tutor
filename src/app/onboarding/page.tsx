"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  X,
  Copy,
  Check,
  Upload,
  FileText,
  MessageSquareText,
  GraduationCap,
  Target,
  SlidersHorizontal,
  Database,
  PlusCircle,
  Zap,
} from "lucide-react";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "English", "History", "Geography", "Economics", "Psychology",
  "Statistics", "Calculus", "Algebra", "Literature", "Philosophy",
];

const GRADE_LEVELS = [
  "Middle School (6-8)",
  "High School (9-10)",
  "High School (11-12)",
  "College Freshman",
  "College Sophomore",
  "College Junior/Senior",
  "Graduate Student",
  "Self-Learner",
];

const PROVIDERS = [
  {
    id: "ChatGPT",
    label: "ChatGPT",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
    activeColor: "ring-emerald-500/40",
    exportTip: "Settings → Data Controls → Export data. You'll get a zip with conversations.json.",
    memoryTip: "You can also ask ChatGPT: \"Tell me everything you remember about me.\"",
  },
  {
    id: "Claude",
    label: "Claude",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/25",
    activeColor: "ring-orange-500/40",
    exportTip: "Open any conversation → click the share icon → copy full conversation text.",
    memoryTip: "Ask Claude to review your past conversations and summarize your learning patterns.",
  },
  {
    id: "Gemini",
    label: "Gemini",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/25",
    activeColor: "ring-blue-500/40",
    exportTip: "Google Takeout → select Gemini Apps → export. Or copy conversations directly.",
    memoryTip: "Ask Gemini to analyze your conversation patterns and learning style.",
  },
  {
    id: "Perplexity",
    label: "Perplexity",
    color: "bg-teal-500/10 text-teal-600 border-teal-500/25",
    activeColor: "ring-teal-500/40",
    exportTip: "Open your search history and copy relevant research threads.",
    memoryTip: "Copy a few representative research sessions that show how you learn.",
  },
  {
    id: "Copilot",
    label: "Copilot",
    color: "bg-sky-500/10 text-sky-600 border-sky-500/25",
    activeColor: "ring-sky-500/40",
    exportTip: "Copy conversation threads from your Copilot chat history.",
    memoryTip: "Ask Copilot to summarize your typical questions and learning approach.",
  },
  {
    id: "Other",
    label: "Other",
    color: "bg-[#0b1c30]/5 text-[#445573] border-[#c3c6d7]/40",
    activeColor: "ring-[#0252d9]/30",
    exportTip: "Copy conversation text or exported logs from any AI tool.",
    memoryTip: "Paste any relevant learning-related conversations.",
  },
];

function buildExtractionPrompt(provider: string): string {
  const base = `I'm setting up an AI tutor that builds a persistent memory of how I learn. I need you to analyze our conversation history and give me a detailed breakdown.

Cover these areas:
1. How I approach new topics — do I want the big picture first, examples first, or formal definitions?
2. What kinds of explanations actually land with me vs. ones that don't stick
3. Subjects or question types I come back to most
4. Where I tend to get stuck or ask follow-ups
5. Whether I prefer concise answers or deep dives
6. Any recurring mistakes or misconceptions you've noticed
7. What motivates me — grades, curiosity, career goals, something else?

Be specific. Reference actual conversations where possible. Don't give me generic learning advice — tell me what you've observed about *me*.

Format: Start with a 2-3 sentence summary of my learning profile, then give detailed bullet points for each area above.`;

  if (provider === "ChatGPT") {
    return base + "\n\nAlso include anything from your Memory feature about my learning habits, preferred subjects, and how I like to study.";
  }
  if (provider === "Claude") {
    return base + "\n\nReview our full conversation history for patterns. Include any observations about my thinking style and how I process new information.";
  }
  return base;
}

type MemoryImportDraft = {
  id: string;
  provider: string;
  sourceLabel: string;
  rawText: string;
  fileName?: string;
};

const STEPS = [
  { label: "Basics", icon: GraduationCap },
  { label: "Goals", icon: Target },
  { label: "Preferences", icon: SlidersHorizontal },
  { label: "Memory", icon: Database },
  { label: "Launch", icon: Zap },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [gradeLevel, setGradeLevel] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [shortTermGoals, setShortTermGoals] = useState("");
  const [longTermGoals, setLongTermGoals] = useState("");
  const [explanationStyle, setExplanationStyle] = useState("balanced");
  const [explanationLength, setExplanationLength] = useState("medium");
  const [difficultyLevel, setDifficultyLevel] = useState("adaptive");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [memoryImports, setMemoryImports] = useState<MemoryImportDraft[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleSubject(subject: string) {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  function addCustomSubject() {
    const trimmed = customSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
      setCustomSubject("");
    }
  }

  function addInterest() {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setInterestInput("");
    }
  }

  function removeInterest(interest: string) {
    setInterests((prev) => prev.filter((i) => i !== interest));
  }

  function addMemoryImport(provider: string) {
    setMemoryImports((prev) => [
      ...prev,
      { id: crypto.randomUUID(), provider, sourceLabel: "", rawText: "" },
    ]);
    setActiveProvider(provider);
  }

  function updateMemoryImport(id: string, key: keyof Omit<MemoryImportDraft, "id">, value: string) {
    setMemoryImports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  }

  function removeMemoryImport(id: string) {
    setMemoryImports((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleFileUpload(importId: string, file: File) {
    const text = await file.text();
    let content = text;

    if (file.name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          content = parsed
            .filter((c: { mapping?: Record<string, { message?: { content?: { parts?: string[] }; author?: { role?: string } } }> }) => c.mapping)
            .slice(0, 5)
            .map((conv: { title?: string; mapping?: Record<string, { message?: { content?: { parts?: string[] }; author?: { role?: string } } }> }) => {
              const messages = Object.values(conv.mapping ?? {})
                .filter((m) => m.message?.content?.parts?.length)
                .map((m) => `${m.message?.author?.role}: ${m.message?.content?.parts?.join(" ")}`)
                .join("\n");
              return `--- ${conv.title ?? "Conversation"} ---\n${messages}`;
            })
            .join("\n\n");
        } else if (parsed.title && parsed.mapping) {
          const messages = Object.values(parsed.mapping as Record<string, { message?: { content?: { parts?: string[] }; author?: { role?: string } } }>)
            .filter((m) => m.message?.content?.parts?.length)
            .map((m) => `${m.message?.author?.role}: ${m.message?.content?.parts?.join(" ")}`)
            .join("\n");
          content = messages;
        }
      } catch {
        // Use raw text if JSON parsing fails
      }
    }

    const truncated = content.slice(0, 50000);
    setMemoryImports((prev) =>
      prev.map((item) =>
        item.id === importId
          ? { ...item, rawText: truncated, fileName: file.name, sourceLabel: file.name.replace(/\.[^.]+$/, "") }
          : item
      )
    );
  }

  async function copyPrompt(provider: string) {
    const prompt = buildExtractionPrompt(provider);
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevel,
          subjects,
          shortTermGoals: shortTermGoals || undefined,
          longTermGoals: longTermGoals || undefined,
          explanationStyle,
          explanationLength,
          difficultyLevel,
          interests,
          memoryImports: memoryImports
            .map((m) => ({
              provider: m.provider.trim(),
              sourceLabel: m.sourceLabel.trim() || undefined,
              rawText: m.rawText.trim(),
            }))
            .filter((m) => m.rawText.length >= 20),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong saving your profile.");
        setLoading(false);
        return;
      }

      router.push("/chat");
      router.refresh();
    } catch {
      setError("Connection failed. Check your internet and try again.");
      setLoading(false);
    }
  }

  const canProceed = () => {
    if (step === 1) return gradeLevel !== "" && subjects.length > 0;
    return true;
  };

  const providerImports = (providerId: string) =>
    memoryImports.filter((m) => m.provider === providerId);

  return (
    <main className="min-h-dvh bg-[#f8f9ff] text-[#0b1c30]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(2,82,217,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(2,82,217,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(2,82,217,0.12),transparent_62%)]" />

      <div className="relative mx-auto flex min-h-dvh max-w-4xl flex-col px-5 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-[#0252d9] text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Set up your tutor</p>
            <p className="text-xs text-[#445573]">Takes about 3 minutes</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center gap-1">
          {STEPS.map((s, i) => {
            const stepNum = i + 1;
            const active = step === stepNum;
            const done = step > stepNum;
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => done && setStep(stepNum)}
                disabled={!done}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-[#0252d9]/10 text-[#0252d9] ring-1 ring-[#0252d9]/30"
                    : done
                      ? "bg-[#0b1c30]/5 text-[#445573] hover:bg-[#0b1c30]/8 cursor-pointer"
                      : "text-[#445573]/30"
                } ${i < STEPS.length - 1 ? "mr-1" : ""}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
                {done && <Check className="h-3 w-3 text-emerald-500" />}
              </button>
            );
          })}
          <div className="ml-auto text-xs text-[#445573]/50">{step}/{STEPS.length}</div>
        </div>

        {/* Step content */}
        <div className="flex-1">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold">Where are you in your learning journey?</h2>
                <p className="mt-2 text-sm text-[#445573]">
                  Your tutor uses this to calibrate vocabulary, pacing, and the depth of every explanation.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0b1c30]">Grade level</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {GRADE_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setGradeLevel(level)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                        gradeLevel === level
                          ? "border-[#0252d9]/40 bg-[#0252d9]/[0.08] text-[#0b1c30]"
                          : "border-[#c3c6d7]/40 bg-white/50 text-[#445573] hover:border-[#0252d9]/20 hover:bg-white/70"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0b1c30]">What are you studying?</p>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                        subjects.includes(subject)
                          ? "border-[#0252d9]/40 bg-[#0252d9]/10 text-[#0252d9]"
                          : "border-[#c3c6d7]/40 text-[#445573] hover:border-[#0252d9]/20 hover:text-[#0b1c30]"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Something else..."
                    className="h-10 flex-1 rounded-lg border border-[#c3c6d7]/50 bg-white/60 px-3 text-sm text-[#0b1c30] placeholder:text-[#445573]/40 focus:border-[#0252d9]/40 focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSubject())}
                  />
                  <button
                    onClick={addCustomSubject}
                    className="rounded-lg border border-[#c3c6d7] px-4 text-sm text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold">What are you working toward?</h2>
                <p className="mt-2 text-sm text-[#445573]">
                  Goals shape which topics get priority and how your tutor frames long-term progress.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[#0b1c30]">Near-term goals</p>
                <textarea
                  value={shortTermGoals}
                  onChange={(e) => setShortTermGoals(e.target.value)}
                  placeholder="Pass my calc final, finish the data structures problem set, nail the AP Bio exam..."
                  rows={3}
                  className="w-full rounded-lg border border-[#c3c6d7]/50 bg-white/60 px-4 py-3 text-sm text-[#0b1c30] placeholder:text-[#445573]/40 focus:border-[#0252d9]/40 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[#0b1c30]">Bigger-picture goals</p>
                <textarea
                  value={longTermGoals}
                  onChange={(e) => setLongTermGoals(e.target.value)}
                  placeholder="Get into a strong CS program, become fluent in organic chem, switch careers into data science..."
                  rows={3}
                  className="w-full rounded-lg border border-[#c3c6d7]/50 bg-white/60 px-4 py-3 text-sm text-[#0b1c30] placeholder:text-[#445573]/40 focus:border-[#0252d9]/40 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0b1c30]">
                  Interests and hobbies
                </p>
                <p className="text-xs text-[#445573]">
                  Your tutor weaves these into examples and analogies so explanations actually stick.
                </p>
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#c3c6d7]/40 bg-white/60 px-3 py-1 text-sm text-[#0b1c30]"
                      >
                        {interest}
                        <button onClick={() => removeInterest(interest)} className="text-[#445573]/40 hover:text-[#445573]">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="robotics, basketball, gaming, cooking, music production..."
                    className="h-10 flex-1 rounded-lg border border-[#c3c6d7]/50 bg-white/60 px-3 text-sm text-[#0b1c30] placeholder:text-[#445573]/40 focus:border-[#0252d9]/40 focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                  />
                  <button
                    onClick={addInterest}
                    className="rounded-lg border border-[#c3c6d7] px-4 text-sm text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold">How should your tutor talk to you?</h2>
                <p className="mt-2 text-sm text-[#445573]">
                  These defaults kick in from session one. The tutor still adapts over time as it learns your patterns.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0b1c30]">Explanation style</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "concise", label: "Concise", desc: "Straight to the point. No filler." },
                    { value: "balanced", label: "Balanced", desc: "Clear and thorough without overdoing it." },
                    { value: "detailed", label: "Detailed", desc: "Full context, reasoning, and background." },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExplanationStyle(opt.value)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        explanationStyle === opt.value
                          ? "border-[#0252d9]/40 bg-[#0252d9]/[0.08]"
                          : "border-[#c3c6d7]/40 bg-white/50 hover:border-[#0252d9]/20"
                      }`}
                    >
                      <p className="text-sm font-medium text-[#0b1c30]">{opt.label}</p>
                      <p className="mt-1 text-xs text-[#445573]">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0b1c30]">Response length</p>
                <div className="grid grid-cols-3 gap-2">
                  {["short", "medium", "long"].map((len) => (
                    <button
                      key={len}
                      onClick={() => setExplanationLength(len)}
                      className={`rounded-lg border px-4 py-3 text-sm capitalize transition-all ${
                        explanationLength === len
                          ? "border-[#0252d9]/40 bg-[#0252d9]/[0.08] text-[#0b1c30]"
                          : "border-[#c3c6d7]/40 text-[#445573] hover:border-[#0252d9]/20"
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0b1c30]">Starting difficulty</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "easy", label: "Gentle start", desc: "Fundamentals first, lots of examples, patient pacing." },
                    { value: "medium", label: "Some foundation", desc: "Skip the basics I already know, build from there." },
                    { value: "hard", label: "Push me", desc: "Edge cases, deeper reasoning, faster pace." },
                    { value: "adaptive", label: "Let the tutor decide", desc: "Start moderate and adjust based on how I'm doing." },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDifficultyLevel(opt.value)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        difficultyLevel === opt.value
                          ? "border-[#0252d9]/40 bg-[#0252d9]/[0.08]"
                          : "border-[#c3c6d7]/40 bg-white/50 hover:border-[#0252d9]/20"
                      }`}
                    >
                      <p className="text-sm font-medium text-[#0b1c30]">{opt.label}</p>
                      <p className="mt-1 text-xs text-[#445573]">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Memory Import */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">Bring your learning history</h2>
                <p className="mt-2 text-sm text-[#445573]">
                  Your tutor gets meaningfully better when it can see how you've learned before. Import from any AI you've used — or skip this and build memory from scratch.
                </p>
              </div>

              <div className="rounded-xl border border-[#0252d9]/15 bg-[#0252d9]/[0.04] p-4">
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#0252d9]" />
                  <div className="text-sm leading-6">
                    <p className="font-medium text-[#0252d9]">How this works</p>
                    <p className="mt-1 text-[#445573]">
                      Pick a provider below. You'll get a ready-made prompt to paste into that AI — it asks it to analyze how you learn. Copy the response back here. You can also upload exported chat logs directly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Provider grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROVIDERS.map((p) => {
                  const hasImports = providerImports(p.id).length > 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveProvider(activeProvider === p.id ? null : p.id)}
                      className={`group relative rounded-lg border p-3 text-left transition-all ${
                        activeProvider === p.id
                          ? `${p.color} ring-2 ${p.activeColor}`
                          : hasImports
                            ? `${p.color}`
                            : "border-[#c3c6d7]/40 bg-white/50 text-[#445573] hover:border-[#0252d9]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{p.label}</span>
                        {hasImports && (
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-xs text-emerald-600">
                            {providerImports(p.id).length}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active provider panel */}
              {activeProvider && (() => {
                const provider = PROVIDERS.find((p) => p.id === activeProvider)!;
                const imports = providerImports(activeProvider);

                return (
                  <div className="glass-elevated rounded-xl p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Import from {provider.label}</h3>
                      <button
                        onClick={() => setActiveProvider(null)}
                        className="text-[#445573]/40 hover:text-[#445573]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Option 1: Extraction prompt */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-[#0252d9]" />
                        <p className="text-sm font-medium">Option 1: Ask {provider.label} to analyze your learning</p>
                      </div>
                      <div className="rounded-lg border border-[#c3c6d7]/30 bg-[#f0f4ff]/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs leading-5 text-[#445573] line-clamp-3">
                            {buildExtractionPrompt(provider.id).slice(0, 180)}...
                          </p>
                          <button
                            onClick={() => copyPrompt(provider.id)}
                            className="shrink-0 rounded-md border border-[#c3c6d7] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#445573] transition hover:bg-white"
                          >
                            {copiedPrompt ? (
                              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Copied</span>
                            ) : (
                              <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy prompt</span>
                            )}
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-[#445573]/60">
                          {provider.memoryTip}
                        </p>
                      </div>
                    </div>

                    {/* Option 2: File upload */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-[#0252d9]" />
                        <p className="text-sm font-medium">Option 2: Upload exported chat logs</p>
                      </div>
                      <p className="text-xs text-[#445573]">{provider.exportTip}</p>
                    </div>

                    {/* Import slots */}
                    {imports.map((imp) => (
                      <div key={imp.id} className="rounded-lg border border-[#c3c6d7]/30 bg-white/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {imp.fileName ? (
                              <FileText className="h-4 w-4 text-[#445573]" />
                            ) : (
                              <MessageSquareText className="h-4 w-4 text-[#445573]" />
                            )}
                            <input
                              value={imp.sourceLabel}
                              onChange={(e) => updateMemoryImport(imp.id, "sourceLabel", e.target.value)}
                              placeholder="Label this import (optional)"
                              className="bg-transparent text-sm text-[#0b1c30] placeholder:text-[#445573]/40 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => removeMemoryImport(imp.id)}
                            className="text-[#445573]/30 hover:text-[#445573]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {imp.fileName ? (
                          <div className="flex items-center gap-2 rounded-md bg-[#f0f4ff]/60 px-3 py-2 text-xs text-[#445573]">
                            <FileText className="h-3.5 w-3.5" />
                            {imp.fileName}
                            <span className="ml-auto text-[#445573]/50">
                              {Math.round(imp.rawText.length / 1000)}k chars
                            </span>
                          </div>
                        ) : (
                          <textarea
                            value={imp.rawText}
                            onChange={(e) => updateMemoryImport(imp.id, "rawText", e.target.value)}
                            placeholder={`Paste ${provider.label}'s analysis of your learning style here...`}
                            rows={6}
                            className="w-full rounded-lg border border-[#c3c6d7]/30 bg-white/60 px-3 py-2.5 text-sm text-[#0b1c30] placeholder:text-[#445573]/40 focus:border-[#0252d9]/30 focus:outline-none resize-y"
                          />
                        )}
                      </div>
                    ))}

                    {/* Add import buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => addMemoryImport(activeProvider)}
                        className="flex items-center gap-2 rounded-lg border border-[#c3c6d7] px-4 py-2 text-sm text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9]"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Paste response
                      </button>
                      <button
                        onClick={() => {
                          const id = crypto.randomUUID();
                          setMemoryImports((prev) => [
                            ...prev,
                            { id, provider: activeProvider, sourceLabel: "", rawText: "" },
                          ]);
                          setTimeout(() => fileInputRef.current?.click(), 50);
                          fileInputRef.current?.setAttribute("data-import-id", id);
                        }}
                        className="flex items-center gap-2 rounded-lg border border-[#c3c6d7] px-4 py-2 text-sm text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9]"
                      >
                        <Upload className="h-4 w-4" />
                        Upload file
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.txt,.md,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        const importId = fileInputRef.current?.getAttribute("data-import-id");
                        if (file && importId) {
                          handleFileUpload(importId, file);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                );
              })()}

              {memoryImports.length === 0 && !activeProvider && (
                <div className="rounded-lg border border-dashed border-[#c3c6d7]/50 p-8 text-center">
                  <Database className="mx-auto h-8 w-8 text-[#0252d9]/15" />
                  <p className="mt-3 text-sm text-[#445573]">
                    Pick a provider above to start importing, or skip this step and let the tutor learn from your sessions.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Launch */}
          {step === 5 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold">Everything look right?</h2>
                <p className="mt-2 text-sm text-[#445573]">
                  You can change any of this later in Settings. The tutor keeps refining its model of you after every session.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-[#445573]">Level</p>
                  <p className="text-sm font-medium">{gradeLevel || "Not set"}</p>
                </div>
                <div className="glass rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-[#445573]">Subjects</p>
                  <div className="flex flex-wrap gap-1">
                    {subjects.map((s) => (
                      <span key={s} className="rounded-full bg-[#0252d9]/10 px-2 py-0.5 text-xs text-[#0252d9]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-[#445573]">Style</p>
                  <p className="text-sm capitalize">{explanationStyle} / {explanationLength} / {difficultyLevel}</p>
                </div>
                <div className="glass rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-[#445573]">Memory imports</p>
                  <p className="text-sm">
                    {memoryImports.filter((m) => m.rawText.trim().length >= 20).length} source(s) ready to analyze
                  </p>
                </div>
                {interests.length > 0 && (
                  <div className="glass rounded-lg p-4 space-y-2 sm:col-span-2">
                    <p className="text-xs font-medium text-[#445573]">Interests</p>
                    <p className="text-sm text-[#0b1c30]">{interests.join(", ")}</p>
                  </div>
                )}
              </div>

              {loading && (
                <div className="rounded-lg border border-[#0252d9]/15 bg-[#0252d9]/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0252d9]/30 border-t-[#0252d9]" />
                    <p className="text-sm text-[#0252d9]">
                      Building your learner model — analyzing imports and setting up your tutor...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-[#c3c6d7]/30 pt-5 mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-1 rounded-lg border border-[#c3c6d7] px-4 py-2.5 text-sm text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9] disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1 rounded-lg bg-[#0252d9] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#003da7] disabled:opacity-40 disabled:pointer-events-none"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="flex items-center gap-2 rounded-lg bg-[#0252d9] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#003da7] disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Building memory...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Launch my tutor
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
