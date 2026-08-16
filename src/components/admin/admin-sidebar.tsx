"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  GraduationCap,
  FileText,
  Brain,
  Stethoscope,
  ChevronLeft,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Experts", href: "/admin/experts", icon: Stethoscope },
  { name: "Syllabus", href: "/admin/content", icon: BookOpen },
  { name: "Posts", href: "/admin/posts", icon: FileText },
  { name: "Pricing", href: "/admin/pricing", icon: IndianRupee },
  { name: "Mock / Adaptive / PY Tests", href: "/admin/mock-tests", icon: Brain },
  { name: "Study Material", href: "/admin/exam-materials", icon: FileText },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <Link href="/admin" className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            VA
          </div>
          <span className="font-semibold">Admin Panel</span>
        </Link>

        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 p-4 border-t">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>
    </aside>
  );
}
