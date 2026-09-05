import { LegalPage } from "@/components/marketing/Shell";
export const metadata = { title: "Support" };
export default function Support() {
  return (
    <LegalPage title="Support" updated="March 2026">
      <p>We&rsquo;re a small team and we read everything.</p>
      <h2>Common questions</h2>
      <p><strong>A child forgot their password.</strong> A parent can set a new one from Children → the child → Reset password. Their other devices are signed out automatically.</p>
      <p><strong>An allowance didn&rsquo;t pay.</strong> Allowances are paid from the family pool. If the pool doesn&rsquo;t have enough, the payment waits and the dashboard tells you. Add funds under Transactions → Add to pool.</p>
      <p><strong>I made a mistake in a transaction.</strong> Parents can reverse any transaction from the Transactions page. The original stays in the ledger marked as reversed, and an opposite entry is added — nothing is silently edited.</p>
      <p><strong>I want my data.</strong> Settings → Data → Export gives you a JSON file with everything.</p>
      <p><strong>I want to leave.</strong> Settings → Data → Delete family. It&rsquo;s immediate and complete.</p>
      <h2>Contact</h2>
      <p>Email <a href="mailto:hello@planned.family" className="underline">hello@planned.family</a>. For security issues, put &ldquo;Security&rdquo; in the subject line.</p>
    </LegalPage>
  );
}
