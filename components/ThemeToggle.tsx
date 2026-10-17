"use client";

import { useEffect, useState } from "react";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";

// Sun / moon switch. `tone="onDark"` for the navy sidebar; default for light
// or dark page surfaces.
export default function ThemeToggle({ tone = "page" }: { tone?: "page" | "onDark" }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(currentTheme()), []);

  const dark = theme === "dark";
  const toggle = () => {
    const next: Theme = dark ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const track =
    tone === "onDark"
      ? "bg-white/10 ring-1 ring-white/15"
      : "bg-gray-100 ring-1 ring-gray-200";
  const icon = tone === "onDark" ? "text-blue-100/70" : "text-gray-500";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full transition-colors ${track}`}
    >
      <span className={`absolute left-1.5 ${icon}`} aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span className={`absolute right-1.5 ${icon}`} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </span>
      <span
        className={`relative z-10 h-5 w-5 rounded-full bg-blue-600 shadow transition-transform motion-reduce:transition-none ${
          theme === null ? "opacity-0" : dark ? "translate-x-[27px]" : "translate-x-1"
        }`}
      />
    </button>
  );
}
