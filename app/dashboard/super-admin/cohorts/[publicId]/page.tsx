"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { adminAttendanceApi, cohortApi } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ListToolbar from "@/components/ui/ListToolbar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

type Student = { studentPublicId: string; studentName: string; totalDays: number; present: number; absent: number; ratePercent: number };

const card = "rounded-2xl border border-gray-200 bg-surface shadow-sm";
const fmt = (d?: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

function rateTone(v: number) {
  if (v >= 80) return "bg-green-100 text-green-700";
  if (v >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// A cohort: its details, and its students with their campus attendance.
// Shared by the super admin and admin areas (the admin route re-exports it).
export default function CohortDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const inAdmin = pathname.startsWith("/dashboard/admin");
  const listHref = inAdmin ? "/dashboard/admin/cohorts" : "/dashboard/super-admin/cohorts";
  const personHref = (id: string) => (inAdmin ? `/dashboard/admin/people/${id}` : `/dashboard/super-admin/users/${id}`);

  const [cohort, setCohort] = useState<any>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [studentsNote, setStudentsNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const publicId = params.publicId as string;
    cohortApi.getOne(publicId)
      .then((data) => { setCohort(data); setNameDraft(data.name); })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load cohort"));
    adminAttendanceApi.getCohortSummary(publicId)
      .then((rows) => setStudents([...rows].sort((a, b) => a.studentName.localeCompare(b.studentName))))
      .catch((err) => setStudentsNote(/permission/i.test(err?.message ?? "")
        ? "Seeing students' attendance needs the View institution analytics permission for this cohort."
        : "Couldn't load this cohort's students."));
  }, [params.publicId]);

  async function handleSaveName() {
    if (!cohort || !nameDraft.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await cohortApi.update(cohort.publicId, { name: nameDraft.trim() });
      setCohort(updated);
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cohort name");
    } finally {
      setIsSaving(false);
    }
  }

  const q = search.trim().toLowerCase();
  const visible = (students ?? []).filter((s) => !q || s.studentName.toLowerCase().includes(q));
  const avg = students && students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.ratePercent, 0) / students.length)
    : null;

  return (
    <div className="p-6 space-y-5">
      <Breadcrumbs items={[{ label: "Cohorts", href: listHref }, { label: cohort?.name ?? "Cohort" }]} />

      {error && (
        <div className="text-sm rounded-lg px-3 py-2 border bg-red-50 text-red-700 border-red-100">{error}</div>
      )}

      {cohort ? (
        <section className={`${card} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              {isEditingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={isSaving}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setIsEditingName(false); setNameDraft(cohort.name); }} className="text-sm text-gray-500 hover:text-gray-900">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl text-gray-900">{cohort.name}</h1>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cohort.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {cohort.isActive ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => setIsEditingName(true)} className="text-sm text-blue-600 hover:underline">Rename</button>
                </div>
              )}
              <p className="mt-2 text-sm text-gray-500">{fmt(cohort.startDate)} – {fmt(cohort.endDate)}</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{students ? students.length : "—"}</p>
                <p className="text-xs text-gray-400">Students</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{avg == null ? "—" : `${avg}%`}</p>
                <p className="text-xs text-gray-400">Avg. campus attendance</p>
              </div>
            </div>
          </div>
        </section>
      ) : !error ? (
        <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
      ) : null}

      <section className={card}>
        <ListToolbar count={visible.length} noun={visible.length === 1 ? "student" : "students"}
          search={search} onSearch={setSearch} searchPlaceholder="Student name…" />
        {studentsNote ? (
          <p className="p-6 text-sm text-gray-500">{studentsNote}</p>
        ) : students === null ? (
          <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">{students.length === 0 ? "No students enrolled yet." : "No students match."}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th className="hidden sm:table-cell" align="right">Days held</Th>
                <Th className="hidden sm:table-cell" align="right">Present</Th>
                <Th className="hidden sm:table-cell" align="right">Absent</Th>
                <Th align="right">Campus attendance</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <Tr key={s.studentPublicId} onOpen={() => router.push(personHref(s.studentPublicId))}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.studentName} size={32} />
                      <span className="font-medium text-gray-900">{s.studentName}</span>
                    </div>
                  </Td>
                  <Td className="hidden sm:table-cell text-gray-600" align="right">{s.totalDays}</Td>
                  <Td className="hidden sm:table-cell text-gray-600" align="right">{s.present}</Td>
                  <Td className="hidden sm:table-cell text-gray-600" align="right">{s.absent}</Td>
                  <Td align="right">
                    <span className={`inline-block min-w-[3.25rem] rounded-full px-2 py-0.5 text-center text-xs font-medium ${rateTone(s.ratePercent)}`}>
                      {s.ratePercent}%
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
