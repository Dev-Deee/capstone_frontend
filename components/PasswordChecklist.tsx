"use client";

import { PASSWORD_RULES } from "@/lib/validation";

// The password rules, ticked off live under a new-password field.
export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 ${ok ? "text-green-700" : "text-gray-400"}`}>
            <span aria-hidden="true" className="w-3 text-center">{ok ? "✓" : "•"}</span>
            {rule.label}
            <span className="sr-only">{ok ? " — met" : " — not yet"}</span>
          </li>
        );
      })}
    </ul>
  );
}
