"use client";

import { useEffect, useState } from "react";
import { userApi, authApi } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    userApi.getAll().then(setUsers).catch(() => {});
  }, []);

  function startEdit(user: any) {
    setEditingId(user.publicId);
    setNewEmail(user.email);
    setReason("");
    setMessage(null);
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setMessage(null);
    try {
      await authApi.adminChangeEmail(editingId, newEmail, reason);
      setUsers((prev) => prev.map((u) => (u.publicId === editingId ? { ...u, email: newEmail } : u)));
      setMessage({ type: "success", text: "Email updated. That user's other sessions have been signed out." });
      setEditingId(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change email" });
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Users</h1>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-5 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {users.length === 0 ? (
          <p className="text-sm text-gray-400">No users found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.publicId} className="py-3">
                {editingId === u.publicId ? (
                  <form onSubmit={handleChangeEmail} className="space-y-2 max-w-md">
                    <p className="text-sm text-gray-900 font-medium">{u.fullName}</p>
                    <input
                      type="email" required value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text" required placeholder="Reason (for audit log)"
                      value={reason} onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="flex-1 border border-gray-200 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-900 font-medium">{u.fullName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {u.email} — {(u.roles || []).join(", ")}
                        {u.cohortName ? ` — ${u.cohortName}` : ""}
                      </p>
                    </div>
                    <button onClick={() => startEdit(u)} className="text-blue-600 hover:underline text-xs">
                      Change Email
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
