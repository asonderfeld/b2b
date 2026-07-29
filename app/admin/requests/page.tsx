import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requestStatusLabels, requestStatusColors, formatDateTime } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import type { RequestStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status as RequestStatus | undefined;

  const requests = await prisma.contractRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { company: true, contact: true, hotelLines: { include: { hotel: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Anfragen</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/requests" className={`btn-secondary ${!status ? "border-primary text-primary" : ""}`}>
          Alle
        </Link>
        {Object.entries(requestStatusLabels).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/requests?status=${value}`}
            className={`btn-secondary ${status === value ? "border-primary text-primary" : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nr.</th>
              <th>Firma</th>
              <th>Ansprechpartner</th>
              <th>Hotels</th>
              <th>Status</th>
              <th>Eingegangen</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td>
                  <Link href={`/admin/requests/${r.id}`} className="text-primary hover:underline font-medium">
                    {r.requestNumber}
                  </Link>
                </td>
                <td>{r.company.name}</td>
                <td>
                  {r.contact.firstName} {r.contact.lastName}
                </td>
                <td>{r.hotelLines.map((l) => l.hotel.name).join(", ")}</td>
                <td>
                  <StatusBadge label={requestStatusLabels[r.status]} colorClass={requestStatusColors[r.status]} />
                </td>
                <td>{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-neutral-500 py-6">
                  Keine Anfragen gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
