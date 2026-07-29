import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { contractStatusLabels, contractStatusColors, formatDate } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import type { ContractStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminContractsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status as ContractStatus | undefined;

  const contracts = await prisma.contract.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { company: true, responsibleUser: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Verträge</h1>

      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/contracts" className={`btn-secondary ${!status ? "border-primary text-primary" : ""}`}>
          Alle
        </Link>
        {Object.entries(contractStatusLabels).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/contracts?status=${value}`}
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
              <th>Verantwortlich</th>
              <th>Laufzeit bis</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td>
                  <Link href={`/admin/contracts/${c.id}`} className="text-primary hover:underline font-medium">
                    {c.contractNumber}
                  </Link>
                </td>
                <td>{c.company.name}</td>
                <td>{c.responsibleUser.name}</td>
                <td>{formatDate(c.contractEndDate)}</td>
                <td>
                  <StatusBadge label={contractStatusLabels[c.status]} colorClass={contractStatusColors[c.status]} />
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-neutral-500 py-6">
                  Keine Verträge gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
