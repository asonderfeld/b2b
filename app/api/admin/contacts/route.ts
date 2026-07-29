import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));

  const contact = await prisma.contact.create({
    data: {
      companyId: data.companyId,
      salutation: data.salutation,
      title: data.title || null,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      department: data.department || null,
      email: data.email,
      phone: data.phone,
      phoneMobile: data.phoneMobile || null,
      formalAddress: data.formalAddress || "SIE",
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
