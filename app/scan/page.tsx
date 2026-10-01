"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ScanRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    // Routing only — the QR never carried the actual credential (Section
    // 6.1's design). This just confirms the student scanned the right
    // session/resumption source before they're asked for the spoken code.
    router.push(`/dashboard/student?scannedToken=${token || ""}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Redirecting…</p>
    </div>
  );
}

export default function ScanLandingPage() {
  return (
    <Suspense>
      <ScanRedirect />
    </Suspense>
  );
}