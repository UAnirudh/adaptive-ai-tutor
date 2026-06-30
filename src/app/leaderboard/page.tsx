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
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-mono text-[#445573]/50 w-5 text-center">{rank}</span>;
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8f9ff]">
        <Loader2 className="h-8 w-8 animate-spin text-[#445573]/40" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f8f9ff] text-[#0b1c30]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(2,82,217,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(2,82,217,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(2,82,217,0.12),transparent_62%)]" />

      <div className="relative mx-auto max-w-2xl px-5 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6">
          <Link
            href="/dashboard"
            className="grid h-8 w-8 place-items-center rounded-md border border-[#c3c6d7] text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="grid h-9 w-9 place-items-center rounded-md bg-[#0252d9] text-white">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Leaderboard</h1>
            <p className="text-xs text-[#445573]">Refer friends, climb the ranks</p>
          </div>
        </div>

        {/* Your referral card */}
        {myRank && (
          <div className="glass-elevated mb-6 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#0252d9]" />
                  <p className="text-sm font-medium text-[#0252d9]">Your referral stats</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-semibold">#{myRank.rank || "—"}</p>
                    <p className="text-xs text-[#445573]">Rank</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{myRank.points}</p>
                    <p className="text-xs text-[#445573]">Points</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{myRank.referralCount}</p>
                    <p className="text-xs text-[#445573]">Referrals</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-[#c3c6d7]/40 bg-[#f0f4ff]/80 px-3 py-2.5 font-mono text-sm text-[#0b1c30]">
                {myRank.referralCode}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 rounded-lg bg-[#0252d9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#003da7]"
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
                className="grid h-10 w-10 place-items-center rounded-lg border border-[#c3c6d7] text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9]"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#445573]">
              Each person who signs up with your link earns you 100 points and moves you up the leaderboard.
            </p>
          </div>
        )}

        {/* Apply referral code */}
        <div className="glass mb-6 rounded-xl p-4">
          <p className="text-sm font-medium text-[#0b1c30] mb-3">Have a referral code?</p>
          <div className="flex gap-2">
            <input
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={12}
              className="h-10 flex-1 rounded-lg border border-[#c3c6d7]/50 bg-white/60 px-3 font-mono text-sm text-[#0b1c30] placeholder:text-[#445573]/40 focus:border-[#0252d9]/40 focus:outline-none uppercase"
              onKeyDown={(e) => e.key === "Enter" && applyReferral()}
            />
            <button
              onClick={applyReferral}
              disabled={applyStatus === "loading"}
              className="rounded-lg border border-[#c3c6d7] px-4 text-sm text-[#445573] transition hover:border-[#0252d9]/40 hover:text-[#0252d9] disabled:opacity-40"
            >
              {applyStatus === "loading" ? "Applying..." : "Apply"}
            </button>
          </div>
          {applyMessage && (
            <p className={`mt-2 text-xs ${applyStatus === "error" ? "text-red-500" : "text-emerald-600"}`}>
              {applyMessage}
            </p>
          )}
        </div>

        {/* Leaderboard table */}
        <div className="glass-elevated rounded-xl overflow-hidden">
          <div className="border-b border-[#c3c6d7]/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#445573]" />
              <p className="text-sm font-medium text-[#0b1c30]">Top referrers</p>
            </div>
            <p className="text-xs text-[#445573]">{leaderboard.length} ranked</p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-10 w-10 text-[#0252d9]/15" />
              <p className="mt-4 text-sm text-[#445573]">
                No one on the leaderboard yet. Share your referral link to be first.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#c3c6d7]/20">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 px-4 py-3 transition ${
                    entry.isYou ? "bg-[#0252d9]/[0.04]" : "hover:bg-[#f0f4ff]/60"
                  }`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${entry.isYou ? "text-[#0252d9]" : "text-[#0b1c30]"}`}>
                      {entry.name}
                      {entry.isYou && <span className="ml-2 text-xs text-[#0252d9]/60">(you)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">{entry.points}</p>
                    <p className="text-xs text-[#445573]">{entry.referralCount} referral{entry.referralCount !== 1 ? "s" : ""}</p>
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
