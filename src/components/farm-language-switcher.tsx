"use client";

import { Languages, Loader2 } from "lucide-react";
import { FARMER_LANGS, type FarmerLang } from "@/dictionaries/farmer-languages";
import { useFarmLanguage } from "./farm-language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FarmLanguageSwitcher({
  compact = false,
  tone = "dark",
}: {
  compact?: boolean;
  /** dark = on gradient header (white text), light = on page background */
  tone?: "dark" | "light";
}) {
  const { lang, dict, switching, setLang } = useFarmLanguage();
  const active = FARMER_LANGS.find((l) => l.code === lang);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={lang}
        onValueChange={(v) => {
          if (v !== lang) setLang(v as FarmerLang);
        }}
        disabled={switching}
      >
        <SelectTrigger
          size="sm"
          aria-label={dict.langLabel}
          className={
            tone === "dark"
              ? "h-9 gap-1.5 rounded-full border-white/25 bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:border-white/40 focus-visible:ring-white/30 [&_svg]:text-white/80"
              : "h-9 gap-1.5 rounded-full border-emerald-600/25 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }
        >
          {switching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Languages className="h-3.5 w-3.5" />
          )}
          <SelectValue placeholder={active?.label ?? "हिन्दी"} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {FARMER_LANGS.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              <span className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-xs font-bold text-emerald-700">
                  {l.short}
                </span>
                {l.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && (
        <span
          className={
            tone === "dark"
              ? "hidden text-xs text-white/70 sm:inline"
              : "hidden text-xs text-muted-foreground sm:inline"
          }
        >
          {switching ? "..." : dict.langLabel}
        </span>
      )}
    </div>
  );
}
