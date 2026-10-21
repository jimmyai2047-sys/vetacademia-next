"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, GraduationCap, Layers, Award, Search, IndianRupee } from "lucide-react";
import {
  getProgrammeImage,
  getExamImage,
  getSubjectImage,
  getProgrammeYearImage,
} from "@/lib/subject-images";
import { getExamKeysForPlan } from "@/lib/plans";
import { formatValidity } from "@/lib/plan-validity";

export type PricingPlan = {
  slug: string;
  name: string;
  type: string;
  description: string | null;
  price: number;
  validityDays: number | null;
  programmeSlug: string | null;
  examSlug: string | null;
  year: string | null;
  subjectId: string | null;
  sortOrder: number;
};

type Scope = "full" | "year" | "subject" | "exam";
type Option = { key: string; label: string };

const PROG_LABEL: Record<string, string> = {
  ahdp: "A.H.D.P",
  dvp: "DVP",
  bvsc: "B.V.Sc & A.H.",
  mvsc: "M.V.Sc",
  phd: "Ph.D",
};

const EXAMS_KEY = "__EXAMS__";

function contentLinkForPlan(plan: PricingPlan): string {
  if (plan.type === "COURSE" && plan.programmeSlug) return `/syllabus/${plan.programmeSlug}`;
  if (plan.type === "EXAM" && plan.examSlug) {
    const key = getExamKeysForPlan(plan.examSlug)[0];
    if (key) return `/examinations/${key}`;
    return "/examinations";
  }
  return "/";
}

function resolveSubjectImage(planName: string, subjectNames: Record<string, string>): string {
  const all = Object.values(subjectNames);
  if (all.includes(planName)) return getSubjectImage(planName);
  for (const name of all) {
    if (planName.includes(name) || name.includes(planName)) return getSubjectImage(name);
  }
  return "";
}

function planImage(plan: PricingPlan, subjectNames: Record<string, string>): string {
  if (plan.type === "EXAM" && plan.examSlug) return getExamImage(plan.examSlug);
  if (plan.subjectId)
    return resolveSubjectImage(plan.name, subjectNames) || getProgrammeImage(plan.programmeSlug || "ahdp");
  if (plan.year && plan.programmeSlug) return getProgrammeYearImage(plan.programmeSlug, plan.year);
  return getProgrammeImage(plan.programmeSlug || "ahdp");
}

const SCOPE_META: Record<Scope, { label: string; hint: string }> = {
  full: { label: "Full programme", hint: "Complete syllabus in one purchase" },
  year: { label: "Year-wise", hint: "Buy a single year package" },
  subject: { label: "Subject-wise", hint: "Pay for only the subject you need" },
  exam: { label: "Exam preparation", hint: "Mock tests, PYQs & notes per track" },
};

export default function PricingExplorer({
  plans,
  subjectNames,
  enrolled,
  ownedProgrammes,
  ownedYears,
  ownedSubjects,
  ownedExamKeys,
  highlight,
}: {
  plans: PricingPlan[];
  subjectNames: Record<string, string>;
  enrolled: string[];
  ownedProgrammes?: string[];
  ownedYears?: string[];
  ownedSubjects?: string[];
  ownedExamKeys?: string[];
  highlight: string | null;
}) {
  const enrolledSet = useMemo(() => new Set(enrolled), [enrolled]);
  const ownedProgrammesSet = useMemo(() => new Set(ownedProgrammes ?? []), [ownedProgrammes]);
  const ownedYearsSet = useMemo(() => new Set(ownedYears ?? []), [ownedYears]);
  const ownedSubjectsSet = useMemo(() => new Set(ownedSubjects ?? []), [ownedSubjects]);
  const ownedExamKeysSet = useMemo(() => new Set(ownedExamKeys ?? []), [ownedExamKeys]);

  const coursePlans = useMemo(() => plans.filter((p) => p.type === "COURSE"), [plans]);
  const examPlans = useMemo(() => plans.filter((p) => p.type === "EXAM"), [plans]);

  const programmeOptions = useMemo<Option[]>(() => {
    const seen = new Map<string, Option>();
    for (const p of coursePlans) {
      const key = p.programmeSlug || "other";
      if (!seen.has(key))
        seen.set(key, { key, label: PROG_LABEL[key] || key.toUpperCase() });
    }
    // Deterministic order — base plans share sortOrder, so DB tie-order is
    // unstable; pin the known programmes first, then any others alphabetically.
    const CANONICAL = ["ahdp", "dvp", "bvsc", "mvsc", "phd"];
    const list = [...seen.values()].sort((a, b) => {
      const ia = CANONICAL.indexOf(a.key);
      const ib = CANONICAL.indexOf(b.key);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.label.localeCompare(b.label);
    });
    if (examPlans.length > 0) list.push({ key: EXAMS_KEY, label: "Exam Preparation" });
    return list;
  }, [coursePlans, examPlans]);

  const bucketsFor = useCallback((programme: string) => {
    if (programme === EXAMS_KEY) {
      return {
        full: [] as PricingPlan[],
        years: [] as PricingPlan[],
        subjects: [] as PricingPlan[],
        exams: examPlans,
      };
    }
    const own = coursePlans.filter((p) => (p.programmeSlug || "other") === programme);
    return {
      full: own.filter((p) => !p.year && !p.subjectId),
      years: own.filter((p) => p.year && !p.subjectId),
      subjects: own.filter((p) => !!p.subjectId),
      exams: [] as PricingPlan[],
    };
  }, [coursePlans, examPlans]);

  const scopesFor = useCallback(
    (programme: string): Scope[] => {
      const b = bucketsFor(programme);
      const out: Scope[] = [];
      if (b.full.length) out.push("full");
      if (b.years.length) out.push("year");
      if (b.subjects.length) out.push("subject");
      if (b.exams.length) out.push("exam");
      return out;
    },
    [bucketsFor]
  );

  // Initial selection: honour ?plan=<slug> deep links, otherwise open on the
  // first programme's plans. Deep links to programme slugs whose full-programme
  // rows are unlisted (ahdp/bvsc/mvsc/phd/dvp) fall back to that programme's
  // listed plans instead of silently landing on the first tab.
  const initial = (() => {
    const stateForPlan = (hp: PricingPlan) => {
      const programme = hp.type === "EXAM" ? EXAMS_KEY : hp.programmeSlug || "other";
      const scopes = scopesFor(programme);
      const scope: Scope = hp.type === "EXAM" ? "exam" : hp.year ? "year" : hp.subjectId ? "subject" : "full";
      return {
        programme: programmeOptions.some((o) => o.key === programme) ? programme : (programmeOptions[0]?.key ?? ""),
        scope: scopes.includes(scope) ? scope : scopes[0] ?? "full",
        year: hp.year ?? "",
        subjectId: hp.subjectId ?? "",
      };
    };
    const hp = highlight ? plans.find((p) => p.slug === highlight) : null;
    if (hp) return stateForPlan(hp);
    if (highlight) {
      const fallback =
        coursePlans.find((p) => (p.programmeSlug || "other") === highlight) ||
        coursePlans.find((p) => p.slug === highlight || p.slug.startsWith(`${highlight}-`));
      if (fallback) return stateForPlan(fallback);
    }
    const programme = programmeOptions[0]?.key ?? "";
    const scopes = scopesFor(programme);
    return { programme, scope: scopes[0] ?? "full", year: "", subjectId: "" };
  })();

  const [programme, setProgramme] = useState(initial.programme);
  const [scope, setScope] = useState<Scope>(initial.scope);
  const [year, setYear] = useState(initial.year);
  const [subjectId, setSubjectId] = useState(initial.subjectId);
  const [validity, setValidity] = useState("__ALL__");

  const buckets = useMemo(() => bucketsFor(programme), [programme]);
  const scopes = useMemo(() => scopesFor(programme), [programme]);

  const yearOptions = useMemo<Option[]>(
    () =>
      // Plan.year values are already "1st Year"…"4th Year" — label as-is.
      [...new Set(buckets.years.map((p) => p.year as string))]
        .sort()
        .map((y) => ({ key: y, label: y })),
    [buckets.years]
  );

  const subjectOptions = useMemo<Option[]>(() => {
    // One option per distinct subject — each subject has several duration
    // variants (base/-6mo/-12mo/-24mo) sharing the same subjectId.
    const seen = new Map<string, Option>();
    for (const p of buckets.subjects) {
      const key = p.subjectId as string;
      if (!seen.has(key))
        seen.set(key, { key, label: subjectNames[key] || p.name });
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [buckets.subjects, subjectNames]);

  function selectProgramme(key: string) {
    setProgramme(key);
    const next = scopesFor(key);
    setScope(next.includes(scope) ? scope : next[0] ?? "full");
    setYear("");
    setSubjectId("");
    setValidity("__ALL__");
  }

  function selectScope(next: Scope) {
    setScope(next);
    setYear("");
    setSubjectId("");
    setValidity("__ALL__");
  }

  const bucket: PricingPlan[] = useMemo(() => {
    if (scope === "exam") return buckets.exams;
    if (scope === "year") {
      const y = year || yearOptions[0]?.key || "";
      return buckets.years.filter((p) => p.year === y);
    }
    if (scope === "subject") {
      const sid = subjectId || subjectOptions[0]?.key || "";
      return buckets.subjects.filter((p) => p.subjectId === sid);
    }
    return buckets.full;
  }, [scope, year, subjectId, buckets, yearOptions, subjectOptions]);

  const validityOptions = useMemo(() => {
    const days = [...new Set(bucket.map((p) => p.validityDays ?? 0))].sort((a, b) => a - b);
    return days.map((d) => ({ key: String(d), label: d > 0 ? formatValidity(d) : "Lifetime access" }));
  }, [bucket]);

  const visible = useMemo(
    () =>
      bucket.filter((p) => validity === "__ALL__" || String(p.validityDays ?? 0) === validity),
    [bucket, validity]
  );

  const activeLabel =
    programmeOptions.find((o) => o.key === programme)?.label ?? "";
  const scopeLabel = SCOPE_META[scope].label;
  const refineLabel =
    scope === "year"
      ? yearOptions.find((o) => o.key === (year || yearOptions[0]?.key))?.label ?? ""
      : scope === "subject"
      ? subjectOptions.find((o) => o.key === (subjectId || subjectOptions[0]?.key))?.label ?? ""
      : "";

  function chipClasses(active: boolean) {
    return `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
      active
        ? "border-primary bg-primary text-white shadow-sm"
        : "border-primary/15 bg-white text-foreground hover:border-primary/40 hover:bg-primary/5"
    }`;
  }

  return (
    <div className="rounded-[1.75rem] border border-primary/10 bg-white/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm">
      {/* Step 1 — programme */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">1 · Choose your programme</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {programmeOptions.map((o) => (
              <button key={o.key} type="button" onClick={() => selectProgramme(o.key)} className={chipClasses(o.key === programme)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2 — scope */}
      <div className="mt-5 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">2 · What do you want to buy?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {scopes.map((s) => (
              <button key={s} type="button" onClick={() => selectScope(s)} className={chipClasses(s === scope)}>
                {SCOPE_META[s].label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{SCOPE_META[scope].hint}</p>
        </div>
      </div>

      {/* Step 3 — year / subject / validity */}
      <div className="mt-5 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <Search className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">3 · Refine, then see plans</p>

          {scope === "year" && yearOptions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {yearOptions.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => {
                    setYear(o.key);
                    setValidity("__ALL__");
                  }}
                  className={chipClasses((year || yearOptions[0]?.key) === o.key)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {scope === "subject" && subjectOptions.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={subjectId || subjectOptions[0]?.key}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setValidity("__ALL__");
                }}
                className="h-9 max-w-full rounded-xl border border-input bg-background px-3 text-sm"
                aria-label="Subject"
              >
                {subjectOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">{subjectOptions.length} subjects available</span>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setValidity("__ALL__")}
              className={chipClasses(validity === "__ALL__")}
            >
              Any validity
            </button>
            {validityOptions.map((o) => (
              <button key={o.key} type="button" onClick={() => setValidity(o.key)} className={chipClasses(validity === o.key)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result summary */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-primary/10 pt-4 text-sm">
        <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1">
          <IndianRupee className="h-3 w-3" /> {visible.length} plan{visible.length === 1 ? "" : "s"}
        </Badge>
        <span className="font-semibold">{activeLabel}</span>
        <span className="text-muted-foreground">· {scopeLabel}</span>
        {refineLabel && <span className="text-muted-foreground">· {refineLabel}</span>}
        {validity !== "__ALL__" && (
          <span className="text-muted-foreground">
            · {validityOptions.find((o) => o.key === validity)?.label}
          </span>
        )}
        {(validity !== "__ALL__" || (scope === "year" && year) || (scope === "subject" && subjectId)) && (
          <button
            type="button"
            onClick={() => {
              setValidity("__ALL__");
              setYear("");
              setSubjectId("");
            }}
            className="ml-auto text-primary hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Plans */}
      {visible.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-primary/20 bg-muted/30 p-8 text-center">
          <p className="text-sm font-semibold">No plans match this combination.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another validity, or pick a different year / subject above.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visible.map((plan) => {
            // Enrolled if the exact plan is owned, or a broader purchase already
            // unlocks it (full programme, that year, or the matching exam key).
            const isEnrolled =
              enrolledSet.has(plan.slug) ||
              (!!plan.programmeSlug && ownedProgrammesSet.has(plan.programmeSlug)) ||
              (!!plan.programmeSlug && !!plan.year && ownedYearsSet.has(`${plan.programmeSlug}:${plan.year}`)) ||
              (!!plan.subjectId && ownedSubjectsSet.has(plan.subjectId)) ||
              (plan.type === "EXAM" &&
                !!plan.examSlug &&
                getExamKeysForPlan(plan.examSlug).some((k) => ownedExamKeysSet.has(k)));
            const isHighlight = highlight === plan.slug;
            return (
              <Card
                key={plan.slug}
                className={`va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl hover:border-primary/10 ${isHighlight ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity z-10" />
                {isHighlight && (
                  <Badge className="absolute top-3 right-3 z-20 rounded-full bg-[#d4a843] text-white border-0 shadow-md">
                    Featured
                  </Badge>
                )}
                <div className="relative h-36 w-full overflow-hidden">
                  <Image
                    src={planImage(plan, subjectNames)}
                    alt={plan.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <Badge className="rounded-full bg-white/90 backdrop-blur text-primary border-0 shadow-md text-xs">
                      {plan.type === "EXAM"
                        ? "Exam Prep"
                        : plan.subjectId
                        ? "Subject"
                        : plan.year
                        ? plan.year
                        : "Programme"}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2 relative">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <CardTitle className="text-[17px] leading-tight group-hover:text-primary transition-colors">
                      {plan.name}
                    </CardTitle>
                    {isEnrolled && (
                      <Badge className="rounded-full bg-emerald-600 hover:bg-emerald-600 gap-1">
                        <Check className="h-3 w-3" /> Enrolled
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-sm">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4 pt-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight">
                      Rs.{plan.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">/ one-time</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">
                    {formatValidity(plan.validityDays)}
                  </Badge>
                  {isEnrolled ? (
                    <Link
                      href={contentLinkForPlan(plan)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-md"
                    >
                      Go to Content <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href={`/checkout?plan=${encodeURIComponent(plan.slug)}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#0284c7] px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all shadow-md group-hover:shadow-primary/20"
                    >
                      Enroll Now{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {scope === "exam" && visible.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Award className="h-3.5 w-3.5 text-amber-500" />
          Exam tracks cover mock tests, previous-year papers and study material for that examination.
        </p>
      )}
    </div>
  );
}
