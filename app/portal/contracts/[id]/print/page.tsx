import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/authz";
import { formatDate } from "@/lib/labels";
import { MK_HOTELS_CONTRACT_PARTY } from "@/lib/contractParty";
import { PrintButton } from "@/components/PrintButton";
import type { Hotel } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PortalContractPrintPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isInternal = session.user.role === "ADMIN" || session.user.role === "SALES";

  let viewerCompanyId: string | null = null;
  if (!isInternal) {
    if (!session.user.contactId) redirect("/login");
    const viewerContact = await prisma.contact.findUnique({ where: { id: session.user.contactId } });
    if (!viewerContact) redirect("/login");
    viewerCompanyId = viewerContact.companyId;
  }

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

  if (!contract || (!isInternal && contract.companyId !== viewerCompanyId)) {
    notFound();
  }

  const isEn = contract.language === "EN";
  const pick = (de: string | null, en: string | null) => (isEn ? en || de : de) || "";

  // Eindeutige Hotels aus den Firmenraten des Vertrags, jeweils mit ihren Raten.
  const hotelMap = new Map<string, { hotel: Hotel; rates: typeof contract.rates }>();
  for (const r of contract.rates) {
    const h = r.rate.hotel;
    if (!hotelMap.has(h.id)) hotelMap.set(h.id, { hotel: h, rates: [] });
    hotelMap.get(h.id)!.rates.push(r);
  }
  const hotelGroups = Array.from(hotelMap.values());

  const contractYear = (contract.contractDate ?? contract.contractEndDate).getFullYear();

  return (
    <div className="bg-white text-neutral-900 max-w-3xl mx-auto p-8 print:p-0 text-sm leading-relaxed">
      <div className="no-print mb-6">
        <PrintButton />
      </div>

      {/* Deckblatt */}
      <section className="text-center mb-12">
        <div className="text-xl font-semibold text-primary mb-1">mk | hotels</div>
        <h1 className="text-lg font-bold mt-8">Firmenpreisvertrag {contractYear}</h1>
        <p className="text-xs text-neutral-500 mt-1">Vertragsnummer {contract.contractNumber}</p>

        <div className="mt-10 text-neutral-500">Zwischen</div>
        <div className="mt-4 space-y-0.5">
          <div className="font-semibold">{contract.company.name}</div>
          <div>
            {contract.contact.firstName} {contract.contact.lastName}
          </div>
          <div>{contract.company.street}</div>
          <div>
            {contract.company.zip} {contract.company.city}
          </div>
          <div>{contract.company.country}</div>
          {contract.contact.phone && <div className="mt-2">Telefon: {contract.contact.phone}</div>}
          <div>E-Mail: {contract.contact.email}</div>
          <div>E-Mail (Rechnungsversand): {contract.company.emailInvoice}</div>
        </div>
        <div className="mt-3 italic text-neutral-500">nachfolgend „Firma" genannt</div>

        <div className="mt-10 text-neutral-500">und</div>
        <div className="mt-4 space-y-0.5">
          <div className="font-semibold">{MK_HOTELS_CONTRACT_PARTY.name}</div>
          <div>{contract.responsibleUser.name}</div>
          <div>{MK_HOTELS_CONTRACT_PARTY.street}</div>
          <div>
            {MK_HOTELS_CONTRACT_PARTY.zip} {MK_HOTELS_CONTRACT_PARTY.city}
          </div>
          <div>{MK_HOTELS_CONTRACT_PARTY.country}</div>
          <div className="mt-2">Telefon: {MK_HOTELS_CONTRACT_PARTY.phone}</div>
          <div>Fax: {MK_HOTELS_CONTRACT_PARTY.fax}</div>
          <div>E-Mail: {contract.responsibleUser.email}</div>
        </div>
        <div className="mt-3 italic text-neutral-500">nachfolgend mk | hotels genannt</div>
      </section>

      {/* Vertragstexte */}
      {contract.terms.length > 0 && (
        <section style={{ breakBefore: "page" }} className="pt-8">
          {contract.terms.map(({ term }) => (
            <div key={term.id} className="mb-8">
              {contract.terms.length > 1 && <h2 className="font-semibold mb-2">{term.title}</h2>}
              {term.bodyText && <div className="whitespace-pre-wrap">{term.bodyText}</div>}
            </div>
          ))}
        </section>
      )}

      {contract.additionalAgreement && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Zusatzvereinbarung</h2>
          <p className="whitespace-pre-wrap">{contract.additionalAgreement}</p>
        </section>
      )}

      {/* Unterschriften */}
      <section style={{ breakBefore: "page" }} className="pt-8">
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div>
            {MK_HOTELS_CONTRACT_PARTY.city}, den {formatDate(contract.contractDate)}
          </div>
          <div>
            {contract.company.city}, den {formatDate(contract.contractDate)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-neutral-500 mb-1">Unterschrift mk | hotels</div>
            {contract.responsibleUser.signatureUrl ? (
              <img
                src={contract.responsibleUser.signatureUrl}
                alt="Unterschrift mk | hotels"
                className="h-16"
              />
            ) : (
              <div className="h-16 border-b border-neutral-400" />
            )}
            <div className="mt-1">{contract.responsibleUser.name}</div>
            {contract.responsibleUser.jobTitle && (
              <div className="text-xs text-neutral-500">{contract.responsibleUser.jobTitle}</div>
            )}
          </div>
          <div>
            <div className="text-neutral-500 mb-1">Unterschrift Firma</div>
            {contract.signature1Url ? (
              <img src={contract.signature1Url} alt="Unterschrift 1" className="h-16" />
            ) : (
              <div className="h-16 border-b border-neutral-400" />
            )}
            <div className="mt-1">
              {contract.contact.firstName} {contract.contact.lastName}
            </div>
            <div className="text-xs text-neutral-500">{contract.contact.position}</div>
          </div>
        </div>

        {contract.secondContact && (
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div />
            <div>
              <div className="text-neutral-500 mb-1">
                Unterschrift {contract.secondContact.firstName} {contract.secondContact.lastName}
              </div>
              {contract.signature2Url ? (
                <img src={contract.signature2Url} alt="Unterschrift 2" className="h-16" />
              ) : (
                <div className="h-16 border-b border-neutral-400" />
              )}
              <div className="mt-1">
                {contract.secondContact.firstName} {contract.secondContact.lastName}
              </div>
              <div className="text-xs text-neutral-500">{contract.secondContact.position}</div>
            </div>
          </div>
        )}
      </section>

      {/* Hotelinformationen */}
      {hotelGroups.map(({ hotel, rates }) => (
        <section key={hotel.id} style={{ breakBefore: "page" }} className="pt-8">
          <h2 className="font-semibold text-base mb-3">{hotel.name}</h2>

          {pick(hotel.contractDescriptionDe, hotel.contractDescriptionEn) && (
            <p className="whitespace-pre-wrap mb-4">
              {pick(hotel.contractDescriptionDe, hotel.contractDescriptionEn)}
            </p>
          )}

          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-4 align-top text-neutral-500 w-1/3">
                  {hotel.name}
                  {hotel.category ? <div className="text-xs">{hotel.category}</div> : null}
                </td>
                <td className="py-1.5 align-top">
                  {hotel.street}
                  <br />
                  {hotel.zip} {hotel.city}
                </td>
              </tr>
              {hotel.reservationPhone && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">Reservierung Telefon</td>
                  <td className="py-1.5">{hotel.reservationPhone}</td>
                </tr>
              )}
              {hotel.reservationEmail && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">Reservierung E-Mail</td>
                  <td className="py-1.5">{hotel.reservationEmail}</td>
                </tr>
              )}
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-4 text-neutral-500">Zimmerraten exkl. Frühstück</td>
                <td className="py-1.5">
                  {rates.map((r) => (
                    <div key={r.rateId}>
                      {r.rate.rateName}
                      {r.rate.rateName2 ? ` / ${r.rate.rateName2}` : ""}
                    </div>
                  ))}
                </td>
              </tr>
              {rates.some((r) => r.rate.breakfastPricePerPerson != null) && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">Frühstückspreis pro Person</td>
                  <td className="py-1.5">
                    {rates
                      .filter((r) => r.rate.breakfastPricePerPerson != null)
                      .map((r) => `${r.rate.breakfastPricePerPerson} ${hotel.currency}`)
                      .join(", ")}
                  </td>
                </tr>
              )}
              {pick(hotel.vatInfoDe, hotel.vatInfoEn) && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">MwSt.</td>
                  <td className="py-1.5">{pick(hotel.vatInfoDe, hotel.vatInfoEn)}</td>
                </tr>
              )}
              {pick(hotel.cancellationTermsDe, hotel.cancellationTermsEn) && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">Stornierungsfrist</td>
                  <td className="py-1.5">{pick(hotel.cancellationTermsDe, hotel.cancellationTermsEn)}</td>
                </tr>
              )}
              {pick(hotel.internetInfoDe, hotel.internetInfoEn) && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">Internet</td>
                  <td className="py-1.5">{pick(hotel.internetInfoDe, hotel.internetInfoEn)}</td>
                </tr>
              )}
              {pick(hotel.parkingInfoDe, hotel.parkingInfoEn) && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">Parken</td>
                  <td className="py-1.5">{pick(hotel.parkingInfoDe, hotel.parkingInfoEn)}</td>
                </tr>
              )}
              {pick(hotel.otherInfoDe, hotel.otherInfoEn) && (
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-4 text-neutral-500">Sonstiges</td>
                  <td className="py-1.5">{pick(hotel.otherInfoDe, hotel.otherInfoEn)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ))}

      <footer className="mt-12 text-xs text-neutral-400 border-t border-neutral-200 pt-4">
        mk | hotels – automatisch erzeugte Vertragsansicht – {contract.contractNumber}
      </footer>
    </div>
  );
}
