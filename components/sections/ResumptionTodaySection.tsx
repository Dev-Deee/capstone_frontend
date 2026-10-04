"use client";

import { useEffect, useState } from "react";
import { resumptionApi, cohortApi } from "@/lib/api";
import { QrDisplay } from "@/components/QrDisplay";
import { LiveCodeDisplay } from "@/components/LiveCodeDisplay";

export default function ResumptionTodaySection() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [openCohortId, setOpenCohortId] = useState("");
  const [openMinutes, setOpenMinutes] = useState(90);

  function cohortName(publicId: string) {
    return cohorts.find((c) => c.publicId === publicId)?.name || publicId;
  }

  async function loadToday() {
    setMessage(null);
    try {
      setSessions(await resumptionApi.getToday());
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load today's sessions" });
    }
  }

  useEffect(() => {
    cohortApi.getAll().then(setCohorts).catch(() => {});
    loadToday();
  }, []);

  // Admins with MANAGE_RESUMPTION_CODES for the cohort, and super admins, can open
  // today's session; there is one per cohort per day.
  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    setIsWorking(true);
    setMessage(null);
    try {
      const opened = await resumptionApi.open({ cohortPublicId: openCohortId, expiryMinutes: openMinutes });
      setSessions((prev) => [opened, ...prev]);
      setMessage({ type: "success", text: `Resumption opened for ${cohortName(openCohortId)}.` });
      setOpenCohortId("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to open resumption" });
    } finally { setIsWorking(false); }
  }

  async function handleRegenerate(publicId: string) {
    setIsWorking(true);
    try {
      const updated = await resumptionApi.regenerate(publicId);
      setSessions((prev) => prev.map((s) => (s.publicId === publicId ? updated : s)));
      setMessage({ type: "success", text: "Code regenerated." });
    } catch {
      setMessage({ type: "error", text: "Failed — check cohort scope" });
    } finally { setIsWorking(false); }
  }

  async function handleClose(publicId: string) {
    setIsWorking(true);
    try {
      const updated = await resumptionApi.close(publicId);
      setSessions((prev) => prev.map((s) => (s.publicId === publicId ? updated : s)));
      setMessage({ type: "success", text: "Session closed." });
    } catch {
      setMessage({ type: "error", text: "Failed — check cohort scope" });
    } finally { setIsWorking(false); }
  }

  async function handleAdjustWindow(e: React.FormEvent) {
    e.preventDefault();
    setIsWorking(true);
    try {
      const updated = await resumptionApi.adjustWindow(selectedId, newExpiresAt);
      setSessions((prev) => prev.map((s) => (s.publicId === selectedId ? updated : s)));
      setMessage({ type: "success", text: "Window adjusted." });
    } catch {
      setMessage({ type: "error", text: "Failed — check cohort scope" });
    } finally { setIsWorking(false); }
  }

  return (
    <div>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      {/* Open today's resumption for a cohort that doesn't have one yet */}
      <form onSubmit={handleOpen} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Open daily resumption</h2>
        <div className="flex flex-wrap items-end gap-3">
          <select
            required value={openCohortId} onChange={(e) => setOpenCohortId(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a cohort…</option>
            {cohorts
              .filter((c) => !sessions.some((s) => s.cohortPublicId === c.publicId))
              .map((c) => <option key={c.publicId} value={c.publicId}>{c.name}</option>)}
          </select>
          <label className="text-xs text-gray-500">
            Stays open for (minutes)
            <input
              type="number" min={1} required value={openMinutes}
              onChange={(e) => setOpenMinutes(Number(e.target.value))}
              className="mt-1 block w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <button type="submit" disabled={isWorking || !openCohortId} className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Open resumption
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Today's Sessions</h2>
          <button onClick={loadToday} className="text-xs text-gray-400 hover:text-gray-700 underline">Refresh</button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No resumption sessions have been opened today.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s.publicId} className="border border-gray-100 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-3 mb-1">
                  <div className="flex-1">
                    {s.isOpen
                      ? <LiveCodeDisplay publicId={s.publicId} type="resumption" />
                      : <p className="font-mono font-semibold text-gray-300">—</p>
                    }
                  </div>
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-3">
                  {cohortName(s.cohortPublicId)} — expires {new Date(s.expiresAt).toLocaleTimeString()}
                </p>
                {s.isOpen && s.qrToken && (
                  <div className="mb-3">
                    <QrDisplay
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}/attend/resumption/${s.qrToken}`}
                      label="Students scan to check in"
                    />
                  </div>
                )}
                <div className="flex gap-3 text-xs">
                  <button onClick={() => handleRegenerate(s.publicId)} disabled={isWorking} className="text-blue-600 hover:underline disabled:opacity-50">
                    Regenerate
                  </button>
                  <button onClick={() => handleClose(s.publicId)} disabled={isWorking} className="text-red-600 hover:underline disabled:opacity-50">
                    Close now
                  </button>
                  <button onClick={() => setSelectedId(s.publicId)} disabled={isWorking} className="text-gray-600 hover:underline disabled:opacity-50">
                    Adjust window
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {selectedId && (
          <form onSubmit={handleAdjustWindow} className="mt-5 pt-5 border-t border-gray-100 space-y-3 max-w-md">
            <p className="text-xs text-gray-500">Adjusting: <span className="font-mono">{selectedId}</span></p>
            <input
              type="datetime-local" required
              value={newExpiresAt} onChange={(e) => setNewExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={isWorking} className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isWorking ? "Updating…" : "Update Window"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
