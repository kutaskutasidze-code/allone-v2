/**
 * Fetch ALL rows from a PostgREST query, working around Supabase's default
 * 1000-row response cap (`db-max-rows`). A large `.limit(50000)` does NOT raise
 * that cap — the server silently truncates — so any query that fetches rows to
 * count/sum/tally in JS must page through `.range()` windows instead.
 *
 * Pass a builder that applies `.range(from, to)` to a freshly-built query each
 * call (a PostgREST builder can't be reused after it's awaited):
 *
 *   const rows = await fetchAllRows((from, to) =>
 *     admin.from('leads').select('value, status').in('status', STAGES).range(from, to),
 *   );
 *
 * `opts.max` stops early once that many rows are collected (e.g. distribute only
 * needs the top N of an ordered pool).
 */
export async function fetchAllRows<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  opts?: { max?: number },
): Promise<T[]> {
  const PAGE = 1000;
  const max = opts?.max ?? Infinity;
  const rows: T[] = [];
  for (let from = 0; rows.length < max; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return max === Infinity ? rows : rows.slice(0, max);
}
