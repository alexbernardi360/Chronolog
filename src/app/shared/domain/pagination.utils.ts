/**
 * Row slots one page of a paginated list occupies.
 *
 * Every page but the last holds `pageSize` rows, so callers pad the short last
 * page up to this count and the pager underneath keeps its place instead of
 * jumping up. A list that fits on a single page keeps its natural size: there
 * is nowhere to page to, so there is nothing to hold still.
 *
 * A count that has not arrived yet reserves a full page, which is what the
 * loading skeletons want — the data services swallow errors and emit `null`,
 * so an unknown count is the normal state on first render.
 */
export function pageRowSlots(
  totalRows: number | null | undefined,
  pageSize: number,
): number {
  if (pageSize <= 0) return 0;
  if (totalRows == null) return pageSize;

  return Math.min(Math.max(totalRows, 0), pageSize);
}
