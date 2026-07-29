import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const hotels = await prisma.hotel.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hotels</h1>
        <Link href="/admin/hotels/new" className="btn-primary">
          + Neues Hotel
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Ort</th>
              <th>Aktiv für Firmenraten</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((h) => (
              <tr key={h.id} className="hover:bg-neutral-50">
                <td>
                  <Link href={`/admin/hotels/${h.id}`} className="text-primary hover:underline font-medium">
                    {h.name}
                  </Link>
                </td>
                <td>{h.city}</td>
                <td>{h.activeForCorporateRates ? "Ja" : "Nein"}</td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-neutral-500 py-6">
                  Keine Hotels vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
