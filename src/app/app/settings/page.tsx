import { requireParent } from "@/lib/auth";
import { getRules } from "@/lib/family";
import { resolveAiConfig } from "@/lib/ai";
import { maskKey } from "@/lib/crypto";
import { PageHeader } from "@/components/app/Shell";
import { RulesForm, PasswordForm, SessionsPanel, AiSettingsForm, DataSection } from "@/components/app/Actions";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { relDate } from "@/lib/format";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const v = await requireParent();
  const [rules, ai, audit] = await Promise.all([getRules(v.family.id), resolveAiConfig(v.family.id), db.select().from(auditLog).where(eq(auditLog.familyId, v.family.id)).orderBy(desc(auditLog.createdAt)).limit(15)]);
  const Section = ({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) => (
    <section id={id} className="py-10 border-t border-line first:border-t-0 first:pt-0 grid gap-6 lg:grid-cols-[240px_1fr]">
      <div><h2 className="text-[18px] font-semibold">{title}</h2>{sub && <p className="text-[14px] text-ink-3 mt-1">{sub}</p>}</div>
      <div>{children}</div>
    </section>
  );
  return (
    <div className="rise">
      <PageHeader title="Settings" sub={`${v.family.name} · ${v.family.currency}`} />
      <Section id="rules" title="Family rules" sub="Enforced by the server on every request a child makes.">
        <RulesForm currency={v.family.currency} rules={rules} />
      </Section>
      <Section id="security" title="Security" sub="Your password and where you're signed in.">
        <div className="space-y-8"><PasswordForm /><div><p className="text-[14px] font-medium mb-2">Active sessions</p><SessionsPanel /></div></div>
      </Section>
      <Section id="intelligence" title="Explanations" sub="Optional. Plain-language summaries of your numbers.">
        <AiSettingsForm initial={{ enabled: ai.enabled, baseUrl: ai.baseUrl, model: ai.model, keyMasked: ai.apiKey ? maskKey(ai.apiKey) : null, source: ai.source }} />
      </Section>
      <Section id="data" title="Your data" sub="Export or delete everything. Your call, always.">
        <DataSection familyName={v.family.name} />
      </Section>
      <Section id="audit" title="Recent account activity" sub="Who did what, and when. Kept for your protection.">
        <ul className="divide-y divide-line text-[14px] max-w-lg">
          {audit.map((a) => <li key={a.id} className="py-2 flex justify-between gap-3"><span className="font-mono text-[13px] text-ink-2">{a.action}</span><span className="text-ink-3 shrink-0">{a.ip ?? ""} · {relDate(a.createdAt)}</span></li>)}
          {!audit.length && <li className="py-2 text-ink-3">Nothing yet.</li>}
        </ul>
      </Section>
    </div>
  );
}
