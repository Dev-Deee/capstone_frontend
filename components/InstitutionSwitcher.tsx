"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { institutionApi, userApi, type MembershipSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const roleWord = (roles: string[]) =>
  roles.includes("SUPER_ADMIN") ? "Owner" : roles.includes("ADMIN") ? "Admin"
  : roles.includes("FACILITATOR") ? "Facilitator" : roles.includes("STUDENT") ? "Student" : "";

// Lives in the sidebar's account card: shows the institution this session is
// working in, and opens upward to switch, create another, or leave.
export default function InstitutionSwitcher() {
  const { switchInstitution, platformAdmin, logout, institutionPublicId } = useAuth();
  const [mine, setMine] = useState<MembershipSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Reload whenever the session's institution changes, so the label and the
  // "switch to" list always reflect where this session is actually working.
  useEffect(() => { institutionApi.mine().then(setMine).catch(() => {}); }, [institutionPublicId]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = mine.find((m) => m.current);
  const others = mine.filter((m) => !m.current && m.active);

  async function go(id: string) {
    setBusy(true); setError(null);
    try { await switchInstitution(id); setOpen(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't switch"); }
    finally { setBusy(false); }
  }

  async function leave() {
    setBusy(true); setError(null);
    try {
      await userApi.leaveInstitution();
      await logout(); // this session belonged to the institution just left
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't leave");
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative mt-3">
      <button
        onClick={() => { setOpen((v) => !v); setConfirmLeave(false); }}
        aria-haspopup="menu" aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-left ring-1 ring-white/10 transition-colors hover:bg-white/10"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0 text-blue-200/60" aria-hidden="true">
          <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M2 21h20" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-sm text-white">{current?.institutionName ?? (platformAdmin ? "Platform" : "…")}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-blue-200/60 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-xl bg-white text-gray-900 shadow-xl ring-1 ring-black/5">
          {others.length > 0 && (
            <div className="py-1">
              <p className="px-3 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-[0.16em] text-gray-400">Switch to</p>
              {others.map((m) => (
                <button key={m.institutionPublicId} role="menuitem" disabled={busy} onClick={() => go(m.institutionPublicId)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50">
                  <span className="truncate">{m.institutionName}</span>
                  <span className="shrink-0 text-xs text-gray-400">{roleWord(m.roles)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 py-1">
            <Link href="/dashboard/new-institution" role="menuitem" onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">+ Create another institution</Link>
            {platformAdmin && (
              <Link href="/dashboard/platform" role="menuitem" onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">All institutions (platform)</Link>
            )}
            {current && (confirmLeave ? (
              <div className="px-3 py-2 text-xs">
                <p className="text-gray-600">Leave {current.institutionName}? You&rsquo;ll be signed out.</p>
                <div className="mt-2 flex gap-3">
                  <button onClick={leave} disabled={busy} className="font-medium text-red-600 hover:underline">Leave</button>
                  <button onClick={() => setConfirmLeave(false)} className="text-gray-500 hover:text-gray-800">Cancel</button>
                </div>
              </div>
            ) : (
              <button role="menuitem" onClick={() => setConfirmLeave(true)}
                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Leave this institution</button>
            ))}
          </div>
          {error && <p className="border-t border-gray-100 px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
