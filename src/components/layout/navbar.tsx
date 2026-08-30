"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { isExpertRole } from "@/lib/roles";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  Menu,
  GraduationCap,
  BookOpen,
  FlaskConical,
  Stethoscope,
  FileCheck,
  Tractor,
  HeartPulse,
  Home,
  Users,
  LogOut,
  LayoutDashboard,
  Search,
  Shield,
  BookMarked,
  Microscope,
  Award,
  FileQuestion,
  Beaker,
  Newspaper,
  Phone,
  BookOpenCheck,
  FileText,
  Info,
  ChevronDown,
  Radio,
  Star,
  Play,
  IndianRupee,
  LifeBuoy,
  Sparkles,
  Crown,
  Gem,
  ArrowRight,
  Library,
} from "lucide-react";

const programmes = [
  { name: "A.H.D.P.", href: "/syllabus/ahdp", icon: BookOpen },
  { name: "B.V.Sc & A.H.", href: "/syllabus/bvsc", icon: GraduationCap },
  { name: "M.V.Sc", href: "/syllabus/mvsc", icon: FlaskConical },
  { name: "Ph.D", href: "/syllabus/phd", icon: Stethoscope },
];

const examCategories = [
  { name: "Public Service Commission", href: "/examinations/psc", icon: Shield, desc: "Vet. Officer / LSA" },
  { name: "ICAR Entrance", href: "/examinations/icar-entrance", icon: BookMarked, desc: "JRF / SRF" },
  { name: "NET", href: "/examinations/net", icon: Microscope, desc: "ICAR / CSIR / UGC" },
  { name: "ARS", href: "/examinations/ars", icon: Award, desc: "Research Scientist" },
  { name: "Other Exams", href: "/examinations/other", icon: FileQuestion, desc: "Various Exams" },
];

const prepCategories = [
  { name: "Veterinary Officer", href: "/prepare?tab=VO", icon: Stethoscope, desc: "VO/VS" },
  { name: "Livestock Assistant", href: "/prepare?tab=LSA", icon: BookOpen, desc: "LSA" },
  { name: "ARS / NET", href: "/prepare?tab=ARS", icon: Beaker, desc: "ARS & NET" },
  { name: "ICAR Entrance", href: "/prepare?tab=ICAR_ENTRANCE", icon: BookMarked, desc: "JRF / SRF" },
  { name: "ICAR-NET", href: "/prepare?tab=NET", icon: Microscope, desc: "ICAR-NET" },
];

function MobileNavSection({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-primary/15 pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function toggleSection(name: string) {
    setExpanded((e) => ({ ...e, [name]: !e[name] }));
  }
  const [search, setSearch] = useState("");
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();

  function setMenu(name: string, open: boolean) {
    if (open) {
      // When opening one menu, close all others first
      setOpenMenus({ [name]: true });
    } else {
      setOpenMenus((m) => ({ ...m, [name]: false }));
    }
  }

  function closeAllMenus() {
    setOpenMenus({});
  }

  // Close all dropdowns on route change
  useEffect(() => {
    closeAllMenus();
  }, [pathname]);
  const { data: session, status } = useSession();

  const isAuthed = status === "authenticated" && !!session?.user;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isStudent = role === "STUDENT";
  const isAnimalOwner = role === "ANIMAL_OWNER";
  const isExpert = isExpertRole(role);
  const isGuest = role === "GUEST";

  const roleLinks = isAdmin
    ? []
    : isStudent
    ? [
        { href: "/syllabus", label: "My Syllabus" },
        { href: "/mock-tests", label: "Mock Tests" },
        { href: "/flashcards", label: "Flashcards" },
        { href: "/demo", label: "Free Demo" },
      ]
    : isAnimalOwner
    ? [
        { href: "/advisory", label: "Advisory" },
        { href: "/experts", label: "Book Consultation" },
        { href: "/community", label: "Community" },
      ]
    : isExpert
    ? [
        { href: "/experts", label: "My Profile" },
        { href: "/consultations", label: "My Consultations" },
        { href: "/community", label: "Community" },
      ]
    : [];
  const initials =
    (session?.user?.name || session?.user?.email || "U")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Ornamental top gradient */}
      <div className="h-[3px] w-full bg-gradient-to-r from-primary via-[#d4a843] to-primary va-gradient-animate" />
      <div className="border-b bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 shadow-[0_4px_30px_rgba(0,95,72,0.07)]">
        <div className="absolute inset-0 va-pattern-dots pointer-events-none" />
        <div className="container relative mx-auto flex h-[68px] items-center justify-between px-4">
          {/* Logo - decorative */}
          <div className="relative flex items-center gap-3">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 blur-xl opacity-60" />
            <BrandLogo src="/favicon-192x192.png" imgClassName="h-11 w-auto relative" />
            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase leading-none">VetAcademia</p>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Excellence • Since 2020</p>
            </div>
          </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          <Link href="/">
            <Button variant="ghost" className="gap-1.5"><Home className="h-4 w-4" />Home</Button>
          </Link>

          {/* Programmes */}
          <div
            className="group relative"
            onMouseEnter={() => setMenu("programmes", true)}
            onMouseLeave={() => setMenu("programmes", false)}
            onFocus={() => setMenu("programmes", true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu("programmes", false);
            }}
          >
            <Button variant="ghost" className="gap-2" aria-haspopup="true" aria-expanded={!!openMenus["programmes"]}>
              <GraduationCap className="h-4 w-4" />
              Programmes
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 pt-3 w-[340px] opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <div className="rounded-[1.25rem] border border-primary/10 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,95,72,0.3)] overflow-hidden">
              <div className="absolute top-3 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
              <div className="absolute inset-0 top-3 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #005f48 1px, transparent 0)`, backgroundSize: "16px 16px" }} />
              <div className="relative bg-gradient-to-br from-primary/[0.07] via-white to-blue-50/30 p-4 border-b border-primary/5 mt-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md">
                    <Crown className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] uppercase text-primary">Academic Programmes <Sparkles className="h-3 w-3 text-[#d4a843]" /></p>
                    <p className="text-xs text-muted-foreground">VCI Approved • 4 Programmes</p>
                  </div>
                </div>
              </div>
              <div className="relative p-2.5 space-y-1">
                {programmes.map((p) => (
                  <Link
                    key={p.name}
                    href={p.href}
                    className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-primary/[0.06] hover:to-blue-50/40 hover:shadow-sm transition-all"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/10 text-primary group-hover/item:bg-gradient-to-br group-hover/item:from-primary group-hover/item:to-[#005f48] group-hover/item:text-white group-hover/item:border-transparent group-hover/item:shadow-md transition-all">
                      <p.icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-semibold group-hover/item:text-primary transition-colors">
                        {p.name}
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all text-primary" />
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.name === "A.H.D.P." ? "Diploma Programme" : p.name === "B.V.Sc & A.H." ? "Undergraduate Degree" : p.name === "M.V.Sc" ? "Postgraduate Specialization" : "Doctoral Research"}
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] opacity-60 group-hover/item:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
              <div className="relative p-2.5 pt-0">
                <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent my-2" />
                <Link
                  href="/syllabus"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-[#005f48] to-[#003d2e] text-white px-4 py-2.5 text-sm font-bold shadow-lg hover:shadow-xl hover:from-primary/90 transition-all group/btn"
                >
                  <BookOpenCheck className="h-4 w-4" />
                  View All Syllabus
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
                <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> 100+ Subjects • Live Access
                </p>
              </div>
            </div>
          </div>
          </div>

          {/* Exams */}
          <div
            className="group relative"
            onMouseEnter={() => setMenu("exams", true)}
            onMouseLeave={() => setMenu("exams", false)}
            onFocus={() => setMenu("exams", true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu("exams", false);
            }}
          >
            <Button variant="ghost" className="gap-2" aria-haspopup="true" aria-expanded={!!openMenus["exams"]}>
              <FileCheck className="h-4 w-4" />
              Exams
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 pt-3 w-[400px] rounded-[1.25rem] border border-primary/10 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,95,72,0.3)] overflow-hidden opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-[#d4a843] to-emerald-600" />
              <div className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50/30 p-4 border-b border-primary/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                    <Award className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] uppercase text-blue-700">Competitive Exams <Gem className="h-3 w-3 text-[#d4a843]" /></p>
                    <p className="text-xs text-muted-foreground">PSC • ICAR • NET • ARS • 410+ Papers</p>
                  </div>
                </div>
              </div>
              <div className="relative p-2.5 space-y-1 max-h-[360px] overflow-y-auto">
                {examCategories.map((c) => (
                  <Link
                    key={c.name}
                    href={c.href}
                    className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-emerald-50/30 hover:shadow-sm transition-all"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-primary/10 shadow-sm text-primary group-hover/item:bg-gradient-to-br group-hover/item:from-primary group-hover/item:to-[#005f48] group-hover/item:text-white group-hover/item:border-transparent transition-all">
                      <c.icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-semibold group-hover/item:text-primary transition-colors">
                        {c.name}
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all text-primary" />
                      </div>
                      <div className="text-xs text-muted-foreground">{c.desc}</div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  </Link>
                ))}
              </div>
              <div className="relative p-2.5 bg-gradient-to-r from-primary/[0.04] via-blue-50/20 to-transparent border-t border-primary/5">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/study-materials" className="flex items-center justify-center gap-1.5 rounded-xl bg-white border border-primary/10 px-3 py-2.5 text-xs font-bold hover:border-primary/20 hover:shadow-sm transition-all">
                    <BookOpenCheck className="h-3.5 w-3.5 text-primary" /> Study Materials
                  </Link>
                  <Link href="/papers" className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[#005f48] text-white px-3 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all">
                    <FileCheck className="h-3.5 w-3.5" /> PYQ Papers
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Prepare */}
          <div
            className="group relative"
            onMouseEnter={() => setMenu("prepare", true)}
            onMouseLeave={() => setMenu("prepare", false)}
            onFocus={() => setMenu("prepare", true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu("prepare", false);
            }}
          >
            <Button variant="ghost" className="gap-2" aria-haspopup="true" aria-expanded={!!openMenus["prepare"]}>
              <BookOpen className="h-4 w-4" />
              Prepare
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 pt-3 w-[460px] rounded-[1.25rem] border border-primary/10 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,95,72,0.3)] overflow-hidden opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-600 via-[#d4a843] to-blue-600" />
              <div className="relative bg-gradient-to-br from-emerald-50 via-white to-blue-50/20 p-4 border-b border-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md">
                      <Beaker className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] uppercase text-emerald-700">Prepare • Exam Tracks <Crown className="h-3 w-3 text-[#d4a843]" /></p>
                      <p className="text-xs text-muted-foreground">VO • LSA • ARS/NET • ICAR — choose your track</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-bold shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> 4 Tracks
                  </span>
                </div>
              </div>
              <div className="relative p-3">
                <div className="grid grid-cols-2 gap-2">
                  {prepCategories.map((c) => (
                    <Link
                      key={c.name}
                      href={c.href}
                      className="group/item flex items-center gap-2.5 rounded-xl border border-primary/5 bg-gradient-to-br from-white to-muted/20 p-3 hover:border-primary/15 hover:from-primary/[0.06] hover:to-blue-50/30 hover:shadow-sm transition-all"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-primary/10 shadow-sm text-primary group-hover/item:bg-gradient-to-br group-hover/item:from-primary group-hover/item:to-[#005f48] group-hover/item:text-white transition-all">
                        <c.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-tight group-hover/item:text-primary transition-colors">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                  <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground/60">Study Tools</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { href: "/mock-tests", label: "Mock Tests", icon: FileText, color: "from-blue-500 to-indigo-500" },
                    { href: "/flashcards", label: "Flashcards", icon: BookMarked, color: "from-emerald-500 to-teal-500" },
                    { href: "/papers", label: "PYQ Papers", icon: FileCheck, color: "from-amber-500 to-orange-500" },
                    { href: "/study-materials", label: "Materials", icon: BookOpenCheck, color: "from-purple-500 to-violet-500" },
                    { href: "/live-classes", label: "Live Classes", icon: Radio, color: "from-rose-500 to-pink-500" },
                    { href: "/demo", label: "Free Demo", icon: Play, color: "from-primary to-[#005f48]" },
                  ].map((t) => (
                    <Link key={t.href} href={t.href} className="group/tool flex flex-col items-center gap-1.5 rounded-xl border border-primary/5 bg-white p-3 hover:border-primary/15 hover:shadow-sm hover:bg-gradient-to-br hover:from-primary/[0.04] hover:to-transparent transition-all text-center">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-sm group-hover/tool:scale-105 transition-transform`}>
                        <t.icon className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-bold leading-tight">{t.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div
            className="group relative"
            onMouseEnter={() => setMenu("resources", true)}
            onMouseLeave={() => setMenu("resources", false)}
            onFocus={() => setMenu("resources", true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu("resources", false);
            }}
          >
            <Button variant="ghost" className="gap-2" aria-haspopup="true" aria-expanded={!!openMenus["resources"]}>
              <Users className="h-4 w-4" />
              Resources
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 pt-3 w-[420px] rounded-[1.25rem] border border-primary/10 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,95,72,0.3)] overflow-hidden opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-600 via-[#d4a843] to-pink-600" />
              <div className="relative bg-gradient-to-br from-purple-50 via-white to-pink-50/20 p-4 border-b border-primary/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md">
                    <Gem className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] uppercase text-purple-700">Resources • Community & Content <Sparkles className="h-3 w-3 text-[#d4a843]" /></p>
                    <p className="text-xs text-muted-foreground">Experts • Vets • Farmers • Blog • Books</p>
                  </div>
                </div>
              </div>
              <div className="relative p-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="px-1 pb-2 text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground/70 flex items-center gap-1.5"><span className="h-1 w-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600" /> Community</p>
                  <div className="space-y-1">
                    {[
                      { href: "/experts", label: "Experts", icon: Users, desc: "1:1 Consult" },
                      { href: "/advisory", label: "Animal Owner", icon: Tractor, desc: "Farmer Help" },
                      { href: "/vets", label: "Vets", icon: HeartPulse, desc: "Find Vets" },
                      { href: "/community", label: "Community", icon: Users, desc: "Join Now" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="group/item flex items-center gap-2.5 rounded-xl px-2.5 py-2 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/20 hover:shadow-sm transition-all">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/10 text-purple-600 group-hover/item:bg-gradient-to-br group-hover/item:from-purple-600 group-hover/item:to-pink-600 group-hover/item:text-white transition-all">
                          <l.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold group-hover/item:text-purple-700 transition-colors">{l.label}</div>
                          <div className="text-[11px] text-muted-foreground">{l.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="px-1 pb-2 text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground/70 flex items-center gap-1.5"><span className="h-1 w-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600" /> Content</p>
                  <div className="space-y-1">
                    {[
                      { href: "/catalog", label: "The Catalog", icon: Library, desc: "All subjects · drawer by drawer" },
                      { href: "/blog", label: "Blog", icon: Newspaper, desc: "Tips & Guides" },
                      { href: "/books", label: "Books", icon: BookOpen, desc: "Recommended" },
                      { href: "/testimonials", label: "Success Stories", icon: Star, desc: "4.8★ Reviews" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="group/item flex items-center gap-2.5 rounded-xl px-2.5 py-2 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/20 hover:shadow-sm transition-all">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/10 text-blue-600 group-hover/item:bg-gradient-to-br group-hover/item:from-blue-600 group-hover/item:to-cyan-600 group-hover/item:text-white transition-all">
                          <l.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold group-hover/item:text-blue-700 transition-colors">{l.label}</div>
                          <div className="text-[11px] text-muted-foreground">{l.desc}</div>
                        </div>
                      </Link>
                    ))}
                    <Link href="/demo" className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[#005f48] text-white py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all">
                      <Play className="h-3.5 w-3.5" /> Free Demo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div
            className="group relative"
            onMouseEnter={() => setMenu("about", true)}
            onMouseLeave={() => setMenu("about", false)}
            onFocus={() => setMenu("about", true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu("about", false);
            }}
          >
            <Button variant="ghost" className="gap-2" aria-haspopup="true" aria-expanded={!!openMenus["about"]}>
              <Info className="h-4 w-4" />
              About
            </Button>
            <div className="absolute right-0 top-full z-50 pt-3 w-[340px] rounded-[1.25rem] border border-primary/10 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,95,72,0.3)] overflow-hidden opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-[#d4a843] to-blue-600" />
              <div className="relative bg-gradient-to-br from-primary/[0.06] via-white to-amber-50/20 p-4 border-b border-primary/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md">
                    <Info className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] uppercase text-primary">About VetAcademia <Crown className="h-3 w-3 text-[#d4a843]" /></p>
                    <p className="text-xs text-muted-foreground">Learn • Pricing • Support</p>
                  </div>
                </div>
              </div>
              <div className="relative p-2.5 space-y-1">
                <Link href="/about" className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-primary/[0.06] hover:to-amber-50/20 hover:shadow-sm transition-all">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/15 text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all"><Info className="h-4 w-4" /></span>
                  <div className="flex-1"><div className="text-sm font-semibold group-hover/item:text-primary transition-colors">About Us</div><div className="text-xs text-muted-foreground">Our story & mission</div></div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>
                <Link href="/pricing" className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/30 hover:shadow-sm transition-all">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15 text-amber-600 group-hover/item:bg-gradient-to-br group-hover/item:from-amber-500 group-hover/item:to-orange-500 group-hover/item:text-white transition-all"><IndianRupee className="h-4 w-4" /></span>
                  <div className="flex-1"><div className="text-sm font-semibold group-hover/item:text-amber-700 transition-colors">Pricing</div><div className="text-xs text-muted-foreground">Affordable plans</div></div>
                  <span className="rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5">Save 20%</span>
                </Link>
                <Link href="/contact" className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/20 hover:shadow-sm transition-all">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all"><Phone className="h-4 w-4" /></span>
                  <div className="flex-1"><div className="text-sm font-semibold group-hover/item:text-emerald-700 transition-colors">Contact Us</div><div className="text-xs text-muted-foreground">We reply in 2h</div></div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </Link>
                <Link href="/faqs" className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-violet-50/20 hover:shadow-sm transition-all">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/15 text-purple-600 group-hover/item:bg-purple-600 group-hover/item:text-white transition-all"><FileQuestion className="h-4 w-4" /></span>
                  <div className="flex-1"><div className="text-sm font-semibold">FAQs</div><div className="text-xs text-muted-foreground">Quick answers</div></div>
                </Link>
                <Link href="/help" className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-cyan-50/20 hover:shadow-sm transition-all">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/15 text-teal-600 group-hover/item:bg-teal-600 group-hover/item:text-white transition-all"><LifeBuoy className="h-4 w-4" /></span>
                  <div className="flex-1"><div className="text-sm font-semibold group-hover/item:text-teal-700 transition-colors">Help Center</div><div className="text-xs text-muted-foreground">Guides & support</div></div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>
              </div>
              <div className="p-2.5 bg-gradient-to-r from-primary/[0.03] to-amber-50/20 border-t border-primary/5">
                <Link href="/contact" className="flex items-center justify-center gap-2 rounded-xl bg-white border border-primary/10 px-3 py-2 text-xs font-bold hover:border-primary/20 hover:shadow-sm transition-all">
                  <Phone className="h-3.5 w-3.5 text-primary" /> Need help? Contact us
                </Link>
              </div>
            </div>
          </div>

          <Link href="/admission">
            <Button>Admission</Button>
          </Link>
        </nav>

        {/* Global Search */}
        <form
          onSubmit={handleSearch}
          className="hidden xl:flex items-center relative"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            aria-label="Search subjects"
            className="pl-9 pr-3 h-9 w-64 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        {/* Auth Buttons / User Menu */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent outline-none">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[120px] truncate">
                  {session.user?.name || session.user?.email}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => router.push(isAdmin ? "/admin" : "/dashboard")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {isAdmin ? "Admin Panel" : "Dashboard"}
                </DropdownMenuItem>
                {roleLinks.map((rl) => (
                  <DropdownMenuItem
                    key={rl.href}
                    onClick={() => router.push(rl.href)}
                    className="cursor-pointer"
                  >
                    {rl.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu - Enhanced for Mobile */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-[360px] p-0 overflow-y-auto bg-gradient-to-b from-white via-white to-muted/10 [&>button:first-of-type]:hidden">
            <div className="flex flex-col min-h-full">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-primary/5">
                <div className="h-[3px] w-full bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10 blur-md" />
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-primary/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/favicon-192x192.png" alt="VetAcademia" className="h-7 w-7 object-contain" />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-[15px] leading-tight flex items-center gap-1.5">VetAcademia <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /></p>
                      <p className="text-xs text-muted-foreground">Veterinary Education Hub</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>
              </div>

              {/* Sticky Search */}
              <div className="sticky top-[57px] z-10 bg-white/95 backdrop-blur-xl p-3 border-b border-primary/5">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search subjects, exams..."
                    aria-label="Search subjects"
                    className="w-full pl-10 pr-4 h-11 rounded-xl border border-primary/10 bg-gradient-to-r from-muted/30 to-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 shadow-sm"
                  />
                </form>
              </div>

              <div className="space-y-1.5">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Home className="h-4 w-4" />
                  </span>
                  Home
                </Link>

                <MobileNavSection
                  title="Programmes"
                  icon={GraduationCap}
                  open={!!expanded.programmes}
                  onToggle={() => toggleSection("programmes")}
                >
                  {programmes.map((p) => (
                    <Link
                      key={p.name}
                      href={p.href}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      <p.icon className="h-4 w-4 text-primary" />
                      {p.name}
                    </Link>
                  ))}
                  <Link
                    href="/syllabus"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    <BookOpenCheck className="h-4 w-4 text-primary" />
                    View All Syllabus
                  </Link>
                </MobileNavSection>

                <MobileNavSection
                  title="Exams"
                  icon={FileCheck}
                  open={!!expanded.exams}
                  onToggle={() => toggleSection("exams")}
                >
                  <Link
                    href="/examinations"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileCheck className="h-4 w-4 text-primary" />
                    All Examinations
                  </Link>
                  {examCategories.map((c) => (
                    <Link
                      key={c.name}
                      href={c.href}
                      className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <c.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        <span className="block">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/study-materials"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    <BookOpenCheck className="h-4 w-4 text-primary" />
                    Study Materials
                  </Link>
                </MobileNavSection>

                <MobileNavSection
                  title="Prepare"
                  icon={BookOpen}
                  open={!!expanded.prepare}
                  onToggle={() => toggleSection("prepare")}
                >
                  {prepCategories.map((c) => (
                    <Link
                      key={c.name}
                      href={c.href}
                      className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <c.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        <span className="block">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                  <Link href="/mock-tests" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <FileText className="h-4 w-4 text-primary" /> Mock Tests
                  </Link>
                  <Link href="/flashcards" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <BookMarked className="h-4 w-4 text-primary" /> Flashcards
                  </Link>
                  <Link href="/papers" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <FileCheck className="h-4 w-4 text-primary" /> Previous Year Papers
                  </Link>
                  <Link href="/live-classes" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Radio className="h-4 w-4 text-primary" /> Live Classes
                  </Link>
                  <Link href="/demo" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Play className="h-4 w-4 text-primary" /> Free Demo
                  </Link>
                </MobileNavSection>

                <MobileNavSection
                  title="Resources"
                  icon={Users}
                  open={!!expanded.resources}
                  onToggle={() => toggleSection("resources")}
                >
                  <Link href="/experts" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Users className="h-4 w-4 text-primary" /> Experts
                  </Link>
                  <Link href="/advisory" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Tractor className="h-4 w-4 text-primary" /> Animal Owner
                  </Link>
                  <Link href="/vets" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <HeartPulse className="h-4 w-4 text-primary" /> Vets
                  </Link>
                  <Link href="/community" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Users className="h-4 w-4 text-primary" /> Community
                  </Link>
                  <Link href="/catalog" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Library className="h-4 w-4 text-primary" /> The Catalog
                  </Link>
                  <Link href="/blog" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Newspaper className="h-4 w-4 text-primary" /> Blog
                  </Link>
                  <Link href="/books" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <BookOpen className="h-4 w-4 text-primary" /> Books
                  </Link>
                  <Link href="/testimonials" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Star className="h-4 w-4 text-primary" /> Success Stories
                  </Link>
                </MobileNavSection>

                <MobileNavSection
                  title="About"
                  icon={Info}
                  open={!!expanded.about}
                  onToggle={() => toggleSection("about")}
                >
                  <Link href="/about" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Info className="h-4 w-4 text-primary" /> About Us
                  </Link>
                  <Link href="/pricing" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <IndianRupee className="h-4 w-4 text-primary" /> Pricing
                  </Link>
                  <Link href="/contact" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <Phone className="h-4 w-4 text-primary" /> Contact Us
                  </Link>
                  <Link href="/faqs" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <FileQuestion className="h-4 w-4 text-primary" /> FAQs
                  </Link>
                  <Link href="/help" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <LifeBuoy className="h-4 w-4 text-primary" /> Help Center
                  </Link>
                </MobileNavSection>

                <Link
                  href="/admission"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="h-4 w-4" />
                  Admission
                </Link>
              </div>

              <div className="sticky bottom-0 mt-auto border-t bg-white/98 backdrop-blur-xl p-4 space-y-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                {isAuthed ? (
                  <>
                    <Link
                      href={isAdmin ? "/admin" : "/dashboard"}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-[#005f48] text-white px-4 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur text-white">
                        <LayoutDashboard className="h-4 w-4" />
                      </span>
                      {isAdmin ? "Admin Panel" : "Dashboard"}
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                    {roleLinks.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {roleLinks.map((rl) => (
                          <Link
                            key={rl.href}
                            href={rl.href}
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2.5 rounded-xl text-xs font-medium text-center bg-muted/50 border border-primary/5 hover:bg-primary hover:text-white hover:border-primary transition-colors"
                          >
                            {rl.label}
                          </Link>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-primary/10 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-11"
                      onClick={() => {
                        setIsOpen(false);
                        signOut();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl bg-gradient-to-br from-primary/[0.06] to-blue-50/30 border border-primary/10 p-3">
                      <p className="text-xs font-bold text-primary text-center">Join 10,000+ Students</p>
                      <p className="text-[11px] text-muted-foreground text-center mt-1">Start your veterinary journey today</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl h-11 border-primary/15">
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        <Button className="w-full rounded-xl h-11 bg-gradient-to-r from-primary to-[#005f48] shadow-md">Sign Up</Button>
                      </Link>
                    </div>
                  </>
                )}
                <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> Secure • Trusted by 10K+
                </p>
              </div>
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    </header>
  );
}
