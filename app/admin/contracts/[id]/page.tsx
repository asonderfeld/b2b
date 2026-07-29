import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  contractStatusLabels,
  contractStatusColors,
  contractStageLabels,
  formatDateTime,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { ContractEditForm } from "@/components/ContractEditForm";

export const dynamic = "force-dynamic";

export default async function AdminContractDetailPage({ params }: { params: { id: string } }) {
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      company: { include: { contacts: true } },
      contact: true,
      secondContact: true,
      responsibleUser: true,
      rates: { include: { rate: { include: { hotel: true } } } },
      terms: { include: { term: true } },
    },
  });

  if (!contract) notFound();

  const [users, allRates, allTerms] = await Promise.all([
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "SALES"] } }, orderBy: { name: "asc" } }),
    prisma.rate.findMany({ where: { status: "ACTIVE" }, include: { hotel: true }, orderBy: [{ hotel: { name: "asc" } }, { year: "desc" }] }),
    prisma.contractTerm.findMany({ orderBy: { validFrom: "desc" } }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vertrag {contract.contractNumber}</h1>
          <p className="text-sm text-neutral-500">
            {contract.company.name} · Stufe: {contractStageLabels[contract.stage]}
          </p>
        </div>
        <StatusBadge
          label={contractStatusLabels[contract.status]}
          colorClass={contractStatusColors[contract.status]}
        />
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold mb-2">Unterschriften</h2>
        <div className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-neutral-500">1. Unterschrift ({contract.contact.firstName} {contract.contact.lastName})</div>
            {contract.signature1Url ? (
              <>
                <img src={contract.signature1Url} alt="Unterschrift 1" className="h-16 border border-neutral-200 rounded bg-white mt-1" />
                <div className="text-xs text-neutral-500 mt-1">{formatDateTime(contract.signature1Date)}</div>
              </>
            ) : (
              <div className="text-neutral-400">Noch keine Unterschrift</div>
            )}
          </div>
          <div>
            <div className="text-neutral-500">
              2. Unterschrift {contract.secondContact ? `(${contract.secondContact.firstName} ${contract.secondContact.lastName})` : "(nicht erforderlich)"}
            </div>
            {contract.signature2Url ? (
              <>
                <img src={contract.signature2Url} alt="Unterschrift 2" className="h-16 border border-neutral-200 rounded bg-white mt-1" />
                <div className="text-xs text-neutral-500 mt-1">{formatDateTime(contract.signature2Date)}</div>
              </>
            ) : (
              <div className="text-neutral-400">{contract.secondContactId ? "Noch keine Unterschrift" : "–"}</div>
            )}
          </div>
        </div>
      </div>

      <ContractEditForm
        contract={{
          id: contract.id,
          status: contract.status,
          stage: contract.stage,
          language: contract.language,
          contractEndDate: contract.contractEndDate.toISOString().slice(0, 10),
          additionalAgreement: contract.additionalAgreement ?? "",
          secondContactId: contract.secondContactId,
          paymentOnInvoice: contract.paymentOnInvoice,
          responsibleUserId: contract.responsibleUserId,
          rateIds: contract.rates.map((r) => r.rateId),
          termIds: contract.terms.map((t) => t.termId),
        }}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        companyContacts={contract.company.contacts.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        }))}
        allRates={allRates.map((r) => ({
          id: r.id,
          label: `${r.hotel.name} – ${r.rateName} (${r.year})`,
        }))}
        allTerms={allTerms.map((t) => ({
          id: t.id,
          label: `${t.title} (${t.language}, gültig ab ${t.validFrom.toISOString().slice(0, 10)})`,
        }))}
      />
    </div>
  );
}
