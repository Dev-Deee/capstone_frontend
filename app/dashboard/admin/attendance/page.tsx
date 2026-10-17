"use client";

import TabbedPage from "@/components/TabbedPage";
import AttendanceOverviewSection from "@/components/sections/AttendanceOverviewSection";
import ResumptionTodaySection from "@/components/sections/ResumptionTodaySection";
import ResumptionHistorySection from "@/components/sections/ResumptionHistorySection";

export default function AdminAttendancePage() {
  return (
    <TabbedPage
      title="Attendance"
      description="Cohort attendance at a glance, today's campus resumption, and the record behind it."
      tabs={[
        { id: "overview", label: "Cohort Overview", content: <AttendanceOverviewSection /> },
        { id: "today", label: "Today's Resumption", content: <ResumptionTodaySection /> },
        { id: "history", label: "Resumption History", content: <ResumptionHistorySection /> },
      ]}
    />
  );
}
