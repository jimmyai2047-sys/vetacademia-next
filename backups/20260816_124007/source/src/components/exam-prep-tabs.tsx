"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { materialTypeLabel } from "@/lib/exam-prep";
import {
  FileText,
  Download,
  Play,
  Image as ImageIcon,
  Presentation,
  Music,
  Film,
  File,
} from "lucide-react";

type Material = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  downloadUrl: string | null;
  externalUrl: string | null;
  embedUrl: string | null;
};

type TestItem = {
  id: string;
  title: string;
  questions: number;
  duration: number;
};

type PreparedCategory = {
  key: string;
  label: string;
  materials: Material[];
  papers: { id: string; title: string; downloadUrl: string | null }[];
  mockTests: TestItem[];
  adaptiveTests: TestItem[];
};

const TYPE_ICON: Record<string, any> = {
  PPT: Presentation,
  PDF: FileText,
  VIDEO: Film,
  AUDIO: Music,
  ANIMATION: Film,
  IMAGE: ImageIcon,
};

function MaterialCard({ m }: { m: Material }) {
  const Icon = TYPE_ICON[m.type] || File;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="text-xs">
            {materialTypeLabel(m.type)}
          </Badge>
        </div>
        <CardTitle className="text-base mt-1">{m.title}</CardTitle>
        {m.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {m.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {m.embedUrl ? (
          <div className="aspect-video w-full rounded-md overflow-hidden border">
            <iframe
              src={m.embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : m.downloadUrl && m.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.downloadUrl}
            alt={m.title}
            className="w-full max-h-48 object-contain rounded-md border bg-muted/30"
          />
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {m.downloadUrl && (
            <a href={m.downloadUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </a>
          )}
          {m.externalUrl && (
            <a
              href={m.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline">
                <Play className="h-4 w-4 mr-1" /> Open
              </Button>
            </a>
          )}
          {!m.downloadUrl && !m.externalUrl && (
            <span className="text-xs text-muted-foreground">No file attached</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  empty,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-primary" /> {title}
      </h2>
      {empty ? (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Check back soon.
        </p>
      ) : (
        children
      )}
    </section>
  );
}

export default function ExamPrepTabs({
  categories,
}: {
  categories: PreparedCategory[];
}) {
  const [active, setActive] = useState(0);
  const safeActive = categories.length > 0 ? Math.min(active, categories.length - 1) : 0;
  const cat = categories[safeActive];

  if (categories.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Examination Preparation</h1>
          <p className="text-muted-foreground">
            Study materials, previous year papers, mock tests and adaptive tests —
            organised by exam category.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          No preparation categories available yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Examination Preparation</h1>
        <p className="text-muted-foreground">
          Study materials, previous year papers, mock tests and adaptive tests —
          organised by exam category.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c, i) => (
          <button
            key={c.key}
            onClick={() => setActive(i)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              i === safeActive
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <Section
        title="Study Materials"
        icon={FileText}
        empty={cat.materials.length === 0}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.materials.map((m) => (
            <MaterialCard key={m.id} m={m} />
          ))}
        </div>
      </Section>

      <Section
        title="Previous Year Papers"
        icon={FileText}
        empty={cat.papers.length === 0}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.papers.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {p.downloadUrl ? (
                  <a
                    href={p.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No file attached
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Mock Tests"
        icon={FileText}
        empty={cat.mockTests.length === 0}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.mockTests.map((t) => (
            <Link key={t.id} href={`/mock-tests/${t.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-xs">
                    {t.questions} Qs &middot; {t.duration} min
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        title="Adaptive Tests"
        icon={FileText}
        empty={cat.adaptiveTests.length === 0}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.adaptiveTests.map((t) => (
            <Link key={t.id} href={`/mock-tests/${t.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-xs">
                    {t.questions} Qs &middot; {t.duration} min
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
