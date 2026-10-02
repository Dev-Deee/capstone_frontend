"use client";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default function SuperAdminAnalyticsPage() {
  return <AnalyticsDashboard attendanceHref="/dashboard/admin/attendance" cohortHref={(id) => `/dashboard/super-admin/cohorts/${id}`} />;
}
