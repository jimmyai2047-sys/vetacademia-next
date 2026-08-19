export async function adminFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers = new Headers(options?.headers);
  headers.set("X-Requested-With", "XMLHttpRequest");
  return fetch(url, { ...options, headers });
}

export async function adminFetchJson<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; ok: boolean }> {
  try {
    const res = await adminFetch(url, options);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        data: null,
        error: data?.error || `Request failed (${res.status})`,
        ok: false,
      };
    }
    return { data: data as T, error: null, ok: true };
  } catch {
    return { data: null, error: "Network error", ok: false };
  }
}
