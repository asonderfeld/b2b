import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HotelForm } from "@/components/HotelForm";

export const dynamic = "force-dynamic";

export default async function EditHotelPage({ params }: { params: { id: string } }) {
  const hotel = await prisma.hotel.findUnique({ where: { id: params.id } });
  if (!hotel) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hotel bearbeiten – {hotel.name}</h1>
      <HotelForm
        initial={{
          id: hotel.id,
          name: hotel.name,
          street: hotel.street,
          zip: hotel.zip,
          city: hotel.city,
          country: hotel.country,
          category: hotel.category ?? "",
          apaleoId: hotel.apaleoId ?? "",
          apaleoCode: hotel.apaleoCode ?? "",
          currency: hotel.currency,
          website: hotel.website ?? "",
          reservationPhone: hotel.reservationPhone ?? "",
          reservationEmail: hotel.reservationEmail ?? "",
          activeForCorporateRates: hotel.activeForCorporateRates,
          contractDescriptionDe: hotel.contractDescriptionDe ?? "",
          contractDescriptionEn: hotel.contractDescriptionEn ?? "",
          parkingInfoDe: hotel.parkingInfoDe ?? "",
          parkingInfoEn: hotel.parkingInfoEn ?? "",
          cancellationTermsDe: hotel.cancellationTermsDe ?? "",
          cancellationTermsEn: hotel.cancellationTermsEn ?? "",
          otherInfoDe: hotel.otherInfoDe ?? "",
          otherInfoEn: hotel.otherInfoEn ?? "",
        }}
      />
    </div>
  );
}
