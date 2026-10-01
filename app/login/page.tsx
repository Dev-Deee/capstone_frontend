"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-700 via-blue-500 to-indigo-400 px-4">

      {/* Blurred background blobs */}
      <div className="absolute top-[-80px] left-[-60px] w-[420px] h-[420px] rounded-full bg-blue-400/40 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-80px] w-[480px] h-[480px] rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-white/10 blur-2xl" />

      {/* Solid centered card */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl px-8 py-10">

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Cadence</h1>
        <p className="text-sm text-gray-500 mb-7">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email or phone number
            </label>
            <input
              type="text"
              required
              placeholder="name@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-16 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-gray-500">
            Forgot password?{" "}
            <Link href="/forgot-password" className="text-blue-600 font-medium hover:underline">
              Reset it
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            New student?{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:underline">
              Register with your invite code
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
