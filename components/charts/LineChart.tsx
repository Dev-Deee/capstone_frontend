"use client";

import { useWidth } from "./useWidth";
import type { Point } from "./BarChart";

// A smoothed percentage line (0–100) with a soft fill. Gaps (null) break the
// line rather than pretending a day with no classes was 0%.
export default function LineChart({ points, height = 180 }: { points: Point[]; height?: number }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const H = height, top = 10, bottom = 22, left = 30;
  const plotH = H - top - bottom;
  const step = (W - left) / Math.max(points.length - 1, 1);
  const x = (i: number) => left + step * i;
  const y = (v: number) => top + plotH * (1 - v / 100);
  const labelEvery = Math.ceil(points.length / Math.max(2, Math.floor((W - left) / 56)));

  // Contiguous runs of non-null points, each drawn as its own smooth path.
  const runs: { i: number; v: number }[][] = [];
  points.forEach((p, i) => {
    if (p.value == null) return;
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1].i === i - 1) last.push({ i, v: p.value });
    else runs.push([{ i, v: p.value }]);
  });
  const path = (run: { i: number; v: number }[]) =>
    run.map((p, k) => {
      if (k === 0) return `M${x(p.i)},${y(p.v)}`;
      const prev = run[k - 1];
      const mx = (x(prev.i) + x(p.i)) / 2;
      return `C${mx},${y(prev.v)} ${mx},${y(p.v)} ${x(p.i)},${y(p.v)}`;
    }).join(" ");

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" role="img" aria-label="Line chart">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={left} x2={W} y1={y(g)} y2={y(g)} className="stroke-gray-100" strokeDasharray={g === 0 ? undefined : "3 4"} />
          <text x={left - 6} y={y(g) + 3} textAnchor="end" className="fill-gray-400 text-[10px]">{g}%</text>
        </g>
      ))}
      {runs.map((run, k) => (
        <g key={k}>
          {run.length > 1 && (
            <path d={`${path(run)} L${x(run[run.length - 1].i)},${y(0)} L${x(run[0].i)},${y(0)} Z`} className="fill-blue-500/10" />
          )}
          <path d={path(run)} fill="none" strokeWidth={2.5} strokeLinecap="round" className="stroke-blue-500" />
          {run.map((p) => (
            <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={run.length === 1 ? 4 : 2.5} className="fill-blue-500">
              <title>{`${points[p.i].label}: ${p.v}%`}</title>
            </circle>
          ))}
        </g>
      ))}
      {points.map((p, i) => i % labelEvery === 0 && (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-gray-400 text-[10px]">{p.label}</text>
      ))}
    </svg>
    </div>
  );
}
