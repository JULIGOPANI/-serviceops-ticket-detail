/* What a desk's OWN admin contains — the menu and home grid you get after switching to a desk.
 * ESM F01 (Juli, 2026-10-16).
 *
 * Switching to a desk is like entering its own instance: Freshservice opens the workspace's own admin
 * home (/ws/<id>/admin/home), ManageEngine the instance's Setup (/app/<instance>/AdminHome.do) — both
 * seen live 2026-10-16, Features/F01-service-desk.md §2c. The groups below follow those two products,
 * in ServiceOps' own words. ⚠️ PROVISIONAL: which settings each desk really owns is decided in F04.
 *
 * `action` = an item that has a screen in this prototype already; the rest name the feature that
 * designs them. */

export type DeskAdminAction = 'details' | 'team' | 'groups' | 'requests' | 'email' | 'portal';

export interface DeskAdminItem { title: string; desc: string; feature: string; action?: DeskAdminAction }
export interface DeskAdminGroup { title: string; desc: string; icon: string; items: DeskAdminItem[] }

export const DESK_ADMIN: DeskAdminGroup[] = [
  {
    title: 'Desk', desc: 'This desk’s details, team and history', icon: 'LayoutTemplate',
    items: [
      { title: 'Desk details', desc: 'Name, short code, owners and status', feature: 'F01', action: 'details' },
      { title: 'Team', desc: 'Technicians who work in this desk', feature: 'F02', action: 'team' },
      { title: 'Audit Log', desc: 'Every change made to this desk’s settings', feature: 'F25' },
    ],
  },
  {
    title: 'Users', desc: 'Groups and how requests are assigned', icon: 'Users',
    items: [
      { title: 'Technician Groups', desc: 'Teams that requests are assigned to', feature: 'F11', action: 'groups' },
      { title: 'Auto Assignment', desc: 'Round robin or load balancing for this desk', feature: 'F11' },
    ],
  },
  {
    title: 'Channels', desc: 'How employees reach this desk', icon: 'Mail',
    items: [
      { title: 'Support Email', desc: 'The mailbox whose emails become this desk’s requests', feature: 'F15', action: 'email' },
      { title: 'Support Portal', desc: 'Whether this desk shows on the Support Portal', feature: 'F18', action: 'portal' },
    ],
  },
  {
    title: 'Service Management', desc: 'How this desk handles requests', icon: 'Headset',
    items: [
      { title: 'Categories', desc: 'What employees can ask for', feature: 'F10', action: 'requests' },
      { title: 'Business Hours', desc: 'When this team works', feature: 'F12' },
      { title: 'SLA', desc: 'Response and resolution targets', feature: 'F12' },
      { title: 'Request Templates', desc: 'Pre-filled forms for common requests', feature: 'F10' },
      { title: 'Form Rules', desc: 'Show, hide or require fields', feature: 'F10' },
      { title: 'Closure Rules', desc: 'What must be done before closing', feature: 'F10' },
      { title: 'Surveys', desc: 'Satisfaction after a request is resolved', feature: 'F10' },
    ],
  },
  {
    title: 'Service Catalog', desc: 'Ready-made requests employees can pick', icon: 'Package',
    items: [{ title: 'Service Catalog', desc: 'Catalog items and their forms', feature: 'F09' }],
  },
  {
    title: 'Automation', desc: 'What happens automatically', icon: 'Workflow',
    items: [
      { title: 'Workflows', desc: 'Rules that route and act on requests', feature: 'F13' },
      { title: 'Approval Workflows', desc: 'Who approves what', feature: 'F14' },
      { title: 'Scenarios', desc: 'Several actions in one click', feature: 'F13' },
      { title: 'Schedules', desc: 'Recurring requests and tasks', feature: 'F13' },
    ],
  },
  {
    title: 'Knowledge', desc: 'Answers employees can find themselves', icon: 'BookOpen',
    items: [{ title: 'Knowledge Base', desc: 'Articles and who can see them', feature: 'F16' }],
  },
  {
    title: 'Notifications', desc: 'Who is told what, and when', icon: 'Bell',
    items: [{ title: 'Email Notifications', desc: 'Messages sent for this desk’s requests', feature: 'F15' }],
  },
];

/** Where an item lives, as the segment after `organization/desk/`. Drawers have addresses too, so
 *  the desk's left menu and its home grid open exactly the same thing. */
export const actionPath = (id: number, action: DeskAdminAction): string =>
  ({ details: `${id}/details`, team: `${id}/members`, groups: `${id}/do/team`, requests: `${id}/do/requests`, email: `${id}/do/reach`, portal: `${id}/do/reach` })[action];
