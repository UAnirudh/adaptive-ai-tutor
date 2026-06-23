"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, ChevronRight, ChevronLeft, X } from "lucide-react";

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

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function removeInterest(interest: string) {
    setInterests((prev) => prev.filter((i) => i !== interest));
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevel,
          subjects,
          shortTermGoals: shortTermGoals || undefined,
          longTermGoals: longTermGoals || undefined,
          explanationStyle,
          explanationLength,
          difficultyLevel,
          interests,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save profile");
        setLoading(false);
        return;
      }

      router.push("/chat");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const canProceed = () => {
    if (step === 1) return gradeLevel !== "" && subjects.length > 0;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Let&apos;s personalize your tutor</CardTitle>
          <CardDescription>
            Step {step} of {TOTAL_STEPS} — This helps your tutor adapt to exactly how you learn best.
          </CardDescription>
          <Progress value={(step / TOTAL_STEPS) * 100} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">What&apos;s your grade level?</Label>
                <RadioGroup value={gradeLevel} onValueChange={setGradeLevel}>
                  <div className="grid grid-cols-2 gap-2">
                    {GRADE_LEVELS.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <RadioGroupItem value={level} id={level} />
                        <Label htmlFor={level} className="text-sm cursor-pointer">
                          {level}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  What subjects are you studying?
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subject) => (
                    <Badge
                      key={subject}
                      variant={subjects.includes(subject) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-1 px-3"
                      onClick={() => toggleSubject(subject)}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Add another subject..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSubject())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomSubject}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shortTermGoals" className="text-base font-medium">
                  What are your short-term goals?
                </Label>
                <Textarea
                  id="shortTermGoals"
                  value={shortTermGoals}
                  onChange={(e) => setShortTermGoals(e.target.value)}
                  placeholder="e.g., Pass my calculus midterm, understand organic chemistry reactions..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longTermGoals" className="text-base font-medium">
                  What are your long-term goals?
                </Label>
                <Textarea
                  id="longTermGoals"
                  value={longTermGoals}
                  onChange={(e) => setLongTermGoals(e.target.value)}
                  placeholder="e.g., Get into a good engineering program, master data science..."
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  What are your interests and hobbies?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Your tutor will use these to create relatable examples.
                </p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="gap-1">
                      {interest}
                      <button type="button" onClick={() => removeInterest(interest)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="e.g., robotics, basketball, gaming, cooking..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                  />
                  <Button type="button" variant="outline" onClick={addInterest}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  How do you like explanations?
                </Label>
                <RadioGroup value={explanationStyle} onValueChange={setExplanationStyle}>
                  <div className="space-y-2">
                    {[
                      { value: "concise", label: "Concise", desc: "Get to the point. Short and direct." },
                      { value: "balanced", label: "Balanced", desc: "Clear explanations with the right amount of detail." },
                      { value: "detailed", label: "Detailed", desc: "Thorough explanations with full context and reasoning." },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-3 rounded-lg border p-3">
                        <RadioGroupItem value={opt.value} id={`style-${opt.value}`} className="mt-0.5" />
                        <div>
                          <Label htmlFor={`style-${opt.value}`} className="font-medium cursor-pointer">
                            {opt.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Preferred response length
                </Label>
                <RadioGroup value={explanationLength} onValueChange={setExplanationLength}>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "short", label: "Short" },
                      { value: "medium", label: "Medium" },
                      { value: "long", label: "Long" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 rounded-lg border p-3">
                        <RadioGroupItem value={opt.value} id={`length-${opt.value}`} />
                        <Label htmlFor={`length-${opt.value}`} className="cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  What difficulty level do you prefer?
                </Label>
                <RadioGroup value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <div className="space-y-2">
                    {[
                      { value: "easy", label: "Easy", desc: "Start from the basics. Lots of examples and gentle pacing." },
                      { value: "medium", label: "Medium", desc: "Assume some knowledge. Build on what I already know." },
                      { value: "hard", label: "Hard", desc: "Challenge me. Edge cases, deeper reasoning, faster pace." },
                      { value: "adaptive", label: "Adaptive (Recommended)", desc: "Let the tutor adjust based on how I'm doing." },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-3 rounded-lg border p-3">
                        <RadioGroupItem value={opt.value} id={`diff-${opt.value}`} className="mt-0.5" />
                        <div>
                          <Label htmlFor={`diff-${opt.value}`} className="font-medium cursor-pointer">
                            {opt.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h3 className="font-medium">Your Profile Summary</h3>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Grade:</strong> {gradeLevel}</p>
                  <p><strong>Subjects:</strong> {subjects.join(", ")}</p>
                  {interests.length > 0 && <p><strong>Interests:</strong> {interests.join(", ")}</p>}
                  <p><strong>Style:</strong> {explanationStyle} / {explanationLength} / {difficultyLevel}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !canProceed()}>
                {loading ? "Saving..." : "Start Learning"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
