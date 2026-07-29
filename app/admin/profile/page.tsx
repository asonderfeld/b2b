import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/authz";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES")) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mein Profil</h1>
      <ProfileForm
        initial={{
          name: user.name,
          email: user.email,
          signatureUrl: user.signatureUrl,
        }}
      />
    </div>
  );
}
