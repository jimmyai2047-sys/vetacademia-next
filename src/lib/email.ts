import { Resend } from "resend";
import { env } from "./env";

/**
 * Email sender (Resend). Fail-soft by design: without RESEND_API_KEY it logs
 * and returns { sent: false } instead of throwing — features using email must
 * never break when the key isn't configured yet.
 */
interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function emailConfigured(): boolean {
  return !!env.RESEND_API_KEY;
}

export function emailFrom(): string {
  return env.EMAIL_FROM || "VetAcademia <onboarding@resend.dev>";
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ sent: boolean; id?: string }> {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", input.to);
    return { sent: false };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      console.error("[email] send error:", error);
      return { sent: false };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("[email] send exception:", err);
    return { sent: false };
  }
}
