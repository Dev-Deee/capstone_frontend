"use client";

import TabbedPage from "@/components/TabbedPage";
import StudentAttendanceSection from "@/components/sections/StudentAttendanceSection";
import StudentAssignmentsSection from "@/components/sections/StudentAssignmentsSection";

export default function StudentLearningPage() {
  return (
    <TabbedPage
      title="My Learning"
      tabs={[
        { id: "attendance", label: "Attendance", content: <StudentAttendanceSection /> },
        { id: "assignments", label: "Assignments", content: <StudentAssignmentsSection /> },
      ]}
    />
  );
}
