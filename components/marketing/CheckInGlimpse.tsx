"use client";

import { useEffect, useState } from "react";

// Mirrors the real check-in code: a 6-digit TOTP that rotates every 30 s
// (TotpService: "%06d", PERIOD_SECONDS = 30).
const PERIOD = 30;

function randomCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

// A quiet, illustrative product glimpse (not a screenshot, no invented data):
// the rotating check-in code a facilitator puts on screen, and a week of
// check-ins filling in. Holds still for reduced-motion users.
export default function CheckInGlimpse() {
  const [code, setCode] = useState("482913");
  const [left, setLeft] = useState(PERIOD);
  const [still, setStill] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStill(false);
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { setCode(randomCode()); return PERIOD; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const week = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const filled = [5, 5, 4, 5, 3]; // illustrative pattern only

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-blue-100/70 via-white to-white blur-2xl" />
      <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_48px_-24px_rgba(16,24,40,0.18)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Daily check-in</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
            <span className={`h-1.5 w-1.5 rounded-full bg-green-500 ${still ? "" : "animate-pulse"}`} /> Open now
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <p key={code} className="whitespace-nowrap font-mono text-[30px] font-semibold leading-none tracking-[0.14em] text-gray-900 rise-in sm:text-[40px] sm:tracking-[0.18em]">
            {code.slice(0, 3)}<span className="text-gray-300"> </span>{code.slice(3)}
          </p>
          <div className="relative h-12 w-12 shrink-0" aria-label={`New code in ${left} seconds`}>
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eef2ff" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(left / PERIOD) * 97.4} 97.4`} className="transition-[stroke-dasharray] duration-1000 ease-linear" />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[11px] font-medium tabular-nums text-gray-500">{left}s</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">Students scan the QR, then enter this code on their phone. It changes every 30 seconds.</p>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="mb-3 text-xs font-medium text-gray-500">This week</p>
          <div className="grid grid-cols-5 gap-3">
            {week.map((d, i) => (
              <div key={d}>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span
                      key={j}
                      className={`h-2 rounded-full ${j < filled[i] ? "bg-blue-500/80" : "bg-gray-100"} ${still ? "" : "rise-in"}`}
                      style={still ? undefined : { animationDelay: `${300 + i * 90 + j * 40}ms` }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] text-gray-400">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
