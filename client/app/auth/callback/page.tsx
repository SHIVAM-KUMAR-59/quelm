"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

const AuthCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { setAuth } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const userParam = searchParams.get("user");

    if (!accessToken || !userParam) {
      router.replace("/auth/login");
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));

      setAuth(accessToken, user);

      router.replace("/dashboard");
    } catch {
      router.replace("/auth/login");
    }
  }, [router, searchParams, setAuth]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />

        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Signing you in</h1>

          <p className="text-sm text-muted-foreground">
            Please wait while we complete authentication...
          </p>
        </div>
      </div>
    </main>
  );
};

export default AuthCallbackPage;
