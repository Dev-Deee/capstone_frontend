"use client";

import { useEffect, useState } from "react";
import { submissionApi, assignmentApi, extensionRequestApi } from "@/lib/api";

type SubmissionEntry = {
  submission: any;
  assignment: any;
};

type SubmissionStatusPillProps = { status: string };

function SubmissionStatusPill({ status }: SubmissionStatusPillProps) {
  const map: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-500",
    SUBMITTED: "bg-green-100 text-green-700",
    LATE_SUBMITTED: "bg-amber-100 text-amber-700",
    MISSING: "bg-red-100 text-red-600",
    REVIEWED: "bg-blue-100 text-blue-700",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

type AssignmentStatusPillProps = { status: string };

function AssignmentStatusPill({ status }: AssignmentStatusPillProps) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-500",
    OPEN: "bg-green-100 text-green-700",
    PUBLISHED: "bg-blue-100 text-blue-700",
    CLOSED: "bg-gray-200 text-gray-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {status}
    </span>
  );
}

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
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-gray-100 space-y-3">
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
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      <p className="text-xs font-medium text-gray-600">Request Deadline Extension</p>
      <input
        type="datetime-local"
        required
        value={requestedNewDeadline}
        onChange={(e) => setRequestedNewDeadline(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        required
        placeholder="Reason for extension…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

export default function StudentAssignmentsPage() {
  const [entries, setEntries] = useState<SubmissionEntry[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extensionOpen, setExtensionOpen] = useState<Record<string, boolean>>({});

  function loadData() {
    submissionApi
      .getMine()
      .then((submissions) => {
        return Promise.all(
          submissions.map((sub: any) =>
            assignmentApi
              .getOne(sub.assignmentPublicId)
              .then((assignment) => ({ submission: sub, assignment }))
              .catch(() => ({ submission: sub, assignment: null }))
          )
        ).then((results) => {
          setEntries(results);
        });
      })
      .catch((err: Error) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleExtension(submissionPublicId: string) {
    setExtensionOpen((prev) => ({ ...prev, [submissionPublicId]: !prev[submissionPublicId] }));
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">My Assignments</h1>
        <p className="text-sm text-gray-400 mt-0.5">View assignments and submit your work</p>
      </div>

      {message && (
        <div
          className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-400">No assignments found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(({ submission, assignment }) => {
            const canSubmit =
              assignment &&
              (submission.status === "PENDING" || submission.status === "SUBMITTED") &&
              (submission.resubmissionCount ?? 0) < (assignment.maxResubmissions ?? 0);
            const resubLimitReached =
              assignment &&
              (submission.resubmissionCount ?? 0) >= (assignment.maxResubmissions ?? 0) &&
              submission.status !== "REVIEWED" &&
              submission.status !== "MISSING";
            const canRequestExtension =
              assignment && assignment.status !== "CLOSED";

            return (
              <div
                key={submission.publicId}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {assignment?.title ?? "Unknown Assignment"}
                      </h2>
                      {assignment && <AssignmentStatusPill status={assignment.status} />}
                    </div>
                    {assignment?.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{assignment.description}</p>
                    )}
                  </div>
                  <SubmissionStatusPill status={submission.status} />
                </div>

                {/* Deadline */}
                {assignment?.deadline && (
                  <p className="text-xs text-gray-400 mb-2">
                    Deadline: {new Date(assignment.deadline).toLocaleString()}
                  </p>
                )}

                {/* Clarification note */}
                {submission.clarificationNote && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
                    <p className="text-xs font-medium text-amber-800 mb-0.5">Facilitator Note</p>
                    <p className="text-xs text-amber-700">{submission.clarificationNote}</p>
                  </div>
                )}

                {/* Submission form */}
                {canSubmit && (
                  <SubmitForm
                    submissionPublicId={submission.publicId}
                    onSuccess={() => {
                      setMessage({ type: "success", text: "Submitted successfully." });
                      setIsLoading(true);
                      loadData();
                    }}
                  />
                )}

                {/* Resubmission limit */}
                {resubLimitReached && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    Resubmission limit reached.
                  </p>
                )}

                {/* Extension request */}
                {canRequestExtension && (
                  <div className="mt-3">
                    {extensionOpen[submission.publicId] ? (
                      <ExtensionForm
                        submissionPublicId={submission.publicId}
                        onSuccess={() =>
                          setExtensionOpen((prev) => ({ ...prev, [submission.publicId]: false }))
                        }
                      />
                    ) : (
                      <button
                        onClick={() => toggleExtension(submission.publicId)}
                        className="text-xs text-gray-500 hover:text-gray-900 underline"
                      >
                        Request Extension
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
