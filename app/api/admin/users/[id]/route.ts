import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(["ADMIN"]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));
  const { name, email, role, password } = data;

  if (!name || !email) {
    return NextResponse.json({ error: "Name und E-Mail sind erforderlich." }, { status: 400 });
  }
  if (role !== "ADMIN" && role !== "SALES") {
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }
  if (password && password.length < 8) {
    return NextResponse.json(
      { error: "Das neue Passwort muss mindestens 8 Zeichen lang sein." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email: email.toLowerCase().trim(),
        role,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Es existiert bereits ein Nutzer mit dieser E-Mail-Adresse." },
        { status: 409 },
      );
    }
    console.error("Fehler beim Aktualisieren des Nutzers:", err);
    return NextResponse.json({ error: "Nutzer konnte nicht gespeichert werden." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const { session } = auth;

  if (session.user.id === params.id) {
    return NextResponse.json(
      { error: "Du kannst deinen eigenen Account nicht löschen." },
      { status: 400 },
    );
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Nutzer kann nicht gelöscht werden, da er noch als Verantwortlicher für mindestens einen Vertrag hinterlegt ist. Bitte zuerst den Verantwortlichen der betroffenen Verträge ändern.",
        },
        { status: 409 },
      );
    }
    console.error("Fehler beim Löschen des Nutzers:", err);
    return NextResponse.json({ error: "Nutzer konnte nicht gelöscht werden." }, { status: 500 });
  }
}
