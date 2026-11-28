"use client";

import { useCallback, useEffect, useState } from "react";
import { messageApi } from "@/lib/api";

const POLL_MS = 60_000;

// Fired by the messages page after reading a conversation, so the sidebar
// badge updates at once instead of on the next poll.
export const MESSAGES_READ_EVENT = "cadence:messages-read";

export function announceMessagesRead() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
}

// Unread direct messages, polled every 60 s while the tab is visible.
export function useMessageUnread(enabled: boolean) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    messageApi.unreadCount().then((r) => setCount(r.count)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      refresh();
      timer = setInterval(refresh, POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(MESSAGES_READ_EVENT, refresh);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(MESSAGES_READ_EVENT, refresh);
    };
  }, [enabled, refresh]);

  return count;
}
