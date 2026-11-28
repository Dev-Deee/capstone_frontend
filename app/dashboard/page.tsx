"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth-context";
import { getAccessToken } from "@/lib/api";

// /dashboard is where the installed app opens (manifest start_url): send the
// user on to their own home, or to sign in.
export default function DashboardIndex() {
  const { roles, platformAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(getAccessToken() ? homeFor(roles, platformAdmin) : "/login");
  }, [isLoading, roles, platformAdmin, router]);

  return <p className="p-6 text-sm text-gray-400 animate-pulse">Loading…</p>;
}
