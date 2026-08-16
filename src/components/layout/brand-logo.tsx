import Link from "next/link";
import { cn } from "@/lib/utils";

// Inline SVG brand mark + wordmark. Used in place of a binary logo file so the
// brand is always visible; swap for a real Fexicon asset when available.
export function BrandLogo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const text = tone === "light" ? "text-white" : "text-foreground";
  const sub = tone === "light" ? "text-white/70" : "text-muted-foreground";
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 64 64"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="14" fill="#16a34a" />
        <text
          x="32"
          y="32"
          dy="0.35em"
          text-anchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="28"
          fontWeight="700"
          fill="#ffffff"
        >
          VA
        </text>
      </svg>
      <span className="leading-tight">
        <span className={cn("block text-lg font-bold", text)}>VetAcademia</span>
        <span className={cn("block text-xs", sub)}>
          Veterinary Education Portal
        </span>
      </span>
    </Link>
  );
}
