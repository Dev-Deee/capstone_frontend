"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi, inviteApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/marketing/Logo";

type Preview = Awaited<ReturnType<typeof inviteApi.preview>>;

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "a student", FACILITATOR: "a facilitator", ADMIN: "an admin", SUPER_ADMIN: "an owner",
};

const input =
  "w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 " +
  "transition-colors focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";

function AcceptInviteContent() {
  const token = useSearchParams().get("token");
  const { isAuthenticated, isLoading, enterSession, logout } = useAuth();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setLoadError("This link is missing its invite token. Please use the link from your invitation email."); return; }
    inviteApi.preview(token).then(setPreview)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "This invite link is invalid or has expired"));
  }, [token]);

  // Brand-new invitee: choosing a password creates the account and signs in.
  async function setPasswordAndJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      enterSession(await authApi.acceptInvite(token!, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't accept the invite");
      setSubmitting(false);
    }
  }

  // Existing account: accept while signed in as the invited address.
  async function acceptAsMember() {
    setError(null); setSubmitting(true);
    try {
      enterSession(await inviteApi.acceptAsMember(token!));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't accept the invite");
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <>
        <h1 className="font-display text-[34px] leading-tight text-gray-900">This invite can&rsquo;t be used</h1>
        <p className="mt-3 text-[15px] text-gray-500">{loadError}</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">Go to sign in</Link>
      </>
    );
  }
  if (!preview || isLoading) return <p className="text-sm text-gray-400 animate-pulse">Loading your invite…</p>;

  const here = `/accept-invite?token=${encodeURIComponent(token!)}`;

  return (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-blue-600">You&rsquo;re invited</p>
      <h1 className="mt-4 font-display text-[38px] leading-[1.08] text-gray-900">
        Join {preview.institutionName}
      </h1>
      <p className="mt-3 text-[15px] text-gray-500">
        as {ROLE_LABEL[preview.role] ?? preview.role.toLowerCase()} · <span className="text-gray-700">{preview.email}</span>
      </p>

      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</div>
      )}

      {preview.accountExists ? (
        <div className="mt-8 space-y-4">
          <p className="text-[15px] text-gray-600">
            You already have a Cadence account. Accept while signed in as <span className="font-medium text-gray-900">{preview.email}</span>,
            and {preview.institutionName} is added alongside your other institutions.
          </p>
          {isAuthenticated ? (
            <>
              <button onClick={acceptAsMember} disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-[15px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? "Joining…" : `Accept and open ${preview.institutionName}`}
              </button>
              <button onClick={() => logout(here)} className="w-full text-center text-sm text-gray-500 hover:text-gray-800">
                Not {preview.email}? Sign out and use that account
              </button>
            </>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(here)}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-[15px] font-medium text-white hover:bg-blue-700">
              Sign in to accept
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={setPasswordAndJoin} className="mt-8 space-y-4">
          <p className="text-[15px] text-gray-600">
            {preview.firstName ? `Welcome, ${preview.firstName}. ` : ""}Choose a password to create your account.
          </p>
          <div className="relative">
            <label htmlFor="pw" className="sr-only">Password</label>
            <input id="pw" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={`${input} pr-16`} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button type="submit" disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-[15px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "Creating your account…" : "Create account and join"}
          </button>
        </form>
      )}
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-6"><Logo /></header>
      <main className="mx-auto max-w-md px-6 pb-24 pt-10 rise-in">
        <Suspense fallback={<p className="text-sm text-gray-400">Loading…</p>}>
          <AcceptInviteContent />
        </Suspense>
      </main>
    </div>
  );
}
