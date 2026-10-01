"use client";

import { useEffect, useState } from "react";
import { resumptionApi, cohortApi } from "@/lib/api";

export default function AdminResumptionAttendancePage() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    cohortApi.getAll()
      .then(setCohorts)
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleCohortChange(cohortId: string) {
    setSelectedCohortId(cohortId);
    setSelectedSession(null);
    setRoster([]);
    setSessions([]);
    setMessage(null);
    if (!cohortId) return;
    setLoadingSessions(true);
    try {
      const list = await resumptionApi.listByCohort(cohortId);
      setSessions(list);
      if (list.length === 0) {
        setMessage({ type: "error", text: "No resumption sessions found for this cohort." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load sessions" });
    } finally {
      setLoadingSessions(false);
    }
  }

  async function selectSession(s: any) {
    setSelectedSession(s);
    setRoster([]);
    setMessage(null);
    setLoadingRoster(true);
    try {
      const entries = await resumptionApi.getAttendance(s.publicId);
      setRoster(entries);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load attendance" });
    } finally {
      setLoadingRoster(false);
    }
  }

  const presentCount = roster.filter((r) => r.status !== "ABSENT").length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Resumption Attendance</h1>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      {/* Cohort picker */}
      <div className="mb-5 max-w-xs">
        <select
          value={selectedCohortId}
          onChange={(e) => handleCohortChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a cohort…</option>
          {cohorts.map((c) => (
            <option key={c.publicId} value={c.publicId}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1 — sessions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sessions</h2>
          {!selectedCohortId ? (
            <p className="text-sm text-gray-400">Select a cohort.</p>
          ) : loadingSessions ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No sessions yet.</p>
          ) : (
            <ul className="space-y-1">
              {sessions.map((s) => (
                <li key={s.publicId}>
                  <button
                    onClick={() => selectSession(s)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedSession?.publicId === s.publicId
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${s.isOpen ? "bg-green-400" : "bg-gray-300"}`} />
                    {s.resumptionDate
                      ? new Date(s.resumptionDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                      : new Date(s.opensAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                    }
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Column 2+3 — roster */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roster</h2>
            {roster.length > 0 && (
              <span className="text-xs text-gray-400">
                {presentCount} present · {absentCount} absent
              </span>
            )}
          </div>
          {!selectedSession ? (
            <p className="text-sm text-gray-400">Select a session.</p>
          ) : loadingRoster ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : roster.length === 0 ? (
            <p className="text-sm text-gray-400">No enrolled students.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Checked in</th>
                  <th className="pb-2 font-medium text-right">Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roster.map((r) => (
                  <tr key={r.studentPublicId}>
                    <td className="py-2 text-gray-800">{r.studentName}</td>
                    <td className="py-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === "ABSENT"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {r.status === "ABSENT" ? "Absent" : "Present"}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {r.markedAt
                        ? new Date(r.markedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="py-2 text-right">
                      {r.status !== "ABSENT" && (
                        <span className="text-xs text-gray-400 space-x-1">
                          {r.matchedInstitutionNetwork === true && <span title="On network">🌐</span>}
                          {r.webAuthnVerified === true && <span title="WebAuthn">🔑</span>}
                          {r.confidenceScore != null && (
                            <span className="font-mono">{r.confidenceScore}%</span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
