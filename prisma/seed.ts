import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: lege Demo-Daten an…");

  const passwordHash = await bcrypt.hash("changeme123", 10);

  // --- Hotels -----------------------------------------------------------
  const hotelBerlin = await prisma.hotel.upsert({
    where: { id: "seed-hotel-berlin" },
    update: {},
    create: {
      id: "seed-hotel-berlin",
      name: "mk hotel berlin",
      street: "Musterstraße 1",
      zip: "10115",
      city: "Berlin",
      country: "Deutschland",
      category: "4 Sterne",
      currency: "EUR",
      website: "https://www.mkhotels.de/berlin",
      reservationPhone: "+49 30 1234560",
      reservationEmail: "reservierung.berlin@mkhotels.de",
      activeForCorporateRates: true,
      contractDescriptionDe: "Firmenrate für Standardzimmer inkl. Frühstück.",
      cancellationTermsDe: "Kostenfreie Stornierung bis 18:00 Uhr am Anreisetag.",
      parkingInfoDe: "Hoteleigene Tiefgarage, 18 € pro Nacht.",
    },
  });

  const hotelFrankfurt = await prisma.hotel.upsert({
    where: { id: "seed-hotel-frankfurt" },
    update: {},
    create: {
      id: "seed-hotel-frankfurt",
      name: "mk hotel frankfurt",
      street: "Bahnhofsallee 5",
      zip: "60329",
      city: "Frankfurt am Main",
      country: "Deutschland",
      category: "4 Sterne",
      currency: "EUR",
      website: "https://www.mkhotels.de/frankfurt",
      reservationPhone: "+49 69 1234560",
      reservationEmail: "reservierung.frankfurt@mkhotels.de",
      activeForCorporateRates: true,
      contractDescriptionDe: "Firmenrate für Standard- und Komfortzimmer inkl. Frühstück.",
      cancellationTermsDe: "Kostenfreie Stornierung bis 18:00 Uhr am Anreisetag.",
    },
  });

  // --- Firmenraten --------------------------------------------------------
  const rateBerlin = await prisma.rate.upsert({
    where: { id: "seed-rate-berlin-2026" },
    update: {},
    create: {
      id: "seed-rate-berlin-2026",
      hotelId: hotelBerlin.id,
      year: 2026,
      status: "ACTIVE",
      rateTier: "RATE_GE_50",
      rateName: "Standardzimmer, Business-Ausstattung",
      breakfastPricePerPerson: 18.5,
      roomNightsFrom: 50,
      roomNightsTo: 99,
    },
  });

  const rateFrankfurt = await prisma.rate.upsert({
    where: { id: "seed-rate-frankfurt-2026" },
    update: {},
    create: {
      id: "seed-rate-frankfurt-2026",
      hotelId: hotelFrankfurt.id,
      year: 2026,
      status: "ACTIVE",
      rateTier: "RATE_GE_100",
      rateName: "Komfortzimmer, Business-Ausstattung",
      rateName2: "Standardzimmer",
      breakfastPricePerPerson: 19,
      roomNightsFrom: 100,
      roomNightsTo: 199,
    },
  });

  // --- Vertragsbedingungen -------------------------------------------------
  const termsDe = await prisma.contractTerm.upsert({
    where: { id: "seed-terms-de-2026" },
    update: {},
    create: {
      id: "seed-terms-de-2026",
      title: "Allgemeine Vertragsbedingungen Firmenraten 2026",
      language: "DE",
      validFrom: new Date("2026-01-01"),
      fileUrl: "/dokumente/agb-firmenraten-2026-de.pdf",
    },
  });

  // --- Unternehmen & Kontakt ------------------------------------------------
  const company = await prisma.company.upsert({
    where: { id: "seed-company-muster" },
    update: {},
    create: {
      id: "seed-company-muster",
      customerNumber: "KD000001",
      status: "KUNDE",
      name: "Musterfirma GmbH",
      street: "Hauptstraße 42",
      zip: "80331",
      city: "München",
      country: "Deutschland",
      emailGeneral: "info@musterfirma.de",
      emailInvoice: "buchhaltung@musterfirma.de",
      vatId: "DE123456789",
      phone: "+49 89 987654",
      website: "https://www.musterfirma.de",
      industry: "IT-Dienstleistungen",
    },
  });

  const contact = await prisma.contact.upsert({
    where: { id: "seed-contact-muster" },
    update: {},
    create: {
      id: "seed-contact-muster",
      companyId: company.id,
      salutation: "FRAU",
      firstName: "Erika",
      lastName: "Musterfrau",
      position: "Travel Managerin",
      email: "erika.musterfrau@musterfirma.de",
      phone: "+49 89 987654",
      formalAddress: "SIE",
    },
  });

  // --- Benutzer ------------------------------------------------------------
  await prisma.user.upsert({
    where: { email: "admin@mkhotels.de" },
    update: {},
    create: {
      email: "admin@mkhotels.de",
      name: "Administration mk | hotels",
      role: "ADMIN",
      passwordHash,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: "vertrieb@mkhotels.de" },
    update: {},
    create: {
      email: "vertrieb@mkhotels.de",
      name: "Vertrieb mk | hotels",
      role: "SALES",
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: contact.email },
    update: {},
    create: {
      email: contact.email,
      name: `${contact.firstName} ${contact.lastName}`,
      role: "CUSTOMER",
      contactId: contact.id,
      passwordHash,
    },
  });

  // --- Demo-Anfrage (Status NEW, zum Ausprobieren des Admin-Workflows) -----
  await prisma.contractRequest.upsert({
    where: { id: "seed-request-demo" },
    update: {},
    create: {
      id: "seed-request-demo",
      requestNumber: "AF000001",
      companyId: company.id,
      contactId: contact.id,
      source: "WEBSITE",
      notes: "Bitte um Angebot für regelmäßige Geschäftsreisen nach Berlin.",
      status: "NEW",
      hotelLines: {
        create: [{ hotelId: hotelBerlin.id, nightsPerYear: 80 }],
      },
    },
  });

  // --- Demo-Vertrag (bereits laufend, zur Ansicht im Kundenportal) --------
  await prisma.contract.upsert({
    where: { id: "seed-contract-demo" },
    update: {},
    create: {
      id: "seed-contract-demo",
      contractNumber: "#000001",
      status: "RUNNING",
      stage: "STAGE_5_FINAL_SENT",
      language: "DE",
      companyId: company.id,
      contactId: contact.id,
      responsibleUserId: salesUser.id,
      contractEndDate: new Date("2026-12-31"),
      contractDate: new Date("2026-01-15"),
      additionalAgreement: "Kostenfreies Upgrade bei Verfügbarkeit.",
      acceptedTerms: true,
      sentToCustomerAt: new Date("2026-01-10"),
      paymentOnInvoice: true,
      rates: {
        create: [{ rateId: rateBerlin.id }, { rateId: rateFrankfurt.id }],
      },
      terms: {
        create: [{ termId: termsDe.id }],
      },
    },
  });

  console.log("Seed abgeschlossen.");
  console.log("Demo-Logins (Passwort jeweils: changeme123):");
  console.log("  ADMIN:    admin@mkhotels.de");
  console.log("  SALES:    vertrieb@mkhotels.de");
  console.log(`  CUSTOMER: ${contact.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
