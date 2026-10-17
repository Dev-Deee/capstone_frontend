"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "@/lib/api";

const POLL_MS = 45_000;

// The unread count, polled every 45 s while the tab is visible (no polling in
// a hidden tab) and refreshed as soon as it becomes visible again.
export type UnreadCount = ReturnType<typeof useUnreadCount>;

export function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    notificationApi.unreadCount().then((r) => setCount(r.count)).catch(() => {});
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
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, refresh]);

  return { count, setCount, refresh };
}
