export default function FarmersLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero skeleton */}
      <div className="relative mb-8 overflow-hidden rounded-2xl h-48 bg-muted animate-pulse" />

      {/* Search skeleton */}
      <div className="relative mb-6 max-w-md h-10 bg-muted rounded-lg animate-pulse" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden">
            <div className="h-40 bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
