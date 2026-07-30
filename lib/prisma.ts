import { PrismaClient } from "@prisma/client";

// Verhindert im Next.js-Dev-Modus (Hot Reload) das mehrfache Instanziieren
// des Prisma Clients und damit zu viele offene DB-Verbindungen.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In Produktion (Vercel) über den von der Supabase-Integration bereit-
// gestellten Connection-Pooler verbinden (POSTGRES_PRISMA_URL: PgBouncer im
// Transaction-Modus), statt über die direkte Verbindung in DATABASE_URL.
// Serverless-Funktionen erzeugen sonst schnell mehr gleichzeitige
// Verbindungen, als der (kleine) Datenbank-Connection-Pool erlaubt
// ("FATAL: max clients reached in session mode"). Lokal ist
// POSTGRES_PRISMA_URL nicht gesetzt, dort greift automatisch der Fallback
// auf DATABASE_URL (direkte Verbindung reicht für lokale Entwicklung).
const connectionUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(connectionUrl ? { datasources: { db: { url: connectionUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
