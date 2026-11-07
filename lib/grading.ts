import type { GradingType } from "@/lib/api";

// A grade as people read it: "14 / 20", "70%", "Pass"; null when there is none.
export function gradeText(type: GradingType | undefined, maxMarks: number | null | undefined, score: number | null, passed: boolean | null) {
  if (type === "PASS_FAIL") return passed == null ? null : passed ? "Pass" : "Fail";
  if (type === "PERCENTAGE") return score == null ? null : `${Number(score)}%`;
  if (type === "MARKS") return score == null ? null : `${Number(score)} / ${maxMarks ?? 100}`;
  return null;
}
