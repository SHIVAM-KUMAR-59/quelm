import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import UnsupportedScreen from "@/components/ui/UnsupportedScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Quelm",
  description: "Distributed multi-agent workflow platform",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        <div id="app-root">
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </QueryProvider>
        </div>

        <div id="unsupported-root">
          <UnsupportedScreen />
        </div>
      </body>
    </html>
  );
}
