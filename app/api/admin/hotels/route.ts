import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

function mapData(data: any) {
  return {
    name: data.name,
    street: data.street,
    zip: data.zip,
    city: data.city,
    country: data.country || "Deutschland",
    category: data.category || null,
    apaleoId: data.apaleoId || null,
    apaleoCode: data.apaleoCode || null,
    currency: data.currency || "EUR",
    website: data.website || null,
    reservationPhone: data.reservationPhone || null,
    reservationEmail: data.reservationEmail || null,
    activeForCorporateRates: Boolean(data.activeForCorporateRates),
    contractDescriptionDe: data.contractDescriptionDe || null,
    contractDescriptionEn: data.contractDescriptionEn || null,
    parkingInfoDe: data.parkingInfoDe || null,
    parkingInfoEn: data.parkingInfoEn || null,
    cancellationTermsDe: data.cancellationTermsDe || null,
    cancellationTermsEn: data.cancellationTermsEn || null,
    otherInfoDe: data.otherInfoDe || null,
    otherInfoEn: data.otherInfoEn || null,
  };
}

export async function POST(req: Request) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));
  const hotel = await prisma.hotel.create({ data: mapData(data) });
  return NextResponse.json({ hotel }, { status: 201 });
}
