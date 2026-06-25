"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Trophy,
  Copy,
  Check,
  ChevronLeft,
  Crown,
  Medal,
  Share2,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  referralCount: number;
  points: number;
  isYou: boolean;
}

interface MyRank {
  rank: number;
  points: number;
  referralCount: number;
  referralCode: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [applyStatus, setApplyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [applyMessage, setApplyMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [lbRes, refRes] = await Promise.all([
          fetch("/api/leaderboard"),
          fetch("/api/referral"),
        ]);

        if (lbRes.ok) {
          const data = await lbRes.json();
          setLeaderboard(data.leaderboard);
          setMyRank(data.myRank);
        }

        if (refRes.ok) {
          const refData = await refRes.json();
          if (refData.profile && !myRank) {
            setMyRank((prev) => prev ?? {
              rank: 0,
              points: refData.profile.points,
              referralCount: refData.profile.referralCount,
              referralCode: refData.profile.referralCode,
            });
          }
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function copyLink() {
    if (!myRank) return;
    const url = `${window.location.origin}?ref=${myRank.referralCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function applyReferral() {
    if (!referralInput.trim()) return;
    setApplyStatus("loading");
    setApplyMessage("");

    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApplyStatus("error");
        setApplyMessage(data.error);
        return;
      }

      setApplyStatus("success");
      setApplyMessage("Referral applied! The person who referred you earned 100 points.");
      setReferralInput("");
    } catch {
      setApplyStatus("error");
      setApplyMessage("Something went wrong. Try again.");
    }
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-mono text-white/40 w-5 text-center">{rank}</span>;
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#11100d]">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#11100d] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(231,223,206,0.12),transparent_62%)]" />

      <div className="relative mx-auto max-w-2xl px-5 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6">
          <Link
            href="/dashboard"
            className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-white/50 transition hover:border-white/20 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="grid h-9 w-9 place-items-center rounded-md bg-[#e7dfce] text-[#15130f]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Leaderboard</h1>
            <p className="text-xs text-white/40">Refer friends, climb the ranks</p>
          </div>
        </div>

        {/* Your referral card */}
        {myRank && (
          <div className="mb-6 rounded-xl border border-[#e7dfce]/20 bg-gradient-to-br from-[#e7dfce]/[0.08] to-transparent p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#e7dfce]" />
                  <p className="text-sm font-medium text-[#e7dfce]">Your referral stats</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-semibold">#{myRank.rank || "—"}</p>
                    <p className="text-xs text-white/40">Rank</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{myRank.points}</p>
                    <p className="text-xs text-white/40">Points</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{myRank.referralCount}</p>
                    <p className="text-xs text-white/40">Referrals</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm text-white/70">
                {myRank.referralCode}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 rounded-lg bg-[#e7dfce] px-4 py-2.5 text-sm font-medium text-[#15130f] transition hover:bg-[#fff4dc]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Adaptive AI Tutor",
                      text: "Check out this AI tutor that actually remembers how you learn",
                      url: `${window.location.origin}?ref=${myRank.referralCode}`,
                    });
                  } else {
                    copyLink();
                  }
                }}
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-white/50 transition hover:border-white/20 hover:text-white"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-white/30">
              Each person who signs up with your link earns you 100 points and moves you up the leaderboard.
            </p>
          </div>
        )}

        {/* Apply referral code */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/70 mb-3">Have a referral code?</p>
          <div className="flex gap-2">
            <input
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={12}
              className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/25 focus:border-[#e7dfce]/30 focus:outline-none uppercase"
              onKeyDown={(e) => e.key === "Enter" && applyReferral()}
            />
            <button
              onClick={applyReferral}
              disabled={applyStatus === "loading"}
              className="rounded-lg border border-white/10 px-4 text-sm text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-40"
            >
              {applyStatus === "loading" ? "Applying..." : "Apply"}
            </button>
          </div>
          {applyMessage && (
            <p className={`mt-2 text-xs ${applyStatus === "error" ? "text-red-300" : "text-emerald-300"}`}>
              {applyMessage}
            </p>
          )}
        </div>

        {/* Leaderboard table */}
        <div className="rounded-xl border border-white/10 bg-[#171511]/80 overflow-hidden">
          <div className="border-b border-white/8 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/40" />
              <p className="text-sm font-medium text-white/70">Top referrers</p>
            </div>
            <p className="text-xs text-white/30">{leaderboard.length} ranked</p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-10 w-10 text-white/10" />
              <p className="mt-4 text-sm text-white/30">
                No one on the leaderboard yet. Share your referral link to be first.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 px-4 py-3 transition ${
                    entry.isYou ? "bg-[#e7dfce]/[0.06]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${entry.isYou ? "text-[#e7dfce]" : "text-white/80"}`}>
                      {entry.name}
                      {entry.isYou && <span className="ml-2 text-xs text-[#e7dfce]/60">(you)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">{entry.points}</p>
                    <p className="text-xs text-white/30">{entry.referralCount} referral{entry.referralCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
