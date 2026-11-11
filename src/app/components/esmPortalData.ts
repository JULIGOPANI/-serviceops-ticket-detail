/* ESM F18 · Employee portal (Juli, 2026-11-05: "yes").
 *
 *   ESM Portal (Admin › Global › Support Channels › ESM Portal, NEW)  = the LANDING page only, as ManageEngine's
 *     ESM Portal: "How can we help you?", search across every team, "Which team do you need help with?" cards.
 *     Shown only to people who can see two or more teams. Self-registration and sign-in stay global here.
 *   A card opens the SUPPORT PORTAL MAPPED TO THAT WORKSPACE (one portal per workspace, made from its template).
 *     Today's portal ("Support Portal", Default) is IT's portal, unchanged.
 *   Each workspace's portal keeps the full live trio: Edit (details) · Support Portal Branding · Support Portal Setting
 *     (185, Admin › Support Channels › Support Portals, verified 2026-11-05).
 *   Which cards a person sees = the workspace is Live AND its Portal Access lets them in (F02a §9, portalVerdict).
 *   Search = every team the person can see, each result tagged with its team (Juli: yes).
 *
 * Record: Features/F18-employee-portal.md §7–§8. Everything below is prototype data kept in localStorage. */

import { KIND_TEMPLATE } from './workspaceData';
import type { Workspace, WorkspaceType } from './workspaceData';
import { EMPLOYEES, portalVerdict } from './WorkspacePrivacyRows';

export type Employee = (typeof EMPLOYEES)[number];

// ── ESM Portal (landing page) configuration ─────────────────────────────────────────────────────────────────
export interface EsmLink { label: string; url: string }
export interface EsmPortalConfig {
  heading: string;
  subheading: string;
  searchPlaceholder: string;
  cardsHeading: string;
  /** Banner gradient. */
  bannerFrom: string;
  bannerTo: string;
  /** Tiles (icon on top, ME style) or rows (icon left, description beside it). */
  cardStyle: 'tiles' | 'rows';
  /** Show each workspace's one-line card description under its name. */
  showDescriptions: boolean;
  /** Workspace ids in the order the cards appear; ids not listed follow by name. */
  order: number[];
  /** "My open requests & approvals from every team" strip under the cards (our addition to ME's page). */
  showMyWork: boolean;
  links: EsmLink[];
  /** Where people with ≥2 visible teams land: the ESM Portal, or straight into one workspace's portal. */
  landing: 'esm' | number;
  /** Each person may ⭐ one team as their own landing page (ME's per-user default instance). */
  allowStar: boolean;
  /** Global requester sign-up (moved here from the per-portal User settings: one sign-in for all teams). */
  selfRegistration: boolean;
  registrationType: 'Allow everyone' | 'Set of Domains';
  domains: string;
}

export const DEFAULT_ESM: EsmPortalConfig = {
  heading: 'How can we help you?',
  subheading: 'Search across every team, or pick the team you need.',
  searchPlaceholder: 'Search services, articles and your requests',
  cardsHeading: 'Which team do you need help with?',
  bannerFrom: '#0B0B0C',
  bannerTo: '#1F2937',
  cardStyle: 'tiles',
  showDescriptions: true,
  order: [1, 2, 3, 4],
  showMyWork: true,
  links: [{ label: 'Company intranet', url: 'intranet.acme.com' }, { label: 'HR policies', url: 'policies.acme.com' }],
  landing: 'esm',
  allowStar: true,
  selfRegistration: true,
  registrationType: 'Allow everyone',
  domains: '',
};

// ── Each workspace's support portal (Edit details + Branding + Setting) ─────────────────────────────────────
export type CardIcon = 'Headset' | 'Users' | 'Building2' | 'Wallet' | 'Scale' | 'LifeBuoy';
export const CARD_ICONS: CardIcon[] = ['Headset', 'Users', 'Building2', 'Wallet', 'Scale', 'LifeBuoy'];

export interface WsPortal {
  /** Edit (details) */
  name: string;
  slug: string;
  /** Earlier paths: still open this portal (redirect), so links already sent keep working. */
  oldSlugs?: string[];
  cardIcon: CardIcon;
  cardDesc: string;
  /** Support Portal Branding › Details — empty = the Organization value (Admin › Organization › Branding). */
  title: string;
  greeting: string;
  supportEmail: string;
  contactNo: string;
  /** Support Portal Branding › Theme */
  colour: string;
  /** Support Portal Setting — the live toggles (185), this workspace's own copy. */
  settings: Record<string, boolean>;
}

/** Organization values (Admin › Organization › Branding on 185) that a workspace portal inherits when its field is empty. */
export const ORG_BRANDING = { title: 'Support Portal', greeting: 'Welcome to Support Portal', supportEmail: 'support@acme.com', contactNo: '+1 555 0100' };

const ICON_FOR: Record<WorkspaceType, CardIcon> = { it: 'Headset', hr: 'Users', facilities: 'Building2', finance: 'Wallet', legal: 'Scale', general: 'LifeBuoy' };
const SLUG_FOR: Record<WorkspaceType, string> = { it: '', hr: 'hr', facilities: 'facilities', finance: 'finance', legal: 'legal', general: '' };

/** The live Support Portal Setting groups (185) and which owner holds them in ESM. `itOnly` = shown in IT-type workspaces only. */
export const SETTING_GROUPS: { title: string; itOnly?: boolean; rows: { key: string; label: string }[] }[] = [
  { title: 'Request', rows: [
    { key: 'createIncident', label: 'Allow Requester to create Incident' },
    { key: 'guestReport', label: 'Allow Guest Requester to Report a Request' },
    { key: 'onBehalf', label: 'Allow Requester to Create Incident On Behalf Of Other Requester' },
    { key: 'viewDueBy', label: 'Allow Requester to View Request Due By' },
    { key: 'accessSolution', label: 'Allow Requester To Access Solution' },
    { key: 'closeRequest', label: 'Allow Requester to Close Request' },
    { key: 'submitFeedback', label: 'Allow Requester To Submit Feedback' },
    { key: 'reopenResolved', label: 'Allow Requester to Reopen Resolved Request' },
    { key: 'auditTrail', label: 'Allow Requester to access Audit Trail' },
  ] },
  { title: 'Service Catalog', rows: [
    { key: 'accessCatalog', label: 'Allow Requester To Access Service Catalog' },
    { key: 'guestService', label: 'Allow Guest Requester to Request for Service' },
    { key: 'serviceOnBehalf', label: 'Allow Requester to Request Service On Behalf Of Other Requester' },
  ] },
  { title: 'Change', itOnly: true, rows: [{ key: 'myChanges', label: 'Allow Requester To Access My Changes' }] },
  { title: 'Asset', itOnly: true, rows: [
    { key: 'myAssets', label: 'Allow Requester to Access My Assets' },
    { key: 'linkAsset', label: 'Allow Requester to Link Asset' },
  ] },
  { title: 'CMDB', itOnly: true, rows: [
    { key: 'myCi', label: 'Allow Requester to Access My CI' },
    { key: 'linkCi', label: 'Allow Requester to Link CI' },
  ] },
  { title: 'Knowledge', rows: [
    { key: 'accessKnowledge', label: 'Allow Requester To Access Knowledge' },
    { key: 'suggestKnowledge', label: 'Show Suggested Knowledge while creating new Request' },
  ] },
  { title: 'Approval', rows: [
    { key: 'myApprovals', label: 'Allow Requester To Access My Approvals' },
    { key: 'approvalsTab', label: "Show 'Approvals' tab (in Request Detailed View) in Support Portal" },
  ] },
  { title: 'Digital Signature', rows: [{ key: 'signatureTab', label: "Show 'Signature' tab in Support Portal" }] },
];

/** Template defaults per workspace type (People & HR Desk: no reopen, no audit trail, no sharing on behalf). */
function defaultSettings(type: WorkspaceType): Record<string, boolean> {
  const all = Object.fromEntries(SETTING_GROUPS.flatMap((g) => g.rows.map((r) => [r.key, r.key !== 'signatureTab'])));
  if (type === 'hr' || type === 'legal') Object.assign(all, { onBehalf: false, serviceOnBehalf: false, auditTrail: false, guestReport: false, guestService: false, reopenResolved: false });
  return all;
}

export function defaultWsPortal(w: Workspace): WsPortal {
  const slug = w.isDefault ? '' : SLUG_FOR[w.type] || w.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    name: w.isDefault ? 'Support Portal' : `${w.name} Support Portal`,
    slug,
    cardIcon: ICON_FOR[w.type],
    cardDesc: w.description,
    /* Empty = not customised: the portal looks exactly like today's default Support Portal on 185
       (Organization branding: "Welcome to Support Portal"). A team changes it in its own Branding. */
    title: '',
    greeting: '',
    supportEmail: '',
    contactNo: '',
    colour: '',
    settings: defaultSettings(w.type),
  };
}

// ── Store ───────────────────────────────────────────────────────────────────────────────────────────────────
export interface EsmStore {
  published: EsmPortalConfig;
  draft: EsmPortalConfig;
  publishedAt: string;
  wsPortals: Record<number, WsPortal>;
  /** ⭐ per employee: workspace id they land on. */
  stars: Record<string, number>;
  /** Requests employees raised in the prototype (on top of the seed below). */
  raised: MyRequest[];
}
const KEY = 'serviceops.esm.esmportal.v1';
const fresh = (): EsmStore => ({ published: DEFAULT_ESM, draft: DEFAULT_ESM, publishedAt: 'Nov 05, 2026 10:00 AM', wsPortals: {}, stars: {}, raised: [] });

export function loadEsm(): EsmStore {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw) as Partial<EsmStore>; return { ...fresh(), ...p, published: { ...DEFAULT_ESM, ...p.published }, draft: { ...DEFAULT_ESM, ...p.draft } }; }
  } catch { /* private window: seed */ }
  return fresh();
}
export function saveEsm(s: EsmStore) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* not fatal */ }
}
export const wsPortalOf = (s: EsmStore, w: Workspace): WsPortal => ({ ...defaultWsPortal(w), ...s.wsPortals[w.id], settings: { ...defaultWsPortal(w).settings, ...s.wsPortals[w.id]?.settings } });
/** The portal's address. IT keeps today's address, so old bookmarks and email links still open it. */
export const portalPath = (p: WsPortal) => (p.slug ? `/support-portal/${p.slug}` : '/support-portal');
export const portalHost = (p: WsPortal) => `support.acme.com${p.slug ? `/${p.slug}` : ''}`;
export const sameConfig = (a: EsmPortalConfig, b: EsmPortalConfig) => JSON.stringify(a) === JSON.stringify(b);

// ── Who sees which card (F02a §9) ───────────────────────────────────────────────────────────────────────────
export const visibleTeams = (ws: Workspace[], e: Employee) => ws.filter((w) => portalVerdict(w, e).ok);
export function orderTeams(ws: Workspace[], order: number[]) {
  const rank = (w: Workspace) => { const i = order.indexOf(w.id); return i < 0 ? 999 : i; };
  return [...ws].sort((a, b) => rank(a) - rank(b) || Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
}
/** Where `/support-portal` takes this person (F18 §7): one team → that team; ⭐ → that team; else the org setting. */
export function landingFor(cfg: EsmPortalConfig, store: EsmStore, ws: Workspace[], e: Employee): { kind: 'esm' } | { kind: 'team'; w: Workspace; why: string } {
  const teams = visibleTeams(ws, e);
  if (teams.length === 1) return { kind: 'team', w: teams[0], why: `${e.name} can see only ${teams[0].name}, so the ESM Portal is skipped.` };
  if (teams.length === 0) return { kind: 'esm' };
  const star = cfg.allowStar ? teams.find((w) => w.id === store.stars[e.name]) : undefined;
  if (star) return { kind: 'team', w: star, why: `${e.name} starred ${star.name} as their default team.` };
  const org = typeof cfg.landing === 'number' ? teams.find((w) => w.id === cfg.landing) : undefined;
  if (org) return { kind: 'team', w: org, why: `The organization opens the ${org.name} portal first.` };
  return { kind: 'esm' };
}

// ── Demo content: services, articles, requests ──────────────────────────────────────────────────────────────
export const servicesOf = (w: Workspace) => w.setup.catalogItems ?? KIND_TEMPLATE[w.type].requests;
export const articlesOf = (w: Workspace) => w.setup.articles ?? KIND_TEMPLATE[w.type].articles;
export const ORG_ARTICLES = ['Holiday calendar 2026', 'How to use the Support Portal'];

export interface MyRequest { id: string; subject: string; workspaceId: number; status: 'Open' | 'In Progress' | 'Resolved'; by: string; at: string; approval?: boolean }
const SEED_REQUESTS: MyRequest[] = [
  { id: 'INC-973', subject: 'Internet is not working', workspaceId: 1, status: 'Open', by: '*', at: 'Oct 08' },
  { id: 'SR-1041', subject: 'Leave balance correction', workspaceId: 2, status: 'In Progress', by: '*', at: 'Oct 29' },
  { id: 'SR-1066', subject: 'Access card not working', workspaceId: 3, status: 'Open', by: 'Karan Mehta', at: 'Nov 02' },
  { id: 'SR-1072', subject: 'Desk move to 3rd floor', workspaceId: 3, status: 'Resolved', by: 'Anita Rao', at: 'Nov 01' },
  { id: 'SR-1003', subject: 'Employee On-boarding: new analyst', workspaceId: 2, status: 'Open', by: 'Anita Rao', at: 'Nov 04', approval: true },
  { id: 'SR-0998', subject: 'NDA for new supplier', workspaceId: 5, status: 'In Progress', by: 'Kiran Shah', at: 'Oct 15' },
  { id: 'SR-1050', subject: 'Exit interview slot', workspaceId: 2, status: 'Open', by: 'Lisa Brown', at: 'Oct 30' },
];
/** A person's own requests in EVERY workspace — even one they can no longer see on the portal (F02a §9: read + reply). */
export const myRequests = (s: EsmStore, e: Employee) => [...s.raised, ...SEED_REQUESTS].filter((r) => r.by === '*' || r.by === e.name).filter((r) => !r.approval);
export const myApprovals = (e: Employee) => (e.director ? SEED_REQUESTS.filter((r) => r.approval) : []);

/** Search across every team the person can see (Juli: yes), each hit tagged with its team. */
export interface Hit { kind: 'Service' | 'Article' | 'My request'; title: string; team?: Workspace; ref?: string }
export function searchAll(q: string, teams: Workspace[], mine: MyRequest[], all: Workspace[]): Hit[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const hits: Hit[] = [];
  teams.forEach((w) => {
    servicesOf(w).filter((x) => x.toLowerCase().includes(t)).forEach((x) => hits.push({ kind: 'Service', title: x, team: w }));
    articlesOf(w).filter((x) => x.toLowerCase().includes(t)).forEach((x) => hits.push({ kind: 'Article', title: x, team: w }));
  });
  ORG_ARTICLES.filter((x) => x.toLowerCase().includes(t)).forEach((x) => hits.push({ kind: 'Article', title: x }));
  mine.filter((r) => `${r.id} ${r.subject}`.toLowerCase().includes(t)).forEach((r) => hits.push({ kind: 'My request', title: r.subject, ref: r.id, team: all.find((w) => w.id === r.workspaceId) }));
  return hits;
}

// ── Technician Portal ↔ Support Portal (live: avatar menu › View Support Portal / View Technician Portal) ──
export const RETURN_KEY = 'serviceops.esm.returnTo';
/** Technician Portal avatar menu › "View Support Portal": remembers where the technician was, opens /support-portal. */
export function openSupportPortal() {
  try { window.sessionStorage.setItem(RETURN_KEY, window.location.hash || '#/'); } catch { /* */ }
  window.location.hash = '#/portal';
}
