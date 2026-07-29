import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCustomerNumber, generateRequestNumber } from "@/lib/numbers";
import { sendMail, getInternalRecipients } from "@/lib/mail";
import { newRequestInternalEmail } from "@/lib/emailTemplates";
import { appUrl } from "@/lib/urls";
import type { Salutation } from "@prisma/client";

const MIN_NIGHTS = 50;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company, contact, hotelLines, notes } = body ?? {};

    if (!company || !contact || !Array.isArray(hotelLines) || hotelLines.length === 0) {
      return NextResponse.json({ error: "Unvollständige Anfrage." }, { status: 400 });
    }

    for (const line of hotelLines) {
      if (!line.hotelId || Number(line.nightsPerYear) < MIN_NIGHTS) {
        return NextResponse.json(
          {
            error: `Wir bieten Firmenraten erst ab einem Mindestkontingent von ${MIN_NIGHTS} Nächten pro Jahr an.`,
          },
          { status: 400 },
        );
      }
    }

    const requiredCompanyFields = [
      "name",
      "street",
      "zip",
      "city",
      "country",
      "emailInvoice",
      "vatId",
    ];
    for (const field of requiredCompanyFields) {
      if (!company[field]) {
        return NextResponse.json(
          { error: `Feld "${field}" im Unternehmen fehlt.` },
          { status: 400 },
        );
      }
    }
    const requiredContactFields = [
      "salutation",
      "firstName",
      "lastName",
      "position",
      "email",
      "phone",
    ];
    for (const field of requiredContactFields) {
      if (!contact[field]) {
        return NextResponse.json(
          { error: `Feld "${field}" beim Ansprechpartner fehlt.` },
          { status: 400 },
        );
      }
    }

    // Unternehmen per Name + Rechnungs-E-Mail "upserten" (einfache Dublettenprüfung).
    let companyRecord = await prisma.company.findFirst({
      where: {
        name: company.name,
        emailInvoice: company.emailInvoice,
      },
    });

    if (!companyRecord) {
      const customerNumber = await generateCustomerNumber();
      companyRecord = await prisma.company.create({
        data: {
          customerNumber,
          status: "INTERESSENT",
          name: company.name,
          street: company.street,
          zip: company.zip,
          city: company.city,
          country: company.country,
          emailInvoice: company.emailInvoice,
          vatId: company.vatId,
        },
      });
    }

    // Kontakt per E-Mail innerhalb der Firma "upserten".
    let contactRecord = await prisma.contact.findFirst({
      where: { companyId: companyRecord.id, email: contact.email },
    });

    if (!contactRecord) {
      contactRecord = await prisma.contact.create({
        data: {
          companyId: companyRecord.id,
          salutation: contact.salutation as Salutation,
          firstName: contact.firstName,
          lastName: contact.lastName,
          position: contact.position,
          email: contact.email,
          phone: contact.phone,
        },
      });
    }

    const requestNumber = await generateRequestNumber();

    const contractRequest = await prisma.contractRequest.create({
      data: {
        requestNumber,
        companyId: companyRecord.id,
        contactId: contactRecord.id,
        source: "WEBSITE",
        notes: notes || null,
        status: "NEW",
        hotelLines: {
          create: hotelLines.map((l: { hotelId: string; nightsPerYear: number }) => ({
            hotelId: l.hotelId,
            nightsPerYear: Number(l.nightsPerYear),
          })),
        },
      },
      include: { hotelLines: true },
    });

    // Vertrieb per Mail benachrichtigen. Ein Mailfehler soll die Anfrage
    // selbst nicht scheitern lassen (sie ist bereits gespeichert).
    try {
      const recipients = await getInternalRecipients();
      if (recipients.length > 0) {
        const { subject, html } = newRequestInternalEmail({
          requestNumber: contractRequest.requestNumber,
          companyName: companyRecord.name,
          contactName: `${contactRecord.firstName} ${contactRecord.lastName}`,
          link: appUrl(`/admin/requests/${contractRequest.id}`),
        });
        await sendMail({ to: recipients, subject, html });
      }
    } catch (mailError) {
      console.error("Fehler beim Versand der internen Benachrichtigung:", mailError);
    }

    return NextResponse.json({ requestNumber: contractRequest.requestNumber }, { status: 201 });
  } catch (err) {
    console.error("Fehler beim Anlegen der Anfrage:", err);
    return NextResponse.json(
      { error: "Beim Speichern der Anfrage ist ein Fehler aufgetreten." },
      { status: 500 },
    );
  }
}
