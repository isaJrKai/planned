"use client";

// ============================================================================
// AI COACH — conversational financial mentor
// ============================================================================
// A chat interface where children can ask questions about money, saving,
// budgeting, etc. The coach is powered by the LLM with strict guardrails.
// ============================================================================

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, MessageCircle, Lightbulb } from "lucide-react";
import type { Child } from "@/lib/types";

interface Message {
  role: "user" | "coach";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What is compound growth?",
  "Why should I save money?",
  "How can I reach my goal faster?",
  "What is a budget?",
];

export function AICoach({ child }: { child: Child }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          childId: child.id,
          userRole: "child",
        }),
      });
      const data = await res.json();
      const coachMsg: Message = {
        role: "coach",
        content: data.response || "I'm not sure how to answer that. Try asking about saving or budgeting!",
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "coach", content: "I'm having trouble right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-6 z-30 btn-gold h-14 w-14 rounded-full flex items-center justify-center shadow-2xl hide-desktop"
          style={{
            boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent)",
          }}
          aria-label="Ask the AI coach"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* Desktop floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 btn-gold h-14 w-14 rounded-full flex items-center justify-center shadow-2xl hide-mobile"
          style={{
            boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent)",
          }}
          aria-label="Ask the AI coach"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center p-4 md:items-end md:right-6 md:bottom-6 md:left-auto md:w-96 md:p-0"
          onClick={() => setOpen(false)}
        >
          <div
            className="surface-wood-strong rounded-t-lg md:rounded-lg w-full max-w-md shadow-2xl flex flex-col"
            style={{
              maxHeight: "70vh",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--hairline-strong)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <div className="font-editorial text-sm text-foreground tracking-wide">Financial Coach</div>
                  <div className="text-[9px] text-foreground/40">Ask about saving, budgeting, or your progress</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-foreground/40 hover:text-foreground/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ minHeight: "200px" }}>
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-30" style={{ color: "var(--primary)" }} />
                  <div className="text-sm text-foreground/60 mb-1 font-editorial tracking-wide">
                    Hi {child.name.split(" ")[0]}! I'm your financial coach.
                  </div>
                  <div className="text-xs text-foreground/40 mb-4">
                    Ask me anything about money, saving, or your goals.
                  </div>
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        className="block w-full text-left px-3 py-2 rounded text-xs surface-flat hover:border-[var(--hairline-strong)] transition-colors"
                      >
                        <Lightbulb className="h-3 w-3 inline mr-2" style={{ color: "var(--primary)" }} />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                      msg.role === "user" ? "btn-gold" : "surface-flat"
                    }`}
                    style={
                      msg.role === "user"
                        ? {}
                        : { color: "var(--text-soft)" }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="surface-flat px-3 py-2 rounded-lg text-xs" style={{ color: "var(--text-softer)" }}>
                    <span className="pulse-gentle">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[var(--hairline)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask(input)}
                placeholder="Ask a question..."
                maxLength={500}
                className="input-editorial flex-1 px-3 py-2 text-xs"
                disabled={loading}
              />
              <button
                onClick={() => ask(input)}
                disabled={!input.trim() || loading}
                className="btn-gold px-3 py-2 rounded flex items-center justify-center"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
