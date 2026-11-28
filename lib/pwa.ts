"use client";

import { pushApi } from "@/lib/api";

// Installable app + Web Push helpers. Everything here is browser-only and
// safe to call where a feature is missing (it just reports "unsupported").

// The service worker runs in production builds, or in dev with NEXT_PUBLIC_ENABLE_SW=true.
export const SW_ENABLED =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// ── Install prompt ─────────────────────────────────────────────────────────
// Chrome/Edge/Android fire `beforeinstallprompt` once, possibly before the
// component that offers "Install app" mounts — so it's caught here, early.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let installListening = false;

export function listenForInstallPrompt() {
  if (installListening || typeof window === "undefined") return;
  installListening = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // no mini-infobar; we offer it quietly instead
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((l) => l());
  });
}

export function canPromptInstall() {
  return deferredPrompt !== null;
}

export function onInstallAvailabilityChange(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const e = deferredPrompt;
  deferredPrompt = null; // a prompt can only be used once
  listeners.forEach((l) => l());
  await e.prompt();
  return (await e.userChoice).outcome === "accepted";
}

// ── Push ───────────────────────────────────────────────────────────────────

export function pushSupported(): boolean {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!SW_ENABLED || !pushSupported()) return undefined;
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function currentPushSubscription(): Promise<PushSubscription | null> {
  const reg = await registration();
  return reg ? reg.pushManager.getSubscription() : null;
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type EnableResult = "enabled" | "denied" | "unavailable";

/** Asks permission, subscribes this browser and registers it with Cadence. */
export async function enablePush(): Promise<EnableResult> {
  const reg = await registration();
  if (!reg) return "unavailable";
  const { enabled, publicKey } = await pushApi.publicKey();
  if (!enabled || !publicKey) return "unavailable";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  // A subscription made with another server key can't be reused.
  if (sub && sub.options.applicationServerKey) {
    const existing = btoa(String.fromCharCode(...new Uint8Array(sub.options.applicationServerKey)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (existing !== publicKey.replace(/=+$/, "")) {
      await sub.unsubscribe();
      sub = null;
    }
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  }
  await pushApi.subscribe(sub.toJSON());
  return "enabled";
}

/** Stops push on this browser: removes it from Cadence and unsubscribes it. */
export async function disablePush(): Promise<void> {
  const sub = await currentPushSubscription();
  if (!sub) return;
  await pushApi.unsubscribe(sub.endpoint).catch(() => {});
  await sub.unsubscribe().catch(() => false);
}

/**
 * Re-sends an existing subscription so the server's copy is current (keys can
 * rotate). Silent and best-effort; never prompts.
 */
export async function syncPushSubscription(): Promise<void> {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const sub = await currentPushSubscription();
  if (sub) await pushApi.subscribe(sub.toJSON()).catch(() => {});
}

/** On sign-out: this device stops getting the account's notifications. Never takes longer than ~2s. */
export async function disablePushOnSignOut(): Promise<void> {
  if (!pushSupported() || !SW_ENABLED) return;
  await Promise.race([disablePush().catch(() => {}), new Promise((r) => setTimeout(r, 2000))]);
}
