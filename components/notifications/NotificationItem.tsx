"use client";

import type { AppNotification } from "@/lib/api";

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// One notification row: unread dot, title, body, time. Clicking opens it.
export default function NotificationItem({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${n.read ? "" : "bg-blue-50/40"}`}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-blue-600"}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${n.read ? "text-gray-700" : "font-medium text-gray-900"}`}>{n.title}</span>
        <span className="mt-0.5 block text-sm text-gray-500">{n.body}</span>
        <span className="mt-1 block text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
      </span>
      {!n.read && <span className="sr-only">Unread</span>}
    </button>
  );
}
