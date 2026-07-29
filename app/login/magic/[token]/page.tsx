"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function MagicLoginInner({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await signIn("magic-link", { token, redirect: false });
      if (cancelled) return;

      if (!result || result.error) {
        setError("Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.");
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/portal";
      router.push(callbackUrl);
      router.refresh();
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
          <p className="text-neutral-500 text-sm">Sie werden angemeldet…</p>
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
