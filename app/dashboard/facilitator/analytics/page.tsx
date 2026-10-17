"use client";

import { useEffect, useState } from "react";
import { cohortApi, facilitatorAnalyticsApi, facilitatorCohortApi, type FacilitatorCohortAnalytics } from "@/lib/api";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import Donut from "@/components/charts/Donut";
import { card, dayLabel, icon, Legend, pct, rateTone, Stat } from "@/components/analytics/parts";
import Avatar from "@/components/ui/Avatar";
import ListToolbar from "@/components/ui/ListToolbar";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

const RANGES = [7, 30, 90];
type StudentFilter = "ATTENTION" | "ALL";

const fmtDue = (d: string) =>
  new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function RateChip({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-300">—</span>;
  return <span className={`inline-block min-w-[3rem] rounded-full px-2 py-0.5 text-center text-xs font-medium ${rateTone(v)}`}>{v}%</span>;
}

// One assignment's hand-ins as a stacked bar.
function WorkBar({ a }: { a: FacilitatorCohortAnalytics["assignments"][number] }) {
  const parts = [
    { n: a.onTime, cls: "bg-blue-600", label: "On time" },
    { n: a.reviewed, cls: "bg-green-500", label: "Reviewed" },
    { n: a.late, cls: "bg-amber-400", label: "Late" },
    { n: a.missing, cls: "bg-red-400", label: "Missing" },
    { n: a.notYet, cls: "bg-gray-200", label: "Not yet" },
  ];
  const total = Math.max(1, a.total);
  return (
    <div className="w-40">
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-100" role="img"
        aria-label={parts.map((p) => `${p.label} ${p.n}`).join(", ")}>
        {parts.map((p) => p.n > 0 && <div key={p.label} className={p.cls} style={{ width: `${(p.n / total) * 100}%` }} title={`${p.label}: ${p.n}`} />)}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        {a.onTime + a.reviewed + a.late}/{a.total} in{a.missing ? ` · ${a.missing} missing` : ""}
      </p>
    </div>
  );
}

// A facilitator's analytics, one cohort at a time: campus resumption, their
// own classes' attendance, their assignments, and who needs attention.
export default function FacilitatorAnalyticsPage() {
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([]);
  const [cohortId, setCohortId] = useState("");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<FacilitatorCohortAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("ATTENTION");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([facilitatorCohortApi.getMine(), cohortApi.getAll()])
      .then(([mine, all]) => {
        const names = Object.fromEntries(all.map((c: any) => [c.publicId, c.name]));
        const ids = Array.from(new Set(mine.map((m: any) => m.cohortPublicId as string)));
        const list = ids.map((id) => ({ id, name: names[id] ?? "Cohort" }));
        setCohorts(list);
        if (list.length > 0) setCohortId(list[0].id); else setLoading(false);
      })
      .catch((err) => { setError(err instanceof Error ? err.message : "Couldn't load your cohorts"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!cohortId) return;
    setLoading(true);
    setError(null);
    facilitatorAnalyticsApi.get(cohortId, days)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load analytics"))
      .finally(() => setLoading(false));
  }, [cohortId, days]);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Resumption, your classes and your assignments, per cohort.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {cohorts.length > 0 && (
          <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} aria-label="Cohort"
            className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <div className="inline-flex rounded-lg border border-gray-200 bg-surface p-0.5" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button key={r} type="button" onClick={() => setDays(r)} aria-pressed={days === r}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === r ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900"}`}>
              {r} days
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!loading && cohorts.length === 0 && !error) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <div className={card}><p className="text-sm text-gray-500">You aren&apos;t assigned to a cohort yet — an admin sets that up.</p></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <div className={card}><p className="text-sm text-gray-500">{error}</p></div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${card} h-32 animate-pulse`} />)}
        </div>
      </div>
    );
  }

  const att = data.attendance;
  const t = att.today;
  const todayAbsent = Math.max(0, t.expected - t.present - t.late - t.pendingBiometric);
  const todayRate = t.expected === 0 ? null : Math.round(((t.present + t.late) / t.expected) * 100);
  const w = data.assignments.reduce((acc, a) => ({
    onTime: acc.onTime + a.onTime, late: acc.late + a.late, reviewed: acc.reviewed + a.reviewed,
    missing: acc.missing + a.missing, notYet: acc.notYet + a.notYet,
  }), { onTime: 0, late: 0, reviewed: 0, missing: 0, notYet: 0 });
  const due = w.onTime + w.late + w.reviewed + w.missing; // work whose outcome is known
  const handInRate = due === 0 ? null : Math.round(((w.onTime + w.late + w.reviewed) / due) * 100);

  const needsAttention = (s: FacilitatorCohortAnalytics["students"][number]) =>
    s.missing > 0 || (s.resumptionRatePercent ?? 100) < 70 || (s.classRatePercent ?? 100) < 70;
  const q = search.trim().toLowerCase();
  const matching = data.students.filter((s) => !q || s.name.toLowerCase().includes(q));
  const students = matching.filter((s) => studentFilter === "ALL" || needsAttention(s));

  return (
    <div className={`p-6 space-y-5 ${loading ? "opacity-60 transition-opacity" : "transition-opacity"}`}>
      {header}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
          <Stat label="Students" value={String(att.studentCount)} hint={data.cohortName}
            icon={icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /></>)} />
          <Stat label="Campus attendance" value={pct(att.resumptionRatePercent)} hint={`Resumption, last ${days} days`}
            icon={icon(<><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>)} />
          <Stat label="Your classes" value={pct(att.classRatePercent)} hint={`Class attendance, last ${days} days`}
            icon={icon(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>)} />
          <Stat label="Work handed in" value={pct(handInRate)} hint={`Of ${due} due hand-in${due === 1 ? "" : "s"}`}
            icon={icon(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 15l2 2 4-4" /></>)} />
        </div>

        <div className={card}>
          <p className="text-sm text-gray-500">Today&apos;s resumption</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {t.present + t.late}<span className="text-lg font-normal text-gray-400"> / {t.expected}</span>
          </p>
          <div className="mt-3 flex items-center gap-4">
            <Donut size={96} segments={[
              { label: "Present", value: t.present, className: "stroke-blue-600" },
              { label: "Late", value: t.late, className: "stroke-amber-400" },
              { label: "Awaiting biometric", value: t.pendingBiometric, className: "stroke-orange-500" },
              { label: "Not checked in", value: todayAbsent, className: "stroke-gray-200" },
            ]}>
              <span className="text-sm font-semibold text-gray-900">{pct(todayRate)}</span>
            </Donut>
            <Legend items={[
              { label: "Present", value: t.present, dot: "bg-blue-600" },
              { label: "Late", value: t.late, dot: "bg-amber-400" },
              { label: "Awaiting", value: t.pendingBiometric, dot: "bg-orange-500" },
              { label: "Not yet", value: todayAbsent, dot: "bg-gray-200" },
            ]} />
          </div>
          {t.expected === 0 && <p className="mt-2 text-xs text-gray-400">No resumption held today.</p>}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Assignment hand-ins</p>
            {data.pendingExtensions > 0 && (
              <a href="/dashboard/facilitator/classes?tab=assignments" className="text-xs font-medium text-amber-700 hover:underline">
                {data.pendingExtensions} extension{data.pendingExtensions === 1 ? "" : "s"} to review
              </a>
            )}
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{data.assignments.length}
            <span className="text-lg font-normal text-gray-400"> published</span></p>
          <div className="mt-3 flex items-center gap-4">
            <Donut size={96} segments={[
              { label: "On time", value: w.onTime, className: "stroke-blue-600" },
              { label: "Reviewed", value: w.reviewed, className: "stroke-green-500" },
              { label: "Late", value: w.late, className: "stroke-amber-400" },
              { label: "Missing", value: w.missing, className: "stroke-red-400" },
              { label: "Not yet", value: w.notYet, className: "stroke-gray-200" },
            ]} />
            <Legend items={[
              { label: "On time", value: w.onTime, dot: "bg-blue-600" },
              { label: "Reviewed", value: w.reviewed, dot: "bg-green-500" },
              { label: "Late", value: w.late, dot: "bg-amber-400" },
              { label: "Missing", value: w.missing, dot: "bg-red-400" },
              { label: "Not yet", value: w.notYet, dot: "bg-gray-200" },
            ]} />
          </div>
        </div>

        <div className={`${card} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Campus resumption</h2>
            <span className="text-xs text-gray-400">Daily, % of expected</span>
          </div>
          <div className="mt-4"><BarChart points={att.trend.map((p) => ({ label: dayLabel(p.date, days), value: p.resumptionRatePercent }))} /></div>
        </div>

        <div className={`${card} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Your classes</h2>
            <span className="text-xs text-gray-400">Daily, % of expected</span>
          </div>
          <div className="mt-4"><LineChart points={att.trend.map((p) => ({ label: dayLabel(p.date, days), value: p.classRatePercent }))} /></div>
        </div>
      </div>

      {/* Assignments */}
      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Assignments</h2>
          <span className="text-xs text-gray-400">Your published work in {data.cohortName}</span>
        </div>
        {data.assignments.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">Nothing published in this cohort yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assignment</Th>
                <Th className="hidden md:table-cell">Due</Th>
                <Th>Hand-ins</Th>
                <Th align="right">Handed in</Th>
              </tr>
            </thead>
            <tbody>
              {data.assignments.map((a) => {
                const known = a.onTime + a.late + a.reviewed + a.missing;
                const rate = known === 0 ? null : Math.round(((a.onTime + a.late + a.reviewed) / known) * 100);
                return (
                  <Tr key={a.publicId} muted={a.status === "CLOSED"}>
                    <Td>
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.subjectName}{a.status === "CLOSED" ? " · closed" : ""}</p>
                    </Td>
                    <Td className="hidden md:table-cell whitespace-nowrap text-gray-600">{fmtDue(a.deadline)}</Td>
                    <Td><WorkBar a={a} /></Td>
                    <Td align="right"><RateChip v={rate} /></Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>

      {/* Students */}
      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={students.length}
          noun={students.length === 1 ? "student" : "students"}
          segments={[
            { value: "ATTENTION" as StudentFilter, label: "Needs attention", count: matching.filter(needsAttention).length },
            { value: "ALL" as StudentFilter, label: "All", count: matching.length },
          ]}
          segment={studentFilter}
          onSegment={setStudentFilter}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Student name…"
        />
        <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-400">
          Needs attention: missed work, or under 70% at resumption or your classes, over the last {days} days.
        </p>
        {students.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">{studentFilter === "ATTENTION" ? "No one needs attention right now." : "No students match."}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th align="right">Resumption</Th>
                <Th align="right">Your classes</Th>
                <Th className="hidden sm:table-cell" align="right">Handed in</Th>
                <Th align="right">Missing</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <Tr key={s.publicId}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size={32} />
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </Td>
                  <Td align="right"><RateChip v={s.resumptionRatePercent} /></Td>
                  <Td align="right"><RateChip v={s.classRatePercent} /></Td>
                  <Td className="hidden sm:table-cell text-gray-600" align="right">
                    {s.handedIn}{s.late ? <span className="text-xs text-amber-700"> ({s.late} late)</span> : null}
                  </Td>
                  <Td align="right">
                    {s.missing > 0 ? <span className="font-medium text-red-600">{s.missing}</span> : <span className="text-gray-300">0</span>}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
