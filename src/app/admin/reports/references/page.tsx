export const metadata = {
  title: "VetAcademia | Reference Check",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, CheckCircle2, TriangleAlert } from "lucide-react";
import {
  PROGRAMME_SLUGS,
  COMMUNITY_EXAM_REFS,
  ROLE_REFS,
  isProgrammeSlug,
  isExamSlug,
  canonicalExamKey,
  examKeyLabel,
  isValidExamKey,
  isValidCommunityRef,
  EXAM_KEYS,
  TRACK_TAGS,
} from "@/lib/reference-dictionary";
import { LEGACY_TRACK_LABELS } from "@/lib/exam-tracks";

export const dynamic = "force-dynamic";

type Issue = {
  target: string;
  field: string;
  value: string;
  issue: string;
  suggestion: string;
  href: string;
};

function examFieldIssue(raw: string, href: string, target: string): Issue | null {
  if (!raw) return null;
  const canon = canonicalExamKey(raw);
  if (canon && canon !== raw && EXAM_KEYS.includes(canon)) {
    return {
      target,
      field: "exam",
      value: raw,
      issue: `Legacy exam alias (displayed as “${examKeyLabel(canon)}”)`,
      suggestion: `Canonical key: ${canon}`,
      href,
    };
  }
  if (!isValidExamKey(raw)) {
    return {
      target,
      field: "exam",
      value: raw,
      issue: "Not a known exam key",
      suggestion: `Use one of: ${EXAM_KEYS.join(" | ")}`,
      href,
    };
  }
  return null;
}

function trackFieldIssue(raw: string | null, href: string, target: string): Issue | null {
  if (!raw) return null;
  if (TRACK_TAGS.includes(raw)) return null;
  if (LEGACY_TRACK_LABELS[raw]) {
    return {
      target,
      field: "track",
      value: raw,
      issue: `Legacy track tag — shown as “${LEGACY_TRACK_LABELS[raw]}”`,
      suggestion: raw === "icar-jrf" ? "Canonical track: icar-jrf-srf" : "Label-only legacy tag; keep or migrate",
      href,
    };
  }
  return {
    target,
    field: "track",
    value: raw,
    issue: "Not a known content track (subject-code style tag)",
    suggestion: "Move the subject code to examSubjectSlug, or pick a track in the editor",
    href,
  };
}

function Section({
  title,
  hint,
  editHref,
  editLabel,
  checked,
  issues,
}: {
  title: string;
  hint: string;
  editHref: string;
  editLabel: string;
  checked: number;
  issues: Issue[];
}) {
  return (
    <Card className="rounded-[1.25rem] border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-2">
            {issues.length === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <TriangleAlert className="h-4 w-4 text-amber-600" />
            )}
            {title}
          </span>
          <span className="flex items-center gap-2">
            <Badge variant={issues.length === 0 ? "outline" : "secondary"} className="rounded-full text-xs">
              {issues.length === 0 ? "All clear" : `${issues.length} issue${issues.length === 1 ? "" : "s"}`}
            </Badge>
            <Badge variant="outline" className="rounded-full text-xs">{checked} checked</Badge>
            <Link
              href={editHref}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {editLabel} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <p className="text-sm text-emerald-700">No reference problems found in this section.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-2 font-medium">Row</th>
                  <th className="p-2 font-medium">Field</th>
                  <th className="p-2 font-medium">Value</th>
                  <th className="p-2 font-medium">Problem</th>
                  <th className="p-2 font-medium">Suggested fix</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i, idx) => (
                  <tr key={`${i.field}-${i.value}-${idx}`} className="border-t align-top">
                    <td className="p-2">
                      <Link href={i.href} className="text-primary hover:underline">
                        {i.target}
                      </Link>
                    </td>
                    <td className="p-2 text-xs">{i.field}</td>
                    <td className="p-2 text-xs font-mono break-all">{i.value}</td>
                    <td className="p-2 text-xs text-amber-700">{i.issue}</td>
                    <td className="p-2 text-xs">{i.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ReferenceCheckPage() {
  const [links, posts, tests, plans, expertUsers, expertCount] = await Promise.all([
    prisma.communityLink.findMany({
      select: { id: true, platform: true, category: true, ref: true, title: true, active: true },
      orderBy: [{ category: "asc" }, { ref: "asc" }],
    }),
    prisma.post.findMany({
      where: { OR: [{ exam: { not: null } }, { track: { not: null } }] },
      select: { id: true, title: true, category: true, exam: true, track: true, published: true },
    }),
    prisma.mockTest.findMany({
      where: { OR: [{ exam: { not: null } }, { track: { not: null } }] },
      select: { id: true, title: true, exam: true, track: true, kind: true },
    }),
    prisma.plan.findMany({
      select: {
        slug: true, name: true, type: true, programmeSlug: true, examSlug: true,
        year: true, subjectId: true, isListed: true,
      },
      orderBy: { slug: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "EXPERT" },
      select: { id: true, name: true, email: true, createdAt: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "EXPERT" } }),
  ]);

  // --- Community links -------------------------------------------------
  const ROLE_SUGGESTIONS: Record<string, string> = {
    EXPERT: "Dead ref — use FACULTY (staff) or STUDENT (trainees)",
    FARMER: "Dead ref — use ANIMAL_OWNER",
  };
  const linkIssues: Issue[] = [];
  for (const l of links) {
    const target = `${l.platform} · ${l.title}${l.active ? "" : " (inactive)"}`;
    if (l.category === "EXAM" && l.ref === "psc") {
      linkIssues.push({
        target,
        field: "ref",
        value: l.ref,
        issue: "Ambiguous shared legacy PSC ref (VO and LSA share one link)",
        suggestion: "Split into psc-vo and psc-lsa rows",
        href: "/admin/community",
      });
      continue;
    }
    if (!isValidCommunityRef(l.category, l.ref)) {
      linkIssues.push({
        target,
        field: `${l.category} ref`,
        value: l.ref,
        issue:
          l.category === "ROLE"
            ? `Dead role ref${ROLE_SUGGESTIONS[l.ref] ? "" : " (not in ROLE dictionary)"}`
            : l.category === "PROGRAMME"
              ? "Not a known programme slug"
              : "Not a known community exam ref",
        suggestion:
          l.category === "ROLE"
            ? ROLE_SUGGESTIONS[l.ref] ?? `Use one of: ${ROLE_REFS.map((r) => r.value).join(" | ")}`
            : l.category === "PROGRAMME"
              ? `Use one of: ${PROGRAMME_SLUGS.join(" | ")}`
              : `Use one of: ${COMMUNITY_EXAM_REFS.map((r) => r.value).join(" | ")}`,
        href: "/admin/community",
      });
    }
  }

  // --- Posts -----------------------------------------------------------
  const postIssues: Issue[] = [];
  for (const p of posts) {
    const href = `/admin/posts?edit=${p.id}`;
    const target = `${p.title}${p.published ? "" : " (draft)"}`;
    const e = examFieldIssue(p.exam ?? "", href, target);
    if (e) postIssues.push(e);
    const t = trackFieldIssue(p.track, href, target);
    if (t) postIssues.push(t);
  }

  // --- Mock tests ------------------------------------------------------
  const testIssues: Issue[] = [];
  for (const m of tests) {
    const href = `/admin/mock-tests?edit=${m.id}`;
    const target = `${m.title} (${m.kind})`;
    const e = examFieldIssue(m.exam ?? "", href, target);
    if (e) testIssues.push(e);
    const t = trackFieldIssue(m.track, href, target);
    if (t) testIssues.push(t);
  }

  // --- Plans -----------------------------------------------------------
  const planIssues: Issue[] = [];
  for (const p of plans) {
    const href = "/admin/pricing";
    const target = `${p.slug} (${p.name})${p.isListed ? "" : " · unlisted"}`;
    if (p.programmeSlug && !isProgrammeSlug(p.programmeSlug)) {
      planIssues.push({
        target,
        field: "programmeSlug",
        value: p.programmeSlug,
        issue: "Not a known programme slug",
        suggestion: `Use one of: ${PROGRAMME_SLUGS.join(" | ")}`,
        href,
      });
    }
    if (p.examSlug && !isExamSlug(p.examSlug)) {
      planIssues.push({
        target,
        field: "examSlug",
        value: p.examSlug,
        issue: "Not a known exam plan slug",
        suggestion: canonicalExamKey(p.examSlug) !== p.examSlug
          ? `Nearest canonical key: ${canonicalExamKey(p.examSlug)}`
          : "Pick an exam in the plan editor",
        href,
      });
    }
  }
  // Duplicate pricing scopes (same programme/year/subject/exam → competing variants).
  const scopeGroups = new Map<string, string[]>();
  for (const p of plans) {
    if (!p.programmeSlug && !p.examSlug && !p.year && !p.subjectId) continue;
    const key = [p.programmeSlug ?? "", p.examSlug ?? "", p.year ?? "", p.subjectId ?? ""].join("|");
    const arr = scopeGroups.get(key) ?? [];
    arr.push(p.slug);
    scopeGroups.set(key, arr);
  }
  for (const [key, slugs] of scopeGroups) {
    if (slugs.length < 2) continue;
    const listed = slugs.length;
    planIssues.push({
      target: slugs.join(", "),
      field: "scope",
      value: key.split("|").join(" / ") || "(full programme)",
      issue: `${listed} plans share one pricing scope (programme / exam / year / subject)`,
      suggestion: "Keep one listed variant per scope; unlist or rescope the rest",
      href: "/admin/pricing",
    });
  }

  // --- Legacy user roles ----------------------------------------------
  const roleIssues: Issue[] = expertUsers.map((u) => ({
    target: `${u.name} · ${u.email}`,
    field: "role",
    value: "EXPERT",
    issue: "Legacy role kept from the old expert flow",
    suggestion: "Review: community ROLE/EXPERT refs are dead — map staff to FACULTY, trainees to STUDENT",
    href: `/admin/users?search=${encodeURIComponent(u.email)}`,
  }));

  const totalIssues =
    linkIssues.length + postIssues.length + testIssues.length + planIssues.length + roleIssues.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reference Check</h1>
          <p className="text-sm text-muted-foreground">
            Canonical dictionaries vs live data — community refs, exam/track tags, plan scopes and
            legacy roles (findings 10/11/13). Aliases are display-safe but listed so they can be
            normalised at leisure.
          </p>
        </div>
        <Badge className="rounded-full" variant={totalIssues === 0 ? "outline" : "secondary"}>
          {totalIssues === 0 ? "All clear" : `${totalIssues} issue${totalIssues === 1 ? "" : "s"} total`}
        </Badge>
      </div>

      <Section
        title="Community link refs"
        hint="CommunityLink rows whose category/ref pair fails the dictionary, plus the ambiguous shared PSC ref."
        editHref="/admin/community"
        editLabel="Manage community"
        checked={links.length}
        issues={linkIssues}
      />
      <Section
        title="Posts — exam / track tags"
        hint="Previous-year & exam posts with legacy aliases or non-canonical tags."
        editHref="/admin/posts"
        editLabel="Manage posts"
        checked={posts.length}
        issues={postIssues}
      />
      <Section
        title="Mock / PY tests — exam / track tags"
        hint="Mock, adaptive and previous-year tests with legacy aliases or non-canonical tags."
        editHref="/admin/mock-tests"
        editLabel="Manage tests"
        checked={tests.length}
        issues={testIssues}
      />
      <Section
        title="Plan scopes"
        hint="Plans with non-canonical programme/exam slugs, plus duplicate pricing scopes."
        editHref="/admin/pricing"
        editLabel="Manage pricing"
        checked={plans.length}
        issues={planIssues}
      />
      <Section
        title="Legacy EXPERT roles"
        hint={`Users still holding the legacy EXPERT role (showing first ${expertUsers.length} of ${expertCount}).`}
        editHref="/admin/users"
        editLabel="Manage users"
        checked={expertCount}
        issues={roleIssues}
      />
    </div>
  );
}
