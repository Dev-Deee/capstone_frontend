"use client";

import { useEffect, useState } from "react";
import { messageApi, type PersonRef } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import { roleLabel } from "@/components/messages/roles";

// Search the people you're allowed to message (the server decides who that is).
export default function NewMessagePicker({ onPick, onClose }: {
  onPick: (userPublicId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<PersonRef[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      messageApi.contacts(query.trim())
        .then((list) => { setPeople(list); setError(null); })
        .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load people"));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  async function pick(id: string) {
    setBusy(id);
    try {
      await onPick(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the conversation");
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-gray-950/50 p-4 pt-[10vh]" onClick={onClose}>
      <div role="dialog" aria-label="New message" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">New message</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3">
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name"
            aria-label="Search by name"
            className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {error && <p className="mx-3 mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100 border-t border-gray-100">
          {people === null ? (
            <p className="px-4 py-6 text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : people.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              {query.trim() ? "Nobody you can message matches that name." : "There's nobody you can message yet."}
            </p>
          ) : (
            people.map((p) => (
              <button key={p.publicId} type="button" disabled={busy !== null} onClick={() => pick(p.publicId)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 disabled:opacity-60">
                <Avatar name={p.name} src={p.profileImageUrl} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">{p.name}</span>
                  <span className="block text-xs text-gray-500">{roleLabel(p.roles)}</span>
                </span>
                {busy === p.publicId && <span className="text-xs text-gray-400">Opening…</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
