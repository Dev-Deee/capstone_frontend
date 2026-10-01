const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// --- Token storage ---
// Deliberately localStorage, not httpOnly cookies — this is a demo/test
// frontend, not a hardened production app. A real production build would
// move to httpOnly cookies to protect against XSS token theft; noted here
// rather than silently implied to be production-grade.
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cadence_access_token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("cadence_access_token", accessToken);
  localStorage.setItem("cadence_refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("cadence_access_token");
  localStorage.removeItem("cadence_refresh_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cadence_refresh_token");
}

// --- Core request wrapper ---
async function request<T>(
    path: string,
    options: RequestInit = {},
    auth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 || res.status === 403 && auth) {
    // Access token likely expired — try refreshing once before giving up.
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          setTokens(refreshed.accessToken, refreshed.refreshToken);
          // Retry the original request with the new token.
          headers["Authorization"] = `Bearer ${refreshed.accessToken}`;
          res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        } else {
          clearTokens();
          if (typeof window !== "undefined") window.location.href = "/login";
          throw new Error("Session expired");
        }
      } catch {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new Error("Session expired");
      }
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204 || res.status === 201) {
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  return res.json();
}

// --- Auth ---
export interface AuthResponse {
  userPublicId: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
}

export const authApi = {
  adminChangeEmail: (targetUserPublicId: string, newEmail: string, reason: string) =>
    request<void>(`/api/auth/${targetUserPublicId}/email`, { method: "PATCH", body: JSON.stringify({ newEmail, reason }) }),
  login: (identifier: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }, false),

  register: (data: {
    inviteCode: string; firstName: string; middleName?: string; lastName: string;
    email: string; phoneNumber: string; institutionStudentId?: string;
    password: string; consentGiven: boolean;
  }) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }, false),

  acceptInvite: (token: string, password: string) =>
    request<void>("/api/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }, false),

  logout: () =>
    request<void>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify(getRefreshToken()),
    }),

  verifyEmail: (token: string) =>
    request<void>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
    }, false),

  getDevices: () => request<any[]>("/api/auth/devices"),
  forgotPassword: (email: string) =>
    request<void>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }, false),
  resetPassword: (token: string, newPassword: string) =>
    request<void>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) }, false),
  sendEmailCode: (email: string) =>
    request<void>("/api/auth/send-email-code", { method: "POST", body: JSON.stringify({ email }) }, false),
  verifyEmailCode: (email: string, code: string) =>
    request<void>("/api/auth/verify-email-code", { method: "POST", body: JSON.stringify({ email, code }) }, false),
  sendPhoneOtp: () =>
    request<void>("/api/auth/send-phone-otp", { method: "POST" }),
  verifyPhoneOtp: (code: string) =>
    request<void>("/api/auth/verify-phone-otp", { method: "POST", body: JSON.stringify({ code }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  revokeDevice: (publicId: string) =>
    request<void>(`/api/auth/devices/${publicId}`, { method: "DELETE" }),
};

// --- Users ---
export const userApi = {
  getAll: () => request<any[]>("/api/users"),
  update: (publicId: string, data: {
    firstName: string; middleName?: string; lastName: string; phoneNumber?: string; institutionStudentId?: string;
  }) => request<any>(`/api/users/${publicId}`, { method: "PATCH", body: JSON.stringify(data) }),
  activate: (publicId: string) => request<any>(`/api/users/${publicId}/activate`, { method: "PATCH" }),
  deactivate: (publicId: string) => request<any>(`/api/users/${publicId}/deactivate`, { method: "PATCH" }),
  remove: (publicId: string) => request<void>(`/api/users/${publicId}`, { method: "DELETE" }),
  getMyStudents: () => request<any[]>("/api/users/my-students"),
  getFacilitators: () => request<any[]>("/api/users/facilitators"),
  getMe: () => request<any>("/api/users/me"),
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getAccessToken();
    return fetch(`${API_BASE}/api/users/me/profile-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },
};

// --- Institutions ---
export const institutionApi = {
  getAll: () => request<any[]>("/api/institutions"),
  getOne: (publicId: string) => request<any>(`/api/institutions/${publicId}`),
};

// --- Cohorts ---
export const cohortApi = {
  create: (data: { name: string; startDate: string; endDate: string }) =>
      request<any>("/api/cohorts", { method: "POST", body: JSON.stringify(data) }),
  update: (publicId: string, data: { name: string }) =>
      request<any>(`/api/cohorts/${publicId}`, { method: "PATCH", body: JSON.stringify(data) }),
  getAll: () => request<any[]>("/api/cohorts"),
  getOne: (publicId: string) => request<any>(`/api/cohorts/${publicId}`),
  createInviteCode: (data: { cohortPublicId: string; maxUses?: number; expiresInDays?: number }) =>
      request<any>("/api/cohorts/invite-codes", { method: "POST", body: JSON.stringify(data) }),
  enrollStudent: (cohortPublicId: string, studentPublicId: string) =>
      request<void>(`/api/cohorts/${cohortPublicId}/enrollments`, { method: "POST", body: JSON.stringify({ studentPublicId }) }),
  listInviteCodes: (cohortPublicId: string) => request<Array<{
    publicId: string; code: string; cohortPublicId: string; expiresAt: string | null;
    maxUses: number; useCount: number; valid: boolean; createdAt: string;
  }>>(`/api/cohorts/${cohortPublicId}/invite-codes`),
  sendInviteCode: (inviteCodePublicId: string, data: { emails: string[]; phoneNumbers: string[] }) =>
      request<{ emailsSent: number; smsSent: number }>(
        `/api/cohorts/invite-codes/${inviteCodePublicId}/send`, { method: "POST", body: JSON.stringify(data) }),
  join: (inviteCode: string) =>
      request<any>("/api/cohorts/join", { method: "POST", body: JSON.stringify({ inviteCode }) }),
};

// --- Subjects ---
export const subjectApi = {
  create: (data: { name: string; description?: string }) =>
      request<any>("/api/subjects", { method: "POST", body: JSON.stringify(data) }),
  update: (publicId: string, data: { name: string }) =>
      request<any>(`/api/subjects/${publicId}`, { method: "PATCH", body: JSON.stringify(data) }),
  getAll: () => request<any[]>("/api/subjects"),
};;

// --- Facilitator Assignments ---
export const facilitatorCohortApi = {
  assign: (data: { facilitatorPublicId: string; cohortPublicId: string; subjectPublicId: string }) =>
    request<any>("/api/facilitator-cohorts", { method: "POST", body: JSON.stringify(data) }),
  getMine: () => request<any[]>("/api/facilitator-cohorts/me"),
};

// --- Admin Roles ---
export const adminRoleApi = {
  update: (publicId: string, data: any) =>
    request<any>(`/api/admin-roles/${publicId}`, { method: "PATCH", body: JSON.stringify(data) }),
  getAll: () => request<any[]>("/api/admin-roles"),
  create: (data: { name: string; description?: string; permissions: string[] }) =>
    request<any>("/api/admin-roles", { method: "POST", body: JSON.stringify(data) }),
  assign: (data: { userPublicId: string; adminRolePublicId: string; cohortPublicId?: string }) =>
    request<void>("/api/admin-roles/assign", { method: "POST", body: JSON.stringify(data) }),
};

// --- Staff Invites ---
export const staffInviteApi = {
  create: (data: {
    firstName: string; middleName?: string; lastName: string; email: string;
    phoneNumber: string; targetRole: "FACILITATOR" | "ADMIN";
    adminRolePublicId?: string; cohortPublicId?: string;
  }) => request<void>("/api/auth/staff-invites", { method: "POST", body: JSON.stringify(data) }),
};

// --- Class Sessions & Attendance (Tier 2) ---
export const sessionApi = {
  open: (data: { cohortPublicId: string; subjectPublicId: string; expiryMinutes: number }) =>
    request<any>("/api/sessions", { method: "POST", body: JSON.stringify(data) }),
  close: (publicId: string) =>
    request<any>(`/api/sessions/${publicId}/close`, { method: "PATCH" }),
  getByQrToken: (qrToken: string) =>
    request<{ sessionPublicId: string; cohortName: string; subjectName: string; isOpen: boolean }>(
      `/api/sessions/qr/${qrToken}`, {}, false
    ),
  getCurrentCode: (publicId: string) =>
    request<{ code: string; secondsRemaining: number }>(`/api/sessions/${publicId}/current-code`),
  list: (cohortPublicId: string, subjectPublicId: string) =>
    request<any[]>(`/api/sessions?cohortPublicId=${cohortPublicId}&subjectPublicId=${subjectPublicId}`),
  getAttendance: (publicId: string) =>
    request<any[]>(`/api/sessions/${publicId}/attendance`),
};

export const attendanceApi = {
  mark: (sessionCode: string) =>
    request<any>("/api/attendance", { method: "POST", body: JSON.stringify({ sessionCode }) }),
};

export const studentAttendanceApi = {
  getSummary: () => request<{
    totalDays: number; daysPresent: number; daysAbsent: number;
    percentPresent: number; cohortName: string;
  }>("/api/resumption-attendance/me/summary"),
  getHistory: () => request<Array<{
    sessionPublicId: string; date: string; status: string; checkedInAt: string | null;
  }>>("/api/resumption-attendance/me/history"),
};

// --- Resumption Sessions & Attendance (Tier 1) ---
export const resumptionApi = {
  open: (data: { cohortPublicId: string; expiryMinutes: number }) =>
    request<any>("/api/resumption-sessions", { method: "POST", body: JSON.stringify(data) }),
  getToday: () => request<any[]>("/api/resumption-sessions/today"),
  getTodayMine: () => request<any[]>("/api/resumption-sessions/today/mine"),
  getByQrToken: (qrToken: string) =>
    request<{ resumptionSessionPublicId: string; cohortName: string; isOpen: boolean }>(
      `/api/resumption-sessions/qr/${qrToken}`, {}, false
    ),
  regenerate: (publicId: string) =>
    request<any>(`/api/resumption-sessions/${publicId}/regenerate`, { method: "PATCH" }),
  close: (publicId: string) =>
    request<any>(`/api/resumption-sessions/${publicId}/close`, { method: "PATCH" }),
  adjustWindow: (publicId: string, newExpiresAt: string) =>
    request<any>(`/api/resumption-sessions/${publicId}/adjust-window`, {
      method: "PATCH",
      body: JSON.stringify({ newExpiresAt }),
    }),
  markAttendance: (resumptionCode: string) =>
    request<any>("/api/resumption-attendance", {
      method: "POST",
      body: JSON.stringify({ resumptionCode }),
    }),
  getCurrentCode: (publicId: string) =>
    request<{ code: string; secondsRemaining: number }>(`/api/resumption-sessions/${publicId}/current-code`),
  listByCohort: (cohortPublicId: string) =>
    request<any[]>(`/api/resumption-sessions?cohortPublicId=${cohortPublicId}`),
  getAttendance: (publicId: string) =>
    request<any[]>(`/api/resumption-sessions/${publicId}/attendance`),
};

// --- Admin Attendance Reporting ---
export const adminAttendanceApi = {
  getAllCohorts: () => request<Array<{
    cohortPublicId: string; cohortName: string; studentCount: number; averageRatePercent: number;
  }>>("/api/admin/attendance/cohorts"),
  getCohortSummary: (cohortPublicId: string) => request<Array<{
    studentPublicId: string; studentName: string; totalDays: number; present: number; absent: number; ratePercent: number;
  }>>(`/api/admin/attendance/cohorts/${cohortPublicId}/summary`),
};

// --- Assignments ---
export const assignmentApi = {
  create: (data: {
    cohortPublicId: string; subjectPublicId: string;
    title: string; description: string; deadline: string;
    maxResubmissions?: number;
  }) =>
    request<any>("/api/assignments", { method: "POST", body: JSON.stringify(data) }),
  publish: (publicId: string) =>
    request<any>(`/api/assignments/${publicId}/publish`, { method: "PATCH" }),
  close: (publicId: string) =>
    request<any>(`/api/assignments/${publicId}/close`, { method: "PATCH" }),
  getForCohort: (cohortPublicId: string) =>
    request<any[]>(`/api/assignments/cohort/${cohortPublicId}`),
  getOne: (publicId: string) =>
    request<any>(`/api/assignments/${publicId}`),
};

// --- Submissions ---
export const submissionApi = {
  submitLink: (submissionPublicId: string, linkUrl: string) =>
    request<any>(`/api/submissions/${submissionPublicId}/submit`, {
      method: "POST", body: JSON.stringify({ submissionType: "LINK", linkUrl }),
    }),
  submitFile: (submissionPublicId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("submissionType", "FILE");
    const token = getAccessToken();
    return fetch(`${API_BASE}/api/submissions/${submissionPublicId}/submit`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error("Submission failed");
      return res.json();
    });
  },
  getMine: () => request<any[]>("/api/submissions/mine"),
};

// --- Extension Requests ---
export const extensionRequestApi = {
  create: (submissionPublicId: string, data: { requestedNewDeadline: string; reason: string }) =>
      request<any>(`/api/submissions/${submissionPublicId}/extension-requests`, {
        method: "POST", body: JSON.stringify(data),
      }),
  getPending: () => request<any[]>("/api/extension-requests/pending"),
  review: (publicId: string, approve: boolean, reviewNote: string) =>
      request<any>(`/api/extension-requests/${publicId}/review`, {
        method: "PATCH", body: JSON.stringify({ approve, reviewNote }),
      }),
};
