"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, getAccessToken, setTokens, clearTokens } from "./api";

interface AuthState {
  isAuthenticated: boolean;
  roles: string[];
  userPublicId: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Decodes the JWT payload client-side purely to read the roles claim for
// routing decisions — this is NOT a security boundary. The backend's own
// @PreAuthorize/AdminPermissionService checks are the real authorization;
// this only decides which dashboard the UI shows, nothing more.
function decodeRoles(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.roles || [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<string[]>([]);
  const [userPublicId, setUserPublicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setRoles(decodeRoles(token));
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserPublicId(payload.sub);
    }
    setIsLoading(false);
  }, []);

  async function login(identifier: string, password: string) {
    const response = await authApi.login(identifier, password);
    setTokens(response.accessToken, response.refreshToken);
    setRoles(response.roles);
    setUserPublicId(response.userPublicId);

    // Route to the right dashboard based on role — highest-privilege
    // role wins if the user holds several.
    if (response.roles.includes("SUPER_ADMIN")) router.push("/dashboard/super-admin");
    else if (response.roles.includes("ADMIN")) router.push("/dashboard/admin");
    else if (response.roles.includes("FACILITATOR")) router.push("/dashboard/facilitator");
    else router.push("/dashboard/student");
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
      router.push("/login");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: roles.length > 0,
        roles,
        userPublicId,
        isLoading,
        login,
        logout,
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
