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
  Tractor,
  ChevronLeft,
  IndianRupee,
  MessageSquare,
  Radio,
  FileCheck,
  NotebookPen,
  Activity,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Experts", href: "/admin/experts", icon: Stethoscope },
  { name: "Syllabus", href: "/admin/content", icon: BookOpen },
  { name: "Posts", href: "/admin/posts", icon: FileText },
  { name: "Community", href: "/admin/community", icon: MessageSquare },
  { name: "Pricing", href: "/admin/pricing", icon: IndianRupee },
  { name: "Mock / Adaptive / PY Tests", href: "/admin/mock-tests", icon: Brain },
  { name: "Previous Year Papers", href: "/admin/py-papers", icon: FileCheck },
  { name: "Study Material (Exams)", href: "/admin/exam-materials", icon: GraduationCap },
  { name: "Live Classes", href: "/admin/live-classes", icon: Radio },
  { name: "Study Notes (UG/PG)", href: "/admin/study-materials", icon: NotebookPen },
  { name: "Animal Owner Content", href: "/admin/farmers", icon: Tractor },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Activity Log", href: "/admin/activity-log", icon: Activity },
  { name: "Admission Enquiries", href: "/admin/admissions", icon: ClipboardList },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-gradient-to-b from-white via-white to-muted/20 backdrop-blur-xl min-h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #005f48 1px, transparent 0)`, backgroundSize: "18px 18px" }} />
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative p-4 flex-1 overflow-y-auto">
        <Link href="/admin" className="group flex items-center gap-3 mb-6 rounded-xl bg-gradient-to-br from-primary via-[#005f48] to-[#003d2e] p-3 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm shadow-sm">
            VA
          </div>
          <div className="flex-1 min-w-0">
            <span className="block font-bold text-sm leading-none">Admin Panel</span>
            <span className="block text-[11px] text-white/70 tracking-widest uppercase">Royal • VetAcademia</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </Link>

        <div className="mb-3 flex items-center gap-2 px-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground/60">Management</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>

        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  isActive
                    ? "bg-gradient-to-r from-primary to-[#005f48] text-white shadow-md border-transparent"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-50/30 hover:text-foreground border-transparent hover:border-primary/10 hover:shadow-sm bg-white/50"
                )}
              >
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border transition-all", isActive ? "bg-white/15 border-white/20 text-white" : "bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/10 text-primary group-hover:from-primary group-hover:to-[#005f48] group-hover:text-white")}>
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative p-3 border-t bg-gradient-to-r from-muted/30 via-white to-muted/20">
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-3 mb-3">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Royal Admin</p>
          <p className="text-[11px] text-amber-700/70 mt-1">Highly decorative • Secure • Fast</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="w-full justify-start gap-2 rounded-xl border-primary/10 bg-white hover:bg-primary hover:text-white hover:border-primary group">
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Site
          </Button>
        </Link>
      </div>
    </aside>
  );
}
