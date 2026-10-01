"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";

function friendlyDeviceName(userAgent: string): string {
  if (!userAgent) return "Unknown device";

  if (userAgent.includes("PostmanRuntime")) return "Postman";
  if (userAgent.includes("curl")) return "curl (command line)";

  const browser = userAgent.includes("Edg/") ? "Edge"
    : userAgent.includes("Chrome/") ? "Chrome"
    : userAgent.includes("Firefox/") ? "Firefox"
    : userAgent.includes("Safari/") ? "Safari"
    : "Unknown browser";

  const os = userAgent.includes("iPhone") || userAgent.includes("iPad") ? "iOS"
    : userAgent.includes("Android") ? "Android"
    : userAgent.includes("Windows") ? "Windows"
    : userAgent.includes("Mac OS") ? "macOS"
    : userAgent.includes("Linux") ? "Linux"
    : "";

  return os ? `${browser} on ${os}` : browser;
}

export default function ActiveDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi.getDevices()
      .then(setDevices)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load devices"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRevokeDevice(publicId: string) {
    try {
      await authApi.revokeDevice(publicId);
      setDevices((prev) => prev.filter((d) => d.publicId !== publicId));
    } catch {
      setError("Failed to revoke device");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-2">Active Devices</h2>
      <p className="text-sm text-gray-500 mb-4">Devices currently signed in to your account. Revoke any you don't recognise.</p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
      ) : devices.length === 0 ? (
        <p className="text-sm text-gray-400">No active devices.</p>
      ) : (
        <ul className="space-y-2">
          {devices.map((device) => {
            const isActive = new Date(device.expiresAt) > new Date();
            return (
              <li key={device.publicId} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">{friendlyDeviceName(device.userAgent)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {isActive ? "Active" : "Expired"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">Logged in {new Date(device.lastUsedAt).toLocaleString()}</p>
                </div>
                <button onClick={() => handleRevokeDevice(device.publicId)} className="text-red-600 hover:underline text-xs">
                  Revoke
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
