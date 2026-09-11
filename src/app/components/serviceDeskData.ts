/* ESM — Service Desks (Admin › Platform Configuration › Organization). Build slice S1.
 *
 * "ServiceOps has always had a service desk. ESM lets you run several." A Service Desk is a
 * first-class object: it owns configuration, technicians, a catalog and tickets. This file is the
 * data half of the slice — the shapes engineering builds from, the demo seed, and the localStorage
 * store the prototype persists to. There is no backend.
 *
 * ⚠️ The field names on ServiceDesk / ServiceDeskMembership / Technician are the SPECIFICATION.
 * Do not rename them to suit a component.
 *
 * ⚠️ Membership is a record per (technician, desk), not an array of desk ids on the technician. One
 * person can manage one desk and be an agent in another, and is still ONE licensed seat.
 *
 * ⚠️ Role in a desk (manager/agent) and licence (full/desk_technician) are two separate axes. A Desk
 * Technician running a desk as its Manager is the intended shape, never a warning. */

export type DeskTemplate = 'blank' | 'it' | 'hr' | 'facilities' | 'finance' | 'legal' | 'general';
export type DeskVisibility = 'open' | 'restricted';
export type AudiencePermission = 'all_requesters' | 'requester_group' | 'department';
export type MembershipType = 'manager' | 'agent';
export type LicenseType = 'full' | 'desk_technician';

export interface ServiceDesk {
  id: number;
  name: string;
  /** Immutable after create — it is the desk's web address. */
  identifier: string;
  description: string;
  template: DeskTemplate;
  visibility: DeskVisibility;
  audiencePermission: AudiencePermission | null;
  /** Requester group ids or department ids; [] otherwise. */
  audienceIds: number[];
  /** Exactly one desk has true, always. */
  isPrimary: boolean;
}

export interface ServiceDeskMembership {
  userId: number;
  serviceDeskId: number;
  membershipType: MembershipType;
}

export interface Technician {
  id: number;
  name: string;
  email: string;
  licenseType: LicenseType;
}

/** What the create/edit form hands back — the module owns ids and the primary invariant. */
export type DeskDraft = Omit<ServiceDesk, 'id'>;
export interface DraftMember { userId: number; membershipType: MembershipType }

export const MAX_SERVICE_DESKS = 25;

// ── Labels ─────────────────────────────────────────────────────────────────

export const TEMPLATE_OPTIONS: { value: DeskTemplate; label: string }[] = [
  { value: 'blank', label: 'Blank' },
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'HR' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'general', label: 'General' },
];

export const LICENSE_LABEL: Record<LicenseType, string> = { full: 'Technician', desk_technician: 'Desk Technician' };
export const ROLE_LABEL: Record<MembershipType, string> = { manager: 'Manager', agent: 'Agent' };
export const AUDIENCE_LABEL: Record<AudiencePermission, string> = {
  all_requesters: 'All Requesters',
  requester_group: 'Requester Group',
  department: 'Department',
};

/* ⚠️ TWO values and no middle setting. Finer control comes from the roles and groups inside the
   desk; a third option or a permission grid here is exactly what the S1 demo exists to test. */
export const VISIBILITY_OPTIONS: { value: DeskVisibility; title: string; desc: string }[] = [
  {
    value: 'open',
    title: 'Open',
    desc: 'Any technician can be added to this Service Desk. Every employee can see its services and raise requests into it.',
  },
  {
    value: 'restricted',
    title: 'Restricted',
    desc: "Only the technicians you add can see this desk's requests. Only the audience you choose can see its services, knowledge and portal. Use this for HR, Finance and Legal.",
  },
];

// ── Seed ───────────────────────────────────────────────────────────────────

export const REQUESTER_GROUPS: { id: number; name: string }[] = [
  { id: 1, name: 'All Employees' },
  { id: 2, name: 'Managers' },
  { id: 3, name: 'New Joiners' },
  { id: 4, name: 'Leadership' },
];

export const DEPARTMENTS: { id: number; name: string }[] = [
  { id: 1, name: 'IT' },
  { id: 2, name: 'Human Resources' },
  { id: 3, name: 'Finance' },
];

export const TECHNICIANS: Technician[] = [
  { id: 1, name: 'Amit Kulkarni', email: 'amit.kulkarni@pmg.example', licenseType: 'full' },
  { id: 2, name: 'Sneha Rao', email: 'sneha.rao@pmg.example', licenseType: 'full' },
  { id: 3, name: 'Vikram Desai', email: 'vikram.desai@pmg.example', licenseType: 'full' },
  { id: 4, name: 'Neha Iyer', email: 'neha.iyer@pmg.example', licenseType: 'desk_technician' },
  { id: 5, name: 'Rahul Menon', email: 'rahul.menon@pmg.example', licenseType: 'full' },
  { id: 6, name: 'Farah Qureshi', email: 'farah.qureshi@pmg.example', licenseType: 'desk_technician' },
  { id: 7, name: 'Daniel Fernandes', email: 'daniel.fernandes@pmg.example', licenseType: 'full' },
  { id: 8, name: 'Meera Joshi', email: 'meera.joshi@pmg.example', licenseType: 'desk_technician' },
  { id: 9, name: 'Arjun Pillai', email: 'arjun.pillai@pmg.example', licenseType: 'full' },
  { id: 10, name: 'Kavita Bhatt', email: 'kavita.bhatt@pmg.example', licenseType: 'desk_technician' },
];

const FOUR_DESKS: ServiceDesk[] = [
  {
    id: 1, name: 'IT', identifier: 'it', template: 'it',
    description: 'Hardware, software, access and everything the IT team runs.',
    visibility: 'open', audiencePermission: null, audienceIds: [], isPrimary: true,
  },
  {
    id: 2, name: 'HR', identifier: 'hr', template: 'hr',
    description: 'Onboarding, payroll, leave and employee relations.',
    visibility: 'restricted', audiencePermission: 'all_requesters', audienceIds: [], isPrimary: false,
  },
  {
    id: 3, name: 'Facilities', identifier: 'facilities', template: 'facilities',
    description: 'Buildings, rooms, desks, access cards and site services.',
    visibility: 'open', audiencePermission: null, audienceIds: [], isPrimary: false,
  },
  {
    id: 4, name: 'Finance', identifier: 'finance', template: 'finance',
    description: 'Expenses, invoices, purchase approvals and reimbursements.',
    visibility: 'restricted', audiencePermission: 'department', audienceIds: [3], isPrimary: false,
  },
];

const m = (serviceDeskId: number, userId: number, membershipType: MembershipType): ServiceDeskMembership =>
  ({ serviceDeskId, userId, membershipType });

/* ⚠️ Three rows here are deliberate — do not "tidy" them away: Neha Iyer (Desk Technician) working
   inside the IT desk, Meera Joshi (Desk Technician) MANAGING HR, and Amit Kulkarni managing IT while
   being an agent in HR. Counts this produces: IT 7/1 · HR 3/1 · Facilities 3/1 · Finance 2/1. */
const FOUR_MEMBERSHIPS: ServiceDeskMembership[] = [
  m(1, 1, 'manager'), m(1, 2, 'agent'), m(1, 3, 'agent'), m(1, 5, 'agent'), m(1, 7, 'agent'), m(1, 9, 'agent'), m(1, 4, 'agent'),
  m(2, 8, 'manager'), m(2, 6, 'agent'), m(2, 1, 'agent'),
  m(3, 10, 'manager'), m(3, 7, 'agent'), m(3, 9, 'agent'),
  m(4, 2, 'manager'), m(4, 6, 'agent'),
];

/* The at-the-limit seed: the four desks plus 21 more, so the 25-desk ceiling can be exercised from
   the Prototype controls. Each carries one Manager — a desk without one is not a valid state. */
const LIMIT_EXTRA = [
  'Legal', 'Procurement', 'Marketing', 'Sales Operations', 'Security', 'Payroll', 'Travel',
  'Workplace', 'Engineering', 'Customer Success', 'Data Platform', 'Compliance', 'Internal Audit',
  'Treasury', 'Learning and Development', 'Recruitment', 'Benefits', 'Health and Safety', 'Fleet',
  'Mailroom', 'Events',
];

export type DemoData = 'four' | 'one' | 'none' | 'limit' | 'error';

export const DEMO_OPTIONS: { value: DemoData; label: string }[] = [
  { value: 'four', label: 'Four Service Desks (after ESM rollout)' },
  { value: 'one', label: 'One Service Desk (just after upgrade)' },
  { value: 'none', label: 'No Service Desks (before ESM)' },
  { value: 'limit', label: 'Twenty-five Service Desks (at the limit)' },
  { value: 'error', label: 'Simulate a load error' },
];

export type ViewAs = 'super_admin' | 'technician';

export const VIEW_AS_OPTIONS: { value: ViewAs; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'technician', label: 'Technician (no admin rights)' },
];

/** Fresh copies every time, so an edit can never write through into the seed itself. */
export function seedFor(demo: DemoData): { desks: ServiceDesk[]; memberships: ServiceDeskMembership[] } {
  const four = () => ({
    desks: FOUR_DESKS.map((d) => ({ ...d, audienceIds: [...d.audienceIds] })),
    memberships: FOUR_MEMBERSHIPS.map((x) => ({ ...x })),
  });
  switch (demo) {
    case 'none':
      return { desks: [], memberships: [] };
    case 'one': {
      const s = four();
      return { desks: s.desks.filter((d) => d.id === 1), memberships: s.memberships.filter((x) => x.serviceDeskId === 1) };
    }
    case 'limit': {
      const s = four();
      LIMIT_EXTRA.forEach((name, i) => {
        const id = 5 + i;
        s.desks.push({
          id, name, identifier: slugify(name), template: 'general',
          description: `Requests for ${name}.`,
          visibility: 'open', audiencePermission: null, audienceIds: [], isPrimary: false,
        });
        s.memberships.push(m(id, TECHNICIANS[i % TECHNICIANS.length].id, 'manager'));
      });
      return s;
    }
    default:
      // 'error' keeps the four-desk data behind it: the failure is the LOAD, not the data.
      return four();
  }
}

// ── Store (localStorage) ───────────────────────────────────────────────────

export interface DeskStore {
  demo: DemoData;
  viewAs: ViewAs;
  desks: ServiceDesk[];
  memberships: ServiceDeskMembership[];
}

const STORAGE_KEY = 'serviceops.esm.serviceDesks.v1';

export const initialStore = (): DeskStore => ({ demo: 'four', viewAs: 'super_admin', ...seedFor('four') });

export function loadStore(): DeskStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<DeskStore>;
      if (Array.isArray(s.desks) && Array.isArray(s.memberships) && s.demo && s.viewAs) return s as DeskStore;
    }
  } catch { /* private window or blocked storage — fall through to the seed */ }
  return initialStore();
}

export function saveStore(s: DeskStore) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* not fatal */ }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Name → identifier: accents stripped, lowercased, every run of anything else one hyphen, no
 *  leading or trailing hyphen, capped at the identifier's 30 characters.
 *  "Legal & Compliance (EMEA)" → "legal-compliance-emea". */
export const slugify = (name: string) =>
  name
    .normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/, '');

export const membersOf = (memberships: ServiceDeskMembership[], deskId: number) =>
  memberships.filter((x) => x.serviceDeskId === deskId);

export const technicianById = (id: number) => TECHNICIANS.find((t) => t.id === id);

/** The audience line under a Restricted tag, e.g. "Department — Finance". Null for an open desk. */
export function audienceSummary(d: ServiceDesk): string | null {
  if (d.visibility !== 'restricted' || !d.audiencePermission) return null;
  if (d.audiencePermission === 'all_requesters') return AUDIENCE_LABEL.all_requesters;
  const pool = d.audiencePermission === 'department' ? DEPARTMENTS : REQUESTER_GROUPS;
  const names = d.audienceIds.map((id) => pool.find((p) => p.id === id)?.name).filter(Boolean).join(', ');
  return `${AUDIENCE_LABEL[d.audiencePermission]} — ${names}`;
}

/** Primary first, then by name. */
export const sortDesks = (desks: ServiceDesk[]) =>
  [...desks].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));
