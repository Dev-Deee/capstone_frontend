"use client";

import { useEffect, useState } from "react";
import { userApi, sessionApi, resumptionApi, facilitatorCohortApi, cohortApi, subjectApi } from "@/lib/api";
import { QrDisplay } from "@/components/QrDisplay";
import { LiveCodeDisplay } from "@/components/LiveCodeDisplay";
import TabBar from "@/components/TabBar";
import PageHeader, { greeting } from "@/components/PageHeader";

export default function FacilitatorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cohortPublicId, setCohortPublicId] = useState("");
  const [subjectPublicId, setSubjectPublicId] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState(15);
  const [openedSession, setOpenedSession] = useState<any>(null);

  const [resumptionCohortId, setResumptionCohortId] = useState("");
  const [resumptionExpiryMinutes, setResumptionExpiryMinutes] = useState(120);
  const [openedResumption, setOpenedResumption] = useState<any>(null);
  const [todaysCode, setTodaysCode] = useState<any>(null);
  // State lives here, not in the tabs, so switching tabs never loses a live code.
  const [tab, setTab] = useState<"class" | "resumption">("class");

  useEffect(() => {
    Promise.all([
      userApi.getMe(),
      facilitatorCohortApi.getMine(),
      cohortApi.getAll(),
      subjectApi.getAll(),
    ])
      .then(([me, myAssignments, cohortList, subjectList]) => {
        setProfile(me);
        setAssignments(myAssignments);
        setCohorts(cohortList);
        setSubjects(subjectList);
      })
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));

    // Non-blocking: restore any already-open resumption session from today
    // so the live code display survives a page refresh.
    resumptionApi.getTodayMine()
      .then((sessions) => {
        const open = sessions.find((s: any) => s.isOpen);
        if (open) setTodaysCode(open);
      })
      .catch(() => {/* best-effort — silence is fine if none exist */});
  }, []);

  function cohortName(publicId: string) {
    return cohorts.find((c) => c.publicId === publicId)?.name || publicId;
  }
  function subjectName(publicId: string) {
    return subjects.find((s) => s.publicId === publicId)?.name || publicId;
  }

  async function handleOpenSession(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setOpenedSession(null);
    try {
      const session = await sessionApi.open({ cohortPublicId, subjectPublicId, expiryMinutes });
      setOpenedSession(session);
      setMessage({ type: "success", text: "Session opened." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to open session" });
    }
  }

  async function handleCloseSession() {
    if (!openedSession) return;
    try {
      await sessionApi.close(openedSession.publicId);
      setMessage({ type: "success", text: "Session closed." });
      setOpenedSession(null);
    } catch {
      setMessage({ type: "error", text: "Failed to close session" });
    }
  }

  async function handleCloseResumption() {
    if (!activeResumption) return;
    try {
      await resumptionApi.close(activeResumption.publicId);
      setOpenedResumption(null);
      setTodaysCode(null);
      setMessage({ type: "success", text: "Resumption session closed." });
    } catch {
      setMessage({ type: "error", text: "Failed to close resumption session" });
    }
  }

  async function handleOpenResumption(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setOpenedResumption(null);
    try {
      const session = await resumptionApi.open({
        cohortPublicId: resumptionCohortId,
        expiryMinutes: resumptionExpiryMinutes,
      });
      setOpenedResumption(session);
      setMessage({ type: "success", text: "Resumption session opened." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to open resumption session" });
    }
  }

  async function handleCheckTodaysCode() {
    setMessage(null);
    if (!resumptionCohortId) {
      setMessage({ type: "error", text: "Select a cohort first." });
      return;
    }
    try {
      const sessions = await resumptionApi.getTodayMine();
      const match = sessions.find((s: any) => s.cohortPublicId === resumptionCohortId);
      if (match) {
        setTodaysCode(match);
      } else {
        setMessage({ type: "error", text: "No resumption session found for this cohort today." });
        setTodaysCode(null);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to check today's code" });
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  const activeResumption = openedResumption || todaysCode;

  return (
    <div className="p-6">
      <PageHeader
        eyebrow="Facilitator"
        title={profile ? `${greeting()}, ${profile.firstName}.` : "Overview"}
        description="Open a class session or today's resumption, and keep the code on screen while students check in."
      />

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <TabBar
        tabs={[
          { id: "class", label: "Class Session", live: Boolean(openedSession) },
          { id: "resumption", label: "Daily Resumption", live: Boolean(activeResumption) },
        ]}
        active={tab}
        onChange={(id) => { setTab(id as "class" | "resumption"); setMessage(null); }}
      />

      {tab === "class" && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* My Assignments */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">My Cohort + Subject Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-400">No assignments yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <div key={a.publicId} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{cohortName(a.cohortPublicId)}</span>
                    <span className="text-gray-300 mx-2">·</span>
                    <span className="text-gray-600">{subjectName(a.subjectPublicId)}</span>
                  </div>
                  <span className="text-xs rounded-full px-2 py-0.5 bg-blue-50 text-blue-600 font-medium">Assigned</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Class Session */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Open Class Session</h2>
          <form onSubmit={handleOpenSession} className="space-y-3 max-w-md">
            <select
              required value={cohortPublicId}
              onChange={(e) => setCohortPublicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a cohort…</option>
              {cohorts.map((c) => (
                <option key={c.publicId} value={c.publicId}>{c.name}</option>
              ))}
            </select>
            <select
              required value={subjectPublicId}
              onChange={(e) => setSubjectPublicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject…</option>
              {subjects.map((s) => (
                <option key={s.publicId} value={s.publicId}>{s.name}</option>
              ))}
            </select>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expires after (minutes)</label>
              <input
                type="number" required min={1}
                value={expiryMinutes} onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
              Open Session
            </button>
          </form>

          {openedSession && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Live Session Code</p>
              <div className="mb-3">
                <LiveCodeDisplay publicId={openedSession.publicId} type="session" />
              </div>
              <p className="text-gray-400 text-xs mb-3">Expires at {new Date(openedSession.expiresAt).toLocaleTimeString()}</p>
              <QrDisplay
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/attend/session/${openedSession.qrToken}`}
                label="Students scan this to open the check-in page"
              />
              <button onClick={handleCloseSession} className="mt-3 text-red-600 text-xs hover:underline">
                Close session now
              </button>
            </div>
          )}
        </div>

      </div>
      )}

      {tab === "resumption" && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Open Daily Resumption */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Open Daily Resumption</h2>
          <form onSubmit={handleOpenResumption} className="space-y-3 max-w-md">
            <div className="flex gap-2">
              <select
                required value={resumptionCohortId}
                onChange={(e) => setResumptionCohortId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a cohort…</option>
                {cohorts.map((c) => (
                  <option key={c.publicId} value={c.publicId}>{c.name}</option>
                ))}
              </select>
              <button
                type="button" onClick={handleCheckTodaysCode}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap text-gray-700"
              >
                Check Today's Code
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stays open for (minutes)</label>
              <input
                type="number" required min={1}
                value={resumptionExpiryMinutes} onChange={(e) => setResumptionExpiryMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
              Open Resumption
            </button>
          </form>

          {activeResumption && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Live Resumption Code</p>
              <div className="mb-3">
                <LiveCodeDisplay publicId={activeResumption.publicId} type="resumption" />
              </div>
              <p className="text-gray-400 text-xs mb-3">Expires at {new Date(activeResumption.expiresAt).toLocaleTimeString()}</p>
              <QrDisplay
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/attend/resumption/${activeResumption.qrToken}`}
                label="Students scan this to check in"
              />
              <button onClick={handleCloseResumption} className="mt-3 text-red-600 text-xs hover:underline">
                Close resumption now
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
