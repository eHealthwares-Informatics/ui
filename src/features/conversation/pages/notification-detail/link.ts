/** Serial-number ID link for the notification entity tables. */
export function notificationDetailHref(resource: string, row: Record<string, unknown>): string {
  const id = String(row.id ?? row._id ?? '');
  const search = row.organizationId
    ? `?organizationId=${encodeURIComponent(String(row.organizationId))}`
    : '';
  return `/conversation/notification-detail/${resource}/${id}${search}`;
}

/** Short monospace id label; the full id stays in the element title. */
export function shortId(value: unknown): string {
  const id = String(value ?? '');
  if (!id) {
    return '—';
  }
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}
