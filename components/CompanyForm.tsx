"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { companyStatusLabels } from "@/lib/labels";

export type CompanyFormData = {
  id?: string;
  status: string;
  name: string;
  nameAddition: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  emailGeneral: string;
  emailInvoice: string;
  vatId: string;
  phone: string;
  website: string;
  industry: string;
  apaleoId: string;
  apaleoCode: string;
};

const EMPTY: CompanyFormData = {
  status: "INTERESSENT",
  name: "",
  nameAddition: "",
  street: "",
  zip: "",
  city: "",
  country: "Deutschland",
  emailGeneral: "",
  emailInvoice: "",
  vatId: "",
  phone: "",
  website: "",
  industry: "",
  apaleoId: "",
  apaleoCode: "",
};

export function CompanyForm({ initial }: { initial?: CompanyFormData }) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyFormData>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/admin/companies/${form.id}` : "/api/admin/companies";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      router.push("/admin/companies");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Diese Firma wirklich löschen? Zugehörige Kontakte, Anfragen und Verträge werden mitgelöscht.")) return;
    const res = await fetch(`/api/admin/companies/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/companies");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(companyStatusLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div />
        <div className="sm:col-span-2">
          <label className="label">Firma *</label>
          <input required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Firma Zusatz</label>
          <input className="input" value={form.nameAddition} onChange={(e) => set("nameAddition", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Straße/Nr. *</label>
          <input required className="input" value={form.street} onChange={(e) => set("street", e.target.value)} />
        </div>
        <div>
          <label className="label">PLZ *</label>
          <input required className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
        </div>
        <div>
          <label className="label">Ort *</label>
          <input required className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <label className="label">Land *</label>
          <input required className="input" value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div />
        <div>
          <label className="label">E-Mail (allgemein)</label>
          <input type="email" className="input" value={form.emailGeneral} onChange={(e) => set("emailGeneral", e.target.value)} />
        </div>
        <div>
          <label className="label">E-Mail (Rechnung) *</label>
          <input required type="email" className="input" value={form.emailInvoice} onChange={(e) => set("emailInvoice", e.target.value)} />
        </div>
        <div>
          <label className="label">USt-IdNr *</label>
          <input required className="input" value={form.vatId} onChange={(e) => set("vatId", e.target.value)} />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div>
          <label className="label">Branche</label>
          <input className="input" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
        </div>
        <div>
          <label className="label">ID (Apaleo)</label>
          <input className="input" value={form.apaleoId} onChange={(e) => set("apaleoId", e.target.value)} />
        </div>
        <div>
          <label className="label">Code (Apaleo)</label>
          <input className="input" value={form.apaleoCode} onChange={(e) => set("apaleoCode", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Speichern…" : "Speichern"}
        </button>
        {form.id && (
          <button type="button" className="btn-danger" onClick={handleDelete}>
            Löschen
          </button>
        )}
      </div>
    </form>
  );
}
