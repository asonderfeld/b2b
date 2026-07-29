import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/authz";
import {
  requestStatusLabels,
  requestStatusColors,
  contractStatusLabels,
  contractStatusColors,
  formatDate,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const session = await getSession();
  if (!session?.user.contactId) {
    return (
      <div className="card">
        Ihrem Benutzerkonto ist kein Ansprechpartner zugeordnet. Bitte wenden Sie sich an mk | hotels.
      </div>
    );
  }

  const contact = await prisma.contact.findUnique({
    where: { id: session.user.contactId },
    include: { company: true },
  });

  if (!contact) redirect("/login");

  const [requests, contracts] = await Promise.all([
    prisma.contractRequest.findMany({
      where: { companyId: contact.companyId },
      orderBy: { createdAt: "desc" },
      include: { hotelLines: { include: { hotel: true } } },
    }),
    prisma.contract.findMany({
      where: { companyId: contact.companyId },
      orderBy: { createdAt: "desc" },
      include: { rates: { include: { rate: { include: { hotel: true } } } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Willkommen, {contact.firstName} {contact.lastName}</h1>
        <p className="text-neutral-500">{contact.company.name}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ihre Anfragen</h2>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Hotels</th>
                <th>Status</th>
                <th>Eingegangen</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.requestNumber}</td>
                  <td>{r.hotelLines.map((l) => l.hotel.name).join(", ")}</td>
                  <td>
                    <StatusBadge label={requestStatusLabels[r.status]} colorClass={requestStatusColors[r.status]} />
                  </td>
                  <td>{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-neutral-500 py-6">
                    Keine Anfragen vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ihre Verträge</h2>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Hotel(s)</th>
                <th>Laufzeit bis</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>{c.contractNumber}</td>
                  <td>{[...new Set(c.rates.map((r) => r.rate.hotel.name))].join(", ") || "–"}</td>
                  <td>{formatDate(c.contractEndDate)}</td>
                  <td>
                    <StatusBadge label={contractStatusLabels[c.status]} colorClass={contractStatusColors[c.status]} />
                  </td>
                  <td>
                    <Link href={`/portal/contracts/${c.id}`} className="text-primary hover:underline">
                      Öffnen
                    </Link>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-neutral-500 py-6">
                    Keine Verträge vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
