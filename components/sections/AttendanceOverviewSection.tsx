"use client";

import { useEffect, useState } from "react";
import { adminAttendanceApi, cohortApi } from "@/lib/api";

type CohortOverview = {
  cohortPublicId: string;
  cohortName: string;
  studentCount: number;
  averageRatePercent: number;
};

type StudentSummary = {
  studentPublicId: string;
  studentName: string;
  totalDays: number;
  present: number;
  absent: number;
  ratePercent: number;
};

function RateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? "bg-green-100 text-green-700" :
    rate >= 60 ? "bg-yellow-100 text-yellow-700" :
                 "bg-red-100 text-red-700";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {rate}%
    </span>
  );
}

export default function AttendanceOverviewSection() {
  const [tab, setTab] = useState<"all" | "cohort">("all");

  // All-cohorts view
  const [overviewRows, setOverviewRows] = useState<CohortOverview[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // By-cohort view
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [selectedCohortName, setSelectedCohortName] = useState("");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminAttendanceApi.getAllCohorts(),
      cohortApi.getAll(),
    ])
      .then(([overview, allCohorts]) => {
        setOverviewRows([...overview].sort((a, b) => a.averageRatePercent - b.averageRatePercent));
        setCohorts(allCohorts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOverview(false));
  }, []);

  async function loadCohortSummary(cohortPublicId: string, cohortName: string) {
    setSelectedCohortId(cohortPublicId);
    setSelectedCohortName(cohortName);
    setStudents([]);
    setError(null);
    setLoadingStudents(true);
    try {
      const rows = await adminAttendanceApi.getCohortSummary(cohortPublicId);
      setStudents([...rows].sort((a, b) => a.ratePercent - b.ratePercent));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cohort summary");
    } finally {
      setLoadingStudents(false);
    }
  }

  function handleOverviewRowClick(row: CohortOverview) {
    setTab("cohort");
    loadCohortSummary(row.cohortPublicId, row.cohortName);
  }

  async function handleCohortPickerChange(cohortPublicId: string) {
    if (!cohortPublicId) {
      setSelectedCohortId("");
      setSelectedCohortName("");
      setStudents([]);
      return;
    }
    const cohort = cohorts.find((c) => c.publicId === cohortPublicId);
    loadCohortSummary(cohortPublicId, cohort?.name ?? cohortPublicId);
  }

  return (
    <div>

      {error && (
        <div className="text-sm rounded-lg px-3 py-2 border mb-5 bg-red-50 text-red-700 border-red-100">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["all", "cohort"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t === "all" ? "All Cohorts" : "By Cohort"}
          </button>
        ))}
      </div>

      {/* All Cohorts tab */}
      {tab === "all" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loadingOverview ? (
            <div className="p-6 text-sm text-gray-400 animate-pulse">Loading…</div>
          ) : overviewRows.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">No cohorts found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Cohort</th>
                  <th className="px-4 py-3 font-medium">Students</th>
                  <th className="px-4 py-3 font-medium">Avg Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overviewRows.map((row) => (
                  <tr
                    key={row.cohortPublicId}
                    onClick={() => handleOverviewRowClick(row)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800 font-medium">{row.cohortName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.studentCount}</td>
                    <td className="px-4 py-3">
                      <RateBadge rate={row.averageRatePercent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* By Cohort tab */}
      {tab === "cohort" && (
        <div>
          <div className="mb-5 max-w-xs">
            <select
              value={selectedCohortId}
              onChange={(e) => handleCohortPickerChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a cohort…</option>
              {cohorts.map((c) => (
                <option key={c.publicId} value={c.publicId}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCohortId && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{selectedCohortName}</span>
                {students.length > 0 && (
                  <span className="text-xs text-gray-400">{students.length} students</span>
                )}
              </div>
              {loadingStudents ? (
                <div className="p-6 text-sm text-gray-400 animate-pulse">Loading…</div>
              ) : students.length === 0 ? (
                <div className="p-6 text-sm text-gray-400">No enrolled students.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Total Days</th>
                      <th className="px-4 py-3 font-medium">Present</th>
                      <th className="px-4 py-3 font-medium">Absent</th>
                      <th className="px-4 py-3 font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s) => (
                      <tr key={s.studentPublicId}>
                        <td className="px-4 py-3 text-gray-800">{s.studentName}</td>
                        <td className="px-4 py-3 text-gray-600">{s.totalDays}</td>
                        <td className="px-4 py-3 text-green-600">{s.present}</td>
                        <td className="px-4 py-3 text-red-500">{s.absent}</td>
                        <td className="px-4 py-3">
                          <RateBadge rate={s.ratePercent} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
