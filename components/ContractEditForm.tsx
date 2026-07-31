"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name?: string; label?: string };

type ContractData = {
  id: string;
  status: string;
  stage: string;
  language: string;
  contractEndDate: string;
  additionalAgreement: string;
  secondContactId: string | null;
  paymentOnInvoice: boolean;
  responsibleUserId: string;
  rateIds: string[];
  termIds: string[];
};

export function ContractEditForm({
  contract,
  users,
  companyContacts,
  allRates,
  allTerms,
}: {
  contract: ContractData;
  users: Option[];
  companyContacts: Option[];
  allRates: Option[];
  allTerms: Option[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(contract);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleMulti(field: "rateIds" | "termIds", id: string) {
    setForm((prev) => {
      const current = new Set(prev[field]);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      return { ...prev, [field]: Array.from(current) };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      setMessage("Änderungen gespeichert.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: string) {
    setActionLoading(action);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Aktion fehlgeschlagen.");
      setMessage(action === "RESEND_LINK" ? "Link wurde erneut versendet." : "Status aktualisiert.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {message && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {message}
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Aktionen</h2>
        <div className="flex flex-wrap gap-3">
          {contract.status === "DRAFT" && (
            <>
              <button
                className="btn-primary"
                disabled={actionLoading !== null}
                onClick={() => runAction("SEND_DRAFT_EXISTING")}
              >
                Vertragsentwurf an Bestandskunden senden
              </button>
              <button
                className="btn-secondary"
                disabled={actionLoading !== null}
                onClick={() => runAction("SEND_DRAFT_NEW")}
              >
                Vertragsentwurf an Neukunden senden
              </button>
            </>
          )}
          {contract.status === "AWAITING_SIGNATURE" && (
            <>
              <p className="text-sm text-neutral-500">
                Warten auf Unterschrift(en) des Kunden im Kundenportal.
              </p>
              <button
                className="btn-secondary"
                disabled={actionLoading !== null}
                onClick={() => runAction("RESEND_LINK")}
              >
                Link erneut senden
              </button>
            </>
          )}
          {contract.status === "AWAITING_FINALIZATION" && contract.stage !== "STAGE_4_FINAL_CREATED" && (
            <button
              className="btn-primary"
              disabled={actionLoading !== null}
              onClick={() => runAction("FINALIZE")}
            >
              Vertrag (final) erstellen
            </button>
          )}
          {contract.status === "AWAITING_FINALIZATION" && contract.stage === "STAGE_4_FINAL_CREATED" && (
            <button
              className="btn-primary"
              disabled={actionLoading !== null}
              onClick={() => runAction("SEND_FINAL")}
            >
              Vertrag (final) an Kunden senden
            </button>
          )}
          {contract.status === "RUNNING" && contract.stage === "STAGE_5_FINAL_SENT" && (
            <>
              <p className="text-sm text-green-700">Der Vertrag läuft.</p>
              <button
                className="btn-secondary"
                disabled={actionLoading !== null}
                onClick={() => runAction("RESEND_LINK")}
              >
                Link erneut senden
              </button>
            </>
          )}
          {contract.status === "RUNNING" && contract.stage !== "STAGE_5_FINAL_SENT" && (
            <p className="text-sm text-green-700">Der Vertrag läuft.</p>
          )}
          {(contract.status === "ENDED" || contract.status === "NOT_CONCLUDED") && (
            <p className="text-sm text-neutral-500">Für diesen Vertrag sind keine weiteren Aktionen möglich.</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="font-semibold">Vertragsdaten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Verantwortlicher</label>
            <select
              className="input"
              value={form.responsibleUserId}
              onChange={(e) => setForm({ ...form, responsibleUserId: e.target.value })}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sprache</label>
            <select
              className="input"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            >
              <option value="DE">Deutsch</option>
              <option value="EN">Englisch</option>
            </select>
          </div>
          <div>
            <label className="label">Vertragslaufzeit bis</label>
            <input
              type="date"
              className="input"
              value={form.contractEndDate}
              onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Zweiter Ansprechpartner (falls zwei Unterschriften nötig)</label>
            <select
              className="input"
              value={form.secondContactId ?? ""}
              onChange={(e) => setForm({ ...form, secondContactId: e.target.value || null })}
            >
              <option value="">– keiner –</option>
              {companyContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Zusatzvereinbarung</label>
          <textarea
            className="input"
            rows={4}
            value={form.additionalAgreement}
            onChange={(e) => setForm({ ...form, additionalAgreement: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.paymentOnInvoice}
            onChange={(e) => setForm({ ...form, paymentOnInvoice: e.target.checked })}
          />
          Zahlung auf Rechnung
        </label>

        <div>
          <label className="label">Firmenraten</label>
          <div className="border border-neutral-200 rounded-md divide-y max-h-56 overflow-y-auto">
            {allRates.map((r) => (
              <label key={r.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.rateIds.includes(r.id)}
                  onChange={() => toggleMulti("rateIds", r.id)}
                />
                {r.label}
              </label>
            ))}
            {allRates.length === 0 && <p className="px-3 py-2 text-sm text-neutral-500">Keine Raten vorhanden.</p>}
          </div>
        </div>

        <div>
          <label className="label">Vertragsbedingungen</label>
          <div className="border border-neutral-200 rounded-md divide-y max-h-56 overflow-y-auto">
            {allTerms.map((t) => (
              <label key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.termIds.includes(t.id)}
                  onChange={() => toggleMulti("termIds", t.id)}
                />
                {t.label}
              </label>
            ))}
            {allTerms.length === 0 && <p className="px-3 py-2 text-sm text-neutral-500">Keine Vertragsbedingungen vorhanden.</p>}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Speichern…" : "Änderungen speichern"}
        </button>
      </form>
    </div>
  );
}
