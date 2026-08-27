export const metadata = {
  title: "VetAcademia | Community",
  description: "Join the VetAcademia community of veterinary students, professionals, and farmers.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PROGRAMME_REFS, EXAM_REFS, ROLE_REFS } from "@/lib/community-constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ArrowLeft, Sparkles, Users } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Button } from "@/components/ui/button";
import CommunityQaBadges from "@/components/community-qa-badges";
import CommunityQa from "@/components/community-qa";

function refLabel(category: string, ref: string) {
  let list = EXAM_REFS;
  if (category === "PROGRAMME") list = PROGRAMME_REFS;
  else if (category === "ROLE") list = ROLE_REFS;
  return list.find((r) => r.value === ref)?.label || ref;
}

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const links = await prisma.communityLink.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { ref: "asc" }, { platform: "asc" }],
  });

  const session = await getServerSession(authOptions);
  const [doubts, doubtCount, answeredCount] = await Promise.all([
    prisma.doubt.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { name: true } } },
    }),
    prisma.doubt.count(),
    prisma.doubt.count({ where: { status: "ANSWERED" } }),
  ]);
  const solvedPct = doubtCount > 0 ? Math.round((answeredCount / doubtCount) * 100) : 0;

  // Group by category -> (title+ref) to handle duplicate refs like PSC with two titles
  const grouped = new Map<string, Map<string, { telegram?: typeof links[0]; whatsapp?: typeof links[0]; title: string }>>();
  for (const l of links) {
    const key = `${l.ref}::${l.title}`;
    if (!grouped.has(l.category)) grouped.set(l.category, new Map());
    const catMap = grouped.get(l.category)!;
    if (!catMap.has(key)) catMap.set(key, { title: l.title, telegram: undefined, whatsapp: undefined });
    const entry = catMap.get(key)!;
    if (l.platform === "TELEGRAM") entry.telegram = l;
    else if (l.platform === "WHATSAPP") entry.whatsapp = l;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <DecorativePageHeader
        badge="Community • Telegram & WhatsApp"
        title="Join the"
        titleHighlight="Community"
        description="Join Telegram and WhatsApp groups side-by-side for your programme, exams, and role — login to unlock your groups, purchase course to unlock premium groups."
        variant="purple"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <Users className="h-3.5 w-3.5" /> {links.length} active groups
            </Badge>
            <Badge className="rounded-full bg-[#d4a843] text-white border-0 px-3 py-1.5 gap-1.5">Telegram + WhatsApp</Badge>
          </>
        }
      />

      <div className="va-divider-dots my-6"><span /></div>

      <div className="mb-6 space-y-4">
        <CommunityQaBadges
          questions={doubtCount}
          answered={answeredCount}
          solvedPct={solvedPct}
        />
        <CommunityQa initialDoubts={doubts} isAuthed={!!session?.user} />
      </div>

      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <span className="font-semibold">Login to unlock more</span> — side-by-side Telegram + WhatsApp. Purchase karne par premium Course groups unlock honge.
      </div>

      {grouped.size === 0 ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 bg-muted/40 text-center shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-[#d4a843] to-indigo-600" />
          <CardContent className="p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Users className="h-6 w-6" />
            </div>
            <p className="font-semibold mt-3">No communities available yet</p>
            <p className="text-sm text-muted-foreground">Check back soon for groups.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([category, refMap]) => (
            <section key={category} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="rounded-full bg-purple-50 text-purple-700 border-purple-200 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {category === "PROGRAMME" ? "By Programme" : category === "ROLE" ? "By Role" : "By Examination"}
                </Badge>
                <span className="text-xs text-muted-foreground">{refMap.size} groups • Telegram + WhatsApp side-by-side</span>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-200/60 to-transparent" />
              </div>

              <div className="space-y-4">
                {Array.from(refMap.entries()).map(([key, pair]) => {
                  const ref = key.split("::")[0];
                  return (
                    <div key={key} className="rounded-[1.5rem] border border-primary/5 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold">{pair.title}</span>
                        <Badge variant="outline" className="rounded-full text-[11px]">{refLabel(category, ref)}</Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {pair.telegram ? (
                          <Card className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border-primary/5 bg-sky-50/50 shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                                  <Send className="h-4 w-4" />
                                </span>
                                Telegram
                                <Badge variant="secondary" className="ml-auto rounded-full text-[11px]">Telegram</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground truncate">{pair.telegram.title}</span>
                              <a
                                href={pair.telegram.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg"
                              >
                                Join <Send className="h-3.5 w-3.5" />
                              </a>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="rounded-[1.25rem] border border-dashed p-4 text-center text-xs text-muted-foreground">No Telegram group</div>
                        )}
                        {pair.whatsapp ? (
                          <Card className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border-primary/5 bg-green-50/50 shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                  <MessageCircle className="h-4 w-4" />
                                </span>
                                WhatsApp
                                <Badge variant="secondary" className="ml-auto rounded-full text-[11px] bg-green-100 text-green-700">WhatsApp</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground truncate">{pair.whatsapp.title}</span>
                              <a
                                href={pair.whatsapp.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg"
                              >
                                Join <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="rounded-[1.25rem] border border-dashed p-4 text-center text-xs text-muted-foreground">No WhatsApp group</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Card className="relative overflow-hidden rounded-[1.75rem] border-0 shadow-xl mt-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <CardContent className="relative p-6 text-center text-white">
          <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Stay Connected</Badge>
          <h3 className="mt-3 text-xl font-bold">Need help finding the right group?</h3>
          <p className="mt-1 text-sm text-white/80">Login → aapke Programme/Role ke groups filter hoke side-by-side dikhenge. Course purchase par premium unlock.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/contact"><Button variant="secondary" size="sm" className="rounded-full bg-white text-purple-700 hover:bg-white/90">Contact Support</Button></Link>
            <Link href="/syllabus"><Button variant="outline" size="sm" className="rounded-full border-white/30 bg-white/10 backdrop-blur text-white hover:bg-white hover:text-purple-700">Browse Syllabus</Button></Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-purple-300/50" />
        Moderated • Verified invites • No spam • Telegram + WhatsApp
        <div className="h-px w-8 bg-gradient-to-r from-purple-300/50 to-transparent" />
      </div>
    </div>
  );
}
