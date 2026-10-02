"use client";

import { useEffect, useMemo, useState } from "react";
import { userApi, authApi, cohortApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type User = {
  publicId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  institutionStudentId: string | null;
  roles: string[];
  cohortPublicId: string | null;
  cohortName: string | null;
  active: boolean;
  accountPending: boolean;
};

type Form = {
  firstName: string; middleName: string; lastName: string;
  email: string; phoneNumber: string; institutionStudentId: string; emailReason: string;
};

type Message = { type: "success" | "error"; text: string } | null;

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const ROLE_FILTERS = ["ALL", "STUDENT", "FACILITATOR", "ADMIN", "SUPER_ADMIN"] as const;

function StatusBadge({ user }: { user: User }) {
  const [label, cls] = !user.active
    ? ["Deactivated", "bg-red-100 text-red-700"]
    : user.accountPending
      ? ["Invite pending", "bg-amber-100 text-amber-700"]
      : ["Active", "bg-green-100 text-green-700"];
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

export default function UsersSection() {
  const { roles: myRoles } = useAuth();
  const viewerIsSuperAdmin = myRoles.includes("SUPER_ADMIN");
  const [users, setUsers] = useState<User[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>("ALL");
  const [message, setMessage] = useState<Message>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [cohorts, setCohorts] = useState<{ publicId: string; name: string }[]>([]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  useEffect(() => {
    Promise.all([userApi.getAll(), userApi.getMe()])
      .then(([list, me]) => { setUsers(list); setMeId(me.publicId); })
      .then(() => cohortApi.getAll().then(setCohorts).catch(() => {}))
      .catch((err) => {
        const text = err instanceof Error ? err.message : "Failed to load users";
        setMessage({
          type: "error",
          text: (text.includes("MANAGE_USERS") || text.toLowerCase().includes("permission"))
            ? "You need the Manage Users permission to see this list. Ask a super admin to add it to your admin role."
            : text,
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) =>
      (roleFilter === "ALL" || u.roles.includes(roleFilter)) &&
      (!q || [u.fullName, u.email, u.phoneNumber, u.institutionStudentId, u.cohortName]
        .some((v) => v?.toLowerCase().includes(q))));
  }, [users, search, roleFilter]);

  function replaceUser(updated: User) {
    setUsers((prev) => prev.map((u) => (u.publicId === updated.publicId ? updated : u)));
  }

  function startEdit(u: User) {
    setMessage(null);
    setConfirmDeleteId(null);
    setEditingId(u.publicId);
    setForm({
      firstName: u.firstName ?? "", middleName: u.middleName ?? "", lastName: u.lastName ?? "",
      email: u.email ?? "", phoneNumber: u.phoneNumber ?? "", institutionStudentId: u.institutionStudentId ?? "",
      emailReason: "",
    });
  }

  async function handleSave(e: React.FormEvent, u: User) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      const emailChanged = form.email.trim().toLowerCase() !== (u.email ?? "").toLowerCase();
      let updated: User = await userApi.update(u.publicId, {
        firstName: form.firstName, middleName: form.middleName, lastName: form.lastName,
        phoneNumber: form.phoneNumber, institutionStudentId: form.institutionStudentId,
      });
      if (emailChanged) {
        await authApi.adminChangeEmail(u.publicId, form.email.trim(), form.emailReason);
        updated = { ...updated, email: form.email.trim() };
      }
      replaceUser(updated);
      setEditingId(null);
      setMessage({
        type: "success",
        text: emailChanged
          ? `${updated.fullName} updated. Their email changed, so they've been signed out everywhere.`
          : `${updated.fullName} updated.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update user" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    setBusyId(u.publicId);
    setMessage(null);
    try {
      const updated: User = u.active ? await userApi.deactivate(u.publicId) : await userApi.activate(u.publicId);
      replaceUser(updated);
      setMessage({
        type: "success",
        text: updated.active
          ? `${u.fullName} can sign in again.`
          : `${u.fullName} has been deactivated and signed out.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change status" });
    } finally {
      setBusyId(null);
    }
  }

  function startMove(u: User) {
    setMessage(null);
    setEditingId(null);
    setConfirmDeleteId(null);
    setMovingId(u.publicId);
    setMoveTarget("");
  }

  // Admin/super-admin only: students can't move themselves between cohorts.
  async function handleMove(e: React.FormEvent, u: User) {
    e.preventDefault();
    if (!moveTarget) return;
    setBusyId(u.publicId);
    setMessage(null);
    try {
      const updated: User = await cohortApi.enrollStudent(moveTarget, u.publicId);
      replaceUser(updated);
      setMovingId(null);
      setMessage({
        type: "success",
        text: u.cohortName
          ? `${u.fullName} moved from ${u.cohortName} to ${updated.cohortName}.`
          : `${u.fullName} added to ${updated.cohortName}.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change cohort" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(u: User) {
    setBusyId(u.publicId);
    setMessage(null);
    try {
      await userApi.remove(u.publicId);
      setUsers((prev) => prev.filter((x) => x.publicId !== u.publicId));
      setConfirmDeleteId(null);
      setMessage({ type: "success", text: `${u.fullName}'s account was deleted and their personal details removed.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete user" });
    } finally {
      setBusyId(null);
    }
  }

  const field = (key: keyof Form) => ({
    value: form?.[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f)),
  });

  return (
    <div>
      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 border mb-4 ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search" placeholder="Search name, email, phone, student ID, cohort…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-sm`}
        />
        <select
          value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className={`${inputClass} w-auto`}
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>{r === "ALL" ? "All roles" : r.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">{users.length === 0 ? "No users found." : "No users match your search."}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((u) => {
              const isSelf = u.publicId === meId;
              const isSuperAdmin = u.roles.includes("SUPER_ADMIN");
              // Admins (MANAGE_USERS) manage students and facilitators; only a
              // super admin manages admin accounts. The backend enforces the same rule.
              const isStaffAdmin = isSuperAdmin || u.roles.includes("ADMIN");
              const canEdit = viewerIsSuperAdmin || !isStaffAdmin;
              const canChangeStatus = canEdit && !isSelf && !isSuperAdmin;
              const busy = busyId === u.publicId;
              const emailChanged = form && editingId === u.publicId
                && form.email.trim().toLowerCase() !== (u.email ?? "").toLowerCase();

              return (
                <li key={u.publicId} className={`px-5 py-3 ${!u.active ? "bg-gray-50" : ""}`}>
                  {editingId === u.publicId && form ? (
                    <form onSubmit={(e) => handleSave(e, u)} className="space-y-3 max-w-2xl py-1">
                      <p className="text-sm font-medium text-gray-900">Edit {u.fullName}</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-xs text-gray-500">First name<input required className={`${inputClass} mt-1`} {...field("firstName")} /></label>
                        <label className="text-xs text-gray-500">Middle name<input className={`${inputClass} mt-1`} {...field("middleName")} /></label>
                        <label className="text-xs text-gray-500">Last name<input required className={`${inputClass} mt-1`} {...field("lastName")} /></label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-xs text-gray-500">Email<input type="email" required className={`${inputClass} mt-1`} {...field("email")} /></label>
                        <label className="text-xs text-gray-500">Phone<input className={`${inputClass} mt-1`} {...field("phoneNumber")} /></label>
                        <label className="text-xs text-gray-500">Institution student ID<input className={`${inputClass} mt-1`} {...field("institutionStudentId")} /></label>
                      </div>
                      {emailChanged && (
                        <label className="block text-xs text-gray-500">
                          Reason for email change (kept in the audit log — the user will be signed out)
                          <input required className={`${inputClass} mt-1`} {...field("emailReason")} />
                        </label>
                      )}
                      <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="border border-gray-200 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${u.active ? "text-gray-900" : "text-gray-500"}`}>{u.fullName}</p>
                          <StatusBadge user={u} />
                          {isSelf && <span className="text-[11px] text-gray-400">(you)</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {u.email}{u.phoneNumber ? ` · ${u.phoneNumber}` : ""} · {u.roles.join(", ")}
                          {u.cohortName ? ` · ${u.cohortName}` : ""}
                        </p>
                      </div>

                      {confirmDeleteId === u.publicId ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-red-700">Delete {u.firstName}? Their personal details are removed; this can't be undone.</span>
                          <button disabled={busy} onClick={() => handleDelete(u)} className="bg-red-600 text-white font-medium px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50">
                            {busy ? "Deleting…" : "Delete"}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-gray-500 hover:text-gray-800">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-xs">
                          {canEdit && (
                            <button onClick={() => startEdit(u)} className="text-blue-600 hover:underline">Edit</button>
                          )}
                          {canEdit && u.roles.includes("STUDENT") && (
                            <button onClick={() => startMove(u)} className="text-blue-600 hover:underline">
                              {u.cohortName ? "Change cohort" : "Add to cohort"}
                            </button>
                          )}
                          {canChangeStatus && (
                            <>
                              <button
                                disabled={busy} onClick={() => toggleActive(u)}
                                className={`hover:underline disabled:opacity-50 ${u.active ? "text-amber-700" : "text-green-700"}`}
                              >
                                {busy ? "…" : u.active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => { setConfirmDeleteId(u.publicId); setEditingId(null); }}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {movingId === u.publicId && (
                    <form onSubmit={(e) => handleMove(e, u)} className="mt-3 p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-3 max-w-xl">
                      <p className="text-sm text-gray-700">
                        {u.cohortName
                          ? <>Move <span className="font-medium">{u.fullName}</span> out of <span className="font-medium">{u.cohortName}</span> to:</>
                          : <>Add <span className="font-medium">{u.fullName}</span> to:</>}
                      </p>
                      <select
                        required value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select a cohort…</option>
                        {cohorts.filter((c) => c.publicId !== u.cohortPublicId).map((c) => (
                          <option key={c.publicId} value={c.publicId}>{c.name}</option>
                        ))}
                      </select>
                      {u.cohortName && (
                        <p className="text-xs text-gray-500">
                          Their attendance and submissions in {u.cohortName} are kept. In the new cohort, attendance and
                          assignment rates count from today.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit" disabled={!moveTarget || busyId === u.publicId}
                          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {busyId === u.publicId ? "Saving…" : u.cohortName ? "Move student" : "Add to cohort"}
                        </button>
                        <button type="button" onClick={() => setMovingId(null)} className="border border-gray-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-white">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
