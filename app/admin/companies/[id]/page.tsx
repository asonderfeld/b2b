import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompanyForm } from "@/components/CompanyForm";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Firma bearbeiten – {company.customerNumber}</h1>
      <CompanyForm
        initial={{
          id: company.id,
          status: company.status,
          name: company.name,
          nameAddition: company.nameAddition ?? "",
          street: company.street,
          zip: company.zip,
          city: company.city,
          country: company.country,
          emailGeneral: company.emailGeneral ?? "",
          emailInvoice: company.emailInvoice,
          vatId: company.vatId,
          phone: company.phone ?? "",
          website: company.website ?? "",
          industry: company.industry ?? "",
          apaleoId: company.apaleoId ?? "",
          apaleoCode: company.apaleoCode ?? "",
        }}
      />
    </div>
  );
}
