"use client";

import { useEffect, useMemo, useState } from "react";
import { userApi } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import ListToolbar from "@/components/ui/ListToolbar";
import RowMenu from "@/components/ui/RowMenu";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import CollapsibleGroup, { initialOpen } from "@/components/ui/CollapsibleGroup";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
const NO_COHORT = "Not in a cohort";

type Student = {
  publicId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  institutionStudentId: string | null;
  cohortName: string | null;
  active: boolean;
};

// A facilitator's roster: students in the cohorts they teach. Facilitators can
// deactivate/reactivate a student's access; editing and deleting stay with admins.
export default function MyStudentsSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [openGroups, setOpenGroups] = useState<Set<string> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    userApi.getMyStudents()
      .then(setStudents)
      .catch((err) => setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load students" }))
      .finally(() => setIsLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const matching = useMemo(
    () => students.filter((s) => !q || [s.fullName, s.email, s.institutionStudentId].some((v) => v?.toLowerCase().includes(q))),
    [students, q]);
  const visible = matching.filter((s) => status === "ALL" || (status === "ACTIVE") === s.active);

  // One group per cohort, alphabetical, students alphabetical within.
  const groups = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of visible) {
      const key = s.cohortName ?? NO_COHORT;
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === NO_COHORT ? 1 : b === NO_COHORT ? -1 : a.localeCompare(b, undefined, { numeric: true })))
      .map(([name, list]) => [name, list.sort((x, y) => x.fullName.localeCompare(y.fullName, undefined, { numeric: true }))] as const);
  }, [visible]);

  const allKeys = groups.map(([name]) => name);
  const open = openGroups ?? initialOpen(allKeys);
  // While searching, show every group that has a match.
  const isOpen = (key: string) => Boolean(q) || open.has(key);
  const allOpen = allKeys.length > 0 && allKeys.every((k) => open.has(k));
  const toggle = (key: string) => {
    const next = new Set(open);
    if (next.has(key)) next.delete(key); else next.add(key);
    setOpenGroups(next);
  };

  async function toggleActive(s: Student) {
    setBusyId(s.publicId);
    setMessage(null);
    try {
      const updated = s.active ? await userApi.deactivate(s.publicId) : await userApi.activate(s.publicId);
      setStudents((prev) => prev.map((x) => (x.publicId === s.publicId ? { ...x, active: updated.active } : x)));
      setMessage({
        type: "success",
        text: updated.active ? `${s.fullName} can sign in again.` : `${s.fullName} has been deactivated and signed out.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change status" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Students enrolled in the cohorts you teach. Deactivating a student signs them out and blocks sign-in until reactivated.
      </p>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-4 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
          <ListToolbar
            count={visible.length}
            noun={visible.length === 1 ? "student" : "students"}
            segments={[
              { value: "ALL" as StatusFilter, label: "All", count: matching.length },
              { value: "ACTIVE" as StatusFilter, label: "Active", count: matching.filter((s) => s.active).length },
              { value: "INACTIVE" as StatusFilter, label: "Deactivated", count: matching.filter((s) => !s.active).length },
            ]}
            segment={status}
            onSegment={setStatus}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Name, email or student ID…"
          >
            {allKeys.length > 1 && !q && (
              <button type="button" onClick={() => setOpenGroups(allOpen ? new Set() : new Set(allKeys))}
                className="rounded-lg px-2.5 py-1.5 text-sm text-blue-600 hover:bg-blue-50">
                {allOpen ? "Collapse all" : "Expand all"}
              </button>
            )}
          </ListToolbar>
        </div>

        {isLoading ? (
          <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-surface p-6 text-sm text-gray-400 shadow-sm">
            {students.length === 0 ? "No students are enrolled in the cohorts you teach yet." : "No students match."}
          </div>
        ) : groups.map(([name, list]) => {
          const inactive = list.filter((s) => !s.active).length;
          return (
            <CollapsibleGroup
              key={name}
              title={name}
              meta={`${list.length} student${list.length === 1 ? "" : "s"}${inactive ? ` · ${inactive} deactivated` : ""}`}
              open={isOpen(name)}
              onToggle={() => toggle(name)}
            >
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th className="hidden md:table-cell">Student ID</Th>
                    <Th className="hidden sm:table-cell">Phone</Th>
                    <Th>Status</Th>
                    <Th align="right"><span className="sr-only">Actions</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <Tr key={s.publicId} muted={!s.active}>
                        <Td>
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={s.fullName} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">{s.fullName}</p>
                              <p className="truncate text-xs text-gray-400">{s.email}</p>
                            </div>
                          </div>
                        </Td>
                        <Td className="hidden md:table-cell text-gray-600">{s.institutionStudentId ?? <span className="text-gray-300">—</span>}</Td>
                        <Td className="hidden sm:table-cell whitespace-nowrap text-gray-600">{s.phoneNumber ?? <span className="text-gray-300">—</span>}</Td>
                        <Td>
                          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {s.active ? "Active" : "Deactivated"}
                          </span>
                        </Td>
                        <Td align="right">
                          {busyId === s.publicId ? <span className="text-xs text-gray-400">…</span> : (
                            <RowMenu label={`Actions for ${s.fullName}`} items={[
                              { label: s.active ? "Deactivate" : "Activate", onSelect: () => toggleActive(s), tone: s.active ? "warn" : undefined },
                            ]} />
                          )}
                        </Td>
                      </Tr>
                  ))}
                </tbody>
              </Table>
            </CollapsibleGroup>
          );
        })}
      </div>
    </div>
  );
}
