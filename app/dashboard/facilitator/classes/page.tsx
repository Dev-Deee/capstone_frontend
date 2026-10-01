"use client";

import TabbedPage from "@/components/TabbedPage";
import MyStudentsSection from "@/components/sections/MyStudentsSection";
import FacilitatorAttendanceSection from "@/components/sections/FacilitatorAttendanceSection";
import FacilitatorCourseworkSection from "@/components/sections/FacilitatorCourseworkSection";

export default function FacilitatorClassesPage() {
  return (
    <TabbedPage
      title="My Classes"
      tabs={[
        { id: "students", label: "Students", content: <MyStudentsSection /> },
        { id: "attendance", label: "Attendance", content: <FacilitatorAttendanceSection /> },
        { id: "assignments", label: "Assignments", content: <FacilitatorCourseworkSection /> },
      ]}
    />
  );
}
