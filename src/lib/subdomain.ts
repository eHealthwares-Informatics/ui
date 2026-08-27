const SUBDOMAIN_ROUTES: Record<string, string> = {
  rxsoft: '/dashboard/sales',
  damorex: '/damorex',
  apm: '/apm',
  conversation: '/conversation',
};

export function getSubdomain(): string {
  const host = window.location.hostname;
  const match = host.match(/^(.+?)\.ehealthwares\.com$/);
  return match?.[1] ?? '';
}

export function getDefaultRoute(): string {
  return SUBDOMAIN_ROUTES[getSubdomain()] ?? '/';
}
