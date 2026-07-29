import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));

  const company = await prisma.company.update({
    where: { id: params.id },
    data: {
      status: data.status,
      name: data.name,
      nameAddition: data.nameAddition || null,
      street: data.street,
      zip: data.zip,
      city: data.city,
      country: data.country,
      emailGeneral: data.emailGeneral || null,
      emailInvoice: data.emailInvoice,
      vatId: data.vatId,
      phone: data.phone || null,
      website: data.website || null,
      industry: data.industry || null,
      apaleoId: data.apaleoId || null,
      apaleoCode: data.apaleoCode || null,
    },
  });

  return NextResponse.json({ company });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  await prisma.company.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
