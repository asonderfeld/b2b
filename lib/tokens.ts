import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const DEFAULT_TTL_DAYS = 7;

/**
 * Erzeugt einen einmalig gültigen, zeitlich begrenzten Login-Link-Token für
 * einen Firmenkontakt (Portal-Zugriff ohne selbst vergebenes Passwort).
 */
export async function createLoginToken(
  contactId: string,
  opts?: { contractId?: string; ttlDays?: number },
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const ttlDays = opts?.ttlDays ?? DEFAULT_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.loginToken.create({
    data: {
      token,
      contactId,
      contractId: opts?.contractId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Prüft einen Login-Token und verbraucht ihn (single-use). Gibt bei Erfolg
 * die zugehörige Kontakt-/Vertrags-ID zurück, sonst null (ungültig,
 * abgelaufen oder bereits verwendet).
 */
export async function consumeLoginToken(
  token: string,
): Promise<{ contactId: string; contractId: string | null } | null> {
  const record = await prisma.loginToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.loginToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { contactId: record.contactId, contractId: record.contractId };
}
