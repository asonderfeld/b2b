import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TermForm } from "@/components/TermForm";

export const dynamic = "force-dynamic";

export default async function EditTermPage({ params }: { params: { id: string } }) {
  const term = await prisma.contractTerm.findUnique({ where: { id: params.id } });
  if (!term) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vertragsbedingung bearbeiten</h1>
      <TermForm
        initial={{
          id: term.id,
          title: term.title,
          language: term.language,
          validFrom: term.validFrom.toISOString().slice(0, 10),
          bodyText: term.bodyText ?? "",
          fileUrl: term.fileUrl ?? "",
        }}
      />
    </div>
  );
}
