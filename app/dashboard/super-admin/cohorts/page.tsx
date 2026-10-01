"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { cohortApi } from "@/lib/api";

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    cohortApi.getAll().then(setCohorts).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const cohort = await cohortApi.create({ name, startDate, endDate });
      setCohorts((prev) => [...prev, cohort]);
      setMessage({ type: "success", text: `Cohort "${cohort.name}" created.` });
      setName(""); setStartDate(""); setEndDate("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create cohort" });
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Cohorts</h1>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Create Cohort</h2>
          <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
            <input
              type="text" required placeholder="Cohort name"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start date</label>
                <input
                  type="date" required value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End date</label>
                <input
                  type="date" required value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
              Create Cohort
            </button>
          </form>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Existing Cohorts</h2>
          {cohorts.length === 0 ? (
            <p className="text-sm text-gray-400">No cohorts yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {cohorts.map((c) => (
                <li key={c.publicId} className="py-2.5 text-sm text-gray-700 flex justify-between items-center">
                  <Link href={`/dashboard/super-admin/cohorts/${c.publicId}`} className="hover:text-blue-600 hover:underline text-gray-900 font-medium">
                    {c.name}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
