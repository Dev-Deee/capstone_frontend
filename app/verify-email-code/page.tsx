"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function VerifyEmailCodePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setIsSending(true);
    try {
      await authApi.sendEmailCode(email);
    } finally {
      // Always advance to step 2 regardless of whether the email exists —
      // enumeration-safe, same pattern as forgot-password.
      setCodeSent(true);
      setIsSending(false);
    }
  }

  async function handleResend() {
    setIsSending(true);
    setError(null);
    try {
      await authApi.sendEmailCode(email);
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);
    try {
      await authApi.verifyEmailCode(email, code);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setIsVerifying(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-900 font-medium">Email verified.</p>
          <p className="text-sm text-gray-500 mt-1">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-surface p-8 rounded-lg shadow-sm border border-gray-200">
        {!codeSent ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Verify your email</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email address and we'll send you a verification code.
            </p>
            <form onSubmit={handleSendCode} className="space-y-4">
              <input
                type="email"
                required
                placeholder="e.g. amara.okafor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSending ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Enter your code</h1>
            <p className="text-sm text-gray-500 mb-6">
              We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 tracking-widest text-center font-mono"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isVerifying ? "Verifying…" : "Verify"}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4 text-center">
              Didn't get it?{" "}
              <button
                onClick={handleResend}
                disabled={isSending}
                className="text-gray-900 font-medium hover:underline disabled:opacity-50"
              >
                {isSending ? "Sending…" : "Resend code"}
              </button>
            </p>
          </>
        )}

        <p className="text-sm text-gray-500 mt-6 text-center">
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
