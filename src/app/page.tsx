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
    <main className="min-h-dvh overflow-hidden bg-[#11100d] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(231,223,206,0.20),transparent_62%)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#e7dfce] text-[#15130f]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Adaptive AI Tutor</p>
              <p className="text-xs text-white/45">private memory beta</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
          >
            Admin sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/65">
              <Fingerprint className="h-4 w-4 text-[#e7dfce]" />
              Learns from your actual history, not a blank prompt
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] text-balance sm:text-7xl lg:text-8xl">
              A tutor with memory deep enough to change how it teaches.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
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
                  className="rounded-lg border border-white/10 bg-white/[0.045] p-4"
                >
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-white/45">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-xl border border-white/10 bg-[#171511]/90 p-4 shadow-2xl shadow-black/30">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-medium">Learner memory console</p>
                  <p className="text-xs text-white/40">live synthesis preview</p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-[#e7dfce]/20 bg-[#e7dfce]/10 px-2.5 py-1.5 text-xs text-[#f2ead9]">
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
                      className="rounded-lg border border-white/10 bg-black/18 p-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{provider}</span>
                        <span className="text-white/40">{score}%</span>
                      </div>
                      <p className="mt-2 text-xs text-white/45">{label}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#e7dfce]"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-white/10 bg-[#0f0e0b] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Database className="h-4 w-4 text-[#e7dfce]" />
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
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/[0.06] text-[#e7dfce]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{title as string}</p>
                          <p className="mt-1 text-sm leading-6 text-white/52">
                            {detail as string}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#171511]/90 p-5">
              <div className="mb-4">
                <p className="text-base font-medium">Request early access</p>
                <p className="mt-1 text-sm text-white/45">
                  The full tutor is restricted while the memory system is being
                  hardened.
                </p>
              </div>
              <WaitlistForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
