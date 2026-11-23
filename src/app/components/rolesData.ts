/* Admin › Users › Roles — data. F03c (exact ServiceOps trees) + F03f (Juli, 2026-11-04).
 *
 * ServiceOps today [VERIFIED 172.16.15.185, 2026-11-04]: /admin/roles lists the 17 predefined roles below; built-in
 * roles are LOCKED (every tick box + Name disabled) and customised by Clone. Create/Edit Role = Name, Description,
 * tabs Permissions · Users; Permissions = 18 module tabs, a checkbox tree each. Every module tree in TREES is copied
 * verbatim from the live page (one line per checkbox, one leading dot per level).
 *
 * ESM (F03f) — roles stay as they are; the Admin tab gets two sub-tabs:
 *   · Global    = Organization settings: ServiceOps' Admin tree minus workspace-only pages, + New Manage Workspaces
 *                 (Create / Delete / Manage All Workspaces) and the Automation split;
 *   · Workspace = a workspace's own settings, module by module (all New).
 * A role is given in a workspace (technician form › Workspace Access); see the check at the end of this file. */

export type ModuleScope = 'workspace' | 'it' | 'org';
export interface PermNode { id: string; label: string; isNew?: boolean; note?: string; children?: PermNode[] }
export interface PermModule { key: string; label: string; scope: ModuleScope; tree: PermNode[] }

/* Shared sub-trees exactly as ServiceOps repeats them inside modules. `d` = the depth they start at. */
const dots = (d: number) => '.'.repeat(d);
const TASKS = (d: number) => [
  'View Tasks', '.Create', '.Update', '..Assign', '..Update Priority', '..Update Status', '...Resolve Task', '...Close Task', '...Reopen Task', '.Archive',
].map((l) => dots(d) + l).join('\n');
const APPROVAL = (d: number) => ['Manage Approval', '.Create Approval', '.Ignore Approval', '.Delete Approval'].map((l) => dots(d) + l).join('\n');
const SIGNATURE = (d: number) => ['Digital Signature', '.View Signatures', '..Request Signatures', '..Delete Signatures'].map((l) => dots(d) + l).join('\n');
const ARCHIVE = (d: number) => ['Archive', '.Restore Archive', '.Delete Archive'].map((l) => dots(d) + l).join('\n');

const TREES: Record<string, string> = {
  request: `View
.Create
..Create Requester
.Update
..Assign
..Update Priority
..Update Status
...Resolve Request
...Close Request
...Re-Open Request
..Manage Solution
..Manage Relationship
...Merge/Unmerge Request
${TASKS(2)}
..Communicate with requester
..Mark Spam
..Manage Attachment
..Manage Tags
..Update Due By
${APPROVAL(2)}
${SIGNATURE(2)}
${ARCHIVE(1)}`,
  problem: `View
.Create
.Update
..Assign
..Update Priority
..Update Status
...Resolve Problem
...Close Problem
...Re-Open Problem
..Manage Solution
..Manage Relationship
${TASKS(2)}
..Manage Attachment
..Manage Tags
..Update Due By
${APPROVAL(2)}
${ARCHIVE(1)}`,
  change: `View
.Create
.Update
..Update Priority
..Update Status
...Close Change
...Re-Open Change
..Manage Relationship
${TASKS(2)}
..Assign
..Manage Attachment
..Manage Tags
..Update Due By
${APPROVAL(2)}
${SIGNATURE(2)}
${ARCHIVE(1)}`,
  release: `View
.Create
.Update
..Update Status
...Close Release
...Re-Open Release
..Manage Relationship
${TASKS(2)}
..Manage Attachment
..Manage Tags
..Update Due By
${APPROVAL(2)}
${ARCHIVE(1)}`,
  knowledge: `Create Knowledge
Update Knowledge
.Manage Attachment
.Manage Tags
.Manage Review
${APPROVAL(1)}
Delete Knowledge
Manage Folder`,
  task: `View
.Create
.Update
..Assign
..Update Priority
..Update Status
...Resolve Task
...Close Task
...Reopen Task
.Archive`,
  asset: `Hardware/Software Asset
.View
..Create
..Update
...Manage Linked Events
...Manage Relationship
...Manage Remote Desktop
...Manage Financials
...Manage Attachment
...Manage Tags
${APPROVAL(3)}
${TASKS(3)}
${ARCHIVE(2)}
..View Software License
...Manage Software License
..View Geolocation
...Manage Geolocation
Non-IT
.View
..Create
..Update
...Manage Linked Events
...Manage Relationship
...Manage Financials
...Manage Attachment
...Manage Tags
${APPROVAL(3)}
${TASKS(3)}
${ARCHIVE(2)}
Consumable Asset
.View
..Create
..Update
...Manage Quantity
...Manage Allocation
...Manage Financials
...Manage Attachment
...Manage Tags
...Manage Linked Events
${TASKS(3)}
${ARCHIVE(2)}`,
  contract: `View
.Create
.Update
..Renew Contract
..Cancel Contract
..Manage Attachment
..Manage Tags
${SIGNATURE(2)}
${ARCHIVE(1)}`,
  purchase: `View
.Create
.Update
..Cancel
..Close
..Manage Relationship
..Manage Settlements
..Manage Attachment
..Manage Tags
${APPROVAL(2)}
${SIGNATURE(2)}
.Archive`,
  cmdb: `View CMDB
.Create CMDB
.Update CMDB
..Manage Linked Events
..Manage Relationships
..Manage Attachments
..Manage Tags
${APPROVAL(2)}
${TASKS(2)}
${ARCHIVE(1)}`,
  patch: `View
.Manage Patch`,
  deployment: `View
.Manage Deployment`,
  project: `View
.Create
.Update
..Change Owner
..Manage Members
..View Planning
...Create
...Update
....Assign
....Update Priority
....Update Status
.....Resolve Task
.....Close Task
.....Reopen Task
...Archive
..Manage Relationship
..Close Project
..Cancel Project
..Manage Attachment
..Manage Tags
${ARCHIVE(1)}`,
  /* ADMIN › GLOBAL (F03f): ServiceOps' own Admin tree, minus the pages that live only inside workspaces in ESM (Auto
   * Assignment, Scenario, Task/Incident Schedules, Service Catalog, Knowledge Custom Rules, User Survey). Their meaning
   * here = the Organization settings pages. "+" = new in ESM; "|" starts the note. */
  admin: `Manage Organization
.+Manage Workspaces|ESM: the Organization › Workspaces page
..+Create Workspace
..+Delete Workspace
..+Manage All Workspaces|This role’s Workspace tab counts in every workspace, not only where it is given
.Manage Privacy Settings
.Digital Signature
..Manage Providers
..Manage Templates
.Manage Account
.Manage Branding
.Manage Departments
.Manage Locations
.Manage Business Hour|Organization calendars
.Manage Leave Management
.Manage System Preference|User, Asset/CMDB, Purchase, Agent, Survey, Project, Application, Search, Contract preferences
.Manage Security
.Manage Priority
.Manage Impact
.Manage Urgency
.Manage Application Maintenance
.Manage Business Service
.Manage Announcements
.Manage Proxy Server Configuration
.Managed Services Providers
Manage Automation
.+Manage Workflow|Organization workflows (run first in every workspace)
.+Manage SLA|Organization SLAs (matched after a workspace’s own)
.+Manage Approval Workflow|Asset, CMDB, user… approvals
.+Manage Event Notifications|Asset, CMDB, contract, purchase, project, user notifications
.+Manage Integrations
.+Manage Custom Script
Manage Users
.View Users
..Create User
..Update User
...Verify User
...Block/Unblock User
...Unlock User
...Convert to Technician/Requester
...Set Password
..Archive User
...Clear User data
...Restore User
...Anonymize User
.Manage User Custom Fields
.Manage User Groups|Requester Groups
.Manage Roles
.Manage LDAP Configuration
.Manage SSO Configuration
.Manage Custom Scope Configuration
.Manage SCIM Provisioning
Manage Support Channels|Outgoing mail servers, Email Preference, Support Portal, Chat, Virtual Agent
Manage Request Management|Organization request fields and form rules, Email Command Settings, Source
Manage Problem Management|Organization problem fields and form rules
Manage Change Management|Organization change fields and form rules
Manage Asset Management
Manage Discovery
Manage Contract
Manage Purchase Management
Manage Release Management|Organization release fields
Manage Project Management
Manage Patch Management
Manage Deployment Management
Manage Agents
.Manage Endpoints
Manage AI
.Manage AI Studio
..View AI Agents
...Create AI Agents
...Update AI Agents
...Delete AI Agents
...Archive AI Agents
...Restore AI Agents
..View AI Teams
...Create AI Teams
...Update AI Teams
...Delete AI Teams
...Archive AI Teams
...Restore AI Teams
..View Knowledge Collections
...Create Knowledge Collections
...Update Knowledge Collections
...Archive Knowledge Collections
...Delete Knowledge Collections
...Restore Knowledge Collections
.Manage AI Governance
.Manage Text Intelligence
Manage Supplier Management
.Manage Catalogs
.Manage Warranty Sync
.Manage EOSL Sync Setting
Manage Os Deployment
.View
..Manage Deployment
..Manage Image
Manage Task Management|Organization task fields and form rules
Manage CMDB
Manage Vulnerability Management`,
  /* ADMIN › WORKSPACE (F03f, all new in ESM): a workspace's own settings, module by module, with ServiceOps' names.
   * Counts in the workspace where the role is given (every workspace with Global › Manage All Workspaces). */
  wsadmin: `+Manage Workspace|This workspace’s own record and team
.+Edit Workspace Details|Name, description, icon
.+Change Workspace Status|Go Live, Make Inactive, make Live again
.+Manage Workspace Team|Add or remove technicians, set their Scope and Groups
..+Assign Roles in Workspace|Give roles here, never more than their own
.+View Workspace Audit Log
+Manage Automation
.+Manage Workflow
.+Manage SLA
.+Manage Approval Workflow
.+Manage Event Notifications|Request, task and survey notifications
.+Manage Auto Assignment
.+Manage Scenario
.+Manage Task Schedule
.+Manage Incident Schedules|IT workspaces
+Manage User Groups|Technician Groups
+Manage Business Hour|The workspace’s own calendars
+Manage System Preference|Request and Task Preference
+Manage Support Channels|Incoming mailboxes
+Manage User Survey
+Manage Request Management|Request form, status, categories, templates, rules, print templates
+Manage Service Catalog
+Manage Problem Management|IT workspaces
+Manage Change Management|IT workspaces
+Manage Release Management|IT workspaces
+Manage Knowledge Management
.+Manage Knowledge Custom Rules
+Manage Task Management`,
  dashboard: `View Dashboard
.Manage Dashboard`,
  report: ['Request Reports', 'Problem Reports', 'Change Reports', 'Hardware/Software Asset Reports', 'Contract Reports', 'Task Reports',
    'Software License Reports', 'Purchase Reports', 'Release Reports', 'Project Reports', 'Patch Reports', 'Deployment Reports',
    'Non IT Asset Reports', 'Consumable Asset Reports', 'Os Deployment Report', 'CMDB Reports', 'Agent Reports', 'Vulnerability Reports',
  ].map((r) => `View ${r}\n.Manage ${r}`).join('\n'),
  endpoint: `View
.Manage Endpoint`,
  vulnerability: `View
.Manage Vulnerability`,
};

let seq = 0;
function parse(text: string): PermNode[] {
  const root: PermNode[] = [];
  const stack: PermNode[][] = [root];
  for (const line of text.split('\n')) {
    const depth = line.match(/^\.*/)![0].length;
    let body = line.slice(depth);
    const isNew = body.startsWith('+');
    if (isNew) body = body.slice(1);
    const [label, note] = body.split('|');
    const node: PermNode = { id: `p${++seq}`, label, ...(isNew ? { isNew } : {}), ...(note ? { note } : {}) };
    const parentList = stack[depth];
    parentList.push(node);
    stack.length = depth + 1;
    node.children = [];
    stack.push(node.children);
  }
  const prune = (xs: PermNode[]) => xs.forEach((x) => { if (!x.children!.length) delete x.children; else prune(x.children!); });
  prune(root);
  return root;
}

/** The 18 module tabs, in ServiceOps' order. `scope` is ESM data (where the records live), shown only as one grey
 *  line on the IT-only tabs. */
const MODULES: [string, string, ModuleScope][] = [
  ['request', 'Request', 'workspace'], ['problem', 'Problem', 'it'], ['change', 'Change', 'it'], ['release', 'Release', 'it'],
  ['knowledge', 'Knowledge', 'workspace'], ['task', 'Task', 'workspace'], ['asset', 'Asset', 'org'], ['contract', 'Contract', 'org'],
  ['purchase', 'Purchase', 'org'], ['cmdb', 'CMDB', 'org'], ['patch', 'Patch', 'org'], ['deployment', 'Deployment', 'org'],
  ['project', 'Project', 'org'], ['admin', 'Admin', 'org'], ['dashboard', 'Dashboard', 'org'], ['report', 'Report', 'org'],
  ['endpoint', 'Endpoint', 'org'], ['vulnerability', 'Vulnerability', 'org'],
  ['wsadmin', 'Admin › Workspace', 'workspace'], // shown as the Workspace sub-tab of Admin
];
export const PERM_MODULES: PermModule[] = MODULES.map(([key, label, scope]) => ({ key, label, scope, tree: parse(TREES[key]) }));

// ── tree helpers ───────────────────────────────────────────────────────────────────────────────
export const flat = (nodes: PermNode[]): PermNode[] => nodes.flatMap((x) => [x, ...flat(x.children ?? [])]);
export const idsOf = (key: string) => flat(PERM_MODULES.find((m) => m.key === key)!.tree).map((x) => x.id);
const topView = (key: string) => [PERM_MODULES.find((m) => m.key === key)!.tree[0].id];

/** Parents of every node, so ticking a child also ticks the parents (as ServiceOps' tree does). */
export const PARENT = new Map<string, string>();
PERM_MODULES.forEach((m) => { const walk = (xs: PermNode[], p?: string) => xs.forEach((x) => { if (p) PARENT.set(x.id, p); walk(x.children ?? [], x.id); }); walk(m.tree); });
export const NODE = new Map(PERM_MODULES.flatMap((m) => flat(m.tree).map((x) => [x.id, x] as const)));
export const MODULE_OF = new Map(PERM_MODULES.flatMap((m) => flat(m.tree).map((x) => [x.id, m.key] as const)));

/* ══ F03f: how roles count (Juli, 2026-11-04) ═════════════════════════════════════════════════════════════════════
 * A role is given IN A WORKSPACE (technician form › Workspace Access row › Roles). Then:
 *   · its ticket tabs (Request, Problem, Change, Release, Knowledge, Task) and its Admin › Workspace tab count in THAT
 *     workspace (in every workspace if any of the person's roles has Global › Manage All Workspaces);
 *   · its Admin › Global tab and its Organization data tabs (Asset, Contract…) count in Organization settings — from
 *     whichever workspace the role was given in.
 * Super Admin = everything. */
const GLOBAL_NODES = flat(PERM_MODULES.find((m) => m.key === 'admin')!.tree);
const WS_NODES = flat(PERM_MODULES.find((m) => m.key === 'wsadmin')!.tree);
/** Group headings: never a permission on their own. */
const HEADINGS = new Set(['Manage Organization', 'Manage Users', 'Manage Workspace', 'Manage Automation']);
/** Ticket modules = records in each workspace; every other data tab = Organization records. */
export const MODULE_WHERE: Record<string, 'ws'> = { request: 'ws', problem: 'ws', change: 'ws', release: 'ws', knowledge: 'ws', task: 'ws' };
export const moduleWhere = (key: string): 'ws' | 'org' | 'admin' => (key === 'admin' || key === 'wsadmin' ? 'admin' : MODULE_WHERE[key] ?? 'org');
/** The tabs on the left of the role page (Admin holds two sub-tabs: Global and Workspace). */
export const ROLE_TABS = PERM_MODULES.filter((m) => m.key !== 'wsadmin');
const withParents = (ids: string[]) => { const s = new Set(ids); ids.forEach((id) => { let p = PARENT.get(id); while (p) { s.add(p); p = PARENT.get(p); } }); return [...s]; };

// ── roles ────────────────────────────────────────────────────────────────────────────────────────
export interface Role { id: number; name: string; desc: string; kind: 'predefined' | 'custom'; isNew?: boolean; locked?: string; enabled: boolean; grants: string[] }

const mods = (...keys: string[]) => keys.flatMap(idsOf);
const adminSub = (label: string) => { const x = GLOBAL_NODES.find((n) => n.label === label)!; return withParents([x.id, ...flat(x.children ?? []).map((c) => c.id)]); };
const LOCK = 'Built-in role: read only. Clone it to make your own version.';
const pre = (r: Omit<Role, 'kind' | 'enabled' | 'locked'>): Role => ({ ...r, kind: 'predefined', enabled: true, locked: LOCK });

/** The 17 predefined roles of ServiceOps (names and descriptions as on 172.16.15.185), the two ESM built-in roles,
 *  and custom roles. */
export const SEED_ROLES: Role[] = [
  pre({ id: 1, name: 'Super Admin', desc: 'This role grants full access to the entire service desk.', grants: PERM_MODULES.flatMap((m) => idsOf(m.key)) }),
  pre({ id: 20, name: 'Organization Admin', isNew: true, desc: 'All of Admin › Global (incl. Manage All Workspaces) and all of Admin › Workspace: Organization settings and every workspace’s record, team and settings. No ticket work — add a technician role for that.', grants: [...idsOf('admin'), ...idsOf('wsadmin')] }),
  pre({ id: 21, name: 'Workspace Admin', isNew: true, desc: 'All of Admin › Workspace: the record, status, team, roles and every setting of the workspace where it is given. Nothing in Organization settings.', grants: idsOf('wsadmin') }),
  pre({ id: 2, name: 'Service Desk Technician', desc: 'This role grants full access to Request, Problem, Change, Release, Asset, CMDB modules.', grants: mods('request', 'problem', 'change', 'release', 'asset', 'cmdb') }),
  pre({ id: 3, name: 'Os Deployment Manager', desc: 'This role grants full access to Os Deployment module.', grants: adminSub('Manage Os Deployment') }),
  pre({ id: 4, name: 'Request Specialist Technician', desc: 'This role grants full access to Request module.', grants: mods('request') }),
  pre({ id: 5, name: 'Problem Specialist Technician', desc: 'This role grants full access to Problem module.', grants: mods('problem') }),
  pre({ id: 6, name: 'Change Specialist Technician', desc: 'This role grants full access to Change module.', grants: mods('change') }),
  pre({ id: 7, name: 'Release Specialist Technician', desc: 'This role grants full access to Release module.', grants: mods('release') }),
  pre({ id: 8, name: 'Asset Specialist Technician', desc: 'This role grants full access to Asset module.', grants: mods('asset') }),
  pre({ id: 9, name: 'Contract Manager', desc: 'This role grants full access to Contract module.', grants: mods('contract') }),
  pre({ id: 10, name: 'Purchase Manager', desc: 'This role grants full access to Purchase module.', grants: mods('purchase') }),
  pre({ id: 11, name: 'Project Manager', desc: 'This role grants full access to Project module.', grants: mods('project') }),
  pre({ id: 12, name: 'Patch Manager', desc: 'This role grants full access to Patch and Deployment module.', grants: mods('patch', 'deployment') }),
  pre({ id: 13, name: 'Dashboard Viewer', desc: 'This role grants view access to Dashboard module.', grants: topView('dashboard') }),
  pre({ id: 14, name: 'Report Viewer', desc: 'This role grants view access to Report module.', grants: PERM_MODULES.find((m) => m.key === 'report')!.tree.map((x) => x.id) }),
  pre({ id: 15, name: 'CMDB Specialist Technician', desc: 'This role grants access to CMDB module.', grants: mods('cmdb') }),
  pre({ id: 16, name: 'Vulnerability Manager', desc: 'This role grants access to Vulnerability Technician module.', grants: mods('vulnerability') }),
  pre({ id: 17, name: 'Vulnerability Specialist Technician', desc: 'This role grants access to Vulnerability Technician module.', grants: topView('vulnerability') }),
  /* Custom = the customer's own data; Documentation Viewer exists on the live server. */
  { id: 18, name: 'Documentation Viewer', desc: 'Read only role assigned to the technical writers and documentation team members for viewing and referencing service records.', kind: 'custom', enabled: true, grants: [...topView('request'), ...topView('problem'), ...topView('change')] },
];

// v7: F03f — Admin split into Global + Workspace tabs; roles given per workspace.
// v8: F18 — Manage ESM Portal › Publish ESM Portal added under Manage Support Channels (node ids shift).
// v9: F18b — the ESM Portal page is retired, so Manage/Publish ESM Portal are removed (node ids shift back).
const KEY = 'serviceops.esm.roles.v9';
export function loadRoles(): Role[] {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as Role[]; } catch { /* storage unavailable */ }
  return SEED_ROLES;
}
export function saveRoles(r: Role[]) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* storage unavailable */ } }
export const technicianRoles = (): Role[] => loadRoles().filter((r) => r.enabled);

/* ── the check ─────────────────────────────────────────────────────────────────────────────────────────────────── */
/** A person's roles, workspace by workspace (from Workspace Access). */
export type RoleMap = Record<number, string[]>;
const held = (names: string[]) => loadRoles().filter((r) => r.enabled && names.includes(r.name));
const allNames = (m: RoleMap) => [...new Set(Object.values(m).flat())];
const labels = (rs: Role[], mod: string) => new Set(rs.flatMap((r) => r.grants).map((id) => NODE.get(id)).filter((x): x is PermNode => !!x && MODULE_OF.get(x.id) === mod && !HEADINGS.has(x.label)).map((x) => x.label));
export const isSuperAdmin = (m: RoleMap) => held(allNames(m)).some((r) => r.name === 'Super Admin');
/** Admin › Global tick box, from any of the person's roles. */
export const canGlobal = (m: RoleMap, label: string) => isSuperAdmin(m) || labels(held(allNames(m)), 'admin').has(label);
/** Admin › Workspace tick box in workspace `wsId`: from roles given there, or from any role when Manage All Workspaces. */
export function canWorkspace(m: RoleMap, wsId: number, label: string) {
  if (isSuperAdmin(m)) return true;
  if (labels(held(m[wsId] ?? []), 'wsadmin').has(label)) return true;
  return canGlobal(m, 'Manage All Workspaces') && labels(held(allNames(m)), 'wsadmin').has(label);
}
/** Sees Organization settings at all. */
export const hasGlobalAccess = (m: RoleMap) => isSuperAdmin(m) || labels(held(allNames(m)), 'admin').size > 0;
export const globalLabels = (m: RoleMap) => (isSuperAdmin(m) ? GLOBAL_NODES.map((x) => x.label).filter((l) => !HEADINGS.has(l)) : [...labels(held(allNames(m)), 'admin')]);
export const workspaceLabels = (m: RoleMap, wsId: number) => [...new Set(WS_NODES.map((x) => x.label))].filter((l) => !HEADINGS.has(l) && canWorkspace(m, wsId, l));
/** Ticket modules with at least one tick box, in one workspace. */
export function ticketModulesIn(m: RoleMap, wsId: number) {
  const ids = new Set(held(m[wsId] ?? []).flatMap((r) => r.grants));
  return PERM_MODULES.filter((x) => MODULE_WHERE[x.key] && flat(x.tree).some((n) => ids.has(n.id))).map((x) => x.label);
}
/** No escalation: to give `role` in `wsId`, the giver must already have, there, every Workspace and ticket tick box in
 *  it, and every Global tick box in it (a role given anywhere also gives its Global part). */
export function withinOwn(role: Role, giver: RoleMap, wsId: number) {
  if (isSuperAdmin(giver)) return true;
  if (role.name === 'Super Admin') return false;
  const r = [role];
  const mine = new Set(held(giver[wsId] ?? []).flatMap((x) => x.grants));
  const everywhere = new Set(held(allNames(giver)).flatMap((x) => x.grants));
  const dataMod = (id: string) => { const k = MODULE_OF.get(id) ?? ''; return k !== 'admin' && k !== 'wsadmin' && !MODULE_WHERE[k]; };
  return [...labels(r, 'wsadmin')].every((l) => canWorkspace(giver, wsId, l))
    && [...labels(r, 'admin')].every((l) => canGlobal(giver, l))
    && role.grants.filter((id) => MODULE_WHERE[MODULE_OF.get(id) ?? '']).every((id) => mine.has(id))
    // Organization data (Asset, Contract…) counts organization-wide, so the giver must hold it in some role.
    && role.grants.filter(dataMod).every((id) => everywhere.has(id));
}
/** What a role gives, for the role page and lists. */
export function roleSummary(role: Role) {
  const r = [role];
  return {
    global: labels(r, 'admin').size,
    workspace: labels(r, 'wsadmin').size,
    ticket: PERM_MODULES.filter((m) => MODULE_WHERE[m.key] && flat(m.tree).some((x) => role.grants.includes(x.id))).map((m) => m.label),
    orgData: PERM_MODULES.filter((m) => !MODULE_WHERE[m.key] && m.key !== 'admin' && m.key !== 'wsadmin' && flat(m.tree).some((x) => role.grants.includes(x.id))).map((m) => m.label),
  };
}

/* ══ Admin page → tick box (one map; Organization pages check the Global tab, workspace pages the Workspace tab) ══ */
const SECTION_PERM: Record<string, string> = {
  'Support Channels': 'Manage Support Channels', 'Request Management': 'Manage Request Management', 'Service Catalog': 'Manage Service Catalog',
  'Problem Management': 'Manage Problem Management', 'Change Management': 'Manage Change Management', 'Release Management': 'Manage Release Management',
  'Knowledge Management': 'Manage Knowledge Custom Rules', 'User Survey': 'Manage User Survey', 'Task Management': 'Manage Task Management',
  'Asset Management': 'Manage Asset Management', 'Supplier Management': 'Manage Supplier Management', 'BOM Management': 'Manage CMDB', CMDB: 'Manage CMDB',
  'Discovery And Agents': 'Manage Discovery', 'Contract Management': 'Manage Contract', 'Purchase Management': 'Manage Purchase Management',
  'Vulnerability Management': 'Manage Vulnerability Management', 'Patch Management': 'Manage Patch Management', 'OS Deployment': 'Manage Os Deployment',
  'Project Management': 'Manage Project Management', AI: 'Manage AI',
};
const CARD_PERM: Record<string, string> = {
  'Automation/Workflow': 'Manage Workflow', 'Automation/SLA': 'Manage SLA', 'Automation/Approval Workflow': 'Manage Approval Workflow',
  'Automation/Event Notifications': 'Manage Event Notifications', 'Automation/Auto Assignment': 'Manage Auto Assignment', 'Automation/Scenario': 'Manage Scenario',
  'Automation/Incident Schedules': 'Manage Incident Schedules', 'Automation/Task Schedule': 'Manage Task Schedule', 'Automation/Integrations': 'Manage Integrations',
  'Automation/Custom Script': 'Manage Custom Script',
  'Users/Technicians': 'View Users', 'Users/Requesters': 'View Users', 'Users/User Form': 'Manage User Custom Fields', 'Users/Technician Groups': 'Manage User Groups',
  'Users/Requester Groups': 'Manage User Groups', 'Users/Roles': 'Manage Roles', 'Users/LDAP Configurations': 'Manage LDAP Configuration',
  'Users/SSO Configuration': 'Manage SSO Configuration', 'Users/Custom SSO Configuration': 'Manage SSO Configuration', 'Users/SCIM Provisioning': 'Manage SCIM Provisioning',
  'Users/Custom Scope Configuration': 'Manage Custom Scope Configuration',
  'Organization/Workspaces': 'Create Workspace', 'Organization/Account': 'Manage Account', 'Organization/Branding': 'Manage Branding',
  'Organization/Departments': 'Manage Departments', 'Organization/Locations': 'Manage Locations', 'Organization/Business Hours': 'Manage Business Hour',
  'Organization/Announcements': 'Manage Announcements', 'Organization/Business Service': 'Manage Business Service', 'Organization/Leave Management': 'Manage Leave Management',
  'Organization/System Preference': 'Manage System Preference', 'Organization/Security': 'Manage Security', 'Organization/Priority': 'Manage Priority',
  'Organization/Impact': 'Manage Impact', 'Organization/Urgency': 'Manage Urgency', 'Organization/Application Maintenance': 'Manage Application Maintenance',
  'Organization/Proxy Server Configuration': 'Manage Proxy Server Configuration', 'Organization/Managed Services Provider': 'Managed Services Providers',
  'Organization/Privacy Settings': 'Manage Privacy Settings', 'Organization/Digital Signature': 'Digital Signature',
  'AI/Governance': 'Manage AI Governance', 'AI/AI Studio': 'Manage AI Studio', 'AI/Text Intelligence': 'Manage Text Intelligence', 'AI/Knowledge Collections': 'View Knowledge Collections',
  'Discovery And Agents/Agent': 'Manage Agents', 'Discovery And Agents/Endpoint Management': 'Manage Endpoints',
  'Patch Management/Deployment Management': 'Manage Deployment Management',
  'Supplier Management/Warranty Sync': 'Manage Warranty Sync', 'Supplier Management/EOSL Sync Setting': 'Manage EOSL Sync Setting',
};
/** The tick box that opens an admin card (same label in the Global and Workspace tabs where both exist). */
export const permissionFor = (section: string, card?: string): string | undefined => (card && CARD_PERM[`${section}/${card}`]) || SECTION_PERM[section];
