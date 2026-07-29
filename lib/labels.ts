// Deutsche UI-Labels und Farbzuordnungen für die Enums aus dem Prisma-Schema.
// Die Farben orientieren sich an den Vorgaben aus dem UMNION-Altsystem.

export const companyStatusLabels: Record<string, string> = {
  INTERESSENT: "Interessent",
  ZIELKUNDE: "Zielkunde",
  KUNDE: "Kunde",
  DIENSTLEISTER: "Dienstleister",
  KOOPERATIONSPARTNER: "Kooperationspartner",
  EHEMALIGER_KUNDE: "Ehemaliger Kunde",
  VEREIN: "Verein",
};

export const salutationLabels: Record<string, string> = {
  HERR: "Herr",
  FRAU: "Frau",
  DIVERS: "Divers",
};

export const titleLabels: Record<string, string> = {
  DR: "Dr.",
  PROF: "Prof.",
  PROF_DR: "Prof. Dr.",
};

export const rateTierLabels: Record<string, string> = {
  RATE_GE_200: "Rate 1 (≥ 200 Nächte)",
  RATE_GE_100: "Rate 2 (≥ 100 Nächte)",
  RATE_GE_50: "Rate 3 (≥ 50 Nächte)",
  CULTURE: "Kultur",
};

export const requestSourceLabels: Record<string, string> = {
  VENDITO: "Vendito",
  VERTRIEBSPARTNER: "Vertriebspartner",
  WEBSITE: "Website",
  EVENTMACHINE: "Eventmachine",
  EMPFEHLUNG: "Empfehlung",
  MESSE: "Messe",
  KALTAKQUISE: "Kaltakquise",
  ONLINE_WERBUNG: "Online-Werbung",
  PRESSE: "Presse",
  PERSOENLICHES_UMFELD: "Persönliches Umfeld",
  SONSTIGE: "Sonstige",
};

export const requestStatusLabels: Record<string, string> = {
  NEW: "Neu",
  IN_REVIEW: "In Prüfung",
  OFFER_SENT: "Angebot gesendet",
  CONVERTED: "Umgewandelt",
  REJECTED: "Abgelehnt",
};

export const requestStatusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  OFFER_SENT: "bg-purple-100 text-purple-800",
  CONVERTED: "bg-green-100 text-green-800",
  REJECTED: "bg-neutral-200 text-neutral-600",
};

export const contractStatusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  AWAITING_SIGNATURE: "Warten auf Unterschrift",
  AWAITING_FINALIZATION: "Warten auf Finalisierung",
  RUNNING: "Laufend",
  ENDED: "Beendet",
  NOT_CONCLUDED: "Nicht zustande gekommen",
};

// Farben wie im Altsystem: DRAFT orange, AWAITING_SIGNATURE blau,
// AWAITING_FINALIZATION orange, RUNNING grün, ENDED/NOT_CONCLUDED grau.
export const contractStatusColors: Record<string, string> = {
  DRAFT: "bg-orange-100 text-orange-800",
  AWAITING_SIGNATURE: "bg-blue-100 text-blue-800",
  AWAITING_FINALIZATION: "bg-orange-100 text-orange-800",
  RUNNING: "bg-green-100 text-green-800",
  ENDED: "bg-neutral-200 text-neutral-600",
  NOT_CONCLUDED: "bg-neutral-200 text-neutral-600",
};

export const contractStageLabels: Record<string, string> = {
  STAGE_0_REQUEST_RECEIVED: "0 – Anfrage eingegangen",
  STAGE_1_DRAFT_CREATED: "1 – Entwurf erstellt",
  STAGE_2_SENT_EXISTING_CUSTOMER: "2 – An Bestandskunden gesendet",
  STAGE_2_SENT_NEW_CUSTOMER: "2 – An Neukunden gesendet",
  STAGE_3_OFFER_ACCEPTED: "3 – Angebot angenommen",
  STAGE_4_FINAL_CREATED: "4 – Finaler Vertrag erstellt",
  STAGE_5_FINAL_SENT: "5 – Finaler Vertrag gesendet",
};

export const contractLanguageLabels: Record<string, string> = {
  DE: "Deutsch",
  EN: "Englisch",
};

export const formalAddressLabels: Record<string, string> = {
  SIE: "Sie",
  DU: "Du",
};

export const userRoleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  SALES: "Vertrieb",
  CUSTOMER: "Firmenkunde",
};

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
