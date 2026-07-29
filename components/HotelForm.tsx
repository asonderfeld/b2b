"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type HotelFormData = {
  id?: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  category: string;
  apaleoId: string;
  apaleoCode: string;
  currency: string;
  website: string;
  reservationPhone: string;
  reservationEmail: string;
  activeForCorporateRates: boolean;
  contractDescriptionDe: string;
  contractDescriptionEn: string;
  parkingInfoDe: string;
  parkingInfoEn: string;
  cancellationTermsDe: string;
  cancellationTermsEn: string;
  otherInfoDe: string;
  otherInfoEn: string;
};

const EMPTY: HotelFormData = {
  name: "",
  street: "",
  zip: "",
  city: "",
  country: "Deutschland",
  category: "",
  apaleoId: "",
  apaleoCode: "",
  currency: "EUR",
  website: "",
  reservationPhone: "",
  reservationEmail: "",
  activeForCorporateRates: true,
  contractDescriptionDe: "",
  contractDescriptionEn: "",
  parkingInfoDe: "",
  parkingInfoEn: "",
  cancellationTermsDe: "",
  cancellationTermsEn: "",
  otherInfoDe: "",
  otherInfoEn: "",
};

export function HotelForm({ initial }: { initial?: HotelFormData }) {
  const router = useRouter();
  const [form, setForm] = useState<HotelFormData>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof HotelFormData>(key: K, value: HotelFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/admin/hotels/${form.id}` : "/api/admin/hotels";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      router.push("/admin/hotels");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Dieses Hotel wirklich löschen?")) return;
    const res = await fetch(`/api/admin/hotels/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/hotels");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="card space-y-4">
        <h2 className="font-semibold">Stammdaten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Name *</label>
            <input required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
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
          <div>
            <label className="label">Kategorie (Sterne)</label>
            <input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div>
            <label className="label">Währung</label>
            <input className="input" value={form.currency} onChange={(e) => set("currency", e.target.value)} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div>
            <label className="label">Reservierung Telefon</label>
            <input className="input" value={form.reservationPhone} onChange={(e) => set("reservationPhone", e.target.value)} />
          </div>
          <div>
            <label className="label">Reservierung E-Mail</label>
            <input className="input" value={form.reservationEmail} onChange={(e) => set("reservationEmail", e.target.value)} />
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.activeForCorporateRates}
            onChange={(e) => set("activeForCorporateRates", e.target.checked)}
          />
          Im öffentlichen Anfrageformular wählbar (aktiv für Firmenraten)
        </label>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Vertragstexte (DE / EN)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Vertragsbeschreibung (DE)</label>
            <textarea className="input" rows={3} value={form.contractDescriptionDe} onChange={(e) => set("contractDescriptionDe", e.target.value)} />
          </div>
          <div>
            <label className="label">Vertragsbeschreibung (EN)</label>
            <textarea className="input" rows={3} value={form.contractDescriptionEn} onChange={(e) => set("contractDescriptionEn", e.target.value)} />
          </div>
          <div>
            <label className="label">Parkinformationen (DE)</label>
            <textarea className="input" rows={3} value={form.parkingInfoDe} onChange={(e) => set("parkingInfoDe", e.target.value)} />
          </div>
          <div>
            <label className="label">Parkinformationen (EN)</label>
            <textarea className="input" rows={3} value={form.parkingInfoEn} onChange={(e) => set("parkingInfoEn", e.target.value)} />
          </div>
          <div>
            <label className="label">Stornobedingungen (DE)</label>
            <textarea className="input" rows={3} value={form.cancellationTermsDe} onChange={(e) => set("cancellationTermsDe", e.target.value)} />
          </div>
          <div>
            <label className="label">Stornobedingungen (EN)</label>
            <textarea className="input" rows={3} value={form.cancellationTermsEn} onChange={(e) => set("cancellationTermsEn", e.target.value)} />
          </div>
          <div>
            <label className="label">Sonstige Hinweise (DE)</label>
            <textarea className="input" rows={3} value={form.otherInfoDe} onChange={(e) => set("otherInfoDe", e.target.value)} />
          </div>
          <div>
            <label className="label">Sonstige Hinweise (EN)</label>
            <textarea className="input" rows={3} value={form.otherInfoEn} onChange={(e) => set("otherInfoEn", e.target.value)} />
          </div>
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
