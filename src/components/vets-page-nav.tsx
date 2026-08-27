"use client";

import Link from "next/link";
import { BookOpen, Stethoscope, Calculator } from "lucide-react";

const tabs = [
  { id: "quick-tools", label: "Quick Tools", icon: Calculator },
  { id: "reference", label: "Reference Guide", icon: Stethoscope },
  { id: "articles", label: "Articles", icon: BookOpen },
];

export default function VetsPageNav() {
  return (
    <div className="sticky top-14 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <nav className="flex gap-1 py-2 overflow-x-auto" aria-label="Vet sections">
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
