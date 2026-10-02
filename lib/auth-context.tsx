"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, getAccessToken, setTokens, clearTokens, type AuthResponse } from "./api";

interface AuthState {
  isAuthenticated: boolean;
  roles: string[];
  userPublicId: string | null;
  // Multi-tenant: the institution this session acts in, and platform-admin status.
  institutionPublicId: string | null;
  platformAdmin: boolean;
  isLoading: boolean;
  // next: an in-app path to return to after signing in (e.g. an invite link).
  login: (identifier: string, password: string, next?: string) => Promise<void>;
  logout: () => Promise<void>;
  // Adopt a session returned by sign-up, invite acceptance or an institution switch.
  enterSession: (response: AuthResponse, next?: string) => void;
  switchInstitution: (institutionPublicId: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Decodes the JWT payload client-side purely for routing decisions — this is
// NOT a security boundary. The backend re-checks the caller's membership and
// roles on every request; this only decides which dashboard the UI shows.
function decode(token: string): { sub?: string; roles?: string[]; inst?: string | null; pa?: boolean } {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

// Highest-privilege role wins if the user holds several in this institution.
export function homeFor(roles: string[], platformAdmin = false): string {
  if (roles.includes("SUPER_ADMIN")) return "/dashboard/super-admin";
  if (roles.includes("ADMIN")) return "/dashboard/admin";
  if (roles.includes("FACILITATOR")) return "/dashboard/facilitator";
  if (roles.includes("STUDENT")) return "/dashboard/student";
  return platformAdmin ? "/dashboard/platform" : "/login";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<string[]>([]);
  const [userPublicId, setUserPublicId] = useState<string | null>(null);
  const [institutionPublicId, setInstitutionPublicId] = useState<string | null>(null);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  function adoptToken(token: string) {
    const claims = decode(token);
    setRoles(claims.roles || []);
    setUserPublicId(claims.sub || null);
    setInstitutionPublicId(claims.inst || null);
    setPlatformAdmin(Boolean(claims.pa));
    setHasToken(true);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (token) adoptToken(token);
    setIsLoading(false);
  }, []);

  function enterSession(response: AuthResponse, next?: string) {
    setTokens(response.accessToken, response.refreshToken);
    adoptToken(response.accessToken);
    // Only same-site paths — never an open redirect to another origin.
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    router.push(safeNext ?? homeFor(response.roles, response.platformAdmin));
  }

  async function login(identifier: string, password: string, next?: string) {
    enterSession(await authApi.login(identifier, password), next);
  }

  async function switchInstitution(target: string) {
    enterSession(await authApi.switchInstitution(target));
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Server unreachable or session already gone — signing out locally must
      // still succeed. The refresh token simply expires server-side.
    } finally {
      clearTokens();
      setRoles([]);
      setUserPublicId(null);
      setInstitutionPublicId(null);
      setPlatformAdmin(false);
      setHasToken(false);
      router.push("/login");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: hasToken,
        roles,
        userPublicId,
        institutionPublicId,
        platformAdmin,
        isLoading,
        login,
        logout,
        enterSession,
        switchInstitution,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
