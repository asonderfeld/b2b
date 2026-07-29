/**
 * Migrations-/Importskript aus dem UMNION-Altsystem.
 *
 * WICHTIG: Aus diesem Environment heraus besteht KEIN direkter Datenbank-
 * Zugriff auf UMNION. Es steht lediglich ein MCP-Connector mit sehr
 * eingeschränkten Objekttypen zur Verfügung, der KEINE Export-Funktion für
 * Unternehmen, Kontakte, Verträge oder Firmenraten bietet. Die CSV-Dateien in
 * diesem Verzeichnis sind daher nur BEISPIEL-/MUSTER-Dateien mit der
 * erwarteten Spaltenstruktur (deutsche Altsystem-Feldnamen).
 *
 * Vorgehen für die echte Migration:
 *  1. In UMNION je Objekttyp (Unternehmen, Kontakte, Hotels, Firmenraten,
 *     Verträge, Vertragsbedingungen) einen manuellen CSV-Export durchführen.
 *  2. Die exportierten CSV-Dateien unter genau diesen Dateinamen in
 *     prisma/import/ ablegen (Spaltenüberschriften müssen exakt passen,
 *     siehe die Beispieldateien in diesem Ordner).
 *  3. Ausführen mit:  npx tsx prisma/import/run.ts
 *
 * Die Reihenfolge (Hotels/Companies zuerst, dann Contacts/Rates, dann
 * Contracts/Terms zuletzt) ist wichtig, da spätere Schritte auf bereits
 * importierte Datensätze referenzieren (per Name/E-Mail).
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient, type CompanyStatus, type Salutation, type Title, type FormalAddress, type RateTier, type RateStatus, type ContractStatus, type ContractStage, type ContractLanguage, type ContractTermLanguage } from "@prisma/client";

const prisma = new PrismaClient();
const importDir = path.join(__dirname);

function readCsv(filename: string): Record<string, string>[] {
  const filePath = path.join(importDir, filename);
  if (!existsSync(filePath)) {
    console.warn(`Übersprungen: ${filename} nicht gefunden.`);
    return [];
  }
  const content = readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

const companyStatusMap: Record<string, CompanyStatus> = {
  Interessent: "INTERESSENT",
  Zielkunde: "ZIELKUNDE",
  Kunde: "KUNDE",
  Dienstleister: "DIENSTLEISTER",
  Kooperationspartner: "KOOPERATIONSPARTNER",
  "Ehemaliger Kunde": "EHEMALIGER_KUNDE",
  Verein: "VEREIN",
};

const salutationMap: Record<string, Salutation> = {
  Herr: "HERR",
  Frau: "FRAU",
  Divers: "DIVERS",
};

const titleMap: Record<string, Title> = {
  "Dr.": "DR",
  Dr: "DR",
  "Prof.": "PROF",
  Prof: "PROF",
  "Prof. Dr.": "PROF_DR",
};

const formalAddressMap: Record<string, FormalAddress> = {
  Sie: "SIE",
  Du: "DU",
};

const rateTierMap: Record<string, RateTier> = {
  "Rate 1": "RATE_GE_200",
  "Rate 2": "RATE_GE_100",
  "Rate 3": "RATE_GE_50",
  Kultur: "CULTURE",
};

const rateStatusMap: Record<string, RateStatus> = {
  Aktiv: "ACTIVE",
  Inaktiv: "INACTIVE",
};

const contractStatusMap: Record<string, ContractStatus> = {
  Entwurf: "DRAFT",
  "Wartet auf Unterschrift": "AWAITING_SIGNATURE",
  "Wartet auf Finalisierung": "AWAITING_FINALIZATION",
  Laufend: "RUNNING",
  Beendet: "ENDED",
  "Nicht zustande gekommen": "NOT_CONCLUDED",
};

const contractStageMap: Record<string, ContractStage> = {
  "0": "STAGE_0_REQUEST_RECEIVED",
  "1": "STAGE_1_DRAFT_CREATED",
  "2": "STAGE_2_SENT_EXISTING_CUSTOMER",
  "3": "STAGE_3_OFFER_ACCEPTED",
  "4": "STAGE_4_FINAL_CREATED",
  "5": "STAGE_5_FINAL_SENT",
};

const contractLanguageMap: Record<string, ContractLanguage> = {
  Deutsch: "DE",
  Englisch: "EN",
};

const contractTermLanguageMap: Record<string, ContractTermLanguage> = {
  DE: "DE",
  EN: "EN",
};

let customerNumberCounter = 0;

async function nextCustomerNumber(): Promise<string> {
  if (customerNumberCounter === 0) {
    customerNumberCounter = await prisma.company.count();
  }
  customerNumberCounter += 1;
  return `KD${String(customerNumberCounter).padStart(6, "0")}`;
}

async function importCompanies() {
  const rows = readCsv("companies.csv");
  for (const row of rows) {
    const status = companyStatusMap[row["Status"]] ?? "INTERESSENT";
    const existing = await prisma.company.findFirst({ where: { name: row["Firma"] } });
    const customerNumber = existing?.customerNumber ?? (await nextCustomerNumber());

    await prisma.company.upsert({
      where: { id: existing?.id ?? "__none__" },
      update: {},
      create: {
        customerNumber,
        status,
        name: row["Firma"],
        nameAddition: row["Firma Zusatz"] || null,
        street: row["Straße/Nr."],
        zip: row["PLZ"],
        city: row["Ort"],
        country: row["Land"] || "Deutschland",
        emailGeneral: row["E-Mail (allgemein)"] || null,
        emailInvoice: row["E-Mail (Rechnung)"],
        vatId: row["USt-IdNr"],
        phone: row["Telefon"] || null,
        website: row["Website"] || null,
        apaleoId: row["ID (Apaleo)"] || null,
        apaleoCode: row["Code (Apaleo)"] || null,
      },
    }).catch(async () => {
      // Existierte schon (Name-Kollision) -> nur wichtige Felder aktualisieren.
      if (existing) {
        await prisma.company.update({ where: { id: existing.id }, data: { status } });
      }
    });
  }
  console.log(`Unternehmen importiert: ${rows.length}`);
}

async function importContacts() {
  const rows = readCsv("contacts.csv");
  for (const row of rows) {
    const company = await prisma.company.findFirst({ where: { name: row["Firma"] } });
    if (!company) {
      console.warn(`Kontakt übersprungen (Firma nicht gefunden): ${row["Firma"]}`);
      continue;
    }

    const existing = await prisma.contact.findFirst({
      where: { companyId: company.id, email: row["E-Mail"] },
    });

    const data = {
      companyId: company.id,
      salutation: salutationMap[row["Anrede"]] ?? "HERR",
      title: titleMap[row["Titel"]] ?? null,
      firstName: row["Vorname"],
      lastName: row["Nachname"],
      position: row["Position"],
      department: row["Abteilung"] || null,
      email: row["E-Mail"],
      phone: row["Telefon"],
      phoneMobile: row["Mobiltelefon"] || null,
      formalAddress: formalAddressMap[row["Anredeform"]] ?? "SIE",
    };

    if (existing) {
      await prisma.contact.update({ where: { id: existing.id }, data });
    } else {
      await prisma.contact.create({ data });
    }
  }
  console.log(`Kontakte importiert: ${rows.length}`);
}

async function importHotels() {
  const rows = readCsv("hotels.csv");
  for (const row of rows) {
    const existing = await prisma.hotel.findFirst({ where: { name: row["Name"] } });
    const data = {
      name: row["Name"],
      street: row["Straße/Nr."],
      zip: row["PLZ"],
      city: row["Ort"],
      country: row["Land"] || "Deutschland",
      category: row["Kategorie"] || null,
      apaleoId: row["ID (Apaleo)"] || null,
      apaleoCode: row["Code (Apaleo)"] || null,
      currency: row["Währung"] || "EUR",
      website: row["Website"] || null,
      reservationPhone: row["Reservierung Telefon"] || null,
      reservationEmail: row["Reservierung E-Mail"] || null,
      activeForCorporateRates: (row["Aktiv für Firmenraten"] || "Ja").toLowerCase() === "ja",
    };
    if (existing) {
      await prisma.hotel.update({ where: { id: existing.id }, data });
    } else {
      await prisma.hotel.create({ data });
    }
  }
  console.log(`Hotels importiert: ${rows.length}`);
}

async function importRates() {
  const rows = readCsv("rates.csv");
  for (const row of rows) {
    const hotel = await prisma.hotel.findFirst({ where: { name: row["Hotel"] } });
    if (!hotel) {
      console.warn(`Rate übersprungen (Hotel nicht gefunden): ${row["Hotel"]}`);
      continue;
    }
    await prisma.rate.create({
      data: {
        hotelId: hotel.id,
        year: Number(row["Jahr"]),
        status: rateStatusMap[row["Status"]] ?? "ACTIVE",
        rateTier: rateTierMap[row["Ratenstufe"]] ?? "RATE_GE_50",
        rateName: row["Zimmerrate"],
        rateName2: row["Zimmerrate 2"] || null,
        breakfastPricePerPerson: row["Frühstückspreis"] ? Number(row["Frühstückspreis"]) : null,
        roomNightsFrom: row["Übernachtungen von"] ? Number(row["Übernachtungen von"]) : null,
        roomNightsTo: row["Übernachtungen bis"] ? Number(row["Übernachtungen bis"]) : null,
      },
    });
  }
  console.log(`Firmenraten importiert: ${rows.length}`);
}

async function importContractTerms() {
  const rows = readCsv("contract_terms.csv");
  for (const row of rows) {
    const existing = await prisma.contractTerm.findFirst({ where: { title: row["Titel"] } });
    if (existing) continue;
    await prisma.contractTerm.create({
      data: {
        title: row["Titel"],
        language: contractTermLanguageMap[row["Sprache"]] ?? "DE",
        validFrom: new Date(row["Gültig ab"]),
        fileUrl: row["Datei-URL"],
      },
    });
  }
  console.log(`Vertragsbedingungen importiert: ${rows.length}`);
}

let contractNumberCounter = 0;

async function nextContractNumber(): Promise<string> {
  if (contractNumberCounter === 0) {
    contractNumberCounter = await prisma.contract.count();
  }
  contractNumberCounter += 1;
  return `#${String(contractNumberCounter).padStart(6, "0")}`;
}

async function importContracts() {
  const rows = readCsv("contracts.csv");
  for (const row of rows) {
    const company = await prisma.company.findFirst({ where: { name: row["Firma"] } });
    const contact = await prisma.contact.findFirst({ where: { email: row["Ansprechpartner E-Mail"] } });
    const responsibleUser = await prisma.user.findFirst({ where: { email: row["Verantwortlicher E-Mail"] } });

    if (!company || !contact || !responsibleUser) {
      console.warn(
        `Vertrag übersprungen (Firma/Kontakt/Verantwortlicher nicht gefunden): ${row["Vertragsnummer"]}`,
      );
      continue;
    }

    const existing = await prisma.contract.findFirst({ where: { contractNumber: row["Vertragsnummer"] } });
    if (existing) continue;

    await prisma.contract.create({
      data: {
        contractNumber: row["Vertragsnummer"] || (await nextContractNumber()),
        status: contractStatusMap[row["Status"]] ?? "DRAFT",
        stage: contractStageMap[row["Stufe"]] ?? "STAGE_1_DRAFT_CREATED",
        language: contractLanguageMap[row["Sprache"]] ?? "DE",
        companyId: company.id,
        contactId: contact.id,
        responsibleUserId: responsibleUser.id,
        contractEndDate: new Date(row["Laufzeit bis"]),
        additionalAgreement: row["Zusatzvereinbarung"] || null,
        paymentOnInvoice: (row["Zahlung auf Rechnung"] || "Nein").toLowerCase() === "ja",
      },
    });
  }
  console.log(`Verträge importiert: ${rows.length}`);
}

async function main() {
  console.log("Starte UMNION-CSV-Import…");
  await importCompanies();
  await importHotels();
  await importContacts();
  await importRates();
  await importContractTerms();
  await importContracts();
  console.log("Import abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
