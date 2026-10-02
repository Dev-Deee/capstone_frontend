"use client";

import { useEffect, useState } from "react";
import { sessionApi, facilitatorCohortApi, cohortApi, subjectApi } from "@/lib/api";
import AttendanceStatusBadge, { countsAsAttended } from "@/components/AttendanceStatusBadge";
import OverrideAttendance from "@/components/OverrideAttendance";

export default function FacilitatorAttendanceSection() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    Promise.all([facilitatorCohortApi.getMine(), cohortApi.getAll(), subjectApi.getAll()])
      .then(([myAssignments, cohortList, subjectList]) => {
        setAssignments(myAssignments);
        setCohorts(cohortList);
        setSubjects(subjectList);
      })
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
  }, []);

  function cohortName(publicId: string) {
    return cohorts.find((c) => c.publicId === publicId)?.name || publicId;
  }
  function subjectName(publicId: string) {
    return subjects.find((s) => s.publicId === publicId)?.name || publicId;
  }

  async function selectAssignment(a: any) {
    setSelectedAssignment(a);
    setSelectedSession(null);
    setRoster([]);
    setSessions([]);
    setMessage(null);
    setLoadingSessions(true);
    try {
      const list = await sessionApi.list(a.cohortPublicId, a.subjectPublicId);
      setSessions(list);
      if (list.length === 0) {
        setMessage({ type: "error", text: "No sessions found for this cohort + subject." });
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
      const entries = await sessionApi.getAttendance(s.publicId);
      setRoster(entries);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load attendance" });
    } finally {
      setLoadingRoster(false);
    }
  }

  const presentCount = roster.filter((r) => countsAsAttended(r.status)).length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;
  const pendingCount = roster.filter((r) => r.status === "PENDING_BIOMETRIC").length;

  async function override(studentPublicId: string, status: string, reason: string) {
    await sessionApi.overrideAttendance(selectedSession.publicId, studentPublicId, { status, reason });
    setRoster(await sessionApi.getAttendance(selectedSession.publicId));
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1 — assignments */}
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">My Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-400">No assignments yet.</p>
          ) : (
            <ul className="space-y-1">
              {assignments.map((a) => (
                <li key={a.publicId}>
                  <button
                    onClick={() => selectAssignment(a)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedAssignment?.publicId === a.publicId
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{cohortName(a.cohortPublicId)}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span>{subjectName(a.subjectPublicId)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Column 2 — sessions */}
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sessions</h2>
          {!selectedAssignment ? (
            <p className="text-sm text-gray-400">Select an assignment.</p>
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
                    {new Date(s.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    <span className="text-gray-400 ml-1 text-xs">
                      {new Date(s.expiresAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Column 3 — roster */}
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-4 md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roster</h2>
            {roster.length > 0 && (
              <span className="text-xs text-gray-400">
                {presentCount} present · {absentCount} absent{pendingCount > 0 && ` · ${pendingCount} awaiting biometric`}
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
            <ul className="divide-y divide-gray-100">
              {roster.map((r) => (
                <li key={r.studentPublicId} className="py-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-gray-800 min-w-0">{r.studentName}</span>
                    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                      {r.markedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(r.markedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      <AttendanceStatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <OverrideAttendance
                      current={r.status}
                      onSave={(status, reason) => override(r.studentPublicId, status, reason)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
