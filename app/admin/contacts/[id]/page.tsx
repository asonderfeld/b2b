import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const [contact, companies] = await Promise.all([
    prisma.contact.findUnique({ where: { id: params.id } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!contact) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Kontakt bearbeiten – {contact.firstName} {contact.lastName}
      </h1>
      <ContactForm
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: contact.id,
          companyId: contact.companyId,
          salutation: contact.salutation,
          title: contact.title ?? "",
          firstName: contact.firstName,
          lastName: contact.lastName,
          position: contact.position,
          department: contact.department ?? "",
          email: contact.email,
          phone: contact.phone,
          phoneMobile: contact.phoneMobile ?? "",
          formalAddress: contact.formalAddress,
        }}
      />
    </div>
  );
}
