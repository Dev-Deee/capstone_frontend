"use client";

import { useEffect, useState } from "react";
import { cohortApi } from "@/lib/api";

export default function InviteCodesPage() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [cohortPublicId, setCohortPublicId] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    cohortApi.getAll().then(setCohorts).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreatedCode(null);
    try {
      const result = await cohortApi.createInviteCode({ cohortPublicId });
      setCreatedCode(result.code);
      setMessage({ type: "success", text: "Invite code generated." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to generate code" });
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Student Invite Codes</h1>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate Code</h2>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
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
          <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
            Generate Code
          </button>
        </form>

        {createdCode && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Generated Code</p>
            <p className="font-mono text-xl font-semibold text-gray-900">{createdCode}</p>
          </div>
        )}
      </div>
    </div>
  );
}
