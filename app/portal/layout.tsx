import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "CUSTOMER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">mk | hotels – Kundenportal</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/80">{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">{children}</main>
    </div>
  );
}
