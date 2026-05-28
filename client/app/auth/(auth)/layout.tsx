import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/Icon";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b border-border">
        <nav className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Icon size={38} />
            <h1 className="text-2xl font-semibold tracking-tight text-primary">Quelm</h1>
          </Link>

          <p className="text-sm text-muted-foreground hidden md:block">
            AI-native workflow orchestration platform
          </p>
        </nav>
      </header>

      <section className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-xl border border-border bg-card/80 backdrop-blur-sm shadow-xl rounded-2xl px-8 py-10">
          {children}
        </Card>
      </section>
    </main>
  );
}
