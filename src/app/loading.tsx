// Route-level skeleton so navigation never flashes an empty "Loading…"
// page. It mirrors the homepage hero shape, so server-rendered content
// (or a cached skeleton) appears instantly for users and crawlers.
export default function Loading() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading page content">
      <section className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-4">
            <div className="h-6 w-56 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-3/4 animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-muted" />
            <div className="h-5 w-full max-w-xl animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-2/3 max-w-xl animate-pulse rounded-lg bg-muted" />
            <div className="flex gap-3">
              <div className="h-11 w-44 animate-pulse rounded-xl bg-muted" />
              <div className="h-11 w-44 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
          <div className="h-[260px] animate-pulse rounded-[1.5rem] bg-muted sm:h-[340px] md:h-[380px]" />
        </div>
      </section>
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </section>
      <p className="sr-only">Loading…</p>
    </div>
  );
}
