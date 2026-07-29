import { HotelForm } from "@/components/HotelForm";

export const dynamic = "force-dynamic";

export default function NewHotelPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neues Hotel</h1>
      <HotelForm />
    </div>
  );
}
