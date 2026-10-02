"use client";

import { useEffect, useState } from "react";
import { facilitatorCohortApi, assignmentApi, extensionRequestApi, cohortApi, subjectApi } from "@/lib/api";
import TabBar from "@/components/TabBar";

type SubTab = "list" | "create" | "extensions";

type StatusPillProps = { status: string };

function StatusPill({ status }: StatusPillProps) {
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

export default function FacilitatorCourseworkSection() {
  const [myCohortRows, setMyCohortRows] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cohortsById, setCohortsById] = useState<Record<string, string>>({});
  const [subjectsById, setSubjectsById] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [maxResubmissions, setMaxResubmissions] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cohortAssignments, setCohortAssignments] = useState<Record<string, any[]>>({});
  const [isActionWorking, setIsActionWorking] = useState(false);

  const [pendingExtensions, setPendingExtensions] = useState<any[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  // Sub-tab state lives here so form input and loaded lists survive switching.
  const [subTab, setSubTab] = useState<SubTab>("list");
  // Cohorts open under My Assignments. null = not decided yet: expand the only
  // cohort when there's just one, otherwise start everything collapsed.
  const [expanded, setExpanded] = useState<Set<string> | null>(null);

  const uniqueCohorts = Array.from(
      new Map(myCohortRows.map((r) => [r.cohortPublicId, r])).values()
  );
  const subjectsForSelectedCohort = myCohortRows
      .filter((r) => r.cohortPublicId === selectedCohort)
      .map((r) => ({ publicId: r.subjectPublicId, name: subjectsById[r.subjectPublicId] ?? r.subjectPublicId }));

  function loadPendingExtensions() {
    extensionRequestApi
        .getPending()
        .then(setPendingExtensions)
        .catch(() => {});
  }

  useEffect(() => {
    Promise.all([facilitatorCohortApi.getMine(), cohortApi.getAll(), subjectApi.getAll()])
        .then(([rows, cohorts, subjects]) => {
          setMyCohortRows(rows);

          const cohortMap: Record<string, string> = {};
          cohorts.forEach((c: any) => { cohortMap[c.publicId] = c.name; });
          setCohortsById(cohortMap);

          const subjectMap: Record<string, string> = {};
          subjects.forEach((s: any) => { subjectMap[s.publicId] = s.name; });
          setSubjectsById(subjectMap);

          const distinctCohortIds = Array.from(new Set(rows.map((r: any) => r.cohortPublicId as string)));
          return Promise.all(
              distinctCohortIds.map((cohortId) =>
                  assignmentApi
                      .getForCohort(cohortId)
                      .then((list) => ({ cohortId, list }))
                      .catch(() => ({ cohortId, list: [] as any[] }))
              )
          ).then((results) => {
            const map: Record<string, any[]> = {};
            results.forEach(({ cohortId, list }) => { map[cohortId] = list; });
            setCohortAssignments(map);
          });
        })
        .catch((err: Error) => setMessage({ type: "error", text: err.message }))
        .finally(() => setIsLoading(false));

    loadPendingExtensions();
  }, []);

  const openCohorts = expanded ?? new Set(uniqueCohorts.length === 1 ? [uniqueCohorts[0].cohortPublicId] : []);
  const allOpen = uniqueCohorts.length > 0 && uniqueCohorts.every((r) => openCohorts.has(r.cohortPublicId));

  function toggleCohort(cohortPublicId: string) {
    const next = new Set(openCohorts);
    if (next.has(cohortPublicId)) next.delete(cohortPublicId); else next.add(cohortPublicId);
    setExpanded(next);
  }

  function cohortLabel(row: any) {
    return cohortsById[row.cohortPublicId] ?? row.cohortPublicId;
  }

  function refreshCohortAssignments(cohortPublicId: string) {
    assignmentApi
        .getForCohort(cohortPublicId)
        .then((list) => {
          setCohortAssignments((prev) => ({ ...prev, [cohortPublicId]: list }));
        })
        .catch(() => {});
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    try {
      await assignmentApi.create({
        cohortPublicId: selectedCohort,
        subjectPublicId: selectedSubject,
        title,
        description,
        deadline,
        maxResubmissions,
      });
      setMessage({ type: "success", text: "Assignment created successfully." });
      setTitle("");
      setDescription("");
      setDeadline("");
      setSelectedCohort("");
      setSelectedSubject("");
      setMaxResubmissions(3);
      refreshCohortAssignments(selectedCohort);
      setSubTab("list"); // show the new draft where it can be published
      setExpanded((prev) => new Set(prev ?? []).add(selectedCohort));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create assignment" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(assignmentPublicId: string, cohortPublicId: string) {
    if (!window.confirm("Publish this assignment? Students will be able to see it.")) return;
    setIsActionWorking(true);
    setMessage(null);
    try {
      await assignmentApi.publish(assignmentPublicId);
      setMessage({ type: "success", text: "Assignment published." });
      refreshCohortAssignments(cohortPublicId);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to publish" });
    } finally {
      setIsActionWorking(false);
    }
  }

  async function handleClose(assignmentPublicId: string, cohortPublicId: string) {
    if (!window.confirm("Close this assignment early? No more submissions will be accepted.")) return;
    setIsActionWorking(true);
    setMessage(null);
    try {
      await assignmentApi.close(assignmentPublicId);
      setMessage({ type: "success", text: "Assignment closed." });
      refreshCohortAssignments(cohortPublicId);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to close" });
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  return (
      <div>
        <div className="mb-5">
          <p className="text-sm text-gray-400 mt-0.5">Create and manage assignments for your cohorts</p>
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

        <TabBar
          tabs={[
            { id: "list", label: "My Assignments" },
            { id: "create", label: "Create Assignment" },
            {
              id: "extensions",
              label: pendingExtensions.length ? `Extension Requests (${pendingExtensions.length})` : "Extension Requests",
              live: pendingExtensions.length > 0,
            },
          ]}
          active={subTab}
          onChange={(id) => { setSubTab(id as SubTab); setMessage(null); }}
        />

        {/* Create Assignment */}
        {subTab === "create" && (
        <div className="bg-surface rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Create Assignment</h2>
          {myCohortRows.length === 0 ? (
              <p className="text-sm text-gray-400">You are not assigned to any cohort/subject yet.</p>
          ) : (
              <form onSubmit={handleCreate} className="space-y-3 max-w-lg">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Title</label>
                  <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Assignment title"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Assignment instructions…"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Deadline</label>
                  <input
                      type="datetime-local"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Cohort</label>
                    <select
                        required
                        value={selectedCohort}
                        onChange={(e) => { setSelectedCohort(e.target.value); setSelectedSubject(""); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select cohort…</option>
                      {uniqueCohorts.map((row) => (
                          <option key={row.cohortPublicId} value={row.cohortPublicId}>
                            {cohortLabel(row)}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Subject</label>
                    <select
                        required
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        disabled={!selectedCohort}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Select subject…</option>
                      {subjectsForSelectedCohort.map((s) => (
                          <option key={s.publicId} value={s.publicId}>
                            {s.name}
                          </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Resubmissions</label>
                  <input
                      type="number"
                      required
                      min={0}
                      value={maxResubmissions}
                      onChange={(e) => setMaxResubmissions(Number(e.target.value))}
                      className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating…" : "Create Assignment"}
                </button>
              </form>
          )}
        </div>
        )}

        {/* My Assignments */}
        {subTab === "list" && (
        <div className="bg-surface rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">My Assignments</h2>
            {uniqueCohorts.length > 1 && (
                <button
                    onClick={() => setExpanded(allOpen ? new Set() : new Set(uniqueCohorts.map((r) => r.cohortPublicId)))}
                    className="text-xs text-blue-600 hover:underline"
                >
                  {allOpen ? "Collapse all" : "Expand all"}
                </button>
            )}
          </div>
          {uniqueCohorts.length === 0 ? (
              <p className="text-sm text-gray-400">No cohorts assigned.</p>
          ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {uniqueCohorts.map((row) => {
                  const assignments = cohortAssignments[row.cohortPublicId] ?? [];
                  const isOpen = openCohorts.has(row.cohortPublicId);
                  const drafts = assignments.filter((a: any) => a.status === "DRAFT").length;
                  const open = assignments.filter((a: any) => a.status === "OPEN" || a.status === "PUBLISHED").length;
                  return (
                      <div key={row.cohortPublicId}>
                        <button
                            onClick={() => toggleCohort(row.cohortPublicId)}
                            aria-expanded={isOpen}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <svg
                              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                              aria-hidden="true"
                          >
                            <polyline points="9 6 15 12 9 18" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-800 flex-1 truncate">{cohortLabel(row)}</span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
                            {drafts > 0 && ` · ${drafts} draft`}
                            {open > 0 && ` · ${open} open`}
                          </span>
                        </button>
                        {isOpen && (
                        <div className="px-4 pb-4">
                        {assignments.length === 0 ? (
                            <p className="text-sm text-gray-400">No assignments for this cohort yet.</p>
                        ) : (
                            <div className="space-y-2">
                              {assignments.map((a: any) => (
                                  <div
                                      key={a.publicId}
                                      className="border border-gray-100 rounded-lg p-4 text-sm"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-medium text-gray-900 truncate">{a.title}</p>
                                          <StatusPill status={a.status} />
                                        </div>
                                        <p className="text-gray-500 text-xs line-clamp-2">{a.description}</p>
                                        <p className="text-gray-400 text-xs mt-1">
                                          Deadline: {new Date(a.deadline).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="flex flex-col gap-1 shrink-0">
                                        {a.status === "DRAFT" && (
                                            <button
                                                onClick={() => handlePublish(a.publicId, row.cohortPublicId)}
                                                disabled={isActionWorking}
                                                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                            >
                                              Publish
                                            </button>
                                        )}
                                        {(a.status === "OPEN" || a.status === "PUBLISHED") && (
                                            <button
                                                onClick={() => handleClose(a.publicId, row.cohortPublicId)}
                                                disabled={isActionWorking}
                                                className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                            >
                                              Close Early
                                            </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                              ))}
                            </div>
                        )}
                        </div>
                        )}
                      </div>
                  );
                })}
              </div>
          )}
        </div>
        )}

        {/* Extension Requests */}
        {subTab === "extensions" && (
        <div className="bg-surface rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pending Extension Requests</h2>
          {pendingExtensions.length === 0 ? (
              <p className="text-sm text-gray-400">No pending extension requests.</p>
          ) : (
              <div className="space-y-3">
                {pendingExtensions.map((ext: any) => (
                    <div key={ext.publicId} className="border border-gray-100 rounded-lg p-4 text-sm">
                      <div className="mb-1">
                        <p className="text-gray-900 font-medium">{ext.studentName}</p>
                        <p className="text-xs text-gray-500">{ext.assignmentTitle}</p>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        Requested new deadline: {new Date(ext.requestedNewDeadline).toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mb-3">{ext.reason}</p>

                      {reviewingId === ext.publicId ? (
                          <div className="space-y-2 pt-2 border-t border-gray-100">
              <textarea
                  placeholder="Review note (optional)…"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
                            <div className="flex gap-2">
                              <button
                                  onClick={() => handleReviewExtension(ext.publicId, true)}
                                  disabled={isReviewing}
                                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isReviewing ? "Saving…" : "Approve"}
                              </button>
                              <button
                                  onClick={() => handleReviewExtension(ext.publicId, false)}
                                  disabled={isReviewing}
                                  className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
                              >
                                Deny
                              </button>
                              <button
                                  onClick={() => { setReviewingId(null); setReviewNote(""); }}
                                  className="text-xs text-gray-500 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                      ) : (
                          <button
                              onClick={() => setReviewingId(ext.publicId)}
                              className="text-xs text-blue-600 hover:underline"
                          >
                            Review
                          </button>
                      )}
                    </div>
                ))}
              </div>
          )}
        </div>
        )}
      </div>
  );
}