"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, CheckCircle2, TriangleAlert } from "lucide-react";
import { useFarmLanguage } from "@/components/farm-language-context";
import { FarmText } from "@/components/farm-translated";
import { FIRST_AID_ROWS } from "@/data/farm-first-aid";
import { AI_TIPS, GESTATION_ROWS } from "@/data/farm-breeding";
import { EMERGENCY_CONTACTS } from "@/data/farm-emergency";
import { FARM_CALENDAR } from "@/data/farm-calendar";

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="overflow-x-auto">{children}</div>
      </CardContent>
    </Card>
  );
}

export function FarmFirstAid() {
  const { lang, dict: t } = useFarmLanguage();
  return (
    <TableCard>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium">{t.colCondition}</th>
            <th className="text-left p-4 font-medium">{t.animals}</th>
            <th className="text-left p-4 font-medium">{t.colSymptoms}</th>
            <th className="text-left p-4 font-medium">{t.colFirstAid}</th>
            <th className="text-left p-4 font-medium">{t.colCallVet}</th>
          </tr>
        </thead>
        <tbody>
          {FIRST_AID_ROWS.map((r) => (
            <tr key={r.condition} className="border-b last:border-0 hover:bg-accent/50 align-top">
              <td className="p-4 font-medium"><FarmText text={r.condition} lang={lang} /></td>
              <td className="p-4 text-muted-foreground"><FarmText text={r.animals} lang={lang} /></td>
              <td className="p-4 text-muted-foreground"><FarmText text={r.symptoms} lang={lang} /></td>
              <td className="p-4 text-muted-foreground"><FarmText text={r.firstAid} lang={lang} /></td>
              <td className="p-4">
                <span className="inline-flex items-start gap-1.5 text-red-700 font-medium">
                  <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                  <FarmText text={r.callVet} lang={lang} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

export function FarmBreeding() {
  const { lang, dict: t } = useFarmLanguage();
  return (
    <div className="space-y-4">
      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">{t.animal}</th>
              <th className="text-left p-4 font-medium">{t.colGestation}</th>
              <th className="text-left p-4 font-medium">{t.colHeatSigns}</th>
            </tr>
          </thead>
          <tbody>
            {GESTATION_ROWS.map((r) => (
              <tr key={r.animal} className="border-b last:border-0 hover:bg-accent/50 align-top">
                <td className="p-4 font-medium"><FarmText text={r.animal} lang={lang} /></td>
                <td className="p-4 text-muted-foreground whitespace-nowrap">{r.days}</td>
                <td className="p-4 text-muted-foreground"><FarmText text={r.heatSigns} lang={lang} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <Card className="rounded-[1.5rem] border-amber-200 bg-amber-50/60 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-bold text-sm mb-3">{t.aiTipsTitle}</h3>
          <ul className="space-y-2.5">
            {AI_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                <FarmText text={tip} lang={lang} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export function FarmEmergency() {
  const { lang, dict: t } = useFarmLanguage();
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {EMERGENCY_CONTACTS.map((c) => (
        <Card key={c.number} className="rounded-[1.5rem] border-red-200 bg-red-50/60 shadow-sm overflow-hidden">
          <CardContent className="p-5 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm"><FarmText text={c.name} lang={lang} /></h3>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-red-700">{c.number}</div>
            <p className="mt-2 text-xs text-muted-foreground"><FarmText text={c.note} lang={lang} /></p>
            <Link href={c.href} className="mt-4 block">
              <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700 gap-2">
                <Phone className="h-4 w-4" /> {t.call}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FarmCalendar() {
  const { lang, dict: t } = useFarmLanguage();
  return (
    <TableCard>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium w-32">{t.colMonth}</th>
            <th className="text-left p-4 font-medium">{t.colTasks}</th>
          </tr>
        </thead>
        <tbody>
          {FARM_CALENDAR.map((m, i) => (
            <tr key={m.month} className={`border-b last:border-0 hover:bg-accent/50 align-top ${i % 2 ? "bg-muted/20" : ""}`}>
              <td className="p-4">
                <Badge variant="secondary" className="rounded-full whitespace-nowrap">
                  <FarmText text={m.month} lang={lang} />
                </Badge>
              </td>
              <td className="p-4">
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {m.tasks.map((task, j) => (
                    <li key={j}><FarmText text={task} lang={lang} /></li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
