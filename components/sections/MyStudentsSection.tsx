"use client";

import { useEffect, useMemo, useState } from "react";
import { userApi } from "@/lib/api";

type Student = {
  publicId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  institutionStudentId: string | null;
  cohortName: string | null;
  active: boolean;
};

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// A facilitator's roster: students in the cohorts they teach. Facilitators can
// deactivate/reactivate a student's access; editing and deleting stay with admins.
export default function MyStudentsSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cohort, setCohort] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    userApi.getMyStudents()
      .then(setStudents)
      .catch((err) => setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load students" }))
      .finally(() => setIsLoading(false));
  }, []);

  const cohorts = useMemo(
    () => Array.from(new Set(students.map((s) => s.cohortName).filter(Boolean))) as string[],
    [students]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) =>
      (cohort === "ALL" || s.cohortName === cohort) &&
      (!q || [s.fullName, s.email, s.institutionStudentId].some((v) => v?.toLowerCase().includes(q))));
  }, [students, search, cohort]);

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

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search" placeholder="Search name, email or student ID…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-sm`}
        />
        {cohorts.length > 1 && (
          <select value={cohort} onChange={(e) => setCohort(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="ALL">All cohorts</option>
            {cohorts.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">
            {students.length === 0 ? "No students are enrolled in the cohorts you teach yet." : "No students match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((s) => (
              <li key={s.publicId} className={`px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${!s.active ? "bg-gray-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${s.active ? "text-gray-900" : "text-gray-500"}`}>{s.fullName}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {s.active ? "Active" : "Deactivated"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {s.email}{s.institutionStudentId ? ` · ${s.institutionStudentId}` : ""}{s.cohortName ? ` · ${s.cohortName}` : ""}
                  </p>
                </div>
                <button
                  disabled={busyId === s.publicId} onClick={() => toggleActive(s)}
                  className={`text-xs hover:underline disabled:opacity-50 ${s.active ? "text-amber-700" : "text-green-700"}`}
                >
                  {busyId === s.publicId ? "…" : s.active ? "Deactivate" : "Activate"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
