// Initials (or photo) in a tinted circle; the tint is stable per name.
const TINTS = [
  "bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-amber-100 text-amber-700",
  "bg-orange-100 text-orange-700", "bg-red-100 text-red-700", "bg-gray-100 text-gray-700",
];

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const tint = TINTS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TINTS.length];
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full font-semibold ${tint}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
