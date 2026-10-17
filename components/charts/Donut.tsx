// A ring split into segments; `className` on each is a stroke-* palette class.
export interface Segment { label: string; value: number; className: string }

export default function Donut({ segments, size = 120, children }: {
  segments: Segment[];
  size?: number;
  children?: React.ReactNode;
}) {
  const r = 42, c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" className="stroke-gray-100" />
        {total > 0 && segments.map((s) => {
          const len = (s.value / total) * c;
          const el = s.value > 0 && (
            <circle key={s.label} cx="50" cy="50" r={r} fill="none" strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} className={s.className}>
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}
