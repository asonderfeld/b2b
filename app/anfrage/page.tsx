import { prisma } from "@/lib/prisma";
import { AnfrageForm } from "@/components/AnfrageForm";

export const dynamic = "force-dynamic";

export default async function AnfragePage() {
  const hotels = await prisma.hotel.findMany({
    where: { activeForCorporateRates: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="bg-primary text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="text-lg font-semibold tracking-wide mb-2">mk | hotels</div>
          <h1 className="text-2xl font-bold">Anfrage Firmenraten</h1>
          <p className="mt-2 text-white/90 max-w-2xl">
            Herzlich willkommen bei mk | hotels! Über dieses Formular können Sie
            unverbindlich Firmenraten für Ihr Unternehmen anfragen. Nach
            Prüfung Ihrer Anfrage erhalten Sie einen individuellen
            Vertragsentwurf.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <AnfrageForm hotels={hotels} />
      </div>
    </main>
  );
}
