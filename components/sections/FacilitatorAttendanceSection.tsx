"use client";

import { Fragment, useEffect, useState } from "react";
import { sessionApi, facilitatorCohortApi, cohortApi, subjectApi } from "@/lib/api";
import AttendanceStatusBadge, { countsAsAttended } from "@/components/AttendanceStatusBadge";
import OverrideAttendance from "@/components/OverrideAttendance";
import Avatar from "@/components/ui/Avatar";
import ListToolbar from "@/components/ui/ListToolbar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import CollapsibleGroup, { initialOpen } from "@/components/ui/CollapsibleGroup";

type RosterFilter = "ALL" | "PRESENT" | "ABSENT" | "PENDING";

const card = "rounded-2xl border border-gray-200 bg-surface shadow-sm";
const fmtDay = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

function RateBar({ attended, enrolled }: { attended: number; enrolled: number }) {
  const pct = enrolled === 0 ? 0 : Math.round((attended / enrolled) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="whitespace-nowrap text-xs text-gray-500">{attended}/{enrolled}</span>
    </div>
  );
}

// A facilitator's class attendance: pick a class (cohort · subject), see its
// sessions with how many attended, and open one for the full roster — where
// a manual override settles absences and check-ins awaiting biometric.
export default function FacilitatorAttendanceSection() {
  const [classes, setClasses] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<Record<string, string>>({});
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedClass, setSelectedClass] = useState<any>(null);
  // Sessions per class (cohort × subject), loaded when its cohort is opened.
  // A key with an undefined value means "loading".
  const [sessionsByClass, setSessionsByClass] = useState<Record<string, any[] | undefined>>({});
  const [openGroups, setOpenGroups] = useState<Set<string> | null>(null);
  // Classes showing their full session history rather than the latest few.
  const [showAll, setShowAll] = useState<Set<string>>(new Set());

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>("ALL");
  const [search, setSearch] = useState("");
  const [overridingId, setOverridingId] = useState<string | null>(null);

  const classLabel = (c: any) => `${cohorts[c.cohortPublicId] ?? "Cohort"} · ${subjects[c.subjectPublicId] ?? "Subject"}`;

  useEffect(() => {
    Promise.all([facilitatorCohortApi.getMine(), cohortApi.getAll(), subjectApi.getAll()])
      .then(([mine, cohortList, subjectList]) => {
        setClasses(mine);
        setCohorts(Object.fromEntries(cohortList.map((c: any) => [c.publicId, c.name])));
        setSubjects(Object.fromEntries(subjectList.map((s: any) => [s.publicId, s.name])));
      })
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cohortIds = Array.from(new Set(classes.map((c) => c.cohortPublicId as string)));
  const openSet = openGroups ?? initialOpen(cohortIds);
  const allOpen = cohortIds.length > 0 && cohortIds.every((id) => openSet.has(id));
  const toggleGroup = (id: string) => {
    const next = new Set(openSet);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOpenGroups(next);
  };

  async function loadSessions(c: any) {
    setSessionsByClass((prev) => ({ ...prev, [c.publicId]: undefined }));
    try {
      const list = await sessionApi.list(c.cohortPublicId, c.subjectPublicId);
      setSessionsByClass((prev) => ({ ...prev, [c.publicId]: list }));
    } catch (err) {
      setSessionsByClass((prev) => ({ ...prev, [c.publicId]: [] }));
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load sessions" });
    }
  }

  // Load the sessions of every class in an open cohort, once.
  useEffect(() => {
    classes
      .filter((c) => openSet.has(c.cohortPublicId) && !(c.publicId in sessionsByClass))
      .forEach(loadSessions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, openGroups, sessionsByClass]);

  async function openSession(s: any, c: any) {
    setSelectedClass(c);
    setSelectedSession(s);
    setRoster([]);
    setRosterFilter("ALL");
    setSearch("");
    setOverridingId(null);
    setMessage(null);
    setLoadingRoster(true);
    try {
      setRoster(await sessionApi.getAttendance(s.publicId));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load attendance" });
    } finally {
      setLoadingRoster(false);
    }
  }

  function backToSessions() {
    setSelectedSession(null);
    if (selectedClass) loadSessions(selectedClass); // counts may have changed via overrides
  }

  function sessionsTable(c: any) {
    const sessions = sessionsByClass[c.publicId];
    if (!sessions) return <p className="p-4 text-sm text-gray-400 animate-pulse">Loading…</p>;
    if (sessions.length === 0) return <p className="p-4 text-sm text-gray-400">No sessions yet — open one from your Overview when class starts.</p>;
    const RECENT = 8;
    const shown = showAll.has(c.publicId) ? sessions : sessions.slice(0, RECENT);
    return (
      <>
      <Table>
        <thead>
          <tr>
            <Th>Session</Th>
            <Th className="hidden sm:table-cell">Time</Th>
            <Th>Attendance</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {shown.map((s) => (
            <Tr key={s.publicId} onOpen={() => openSession(s, c)}>
              <Td className="whitespace-nowrap font-medium text-gray-900">{fmtDay(s.openedAt ?? s.expiresAt)}</Td>
              <Td className="hidden sm:table-cell whitespace-nowrap text-gray-500">
                {fmtTime(s.openedAt)} – {fmtTime(s.closedAt ?? s.expiresAt)}
              </Td>
              <Td>
                <RateBar attended={s.attendedCount ?? 0} enrolled={s.enrolledCount ?? 0} />
                {s.pendingBiometricCount > 0 && (
                  <p className="mt-1 text-xs text-orange-600">{s.pendingBiometricCount} awaiting biometric</p>
                )}
              </Td>
              <Td>
                {s.isOpen ? (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Open now
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">Closed</span>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      {sessions.length > RECENT && (
        <button type="button"
          onClick={() => setShowAll((prev) => { const next = new Set(prev); if (next.has(c.publicId)) next.delete(c.publicId); else next.add(c.publicId); return next; })}
          className="block w-full border-t border-gray-100 px-4 py-2.5 text-left text-xs font-medium text-blue-600 hover:bg-gray-50">
          {showAll.has(c.publicId) ? "Show recent only" : `Show all ${sessions.length} sessions`}
        </button>
      )}
      </>
    );
  }

  async function override(studentPublicId: string, status: string, reason: string) {
    await sessionApi.overrideAttendance(selectedSession.publicId, studentPublicId, { status, reason });
    setRoster(await sessionApi.getAttendance(selectedSession.publicId));
    setOverridingId(null);
    setMessage({ type: "success", text: "Attendance updated — the change and your reason are in the audit log." });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  if (classes.length === 0) {
    return (
      <div className={`${card} p-6`}>
        <p className="text-sm font-medium text-gray-900">No classes yet</p>
        <p className="mt-1 text-sm text-gray-500">An admin assigns you to a cohort and subject; your sessions show up here.</p>
      </div>
    );
  }

  const attended = roster.filter((r) => countsAsAttended(r.status)).length;
  const absent = roster.filter((r) => r.status === "ABSENT").length;
  const pending = roster.filter((r) => r.status === "PENDING_BIOMETRIC").length;
  const q = search.trim().toLowerCase();
  const matching = roster.filter((r) => !q || r.studentName.toLowerCase().includes(q));
  const visibleRoster = matching.filter((r) =>
    rosterFilter === "ALL" ? true
      : rosterFilter === "PRESENT" ? countsAsAttended(r.status)
      : rosterFilter === "PENDING" ? r.status === "PENDING_BIOMETRIC"
      : r.status === "ABSENT");

  return (
    <div className="space-y-4">
      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      {!selectedSession ? (
        /* Sessions, per cohort */
        <div className="space-y-4">
          {cohortIds.length > 1 && (
            <div className="flex justify-end">
              <button type="button" onClick={() => setOpenGroups(allOpen ? new Set() : new Set(cohortIds))}
                className="rounded-lg px-2.5 py-1.5 text-sm text-blue-600 hover:bg-blue-50">
                {allOpen ? "Collapse all" : "Expand all"}
              </button>
            </div>
          )}
          {cohortIds.map((cohortId) => {
            const cohortClasses = classes.filter((c) => c.cohortPublicId === cohortId);
            const loaded = cohortClasses.map((c) => sessionsByClass[c.publicId]).filter(Boolean) as any[][];
            const all = loaded.flat();
            const enrolled = all.reduce((n, s) => n + (s.enrolledCount ?? 0), 0);
            const attendedTotal = all.reduce((n, s) => n + (s.attendedCount ?? 0), 0);
            const rate = enrolled ? Math.round((attendedTotal / enrolled) * 100) : null;
            const live = all.some((s) => s.isOpen);
            return (
              <CollapsibleGroup
                key={cohortId}
                title={cohorts[cohortId] ?? "Cohort"}
                meta={loaded.length === cohortClasses.length
                  ? `${all.length} session${all.length === 1 ? "" : "s"}${rate != null ? ` · ${rate}% attendance` : ""}`
                  : `${cohortClasses.length} subject${cohortClasses.length === 1 ? "" : "s"}`}
                open={openSet.has(cohortId)}
                onToggle={() => toggleGroup(cohortId)}
                actions={live ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
                  </span>
                ) : undefined}
              >
                {cohortClasses.map((c) => (
                  <div key={c.publicId}>
                    {cohortClasses.length > 1 && (
                      <p className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
                        {subjects[c.subjectPublicId] ?? "Subject"}
                      </p>
                    )}
                    {sessionsTable(c)}
                  </div>
                ))}
              </CollapsibleGroup>
            );
          })}
        </div>
      ) : (
        /* One session's roster */
        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-4 py-4">
            <div>
              <button onClick={backToSessions} className="text-sm text-blue-600 hover:underline">← All sessions</button>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                {fmtDay(selectedSession.openedAt ?? selectedSession.expiresAt)}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  {fmtTime(selectedSession.openedAt)} – {fmtTime(selectedSession.closedAt ?? selectedSession.expiresAt)}
                </span>
              </h2>
              <p className="text-sm text-gray-500">{selectedClass ? classLabel(selectedClass) : ""}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div><p className="text-xl font-semibold text-gray-900">{attended}</p><p className="text-xs text-gray-400">Present</p></div>
              <div><p className="text-xl font-semibold text-gray-900">{absent}</p><p className="text-xs text-gray-400">Absent</p></div>
              {pending > 0 && <div><p className="text-xl font-semibold text-orange-600">{pending}</p><p className="text-xs text-gray-400">Awaiting biometric</p></div>}
            </div>
          </div>
          <ListToolbar
            count={visibleRoster.length}
            noun={visibleRoster.length === 1 ? "student" : "students"}
            segments={[
              { value: "ALL" as RosterFilter, label: "All", count: matching.length },
              { value: "PRESENT" as RosterFilter, label: "Present", count: matching.filter((r) => countsAsAttended(r.status)).length },
              { value: "ABSENT" as RosterFilter, label: "Absent", count: matching.filter((r) => r.status === "ABSENT").length },
              ...(pending > 0 ? [{ value: "PENDING" as RosterFilter, label: "Awaiting biometric", count: matching.filter((r) => r.status === "PENDING_BIOMETRIC").length }] : []),
            ]}
            segment={rosterFilter}
            onSegment={setRosterFilter}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Student name…"
          />
          {loadingRoster ? (
            <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : visibleRoster.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">{roster.length === 0 ? "No students enrolled." : "No one here."}</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th className="hidden sm:table-cell">Checked in</Th>
                  <Th>Status</Th>
                  <Th align="right"><span className="sr-only">Change</span></Th>
                </tr>
              </thead>
              <tbody>
                {visibleRoster.map((r) => (
                  <Fragment key={r.studentPublicId}>
                    <Tr>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.studentName} size={32} />
                          <div>
                            <p className="font-medium text-gray-900">{r.studentName}</p>
                            {r.verificationMethod === "MANUAL_OVERRIDE" && <p className="text-xs text-gray-400">Set by override</p>}
                          </div>
                        </div>
                      </Td>
                      <Td className="hidden sm:table-cell whitespace-nowrap text-gray-500">{fmtTime(r.markedAt)}</Td>
                      <Td><AttendanceStatusBadge status={r.status} /></Td>
                      <Td align="right">
                        {overridingId !== r.studentPublicId && (
                          <button onClick={() => setOverridingId(r.studentPublicId)} className="text-sm text-blue-600 hover:underline">
                            Change
                          </button>
                        )}
                      </Td>
                    </Tr>
                    {overridingId === r.studentPublicId && (
                      <tr>
                        <td colSpan={4} className="px-4 pb-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <OverrideAttendance
                                key={r.studentPublicId}
                                current={r.status}
                                startOpen
                                onSave={(status, reason) => override(r.studentPublicId, status, reason)}
                                onCancel={() => setOverridingId(null)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          )}
        </section>
      )}
    </div>
  );
}
