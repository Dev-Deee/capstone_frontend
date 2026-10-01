"use client";

import { useEffect, useState } from "react";
import { userApi, attendanceApi, resumptionApi, authApi } from "@/lib/api";

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

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [sessionCode, setSessionCode] = useState("");
  const [resumptionCode, setResumptionCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([userApi.getMe(), authApi.getDevices()])
      .then(([me, deviceList]) => { setProfile(me); setDevices(deviceList); })
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleMarkClassAttendance(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await attendanceApi.mark(sessionCode);
      setMessage({ type: "success", text: "Class attendance marked successfully." });
      setSessionCode("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to mark attendance" });
    }
  }

  async function handleMarkResumption(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await resumptionApi.markAttendance(resumptionCode);
      setMessage({ type: "success", text: "Resumption attendance marked successfully." });
      setResumptionCode("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to mark resumption" });
    }
  }

  async function handleRevokeDevice(publicId: string) {
    try {
      await authApi.revokeDevice(publicId);
      setDevices((prev) => prev.filter((d) => d.publicId !== publicId));
    } catch {
      setMessage({ type: "error", text: "Failed to revoke device" });
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        {profile && <p className="text-sm text-gray-400 mt-0.5">Welcome back, {profile.firstName}</p>}
      </div>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Mark Class Attendance */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Mark Class Attendance</h2>
          <form onSubmit={handleMarkClassAttendance} className="flex gap-2 max-w-md">
            <input
              type="text" required placeholder="Enter session code"
              value={sessionCode} onChange={(e) => setSessionCode(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              Mark Present
            </button>
          </form>
        </div>

        {/* Mark Daily Resumption */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Mark Daily Resumption</h2>
          <form onSubmit={handleMarkResumption} className="flex gap-2 max-w-md">
            <input
              type="text" required placeholder="Enter resumption code"
              value={resumptionCode} onChange={(e) => setResumptionCode(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              Check In
            </button>
          </form>
        </div>

        {/* Active Devices */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Devices</h2>
          {devices.length === 0 ? (
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
      </div>
    </div>
  );
}
