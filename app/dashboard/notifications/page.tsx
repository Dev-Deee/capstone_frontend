"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationApi, type AppNotification } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import ListToolbar from "@/components/ui/ListToolbar";
import NotificationItem from "@/components/notifications/NotificationItem";

type Filter = "ALL" | "UNREAD";
const PAGE = 20;

// Everything sent to you in this institution, newest first.
export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [error, setError] = useState<string | null>(null);

  function load(p: number) {
    setLoading(true);
    notificationApi.list(p, PAGE)
      .then((r) => {
        setItems((prev) => (p === 0 ? r.items : [...prev, ...r.items]));
        setHasMore(r.hasMore);
        setPage(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load notifications"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(0); }, []);

  async function open(n: AppNotification) {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.publicId === n.publicId ? { ...x, read: true } : x)));
      await notificationApi.markRead(n.publicId).catch(() => {});
    }
    if (n.linkRoute) router.push(n.linkRoute);
  }

  async function markAll() {
    await notificationApi.markAllRead().catch(() => {});
    setItems((list) => list.map((n) => ({ ...n, read: true })));
  }

  const unread = items.filter((n) => !n.read).length;
  const visible = filter === "UNREAD" ? items.filter((n) => !n.read) : items;

  return (
    <div className="p-6">
      <PageHeader title="Notifications" description="Updates about your attendance, cohorts and people you've invited — for this institution." />
      {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <section className="rounded-2xl border border-gray-200 bg-surface shadow-sm">
        <ListToolbar
          count={visible.length}
          noun={visible.length === 1 ? "notification" : "notifications"}
          segments={[
            { value: "ALL" as Filter, label: "All", count: items.length },
            { value: "UNREAD" as Filter, label: "Unread", count: unread },
          ]}
          segment={filter}
          onSegment={setFilter}
        >
          {unread > 0 && (
            <button type="button" onClick={markAll} className="rounded-lg px-2.5 py-1.5 text-sm text-blue-600 hover:bg-blue-50">
              Mark all read
            </button>
          )}
        </ListToolbar>
        {loading && items.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">
            {filter === "UNREAD" ? "No unread notifications." : "Nothing yet — updates about your work here will show up in this list."}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map((n) => <NotificationItem key={n.publicId} n={n} onOpen={open} />)}
          </div>
        )}
        {hasMore && (
          <button type="button" disabled={loading} onClick={() => load(page + 1)}
            className="block w-full border-t border-gray-100 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-gray-50 disabled:opacity-50">
            {loading ? "Loading…" : "Load older"}
          </button>
        )}
      </section>
    </div>
  );
}
