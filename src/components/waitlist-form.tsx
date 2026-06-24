"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "We could not add you to the waitlist.");
        return;
      }

      setStatus("success");
      setMessage("You are on the waitlist. We will reach out when access opens.");
      setEmail("");
      setName("");
      setInterest("");
    } catch {
      setStatus("error");
      setMessage("Connection failed. Please try again.");
    }
  }

  return (
    <form onSubmit={submitWaitlist} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
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
        placeholder="What should the tutor remember about how you learn?"
        className="min-h-24 resize-none border-white/10 bg-white/[0.06] text-white placeholder:text-white/35"
      />
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
        <p
          className={`text-sm ${
            status === "error" ? "text-red-200" : "text-[#c9f0dc]"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
