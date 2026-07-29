import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";
import { pushCompanyToApaleo } from "@/lib/apaleo";
import { sendMail } from "@/lib/mail";
import { draftContractEmail, finalContractEmail } from "@/lib/emailTemplates";
import { createLoginToken } from "@/lib/tokens";
import { appUrl } from "@/lib/urls";
import type { Contact } from "@prisma/client";

export const dynamic = "force-dynamic";

type ActionType = "SEND_DRAFT_EXISTING" | "SEND_DRAFT_NEW" | "FINALIZE" | "SEND_FINAL";

/**
 * Verschickt eine Vertragsmail (Entwurf oder final) an einen Kontakt: erzeugt
 * dafür einen einmaligen Login-Link-Token, der den Kontakt ohne Passwort
 * direkt auf die jeweilige Vertragsseite im Portal einloggt.
 */
async function sendContractMailToContact(opts: {
  contact: Contact;
  contractId: string;
  contractNumber: string;
  companyName: string;
  language: "DE" | "EN";
  kind: "DRAFT" | "FINAL";
}) {
  const { contact, contractId, contractNumber, companyName, language, kind } = opts;

  const token = await createLoginToken(contact.id, {
    contractId,
    ttlDays: kind === "DRAFT" ? 7 : 30,
  });
  const link = appUrl(
    `/login/magic/${token}?callbackUrl=${encodeURIComponent(`/portal/contracts/${contractId}`)}`,
  );

  const { subject, html } =
    kind === "DRAFT"
      ? draftContractEmail({
          contactFirstName: contact.firstName,
          companyName,
          contractNumber,
          language,
          link,
        })
      : finalContractEmail({
          contactFirstName: contact.firstName,
          companyName,
          contractNumber,
          language,
          link,
        });

  await sendMail({ to: contact.email, subject, html });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => ({}));
  const action = body.action as ActionType;

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { company: true, contact: true, secondContact: true },
  });
  if (!contract) {
    return NextResponse.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
  }

  switch (action) {
    case "SEND_DRAFT_EXISTING":
    case "SEND_DRAFT_NEW": {
      if (contract.status !== "DRAFT") {
        return NextResponse.json({ error: "Vertrag ist kein Entwurf mehr." }, { status: 400 });
      }

      const recipients = [contract.contact, contract.secondContact].filter(
        (c): c is Contact => !!c,
      );

      // Erst versenden, dann Status umstellen: schlägt die Mail fehl, bleibt
      // der Vertrag im Status "Entwurf" und die Aktion kann erneut ausgelöst
      // werden, statt einen "gesendeten" Vertrag ohne tatsächliche Mail zu
      // hinterlassen.
      try {
        for (const recipient of recipients) {
          await sendContractMailToContact({
            contact: recipient,
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            companyName: contract.company.name,
            language: contract.language,
            kind: "DRAFT",
          });
        }
      } catch (mailError) {
        console.error("Fehler beim Versand des Vertragsentwurfs:", mailError);
        return NextResponse.json(
          { error: "Vertrag konnte nicht per E-Mail versendet werden. Bitte erneut versuchen." },
          { status: 502 },
        );
      }

      const updated = await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: "AWAITING_SIGNATURE",
          stage: action === "SEND_DRAFT_EXISTING" ? "STAGE_2_SENT_EXISTING_CUSTOMER" : "STAGE_2_SENT_NEW_CUSTOMER",
          sentToCustomerAt: new Date(),
        },
      });

      return NextResponse.json({ contract: updated });
    }

    case "FINALIZE": {
      if (contract.status !== "AWAITING_FINALIZATION") {
        return NextResponse.json(
          { error: "Vertrag ist noch nicht bereit zur Finalisierung (es fehlen Unterschriften)." },
          { status: 400 },
        );
      }
      const updated = await prisma.contract.update({
        where: { id: contract.id },
        data: {
          contractDate: new Date(),
          stage: "STAGE_4_FINAL_CREATED",
        },
      });
      return NextResponse.json({ contract: updated });
    }

    case "SEND_FINAL": {
      if (contract.stage !== "STAGE_4_FINAL_CREATED") {
        return NextResponse.json(
          { error: "Der finale Vertrag wurde noch nicht erstellt." },
          { status: 400 },
        );
      }

      const recipients = [contract.contact, contract.secondContact].filter(
        (c): c is Contact => !!c,
      );

      try {
        for (const recipient of recipients) {
          await sendContractMailToContact({
            contact: recipient,
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            companyName: contract.company.name,
            language: contract.language,
            kind: "FINAL",
          });
        }
      } catch (mailError) {
        console.error("Fehler beim Versand des finalen Vertrags:", mailError);
        return NextResponse.json(
          { error: "Vertrag konnte nicht per E-Mail versendet werden. Bitte erneut versuchen." },
          { status: 502 },
        );
      }

      const updated = await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: "RUNNING",
          stage: "STAGE_5_FINAL_SENT",
        },
      });

      // TODO (Apaleo-Live-Anbindung): Sobald ein echter Apaleo-Zugang verfügbar
      // ist, hier die Firma bzw. die Firmenrate als Corporate Code/Rate Plan
      // nach Apaleo übertragen:
      // await pushCompanyToApaleo(contract.company);
      void pushCompanyToApaleo; // referenziert den Hook, ohne ihn aktiv aufzurufen

      return NextResponse.json({ contract: updated });
    }

    default:
      return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  }
}
