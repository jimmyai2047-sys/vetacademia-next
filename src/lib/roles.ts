// Central definition of VetAcademia user roles.
//
// The legacy model had three roles: STUDENT, FARMER, EXPERT.
// We now distinguish:
//  - STUDENT            (exam/syllabus learners)
//  - ANIMAL_OWNER        (was FARMER: livestock / pet owners)
//  - GUEST               (read-only browsing account)
//  - EXPERT              (split into 3 groups, all treated identically as "expert"):
//      • Faculty                       (teaching associates / professors)
//      • Agricultural Research Scientist (scientists)
//      • Field Veterinarian            (veterinary officers / directors)
//
// `User.role` is a plain String (no DB enum), so the role values below are the
// exact strings persisted on the user row.

export const STUDENT = "STUDENT";
export const ANIMAL_OWNER = "ANIMAL_OWNER";
export const ADMIN = "ADMIN";
export const GUEST = "GUEST";

export const FACULTY_ROLES = [
  "TEACHING_ASSOCIATE",
  "ASSISTANT_PROFESSOR",
  "ASSOCIATE_PROFESSOR",
  "PROFESSOR",
] as const;

export const ARS_ROLES = [
  "SCIENTIST",
  "SENIOR_SCIENTIST",
  "PRINCIPAL_SCIENTIST",
] as const;

export const FIELD_VET_ROLES = [
  "VETERINARY_OFFICER",
  "SENIOR_VETERINARY_OFFICER",
  "DEPUTY_DIRECTOR",
  "JOINT_DIRECTOR",
  "ADDITIONAL_DIRECTOR",
  "DIRECTOR",
] as const;

export const EXPERT_ROLES: readonly string[] = [
  ...FACULTY_ROLES,
  ...ARS_ROLES,
  ...FIELD_VET_ROLES,
];

export const ALL_ROLES: readonly string[] = [
  STUDENT,
  ANIMAL_OWNER,
  ADMIN,
  GUEST,
  ...EXPERT_ROLES,
];

export type RoleGroup =
  | "STUDENT"
  | "ANIMAL_OWNER"
  | "FACULTY"
  | "ARS"
  | "FIELD_VET"
  | "ADMIN"
  | "GUEST";

// Expert designation groups shown in the signup / admin UI.
export const EXPERT_ROLE_GROUPS: { label: string; roles: readonly string[] }[] = [
  { label: "Faculty", roles: FACULTY_ROLES },
  { label: "Agricultural Research Scientist", roles: ARS_ROLES },
  { label: "Field Veterinarian", roles: FIELD_VET_ROLES },
];

export const EXPERT_ROLE_LABELS: Record<string, string> = {
  TEACHING_ASSOCIATE: "Teaching Associate",
  ASSISTANT_PROFESSOR: "Assistant Professor",
  ASSOCIATE_PROFESSOR: "Associate Professor",
  PROFESSOR: "Professor",
  SCIENTIST: "Scientist",
  SENIOR_SCIENTIST: "Senior Scientist",
  PRINCIPAL_SCIENTIST: "Principal Scientist",
  VETERINARY_OFFICER: "Veterinary Officer",
  SENIOR_VETERINARY_OFFICER: "Senior Veterinary Officer",
  DEPUTY_DIRECTOR: "Deputy Director",
  JOINT_DIRECTOR: "Joint Director",
  ADDITIONAL_DIRECTOR: "Additional Director",
  DIRECTOR: "Director",
};

export function isExpertRole(role: string | undefined | null): boolean {
  return !!role && (EXPERT_ROLES as readonly string[]).includes(role);
}

export function isStudentRole(role: string | undefined | null): boolean {
  return role === STUDENT;
}

export function isAnimalOwnerRole(role: string | undefined | null): boolean {
  return role === ANIMAL_OWNER;
}

export function isAdminRole(role: string | undefined | null): boolean {
  return role === ADMIN;
}

export function isGuestRole(role: string | undefined | null): boolean {
  return role === GUEST;
}

// Maps any specific role to its high-level group. Used for role-scoped
// community links and aggregated admin counts.
export function roleGroup(role: string | undefined | null): RoleGroup {
  if (isAdminRole(role)) return "ADMIN";
  if (isGuestRole(role)) return "GUEST";
  if (isStudentRole(role)) return "STUDENT";
  if (isAnimalOwnerRole(role)) return "ANIMAL_OWNER";
  if ((FACULTY_ROLES as readonly string[]).includes(role as string)) return "FACULTY";
  if ((ARS_ROLES as readonly string[]).includes(role as string)) return "ARS";
  if ((FIELD_VET_ROLES as readonly string[]).includes(role as string)) return "FIELD_VET";
  return "GUEST";
}

export function roleLabel(role: string | undefined | null): string {
  if (!role) return "User";
  if (isExpertRole(role)) return EXPERT_ROLE_LABELS[role] ?? role;
  switch (role) {
    case STUDENT:
      return "Student";
    case ANIMAL_OWNER:
      return "Animal Owner";
    case ADMIN:
      return "Admin";
    case GUEST:
      return "Guest";
    default:
      return role;
  }
}
