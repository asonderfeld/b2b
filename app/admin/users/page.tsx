import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/authz";
import { userRoleLabels } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SALES"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nutzer (Vertrieb/Admin)</h1>
        <Link href="/admin/users/new" className="btn-primary">
          + Neuer Nutzer
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Unterschrift</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50">
                <td>
                  <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline font-medium">
                    {u.name}
                  </Link>
                </td>
                <td>{u.email}</td>
                <td>{userRoleLabels[u.role]}</td>
                <td>{u.signatureUrl ? "hinterlegt" : "–"}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-neutral-500 py-6">
                  Keine Nutzer vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
