const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", FACILITATOR: "Facilitator", STUDENT: "Student",
};

// The person's most senior role here (the API sends them most senior first).
export function roleLabel(roles: string[]) {
  return roles.length ? ROLE_LABEL[roles[0]] ?? roles[0] : "";
}
