"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationApi, type AppNotification } from "@/lib/api";
import type { UnreadCount } from "@/components/notifications/useUnreadCount";
import NotificationItem from "@/components/notifications/NotificationItem";

// The bell in the app shell: unread badge, and a panel with the latest
// notifications, "Mark all read" and a link to the full list. The count is
// polled once by the layout and shared by every bell. The panel renders at
// page level, so the sidebar's clipping and transform can't cut it off.
export default function NotificationBell({ unread }: { unread: UnreadCount }) {
  const router = useRouter();
  const { count, setCount, refresh } = unread;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    notificationApi.list(0, 8).then((r) => setItems(r.items)).catch(() => setItems([]));
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  async function openItem(n: AppNotification) {
    setOpen(false);
    if (!n.read) {
      setCount((c) => Math.max(0, c - 1));
      notificationApi.markRead(n.publicId).catch(() => refresh());
    }
    if (n.linkRoute) router.push(n.linkRoute);
  }

  async function markAll() {
    await notificationApi.markAllRead().catch(() => {});
    setItems((list) => list?.map((n) => ({ ...n, read: true })) ?? null);
    setCount(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-blue-100/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[#0c1f4a]">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-2 top-16 z-[60] overflow-hidden rounded-2xl border border-gray-200 bg-surface text-left shadow-xl md:inset-x-auto md:left-[16.75rem] md:top-3 md:w-96"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
            {count > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-medium text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
            {items === null ? (
              <p className="px-4 py-6 text-sm text-gray-400 animate-pulse">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => <NotificationItem key={n.publicId} n={n} onOpen={openItem} />)
            )}
          </div>
          <Link href="/dashboard/notifications" onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-gray-50">
            See all notifications
          </Link>
        </div>,
        document.body,
      )}
    </div>
  );
}
