"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
  CreditCard,
  MessageSquare,
  Radio,
  FileCheck,
  NotebookPen,
  Activity,
  ClipboardList,
  ScrollText,
  Inbox,
  ListChecks,
  Newspaper,
  Library,
  Award,
  Pill,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }> };

// Finding 15: navigation grouped the way admin work actually flows —
// Content, People, Commerce, Operations, Reporting — instead of one flat
// 24-entry list. Dashboard stays on top, Settings at the bottom.
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Content",
    items: [
      { name: "Syllabus", href: "/admin/content", icon: BookOpen },
      { name: "Posts", href: "/admin/posts", icon: FileText },
      { name: "Blog", href: "/admin/blog", icon: Newspaper },
      { name: "Books", href: "/admin/books", icon: Library },
      { name: "Success Stories", href: "/admin/testimonials", icon: Award },
      { name: "Drug Formulary", href: "/admin/drug-formulary", icon: Pill },
      { name: "Mock / Adaptive / PY Tests", href: "/admin/mock-tests", icon: Brain },
      { name: "Previous Year Papers", href: "/admin/py-papers", icon: FileCheck },
      { name: "Study Material (Exams)", href: "/admin/exam-materials", icon: GraduationCap },
      { name: "Study Notes (UG/PG)", href: "/admin/study-materials", icon: NotebookPen },
      { name: "Animal Owner Content", href: "/admin/farmers", icon: Tractor },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Experts", href: "/admin/experts", icon: Stethoscope },
      { name: "Community", href: "/admin/community", icon: MessageSquare },
    ],
  },
  {
    label: "Commerce",
    items: [
      { name: "Pricing", href: "/admin/pricing", icon: IndianRupee },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Live Classes", href: "/admin/live-classes", icon: Radio },
      { name: "Vet Proformas", href: "/admin/vet-proformas", icon: ScrollText },
      { name: "Vet Cases", href: "/admin/vet-cases", icon: Inbox },
      { name: "Admission Enquiries", href: "/admin/admissions", icon: ClipboardList },
    ],
  },
  {
    label: "Reporting",
    items: [
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Reference Check", href: "/admin/reports/references", icon: ListChecks },
      { name: "Activity Log", href: "/admin/activity-log", icon: Activity },
    ],
  },
];

const HOME_ITEM: NavItem = { name: "Dashboard", href: "/admin", icon: LayoutDashboard };
const SETTINGS_ITEM: NavItem = { name: "Settings", href: "/admin/settings", icon: Settings };

const STORAGE_KEY = "va-admin-nav-collapsed";
const COLLAPSE_EVENT = "va-admin-nav-collapsed-change";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onStoreChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(COLLAPSE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(COLLAPSE_EVENT, onStoreChange);
  };
}

function serverCollapsed(): boolean {
  return false;
}

function isActive(href: string, pathname: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

function NavButton({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.name : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl text-sm font-medium transition-all border",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
        active
          ? "bg-gradient-to-r from-primary to-[#0284c7] text-white shadow-md border-transparent"
          : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-50/30 hover:text-foreground border-transparent hover:border-primary/10 hover:shadow-sm bg-white/50"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all",
          active
            ? "bg-white/15 border-white/20 text-white"
            : "bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/10 text-primary group-hover:from-primary group-hover:to-[#0284c7] group-hover:text-white"
        )}
      >
        <item.icon className="h-4 w-4" />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {active && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
        </>
      )}
    </Link>
  );
}

function GroupLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="my-3 flex items-center gap-2 px-2">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>
    );
  }
  return (
    <div className="mb-2 mt-4 flex items-center gap-2 px-2">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground/60">
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </div>
  );
}

function NavList({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <nav className="space-y-1">
      <NavButton item={HOME_ITEM} active={isActive(HOME_ITEM.href, pathname)} collapsed={collapsed} />
      {navGroups.map((group) => (
        <div key={group.label}>
          <GroupLabel collapsed={collapsed}>{group.label}</GroupLabel>
          {group.items.map((item) => (
            <NavButton
              key={item.name}
              item={item}
              active={isActive(item.href, pathname)}
              collapsed={collapsed}
            />
          ))}
        </div>
      ))}
      <GroupLabel collapsed={collapsed}>Account</GroupLabel>
      <NavButton
        item={SETTINGS_ITEM}
        active={isActive(SETTINGS_ITEM.href, pathname)}
        collapsed={collapsed}
      />
    </nav>
  );
}

function AccountBlock({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession();
  const email = session?.user?.email;
  if (!email) return null;
  const initial = (session?.user?.name || email).charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-2 rounded-xl border border-primary/10 bg-white p-2",
        collapsed && "justify-center px-1"
      )}
      title={collapsed ? `${email} — sign out` : undefined}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#0284c7] text-[11px] font-bold text-white">
        {initial}
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{email}</span>
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            Signed in
          </span>
        </span>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Sign out"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors",
          collapsed && "hidden"
        )}
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function BackToSite({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/" title={collapsed ? "Back to Site" : undefined}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start gap-2 rounded-xl border-primary/10 bg-white hover:bg-primary hover:text-white hover:border-primary group",
          collapsed && "justify-center px-2"
        )}
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        {!collapsed && "Back to Site"}
      </Button>
    </Link>
  );
}

// Compact account/top header for admin screens (finding 15): on desktop the
// sidebar carries the controls; on mobile this bar hosts the drawer trigger
// so navigation and tables stay usable at narrow widths.
export function AdminTopbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-white/90 px-3 py-2 backdrop-blur-xl md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open admin navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 text-muted-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col overflow-y-auto p-3">
            <NavList pathname={pathname} collapsed={false} />
            <div className="mt-auto pt-3">
              <AccountBlock collapsed={false} />
              <BackToSite collapsed={false} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#0c4a6e] text-[11px] font-bold text-white">
          VA
        </span>
        <span className="truncate text-sm font-bold">VetAcademia Admin</span>
      </Link>

      {session?.user?.email && (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    serverCollapsed
  );

  function toggleCollapsed() {
    const next = !collapsed;
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
    } catch {
      /* storage blocked — session-only preference */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r bg-gradient-to-b from-white via-white to-muted/20 backdrop-blur-xl transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-64"
      )}
      style={{ height: "100vh", position: "sticky", top: 0 }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0284c7 1px, transparent 0)`,
          backgroundSize: "18px 18px",
        }}
      />
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative flex flex-1 flex-col overflow-hidden p-3">
        <div className="mb-4 flex items-center gap-2">
          <Link
            href="/admin"
            title="Admin Panel"
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-gradient-to-br from-primary via-[#0284c7] to-[#0c4a6e] p-2.5 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm shadow-sm">
              VA
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <span className="block font-bold text-sm leading-none">Admin Panel</span>
                <span className="block text-[11px] text-white/70 tracking-widest uppercase">
                  Royal • VetAcademia
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/10 text-muted-foreground hover:bg-muted transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2 pr-0.5">
          <NavList pathname={pathname} collapsed={collapsed} />
        </div>
      </div>

      <div className="relative border-t bg-gradient-to-r from-muted/30 via-white to-muted/20 p-3">
        <div
          className={cn(
            "rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-3 mb-3",
            collapsed && "mb-2 p-2"
          )}
          title={collapsed ? "Royal Admin — Structured • Secure • Fast" : undefined}
        >
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            {!collapsed && "Royal Admin"}
          </p>
          {!collapsed && (
            <p className="text-[11px] text-amber-700/70 mt-1">Structured • Secure • Fast</p>
          )}
        </div>
        <AccountBlock collapsed={collapsed} />
        <BackToSite collapsed={collapsed} />
      </div>
    </aside>
  );
}
