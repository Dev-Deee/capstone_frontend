import type { ReactNode } from "react";

// The one page-title treatment used across the dashboards: a small eyebrow,
// a serif display title (matching the sign-in page) and an optional line of context.
export default function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-blue-600/80">{eyebrow}</p>
        )}
        <h1 className="font-display text-[34px] leading-[1.1] text-gray-900 sm:text-[40px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-gray-500">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

// "Good morning" / "Good afternoon" / "Good evening" for the home dashboards.
export function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
