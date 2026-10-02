"use client";

import { useEffect, useRef, useState } from "react";

export interface MenuItem { label: string; onSelect: () => void; tone?: "danger" | "warn" }

// The "⋯" menu at the end of a table row. Clicks inside don't reach the row.
export default function RowMenu({ items, label = "Actions" }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (items.length === 0) return null;
  return (
    <div ref={ref} className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-gray-200 bg-surface py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => { setOpen(false); item.onSelect(); }}
              className={`block w-full whitespace-nowrap px-3.5 py-2 text-left text-sm hover:bg-gray-50 ${
                item.tone === "danger" ? "text-red-600" : item.tone === "warn" ? "text-amber-700" : "text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
