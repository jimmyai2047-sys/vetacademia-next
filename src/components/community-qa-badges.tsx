"use client";

import { Badge } from "@/components/ui/badge";
import { MessageCircle, ShieldCheck, Award, HelpCircle } from "lucide-react";

const DEFAULTS = [
  { label: "Questions", value: "24", icon: HelpCircle, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Expert Replies", value: "18", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Solved", value: "92%", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
];

export default function CommunityQaBadges({
  questions,
  answered,
  solvedPct,
}: {
  questions?: number;
  answered?: number;
  solvedPct?: number;
} = {}) {
  const stats = [
    { ...DEFAULTS[0], value: questions != null ? String(questions) : DEFAULTS[0].value },
    { ...DEFAULTS[1], value: answered != null ? String(answered) : DEFAULTS[1].value },
    {
      ...DEFAULTS[2],
      value: solvedPct != null ? `${solvedPct}%` : DEFAULTS[2].value,
    },
  ];
  return (
    <div className="rounded-[1.25rem] border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-bold">Community Q&A</span>
        <Badge className="ml-auto rounded-full bg-purple-600 text-white text-xs">Live</Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl ${s.bg} border p-3 text-center`}>
            <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="mt-1 text-lg font-extrabold">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Ask a question → get expert reply. Top contributors get <Badge variant="outline" className="rounded-full text-[10px]">Vet Expert</Badge> badge.</p>
    </div>
  );
}
