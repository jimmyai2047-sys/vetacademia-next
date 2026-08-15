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
import {
  Menu,
  GraduationCap,
  BookOpen,
  FlaskConical,
  Stethoscope,
  FileCheck,
  Tractor,
  HeartPulse,
  LogOut,
  LayoutDashboard,
  Search,
} from "lucide-react";

const programmes = [
  { name: "A.H.D.P.", href: "/syllabus/ahdp", icon: BookOpen },
  { name: "B.V.Sc & A.H.", href: "/syllabus/bvsc", icon: GraduationCap },
  { name: "M.V.Sc", href: "/syllabus/mvsc", icon: FlaskConical },
  { name: "Ph.D", href: "/syllabus/phd", icon: Stethoscope },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  const isAuthed = status === "authenticated" && !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";
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
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
            VA
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold">VetAcademia</span>
            <span className="text-xs text-muted-foreground block -mt-1">
              Veterinary Education Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Syllabus
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {programmes.map((p) => (
                <DropdownMenuItem key={p.name}>
                  <Link href={p.href} className="flex items-center gap-2 w-full">
                    <p.icon className="h-4 w-4" />
                    {p.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/examinations">
            <Button variant="ghost" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Examinations
            </Button>
          </Link>
          <Link href="/prepare">
            <Button variant="ghost" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Exam Prep
            </Button>
          </Link>
          <Link href="/farmers">
            <Button variant="ghost" className="gap-2">
              <Tractor className="h-4 w-4" />
              Farmers
            </Button>
          </Link>
          <Link href="/vets">
            <Button variant="ghost" className="gap-2">
              <HeartPulse className="h-4 w-4" />
              Vets
            </Button>
          </Link>
          <Link href="/experts">
            <Button variant="ghost">Experts</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost">Pricing</Button>
          </Link>
        </nav>

        {/* Global Search */}
        <form
          onSubmit={handleSearch}
          className="hidden lg:flex items-center relative"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="pl-9 pr-3 h-9 w-48 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        {/* Auth Buttons / User Menu */}
        <div className="hidden md:flex items-center gap-3">
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
          <SheetTrigger className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-8">
              <div className="font-bold text-lg">VetAcademia</div>

              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subjects..."
                  className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </form>
              
              <div className="space-y-2">
                <Link
                  href="/"
                  className="block px-3 py-2 rounded-md hover:bg-accent font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <div className="text-sm font-medium text-muted-foreground">Programmes</div>
                {programmes.map((p) => (
                  <Link
                    key={p.name}
                    href={p.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <p.icon className="h-4 w-4" />
                    {p.name}
                  </Link>
                ))}
              </div>

              <div className="space-y-2">
                <Link
                  href="/examinations"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <FileCheck className="h-4 w-4" />
                  Examinations
                </Link>
                <Link
                  href="/prepare"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <BookOpen className="h-4 w-4" />
                  Exam Prep
                </Link>
                <Link
                  href="/farmers"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <Tractor className="h-4 w-4" />
                  Farmers
                </Link>
                <Link
                  href="/vets"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <HeartPulse className="h-4 w-4" />
                  Vets
                </Link>
                <Link
                  href="/experts"
                  className="block px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Experts
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
