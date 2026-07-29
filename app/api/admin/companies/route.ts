import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";
import { generateCustomerNumber } from "@/lib/numbers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));
  const customerNumber = await generateCustomerNumber();

  const company = await prisma.company.create({
    data: {
      customerNumber,
      status: data.status || "INTERESSENT",
      name: data.name,
      nameAddition: data.nameAddition || null,
      street: data.street,
      zip: data.zip,
      city: data.city,
      country: data.country || "Deutschland",
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

  return NextResponse.json({ company }, { status: 201 });
}
