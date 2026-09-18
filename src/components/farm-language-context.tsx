"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  FARMER_LANG_COOKIE,
  FARMER_LANG_STORAGE,
  normalizeFarmerLang,
  type FarmerLang,
} from "@/dictionaries/farmer-languages";
import { getFarmerDict, type FarmerDict } from "@/dictionaries/farmers-ui";
import { getFarmerDict2, type FarmerDict2 } from "@/dictionaries/farmers-ui-2";
import { getFarmerDict3, type FarmerDict3 } from "@/dictionaries/farmers-ui-3";

export type FarmDict = FarmerDict & FarmerDict2 & FarmerDict3;

type FarmLangCtx = {
  lang: FarmerLang;
  dict: FarmDict;
  switching: boolean;
  setLang: (l: FarmerLang) => void;
};

const hiDict: FarmDict = { ...getFarmerDict("hi"), ...getFarmerDict2("hi"), ...getFarmerDict3("hi") };

const Ctx = createContext<FarmLangCtx>({
  lang: "hi",
  dict: hiDict,
  switching: false,
  setLang: () => {},
});

export function useFarmLanguage(): FarmLangCtx {
  return useContext(Ctx);
}

/**
 * Wraps the interactive /farmers UI. Server components render the first paint
 * with `initialLang` (read from cookie); this provider only keeps the value
 * for client components + persists user switches.
 */
export default function FarmLanguageProvider({
  initialLang,
  children,
}: {
  initialLang: FarmerLang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<FarmerLang>(() =>
    normalizeFarmerLang(initialLang)
  );
  const [switching, setSwitching] = useState(false);

  const setLang = useCallback((next: FarmerLang) => {
    const code = normalizeFarmerLang(next);
    try {
      localStorage.setItem(FARMER_LANG_STORAGE, code);
    } catch {
      /* storage unavailable — cookie is enough */
    }
    // 1-year cookie so the server renders the next visit in this language.
    document.cookie = `${FARMER_LANG_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setLangState(code);
    setSwitching(true);
    // Full reload lets the Server Component re-render chrome text in the new
    // language; DB content below swaps in via cached auto-translation.
    window.setTimeout(() => window.location.reload(), 120);
  }, []);

  const value = useMemo<FarmLangCtx>(
    () => ({
      lang,
      dict: { ...getFarmerDict(lang), ...getFarmerDict2(lang), ...getFarmerDict3(lang) },
      switching,
      setLang,
    }),
    [lang, switching, setLang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
