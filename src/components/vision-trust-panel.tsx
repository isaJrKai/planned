"use client";

// ============================================================================
// VISION & TRUST — institutional trust page for families
// ============================================================================
// Lives in the Settings tab. Shows families what Planned stands for,
// building the kind of institutional trust described in the strategic vision.
// ============================================================================

import { useState } from "react";
import {
  Shield,
  Heart,
  BookOpen,
  Eye,
  Lock,
  Users,
  TrendingUp,
  Target,
  Sparkles,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

type Section = "mission" | "principles" | "trust" | "education" | "roadmap";

export function VisionTrustPanel() {
  const [section, setSection] = useState<Section>("mission");

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: "mission", label: "Our Mission", icon: Heart },
    { id: "principles", label: "Product Principles", icon: Shield },
    { id: "trust", label: "Trust Commitments", icon: Lock },
    { id: "education", label: "Education Philosophy", icon: BookOpen },
    { id: "roadmap", label: "Our Journey", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="micro-label-gold mb-1">Institutional</div>
        <h2 className="font-editorial text-xl text-foreground tracking-wide">
          Vision &amp; Trust
        </h2>
        <p className="text-xs text-foreground/55 mt-1 leading-relaxed max-w-xl">
          What Planned stands for, why it exists, and what we commit to the families who trust us.
        </p>
      </div>

      {/* Section selector */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-3 py-2 rounded text-xs tracking-wider flex items-center gap-2 transition-all ${
              section === s.id ? "btn-gold" : "btn-outline"
            }`}
          >
            <s.icon className="h-3 w-3" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="divider-gold" />

      {/* Content */}
      {section === "mission" && <MissionSection />}
      {section === "principles" && <PrinciplesSection />}
      {section === "trust" && <TrustSection />}
      {section === "education" && <EducationSection />}
      {section === "roadmap" && <RoadmapSection />}
    </div>
  );
}

function MissionSection() {
  return (
    <div className="surface-wood-strong rounded-lg p-8">
      <div className="font-editorial text-2xl text-gold-foil tracking-editorial leading-tight mb-4">
        Planned exists to teach families disciplined wealth-building.
      </div>
      <div className="divider-gold my-5" />
      <div className="space-y-4 text-sm text-foreground/70 leading-relaxed">
        <p>
          The world has budgeting apps, banking apps, investment apps, and allowance trackers.
          But very few products exist to intentionally teach family wealth-building behavior,
          financial discipline, and intergenerational money habits.
        </p>
        <p>
          Planned creates this category. We are not a bank. We are not a payment processor.
          We are a wealth-building education platform — a patient financial mentor that helps
          families develop the habits that build lasting financial wellbeing.
        </p>
        <p>
          We believe that financial literacy is not taught through lectures, but through action.
          When a child saves toward a goal, tracks their spending, or learns about compound growth
          through real experience, the lesson sticks for life.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[
          { icon: TrendingUp, label: "Saving", desc: "Build the habit early" },
          { icon: Target, label: "Goals", desc: "Plan with intention" },
          { icon: BookOpen, label: "Education", desc: "Learn by doing" },
          { icon: Heart, label: "Family", desc: "Grow together" },
        ].map((item) => (
          <div key={item.label} className="surface-flat rounded-lg p-4 text-center">
            <item.icon className="h-4 w-4 mx-auto mb-2" style={{ color: "var(--primary)" }} />
            <div className="font-editorial text-sm text-foreground tracking-wide">{item.label}</div>
            <div className="text-[10px] text-foreground/45 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrinciplesSection() {
  const principles = [
    {
      title: "Calm, not loud",
      body: "We reject attention economics, social-media mechanics, and cheap gamification. The product should feel like a private bank lobby, not a casino.",
    },
    {
      title: "Education, not surveillance",
      body: "We track financial behaviors to teach, not to profile. We never infer sensitive characteristics. We never sell data.",
    },
    {
      title: "Action over theory",
      body: "Financial literacy is learned through doing. Every feature should help a child or parent take a meaningful financial action.",
    },
    {
      title: "Family authority first",
      body: "Parents are always in charge. The AI coach can teach and encourage, but never replaces parental authority or gives investment advice.",
    },
    {
      title: "Transparency by default",
      body: "Every score, recommendation, and insight explains itself. Families always know why they're seeing something and how it was calculated.",
    },
    {
      title: "Built for decades",
      body: "We design for 20-year horizons. No shortcuts, no technical debt accumulation, no trend-chasing. Architecture that evolves, not rots.",
    },
  ];

  return (
    <div className="space-y-3 stagger">
      {principles.map((p, i) => (
        <div key={i} className="surface-wood rounded-lg p-5">
          <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{p.title}</div>
          <div className="text-xs text-foreground/55 leading-relaxed">{p.body}</div>
        </div>
      ))}
    </div>
  );
}

function TrustSection() {
  const commitments = [
    {
      icon: Lock,
      title: "Data stays yours",
      body: "Your family's financial data is never sold, never shared with advertisers, and never used for anything other than improving your experience.",
    },
    {
      icon: Eye,
      title: "No profiling",
      body: "We do not infer religion, politics, mental health, income status, or any protected attribute. We track financial actions only — to teach, not to judge.",
    },
    {
      icon: Shield,
      title: "No investment advice",
      body: "The AI coach can explain concepts, but will never tell you what to buy, predict returns, or simulate financial outcomes. That's not our role.",
    },
    {
      icon: Heart,
      title: "No shaming",
      body: "Every recommendation, insight, and score is designed to encourage, never to shame. We never compare children negatively. We never use guilt.",
    },
    {
      icon: Users,
      title: "Parents in control",
      body: "Parents set the goals, the quotes, the themes. The AI defers to parents. Children see only what parents choose to reveal.",
    },
    {
      icon: Sparkles,
      title: "Explainable AI",
      body: "Every AI-generated insight includes a 'Why am I seeing this?' explanation with the data used and the confidence level. No black boxes.",
    },
  ];

  return (
    <div className="space-y-3 stagger">
      <div className="surface-wood-strong rounded-lg p-5 mb-4">
        <div className="font-editorial text-lg text-foreground tracking-wide mb-2">
          Our Trust Commitments
        </div>
        <p className="text-xs text-foreground/55 leading-relaxed">
          Families entrust us with their children's financial education. These commitments are
          non-negotiable. They survive leadership changes, acquisitions, and technological shifts.
        </p>
      </div>
      {commitments.map((c, i) => (
        <div key={i} className="surface-wood rounded-lg p-5 flex items-start gap-4">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", border: "1px solid var(--hairline)" }}
          >
            <c.icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{c.title}</div>
            <div className="text-xs text-foreground/55 leading-relaxed">{c.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationSection() {
  const subjects = [
    { name: "Saving", desc: "Why saving matters, how to save consistently, the habit of paying yourself first." },
    { name: "Budgeting", desc: "Needs vs wants, the three jars method, tracking spending, the 24-hour rule." },
    { name: "Compound Growth", desc: "The Rule of 72, why starting early matters, the snowball effect." },
    { name: "Risk", desc: "Risk vs reward, diversification, risk tolerance by age and goal." },
    { name: "Delayed Gratification", desc: "The marshmallow test, resisting impulse, investing in your future self." },
    { name: "Entrepreneurship", desc: "Creating value, understanding profit, the basics of building something." },
  ];

  return (
    <div className="space-y-4">
      <div className="surface-wood-strong rounded-lg p-6">
        <div className="font-editorial text-lg text-foreground tracking-wide mb-3">
          Educational Philosophy
        </div>
        <div className="divider-gold mb-4" />
        <div className="space-y-3 text-sm text-foreground/65 leading-relaxed">
          <p>
            We believe financial literacy is not a subject — it's a practice. Children learn
            about money by managing money, not by reading textbooks.
          </p>
          <p>
            Every lesson in Planned is paired with a real action. When a child learns about
            compound growth, they can see it working in their own savings. When they learn about
            budgeting, they can apply it to their own spending categories.
          </p>
          <p>
            Content is age-appropriate, calm, and never condescending. We teach through stories,
            examples, and reflection — not through lectures or tests that induce anxiety.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 stagger">
        {subjects.map((s) => (
          <div key={s.name} className="surface-wood rounded-lg p-4">
            <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{s.name}</div>
            <div className="text-xs text-foreground/50 leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapSection() {
  const phases = [
    {
      period: "Now",
      title: "The Foundation",
      items: [
        "Family savings, goals, spending tracking",
        "Financial literacy lessons with quizzes",
        "AI financial coach with safety guardrails",
        "Achievement system with streaks and badges",
        "Parent insights with explainability",
        "4 editorial themes (Onyx, Ivory, Blush, Oxblood)",
      ],
    },
    {
      period: "1-2 Years",
      title: "The Platform",
      items: [
        "Multi-family authentication + RBAC",
        "PWA + native mobile apps",
        "Multi-currency support (UGX, USD, KES, TZS, RWF)",
        "Monthly PDF reports + CSV exports",
        "Push notifications + email summaries",
        "School + community organization pilots",
      ],
    },
    {
      period: "3-5 Years",
      title: "The Ecosystem",
      items: [
        "Real broker integration (USE + regional)",
        "Family chat + shared goal challenges",
        "Adaptive curriculum based on behavior",
        "AI-generated personalized lessons",
        "Partner API for schools + financial educators",
        "Marketplace for family rewards",
      ],
    },
    {
      period: "5-10 Years",
      title: "The Category",
      items: [
        "The default platform for family financial education",
        "Voice coach + multilingual support",
        "Bank integrations (real-time balance sync)",
        "Family office features for wealthier families",
        "Research-backed curriculum used by schools nationally",
        "Category-defining brand in family finance",
      ],
    },
    {
      period: "10-20 Years",
      title: "The Institution",
      items: [
        "The trusted family financial mentor across generations",
        "Intergenerational wealth planning tools",
        "Financial literacy standards adopted by education systems",
        "Global presence across Africa, Asia, Latin America",
        "The brand families associate with financial wellbeing — the way LEGO means play",
      ],
    },
  ];

  return (
    <div className="space-y-4 stagger">
      {phases.map((phase) => (
        <div key={phase.period} className="surface-wood rounded-lg p-5">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="pill pill-gold">{phase.period}</span>
            <span className="font-editorial text-sm text-foreground tracking-wide">{phase.title}</span>
          </div>
          <div className="space-y-1.5">
            {phase.items.map((item, i) => (
              <div key={i} className="text-xs text-foreground/55 leading-relaxed flex items-start gap-2">
                <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
