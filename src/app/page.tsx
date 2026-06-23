import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Target, TrendingUp } from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            Powered by adaptive AI
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Your personal AI tutor
            <br />
            <span className="text-primary">that learns you</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Not another chatbot. An AI tutor that builds a persistent model of your
            strengths, weaknesses, goals, and learning style — then adapts every
            explanation to help you learn faster.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Brain,
              title: "Adaptive Learning",
              description:
                "Builds a student model that tracks your mastery, mistakes, and preferences over time.",
            },
            {
              icon: Target,
              title: "Goal-Oriented",
              description:
                "Aligns explanations and practice to your specific academic goals and timeline.",
            },
            {
              icon: BookOpen,
              title: "Personalized Style",
              description:
                "Uses your preferred explanation style, length, and difficulty level for every response.",
            },
            {
              icon: TrendingUp,
              title: "Progress Tracking",
              description:
                "Visualize mastery growth, identify recurring mistakes, and see recommended next steps.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-6 space-y-3"
            >
              <feature.icon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
