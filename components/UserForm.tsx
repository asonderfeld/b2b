"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { userRoleLabels } from "@/lib/labels";

export type UserFormData = {
  id?: string;
  name: string;
  email: string;
  role: "ADMIN" | "SALES";
  password: string;
  hasSignature?: boolean;
};

const EMPTY: UserFormData = {
  name: "",
  email: "",
  role: "SALES",
  password: "",
};

export function UserForm({ initial }: { initial?: UserFormData }) {
  const router = useRouter();
  const [form, setForm] = useState<UserFormData>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof UserFormData>(key: K, value: UserFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/admin/users/${form.id}` : "/api/admin/users";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Diesen Nutzer wirklich löschen?")) return;
    const res = await fetch(`/api/admin/users/${form.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
    } else {
      setError(data.error ?? "Löschen fehlgeschlagen.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-lg">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <label className="label">Name *</label>
        <input required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <label className="label">E-Mail *</label>
        <input
          required
          type="email"
          className="input"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>
      <div>
        <label className="label">Rolle *</label>
        <select className="input" value={form.role} onChange={(e) => set("role", e.target.value as "ADMIN" | "SALES")}>
          {(["ADMIN", "SALES"] as const).map((r) => (
            <option key={r} value={r}>
              {userRoleLabels[r]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{form.id ? "Neues Passwort (optional)" : "Passwort *"}</label>
        <input
          required={!form.id}
          type="password"
          minLength={8}
          className="input"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder={form.id ? "Leer lassen, um Passwort nicht zu ändern" : undefined}
          autoComplete="new-password"
        />
        <p className="text-xs text-neutral-500 mt-1">Mindestens 8 Zeichen.</p>
      </div>
      {form.id && (
        <div className="text-sm text-neutral-500">
          Unterschrift: {form.hasSignature ? "hinterlegt" : "noch nicht hinterlegt"} – wird vom
          Nutzer selbst unter „Mein Profil" hochgeladen.
        </div>
      )}
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
