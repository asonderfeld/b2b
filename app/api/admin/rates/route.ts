import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";

export const dynamic = "force-dynamic";

function mapData(data: any) {
  return {
    hotelId: data.hotelId,
    year: Number(data.year),
    status: data.status || "ACTIVE",
    rateTier: data.rateTier,
    rateName: data.rateName,
    rateName2: data.rateName2 || null,
    breakfastPricePerPerson:
      data.breakfastPricePerPerson === "" || data.breakfastPricePerPerson == null
        ? null
        : Number(data.breakfastPricePerPerson),
    roomNightsFrom: data.roomNightsFrom === "" || data.roomNightsFrom == null ? null : Number(data.roomNightsFrom),
    roomNightsTo: data.roomNightsTo === "" || data.roomNightsTo == null ? null : Number(data.roomNightsTo),
  };
}

export async function POST(req: Request) {
  const auth = await requireRole([...INTERNAL_ROLES]);
  if ("response" in auth) return auth.response;

  const data = await req.json().catch(() => ({}));
  const rate = await prisma.rate.create({ data: mapData(data) });
  return NextResponse.json({ rate }, { status: 201 });
}
