import { CompanyForm } from "@/components/CompanyForm";

export const dynamic = "force-dynamic";

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neue Firma</h1>
      <CompanyForm />
    </div>
  );
}
