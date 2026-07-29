import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";
import { generateContractNumber } from "@/lib/numbers";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => ({}));
  const { responsibleUserId, contractEndDate } = body;

  if (!responsibleUserId || !contractEndDate) {
    return NextResponse.json(
      { error: "Verantwortlicher und Vertragslaufzeit sind erforderlich." },
      { status: 400 },
    );
  }

  const request = await prisma.contractRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  const contractNumber = await generateContractNumber();

  const contract = await prisma.contract.create({
    data: {
      contractNumber,
      status: "DRAFT",
      stage: "STAGE_1_DRAFT_CREATED",
      requestId: request.id,
      companyId: request.companyId,
      contactId: request.contactId,
      responsibleUserId,
      contractEndDate: new Date(contractEndDate),
    },
  });

  await prisma.contractRequest.update({
    where: { id: request.id },
    data: { status: "CONVERTED" },
  });

  return NextResponse.json({ contractId: contract.id }, { status: 201 });
}
