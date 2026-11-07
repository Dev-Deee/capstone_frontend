"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { courseApi, type Course, type CourseMaterial, type CourseSection } from "@/lib/api";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageHeader from "@/components/PageHeader";
import CourseForm, { type CourseRole } from "@/components/courses/CourseForm";
import MaterialLink from "@/components/courses/MaterialLink";
import { CourseStatusPill, audienceText, courseState } from "@/components/courses/CourseManager";

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500";
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const fmtWhen = (d: string) =>
  new Date(d).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function MoveButtons({ first, last, onMove, label }: { first: boolean; last: boolean; onMove: (d: "UP" | "DOWN") => void; label: string }) {
  const btn = "rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <span className="flex">
      <button type="button" onClick={() => onMove("UP")} disabled={first} aria-label={`Move ${label} up`} className={btn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
      </button>
      <button type="button" onClick={() => onMove("DOWN")} disabled={last} aria-label={`Move ${label} down`} className={btn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
    </span>
  );
}

// Adding a material to a section: upload a file, or paste a link (e.g. Google Drive).
function AddMaterial({ section, onDone, onError }: { section: CourseSection; onDone: (c: Course) => void; onError: (m: string) => void }) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = mode === "file"
        ? await courseApi.addFile(section.publicId, file!, title.trim() || undefined, note.trim() || undefined)
        : await courseApi.addLink(section.publicId, { title: title.trim(), url: url.trim(), note: note.trim() || undefined });
      onDone(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't add the material");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex gap-2">
        {([["file", "Upload a file"], ["link", "Add a link"]] as const).map(([v, label]) => (
          <button key={v} type="button" onClick={() => setMode(v)} aria-pressed={mode === v}
            className={`rounded-md border px-3 py-1.5 text-xs ${mode === v ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-surface text-gray-600 hover:text-gray-900"}`}>
            {label}
          </button>
        ))}
      </div>
      {mode === "file" ? (
        <label className="block text-xs text-gray-500">File (documents, slides, video; 100 MB max)
          <input type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 file:ring-1 file:ring-gray-200 hover:file:bg-gray-100" />
        </label>
      ) : (
        <label className="block text-xs text-gray-500">Link (Google Drive file or folder, or any web page)
          <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" className={`${inputClass} mt-1`} />
        </label>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-gray-500">Title{mode === "file" ? " (optional; the file name otherwise)" : ""}
          <input required={mode === "link"} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={`${inputClass} mt-1`} />
        </label>
        <label className="text-xs text-gray-500">Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="e.g. Read before Tuesday's class" className={`${inputClass} mt-1`} />
        </label>
      </div>
      <button type="submit" disabled={busy || (mode === "file" && !file)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? (mode === "file" ? "Uploading…" : "Adding…") : "Add to section"}
      </button>
    </form>
  );
}

export default function CourseEditor({ publicId, role, listHref }: { publicId: string; role: CourseRole; listHref: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [panel, setPanel] = useState<"schedule" | "delete" | null>(null);
  const [when, setWhen] = useState(toLocalInput(new Date(Date.now() + 86_400_000)));
  const [newSection, setNewSection] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<{ id: string; title: string; note: string } | null>(null);

  useEffect(() => {
    courseApi.get(publicId).then(setCourse).catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the course"));
  }, [publicId]);

  async function run(action: () => Promise<Course | void>, done?: string) {
    setError(null);
    setNotice(null);
    try {
      const updated = await action();
      if (updated) setCourse(updated);
      if (done) setNotice(done);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work");
    }
  }

  if (!course) {
    return (
      <div className="space-y-4 p-6">
        <Breadcrumbs items={[{ label: "Courses", href: listHref }, { label: "Course" }]} />
        {error ? <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          : <p className="text-sm text-gray-400">Loading…</p>}
      </div>
    );
  }

  const state = courseState(course);

  return (
    <div className="space-y-5 p-6">
      <Breadcrumbs items={[{ label: "Courses", href: listHref }, { label: course.title }]} />
      <PageHeader
        title={course.title}
        description={`${course.subjectName ? course.subjectName + " · " : ""}for ${audienceText(course)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CourseStatusPill course={course} />
            {state === "SCHEDULED" && <span className="text-xs text-gray-400">{fmtWhen(course.publishAt!)}</span>}
            {state !== "PUBLISHED" ? (
              <>
                <button type="button" onClick={() => run(() => courseApi.publish(course.publicId), "Published; students in the audience have been notified")}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Publish now</button>
                <button type="button" onClick={() => setPanel(panel === "schedule" ? null : "schedule")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                  {state === "SCHEDULED" ? "Change schedule" : "Publish later"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => run(() => courseApi.unpublish(course.publicId), "Back to a draft; students no longer see it")}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Unpublish</button>
            )}
          </div>
        }
      />

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</div>}

      {panel === "schedule" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <span className="text-sm text-gray-700">Publish on its own at</span>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="button" onClick={() => run(() => courseApi.schedule(course.publicId, when + ":00"), `Will publish ${fmtWhen(when)}`).then(() => setPanel(null))}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Save schedule</button>
          {course.publishAt && (
            <button type="button" onClick={() => run(() => courseApi.schedule(course.publicId, null), "Schedule cancelled").then(() => setPanel(null))}
              className="text-sm text-gray-600 hover:underline">Cancel schedule</button>
          )}
          <button type="button" onClick={() => setPanel(null)} className="text-sm text-gray-500 hover:text-gray-900">Close</button>
        </div>
      )}

      {/* Details */}
      <section className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
        {!editingDetails ? (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-700">{course.description ?? <span className="text-gray-400">No description</span>}</p>
              <p className="mt-1 text-xs text-gray-400">Created by {course.createdByName}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingDetails(true)} className="text-sm text-blue-600 hover:underline">Edit details</button>
              <button type="button" onClick={() => setPanel(panel === "delete" ? null : "delete")} className="text-sm text-red-600 hover:underline">Delete course</button>
            </div>
          </div>
        ) : (
          <CourseForm role={role} submitLabel="Save details" onCancel={() => setEditingDetails(false)}
            initial={{ title: course.title, description: course.description ?? "", subjectPublicId: course.subjectPublicId ?? "",
              allStudents: course.allStudents, cohortPublicIds: course.cohorts.map((c) => c.publicId) }}
            onSubmit={async (input) => {
              setCourse(await courseApi.update(course.publicId, input));
              setEditingDetails(false);
              setNotice("Details saved");
            }} />
        )}
        {panel === "delete" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-sm text-red-700">Delete “{course.title}” and its {course.materialCount} material{course.materialCount === 1 ? "" : "s"}? Uploaded files are removed too.</p>
            <button type="button" onClick={() => run(async () => { await courseApi.remove(course.publicId); router.push(listHref); })}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">Delete</button>
            <button type="button" onClick={() => setPanel(null)} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>
          </div>
        )}
      </section>

      {/* Sections */}
      {course.sections.map((section, si) => (
        <section key={section.publicId} className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
            {renaming?.id === section.publicId ? (
              <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault();
                run(() => courseApi.renameSection(section.publicId, renaming.title)).then(() => setRenaming(null)); }}>
                <input autoFocus required value={renaming.title} maxLength={200} onChange={(e) => setRenaming({ ...renaming, title: e.target.value })} className={inputClass} />
                <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => setRenaming(null)} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>
              </form>
            ) : (
              <>
                <h2 className="flex-1 font-medium text-gray-900">{section.title}</h2>
                <span className="text-xs text-gray-400">{section.materials.length} material{section.materials.length === 1 ? "" : "s"}</span>
                <MoveButtons first={si === 0} last={si === course.sections.length - 1} label="section"
                  onMove={(d) => run(() => courseApi.moveSection(section.publicId, d))} />
                <button type="button" onClick={() => setRenaming({ id: section.publicId, title: section.title })} className="text-sm text-blue-600 hover:underline">Rename</button>
                <button type="button" onClick={() => run(() => courseApi.removeSection(section.publicId), `Removed “${section.title}”`)}
                  className="text-sm text-red-600 hover:underline">Remove</button>
              </>
            )}
          </div>

          <ul className="divide-y divide-gray-100">
            {section.materials.length === 0 && <li className="px-4 py-3 text-sm text-gray-400">No materials yet</li>}
            {section.materials.map((m: CourseMaterial, mi) => (
              <li key={m.publicId} className="px-4 py-3">
                {editingMaterial?.id === m.publicId ? (
                  <form className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault();
                    run(() => courseApi.updateMaterial(m.publicId, { title: editingMaterial.title, note: editingMaterial.note })).then(() => setEditingMaterial(null)); }}>
                    <input required value={editingMaterial.title} maxLength={200} onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })} className={inputClass} aria-label="Title" />
                    <input value={editingMaterial.note} maxLength={2000} onChange={(e) => setEditingMaterial({ ...editingMaterial, note: e.target.value })} placeholder="Note" className={inputClass} aria-label="Note" />
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Save</button>
                      <button type="button" onClick={() => setEditingMaterial(null)} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1"><MaterialLink material={m} /></div>
                    <MoveButtons first={mi === 0} last={mi === section.materials.length - 1} label="material"
                      onMove={(d) => run(() => courseApi.moveMaterial(m.publicId, d))} />
                    <button type="button" onClick={() => setEditingMaterial({ id: m.publicId, title: m.title, note: m.note ?? "" })} className="text-sm text-blue-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => run(() => courseApi.removeMaterial(m.publicId), `Removed “${m.title}”`)} className="text-sm text-red-600 hover:underline">Remove</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="px-4 pb-4 pt-1">
            {addingTo === section.publicId ? (
              <div className="space-y-2">
                <AddMaterial section={section} onError={(msg) => { setError(msg); setNotice(null); }}
                  onDone={(c) => { setCourse(c); setAddingTo(null); setError(null); setNotice("Material added"); }} />
                <button type="button" onClick={() => setAddingTo(null)} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingTo(section.publicId)} className="text-sm font-medium text-blue-600 hover:underline">+ Add material</button>
            )}
          </div>
        </section>
      ))}

      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault();
        if (newSection.trim()) run(() => courseApi.addSection(course.publicId, newSection.trim())).then(() => setNewSection("")); }}>
        <input value={newSection} onChange={(e) => setNewSection(e.target.value)} maxLength={200}
          placeholder={course.sections.length === 0 ? "First section, e.g. Week 1: Getting started" : "New section title"}
          className="min-w-[16rem] flex-1 rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" disabled={!newSection.trim()}
          className="rounded-lg border border-gray-200 bg-surface px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50">Add section</button>
      </form>
    </div>
  );
}
