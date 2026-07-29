import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role === "ADMIN" || session?.user.role === "SALES") {
    redirect("/admin");
  }
  if (session?.user.role === "CUSTOMER") {
    redirect("/portal");
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-primary text-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-wide">mk | hotels</div>
          <Link href="/login" className="text-sm underline underline-offset-4">
            Login für Firmenkunden &amp; Mitarbeiter
          </Link>
        </div>
      </header>

      <section className="flex-1 max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">Firmenraten-Verträge</h1>
        <p className="text-neutral-600 max-w-2xl mb-8">
          Verwalten Sie Anfragen und Verträge für Firmenraten bei mk | hotels
          digital – von der Anfrage über die Vertragsunterzeichnung bis zur
          laufenden Verwaltung.
        </p>
        <div className="flex gap-4">
          <Link href="/anfrage" className="btn-primary">
            Firmenrate anfragen
          </Link>
          <Link href="/login" className="btn-secondary">
            Zum Login
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-6">
        <div className="max-w-5xl mx-auto px-6 text-sm text-neutral-500">
          mk | hotels – Firmenraten-Verwaltung
        </div>
      </footer>
    </main>
  );
}
