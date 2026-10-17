"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { emailError } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // A format check reveals nothing about accounts; it just catches typos.
    const invalid = emailError(email);
    setFormatError(invalid);
    if (invalid) return;
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
    } finally {
      // Always show the same success state, whether or not the email
      // exists — matches the backend's enumeration-safe behavior.
      setSubmitted(true);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-surface p-8 rounded-lg shadow-sm border border-gray-200">
        {submitted ? (
          <>
            <p className="text-gray-900 font-medium">Check your email</p>
            <p className="text-sm text-gray-500 mt-1">
              If an account exists for that email, a reset link has been sent.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Reset your password</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="e.g. amara.okafor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {formatError && <p className="mt-1.5 text-sm text-red-600" role="alert">{formatError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
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
