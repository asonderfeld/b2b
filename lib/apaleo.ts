import type { Company } from "@prisma/client";

/**
 * Apaleo-Integrationspunkt (Platzhalter).
 *
 * In diesem Environment steht kein Apaleo-API-Zugang zur Verfügung, daher
 * wird hier ausschließlich geloggt und kommentiert, WAS an dieser Stelle
 * technisch zu tun wäre. Die tatsächliche Anbindung sollte die Apaleo
 * Rate-Plans / Companies API nutzen (siehe apaleo.com/docs), um:
 *
 *  - ein Apaleo "Company"-Objekt für die Firma anzulegen bzw. zu aktualisieren
 *  - die Firmenraten (Rate) als Corporate Rate Plan / Corporate Code in Apaleo
 *    zu hinterlegen, sobald ein Vertrag den Status RUNNING erreicht
 *
 * TODO (Apaleo-Live-Anbindung):
 *  1. OAuth2 Client-Credentials-Flow gegen https://identity.apaleo.com einrichten
 *  2. POST https://api.apaleo.com/finance/v1/companies (oder PUT bei Update)
 *  3. apaleoId / apaleoCode am Company-Datensatz speichern
 *  4. Fehlerfälle (Rate Limits, Validierung) behandeln und Retry/Queue einbauen
 */
export async function pushCompanyToApaleo(company: Company): Promise<void> {
  // TODO: echten Apaleo-API-Call implementieren, sobald Zugangsdaten vorliegen.
  console.log(
    `[apaleo] TODO: Firma "${company.name}" (${company.customerNumber}) würde jetzt ` +
      `an Apaleo übertragen werden (apaleoId=${company.apaleoId ?? "n/a"}).`,
  );
}
