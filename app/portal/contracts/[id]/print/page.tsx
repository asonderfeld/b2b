import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/authz";
import { formatDate, contractLanguageLabels } from "@/lib/labels";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PortalContractPrintPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user.contactId) redirect("/login");

  const viewerContact = await prisma.contact.findUnique({ where: { id: session.user.contactId } });
  if (!viewerContact) redirect("/login");

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      contact: true,
      secondContact: true,
      responsibleUser: true,
      rates: { include: { rate: { include: { hotel: true } } } },
      terms: { include: { term: true } },
    },
  });

  if (!contract || contract.companyId !== viewerContact.companyId) {
    notFound();
  }

  return (
    <div className="bg-white text-neutral-900 max-w-3xl mx-auto p-8 print:p-0">
      <div className="no-print mb-6">
        <PrintButton />
      </div>

      <header className="mb-8 border-b border-neutral-300 pb-4">
        <div className="text-xl font-semibold text-primary">mk | hotels</div>
        <h1 className="text-lg font-bold mt-2">
          Firmenraten-Vertrag {contract.contractNumber}
        </h1>
        <p className="text-sm text-neutral-600">
          Sprache: {contractLanguageLabels[contract.language]} · Vertragsdatum:{" "}
          {formatDate(contract.contractDate)} · Laufzeit bis {formatDate(contract.contractEndDate)}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <h2 className="font-semibold mb-1">Vertragspartner</h2>
          <div>{contract.company.name}</div>
          <div>
            {contract.company.street}, {contract.company.zip} {contract.company.city}
          </div>
          <div>{contract.company.country}</div>
          <div className="mt-2">USt-IdNr: {contract.company.vatId}</div>
        </div>
        <div>
          <h2 className="font-semibold mb-1">Ansprechpartner</h2>
          <div>
            {contract.contact.firstName} {contract.contact.lastName}
          </div>
          <div>{contract.contact.position}</div>
          <div>{contract.contact.email}</div>
        </div>
      </section>

      <section className="mb-6 text-sm">
        <h2 className="font-semibold mb-2">Firmenraten</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-300 text-left">
              <th className="py-1">Hotel</th>
              <th className="py-1">Zimmerrate</th>
              <th className="py-1">Frühstück p.P.</th>
            </tr>
          </thead>
          <tbody>
            {contract.rates.map((r) => (
              <tr key={r.rateId} className="border-b border-neutral-100">
                <td className="py-1">{r.rate.hotel.name}</td>
                <td className="py-1">
                  {r.rate.rateName}
                  {r.rate.rateName2 ? ` / ${r.rate.rateName2}` : ""}
                </td>
                <td className="py-1">
                  {r.rate.breakfastPricePerPerson != null ? `${r.rate.breakfastPricePerPerson} €` : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {contract.additionalAgreement && (
        <section className="mb-6 text-sm">
          <h2 className="font-semibold mb-2">Zusatzvereinbarung</h2>
          <p className="whitespace-pre-wrap">{contract.additionalAgreement}</p>
        </section>
      )}

      <section className="mb-6 text-sm">
        <h2 className="font-semibold mb-2">Vertragsbedingungen</h2>
        <ul className="list-disc list-inside">
          {contract.terms.map((t) => (
            <li key={t.termId}>
              {t.term.title} ({t.term.language}, gültig ab {formatDate(t.term.validFrom)})
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-6 mt-12 text-sm">
        <div>
          <div className="text-neutral-500 mb-1">
            Unterschrift {contract.contact.firstName} {contract.contact.lastName}
          </div>
          {contract.signature1Url ? (
            <img src={contract.signature1Url} alt="Unterschrift 1" className="h-16" />
          ) : (
            <div className="h-16 border-b border-neutral-400" />
          )}
          <div className="text-xs text-neutral-500 mt-1">{formatDate(contract.signature1Date)}</div>
        </div>
        {contract.secondContact && (
          <div>
            <div className="text-neutral-500 mb-1">
              Unterschrift {contract.secondContact.firstName} {contract.secondContact.lastName}
            </div>
            {contract.signature2Url ? (
              <img src={contract.signature2Url} alt="Unterschrift 2" className="h-16" />
            ) : (
              <div className="h-16 border-b border-neutral-400" />
            )}
            <div className="text-xs text-neutral-500 mt-1">{formatDate(contract.signature2Date)}</div>
          </div>
        )}
        <div>
          <div className="text-neutral-500 mb-1">Für mk | hotels ({contract.responsibleUser.name})</div>
          {contract.responsibleUser.signatureUrl ? (
            <img src={contract.responsibleUser.signatureUrl} alt="Unterschrift mk | hotels" className="h-16" />
          ) : (
            <div className="h-16 border-b border-neutral-400" />
          )}
          <div className="text-xs text-neutral-500 mt-1">{formatDate(contract.contractDate)}</div>
        </div>
      </section>

      <footer className="mt-12 text-xs text-neutral-400 border-t border-neutral-200 pt-4">
        mk | hotels – automatisch erzeugte Vertragsansicht – {contract.contractNumber}
      </footer>
    </div>
  );
}
