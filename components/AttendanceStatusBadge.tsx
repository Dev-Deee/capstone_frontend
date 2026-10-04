// One place for how an attendance status reads, everywhere it's shown.
// PRESENT / LATE / ABSENT come from records (incl. manual overrides);
// PENDING_BIOMETRIC = code accepted, fingerprint / Face ID not yet confirmed
// (doesn't count as attendance); OPEN = class still running.
const STATUS_STYLE: Record<string, [string, string]> = {
  PRESENT: ["Present", "bg-green-100 text-green-700"],
  LATE: ["Late", "bg-amber-100 text-amber-700"],
  ABSENT: ["Absent", "bg-gray-100 text-gray-500"],
  PENDING_BIOMETRIC: ["Awaiting biometric", "bg-orange-100 text-orange-700"],
  OPEN: ["Open now", "bg-blue-100 text-blue-700"],
};

export function countsAsAttended(status: string) {
  return status === "PRESENT" || status === "LATE";
}

export default function AttendanceStatusBadge({ status }: { status: string }) {
  const [label, cls] = STATUS_STYLE[status] ?? [status, "bg-gray-100 text-gray-500"];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>;
}
