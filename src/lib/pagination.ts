export function getPagination(req: Request): { take: number; skip: number } {
  const DEFAULT_TAKE = 20;
  const MIN_TAKE = 1;
  const MAX_TAKE = 100;

  const clampTake = (n: number): number => {
    if (!Number.isFinite(n)) return DEFAULT_TAKE;
    const floored = Math.floor(n);
    if (floored < MIN_TAKE) return MIN_TAKE;
    if (floored > MAX_TAKE) return MAX_TAKE;
    return floored;
  };

  const clampSkip = (n: number): number => {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  };

  let url: URL | null = null;
  try {
    url = new URL(req.url);
  } catch {
    return { take: DEFAULT_TAKE, skip: 0 };
  }

  const params = url.searchParams;

  // Direct form: ?take / ?limit / ?pageSize + ?skip / ?offset
  const takeRaw =
    params.get("take") ?? params.get("limit") ?? params.get("pageSize");
  const skipRaw = params.get("skip") ?? params.get("offset");

  // Paged form: ?page (1-indexed) + ?pageSize / ?limit
  const pageRaw = params.get("page");
  const pageSizeRaw = params.get("pageSize") ?? params.get("limit");

  // Prefer explicit ?take/?skip (or aliases) when present; otherwise derive from ?page/?pageSize.
  if (takeRaw !== null || skipRaw !== null) {
    const take = takeRaw !== null ? clampTake(Number(takeRaw)) : DEFAULT_TAKE;
    const skip = skipRaw !== null ? clampSkip(Number(skipRaw) || 0) : 0;
    return { take, skip };
  }

  if (pageRaw !== null || pageSizeRaw !== null) {
    const page = Math.max(1, Math.floor(Number(pageRaw) || 1));
    const take =
      pageSizeRaw !== null ? clampTake(Number(pageSizeRaw)) : DEFAULT_TAKE;
    const skip = (page - 1) * take;
    return { take, skip };
  }

  return { take: DEFAULT_TAKE, skip: 0 };
}

export function pagedResponse<T>(
  items: T[],
  total: number,
  take: number,
  skip: number
): { items: T[]; total: number; hasMore: boolean } {
  return {
    items,
    total,
    hasMore: skip + take < total,
  };
}
