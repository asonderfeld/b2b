import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

const BASE_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/requests", label: "Anfragen" },
  { href: "/admin/contracts", label: "Verträge" },
  { href: "/admin/companies", label: "Unternehmen" },
  { href: "/admin/contacts", label: "Kontakte" },
  { href: "/admin/hotels", label: "Hotels" },
  { href: "/admin/rates", label: "Firmenraten" },
  { href: "/admin/terms", label: "Vertragsbedingungen" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES")) {
    redirect("/login");
  }

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(session.user.role === "ADMIN" ? [{ href: "/admin/users", label: "Nutzer" }] : []),
    { href: "/admin/profile", label: "Mein Profil" },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-primary text-white flex-shrink-0 hidden md:flex md:flex-col">
        <div className="px-6 py-6 text-lg font-semibold border-b border-white/20">
          mk | hotels
          <div className="text-xs font-normal text-white/70 mt-1">Interner Bereich</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 rounded-md text-sm hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            Angemeldet als <span className="font-medium text-neutral-800">{session.user.name}</span>{" "}
            ({session.user.role === "ADMIN" ? "Administrator" : "Vertrieb"})
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6 bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
