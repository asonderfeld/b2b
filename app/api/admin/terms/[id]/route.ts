import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));
  const term = await prisma.contractTerm.update({
    where: { id: params.id },
    data: {
      title: data.title,
      language: data.language,
      validFrom: new Date(data.validFrom),
      fileUrl: data.fileUrl,
    },
  });
  return NextResponse.json({ term });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  await prisma.contractTerm.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
