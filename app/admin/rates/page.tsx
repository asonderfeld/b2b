import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rateTierLabels } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminRatesPage() {
  const rates = await prisma.rate.findMany({
    orderBy: [{ hotel: { name: "asc" } }, { year: "desc" }],
    include: { hotel: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Firmenraten</h1>
        <Link href="/admin/rates/new" className="btn-primary">
          + Neue Rate
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Jahr</th>
              <th>Ratenstufe</th>
              <th>Bezeichnung</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td>{r.hotel.name}</td>
                <td>{r.year}</td>
                <td>{rateTierLabels[r.rateTier]}</td>
                <td>
                  <Link href={`/admin/rates/${r.id}`} className="text-primary hover:underline font-medium">
                    {r.rateName}
                  </Link>
                </td>
                <td>{r.status === "ACTIVE" ? "Aktiv" : "Inaktiv"}</td>
              </tr>
            ))}
            {rates.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-neutral-500 py-6">
                  Keine Firmenraten vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
