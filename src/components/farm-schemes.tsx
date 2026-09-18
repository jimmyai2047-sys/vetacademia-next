"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, ExternalLink } from "lucide-react";
import { useFarmLanguage } from "@/components/farm-language-context";
import { FarmHtml, FarmText } from "@/components/farm-translated";

export type SchemeItem = {
  id: string;
  title: string;
  category: string;
  level: string;
  summary: string | null;
  details: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  lastDate: string | null;
};

const CATEGORY_LABEL: Record<string, { label: string; icon: string }> = {
  BIMA: { label: "Insurance", icon: "🛡" },
  SUBSIDY: { label: "Subsidy", icon: "💰" },
  LOAN: { label: "Loan", icon: "🏦" },
  VACCINATION: { label: "Free Vaccine", icon: "💉" },
  OTHER: { label: "Scheme", icon: "📋" },
};

const LEVEL_LABEL: Record<string, string> = {
  CENTRAL: "Central Govt",
  RAJASTHAN: "Rajasthan Govt",
  ALL_STATES: "All States",
};

export default function FarmSchemes({ schemes }: { schemes: SchemeItem[] }) {
  const { lang, dict: t } = useFarmLanguage();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!schemes.length) return null;

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {schemes.map((s) => {
        const open = expanded.has(s.id);
        const cat = CATEGORY_LABEL[s.category] ?? CATEGORY_LABEL.OTHER;
        return (
          <Card key={s.id} className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-orange-500 opacity-70" />
            <CardHeader className="pb-2">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge variant="secondary" className="rounded-full gap-1">
                  <span>{cat.icon}</span> <FarmText text={cat.label} lang={lang} />
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <FarmText text={LEVEL_LABEL[s.level] ?? s.level} lang={lang} />
                </Badge>
                {s.lastDate && (
                  <Badge variant="outline" className="rounded-full gap-1 border-amber-300 text-amber-700">
                    <CalendarClock className="h-3 w-3" />
                    {t.schLastDate}: <FarmText text={s.lastDate} lang={lang} />
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight">
                <FarmText text={s.title} lang={lang} />
              </CardTitle>
              {s.summary && (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <FarmText text={s.summary} lang={lang} />
                </p>
              )}
            </CardHeader>
            <CardContent>
              {s.details && open && <FarmHtml html={s.details} lang={lang} />}
              <div className="mt-2 flex flex-wrap gap-2">
                {s.details && (
                  <Button variant="ghost" size="sm" onClick={() => toggle(s.id)}>
                    {open ? t.showLess : t.readGuide}
                  </Button>
                )}
                {s.linkUrl && (
                  <a href={s.linkUrl} target="_blank" rel="noreferrer" className="inline-flex">
                    <Button size="sm" className="rounded-full gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {s.linkLabel?.trim() || t.schApply}
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
