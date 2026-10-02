"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

// Sticky header that gains a hairline and soft blur once the page scrolls.
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${
      scrolled ? "border-b border-gray-200/70 bg-white/80 backdrop-blur-md" : "border-b border-transparent bg-white"
    }`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:inline-flex"
          >
            Create your institution
          </Link>
        </nav>
      </div>
    </header>
  );
}
