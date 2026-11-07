"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { courseApi, type Course } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import ListToolbar from "@/components/ui/ListToolbar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import CourseForm, { type CourseRole } from "@/components/courses/CourseForm";

type Filter = "ALL" | "DRAFT" | "SCHEDULED" | "PUBLISHED";

const STATUS: Record<Exclude<Filter, "ALL">, [string, string]> = {
  DRAFT: ["Draft", "bg-gray-100 text-gray-600"],
  SCHEDULED: ["Scheduled", "bg-blue-100 text-blue-700"],
  PUBLISHED: ["Published", "bg-green-100 text-green-700"],
};

export const courseState = (c: Course): Exclude<Filter, "ALL"> =>
  c.status === "PUBLISHED" ? "PUBLISHED" : c.publishAt ? "SCHEDULED" : "DRAFT";

export const audienceText = (c: Course) =>
  c.allStudents ? "Every student" : c.cohorts.map((x) => x.name).join(", ") || "No cohort";

export function CourseStatusPill({ course }: { course: Course }) {
  const [label, cls] = STATUS[courseState(course)];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

// Every course this person can edit, and "New course".
export default function CourseManager({ role, basePath }: { role: CourseRole; basePath: string }) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    courseApi.manageable().then(setCourses).catch((e) => { setCourses([]); setError(e instanceof Error ? e.message : "Couldn't load courses"); });
  }, []);

  const q = search.trim().toLowerCase();
  const matching = (courses ?? []).filter((c) => !q || [c.title, c.subjectName, audienceText(c)].some((v) => v?.toLowerCase().includes(q)));
  const visible = matching.filter((c) => filter === "ALL" || courseState(c) === filter);
  const count = (f: Exclude<Filter, "ALL">) => matching.filter((c) => courseState(c) === f).length;

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="Courses"
        description="Notes, slides, videos and Google Drive links, organised in sections, for the cohorts you choose." />

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "course" : "courses"}
          segments={[
            { value: "ALL" as Filter, label: "All", count: matching.length },
            { value: "DRAFT" as Filter, label: "Drafts", count: count("DRAFT") },
            { value: "SCHEDULED" as Filter, label: "Scheduled", count: count("SCHEDULED") },
            { value: "PUBLISHED" as Filter, label: "Published", count: count("PUBLISHED") },
          ]}
          segment={filter}
          onSegment={setFilter}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Title, subject or cohort…"
        >
          <button type="button" onClick={() => setCreating((c) => !c)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            {creating ? "Close" : "New course"}
          </button>
        </ListToolbar>

        {creating && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
            <CourseForm role={role} submitLabel="Create course" onCancel={() => setCreating(false)}
              onSubmit={async (input) => {
                const created = await courseApi.create(input);
                router.push(`${basePath}/${created.publicId}`);
              }} />
          </div>
        )}

        {courses === null ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : courses.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No courses yet. Start with “New course”.</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No courses match.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Course</Th>
                <Th className="hidden md:table-cell">For</Th>
                <Th className="hidden sm:table-cell" align="right">Materials</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <Tr key={c.publicId} onOpen={() => router.push(`${basePath}/${c.publicId}`)}>
                  <Td className="max-w-[22rem]">
                    <p className="truncate font-medium text-gray-900">{c.title}</p>
                    <p className="truncate text-xs text-gray-400">{c.subjectName ?? "No subject"} · by {c.createdByName}</p>
                  </Td>
                  <Td className="hidden md:table-cell max-w-[16rem] truncate text-gray-600">{audienceText(c)}</Td>
                  <Td className="hidden sm:table-cell text-gray-600" align="right">{c.materialCount}</Td>
                  <Td><CourseStatusPill course={c} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
