/* URL routing — the one place that says what a screen is called in the address bar.
 *
 * ⚠️ HASH routing, deliberately. This deploys as a static build to GitHub Pages, which has no
 * SPA rewrite: a real path like /serviceops-ticket-detail/admin/os-upgrade would 404 the moment
 * anyone opened it directly or refreshed. A hash never reaches the server, so every link here
 * works on a cold load with no server config at all.
 *
 * Shape: #/<page>  ·  #/admin/<module>  ·  #/admin/support-portal/<portal>
 *        #/admin/organization/workspace[/create | /preview | /<id>[/team | /audit | /edit | /settings]]
 *        #/admin/users/technician[/create | /<id>]   (the ServiceOps list and Add/Edit Technician form)
 *
 * Add a module by adding it in ONE place — a `Page` for a technician-portal listing, or an
 * `ADMIN_ROUTES` row for an admin screen. App reads this, AdminPage reads this; neither keeps
 * its own copy, so a slug can't mean two things.
 */

import { SCOPED_CARDS } from './components/scopedCards';

export type Page =
  | 'request' | 'problem' | 'change' | 'release'
  | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets'
  | 'software-licenses' | 'contracts' | 'purchases'
  | 'cmdb'
  | 'patches' | 'patch-deployments' | 'endpoints'
  | 'vulnerabilities' | 'detected-cves'
  | 'bom'
  | 'admin'
  /* ESM F18: what an EMPLOYEE sees — the ESM Portal and each workspace's Support Portal (#/portal[/<sub>]). */
  | 'portal';

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
  'portal',
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
  // ESM F18 — the landing page employees see before picking a team (Admin › Global).
  { slug: 'esm-portal', section: 'Support Channels', card: 'ESM Portal' },
  { slug: 'bom-management', section: 'BOM Management' },
  { slug: 'bom-licensing', section: 'BOM Management', card: 'BOM Licensing' },
  { slug: 'bom-scheduler', section: 'BOM Management', card: 'BOM Scheduler' },
  { slug: 'bom-retention', section: 'BOM Management', card: 'BOM Retention' },
  /* ⚠️ Two segments, nested under organization like the product's own Organization pages
     (/admin/organization/department, /admin/organization/msp). parseHash tries a two-segment slug
     before a one-segment one. ESM F01. */
  { slug: 'organization/workspace', section: 'Organization', card: 'Workspaces' },
  // ESM F02/F03: the organization's technician accounts and their workspace permissions.
  { slug: 'users/technician', section: 'Users', card: 'Technicians' },
  // ESM F03: the ServiceOps Roles screens (/admin/roles, /admin/roles/<id>, /admin/roles/create).
  { slug: 'roles', section: 'Users', card: 'Roles' },
  // ESM F04: the ServiceOps Business Hours and SLA screens with the Workspace ▾ selector (same slugs as live).
  { slug: 'business-hours', section: 'Organization', card: 'Business Hours' },
  { slug: 'sla', section: 'Automation', card: 'SLA' },
  // ESM F04: every other per-workspace ServiceOps page (scopedCards.ts), one slug per card.
  ...SCOPED_CARDS.map((c) => ({ slug: c.slug, section: c.section, card: c.card })),
];

/** The ESM Workspaces list. Its record segments are 'create', '<id>' or '<id>/edit'. */
export const WORKSPACE_SLUG = 'organization/workspace';
/** Technicians: its record segments are 'create' or '<id>' (the Edit Technician form). */
export const TECHNICIAN_SLUG = 'users/technician';

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
  /* A record INSIDE an admin module — today only a support portal, which is why it is named for
     what it is rather than a generic `id`. A second module wanting one should widen this
     deliberately rather than inherit a name that stopped describing it. */
  portal?: string;
  /** The Workspaces module's record segments: 'create', '<id>' or '<id>/edit'. An unknown id is KEPT,
   *  not rewritten — the module renders "Workspace does not exist" for it, which is the point. */
  workspace?: string;
  /** The Technicians module's record segments: 'create' or '<id>'. */
  technician?: string;
  /** The Roles module's record segments: 'create', '<id>' or 'clone-<id>'. */
  role?: string;
  /** ESM F18: everything after #/portal (home, requests, <team>, <team>/new?service=…). */
  sub?: string;
}

/** The address of one portal, as a slug. Names are unique (see `uniquePageName`), so the slug is
 *  too — and it is far more use in a shared link than `spp-3`. */
export const portalSlug = (name: string, id: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id.toLowerCase();

/** Read the address bar. Anything unrecognised falls back to the default page rather than
 *  rendering nothing — a mistyped link should land somewhere, not on a blank screen. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const page = parts[0] as Page | undefined;
  if (!page || !PAGES.includes(page)) return { page: DEFAULT_PAGE };
  if (page === 'portal') return { page, sub: parts.slice(1).join('/') || undefined };
  if (page !== 'admin') return { page };
  const nested = parts.slice(1, 3).join('/');
  if (parts.length >= 3 && adminRouteBySlug(nested)) {
    const record = parts.length > 3 ? parts.slice(3).join('/') : undefined;
    return { page, admin: nested, workspace: nested === WORKSPACE_SLUG ? record : undefined, technician: nested === TECHNICIAN_SLUG ? record : undefined };
  }
  const slug = parts[1];
  if (!slug || !adminRouteBySlug(slug)) return { page };
  /* ⚠️ A third segment only means something for the one module that has records. Anywhere else it
     is ignored rather than rejected — a stray segment should still land you on the module, not on
     the default page with no explanation. */
  return { page, admin: slug, portal: slug === 'support-portal' ? parts[2] : undefined, role: slug === 'roles' ? parts[2] : undefined };
}

export function formatHash(route: Route): string {
  if (route.page === 'admin' && route.admin) {
    const record = route.portal ?? route.workspace ?? route.technician ?? route.role;
    return record ? `#/admin/${route.admin}/${record}` : `#/admin/${route.admin}`;
  }
  if (route.page === 'portal' && route.sub) return `#/portal/${route.sub}`;
  return `#/${route.page}`;
}

// ── Document title ─────────────────────────────────────────────────────────

/* What the browser tab, the bookmark and the history entry are called. The module leads, because
 * that is the part someone scanning a row of tabs is looking for. */
export const PRODUCT = 'Motadata ServiceOps';

const PAGE_TITLES: Record<Page, string> = {
  request: 'Requests',
  problem: 'Problems',
  change: 'Changes',
  release: 'Releases',
  'hardware-assets': 'Hardware Assets',
  'software-assets': 'Software Assets',
  'non-it-assets': 'Non-IT Assets',
  'consumable-assets': 'Consumable Assets',
  'software-licenses': 'Software Licenses',
  contracts: 'Contracts',
  purchases: 'Purchases',
  cmdb: 'CMDB',
  patches: 'Patches',
  'patch-deployments': 'Patch Deployments',
  endpoints: 'Endpoints',
  vulnerabilities: 'Vulnerabilities',
  'detected-cves': 'Detected CVEs',
  bom: 'BOM Inventory',
  admin: 'Admin',
  portal: 'Support Portal',
};

/* An admin screen is named by its CARD where it has one, otherwise by its section — the same
 * words the sidebar uses, so the tab agrees with the nav rather than inventing a third name. */
export function titleFor(route: Route): string {
  const r = route.page === 'admin' && route.admin ? adminRouteBySlug(route.admin) : undefined;
  const name = r ? (r.card ?? r.section) : PAGE_TITLES[route.page];
  return `${name} · ${PRODUCT}`;
}

/** The absolute link to a portal — what Copy link puts on the clipboard. Built from the page's own
 *  origin and path so it is correct on localhost, on Pages and behind any base path. */
export const portalLink = (slug: string) =>
  `${window.location.origin}${window.location.pathname}#/admin/support-portal/${slug}`;
