import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";

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
      className={`${inter.variable} ${mono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children} <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
