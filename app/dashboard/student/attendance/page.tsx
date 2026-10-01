"use client";

import { useEffect, useState } from "react";
import { studentAttendanceApi } from "@/lib/api";

interface Summary {
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  percentPresent: number;
  cohortName: string;
}

interface HistoryEntry {
  sessionPublicId: string;
  date: string;
  status: string;
  checkedInAt: string | null;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function StudentAttendancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([studentAttendanceApi.getSummary(), studentAttendanceApi.getHistory()])
      .then(([s, h]) => {
        setSummary(s);
        setHistory(h);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-sm rounded-lg px-3 py-2 border bg-red-50 text-red-700 border-red-100">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Attendance</h1>
        {summary && (
          <p className="text-sm text-gray-400 mt-0.5">{summary.cohortName}</p>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Days" value={summary.totalDays} />
          <StatCard label="Present" value={summary.daysPresent} />
          <StatCard label="Absent" value={summary.daysAbsent} />
          <StatCard
            label="Rate"
            value={`${summary.percentPresent}%`}
            sub={`${summary.daysPresent} of ${summary.totalDays} days`}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No sessions recorded yet.</p>
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
              {history.map((entry) => (
                <tr key={entry.sessionPublicId}>
                  <td className="py-2 text-gray-700">
                    {new Date(entry.date).toLocaleDateString(undefined, {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </td>
                  <td className="py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      entry.status === "PRESENT"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {entry.status === "PRESENT" ? "Present" : "Absent"}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs text-right">
                    {entry.checkedInAt
                      ? new Date(entry.checkedInAt).toLocaleTimeString(undefined, {
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
