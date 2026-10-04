"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in this link.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/login"), 2500);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Verification failed");
      });
  }, [searchParams, router]);

  return (
    <div className="w-full max-w-sm bg-surface p-8 rounded-lg shadow-sm border border-gray-200 text-center">
      {status === "verifying" && (
        <p className="text-gray-500 text-sm">Verifying your email…</p>
      )}

      {status === "success" && (
        <>
          <p className="text-gray-900 font-medium">Email verified.</p>
          <p className="text-sm text-gray-500 mt-1">Redirecting to sign in…</p>
        </>
      )}

      {status === "error" && (
        <>
          <p className="text-red-600 font-medium">Verification failed</p>
          <p className="text-sm text-gray-500 mt-1">{errorMessage}</p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<p className="text-gray-500 text-sm">Verifying your email…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}