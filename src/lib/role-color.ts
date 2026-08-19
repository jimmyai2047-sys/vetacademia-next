import { EXPERT_ROLES, ANIMAL_OWNER, GUEST, ADMIN, STUDENT, isExpertRole } from "@/lib/roles";

export function roleColor(role: string): string {
  if (isExpertRole(role))
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  switch (role) {
    case ADMIN:
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case STUDENT:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case ANIMAL_OWNER:
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case GUEST:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}
