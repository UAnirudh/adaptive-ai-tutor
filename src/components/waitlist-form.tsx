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
            className="h-12 border-[#c3c6d7]/50 bg-white/60 text-[#0b1c30] placeholder:text-[#445573]/50"
          />
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
            className="h-12 border-[#c3c6d7]/50 bg-white/60 text-[#0b1c30] placeholder:text-[#445573]/50"
          />
        </div>
        <Textarea
          value={interest}
          onChange={(event) => setInterest(event.target.value)}
          placeholder="What would an ideal tutor know about how you learn? (optional)"
          className="min-h-24 resize-none border-[#c3c6d7]/50 bg-white/60 text-[#0b1c30] placeholder:text-[#445573]/50"
        />
        {referralCode && (
          <div className="flex items-center gap-2 rounded-lg border border-[#0252d9]/20 bg-[#0252d9]/[0.06] px-3 py-2 text-sm">
            <Check className="h-4 w-4 text-[#0252d9]" />
            <span className="text-[#445573]">Referred by code:</span>
            <span className="font-mono text-[#0252d9]">{referralCode}</span>
          </div>
        )}
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-12 w-full bg-[#0252d9] text-white hover:bg-[#003da7]"
        >
          {status === "loading" ? "Joining..." : "Join the waitlist"}
          {status === "success" ? (
            <Check className="ml-2 h-4 w-4" />
          ) : (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
        </Button>
        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-500" : "text-emerald-600"}`}>
            {message}
          </p>
        )}
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#c3c6d7]/40" />
        <span className="text-xs text-[#445573]/50">or</span>
        <div className="h-px flex-1 bg-[#c3c6d7]/40" />
      </div>

      <Link
        href="/register"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#c3c6d7]/50 bg-white/50 text-sm font-medium text-[#445573] transition hover:border-[#0252d9]/40 hover:bg-white/70 hover:text-[#0252d9]"
      >
        <UserPlus className="h-4 w-4" />
        Create an account to save your spot
      </Link>
    </div>
  );
}
