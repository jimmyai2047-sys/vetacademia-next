export const metadata = {
  title: "VetAcademia | Farm Guide",
};

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFarmTypeImage } from "@/lib/page-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight } from "lucide-react";
import FarmLanguageProvider from "@/components/farm-language-context";
import FarmLanguageSwitcher from "@/components/farm-language-switcher";
import { FarmHtml, FarmText } from "@/components/farm-translated";
import {
  FARMER_LANG_COOKIE,
  FARMER_LANG_LOCALE,
  normalizeFarmerLang,
} from "@/dictionaries/farmer-languages";
import { getFarmerDict } from "@/dictionaries/farmers-ui";

export const dynamic = "force-dynamic";

export default async function FarmGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const lang = normalizeFarmerLang(cookieStore.get(FARMER_LANG_COOKIE)?.value);
  const t = getFarmerDict(lang);

  const guide = await prisma.farmGuide.findUnique({
    where: { id },
  });

  if (!guide || !guide.published) notFound();

  return (
    <FarmLanguageProvider initialLang={lang}>
      <div lang={FARMER_LANG_LOCALE[lang]} className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/farmers" className="hover:text-foreground transition-colors">{t.titleA}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]"><FarmText text={String(guide.title)} lang={lang} /></span>
        </nav>

        <div className="flex items-center justify-between gap-3 mb-6">
          <Link href="/farmers" className="inline-flex">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              {t.backCorner}
            </Button>
          </Link>
          <FarmLanguageSwitcher compact tone="light" />
        </div>

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
            <h1 className="text-3xl font-bold"><FarmText as="span" text={String(guide.title)} lang={lang} /></h1>
          </div>
        </div>

        {guide.summary && (
          <p className="text-lg text-muted-foreground mb-6"><FarmText text={String(guide.summary)} lang={lang} /></p>
        )}

        {guide.content ? (
          <Card>
            <CardContent className="p-6">
              <FarmHtml html={String(guide.content)} lang={lang} />
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {t.preparing}
          </p>
        )}
      </div>
    </FarmLanguageProvider>
  );
}
