import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { salutationLabels } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kontakte</h1>
        <Link href="/admin/contacts/new" className="btn-primary">
          + Neuer Kontakt
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Firma</th>
              <th>Position</th>
              <th>E-Mail</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td>
                  <Link href={`/admin/contacts/${c.id}`} className="text-primary hover:underline font-medium">
                    {salutationLabels[c.salutation]} {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td>{c.company.name}</td>
                <td>{c.position}</td>
                <td>{c.email}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-neutral-500 py-6">
                  Keine Kontakte vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
