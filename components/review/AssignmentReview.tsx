"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { assignmentApi, reviewApi, type GradingType, type ReviewRow } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ListToolbar from "@/components/ui/ListToolbar";
import PageHeader from "@/components/PageHeader";
import { gradeText } from "@/lib/grading";

type Pile = "WAITING" | "SENT_BACK" | "REVIEWED" | "NOT_YET" | "MISSING";

const PILES: { value: Pile; label: string; empty: string }[] = [
  { value: "WAITING", label: "Waiting", empty: "Nothing waiting for review" },
  { value: "SENT_BACK", label: "Sent back", empty: "No work sent back" },
  { value: "REVIEWED", label: "Reviewed", empty: "Nothing reviewed yet" },
  { value: "NOT_YET", label: "Not yet submitted", empty: "Everyone has handed in" },
  { value: "MISSING", label: "Missing", empty: "Nobody missed the deadline" },
];

const pileOf = (r: ReviewRow): Pile =>
  r.status === "SUBMITTED" || r.status === "LATE_SUBMITTED" ? "WAITING"
    : r.status === "REDO_REQUESTED" ? "SENT_BACK"
    : r.status === "REVIEWED" ? "REVIEWED"
    : r.status === "MISSING" ? "MISSING" : "NOT_YET";

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
// datetime-local wants local "YYYY-MM-DDTHH:mm".
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const inThreeDays = () => toLocalInput(new Date(Date.now() + 3 * 86_400_000));

function age(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  const hours = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  return days >= 1 ? `${days} day${days === 1 ? "" : "s"}` : `${Math.max(hours, 0)} hour${hours === 1 ? "" : "s"}`;
}

const GRADING_LABEL: Record<GradingType, string> = {
  MARKS: "Marks", PERCENTAGE: "Percentage", PASS_FAIL: "Pass or fail", FEEDBACK_ONLY: "Feedback only",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// The grade control for an assignment's grading type.
function GradeInput({ type, maxMarks, score, passed, onScore, onPassed }: {
  type: GradingType; maxMarks: number | null; score: string; passed: boolean | null;
  onScore: (v: string) => void; onPassed: (v: boolean) => void;
}) {
  if (type === "FEEDBACK_ONLY") return null;
  if (type === "PASS_FAIL") {
    return (
      <div className="flex gap-2" role="group" aria-label="Grade">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" onClick={() => onPassed(v)} aria-pressed={passed === v}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              passed === v ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
            {v ? "Pass" : "Fail"}
          </button>
        ))}
      </div>
    );
  }
  const max = type === "MARKS" ? maxMarks ?? 100 : 100;
  return (
    <label className="flex items-center gap-2 text-sm text-gray-500">
      <input type="number" min={0} max={max} step="0.5" value={score} onChange={(e) => onScore(e.target.value)}
        aria-label="Grade" className="w-24 rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm tabular-nums text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {type === "MARKS" ? `out of ${max}` : "%"}
    </label>
  );
}

function Work({ row }: { row: { submissionType: string | null; linkUrl: string | null; fileUrl: string | null } }) {
  const href = row.submissionType === "FILE" ? row.fileUrl : row.linkUrl;
  if (!href) return <span className="text-gray-400">Nothing attached</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-blue-600 hover:underline">
      {row.submissionType === "FILE" ? "Open the file" : href}
    </a>
  );
}

export default function AssignmentReview({ assignmentPublicId, backHref }: { assignmentPublicId: string; backHref: string }) {
  const [assignment, setAssignment] = useState<any>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [pile, setPile] = useState<Pile | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [releasing, setReleasing] = useState(false);

  // The form for the selected student's work.
  const [score, setScore] = useState("");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [redoBy, setRedoBy] = useState(inThreeDays());
  const [reason, setReason] = useState("");
  const [regrading, setRegrading] = useState(false);

  useEffect(() => {
    Promise.all([assignmentApi.getOne(assignmentPublicId), reviewApi.list(assignmentPublicId)])
      .then(([a, list]) => { setAssignment(a); setRows(list); })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the work for this assignment"));
  }, [assignmentPublicId]);

  const counts = useMemo(() => {
    const c: Record<Pile, number> = { WAITING: 0, SENT_BACK: 0, REVIEWED: 0, NOT_YET: 0, MISSING: 0 };
    rows.forEach((r) => { c[pileOf(r)]++; });
    return c;
  }, [rows]);
  const active: Pile = pile ?? (counts.WAITING > 0 ? "WAITING" : (PILES.find((p) => counts[p.value] > 0)?.value ?? "WAITING"));
  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) => pileOf(r) === active
    && (!q || r.studentName.toLowerCase().includes(q) || r.studentEmail.toLowerCase().includes(q)));
  const current = rows.find((r) => r.publicId === selected) ?? visible[0] ?? null;
  const waiting = rows.filter((r) => pileOf(r) === "WAITING");
  const oldest = waiting.reduce<string | null>((o, r) => (r.submittedAt && (!o || r.submittedAt < o) ? r.submittedAt : o), null);

  const resetForm = useCallback((r: ReviewRow | null) => {
    setScore(r?.score != null ? String(r.score) : "");
    setPassed(r?.passed ?? null);
    setFeedback(r && pileOf(r) === "REVIEWED" ? r.feedback ?? "" : "");
    setRedoBy(r?.redoDueAt ? toLocalInput(new Date(r.redoDueAt)) : inThreeDays());
    setReason("");
    setRegrading(false);
  }, []);
  useEffect(() => { resetForm(current); }, [current?.publicId, resetForm]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (id: string | null) => { setSelected(id); setError(null); };

  // Next and previous in the visible list, from the keyboard (j / k), outside text fields.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "j" && e.key !== "k") return;
      const i = visible.findIndex((r) => r.publicId === current?.publicId);
      const next = visible[e.key === "j" ? Math.min(i + 1, visible.length - 1) : Math.max(i - 1, 0)];
      if (next) select(next.publicId);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, current?.publicId]);

  function replace(updated: ReviewRow) {
    setRows((prev) => prev.map((r) => (r.publicId === updated.publicId ? updated : r)));
  }

  async function act(run: () => Promise<ReviewRow>, done: string, moveOn: boolean) {
    if (!current) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await run();
      // After a decision, open the next piece of waiting work.
      const nextWaiting = moveOn ? waiting.find((r) => r.publicId !== updated.publicId) : undefined;
      replace(updated);
      setNotice(done);
      if (moveOn) select(nextWaiting?.publicId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work");
    } finally {
      setBusy(false);
    }
  }

  const type: GradingType = assignment?.gradingType ?? "MARKS";
  const scoreValue = score.trim() === "" ? null : Number(score);
  const attemptsLeft = current ? current.attemptsAllowed - current.resubmissionCount : 0;

  const accept = () => current && act(
    () => reviewApi.review(current.publicId, { decision: "ACCEPT", score: scoreValue, passed, feedback: feedback.trim() || undefined }),
    `${current.studentName}'s work accepted${assignment?.gradesReleasedAt ? "; they can see the grade now" : ". The grade shows once you release grades"}`, true);
  const sendBack = () => current && act(
    () => reviewApi.review(current.publicId, { decision: "REDO", feedback: feedback.trim(), redoDueAt: redoBy + ":00" }),
    `Sent back to ${current.studentName} to redo by ${fmt(redoBy)}`, true);
  const moreTime = () => current && act(
    () => reviewApi.extendRedo(current.publicId, { redoDueAt: redoBy + ":00" }), `${current.studentName} now has until ${fmt(redoBy)}`, false);
  const extraAttempt = () => current && act(
    () => reviewApi.extendRedo(current.publicId, { grantExtraAttempt: true }), `${current.studentName} has another attempt`, false);
  const regrade = () => current && act(
    () => reviewApi.regrade(current.publicId, { score: scoreValue, passed, feedback: feedback.trim(), reason: reason.trim() }),
    `${current.studentName}'s grade changed`, false);

  async function release() {
    setReleasing(true);
    setError(null);
    try {
      const updated = await reviewApi.releaseGrades(assignmentPublicId);
      setAssignment(updated);
      setNotice(`Grades released to ${counts.REVIEWED} student${counts.REVIEWED === 1 ? "" : "s"}; they've been notified`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't release grades");
    } finally {
      setReleasing(false);
    }
  }

  if (!assignment && !error) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="space-y-5 p-6">
      <Breadcrumbs items={[{ label: "Assignments", href: backHref }, { label: assignment?.title ?? "Review" }]} />
      <PageHeader
        title={assignment?.title ?? "Review"}
        description={assignment ? `${GRADING_LABEL[type]}${type === "MARKS" ? ` out of ${assignment.maxMarks ?? 100}` : ""} · due ${fmt(assignment.deadline)}` : undefined}
        actions={assignment && (assignment.gradesReleasedAt
          ? <p className="text-sm text-gray-500">Grades released {fmt(assignment.gradesReleasedAt)}</p>
          : <button type="button" onClick={release} disabled={releasing || counts.REVIEWED === 0}
              title={counts.REVIEWED === 0 ? "Accept some work first" : undefined}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {releasing ? "Releasing…" : `Release grades (${counts.REVIEWED})`}
            </button>)}
      />

      {!assignment?.gradesReleasedAt && counts.REVIEWED > 0 && (
        <p className="text-sm text-gray-500">
          Students don&apos;t see grades until you release them; work you send back reaches them straight away.
          {counts.WAITING > 0 && ` ${counts.WAITING} still waiting for review.`}
        </p>
      )}
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</div>}

      <section className="rounded-xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={counts.WAITING}
          noun={`waiting${oldest ? ` · oldest ${age(oldest)}` : ""}`}
          segments={PILES.map((p) => ({ value: p.value, label: p.label, count: counts[p.value] }))}
          segment={active}
          onSegment={(v) => { setPile(v); select(null); setNotice(null); }}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Student"
        />

        <div className="grid min-h-[420px] lg:grid-cols-[300px_1fr]">
          {/* Students in this pile */}
          <ul className="divide-y divide-gray-100 border-b border-gray-100 lg:border-b-0 lg:border-r" aria-label="Students">
            {visible.length === 0 && <li className="p-4 text-sm text-gray-500">{PILES.find((p) => p.value === active)?.empty}</li>}
            {visible.map((r) => {
              const isCurrent = r.publicId === current?.publicId;
              const grade = gradeText(type, assignment?.maxMarks, r.score, r.passed);
              return (
                <li key={r.publicId}>
                  <button type="button" onClick={() => select(r.publicId)} aria-current={isCurrent ? "true" : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isCurrent ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                    <Avatar name={r.studentName} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${isCurrent ? "font-medium text-gray-900" : "text-gray-800"}`}>{r.studentName}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {active === "WAITING" && r.submittedAt && `Handed in ${age(r.submittedAt)} ago${r.late ? " · late" : ""}`}
                        {active === "SENT_BACK" && `Redo by ${fmt(r.redoDueAt)}`}
                        {active === "REVIEWED" && (grade ?? "Feedback given")}
                        {(active === "NOT_YET" || active === "MISSING") && r.studentEmail}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* The selected student's work */}
          <div className="p-5">
            {!current ? (
              <p className="text-sm text-gray-500">{counts.WAITING === 0 && active === "WAITING" ? "All caught up" : "Choose a student"}</p>
            ) : (
              <div className="max-w-2xl space-y-5">
                <div className="flex items-start gap-3">
                  <Avatar name={current.studentName} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{current.studentName}</p>
                    <p className="text-sm text-gray-500">{current.studentEmail}</p>
                  </div>
                </div>

                {current.submittedAt ? (
                  <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Work</dt><dd><Work row={current} /></dd>
                    <dt className="text-gray-500">Handed in</dt>
                    <dd className="text-gray-800">{fmt(current.submittedAt)}{current.late && <span className="ml-2 text-red-600">late</span>}</dd>
                    <dt className="text-gray-500">Attempts</dt>
                    <dd className="tabular-nums text-gray-800">{current.resubmissionCount + 1} used · {Math.max(attemptsLeft, 0)} more allowed</dd>
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500">
                    {pileOf(current) === "MISSING" ? `Missed the deadline of ${fmt(current.effectiveDeadline)}` : `Not handed in yet · due ${fmt(current.effectiveDeadline)}`}
                  </p>
                )}

                {/* Waiting: accept with a grade, or send back */}
                {pileOf(current) === "WAITING" && (
                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    <GradeInput type={type} maxMarks={assignment?.maxMarks ?? null} score={score} passed={passed} onScore={setScore} onPassed={setPassed} />
                    <label className="block text-sm text-gray-500">Feedback
                      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4}
                        placeholder={type === "FEEDBACK_ONLY" ? "Your feedback" : "What went well, what to improve"} className={`${inputClass} mt-1 resize-y`} />
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={accept} disabled={busy}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                        {busy ? "Saving…" : "Accept"}
                      </button>
                      <span className="text-sm text-gray-500">or send back to redo by</span>
                      <input type="datetime-local" value={redoBy} onChange={(e) => setRedoBy(e.target.value)} aria-label="Redo by"
                        className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={sendBack} disabled={busy || attemptsLeft <= 0 || !feedback.trim()}
                        title={!feedback.trim() ? "Write what needs to change first" : undefined}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50">
                        Send back
                      </button>
                    </div>
                    {attemptsLeft <= 0 && (
                      <p className="text-sm text-gray-500">
                        No attempts left to send it back.{" "}
                        <button type="button" onClick={extraAttempt} disabled={busy} className="text-blue-600 hover:underline">Grant another attempt</button>
                      </p>
                    )}
                    <p className="text-xs text-gray-500">J and K move between students</p>
                  </div>
                )}

                {/* Sent back: the request, more time, another attempt */}
                {pileOf(current) === "SENT_BACK" && (
                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-sm text-gray-500">What you asked for</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{current.feedback}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-gray-500">Redo by</span>
                      <input type="datetime-local" value={redoBy} onChange={(e) => setRedoBy(e.target.value)} aria-label="New redo date"
                        className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={moreTime} disabled={busy}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50">
                        Give more time
                      </button>
                      <button type="button" onClick={extraAttempt} disabled={busy} className="text-sm text-blue-600 hover:underline">
                        Grant another attempt
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviewed: the grade, and changing it with a reason */}
                {pileOf(current) === "REVIEWED" && (
                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    {!regrading ? (
                      <>
                        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
                          {type !== "FEEDBACK_ONLY" && (<><dt className="text-gray-500">Grade</dt>
                            <dd className="font-medium tabular-nums text-gray-900">{gradeText(type, assignment?.maxMarks, current.score, current.passed)}</dd></>)}
                          <dt className="text-gray-500">Feedback</dt><dd className="whitespace-pre-wrap text-gray-800">{current.feedback ?? "—"}</dd>
                          <dt className="text-gray-500">Reviewed</dt><dd className="text-gray-800">{current.reviewedByName} · {fmt(current.reviewedAt)}</dd>
                        </dl>
                        <button type="button" onClick={() => setRegrading(true)} className="text-sm text-blue-600 hover:underline">Change grade</button>
                      </>
                    ) : (
                      <>
                        <GradeInput type={type} maxMarks={assignment?.maxMarks ?? null} score={score} passed={passed} onScore={setScore} onPassed={setPassed} />
                        <label className="block text-sm text-gray-500">Feedback
                          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className={`${inputClass} mt-1 resize-y`} />
                        </label>
                        <label className="block text-sm text-gray-500">Why is the grade changing? (kept in the audit log)
                          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={`${inputClass} mt-1`} />
                        </label>
                        <div className="flex gap-3">
                          <button type="button" onClick={regrade} disabled={busy || !reason.trim()}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                            {busy ? "Saving…" : "Save grade"}
                          </button>
                          <button type="button" onClick={() => resetForm(current)} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Every earlier review, oldest first */}
                {current.attempts.length > 0 && (
                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-sm font-medium text-gray-900">History</p>
                    <ol className="mt-3 space-y-3">
                      {current.attempts.map((a) => (
                        <li key={a.attemptNumber} className="text-sm">
                          <p className="text-gray-800">
                            Attempt {a.attemptNumber} · {a.decision === "REDO" ? "sent back" : "accepted"}
                            {gradeText(type, assignment?.maxMarks, a.score, a.passed) && ` · ${gradeText(type, assignment?.maxMarks, a.score, a.passed)}`}
                          </p>
                          <p className="text-xs text-gray-500">{a.reviewedByName} · {fmt(a.reviewedAt)} · <Work row={a} /></p>
                          {a.feedback && <p className="mt-1 whitespace-pre-wrap text-gray-600">{a.feedback}</p>}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
