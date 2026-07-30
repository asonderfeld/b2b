"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_BYTES = 1_000_000; // 1 MB

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; jobTitle: string | null; signatureUrl: string | null };
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(initial.name);
  const [jobTitle, setJobTitle] = useState(initial.jobTitle ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [signaturePreview, setSignaturePreview] = useState<string | null>(initial.signatureUrl);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null | undefined>(undefined); // undefined = unverändert
  const [signatureRemoved, setSignatureRemoved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.type !== "image/png") {
      setError("Bitte eine PNG-Datei auswählen.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Die Datei ist zu groß (max. 1 MB).");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSignaturePreview(dataUrl);
      setSignatureDataUrl(dataUrl);
      setSignatureRemoved(false);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveSignature() {
    setSignaturePreview(null);
    setSignatureDataUrl(null);
    setSignatureRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword && newPassword !== newPasswordConfirm) {
      setError("Die Passwort-Bestätigung stimmt nicht mit dem neuen Passwort überein.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          jobTitle,
          ...(newPassword ? { currentPassword, newPassword } : {}),
          ...(signatureRemoved || signatureDataUrl !== undefined ? { signatureDataUrl } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setSignatureDataUrl(undefined);
      setSignatureRemoved(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Gespeichert.
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="font-semibold">Stammdaten</h2>
        <div>
          <label className="label">E-Mail</label>
          <input className="input bg-neutral-100" value={initial.email} disabled />
        </div>
        <div>
          <label className="label">Name *</label>
          <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Jobtitel</label>
          <input
            className="input"
            placeholder="z.B. Assistentin der Geschäftsführung"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Erscheint zusammen mit deinem Namen im Unterschriftsblock des Vertragsdokuments.
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Passwort ändern</h2>
        <div>
          <label className="label">Aktuelles Passwort</label>
          <input
            type="password"
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">Neues Passwort</label>
          <input
            type="password"
            minLength={8}
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Neues Passwort bestätigen</label>
          <input
            type="password"
            minLength={8}
            className="input"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <p className="text-xs text-neutral-500">
          Nur ausfüllen, wenn du dein Passwort ändern möchtest. Mindestens 8 Zeichen.
        </p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Unterschrift</h2>
        <p className="text-sm text-neutral-500">
          Diese Unterschrift erscheint auf dem finalen Vertragsdokument, wenn du als
          Verantwortlicher für einen Vertrag hinterlegt bist. PNG mit transparentem Hintergrund,
          max. 1 MB.
        </p>
        {signaturePreview ? (
          <img
            src={signaturePreview}
            alt="Aktuelle Unterschrift"
            className="h-20 border border-neutral-200 rounded bg-white"
          />
        ) : (
          <div className="text-sm text-neutral-400">Noch keine Unterschrift hinterlegt.</div>
        )}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            className="text-sm"
          />
          {signaturePreview && (
            <button type="button" className="btn-secondary" onClick={handleRemoveSignature}>
              Entfernen
            </button>
          )}
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Speichern…" : "Speichern"}
      </button>
    </form>
  );
}
