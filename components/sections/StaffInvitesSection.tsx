"use client";

import { useEffect, useState } from "react";
import { cohortApi, staffInviteApi, adminRoleApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StaffInvitesSection() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  type InviteRole = "STUDENT" | "FACILITATOR" | "ADMIN" | "SUPER_ADMIN";
  const { roles: myRoles } = useAuth();
  const isOwner = myRoles.includes("SUPER_ADMIN");
  const [targetRole, setTargetRole] = useState<InviteRole>("FACILITATOR");
  const [adminRoleId, setAdminRoleId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    cohortApi.getAll().then(setCohorts).catch(() => {});
    adminRoleApi.getAll().then(setAdminRoles).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await staffInviteApi.create({
        firstName: firstName || undefined, lastName: lastName || undefined, email,
        phoneNumber: phoneNumber || undefined, targetRole,
        adminRolePublicId: targetRole === "ADMIN" ? adminRoleId : undefined,
        cohortPublicId: (targetRole === "ADMIN" || targetRole === "STUDENT") && cohortId ? cohortId : undefined,
      });
      setMessage({ type: "success", text: `Invite sent to ${email}.` });
      setFirstName(""); setLastName(""); setEmail(""); setPhoneNumber(""); setAdminRoleId(""); setCohortId("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send invite" });
    }
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
          <div className="flex gap-3">
            <input
              type="text" placeholder="First name"
              value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text" placeholder="Last name"
              value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="email" required placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text" placeholder="Phone number"
            value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={targetRole}
            onChange={(e) => { setTargetRole(e.target.value as InviteRole); setCohortId(""); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="STUDENT">Student</option>
            <option value="FACILITATOR">Facilitator</option>
            <option value="ADMIN">Admin</option>
            {/* Co-owners can only be invited by an owner. */}
            {isOwner && <option value="SUPER_ADMIN">Super admin (co-owner)</option>}
          </select>

          {targetRole === "ADMIN" && (
            <>
              <select
                required value={adminRoleId}
                onChange={(e) => setAdminRoleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an admin role…</option>
                {adminRoles.map((r) => (
                  <option key={r.publicId} value={r.publicId}>{r.name}</option>
                ))}
              </select>
              {adminRoles.length === 0 && (
                <p className="text-xs text-amber-600">
                  No admin roles exist yet — create one on the Admin Roles page first.
                </p>
              )}
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Institution-wide (no cohort scope)</option>
                {cohorts.map((c) => (
                  <option key={c.publicId} value={c.publicId}>{c.name}</option>
                ))}
              </select>
            </>
          )}

          {targetRole === "STUDENT" && (
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No cohort yet (they can join later with a code)</option>
              {cohorts.map((c) => (
                <option key={c.publicId} value={c.publicId}>Enroll in {c.name}</option>
              ))}
            </select>
          )}

          <p className="text-xs text-gray-500">
            Name and phone are only needed if this person doesn&rsquo;t have a Cadence account yet.
            If they do, they&rsquo;ll sign in and accept, and this institution is added to their account.
          </p>

          <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700">
            Send Invite
          </button>
        </form>
      </div>
    </div>
  );
}
