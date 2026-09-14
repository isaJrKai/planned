import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL ?? "Planned <no-reply@planned.app>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    // Dev mode: log the email instead of sending
    console.log(`[email] To: ${to} | Subject: ${subject}\n${html}`);
    return { id: "dev-mode" };
  }
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });
  if (error) throw error;
  return data;
}
