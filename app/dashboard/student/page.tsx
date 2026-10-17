"use client";

import { useEffect, useState } from "react";
import { userApi, attendanceApi, resumptionApi, cohortApi } from "@/lib/api";
import TabBar from "@/components/TabBar";
import PageHeader, { greeting } from "@/components/PageHeader";

type Tab = "class" | "resumption" | "cohort";

const inputClass =
  "flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [resumptionCode, setResumptionCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("class");

  useEffect(() => {
    // ?code=XXXX (e.g. from an invite link) opens the Cohort tab with the code filled in.
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) setInviteCode(code.toUpperCase());
    userApi.getMe()
      .then((me) => {
        setProfile(me);
        if (code || !me.cohortPublicId) setTab("cohort");
      })
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleJoinCohort(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsJoining(true);
    try {
      const cohort = await cohortApi.join(inviteCode.trim());
      setProfile(await userApi.getMe());
      setInviteCode("");
      setMessage({ type: "success", text: `You've joined ${cohort.name}. You can now check in.` });
      setTab("class");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to join cohort" });
    } finally {
      setIsJoining(false);
    }
  }

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;
  }

  const inCohort = Boolean(profile?.cohortPublicId);

  return (
    <div className="p-6">
      <PageHeader
        eyebrow={inCohort ? profile.cohortName : "Student"}
        title={profile ? `${greeting()}, ${profile.firstName}.` : "Dashboard"}
        description={inCohort
          ? "Check in for class or daily resumption below."
          : "Join your cohort with the invite code you were sent to get started."}
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
          { id: "class", label: "Class Attendance" },
          { id: "resumption", label: "Daily Resumption" },
          { id: "cohort", label: inCohort ? "My Cohort" : "Join a Cohort" },
        ]}
        active={tab}
        onChange={(id) => { setTab(id as Tab); setMessage(null); }}
      />

      {tab !== "cohort" && !inCohort && (
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-6 text-sm text-gray-600">
          You need to join a cohort before you can check in.{" "}
          <button onClick={() => setTab("cohort")} className="text-blue-600 font-medium hover:underline">
            Enter your invite code
          </button>
        </div>
      )}

      {tab === "class" && inCohort && (
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Mark Class Attendance</h2>
          <p className="text-sm text-gray-500 mb-3">Enter the code your facilitator is showing for this class.</p>
          <form onSubmit={handleMarkClassAttendance} className="flex gap-2 max-w-md">
            <input
              type="text" required placeholder="Enter session code"
              value={sessionCode} onChange={(e) => setSessionCode(e.target.value)}
              className={inputClass}
            />
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              Mark Present
            </button>
          </form>
        </div>
      )}

      {tab === "resumption" && inCohort && (
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Mark Daily Resumption</h2>
          <p className="text-sm text-gray-500 mb-3">Check in once a day when you arrive on campus.</p>
          <form onSubmit={handleMarkResumption} className="flex gap-2 max-w-md">
            <input
              type="text" required placeholder="Enter resumption code"
              value={resumptionCode} onChange={(e) => setResumptionCode(e.target.value)}
              className={inputClass}
            />
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              Check In
            </button>
          </form>
        </div>
      )}

      {tab === "cohort" && (
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm">
          {inCohort && (
            <div className="p-6 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Your cohort</p>
              <p className="text-base font-semibold text-gray-900">{profile.cohortName}</p>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Join a cohort</h2>
            <p className="text-sm text-gray-500 mb-4">
              {inCohort
                ? "Enter an invite code from your institution. You can only be in one cohort at a time, so if the code is for a different cohort, an admin or super admin will need to move you."
                : "Enter the invite code your institution sent you by email or text."}
            </p>
            <form onSubmit={handleJoinCohort} className="flex gap-2 max-w-md">
              <input
                type="text" required placeholder="e.g. 7K3PQX9A" autoCapitalize="characters"
                value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className={`${inputClass} font-mono tracking-wider`}
              />
              <button
                type="submit" disabled={isJoining}
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isJoining ? "Joining…" : "Join"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
