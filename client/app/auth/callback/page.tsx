"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Workflow } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Authentication failed. Please try again.");
      setTimeout(() => router.replace("/auth/login"), 2500);
      return;
    }

    if (!token) {
      setError("No authentication token received.");
      setTimeout(() => router.replace("/auth/login"), 2500);
      return;
    }

    loginWithToken(token)
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        setError("Failed to complete sign-in. Please try again.");
        setTimeout(() => router.replace("/auth/login"), 2500);
      });
  }, [searchParams, router, loginWithToken]);

  return (
    <div className="relative flex flex-col items-center gap-8">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Workflow className="h-6 w-6 text-white" />
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <p className="text-xs text-zinc-500">Redirecting you back to login…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-white">Completing sign-in…</p>
          <p className="text-xs text-zinc-500">You will be redirected automatically.</p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_35%)]" />

      <Suspense
        fallback={
          <div className="relative flex flex-col items-center gap-8">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Workflow className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-medium text-white">Loading…</p>
            </div>
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
