import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/authz";
import { UserForm } from "@/components/UserForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") redirect("/admin");

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.role === "CUSTOMER") notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nutzer bearbeiten – {user.name}</h1>
      <UserForm
        initial={{
          id: user.id,
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle ?? "",
          role: user.role as "ADMIN" | "SALES",
          password: "",
          hasSignature: !!user.signatureUrl,
        }}
      />
    </div>
  );
}
