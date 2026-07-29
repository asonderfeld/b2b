import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

const MAX_SIGNATURE_LENGTH = 1_500_000; // ~1 MB Rohbild, als Base64 etwas mehr

// Self-Service-Profil für interne Nutzer (ADMIN/SALES): eigener Name,
// eigenes Passwort, eigene Unterschrift. Wirkt immer nur auf den
// eingeloggten Nutzer selbst (session.user.id) – nie auf eine übergebene ID.
export async function PUT(req: Request) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const data = await req.json().catch(() => ({}));
  const { name, currentPassword, newPassword, signatureDataUrl } = data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof name === "string" && name.trim()) {
    updateData.name = name.trim();
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Das neue Passwort muss mindestens 8 Zeichen lang sein." },
        { status: 400 },
      );
    }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: "Aktuelles Passwort ist nicht korrekt." },
        { status: 400 },
      );
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (signatureDataUrl === null) {
    updateData.signatureUrl = null;
  } else if (typeof signatureDataUrl === "string" && signatureDataUrl) {
    if (!signatureDataUrl.startsWith("data:image/png")) {
      return NextResponse.json(
        { error: "Die Unterschrift muss eine PNG-Datei sein." },
        { status: 400 },
      );
    }
    if (signatureDataUrl.length > MAX_SIGNATURE_LENGTH) {
      return NextResponse.json(
        { error: "Die Unterschrift-Datei ist zu groß (max. ca. 1 MB)." },
        { status: 400 },
      );
    }
    updateData.signatureUrl = signatureDataUrl;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      hasSignature: !!updated.signatureUrl,
    },
  });
}
