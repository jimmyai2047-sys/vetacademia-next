import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/fexicon.png"
        alt="VetAcademia"
        className="h-9 w-auto object-contain"
      />
    </Link>
  );
}
