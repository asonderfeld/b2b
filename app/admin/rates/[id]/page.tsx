import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RateForm } from "@/components/RateForm";

export const dynamic = "force-dynamic";

export default async function EditRatePage({ params }: { params: { id: string } }) {
  const [rate, hotels] = await Promise.all([
    prisma.rate.findUnique({ where: { id: params.id } }),
    prisma.hotel.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!rate) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Firmenrate bearbeiten</h1>
      <RateForm
        hotels={hotels.map((h) => ({ id: h.id, name: h.name }))}
        initial={{
          id: rate.id,
          hotelId: rate.hotelId,
          year: String(rate.year),
          status: rate.status,
          rateTier: rate.rateTier,
          rateName: rate.rateName,
          rateName2: rate.rateName2 ?? "",
          breakfastPricePerPerson:
            rate.breakfastPricePerPerson != null ? String(rate.breakfastPricePerPerson) : "",
          roomNightsFrom: rate.roomNightsFrom != null ? String(rate.roomNightsFrom) : "",
          roomNightsTo: rate.roomNightsTo != null ? String(rate.roomNightsTo) : "",
        }}
      />
    </div>
  );
}
