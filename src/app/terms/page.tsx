import { LegalPage } from "@/components/marketing/Shell";
export const metadata = { title: "Terms of service" };
export default function Terms() {
  return (
    <LegalPage title="Terms of service" updated="March 2026">
      <p>These terms are short on purpose. If anything here is unclear, ask us before you rely on it.</p>
      <h2>What Planned is</h2>
      <p>Planned is a record-keeping and learning tool for families. It tracks allowances, goals and spending that you enter. <strong>Planned is not a bank, does not hold money, and does not move real funds.</strong> Balances in Planned represent agreements within your family.</p>
      <h2>Who can use it</h2>
      <p>Families are created by an adult parent or guardian. Children use Planned under that adult&rsquo;s account and supervision. The parent is responsible for the accuracy of the records and for decisions made using them.</p>
      <h2>Your responsibilities</h2>
      <ul>
        <li>Keep passwords private and choose reasonable ones for children.</li>
        <li>Don&rsquo;t try to access other families&rsquo; data or interfere with the service.</li>
        <li>Review the intelligence features&rsquo; output before acting on it. It explains your numbers; it doesn&rsquo;t make decisions.</li>
      </ul>
      <h2>Our responsibilities</h2>
      <p>We will keep your data secure using reasonable industry practice, tell you promptly if we learn of a breach affecting you, and give you the means to export and delete your data at any time.</p>
      <h2>Availability and changes</h2>
      <p>Planned is in early access and provided as-is. We may change features. If we ever discontinue the service we will give at least 60 days&rsquo; notice and keep export available throughout.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, Planned is not liable for financial decisions made using the app or for indirect losses. Nothing in these terms limits liability that cannot legally be limited.</p>
      <h2>Ending the agreement</h2>
      <p>You can delete your family at any time from Settings. We may suspend accounts that abuse the service, with notice where practical.</p>
    </LegalPage>
  );
}
