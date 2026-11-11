import { canGlobal, canWorkspace, hasGlobalAccess, isSuperAdmin, permissionFor, withinOwn } from './rolesData';
import type { RoleMap } from './rolesData';
import type { Role } from './rolesData';
/* ESM — Workspaces (Admin › Platform Configuration › Organization).
 *
 * A Workspace is one department's service desk inside one ServiceOps (IT, HR, Facilities…).
 * Design records: ESM-ll/Features/F01-service-workspace.md, F02-F03-users-roles-scope.md, and the
 * redesign brief of 2026-10-28 (Juli): three levels — Organization · Workspace · Operational.
 * This file is the data half: the shape engineering builds from, the demo seed, and the localStorage
 * store. There is no backend; every permission check here is a stand-in for one the SERVER must make.
 *
 * ⚠️ Invariants:
 *   - The default workspace is IT, made by the system: it can't be deleted or made inactive, and its type
 *     can't change. More workspaces may use the IT template (Juli, 2026-10-23).
 *   - There is NO owner role (brief, 2026-10-28). A Workspace Admin is a MEMBER whose role here includes
 *     "Workspace Admin" — an explicit permission, never implied by being named somewhere. Each workspace
 *     keeps at least one.
 *   - One global technician account per person. A workspace only holds MEMBERSHIPS (roles · groups ·
 *     scope); removing one never touches the account or other memberships.
 *   - Type can change while in Setup; it is locked once the workspace has been Live.
 *   - Delete only while the workspace has no tickets; otherwise make it Inactive.
 *   - No Department or Location field: both describe the EMPLOYEE, not the team that serves them. */

export type WorkspaceType = 'it' | 'hr' | 'facilities' | 'finance' | 'legal' | 'general';
export type WorkspaceStatus = 'setup' | 'live' | 'inactive';

export interface AuditEntry { at: string; by: number; text: string }

export interface Workspace {
  id: number;
  name: string;
  type: WorkspaceType;
  description: string;
  colour: string;
  status: WorkspaceStatus;
  /** The IT workspace. Exactly one; holds everything that existed before ESM. */
  isDefault: boolean;
  /** Demo only — stands in for "does this workspace hold any tickets" (the delete rule). */
  ticketCount: number;
  createdOn: string;
  /** Set while Inactive: when normal processing was paused. */
  inactiveSince?: string;
  /** F05: only members see its tickets and settings — Super Admin and Manage All Workspaces stop at the wall. */
  confidential?: boolean;
  /** F02a §9: which employees see this workspace on the Support Portal. Missing = All logged-in users. */
  portalAccess?: PortalAccess;
  setup: WorkspaceSetup;
  audit: AuditEntry[];
}

export type SetupStep = 'groups' | 'requests' | 'reach';

/** F02a §9 Portal Access: same three words as the ServiceOps catalog item / KB folder Access Permission. */
export interface PortalAccess { mode: 'logged_in' | 'public' | 'groups'; groups: string[]; except: string[] }

export interface RequestType { name: string; on: boolean }

export interface WorkspaceSetup {
  memberIds: number[];
  groups: string[];
  requestTypes: RequestType[];
  portal: boolean;
  email: string;
  /** Each member's groups, scope and Workspace Admin switch HERE. Missing entry = the default. Roles are on the
   *  technician (one list for every workspace), not here — F03 rethink, Juli 2026-11-03. */
  access: Record<number, MemberAccess>;
  /** Setup guide steps the admin finished or skipped. */
  guide: Partial<Record<GuideStep, 'done' | 'skipped'>>;
  /** What the setup panel added: catalog services and published articles (template defaults until then). */
  catalogItems?: string[];
  articles?: string[];
}

// ── Workspace access: scope, groups and workspace roles per workspace (F03d, Juli 2026-11-04) ──────────────────
/* ServiceOps' own model, kept: a role is tick boxes; a person's permissions = the union of their roles
 * (`FlotoAuthorizationServiceImpl.checkPermission`). ESM F03f (Juli, 2026-11-04): roles are given IN A WORKSPACE, in its
 * Workspace Access row (with Scope + Technician Groups). The role's ticket tabs and Admin › Workspace tab count there;
 * its Admin › Global tab and Organization data tabs count in Organization settings. Checks: rolesData.canGlobal /
 * canWorkspace. Features/F03f-esm-roles-global-workspace.md. */

/** The five Scope values ServiceOps already has (`AccessLevel`), now chosen per workspace. Not replaced. */
export type ScopeLevel = 'global' | 'group' | 'restricted' | 'global_restricted' | 'custom';

export interface MemberAccess { scope: ScopeLevel; customScope?: string; groups: string[]; roles?: string[] }

export const SCOPE_OPTIONS: { value: ScopeLevel; label: string; desc: string }[] = [
  { value: 'global', label: 'Global Access', desc: 'Every ticket in this workspace' },
  { value: 'group', label: 'Group Access', desc: 'Tickets of their groups, and tickets assigned to them' },
  { value: 'restricted', label: 'Restricted', desc: 'Only tickets assigned to them' },
  { value: 'global_restricted', label: 'Global Restricted', desc: 'See every ticket, change only theirs or their groups’' },
  { value: 'custom', label: 'Custom', desc: 'A rule from Admin › Custom Scope' },
];

export const CUSTOM_SCOPES = ['Requests from the requester’s location', 'VIP requesters only'];

/** Organization Admins: people whose Organization roles hold Organization Admin tick boxes (or Super Admin). They
 *  administer Organization settings and, through the Manage Workspace / settings tick boxes, every workspace (except
 *  confidential workspaces they are not in, F05) without being members. Derived, never stored. */
export interface OrgAdmin { id: number }

export function accessOf(w: Workspace, id: number): MemberAccess {
  return w.setup.access[id] ?? { scope: 'group', groups: w.setup.groups.slice(0, 1), roles: [] };
}

/** A Workspace Admin of this workspace = a member given, IN this workspace, a role with any Admin tick box that works
 *  here (F03e). People whose admin comes from roles given Everywhere are Organization-level and listed apart. */
export const isWorkspaceAdmin = (w: Workspace, id: number) =>
  w.setup.memberIds.includes(id) && ANY_WS_LABELS.some((l) => canWorkspace({ [w.id]: accessOf(w, id).roles ?? [] }, w.id, l));

/** The people who keep a workspace running: given, IN it, a role with Assign Roles in Workspace (they can give roles
 *  and manage the team). Every workspace must keep at least one (F03f QA B3). */
export const adminIdsOf = (w: Workspace) => w.setup.memberIds.filter((id) => canWorkspace({ [w.id]: accessOf(w, id).roles ?? [] }, w.id, 'Assign Roles in Workspace'));
/** The people who can still manage roles and users for the organization (Global › Manage Roles + Update User). There
 *  must always be one (F03f QA B6). */
export const orgKeeperIds = (ws: Workspace[], techs: Technician[]) => techs.filter((t) => !t.disabled && canGlobal(roleMapIn(ws, t.id), 'Manage Roles') && canGlobal(roleMapIn(ws, t.id), 'Update User')).map((t) => t.id);

export const scopeLabel = (a: MemberAccess) =>
  a.scope === 'custom' && a.customScope ? `Custom · ${a.customScope}` : SCOPE_OPTIONS.find((s) => s.value === a.scope)!.label;

/** Every workspace a person is a member of, with their access there — so one membership can be read
 *  next to the others without being changed by them. */
export const membershipsOf = (ws: Workspace[], techId: number) =>
  ws.filter((w) => w.setup.memberIds.includes(techId)).map((w) => ({ w, access: accessOf(w, techId) }));

// ── Templates ──────────────────────────────────────────────────────────────────────────────────

/** What a template seeds. Templates initialise configuration only — never a separate instance, never
 *  user accounts. */
export const KIND_TEMPLATE: Record<WorkspaceType, { requests: string[]; groups: string[]; includes: string[]; articles: string[] }> = {
  it: { articles: ['How to reset your password', 'Connect to the VPN', 'Request new software'], requests: ['New laptop', 'Software access', 'VPN access', 'Password reset', 'Report a problem'], groups: ['Service Desk', 'Network', 'Applications'], includes: ['Incident, problem and change forms', 'Service Desk Technician as the default role'] },
  hr: { articles: ['Leave policy', 'How to read your payslip', 'Employee code of conduct'], requests: ['Leave request', 'Payslip query', 'Employment letter', 'Update bank details', 'Policy question'], groups: ['Payroll', 'Benefits', 'Employee Relations'], includes: ['Requesters see only their own requests', 'Confidential-ready request forms'] },
  facilities: { articles: ['Booking a meeting room', 'Access card policy', 'Parking guidelines'], requests: ['Book a meeting room', 'Access card', 'Desk move', 'Repair request', 'Parking'], groups: ['Maintenance', 'Workplace', 'Security'], includes: ['Location on every request form'] },
  finance: { articles: ['Expense policy', 'How to submit a claim', 'Travel reimbursement rules'], requests: ['Expense claim', 'Advance salary', 'Vendor payment', 'Tax question', 'Reimbursement status'], groups: ['Accounts Payable', 'Expenses', 'Payroll'], includes: ['Amount and cost-centre fields'] },
  legal: { articles: ['When you need an NDA', 'Contract review timelines'], requests: ['Contract review', 'NDA request', 'Policy question', 'Trademark query'], groups: ['Contracts', 'Compliance'], includes: ['Requesters see only their own requests'] },
  general: { articles: ['How to raise a request'], requests: ['General request', 'Ask a question', 'Report a problem'], groups: [], includes: ['One team group named after the workspace'] },
};

// ── Setup steps ────────────────────────────────────────────────────────────────────────────────

/* A new workspace's setup, shown ONLY inside the workspace (its settings home), never on the
 * Organization › Workspaces page (Juli, 2026-10-28). Each step is a ServiceOps admin item: same title,
 * icon and path as the live admin (adminData.ts). Any order, each can be left for later, and Go Live is
 * never blocked by them (all competitors agree, F01b §8.4). */
export type GuideStep = 'email' | 'catalog' | 'knowledge';

/* Groups and request categories are NOT steps: the template already made them (ManageEngine marks them
 * "essentials ready", Freshservice's guide never asks) and they stay editable in the settings below. */
export const GUIDE_STEPS: { id: GuideStep; title: string; path: string; icon: string; desc: string }[] = [
  { id: 'email', title: 'Emails', path: 'Support Channels › Emails', icon: 'Mail', desc: 'Mail sent to this address becomes a request here.' },
  { id: 'catalog', title: 'Service Catalog', path: 'Service Catalog', icon: 'Layers', desc: 'Pick the services employees can request from this team.' },
  { id: 'knowledge', title: 'Knowledge', path: 'Knowledge Management', icon: 'Lightbulb', desc: 'Publish articles employees read before raising a request.' },
];

/** Email ticks itself from real data (an address is set); the rest are marked done or left for later. */
export const guideState = (w: Workspace, id: GuideStep): 'done' | 'skipped' | 'todo' =>
  id === 'email' && w.setup.email.trim() ? 'done' : w.setup.guide[id] ?? 'todo';

// ── Technicians, personas ──────────────────────────────────────────────────────────────────────

/** A technician account (Admin › Users › Technicians). The optional fields are the ServiceOps technician form's
 *  fields. `roles` = what they can do, in every workspace they work in (as today). Groups and Scope are NOT here —
 *  with ESM they are per workspace (setup.access). */
export interface Technician {
  id: number; name: string; email: string; disabled?: boolean; roles?: string[];
  logonName?: string; department?: string; manager?: string; contactNo?: string; location?: string;
  supportLevel?: string; licenseType?: string; allowLogin?: boolean;
}

export const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Facilities', 'Legal'];
export const LOCATIONS = ['Asia', 'Europe', 'North America'];
export const SUPPORT_LEVELS = ['Tier 1', 'Tier 2', 'Tier 3'];
export const LICENSE_TYPES = ['Named User', 'Concurrent'];

export type WorkspaceDraft = Pick<Workspace, 'name' | 'type' | 'description' | 'colour'> & { adminIds: number[] };

/** Placeholder until F25 (limits). Freshservice showed 25; ManageEngine on-prem states 50. */
export const MAX_WORKSPACES = 25;
export const MAX_NAME = 64;
export const MAX_DESCRIPTION = 255;

export const TYPE_LABEL: Record<WorkspaceType, string> = {
  it: 'IT', hr: 'HR', facilities: 'Facilities', finance: 'Finance', legal: 'Legal', general: 'General',
};

/** Templates an admin can pick on create. 'general' is shown apart, as Start from Scratch. */
export const CREATABLE_TYPES: { value: WorkspaceType; desc: string }[] = [
  { value: 'it', desc: 'Another IT team, e.g. a region or a business unit' },
  { value: 'hr', desc: 'Onboarding, payroll, leave, policies' },
  { value: 'facilities', desc: 'Buildings, maintenance, seating, travel' },
  { value: 'finance', desc: 'Expenses, invoices, reimbursements' },
  { value: 'legal', desc: 'Contracts, NDAs, compliance questions' },
  { value: 'general', desc: 'Any other team: start from blank' },
];

export const TYPE_COLOUR: Record<WorkspaceType, string> = {
  it: '#3D8BD0', hr: '#7C3AED', facilities: '#0D9488', finance: '#D97706', legal: '#64748B', general: '#4F46E5',
};

export const STATUS_LABEL: Record<WorkspaceStatus, string> = { setup: 'Setup', live: 'Live', inactive: 'Inactive' };

export const STATUS_HELP: Record<WorkspaceStatus, string> = {
  setup: 'Being configured. Only its Workspace Admins and Organization Admins can see it.',
  live: 'Open for requests.',
  inactive: 'Paused. Takes no new requests; records are kept.',
};

export const COLOURS = ['#3D8BD0', '#7C3AED', '#0D9488', '#D97706', '#DB2777', '#4F46E5', '#65A30D', '#64748B'];

const SEED_TECHNICIANS: Technician[] = [
  { id: 1, name: 'Amit Kulkarni', email: 'amit.kulkarni@acme.example', roles: ['Super Admin'], logonName: 'amit', department: 'IT', location: 'Asia', licenseType: 'Named User' },
  { id: 2, name: 'Sneha Rao', email: 'sneha.rao@acme.example', roles: ['Request Specialist Technician'], logonName: 'sneha', department: 'Finance', location: 'Asia', licenseType: 'Named User' },
  { id: 3, name: 'Vikram Desai', email: 'vikram.desai@acme.example', roles: ['Service Desk Technician', 'Organization Admin'], logonName: 'vikram', department: 'IT', location: 'Asia', licenseType: 'Named User' },
  { id: 4, name: 'Neha Iyer', email: 'neha.iyer@acme.example', roles: ['Request Specialist Technician'], logonName: 'neha', department: 'HR', location: 'Asia', licenseType: 'Named User' },
  { id: 5, name: 'Rahul Menon', email: 'rahul.menon@acme.example', roles: ['Request Specialist Technician'], logonName: 'rahul', department: 'Legal', location: 'Asia', licenseType: 'Named User' },
  { id: 6, name: 'Farah Qureshi', email: 'farah.qureshi@acme.example', roles: ['Service Desk Technician'], logonName: 'farah', department: 'IT', location: 'Asia', licenseType: 'Named User' },
  { id: 7, name: 'Daniel Fernandes', email: 'daniel.fernandes@acme.example', roles: ['Request Specialist Technician'], logonName: 'daniel', department: 'Facilities', location: 'Asia', licenseType: 'Named User' },
  { id: 8, name: 'Meera Joshi', email: 'meera.joshi@acme.example', roles: ['Request Specialist Technician'], logonName: 'meera', department: 'HR', location: 'Asia', licenseType: 'Named User' },
  { id: 9, name: 'Arjun Pillai', email: 'arjun.pillai@acme.example', roles: ['Service Desk Technician'], logonName: 'arjun', department: 'IT', location: 'Asia', licenseType: 'Named User', disabled: true },
  { id: 10, name: 'Kavita Bhatt', email: 'kavita.bhatt@acme.example', roles: ['Request Specialist Technician'], logonName: 'kavita', department: 'Facilities', location: 'Asia', licenseType: 'Named User' },
  { id: 11, name: 'Priya Shah', email: 'priya.shah@acme.example', roles: ['Service Desk Technician'], logonName: 'priya', department: 'IT', location: 'Asia', licenseType: 'Named User' },
  { id: 12, name: 'Omar Siddiqui', email: 'omar.siddiqui@acme.example', roles: ['Request Specialist Technician'], logonName: 'omar', department: 'Facilities', location: 'Asia', licenseType: 'Named User' },
];

/** The global technician pool. Live binding: the store syncs created accounts into it. */
export const TECHNICIANS: Technician[] = SEED_TECHNICIANS.map((t) => ({ ...t }));
const syncTechnicians = (list: Technician[]) => { TECHNICIANS.splice(0, TECHNICIANS.length, ...list); };

/** Who the prototype is signed in as (Admin sidebar › View as) = a technician id. Any technician can be picked; a few
 *  are named presets. What they see is worked out from their roles and where they were given. */
export type ViewAs = number;
export const PRESETS: { id: number; label: string }[] = [
  { id: 1, label: 'Super Admin' }, { id: 3, label: 'Organization Admin' }, { id: 8, label: 'Workspace Admin (HR)' },
  { id: 6, label: 'Workspace Admin (IT)' }, { id: 11, label: 'Technician (IT + HR)' },
];
export const personaInfo = (viewAs: ViewAs) => {
  const t = technicianById(viewAs);
  return { id: viewAs, name: t?.name ?? `Technician ${viewAs}`, label: PRESETS.find((x) => x.id === viewAs)?.label ?? 'Technician' };
};
/** Sees Organization settings: has an Admin tick box that counts at Organization level (or Super Admin). */
export const orgView = (viewAs: ViewAs) => hasGlobalAccess(roleMapOf(viewAs));

// ── Seed ───────────────────────────────────────────────────────────────────────────────────────

/** [technician, gets the Workspace Admin role here, scope here, groups here]. */
type Seat = [id: number, admin: boolean, scope: ScopeLevel, groups: string[]];

function make(base: Omit<Workspace, 'setup' | 'audit'>, seats: Seat[], opts: { done?: boolean; email?: string; audit?: AuditEntry[] } = {}): Workspace {
  const access: Record<number, MemberAccess> = {};
  // F03f: the person's ServiceOps roles are given in each workspace they work in, + Workspace Admin where they admin it.
  seats.forEach(([id, admin, scope, groups]) => { access[id] = { roles: [...(SEED_TECHNICIANS.find((t) => t.id === id)?.roles ?? []), ...(admin ? ['Workspace Admin'] : [])], scope, groups }; });
  const done = opts.done ?? true;
  return {
    ...base,
    setup: {
      memberIds: seats.map((s) => s[0]),
      groups: base.type === 'general' ? [`${base.name} Team`] : KIND_TEMPLATE[base.type].groups.slice(),
      requestTypes: KIND_TEMPLATE[base.type].requests.map((n) => ({ name: n, on: true })),
      portal: done, email: opts.email ?? '', access, guide: done ? { catalog: 'done', knowledge: 'done' } : {},
    },
    audit: opts.audit ?? [{ at: `${base.createdOn}T10:00`, by: 1, text: `Created the ${base.name} workspace from the ${TYPE_LABEL[base.type]} template` }],
  };
}

const A = true;
const T = false;

/** A new workspace's configuration: the template's suggestions, nothing reviewed yet, and its chosen
 *  Workspace Admins as members with the Workspace Admin role and Global Access. */
export function newSetup(type: WorkspaceType, name: string, adminIds: number[]): WorkspaceSetup {
  const access: Record<number, MemberAccess> = {};
  adminIds.forEach((id) => { access[id] = { roles: ['Workspace Admin'], scope: 'global', groups: [] }; });
  return {
    memberIds: [...adminIds],
    groups: type === 'general' ? [`${name} Team`] : KIND_TEMPLATE[type].groups.slice(),
    requestTypes: KIND_TEMPLATE[type].requests.map((n) => ({ name: n, on: true })),
    portal: false, email: '', access, guide: {},
  };
}

function seedFour(): Workspace[] {
  const it = make(
    { id: 1, name: 'IT', type: 'it', isDefault: true, status: 'live', colour: '#3D8BD0', description: 'Hardware, software, access and everything the IT team runs.', ticketCount: 985, createdOn: '2024-03-18' },
    [[1, A, 'global', ['Service Desk']], [6, A, 'global', ['Service Desk', 'Network']], [3, T, 'group', ['Network']],
      [4, T, 'group', ['Service Desk']], [11, T, 'group', ['Service Desk']], [9, T, 'group', ['Applications']]],
    { email: 'it-help@acme.example', audit: [{ at: '2024-03-18T09:00', by: 1, text: 'Upgraded to workspaces: everything from before is kept in IT' }] },
  );
  const hr = make(
    { id: 2, name: 'Human Resources', type: 'hr', isDefault: false, status: 'live', colour: '#7C3AED', description: 'Onboarding, payroll, leave and employee relations.', ticketCount: 214, createdOn: '2026-10-01' },
    [[8, A, 'global', ['Employee Relations']], [4, T, 'group', ['Payroll']], [11, T, 'restricted', ['Employee Relations']], [6, T, 'global_restricted', []]],
    { email: 'hr@acme.example', audit: [
      { at: '2026-10-01T10:00', by: 1, text: 'Created the Human Resources workspace from the HR template' },
      { at: '2026-10-01T10:05', by: 1, text: 'Made Meera Joshi a Workspace Admin' },
      { at: '2026-10-02T11:20', by: 8, text: 'Added Priya Shah · Restricted · Employee Relations' },
      { at: '2026-10-04T09:00', by: 1, text: 'Made the workspace Live' },
    ] },
  );
  const fac = make(
    { id: 3, name: 'Facilities', type: 'facilities', isDefault: false, status: 'live', colour: '#0D9488', description: 'Buildings, rooms, seating, access cards and site services.', ticketCount: 96, createdOn: '2026-10-03' },
    [[10, A, 'global', ['Workplace']], [7, A, 'global', ['Maintenance']], [12, T, 'group', ['Security']]],
  );
  const fin = make(
    { id: 4, name: 'Finance', type: 'finance', isDefault: false, status: 'setup', colour: '#D97706', description: 'Expenses, invoices, purchase approvals and reimbursements.', ticketCount: 0, createdOn: '2026-10-12' },
    [[2, A, 'global', []]], { done: false },
  );
  const legal = make(
    { id: 5, name: 'Legal', type: 'legal', isDefault: false, status: 'inactive', confidential: true, inactiveSince: '2026-10-20', colour: '#64748B', description: 'Contract reviews and NDAs. Paused while the team moves to the new process.', ticketCount: 38, createdOn: '2026-06-20' },
    [[5, A, 'global', ['Contracts']]],
    { email: 'legal@acme.example', audit: [
      { at: '2026-06-20T10:00', by: 1, text: 'Created the Legal workspace from the Legal template' },
      { at: '2026-10-20T16:30', by: 1, text: 'Made the workspace Inactive: normal processing paused' },
    ] },
  );
  return [it, hr, fac, fin, legal];
}

const LIMIT_EXTRA = [
  'Procurement', 'Marketing Ops', 'Sales Ops', 'Security', 'Payroll', 'Travel', 'Workplace', 'Engineering Ops',
  'Customer Success', 'Data Platform', 'Compliance', 'Internal Audit', 'Treasury', 'Learning', 'Recruitment',
  'Benefits', 'Health and Safety', 'Fleet', 'Mailroom', 'Events',
];

export type DemoData = 'four' | 'upgrade' | 'limit' | 'error';

export const DEMO_OPTIONS: { value: DemoData; label: string }[] = [
  { value: 'four', label: 'Five workspaces (after ESM rollout)' },
  { value: 'upgrade', label: 'Just after upgrade (IT only)' },
  { value: 'limit', label: `${MAX_WORKSPACES} workspaces (at the limit)` },
  { value: 'error', label: 'Simulate a load error' },
];

export function seedFor(demo: DemoData): Workspace[] {
  const four = seedFour();
  if (demo === 'upgrade') return [four[0]];
  if (demo !== 'limit') return four;
  LIMIT_EXTRA.forEach((name, i) => {
    const admin = SEED_TECHNICIANS[i % 8].id;
    four.push(make({ id: 6 + i, name, type: 'general', isDefault: false, status: 'live', colour: COLOURS[i % COLOURS.length], description: `Requests for ${name}.`, ticketCount: 5 + i, createdOn: '2026-10-05' }, [[admin, A, 'global', [`${name} Team`]]]));
  });
  return four;
}

// ── Store (localStorage) ───────────────────────────────────────────────────────────────────────

export interface WorkspaceStore {
  demo: DemoData;
  viewAs: ViewAs;
  workspaces: Workspace[];
  technicians: Technician[];
}

const STORAGE_KEY = 'serviceops.esm.workspaces.v18';

export const initialStore = (): WorkspaceStore => ({
  demo: 'four', viewAs: 1, workspaces: seedFor('four'), technicians: SEED_TECHNICIANS.map((t) => ({ ...t })),
});

/** Organization Admins, worked out from their Organization roles. */
export const orgAdminsOf = (s: WorkspaceStore): OrgAdmin[] =>
  s.technicians.filter((t) => !t.disabled && hasGlobalAccess(roleMapIn(s.workspaces, t.id))).map((t) => ({ id: t.id }));

export function loadStore(): WorkspaceStore {
  let s: WorkspaceStore = initialStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<WorkspaceStore>;
      if (Array.isArray(p.workspaces) && Array.isArray(p.technicians) && p.demo && typeof p.viewAs === 'number') s = { ...s, ...p } as WorkspaceStore;
    }
  } catch { /* private window or blocked storage: fall through to the seed */ }
  // Older stores predate the technician form fields: fill them from the seed, never over saved values.
  s = { ...s, technicians: s.technicians.map((t) => ({ ...SEED_TECHNICIANS.find((x) => x.id === t.id), ...t })) };
  syncTechnicians(s.technicians);
  syncWorkspaces(s.workspaces);
  return s;
}

export function saveStore(s: WorkspaceStore) {
  syncTechnicians(s.technicians);
  syncWorkspaces(s.workspaces);
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* not fatal */ }
}

export const technicianById = (id: number) => TECHNICIANS.find((t) => t.id === id);

/** Live copy of the workspaces, so permission checks can read every Workspace Access row without reloading storage. */
const WORKSPACES_LIVE: Workspace[] = [];
const syncWorkspaces = (ws: Workspace[]) => { WORKSPACES_LIVE.splice(0, WORKSPACES_LIVE.length, ...ws); };
/** A person's roles, workspace by workspace (F03f). */
export const roleMapIn = (ws: Workspace[], id: number): RoleMap =>
  Object.fromEntries(ws.filter((w) => w.setup.memberIds.includes(id)).map((w) => [w.id, accessOf(w, id).roles ?? []]));
export const roleMapOf = (id: number): RoleMap => { if (!WORKSPACES_LIVE.length) loadStore(); return roleMapIn(WORKSPACES_LIVE, id); };

/** Default first, then Live, Setup, Inactive, then by name. */
export function sortWorkspaces(ws: Workspace[]): Workspace[] {
  const rank: Record<WorkspaceStatus, number> = { live: 0, setup: 1, inactive: 2 };
  return [...ws].sort((a, b) =>
    Number(b.isDefault) - Number(a.isDefault) || rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
}

// ── Permissions (prototype stand-ins for server checks) ────────────────────────────────────────

/** Can the signed-in person do Admin › Workspace tick box `label` in this workspace? */
export const canIn = (viewAs: ViewAs, w: Workspace, label: string) =>
  (!w.confidential || w.setup.memberIds.includes(viewAs)) && canWorkspace(roleMapOf(viewAs), w.id, label); // F05: confidential = members only
/** Can they do Admin › Global tick box `label` (Organization settings)? */
export const canAtOrg = (viewAs: ViewAs, label: string) => canGlobal(roleMapOf(viewAs), label);

/** May they open this Organization admin card? Its tick box must count at Organization level. A card with no tick box
 *  of its own (none in ServiceOps' tree) is Super Admin only. */
export const orgCan = (viewAs: ViewAs, section: string, card?: string) => {
  const label = permissionFor(section, card);
  return label ? canAtOrg(viewAs, label) : isSuperAdmin(roleMapOf(viewAs));
};

/** May they enter this workspace's admin at all (any Admin tick box that works there)? */
export const canAdminister = (viewAs: ViewAs, w: Workspace) =>
  adminLabelsHere(viewAs, w).length > 0;
const ANY_WS_LABELS = ['Edit Workspace Details', 'Change Workspace Status', 'Manage Workspace Team', 'Assign Roles in Workspace', 'View Workspace Audit Log',
  'Manage Workflow', 'Manage SLA', 'Manage Approval Workflow', 'Manage Event Notifications', 'Manage Auto Assignment', 'Manage Scenario', 'Manage Incident Schedules',
  'Manage Task Schedule', 'Manage Business Hour', 'Manage System Preference', 'Manage User Groups', 'Manage Support Channels', 'Manage Request Management',
  'Manage Problem Management', 'Manage Change Management', 'Manage Release Management', 'Manage Service Catalog', 'Manage Knowledge Management',
  'Manage Knowledge Custom Rules', 'Manage User Survey', 'Manage Task Management'];
const adminLabelsHere = (viewAs: ViewAs, w: Workspace) => ANY_WS_LABELS.filter((l) => canIn(viewAs, w, l));

/** May they give (or take away) this role in this workspace? Needs Assign Roles in Workspace there, and every Admin
 *  tick box of the role that works there (no escalation). */
export const canGiveRole = (viewAs: ViewAs, w: Workspace, role: Role) =>
  canIn(viewAs, w, 'Assign Roles in Workspace') && withinOwn(role, roleMapOf(viewAs), w.id);

export const isOrgAdmin = (s: WorkspaceStore, id: number) => hasGlobalAccess(roleMapIn(s.workspaces, id));

// ── Where a role is given (F03f: always in a workspace) ────────────────────────────────────────────
export type Place = number;
export interface Assignment { techId: number; role: string; place: Place }
export const placeLabel = (s: WorkspaceStore, p: Place) => s.workspaces.find((w) => w.id === p)?.name ?? 'Workspace';

/** Every workspace a technician holds a role in. */
export function assignmentsOf(s: WorkspaceStore, techId: number): Assignment[] {
  return sortWorkspaces(s.workspaces).filter((w) => w.setup.memberIds.includes(techId))
    .flatMap((w) => (accessOf(w, techId).roles ?? []).map((role) => ({ techId, role, place: w.id })));
}
/** Everyone holding one role, and in which workspace. */
export const holdersOfRole = (s: WorkspaceStore, role: string) => s.technicians.flatMap((t) => assignmentsOf(s, t.id).filter((a) => a.role === role));

/** Give / take a role in a workspace the technician works in. */
export function setRoleAt(s: WorkspaceStore, techId: number, role: string, place: Place, on: boolean): WorkspaceStore {
  const edit = (xs: string[] | undefined) => (on ? [...new Set([...(xs ?? []), role])] : (xs ?? []).filter((x) => x !== role));
  return { ...s, workspaces: s.workspaces.map((w) => (w.id !== place || !w.setup.memberIds.includes(techId) ? w
    : { ...w, setup: { ...w.setup, access: { ...w.setup.access, [techId]: { ...accessOf(w, techId), roles: edit(accessOf(w, techId).roles) } } } })) };
}
