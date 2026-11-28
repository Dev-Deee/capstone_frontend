"use client";

import { useEffect, useState } from "react";
import { canPromptInstall, isIos, isStandalone, onInstallAvailabilityChange, promptInstall } from "@/lib/pwa";

const DISMISS_KEY = "cadence_install_dismissed_at";
const DISMISS_DAYS = 30;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// A quiet "Install app" row for the sidebar. Shown only when the browser can
// install Cadence (or on iOS, where it's Share → Add to Home Screen), never
// once installed, and hidden for a month after "Not now".
export default function InstallAppButton() {
  const [available, setAvailable] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    setHidden(dismissedRecently());
    setIos(isIos());
    setAvailable(canPromptInstall());
    return onInstallAvailabilityChange(() => setAvailable(canPromptInstall()));
  }, []);

  if (hidden || (!available && !ios)) return null;

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setHidden(true);
  }

  async function install() {
    if (available) {
      if (await promptInstall()) setHidden(true);
    } else {
      setShowIosHint((v) => !v);
    }
  }

  return (
    <div className="mt-2 px-1">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={install}
          aria-expanded={ios && !available ? showIosHint : undefined}
          className="flex items-center gap-2 rounded-md text-xs text-blue-100/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
          </svg>
          Install app
        </button>
        <button type="button" onClick={dismiss} className="rounded-md text-[11px] text-blue-200/50 hover:text-blue-100">
          Not now
        </button>
      </div>
      {showIosHint && (
        <p className="mt-1.5 text-[11px] leading-snug text-blue-100/70">
          In Safari, tap <span className="font-medium text-blue-50">Share</span>, then{" "}
          <span className="font-medium text-blue-50">Add to Home Screen</span>.
        </p>
      )}
    </div>
  );
}
