import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Brain,
  Database,
  Fingerprint,
  Lock,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { WaitlistForm } from "@/components/waitlist-form";

export default async function Home() {
  const admin = await getAdminSession();
  if (admin) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-[#f8f9ff] text-[#0b1c30]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(2,82,217,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(2,82,217,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(2,82,217,0.12),transparent_62%)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-[#c3c6d7]/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#0252d9] text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Adaptive AI Tutor</p>
              <p className="text-xs text-[#445573]">private memory beta</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-md border border-[#c3c6d7] px-3 py-2 text-sm text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9]"
          >
            Admin sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[#0252d9]/15 bg-[#0252d9]/[0.06] px-3 py-2 text-sm text-[#0252d9]">
              <Fingerprint className="h-4 w-4" />
              Learns from your actual history, not a blank prompt
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] text-balance sm:text-7xl lg:text-8xl">
              A tutor with memory deep enough to change how it teaches.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#445573]">
              Import your AI chat logs and saved memories from ChatGPT, Claude,
              Gemini, Perplexity, or anywhere else. The tutor builds a durable
              learner model, updates it after every session, and uses it to adapt
              pacing, examples, review, and difficulty.
            </p>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["Memory-first", "Every session updates the model"],
                ["Admin beta", "Private product access is locked"],
                ["Gemini engine", "Uses the existing server API key"],
              ].map(([title, detail]) => (
                <div
                  key={title}
                  className="glass rounded-lg p-4"
                >
                  <p className="text-sm font-medium text-[#0b1c30]">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#445573]">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="glass-elevated rounded-xl p-4">
              <div className="mb-4 flex items-center justify-between border-b border-[#c3c6d7]/40 pb-4">
                <div>
                  <p className="text-sm font-medium">Learner memory console</p>
                  <p className="text-xs text-[#445573]">live synthesis preview</p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-[#0252d9]/20 bg-[#0252d9]/[0.08] px-2.5 py-1.5 text-xs text-[#0252d9]">
                  <Lock className="h-3.5 w-3.5" />
                  private beta
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[0.78fr_1.22fr]">
                <div className="space-y-3">
                  {[
                    ["ChatGPT", "analysis habits", 92],
                    ["Claude", "writing feedback", 84],
                    ["Gemini", "science questions", 76],
                  ].map(([provider, label, score]) => (
                    <div
                      key={provider}
                      className="rounded-lg border border-[#c3c6d7]/30 bg-white/50 p-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{provider}</span>
                        <span className="text-[#445573]">{score}%</span>
                      </div>
                      <p className="mt-2 text-xs text-[#445573]">{label}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5eeff]">
                        <div
                          className="h-full rounded-full bg-[#0252d9]"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-[#c3c6d7]/30 bg-[#f0f4ff]/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Database className="h-4 w-4 text-[#0252d9]" />
                    Synthesized learner model
                  </div>
                  <div className="mt-5 space-y-4">
                    {[
                      [
                        Sparkles,
                        "Learner type",
                        "Pattern-first, example-driven, fast when context is concrete",
                      ],
                      [
                        MessageSquareText,
                        "Best tutoring move",
                        "Start with the mental model, then test it with one applied problem",
                      ],
                      [
                        Brain,
                        "Watch closely",
                        "Abstract explanations without a worked example tend to stall progress",
                      ],
                    ].map(([Icon, title, detail]) => (
                      <div key={title as string} className="flex gap-3">
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#0252d9]/[0.08] text-[#0252d9]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{title as string}</p>
                          <p className="mt-1 text-sm leading-6 text-[#445573]">
                            {detail as string}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-elevated rounded-xl p-5">
              <div className="mb-4">
                <p className="text-base font-medium">Request early access</p>
                <p className="mt-1 text-sm text-[#445573]">
                  The full tutor is restricted while the memory system is being
                  hardened.
                </p>
              </div>
              <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-[#e5eeff]" />}>
                <WaitlistForm />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
