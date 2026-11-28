"use client";

import { useEffect, useState } from "react";
import { pushApi } from "@/lib/api";
import { SW_ENABLED, currentPushSubscription, disablePush, enablePush, isIos, isStandalone, pushSupported, syncPushSubscription } from "@/lib/pwa";

type State =
  | "loading"
  | "hidden"       // the server has push turned off — nothing to offer
  | "unsupported"  // this browser can't do Web Push (or the service worker is off)
  | "ios-install"  // iOS: push works only from the Home Screen app
  | "denied"       // blocked in the browser's site settings
  | "off"
  | "on";

// "Push notifications" for this device: asks permission, subscribes with the
// server's VAPID key and registers the subscription; turning it off removes it.
export default function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const server = await pushApi.publicKey().catch(() => ({ enabled: false, publicKey: null }));
      let next: State;
      if (!server.enabled) next = "hidden";
      else if (isIos() && !isStandalone()) next = "ios-install";
      else if (!SW_ENABLED || !pushSupported()) next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        const sub = await currentPushSubscription().catch(() => null);
        next = sub && Notification.permission === "granted" ? "on" : "off";
        if (next === "on") syncPushSubscription();
      }
      if (!cancelled) setState(next);
    })();
    return () => { cancelled = true; };
  }, []);

  if (state === "loading" || state === "hidden") return null;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (state === "on") {
        await disablePush();
        setState("off");
      } else {
        const result = await enablePush();
        setState(result === "enabled" ? "on" : result === "denied" ? "denied" : "unsupported");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change push notifications");
    } finally {
      setBusy(false);
    }
  }

  const on = state === "on";
  const canToggle = state === "on" || state === "off";
  const note =
    state === "ios-install" ? "On iPhone and iPad, add Cadence to your Home Screen (Share → Add to Home Screen), then turn this on from the app."
    : state === "denied" ? "Notifications are blocked for this site. Allow them in your browser's site settings, then come back here."
    : state === "unsupported" ? "This browser doesn't support push notifications."
    : on ? "You'll get an alert on this device whenever something new arrives here."
    : "Get an alert on this device when something new arrives, even when Cadence isn't open.";

  return (
    <section className="mb-4 rounded-2xl border border-gray-200 bg-surface px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p id="push-toggle-label" className="text-sm font-medium text-gray-900">Push notifications</p>
          <p className="mt-0.5 text-sm text-gray-500">{note}</p>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        {canToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby="push-toggle-label"
            disabled={busy}
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              on ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        )}
      </div>
    </section>
  );
}
