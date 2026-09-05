import { LegalPage } from "@/components/marketing/Shell";
export const metadata = { title: "Security" };
export default function Security() {
  return (
    <LegalPage title="How Planned protects your family's records" updated="March 2026">
      <p>This page describes what we actually built. It&rsquo;s written for parents who want to know, not as marketing.</p>
      <h2>Money is a ledger</h2>
      <p>Every movement of money is a transaction row with a source, destination, amount, kind and who caused it. Account balances are cached for speed but derived from the ledger, and a reconciliation check compares the two. Amounts are stored as integers in minor units — never as floating point.</p>
      <h2>Nothing happens twice</h2>
      <p>Every money action carries an idempotency key that is unique within your family. Paying an allowance is keyed on the allowance and the period; approving a request is keyed on the request. Retries, double taps and duplicate network requests return the original result instead of creating a second one. Account rows are locked in a fixed order inside a database transaction so concurrent requests can&rsquo;t overdraw.</p>
      <h2>Rules run on the server</h2>
      <p>Spending limits, approval thresholds and goal-withdrawal rules are enforced in the API, not in the browser. A child&rsquo;s device cannot skip them.</p>
      <h2>Authorisation on every request</h2>
      <p>Each request resolves the signed-in user, their family and their role from the session — never from IDs supplied by the client. Children can act only on their own accounts. Parents can act within their own family only.</p>
      <h2>Sessions and passwords</h2>
      <ul>
        <li>Passwords are hashed with scrypt (N=16384). We never store or log them.</li>
        <li>Sessions are random 256-bit tokens stored hashed in the database, delivered as HttpOnly, SameSite=Lax cookies, and expire after 14 days. You can sign out every other device from Settings.</li>
        <li>Eight failed sign-ins lock an account for fifteen minutes. Sign-in, sign-up and reset endpoints are rate limited.</li>
        <li>Mutating requests must come from the same origin (Origin/Host check) in addition to the cookie policy.</li>
      </ul>
      <h2>Audit trail</h2>
      <p>Sign-ins (including failures), password changes, family and child creation, allowance and rule changes, every transaction, every approval decision and every settings change are logged with actor, time, IP and browser.</p>
      <h2>Provider keys</h2>
      <p>If you configure a language-model provider, the API key is encrypted with AES-256-GCM before it&rsquo;s stored and is only ever shown masked. Only aggregate figures are sent to the provider, and the model cannot perform any action in Planned.</p>
      <h2>Reporting a problem</h2>
      <p>If you believe you&rsquo;ve found a vulnerability, please contact us through <a href="/support" className="underline">support</a> before disclosing it publicly. We&rsquo;ll acknowledge within two working days.</p>
    </LegalPage>
  );
}
