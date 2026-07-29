"use client";

import { useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-Mail oder Passwort ist falsch.");
      return;
    }

    // Nach Login: Rolle über Session-Endpoint neu laden und weiterleiten.
    const res = await fetch("/api/auth/session");
    const freshSession = await res.json();
    const role = freshSession?.user?.role;
    const callbackUrl = searchParams.get("callbackUrl");

    if (callbackUrl) {
      router.push(callbackUrl);
    } else if (role === "ADMIN" || role === "SALES") {
      router.push("/admin");
    } else if (role === "CUSTOMER") {
      router.push("/portal");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-primary">mk | hotels</div>
          <p className="text-neutral-500 text-sm mt-1">Firmenraten-Verwaltung</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h1 className="text-lg font-semibold">Login</h1>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="label">E-Mail</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Passwort</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-6">
          <Link href="/anfrage" className="underline underline-offset-4">
            Noch kein Kunde? Firmenrate anfragen
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
