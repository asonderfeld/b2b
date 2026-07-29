"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rateTierLabels } from "@/lib/labels";

export type RateFormData = {
  id?: string;
  hotelId: string;
  year: string;
  status: string;
  rateTier: string;
  rateName: string;
  rateName2: string;
  breakfastPricePerPerson: string;
  roomNightsFrom: string;
  roomNightsTo: string;
};

const EMPTY = (hotelId = ""): RateFormData => ({
  hotelId,
  year: String(new Date().getFullYear()),
  status: "ACTIVE",
  rateTier: "RATE_GE_50",
  rateName: "",
  rateName2: "",
  breakfastPricePerPerson: "",
  roomNightsFrom: "",
  roomNightsTo: "",
});

export function RateForm({
  initial,
  hotels,
}: {
  initial?: RateFormData;
  hotels: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<RateFormData>(initial ?? EMPTY(hotels[0]?.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RateFormData>(key: K, value: RateFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/admin/rates/${form.id}` : "/api/admin/rates";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      router.push("/admin/rates");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Diese Firmenrate wirklich löschen?")) return;
    const res = await fetch(`/api/admin/rates/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/rates");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Hotel *</label>
          <select required className="input" value={form.hotelId} onChange={(e) => set("hotelId", e.target.value)}>
            <option value="" disabled>
              – auswählen –
            </option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Jahr *</label>
          <input required type="number" className="input" value={form.year} onChange={(e) => set("year", e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="ACTIVE">Aktiv</option>
            <option value="INACTIVE">Inaktiv</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Ratenstufe *</label>
          <select required className="input" value={form.rateTier} onChange={(e) => set("rateTier", e.target.value)}>
            {Object.entries(rateTierLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Zimmerrate / Bezeichnung *</label>
          <input required className="input" value={form.rateName} onChange={(e) => set("rateName", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Zimmerrate 2 (optional)</label>
          <input className="input" value={form.rateName2} onChange={(e) => set("rateName2", e.target.value)} />
        </div>
        <div>
          <label className="label">Frühstückspreis p.P. (€)</label>
          <input type="number" step="0.01" className="input" value={form.breakfastPricePerPerson} onChange={(e) => set("breakfastPricePerPerson", e.target.value)} />
        </div>
        <div />
        <div>
          <label className="label">Übernachtungen von</label>
          <input type="number" className="input" value={form.roomNightsFrom} onChange={(e) => set("roomNightsFrom", e.target.value)} />
        </div>
        <div>
          <label className="label">Übernachtungen bis</label>
          <input type="number" className="input" value={form.roomNightsTo} onChange={(e) => set("roomNightsTo", e.target.value)} />
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
