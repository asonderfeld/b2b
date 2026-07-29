import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { contractStatusLabels, contractStatusColors, requestStatusLabels } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [openRequests, contractsByStatus, recentRequests, recentContracts] = await Promise.all([
    prisma.contractRequest.count({
      where: { status: { in: ["NEW", "IN_REVIEW", "OFFER_SENT"] } },
    }),
    prisma.contract.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.contractRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { company: true },
    }),
    prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { company: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    contractsByStatus.map((c) => [c.status, c._count.status]),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card">
          <div className="text-sm text-neutral-500">Offene Anfragen</div>
          <div className="text-3xl font-bold mt-1">{openRequests}</div>
        </div>
        {Object.entries(contractStatusLabels).map(([status, label]) => (
          <div className="card" key={status}>
            <div className="text-sm text-neutral-500">{label}</div>
            <div className="text-3xl font-bold mt-1">{statusCounts[status] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Neueste Anfragen</h2>
            <Link href="/admin/requests" className="text-sm text-primary underline">
              Alle anzeigen
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recentRequests.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <Link href={`/admin/requests/${r.id}`} className="font-medium hover:underline">
                    {r.requestNumber}
                  </Link>{" "}
                  – {r.company.name}
                </div>
                <span className="text-neutral-500">{requestStatusLabels[r.status]}</span>
              </li>
            ))}
            {recentRequests.length === 0 && (
              <li className="py-2 text-sm text-neutral-500">Keine Anfragen vorhanden.</li>
            )}
          </ul>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Neueste Verträge</h2>
            <Link href="/admin/contracts" className="text-sm text-primary underline">
              Alle anzeigen
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recentContracts.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <Link href={`/admin/contracts/${c.id}`} className="font-medium hover:underline">
                    {c.contractNumber}
                  </Link>{" "}
                  – {c.company.name}
                </div>
                <StatusBadge label={contractStatusLabels[c.status]} colorClass={contractStatusColors[c.status]} />
              </li>
            ))}
            {recentContracts.length === 0 && (
              <li className="py-2 text-sm text-neutral-500">Keine Verträge vorhanden.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
