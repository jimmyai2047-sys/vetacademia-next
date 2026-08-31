export const metadata = {
  title: "VetAcademia | Farm Guide",
};

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFarmTypeImage } from "@/lib/page-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ProtectedHtml from "@/components/protected-html";

export const dynamic = "force-dynamic";

export default async function FarmGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const guide = await prisma.farmGuide.findUnique({
    where: { id },
  });

  if (!guide || !guide.published) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/farmers" className="hover:text-foreground transition-colors">Animal Owner</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{String(guide.title)}</span>
      </nav>

      <Link href="/farmers" className="inline-flex mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Animal Owner Corner
        </Button>
      </Link>

      <div className="relative h-64 w-full overflow-hidden rounded-2xl mb-6">
        <Image
          src={getFarmTypeImage(String(guide.category))}
          alt={String(guide.title)}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <Badge variant="secondary" className="mb-2">
            {String(guide.category)}
          </Badge>
          <h1 className="text-3xl font-bold">{String(guide.title)}</h1>
        </div>
      </div>

      {guide.summary && (
        <p className="text-lg text-muted-foreground mb-6">{String(guide.summary)}</p>
      )}

      {guide.content ? (
        <Card>
          <CardContent className="p-6">
            <ProtectedHtml html={String(guide.content)} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          Detailed content is being prepared. Check back soon.
        </p>
      )}
    </div>
  );
}
