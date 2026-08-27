"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

const MASCOT_EMOJI: Record<string, string> = {
  turtle: "🐢", rabbit: "🐰", chick: "🐥", panda: "🐼", penguin: "🐧", koala: "🐨",
  fox: "🦊", dolphin: "🐬", owl: "🦉", squirrel: "🐿️", raccoon: "🦝",
  eagle: "🦅", wolf: "🐺", lion: "🦁", octopus: "🐙", dragon: "🐉", leopard: "🐆",
};

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "1rem",
      padding: "1.25rem",
      boxShadow: "var(--card-shadow)",
    }}>
      {children}
    </div>
  );
}

export function ChildDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"home" | "goals" | "tokens" | "lessons" | "achievements">("home");

  useEffect(() => {
    fetch("/api/child/state").then(r => r.json()).then(d => { if (d.ok) setData(d); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/lessons").then(r => r.json()).then(d => { setLessons(d.lessons || []); }).catch(() => {});
    fetch("/api/achievements").then(r => r.json()).then(d => { setAchievements(d.achievements || []); }).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: "3rem" }}>🐬</motion.div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <button onClick={handleLogout} style={{ color: "var(--foreground)" }}>Back to Login</button>
    </div>
  );

  const { child, profile, tokens, goals } = data;
  const mascotEmoji = MASCOT_EMOJI[profile.animalCompanion] || "🐬";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const savingsPct = child.goalAmount > 0 ? (child.currentAmount / child.goalAmount) * 100 : 0;
  const earnedAchievements = achievements.filter((a: any) => a.earned);

  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "goals", label: "Goals", icon: "🎯" },
    { id: "tokens", label: "Stars", icon: "⭐" },
    { id: "lessons", label: "Learn", icon: "📖" },
    { id: "achievements", label: "Badges", icon: "🏆" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", paddingBottom: "80px", position: "relative", overflow: "hidden" }}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "2.5rem 1.5rem 1rem", textAlign: "center", position: "relative", zIndex: 10 }}>
        <motion.div animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: "4rem" }}>{mascotEmoji}</motion.div>
        <h1 style={{ fontFamily: "var(--font-editorial, Georgia, serif)", fontSize: "1.75rem", color: "var(--foreground)", margin: "0.5rem 0 0.25rem" }}>{greeting}, {child.nickname}!</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-softer, rgba(128,128,128,0.7))" }}>You saved {child.currentAmount.toLocaleString()} UGX so far.</p>
        <p style={{ fontSize: "0.8rem", color: "var(--primary)" }}>Your {profile.animalCompanion} is proud of you! 🌟</p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.25rem", padding: "0.5rem 1rem", position: "sticky", top: 0, zIndex: 20, background: "var(--topbar-bg, rgba(255,255,255,0.9))", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
        {tabs.map(item => (
          <button key={item.id} onClick={() => setTab(item.id as any)} style={{
            padding: "0.5rem 0.875rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600,
            background: tab === item.id ? "var(--primary)" : "transparent",
            color: tab === item.id ? "var(--primary-foreground)" : "var(--text-softer, rgba(128,128,128,0.6))",
            border: tab === item.id ? "1px solid var(--primary)" : "1px solid var(--border)",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem 1rem", maxWidth: "28rem", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-softer)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>{child.nickname}&apos;s Garden 🌳</div>
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{ fontSize: "3rem" }}>{savingsPct >= 100 ? "🌟" : savingsPct >= 75 ? "🌺" : savingsPct >= 50 ? "🌳" : savingsPct >= 25 ? "🌿" : "🌱"}</div>
                  <div style={{ fontFamily: "var(--font-editorial, Georgia, serif)", fontSize: "2rem", color: "var(--foreground)", fontWeight: 700 }}>{child.currentAmount.toLocaleString()}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-softer)" }}>Growing toward: {child.goalName}</div>
                  <div style={{ width: "100%", height: "8px", background: "var(--muted)", borderRadius: "4px", marginTop: "0.75rem", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, savingsPct)}%` }} transition={{ duration: 1.2 }} style={{ height: "100%", background: "var(--primary)", borderRadius: "4px" }} />
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-softer)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Star Wallet ⭐</div>
                <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ textAlign: "center", padding: "0.5rem 0" }}>
                  <div style={{ fontFamily: "var(--font-editorial, Georgia, serif)", fontSize: "2.5rem", color: "var(--primary)", fontWeight: 700 }}>⭐ {tokens.balance}</div>
                </motion.div>
              </GlassCard>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-softer)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>My Goals 🎯</div>
                {goals.length === 0 ? <div style={{ textAlign: "center", padding: "1rem 0", fontSize: "0.8rem", color: "var(--text-softer)" }}>No goals yet. Ask your parent to set one!</div> : goals.slice(0, 3).map((g: any, i: number) => (
                  <div key={g.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--foreground)", marginBottom: "0.25rem" }}><span>{g.title}</span><span style={{ color: "var(--primary)" }}>{g.progressPct}%</span></div>
                    <div style={{ width: "100%", height: "6px", background: "var(--muted)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.5rem" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${g.progressPct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ height: "100%", background: "var(--primary)", borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </GlassCard>
            </motion.div>
          )}

          {tab === "goals" && (
            <motion.div key="goals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-softer)", textTransform: "uppercase", marginBottom: "0.75rem" }}>My Goals 🎯</div>
                {goals.length === 0 ? <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-softer)" }}>No goals yet. Ask your parent to set one!</div> : goals.map((g: any, i: number) => (
                  <motion.div key={g.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} style={{ padding: "1rem", background: "var(--muted)", borderRadius: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.5rem" }}>{g.title}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-softer)", marginBottom: "0.5rem" }}>{g.currentAmount.toLocaleString()} / {g.targetAmount.toLocaleString()}</div>
                    <div style={{ width: "100%", height: "10px", background: "var(--border)", borderRadius: "5px", overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${g.progressPct}%` }} transition={{ duration: 0.8 }} style={{ height: "100%", background: "var(--primary)", borderRadius: "5px" }} />
                    </div>
                    <div style={{ textAlign: "right", fontSize: "0.7rem", color: "var(--primary)", marginTop: "0.25rem" }}>{g.progressPct}%</div>
                  </motion.div>
                ))}
              </GlassCard>
            </motion.div>
          )}

          {tab === "tokens" && (
            <motion.div key="tokens" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-softer)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Star Wallet ⭐</div>
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <div style={{ fontFamily: "var(--font-editorial, Georgia, serif)", fontSize: "3rem", color: "var(--primary)", fontWeight: 700 }}>⭐ {tokens.balance}</div>
                </motion.div>
                {tokens.history.length > 0 && (
                  <div>
                    {tokens.history.slice(0, 10).map((t: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "var(--foreground)" }}>{t.type === "parent_give" ? "⭐ Earned" : "🔄 Redeemed"}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-softer)" }}>{t.note}</div>
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: t.type === "parent_give" ? "var(--chart-2)" : "var(--chart-3)" }}>{t.type === "parent_give" ? "+" : "−"}{t.tokens}</div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {tab === "lessons" && (
            <motion.div key="lessons" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {lessons.length === 0 ? (
                <GlassCard>
                  <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-softer)" }}>No lessons available yet.</div>
                </GlassCard>
              ) : lessons.map((lesson: any, i: number) => (
                <motion.div key={lesson.id || lesson.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <GlassCard>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>📖</span>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--foreground)" }}>{lesson.title}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-softer)" }}>{lesson.estimatedMinutes} min · {lesson.difficulty}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-soft, var(--foreground))", lineHeight: 1.5 }}>{lesson.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === "achievements" && (
            <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-softer)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Badges 🏆</div>
                {achievements.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-softer)" }}>No badges available.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                    {achievements.map((a: any) => {
                      const earned = a.earned;
                      return (
                        <div key={a.id} style={{
                          padding: "0.75rem", borderRadius: "0.5rem", textAlign: "center",
                          background: earned ? "var(--muted)" : "transparent",
                          border: `1px solid ${earned ? "var(--primary)" : "var(--border)"}`,
                          opacity: earned ? 1 : 0.4,
                        }}>
                          <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{earned ? "🏆" : "🔒"}</div>
                          <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--foreground)" }}>{a.title}</div>
                          <div style={{ fontSize: "0.6rem", color: "var(--text-softer)", marginTop: "0.15rem" }}>{a.points} pts · {a.tier}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout button */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={handleLogout} style={{
        position: "fixed", bottom: "1.5rem", right: "1.5rem", width: "48px", height: "48px",
        borderRadius: "50%", background: "var(--primary)", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 30,
        boxShadow: "var(--card-shadow)",
      }}>
        <LogOut style={{ width: "18px", height: "18px", color: "var(--primary-foreground)" }} />
      </motion.button>
    </div>
  );
}
