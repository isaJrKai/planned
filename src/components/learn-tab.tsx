"use client";

// ============================================================================
// LEARN TAB — Financial literacy lessons with quizzes
// ============================================================================

import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  X,
  Award,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Child } from "@/lib/types";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  ageMin: number;
  ageMax: number;
  estimatedMinutes: number;
  content: string;
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  order: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

interface LessonModalProps {
  lesson: Lesson;
  childId: string;
  onClose: () => void;
}

function LessonModal({ lesson, childId, onClose }: LessonModalProps) {
  const [view, setView] = useState<"content" | "quiz" | "result">("content");
  const [answers, setAnswers] = useState<number[]>(new Array(lesson.quiz.length).fill(-1));
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, lessonId: lesson.id, answers }),
      });
      const data = await res.json();
      setScore(data.score);
      setPassed(data.passed);
      setView("result");
    } catch (err) {
      console.error("Failed to submit quiz:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = answers.every((a) => a >= 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
      style={{
        background: "radial-gradient(80% 80% at 50% 50%, rgba(9,12,10,0.85) 0%, rgba(9,12,10,0.96) 100%)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="surface-wood-strong rounded-lg w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 relative sticky top-0 z-10" style={{ background: "var(--card)", borderBottom: "1px solid var(--hairline)" }}>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-foreground/40 hover:text-foreground/80"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="micro-label-gold mb-1">{lesson.subject} · {lesson.difficulty}</div>
          <h2 className="font-editorial text-2xl text-foreground tracking-editorial">{lesson.title}</h2>
          <div className="flex items-center gap-3 mt-2 text-xs text-foreground/50">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.estimatedMinutes} min</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Ages {lesson.ageMin}–{lesson.ageMax}</span>
          </div>
        </div>

        {/* Content */}
        {view === "content" && (
          <div className="px-7 py-6">
            <div
              className="prose prose-sm max-w-none text-foreground/85 leading-relaxed space-y-4"
              style={{ lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{
                __html: lesson.content
                  .replace(/^# (.+)$/gm, '<h2 class="font-editorial text-xl text-foreground tracking-wide mt-6 mb-3">$1</h2>')
                  .replace(/^## (.+)$/gm, '<h3 class="font-editorial text-base text-foreground tracking-wide mt-5 mb-2">$1</h3>')
                  .replace(/^\*\*(.+?)\*\*/gm, '<strong class="text-foreground">$1</strong>')
                  .replace(/^- (.+)$/gm, '<li class="ml-4 text-foreground/80">$1</li>')
                  .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-foreground/80"><span class="text-primary font-bold">$1.</span> $2</li>')
                  .replace(/\n\n/g, '</p><p class="text-foreground/80">')
                  .replace(/^/, '<p class="text-foreground/80">')
                  .replace(/$/, '</p>'),
              }}
            />
            <div className="divider-gold my-6" />
            <button
              onClick={() => setView("quiz")}
              className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider flex items-center justify-center gap-2"
            >
              Start Quiz <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quiz */}
        {view === "quiz" && (
          <div className="px-7 py-6 space-y-6">
            {lesson.quiz.map((q, qi) => (
              <div key={qi}>
                <div className="text-sm text-foreground font-editorial tracking-wide mb-3">
                  {qi + 1}. {q.question}
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => {
                        const next = [...answers];
                        next[qi] = oi;
                        setAnswers(next);
                      }}
                      className={`w-full text-left px-4 py-3 rounded text-sm transition-all ${
                        answers[qi] === oi
                          ? "btn-gold"
                          : "surface-flat hover:border-[var(--hairline-strong)]"
                      }`}
                      style={answers[qi] === oi ? {} : { color: "var(--text-soft)" }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="divider-gold my-4" />
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider flex items-center justify-center gap-2"
            >
              {submitting ? "Submitting..." : "Submit Answers"}
            </button>
            {!allAnswered && (
              <p className="text-xs text-center text-foreground/40">
                Answer all questions to submit
              </p>
            )}
          </div>
        )}

        {/* Result */}
        {view === "result" && (
          <div className="px-7 py-8 text-center">
            {passed ? (
              <>
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "color-mix(in srgb, var(--chart-2) 15%, transparent)" }}
                >
                  <CheckCircle2 className="h-8 w-8" style={{ color: "var(--chart-2)" }} />
                </div>
                <h3 className="font-editorial text-2xl text-foreground tracking-wide mb-2">
                  Lesson Complete!
                </h3>
                <p className="text-sm text-foreground/60 mb-4">
                  You scored {score}% — well done!
                </p>
                <div className="surface-flat rounded-lg p-4 max-w-sm mx-auto mb-6 text-left">
                  <div className="micro-label-gold mb-2">Quiz Explanations</div>
                  {lesson.quiz.map((q, qi) => (
                    <div key={qi} className="mb-3">
                      <div className="text-xs text-foreground/70 mb-1">{q.question}</div>
                      <div className="text-xs text-foreground/50 italic">{q.explanation}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  className="btn-gold px-6 py-2.5 rounded text-sm tracking-wider"
                >
                  Back to Lessons
                </button>
              </>
            ) : (
              <>
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "color-mix(in srgb, var(--chart-3) 15%, transparent)" }}
                >
                  <Award className="h-8 w-8" style={{ color: "var(--chart-3)" }} />
                </div>
                <h3 className="font-editorial text-xl text-foreground tracking-wide mb-2">
                  Not quite — try again!
                </h3>
                <p className="text-sm text-foreground/60 mb-4">
                  You scored {score}%. You need 60% to pass. Review the lesson and try again.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setView("content")}
                    className="btn-outline px-4 py-2.5 rounded text-sm tracking-wider"
                  >
                    Review Lesson
                  </button>
                  <button
                    onClick={() => setView("quiz")}
                    className="btn-gold px-4 py-2.5 rounded text-sm tracking-wider"
                  >
                    Retry Quiz
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LearnTab({ child }: { child: Child }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, inProgress: 0, completionRate: 0, averageScore: 0 });
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lessons?childId=${child.id}`)
      .then((r) => r.json())
      .then((data) => {
        setLessons(data.lessons ?? []);
        setProgress(data.progress ?? progress);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [child.id]);

  const subjectIcons: Record<string, any> = {
    saving: PiggyBank,
    budgeting: Wallet,
    investing: TrendingUp,
    risk: Shield,
    compound_growth: Sparkles,
    delayed_gratification: Hourglass,
    entrepreneurship: Rocket,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-foreground/40 text-sm">Loading lessons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Progress summary */}
      <div className="surface-wood-strong rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="micro-label-gold mb-1">Financial Literacy</div>
            <h3 className="font-editorial text-lg text-foreground tracking-wide">
              Learning Progress
            </h3>
          </div>
          <GraduationCap className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="divider-gold mb-5" />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="font-editorial text-2xl text-foreground tabular-nums">
              {progress.completed}
              <span className="text-sm text-foreground/40">/{progress.total}</span>
            </div>
            <div className="micro-label mt-1">Lessons completed</div>
          </div>
          <div>
            <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
              {progress.completionRate.toFixed(0)}%
            </div>
            <div className="micro-label mt-1">Completion rate</div>
          </div>
          <div>
            <div className="font-editorial text-2xl text-foreground tabular-nums">
              {progress.averageScore.toFixed(0)}%
            </div>
            <div className="micro-label mt-1">Average quiz score</div>
          </div>
        </div>
        <div className="progress-thin mt-4">
          <div style={{ width: `${progress.completionRate}%` }} />
        </div>
      </div>

      {/* Lessons list */}
      <div className="space-y-3 stagger">
        {lessons.map((lesson) => {
          const Icon = subjectIcons[lesson.subject] ?? BookOpen;
          const isCompleted = lesson.status === "COMPLETED";
          const isInProgress = lesson.status === "IN_PROGRESS";

          return (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              className="surface-wood rounded-lg p-5 w-full text-left card-hover flex items-center gap-4"
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: isCompleted
                    ? "color-mix(in srgb, var(--chart-2) 15%, transparent)"
                    : "var(--surface-flat-bg)",
                  border: `1px solid ${isCompleted ? "var(--chart-2)" : "var(--hairline)"}`,
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" style={{ color: "var(--chart-2)" }} />
                ) : (
                  <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-editorial text-sm text-foreground tracking-wide">{lesson.title}</span>
                  {isInProgress && (
                    <span className="pill pill-amber" style={{ fontSize: 8 }}>In progress</span>
                  )}
                </div>
                <div className="text-xs text-foreground/55 leading-relaxed">{lesson.description}</div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-foreground/40">
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {lesson.estimatedMinutes} min</span>
                  <span className="capitalize">{lesson.subject.replace(/_/g, " ")}</span>
                  <span className="capitalize">{lesson.difficulty}</span>
                </div>
              </div>

              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" style={{ color: "var(--chart-2)" }} />
                ) : (
                  <PlayCircle className="h-4 w-4" style={{ color: "var(--primary)" }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          childId={child.id}
          onClose={() => {
            setActiveLesson(null);
            // Refresh lessons to update progress
            fetch(`/api/lessons?childId=${child.id}`)
              .then((r) => r.json())
              .then((data) => {
                setLessons(data.lessons ?? []);
                setProgress(data.progress ?? progress);
              });
          }}
        />
      )}
    </div>
  );
}

// Need to import icons used above
import { PiggyBank, Wallet, TrendingUp, Shield, Sparkles, Hourglass, Rocket } from "lucide-react";
