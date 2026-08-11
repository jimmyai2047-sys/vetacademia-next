"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, GraduationCap, BookOpen, FlaskConical, Stethoscope } from "lucide-react";

const programmes = [
  { name: "A.H.D.P.", href: "/syllabus/ahdp", icon: BookOpen },
  { name: "B.V.Sc & A.H.", href: "/syllabus/bvsc", icon: GraduationCap },
  { name: "M.V.Sc", href: "/syllabus/mvsc", icon: FlaskConical },
  { name: "Ph.D", href: "/syllabus/phd", icon: Stethoscope },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

          <Link href="/mock-tests">
            <Button variant="ghost">Mock Tests</Button>
          </Link>
          <Link href="/study-materials">
            <Button variant="ghost">Study Materials</Button>
          </Link>
          <Link href="/experts">
            <Button variant="ghost">Experts</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost">Pricing</Button>
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
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
              
              <div className="space-y-2">
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
                  href="/mock-tests"
                  className="block px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Mock Tests
                </Link>
                <Link
                  href="/study-materials"
                  className="block px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Study Materials
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
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
