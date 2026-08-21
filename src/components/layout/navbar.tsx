"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function toggleSection(name: string) {
    setExpanded((e) => ({ ...e, [name]: !e[name] }));
  }
  const [search, setSearch] = useState("");
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const router = useRouter();

  function setMenu(name: string, open: boolean) {
    setOpenMenus((m) => ({ ...m, [name]: open }));
  }
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
        { href: "/farmers", label: "Advisory" },
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <BrandLogo src="/favicon-192x192.png" imgClassName="h-11 w-auto" />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost">Home</Button>
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
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md opacity-0 invisible translate-y-1 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              {programmes.map((p) => (
                <Link
                  key={p.name}
                  href={p.href}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <p.icon className="h-4 w-4" />
                  {p.name}
                </Link>
              ))}
              <div className="my-1 h-px bg-border" />
              <Link
                href="/syllabus"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BookOpenCheck className="h-4 w-4" />
                View All Syllabus
              </Link>
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
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md opacity-0 invisible translate-y-1 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              {examCategories.map((c) => (
                <Link
                  key={c.name}
                  href={c.href}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <c.icon className="h-4 w-4 shrink-0" />
                  <div>
                    <div>{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                </Link>
              ))}
              <div className="my-1 h-px bg-border" />
              <Link
                href="/study-materials"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BookOpenCheck className="h-4 w-4" />
                Study Materials
              </Link>
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
            <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border bg-popover p-1 text-popover-foreground shadow-md opacity-0 invisible translate-y-1 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Exam Tracks
              </div>
              {prepCategories.map((c) => (
                <Link
                  key={c.name}
                  href={c.href}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <c.icon className="h-4 w-4 shrink-0" />
                  <div>
                    <div>{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                </Link>
              ))}
              <div className="my-1 h-px bg-border" />
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Study Tools
              </div>
              <Link href="/mock-tests" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <FileText className="h-4 w-4" /> Mock Tests
              </Link>
              <Link href="/flashcards" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <BookMarked className="h-4 w-4" /> Flashcards
              </Link>
              <Link href="/papers" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <FileCheck className="h-4 w-4" /> Previous Year Papers
              </Link>
              <Link href="/study-materials" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <BookOpenCheck className="h-4 w-4" /> Study Materials
              </Link>
              <Link href="/live-classes" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Radio className="h-4 w-4" /> Live Classes
              </Link>
              <Link href="/demo" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Play className="h-4 w-4" /> Free Demo
              </Link>
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
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md opacity-0 invisible translate-y-1 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Community
              </div>
              <Link href="/experts" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Users className="h-4 w-4" /> Experts
              </Link>
              <Link href="/farmers" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Tractor className="h-4 w-4" /> Animal Owner
              </Link>
              <Link href="/vets" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <HeartPulse className="h-4 w-4" /> Vets
              </Link>
              <Link href="/community" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Users className="h-4 w-4" /> Community
              </Link>
              <div className="my-1 h-px bg-border" />
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Content
              </div>
              <Link href="/blog" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Newspaper className="h-4 w-4" /> Blog
              </Link>
              <Link href="/books" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <BookOpen className="h-4 w-4" /> Books
              </Link>
              <Link href="/testimonials" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Star className="h-4 w-4" /> Success Stories
              </Link>
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
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md opacity-0 invisible translate-y-1 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 focus-within:opacity-100 focus-within:visible focus-within:translate-y-0">
              <Link href="/about" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Info className="h-4 w-4" /> About Us
              </Link>
              <Link href="/pricing" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <IndianRupee className="h-4 w-4" /> Pricing
              </Link>
              <Link href="/contact" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <Phone className="h-4 w-4" /> Contact Us
              </Link>
              <Link href="/faqs" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <FileQuestion className="h-4 w-4" /> FAQs
              </Link>
              <Link href="/help" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <LifeBuoy className="h-4 w-4" /> Help Center
              </Link>
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
            className="pl-9 pr-3 h-9 w-48 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 overflow-y-auto">
            <div className="flex flex-col gap-4 mt-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/favicon-192x192.png"
                    alt="VetAcademia"
                    className="h-7 w-7 object-contain"
                  />
                </div>
                <span className="font-bold text-lg">VetAcademia</span>
              </div>

              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subjects..."
                  aria-label="Search subjects"
                  className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </form>

              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-accent font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <Home className="h-4 w-4 text-primary" />
                  Home
                </Link>

                <button
                  type="button"
                  onClick={() => toggleSection("programmes")}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent font-medium"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Programmes
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.programmes ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded.programmes && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    {programmes.map((p) => (
                      <Link
                        key={p.name}
                        href={p.href}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        <p.icon className="h-4 w-4 text-primary" />
                        {p.name}
                      </Link>
                    ))}
                    <Link
                      href="/syllabus"
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <BookOpenCheck className="h-4 w-4 text-primary" />
                      View All Syllabus
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("exams")}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent font-medium"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    Exams
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.exams ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded.exams && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    <Link
                      href="/examinations"
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <FileCheck className="h-4 w-4 text-primary" />
                      All Examinations
                    </Link>
                    {examCategories.map((c) => (
                      <Link
                        key={c.name}
                        href={c.href}
                        className="flex items-start gap-2 px-3 py-2 rounded-md hover:bg-accent"
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
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <BookOpenCheck className="h-4 w-4 text-primary" />
                      Study Materials
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("prepare")}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent font-medium"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Prepare
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.prepare ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded.prepare && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    {prepCategories.map((c) => (
                      <Link
                        key={c.name}
                        href={c.href}
                        className="flex items-start gap-2 px-3 py-2 rounded-md hover:bg-accent"
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
                    <Link href="/mock-tests" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <FileText className="h-4 w-4 text-primary" /> Mock Tests
                    </Link>
                    <Link href="/flashcards" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <BookMarked className="h-4 w-4 text-primary" /> Flashcards
                    </Link>
                    <Link href="/papers" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <FileCheck className="h-4 w-4 text-primary" /> Previous Year Papers
                    </Link>
                    <Link href="/live-classes" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Radio className="h-4 w-4 text-primary" /> Live Classes
                    </Link>
                    <Link href="/demo" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Play className="h-4 w-4 text-primary" /> Free Demo
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("resources")}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Resources
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.resources ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded.resources && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    <Link href="/experts" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Users className="h-4 w-4 text-primary" /> Experts
                    </Link>
                    <Link href="/farmers" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Tractor className="h-4 w-4 text-primary" /> Animal Owner
                    </Link>
                    <Link href="/vets" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <HeartPulse className="h-4 w-4 text-primary" /> Vets
                    </Link>
                    <Link href="/community" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Users className="h-4 w-4 text-primary" /> Community
                    </Link>
                    <Link href="/blog" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Newspaper className="h-4 w-4 text-primary" /> Blog
                    </Link>
                    <Link href="/books" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <BookOpen className="h-4 w-4 text-primary" /> Books
                    </Link>
                    <Link href="/testimonials" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Star className="h-4 w-4 text-primary" /> Success Stories
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("about")}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    About
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.about ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded.about && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    <Link href="/about" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Info className="h-4 w-4 text-primary" /> About Us
                    </Link>
                    <Link href="/pricing" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <IndianRupee className="h-4 w-4 text-primary" /> Pricing
                    </Link>
                    <Link href="/contact" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <Phone className="h-4 w-4 text-primary" /> Contact Us
                    </Link>
                    <Link href="/faqs" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <FileQuestion className="h-4 w-4 text-primary" /> FAQs
                    </Link>
                    <Link href="/help" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsOpen(false)}>
                      <LifeBuoy className="h-4 w-4 text-primary" /> Help Center
                    </Link>
                  </div>
                )}

                <Link
                  href="/admission"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="h-4 w-4" />
                  Admission
                </Link>
              </div>

              <div className="border-t pt-4 space-y-2">
                {isAuthed ? (
                  <>
                    <Link
                      href={isAdmin ? "/admin" : "/dashboard"}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                        {isAdmin ? "Admin Panel" : "Dashboard"}
                      </Link>
                      {roleLinks.map((rl) => (
                        <Link
                          key={rl.href}
                          href={rl.href}
                          onClick={() => setIsOpen(false)}
                          className="px-3 py-2 rounded-md hover:bg-accent"
                        >
                          {rl.label}
                        </Link>
                      ))}
                    <Button
                      variant="outline"
                      className="w-full"
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
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
