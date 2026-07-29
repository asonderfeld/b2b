import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Prüft serverseitig, ob die aktuelle Session eine der erlaubten Rollen hat.
 * Gibt entweder die Session zurück oder eine fertige 401/403-NextResponse,
 * die die aufrufende Route direkt zurückgeben kann.
 */
export async function requireRole(
  roles: Array<"ADMIN" | "SALES" | "CUSTOMER">,
): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (!roles.includes(session.user.role)) {
    return { response: NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 }) };
  }
  return { session };
}

export const INTERNAL_ROLES = ["ADMIN", "SALES"] as const;
