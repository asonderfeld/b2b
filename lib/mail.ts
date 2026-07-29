import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const FROM = process.env.MAIL_FROM || "mk | hotels Firmenraten <vertraege@mkhotels.de>";

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Dünner Wrapper um Resend. Ohne konfigurierten RESEND_API_KEY (z.B. lokale
 * Entwicklung ohne eigenen Resend-Account) wird die Mail nur geloggt, statt
 * einen Fehler zu werfen – damit der restliche Workflow trotzdem testbar
 * bleibt.
 */
export async function sendMail({ to, subject, html, replyTo }: SendMailInput): Promise<void> {
  const client = getClient();
  const recipients = Array.isArray(to) ? to : [to];

  if (!client) {
    console.warn(
      `[mail] RESEND_API_KEY ist nicht gesetzt – Mail an ${recipients.join(", ")} wird nur geloggt.\n` +
        `Betreff: ${subject}`,
    );
    return;
  }

  const { error } = await client.emails.send({
    from: FROM,
    to: recipients,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    console.error("[mail] Versand fehlgeschlagen:", error);
    throw new Error(`E-Mail-Versand fehlgeschlagen: ${error.message}`);
  }
}

/**
 * Interne Empfänger (Vertrieb/Admin) für Benachrichtigungsmails wie "neue
 * Anfrage eingegangen" oder "Vertrag bereit zur Finalisierung".
 *
 * Nutzt SALES_NOTIFICATION_EMAIL (kommagetrennte Liste), falls gesetzt –
 * andernfalls alle Nutzer mit Rolle ADMIN/SALES aus der Datenbank.
 */
export async function getInternalRecipients(): Promise<string[]> {
  const envValue = process.env.SALES_NOTIFICATION_EMAIL;
  if (envValue) {
    return envValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SALES"] } },
    select: { email: true },
  });
  return users.map((u) => u.email);
}
