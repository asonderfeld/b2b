import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminTermsPage() {
  const terms = await prisma.contractTerm.findMany({ orderBy: { validFrom: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vertragsbedingungen</h1>
        <Link href="/admin/terms/new" className="btn-primary">
          + Neue Vertragsbedingung
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Sprache</th>
              <th>Gültig ab</th>
              <th>Text</th>
              <th>Datei</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.id} className="hover:bg-neutral-50">
                <td>
                  <Link href={`/admin/terms/${t.id}`} className="text-primary hover:underline font-medium">
                    {t.title}
                  </Link>
                </td>
                <td>{t.language}</td>
                <td>{formatDate(t.validFrom)}</td>
                <td>{t.bodyText ? "hinterlegt" : "–"}</td>
                <td className="truncate max-w-xs">{t.fileUrl || "–"}</td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-neutral-500 py-6">
                  Keine Vertragsbedingungen vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
