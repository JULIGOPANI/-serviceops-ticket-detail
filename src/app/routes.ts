/* URL routing — the one place that says what a screen is called in the address bar.
 *
 * ⚠️ HASH routing, deliberately. This deploys as a static build to GitHub Pages, which has no
 * SPA rewrite: a real path like /serviceops-ticket-detail/admin/os-upgrade would 404 the moment
 * anyone opened it directly or refreshed. A hash never reaches the server, so every link here
 * works on a cold load with no server config at all.
 *
 * Shape: #/<page>  and  #/admin/<module>
 *
 * Add a module by adding it in ONE place — a `Page` for a technician-portal listing, or an
 * `ADMIN_ROUTES` row for an admin screen. App reads this, AdminPage reads this; neither keeps
 * its own copy, so a slug can't mean two things.
 */

export type Page =
  | 'request' | 'problem' | 'change' | 'release'
  | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets'
  | 'software-licenses' | 'contracts' | 'purchases'
  | 'cmdb'
  | 'patches' | 'patch-deployments' | 'endpoints'
  | 'vulnerabilities' | 'detected-cves'
  | 'bom'
  | 'admin';

/** The page a bare URL lands on. */
export const DEFAULT_PAGE: Page = 'request';

/* Page ids ARE the slugs — they were already written that way, so there is no second naming
 * scheme to keep in step. This list only exists so an unknown slug can be rejected. */
const PAGES: readonly Page[] = [
  'request', 'problem', 'change', 'release',
  'hardware-assets', 'software-assets', 'non-it-assets', 'consumable-assets',
  'software-licenses', 'contracts', 'purchases',
  'cmdb',
  'patches', 'patch-deployments', 'endpoints',
  'vulnerabilities', 'detected-cves',
  'bom',
  'admin',
];

/** An admin destination that owns a screen, addressed as #/admin/<slug>. */
export interface AdminRoute {
  slug: string;
  /** The `ADMIN_SECTIONS` title AdminPage.select() expects. */
  section: string;
  /** The level-2 card, where the screen belongs to one rather than to the section. */
  card?: string;
}

/* Only screens that actually exist. A section that is still a card grid has no slug, because a
 * URL promising a screen that isn't built is worse than no URL. */
export const ADMIN_ROUTES: readonly AdminRoute[] = [
  { slug: 'os-upgrade', section: 'Patch Management', card: 'OS Upgrade' },
  { slug: 'support-portal', section: 'Support Channels', card: 'Support Portal' },
  { slug: 'bom-management', section: 'BOM Management' },
  { slug: 'bom-licensing', section: 'BOM Management', card: 'BOM Licensing' },
  { slug: 'bom-scheduler', section: 'BOM Management', card: 'BOM Scheduler' },
  { slug: 'bom-retention', section: 'BOM Management', card: 'BOM Retention' },
];

export const adminRouteBySlug = (slug: string): AdminRoute | undefined =>
  ADMIN_ROUTES.find((r) => r.slug === slug);

/** Reverse lookup for what the admin shell just opened, so it can report its own address. */
export const adminSlugFor = (section: string, card?: string): string | undefined =>
  (ADMIN_ROUTES.find((r) => r.section === section && r.card === card)
    ?? (card ? undefined : ADMIN_ROUTES.find((r) => r.section === section && !r.card)))?.slug;

export interface Route {
  page: Page;
  /** Admin module slug, when the page is 'admin' and a module is open. */
  admin?: string;
}

/** Read the address bar. Anything unrecognised falls back to the default page rather than
 *  rendering nothing — a mistyped link should land somewhere, not on a blank screen. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const page = parts[0] as Page | undefined;
  if (!page || !PAGES.includes(page)) return { page: DEFAULT_PAGE };
  if (page !== 'admin') return { page };
  const slug = parts[1];
  return { page, admin: slug && adminRouteBySlug(slug) ? slug : undefined };
}

export function formatHash(route: Route): string {
  if (route.page === 'admin' && route.admin) return `#/admin/${route.admin}`;
  return `#/${route.page}`;
}
