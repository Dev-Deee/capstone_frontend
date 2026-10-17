"use client";

import { useEffect, useState } from "react";
import { studentAttendanceApi } from "@/lib/api";
import TabBar from "@/components/TabBar";
import StatusBadge from "@/components/AttendanceStatusBadge";

interface Summary {
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  percentPresent: number;
  cohortName: string;
}

interface DailyEntry {
  sessionPublicId: string;
  date: string;
  status: string;
  checkedInAt: string | null;
}

interface ClassEntry {
  sessionPublicId: string;
  date: string;
  subjectName: string;
  status: string;
  markedAt: string | null;
}

type Tier = "daily" | "class";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const formatTime = (t: string | null) =>
  t ? new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

export default function StudentAttendanceSection() {
  const [tier, setTier] = useState<Tier>("daily");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyEntry[]>([]);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      studentAttendanceApi.getSummary(),
      studentAttendanceApi.getHistory(),
      studentAttendanceApi.getClassHistory(),
    ])
      .then(([s, h, c]) => {
        setSummary(s);
        setDaily(h);
        setClasses(c);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  if (error) {
    return (
      <div className="text-sm rounded-lg px-3 py-2 border bg-red-50 text-red-700 border-red-100">{error}</div>
    );
  }

  // Class rate counts LATE as attended (same rule as the daily summary) and
  // leaves still-open sessions out until they close.
  const closedClasses = classes.filter((c) => c.status !== "OPEN");
  const classAttended = closedClasses.filter((c) => c.status === "PRESENT" || c.status === "LATE").length;
  const classRate = closedClasses.length ? Math.round((classAttended * 100) / closedClasses.length) : 0;

  return (
    <div>
      {summary && <p className="text-sm text-gray-400 mb-4">{summary.cohortName}</p>}

      <TabBar
        tabs={[
          { id: "daily", label: "Daily Check-In" },
          { id: "class", label: "Class Attendance", live: classes.some((c) => c.status === "OPEN") },
        ]}
        active={tier}
        onChange={(id) => setTier(id as Tier)}
      />

      {tier === "daily" && (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total Days" value={summary.totalDays} />
              <StatCard label="Present" value={summary.daysPresent} />
              <StatCard label="Absent" value={summary.daysAbsent} />
              <StatCard label="Rate" value={`${summary.percentPresent}%`} sub={`${summary.daysPresent} of ${summary.totalDays} days`} />
            </div>
          )}

          <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily check-ins</h2>
            {daily.length === 0 ? (
              <p className="text-sm text-gray-400">No resumption days recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Checked in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {daily.map((entry) => (
                    <tr key={entry.sessionPublicId}>
                      <td className="py-2 text-gray-700">{formatDate(entry.date)}</td>
                      <td className="py-2"><StatusBadge status={entry.status} /></td>
                      <td className="py-2 text-gray-400 text-xs text-right">{formatTime(entry.checkedInAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tier === "class" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Classes" value={closedClasses.length} />
            <StatCard label="Attended" value={classAttended} />
            <StatCard label="Missed" value={closedClasses.length - classAttended} />
            <StatCard label="Rate" value={`${classRate}%`} sub={`${classAttended} of ${closedClasses.length} classes`} />
          </div>

          <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Class sessions</h2>
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400">No class sessions recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Subject</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Marked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classes.map((entry) => (
                    <tr key={entry.sessionPublicId}>
                      <td className="py-2 text-gray-700">{formatDate(entry.date)}</td>
                      <td className="py-2 text-gray-700">{entry.subjectName}</td>
                      <td className="py-2"><StatusBadge status={entry.status} /></td>
                      <td className="py-2 text-gray-400 text-xs text-right">{formatTime(entry.markedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
