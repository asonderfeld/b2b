import { prisma } from "@/lib/prisma";
import { RateForm } from "@/components/RateForm";

export const dynamic = "force-dynamic";

export default async function NewRatePage() {
  const hotels = await prisma.hotel.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neue Firmenrate</h1>
      <RateForm hotels={hotels.map((h) => ({ id: h.id, name: h.name }))} />
    </div>
  );
}
