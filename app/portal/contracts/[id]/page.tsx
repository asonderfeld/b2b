import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/authz";
import {
  contractStatusLabels,
  contractStatusColors,
  contractLanguageLabels,
  formatDate,
  formatDateTime,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { ContractSignForm } from "@/components/ContractSignForm";

export const dynamic = "force-dynamic";

export default async function PortalContractDetailPage({ params }: { params: { id: string } }) {
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
      rates: { include: { rate: { include: { hotel: true } } } },
      terms: { include: { term: true } },
    },
  });

  if (!contract || contract.companyId !== viewerContact.companyId) {
    notFound();
  }

  const isMainSigner = session.user.contactId === contract.contactId;
  const isSecondSigner = session.user.contactId === contract.secondContactId;
  const isRequiredSigner = isMainSigner || isSecondSigner;
  const alreadySignedByViewer = isMainSigner
    ? !!contract.signature1Url
    : isSecondSigner
      ? !!contract.signature2Url
      : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vertrag {contract.contractNumber}</h1>
          <p className="text-sm text-neutral-500">
            Sprache: {contractLanguageLabels[contract.language]} · Laufzeit bis {formatDate(contract.contractEndDate)}
          </p>
        </div>
        <StatusBadge
          label={contractStatusLabels[contract.status]}
          colorClass={contractStatusColors[contract.status]}
        />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Firmenraten</h2>
        <table className="table-base">
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Zimmerrate</th>
              <th>Frühstück p.P.</th>
            </tr>
          </thead>
          <tbody>
            {contract.rates.map((r) => (
              <tr key={r.rateId}>
                <td>{r.rate.hotel.name}</td>
                <td>
                  {r.rate.rateName}
                  {r.rate.rateName2 ? ` / ${r.rate.rateName2}` : ""}
                </td>
                <td>
                  {r.rate.breakfastPricePerPerson != null
                    ? `${r.rate.breakfastPricePerPerson} €`
                    : "–"}
                </td>
              </tr>
            ))}
            {contract.rates.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-neutral-500 py-4">
                  Noch keine Firmenraten hinterlegt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Vertragsbedingungen</h2>
        {contract.terms.length === 0 && (
          <p className="text-sm text-neutral-500">Keine Vertragsbedingungen hinterlegt.</p>
        )}
        <ul className="space-y-1">
          {contract.terms.map((t) => (
            <li key={t.termId}>
              {t.term.fileUrl ? (
                <a
                  href={t.term.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {t.term.title} ({t.term.language}, gültig ab {formatDate(t.term.validFrom)})
                </a>
              ) : (
                <span>
                  {t.term.title} ({t.term.language}, gültig ab {formatDate(t.term.validFrom)})
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500 mt-2">
          Der vollständige Vertragstext ist Teil der{" "}
          <Link href={`/portal/contracts/${contract.id}/print`} className="underline">
            Druckansicht
          </Link>
          .
        </p>
      </div>

      {contract.additionalAgreement && (
        <div className="card">
          <h2 className="font-semibold mb-2">Zusatzvereinbarung</h2>
          <p className="text-sm whitespace-pre-wrap">{contract.additionalAgreement}</p>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Unterschrift</h2>

        {contract.status === "AWAITING_SIGNATURE" && isRequiredSigner && !alreadySignedByViewer && (
          <ContractSignForm contractId={contract.id} />
        )}

        {contract.status === "AWAITING_SIGNATURE" && isRequiredSigner && alreadySignedByViewer && (
          <p className="text-sm text-green-700">
            Vielen Dank, Ihre Unterschrift wurde gespeichert. Wir warten auf die zweite Unterschrift.
          </p>
        )}

        {contract.status === "AWAITING_SIGNATURE" && !isRequiredSigner && (
          <p className="text-sm text-neutral-500">
            Dieser Vertrag wartet auf die Unterschrift von {contract.contact.firstName}{" "}
            {contract.contact.lastName}
            {contract.secondContact
              ? ` bzw. ${contract.secondContact.firstName} ${contract.secondContact.lastName}`
              : ""}
            .
          </p>
        )}

        {contract.status === "DRAFT" && (
          <p className="text-sm text-neutral-500">Dieser Vertrag befindet sich noch in Bearbeitung.</p>
        )}

        {["AWAITING_FINALIZATION", "RUNNING", "ENDED", "NOT_CONCLUDED"].includes(contract.status) && (
          <p className="text-sm text-neutral-500">
            Dieser Link ist nicht mehr gültig, da der Vertrag bereits abgesendet wurde.
          </p>
        )}
      </div>

      {(contract.status === "RUNNING" || contract.status === "ENDED") && (
        <Link href={`/portal/contracts/${contract.id}/print`} className="btn-secondary inline-block">
          Druckansicht / Als PDF speichern
        </Link>
      )}
    </div>
  );
}
