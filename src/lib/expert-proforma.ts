import { z } from "zod";

// Diverse expert fields the proforma is circulated to. Free text is still
// allowed (fieldCategory is optional) so new disciplines fit without a deploy.
export const EXPERT_FIELD_CATEGORIES = [
  "Veterinary Anatomy",
  "Veterinary Physiology",
  "Veterinary Biochemistry",
  "Veterinary Pharmacology & Toxicology",
  "Veterinary Parasitology",
  "Veterinary Microbiology",
  "Veterinary Pathology",
  "Animal Nutrition",
  "Animal Genetics & Breeding",
  "Livestock Production Management",
  "Livestock Products Technology",
  "Veterinary Gynaecology & Obstetrics",
  "Veterinary Surgery & Radiology",
  "Veterinary Medicine",
  "Veterinary Public Health & Epidemiology",
  "Veterinary Extension Education",
  "Poultry Science",
  "Fisheries Science",
  "Wildlife & Zoo Animals",
  "Other / Allied Field",
] as const;

const currentYear = new Date().getFullYear();

export const qualificationSchema = z.object({
  degree: z.string().trim().min(2, "Qualification is required").max(150),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Year must be a 4-digit year")
    .refine(
      (y) => Number(y) >= 1950 && Number(y) <= currentYear,
      `Year must be between 1950 and ${currentYear}`
    ),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
});

// Full public proforma circulated to experts of different fields.
export const expertProformaSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(100),
  designation: z
    .string()
    .trim()
    .min(2, "Designation is required (e.g. Professor & Head)")
    .max(150),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dob: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .refine((d) => {
      const dt = new Date(d + "T00:00:00Z");
      if (Number.isNaN(dt.getTime())) return false;
      const now = new Date();
      const earliest = new Date("1940-01-01T00:00:00Z");
      return dt <= now && dt >= earliest;
    }, "Enter a valid past date of birth")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid contact number")
    .max(15)
    .regex(/^[+\d][\d\s-]{8,14}$/, "Enter a valid contact number"),
  presentPosting: z
    .string()
    .trim()
    .min(2, "Present posting place is required")
    .max(250),
  specialization: z
    .string()
    .trim()
    .min(2, "Specialization is required")
    .max(200),
  fieldCategory: z.string().trim().max(100).optional().or(z.literal("")),
  qualifications: z
    .array(qualificationSchema)
    .min(1, "Add at least one qualification with its year of completion")
    .max(10),
  experienceYears: z.coerce
    .number()
    .int()
    .min(0)
    .max(80)
    .optional(),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  awards: z.string().trim().max(2000).optional().or(z.literal("")),
  photoUrl: z.string().trim().url("Photo must be a valid URL").optional().or(z.literal("")),
  certificateUrl: z
    .string()
    .trim()
    .url("Certificate must be a valid URL")
    .optional()
    .or(z.literal("")),
  showContact: z.coerce.boolean().optional().default(false),
});

export type ExpertProformaInput = z.infer<typeof expertProformaSchema>;
export type ExpertQualificationInput = z.infer<typeof qualificationSchema>;

export function parseQualifications(raw: string | null): ExpertQualificationInput[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (q): q is ExpertQualificationInput =>
          typeof q === "object" &&
          q !== null &&
          typeof (q as { degree?: unknown }).degree === "string"
      )
      .map((q) => ({
        degree: String(q.degree),
        year: typeof q.year === "string" ? q.year : "",
        institution: typeof q.institution === "string" ? q.institution : "",
      }));
  } catch {
    return [];
  }
}

// Flat consultation fee (Rs) charged uniformly for every expert —
// not an hourly rate. Displayed on expert cards, profiles and booking.
export const EXPERT_CONSULTATION_FEE = 500;
export const EXPERT_CONSULTATION_FEE_LABEL = "Rs 500/- per consultation";

export function qualificationSummary(quals: ExpertQualificationInput[]): string {
  return quals.map((q) => (q.year ? `${q.degree} (${q.year})` : q.degree)).join(", ");
}
