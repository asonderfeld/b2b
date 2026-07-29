import { prisma } from "@/lib/prisma";

// Einfache, fortlaufende Nummerngenerierung nach dem Vorbild des UMNION-
// Altsystems. Für ein Hochlast-Szenario mit vielen parallelen Schreibern
// wäre ein DB-Sequence-basierter Ansatz robuster; für die Größenordnung
// dieser B2B-Anwendung (wenige Anfragen/Verträge pro Tag) reicht ein
// einfacher Zähler auf Basis der bestehenden Datensätze.

function pad(n: number, length = 6): string {
  return String(n).padStart(length, "0");
}

export async function generateCustomerNumber(): Promise<string> {
  const count = await prisma.company.count();
  return `KD${pad(count + 1)}`;
}

export async function generateRequestNumber(): Promise<string> {
  const count = await prisma.contractRequest.count();
  return `AF${pad(count + 1)}`;
}

export async function generateContractNumber(): Promise<string> {
  const count = await prisma.contract.count();
  return `#${pad(count + 1)}`;
}
