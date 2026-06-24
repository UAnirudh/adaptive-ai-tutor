"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Brain,
  Send,
  LayoutDashboard,
  Plus,
  BookOpen,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId ?? undefined,
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.push("/");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Please complete onboarding first") {
          router.push("/onboarding");
          return;
        }
        throw new Error(data.error);
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error. ${err instanceof Error ? err.message : "Please try again."}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  async function handleEndSession() {
    if (!sessionId || messages.length < 2) return;

    try {
      await fetch("/api/sessions/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // Summary is best-effort
    }

    setSessionId(null);
    setMessages([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-none">AI Tutor</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Memory updates after each exchange
            </p>
          </div>
          {sessionId && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Session active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sessionId && messages.length >= 2 && (
            <Button variant="outline" size="sm" onClick={handleEndSession}>
              <BookOpen className="h-4 w-4 mr-1" />
              End & Summarize
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (sessionId) handleEndSession();
              setMessages([]);
              setSessionId(null);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="mx-auto max-w-3xl py-6 space-y-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-2xl py-20 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-white/10 bg-card">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold">
                What would you like to learn today?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Ask any academic question. Your tutor adapts explanations to your
                imported memory, learning style, interests, mistakes, and current mastery.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-6">
                {[
                  "Explain derivatives intuitively",
                  "Help me understand photosynthesis",
                  "What is Big O notation?",
                  "Quiz me on Newton's laws",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-xl px-4 py-3 max-w-[85%] border ${
                  msg.role === "user"
                    ? "border-primary/20 bg-primary text-primary-foreground"
                    : "border-white/10 bg-card"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="text-xs">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="rounded-xl border border-white/10 bg-card px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-white/10 bg-card/70 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your tutor anything..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
