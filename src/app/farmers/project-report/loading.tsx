export default function ProjectReportLoading() {
  return (
    <div className="container mx-auto px-4 py-6 pb-16">
      {/* Header skeleton */}
      <div className="relative mb-6 overflow-hidden rounded-[1.75rem] h-44 bg-muted animate-pulse" />
      <div className="mx-auto my-6 h-2 w-24 bg-muted rounded-full animate-pulse" />
      {/* Stepper skeleton */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 h-9 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      {/* Form card skeleton */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border rounded-xl p-5 space-y-3">
          <div className="h-5 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="border rounded-xl p-5 space-y-3">
          <div className="h-5 w-1/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
