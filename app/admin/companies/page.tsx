import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { companyStatusLabels } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unternehmen</h1>
        <Link href="/admin/companies/new" className="btn-primary">
          + Neue Firma
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Kd.-Nr.</th>
              <th>Firma</th>
              <th>Ort</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td>{c.customerNumber}</td>
                <td>
                  <Link href={`/admin/companies/${c.id}`} className="text-primary hover:underline font-medium">
                    {c.name}
                  </Link>
                </td>
                <td>{c.city}</td>
                <td>{companyStatusLabels[c.status]}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-neutral-500 py-6">
                  Keine Unternehmen vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
