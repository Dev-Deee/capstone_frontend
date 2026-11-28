"use client";

import { useEffect } from "react";
import { SW_ENABLED, listenForInstallPrompt } from "@/lib/pwa";

// Registers /sw.js (production, or NEXT_PUBLIC_ENABLE_SW=true) and starts
// listening for the browser's install prompt. Renders nothing.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    listenForInstallPrompt();
    if (!SW_ENABLED || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // No service worker just means no offline page or push; the app still works.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
