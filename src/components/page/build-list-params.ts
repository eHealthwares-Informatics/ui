/**
 * Builds the query params sent to an `rxsoft` list endpoint.
 *
 * The rxsoft backends expose a single `search` param that is either:
 *   - a PLAIN string  → the endpoint's ILIKE fallback (matches across the
 *     resource's searchable columns), or
 *   - a JSON object   → a column-filter DSL (`{ field: "TYPE|value|valueTo" }`).
 *
 * A free-text search must therefore ALWAYS go out as a plain string. It used to
 * be JSON-encoded whenever any other param (a column filter, or the superadmin
 * `organizationId`) was present too, which buried the text inside the filter bag
 * — the backend then parsed it as a column DSL, the search silently no-opped and
 * the list returned every row.
 *
 * Column filters are only JSON-encoded when there is no free text, since the
 * backend cannot carry both in one param.
 */
export function buildRxsoftListParams(
  queryParams: Record<string, any>,
  config?: { listParams?: Record<string, unknown> }
): Record<string, any> {
  // `page` + `limit` only: nothing to reshape.
  if (Object.keys(queryParams).length <= 2) {
    return queryParams;
  }

  const { page, limit, sortBy: sort, sortOrder: order, ...rest } = queryParams;

  // Config-driven top-level params (config.listParams) are re-emitted as real
  // query params, never JSON-encoded into the search bag.
  for (const key of Object.keys(config?.listParams ?? {})) {
    delete rest[key];
  }

  const freeText = typeof rest.search === 'string' ? rest.search.trim() : '';
  const filterKeys = Object.keys(rest).filter((key) => key !== 'search');

  const search = freeText
    ? freeText
    : filterKeys.length
      ? JSON.stringify(Object.fromEntries(filterKeys.map((key) => [key, rest[key]])))
      : '';

  return {
    page,
    limit,
    ...(sort ? { sortBy: sort, sortOrder: order ?? 'desc' } : {}),
    search,
    ...(config?.listParams ?? {}),
  };
}
