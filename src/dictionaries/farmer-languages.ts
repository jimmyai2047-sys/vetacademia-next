// Language list + helpers for the Animal Owner (/farmers) section.
// Scope is intentionally limited to /farmers so exam-prep pages stay English.

export const FARMER_LANG_COOKIE = "va-farmer-lang";
export const FARMER_LANG_STORAGE = "va-farmer-lang";

export const FARMER_LANGS = [
  { code: "hi", label: "हिन्दी", short: "हिं" },
  { code: "en", label: "English", short: "EN" },
  { code: "mr", label: "मराठी", short: "म" },
  { code: "gu", label: "ગુજરાતી", short: "ગુ" },
  { code: "pa", label: "ਪੰਜਾਬੀ", short: "ਪੰ" },
  { code: "bn", label: "বাংলা", short: "বাং" },
  { code: "ta", label: "தமிழ்", short: "த" },
  { code: "te", label: "తెలుగు", short: "తె" },
  { code: "kn", label: "ಕನ್ನಡ", short: "ಕ" },
] as const;

export type FarmerLang = (typeof FARMER_LANGS)[number]["code"];

export const DEFAULT_FARMER_LANG: FarmerLang = "hi";

export function normalizeFarmerLang(v: unknown): FarmerLang {
  if (typeof v === "string") {
    const c = v.trim().toLowerCase().slice(0, 2);
    if ((FARMER_LANGS as readonly { code: string }[]).some((l) => l.code === c)) {
      return c as FarmerLang;
    }
  }
  return DEFAULT_FARMER_LANG;
}

// BCP-47 tag for the `lang` attribute + Gemini target names.
export const FARMER_LANG_LOCALE: Record<FarmerLang, string> = {
  hi: "hi-IN",
  en: "en-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
};

export const FARMER_LANG_NAME_EN: Record<FarmerLang, string> = {
  hi: "Hindi (Devanagari)",
  en: "English",
  mr: "Marathi (Devanagari)",
  gu: "Gujarati",
  pa: "Punjabi (Gurmukhi)",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
};
