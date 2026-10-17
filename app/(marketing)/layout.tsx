import type { ReactNode } from "react";
import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import Logo from "@/components/marketing/Logo";
import Link from "next/link";

// Public, unauthenticated pages (landing, institution sign-up). Kept apart from
// the app shell so they can change independently of the product UI.
export const metadata: Metadata = {
  title: "Cadence — Academic operations for cohort-based programmes",
  description: "Attendance, coursework and cohorts in one calm, auditable place.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-gray-900">
      <SiteHeader />
      {children}
      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-900">Sign in</Link>
            <Link href="/signup" className="hover:text-gray-900">Create an institution</Link>
          </nav>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Cadence</p>
        </div>
      </footer>
    </div>
  );
}
