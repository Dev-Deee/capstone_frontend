"use client";

import TabbedPage from "@/components/TabbedPage";
import CohortsSection from "@/components/sections/CohortsSection";
import SubjectsSection from "@/components/sections/SubjectsSection";

// Admins with MANAGE_COHORTS / MANAGE_SUBJECTS; the backend enforces each permission.
export default function AdminCohortsPage() {
  return (
    <TabbedPage
      title="Cohorts & Subjects"
      description="Create and rename cohorts and the subjects they study."
      tabs={[
        { id: "cohorts", label: "Cohorts", content: <CohortsSection /> },
        { id: "subjects", label: "Subjects", content: <SubjectsSection /> },
      ]}
    />
  );
}
