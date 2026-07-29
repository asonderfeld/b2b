"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { salutationLabels, titleLabels, formalAddressLabels } from "@/lib/labels";

export type ContactFormData = {
  id?: string;
  companyId: string;
  salutation: string;
  title: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  phoneMobile: string;
  formalAddress: string;
};

const EMPTY = (companyId = ""): ContactFormData => ({
  companyId,
  salutation: "HERR",
  title: "",
  firstName: "",
  lastName: "",
  position: "",
  department: "",
  email: "",
  phone: "",
  phoneMobile: "",
  formalAddress: "SIE",
});

export function ContactForm({
  initial,
  companies,
}: {
  initial?: ContactFormData;
  companies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ContactFormData>(initial ?? EMPTY(companies[0]?.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/admin/contacts/${form.id}` : "/api/admin/contacts";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      router.push("/admin/contacts");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Diesen Kontakt wirklich löschen?")) return;
    const res = await fetch(`/api/admin/contacts/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/contacts");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Firma *</label>
          <select required className="input" value={form.companyId} onChange={(e) => set("companyId", e.target.value)}>
            <option value="" disabled>
              – auswählen –
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Anrede *</label>
          <select required className="input" value={form.salutation} onChange={(e) => set("salutation", e.target.value)}>
            {Object.entries(salutationLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Titel</label>
          <select className="input" value={form.title} onChange={(e) => set("title", e.target.value)}>
            <option value="">– kein Titel –</option>
            {Object.entries(titleLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Vorname *</label>
          <input required className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div>
          <label className="label">Familienname *</label>
          <input required className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <div>
          <label className="label">Position *</label>
          <input required className="input" value={form.position} onChange={(e) => set("position", e.target.value)} />
        </div>
        <div>
          <label className="label">Abteilung</label>
          <input className="input" value={form.department} onChange={(e) => set("department", e.target.value)} />
        </div>
        <div>
          <label className="label">E-Mail *</label>
          <input required type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Telefon *</label>
          <input required className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Mobiltelefon</label>
          <input className="input" value={form.phoneMobile} onChange={(e) => set("phoneMobile", e.target.value)} />
        </div>
        <div>
          <label className="label">Anrede-Form</label>
          <select className="input" value={form.formalAddress} onChange={(e) => set("formalAddress", e.target.value)}>
            {Object.entries(formalAddressLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
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
