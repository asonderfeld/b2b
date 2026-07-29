"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";

export function ContractSignForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const padRef = useRef<SignaturePadHandle>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accepted) {
      setError(
        "Bitte bestätigen Sie, dass Sie den Vertrag inkl. Vertragsbedingungen rechtsverbindlich annehmen.",
      );
      return;
    }
    if (!padRef.current || padRef.current.isEmpty()) {
      setError("Bitte unterschreiben Sie im Signaturfeld.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureDataUrl: padRef.current.toDataURL(),
          acceptedTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Signatur konnte nicht gespeichert werden.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      <div>
        <label className="label">Ihre Unterschrift</label>
        <SignaturePad ref={padRef} />
        <button
          type="button"
          className="text-xs text-neutral-500 underline mt-1"
          onClick={() => padRef.current?.clear()}
        >
          Signatur löschen
        </button>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          Hiermit nehme ich den Vertrag inkl. Vertragsbedingungen rechtsverbindlich an.
        </span>
      </label>
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Wird gesendet…" : "Vertrag unterschreiben"}
      </button>
    </form>
  );
}
