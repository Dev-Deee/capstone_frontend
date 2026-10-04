"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cohortApi } from "@/lib/api";
import ListToolbar from "@/components/ui/ListToolbar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
const fmt = (d?: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function CohortsSection() {
  // Admins and super admins reach cohort detail from their own area of the app.
  const pathname = usePathname();
  const cohortsBase = pathname.startsWith("/dashboard/admin") ? "/dashboard/admin/cohorts" : "/dashboard/super-admin/cohorts";
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const router = useRouter();

  const matching = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cohorts.filter((c) => !q || c.name?.toLowerCase().includes(q));
  }, [cohorts, search]);
  const visible = matching.filter((c) => status === "ALL" || (status === "ACTIVE") === Boolean(c.isActive));

  useEffect(() => {
    cohortApi.getAll().then(setCohorts).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const cohort = await cohortApi.create({ name, startDate, endDate });
      setCohorts((prev) => [...prev, cohort]);
      setMessage({ type: "success", text: `Cohort "${cohort.name}" created.` });
      setName(""); setStartDate(""); setEndDate("");
      setCreating(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create cohort" });
    }
  }

  return (
    <div>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "cohort" : "cohorts"}
          segments={[
            { value: "ALL", label: "All", count: matching.length },
            { value: "ACTIVE", label: "Active", count: matching.filter((c) => c.isActive).length },
            { value: "INACTIVE", label: "Inactive", count: matching.filter((c) => !c.isActive).length },
          ]}
          segment={status}
          onSegment={setStatus}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Cohort name…"
        >
          <button
            type="button"
            onClick={() => setCreating((c) => !c)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {creating ? "Close" : "New cohort"}
          </button>
        </ListToolbar>

        {creating && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
            <input
              type="text" required placeholder="Cohort name"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start date</label>
                <input
                  type="date" required value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End date</label>
                <input
                  type="date" required value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
              Create Cohort
            </button>
          </form>
          </div>
        )}

        {cohorts.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No cohorts yet — create the first one.</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No cohorts match.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Cohort</Th>
                <Th className="hidden sm:table-cell">Starts</Th>
                <Th className="hidden sm:table-cell">Ends</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <Tr key={c.publicId} muted={!c.isActive} onOpen={() => router.push(`${cohortsBase}/${c.publicId}`)}>
                  <Td>
                    <Link href={`${cohortsBase}/${c.publicId}`} onClick={(e) => e.stopPropagation()} className="font-medium text-gray-900 hover:text-blue-600">
                      {c.name}
                    </Link>
                  </Td>
                  <Td className="hidden sm:table-cell whitespace-nowrap text-gray-600">{fmt(c.startDate)}</Td>
                  <Td className="hidden sm:table-cell whitespace-nowrap text-gray-600">{fmt(c.endDate)}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
