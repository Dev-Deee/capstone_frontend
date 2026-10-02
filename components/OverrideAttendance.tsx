"use client";

import { useState } from "react";

// PRD Section 6.6 — the manual override: set PRESENT / LATE / ABSENT for one
// student, always with a reason (it's audited). Also how a facilitator settles
// a check-in left awaiting biometric confirmation.
export default function OverrideAttendance({
  current,
  onSave,
}: {
  current: string;
  onSave: (status: string, reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(current === "ABSENT" || current === "PENDING_BIOMETRIC" ? "PRESENT" : current);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-blue-600 hover:underline">
        Change
      </button>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(status, reason.trim());
      setOpen(false);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the change");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-2 w-full space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
      <div className="flex gap-1">
        {["PRESENT", "LATE", "ABSENT"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium border ${
              status === s ? "bg-blue-600 text-white border-blue-600" : "bg-surface text-gray-600 border-gray-200"
            }`}
          >
            {s[0] + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <input
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (recorded in the audit log)"
        className="w-full rounded-md border border-gray-200 bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:underline">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !reason.trim()}
          className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
