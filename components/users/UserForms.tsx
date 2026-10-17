"use client";

import { useState } from "react";
import { authApi, cohortApi, userApi } from "@/lib/api";
import { emailError, normalizePhone, phoneError } from "@/lib/validation";

// The person-management forms, shared by the Users list (row menu) and a
// person's own page. Each calls the API itself and reports back through
// onSaved(updatedUser, message); failures show inline.

export type ManagedUser = {
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
  profileImageUrl?: string | null;
};

type Saved = (updated: ManagedUser, message: string) => void;

export const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500";
const primary = "bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50";
const secondary = "border border-gray-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50";
const panel = "space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4";

export const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student", FACILITATOR: "Facilitator", ADMIN: "Admin", SUPER_ADMIN: "Super admin",
};

export function UserStatusBadge({ user }: { user: ManagedUser }) {
  const [label, cls] = !user.active
    ? ["Suspended here", "bg-red-100 text-red-700"]
    : user.accountPending
      ? ["Invite pending", "bg-amber-100 text-amber-700"]
      : ["Active", "bg-green-100 text-green-700"];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

// What the viewer may do to this person. Admins (MANAGE_USERS) manage students
// and facilitators; only a super admin manages admin accounts. The backend
// enforces the same rules — this only decides what to offer.
export function permissionsFor(user: ManagedUser, viewerIsSuperAdmin: boolean, meId: string | null) {
  const isSelf = user.publicId === meId;
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  const isStaffAdmin = isSuperAdmin || user.roles.includes("ADMIN");
  const canEdit = viewerIsSuperAdmin || !isStaffAdmin;
  return {
    isSelf,
    canEdit,
    canRoles: viewerIsSuperAdmin,
    canMove: canEdit && user.roles.includes("STUDENT"),
    canChangeStatus: canEdit && !isSelf && (!isSuperAdmin || viewerIsSuperAdmin),
  };
}

function ErrorLine({ error }: { error: string | null }) {
  return error ? <p className="text-sm text-red-600">{error}</p> : null;
}

const errText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function EditUserForm({ user, onSaved, onCancel }: { user: ManagedUser; onSaved: Saved; onCancel: () => void }) {
  const [form, setForm] = useState({
    firstName: user.firstName ?? "", middleName: user.middleName ?? "", lastName: user.lastName ?? "",
    email: user.email ?? "", phoneNumber: user.phoneNumber ?? "", institutionStudentId: user.institutionStudentId ?? "",
    emailReason: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailChanged = form.email.trim().toLowerCase() !== (user.email ?? "").toLowerCase();
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = emailError(form.email) ?? phoneError(form.phoneNumber, false);
    if (invalid) { setError(invalid); return; }
    setSaving(true);
    try {
      let updated: ManagedUser = await userApi.update(user.publicId, {
        firstName: form.firstName, middleName: form.middleName, lastName: form.lastName,
        phoneNumber: normalizePhone(form.phoneNumber), institutionStudentId: form.institutionStudentId,
      });
      if (emailChanged) {
        await authApi.adminChangeEmail(user.publicId, form.email.trim(), form.emailReason);
        updated = { ...updated, email: form.email.trim() };
      }
      onSaved(updated, emailChanged
        ? `${updated.fullName} updated. Their email changed, so they've been signed out everywhere.`
        : `${updated.fullName} updated.`);
    } catch (err) {
      setError(errText(err, "Failed to update user"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className={panel}>
      <p className="text-sm font-medium text-gray-900">Edit {user.fullName}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-gray-500">First name<input required className={`${inputClass} mt-1`} {...field("firstName")} /></label>
        <label className="text-xs text-gray-500">Middle name<input className={`${inputClass} mt-1`} {...field("middleName")} /></label>
        <label className="text-xs text-gray-500">Last name<input required className={`${inputClass} mt-1`} {...field("lastName")} /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-gray-500">Email<input type="email" required className={`${inputClass} mt-1`} {...field("email")} /></label>
        <label className="text-xs text-gray-500">Phone<input type="tel" placeholder="08012345678 or +234…" className={`${inputClass} mt-1`} {...field("phoneNumber")} /></label>
        <label className="text-xs text-gray-500">Institution student ID<input className={`${inputClass} mt-1`} {...field("institutionStudentId")} /></label>
      </div>
      {emailChanged && (
        <label className="block text-xs text-gray-500">
          Reason for email change (kept in the audit log — the user will be signed out)
          <input required className={`${inputClass} mt-1`} {...field("emailReason")} />
        </label>
      )}
      <ErrorLine error={error} />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={primary}>{saving ? "Saving…" : "Save changes"}</button>
        <button type="button" onClick={onCancel} className={secondary}>Cancel</button>
      </div>
    </form>
  );
}

// Owners only. The backend refuses to remove the institution's last super admin and says so.
export function RolesForm({ user, onSaved, onCancel }: { user: ManagedUser; onSaved: Saved; onCancel: () => void }) {
  const [draft, setDraft] = useState<string[]>(user.roles);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated: ManagedUser = await userApi.updateRoles(user.publicId, draft);
      onSaved(updated, `${user.fullName}'s roles updated.`);
    } catch (err) {
      setError(errText(err, "Failed to update roles"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={panel}>
      <p className="text-sm text-gray-700">Roles for <span className="font-medium">{user.fullName}</span> in this institution</p>
      <div className="flex flex-wrap gap-4">
        {[["STUDENT", "Student"], ["FACILITATOR", "Facilitator"], ["ADMIN", "Admin"], ["SUPER_ADMIN", "Super admin (owner)"]].map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={draft.includes(value)}
              onChange={(e) => setDraft((d) => (e.target.checked ? [...d, value] : d.filter((r) => r !== value)))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            {label}
          </label>
        ))}
      </div>
      <ErrorLine error={error} />
      <div className="flex gap-2">
        <button disabled={draft.length === 0 || saving} onClick={save} className={primary}>{saving ? "Saving…" : "Save roles"}</button>
        <button onClick={onCancel} className={secondary}>Cancel</button>
      </div>
    </div>
  );
}

// Admin/super-admin only: students can't move themselves between cohorts.
export function MoveCohortForm({ user, cohorts, onSaved, onCancel }: {
  user: ManagedUser;
  cohorts: { publicId: string; name: string }[];
  onSaved: Saved;
  onCancel: () => void;
}) {
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      const updated: ManagedUser = await cohortApi.enrollStudent(target, user.publicId);
      onSaved(updated, user.cohortName
        ? `${user.fullName} moved from ${user.cohortName} to ${updated.cohortName}.`
        : `${user.fullName} added to ${updated.cohortName}.`);
    } catch (err) {
      setError(errText(err, "Failed to change cohort"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className={panel}>
      <p className="text-sm text-gray-700">
        {user.cohortName
          ? <>Move <span className="font-medium">{user.fullName}</span> out of <span className="font-medium">{user.cohortName}</span> to:</>
          : <>Add <span className="font-medium">{user.fullName}</span> to:</>}
      </p>
      <select required value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
        <option value="">Select a cohort…</option>
        {cohorts.filter((c) => c.publicId !== user.cohortPublicId).map((c) => (
          <option key={c.publicId} value={c.publicId}>{c.name}</option>
        ))}
      </select>
      {user.cohortName && (
        <p className="text-xs text-gray-500">
          Their attendance and submissions in {user.cohortName} are kept. In the new cohort, attendance and
          assignment rates count from today.
        </p>
      )}
      <ErrorLine error={error} />
      <div className="flex gap-2">
        <button type="submit" disabled={!target || saving} className={primary}>
          {saving ? "Saving…" : user.cohortName ? "Move student" : "Add to cohort"}
        </button>
        <button type="button" onClick={onCancel} className={secondary}>Cancel</button>
      </div>
    </form>
  );
}

export function ConfirmRemove({ user, onRemoved, onCancel }: {
  user: ManagedUser;
  onRemoved: (message: string) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await userApi.remove(user.publicId);
      onRemoved(`${user.fullName} was removed from this institution. Their account and history are kept.`);
    } catch (err) {
      setError(errText(err, "Failed to delete user"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-red-100 bg-red-50 p-4">
      <p className="text-sm text-red-700">
        Remove {user.firstName} from this institution? Their account and any other institutions are unaffected.
      </p>
      <ErrorLine error={error} />
      <div className="flex gap-2">
        <button disabled={busy} onClick={remove} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
          {busy ? "Removing…" : "Remove"}
        </button>
        <button onClick={onCancel} className={secondary}>Cancel</button>
      </div>
    </div>
  );
}

// Suspend / restore here — returns the updated user and the message to show.
export async function toggleActive(user: ManagedUser): Promise<[ManagedUser, string]> {
  const updated: ManagedUser = user.active ? await userApi.deactivate(user.publicId) : await userApi.activate(user.publicId);
  return [updated, updated.active
    ? `${user.fullName}'s access here is restored.`
    : `${user.fullName} is suspended from this institution and signed out of it. Their other institutions aren't affected.`];
}
