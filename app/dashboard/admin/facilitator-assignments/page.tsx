"use client";

import { useEffect, useState } from "react";
import { cohortApi, subjectApi, userApi, facilitatorCohortApi } from "@/lib/api";

export default function AdminFacilitatorAssignmentsPage() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const [facilitatorPublicId, setFacilitatorPublicId] = useState("");
  const [cohortPublicId, setCohortPublicId] = useState("");
  const [subjectPublicId, setSubjectPublicId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([cohortApi.getAll(), subjectApi.getAll(), userApi.getFacilitators()])
      .then(([c, s, f]) => {
        setCohorts(c);
        setSubjects(s);
        setFacilitators(f);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await facilitatorCohortApi.assign({ facilitatorPublicId, cohortPublicId, subjectPublicId });
      setMessage({ type: "success", text: "Facilitator assigned." });
      setFacilitatorPublicId("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed — check you hold MANAGE_FACILITATOR_ASSIGNMENTS for this cohort" });
    }
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Facilitator Assignments</h1>

      {message && (
        <div className={`text-sm rounded-md px-3 py-2 border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            required value={facilitatorPublicId}
            onChange={(e) => setFacilitatorPublicId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select a facilitator…</option>
            {facilitators.map((f) => (
              <option key={f.publicId} value={f.publicId}>{f.fullName}</option>
            ))}
          </select>
          {facilitators.length === 0 && (
            <p className="text-xs text-amber-600">No facilitators found — invite one from Staff Invites first.</p>
          )}
          <select
            required value={cohortPublicId}
            onChange={(e) => setCohortPublicId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select a cohort…</option>
            {cohorts.map((c) => (
              <option key={c.publicId} value={c.publicId}>{c.name}</option>
            ))}
          </select>
          <select
            required value={subjectPublicId}
            onChange={(e) => setSubjectPublicId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select a subject…</option>
            {subjects.map((s) => (
              <option key={s.publicId} value={s.publicId}>{s.name}</option>
            ))}
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700">
            Assign
          </button>
        </form>
      </div>
    </div>
  );
}
