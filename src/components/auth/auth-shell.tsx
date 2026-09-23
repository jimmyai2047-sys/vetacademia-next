import Link from "next/link";
import { GraduationCap, BookOpenCheck, Users, Stethoscope } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

// P1: shared split-screen shell for all (auth) pages.
// Left: brand panel (desktop only). Right: form card content.
export function AuthShell({
  title,
  subtitle,
  hindiSubtitle,
  children,
  wide = false,
  footer,
}: {
  title: string;
  subtitle: string;
  hindiSubtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-200px)] items-stretch justify-center overflow-hidden bg-gradient-to-b from-white via-primary/[0.03] to-white px-4 py-8 sm:py-12">
      <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" aria-hidden="true" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl pointer-events-none" aria-hidden="true" />

      <div
        className={cn(
          "relative grid w-full overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/90 shadow-xl backdrop-blur-xl",
          wide ? "max-w-4xl lg:grid-cols-[380px_1fr]" : "max-w-3xl lg:grid-cols-[320px_1fr]"
        )}
      >
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between gap-6 overflow-hidden bg-gradient-to-b from-primary to-[#0c4a6e] p-6 text-white lg:flex">
          <div className="absolute inset-0 va-pattern-grid opacity-10 pointer-events-none" aria-hidden="true" />
          <div>
            <BrandLogo
              className="rounded-xl bg-white/95 p-1.5 shadow-md [&_img]:h-8"
              imgClassName="h-8"
            />
            <h2 className="mt-5 text-xl font-bold leading-snug tracking-tight">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>
            {hindiSubtitle ? (
              <p className="mt-1 text-sm text-white/60">{hindiSubtitle}</p>
            ) : null}
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              Syllabus, mock tests &amp; previous papers
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
              Community &amp; expert guidance
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <Stethoscope className="h-4 w-4" aria-hidden="true" />
              </span>
              Built for vets, students &amp; farmers
            </li>
          </ul>
          <p className="flex items-center gap-1.5 text-xs text-white/60">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            Trusted by veterinary learners across India
          </p>
        </aside>

        {/* Form column */}
        <div className="relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" aria-hidden="true" />
          <div className="flex items-center gap-2 px-5 pt-5 sm:px-7 lg:hidden">
            <BrandLogo className="[&_img]:h-8" imgClassName="h-8" />
            <Link href="/" className="sr-only">
              VetAcademia home
            </Link>
          </div>
          <div className="flex-1 px-5 py-6 sm:px-7">{children}</div>
          {footer ? (
            <div className="border-t border-primary/10 px-5 py-4 sm:px-7">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
