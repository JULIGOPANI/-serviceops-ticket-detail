/* Support Portal Customization — Admin › Organization.
 *
 * Two data sets live here and nothing else does:
 *   1. the PAGES an admin has built (the listing's rows, created by the builder), and
 *   2. the TEMPLATES the "Use Template" gallery offers.
 *
 * The portal CONTENT below (requests, approvals, knowledge) is what the builder canvas renders as
 * the default layout. It is the requester's real dashboard, so the numbers in a card's header and
 * the rows beneath it are read from the SAME array — a count and its list can never disagree.
 */

export type PortalPageStatus = 'Published' | 'Draft';

export interface PortalPage {
  id: string;
  name: string;
  /** System pages ship with the product; Custom ones are built here. */
  type: 'System' | 'Custom';
  status: PortalPageStatus;
  /** 'Blank layout' for a from-scratch page, otherwise the template it was started from. */
  source: string;
  audience: string;
  modifiedAt: string;
  modifiedBy: string;
  /** Edited since it was last published — the amber chip on the listing. */
  dirty?: boolean;
  /* ⚠️ How the page was STARTED, not merely which template it resembles. `source` is prose for the
     listing; this is the fact the builder acts on — a blank portal must not seed the default page's
     banner, cards and widgets, and nothing else can tell it apart. */
  start?: 'blank' | 'template';
  /* Step 1 of Create Support Portal. Held on the record because they are facts about the PORTAL,
     not about its layout — the Branding panel shows the same values once it is open. */
  company?: string;
  url?: string;
  idp?: string;
  ssoOnly?: boolean;
}

export type TemplateLayout = 'classic' | 'spotlight' | 'catalog' | 'knowledge' | 'minimal' | 'status';

export interface PortalTemplate {
  id: string;
  name: string;
  desc: string;
  category: 'IT Support' | 'HR' | 'Facilities' | 'General';
  layout: TemplateLayout;
  /** Tints the hero of the page this template produces, so picking one is visibly a choice. */
  accent: string;
  badge?: string;
  /** What the template drops onto the canvas — read on the gallery's detail rail. */
  blocks: string[];
}

/* ── Templates ───────────────────────────────────────────────────────────── */

export const PORTAL_TEMPLATES: PortalTemplate[] = [
  {
    id: 'tpl-classic',
    name: 'Classic Service Desk',
    desc: 'The default ServiceOps portal — hero search, three quick actions, and the requester’s own work below.',
    category: 'IT Support',
    layout: 'classic',
    accent: '#0F172A',
    badge: 'Most used',
    blocks: ['Hero search', 'Quick actions', 'My Open Requests', 'Pending Approvals', 'Most Read', 'My Assets', 'My CIs'],
  },
  {
    id: 'tpl-spotlight',
    name: 'Search Spotlight',
    desc: 'Puts deflection first: a full-bleed search hero with popular articles surfaced before any form.',
    category: 'IT Support',
    layout: 'spotlight',
    accent: '#1E3A8A',
    blocks: ['Full-bleed search', 'Popular articles', 'Quick actions', 'My Open Requests'],
  },
  {
    id: 'tpl-catalog',
    name: 'Service Catalog First',
    desc: 'Leads with browsable service categories for portals where most traffic is a request, not an incident.',
    category: 'General',
    layout: 'catalog',
    accent: '#134E4A',
    blocks: ['Compact search', 'Category grid', 'Featured services', 'My Open Requests'],
  },
  {
    id: 'tpl-knowledge',
    name: 'Knowledge Hub',
    desc: 'A self-service reading room — curated collections, most read, and a contact-us fallback at the end.',
    category: 'General',
    layout: 'knowledge',
    accent: '#3730A3',
    blocks: ['Search hero', 'Collections', 'Most Read', 'Contact us'],
  },
  {
    id: 'tpl-hr',
    name: 'People & HR Desk',
    desc: 'An HR-facing portal — leave, payroll and onboarding requests up front, policy documents beside them.',
    category: 'HR',
    layout: 'catalog',
    accent: '#831843',
    blocks: ['Compact search', 'HR service categories', 'Policy documents', 'My Open Requests'],
  },
  {
    id: 'tpl-minimal',
    name: 'Minimal Landing',
    desc: 'One search field and three actions on a light canvas. Nothing else competes for the first click.',
    category: 'General',
    layout: 'minimal',
    accent: '#334155',
    badge: 'New',
    blocks: ['Light hero', 'Quick actions', 'Announcements'],
  },
  {
    id: 'tpl-status',
    name: 'Announcements & Status',
    desc: 'Opens with live announcements and service status, for portals used during major incidents.',
    category: 'Facilities',
    layout: 'status',
    accent: '#7C2D12',
    blocks: ['Announcement banner', 'Service status', 'Hero search', 'My Open Requests'],
  },
];

/* The portal every tenant already has. It is a SYSTEM page: shipped with the product, always
   present, and the one a requester lands on today — which is why the listing opens with it rather
   than an empty state, and why it is the one page the delete action refuses. */
export const DEFAULT_PORTAL_PAGE: PortalPage = {
  id: 'SPP-1',
  name: 'Support Portal',
  type: 'System',
  status: 'Published',
  source: 'Classic Service Desk',
  audience: 'All requesters',
  modifiedAt: 'Mon, Aug 17, 2026 09:14 AM',
  modifiedBy: 'Juli Gopani',
  dirty: true,
  /* ⚠️ The seeded portal answers the SAME questions Create asks, so Edit details opens on a filled
     record rather than a form with a disabled Save. A default that cannot satisfy its own required
     fields reads as a broken row, not as a portal nobody has finished. */
  company: 'Acme Corporation',
  url: 'support.acme.com',
  idp: 'None — use ServiceOps login',
  ssoOnly: false,
};

/* The listing says WHEN in relative terms, because "2 days ago" is the question an admin is
   actually asking of that column; the full stamp stays on the record for anywhere precision
   matters. Falls back to the raw stamp if it cannot be parsed rather than printing "NaN days". */
export function relPortalStamp(stamp: string): string {
  const t = Date.parse(stamp);
  if (Number.isNaN(t)) return stamp;
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return days + ' days ago';
  const months = Math.floor(days / 30);
  return months === 1 ? 'a month ago' : months + ' months ago';
}

export const TEMPLATE_CATEGORIES = ['All', 'IT Support', 'HR', 'Facilities', 'General'] as const;

/* ── The default layout the canvas renders ───────────────────────────────── */

export interface PortalRequest { id: string; subject: string; at: string; status: string }
export interface PortalApproval { id: string; subject: string; reason: string; at: string; by: string; initials: string; color: string }
export interface PortalArticle { id: string; title: string; at: string; tag: string }

export const PORTAL_QUICK_ACTIONS = [
  { key: 'incident', title: 'New Incident', desc: 'Report an incident' },
  { key: 'service', title: 'Request Service', desc: 'Browse the services offered' },
  { key: 'knowledge', title: 'Knowledge', desc: 'Browse knowledge' },
] as const;

/** 17 open in total; the card lists the five most recent, which is what the live portal does. */
export const PORTAL_OPEN_REQUEST_TOTAL = 17;

/* Statuses vary on purpose: the builder's Statuses filter has to visibly do something, and a list
   where every row says "Open" would make a working filter look broken. */
export const PORTAL_OPEN_REQUESTS: PortalRequest[] = [
  { id: 'SR-201', subject: 'Request for New Laptop', at: 'Wed, Aug 12, 2026 10:09 AM', status: 'Open' },
  { id: 'INC-187', subject: 'Cannot Create KB Article', at: 'Mon, Aug 10, 2026 11:43 AM', status: 'In Progress' },
  { id: 'SR-180', subject: 'Employee On-boarding', at: 'Wed, Aug 05, 2026 03:22 PM', status: 'Open' },
  { id: 'INC-178', subject: 'Password Reset Required', at: 'Wed, Aug 05, 2026 12:03 PM', status: 'Pending' },
  { id: 'INC-170', subject: 'Laptop Slow and Lagging', at: 'Tue, Aug 04, 2026 03:51 PM', status: 'In Progress' },
  { id: 'SR-166', subject: 'Access to Finance Drive', at: 'Mon, Aug 03, 2026 09:14 AM', status: 'On Hold' },
  { id: 'INC-159', subject: 'VPN Disconnects Frequently', at: 'Fri, Jul 31, 2026 04:02 PM', status: 'Open' },
  { id: 'INC-151', subject: 'Monitor Flickering', at: 'Thu, Jul 30, 2026 11:20 AM', status: 'Resolved' },
  { id: 'SR-147', subject: 'Software License Renewal', at: 'Wed, Jul 29, 2026 02:45 PM', status: 'Closed' },
  { id: 'INC-142', subject: 'Printer Not Responding', at: 'Tue, Jul 28, 2026 10:33 AM', status: 'Reopened' },
];

/** Status pill colours, so a filtered list still reads at a glance. */
export const REQUEST_STATUS_TONE: Record<string, { fg: string; bg: string }> = {
  'Open': { fg: '#B45309', bg: '#FEF3C7' },
  'In Progress': { fg: '#1D4ED8', bg: '#DBEAFE' },
  'Pending': { fg: '#7C3AED', bg: '#EDE9FE' },
  'On Hold': { fg: '#64748B', bg: '#F1F5F9' },
  'Resolved': { fg: '#22A06B', bg: '#ECFDF3' },
  'Closed': { fg: '#64748B', bg: '#F1F5F9' },
  'Reopened': { fg: '#DC2626', bg: '#FEF3F2' },
};

/* ⚠️ The SAME statuses restated for a dark surface. A 10% tint is a pale wash on white and a glare
   on #16233A, so the fill drops to a deep version of its own hue and the text lifts to the bright
   end of it — the pill still reads as "amber" or "green", which is the only job it has, without
   becoming the loudest thing on a dark page. Chosen by mode rather than filtered, because a filter
   would shift every hue by the same amount and the point of these is that they differ. */
export const REQUEST_STATUS_TONE_DARK: Record<string, { fg: string; bg: string }> = {
  'Open': { fg: '#FBBF24', bg: '#3A2A0A' },
  'In Progress': { fg: '#93C5FD', bg: '#12325A' },
  'Pending': { fg: '#C4B5FD', bg: '#2B2350' },
  'On Hold': { fg: '#9FB3C8', bg: '#22334F' },
  'Resolved': { fg: '#4ADE80', bg: '#12351F' },
  'Closed': { fg: '#9FB3C8', bg: '#22334F' },
  'Reopened': { fg: '#F87171', bg: '#3A1717' },
};

/** The tone for a status in the mode that is on. One lookup, so no call site can pick the wrong set. */
export const statusTone = (status: string, dark = false) =>
  (dark ? REQUEST_STATUS_TONE_DARK : REQUEST_STATUS_TONE)[status]
  ?? (dark ? { fg: '#9FB3C8', bg: '#22334F' } : { fg: '#64748B', bg: '#F1F5F9' });

export const PORTAL_APPROVALS: PortalApproval[] = [
  {
    id: 'INC-192', subject: 'Wrong configuration details', reason: 'Peer review requested',
    at: 'Tue, Aug 11, 2026 02:14 PM', by: 'Rosy', initials: 'RO', color: '#3D8BD0',
  },
  {
    id: 'AST-13', subject: 'DESKTOP-5JPPI6F', reason: 'Approval Required for - AST-13',
    at: 'Mon, Aug 10, 2026 12:57 PM', by: 'Keya', initials: 'KE', color: '#7C3AED',
  },
];

export const PORTAL_ARTICLES: PortalArticle[] = [
  { id: 'KB-4', title: 'How to Reset Your Password', at: 'Thu, Jul 30, 2026 11:34 AM', tag: 'Guideline Documents' },
  { id: 'KB-1', title: 'Connecting to Company VPN', at: 'Sun, Jul 19, 2026 10:58 PM', tag: 'FAQs' },
  { id: 'KB-6', title: 'Reporting a Hardware Fault', at: 'Tue, Aug 11, 2026 04:38 PM', tag: 'Guideline Documents' },
];

/* ── Add panel — the element catalogue ───────────────────────────────────── */

/* Groups render in this order. **Components** is deliberately first: the system blocks a support
 * portal is actually made of are what an admin reaches for, and burying them under generic layout
 * primitives would make the common case the hard one. Everything below Components is the generic
 * toolkit, in the order Duda uses (layout → basic → visual → business → custom). */
/* ⚠️ No 'Layout' group. It held two elements — a Divider and Advanced Tabs — which are as basic as
   anything in Basic; a tab of two rows is a category that costs more to scan than it saves. */
export const PORTAL_ELEMENT_GROUPS = ['Live data', 'Actions', 'Basic', 'Visual', 'Custom'] as const;
export type PortalElementGroup = (typeof PORTAL_ELEMENT_GROUPS)[number];

export interface PortalElement {
  id: string;
  name: string;
  /** Key into the panel's icon registry. */
  icon: string;
  group: PortalElementGroup;
  /** System components only — already placed on the page, so it can't be added twice. */
  onPage?: boolean;
  /** Extra words the search should match (variants, synonyms) without cluttering the row. */
  keywords?: string;
  /* ⚠️ Withheld from the palette, but NOT deleted. Its spec and renderer stay, so anything already
     on a page keeps working and the decision is one flag to reverse. Deleting the entry would take
     the element off existing pages too, which is a different and much larger decision. */
  hidden?: boolean;
}

/* ⚠️ `onPage` mirrors what SupportPortalPreview actually renders as a BUILT-IN band. Keep the two
   in step: the builder's demo seed lays out one example section per element and skips these, so a
   flag that has drifted shows the untouched page carrying My Open Requests twice — or missing the
   example of a block it does not actually have.
   ⚠️ It no longer governs the PALETTE. Every element is addable, every time; a row that greys out
   because the page already has one has to stay in step with the page to be truthful, and it never
   quite did. What a page RENDERS and what an admin may ADD are two questions, and this answers the
   first. */

export const PORTAL_ELEMENTS: PortalElement[] = [
  /* ── The ServiceOps portal's own blocks, in the two groups they actually divide into ──
   *
   * LIVE DATA fetches from the backend and shows whatever the requester's account returns; ACTIONS
   * are fixed destinations that never vary by user. That split is not decoration — it is why the
   * live-data widgets have no per-row content controls and the action cards do.
   *
   * ⚠️ Search, Categories, My Tasks and FAQ were removed from this section. Search and FAQ still
   * exist as elements elsewhere in the palette; My Tasks and Categories are not portal blocks this
   * product ships. */
  { id: 'c-requests', name: 'My Open Requests', icon: 'requests', group: 'Live data', onPage: true, keywords: 'tickets incidents open' },
  { id: 'c-approvals', name: 'Pending Approvals', icon: 'approvals', group: 'Live data', onPage: true, keywords: 'pending approve' },
  { id: 'c-assets', name: 'My Assets', icon: 'assets', group: 'Live data', onPage: true, keywords: 'hardware devices' },
  { id: 'c-cis', name: 'My CIs', icon: 'cis', group: 'Live data', onPage: true, keywords: 'configuration items cmdb' },
  { id: 'c-announcements', name: 'Announcements', icon: 'announcements', group: 'Live data', keywords: 'news broadcast banner' },
  { id: 'c-knowledge', name: 'Most Read Knowledge', icon: 'knowledge', group: 'Live data', onPage: true, keywords: 'articles kb most read' },
  { id: 'c-contact', name: 'Contact Us', icon: 'contact', group: 'Custom', keywords: 'support escalate raise' },
  /* ⚠️ NOT onPage. This is spec §7.8 Featured Services — a requester's favourites list. The page
     carries the "Request Service" ACTION CARD, which is a different widget with a fixed
     destination. Flagging this one as placed made Featured Services unreachable. */
  { id: 'c-services', name: 'Most Used Services', icon: 'services', group: 'Custom', keywords: 'catalog request service favourites featured' },
  /* Placed: the FAQ block already sits in the banner area of this portal, so the palette shows it
     as added rather than offering a second one. */
  { id: 'c-faq', name: 'FAQ', icon: 'faq', group: 'Custom', onPage: true, keywords: 'questions help answers' },

  // ── Actions — fixed destinations, the same for every requester ──
  { id: 'act-incident', name: 'New Incident', icon: 'incident', group: 'Actions', onPage: true, keywords: 'report issue raise ticket' },
  { id: 'act-service', name: 'Request Service', icon: 'services', group: 'Actions', onPage: true, keywords: 'catalog order' },
  /* ⚠️ NOT onPage — this page carries three action cards, and marking a fourth as placed would grey
     out the one entry that can still add it. Drop it on the page and it becomes reachable. */
  { id: 'act-ad', name: 'AD Self Service', icon: 'adself', group: 'Actions', keywords: 'password reset domain unlock' },
  { id: 'act-knowledge', name: 'Knowledge', icon: 'knowledge', group: 'Actions', onPage: true, keywords: 'articles help search' },

  { id: 'l-tabs', name: 'Advanced Tabs', icon: 'tabs', group: 'Basic', hidden: true }, // hidden 20 Aug 2026
  { id: 'l-divider', name: 'Divider', icon: 'divider', group: 'Basic', keywords: 'vertical horizontal v/h separator rule', hidden: true }, // hidden 21 Aug 2026

  /* ⚠️ File Download, Click to Call, Click to Mail and Share are NOT here. They are Button
     ACTIONS (§7.11's 'Opens' list), not elements — one button with a different destination. A
     separate palette entry for each was two ways to make the same link.
     x-search was a DUPLICATE of c-search under Custom; two identically named entries is a coin
     flip for whoever uses it. */
  /* ⚠️ Large Title, Small Title and List are HIDDEN, not deleted — their specs and renderers are
     still here because the Text element is absorbing those features into its own content. Deleting
     them would take the working code with them; hiding them stops the palette offering two ways to
     write a heading while that move is in flight.
     Countdown, Photo Gallery, Icon and Shape were REMOVED from the palette outright. */
  // ── Basic ──
  { id: 'b-text', name: 'Text', icon: 'text', group: 'Basic', keywords: 'paragraph body copy' },
  { id: 'b-button', name: 'Button', icon: 'button', group: 'Basic', keywords: 'cta link action' },
  { id: 'b-spacer', name: 'Spacer', icon: 'spacer', group: 'Basic', keywords: 'gap whitespace', hidden: true }, // hidden 20 Aug 2026
  { id: 'b-table', name: 'Table', icon: 'table', group: 'Basic', keywords: 'grid rows columns data' },
  { id: 'b-accordion', name: 'Accordion', icon: 'accordion', group: 'Basic', keywords: 'collapse faq expand' },
  { id: 'b-text-image', name: 'Text with Image', icon: 'textImage', group: 'Basic', keywords: 'media split', hidden: true },
  { id: 'b-card', name: 'Card', icon: 'card', group: 'Basic', keywords: 'tile panel' },

  // ── Visual ──
  { id: 'v-image', name: 'Image', icon: 'image', group: 'Visual', keywords: 'picture photo' },
  { id: 'v-slider', name: 'Media Slider', icon: 'slider', group: 'Visual', keywords: 'carousel gallery', hidden: true }, // hidden 20 Aug 2026 — 22 of 33 controls inert


  // ── Custom ──
  { id: 'x-action-card', name: 'Action Card', icon: 'actionCard', group: 'Custom', keywords: 'quick action tile' },
  { id: 'x-kpi', name: 'KPI', icon: 'kpi', group: 'Custom', keywords: 'metric stat number' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 'Wed, Aug 12, 2026 10:09 AM' — the stamp format every list in this product uses. */
export function formatPortalStamp(d: Date): string {
  const h = d.getHours();
  const hh = ((h + 11) % 12) + 1;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} ${String(hh).padStart(2, '0')}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Next free `SPP-#`, so ids stay stable and readable as pages come and go. */
export function nextPageId(pages: PortalPage[]): string {
  const max = pages.reduce((n, p) => {
    const m = /^SPP-(\d+)$/.exec(p.id);
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
  return `SPP-${max + 1}`;
}

/** 'New page', then 'New page 2'… — a builder must never make the admin resolve a clash. */
export function uniquePageName(pages: PortalPage[], base: string): string {
  const taken = new Set(pages.map((p) => p.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

/* Live-data widgets with no records right now.
 *
 * ⚠️ In the real product this is a question for the data layer, not a constant — it is here because
 * this is a prototype and the answer has to come from somewhere. What matters is that ONE place
 * knows it, so the canvas and the panel cannot disagree about whether a widget has anything in it. */
export const PORTAL_EMPTY_WIDGETS = new Set(['cis']);
