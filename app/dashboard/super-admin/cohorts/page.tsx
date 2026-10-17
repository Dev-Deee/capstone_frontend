"use client";

import TabbedPage from "@/components/TabbedPage";
import CohortsSection from "@/components/sections/CohortsSection";
import SubjectsSection from "@/components/sections/SubjectsSection";
import FacilitatorAssignmentsSection from "@/components/sections/FacilitatorAssignmentsSection";

export default function CohortsAndSubjectsPage() {
  return (
    <TabbedPage
      title="Cohorts & Subjects"
      description="The structure of your programme: cohorts, what they study, and who teaches it."
      tabs={[
        { id: "cohorts", label: "Cohorts", content: <CohortsSection /> },
        { id: "subjects", label: "Subjects", content: <SubjectsSection /> },
        { id: "facilitators", label: "Facilitator Assignments", content: <FacilitatorAssignmentsSection /> },
      ]}
    />
  );
}
