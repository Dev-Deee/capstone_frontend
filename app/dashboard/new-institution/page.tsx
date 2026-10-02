"use client";

import { useEffect, useRef, useState } from "react";
import { institutionApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import { slugify } from "@/components/marketing/StartForm";

// A signed-in user founds an additional institution; their other memberships
// are untouched and the session switches into the new one.
export default function NewInstitutionPage() {
  const { enterSession } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [edited, setEdited] = useState(false);
  const [hint, setHint] = useState<{ ok: boolean; text: string; suggestion?: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  useEffect(() => { if (!edited) setSlug(slugify(name)); }, [name, edited]);
  useEffect(() => {
    if (!slug) { setHint(null); return; }
    const n = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await institutionApi.slugAvailability(slug);
        if (n === seq.current) setHint(r.available ? { ok: true, text: "Available" } : { ok: false, text: r.reason ?? "Not available", suggestion: r.suggestion });
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { enterSession(await institutionApi.found({ name: name.trim(), slug })); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't create the institution"); setBusy(false); }
  }

  return (
    <div className="p-6">
      <PageHeader title="Create another institution"
        description="You'll be its owner. Your place in your other institutions doesn't change, and you can switch between them any time." />
      <form onSubmit={submit} className="max-w-lg space-y-5 rounded-xl border border-gray-200 bg-surface p-6 shadow-sm">
        <div>
          <label htmlFor="n" className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
          <input id="n" required value={name} onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 px-3.5 text-[15px] focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15" />
        </div>
        <div>
          <label htmlFor="s" className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
          <div className="flex overflow-hidden rounded-lg border border-gray-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/15">
            <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-[15px] text-gray-500">cadence /</span>
            <input id="s" required value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase()); setEdited(true); }}
              className="h-11 flex-1 px-3 font-mono text-[15px] focus:outline-none" />
          </div>
          {hint && (
            <p className={`mt-1.5 text-sm ${hint.ok ? "text-green-700" : "text-red-700"}`} aria-live="polite">
              {hint.ok ? "✓ " : ""}{hint.text}
              {!hint.ok && hint.suggestion && (
                <> — <button type="button" onClick={() => { setSlug(hint.suggestion!); setEdited(true); }} className="font-medium underline underline-offset-2">use {hint.suggestion}</button></>
              )}
            </p>
          )}
        </div>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</div>}
        <button type="submit" disabled={busy || hint?.ok === false}
          className="h-11 rounded-lg bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? "Creating…" : "Create and switch to it"}
        </button>
      </form>
    </div>
  );
}
