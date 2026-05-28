"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

const LoginPage = () => {
  const searchParams = useSearchParams();

  const isUnauthorizedError = searchParams.get("error") === "unauthorized";

  useEffect(() => {
    if (isUnauthorizedError) {
      toast.error("Your session expired. Please log in again.");
    }
  }, [isUnauthorizedError]);

  return (
    <section className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>

        <p className="text-muted-foreground text-sm">
          Login to continue building and orchestrating workflows with Quelm.
        </p>
      </div>

      <div className="space-y-3">
        <Button variant="outline" className="w-full h-11 flex items-center gap-2" asChild>
          <a href="/auth/google/callback">
            {/* Google SVG */}
            <Image src={"/google.svg"} alt="google-icon" height={18} width={18} />
            Continue with Google
          </a>
        </Button>

        <Button variant="outline" className="w-full h-11 flex items-center gap-2" asChild>
          <a href="/auth/github/callback">
            {/* GitHub SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-12 w-12"
            >
              <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.084 3.292 9.387 7.865 10.91.575.106.785-.25.785-.556 0-.274-.01-1-.015-1.962-3.2.695-3.878-1.542-3.878-1.542-.523-1.328-1.278-1.682-1.278-1.682-1.045-.715.08-.701.08-.701 1.156.082 1.764 1.188 1.764 1.188 1.027 1.76 2.695 1.252 3.352.957.104-.744.402-1.252.73-1.54-2.554-.29-5.24-1.277-5.24-5.686 0-1.256.448-2.283 1.183-3.087-.118-.29-.513-1.46.112-3.045 0 0 .965-.309 3.162 1.179A10.96 10.96 0 0112 6.844c.972.005 1.95.132 2.864.387 2.195-1.488 3.158-1.179 3.158-1.179.627 1.585.232 2.755.114 3.045.737.804 1.181 1.831 1.181 3.087 0 4.42-2.69 5.392-5.252 5.676.413.355.78 1.055.78 2.126 0 1.535-.014 2.772-.014 3.149 0 .309.207.668.79.555C20.21 21.384 23.5 17.082 23.5 12 23.5 5.648 18.352.5 12 .5z" />
            </svg>
            Continue with GitHub
          </a>
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>

        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>

          <Input
            id="email"
            type="email"
            placeholder="shivam@example.com"
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Input id="password" type="password" placeholder="••••••••" className="h-11" />
        </div>

        <Button className="w-full h-11 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-200">
          Login
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </section>
  );
};

export default LoginPage;
