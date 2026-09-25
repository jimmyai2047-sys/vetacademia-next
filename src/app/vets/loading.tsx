export default function VetsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Header skeleton */}
      <div className="relative mb-8 overflow-hidden rounded-[1.75rem] h-48 bg-muted animate-pulse" />
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-[1.25rem] animate-pulse" />
        ))}
      </div>
      {/* Tools skeleton */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      {/* Articles skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden">
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
