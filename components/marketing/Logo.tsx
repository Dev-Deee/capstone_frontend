import Link from "next/link";

// The Cadence wordmark for public pages: a steady beat in a rounded tile.
export default function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const tile = tone === "dark" ? "bg-[#0c1f4a] text-white" : "bg-white/10 text-white ring-1 ring-white/20";
  const word = tone === "dark" ? "text-gray-900" : "text-white";
  return (
    <Link href="/" aria-label="Cadence — home" className="inline-flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${tile}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      </span>
      <span className={`text-[17px] font-semibold tracking-tight ${word}`}>Cadence</span>
    </Link>
  );
}
