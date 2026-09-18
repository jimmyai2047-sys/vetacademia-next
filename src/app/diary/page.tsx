import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, NotebookPen, ChevronRight } from "lucide-react";
import FarmLanguageProvider from "@/components/farm-language-context";
import FarmLanguageSwitcher from "@/components/farm-language-switcher";
import DiaryClient from "@/components/diary-client";
import {
  FARMER_LANG_COOKIE,
  FARMER_LANG_LOCALE,
  normalizeFarmerLang,
} from "@/dictionaries/farmer-languages";
import { getFarmerDict } from "@/dictionaries/farmers-ui";
import { getFarmerDict2 } from "@/dictionaries/farmers-ui-2";

export const metadata = {
  title: "VetAcademia | My Pashu Diary",
  description: "Your animals, milk records and vaccine reminders.",
};

export const dynamic = "force-dynamic";

export default async function DiaryPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const lang = normalizeFarmerLang(cookieStore.get(FARMER_LANG_COOKIE)?.value);
  const t = { ...getFarmerDict(lang), ...getFarmerDict2(lang) };

  // Serialize dates for the client boundary.
  const serialize = (animals: object[]) =>
    JSON.parse(
      JSON.stringify(animals, (_k, v) => (v instanceof Date ? v.toISOString() : v))
    );

  if (!session?.user?.id) {
    return (
      <FarmLanguageProvider initialLang={lang}>
        <div lang={FARMER_LANG_LOCALE[lang]} className="container mx-auto px-4 py-10 max-w-2xl">
          <Card className="rounded-[1.5rem] border-primary/10 shadow-sm text-center">
            <CardContent className="p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <NotebookPen className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold">{t.diLoginTitle}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.diLoginDesc}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/login?callbackUrl=/diary">
                  <Button className="rounded-xl gap-2">
                    <LogIn className="h-4 w-4" /> {t.diLoginBtn}
                  </Button>
                </Link>
                <Link href="/farmers">
                  <Button variant="outline" className="rounded-xl">{t.backCorner}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </FarmLanguageProvider>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const animals = await prisma.myAnimal
    .findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { milkLogs: true, events: true } },
        events: {
          where: { nextDue: { gte: today } },
          orderBy: { nextDue: "asc" },
          take: 3,
          select: { id: true, type: true, title: true, nextDue: true },
        },
        milkLogs: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true, morning: true, evening: true },
        },
      },
    })
    .catch(() => []);

  return (
    <FarmLanguageProvider initialLang={lang}>
      <div lang={FARMER_LANG_LOCALE[lang]} className="container mx-auto px-4 py-6 max-w-5xl">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/farmers" className="hover:text-foreground transition-colors">{t.titleA}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{t.diTitle}</span>
        </nav>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
                <NotebookPen className="h-3.5 w-3.5" /> {t.diTitle}
              </Badge>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{t.diTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.diDesc}</p>
          </div>
          <FarmLanguageSwitcher compact tone="light" />
        </div>
        <div className="mt-4">
          <DiaryClient initialAnimals={serialize(animals)} />
        </div>
      </div>
    </FarmLanguageProvider>
  );
}
