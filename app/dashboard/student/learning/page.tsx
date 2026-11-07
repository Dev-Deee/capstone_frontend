"use client";

import TabbedPage from "@/components/TabbedPage";
import StudentAttendanceSection from "@/components/sections/StudentAttendanceSection";
import StudentAssignmentsSection from "@/components/sections/StudentAssignmentsSection";
import StudentMaterials from "@/components/courses/StudentMaterials";

export default function StudentLearningPage() {
  return (
    <TabbedPage
      title="My Learning"
      description="Your attendance, assignments and course materials, all in one place."
      tabs={[
        { id: "attendance", label: "Attendance", content: <StudentAttendanceSection /> },
        { id: "assignments", label: "Assignments", content: <StudentAssignmentsSection /> },
        { id: "materials", label: "Materials", content: <StudentMaterials /> },
      ]}
    />
  );
}
