"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminAttendanceApi, cohortApi, resumptionApi, userApi } from "@/lib/api";
import PageHeader, { greeting } from "@/components/PageHeader";

type Variant = "SUPER_ADMIN" | "ADMIN";

type Overview = { cohortPublicId: string; cohortName: string; studentCount: number; averageRatePercent: number };

// Each figure loads independently: an admin without, say, MANAGE_USERS still
// gets the rest of the page, and that tile simply shows "—".
type Data = {
  firstName?: string;
  users?: { roles: string[]; active: boolean }[];
  cohorts?: { publicId: string; name: string }[];
  overview?: Overview[];
  today?: { publicId: string; cohortPublicId: string; isOpen: boolean }[];
};

const QUICK_ACTIONS: Record<Variant, { href: string; label: string; hint: string }[]> = {
  SUPER_ADMIN: [
    { href: "/dashboard/super-admin/invites?tab=students", label: "Invite students", hint: "Generate and send cohort codes" },
    { href: "/dashboard/super-admin/invites?tab=staff", label: "Invite staff", hint: "Facilitators and admins" },
    { href: "/dashboard/super-admin/cohorts", label: "Cohorts & subjects", hint: "Structure your programme" },
    { href: "/dashboard/super-admin/users", label: "Users & roles", hint: "Accounts and permissions" },
  ],
  ADMIN: [
    { href: "/dashboard/admin/people?tab=invites", label: "Invite students", hint: "Generate and send cohort codes" },
    { href: "/dashboard/admin/people?tab=users", label: "Manage users", hint: "Edit, activate, move cohorts" },
    { href: "/dashboard/admin/people?tab=facilitators", label: "Assign facilitators", hint: "Who teaches what" },
    { href: "/dashboard/admin/attendance?tab=today", label: "Today's resumption", hint: "Codes and check-ins" },
  ],
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-3 font-display text-[40px] leading-none text-gray-900">{value}</p>
      {sub && <p className="mt-2 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function rateTone(rate: number) {
  return rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-amber-500" : "bg-red-500";
}

export default function AdminHome({ variant }: { variant: Variant }) {
  const [data, setData] = useState<Data>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settle = <T,>(p: Promise<T>) => p.then((v) => v).catch(() => undefined);
    Promise.all([
      settle(userApi.getMe()),
      settle(userApi.getAll()),
      settle(cohortApi.getAll()),
      settle(adminAttendanceApi.getAllCohorts()),
      settle(resumptionApi.getToday()),
    ]).then(([me, users, cohorts, overview, today]) => {
      setData({ firstName: me?.firstName, users, cohorts, overview, today });
      setLoading(false);
    });
  }, []);

  const count = (role: string) => data.users?.filter((u) => u.roles.includes(role)).length;
  const deactivated = data.users?.filter((u) => !u.active).length ?? 0;
  const students = data.overview?.reduce((n, c) => n + c.studentCount, 0);
  // Student-weighted, so a cohort of 2 doesn't count as much as a cohort of 40.
  const avgRate = data.overview && students
    ? Math.round(data.overview.reduce((n, c) => n + c.averageRatePercent * c.studentCount, 0) / students)
    : undefined;
  const needsAttention = (data.overview ?? [])
    .filter((c) => c.studentCount > 0)
    .sort((a, b) => a.averageRatePercent - b.averageRatePercent)
    .slice(0, 4);
  const cohortName = (id: string) => data.cohorts?.find((c) => c.publicId === id)?.name ?? "Cohort";
  const fmt = (n: number | undefined) => (loading ? "…" : n === undefined ? "—" : n.toLocaleString());
  const attendanceHref = "/dashboard/admin/attendance";

  return (
    <div className="p-6">
      <PageHeader
        eyebrow={variant === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
        title={`${greeting()}${data.firstName ? `, ${data.firstName}` : ""}.`}
        description="Here's how your institution is doing today."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" value={fmt(students ?? count("STUDENT"))} sub="Actively enrolled" />
        <Stat label="Facilitators" value={fmt(count("FACILITATOR"))} sub={deactivated ? `${deactivated} account${deactivated === 1 ? "" : "s"} deactivated` : undefined} />
        <Stat label="Cohorts" value={fmt(data.cohorts?.length)} />
        <Stat label="Avg. attendance" value={loading ? "…" : avgRate === undefined ? "—" : `${avgRate}%`} sub="Daily resumption, all cohorts" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Today */}
        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Today's resumption</h2>
            <Link href={`${attendanceHref}?tab=today`} className="text-xs text-blue-600 hover:underline">Open</Link>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : !data.today ? (
            <p className="mt-4 text-sm text-gray-400">Not available for your role.</p>
          ) : data.today.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No resumption sessions have been opened today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {data.today.map((s) => (
                <li key={s.publicId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-800">{cohortName(s.cohortPublicId)}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.isOpen ? "text-green-700" : "text-gray-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.isOpen ? "bg-green-500" : "bg-gray-300"}`} />
                    {s.isOpen ? "Open now" : "Closed"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Needs attention */}
        <section className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Lowest attendance</h2>
            <Link href={`${attendanceHref}?tab=overview`} className="text-xs text-blue-600 hover:underline">All cohorts</Link>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : needsAttention.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No attendance recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {needsAttention.map((c) => (
                <li key={c.cohortPublicId}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-gray-800">{c.cohortName}</span>
                    <span className="tabular-nums text-gray-500">
                      {c.averageRatePercent}% <span className="text-gray-400">· {c.studentCount} student{c.studentCount === 1 ? "" : "s"}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                    <div className={`h-1.5 rounded-full ${rateTone(c.averageRatePercent)}`} style={{ width: `${Math.max(c.averageRatePercent, 2)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS[variant].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <p className="flex items-center justify-between text-sm font-medium text-gray-900">
                {a.label}
                <span className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600">→</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">{a.hint}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
