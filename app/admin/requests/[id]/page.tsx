import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  requestStatusLabels,
  requestStatusColors,
  requestSourceLabels,
  salutationLabels,
  formatDateTime,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { ConvertRequestForm } from "@/components/ConvertRequestForm";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetailPage({ params }: { params: { id: string } }) {
  const request = await prisma.contractRequest.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      contact: true,
      hotelLines: { include: { hotel: true } },
      contracts: true,
    },
  });

  if (!request) notFound();

  const responsibleUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SALES"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anfrage {request.requestNumber}</h1>
          <p className="text-sm text-neutral-500">Eingegangen am {formatDateTime(request.createdAt)}</p>
        </div>
        <StatusBadge
          label={requestStatusLabels[request.status]}
          colorClass={requestStatusColors[request.status]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card space-y-2">
          <h2 className="font-semibold mb-2">Unternehmen</h2>
          <div className="text-sm">
            <div className="font-medium">{request.company.name}</div>
            <div>
              {request.company.street}, {request.company.zip} {request.company.city}
            </div>
            <div>{request.company.country}</div>
            <div className="mt-2 text-neutral-500">E-Mail (Rechnung): {request.company.emailInvoice}</div>
            <div className="text-neutral-500">USt-IdNr: {request.company.vatId}</div>
            <div className="mt-2">
              <Link href={`/admin/companies/${request.company.id}`} className="text-primary text-sm underline">
                Firma öffnen
              </Link>
            </div>
          </div>
        </div>

        <div className="card space-y-2">
          <h2 className="font-semibold mb-2">Ansprechpartner</h2>
          <div className="text-sm">
            <div className="font-medium">
              {salutationLabels[request.contact.salutation]} {request.contact.firstName}{" "}
              {request.contact.lastName}
            </div>
            <div>{request.contact.position}</div>
            <div className="mt-2 text-neutral-500">E-Mail: {request.contact.email}</div>
            <div className="text-neutral-500">Telefon: {request.contact.phone}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Angefragte Hotels</h2>
        <table className="table-base">
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Übernachtungen / Jahr</th>
            </tr>
          </thead>
          <tbody>
            {request.hotelLines.map((line) => (
              <tr key={line.id}>
                <td>{line.hotel.name}</td>
                <td>{line.nightsPerYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold mb-2">Weitere Angaben</h2>
        <div className="text-sm">
          <div>Quelle: {requestSourceLabels[request.source]}</div>
          <div className="mt-2 whitespace-pre-wrap">{request.notes || "Keine Anmerkungen."}</div>
        </div>
      </div>

      {request.contracts.length > 0 ? (
        <div className="card">
          <h2 className="font-semibold mb-2">Verknüpfter Vertrag</h2>
          {request.contracts.map((c) => (
            <Link key={c.id} href={`/admin/contracts/${c.id}`} className="text-primary underline">
              {c.contractNumber} öffnen
            </Link>
          ))}
        </div>
      ) : (
        request.status !== "REJECTED" && (
          <div className="card">
            <h2 className="font-semibold mb-3">Vertragsentwurf erstellen</h2>
            <ConvertRequestForm requestId={request.id} users={responsibleUsers} />
          </div>
        )
      )}
    </div>
  );
}
