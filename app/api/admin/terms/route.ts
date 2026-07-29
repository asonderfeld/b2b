import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));
  const term = await prisma.contractTerm.create({
    data: {
      title: data.title,
      language: data.language,
      validFrom: new Date(data.validFrom),
      fileUrl: data.fileUrl,
    },
  });
  return NextResponse.json({ term }, { status: 201 });
}
