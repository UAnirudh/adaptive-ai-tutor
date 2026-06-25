"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  ChevronLeft,
  Save,
  X,
  PlusCircle,
  Loader2,
  Check,
  Database,
  GraduationCap,
  Target,
  SlidersHorizontal,
  Sparkles,
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

interface ProfileData {
  gradeLevel: string;
  subjects: string[];
  shortTermGoals: string | null;
  longTermGoals: string | null;
  explanationStyle: string;
  explanationLength: string;
  difficultyLevel: string;
  interests: string[];
}

interface MemoryData {
  learnerType: string | null;
  confidence: number;
  summary: string | null;
  strengths: string[];
  frictionPoints: string[];
  preferredPatterns: string[];
  recommendedStrategies: string[];
  evidenceCount: number;
  sourceCount: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "memory">("profile");

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
  const [memory, setMemory] = useState<MemoryData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.status === 401) { router.push("/login"); return; }
        if (res.status === 403) { router.push("/"); return; }
        const json = await res.json();
        const p: ProfileData = json.profile;
        if (p) {
          setGradeLevel(p.gradeLevel);
          setSubjects(p.subjects);
          setShortTermGoals(p.shortTermGoals ?? "");
          setLongTermGoals(p.longTermGoals ?? "");
          setExplanationStyle(p.explanationStyle);
          setExplanationLength(p.explanationLength);
          setDifficultyLevel(p.difficultyLevel);
          setInterests(p.interests);
        }
        if (json.learnerMemory) setMemory(json.learnerMemory);
      } catch {
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

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

  async function handleSave() {
    setError("");
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevel,
          subjects,
          shortTermGoals: shortTermGoals || null,
          longTermGoals: longTermGoals || null,
          explanationStyle,
          explanationLength,
          difficultyLevel,
          interests,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save.");
        setSaving(false);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Connection failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#11100d]">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </main>
    );
  }

  const TABS = [
    { id: "profile" as const, label: "Profile", icon: GraduationCap },
    { id: "preferences" as const, label: "Preferences", icon: SlidersHorizontal },
    { id: "memory" as const, label: "Memory", icon: Database },
  ];

  return (
    <main className="min-h-dvh bg-[#11100d] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(231,223,206,0.08),transparent_62%)]" />

      <div className="relative mx-auto max-w-3xl px-5 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-white/50 transition hover:border-white/20 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#e7dfce] text-[#15130f]">
              <Brain className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#e7dfce] px-4 py-2 text-sm font-medium text-[#15130f] transition hover:bg-[#fff4dc] disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-lg border border-white/8 bg-white/[0.03] p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-[#e7dfce]/15 text-[#e7dfce]"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-white/70">Grade level</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GRADE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setGradeLevel(level)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                      gradeLevel === level
                        ? "border-[#e7dfce]/40 bg-[#e7dfce]/10 text-white"
                        : "border-white/8 bg-white/[0.03] text-white/60 hover:border-white/15"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-white/70">Subjects</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                      subjects.includes(subject)
                        ? "border-[#e7dfce]/40 bg-[#e7dfce]/15 text-[#e7dfce]"
                        : "border-white/8 text-white/50 hover:border-white/15"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
                {subjects.filter((s) => !SUBJECTS.includes(s)).map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className="rounded-full border border-[#e7dfce]/40 bg-[#e7dfce]/15 px-3 py-1.5 text-sm text-[#e7dfce]"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Add subject..."
                  className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#e7dfce]/30 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSubject())}
                />
                <button
                  onClick={addCustomSubject}
                  className="rounded-lg border border-white/10 px-4 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">Near-term goals</p>
              <textarea
                value={shortTermGoals}
                onChange={(e) => setShortTermGoals(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#e7dfce]/30 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">Bigger-picture goals</p>
              <textarea
                value={longTermGoals}
                onChange={(e) => setLongTermGoals(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#e7dfce]/30 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-white/70">Interests and hobbies</p>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/70"
                    >
                      {interest}
                      <button
                        onClick={() => setInterests((prev) => prev.filter((i) => i !== interest))}
                        className="text-white/30 hover:text-white/60"
                      >
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
                  placeholder="Add interest..."
                  className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#e7dfce]/30 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                />
                <button
                  onClick={addInterest}
                  className="rounded-lg border border-white/10 px-4 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preferences tab */}
        {activeTab === "preferences" && (
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-white/70">Explanation style</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { value: "concise", label: "Concise", desc: "Straight to the point." },
                  { value: "balanced", label: "Balanced", desc: "Clear and thorough." },
                  { value: "detailed", label: "Detailed", desc: "Full context and background." },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExplanationStyle(opt.value)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      explanationStyle === opt.value
                        ? "border-[#e7dfce]/40 bg-[#e7dfce]/10"
                        : "border-white/8 bg-white/[0.03] hover:border-white/15"
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="mt-1 text-xs text-white/45">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-white/70">Response length</p>
              <div className="grid grid-cols-3 gap-2">
                {["short", "medium", "long"].map((len) => (
                  <button
                    key={len}
                    onClick={() => setExplanationLength(len)}
                    className={`rounded-lg border px-4 py-3 text-sm capitalize transition-all ${
                      explanationLength === len
                        ? "border-[#e7dfce]/40 bg-[#e7dfce]/10 text-white"
                        : "border-white/8 text-white/50 hover:border-white/15"
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-white/70">Difficulty level</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { value: "easy", label: "Gentle start", desc: "Fundamentals, lots of examples, patient pacing." },
                  { value: "medium", label: "Some foundation", desc: "Skip the basics, build from there." },
                  { value: "hard", label: "Push me", desc: "Edge cases, deeper reasoning, faster pace." },
                  { value: "adaptive", label: "Let the tutor decide", desc: "Start moderate and adjust as we go." },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficultyLevel(opt.value)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      difficultyLevel === opt.value
                        ? "border-[#e7dfce]/40 bg-[#e7dfce]/10"
                        : "border-white/8 bg-white/[0.03] hover:border-white/15"
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="mt-1 text-xs text-white/45">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Memory tab */}
        {activeTab === "memory" && (
          <div className="space-y-6">
            {!memory ? (
              <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
                <Database className="mx-auto h-10 w-10 text-white/15" />
                <p className="mt-4 text-sm text-white/40">
                  No learner memory built yet. Complete a tutoring session or import data during onboarding to start building your model.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  <PlusCircle className="h-4 w-4" /> Import from onboarding
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-[#e7dfce]/15 bg-[#e7dfce]/[0.04] p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#e7dfce]" />
                    <div>
                      <p className="text-sm font-medium text-[#e7dfce]">
                        {memory.learnerType || "Building learner model..."}
                      </p>
                      {memory.summary && (
                        <p className="mt-2 text-sm leading-6 text-white/50">{memory.summary}</p>
                      )}
                      <div className="mt-3 flex gap-4 text-xs text-white/30">
                        <span>Confidence: {Math.round(memory.confidence * 100)}%</span>
                        <span>{memory.sourceCount} source(s)</span>
                        <span>{memory.evidenceCount} evidence update(s)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {([
                    ["Strengths", memory.strengths, Target],
                    ["Friction points", memory.frictionPoints, Target],
                    ["Preferred patterns", memory.preferredPatterns, SlidersHorizontal],
                    ["Recommended strategies", memory.recommendedStrategies, GraduationCap],
                  ] as const).map(([title, items, Icon]) => (
                    <div key={title} className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-white/30" />
                        <p className="text-sm font-medium text-white/70">{title}</p>
                      </div>
                      {items.length === 0 ? (
                        <p className="mt-3 text-sm text-white/25">More evidence needed.</p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {items.map((item) => (
                            <li key={item} className="text-sm leading-5 text-white/50">{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs text-white/30">
                    Memory updates automatically after each tutoring session. To import more data from another AI, go to{" "}
                    <Link href="/onboarding" className="underline hover:text-white/50">onboarding</Link>.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
