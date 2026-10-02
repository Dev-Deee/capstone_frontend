"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminAttendanceApi, analyticsApi, type InstitutionAnalytics } from "@/lib/api";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import Donut from "@/components/charts/Donut";

type Cohort = { cohortPublicId: string; cohortName: string; studentCount: number; averageRatePercent: number };

const RANGES = [7, 30, 90];

const card = "rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm";

function dayLabel(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  return days <= 7
    ? d.toLocaleDateString(undefined, { weekday: "short" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function pct(v: number | null) {
  return v == null ? "—" : `${v}%`;
}

// Rate chip colour: healthy / watch / concern.
function rateTone(v: number) {
  if (v >= 80) return "bg-green-100 text-green-700";
  if (v >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function Stat({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className={card}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  );
}

function Legend({ items }: { items: { label: string; value: number; dot: string }[] }) {
  return (
    <ul className="space-y-1.5 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-gray-500">
          <span className={`h-2 w-2 rounded-full ${i.dot}`} />
          <span className="flex-1">{i.label}</span>
          <span className="font-medium text-gray-700">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

const icon = (d: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export default function AnalyticsDashboard({ attendanceHref }: { attendanceHref: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<InstitutionAnalytics | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([analyticsApi.get(days), adminAttendanceApi.getAllCohorts()])
      .then(([a, c]) => {
        setData(a);
        setCohorts([...c].sort((x, y) => x.averageRatePercent - y.averageRatePercent));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load analytics"))
      .finally(() => setLoading(false));
  }, [days]);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 md:px-0 pt-6 md:pt-2">
      <div>
        <h1 className="font-display text-3xl text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Attendance across the cohorts you can see.</p>
      </div>
      <div className="inline-flex rounded-lg border border-gray-200 bg-surface p-0.5" role="group" aria-label="Period">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setDays(r)}
            aria-pressed={days === r}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              days === r ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {r} days
          </button>
        ))}
      </div>
    </div>
  );

  if (error) {
    const forbidden = /permission/i.test(error);
    return (
      <div>
        {header}
        <div className={`${card} mt-6 mx-4 md:mx-0`}>
          <p className="text-sm font-medium text-gray-900">{forbidden ? "Analytics isn't part of your role" : "Couldn't load analytics"}</p>
          <p className="mt-1 text-sm text-gray-500">
            {forbidden ? "Ask your institution's super admin for the View institution analytics permission." : error}
          </p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div>
        {header}
        <div className="mt-6 grid gap-4 px-4 md:px-0 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${card} h-32 animate-pulse`} />)}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const t = data.today;
  const todayAbsent = Math.max(0, t.expected - t.present - t.late - t.pendingBiometric);
  const todayRate = t.expected === 0 ? null : Math.round(((t.present + t.late) / t.expected) * 100);
  const s = data.split;
  const splitTotal = s.present + s.late + s.absent + s.pendingBiometric;
  const resumptionPoints = data.trend.map((p) => ({ label: dayLabel(p.date, days), value: p.resumptionRatePercent }));
  const classPoints = data.trend.map((p) => ({ label: dayLabel(p.date, days), value: p.classRatePercent }));

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {header}

      <div className="mt-6 grid gap-4 px-4 md:px-0 md:grid-cols-2 xl:grid-cols-4">
        {/* Headline numbers */}
        <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
          <Stat label="Students" value={String(data.studentCount)} hint="Actively enrolled"
            icon={icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /></>)} />
          <Stat label="Cohorts" value={String(data.cohortCount)} hint="In view"
            icon={icon(<><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>)} />
          <Stat label="Campus attendance" value={pct(data.resumptionRatePercent)} hint={`Resumption, last ${days} days`}
            icon={icon(<><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>)} />
          <Stat label="Class attendance" value={pct(data.classRatePercent)} hint={`Class sessions, last ${days} days`}
            icon={icon(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>)} />
        </div>

        {/* Today */}
        <div className={card}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Today&apos;s check-in</p>
            {t.openSessions > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {t.openSessions} open
              </span>
            )}
          </div>
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
              { label: "Awaiting biometric", value: t.pendingBiometric, dot: "bg-orange-500" },
              { label: "Not yet", value: todayAbsent, dot: "bg-gray-200" },
            ]} />
          </div>
          {t.expected === 0 && <p className="mt-2 text-xs text-gray-400">No resumption held today.</p>}
        </div>

        {/* Period split */}
        <div className={card}>
          <p className="text-sm text-gray-500">Check-in outcomes</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{splitTotal}</p>
          <div className="mt-3 flex items-center gap-4">
            <Donut size={96} segments={[
              { label: "Present", value: s.present, className: "stroke-blue-600" },
              { label: "Late", value: s.late, className: "stroke-amber-400" },
              { label: "Awaiting biometric", value: s.pendingBiometric, className: "stroke-orange-500" },
              { label: "Absent", value: s.absent, className: "stroke-red-400" },
            ]} />
            <Legend items={[
              { label: "Present", value: s.present, dot: "bg-blue-600" },
              { label: "Late", value: s.late, dot: "bg-amber-400" },
              { label: "Awaiting", value: s.pendingBiometric, dot: "bg-orange-500" },
              { label: "Absent", value: s.absent, dot: "bg-red-400" },
            ]} />
          </div>
        </div>

        {/* Campus trend */}
        <div className={`${card} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Campus attendance</h2>
            <span className="text-xs text-gray-400">Daily, % of expected</span>
          </div>
          <div className="mt-4"><BarChart points={resumptionPoints} /></div>
        </div>

        {/* Cohorts — weakest first, so the ones needing attention lead */}
        <div className={`${card} md:col-span-2 xl:row-span-2 flex flex-col`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Cohorts</h2>
            <Link href={attendanceHref} className="text-xs font-medium text-blue-600 hover:underline">Attendance details →</Link>
          </div>
          {cohorts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">No cohorts yet.</p>
          ) : (
            <div className="mt-3 -mx-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="px-2 pb-2 font-medium">Cohort</th>
                    <th className="px-2 pb-2 font-medium text-right">Students</th>
                    <th className="px-2 pb-2 font-medium text-right">Campus attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cohorts.map((c) => (
                    <tr key={c.cohortPublicId}>
                      <td className="px-2 py-2.5 text-gray-800">{c.cohortName}</td>
                      <td className="px-2 py-2.5 text-right text-gray-500">{c.studentCount}</td>
                      <td className="px-2 py-2.5 text-right">
                        <span className={`inline-block min-w-[3.25rem] rounded-full px-2 py-0.5 text-center text-xs font-medium ${rateTone(c.averageRatePercent)}`}>
                          {c.averageRatePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Class trend */}
        <div className={`${card} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Class attendance</h2>
            <span className="text-xs text-gray-400">Daily, % of expected</span>
          </div>
          <div className="mt-4"><LineChart points={classPoints} /></div>
        </div>
      </div>
    </div>
  );
}
