import { TermForm } from "@/components/TermForm";

export const dynamic = "force-dynamic";

export default function NewTermPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neue Vertragsbedingung</h1>
      <TermForm />
    </div>
  );
}
