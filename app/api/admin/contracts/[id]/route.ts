import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => ({}));
  const {
    responsibleUserId,
    language,
    contractEndDate,
    additionalAgreement,
    secondContactId,
    paymentOnInvoice,
    rateIds,
    termIds,
  } = body;

  const contract = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!contract) {
    return NextResponse.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
  }

  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: {
      responsibleUserId: responsibleUserId || contract.responsibleUserId,
      language: language || contract.language,
      contractEndDate: contractEndDate ? new Date(contractEndDate) : contract.contractEndDate,
      additionalAgreement: additionalAgreement ?? contract.additionalAgreement,
      secondContactId: secondContactId || null,
      paymentOnInvoice: Boolean(paymentOnInvoice),
      ...(Array.isArray(rateIds)
        ? { rates: { deleteMany: {}, create: rateIds.map((rateId: string) => ({ rateId })) } }
        : {}),
      ...(Array.isArray(termIds)
        ? { terms: { deleteMany: {}, create: termIds.map((termId: string) => ({ termId })) } }
        : {}),
    },
  });

  return NextResponse.json({ contract: updated });
}
