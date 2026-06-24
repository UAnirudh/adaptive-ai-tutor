"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Target,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface DashboardData {
  profile: {
    gradeLevel: string;
    subjects: string[];
    explanationStyle: string;
    difficultyLevel: string;
    interests: string[];
    shortTermGoals: string | null;
    longTermGoals: string | null;
    onboardingCompleted: boolean;
  } | null;
  mastery: Array<{
    id: string;
    subject: string;
    topic: string;
    masteryScore: number;
    confidenceLevel: number;
    totalAttempts: number;
    lastPracticed: string;
  }>;
  mistakes: Array<{
    id: string;
    subject: string;
    topic: string;
    mistakeType: string;
    description: string;
    frequency: number;
    lastSeen: string;
  }>;
  recentSessions: Array<{
    id: string;
    startedAt: string;
    summaryText: string | null;
    topicsCovered: string[];
    struggled: string[];
    reviewNext: string[];
  }>;
  recommended: string[];
  stats: {
    totalSessions: number;
    avgMastery: number;
    topicsStudied: number;
    activeMistakes: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        setData(json);

        if (json.profile && !json.profile.onboardingCompleted) {
          router.push("/onboarding");
          return;
        }
      } catch {
        // handle error silently
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <p className="text-muted-foreground mb-4">
            Complete onboarding to access your dashboard.
          </p>
          <Link href="/onboarding">
            <Button>Start Onboarding</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { profile, mastery, mistakes, recentSessions, recommended, stats } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/chat">
            <Button size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              Start Tutoring
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Sessions Completed",
              value: stats.totalSessions,
              icon: BookOpen,
            },
            {
              label: "Average Mastery",
              value: `${stats.avgMastery}%`,
              icon: TrendingUp,
            },
            {
              label: "Topics Studied",
              value: stats.topicsStudied,
              icon: Target,
            },
            {
              label: "Active Mistakes",
              value: stats.activeMistakes,
              icon: AlertTriangle,
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Grade:</span>{" "}
                <span className="font-medium">{profile.gradeLevel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Subjects:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.subjects.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Style:</span>{" "}
                <span className="font-medium capitalize">{profile.explanationStyle}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Difficulty:</span>{" "}
                <span className="font-medium capitalize">{profile.difficultyLevel}</span>
              </div>
              {profile.interests.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Interests:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.interests.map((i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.shortTermGoals && (
                <div>
                  <span className="text-muted-foreground">Short-term goals:</span>
                  <p className="mt-0.5">{profile.shortTermGoals}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Mastery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subject Mastery</CardTitle>
              <CardDescription>
                {mastery.length === 0
                  ? "Start studying to track your progress"
                  : `Tracking ${mastery.length} topics`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mastery.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No mastery data yet. Start a tutoring session!
                </p>
              ) : (
                mastery.slice(0, 8).map((m) => (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">
                        {m.subject}: {m.topic}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {Math.round(m.masteryScore)}%
                      </span>
                    </div>
                    <Progress
                      value={m.masteryScore}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Confidence: {Math.round(m.confidenceLevel)}%</span>
                      <span>{m.totalAttempts} attempts</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recommended & Mistakes */}
          <div className="space-y-6">
            {/* Recommended Next */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Next</CardTitle>
                <CardDescription>Topics to focus on</CardDescription>
              </CardHeader>
              <CardContent>
                {recommended.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">
                    Complete a session to get recommendations
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recommended.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Target className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recurring Mistakes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recurring Mistakes</CardTitle>
              </CardHeader>
              <CardContent>
                {mistakes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">
                    No recurring mistakes tracked yet
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {mistakes.slice(0, 5).map((m) => (
                      <li key={m.id} className="text-sm space-y-0.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="font-medium">
                            {m.subject}: {m.mistakeType}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {m.frequency}x
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs pl-5.5">
                          {m.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sessions</CardTitle>
            <CardDescription>Your latest tutoring sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No sessions yet. Start chatting with your tutor!
                </p>
                <Link href="/chat">
                  <Button size="sm">Start a Session</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session, i) => (
                  <div key={session.id}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {new Date(session.startedAt).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {session.topicsCovered.length > 0 && (
                          <div className="flex gap-1">
                            {session.topicsCovered.slice(0, 3).map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {session.summaryText && (
                        <p className="text-sm text-muted-foreground">
                          {session.summaryText}
                        </p>
                      )}
                      {session.struggled.length > 0 && (
                        <p className="text-xs text-amber-600">
                          Struggled with: {session.struggled.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
