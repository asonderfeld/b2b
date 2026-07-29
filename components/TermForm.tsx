"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TermFormData = {
  id?: string;
  title: string;
  language: string;
  validFrom: string;
  fileUrl: string;
};

const EMPTY: TermFormData = { title: "", language: "DE", validFrom: "", fileUrl: "" };

export function TermForm({ initial }: { initial?: TermFormData }) {
  const router = useRouter();
  const [form, setForm] = useState<TermFormData>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TermFormData>(key: K, value: TermFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/admin/terms/${form.id}` : "/api/admin/terms";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      router.push("/admin/terms");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Diese Vertragsbedingung wirklich löschen?")) return;
    const res = await fetch(`/api/admin/terms/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/terms");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-xl">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <label className="label">Titel *</label>
        <input required className="input" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="label">Sprache</label>
        <select className="input" value={form.language} onChange={(e) => set("language", e.target.value)}>
          <option value="DE">Deutsch</option>
          <option value="EN">Englisch</option>
        </select>
      </div>
      <div>
        <label className="label">Gültig ab *</label>
        <input required type="date" className="input" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} />
      </div>
      <div>
        <label className="label">Datei-URL / Pfad (PDF) *</label>
        <input
          required
          className="input"
          placeholder="/dokumente/agb-2026-de.pdf"
          value={form.fileUrl}
          onChange={(e) => set("fileUrl", e.target.value)}
        />
        <p className="text-xs text-neutral-500 mt-1">
          MVP-Hinweis: Es wird kein Datei-Upload durchgeführt – hier wird der Pfad/die URL zur bereits
          abgelegten PDF-Datei hinterlegt (z.B. in einem Objektspeicher wie Vercel Blob oder S3).
        </p>
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
