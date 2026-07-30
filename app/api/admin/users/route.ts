import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

// Nutzerverwaltung (Anlegen von ADMIN-/SALES-Logins) ist bewusst nur der
// Rolle ADMIN vorbehalten, anders als der übrige /admin-Bereich (der für
// ADMIN und SALES gleichermaßen offen ist).
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));
  const { name, email, password, role, jobTitle } = data;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, E-Mail und Passwort sind erforderlich." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Das Passwort muss mindestens 8 Zeichen lang sein." },
      { status: 400 },
    );
  }
  if (role !== "ADMIN" && role !== "SALES") {
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        jobTitle: jobTitle?.trim() || null,
      },
    });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Es existiert bereits ein Nutzer mit dieser E-Mail-Adresse." },
        { status: 409 },
      );
    }
    console.error("Fehler beim Anlegen des Nutzers:", err);
    return NextResponse.json({ error: "Nutzer konnte nicht angelegt werden." }, { status: 500 });
  }
}
