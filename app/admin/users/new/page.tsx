import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { UserForm } from "@/components/UserForm";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") redirect("/admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neuer Nutzer</h1>
      <UserForm />
    </div>
  );
}
