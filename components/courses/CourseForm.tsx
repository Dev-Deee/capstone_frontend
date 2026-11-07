"use client";

import { useEffect, useState } from "react";
import { cohortApi, facilitatorCohortApi, subjectApi, type CourseInput } from "@/lib/api";

export type CourseRole = "FACILITATOR" | "ADMIN" | "SUPER_ADMIN";

type Option = { publicId: string; name: string };

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500";

// What a course is and who it is for. A facilitator picks one of the subjects
// they teach, then only cohorts where they teach it; admins pick any cohorts,
// or every student.
export default function CourseForm({ role, initial, submitLabel, onSubmit, onCancel }: {
  role: CourseRole;
  initial?: CourseInput;
  submitLabel: string;
  onSubmit: (input: CourseInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [subjectId, setSubjectId] = useState(initial?.subjectPublicId ?? "");
  const [allStudents, setAllStudents] = useState(initial?.allStudents ?? false);
  const [cohortIds, setCohortIds] = useState<string[]>(initial?.cohortPublicIds ?? []);
  const [cohorts, setCohorts] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teaching, setTeaching] = useState<{ cohortPublicId: string; subjectPublicId: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const facilitator = role === "FACILITATOR";

  useEffect(() => {
    Promise.all([cohortApi.getAll(), subjectApi.getAll(), facilitator ? facilitatorCohortApi.getMine() : Promise.resolve([])])
      .then(([c, s, rows]) => {
        setCohorts(c.map((x: any) => ({ publicId: x.publicId, name: x.name })));
        setSubjects(s.map((x: any) => ({ publicId: x.publicId, name: x.name })));
        setTeaching(rows);
      })
      .catch(() => setError("Couldn't load cohorts and subjects"));
  }, [facilitator]);

  // What this person may choose from.
  const subjectOptions = facilitator
    ? subjects.filter((s) => teaching.some((t) => t.subjectPublicId === s.publicId))
    : subjects;
  const cohortOptions = facilitator
    ? cohorts.filter((c) => teaching.some((t) => t.cohortPublicId === c.publicId && t.subjectPublicId === subjectId))
    : cohorts;

  const toggle = (id: string) =>
    setCohortIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allStudents && cohortIds.length === 0) {
      setError(facilitator && !subjectId ? "Choose the subject first, then the cohorts" : "Choose at least one cohort");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        subjectPublicId: subjectId || undefined,
        allStudents,
        cohortPublicIds: allStudents ? [] : cohortIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the course");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <label className="text-xs text-gray-500 md:col-span-2">Title
        <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
          placeholder="e.g. Backend Engineering, Week by Week" className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-gray-500 md:col-span-2">Description (optional)
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={5000}
          placeholder="What students will find here" className={`${inputClass} mt-1 resize-none`} />
      </label>
      <label className="text-xs text-gray-500">Subject{facilitator ? "" : " (optional)"}
        <select required={facilitator} value={subjectId}
          onChange={(e) => { setSubjectId(e.target.value); if (facilitator) setCohortIds([]); }}
          className={`${inputClass} mt-1`}>
          <option value="">{facilitator ? "Select subject…" : "No particular subject"}</option>
          {subjectOptions.map((s) => <option key={s.publicId} value={s.publicId}>{s.name}</option>)}
        </select>
      </label>
      <div className="text-xs text-gray-500">
        Who can see it
        {!facilitator && (
          <div className="mt-1 flex gap-2">
            {[false, true].map((v) => (
              <button key={String(v)} type="button" onClick={() => setAllStudents(v)} aria-pressed={allStudents === v}
                className={`rounded-lg border px-3 py-1.5 text-sm ${allStudents === v ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-surface text-gray-600 hover:text-gray-900"}`}>
                {v ? "Every student" : "Chosen cohorts"}
              </button>
            ))}
          </div>
        )}
      </div>
      {!allStudents && (
        <fieldset className="md:col-span-2">
          <legend className="text-xs text-gray-500">Cohorts</legend>
          {cohortOptions.length === 0 ? (
            <p className="mt-1 text-sm text-gray-400">
              {facilitator ? (subjectId ? "You don't teach this subject in any cohort" : "Choose a subject to see your cohorts") : "No cohorts yet"}
            </p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-2">
              {cohortOptions.map((c) => (
                <label key={c.publicId} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                  cohortIds.includes(c.publicId) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-surface text-gray-700"}`}>
                  <input type="checkbox" className="sr-only" checked={cohortIds.includes(c.publicId)} onChange={() => toggle(c.publicId)} />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}
      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
      <div className="flex items-center gap-3 md:col-span-2">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>}
      </div>
    </form>
  );
}
