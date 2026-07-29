// Einfache, inline-gestylte HTML-E-Mail-Templates (bewusst ohne zusätzliche
// Template-Engine/Abhängigkeit) im mk | hotels-Look.

function layout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background-color:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background-color:#8b2635;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;">mk | hotels</span>
                <span style="color:#f3d9dc;font-size:14px;">&nbsp; Firmenraten</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e7e5e4;font-size:12px;color:#78716c;">
                mk | hotels &middot; diese E-Mail wurde automatisch generiert.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(url: string, label: string): string {
  return `<p style="text-align:center;margin:28px 0;">
    <a href="${url}" style="background-color:#8b2635;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">${label}</a>
  </p>`;
}

type ContractLanguage = "DE" | "EN";

export function draftContractEmail(opts: {
  contactFirstName: string;
  companyName: string;
  contractNumber: string;
  language: ContractLanguage;
  link: string;
}) {
  const { contactFirstName, companyName, contractNumber, language, link } = opts;

  if (language === "EN") {
    return {
      subject: `Your mk | hotels corporate rate agreement (${contractNumber})`,
      html: layout(`
        <p>Dear ${contactFirstName},</p>
        <p>thank you for your interest in a corporate rate agreement with mk | hotels for <strong>${companyName}</strong>.</p>
        <p>Please review the draft agreement and sign it online using the button below. No password required &ndash; the link logs you in directly.</p>
        ${button(link, "Review & sign agreement")}
        <p>The link is valid for 7 days. If you have any questions, just reply to this email.</p>
        <p>Best regards<br/>mk | hotels</p>
      `),
    };
  }

  return {
    subject: `Ihr Firmenraten-Vertrag bei mk | hotels (${contractNumber})`,
    html: layout(`
      <p>Sehr geehrte(r) ${contactFirstName},</p>
      <p>vielen Dank für Ihr Interesse an einem Firmenraten-Vertrag mit mk | hotels für <strong>${companyName}</strong>.</p>
      <p>Bitte prüfen Sie den Vertragsentwurf und unterschreiben Sie ihn online über den folgenden Button. Ein Passwort benötigen Sie nicht &ndash; der Link meldet Sie direkt an.</p>
      ${button(link, "Vertrag prüfen & unterschreiben")}
      <p>Der Link ist 7 Tage gültig. Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
      <p>Mit freundlichen Grüßen<br/>mk | hotels</p>
    `),
  };
}

export function finalContractEmail(opts: {
  contactFirstName: string;
  companyName: string;
  contractNumber: string;
  language: ContractLanguage;
  link: string;
}) {
  const { contactFirstName, companyName, contractNumber, language, link } = opts;

  if (language === "EN") {
    return {
      subject: `Your signed corporate rate agreement (${contractNumber})`,
      html: layout(`
        <p>Dear ${contactFirstName},</p>
        <p>your corporate rate agreement for <strong>${companyName}</strong> has been finalized on both sides and is now active.</p>
        ${button(link, "View agreement")}
        <p>Best regards<br/>mk | hotels</p>
      `),
    };
  }

  return {
    subject: `Ihr unterschriebener Firmenraten-Vertrag (${contractNumber})`,
    html: layout(`
      <p>Sehr geehrte(r) ${contactFirstName},</p>
      <p>Ihr Firmenraten-Vertrag für <strong>${companyName}</strong> wurde beidseitig finalisiert und ist ab sofort aktiv.</p>
      ${button(link, "Vertrag ansehen")}
      <p>Mit freundlichen Grüßen<br/>mk | hotels</p>
    `),
  };
}

export function newRequestInternalEmail(opts: {
  requestNumber: string;
  companyName: string;
  contactName: string;
  link: string;
}) {
  const { requestNumber, companyName, contactName, link } = opts;
  return {
    subject: `Neue Firmenraten-Anfrage: ${companyName} (${requestNumber})`,
    html: layout(`
      <p>Neue Anfrage über das öffentliche Formular eingegangen:</p>
      <p><strong>${companyName}</strong><br/>Ansprechpartner: ${contactName}<br/>Anfragenummer: ${requestNumber}</p>
      ${button(link, "Anfrage öffnen")}
    `),
  };
}

export function readyForFinalizationInternalEmail(opts: {
  contractNumber: string;
  companyName: string;
  link: string;
}) {
  const { contractNumber, companyName, link } = opts;
  return {
    subject: `Vertrag bereit zur Finalisierung: ${companyName} (${contractNumber})`,
    html: layout(`
      <p>Alle nötigen Unterschriften liegen vor. Der Vertrag kann finalisiert werden:</p>
      <p><strong>${companyName}</strong><br/>Vertragsnummer: ${contractNumber}</p>
      ${button(link, "Vertrag finalisieren")}
    `),
  };
}
