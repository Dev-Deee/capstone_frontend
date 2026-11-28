"use client";

import { useEffect, useState } from "react";
import { announcementApi, type Announcement } from "@/lib/api";

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500";
const PAGE = 20;

function when(iso: string) {
  return new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Students: a read-only feed of announcements to their cohorts.
// Staff: a form to post to the cohorts they may reach, and what they've posted.
export default function Announcements({ mode }: { mode: "student" | "staff" }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load(p: number) {
    setLoading(true);
    (mode === "student" ? announcementApi.feed(p, PAGE) : announcementApi.sent(p, PAGE))
      .then((r) => {
        setItems((prev) => (p === 0 ? r.items : [...prev, ...r.items]));
        setHasMore(r.hasMore);
        setPage(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load announcements"))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(0); }, [mode]);

  async function remove(a: Announcement) {
    if (!window.confirm(`Delete “${a.title}”? Students will no longer see it.`)) return;
    try {
      await announcementApi.remove(a.publicId);
      setItems((list) => list.filter((x) => x.publicId !== a.publicId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the announcement");
    }
  }

  return (
    <div className="space-y-6">
      {mode === "staff" && <PostForm onPosted={(a) => setItems((list) => [a, ...list])} />}

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
          {mode === "student" ? "Announcements for your cohort" : "Posted announcements"}
        </h2>
        {loading && items.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">
            {mode === "student" ? "No announcements yet." : "You haven't posted any announcements yet."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((a) => (
              <li key={a.publicId} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-gray-900">{a.title}</h3>
                  <span className="text-xs text-gray-400">{when(a.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {a.authorName} · {a.cohorts.map((c) => c.name).join(", ")}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">{a.body}</p>
                {mode === "staff" && a.canDelete && (
                  <button type="button" onClick={() => remove(a)} className="mt-2 text-xs font-medium text-red-600 hover:underline">
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <div className="border-t border-gray-100 p-3 text-center">
            <button type="button" disabled={loading} onClick={() => load(page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function PostForm({ onPosted }: { onPosted: (a: Announcement) => void }) {
  const [cohorts, setCohorts] = useState<{ publicId: string; name: string }[] | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    announcementApi.audiences().then(setCohorts).catch(() => setCohorts([]));
  }, []);

  const toggle = (id: string) => setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (chosen.length === 0) { setError("Choose at least one cohort"); return; }
    setSaving(true);
    try {
      const a = await announcementApi.post({ title: title.trim(), body: body.trim(), cohortPublicIds: chosen });
      onPosted(a);
      setTitle(""); setBody(""); setChosen([]); setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post the announcement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Post an announcement</h2>
      {cohorts !== null && cohorts.length === 0 ? (
        <p className="text-sm text-gray-400">There are no cohorts you can post announcements to.</p>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <label className="text-xs text-gray-500">Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              placeholder="e.g. Friday's class moves online" className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs text-gray-500">Message
            <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={4000}
              placeholder="What students need to know" className={`${inputClass} mt-1 resize-y`} />
          </label>
          <fieldset>
            <legend className="text-xs text-gray-500">Cohorts</legend>
            {cohorts === null ? (
              <p className="mt-1 text-sm text-gray-400 animate-pulse">Loading…</p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {cohorts.map((c) => (
                  <label key={c.publicId} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                    chosen.includes(c.publicId) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-surface text-gray-700"}`}>
                    <input type="checkbox" className="sr-only" checked={chosen.includes(c.publicId)} onChange={() => toggle(c.publicId)} />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {done && <p className="text-sm text-green-700">Posted. Students in those cohorts will be notified.</p>}
          <div>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Posting…" : "Post announcement"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
