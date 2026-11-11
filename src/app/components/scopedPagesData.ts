/* Records behind the per-workspace ServiceOps admin pages (scopedCards.ts). ESM F04.
 *
 * One store, keyed `<page>|<tab>|<owner>` where owner = 'org' or a workspace id (F04: every Workspace-only record
 * carries an owner). A key is seeded the first time it is read — that is the "copy per workspace, seeded at create"
 * rule (F04 §5.2): IT gets today's live records (upgrade, F04 §5.6), other workspaces get their template's.
 * Live sources: 172.16.15.185, 2026-11-02. Where the live row was test data ("v", "UHIUH", "Rohan") a realistic name
 * of the same shape is used instead. */

import type { Workspace, WorkspaceType } from './workspaceData';
import type { Owner } from './workspaceSettingsData';

export interface Rec { id: number; name: string; enabled?: boolean; [k: string]: unknown }
export interface PagesStore { rows: Record<string, Rec[]>; settings: Record<string, Record<string, unknown>> }

const KEY = 'serviceops.esm.pages.v1';
export function loadPages(): PagesStore {
  try { const raw = window.localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as PagesStore; } catch { /* storage unavailable */ }
  return { rows: {}, settings: {} };
}
export function savePages(s: PagesStore) { try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } }

export const storeKey = (page: string, tab: string, owner: Owner) => `${page}|${tab}|${owner}`;

const list = (...xs: Omit<Rec, 'id'>[]): Rec[] => xs.map((x, i) => ({ id: i + 1, ...x }) as Rec);
const names = (...xs: string[]): Rec[] => xs.map((name, i) => ({ id: i + 1, name }));
const by = <T,>(t: WorkspaceType, m: Partial<Record<WorkspaceType, T>>, d: T): T => m[t] ?? d;

export const STATUS_COLOURS = ['#FACC15', '#3B82F6', '#F97316', '#94A3B8', '#F59E0B', '#22C55E', '#64748B', '#A855F7', '#EF4444', '#14B8A6'];
export const PRIORITIES = [
  { name: 'Low', colour: '#22C55E' }, { name: 'Medium', colour: '#FACC15' }, { name: 'High', colour: '#F97316' }, { name: 'Urgent', colour: '#EF4444' },
];
export const IMPACTS = ['Low', 'On Users', 'On Department', 'On Business'];

/** Live Request tab statuses with their Run SLA / Run UC / Set As Default toggles. */
const REQUEST_STATUSES: Rec[] = list(
  { name: 'Open', colour: '#FACC15', sla: true, uc: false, isDefault: true, system: true },
  { name: 'In Progress', colour: '#3B82F6', sla: true, uc: true, isDefault: false },
  { name: 'Pending', colour: '#F97316', sla: false, uc: false, isDefault: false },
  { name: 'On Hold', colour: '#94A3B8', sla: false, uc: true, isDefault: false },
  { name: 'Waiting on Customer', colour: '#F59E0B', sla: false, uc: true, isDefault: false },
  { name: 'Resolved and validated', colour: '#22C55E', final: true, system: true },
  { name: 'Closed', colour: '#64748B', final: true, system: true },
);

export const SYSTEM_FIELDS = ['Requester', 'Subject', 'Description', 'Cc Emails', 'Status', 'Priority', 'Urgency', 'Impact', 'Category', 'Service',
  'Technician Group', 'Assignee', 'Department', 'Vendor', 'Tags', 'Location', 'Assets', 'CI', 'Attachment'];
export const TASK_SYSTEM_FIELDS = ['Subject', 'Description', 'Task Type', 'Status', 'Priority', 'Technician Group', 'Assignee', 'Start Date', 'End Date', 'Attachment'];

export const FIELD_TYPES: { group: string; items: string[] }[] = [
  { group: 'Text Fields', items: ['Text Input', 'Text Area', 'Rich Text Area'] },
  { group: 'Selection Fields', items: ['Dropdown', 'Multi-Select Dropdown', 'Datetime'] },
  { group: 'Input Fields', items: ['Number', 'Checkbox', 'Radio'] },
  { group: 'Special Fields', items: ['Attachment', 'Section', 'Label', 'URL', 'Currency'] },
  { group: 'Advanced Fields', items: ['Dependent', 'API'] },
];
export const FEEDBACK_FIELD_TYPES: { group: string; items: string[] }[] = [
  { group: 'Text Fields', items: ['Text Input', 'Text Area', 'Rich Text Area'] },
  { group: 'Selection Fields', items: ['Dropdown', 'Multi-Select Dropdown', 'Datetime'] },
  { group: 'Input Fields', items: ['Number', 'Checkbox', 'Radio', 'Rating', 'Numeric Scale', 'Boolean'] },
  { group: 'Special Fields', items: ['Label', 'URL'] },
];

const CUSTOM_FIELDS: Record<string, Partial<Record<WorkspaceType, Rec[]>>> = {
  request: {
    it: list({ name: 'Asset Tag', type: 'Text Input' }, { name: 'Affected Service', type: 'Dropdown' }, { name: 'Root Cause (RCA)', type: 'Section' }, { name: 'Outage Start', type: 'Datetime' }),
    hr: list({ name: 'Employee ID', type: 'Text Input', required: true }, { name: 'Joining Date', type: 'Datetime' }, { name: 'Payroll Month', type: 'Dropdown' }),
    facilities: list({ name: 'Building', type: 'Dropdown', required: true }, { name: 'Floor', type: 'Number' }, { name: 'Room / Desk', type: 'Text Input' }),
    finance: list({ name: 'Cost Center', type: 'Dropdown', required: true }, { name: 'Invoice Number', type: 'Text Input' }, { name: 'Amount', type: 'Currency' }),
    legal: list({ name: 'Counterparty', type: 'Text Input' }, { name: 'Contract Value', type: 'Currency' }),
  },
  feedback: { it: list({ name: 'How satisfied are you?', type: 'Rating' }, { name: 'Was the issue fixed the first time?', type: 'Boolean' }, { name: 'Comments', type: 'Text Area' }) },
};

const CATALOG: Partial<Record<WorkspaceType, { categories: string[]; services: [string, string][] }>> = {
  it: { categories: ['Hardware', 'Software', 'Data Services'], services: [['Microsoft Office 2019', 'Software'], ['Desktop Request', 'Hardware'], ['Printer Request', 'Hardware'], ['Computer Accessories', 'Hardware'], ['Recover Company Assets', 'Hardware'], ['Data Backup', 'Data Services'], ['File Restoration', 'Data Services'], ['Email Access', 'Software']] },
  hr: { categories: ['HR'], services: [['Employee On-boarding', 'HR'], ['Employee Off-boarding', 'HR'], ['Exit Interview', 'HR'], ['ID Card', 'HR'], ['Employee Verification Letter', 'HR'], ['Leave/Time Off Request', 'HR'], ['Manpower Requisition Form', 'HR'], ['Job Applicant Details', 'HR']] },
  finance: { categories: ['Finance', 'Travel'], services: [['Payroll Setup', 'Finance'], ['Remove from Payroll', 'Finance'], ['Travel Reimbursement', 'Finance'], ['Flight Booking', 'Travel'], ['Hotel Booking', 'Travel'], ['Cab Booking', 'Travel']] },
  facilities: { categories: ['Facilities Management'], services: [['Guest Access', 'Facilities Management'], ['Book a Meeting Room', 'Facilities Management']] },
};

const GROUP_DESC: Record<string, string> = {
  'Network Operations Group': 'Network Operations Group for troubleshooting connectivity and network access issues.',
  'IT Support Group': 'IT Support Group for managing system access, user provisioning, and IT policy enforcement.',
  'General Support': 'General Support Group for managing uncategorized or cross-functional service requests.',
  'Change Advisory Board (CAB)': 'Change Advisory Board for the approval of changes.',
};
export const groupDesc = (name: string) => GROUP_DESC[name] ?? '';

const NOTIFY: Record<string, string[]> = {
  request: ['Notify Requester when Added as Requester', 'Notify Requester when Request is Closed due to Merging', 'Notify Approval Owner When Approver Refers back an Approval', 'OLA Due Escalation',
    'Notify user when added as CC user', 'Notify Requester when new Request is created', 'Notify Requester when Technician replies to Requester', 'Notify Requester when Request is Resolved',
    'Notify Requester when Request is closed', 'Notify Requester when Technician attaches solution for a Request', 'Notify Technician When New Request is Created and Assigned to Technician',
    'Notify Technician in group when new Request is Created and Assigned to Group', 'Notify Technician When Request is Assigned', 'Notify Technician in group when Request is Assigned to Group',
    'Notify Technician when Requester replies to Request', 'Notify Request Owner When Another Technician commented on Assigned Request', 'Notify Technicians when they are mentioned in the conversation for a Request',
    'Notify Approver for Approval Reminder', 'Notify Approver When Approval is Created', 'Notify Approval Owner When Approver Approves an Approval', 'Notify Approval Owner When Approver Rejects an Approval'],
  task: ['Notify Technician group when Task is Closed', 'Notify Technician group when Task is Created and Assigned', 'Notify Technician group when Task is Assigned', 'Notify Technician when New Task is Created and Assigned to Technician',
    'Notify Technician when Task is Assigned', 'Notify when Task is about to overdue', 'Notify Task Assignee When Technician Comments on Task', 'Notify Technician when Task is Closed'],
  user_survey: ['Notify Owner when Survey Schedule is skipped', 'Notify Audience when Survey is Live', 'Notify Owner when Survey is Live', 'Notify Owner when Survey is Expired',
    'Notify Technicians when they are mentioned in the conversation for a Survey', 'Notify Owner When Another Technician commented on Assigned Survey', 'Notify Owner when Survey is Assigned'],
  knowledge: ['Review Email Template', 'Notify Subscribers when KB is expired', 'Notify Subscribers when KB is about to expire', 'Notify Approval Owner When Approver Refers back an Approval',
    'Notify all approvers when approver comments on Approval', 'Notify Approver When Approval is Ignored', 'Notify Approval Owner When Approver Rejects an Approval', 'Notify Approval Owner When Approver Approves an Approval',
    'Notify Approver for Approval Reminder', 'Notify Approver When Approval is Created'],
};

/** First read of a key: what that workspace (or the organization) starts with. */
export function seedRows(page: string, tab: string, owner: Owner, ws?: Workspace): Rec[] {
  /* The organization layer (F04 rev. 2, Q2): what crosses workspaces, the Freshservice uses of global records
     (Freshservice-Analysis/11 §2, §6, §7). `workspaces` = the Workspace condition; [] = every workspace.
     Ids: 1 IT (Default, holds the shared mailbox), 2 Human Resources, 3 Facilities. */
  if (owner === 'org' && tab === 'request') {
    if (page === 'workflow') return list(
      { name: 'Move payroll and leave emails to Human Resources', type: 'Event', trigger: '1. Request is created · Source is Email · Subject contains payroll, salary, leave', workspaces: [1], moveTo: 2, created: 'Mon, Nov 02, 2026 10:20 AM', version: 'v1', status: 'Published', enabled: true },
      { name: 'Move building access emails to Facilities', type: 'Event', trigger: '1. Request is created · Source is Email · Subject contains access card, parking, desk', workspaces: [1], moveTo: 3, created: 'Mon, Nov 02, 2026 10:24 AM', version: 'v1', status: 'Published', enabled: true },
      { name: 'Flag VIP requesters', type: 'Event', trigger: '1. Request is created · Requester is VIP', workspaces: [], created: 'Mon, Nov 02, 2026 10:30 AM', version: 'v1', status: 'Published', enabled: true });
    if (page === 'formRule') return list(
      { name: 'Hide Assets and CI outside IT', executionOn: 'On Create and Edit', applicableFor: 'All Users', event: 'On Form Load', workspaces: [2, 3], created: 'Mon, Nov 02, 2026 11:05 AM', enabled: true });
    if (page === 'form') return list({ name: 'Business Unit', type: 'Dropdown' }, { name: 'Employee Location', type: 'Dropdown' });
  }
  if (owner === 'org' && ws === undefined && ['workflow', 'formRule', 'form'].includes(page)) return [];
  const t: WorkspaceType = ws?.type ?? 'general';
  const it = t === 'it';
  switch (page) {
    case 'workflow':
      if (tab !== 'request') return [];
      return by<Rec[]>(t, {
        it: list(
          { name: 'Set Request Priority', type: 'Event', trigger: '1. Status is changed From Any To Pending', created: 'Tue, Jul 28, 2026 02:53 PM', version: 'v2', status: 'Published', enabled: true },
          { name: 'Linking CI to Incident', type: 'Event', trigger: '1. Category is changed', created: 'Wed, Aug 05, 2026 04:16 PM', version: 'v1', status: 'Published', enabled: false },
          { name: 'Sending Reminder Email', type: 'Event', trigger: '1. Priority is changed From Any To Any', created: 'Wed, Aug 05, 2026 11:58 AM', version: 'v2', status: 'Published', enabled: false },
          { name: 'High Priority Incident Escalation', type: 'Event', trigger: '1. Incident is created', created: 'Tue, Aug 04, 2026 05:26 PM', version: 'v1', status: 'Published', enabled: false },
          { name: 'Major Incident Workflow', type: 'Event', trigger: '1. Incident is created', created: 'Tue, Aug 04, 2026 03:52 PM', version: 'v1', status: 'Published', enabled: false },
          { name: 'Automated Incident Assignment on Creation', type: 'Event', trigger: '1. Incident is created', created: 'Mon, Aug 03, 2026 03:35 PM', version: 'v1', status: 'Published', enabled: true },
          { name: 'Auto Close Resolved Incidents', type: 'Periodic', trigger: 'Every 1 Day', created: 'Thu, Jul 02, 2026 03:00 PM', version: 'v1', status: 'Published', enabled: true },
          { name: 'High Priority for VIP Requester', type: 'Event', trigger: 'Incident is created', created: 'Thu, Jul 02, 2026 03:00 PM', version: 'v1', status: 'Published', enabled: true }),
        hr: list({ name: 'Route payroll queries to Payroll team', type: 'Event', trigger: '1. Request is created', created: 'Mon, Oct 26, 2026 10:10 AM', version: 'v1', status: 'Published', enabled: true },
          { name: 'Auto Close Resolved HR Cases', type: 'Periodic', trigger: 'Every 1 Day', created: 'Mon, Oct 26, 2026 10:12 AM', version: 'v1', status: 'Published', enabled: true }),
        facilities: list({ name: 'Escalate building access requests', type: 'Event', trigger: '1. Category is changed', created: 'Tue, Oct 27, 2026 09:40 AM', version: 'v1', status: 'Published', enabled: true }),
      }, []);
    case 'approval':
      if (tab === 'request') return by<Rec[]>(t, { it: names('Approval for taking Remote Access', 'Laptop Approval', 'Approval for Network Downtime'), hr: names('Manager approval for leave encashment'), finance: names('Approval for expenses above 50,000') }, []).map((r) => ({ ...r, enabled: true }));
      if (tab === 'knowledge' && it) return names('Document Publication Approval').map((r) => ({ ...r, enabled: true }));
      return [];
    case 'notifications': {
      const base = NOTIFY[tab] ?? [];
      return base.map((name, i) => ({ id: i + 1, name, enabled: i % 3 !== 2 }));
    }
    case 'scenario':
      return by<Rec[]>(t, { it: list({ name: 'Ticket Assignment to Support Tier 2', description: 'Ticket Assignment to Support Tier 2', enabled: true }, { name: 'Approval Scenario', description: 'Run approval workflow if the impact is on users.', enabled: true }),
        hr: list({ name: 'Send to Payroll team', description: 'Assign to Payroll and set category Payroll.', enabled: true }) }, []);
    case 'incidentSchedule':
      return it ? list({ name: 'Server Maintenance', subject: 'Server Maintenance', scheduleType: 'Once', next: '---', last: 'Wed, Jul 22, 2026 12:52', enabled: true },
        { name: 'Backup of EMS Server', subject: 'Backup of EMS Server', scheduleType: 'Weekly', next: 'Thu, Nov 05, 2026 12:00', last: 'Thu, Oct 29, 2026 12:04', enabled: true }) : [];
    case 'taskSchedule':
      return by<Rec[]>(t, { it: list({ name: 'System Health Check', subject: 'System Health Check', scheduleType: 'Daily', frequency: 'Every day', next: 'Tue, Nov 03, 2026 00:00', last: 'Mon, Nov 02, 2026 00:00', enabled: true }),
        facilities: list({ name: 'Fire extinguisher inspection', subject: 'Fire extinguisher inspection', scheduleType: 'Monthly', frequency: '1st of month', next: 'Tue, Dec 01, 2026 09:00', last: 'Sun, Nov 01, 2026 09:00', enabled: true }) }, []);
    case 'surveys':
      return by<Rec[]>(t, { it: list({ sid: 'SUR-10', name: 'IT Service Satisfaction Q3', status: 'Expired', start: 'Tue, Oct 06, 2026 14:35', end: 'Wed, Oct 07, 2026 14:35', owner: 'Nirali Kevlani' }),
        hr: list({ sid: 'SUR-11', name: 'Employee Engagement 2026', status: 'Design', start: 'Mon, Nov 16, 2026 10:00', end: 'Mon, Nov 30, 2026 10:00', owner: 'Meera Joshi' }),
        facilities: list({ sid: 'SUR-12', name: 'Cafeteria Food Survey', status: 'Live', start: 'Wed, Jul 22, 2026 12:15', end: 'Wed, Jul 29, 2026 12:15', owner: 'Kavita Bhatt' }) }, []);
    case 'scheduleSurvey':
      return t === 'facilities' ? list({ name: 'SRS-1: Food Survey', status: 'Launched', scheduleType: 'Once', next: '---', last: 'Wed, Jul 22, 2026 12:15', enabled: true }) : [];
    case 'response':
      return by<Rec[]>(t, { it: list({ name: 'Request Received', createdBy: 'Keya · Wed, Aug 05, 2026 11:40', updatedBy: 'Stuti · Fri, Sep 25, 2026 13:30', enabled: true, content: 'Hi ${requester}, we have received your request ${id} and will get back to you shortly.' },
        { name: 'Will Get Back', createdBy: 'Nirali Kevlani · Fri, Sep 04, 2026 13:12', updatedBy: 'Stuti · Fri, Sep 25, 2026 13:31', enabled: true, content: 'We are looking into this and will get back to you.' },
        { name: 'Internet Issue', createdBy: 'Stuti · Mon, Sep 14, 2026 15:47', updatedBy: 'Stuti · Mon, Sep 14, 2026 15:56', enabled: true, content: 'Please restart your router and confirm whether the issue persists.' }),
        hr: list({ name: 'Leave balance reply', createdBy: 'Meera Joshi · Mon, Oct 26, 2026 11:00', updatedBy: 'Meera Joshi · Mon, Oct 26, 2026 11:00', enabled: true, content: 'Your current leave balance is available on the HR portal under My Leave.' }) }, []);
    case 'print': case 'printChange':
      if (tab === 'support') return list({ name: 'Standard', description: 'Standard Print Template', enabled: true, isDefault: true });
      return list({ name: 'Standard', description: 'Standard Print Template', enabled: true, isDefault: !it }, ...(it ? [{ name: 'Custom Template', description: 'Custom template for printing the request details.', enabled: true, isDefault: true }] : []));
    case 'templates':
      if (tab === 'request') return by<Rec[]>(t, { it: list({ name: 'Major Incident', description: 'Template for incidents causing significant business impact or widespread disruption.', enabled: true },
        { name: 'Network Connectivity Issue', description: 'Template for incidents involving loss of internet, intranet, or shared network access.', enabled: true },
        { name: 'Laptop Performance Degradation', description: 'Template for cases where a laptop operates slowly, lags, or responds poorly.', enabled: true },
        { name: 'Password Reset', description: 'Template for resetting a forgotten or expired password.', enabled: true }),
        hr: list({ name: 'New Joiner', description: 'Everything HR needs for a new joiner.', enabled: true }, { name: 'Payroll Query', description: 'Questions about salary, deductions or payslips.', enabled: true }),
        facilities: list({ name: 'Room Booking', description: 'Book a meeting room or event space.', enabled: true }) }, []);
      return [];
    case 'model': return [];
    case 'formRule':
      return tab === 'task' && it ? list({ name: 'Mandate Technician Group', executionOn: 'On Create and Edit', applicableFor: 'All Users', event: 'On Form Load', created: 'Thu, Oct 08, 2026 14:00', enabled: true }) : [];
    case 'status':
      if (tab === 'request') return it ? REQUEST_STATUSES : list(
        { name: 'Open', colour: '#FACC15', sla: true, uc: false, isDefault: true, system: true }, { name: 'In Progress', colour: '#3B82F6', sla: true, uc: false, isDefault: false },
        { name: 'Pending', colour: '#F97316', sla: false, uc: false, isDefault: false }, { name: t === 'hr' ? 'Awaiting Documents' : 'Waiting on Requester', colour: '#F59E0B', sla: false, uc: false, isDefault: false },
        { name: 'Resolved', colour: '#22C55E', final: true, system: true }, { name: 'Closed', colour: '#64748B', final: true, system: true });
      if (tab === 'task') return list({ name: 'Open', colour: '#FACC15', sla: true, uc: false, isDefault: true, system: true }, { name: 'In Progress', colour: '#3B82F6', sla: true, uc: false, isDefault: false },
        { name: 'Pending', colour: '#F97316', sla: false, uc: false, isDefault: false }, { name: 'Rejected', colour: '#EF4444', sla: false, uc: false, isDefault: false },
        { name: 'On Hold', colour: '#94A3B8', sla: false, uc: false, isDefault: false }, { name: 'Resolved', colour: '#22C55E', final: true, system: true }, { name: 'Closed', colour: '#64748B', final: true, system: true });
      return list({ name: 'Open', colour: '#FACC15', sla: true, uc: false, isDefault: true, system: true }, { name: 'In Progress', colour: '#3B82F6', sla: true, uc: false, isDefault: false },
        { name: 'Resolved', colour: '#22C55E', final: true, system: true }, { name: 'Closed', colour: '#64748B', final: true, system: true });
    case 'category':
      if (tab === 'request') {
        if (it) return list({ name: 'Software Installation', colour: '#CBD5E1' }, { name: 'Software', colour: '#8B5CF6', children: ['Operating System', 'Office Suite'] }, { name: 'Hardware', colour: '#3B82F6' },
          { name: 'Network', colour: '#14B8A6' }, { name: 'Other', colour: '#64748B' }, { name: 'Documentation', colour: '#CBD5E1' }, { name: 'Server Issue', colour: '#CBD5E1' },
          { name: 'Software Bug', colour: '#CBD5E1' }, { name: 'User Support', colour: '#CBD5E1' }, { name: 'Authentication Failure', colour: '#CBD5E1' });
        const seed = ws ? ws.setup.requestTypes.map((r) => r.name) : [];
        return seed.map((name, i) => ({ id: i + 1, name, colour: STATUS_COLOURS[i % STATUS_COLOURS.length] }));
      }
      if (tab === 'problem') return list({ name: 'General', colour: '#CBD5E1' }, { name: 'Software', colour: '#8B5CF6' }, { name: 'Network', colour: '#14B8A6' }, { name: 'IT Administration', colour: '#3B82F6' });
      return [];
    case 'values':
      switch (tab) {
        case 'task_type': return it ? names('Implementation', 'Install/Uninstall', 'Maintainance', 'Planning', 'Release', 'Replacement/Repair', 'Testing', 'Troubleshooting', 'Milestone', 'Quality Assurance')
          : by<Rec[]>(t, { hr: names('Document Verification', 'Background Check', 'Induction'), facilities: names('Inspection', 'Repair', 'Cleaning') }, names('Follow-up', 'Review'));
        case 'change_type': return names('Standard', 'Emergency', 'Normal');
        case 'target_environment': return names('Production', 'Development', 'Test', 'Analysis');
        case 'change_risk': case 'release_risk': return names('Low', 'Medium', 'High', 'Critical');
        case 'change_reason': case 'release_reason': return names('New Rollout', 'Upgrade Existing Technology', 'Upgrade Configuration', 'Update Maintenance', 'Update Server Upgrade');
        case 'release_type': return names('Minor', 'Major', 'Emergency');
      }
      return [];
    case 'emails':
      if (tab === 'outgoing') return list({ name: 'Company SMTP', email: 'servicedesk@acme.example', protocol: 'SMTP', server: 'smtp.acme.example', port: '587', security: 'TLS', enabled: true, primary: true });
      if (tab === 'incoming') return by<Rec[]>(t, { it: list({ name: 'IT Helpdesk Mailbox', email: 'it-support@acme.example', protocol: 'imap', server: 'imap.acme.example', port: '993', security: 'TLS', group: 'IT Support Group', category: 'Hardware', enabled: true, primary: true }) }, []);
      return [];
    case 'catalog': {
      const c = CATALOG[t];
      if (!c) return [];
      return c.services.map(([name, category], i) => ({ id: i + 1, name, category }));
    }
    case 'form': {
      if (tab === 'feedback') return it ? CUSTOM_FIELDS.feedback.it! : list({ name: 'How satisfied are you?', type: 'Rating' }, { name: 'Comments', type: 'Text Area' });
      return (CUSTOM_FIELDS[tab]?.[t] ?? []).map((r) => ({ ...r }));
    }
  }
  return [];
}

export const catalogCategories = (ws?: Workspace) => (ws ? CATALOG[ws.type]?.categories ?? [ws.name] : []);

/** Settings pages (one value per key) — the live defaults. */
export function seedSettings(page: string, tab: string, ws?: Workspace): Record<string, unknown> {
  const it = ws?.type === 'it';
  switch (page) {
    case 'assignment': return { strategy: 'Manual' };
    case 'feedback': return { onlyOne: false, resolved: true, closed: true, manual: true };
    case 'matrix': return {
      enabled: true,
      grid: [['Low', 'Low', 'Medium', 'Medium'], ['Low', 'Low', 'Medium', 'High'], ['Medium', 'Medium', 'High', 'Urgent'], ['Medium', 'High', 'Urgent', 'Urgent']],
    };
    case 'pref':
      if (tab === 'request_preference') return { guestOnBehalf: true, lastConversation: false, receivedAsFirstResponse: false, mergeStatus: 'Closed', supportLevel: 'Tier 0' };
      if (tab === 'task_preference') return { reopenClosed: false, deleteTask: false };
      if (tab === 'user_preference') return { welcomeGuest: false, dnd: false, approvalAsset: false, approvalCi: false };
      return {};
    case 'rules': return { interaction: [], mandatory: it && tab === 'incident' ? ['Solution'] : [], state: [] };
  }
  return {};
}
