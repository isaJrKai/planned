"use client";

// ============================================================================
// FOUNDING MANIFESTO — the soul of Planned
// ============================================================================

import { useState } from "react";
import {
  Heart, Eye, BookOpen, Repeat, Shield, Scale, Sparkles, Sun, Hand,
} from "lucide-react";

type Part = "observation" | "beliefs" | "families" | "education" | "habits" | "trust" | "responsibility" | "hope" | "success" | "commitment" | "humility" | "closing";

export function ManifestoPanel() {
  const [part, setPart] = useState<Part>("observation");

  const parts: { id: Part; title: string; icon: any }[] = [
    { id: "observation", title: "The Observation", icon: Eye },
    { id: "beliefs", title: "What We Believe", icon: Heart },
    { id: "families", title: "Why Families Matter", icon: Heart },
    { id: "education", title: "Why Education Matters", icon: BookOpen },
    { id: "habits", title: "Why Habits Matter", icon: Repeat },
    { id: "trust", title: "Why Trust Matters", icon: Shield },
    { id: "responsibility", title: "Our Responsibility", icon: Scale },
    { id: "hope", title: "What We Hope For", icon: Sun },
    { id: "success", title: "What Success Means", icon: Sparkles },
    { id: "commitment", title: "Our Commitment", icon: Hand },
    { id: "humility", title: "Our Humility", icon: Heart },
    { id: "closing", title: "Closing Declaration", icon: Sparkles },
  ];

  return (
    <div className="surface-wood-strong rounded-lg p-8 md:p-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="micro-label-gold mb-3">Founding Document</div>
        <h2 className="font-editorial text-3xl md:text-4xl text-gold-foil tracking-editorial leading-tight mb-3">
          The Founding Manifesto
        </h2>
        <p className="text-xs text-foreground/40 italic max-w-md mx-auto">
          A statement of purpose, a promise of stewardship, and a declaration of hope.
          Written to remain meaningful for generations.
        </p>
      </div>

      <div className="divider-gold mb-6" />

      {/* Part selector */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-8">
        {parts.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setPart(p.id)}
            className={`px-2.5 py-1.5 rounded text-[9px] tracking-wider uppercase flex items-center gap-1 transition-all ${
              part === p.id ? "btn-gold" : "btn-ghost"
            }`}
          >
            <span className="opacity-50">{i + 1}.</span> {p.title}
          </button>
        ))}
      </div>

      <div className="divider-gold mb-8" />

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {part === "observation" && <Observation />}
        {part === "beliefs" && <Beliefs />}
        {part === "families" && <Families />}
        {part === "education" && <Education />}
        {part === "habits" && <Habits />}
        {part === "trust" && <Trust />}
        {part === "responsibility" && <Responsibility />}
        {part === "hope" && <Hope />}
        {part === "success" && <Success />}
        {part === "commitment" && <Commitment />}
        {part === "humility" && <Humility />}
        {part === "closing" && <Closing />}
      </div>

      <div className="divider-gold mt-8 mb-4" />
      <div className="text-center text-[9px] text-foreground/30 italic">
        The Founding Manifesto of Planned · Version 1.0 · June 2026
      </div>
    </div>
  );
}

// ---- Parts ----------------------------------------------------------------

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-foreground/70 leading-relaxed mb-4 last:mb-0 ${className ?? ""}`}>{children}</p>;
}

function Emphasis({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-editorial text-base text-foreground/90 italic leading-relaxed mb-4 ${className ?? ""}`}>{children}</p>;
}

function Observation() {
  return (
    <div className="space-y-4">
      <Emphasis>We observe a world where financial stress is common, financial education is rare, and short-term thinking shapes long-term outcomes.</Emphasis>
      <P>Many families live with financial anxiety — not always because they lack income, but because they lack habits, knowledge, and intentionality. Money comes in and goes out without a plan. Goals remain dreams. Saving feels impossible. Spending feels inevitable.</P>
      <P>Children grow up watching this. They absorb money habits not from textbooks, but from the behaviors they see at home. They learn whether money is discussed openly or avoided. They learn whether saving is a habit or an afterthought. They learn whether goals are set and pursued, or simply wished for.</P>
      <P>The consequences compound over years and across generations. A child who never learns to save becomes an adult who cannot save. A family that never discusses money produces children who are afraid of it. A community where financial literacy is absent remains vulnerable to poor decisions, predatory products, and missed opportunities.</P>
      <P>This is not a technology problem. It is a human problem — one of habits, education, and family culture. And it matters because the cost of financial illiteracy is not just money. It is stress, conflict, missed dreams, and diminished possibility.</P>
    </div>
  );
}

function Beliefs() {
  const beliefs = [
    "We believe families are the primary place where financial habits form.",
    "We believe children learn by doing, not by being told.",
    "We believe money is a tool, not a goal — and that wealth is a byproduct of disciplined habits, not the purpose of life.",
    "We believe small, consistent actions compound into extraordinary outcomes over time.",
    "We believe financial literacy is a form of freedom — the freedom to choose, to plan, and to build.",
    "We believe technology should serve human development, not exploit human attention.",
    "We believe trust is the most valuable asset any institution can possess, and the easiest to lose.",
    "We believe education creates opportunities that extend beyond one generation.",
    "We believe every family deserves a patient, trustworthy guide for their financial journey.",
    "We believe institutions can — and should — be designed to last for generations.",
  ];
  return (
    <div className="space-y-3">
      {beliefs.map((b, i) => (
        <div key={i} className="flex items-start gap-3 text-sm text-foreground/65 leading-relaxed">
          <span className="font-editorial text-sm shrink-0" style={{ color: "var(--primary)" }}>We believe</span>
          <span>{b.replace("We believe ", "")}</span>
        </div>
      ))}
    </div>
  );
}

function Families() {
  return (
    <div className="space-y-4">
      <Emphasis>The family is where habits are born, where values are tested, and where the future is first imagined.</Emphasis>
      <P>Families are the smallest and most powerful financial unit in society. Within a family, a child first encounters money — watching how it is earned, spent, saved, and discussed. These early observations shape lifelong patterns more powerfully than any school, app, or advertisement.</P>
      <P>When a family saves together, children learn that saving is normal. When a family sets goals together, children learn that goals are achievable. When a family talks about money openly and without shame, children learn that money is a tool to be understood, not a source of fear.</P>
      <P>Small decisions compound. The UGX 500 a child saves today is not just 500 shillings — it is a deposit into a habit that, repeated over years, becomes a identity. "I am someone who saves." That identity, formed in childhood, shapes every financial decision that follows.</P>
      <P>Planned exists to support families in this work — not to replace them, but to walk alongside them as a patient, trustworthy guide.</P>
    </div>
  );
}

function Education() {
  return (
    <div className="space-y-4">
      <Emphasis>Knowledge changes outcomes. Understanding changes lives.</Emphasis>
      <P>Financial literacy is not a subject to be memorized — it is a practice to be lived. Reading about compound growth teaches a concept. Watching your own savings grow through compound growth teaches a lesson that lasts a lifetime.</P>
      <P>This is why Planned pairs every lesson with a real action. When a child learns about budgeting, they can apply it to their own spending categories. When they learn about delayed gratification, they can practice it with their own goals. Education becomes experience, and experience becomes wisdom.</P>
      <P>Teaching children about money matters because the habits formed in childhood become the decisions of adulthood. A child who understands risk makes better investment choices. A child who understands compound growth starts saving earlier. A child who understands needs versus wants makes more intentional purchases.</P>
      <P>And this education extends beyond one generation. A parent who learns alongside their child passes that knowledge forward. The lessons learned today become the wisdom shared tomorrow.</P>
    </div>
  );
}

function Habits() {
  return (
    <div className="space-y-4">
      <Emphasis>We are what we repeatedly do. Excellence, then, is not an act, but a habit.</Emphasis>
      <P>Saving is a habit. Goal-setting is a habit. Reflection is a habit. Intentionality is a habit. And habits, once formed, operate automatically — shaping our financial decisions long after the initial effort has faded.</P>
      <P>The power of habits lies in compounding. Saving UGX 500 every week seems small. But over a year, it becomes UGX 26,000. Over ten years, it becomes UGX 260,000 — and that is before compound growth. The habit itself is worth more than any single amount saved.</P>
      <P>Planned is designed to help families build these habits gently, without pressure or shame. Saving streaks recognize consistency, not amount. Goals give purpose to saving. Lessons give understanding to actions. Reflection prompts encourage thoughtfulness.</P>
      <P>The goal is not to make families save more money. The goal is to help families become people who save — people for whom saving is as natural as breathing.</P>
    </div>
  );
}

function Trust() {
  return (
    <div className="space-y-4">
      <Emphasis>Trust is earned slowly, maintained intentionally, and lost in moments.</Emphasis>
      <P>Families entrust Planned with something precious: their children's financial education and their family's financial behaviors. This trust is not given lightly, and it must never be taken for granted.</P>
      <P>Trust means privacy. Family data is never sold, never shared with advertisers, and never used to profile sensitive characteristics. What families do within Planned stays within Planned.</P>
      <P>Trust means transparency. Every recommendation explains itself. Every AI insight shows its reasoning. Every score reveals how it was calculated. No black boxes. No hidden agendas.</P>
      <P>Trust means safety. Children are protected from shaming, from negative comparisons, from addictive patterns. The AI coach never gives investment advice. Parents are always in control.</P>
      <P>Trust must be earned continuously — not once, but every day, through every interaction, every decision, and every line of code.</P>
    </div>
  );
}

function Responsibility() {
  const responsibilities = [
    "To families: to provide a product that is calm, educational, and trustworthy — never manipulative, never addictive, never shaming.",
    "To children: to teach with patience, to encourage without pressure, and to protect their privacy and dignity above all else.",
    "To educators: to provide content that is accurate, age-appropriate, and grounded in real financial principles.",
    "To future generations: to build systems that endure — that the families who trust us today can still rely on decades from now.",
    "To society: to contribute to a world where financial literacy is common, not rare; where families talk about money openly, not fearfully.",
  ];
  return (
    <div className="space-y-4">
      <Emphasis>With the privilege of influencing families comes the obligation of stewardship.</Emphasis>
      {responsibilities.map((r, i) => (
        <div key={i} className="flex items-start gap-3 text-sm text-foreground/65 leading-relaxed">
          <span className="font-editorial text-sm shrink-0" style={{ color: "var(--primary)" }}>{i + 1}.</span>
          <span>{r}</span>
        </div>
      ))}
    </div>
  );
}

function Hope() {
  return (
    <div className="space-y-4">
      <Emphasis>We hope for a future where financial wellbeing is common, not rare — where families build wealth with intention, not accident.</Emphasis>
      <P>We imagine a child who learns to save at age seven and never stops. A child who, at twelve, understands compound growth not as a formula but as a lived experience. A child who, at eighteen, enters adulthood with financial confidence, not anxiety.</P>
      <P>We imagine a family that saves together — not under pressure, but with purpose. Parents who talk about money with their children openly and without shame. Children who ask questions, set goals, and learn from both successes and mistakes.</P>
      <P>We imagine young adults who make informed decisions — who understand risk before they invest, who understand budgeting before they borrow, who understand delayed gratification before they face temptation.</P>
      <P>We imagine communities where financial literacy is shared knowledge — where families help each other, where schools teach practical money skills, where the next generation inherits not merely money, but wisdom.</P>
      <P>This is the future we hope to help create. Not through grand gestures, but through small, consistent actions — one family, one child, one habit at a time.</P>
    </div>
  );
}

function Success() {
  return (
    <div className="space-y-4">
      <Emphasis>Success is not measured in downloads, users, or revenue. Success is measured in lives changed.</Emphasis>
      <P>Success is a child who saves consistently — not because they are forced to, but because they have learned that saving is what they do.</P>
      <P>Success is a family that talks about money — not with anxiety, but with intention. Parents who guide. Children who ask. Conversations that build understanding.</P>
      <P>Success is a goal completed — not because the amount was large, but because the habit was strong. The UGX 50,000 bicycle saved over six months teaches more about wealth-building than any lecture ever could.</P>
      <P>Success is a lesson completed — not because the quiz was passed, but because the concept was understood and applied to real life.</P>
      <P>Success is trust earned and kept — families who recommend Planned to other families because it helped them, not because they were asked to.</P>
      <P>Success is healthy habits compounding over years — the quiet, invisible accumulation of discipline that one day becomes financial freedom.</P>
    </div>
  );
}

function Commitment() {
  const commitments = [
    "We commit to education — to teaching financial concepts through action, not merely words.",
    "We commit to trust — to earning it every day through transparency, privacy, and safety.",
    "We commit to privacy — to never selling data, never profiling sensitive characteristics, and always giving families control.",
    "We commit to security — to protecting family data with the highest standards of encryption and access control.",
    "We commit to professionalism — to building a product that feels like a private bank, not a casino.",
    "We commit to stewardship — to designing for decades, not quarters. For generations, not metrics.",
    "We commit to long-term thinking — to evaluating every decision on a twenty-year horizon.",
    "We commit to continuous learning — to improving the product, the content, and ourselves without end.",
  ];
  return (
    <div className="space-y-3">
      <Emphasis>These commitments are not marketing. They are obligations.</Emphasis>
      {commitments.map((c, i) => (
        <div key={i} className="flex items-start gap-3 text-sm text-foreground/65 leading-relaxed">
          <Hand className="h-3 w-3 shrink-0 mt-1" style={{ color: "var(--primary)" }} />
          <span>{c}</span>
        </div>
      ))}
    </div>
  );
}

function Humility() {
  return (
    <div className="space-y-4">
      <Emphasis>We acknowledge that technology cannot solve everything — that every family is different, and that outcomes cannot be guaranteed.</Emphasis>
      <P>We know that an app cannot replace a parent's guidance. That a lesson cannot replace a conversation. That a habit tracker cannot replace the internal motivation to change.</P>
      <P>We know that every family's financial situation is unique — that what works for one may not work for another. That some families face challenges no app can address. That financial literacy alone does not create financial wellbeing.</P>
      <P>We know that we will make mistakes — that some features will not work as intended, that some content will need revision, that some decisions will prove wrong in hindsight. We commit to learning from these mistakes transparently and improving continuously.</P>
      <P>We know that learning is lifelong — for the families we serve, and for us. The financial world will change. Technology will change. Society will change. Planned must change with them, while holding fast to the principles that do not change.</P>
      <P>We approach this work with humility — knowing that we are not the answer, but that we can be a helpful guide on a family's journey.</P>
    </div>
  );
}

function Closing() {
  return (
    <div className="space-y-4 text-center">
      <div className="ornamental-rule max-w-xs mx-auto mb-4">
        <span className="ornamental-diamond" />
      </div>
      <Emphasis>Planned exists to help families build wealth with intention — one habit, one goal, one lesson at a time.</Emphasis>
      <P>We accept the responsibility of being trusted with families' financial education. We commit to earning that trust every day. We hope to be a patient, trustworthy guide on the journey toward financial wellbeing.</P>
      <P>We do not seek to be the biggest. We seek to be the most trusted. We do not seek to be the loudest. We seek to be the most thoughtful. We do not seek to be the fastest. We seek to be the most enduring.</P>
      <P className="font-editorial text-lg text-gold-foil-static italic">
        May the families who trust us today still find us trustworthy twenty years from now.
        May the children who learn with us today become the parents who teach with us tomorrow.
        May the habits formed here compound into lives of financial peace, purpose, and possibility.
      </P>
      <div className="ornamental-rule max-w-xs mx-auto mt-4">
        <span className="ornamental-diamond" />
      </div>
    </div>
  );
}
