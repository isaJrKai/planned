"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

const MASCOT_EMOJI: Record<string, string> = {
  turtle: "🐢", rabbit: "🐰", chick: "🐥", panda: "🐼", penguin: "🐧", koala: "🐨",
  fox: "🦊", dolphin: "🐬", owl: "🦉", squirrel: "🐿️", raccoon: "🦝",
  eagle: "🦅", wolf: "🐺", lion: "🦁", octopus: "🐙", dragon: "🐉", leopard: "🐆",
};

export function ChildDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"home" | "goals" | "tokens" | "lessons" | "achievements">("home");

  useEffect(() => {
    fetch("/api/child/state").then(r => r.json()).then(d => { if (d.ok) setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1929" }}><motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: "3rem" }}>🐬</motion.div></div>;
  if (!data) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1929" }}><button onClick={handleLogout} style={{ color: "#fff" }}>Back to Login</button></div>;

  const { child, profile, tokens, goals } = data;
  const mascotEmoji = MASCOT_EMOJI[profile.animalCompanion] || "🐬";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const savingsPct = child.goalAmount > 0 ? (child.currentAmount / child.goalAmount) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a1929 0%, #0d2847 30%, #1a3a5c 70%, #0d2847 100%)", paddingBottom: "80px", position: "relative", overflow: "hidden" }}>
      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div key={i} animate={{ y: [0, -40, 0], opacity: [0, 0.3, 0] }} transition={{ duration: 8 + i * 0.5, repeat: Infinity, delay: i * 0.3 }} style={{ position: "absolute", bottom: "10%", left: `${(i * 7) % 100}%`, width: "4px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
      ))}

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "2.5rem 1.5rem 1rem", textAlign: "center", position: "relative", zIndex: 10 }}>
        <motion.div animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: "4rem" }}>{mascotEmoji}</motion.div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.75rem", color: "#fff", margin: "0.5rem 0 0.25rem" }}>{greeting}, {child.nickname}</h1>
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>You saved {child.currentAmount.toLocaleString()} UGX this week.</p>
        <p style={{ fontSize: "0.8rem", color: "#FFD93D" }}>Your {profile.animalCompanion} is proud of you. 🌟</p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.25rem", padding: "0.5rem 1rem", position: "sticky", top: 0, zIndex: 20, background: "rgba(10,25,41,0.8)", backdropFilter: "blur(10px)" }}>
        {[{id:"home",l:"Cove",i:"🌊"},{id:"goals",l:"Goals",i:"🎯"},{id:"tokens",l:"Stars",i:"⭐"},{id:"lessons",l:"Learn",i:"📖"},{id:"achievements",l:"Badges",i:"🏆"}].map(item => (
          <button key={item.id} onClick={() => setTab(item.id as any)} style={{ padding: "0.5rem 0.875rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600, background: tab === item.id ? "rgba(255,255,255,0.12)" : "transparent", color: tab === item.id ? "#fff" : "rgba(255,255,255,0.4)", border: tab === item.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent", cursor: "pointer" }}>
            {item.i} {item.l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem 1rem", maxWidth: "28rem", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>{child.nickname}'s Garden 🌳</div>
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{ fontSize: "3rem" }}>{savingsPct >= 100 ? "🌟" : savingsPct >= 75 ? "🌺" : savingsPct >= 50 ? "🌳" : savingsPct >= 25 ? "🌿" : "🌱"}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: "#fff", fontWeight: 700 }}>{child.currentAmount.toLocaleString()}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>Growing toward: {child.goalName}</div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginTop: "0.75rem", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, savingsPct)}%` }} transition={{ duration: 1.2 }} style={{ height: "100%", background: "linear-gradient(90deg, #6BCB77, #FFD93D)", borderRadius: "4px" }} />
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Star Wallet ⭐</div>
                <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ textAlign: "center", padding: "0.5rem 0" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", color: "#FFD93D", fontWeight: 700, textShadow: "0 0 20px rgba(255,217,61,0.3)" }}>⭐ {tokens.balance}</div>
                </motion.div>
              </GlassCard>
              <GlassCard>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>My Goals 🎯</div>
                {goals.length === 0 ? <div style={{ textAlign: "center", padding: "1rem 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>No goals yet. Ask your parent to set one!</div> : goals.slice(0,3).map((g:any,i:number) => (
                  <div key={g.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#fff", marginBottom: "0.25rem" }}><span>{g.title}</span><span style={{ color: "#FFD93D" }}>{g.progressPct}%</span></div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.5rem" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${g.progressPct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ height: "100%", background: "linear-gradient(90deg, #FF6B6B, #FFD93D)", borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </GlassCard>
            </motion.div>
          )}
          {tab === "goals" && <motion.div key="goals" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}><GlassCard><div style={{fontSize:"0.7rem",fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",marginBottom:"0.75rem"}}>My Goals 🎯</div>{goals.length===0?<div style={{textAlign:"center",padding:"2rem 0",color:"rgba(255,255,255,0.3)"}}>No goals yet.</div>:goals.map((g:any,i:number)=>(<motion.div key={g.id} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.1}} style={{padding:"1rem",background:"rgba(255,255,255,0.04)",borderRadius:"0.75rem",marginBottom:"0.75rem"}}><div style={{fontSize:"1rem",fontWeight:600,color:"#fff",marginBottom:"0.5rem"}}>{g.title}</div><div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.4)",marginBottom:"0.5rem"}}>{g.currentAmount.toLocaleString()} / {g.targetAmount.toLocaleString()}</div><div style={{width:"100%",height:"10px",background:"rgba(255,255,255,0.08)",borderRadius:"5px",overflow:"hidden"}}><motion.div initial={{width:0}} animate={{width:`${g.progressPct}%`}} transition={{duration:0.8}} style={{height:"100%",background:"linear-gradient(90deg, #FF6B6B, #FFD93D)",borderRadius:"5px"}}/></div><div style={{textAlign:"right",fontSize:"0.7rem",color:"#FFD93D",marginTop:"0.25rem"}}>{g.progressPct}%</div></motion.div>))}</GlassCard></motion.div>}
          {tab === "tokens" && <motion.div key="tokens" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}><GlassCard><div style={{fontSize:"0.7rem",fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",marginBottom:"0.5rem"}}>Star Wallet ⭐</div><motion.div animate={{scale:[1,1.05,1]}} transition={{duration:3,repeat:Infinity}} style={{textAlign:"center",padding:"1.5rem 0"}}><div style={{fontFamily:"Georgia, serif",fontSize:"3rem",color:"#FFD93D",fontWeight:700}}>⭐ {tokens.balance}</div></motion.div>{tokens.history.length>0&&<div>{tokens.history.slice(0,10).map((t:any,i:number)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}><div><div style={{fontSize:"0.8rem",color:"#fff"}}>{t.type==="parent_give"?"⭐ Earned":"🔄 Redeemed"}</div><div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.3)"}}>{t.note}</div></div><div style={{fontSize:"0.85rem",fontWeight:600,color:t.type==="parent_give"?"#6BCB77":"#FF6B6B"}}>{t.type==="parent_give"?"+":"−"}{t.tokens}</div></div>))}</div>}</GlassCard></motion.div>}
          {tab === "lessons" && <motion.div key="lessons" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}><GlassCard><div style={{fontSize:"0.7rem",fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",marginBottom:"0.75rem"}}>Learn 📖</div><div style={{textAlign:"center",padding:"1.5rem 0",fontSize:"0.85rem",color:"rgba(255,255,255,0.3)"}}>Lessons coming soon!</div></GlassCard></motion.div>}
          {tab === "achievements" && <motion.div key="achievements" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}><GlassCard><div style={{fontSize:"0.7rem",fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",marginBottom:"0.75rem"}}>Badges 🏆</div><div style={{textAlign:"center",padding:"1.5rem 0",fontSize:"0.85rem",color:"rgba(255,255,255,0.3)"}}>No badges yet. Save money to unlock badges!</div></GlassCard></motion.div>}
        </AnimatePresence>
      </div>

      <motion.button whileTap={{ scale: 0.9 }} onClick={handleLogout} style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 30 }}>
        <LogOut style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.5)" }} />
      </motion.button>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "1.25rem", padding: "1.25rem", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>{children}</motion.div>;
}
