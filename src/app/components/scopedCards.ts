/* Which ServiceOps admin page each per-workspace card opens. ESM F04 (decided 2026-11-02, built 2026-11-02).
 *
 * Read live on 172.16.15.185 (8.7.7, 2026-11-02): ~60 per-workspace cards are really ~15 ServiceOps PAGES, most of
 * them one page with MODULE TABS (Workflow: Request · Problem · Change · Release · Asset · CMDB · Asset Movement · User ·
 * User Leave · Task · Admin; Status: Request · Problem · Change · Release · Asset · CMDB · Task; …). A card such as
 * "Task Status" is that page opened on its tab.
 *
 * F04 is therefore applied PER TAB:
 *   ws  = the workspace's own (Request, Task, Knowledge, User Survey…)
 *   it  = the workspace's own, IT workspaces only (Problem, Change, Release, Incident Schedule)
 *   org = the organization's (Asset, CMDB, User, Contract, Purchase, Project, Admin…) — never inside a workspace.
 * Titles and subtitles are the live page heads. Kept free of React so routes.ts can import it. */

export type TabScope = 'ws' | 'it' | 'org';
export interface ScopedTab { key: string; label: string; scope: TabScope; title?: string; sub?: string }

export type PageKind =
  | 'list' | 'values' | 'status' | 'category' | 'rules' | 'assignment' | 'feedback' | 'pref' | 'matrix'
  | 'form' | 'catalog' | 'emails' | 'notifications' | 'groups';

export interface PageDef {
  key: string; kind: PageKind; title: string; sub: string; tabs: ScopedTab[];
  /** Separate ServiceOps pages per module (Request Form, Task Form…) share one definition but show no tab strip. */
  hideTabs?: boolean;
  createLabel?: string;
}

const T = (key: string, label: string, scope: TabScope, title?: string, sub?: string): ScopedTab => ({ key, label, scope, title, sub });
const REQ = T('request', 'Request', 'ws');
const PRB = T('problem', 'Problem', 'it');
const CHG = T('change', 'Change', 'it');
const REL = T('release', 'Release', 'it');
const TSK = T('task', 'Task', 'ws');
const o = (key: string, label: string) => T(key, label, 'org');

export const PAGES: Record<string, PageDef> = {
  workflow: { key: 'workflow', kind: 'list', title: 'Workflow', sub: 'Build rule-based flows that route and act on requests.', createLabel: 'Create Workflow',
    tabs: [REQ, PRB, CHG, REL, o('asset', 'Asset'), o('cmdb', 'CMDB'), o('asset_movement', 'Asset Movement'), o('user', 'User'), o('user_leave', 'User Leave'), TSK, o('admin', 'Admin')] },
  approval: { key: 'approval', kind: 'list', title: 'Approval Workflow', sub: 'Define multi-stage approvals across any module.', createLabel: 'Create Approval Workflow',
    tabs: [REQ, PRB, CHG, REL, o('asset', 'Asset'), o('asset_update', 'Asset Update'), o('cmdb', 'CMDB'), o('asset_movement', 'Asset Movement'), T('knowledge', 'Knowledge', 'ws'), o('purchase', 'Purchase')] },
  notifications: { key: 'notifications', kind: 'notifications', title: 'Event Notifications', sub: 'Send alerts when system events trigger.',
    tabs: [REQ, PRB, CHG, REL, o('asset', 'Asset'), o('asset_update', 'Asset Update'), o('cmdb', 'CMDB'), o('asset_movement', 'Asset Movement'), o('asset_assignment', 'Asset Assignment'),
      o('ci_assignment', 'CI Assignment'), T('knowledge', 'Knowledge', 'ws'), o('contract', 'Contract'), o('purchase', 'Purchase'), o('project', 'Project'), o('user', 'User'), o('user_leave', 'User Leave'),
      TSK, T('user_survey', 'User Survey', 'ws'), T('incident_schedule', 'Incident Schedule', 'it'), T('task_schedule', 'Task Schedule', 'ws')] },
  assignment: { key: 'assignment', kind: 'assignment', title: 'Auto Assignment', sub: 'Route work using round-robin or load-balanced logic.', tabs: [REQ, PRB, CHG, REL] },
  scenario: { key: 'scenario', kind: 'list', title: 'Scenario', sub: 'Run multiple actions on a request in one click.', createLabel: 'Create Scenario', tabs: [REQ], hideTabs: true },
  incidentSchedule: { key: 'incidentSchedule', kind: 'list', title: 'Incident Schedules', sub: 'Schedule recurring incidents for planned maintenance.', createLabel: 'Create Incident Schedule', tabs: [T('request', 'Request', 'it')], hideTabs: true },
  taskSchedule: { key: 'taskSchedule', kind: 'list', title: 'Task Schedule', sub: 'Schedule recurring tasks for automatic creation.', createLabel: 'Create Task Schedule', tabs: [TSK], hideTabs: true },
  groups: { key: 'groups', kind: 'groups', title: 'Technician Groups', sub: 'Organize technicians into teams for routing and assignment.', createLabel: 'Create Technician Group', tabs: [REQ], hideTabs: true },
  pref: { key: 'pref', kind: 'pref', title: 'System Preference', sub: '',
    tabs: [o('user_preference', 'User Preference'), T('request_preference', 'Request Preference', 'ws', 'Request Preference', 'Set defaults for request creation and processing.'),
      o('asset_preference', 'Asset / CMDB Preference'), o('purchase_preference', 'Purchase Order Preference'), o('agent_preference', 'Agent Preference'), o('survey_preference', 'Survey Preference'),
      o('project_preference', 'Project Preference'), o('application_settings', 'Application Settings'), o('search_preference', 'Search Preference'),
      T('task_preference', 'Task Preference', 'ws', 'Task Preference', 'Set defaults for task creation and workflow.'), o('contract_preference', 'Contract Preference')] },
  emails: { key: 'emails', kind: 'emails', title: 'Emails', sub: 'Configure email servers and inbound mail rules.',
    tabs: [T('outgoing', 'Outgoing Email Servers', 'org', 'Outgoing Email Servers', 'Configure SMTP servers used to send outbound email.'),
      T('incoming', 'Incoming Email Servers', 'ws', 'Incoming Email Servers', 'Configure inbound mail servers and email-to-ticket rules.'),
      T('email_preference', 'Email Preference', 'org', 'Email Preference', 'Configure email servers and inbound mail rules.')] },
  surveys: { key: 'surveys', kind: 'list', title: 'User Surveys', sub: 'Build surveys to measure user satisfaction and feedback.', createLabel: 'Create User Survey', tabs: [T('user_survey', 'User Survey', 'ws')], hideTabs: true },
  scheduleSurvey: { key: 'scheduleSurvey', kind: 'list', title: 'Schedule Survey', sub: 'Automate the delivery of recurring surveys.', createLabel: 'Create Schedule Survey', tabs: [T('user_survey', 'User Survey', 'ws')], hideTabs: true },
  form: { key: 'form', kind: 'form', title: 'Request Form', sub: 'Customize form fields and layout for requests.', hideTabs: true,
    tabs: [T('request', 'Request', 'ws', 'Request Form', 'Customize form fields and layout for requests.'), T('problem', 'Problem', 'it', 'Problem Form', 'Customize form fields and layout for problems.'),
      T('change', 'Change', 'it', 'Change Form', 'Customize form fields and layout for changes.'), T('release', 'Release', 'it', 'Release Form', 'Customize form fields and layout for releases.'),
      T('task', 'Task', 'ws', 'Task Form', 'Customize form fields and layout for tasks.'), T('feedback', 'Feedback', 'ws', 'Feedback Form', 'Configure feedback forms used at request closure.')] },
  status: { key: 'status', kind: 'status', title: 'Request Status', sub: '',
    tabs: [T('request', 'Request', 'ws', 'Request Status', 'Define statuses to track the request lifecycle.'), T('problem', 'Problem', 'it', 'Problem Status', 'Define statuses to track the problem lifecycle.'),
      T('change', 'Change', 'it', 'Change Status', 'Define statuses to track the change lifecycle.'), T('release', 'Release', 'it', 'Release Status', 'Define statuses to track the release lifecycle.'),
      o('asset', 'Asset'), o('cmdb', 'CMDB'), T('task', 'Task', 'ws', 'Task Status', 'Define statuses to track the task lifecycle.')] },
  matrix: { key: 'matrix', kind: 'matrix', title: 'Priority Matrix', sub: 'Auto-set priority based on impact and urgency.', tabs: [T('request', 'Request', 'it')], hideTabs: true },
  feedback: { key: 'feedback', kind: 'feedback', title: 'Request Feedback Setting', sub: 'Configure when and how feedback is collected after closure.', tabs: [REQ], hideTabs: true },
  response: { key: 'response', kind: 'list', title: 'Response Templates', sub: 'Create canned responses for faster technician replies.', createLabel: 'Create Response Template', tabs: [REQ], hideTabs: true },
  category: { key: 'category', kind: 'category', title: 'Request Categories', sub: '',
    tabs: [T('request', 'Request', 'ws', 'Request Categories', 'Classify requests for routing and reporting.'), T('problem', 'Problem', 'it', 'Problem Category', 'Classify problems for trend analysis and reporting.'),
      T('change', 'Change', 'it', 'Change Category', 'Classify changes for routing and reporting.'), T('release', 'Release', 'it', 'Release Category', 'Classify releases for routing and reporting.'), o('asset', 'Asset')] },
  templates: { key: 'templates', kind: 'list', title: 'Request Templates', sub: 'Pre-fill forms for common recurring requests.', createLabel: 'Create Template', tabs: [REQ, PRB, CHG, REL] },
  rules: { key: 'rules', kind: 'rules', title: 'Custom Rules', sub: '',
    tabs: [T('incident', 'Incident', 'ws'), T('service_request', 'Service Request', 'ws'), PRB, CHG, REL, o('asset_ci', 'Asset / CI'), T('knowledge', 'Knowledge', 'ws'), o('purchase', 'Purchase'), o('project', 'Project')] },
  formRule: { key: 'formRule', kind: 'list', title: 'Request Form Rule', sub: '', hideTabs: true,
    tabs: [T('request', 'Request', 'ws', 'Request Form Rule', 'Show, hide, or require fields on request forms based on conditions.'), T('problem', 'Problem', 'it', 'Problem Form Rule', 'Show, hide, or require fields on problem forms based on conditions.'),
      T('change', 'Change', 'it', 'Change Form Rule', 'Show, hide, or require fields on change forms based on conditions.'), T('task', 'Task', 'ws', 'Task Form Rule', 'Show, hide, or require fields on task forms based on conditions.')] },
  model: { key: 'model', kind: 'list', title: 'Request Model', sub: 'Configure automatic status transitions for requests.', createLabel: 'Create Model', tabs: [REQ, PRB, CHG, REL] },
  print: { key: 'print', kind: 'list', title: 'Print Template', sub: 'Design print layouts for request details and exports.', createLabel: 'Create Print Template',
    tabs: [T('request', 'Technician Portal', 'ws'), T('support', 'Support Portal', 'ws')] },
  printChange: { key: 'printChange', kind: 'list', title: 'Print Template', sub: 'Design print layouts for change details and exports.', createLabel: 'Create Print Template', tabs: [T('change', 'Technician Portal', 'it')], hideTabs: true },
  catalog: { key: 'catalog', kind: 'catalog', title: 'Service Catalog', sub: 'Publish the services employees can request.', tabs: [REQ], hideTabs: true },
  values: { key: 'values', kind: 'values', title: 'Task Types', sub: '', hideTabs: true,
    tabs: [T('task_type', 'Task Types', 'ws', 'Task Types', 'Classify tasks for organization and reporting.'),
      T('change_type', 'Change Types', 'it', 'Change Types', 'Define change classifications (standard, normal, emergency).'),
      T('target_environment', 'Target Environment', 'it', 'Target Environment', 'Define environments where changes are deployed.'),
      T('change_risk', 'Change Risk', 'it', 'Change Risk', 'Define risk levels for change impact assessment.'),
      T('change_reason', 'Change Reason', 'it', 'Change Reason', 'Standardize justifications for proposed changes.'),
      T('release_type', 'Release Types', 'it', 'Release Types', 'Define release classifications (major, minor, patch).'),
      T('release_risk', 'Release Risk', 'it', 'Release Risk', 'Define risk levels for release impact assessment.'),
      T('release_reason', 'Release Reason', 'it', 'Release Reason', 'Standardize justifications for planned releases.')] },
};

/** Rule pages per Custom Rules tab — the live sidebar's level-3 rows. */
export const RULE_KINDS: Record<string, { key: string; label: string; sub: string }[]> = (() => {
  const ticket = (noun: string) => [
    { key: 'resolved', label: 'Resolution Rules', sub: `Trigger actions when ${noun} moves to Resolved.` },
    { key: 'closed', label: 'Closure Rules', sub: `Trigger actions when ${noun} moves to Closed.` },
    { key: 'note', label: 'Required Note Rules', sub: `Require a note when ${noun} changes.` },
    { key: 'dialog', label: 'Show Dialog Rules', sub: `Show a dialog when ${noun} changes.` },
    { key: 'working', label: 'Add Working Rules', sub: `Require work details on ${noun}.` },
  ];
  return {
    incident: ticket('an incident'), service_request: ticket('a service request'), problem: ticket('a problem'),
    change: [{ key: 'submitted', label: 'Submitted Rules', sub: 'Trigger actions when a change is Submitted for review.' }, { key: 'planning', label: 'Planning Rules', sub: 'Trigger actions when a change moves to Planning.' },
      { key: 'implementation', label: 'Implementation Rules', sub: 'Trigger actions when a change moves to Implementation.' }, { key: 'review', label: 'Review Rules', sub: 'Trigger actions when a change moves to Review.' }],
    release: [{ key: 'submitted', label: 'Submitted Rules', sub: 'Trigger actions when a release is Submitted.' }, { key: 'planning', label: 'Planning Rules', sub: 'Trigger actions when a release moves to Planning.' },
      { key: 'build', label: 'Build Rules', sub: 'Trigger actions when a release moves to Build.' }, { key: 'testing', label: 'Testing Rules', sub: 'Trigger actions when a release moves to Testing.' },
      { key: 'deployment', label: 'Deployment Rules', sub: 'Trigger actions when a release moves to Deployment.' }],
    knowledge: [{ key: 'publish', label: 'Publish Rules', sub: 'Trigger actions when an article is Published.' }, { key: 'delete', label: 'Delete Rules', sub: 'Trigger actions when an article is Deleted.' },
      { key: 'restore', label: 'Restore Rules', sub: 'Trigger actions when an article is Restored.' }],
    asset_ci: [{ key: 'ci', label: 'CI Custom Rules', sub: 'Rules for configuration items.' }, { key: 'asset', label: 'Asset Custom Rules', sub: 'Rules for assets.' }],
    purchase: [{ key: 'approval', label: 'Sent for Approval Rules', sub: 'Trigger actions when a purchase is sent for approval.' }, { key: 'close', label: 'Close Rules', sub: 'Trigger actions when a purchase is closed.' }],
    project: [{ key: 'planning', label: 'Planning Rules', sub: 'Trigger actions when a project moves to Planning.' }, { key: 'implementation', label: 'Implementation Rules', sub: 'Trigger actions when a project moves to Implementation.' }],
  };
})();

export interface ScopedCard { section: string; card: string; slug: string; page: string; tab: string }

const C = (section: string, card: string, slug: string, page: string, tab: string): ScopedCard => ({ section, card, slug, page, tab });

/** Every per-workspace card, keyed the way AdminPage keys CARD_MODULES ("<section>/<card>"). */
export const SCOPED_CARDS: ScopedCard[] = [
  C('Automation', 'Workflow', 'workflow', 'workflow', 'request'),
  C('Automation', 'Approval Workflow', 'approval-workflow', 'approval', 'request'),
  C('Automation', 'Event Notifications', 'event-notifications', 'notifications', 'request'),
  C('Automation', 'Auto Assignment', 'auto-assignment', 'assignment', 'request'),
  C('Automation', 'Scenario', 'scenario', 'scenario', 'request'),
  C('Automation', 'Incident Schedules', 'incident-schedules', 'incidentSchedule', 'request'),
  C('Automation', 'Task Schedule', 'task-schedule', 'taskSchedule', 'task'),
  C('Users', 'Technician Groups', 'technician-groups', 'groups', 'request'),
  C('Organization', 'System Preference', 'system-preference', 'pref', 'request_preference'),
  C('Support Channels', 'Emails', 'emails', 'emails', 'incoming'),
  C('User Survey', 'User Surveys', 'user-survey', 'surveys', 'user_survey'),
  C('User Survey', 'Schedule Survey', 'schedule-survey', 'scheduleSurvey', 'user_survey'),
  C('Request Management', 'Request Form', 'request-form', 'form', 'request'),
  C('Request Management', 'Request Status', 'request-status', 'status', 'request'),
  C('Request Management', 'Priority Matrix', 'priority-matrix', 'matrix', 'request'),
  C('Request Management', 'Request Feedback Setting', 'feedback-setting', 'feedback', 'request'),
  C('Request Management', 'Response Templates', 'response-template', 'response', 'request'),
  C('Request Management', 'Request Categories', 'request-categories', 'category', 'request'),
  C('Request Management', 'Request Templates', 'request-templates', 'templates', 'request'),
  C('Request Management', 'Feedback Form', 'feedback-form', 'form', 'feedback'),
  C('Request Management', 'Incident Custom Rules', 'incident-custom-rules', 'rules', 'incident'),
  C('Request Management', 'Service Request Custom Rules', 'service-request-custom-rules', 'rules', 'service_request'),
  C('Request Management', 'Request Form Rule', 'request-form-rule', 'formRule', 'request'),
  C('Request Management', 'Request Model', 'request-model', 'model', 'request'),
  C('Request Management', 'Print Template', 'request-print-template', 'print', 'request'),
  C('Service Catalog', 'Service Catalog', 'service-catalog', 'catalog', 'request'),
  C('Problem Management', 'Problem Form', 'problem-form', 'form', 'problem'),
  C('Problem Management', 'Problem Category', 'problem-category', 'category', 'problem'),
  C('Problem Management', 'Problem Status', 'problem-status', 'status', 'problem'),
  C('Problem Management', 'Problem Form Rule', 'problem-form-rule', 'formRule', 'problem'),
  C('Problem Management', 'Problem Template', 'problem-template', 'templates', 'problem'),
  C('Problem Management', 'Problem Custom Rules', 'problem-custom-rules', 'rules', 'problem'),
  C('Problem Management', 'Problem Model', 'problem-model', 'model', 'problem'),
  C('Change Management', 'Change Form', 'change-form', 'form', 'change'),
  C('Change Management', 'Change Status', 'change-status', 'status', 'change'),
  C('Change Management', 'Change Custom Rules', 'change-custom-rules', 'rules', 'change'),
  C('Change Management', 'Change Form Rule', 'change-form-rule', 'formRule', 'change'),
  C('Change Management', 'Change Types', 'change-types', 'values', 'change_type'),
  C('Change Management', 'Target Environment', 'target-environment', 'values', 'target_environment'),
  C('Change Management', 'Change Category', 'change-category', 'category', 'change'),
  C('Change Management', 'Change Template', 'change-template', 'templates', 'change'),
  C('Change Management', 'Change Risk', 'change-risk', 'values', 'change_risk'),
  C('Change Management', 'Change Reason', 'change-reason', 'values', 'change_reason'),
  C('Change Management', 'Change Model', 'change-model', 'model', 'change'),
  C('Change Management', 'Print Template', 'change-print-template', 'printChange', 'change'),
  C('Release Management', 'Release Form', 'release-form', 'form', 'release'),
  C('Release Management', 'Release Status', 'release-status', 'status', 'release'),
  C('Release Management', 'Release Category', 'release-category', 'category', 'release'),
  C('Release Management', 'Release Types', 'release-types', 'values', 'release_type'),
  C('Release Management', 'Release Risk', 'release-risk', 'values', 'release_risk'),
  C('Release Management', 'Release Reason', 'release-reason', 'values', 'release_reason'),
  C('Release Management', 'Release Template', 'release-template', 'templates', 'release'),
  C('Release Management', 'Release Custom Rules', 'release-custom-rules', 'rules', 'release'),
  C('Release Management', 'Release Model', 'release-model', 'model', 'release'),
  C('Knowledge Management', 'Knowledge Custom Rules', 'knowledge-custom-rules', 'rules', 'knowledge'),
  C('Task Management', 'Task Types', 'task-types', 'values', 'task_type'),
  C('Task Management', 'Task Form', 'task-form', 'form', 'task'),
  C('Task Management', 'Task Form Rule', 'task-form-rule', 'formRule', 'task'),
  C('Task Management', 'Task Status', 'task-status', 'status', 'task'),
];

export const scopedCardFor = (section: string, card: string) => SCOPED_CARDS.find((c) => c.section === section && c.card === card);
export const scopedCardBySlug = (slug: string) => SCOPED_CARDS.find((c) => c.slug === slug);

/* ── Organization settings vs a workspace's settings (F04 rev. 2, Juli 2026-11-03: Q1–Q3 yes) ──────────────────
 * Freshservice's shape (ESM-serviceops/Freshservice-Analysis/11 §0), inside the ServiceOps pages:
 *   - With ONE workspace there is no split: the admin is today's ServiceOps admin (Q3).
 *   - With two or more, the organization's admin shows ORGANIZATION records only — no Workspace ▾ selector (Q1).
 *     A Workspace-only card is not listed there; you switch into the workspace to change it.
 *   - A few tabs are LAYERED (Q2): the organization has its own records too, and every workspace sees them
 *     read-only above its own. Run order follows Freshservice: rules = organization first, workspace wins;
 *     SLA = workspace first, then organization.
 *   - Service Catalog stays listed as a read-across view of every workspace's services (Freshservice's global catalog). */

/** Tabs where the organization keeps its own records on top of each workspace's (Q2). SLA is its own screen. */
export const LAYERED: Record<string, string[]> = {
  workflow: ['request', 'problem', 'change', 'release', 'task'],
  formRule: ['request', 'problem', 'change', 'task'],
  form: ['request', 'problem', 'change', 'release', 'task'],
};
export const isLayered = (page: string, tab: string) => !!LAYERED[page]?.includes(tab);

/** Cards named after the PAGE, not one module tab: they still open on the organization's tabs (Asset, User…). */
const PAGE_CARDS = ['workflow', 'approval', 'notifications', 'pref', 'emails'];

/** Tabs the organization's admin shows on a page once there are two or more workspaces. */
export const orgTabsOf = (page: string) => PAGES[page].tabs.filter((t) => t.scope === 'org' || isLayered(page, t.key));

/** What a card does in the organization's admin with two or more workspaces. */
export function orgViewOf(card: ScopedCard): { visible: boolean; tab?: string; aggregate?: boolean } {
  if (card.page === 'catalog') return { visible: true, tab: card.tab, aggregate: true };
  const tabs = orgTabsOf(card.page);
  if (tabs.some((t) => t.key === card.tab)) return { visible: true, tab: card.tab };
  if (PAGE_CARDS.includes(card.page) && tabs.length) return { visible: true, tab: tabs[0].key };
  return { visible: false };
}

/** Admin Overview + sidebar: is this card listed in the organization's admin? Non-ESM cards always are. */
export const listedInOrganization = (section: string, card: string, multi: boolean) => {
  if (!multi) return true;
  const c = scopedCardFor(section, card);
  return !c || orgViewOf(c).visible;
};
