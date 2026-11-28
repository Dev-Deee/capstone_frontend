"use client";

import { useEffect, useState } from "react";
import { authApi, userApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import PasswordChecklist from "@/components/PasswordChecklist";
import { passwordError } from "@/lib/validation";

const inputClass =
  "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500";

// The platform admin's own account: just their sign-in details and a password
// change. Deliberately none of the institution account settings (phone,
// cohort, devices…) — a platform admin belongs to no institution.
export default function PlatformAccountPage() {
  const { platformAdmin, logout } = useAuth();
  const [me, setMe] = useState<{ fullName: string; email: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (platformAdmin) userApi.getMe().then(setMe).catch(() => {}); }, [platformAdmin]);

  if (!platformAdmin) {
    return <div className="p-6"><PageHeader title="Account" description="This page is for Cadence platform admins." /></div>;
  }

  const mismatch = confirm.length > 0 && confirm !== newPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = passwordError(newPassword);
    if (invalid) { setError(invalid); return; }
    if (newPassword !== confirm) { setError("The new passwords don't match"); return; }
    if (newPassword === currentPassword) { setError("Choose a password different from your current one"); return; }
    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change your password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader eyebrow="Platform" title="Account" description="Your platform admin sign-in." />

      <div className="max-w-lg space-y-5">
        <section className="rounded-xl border border-gray-200 bg-surface p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Signed in as</h2>
          {me ? (
            <dl className="space-y-3">
              <div>
                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Name</dt>
                <dd className="text-sm text-gray-900">{me.fullName}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Email</dt>
                <dd className="text-sm text-gray-900">{me.email}</dd>
              </div>
            </dl>
          ) : <p className="text-sm text-gray-400">Loading…</p>}
        </section>

        <section className="rounded-xl border border-gray-200 bg-surface p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">Change password</h2>
          <p className="mb-5 text-sm text-gray-500">
            Changing it signs you out everywhere, this browser included. The change is recorded in the audit log.
          </p>

          {done ? (
            <div className="space-y-4">
              <div role="status" className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
                Password changed. Every session has been signed out — sign in again with your new password.
              </div>
              <button type="button" onClick={() => logout()}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                Sign in again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <div>
                <label htmlFor="current" className="mb-1.5 block text-xs font-medium text-gray-500">Current password</label>
                <input id="current" type={show ? "text" : "password"} required autoComplete="current-password"
                  value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="new" className="block text-xs font-medium text-gray-500">New password</label>
                  <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show}
                    className="rounded-md px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                    {show ? "Hide passwords" : "Show passwords"}
                  </button>
                </div>
                <input id="new" type={show ? "text" : "password"} required autoComplete="new-password" maxLength={128}
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                <PasswordChecklist password={newPassword} />
              </div>
              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-gray-500">Confirm new password</label>
                <input id="confirm" type={show ? "text" : "password"} required autoComplete="new-password" maxLength={128}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch}
                  className={`${inputClass} ${mismatch ? "border-red-300" : ""}`} />
                {mismatch && <p className="mt-1.5 text-xs text-red-600">Doesn&apos;t match the new password</p>}
              </div>
              <button type="submit" disabled={saving || !currentPassword || !newPassword || mismatch}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Updating…" : "Change password"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
