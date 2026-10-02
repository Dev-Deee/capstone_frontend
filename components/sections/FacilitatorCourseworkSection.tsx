"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { facilitatorCohortApi, assignmentApi, extensionRequestApi, cohortApi, subjectApi } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import ListToolbar from "@/components/ui/ListToolbar";
import RowMenu, { type MenuItem } from "@/components/ui/RowMenu";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

type StatusFilter = "ALL" | "DRAFT" | "OPEN" | "CLOSED";
type Message = { type: "success" | "error"; text: string } | null;
type Confirm = { id: string; cohortPublicId: string; kind: "publish" | "close" } | null;

// PUBLISHED and OPEN both mean "students can see and submit".
const isOpen = (s: string) => s === "OPEN" || s === "PUBLISHED";
const STATUS: Record<string, [string, string]> = {
  DRAFT: ["Draft", "bg-gray-100 text-gray-600"],
  OPEN: ["Open", "bg-green-100 text-green-700"],
  PUBLISHED: ["Open", "bg-green-100 text-green-700"],
  CLOSED: ["Closed", "bg-gray-100 text-gray-500"],
};

function StatusPill({ status }: { status: string }) {
  const [label, cls] = STATUS[status] ?? [status, "bg-gray-100 text-gray-500"];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

// "in 3 days" / "2 days ago" / "today", with the exact time underneath.
function Due({ deadline, closed }: { deadline: string; closed: boolean }) {
  const d = new Date(deadline);
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  const rel = days === 0 ? "Today" : days === 1 ? "Tomorrow" : days === -1 ? "Yesterday"
    : days > 0 ? `In ${days} days` : `${-days} days ago`;
  const overdue = !closed && d.getTime() < Date.now();
  return (
    <div className="whitespace-nowrap">
      <p className={overdue ? "text-red-600" : "text-gray-700"}>{rel}</p>
      <p className="text-xs text-gray-400">
        {d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500";

// A facilitator's coursework: every assignment across the cohorts and subjects
// they teach in one table, extension requests waiting on them above it, and
// the create form behind "New assignment".
export default function FacilitatorCourseworkSection() {
  const [myCohortRows, setMyCohortRows] = useState<any[]>([]);
  const [message, setMessage] = useState<Message>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cohortsById, setCohortsById] = useState<Record<string, string>>({});
  const [subjectsById, setSubjectsById] = useState<Record<string, string>>({});
  const [cohortAssignments, setCohortAssignments] = useState<Record<string, any[]>>({});

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [maxResubmissions, setMaxResubmissions] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [cohortFilter, setCohortFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [isActionWorking, setIsActionWorking] = useState(false);

  const [pendingExtensions, setPendingExtensions] = useState<any[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const uniqueCohorts = Array.from(new Map(myCohortRows.map((r) => [r.cohortPublicId, r])).values());
  const subjectsForSelectedCohort = myCohortRows
    .filter((r) => r.cohortPublicId === selectedCohort)
    .map((r) => ({ publicId: r.subjectPublicId, name: subjectsById[r.subjectPublicId] ?? r.subjectPublicId }));

  function loadPendingExtensions() {
    extensionRequestApi.getPending().then(setPendingExtensions).catch(() => {});
  }

  useEffect(() => {
    Promise.all([facilitatorCohortApi.getMine(), cohortApi.getAll(), subjectApi.getAll()])
      .then(([rows, cohorts, subjects]) => {
        setMyCohortRows(rows);
        setCohortsById(Object.fromEntries(cohorts.map((c: any) => [c.publicId, c.name])));
        setSubjectsById(Object.fromEntries(subjects.map((s: any) => [s.publicId, s.name])));
        const distinctCohortIds = Array.from(new Set(rows.map((r: any) => r.cohortPublicId as string)));
        return Promise.all(
          distinctCohortIds.map((cohortId) =>
            assignmentApi.getForCohort(cohortId)
              .then((list) => ({ cohortId, list }))
              .catch(() => ({ cohortId, list: [] as any[] })))
        ).then((results) => setCohortAssignments(Object.fromEntries(results.map(({ cohortId, list }) => [cohortId, list]))));
      })
      .catch((err: Error) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
    loadPendingExtensions();
  }, []);

  function refreshCohortAssignments(cohortPublicId: string) {
    assignmentApi.getForCohort(cohortPublicId)
      .then((list) => setCohortAssignments((prev) => ({ ...prev, [cohortPublicId]: list })))
      .catch(() => {});
  }

  // Every assignment, newest deadline first within each status group.
  const all = useMemo(() => Object.values(cohortAssignments).flat()
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()), [cohortAssignments]);
  const q = search.trim().toLowerCase();
  const matching = all.filter((a) =>
    (cohortFilter === "ALL" || a.cohortPublicId === cohortFilter) &&
    (!q || [a.title, a.description, subjectsById[a.subjectPublicId]].some((v) => v?.toLowerCase().includes(q))));
  const inStatus = (a: any, f: StatusFilter) =>
    f === "ALL" || (f === "OPEN" ? isOpen(a.status) : a.status === f);
  const visible = matching.filter((a) => inStatus(a, status));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    try {
      await assignmentApi.create({
        cohortPublicId: selectedCohort, subjectPublicId: selectedSubject,
        title, description, deadline, maxResubmissions,
      });
      setMessage({ type: "success", text: `"${title}" saved as a draft — publish it when students should see it.` });
      refreshCohortAssignments(selectedCohort);
      setTitle(""); setDescription(""); setDeadline("");
      setSelectedCohort(""); setSelectedSubject(""); setMaxResubmissions(3);
      setCreating(false);
      setStatus("ALL");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create assignment" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runConfirmed() {
    if (!confirm) return;
    setIsActionWorking(true);
    setMessage(null);
    try {
      if (confirm.kind === "publish") {
        await assignmentApi.publish(confirm.id);
        setMessage({ type: "success", text: "Assignment published — students can see it now." });
      } else {
        await assignmentApi.close(confirm.id);
        setMessage({ type: "success", text: "Assignment closed. No more submissions will be accepted." });
      }
      refreshCohortAssignments(confirm.cohortPublicId);
      setConfirm(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : `Failed to ${confirm.kind}` });
    } finally {
      setIsActionWorking(false);
    }
  }

  async function handleReviewExtension(publicId: string, approve: boolean) {
    setIsReviewing(true);
    setMessage(null);
    try {
      await extensionRequestApi.review(publicId, approve, reviewNote);
      setMessage({ type: "success", text: approve ? "Extension approved." : "Extension denied." });
      setReviewingId(null);
      setReviewNote("");
      loadPendingExtensions();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to review extension request" });
    } finally {
      setIsReviewing(false);
    }
  }

  function menuFor(a: any): MenuItem[] {
    if (a.status === "DRAFT") return [{ label: "Publish", onSelect: () => setConfirm({ id: a.publicId, cohortPublicId: a.cohortPublicId, kind: "publish" }) }];
    if (isOpen(a.status)) return [{ label: "Close early", tone: "danger", onSelect: () => setConfirm({ id: a.publicId, cohortPublicId: a.cohortPublicId, kind: "close" }) }];
    return [];
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      {/* Extension requests waiting on this facilitator */}
      {pendingExtensions.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Needs your review</h2>
            <span className="text-sm text-gray-400">
              {pendingExtensions.length} extension request{pendingExtensions.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="divide-y divide-gray-100">
            {pendingExtensions.map((ext: any) => (
              <li key={ext.publicId} className="px-4 py-3">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={ext.studentName} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{ext.studentName}</span>
                      <span className="text-gray-500"> wants until </span>
                      <span className="font-medium">{new Date(ext.requestedNewDeadline).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </p>
                    <p className="text-xs text-gray-400">{ext.assignmentTitle}</p>
                    {ext.reason && <p className="mt-1 text-sm text-gray-600">“{ext.reason}”</p>}
                  </div>
                  {reviewingId !== ext.publicId && (
                    <button onClick={() => { setReviewingId(ext.publicId); setReviewNote(""); }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
                      Review
                    </button>
                  )}
                </div>
                {reviewingId === ext.publicId && (
                  <div className="mt-3 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:ml-11">
                    <textarea placeholder="Note to the student (optional)…" value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleReviewExtension(ext.publicId, true)} disabled={isReviewing}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                        {isReviewing ? "Saving…" : "Approve"}
                      </button>
                      <button onClick={() => handleReviewExtension(ext.publicId, false)} disabled={isReviewing}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                        Deny
                      </button>
                      <button onClick={() => { setReviewingId(null); setReviewNote(""); }} className="text-sm text-gray-500 hover:text-gray-900">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* All assignments */}
      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "assignment" : "assignments"}
          segments={[
            { value: "ALL", label: "All", count: matching.length },
            { value: "DRAFT", label: "Drafts", count: matching.filter((a) => inStatus(a, "DRAFT")).length },
            { value: "OPEN", label: "Open", count: matching.filter((a) => inStatus(a, "OPEN")).length },
            { value: "CLOSED", label: "Closed", count: matching.filter((a) => inStatus(a, "CLOSED")).length },
          ]}
          segment={status}
          onSegment={setStatus}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Title or subject…"
        >
          {uniqueCohorts.length > 1 && (
            <select value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)}
              aria-label="Cohort" className="rounded-lg border border-gray-200 bg-surface px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">All cohorts</option>
              {uniqueCohorts.map((r) => (
                <option key={r.cohortPublicId} value={r.cohortPublicId}>{cohortsById[r.cohortPublicId] ?? r.cohortPublicId}</option>
              ))}
            </select>
          )}
          {myCohortRows.length > 0 && (
            <button type="button" onClick={() => setCreating((c) => !c)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              {creating ? "Close" : "New assignment"}
            </button>
          )}
        </ListToolbar>

        {creating && (
          <form onSubmit={handleCreate} className="grid gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4 md:grid-cols-2">
            <label className="text-xs text-gray-500 md:col-span-2">Title
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Build a REST API" className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs text-gray-500 md:col-span-2">Instructions
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What students need to do and hand in…" rows={3} className={`${inputClass} mt-1 resize-none`} />
            </label>
            <label className="text-xs text-gray-500">Cohort
              <select required value={selectedCohort} onChange={(e) => { setSelectedCohort(e.target.value); setSelectedSubject(""); }}
                className={`${inputClass} mt-1`}>
                <option value="">Select cohort…</option>
                {uniqueCohorts.map((r) => (
                  <option key={r.cohortPublicId} value={r.cohortPublicId}>{cohortsById[r.cohortPublicId] ?? r.cohortPublicId}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500">Subject
              <select required value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedCohort} className={`${inputClass} mt-1 disabled:opacity-50`}>
                <option value="">{selectedCohort ? "Select subject…" : "Pick a cohort first"}</option>
                {subjectsForSelectedCohort.map((s) => <option key={s.publicId} value={s.publicId}>{s.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-gray-500">Deadline
              <input type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs text-gray-500">Resubmissions allowed
              <input type="number" required min={0} value={maxResubmissions}
                onChange={(e) => setMaxResubmissions(Number(e.target.value))} className={`${inputClass} mt-1`} />
            </label>
            <div className="flex items-center gap-3 md:col-span-2">
              <button type="submit" disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? "Saving…" : "Save as draft"}
              </button>
              <p className="text-xs text-gray-400">Students don&apos;t see it until you publish.</p>
            </div>
          </form>
        )}

        {myCohortRows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">You aren&apos;t assigned to a cohort and subject yet — an admin sets that up.</p>
        ) : all.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No assignments yet — start with “New assignment”.</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No assignments match.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assignment</Th>
                <Th className="hidden md:table-cell">Cohort · Subject</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th align="right"><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <Fragment key={a.publicId}>
                  <Tr muted={a.status === "CLOSED"}>
                    <Td className="max-w-[22rem]">
                      <p className="truncate font-medium text-gray-900">{a.title}</p>
                      <p className="truncate text-xs text-gray-400">{a.description}</p>
                    </Td>
                    <Td className="hidden md:table-cell text-gray-600">
                      <p className="whitespace-nowrap">{cohortsById[a.cohortPublicId] ?? "—"}</p>
                      <p className="text-xs text-gray-400">{subjectsById[a.subjectPublicId] ?? ""}</p>
                    </Td>
                    <Td><Due deadline={a.deadline} closed={a.status === "CLOSED"} /></Td>
                    <Td><StatusPill status={a.status} /></Td>
                    <Td align="right"><RowMenu items={menuFor(a)} label={`Actions for ${a.title}`} /></Td>
                  </Tr>
                  {confirm && confirm.id === a.publicId && (
                    <tr>
                      <td colSpan={5} className="px-4 pb-4">
                        <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                          confirm.kind === "close" ? "border-red-100 bg-red-50" : "border-blue-100 bg-blue-50"
                        }`}>
                          <p className={`flex-1 text-sm ${confirm.kind === "close" ? "text-red-700" : "text-blue-800"}`}>
                            {confirm.kind === "publish"
                              ? "Publish this assignment? Students in the cohort will see it straight away."
                              : "Close this assignment early? No more submissions will be accepted."}
                          </p>
                          <button onClick={runConfirmed} disabled={isActionWorking}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
                              confirm.kind === "close" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                            }`}>
                            {isActionWorking ? "Working…" : confirm.kind === "publish" ? "Publish" : "Close early"}
                          </button>
                          <button onClick={() => setConfirm(null)} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>
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
    </div>
  );
}
