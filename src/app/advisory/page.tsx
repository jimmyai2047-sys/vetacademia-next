export const metadata = {
  title: "VetAcademia | Advisory Services",
  description: "Expert veterinary advisory and consultation services for livestock and practice.",
};

import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";
import { Megaphone, Sparkles, ShieldCheck, Newspaper } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdvisoryPage() {
  const posts = await getPublishedPosts("ADVISORY");
  return (
    <div className="container mx-auto px-4 py-8">
      <DecorativePageHeader
        badge="Veterinary Advisory • Alerts & Best Practices"
        title="Expert"
        titleHighlight="Advisory"
        description="Expert guidance, disease alerts and best practices for livestock health and management — timely, scientific and field-tested for farmers and veterinarians."
        variant="amber"
        actions={
          <>
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <Newspaper className="h-3.5 w-3.5" /> {posts.length} advisories
            </Badge>
            <Badge className="rounded-full bg-[#d4a843] text-white border-0 px-3 py-1.5 gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified by Experts
            </Badge>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
          <CardContent className="p-4">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Megaphone className="h-5 w-5" /></div>
            <div className="mt-2 text-sm font-bold">Alerts</div>
            <div className="text-xs text-muted-foreground">Disease warnings</div>
          </CardContent>
        </Card>
        <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
          <CardContent className="p-4">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
            <div className="mt-2 text-sm font-bold">Guidance</div>
            <div className="text-xs text-muted-foreground">Best practices</div>
          </CardContent>
        </Card>
        <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
          <CardContent className="p-4">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Sparkles className="h-5 w-5" /></div>
            <div className="mt-2 text-sm font-bold">Trusted</div>
            <div className="text-xs text-muted-foreground">Expert reviewed</div>
          </CardContent>
        </Card>
      </div>

      <div className="va-divider-dots my-6"><span /></div>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Latest Advisories
        </Badge>
        <span className="text-xs text-muted-foreground">Handpicked for field action</span>
      </div>

      {posts.length === 0 ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/5 bg-muted/30 text-center shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-orange-600" />
          <CardContent className="p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Megaphone className="h-6 w-6" />
            </div>
            <p className="mt-3 font-medium">No advisories published yet.</p>
            <p className="text-sm text-muted-foreground">Check back soon — new alerts added regularly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-amber-100 blur-3xl opacity-50 pointer-events-none" />
          <PostList posts={posts} />
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300/50" />
        Issued by VetAcademia experts • Field-verified
        <div className="h-px w-12 bg-gradient-to-r from-amber-300/50 to-transparent" />
      </div>
    </div>
  );
}
