"use client";

// A titled, collapsible block for grouping a list (e.g. one per cohort).
// Controlled: the parent owns which groups are open, so it can offer
// "Expand all / Collapse all" and keep state across filtering.
export default function CollapsibleGroup({
  title, meta, open, onToggle, actions, children,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={`shrink-0 text-gray-400 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
            aria-hidden="true">
            <polyline points="9 6 15 12 9 18" />
          </svg>
          <span className="truncate text-sm font-semibold text-gray-900">{title}</span>
          {meta && <span className="truncate text-xs text-gray-400">{meta}</span>}
        </button>
        {actions}
      </div>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </section>
  );
}

// Open/closed state for a set of groups. Starts with every group open when
// there are only a few, otherwise just the first.
export function initialOpen(keys: string[]): Set<string> {
  return new Set(keys.length <= 2 ? keys : keys.slice(0, 1));
}
