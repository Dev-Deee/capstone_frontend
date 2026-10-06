// The email / phone / password rules, mirrored from the backend
// (common/validation/ValidationPatterns.java) — change both together. The
// server is the real gate; these give instant feedback in forms.

export const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

// International (+ then 8–15 digits) or local (0 then 10–11 digits).
export const PHONE_RE = /^(?:\+[1-9][0-9]{7,14}|0[0-9]{9,10})$/;

export const EMAIL_MESSAGE = "Enter a valid email address, like name@example.com";
export const PHONE_MESSAGE =
  "Enter a valid phone number: international like +2348012345678, or local like 08012345678";
export const PASSWORD_MESSAGE =
  "Password must be 8–128 characters with an uppercase letter, a lowercase letter, a number and a symbol";

/** What people type → what the server accepts: spaces, dashes, brackets and dots removed. */
export function normalizePhone(value: string) {
  return value.trim().replace(/[\s().-]/g, "");
}

export function emailError(value: string): string | null {
  const v = value.trim();
  return v.length <= 254 && EMAIL_RE.test(v) ? null : EMAIL_MESSAGE;
}

/** Null when valid. Empty passes unless required. Pass the raw input — it's normalised here. */
export function phoneError(value: string, required = true): string | null {
  const v = normalizePhone(value);
  if (!v) return required ? "Phone number is required" : null;
  return PHONE_RE.test(v) ? null : PHONE_MESSAGE;
}

export const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "8 or more characters", test: (p) => p.length >= 8 && p.length <= 128 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /[0-9]/.test(p) },
  { label: "A symbol, like ! or -", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordError(value: string): string | null {
  return PASSWORD_RULES.every((r) => r.test(value)) ? null : PASSWORD_MESSAGE;
}
