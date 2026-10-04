"use client";

import { useEffect, useState } from "react";
import { submissionApi, assignmentApi, extensionRequestApi } from "@/lib/api";
import ListToolbar from "@/components/ui/ListToolbar";

type SubmissionEntry = {
  submission: any;
  assignment: any;
};

type SubmitFormProps = {
  submissionPublicId: string;
  onSuccess: () => void;
};

function SubmitForm({ submissionPublicId, onSuccess }: SubmitFormProps) {
  const [mode, setMode] = useState<"link" | "file">("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "link") {
        await submissionApi.submitLink(submissionPublicId, linkUrl);
      } else {
        if (!file) { setError("Please select a file."); setIsSubmitting(false); return; }
        await submissionApi.submitFile(submissionPublicId, file);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`text-xs px-3 py-1.5 rounded-md border ${mode === "link" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Submit Link
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`text-xs px-3 py-1.5 rounded-md border ${mode === "file" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Submit File
        </button>
      </div>
      {mode === "link" ? (
        <input
          type="url"
          required
          placeholder="https://…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <input
          type="file"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}

type ExtensionFormProps = {
  submissionPublicId: string;
  onSuccess: () => void;
};

function ExtensionForm({ submissionPublicId, onSuccess }: ExtensionFormProps) {
  const [requestedNewDeadline, setRequestedNewDeadline] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await extensionRequestApi.create(submissionPublicId, { requestedNewDeadline, reason });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit extension request");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return <p className="text-xs text-green-700 mt-2">Extension request submitted.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-600">Ask for more time — your facilitator decides</p>
      <input
        type="datetime-local"
        required
        value={requestedNewDeadline}
        onChange={(e) => setRequestedNewDeadline(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        required
        placeholder="Reason for extension…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send Request"}
      </button>
    </form>
  );
}

type Group = "DUE" | "NEW" | "SUBMITTED" | "REVIEWED" | "MISSED";
type Filter = Group | "ALL";

const GROUPS: { value: Group; label: string; hint: string }[] = [
  { value: "DUE", label: "Due soon", hint: "Due in the next 3 days and not handed in yet." },
  { value: "NEW", label: "New", hint: "Not handed in yet, with time to spare." },
  { value: "SUBMITTED", label: "Submitted", hint: "Handed in and waiting for your facilitator." },
  { value: "REVIEWED", label: "Reviewed", hint: "Your facilitator has reviewed these." },
  { value: "MISSED", label: "Missed", hint: "The deadline passed without a hand-in." },
];
const SOON_MS = 3 * 86_400_000;

// Which pile an assignment belongs in, from the student's point of view. Uses
// the deadline that actually applies (an approved extension's, if any).
function groupOf(sub: any, a: any): Group {
  if (sub.status === "REVIEWED") return "REVIEWED";
  if (sub.status === "SUBMITTED" || sub.status === "LATE_SUBMITTED") return "SUBMITTED";
  if (sub.status === "MISSING") return "MISSED";
  const due = new Date(sub.effectiveDeadline ?? a?.deadline).getTime();
  if (a?.status === "CLOSED" || due < Date.now()) return "MISSED";
  return due - Date.now() <= SOON_MS ? "DUE" : "NEW";
}

const deadlineOf = (sub: any, a: any) => new Date(sub.effectiveDeadline ?? a?.deadline);

function dueText(d: Date) {
  const ms = d.getTime() - Date.now();
  const abs = Math.abs(ms);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const span = hours < 24 ? `${hours} hour${hours === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"}`;
  return ms >= 0 ? `Due in ${span}` : `Was due ${span} ago`;
}

const PILL: Record<string, [string, string]> = {
  DUE: ["Due soon", "bg-amber-100 text-amber-700"],
  NEW: ["To do", "bg-blue-100 text-blue-700"],
  SUBMITTED: ["Submitted", "bg-green-100 text-green-700"],
  LATE_SUBMITTED: ["Submitted late", "bg-amber-100 text-amber-700"],
  REVIEWED: ["Reviewed", "bg-blue-100 text-blue-700"],
  MISSED: ["Missed", "bg-red-100 text-red-700"],
};

function Pill({ kind }: { kind: string }) {
  const [label, cls] = PILL[kind] ?? [kind, "bg-gray-100 text-gray-500"];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

export default function StudentAssignmentsSection() {
  const [entries, setEntries] = useState<SubmissionEntry[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<{ id: string; kind: "submit" | "extension" } | null>(null);

  function loadData() {
    submissionApi
      .getMine()
      .then((submissions) => Promise.all(
        submissions.map((sub: any) =>
          assignmentApi.getOne(sub.assignmentPublicId)
            .then((assignment) => ({ submission: sub, assignment }))
            .catch(() => ({ submission: sub, assignment: null })))
      ).then(setEntries))
      .catch((err: Error) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  const q = search.trim().toLowerCase();
  const grouped = entries
    .filter(({ assignment }) => !q || [assignment?.title, assignment?.description].some((v: string | undefined) => v?.toLowerCase().includes(q)))
    .map((e) => ({ ...e, group: groupOf(e.submission, e.assignment) }));
  const count = (g: Group) => grouped.filter((e) => e.group === g).length;
  // Open on the most pressing pile that has anything in it.
  const active: Filter = filter ?? (GROUPS.find((g) => count(g.value) > 0)?.value ?? "ALL");
  const visible = grouped
    .filter((e) => active === "ALL" || e.group === active)
    .sort((x, y) => {
      const dx = deadlineOf(x.submission, x.assignment).getTime(), dy = deadlineOf(y.submission, y.assignment).getTime();
      // Upcoming work soonest-first; finished or missed work most-recent-first.
      return x.group === "DUE" || x.group === "NEW" ? dx - dy : dy - dx;
    });
  const hint = GROUPS.find((g) => g.value === active)?.hint;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "assignment" : "assignments"}
          segments={[
            ...GROUPS.map((g) => ({ value: g.value as Filter, label: g.label, count: count(g.value) })),
            { value: "ALL" as Filter, label: "All", count: grouped.length },
          ]}
          segment={active}
          onSegment={(v) => { setFilter(v); setOpen(null); }}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Assignment…"
        />
        {hint && <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-400">{hint}</p>}

        {entries.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No assignments yet — they appear here when your facilitator publishes one.</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">{q ? "No assignments match." : "Nothing here."}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map(({ submission, assignment, group }) => {
              const due = deadlineOf(submission, assignment);
              const firstHandIn = !submission.submittedAt;
              const canSubmit = assignment?.status === "OPEN" && due.getTime() > Date.now()
                && submission.status !== "REVIEWED" && submission.status !== "MISSING"
                && (firstHandIn || (submission.resubmissionCount ?? 0) < (assignment?.maxResubmissions ?? 0));
              const resubsLeft = Math.max(0, (assignment?.maxResubmissions ?? 0) - (submission.resubmissionCount ?? 0));
              const extensionPending = submission.extensionStatus === "PENDING_APPROVAL";
              const canAskForTime = assignment && assignment.status !== "CLOSED" && !extensionPending
                && (group === "DUE" || group === "NEW" || group === "MISSED") && submission.status !== "MISSING";
              const isOpenRow = open?.id === submission.publicId;
              const pillKind = group === "SUBMITTED" ? submission.status : group;

              return (
                <li key={submission.publicId} className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-gray-900">{assignment?.title ?? "Unknown assignment"}</h3>
                        <Pill kind={pillKind} />
                      </div>
                      {assignment?.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{assignment.description}</p>}
                      {assignment?.attachmentUrl && (
                        <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 11-8.6 8.6a5 5 0 0 1-7-7l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" /></svg>
                          <span className="truncate">{assignment.attachmentName ?? "Attachment"}</span>
                        </a>
                      )}
                      <p className={`mt-1.5 text-xs ${group === "DUE" ? "text-amber-700" : group === "MISSED" ? "text-red-600" : "text-gray-400"}`}>
                        {group === "SUBMITTED" || group === "REVIEWED"
                          ? `Handed in ${new Date(submission.submittedAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                          : dueText(due)}
                        {" · "}
                        {due.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {submission.extensionStatus === "APPROVED" && " · extended"}
                        {extensionPending && " · extension requested"}
                        {submission.extensionStatus === "DENIED" && " · extension declined"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {canAskForTime && (
                        <button onClick={() => setOpen(isOpenRow && open?.kind === "extension" ? null : { id: submission.publicId, kind: "extension" })}
                          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900">
                          Ask for more time
                        </button>
                      )}
                      {canSubmit && (
                        <button onClick={() => setOpen(isOpenRow && open?.kind === "submit" ? null : { id: submission.publicId, kind: "submit" })}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                          {firstHandIn ? "Hand in" : `Resubmit (${resubsLeft} left)`}
                        </button>
                      )}
                    </div>
                  </div>

                  {assignment?.clarificationNote && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-xs font-medium text-amber-800">Note from your facilitator</p>
                      <p className="text-xs text-amber-700">{assignment.clarificationNote}</p>
                    </div>
                  )}

                  {isOpenRow && open?.kind === "submit" && (
                    <div className="mt-3">
                      <SubmitForm
                        submissionPublicId={submission.publicId}
                        onSuccess={() => {
                          setMessage({ type: "success", text: `"${assignment?.title}" handed in.` });
                          setOpen(null);
                          setIsLoading(true);
                          loadData();
                        }}
                      />
                    </div>
                  )}
                  {isOpenRow && open?.kind === "extension" && (
                    <div className="mt-3">
                      <ExtensionForm
                        submissionPublicId={submission.publicId}
                        onSuccess={() => {
                          setMessage({ type: "success", text: "Extension request sent to your facilitator." });
                          setOpen(null);
                          setIsLoading(true);
                          loadData();
                        }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
