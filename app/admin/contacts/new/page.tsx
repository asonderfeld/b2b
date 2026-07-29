import { prisma } from "@/lib/prisma";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neuer Kontakt</h1>
      <ContactForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
