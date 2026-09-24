const SUBDOMAIN_ROUTES: Record<string, string> = {
  rxsoft: '/dashboard/sales',
  damorex: '/shop',
  apm: '/apm',
  conversation: '/conversation',
};

// External apex/custom domains mapped onto a "subdomain" key so client-side
// default routing works when the site is served from a non-*.ehealthwares.com
// host (e.g. damorex.com).
const HOST_ALIASES: Record<string, string> = {
  'damorex.com': 'damorex',
  'www.damorex.com': 'damorex',
};

export function getSubdomain(): string {
  const host = window.location.hostname;
  const alias = HOST_ALIASES[host];
  if (alias) return alias;
  const match = host.match(/^(.+?)\.ehealthwares\.com$/);
  return match?.[1] ?? '';
}

export function getDefaultRoute(): string {
  return SUBDOMAIN_ROUTES[getSubdomain()] ?? '/';
}
