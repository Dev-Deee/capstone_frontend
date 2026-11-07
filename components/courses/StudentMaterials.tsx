"use client";

import { useEffect, useState } from "react";
import { courseApi, type Course } from "@/lib/api";
import CollapsibleGroup from "@/components/ui/CollapsibleGroup";
import MaterialLink from "@/components/courses/MaterialLink";

// A student's courses, newest first, each opening into its sections.
export default function StudentMaterials() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string> | null>(null);

  useEffect(() => {
    courseApi.mine().then(setCourses).catch((e) => setError(e instanceof Error ? e.message : "Couldn't load your materials"));
  }, []);

  if (error) return <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!courses) return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading…</div>;
  if (courses.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm">
        <p className="text-sm text-gray-400">No course materials yet. They appear here when your facilitator or institution shares them.</p>
      </section>
    );
  }

  // The newest course starts open.
  const openSet = open ?? new Set([courses[0].publicId]);
  const toggle = (id: string) => {
    const next = new Set(openSet);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOpen(next);
  };

  return (
    <div className="space-y-3">
      {courses.map((c) => (
        <CollapsibleGroup key={c.publicId} title={c.title}
          meta={`${c.subjectName ? c.subjectName + " · " : ""}${c.materialCount} material${c.materialCount === 1 ? "" : "s"}`}
          open={openSet.has(c.publicId)} onToggle={() => toggle(c.publicId)}>
          <div className="space-y-4 px-4 py-4">
            {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
            {c.sections.length === 0 && <p className="text-sm text-gray-400">Nothing in this course yet</p>}
            {c.sections.map((s) => (
              <div key={s.publicId}>
                <h3 className="text-sm font-medium text-gray-900">{s.title}</h3>
                {s.materials.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-400">Nothing here yet</p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {s.materials.map((m) => <li key={m.publicId}><MaterialLink material={m} /></li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CollapsibleGroup>
      ))}
    </div>
  );
}
