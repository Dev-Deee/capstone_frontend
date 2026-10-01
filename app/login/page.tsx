"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// What Cadence does, stated plainly — no invented metrics on the sign-in page.
const PILLARS = [
  { title: "Attendance in seconds", body: "Rotating codes and QR check-in for every class and daily resumption." },
  { title: "Every submission visible", body: "Assignments, deadlines and extensions tracked from draft to grade." },
  { title: "Records you can stand behind", body: "Overrides and account changes are audited, end to end." },
];

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 " +
    "shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors " +
    "focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-white">
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <aside className="relative overflow-hidden bg-[#0c1f4a] text-white px-6 py-8 sm:px-10 lg:px-14 lg:py-12 flex flex-col">
        {/* Depth: soft light, fine grid, concentric rings */}
        <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-blue-500/30 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 30% 40%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 30% 40%, black 30%, transparent 75%)",
          }}
        />
        <svg className="pointer-events-none absolute -bottom-48 -right-48 h-[640px] w-[640px] text-white/[0.06] hidden lg:block" viewBox="0 0 640 640" fill="none" aria-hidden="true">
          {[300, 240, 180, 120].map((r) => (
            <circle key={r} cx="320" cy="320" r={r} stroke="currentColor" strokeWidth="1" />
          ))}
        </svg>

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
            {/* Wordmark glyph: a steady beat */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 12h4l2-5 4 10 2-5h6" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">Cadence</span>
        </div>

        <div className="relative mt-10 lg:mt-auto lg:mb-auto max-w-lg rise-in">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-blue-200/80">
            Academic Operations Platform
          </p>
          <h2 className="mt-4 font-display text-[40px] leading-[1.05] sm:text-5xl lg:text-[64px] text-white">
            Every class,
            <br />
            <span className="italic text-blue-300">accounted for.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-blue-50/70 max-w-md hidden sm:block">
            Attendance, assignments and cohorts in one place — for the students, facilitators and
            administrators who keep a programme moving.
          </p>

          <ul className="mt-10 space-y-5 hidden lg:block">
            {PILLARS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">{p.title}</p>
                  <p className="text-sm text-blue-50/60">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-8 text-xs text-blue-50/40 hidden lg:block">
          © {new Date().getFullYear()} Cadence
        </p>
      </aside>

      {/* ── Sign-in ─────────────────────────────────────────────────── */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px] rise-in" style={{ animationDelay: "80ms" }}>
          <h1 className="font-display text-[40px] leading-none text-gray-900">Welcome back</h1>
          <p className="mt-3 text-[15px] text-gray-500">Sign in to your Cadence workspace.</p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5" noValidate={false}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email or phone number
              </label>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                autoFocus
                placeholder="name@school.edu"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30 disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Spinner /> Signing in…</>
              ) : (
                <>Sign in <span className="transition-transform group-hover:translate-x-0.5"><ArrowRight /></span></>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />New student<span className="h-px flex-1 bg-gray-200" />
          </div>

          <Link
            href="/register"
            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-[15px] font-medium text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            Register with your invite code
          </Link>

          <p className="mt-10 text-center text-xs text-gray-400">
            Staff accounts are created by invitation from your institution.
          </p>
        </div>
      </main>
    </div>
  );
}
