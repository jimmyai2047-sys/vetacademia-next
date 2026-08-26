export const metadata = {
  title: "VetAcademia | Community",
  description: "Join the VetAcademia community of veterinary students, professionals, and farmers.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PROGRAMME_REFS, EXAM_REFS, ROLE_REFS } from "@/lib/community-constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ArrowLeft, Sparkles, Users } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Button } from "@/components/ui/button";

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
    orderBy: [{ category: "asc" }, { ref: "asc" }],
  });

  const byCategory = links.reduce<Record<string, typeof links>>((acc, l) => {
    (acc[l.category] ||= []).push(l);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
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
        description="Join Telegram groups for your programme, exams, and role to connect with fellow students, farmers and experts — stay updated, share notes, grow together."
        variant="purple"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <Users className="h-3.5 w-3.5" /> {links.length} active groups
            </Badge>
            <Badge className="rounded-full bg-[#d4a843] text-white border-0 px-3 py-1.5 gap-1.5">24/7 Discussion</Badge>
          </>
        }
      />

      <div className="va-divider-dots my-6"><span /></div>

      {links.length === 0 ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 bg-muted/40 text-center shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-[#d4a843] to-indigo-600" />
          <CardContent className="p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Users className="h-6 w-6" />
            </div>
            <p className="font-semibold mt-3">No communities available yet</p>
            <p className="text-sm text-muted-foreground">
              Check back soon for Telegram groups.
            </p>
            <div className="va-divider-dots mt-4 max-w-[120px] mx-auto"><span /></div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, items]) => (
            <section key={category} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="rounded-full bg-purple-50 text-purple-700 border-purple-200 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {category === "PROGRAMME"
                    ? "By Programme"
                    : category === "ROLE"
                    ? "By Role"
                    : "By Examination"}
                </Badge>
                <span className="text-xs text-muted-foreground">{items.length} groups</span>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-200/60 to-transparent" />
              </div>
              <div className="space-y-4">
                {items.map((l) => (
                  <Card key={l.id} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm bg-white">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-[#d4a843] to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-purple-50 blur-2xl group-hover:bg-purple-100 transition-colors" />
                    <CardHeader className="pb-2 relative">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 ${l.platform === "WHATSAPP" ? "bg-green-100 text-green-600" : "bg-sky-100 text-sky-600"}`}>
                          {l.platform === "WHATSAPP" ? (
                            <MessageCircle className="h-5 w-5" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </span>
                        <span className="truncate group-hover:text-primary transition-colors">{l.title}</span>
                        <Badge variant="secondary" className="ml-auto rounded-full text-[11px]">{l.platform === "WHATSAPP" ? "WhatsApp" : "Telegram"}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4 relative">
                      <span className="text-xs rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                        {refLabel(l.category, l.ref)}
                      </span>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                      >
                        Join <Send className="h-3.5 w-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                ))}
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
          <p className="mt-1 text-sm text-white/80">Contact our support or explore programmes to get the right invite link.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/contact"><Button variant="secondary" size="sm" className="rounded-full bg-white text-purple-700 hover:bg-white/90">Contact Support</Button></Link>
            <Link href="/syllabus"><Button variant="outline" size="sm" className="rounded-full border-white/30 bg-white/10 backdrop-blur text-white hover:bg-white hover:text-purple-700">Browse Syllabus</Button></Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-purple-300/50" />
        Moderated • Verified invites • No spam
        <div className="h-px w-8 bg-gradient-to-r from-purple-300/50 to-transparent" />
      </div>
    </div>
  );
}
