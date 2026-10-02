"use client";

import { useWidth } from "./useWidth";

// Percentage bars with a full-height track behind each (0–100), one per point.
// A null value means nothing was held that day: track only, no bar.
// Colours come from palette classes, so the chart follows light/dark.
export interface Point { label: string; value: number | null; title?: string }

export default function BarChart({ points, height = 180 }: { points: Point[]; height?: number }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const H = height, top = 8, bottom = 22, left = 30;
  const plotH = H - top - bottom;
  const step = (W - left) / Math.max(points.length, 1);
  const barW = Math.max(3, Math.min(16, step * 0.55));
  const y = (v: number) => top + plotH * (1 - v / 100);
  const labelEvery = Math.ceil(points.length / Math.max(2, Math.floor((W - left) / 56)));

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" role="img" aria-label="Bar chart">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={left} x2={W} y1={y(g)} y2={y(g)} className="stroke-gray-100" strokeDasharray={g === 0 ? undefined : "3 4"} />
          <text x={left - 6} y={y(g) + 3} textAnchor="end" className="fill-gray-400 text-[10px]">{g}%</text>
        </g>
      ))}
      {points.map((p, i) => {
        const cx = left + step * i + step / 2;
        return (
          <g key={i}>
            <title>{p.title ?? `${p.label}: ${p.value == null ? "nothing held" : p.value + "%"}`}</title>
            <rect x={cx - barW / 2} y={top} width={barW} height={plotH} rx={barW / 2} className="fill-gray-100" />
            {p.value != null && p.value > 0 && (
              <rect x={cx - barW / 2} y={y(p.value)} width={barW} height={plotH - (y(p.value) - top)} rx={barW / 2} className="fill-blue-600" />
            )}
            {i % labelEvery === 0 && (
              <text x={cx} y={H - 6} textAnchor="middle" className="fill-gray-400 text-[10px]">{p.label}</text>
            )}
          </g>
        );
      })}
    </svg>
    </div>
  );
}
