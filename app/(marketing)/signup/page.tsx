"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { institutionApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { slugify } from "@/components/marketing/StartForm";

type SlugState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "bad"; reason: string; suggestion: string | null };

const input =
  "w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-surface text-[15px] text-gray-900 placeholder:text-gray-400 " +
  "transition-colors focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";

export default function SignupPage() {
  const { enterSession } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>({ kind: "idle" });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const checkSeq = useRef(0);

  // Prefill from the landing page's "name your institution" form.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const n = p.get("name");
    const s = p.get("slug");
    if (n) setName(n);
    if (s) setSlug(s);
    else if (n) setSlug(slugify(n));
  }, []);

  // The address follows the name until the founder edits it themselves.
  // (Done in the handler, not an effect, so it can't overwrite a prefilled address.)
  function onNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  // Live availability, debounced; stale responses are ignored.
  useEffect(() => {
    if (!slug) { setSlugState({ kind: "idle" }); return; }
    setSlugState({ kind: "checking" });
    const seq = ++checkSeq.current;
    const t = setTimeout(async () => {
      try {
        const r = await institutionApi.slugAvailability(slug);
        if (seq !== checkSeq.current) return;
        setSlugState(r.available ? { kind: "ok" } : { kind: "bad", reason: r.reason ?? "Not available", suggestion: r.suggestion });
      } catch {
        if (seq === checkSeq.current) setSlugState({ kind: "idle" });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      enterSession(await institutionApi.signup({
        institutionName: name.trim(), slug, firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim(), phoneNumber: phoneNumber.trim(), password, consentGiven: consent,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
      setSubmitting(false);
    }
  }

  const slugHint =
    slugState.kind === "checking" ? <span className="text-gray-400">Checking…</span>
    : slugState.kind === "ok" ? <span className="text-green-700">✓ Available</span>
    : slugState.kind === "bad" ? (
      <span className="text-red-700">
        {slugState.reason}
        {slugState.suggestion && (
          <>
            {" — "}
            <button type="button" onClick={() => { setSlug(slugState.suggestion!); setSlugEdited(true); }}
              className="font-medium underline underline-offset-2 hover:text-red-900">
              use {slugState.suggestion}
            </button>
          </>
        )}
      </span>
    ) : <span className="text-gray-400">Lowercase letters, numbers and hyphens. This can&rsquo;t be changed later.</span>;

  return (
    <main className="mx-auto max-w-xl px-6 pb-24 pt-12 sm:pt-16">
      <div className="rise-in">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-blue-600">Create your institution</p>
        <h1 className="mt-4 font-display text-[44px] leading-[1.05] text-gray-900">Let&rsquo;s set you up.</h1>
        <p className="mt-3 text-[15px] text-gray-500">
          You&rsquo;ll be the owner of this institution and can invite your team as soon as you&rsquo;re in.
        </p>
      </div>

      <form onSubmit={submit} className="mt-10 space-y-10 rise-in" style={{ animationDelay: "80ms" }}>
        <fieldset className="space-y-4">
          <legend className="mb-4 text-sm font-semibold text-gray-900">Your institution</legend>
          <div>
            <label htmlFor="inst-name" className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
            <input id="inst-name" required value={name} onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Lagos Tech Academy" className={input} />
          </div>
          <div>
            <label htmlFor="inst-slug" className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-300 transition-colors focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/15">
              <span className="flex items-center bg-gray-50 px-3 text-[15px] text-gray-500 border-r border-gray-200">cadence /</span>
              <input id="inst-slug" required value={slug}
                onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugEdited(true); }}
                className="h-11 flex-1 bg-surface px-3 font-mono text-[15px] text-gray-900 focus:outline-none" />
            </div>
            <p className="mt-1.5 text-sm" aria-live="polite">{slugHint}</p>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-4 text-sm font-semibold text-gray-900">About you</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first" className="mb-1.5 block text-sm font-medium text-gray-700">First name</label>
              <input id="first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} autoComplete="given-name" />
            </div>
            <div>
              <label htmlFor="last" className="mb-1.5 block text-sm font-medium text-gray-700">Last name</label>
              <input id="last" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} autoComplete="family-name" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Work email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">Phone number</label>
            <input id="phone" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={input} autoComplete="tel" placeholder="+234…" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? "text" : "password"} required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} pr-16`}
                autoComplete="new-password" placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm text-gray-600">
            <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
            <span>I consent to Cadence collecting and processing my data to create and run this account.</span>
          </label>
        </fieldset>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</div>
        )}

        <div className="space-y-4">
          <button type="submit" disabled={submitting || slugState.kind === "bad"}
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30">
            {submitting ? "Creating your institution…" : <>Create institution <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span></>}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link href="/login" className="font-medium text-blue-600 hover:underline underline-offset-4">Sign in</Link>
            {" "}— you can create another institution from inside Cadence.
          </p>
        </div>
      </form>
    </main>
  );
}
