import { Wrench, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "VetAcademia | Maintenance",
};

export default function MaintenancePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-primary/[0.03] to-white px-4">
      <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl pointer-events-none" />
      <div className="va-card-hover relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/80 backdrop-blur-xl shadow-xl text-center max-w-md w-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <div className="p-8 space-y-4">
          <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Scheduled maintenance</Badge>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#0284c7] text-white shadow-lg">
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Under <span className="va-gradient-text">Maintenance</span></h1>
          <div className="va-divider-dots max-w-[120px] mx-auto"><span /></div>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            We&apos;re currently performing scheduled maintenance. Please check back
            shortly.
          </p>
          <p className="text-xs text-muted-foreground">
            If you are an admin, you can still access the{" "}
            <a href="/admin" className="text-primary hover:underline">
              admin panel
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
