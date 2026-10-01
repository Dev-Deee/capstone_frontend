import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Cadence",
  description: "Academic Operations Platform — Semicolon Africa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
