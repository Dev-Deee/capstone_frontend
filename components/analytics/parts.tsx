// Building blocks shared by the analytics pages (admin and facilitator).

export const card = "rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm";

export function dayLabel(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  return days <= 7
    ? d.toLocaleDateString(undefined, { weekday: "short" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function pct(v: number | null) {
  return v == null ? "—" : `${v}%`;
}

// Rate chip colour: healthy / watch / concern.
export function rateTone(v: number) {
  if (v >= 80) return "bg-green-100 text-green-700";
  if (v >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function Stat({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className={card}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; value: number; dot: string }[] }) {
  return (
    <ul className="space-y-1.5 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-gray-500">
          <span className={`h-2 w-2 rounded-full ${i.dot}`} />
          <span className="flex-1">{i.label}</span>
          <span className="font-medium text-gray-700">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

export const icon = (d: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

