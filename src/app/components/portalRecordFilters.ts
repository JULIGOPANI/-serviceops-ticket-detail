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

export type FilterKind = 'text' | 'choice' | 'person' | 'date' | 'tags';

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
}

/** What the widget stores. `preset` wins when set; `conditions` is the custom filter. */
export interface RecordFilter {
  preset?: string;
  conditions?: Condition[];
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
 * Requests carries the full set the product's own filter offers. The other modules carry the fields
 * that module genuinely has — a Change has a risk and a window, an Asset has neither. */

const PRIORITY = ['Urgent', 'High', 'Medium', 'Low'];
const COMMON_PEOPLE = (): FilterField[] => [
  { key: 'requester', label: 'Requester', kind: 'person' },
  { key: 'createdBy', label: 'Created By', kind: 'person' },
  { key: 'lastUpdatedBy', label: 'Last Updated By', kind: 'person' },
];

export const FILTER_FIELDS: Record<string, FilterField[]> = {
  request: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'template', label: 'Request Template', kind: 'choice', options: ['New Laptop', 'Access Request', 'Password Reset', 'On-boarding'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'approvalStatus', label: 'Approval Status', kind: 'choice', options: ['Not Requested', 'Pending', 'Approved', 'Rejected'] },
    { key: 'vendor', label: 'Vendor', kind: 'choice', options: ['Dell', 'HP', 'Lenovo', 'Microsoft', 'Cisco'] },
    ...COMMON_PEOPLE(),
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'impact', label: 'Impact', kind: 'choice', options: ['On Multiple Users', 'On Business', 'On User'] },
    { key: 'source', label: 'Source', kind: 'choice', options: ['Portal', 'Email', 'Phone', 'Chat', 'Walk-in'] },
    { key: 'urgency', label: 'Urgency', kind: 'choice', options: ['Urgent', 'High', 'Medium', 'Low'] },
    { key: 'dueBy', label: 'Due By', kind: 'date' },
    { key: 'firstResponseDueBy', label: 'First Response Due By', kind: 'date' },
    { key: 'assignee', label: 'Assignee', kind: 'person' },
    { key: 'technicianGroup', label: 'Technician Group', kind: 'choice', options: ['Service Desk', 'Network', 'End User Computing', 'Application Support'] },
    { key: 'category', label: 'Category', kind: 'choice', options: ['Hardware', 'Software', 'Network', 'Access', 'Other'] },
    { key: 'type', label: 'Type', kind: 'choice', options: ['Service Request', 'Incident'] },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  problem: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'rootCause', label: 'Root Cause', kind: 'choice', options: ['Identified', 'Under Analysis', 'Not Identified'] },
    ...COMMON_PEOPLE(),
    { key: 'assignee', label: 'Assignee', kind: 'person' },
    { key: 'category', label: 'Category', kind: 'choice', options: ['Hardware', 'Software', 'Network', 'Access', 'Other'] },
    { key: 'dueBy', label: 'Due By', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  change: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'changeType', label: 'Change Type', kind: 'choice', options: ['Standard', 'Normal', 'Emergency'] },
    { key: 'risk', label: 'Risk', kind: 'choice', options: ['High', 'Medium', 'Low'] },
    { key: 'approvalStatus', label: 'Approval Status', kind: 'choice', options: ['Pending', 'Approved', 'Rejected'] },
    ...COMMON_PEOPLE(),
    { key: 'assignee', label: 'Assignee', kind: 'person' },
    { key: 'plannedStart', label: 'Planned Start Date', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  release: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'releaseType', label: 'Release Type', kind: 'choice', options: ['Major', 'Minor', 'Patch', 'Emergency'] },
    ...COMMON_PEOPLE(),
    { key: 'assignee', label: 'Assignee', kind: 'person' },
    { key: 'goLive', label: 'Go-Live Date', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  asset: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'assetType', label: 'Asset Type', kind: 'choice', options: ['Laptop', 'Desktop', 'Mobile', 'Monitor', 'Headset', 'Printer'] },
    { key: 'usedBy', label: 'Used By', kind: 'person' },
    { key: 'managedBy', label: 'Managed By', kind: 'person' },
    { key: 'location', label: 'Location', kind: 'choice', options: ['Ahmedabad', 'Pune', 'Bengaluru', 'Remote'] },
    { key: 'warrantyExpiry', label: 'Warranty Expiry', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  ci: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'ciType', label: 'CI Type', kind: 'choice', options: ['Server', 'Application', 'Switch', 'Windows Laptop', 'Mac Laptop', 'Mobile Device'] },
    { key: 'usedBy', label: 'Used By', kind: 'person' },
    { key: 'managedBy', label: 'Managed By', kind: 'person' },
    { key: 'environment', label: 'Environment', kind: 'choice', options: ['Production', 'Staging', 'Development'] },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  patch: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'severity', label: 'Severity', kind: 'choice', options: ['Critical', 'Important', 'Moderate', 'Low'] },
    { key: 'category', label: 'Category', kind: 'choice', options: ['Security Update', 'Critical Update', 'Feature Pack', 'Driver'] },
    { key: 'approvalStatus', label: 'Approval Status', kind: 'choice', options: ['Approved', 'Declined', 'Not Reviewed'] },
    { key: 'releaseDate', label: 'Release Date', kind: 'date' },
  ],
  vulnerability: [
    { key: 'id', label: 'CVE ID', kind: 'text' },
    { key: 'name', label: 'Title', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'severity', label: 'Severity', kind: 'choice', options: ['Critical', 'High', 'Medium', 'Low'] },
    { key: 'exploitStatus', label: 'Exploit Status', kind: 'choice', options: ['Exploited', 'Not Exploited'] },
    { key: 'patchAvailable', label: 'Patch Availability', kind: 'choice', options: ['Available', 'Not Available'] },
    { key: 'published', label: 'Published Date', kind: 'date' },
  ],
  approval: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'requester', label: 'Requested By', kind: 'person' },
    { key: 'approver', label: 'Approver', kind: 'person' },
    { key: 'requestedOn', label: 'Requested On', kind: 'date' },
  ],
  task: [
    { key: 'id', label: 'ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'assignee', label: 'Assignee', kind: 'person' },
    { key: 'dueBy', label: 'Due By', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
};

/* ── presets ────────────────────────────────────────────────────────────────
 *
 * The Requests set is the product's own, from the technician list page. ⚠️ Wherever a preset CAN be
 * expressed as a status condition it is, rather than being a bare name with nothing behind it —
 * that is what makes choosing one visibly change the card on the canvas. The scope half of a preset
 * ("My", "in My Group") is a fact about the signed-in requester, so there is nothing for the
 * builder to evaluate and the preview shows the status half. */
const st = (op: string, ...values: string[]): Condition => ({ field: 'status', op, values });

export const FILTER_PRESETS: Record<string, PresetFilter[]> = {
  request: [
    { id: 'all-open', name: 'All Open Requests', conditions: [st('Not In', 'Resolved', 'Closed')] },
    { id: 'my-urgent', name: 'My Urgent or High Priority Requests', conditions: [st('Not In', 'Resolved', 'Closed'), { field: 'priority', op: 'In', values: ['Urgent', 'High'] }] },
    { id: 'my-overdue', name: 'My Overdue Requests', conditions: [st('Not In', 'Resolved', 'Closed'), { field: 'dueBy', op: 'Equals', values: ['Overdue'] }] },
    { id: 'unassigned-group', name: 'Unassigned Requests in My Group', conditions: [st('Not In', 'Resolved', 'Closed'), { field: 'assignee', op: 'In', values: [UNASSIGNED] }] },
    { id: 'my-unresolved', name: 'My Unresolved Requests', conditions: [st('Not In', 'Resolved', 'Closed')] },
    { id: 'group-urgent', name: 'Urgent or High Priority Requests in my Group', conditions: [{ field: 'priority', op: 'In', values: ['Urgent', 'High'] }] },
    { id: 'all', name: 'All Requests', conditions: [] },
    { id: 'all-incidents', name: 'All Incidents', conditions: [{ field: 'type', op: 'In', values: ['Incident'] }] },
    { id: 'all-sr', name: 'All Service Requests', conditions: [{ field: 'type', op: 'In', values: ['Service Request'] }] },
    { id: 'all-spam', name: 'All Spam Requests', conditions: [{ field: 'source', op: 'In', values: ['Email'] }] },
    { id: 'watched', name: 'Requests Watched By Me', conditions: [] },
    { id: 'archived', name: 'All Archived Requests', conditions: [st('In', 'Closed')] },
  ],
  problem: [
    { id: 'all-open', name: 'All Open Problems', conditions: [st('Not In', 'Resolved', 'Closed')] },
    { id: 'my-open', name: 'My Open Problems', conditions: [st('Not In', 'Resolved', 'Closed')] },
    { id: 'known-errors', name: 'All Known Errors', conditions: [st('In', 'Known Error')] },
    { id: 'under-investigation', name: 'Problems Under Investigation', conditions: [st('In', 'Under Investigation')] },
    { id: 'all', name: 'All Problems', conditions: [] },
  ],
  change: [
    { id: 'all-open', name: 'All Open Changes', conditions: [st('Not In', 'Implemented', 'Closed')] },
    { id: 'awaiting-approval', name: 'Changes Awaiting My Approval', conditions: [st('In', 'Submitted')] },
    { id: 'scheduled', name: 'Scheduled Changes', conditions: [st('In', 'Scheduled')] },
    { id: 'my-changes', name: 'My Changes', conditions: [] },
    { id: 'all', name: 'All Changes', conditions: [] },
  ],
  release: [
    { id: 'all-open', name: 'All Open Releases', conditions: [st('Not In', 'Closed')] },
    { id: 'in-build', name: 'Releases in Build', conditions: [st('In', 'Build')] },
    { id: 'in-testing', name: 'Releases in Testing', conditions: [st('In', 'Testing')] },
    { id: 'deployed', name: 'Deployed Releases', conditions: [st('In', 'Deployed')] },
    { id: 'all', name: 'All Releases', conditions: [] },
  ],
  asset: [
    { id: 'my-assets', name: 'My Assets', conditions: [] },
    { id: 'in-use', name: 'Assets In Use', conditions: [st('In', 'In Use')] },
    { id: 'in-stock', name: 'Assets In Stock', conditions: [st('In', 'In Stock')] },
    { id: 'in-repair', name: 'Assets In Repair', conditions: [st('In', 'In Repair')] },
    { id: 'expiring-warranty', name: 'Assets With Expiring Warranty', conditions: [{ field: 'warrantyExpiry', op: 'Equals', values: ['This Month'] }] },
    { id: 'all', name: 'All Assets', conditions: [] },
  ],
  ci: [
    { id: 'my-cis', name: 'My CIs', conditions: [] },
    { id: 'operational', name: 'Operational CIs', conditions: [st('In', 'Operational')] },
    { id: 'degraded', name: 'Degraded or Down CIs', conditions: [st('In', 'Degraded', 'Down')] },
    { id: 'all', name: 'All CIs', conditions: [] },
  ],
  patch: [
    { id: 'missing', name: 'All Missing Patches', conditions: [st('In', 'Missing')] },
    { id: 'critical-missing', name: 'Missing Critical Patches', conditions: [st('In', 'Missing'), { field: 'severity', op: 'In', values: ['Critical'] }] },
    { id: 'installed', name: 'Installed Patches', conditions: [st('In', 'Installed')] },
    { id: 'failed', name: 'Failed Patches', conditions: [st('In', 'Failed')] },
    { id: 'all', name: 'All Patches', conditions: [] },
  ],
  vulnerability: [
    { id: 'exploited', name: 'Exploited Vulnerabilities', conditions: [st('In', 'Exploited')] },
    { id: 'detected', name: 'Detected Vulnerabilities', conditions: [st('In', 'Detected')] },
    { id: 'critical', name: 'Critical Vulnerabilities', conditions: [{ field: 'severity', op: 'In', values: ['Critical'] }] },
    { id: 'unpatched', name: 'Vulnerabilities Without a Patch', conditions: [{ field: 'patchAvailable', op: 'In', values: ['Not Available'] }] },
    { id: 'all', name: 'All Vulnerabilities', conditions: [] },
  ],
  approval: [
    { id: 'pending-me', name: 'Approvals Pending With Me', conditions: [st('In', 'Pending')] },
    { id: 'approved-me', name: 'Approved By Me', conditions: [st('In', 'Approved')] },
    { id: 'rejected-me', name: 'Rejected By Me', conditions: [st('In', 'Rejected')] },
    { id: 'all', name: 'All Approvals', conditions: [] },
  ],
  task: [
    { id: 'my-open', name: 'My Open Tasks', conditions: [st('Not In', 'Completed', 'Cancelled')] },
    { id: 'my-overdue', name: 'My Overdue Tasks', conditions: [{ field: 'dueBy', op: 'Equals', values: ['Overdue'] }] },
    { id: 'in-progress', name: 'Tasks In Progress', conditions: [st('In', 'In Progress')] },
    { id: 'completed', name: 'Completed Tasks', conditions: [st('In', 'Completed')] },
    { id: 'all', name: 'All Tasks', conditions: [] },
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
  const n = filter?.conditions?.length ?? 0;
  if (n === 0) return 'No filter — every record';
  return `Custom · ${n} condition${n === 1 ? '' : 's'}`;
}

/** The conditions actually in force, whichever of the two the admin chose. */
export const activeConditions = (filter: RecordFilter | undefined, moduleKey: string): Condition[] =>
  presetById(moduleKey, filter?.preset)?.conditions ?? filter?.conditions ?? [];

/* ── evaluating against the sample rows ─────────────────────────────────────
 *
 * ⚠️ The builder's rows are SAMPLES — id, title, status and a meta line, which is all the canvas
 * needs to show the shape of the card. So a condition on a field the sample rows carry (status, id,
 * subject) genuinely filters, and one on a field they do not (priority, assignee, a date) PASSES
 * rather than emptying the card. Evaluating an absent field as "no match" would black out the
 * preview the moment anybody picked a realistic filter, which teaches an admin their filter is
 * broken when it is the preview that is thin. The widget's note says so in as many words. */
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
