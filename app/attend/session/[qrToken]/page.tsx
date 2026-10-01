"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionApi, attendanceApi, getAccessToken } from "@/lib/api";

export default function AttendSessionPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;

  const [sessionInfo, setSessionInfo] = useState<{
    sessionPublicId: string;
    cohortName: string;
    subjectName: string;
    isOpen: boolean;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated — use redirect param so the
    // student lands back here after signing in.
    const token = getAccessToken();
    if (!token) {
      router.replace(`/login?redirect=/attend/session/${qrToken}`);
      return;
    }

    sessionApi
      .getByQrToken(qrToken)
      .then((info) => setSessionInfo(info))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [qrToken, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    try {
      await attendanceApi.mark(code);
      setMessage({ type: "success", text: "Attendance marked successfully." });
      setCode("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to mark attendance",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (notFound || !sessionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5 max-w-sm w-full text-center">
          <p className="text-sm font-medium text-gray-900 mb-1">Session not available</p>
          <p className="text-sm text-gray-400">This attendance session is not currently open.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg border border-gray-200 p-5 max-w-sm w-full">
        <h1 className="text-base font-semibold text-gray-900 mb-1">Mark Attendance</h1>
        <p className="text-sm text-gray-500 mb-4">
          You&apos;re marking attendance for:{" "}
          <span className="font-medium text-gray-900">
            {sessionInfo.cohortName} — {sessionInfo.subjectName}
          </span>
        </p>

        {message && (
          <div
            className={`text-sm rounded-lg px-3 py-2 border mb-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-100"
                : "bg-red-50 text-red-700 border-red-100"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Session code</label>
            <input
              type="text"
              required
              placeholder="Enter the code shown on screen"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Marking…" : "Mark Present"}
          </button>
        </form>
      </div>
    </div>
  );
}
