"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export function WaitlistForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  async function submitWaitlist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          interest: interest || undefined,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again in a moment.");
        return;
      }

      setStatus("success");
      setMessage("You're on the list. We'll reach out when a spot opens up.");
      setEmail("");
      setName("");
      setInterest("");
    } catch {
      setStatus("error");
      setMessage("Connection failed. Check your internet and try again.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitWaitlist} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="h-12 border-white/10 bg-white/[0.06] text-white placeholder:text-white/35"
          />
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
            className="h-12 border-white/10 bg-white/[0.06] text-white placeholder:text-white/35"
          />
        </div>
        <Textarea
          value={interest}
          onChange={(event) => setInterest(event.target.value)}
          placeholder="What would an ideal tutor know about how you learn? (optional)"
          className="min-h-24 resize-none border-white/10 bg-white/[0.06] text-white placeholder:text-white/35"
        />
        {referralCode && (
          <div className="flex items-center gap-2 rounded-lg border border-[#e7dfce]/20 bg-[#e7dfce]/[0.06] px-3 py-2 text-sm">
            <Check className="h-4 w-4 text-[#e7dfce]" />
            <span className="text-white/60">Referred by code:</span>
            <span className="font-mono text-[#e7dfce]">{referralCode}</span>
          </div>
        )}
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-12 w-full bg-[#e7dfce] text-[#15130f] hover:bg-[#fff4dc]"
        >
          {status === "loading" ? "Joining..." : "Join the waitlist"}
          {status === "success" ? (
            <Check className="ml-2 h-4 w-4" />
          ) : (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
        </Button>
        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>
            {message}
          </p>
        )}
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/30">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Link
        href="/register"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
      >
        <UserPlus className="h-4 w-4" />
        Create an account to save your spot
      </Link>
    </div>
  );
}
