"use client";

import TabbedPage from "@/components/TabbedPage";
import StudentAttendanceSection from "@/components/sections/StudentAttendanceSection";
import StudentAssignmentsSection from "@/components/sections/StudentAssignmentsSection";

export default function StudentLearningPage() {
  return (
    <TabbedPage
      title="My Learning"
      description="Your attendance record and assignments, all in one place."
      tabs={[
        { id: "attendance", label: "Attendance", content: <StudentAttendanceSection /> },
        { id: "assignments", label: "Assignments", content: <StudentAssignmentsSection /> },
      ]}
    />
  );
}
