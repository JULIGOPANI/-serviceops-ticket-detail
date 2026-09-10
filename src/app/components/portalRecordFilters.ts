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
  /* ⚠️ False means the field still EXISTS — presets condition on it and the chips read its label —
     but the admin is not offered it in the picker. That split is the only way to drop a dead
     control without breaking the presets built on the same field: Knowledge Status is the case
     this was written for, where a requester can only ever see Published, so the control cannot
     change the result, yet every Knowledge preset says `Status In Published` and its chip has to
     keep rendering the word rather than the raw key. */
  pickable?: boolean;
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
  /* ⚠️ Requests is unchanged — you said this list was right, and everything in it appears in the
     portal's own search (ID, Approval Status, Vendor, Due By, Type, Tags, Location, Created Date,
     Last Updated Date, Request Template, Department, Service) or its column set. */
  request: [
    { key: 'type', label: 'Request Type', kind: 'choice', options: ['Service Request', 'Incident'] },
    { key: 'status', label: 'Status', kind: 'choice' },

    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'urgency', label: 'Urgency', kind: 'choice', options: ['Urgent', 'High', 'Medium', 'Low'] },
    { key: 'impact', label: 'Impact', kind: 'choice', options: ['On Multiple Users', 'On Business', 'On User'] },
    { key: 'category', label: 'Category', kind: 'choice', options: CATEGORIES },

    { key: 'assignee', label: 'Technician', kind: 'person' },
    { key: 'technicianGroup', label: 'Technician Group', kind: 'choice', options: ['Service Desk', 'Network', 'End User Computing', 'Application Support'] },

    ...orgFields(),
    { key: 'vendor', label: 'Vendor', kind: 'choice', options: ['Dell', 'HP', 'Lenovo', 'Microsoft', 'Cisco'] },

    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'overdue', label: 'Overdue', kind: 'choice', options: ['Yes', 'No'] },
    { key: 'resolvedAt', label: 'Resolved Date', kind: 'date' },
    { key: 'closedAt', label: 'Closed Date', kind: 'date' },
  ],
  /* ⚠️ This IS the portal's My Changes column set, minus Subject — Created Date, Assigned to,
     Status, Priority, Change Type, Change Risk, Approval Status. Read off the live page.
     ⚠️ Schedule Start / Schedule End are GONE even though the KPI builder offers them: the portal's
     change list does not carry them, and a filter on a date the requester's own screen never shows
     is a filter they cannot check the result of. Assigned to came BACK for the same reason — the
     portal ships it as a column, so removing it was me overriding the product. */
  change: [
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'changeType', label: 'Change Type', kind: 'choice', options: ['Standard', 'Normal', 'Emergency'] },
    { key: 'risk', label: 'Change Risk', kind: 'choice', options: ['High', 'Medium', 'Low'] },
    { key: 'approvalStatus', label: 'Approval Status', kind: 'choice', options: ['Pending', 'Approved', 'Rejected'] },
    { key: 'assignee', label: 'Assigned to', kind: 'person' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
  ],
  /* ⚠️ The portal's My Assets columns are Name, Asset Type, Status, Host Name, IP Address,
     Barcode / QR Code, Created Date. Host name and IP are machine facts a requester does not filter
     on, and Barcode is a switch, so what is left is these three plus the one asset date the KPI
     builder recognises. Product, Model, Manufacturer and Acquisition Date appear NOWHERE on the
     requester's own asset screen. */
  asset: [
    { key: 'assetType', label: 'Asset Type', kind: 'choice', options: ['Laptop', 'Desktop', 'Mobile', 'Monitor', 'Headset', 'Printer'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'warrantyExpiry', label: 'Warranty Expiration Date', kind: 'date' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
  ],
  /* Portal My CIs columns: ID, Name, CI Type, Status, Host Name, IP Address, Created Date. */
  ci: [
    { key: 'ciType', label: 'CI Type', kind: 'choice', options: ['Server', 'Application', 'Switch', 'Windows Laptop', 'Mac Laptop', 'Mobile Device'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
  ],
  /* Portal My Approvals columns: Name, Type, Requested By, Subject, Status, Created Date.
     ⚠️ "Type" is the product's word for which module the approval belongs to — the previous list
     called the same thing "Module", which is our word, not theirs. */
  approval: [
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'module', label: 'Type', kind: 'choice', options: ['Request', 'Change', 'Purchase', 'Contract'] },
    { key: 'requestedBy', label: 'Requested By', kind: 'person' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
  ],
  /* ⚠️ Straight from the portal's My Tasks search field list — ID, Reference, Subject, Status,
     Priority, Start Date, End Date, Task Type, Attachment, Assignee, User Group. These five are the
     ones that describe the WORK rather than the row or the person. */
  task: [
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'taskType', label: 'Task Type', kind: 'choice', options: ['Implementation', 'Milestone'] },
    { key: 'startDate', label: 'Start Date', kind: 'date' },
    { key: 'endDate', label: 'End Date', kind: 'date' },
  ],
  /* Portal Projects columns: Name, Status, Priority, Owner, Project Start Date, Project End Date,
     Due By, Tasks, Milestones, Completion (%). Owner is an identity, Tasks/Milestones/Completion
     are progress readouts rather than things you filter by, and Project End Date and Due By are the
     same question twice — the product's own list header calls the one that matters "Due By". */
  project: [
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'startDate', label: 'Project Start Date', kind: 'date' },
    { key: 'dueBy', label: 'Due By', kind: 'date' },
  ],
  /* ⚠️ The portal's Knowledge list carries only ID, Subject and Created Date, and no status at all.
     Category survives because the portal SHOWS it — the home page tags every article
     ("Guideline Documents", "FAQs") — and it is the one axis a reader browses by. Knowledge Type,
     Visibility, Published Date and View Count were all mine; none appears on a requester's screen. */
  knowledge: [
    { key: 'category', label: 'Category', kind: 'choice', options: ['Guideline Documents', 'FAQs'] },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
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
export const scopeNote = (moduleKey: string): string => {
  /* ⚠️ Knowledge is a published library rather than records anyone owns, so "your articles" would
     be a plain lie about what the card shows. */
  if (moduleKey === 'knowledge') {
    return 'Shows knowledge published to this portal. Requesters see only the articles their access allows.';
  }
  /* ⚠️ Tasks and Projects reach a requester through MEMBERSHIP, not ownership — the product scopes
     its portal task list to tasks assigned to or raised by the caller, and its requester project
     list to projects they are on. Saying "your own records" would promise a narrower list than the
     card actually draws. */
  if (moduleKey === 'task') {
    return 'Always limited to tasks assigned to, or raised by, the signed-in requester.';
  }
  if (moduleKey === 'project') {
    return 'Always limited to projects the signed-in requester is part of.';
  }
  return 'Always limited to the signed-in requester’s own records. Filters below narrow that further.';
};

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
  /* ⚠️ Read off the portal's own filter dropdown, names included. There is no "My Overdue" and no
     "My High Priority" — those were mine, and a preset the product does not ship is a preset whose
     "View all" lands somewhere that cannot reproduce it. */
  request: [
    { id: 'all', name: 'All Requests', conditions: [], scope: MINE },
    { id: 'open-inprogress', name: 'All Open and In Progress Requests', conditions: [st('In', 'Open', 'In Progress')], scope: MINE },
    { id: 'pending', name: 'All Pending Requests', conditions: [st('In', 'Pending')], scope: MINE },
    { id: 'resolved-closed', name: 'All Resolved and Closed Requests', conditions: [st('In', 'Resolved', 'Closed')], scope: MINE },
  ],
  /* ⚠️ ONE preset, and that is the finding rather than an omission: the portal's My Changes page
     has no filter control at all. Every status-based Change preset that used to sit here was
     invented, and one of them filtered on a status this product does not have. */
  change: [
    { id: 'all', name: 'My Changes', conditions: [], scope: MINE },
  ],
  asset: [
    { id: 'all', name: 'My Assets', conditions: [], scope: MINE },
    { id: 'in-use', name: 'Assets In Use', conditions: [st('In', 'In Use')], scope: MINE },
  ],
  ci: [
    { id: 'all', name: 'My CIs', conditions: [], scope: MINE },
    { id: 'operational', name: 'Operational CIs', conditions: [st('In', 'Operational')], scope: MINE },
  ],
  /* The portal's My Approvals TABS are its statuses, so each tab is a preset and every value here
     came off that strip. */
  approval: [
    { id: 'pending', name: 'Pending', conditions: [st('In', 'Pending')], scope: MINE },
    { id: 'approved', name: 'Approved', conditions: [st('In', 'Approved')], scope: MINE },
    { id: 'rejected', name: 'Rejected', conditions: [st('In', 'Rejected')], scope: MINE },
    { id: 'ignored', name: 'Ignored', conditions: [st('In', 'Ignored')], scope: MINE },
    { id: 'referred-back', name: 'Referred Back', conditions: [st('In', 'Referred Back')], scope: MINE },
    { id: 'all', name: 'All My Approvals', conditions: [], scope: MINE },
  ],
  /* ⚠️ The portal's My Tasks dropdown, verbatim — including "Task Reported By Me", which is the
     product's own filter on that page and not something invented here. */
  task: [
    { id: 'all-open', name: 'All Open Tasks', conditions: [st('In', 'Open')], scope: MINE },
    { id: 'reported-by-me', name: 'Task Reported By Me', conditions: [], scope: 'Raised by the signed-in requester' },
    { id: 'my-tasks', name: 'My Tasks', conditions: [], scope: 'Assigned to the signed-in requester' },
    { id: 'all', name: 'All Tasks', conditions: [], scope: MINE },
  ],
  /* The portal's Projects dropdown, verbatim. ⚠️ Only the date one carries a condition: "open" and
     "completed" are project statuses this tenant has not exposed, and a condition on a value that
     may not exist is exactly the bug this pass is fixing. */
  project: [
    { id: 'all-open', name: 'All Open Projects', conditions: [], scope: MINE },
    { id: 'my-open', name: 'My Open Projects', conditions: [], scope: MINE },
    { id: 'due-this-month', name: 'Project Due in This Month', conditions: [{ field: 'dueBy', op: 'Equals', values: ['This Month'] }], scope: MINE },
    { id: 'completed', name: 'All Completed Projects', conditions: [], scope: MINE },
    { id: 'all', name: 'All Projects', conditions: [], scope: MINE },
  ],
  /* ⚠️ Names only. The portal's Knowledge list ships no filter control and no status column, so
     there is nothing here to condition on without inventing it. */
  knowledge: [
    { id: 'most-read', name: 'Most Read Knowledge', conditions: [] },
    { id: 'recent', name: 'Recently Added', conditions: [{ field: 'createdAt', op: 'Equals', values: ['This Month'] }] },
    { id: 'all', name: 'All Knowledge', conditions: [] },
  ],
};

/* ── self-audit ─────────────────────────────────────────────────────────────
 *
 * ⚠️ Nothing in this file fails when a preset names a field the module does not carry, or a VALUE
 * that field does not offer. `labelOf` falls back to the raw key, so the chip still renders; the
 * condition simply never matches and the card comes back empty for a reason nobody can see. That
 * is precisely how a Change preset shipped filtering on "Implemented" — a status ServiceOps does
 * not have — and survived review, a build and a deploy.
 *
 * ⚠️ Date fields are exempt on purpose: their values are PRESETS ("Overdue", "This Month") rather
 * than a fixed option list, so there is nothing to check them against here. */
export function auditPresets(statusesFor: (moduleKey: string) => string[]): string[] {
  const problems: string[] = [];
  Object.entries(FILTER_PRESETS).forEach(([mod, presets]) => {
    const statuses = statusesFor(mod);
    const fields = fieldsFor(mod, statuses);
    presets.forEach((preset) => {
      preset.conditions.forEach((c) => {
        const f = fields.find((x) => x.key === c.field);
        if (!f) {
          problems.push(`${mod} / ${preset.id}: no field "${c.field}"`);
          return;
        }
        const allowed = f.key === 'status' ? statuses : f.options;
        if (!allowed) return;
        c.values
          .filter((v) => !allowed.includes(v))
          .forEach((v) => problems.push(`${mod} / ${preset.id}: "${f.label}" has no value "${v}"`));
      });
    });
  });
  return problems;
}

/* ⚠️ RUN, not merely exported. An audit nobody calls is a comment. This fires once at module load
   in dev and prints every broken preset; the previous "Implemented" bug would have been three lines
   of console error the first time anyone opened the builder, instead of shipping. */
if (import.meta.env?.DEV) {
  /* Imported lazily so this file keeps its one-way dependency: supportPortalData does not import
     back, and a static import here would make the pair circular at module-init time. */
  import('./supportPortalData').then(({ RECORD_MODULES }) => {
    const statusesFor = (m: string) => RECORD_MODULES.find((x) => x.key === m)?.statuses ?? [];
    const problems = auditPresets(statusesFor);
    if (problems.length) {
      // eslint-disable-next-line no-console
      console.error('[portal] preset/field mismatches:\n  ' + problems.join('\n  '));
    }
  });
}

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

/** What the admin may CHOOSE — `fieldsFor` stays the full set, so labels always resolve. */
export const pickableFields = (moduleKey: string, statuses: string[]): FilterField[] =>
  fieldsFor(moduleKey, statuses).filter((f) => f.pickable !== false);

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
