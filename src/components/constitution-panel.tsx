"use client";

// ============================================================================
// INSTITUTIONAL CONSTITUTION
// ============================================================================
// The constitutional document of Planned. Visible to families in Settings.
// Codifies: mission, beliefs, principles, family rights, responsibilities,
// non-negotiables, AI constitution, and evolution charter.
// Designed to remain meaningful for decades.
// ============================================================================

import { useState } from "react";
import {
  Scroll, Heart, Shield, Lock, Sparkles, Eye, Users, Scale,
  TrendingUp, BookOpen, Brain, Ban, ChevronRight, FileText, Globe,
} from "lucide-react";

type Article = "preamble" | "mission" | "beliefs" | "principles" | "rights" | "responsibilities" | "guardrails" | "ai" | "evolution";

export function ConstitutionPanel() {
  const [article, setArticle] = useState<Article>("preamble");

  const articles: { id: Article; title: string; icon: any }[] = [
    { id: "preamble", title: "Preamble", icon: Scroll },
    { id: "mission", title: "Mission & Vision", icon: Heart },
    { id: "beliefs", title: "Core Beliefs", icon: Brain },
    { id: "principles", title: "Principles", icon: Scale },
    { id: "rights", title: "Family Rights", icon: Shield },
    { id: "responsibilities", title: "Our Responsibilities", icon: Lock },
    { id: "guardrails", title: "Non-Negotiables", icon: Ban },
    { id: "ai", title: "AI Constitution", icon: Sparkles },
    { id: "evolution", title: "Evolution Charter", icon: Globe },
  ];

  return (
    <div className="surface-wood-strong rounded-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="micro-label-gold mb-2 flex items-center justify-center gap-1.5">
          <Scroll className="h-3 w-3" /> Institutional Constitution
        </div>
        <h2 className="font-editorial text-3xl text-gold-foil tracking-editorial leading-tight mb-2">
          The Constitution of Planned
        </h2>
        <p className="text-xs text-foreground/45 italic max-w-md mx-auto">
          The enduring identity, principles, and responsibilities of an institution
          trusted by families and children. Written to remain meaningful for generations.
        </p>
      </div>

      {/* Article selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {articles.map((a) => (
          <button
            key={a.id}
            onClick={() => setArticle(a.id)}
            className={`px-3 py-1.5 rounded text-[10px] tracking-wider uppercase flex items-center gap-1.5 transition-all ${
              article === a.id ? "btn-gold" : "btn-outline"
            }`}
          >
            <a.icon className="h-2.5 w-2.5" />
            {a.title}
          </button>
        ))}
      </div>

      <div className="divider-gold mb-6" />

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {article === "preamble" && <Preamble />}
        {article === "mission" && <Mission />}
        {article === "beliefs" && <Beliefs />}
        {article === "principles" && <Principles />}
        {article === "rights" && <FamilyRights />}
        {article === "responsibilities" && <Responsibilities />}
        {article === "guardrails" && <Guardrails />}
        {article === "ai" && <AIConstitution />}
        {article === "evolution" && <EvolutionCharter />}
      </div>

      <div className="divider-gold mt-8 mb-4" />
      <div className="text-center text-[9px] text-foreground/35 italic">
        This constitution governs Planned's identity, principles, and responsibilities.
        It is designed to survive leadership changes, technological shifts, and organizational evolution.
        Version 1.0 · June 2026.
      </div>
    </div>
  );
}

// ---- Preamble -------------------------------------------------------------

function Preamble() {
  return (
    <div className="space-y-4 text-sm text-foreground/70 leading-relaxed">
      <p className="font-editorial text-lg text-foreground italic tracking-wide">
        Planned exists because the world teaches children many things, but rarely teaches them
        how to build wealth with intention, patience, and discipline.
      </p>
      <p>
        Families have access to budgeting apps, banking apps, investment platforms, and allowance trackers.
        But very few products exist to intentionally teach family wealth-building behavior,
        financial discipline, and intergenerational money habits.
      </p>
      <p>
        Planned accepts the responsibility of filling this gap. We are not a bank. We are not a
        payment processor. We are a wealth-building education platform — a patient financial mentor
        that helps families develop the habits that build lasting financial wellbeing.
      </p>
      <p>
        We believe that financial literacy is not taught through lectures, but through action.
        When a child saves toward a goal, tracks their spending, or learns about compound growth
        through real experience, the lesson sticks for life.
      </p>
      <p className="font-editorial text-base text-foreground/85 italic">
        This constitution defines who we are, what we believe, what families can expect from us,
        and what we will never become. It is written to guide Planned for generations.
      </p>
    </div>
  );
}

// ---- Mission --------------------------------------------------------------

function Mission() {
  return (
    <div className="space-y-5">
      <div>
        <div className="micro-label-gold mb-2">Mission</div>
        <p className="font-editorial text-base text-foreground/85 leading-relaxed">
          Help families intentionally build disciplined wealth habits through saving, goal setting,
          financial literacy, investing concepts, family accountability, and healthy money behaviors.
        </p>
      </div>
      <div>
        <div className="micro-label-gold mb-2">Long-Term Aspiration</div>
        <p className="text-sm text-foreground/65 leading-relaxed">
          Become a trusted Family Wealth Operating System and educational institution for
          intergenerational financial literacy — the brand families associate with financial
          wellbeing, the way LEGO means play.
        </p>
      </div>
      <div>
        <div className="micro-label-gold mb-2">What We Are</div>
        <ul className="space-y-1.5 text-sm text-foreground/65">
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> A financial education platform</li>
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> A patient financial mentor</li>
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> A family accountability partner</li>
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> An educational institution</li>
        </ul>
      </div>
      <div>
        <div className="micro-label-gold mb-2">What We Are Not</div>
        <ul className="space-y-1.5 text-sm text-foreground/65">
          <li className="flex items-start gap-2"><Ban className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--destructive)" }} /> A bank or payment processor</li>
          <li className="flex items-start gap-2"><Ban className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--destructive)" }} /> An investment advisor</li>
          <li className="flex items-start gap-2"><Ban className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--destructive)" }} /> A social media platform</li>
          <li className="flex items-start gap-2"><Ban className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--destructive)" }} /> A gamification engine</li>
        </ul>
      </div>
    </div>
  );
}

// ---- Core Beliefs ---------------------------------------------------------

function Beliefs() {
  const beliefs = [
    { title: "Children learn by doing", body: "Financial literacy is not a subject — it's a practice. Children learn about money by managing money, not by reading textbooks." },
    { title: "Families are the primary educators", body: "Parents are always the primary financial educators. Planned supports and enhances family authority, never replaces it." },
    { title: "Habits compound", body: "Small, consistent actions build lifelong wealth. Saving UGX 500 regularly matters more than saving UGX 50,000 once." },
    { title: "Delayed gratification is a skill", body: "The ability to wait for something better is one of the strongest predictors of long-term financial wellbeing." },
    { title: "Money is a tool, not a goal", body: "Wealth is not the purpose — it's the byproduct of disciplined habits and intentional choices." },
    { title: "Trust is the foundation", body: "Families entrust us with their children's financial education. This trust is sacred, fragile, and must be protected above all else." },
    { title: "Technology serves education", body: "AI, data, and design exist to teach, guide, and encourage — never to manipulate, addict, or exploit." },
    { title: "Institutions outlast individuals", body: "Planned is designed to survive founders, leadership changes, and technological revolutions. Principles endure; implementations evolve." },
  ];

  return (
    <div className="space-y-4 stagger">
      {beliefs.map((b, i) => (
        <div key={i} className="surface-flat rounded-lg p-4">
          <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{b.title}</div>
          <div className="text-xs text-foreground/55 leading-relaxed">{b.body}</div>
        </div>
      ))}
    </div>
  );
}

// ---- Principles -----------------------------------------------------------

function Principles() {
  const principles = [
    { title: "Trust First", body: "Every decision is evaluated against: does this increase or decrease family trust? Trust is the only metric that matters long-term." },
    { title: "Simplicity Scales", body: "Simple systems survive decades. Complex systems break. We prefer explicitness over magic, clarity over cleverness." },
    { title: "Education Over Entertainment", body: "We teach through action and reflection, not through dopamine loops and attention harvesting." },
    { title: "Privacy as a Right", body: "Family data is a sacred trust. We collect the minimum necessary, never sell it, and never profile sensitive characteristics." },
    { title: "Transparency by Default", body: "Every score, recommendation, and AI insight explains itself. Families always know why they're seeing something." },
    { title: "Built for Decades", body: "We design for 20-year horizons. No shortcuts, no technical debt accumulation, no trend-chasing." },
    { title: "Family Authority", body: "Parents set the rules. The AI coach defers. Children see only what parents choose to reveal." },
    { title: "Calm, Not Loud", body: "The product should feel like a private bank lobby, not a casino. Editorial calm over visual noise." },
  ];

  return (
    <div className="space-y-3 stagger">
      {principles.map((p, i) => (
        <div key={i} className="flex items-start gap-3 surface-flat rounded-lg p-4">
          <div className="font-editorial text-lg tabular-nums shrink-0" style={{ color: "var(--primary)", opacity: 0.5 }}>
            {String(i + 1).padStart(2, "0")}
          </div>
          <div>
            <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{p.title}</div>
            <div className="text-xs text-foreground/55 leading-relaxed">{p.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Family Rights --------------------------------------------------------

function FamilyRights() {
  const rights = [
    { icon: Lock, title: "Right to Privacy", body: "Your family's financial data is never sold, never shared with advertisers, and never used for anything other than improving your experience." },
    { icon: Eye, title: "Right to Understanding", body: "Every recommendation, insight, and score must explain itself. You always know why you're seeing something and how it was calculated." },
    { icon: FileText, title: "Right to Transparency", body: "You can see exactly what data we store, export it at any time, and understand how AI uses it." },
    { icon: Shield, title: "Right to Control", body: "You control which AI features are active. You can disable any feature without losing data. You can request deletion at any time." },
    { icon: BookOpen, title: "Right to Educational Integrity", body: "Educational content is age-appropriate, factual, and never manipulative. The AI coach never gives investment advice or replaces parental authority." },
    { icon: Heart, title: "Right to Safety", body: "Children are protected from shaming, negative comparisons, and addictive patterns. Every interaction is designed to encourage, never to harm." },
    { icon: Users, title: "Right to Respectful Experiences", body: "The product is calm, professional, and warm. It never uses dark patterns, artificial urgency, or manipulative design." },
    { icon: TrendingUp, title: "Right to Portability", body: "Your data is yours. You can export everything via the Public API at any time and take it with you." },
  ];

  return (
    <div className="space-y-3 stagger">
      <div className="text-center mb-4">
        <div className="font-editorial text-lg text-foreground tracking-wide mb-1">Family Bill of Rights</div>
        <p className="text-xs text-foreground/45">Non-negotiable rights that survive leadership changes, acquisitions, and technological shifts.</p>
      </div>
      {rights.map((r, i) => (
        <div key={i} className="surface-wood rounded-lg p-4 flex items-start gap-4">
          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", border: "1px solid var(--hairline)" }}>
            <r.icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{r.title}</div>
            <div className="text-xs text-foreground/55 leading-relaxed">{r.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Responsibilities ------------------------------------------------------

function Responsibilities() {
  const responsibilities = [
    "Maintain the security and integrity of family data with encryption at rest and in transit.",
    "Never sell, share, or exploit family data for advertising or profiling.",
    "Never infer religion, politics, mental health, income status, or any protected attribute.",
    "Ensure every AI insight includes a clear explanation of why it was generated and what data was used.",
    "Never give investment advice, predict financial returns, or simulate financial outcomes.",
    "Never shame, judge, or negatively compare children against siblings or peers.",
    "Maintain the right of parents to control what their children see and do.",
    "Ensure the product remains accessible (WCAG AA), calm, and free from dark patterns.",
    "Provide families with full data export and deletion capabilities at any time.",
    "Maintain transparent change logs so families always know what changed and why.",
    "Preserve institutional memory so that knowledge survives personnel changes.",
    "Design all systems for decades of evolution without requiring fundamental rewrites.",
  ];

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <div className="font-editorial text-lg text-foreground tracking-wide mb-1">Institutional Responsibilities</div>
        <p className="text-xs text-foreground/45">Obligations Planned accepts as a trusted family institution.</p>
      </div>
      {responsibilities.map((r, i) => (
        <div key={i} className="flex items-start gap-3 text-sm text-foreground/65 leading-relaxed">
          <span className="font-editorial tabular-nums shrink-0" style={{ color: "var(--primary)" }}>{i + 1}.</span>
          <span>{r}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Non-Negotiables ------------------------------------------------------

function Guardrails() {
  const guardrails = [
    { title: "No dark patterns", body: "Never use manipulation, artificial urgency, or deceptive design to drive engagement." },
    { title: "No addiction mechanics", body: "Never use variable reward schedules, loot boxes, or gambling psychology. Streaks encourage consistency, not compulsion." },
    { title: "No shaming", body: "Never shame a child for spending, judge a family's financial choices, or compare children negatively." },
    { title: "No data exploitation", body: "Never sell data, share with advertisers, or profile sensitive characteristics. Data is a sacred trust." },
    { title: "No investment advice", body: "The AI coach explains concepts but never tells families what to buy, sell, or invest in." },
    { title: "No surveillance", body: "Track financial actions to teach, not to profile. Never monitor children's behavior beyond what's needed for education." },
    { title: "No educational compromise", body: "Never prioritize growth metrics over educational integrity. If a feature doesn't teach, it doesn't ship." },
    { title: "No short-term thinking", body: "Never sacrifice long-term trust for short-term metrics. Decisions are evaluated on decades, not quarters." },
  ];

  return (
    <div className="space-y-3 stagger">
      <div className="text-center mb-4">
        <div className="font-editorial text-lg text-foreground tracking-wide mb-1">Institutional Guardrails</div>
        <p className="text-xs text-foreground/45">Behaviors and patterns Planned will never adopt. These are non-negotiable.</p>
      </div>
      {guardrails.map((g, i) => (
        <div key={i} className="surface-flat rounded-lg p-4 flex items-start gap-3" style={{ borderLeft: "3px solid var(--destructive)" }}>
          <Ban className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--destructive)" }} />
          <div>
            <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{g.title}</div>
            <div className="text-xs text-foreground/55 leading-relaxed">{g.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- AI Constitution ------------------------------------------------------

function AIConstitution() {
  const aiPrinciples = [
    { title: "AI teaches, never manipulates", body: "AI exists to explain, encourage, and educate. It never uses urgency, guilt, or comparison to change behavior." },
    { title: "Every recommendation is explainable", body: "Every AI insight includes a 'Why am I seeing this?' explanation with the data used and confidence level. No black boxes." },
    { title: "AI defers to parents", body: "The AI coach can teach and encourage, but never replaces parental authority. Parents set the rules; AI follows them." },
    { title: "AI never profiles", body: "AI never infers religion, politics, mental health, income, or any protected attribute. It tracks financial actions only — to teach, not to judge." },
    { title: "AI never advises on investments", body: "The coach explains what compound growth is, but never says 'buy this stock' or 'invest in X.' That's not our role." },
    { title: "AI is transparent about its limits", body: "If the AI doesn't know something, it says so. It never hallucinates facts or simulates financial returns." },
    { title: "AI safety is governed", body: "AI outputs are monitored for safety. Guardrails are enforced via system prompts. Families can disable any AI feature at any time." },
    { title: "AI evolves under human oversight", body: "Future AI capabilities (voice coach, AI-generated lessons) will be developed under strict governance with family safety as the first priority." },
  ];

  return (
    <div className="space-y-3 stagger">
      <div className="text-center mb-4">
        <div className="font-editorial text-lg text-foreground tracking-wide mb-1 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--primary)" }} /> AI Constitution
        </div>
        <p className="text-xs text-foreground/45">Principles governing all AI systems in Planned. These survive model changes, capability additions, and technological evolution.</p>
      </div>
      {aiPrinciples.map((p, i) => (
        <div key={i} className="surface-wood rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-editorial text-sm text-foreground tabular-nums" style={{ color: "var(--primary)" }}>AI-{i + 1}</span>
            <span className="font-editorial text-sm text-foreground tracking-wide">{p.title}</span>
          </div>
          <div className="text-xs text-foreground/55 leading-relaxed">{p.body}</div>
        </div>
      ))}
    </div>
  );
}

// ---- Evolution Charter ----------------------------------------------------

function EvolutionCharter() {
  return (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <div className="font-editorial text-lg text-foreground tracking-wide mb-1">Evolution Charter</div>
        <p className="text-xs text-foreground/45">How Planned evolves while preserving its identity, principles, and trust.</p>
      </div>

      <div>
        <div className="micro-label-gold mb-2">What May Change</div>
        <ul className="space-y-1.5 text-sm text-foreground/60">
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--chart-2)" }} /> Technology stack and frameworks</li>
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--chart-2)" }} /> UI design and visual themes</li>
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--chart-2)" }} /> Feature set and product capabilities</li>
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--chart-2)" }} /> AI models and intelligence systems</li>
          <li className="flex items-start gap-2"><ChevronRight className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--chart-2)" }} /> Integrations and partnerships</li>
        </ul>
      </div>

      <div>
        <div className="micro-label-gold mb-2">What Must Remain Stable</div>
        <ul className="space-y-1.5 text-sm text-foreground/60">
          <li className="flex items-start gap-2"><Lock className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> Mission: teaching disciplined wealth-building</li>
          <li className="flex items-start gap-2"><Lock className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> Trust commitments: privacy, no profiling, no data selling</li>
          <li className="flex items-start gap-2"><Lock className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> Educational integrity: action over theory</li>
          <li className="flex items-start gap-2"><Lock className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> Family authority: parents in control</li>
          <li className="flex items-start gap-2"><Lock className="h-3 w-3 mt-1 shrink-0" style={{ color: "var(--primary)" }} /> Non-negotiables: no dark patterns, no shaming, no exploitation</li>
        </ul>
      </div>

      <div>
        <div className="micro-label-gold mb-2">Evolution Principles</div>
        <div className="space-y-2 text-sm text-foreground/60 leading-relaxed">
          <p>1. <strong className="text-foreground/80">Additive evolution:</strong> New capabilities extend the platform without breaking existing contracts. API v1 remains stable while v2 is built.</p>
          <p>2. <strong className="text-foreground/80">Principle preservation:</strong> Any change that violates a constitutional principle is rejected, regardless of business pressure.</p>
          <p>3. <strong className="text-foreground/80">Institutional memory:</strong> Every architectural decision is recorded. Future teams understand not just what was built, but why.</p>
          <p>4. <strong className="text-foreground/80">Controlled experimentation:</strong> New features are tested behind feature flags, evaluated against educational outcomes, and rolled back if they compromise trust.</p>
          <p>5. <strong className="text-foreground/80">Generational thinking:</strong> Every decision is evaluated on a 20-year horizon. Short-term gains that compromise long-term trust are rejected.</p>
        </div>
      </div>
    </div>
  );
}
