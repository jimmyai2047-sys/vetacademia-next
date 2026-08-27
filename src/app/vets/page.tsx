export const metadata = {
  title: "VetAcademia | For Veterinarians",
  description: "Resources, consultation tools, and community for practicing veterinarians.",
};

import { getPublishedPosts } from "@/lib/posts";
import VetsPageNav from "@/components/vets-page-nav";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Sparkles, BookOpen, Users, ShieldCheck, Clock, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import VetQuickTools from "@/components/vet-quick-tools";
import VetArticleFilters from "@/components/vet-article-filters";
import VetReferenceCollapsible from "@/components/vet-reference-collapsible";
import VetTestimonials from "@/components/vet-testimonials";
import VetStickyCta from "@/components/vet-sticky-cta";

export const dynamic = "force-dynamic";

export default async function VetsPage() {
  const vetPosts = await getPublishedPosts("VETS");
  return (
    <div className="pb-16 md:pb-0">
      <div className="container mx-auto px-4 pt-8">
        <DecorativePageHeader
          badge="For Practitioners • Clinical • Community"
          title="For"
          titleHighlight="Veterinarians"
          description="Resources, consultation tools, community and curated articles for practicing veterinarians — clinical references, case studies and expert insights in one decorative hub."
          variant="emerald"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5" /> {vetPosts.length} articles
              </Badge>
              <Badge className="rounded-full bg-emerald-900/30 border-emerald-200/20 text-white gap-1.5 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> 50+ Verified Experts
              </Badge>
              <Link href="/experts">
                <Button variant="secondary" size="sm" className="rounded-full bg-white text-emerald-700 hover:bg-white/90 gap-1.5">
                  <Video className="h-3.5 w-3.5" /> Book 15 min — ₹299
                </Button>
              </Link>
            </>
          }
        />
        {/* Credibility strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="rounded-full bg-white gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-600" /> Evidence-based
          </Badge>
          <Badge variant="outline" className="rounded-full bg-white gap-1.5">
            <Clock className="h-3 w-3 text-blue-600" /> Updated weekly
          </Badge>
          <span className="text-muted-foreground">• Trusted by 2,000+ field vets</span>
        </div>
      </div>

      {/* Decorative stats strip */}
      <div className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
            <CardContent className="p-4">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Stethoscope className="h-5 w-5" /></div>
              <div className="mt-2 text-lg font-extrabold">Clinical</div>
              <div className="text-xs text-muted-foreground">References</div>
            </CardContent>
          </Card>
          <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
            <CardContent className="p-4">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><BookOpen className="h-5 w-5" /></div>
              <div className="mt-2 text-lg font-extrabold">Evidence</div>
              <div className="text-xs text-muted-foreground">Based Care</div>
            </CardContent>
          </Card>
          <Card className="va-card-hover rounded-[1.25rem] border-primary/5 bg-white/70 backdrop-blur shadow-sm text-center">
            <CardContent className="p-4">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Sparkles className="h-5 w-5" /></div>
              <div className="mt-2 text-lg font-extrabold">24/7</div>
              <div className="text-xs text-muted-foreground">Access</div>
            </CardContent>
          </Card>
        </div>
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <VetsPageNav />

      {/* Quick Access Tools */}
      <div className="container mx-auto px-4 mt-6" id="quick-tools">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="rounded-full bg-emerald-600 gap-1.5">
            <Sparkles className="h-3 w-3" /> Quick Tools
          </Badge>
          <span className="text-xs text-muted-foreground">For on-field use — calculator, protocols, vitals</span>
        </div>
        <VetQuickTools />
      </div>

      {/* Sticky CTA - Desktop */}
      <div className="container mx-auto px-4 mt-6 hidden md:block">
        <VetStickyCta />
      </div>

      {/* Clinical Reference - collapsible, repositioned above articles */}
      <div className="container mx-auto px-4 mt-6">
        <VetReferenceCollapsible />
      </div>

      {/* Testimonials - credibility */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-sm">Trusted by field vets</h3>
          <Badge variant="outline" className="rounded-full text-xs">4.8/5</Badge>
        </div>
        <VetTestimonials />
      </div>

      {/* Articles with Filters + Search */}
      <div id="articles" className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Curated
          </Badge>
          <span className="text-xs text-muted-foreground">{vetPosts.length} resources</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Articles & <span className="va-gradient-text">Resources</span></h2>
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-600 to-[#d4a843]" />
        <p className="mt-2 text-sm text-muted-foreground">Handpicked for field veterinarians — filter by species & type.</p>
        <div className="va-divider-dots my-6"><span /></div>
        {vetPosts.length === 0 ? (
          <Card className="va-card-hover rounded-[1.5rem] border-primary/5 bg-muted/30">
            <CardContent className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <p className="mt-3 font-medium">No articles published yet</p>
              <p className="text-sm text-muted-foreground">Check back soon for new resources.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-100 blur-3xl opacity-60 pointer-events-none" />
            <VetArticleFilters posts={vetPosts} />
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden">
        <VetStickyCta />
      </div>
    </div>
  );
}
