export const adminCredentials = {
  username: 'admin',
  password: 'password',
} as const;

/** The 33 Local Government Areas of Oyo State (seeded fixture names). */
export const oyoLgas: readonly string[] = [
  'Afijio',
  'Akinyele',
  'Atiba',
  'Atisbo',
  'Egbeda',
  'Ibadan North',
  'Ibadan North-East',
  'Ibadan North-West',
  'Ibadan South-East',
  'Ibadan South-West',
  'Ibarapa Central',
  'Ibarapa East',
  'Ibarapa North',
  'Ido',
  'Irepo',
  'Iseyin',
  'Itesiwaju',
  'Iwajowa',
  'Kajola',
  'Lagelu',
  'Ogbomosho North',
  'Ogbomosho South',
  'Ogo Oluwa',
  'Oluyole',
  'Ona Ara',
  'Orelope',
  'Ori Ire',
  'Oyo East',
  'Oyo West',
  'Saki East',
  'Saki West',
  'Surulere',
  'Ogbomoso',
];

/** Module id -> authenticated root path (used for redirect assertions). */
export const moduleRoots: Readonly<Record<string, string>> = {
  rxsoft: '/rxsoft/items',
  conversation: '/conversation',
  'coding-concept': '/coding-concept',
  communication: '/communication',
  lis: '/lis',
  emr: '/emr',
  admin: '/apm/admin/conversion',
};

/** Top-level APM website navigation (label -> path), from WebsiteLayout navItems. */
export const apmWebsiteNav: ReadonlyArray<{ label: string; path: string }> = [
  { label: 'Home', path: '/apm' },
  { label: 'Meet Adekanmbi', path: '/apm/meet' },
  { label: 'Oyo Next', path: '/apm/agenda' },
  { label: 'Achievements', path: '/apm/achievements' },
  { label: 'News', path: '/apm/news' },
  { label: 'Events', path: '/apm/events' },
  { label: 'Volunteer', path: '/apm/volunteer' },
  { label: 'Media', path: '/apm/media' },
  { label: 'Contact', path: '/apm/contact' },
];

/** APM admin sidebar items (label -> path), from AdminLayout adminNavItems. */
export const apmAdminNav: ReadonlyArray<{ label: string; path: string }> = [
  { label: 'Dashboard', path: '/apm/admin/conversion' },
  { label: 'LGAs', path: '/apm/admin/lgas' },
  { label: 'Stakeholders', path: '/apm/admin/stakeholders' },
  { label: 'Tours', path: '/apm/admin/tours' },
  { label: 'Canvassing', path: '/apm/admin/canvassing' },
  { label: 'Content', path: '/apm/admin/content' },
  { label: 'Listening', path: '/apm/admin/listening' },
  { label: 'Sentiment', path: '/apm/admin/sentiment' },
  { label: 'Volunteers', path: '/apm/admin/volunteers' },
  { label: 'WhatsApp', path: '/apm/admin/whatsapp' },
  { label: 'Agents', path: '/apm/admin/agents' },
  { label: 'Results', path: '/apm/admin/results' },
  { label: 'Protection', path: '/apm/admin/incidents' },
  { label: 'GOTV', path: '/apm/admin/gotv' },
];
