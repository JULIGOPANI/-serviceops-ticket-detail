/* ESM — Desks (Admin › Platform Configuration › Organization). Feature F01, first level.
 *
 * A Desk is one department's service desk inside one ServiceOps (IT, HR, Facilities…). The object
 * was first called Workspace; Juli renamed it Desk on 2026-10-13.
 * Design record: ESM-ll/Features/F01-service-desk.md. This file is the data half: the shape
 * engineering builds from, the demo seed, and the localStorage store. There is no backend.
 *
 * F01 covers the object itself only. Deliberately NOT here (decided in later features):
 *   members and roles (F02/F03) · who can see what (F05) · what config a desk owns (F04) ·
 *   templates and seeded content (F07) · modules (F08) · ticket ID grammar (F10).
 *
 * ⚠️ Invariants (F01 decisions):
 *   - Exactly ONE IT desk, and it is the default. The system creates it; nobody else can pick
 *     IT as a type. It cannot be deleted or made inactive, and its type cannot change.
 *   - Type is fixed after create (it will drive the template and the allowed modules).
 *   - Short code is unique and is locked once the desk has gone Live.
 *   - At least one owner.
 *   - Delete only while the desk has no tickets; otherwise make it Inactive.
 *   - No Department or Location field: both stay global and describe the EMPLOYEE, not the team
 *     that serves them. */

export type DeskType = 'it' | 'hr' | 'facilities' | 'finance' | 'legal' | 'general';
export type DeskStatus = 'setup' | 'live' | 'inactive';

export interface Desk {
  id: number;
  name: string;
  /** 2–6 characters, A–Z and 0–9, starts with a letter. Unique. Locked once Live. */
  code: string;
  type: DeskType;
  description: string;
  /** Technician ids. At least one. */
  ownerIds: number[];
  colour: string;
  status: DeskStatus;
  /** The IT desk. Exactly one; holds everything that existed before ESM. */
  isDefault: boolean;
  /** Demo only — stands in for "does this desk hold any tickets" (the delete rule). */
  ticketCount: number;
  /** Which setup steps are done. Details is always done: the create form IS that step. */
  setup: Record<SetupStepId, boolean>;
  createdOn: string;
}

export interface Technician { id: number; name: string; email: string }

export type DeskDraft = Pick<Desk, 'name' | 'code' | 'type' | 'description' | 'ownerIds' | 'colour'>;

/** Placeholder until F25 (limits). Freshservice showed 25; ManageEngine on-prem states 50. */
export const MAX_DESKS = 25;
export const MAX_NAME = 64;
export const MAX_DESCRIPTION = 255;

// ── Labels ─────────────────────────────────────────────────────────────────

export const TYPE_LABEL: Record<DeskType, string> = {
  it: 'IT', hr: 'HR', facilities: 'Facilities', finance: 'Finance', legal: 'Legal', general: 'General',
};

/** What an admin can pick on create. IT is absent on purpose: there is exactly one, made by the system. */
export const CREATABLE_TYPES: { value: DeskType; desc: string }[] = [
  { value: 'hr', desc: 'Onboarding, payroll, leave, policies' },
  { value: 'facilities', desc: 'Buildings, maintenance, seating, travel' },
  { value: 'finance', desc: 'Expenses, invoices, reimbursements' },
  { value: 'legal', desc: 'Contracts, NDAs, compliance questions' },
  { value: 'general', desc: 'Any other team: start from blank' },
];

// ── Setup checklist (the flow after Create) ───────────────────────────────

/* A new desk opens on its own page with this checklist. REQUIRED steps gate Go Live: without
 * them a Live desk would take requests nobody can see or work. Each step's screen belongs to a
 * later feature, named in `feature`; until it is designed the prototype only marks it done. */
export type SetupStepId = 'details' | 'technicians' | 'groups' | 'requests' | 'hours' | 'email' | 'catalog' | 'knowledge' | 'automation';
export type SetupTier = 'required' | 'recommended' | 'optional';

export interface SetupStep { id: SetupStepId; tier: SetupTier; title: string; desc: string; feature: string }

export const SETUP_STEPS: SetupStep[] = [
  { id: 'details', tier: 'required', title: 'Desk details', desc: 'Name, type, short code and owners.', feature: 'F01' },
  { id: 'technicians', tier: 'required', title: 'Add technicians', desc: 'The people who work on this desk’s requests.', feature: 'F02' },
  { id: 'groups', tier: 'required', title: 'Create technician groups', desc: 'Teams that requests are assigned to.', feature: 'F11' },
  { id: 'requests', tier: 'required', title: 'Set up the request form', desc: 'Categories, fields and statuses employees and technicians see.', feature: 'F10' },
  { id: 'hours', tier: 'recommended', title: 'Business hours and SLA', desc: 'When the team works and how fast it must respond.', feature: 'F12' },
  { id: 'email', tier: 'recommended', title: 'Connect a support email', desc: 'Emails to this address become requests in this desk.', feature: 'F15' },
  { id: 'catalog', tier: 'recommended', title: 'Add service catalog items', desc: 'Ready-made requests employees can pick from the portal.', feature: 'F09' },
  { id: 'knowledge', tier: 'optional', title: 'Publish knowledge articles', desc: 'Answers employees can find before raising a request.', feature: 'F16' },
  { id: 'automation', tier: 'optional', title: 'Approvals and workflows', desc: 'Who approves what, and what happens automatically.', feature: 'F13/F14' },
];

export const TIER_LABEL: Record<SetupTier, string> = {
  required: 'Required to go live', recommended: 'Recommended', optional: 'Optional',
};

const setupWith = (done: SetupStepId[]): Record<SetupStepId, boolean> =>
  Object.fromEntries(SETUP_STEPS.map((s) => [s.id, s.id === 'details' || done.includes(s.id)])) as Record<SetupStepId, boolean>;
export const NEW_SETUP = () => setupWith([]);
const ALL_DONE = () => setupWith(SETUP_STEPS.map((s) => s.id));

/** Required steps still open. Empty means the desk can go Live. */
export const missingRequired = (d: Desk) => SETUP_STEPS.filter((s) => s.tier === 'required' && !d.setup[s.id]);

export const STATUS_LABEL: Record<DeskStatus, string> = { setup: 'Setup', live: 'Live', inactive: 'Inactive' };

export const STATUS_HELP: Record<DeskStatus, string> = {
  setup: 'Being configured. Not open for requests yet.',
  live: 'Open for requests.',
  inactive: 'Takes no new requests. Existing tickets stay available.',
};

export const COLOURS = ['#3D8BD0', '#7C3AED', '#0D9488', '#D97706', '#DB2777', '#4F46E5', '#65A30D', '#64748B'];

// ── Seed ───────────────────────────────────────────────────────────────────

export const TECHNICIANS: Technician[] = [
  { id: 1, name: 'Amit Kulkarni', email: 'amit.kulkarni@acme.example' },
  { id: 2, name: 'Sneha Rao', email: 'sneha.rao@acme.example' },
  { id: 3, name: 'Vikram Desai', email: 'vikram.desai@acme.example' },
  { id: 4, name: 'Neha Iyer', email: 'neha.iyer@acme.example' },
  { id: 5, name: 'Rahul Menon', email: 'rahul.menon@acme.example' },
  { id: 6, name: 'Farah Qureshi', email: 'farah.qureshi@acme.example' },
  { id: 7, name: 'Daniel Fernandes', email: 'daniel.fernandes@acme.example' },
  { id: 8, name: 'Meera Joshi', email: 'meera.joshi@acme.example' },
  { id: 9, name: 'Arjun Pillai', email: 'arjun.pillai@acme.example' },
  { id: 10, name: 'Kavita Bhatt', email: 'kavita.bhatt@acme.example' },
];

const IT: Desk = {
  id: 1, name: 'IT', code: 'IT', type: 'it', isDefault: true, status: 'live', colour: '#3D8BD0',
  description: 'Hardware, software, access and everything the IT team runs.',
  ownerIds: [1], ticketCount: 985, createdOn: '2024-03-18', setup: ALL_DONE(),
};

const FOUR: Desk[] = [
  IT,
  {
    id: 2, name: 'Human Resources', code: 'HR', type: 'hr', isDefault: false, status: 'live', colour: '#7C3AED',
    description: 'Onboarding, payroll, leave and employee relations.',
    ownerIds: [8], ticketCount: 214, createdOn: '2026-10-01',
    setup: setupWith(['technicians', 'groups', 'requests', 'hours', 'email', 'catalog', 'knowledge']),
  },
  {
    id: 3, name: 'Facilities', code: 'FAC', type: 'facilities', isDefault: false, status: 'live', colour: '#0D9488',
    description: 'Buildings, rooms, seating, access cards and site services.',
    ownerIds: [10, 7], ticketCount: 96, createdOn: '2026-10-03',
    setup: setupWith(['technicians', 'groups', 'requests', 'hours', 'catalog']),
  },
  {
    id: 4, name: 'Finance', code: 'FIN', type: 'finance', isDefault: false, status: 'setup', colour: '#D97706',
    description: 'Expenses, invoices, purchase approvals and reimbursements.',
    ownerIds: [2], ticketCount: 0, createdOn: '2026-10-12',
    setup: setupWith(['technicians', 'hours']),
  },
  {
    id: 5, name: 'Legal', code: 'LGL', type: 'legal', isDefault: false, status: 'inactive', colour: '#64748B',
    description: 'Contract reviews and NDAs. Paused while the team moves to the new process.',
    ownerIds: [5], ticketCount: 38, createdOn: '2026-06-20',
    setup: setupWith(['technicians', 'groups', 'requests', 'email']),
  },
];

const LIMIT_EXTRA = [
  'Procurement', 'Marketing Ops', 'Sales Ops', 'Security', 'Payroll', 'Travel', 'Workplace', 'Engineering Ops',
  'Customer Success', 'Data Platform', 'Compliance', 'Internal Audit', 'Treasury', 'Learning', 'Recruitment',
  'Benefits', 'Health and Safety', 'Fleet', 'Mailroom', 'Events',
];

export type DemoData = 'four' | 'upgrade' | 'limit' | 'error';

export const DEMO_OPTIONS: { value: DemoData; label: string }[] = [
  { value: 'four', label: 'Five desks (after ESM rollout)' },
  { value: 'upgrade', label: 'Just after upgrade (IT only)' },
  { value: 'limit', label: `${MAX_DESKS} desks (at the limit)` },
  { value: 'error', label: 'Simulate a load error' },
];

export type ViewAs = 'admin' | 'technician';

export const VIEW_AS_OPTIONS: { value: ViewAs; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'technician', label: 'Technician (no admin rights)' },
];

export function seedFor(demo: DemoData): Desk[] {
  const copy = (w: Desk) => ({ ...w, ownerIds: [...w.ownerIds], setup: { ...w.setup } });
  if (demo === 'upgrade') return [copy(IT)];
  const four = FOUR.map(copy);
  if (demo !== 'limit') return four;
  LIMIT_EXTRA.forEach((name, i) => {
    four.push({
      id: 6 + i, name, code: codeFrom(name, four.map((w) => w.code)), type: 'general', isDefault: false,
      status: 'live', colour: COLOURS[i % COLOURS.length], description: `Requests for ${name}.`,
      ownerIds: [TECHNICIANS[i % TECHNICIANS.length].id], ticketCount: 5 + i, createdOn: '2026-10-05', setup: ALL_DONE(),
    });
  });
  return four;
}

// ── Store (localStorage) ───────────────────────────────────────────────────

export interface DeskStore { demo: DemoData; viewAs: ViewAs; desks: Desk[] }

const STORAGE_KEY = 'serviceops.esm.desks.v2';

export const initialStore = (): DeskStore => ({ demo: 'four', viewAs: 'admin', desks: seedFor('four') });

export function loadStore(): DeskStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<DeskStore>;
      if (Array.isArray(s.desks) && s.demo && s.viewAs) return s as DeskStore;
    }
  } catch { /* private window or blocked storage: fall through to the seed */ }
  return initialStore();
}

export function saveStore(s: DeskStore) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* not fatal */ }
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const CODE_PATTERN = /^[A-Z][A-Z0-9]{1,5}$/;

/** Suggest a short code from a name: initials of the words, else the first letters; made unique. */
export function codeFrom(name: string, taken: string[]): string {
  const words = name.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length === 0) return '';
  let base = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 4) : words[0].slice(0, 3);
  if (!/^[A-Z]/.test(base)) base = `W${base}`.slice(0, 6);
  if (base.length < 2) base = (words[0] + 'X').slice(0, 2);
  let code = base;
  for (let n = 2; taken.includes(code); n++) code = `${base.slice(0, 5)}${n}`.slice(0, 6);
  return code;
}

export const technicianById = (id: number) => TECHNICIANS.find((t) => t.id === id);

/** Default first, then Live, Setup, Inactive, then by name. */
export function sortDesks(ws: Desk[]): Desk[] {
  const rank: Record<DeskStatus, number> = { live: 0, setup: 1, inactive: 2 };
  return [...ws].sort((a, b) =>
    Number(b.isDefault) - Number(a.isDefault) || rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
}
