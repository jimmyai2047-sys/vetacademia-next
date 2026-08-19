import { Loader2 } from "lucide-react";

export default function ExamLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg border bg-muted/30 animate-pulse" />
        ))}
      </div>
      <div className="flex items-center justify-center mt-10 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading exam content...</span>
      </div>
    </div>
  );
}
