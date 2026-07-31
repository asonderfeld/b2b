"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function MagicLoginInner({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Bewusst KEIN automatischer Login beim reinen Laden der Seite (z.B. per
  // useEffect): viele Firmen-Mailsysteme (Microsoft 365 Safe Links,
  // Mimecast, Proofpoint u.ä.) rufen Links in eingehenden E-Mails automatisch
  // im Hintergrund auf, um sie auf Schadsoftware zu prüfen – noch bevor der
  // eigentliche Empfänger klickt. Da der Login-Link nur einmal gültig ist,
  // würde ein automatischer Login den Token verbrennen, bevor der Kunde ihn
  // überhaupt nutzen konnte. Der Login wird daher erst durch einen echten
  // Klick auf den Button ausgelöst.
  async function handleLogin() {
    setLoading(true);
    setError(null);

    const result = await signIn("magic-link", { token, redirect: false });

    if (!result || result.error) {
      setError("Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.");
      setLoading(false);
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/portal";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-2xl font-semibold text-primary mb-6">mk | hotels</div>
        {error ? (
          <div className="card space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <Link href="/login" className="btn-secondary inline-flex">
              Zum normalen Login
            </Link>
          </div>
        ) : (
          <div className="card space-y-4">
            <p className="text-sm text-neutral-600">
              Klicken Sie auf den Button, um sich anzumelden und Ihren Vertrag zu öffnen.
            </p>
            <button type="button" className="btn-primary w-full" onClick={handleLogin} disabled={loading}>
              {loading ? "Anmelden…" : "Jetzt anmelden"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MagicLoginPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={null}>
      <MagicLoginInner token={params.token} />
    </Suspense>
  );
}
