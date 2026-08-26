import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface PageHeaderProps {
  badge?: string;
  title: string;
  titleHighlight?: string;
  description: string;
  actions?: React.ReactNode;
  variant?: "primary" | "blue" | "emerald" | "purple" | "amber";
}

const variants = {
  primary: "from-primary via-[#005f48] to-[#003d2e]",
  blue: "from-blue-600 via-blue-700 to-indigo-700",
  emerald: "from-emerald-600 via-teal-600 to-cyan-700",
  purple: "from-purple-600 via-violet-600 to-indigo-600",
  amber: "from-amber-600 via-orange-600 to-red-600",
};

export function DecorativePageHeader({ badge, title, titleHighlight, description, actions, variant = "primary" }: PageHeaderProps) {
  const gradient = variants[variant];
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 shadow-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative px-6 py-10 md:px-10 md:py-12 text-white">
        {badge && (
          <Badge className="rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> {badge}
          </Badge>
        )}
        <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          {title} {titleHighlight && <span className="bg-gradient-to-r from-white via-white to-[#d4a843] bg-clip-text text-transparent">{titleHighlight}</span>}
        </h1>
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-white to-[#d4a843]" />
        <p className="mt-4 max-w-2xl text-white/80 leading-relaxed">{description}</p>
        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function DecorativeSectionHeader({ badge, title, highlight, description }: { badge?: string; title: string; highlight?: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {badge && <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" />{badge}</Badge>}
      <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
        {title} {highlight && <span className="va-gradient-text">{highlight}</span>}
      </h2>
      <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
