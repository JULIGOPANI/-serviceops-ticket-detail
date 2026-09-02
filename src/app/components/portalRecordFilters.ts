/* Support Portal — the Record List's filter, as data.
 *
 * Two things a technician's list page gives you, and the widget panel now gives too:
 *
 *   1. PRESET filters — the named, out-of-the-box queries ("All Open Requests", "My Overdue
 *      Requests"). One click, no thinking. This is what an admin wants nearly every time.
 *   2. A CUSTOM condition builder — field → operator → value, several conditions ANDed, for the
 *      time the named list has nothing close enough.
 *
 * ⚠️ The panel is 340–600px wide and the technician toolbar those screens come from is the width of
 * the page. The adaptation is the LAYOUT, never the content: same presets, same fields, same
 * operators, same five value editors. What changes is that conditions STACK instead of running
 * across as chips — a panel has vertical room and no horizontal room, so a row per condition reads
 * better there than a chip row that wraps three times.
 *
 * ⚠️ Presets and fields are PER MODULE. "All Open Requests" is meaningless on a Change and "Go-live
 * date" is meaningless on a Request, so a module carries its own of both and switching module drops
 * a filter that no longer means anything (see the `consequence` on the Module field). */

export type FilterKind = 'text' | 'choice' | 'person' | 'date' | 'tags' | 'number';

export interface FilterField {
  key: string;
  label: string;
  kind: FilterKind;
  /** `choice` only — the values on offer. */
  options?: string[];
}

export interface Condition {
  /** A `FilterField.key`. */
  field: string;
  op: string;
  /** One entry for text and date; many for the multi-select kinds. */
  values: string[];
}

export interface PresetFilter {
  id: string;
  name: string;
  conditions: Condition[];
  /* The half of a preset that is about WHO is asking rather than about the record — "Assigned to
     me", "In my technician group". It cannot be a Condition: no field on the record holds it, and
     it resolves against the signed-in requester at request time.
     ⚠️ It still has to be SAID. Without it the hover card for "My Overdue Requests" and one for an
     everybody's-overdue filter would list the identical condition and read as the same filter —
     the entire difference between them lives in this string. */
  scope?: string;
}

/** What the widget stores. `preset` wins when set; `conditions` is the custom filter. */
/* ── AND / OR ────────────────────────────────────────────────────────────────
 *
 * A GROUP of conditions, ANDed together. Groups are ORed with each other.
 *
 * ⚠️ Groups rather than a join dropdown between every row. "A AND B OR C" has no meaning until
 * somebody states a precedence, and a builder that renders it as a flat list is quietly picking one
 * for you — usually left-to-right, which is not how most people read it. A group says where the
 * bracket is by drawing it.
 * ⚠️ This is the shape `AdminBomTargeting` already uses for CI targeting ("rows AND within a group,
 * groups OR'd"). Two condition builders in one product meaning different things by the same two
 * words is a worse outcome than either shape on its own. */
export interface ConditionGroup {
  rows: Condition[];
}

/* ── The filter TREE ─────────────────────────────────────────────────────────
 *
 * A node is a CONDITION or a GROUP, and a group carries ONE join for all of its children.
 *
 * ⚠️ One join per group, not one per row. A row-by-row And/Or list has no defined meaning — "A and
 * B or C" needs a precedence nobody states — so the join belongs to the bracket rather than to the
 * gap between two rows. It is set once, on the group's second row, and every row after it reads
 * the same word: what you see down the left edge is what will actually be evaluated.
 * ⚠️ Precedence comes from NESTING, which is the only unambiguous way to express it. A group inside
 * a group is a bracket you can see, so "A and B and (C or D) and E" is a shape on the screen rather
 * than a rule to remember.
 * ⚠️ This REPLACES the earlier flat `groups` (AND inside, OR between), which could say exactly one
 * of those shapes. That value is still read — see `activeTree` — so nothing built before this needs
 * migrating. */
export type FilterJoin = 'and' | 'or';

export interface CondNode extends Condition { kind: 'cond' }
export interface GroupNode { kind: 'group'; join: FilterJoin; children: FilterNode[] }
export type FilterNode = CondNode | GroupNode;

export const isGroup = (n: FilterNode): n is GroupNode => n.kind === 'group';
export const condNode = (c: Condition): CondNode => ({ kind: 'cond', ...c });
export const emptyGroup = (join: FilterJoin = 'and'): GroupNode => ({ kind: 'group', join, children: [] });

export interface RecordFilter {
  preset?: string;
  /** The condition tree — what the builder writes. */
  tree?: GroupNode;
  /* ⚠️ LEGACY, still read. A filter stored before groups existed is a flat ANDed list, which is
     exactly one group — so nothing has to be migrated and an untouched Record List keeps filtering
     the way it did. Only the builder writes `groups`. */
  conditions?: Condition[];
  groups?: ConditionGroup[];
}

/* ── operators ──────────────────────────────────────────────────────────────
 *
 * ⚠️ Operators belong to the KIND, not to the field. Every text field offers Contains, every
 * multi-select offers In / Not In. Declaring them per field is thirty chances for two fields of the
 * same kind to end up offering different words for the same comparison. */
export const OPERATORS: Record<FilterKind, string[]> = {
  text: ['Contains', 'Does not contain', 'Equals', 'Starts with'],
  choice: ['In', 'Not In'],
  person: ['In', 'Not In'],
  date: ['Equals'],
  tags: ['Match Any', 'Match All'],
  /* Only Knowledge has one (a view count). Comparisons, not membership: "more than 500 views" is
     the question anyone actually asks of a number. */
  number: ['Greater than', 'Less than', 'Equals'],
};

export const DATE_PRESETS = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'This Month', 'Custom'];

/* ── people ─────────────────────────────────────────────────────────────────
 *
 * ⚠️ `Unassigned` is first and is not a person — it is the state of having no person, which is what
 * "Unassigned Requests in My Group" filters on, so it has to be selectable like any other value. */
export const UNASSIGNED = 'Unassigned';

export const PEOPLE: { name: string; email: string }[] = [
  { name: 'Kavit Gohel', email: 'kavit.gohel@motadata.com' },
  { name: 'Vaibhav Prajapati', email: 'vaibhav.prajapati@motadata.com' },
  { name: 'Udit Hotchandani', email: 'udit.hotchandani@motadata.com' },
  { name: 'Naitik Piparia', email: 'naitik.piparia@motadata.com' },
  { name: 'Abhishek Tiwari', email: 'abhishek.tiwari@motadata.com' },
  { name: 'Sandeep Kaur', email: 'sandeep.kaur@motadata.com' },
  { name: 'Sania Ansari', email: 'sania.ansari@motadata.com' },
  { name: 'Meera Nair', email: 'meera.nair@motadata.com' },
  { name: 'Rahul Deshpande', email: 'rahul.deshpande@motadata.com' },
  { name: 'Priya Menon', email: 'priya.menon@motadata.com' },
];

const AVATAR_BG = ['#3D8BD0', '#0EA5A5', '#F58518', '#8B5CF6', '#DC2626', '#059669', '#D97706'];

/** Deterministic, so a person is the same colour every time the list is drawn. */
export function personAvatar(name: string): { initials: string; bg: string } {
  if (name === UNASSIGNED) return { initials: '', bg: '#94A3B8' };
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return { initials, bg: AVATAR_BG[h % AVATAR_BG.length] };
}

export const TAG_SUGGESTIONS = ['vip', 'onboarding', 'hardware', 'network', 'security', 'audited-2026', 'escalated'];

/* ── the field catalogue ────────────────────────────────────────────────────
 *
 * ⚠️ EVERY list here is already the signed-in requester's own records — see SCOPE below. That is
 * the rule that decides most of what is missing, because a field that can only hold one value for
 * this reader is not a filter:
 *   · Requester, User, Approver — all of them mean "you" on a portal. A dropdown whose every choice
 *     returns the same rows is a control that cannot be used wrongly OR usefully.
 *   · ID, Subject, Title, Name — these identify ONE record. A card filtered to a single ID is not a
 *     list, it is a hardcoded row, and it stops being true the moment that record closes.
 *   · Created By / Last Updated By — on your own records the first is you and the second is whoever
 *     on the service desk touched it last, which changes under the reader without them acting.
 *   · Subcategory and Tags — triage vocabulary. Tags especially are how technicians mark records for
 *     each other, so a requester filtering on them is reading someone else's shorthand.
 * What is left is what an admin would actually build a card around: the state of the work, how
 * urgent it is, what it is about, where it sits, and when it happened.
 *
 * ⚠️ Custom form fields are deliberately NOT here. The product builds its portal column list from
 *    fields flagged `useOnPortal`, so a tenant with sixty custom fields would get a sixty-item
 *    dropdown that looks different on every install. Worth adding later, as its own decision. */

const PRIORITY = ['Urgent', 'High', 'Medium', 'Low'];
const DEPARTMENTS = ['IT', 'Finance', 'HR', 'Sales', 'Operations', 'Support'];
const LOCATIONS = ['Ahmedabad', 'Pune', 'Bengaluru', 'Mumbai', 'Remote'];
const COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella'];
const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'Other'];

/* ⚠️ MSP only. In a single-company install every record answers "Acme Corp", so the control cannot
   change the result — the same dead-control test the Requester field fails above. Flip this with
   the deployment mode; one constant, so the field cannot half-appear. */
export const MSP_ENABLED = false;

const company = (): FilterField[] =>
  (MSP_ENABLED ? [{ key: 'company', label: 'Company', kind: 'choice' as const, options: COMPANIES }] : []);

/* Where a requester sits — the same question on every module that has it. */
const orgFields = (): FilterField[] => [
  { key: 'department', label: 'Department', kind: 'choice', options: DEPARTMENTS },
  { key: 'location', label: 'Location', kind: 'choice', options: LOCATIONS },
  ...company(),
];

export const FILTER_FIELDS: Record<string, FilterField[]> = {
  request: [
    { key: 'type', label: 'Request Type', kind: 'choice', options: ['Service Request', 'Incident'] },
    { key: 'status', label: 'Status', kind: 'choice' },

    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'urgency', label: 'Urgency', kind: 'choice', options: ['Urgent', 'High', 'Medium', 'Low'] },
    { key: 'impact', label: 'Impact', kind: 'choice', options: ['On Multiple Users', 'On Business', 'On User'] },
    { key: 'category', label: 'Category', kind: 'choice', options: CATEGORIES },

    /* ⚠️ Technician STAYS where Requester goes, and the difference is not arbitrary: the requester
       on your own request is always you, but the technician is whoever the desk assigned — a real
       variable, and the product ships it as a portal column on Changes. */
    { key: 'assignee', label: 'Technician', kind: 'person' },
    { key: 'technicianGroup', label: 'Technician Group', kind: 'choice', options: ['Service Desk', 'Network', 'End User Computing', 'Application Support'] },

    ...orgFields(),
    { key: 'vendor', label: 'Vendor', kind: 'choice', options: ['Dell', 'HP', 'Lenovo', 'Microsoft', 'Cisco'] },

    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'dueBy', label: 'Due By', kind: 'date' },
    { key: 'resolvedAt', label: 'Resolved Date', kind: 'date' },
    { key: 'closedAt', label: 'Closed Date', kind: 'date' },
  ],
  change: [
    { key: 'changeType', label: 'Change Type', kind: 'choice', options: ['Standard', 'Normal', 'Emergency'] },

    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'risk', label: 'Risk', kind: 'choice', options: ['High', 'Medium', 'Low'] },

    { key: 'assignee', label: 'Technician', kind: 'person' },
    { key: 'technicianGroup', label: 'Technician Group', kind: 'choice', options: ['Service Desk', 'Network', 'End User Computing', 'Application Support'] },

    ...orgFields(),

    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'plannedStart', label: 'Planned Start Date', kind: 'date' },
    { key: 'plannedEnd', label: 'Planned End Date', kind: 'date' },
    { key: 'actualStart', label: 'Actual Start Date', kind: 'date' },
    { key: 'actualEnd', label: 'Actual End Date', kind: 'date' },
  ],
  asset: [
    { key: 'assetType', label: 'Asset Type', kind: 'choice', options: ['Laptop', 'Desktop', 'Mobile', 'Monitor', 'Headset', 'Printer'] },
    { key: 'product', label: 'Product', kind: 'choice', options: ['Latitude 5440', 'UltraSharp U2723QE', 'MX Master 3S', 'Evolve2 65', 'iPhone 14'] },

    { key: 'status', label: 'Asset Status', kind: 'choice' },

    ...orgFields(),

    { key: 'acquisitionDate', label: 'Acquisition Date', kind: 'date' },
    { key: 'warrantyExpiry', label: 'Warranty Expiry', kind: 'date' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },

    /* ⚠️ Manufacturer and Model describe a CLASS of kit, not one asset — "every Dell laptop" is a
       list, where "asset AST-3" is a single row. That is the line that keeps them and drops the ID. */
    { key: 'manufacturer', label: 'Manufacturer', kind: 'choice', options: ['Dell', 'HP', 'Lenovo', 'Apple', 'Logitech', 'Jabra'] },
    { key: 'model', label: 'Model', kind: 'text' },
  ],
  ci: [
    { key: 'ciType', label: 'CI Type', kind: 'choice', options: ['Server', 'Application', 'Switch', 'Windows Laptop', 'Mac Laptop', 'Mobile Device'] },
    { key: 'ciClass', label: 'CI Class', kind: 'choice', options: ['Hardware', 'Software', 'Network', 'Business Service'] },

    { key: 'status', label: 'Status', kind: 'choice' },

    ...orgFields(),

    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
  ],
  approval: [
    { key: 'status', label: 'Approval Status', kind: 'choice' },
    { key: 'approvalType', label: 'Approval Type', kind: 'choice', options: ['Everyone', 'Anyone', 'Sequential'] },

    /* ⚠️ The field that matters most on this module: one approvals queue mixes record types, so
       without it a card cannot say "purchase approvals only". */
    { key: 'module', label: 'Module', kind: 'choice', options: ['Request', 'Change', 'Purchase', 'Contract'] },
    { key: 'type', label: 'Request Type', kind: 'choice', options: ['Service Request', 'Incident'] },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },

    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'approvalDate', label: 'Approval Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
  ],
  knowledge: [
    { key: 'category', label: 'Category', kind: 'choice', options: ['Guideline Documents', 'FAQs', 'How-to', 'Troubleshooting'] },
    { key: 'knowledgeType', label: 'Knowledge Type', kind: 'choice', options: ['Article', 'FAQ', 'Known Error', 'Solution'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'visibility', label: 'Visibility', kind: 'choice', options: ['Public', 'Logged-in Requesters', 'Internal'] },

    { key: 'publishedAt', label: 'Published Date', kind: 'date' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },

    { key: 'viewCount', label: 'View Count', kind: 'number' },
  ],
};

/* ── scope ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ THE filter that is always on, and the one an admin never sets. Every list this widget can draw
 * is the signed-in requester's own — the portal's APIs are scoped that way before any of the
 * conditions below are applied, and no preset here can widen it. It is stated rather than offered
 * because a control for something that cannot change is worse than no control: it implies an "all
 * requesters" setting exists somewhere, and someone will go looking for it.
 *
 * ⚠️ Knowledge is the exception, and has to be, because it is a published library rather than a
 * set of records anyone owns. Saying "your articles" would be a plain lie about what the card
 * shows, so the line changes with the module rather than being one sentence everywhere. */
export const scopeNote = (moduleKey: string): string =>
  (moduleKey === 'knowledge'
    ? 'Shows knowledge published to this portal. Requesters see only the articles their access allows.'
    : 'Always limited to the signed-in requester’s own records. Filters below narrow that further.');

/* ── presets ────────────────────────────────────────────────────────────────
 *
 * ⚠️ Named for what the READER sees, and every one of them sits inside the scope above. That is why
 * there is no "All Requests": on a portal there is no such thing, and offering it would promise a
 * view the backend never returns.
 * ⚠️ Wherever a preset CAN be expressed as a condition it is, rather than being a bare name with
 * nothing behind it — that is what makes choosing one visibly change the card on the canvas. */
const st = (op: string, ...values: string[]): Condition => ({ field: 'status', op, values });

/* Every portal list is the caller's own, so this sits on every preset rather than marking out a
   few of them. */
const MINE = 'The signed-in requester';

export const FILTER_PRESETS: Record<string, PresetFilter[]> = {
  request: [
    { id: 'all-mine', name: 'All My Requests', conditions: [], scope: MINE },
    { id: 'my-open', name: 'My Open Requests', conditions: [st('In', 'Open', 'In Progress', 'On Hold')], scope: MINE },
    { id: 'my-pending', name: 'My Pending Requests', conditions: [st('In', 'Pending')], scope: MINE },
    { id: 'my-resolved', name: 'My Resolved Requests', conditions: [st('In', 'Resolved')], scope: MINE },
    { id: 'my-closed', name: 'My Closed Requests', conditions: [st('In', 'Closed')], scope: MINE },
    /* Two conditions, and the second is the one that matters: a request already resolved cannot be
       late, so overdue without it would keep listing work nobody has to do. */
    { id: 'my-overdue', name: 'My Overdue Requests', conditions: [{ field: 'dueBy', op: 'Equals', values: ['Overdue'] }, st('Not In', 'Resolved', 'Closed')], scope: MINE },
    { id: 'my-high-priority', name: 'My High Priority Requests', conditions: [{ field: 'priority', op: 'In', values: ['Urgent', 'High'] }, st('Not In', 'Resolved', 'Closed')], scope: MINE },
  ],
  change: [
    { id: 'my-changes', name: 'My Changes', conditions: [], scope: MINE },
    { id: 'my-active', name: 'My Active Changes', conditions: [st('Not In', 'Implemented', 'Closed')], scope: MINE },
    { id: 'my-completed', name: 'My Completed Changes', conditions: [st('In', 'Implemented', 'Closed')], scope: MINE },
  ],
  asset: [
    { id: 'my-assets', name: 'My Assets', conditions: [], scope: MINE },
    { id: 'my-active', name: 'My Active Assets', conditions: [st('In', 'In Use')], scope: MINE },
  ],
  ci: [
    { id: 'my-cis', name: 'My CIs', conditions: [], scope: MINE },
    { id: 'my-active', name: 'My Active CIs', conditions: [st('In', 'Operational')], scope: MINE },
  ],
  approval: [
    { id: 'my-approvals', name: 'My Approvals', conditions: [], scope: MINE },
    { id: 'pending', name: 'Pending Approvals', conditions: [st('In', 'Pending')], scope: MINE },
    { id: 'completed', name: 'Completed Approvals', conditions: [st('In', 'Approved', 'Rejected')], scope: MINE },
  ],
  /* ⚠️ No scope on any of these. Knowledge is the one module a requester reads rather than owns, so
     "mine" would be a lie — these are the whole published library, ordered three ways. */
  knowledge: [
    { id: 'most-read', name: 'Most Read Knowledge', conditions: [st('In', 'Published')] },
    { id: 'recently-published', name: 'Recently Published', conditions: [st('In', 'Published'), { field: 'publishedAt', op: 'Equals', values: ['This Month'] }] },
    { id: 'recently-updated', name: 'Recently Updated', conditions: [st('In', 'Published'), { field: 'updatedAt', op: 'Equals', values: ['This Month'] }] },
  ],
};

/* ── lookups ────────────────────────────────────────────────────────────────
 *
 * ⚠️ Every one of these falls back rather than returning undefined. A module key that has no entry
 * is a bug in the catalogue, but a filter control that throws takes the whole builder down with it,
 * and an admin cannot tell the difference between "the panel crashed" and "the page is broken". */
export const fieldsFor = (moduleKey: string, statuses: string[]): FilterField[] =>
  (FILTER_FIELDS[moduleKey] ?? FILTER_FIELDS.request).map((f) =>
    (f.key === 'status' ? { ...f, options: statuses } : f));

export const presetsFor = (moduleKey: string): PresetFilter[] =>
  FILTER_PRESETS[moduleKey] ?? FILTER_PRESETS.request;

export const fieldByKey = (moduleKey: string, key: string, statuses: string[]) =>
  fieldsFor(moduleKey, statuses).find((f) => f.key === key);

export const presetById = (moduleKey: string, id?: string) =>
  (id ? presetsFor(moduleKey).find((p) => p.id === id) : undefined);

/** "Status Not In Closed" — the chip's words, built the same way everywhere it is shown. */
export function describeCondition(c: Condition, label: string): string {
  const v = c.values.length === 0
    ? '…'
    : c.values.length <= 2 ? c.values.join(', ') : `${c.values[0]} +${c.values.length - 1}`;
  return `${label} ${c.op} ${v}`;
}

/** The one line the panel shows when the field is closed. */
export function summarise(filter: RecordFilter | undefined, moduleKey: string): string {
  const p = presetById(moduleKey, filter?.preset);
  if (p) return p.name;
  const tree = activeTree(filter, moduleKey);
  const n = treeConditions(tree).length;
  if (n === 0) return 'No filter — every record';
  /* ⚠️ The nested groups are counted too, once there are any. "Custom · 4 conditions" reads as four
     things that must all be true, which is the opposite of what a bracket in the middle means. */
  const nested = tree.children.filter(isGroup).length;
  const conds = `${n} condition${n === 1 ? '' : 's'}`;
  return nested ? `Custom · ${conds} in ${nested + 1} groups` : `Custom · ${conds}`;
}

/** The tree in force, whichever of the FOUR shapes the filter is stored in.
 *
 * ⚠️ Every older shape is a tree too, so they are converted rather than special-cased downstream:
 * a preset's conditions and a legacy flat list are both one AND group, and the flat `groups` value
 * is an OR of AND groups. One reader means the renderer and the builder cannot disagree about what
 * an old filter meant. */
export const activeTree = (filter: RecordFilter | undefined, moduleKey: string): GroupNode => {
  const preset = presetById(moduleKey, filter?.preset);
  if (preset) return { kind: 'group', join: 'and', children: preset.conditions.map(condNode) };
  if (filter?.tree) return filter.tree;
  if (filter?.groups?.length) {
    const gs = filter.groups.filter((g) => g.rows.length > 0);
    if (gs.length === 1) return { kind: 'group', join: 'and', children: gs[0].rows.map(condNode) };
    return {
      kind: 'group',
      join: 'or',
      children: gs.map((g) => ({ kind: 'group', join: 'and', children: g.rows.map(condNode) } as GroupNode)),
    };
  }
  return { kind: 'group', join: 'and', children: (filter?.conditions ?? []).map(condNode) };
};

/** Every group in force, whichever of the three shapes the filter is stored in. */
export const activeGroups = (filter: RecordFilter | undefined, moduleKey: string): ConditionGroup[] => {
  const preset = presetById(moduleKey, filter?.preset);
  if (preset) return [{ rows: preset.conditions }];
  if (filter?.groups?.length) return filter.groups.filter((g) => g.rows.length > 0);
  /* The legacy flat list IS one group — see the note on `RecordFilter.conditions`. */
  return filter?.conditions?.length ? [{ rows: filter.conditions }] : [];
};

/** Every condition in force, flattened — for the chips under the closed field.
 *  ⚠️ Flattening LOSES the OR, so anything that has to be truthful about how the rows combine reads
 *  `activeGroups` instead. This is for the summary chips, which are already a lossy reading of the
 *  filter, and for callers that only ever knew about one group. */
export const activeConditions = (filter: RecordFilter | undefined, moduleKey: string): Condition[] =>
  treeConditions(activeTree(filter, moduleKey));

/* ── evaluating against the sample rows ─────────────────────────────────────
 *
 * ⚠️ The builder's rows are SAMPLES — id, title, status and a meta line, which is all the canvas
 * needs to show the shape of the card. So a condition on a field the sample rows carry (status, id,
 * subject) genuinely filters, and one on a field they do not (priority, assignee, a date) PASSES
 * rather than emptying the card. Evaluating an absent field as "no match" would black out the
 * preview the moment anybody picked a realistic filter, which teaches an admin their filter is
 * broken when it is the preview that is thin. The widget's note says so in as many words. */
/** Walks the tree. An empty group matches everything — "I have not narrowed this" and "I have
 *  narrowed it to nothing" are different intentions and only one of them should empty the card. */
export function matchesTree(
  row: { id: string; title: string; status: string },
  node: FilterNode,
): boolean {
  if (node.kind === 'cond') return matchesConditions(row, [node]);
  const live = node.children.filter((c) => (c.kind === 'group' ? c.children.length > 0 : true));
  if (!live.length) return true;
  return node.join === 'and'
    ? live.every((c) => matchesTree(row, c))
    : live.some((c) => matchesTree(row, c));
}

/** Every condition in the tree, flattened — for the chips under the closed field. */
export const treeConditions = (node: FilterNode): Condition[] =>
  node.kind === 'cond' ? [node] : node.children.flatMap(treeConditions);

/** OR across groups, AND within one. No groups matches everything. */
export function matchesGroups(
  row: { id: string; title: string; status: string },
  groups: ConditionGroup[],
): boolean {
  if (groups.length === 0) return true;
  return groups.some((g) => matchesConditions(row, g.rows));
}

export function matchesConditions(
  row: { id: string; title: string; status: string },
  conds: Condition[],
): boolean {
  return conds.every((c) => {
    if (c.values.length === 0) return true; // a half-written condition filters nothing
    const text = c.field === 'id' ? row.id
      : (c.field === 'subject' || c.field === 'name' || c.field === 'title') ? row.title
        : undefined;
    if (c.field === 'status') {
      const hit = c.values.includes(row.status);
      return c.op === 'Not In' ? !hit : hit;
    }
    if (text !== undefined) {
      const hay = text.toLowerCase();
      const needle = (c.values[0] ?? '').toLowerCase();
      if (!needle) return true;
      switch (c.op) {
        case 'Contains': return hay.includes(needle);
        case 'Does not contain': return !hay.includes(needle);
        case 'Equals': return hay === needle;
        case 'Starts with': return hay.startsWith(needle);
        default: return true;
      }
    }
    return true;
  });
}
