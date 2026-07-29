"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserOption = { id: string; name: string };

export function ConvertRequestForm({
  requestId,
  users,
}: {
  requestId: string;
  users: UserOption[];
}) {
  const router = useRouter();
  const [responsibleUserId, setResponsibleUserId] = useState(users[0]?.id ?? "");
  const [contractEndDate, setContractEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsibleUserId, contractEndDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler beim Erstellen des Vertragsentwurfs.");
      router.push(`/admin/contracts/${data.contractId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <label className="label">Verantwortlicher (intern)</label>
        <select
          className="input"
          required
          value={responsibleUserId}
          onChange={(e) => setResponsibleUserId(e.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Vertragslaufzeit bis</label>
        <input
          type="date"
          className="input"
          required
          value={contractEndDate}
          onChange={(e) => setContractEndDate(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Wird erstellt…" : "Vertragsentwurf erstellen"}
      </button>
    </form>
  );
}
