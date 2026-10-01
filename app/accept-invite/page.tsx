"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (!urlToken) {
      setError("No invite token found in this link. Please use the link from your invitation email.");
    }
    setToken(urlToken);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.acceptInvite(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate account");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="text-gray-900 font-medium">Account activated.</p>
        <p className="text-sm text-gray-500 mt-1">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Activate your account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Choose a password to finish setting up your account.
      </p>

      {!token ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choose a password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="e.g. SecurePass123!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-900 px-1"
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Activating…" : "Activate account"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<p className="text-gray-500 text-sm">Loading…</p>}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}