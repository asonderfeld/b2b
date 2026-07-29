import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { sendMail } from "@/lib/mail";
import { readyForFinalizationInternalEmail } from "@/lib/emailTemplates";
import { appUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(["CUSTOMER"]);
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { company: true, responsibleUser: true },
  });
  if (!contract) {
    return NextResponse.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
  }

  const contactId = session.user.contactId;
  const isMainSigner = contactId === contract.contactId;
  const isSecondSigner = contactId != null && contactId === contract.secondContactId;

  if (!isMainSigner && !isSecondSigner) {
    return NextResponse.json({ error: "Keine Berechtigung für diesen Vertrag." }, { status: 403 });
  }

  if (contract.status !== "AWAITING_SIGNATURE") {
    return NextResponse.json(
      { error: "Dieser Link ist nicht mehr gültig, da der Vertrag bereits abgesendet wurde." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { signatureDataUrl, acceptedTerms } = body;

  if (!signatureDataUrl || !acceptedTerms) {
    return NextResponse.json(
      { error: "Unterschrift und Zustimmung zu den Vertragsbedingungen sind erforderlich." },
      { status: 400 },
    );
  }

  const now = new Date();

  const updateData: Record<string, unknown> = { acceptedTerms: true };
  if (isMainSigner) {
    updateData.signature1Url = signatureDataUrl;
    updateData.signature1Date = now;
  } else {
    updateData.signature2Url = signatureDataUrl;
    updateData.signature2Date = now;
  }

  const hasSignature1 = isMainSigner ? true : !!contract.signature1Url;
  const hasSignature2 = contract.secondContactId
    ? isSecondSigner
      ? true
      : !!contract.signature2Url
    : true; // keine zweite Unterschrift nötig

  if (hasSignature1 && hasSignature2) {
    updateData.status = "AWAITING_FINALIZATION";
    updateData.stage = "STAGE_3_OFFER_ACCEPTED";
  }

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: updateData,
  });

  if (updateData.status === "AWAITING_FINALIZATION") {
    try {
      const { subject, html } = readyForFinalizationInternalEmail({
        contractNumber: contract.contractNumber,
        companyName: contract.company.name,
        link: appUrl(`/admin/contracts/${contract.id}`),
      });
      await sendMail({ to: contract.responsibleUser.email, subject, html });
    } catch (mailError) {
      console.error("Fehler beim Versand der Finalisierungs-Benachrichtigung:", mailError);
    }
  }

  return NextResponse.json({ contract: updated });
}
