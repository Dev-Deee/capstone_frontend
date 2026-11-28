"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reviewApi, type AssignmentOverviewRow } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import ListToolbar from "@/components/ui/ListToolbar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

type Filter = "ALL" | "WAITING" | "OPEN" | "CLOSED" | "DRAFT";

// PUBLISHED and OPEN both mean "students can see and submit".
const isOpen = (s: string) => s === "OPEN" || s === "PUBLISHED";
const inFilter = (a: AssignmentOverviewRow, f: Filter) =>
  f === "ALL" ? true
    : f === "WAITING" ? a.waiting > 0
    : f === "OPEN" ? isOpen(a.status)
    : a.status === f;

const STATUS: Record<string, [string, string]> = {
  SCHEDULED: ["Scheduled", "bg-blue-100 text-blue-700"],
  DRAFT: ["Draft", "bg-gray-100 text-gray-600"],
  OPEN: ["Open", "bg-green-100 text-green-700"],
  PUBLISHED: ["Open", "bg-green-100 text-green-700"],
  CLOSED: ["Closed", "bg-gray-100 text-gray-500"],
};

function StatusPill({ a }: { a: AssignmentOverviewRow }) {
  const key = a.status === "DRAFT" && a.publishAt ? "SCHEDULED" : a.status;
  const [label, cls] = STATUS[key] ?? [key, "bg-gray-100 text-gray-500"];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

// "in 3 days" / "2 days ago" / "today", with the exact date underneath.
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

const reviewHref = (a: AssignmentOverviewRow) => `/dashboard/super-admin/assignments/${a.publicId}/review`;

// Every assignment in the institution, whoever set it, with the work waiting
// on each — a super admin's way into reviewing and grading. Drafts are listed
// but have nothing to review until they're published.
export default function SuperAdminAssignmentsPage() {
  const router = useRouter();
  const [list, setList] = useState<AssignmentOverviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [cohort, setCohort] = useState("");

  useEffect(() => {
    reviewApi.overview()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load assignments"));
  }, []);

  const rows = list ?? [];
  const cohorts = Array.from(new Map(rows.map((a) => [a.cohortPublicId, a.cohortName])))
    .sort((x, y) => x[1].localeCompare(y[1]));
  const q = search.trim().toLowerCase();
  const matching = rows.filter((a) =>
    (!cohort || a.cohortPublicId === cohort)
    && (!q || [a.title, a.cohortName, a.subjectName, a.facilitatorName].some((v) => v?.toLowerCase().includes(q))));
  const visible = matching.filter((a) => inFilter(a, filter));
  const totalWaiting = rows.reduce((n, a) => n + a.waiting, 0);
  const count = (f: Filter) => matching.filter((a) => inFilter(a, f)).length;

  return (
    <div className="p-6 space-y-5">
      <PageHeader eyebrow="Super admin" title="Assignments"
        description={list == null ? "Every assignment in your institution, and the work waiting for review on each."
          : totalWaiting === 0 ? "Every assignment in your institution. Nothing is waiting for review right now."
          : `Every assignment in your institution. ${totalWaiting} piece${totalWaiting === 1 ? "" : "s"} of work waiting for review.`} />

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "assignment" : "assignments"}
          segments={[
            { value: "ALL" as Filter, label: "All", count: matching.length },
            { value: "WAITING" as Filter, label: "Needs review", count: count("WAITING") },
            { value: "OPEN" as Filter, label: "Open", count: count("OPEN") },
            { value: "CLOSED" as Filter, label: "Closed", count: count("CLOSED") },
            { value: "DRAFT" as Filter, label: "Drafts", count: count("DRAFT") },
          ]}
          segment={filter}
          onSegment={setFilter}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Title, subject or facilitator…"
        >
          {cohorts.length > 1 && (
            <label>
              <span className="sr-only">Cohort</span>
              <select value={cohort} onChange={(e) => setCohort(e.target.value)}
                className="rounded-lg border border-gray-200 bg-surface px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All cohorts</option>
                {cohorts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
          )}
        </ListToolbar>

        {visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">
            {list == null ? (error ? "" : "Loading…") : rows.length === 0 ? "No assignments yet. Facilitators' assignments show up here." : "No assignments match."}
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assignment</Th>
                <Th className="hidden lg:table-cell">Subject</Th>
                <Th className="hidden md:table-cell">Facilitator</Th>
                <Th className="hidden sm:table-cell">Due</Th>
                <Th align="right">Waiting</Th>
                <Th className="hidden xl:table-cell">Grades</Th>
                <Th align="right"><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const reviewable = a.status !== "DRAFT";
                return (
                  <Tr key={a.publicId} muted={a.status === "CLOSED" && a.waiting === 0}
                    onOpen={reviewable ? () => router.push(reviewHref(a)) : undefined}>
                    <Td className="max-w-[20rem]">
                      <p className="truncate font-medium text-gray-900">{a.title}</p>
                      <div className="mt-0.5 flex min-w-0 items-center gap-2">
                        <StatusPill a={a} />
                        <span className="truncate text-xs text-gray-400">{a.cohortName}</span>
                      </div>
                    </Td>
                    <Td className="hidden lg:table-cell whitespace-nowrap text-gray-600">{a.subjectName}</Td>
                    <Td className="hidden md:table-cell whitespace-nowrap text-gray-600">{a.facilitatorName}</Td>
                    <Td className="hidden sm:table-cell"><Due deadline={a.deadline} closed={a.status === "CLOSED"} /></Td>
                    <Td align="right">
                      {a.waiting > 0
                        ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{a.waiting}</span>
                        : <span className="text-gray-300">0</span>}
                    </Td>
                    <Td className="hidden xl:table-cell whitespace-nowrap">
                      {a.gradesReleasedAt
                        ? <span className="text-xs text-green-700">Released {new Date(a.gradesReleasedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                        : <span className="text-xs text-gray-400">Not released</span>}
                    </Td>
                    <Td align="right">
                      {reviewable ? (
                        <Link href={reviewHref(a)} onClick={(e) => e.stopPropagation()}
                          className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
                          Review
                        </Link>
                      ) : <span className="text-xs text-gray-400">Not published</span>}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
