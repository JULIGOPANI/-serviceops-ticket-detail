/* What a workspace's OWN admin contains — the menu and home you get inside a workspace. ESM F01.
 *
 * ⚠️ Never invent modules here (Juli, 2026-10-28). A workspace's admin is the SAME ServiceOps admin —
 * same section names, card titles, descriptions and icons, taken from adminData.ts — narrowed to the
 * settings that belong to one workspace. Everything else stays in the organization's admin.
 * This is how Freshservice does it [VERIFIED frenchfries.freshservice.com, 2026-10-28]: a workspace's admin
 * home uses the product's own sections (Workspace Settings, User Management, Channels, Service
 * Management, Automation & Productivity…) and simply leaves out global items (agents, roles, portals,
 * plans) and, in a non-IT workspace, IT-only ones (Priority Matrix, Change Management, Status Pages,
 * IT Operations).
 *
 * `itOnly` sections show only in IT-type workspaces. */

import { ADMIN_SECTIONS } from './adminData';
import type { AdminCard } from './adminData';
import type { ViewAs, Workspace } from './workspaceData';
import { canIn, loadStore } from './workspaceData';
import { permissionFor } from './rolesData';
import { scopedCardFor } from './scopedCards';

/** Cards with a working screen in this prototype. Every other card names the real ServiceOps screen. */
/** `p:<slug>` = a ServiceOps admin page from scopedCards.ts, opened locked to this workspace (F04). */
export type WorkspaceAdminAction = 'details' | 'team' | 'audit' | 'groups' | 'requests' | 'reach' | 'hours' | 'sla' | 'portal' | `p:${string}`;

export interface WorkspaceAdminSection { key: string; title: string; desc: string; icon: string; cards: (AdminCard & { action?: WorkspaceAdminAction })[] }

/** Per-workspace subset of the ServiceOps admin, in the live product's section order.
 *  The split is F04 (`Features/F04-admin-settings-split.md` §4, decided 2026-11-02). */
const SCOPE: { section: string; cards: string[]; itOnly?: boolean }[] = [
  { section: 'Automation', cards: ['Workflow', 'SLA', 'Approval Workflow', 'Event Notifications', 'Auto Assignment', 'Scenario', 'Task Schedule'] },
  { section: 'Users', cards: ['Technician Groups'] },
  { section: 'Organization', cards: ['Business Hours', 'System Preference'] },
  { section: 'Support Channels', cards: ['Emails', 'Support Portal'] }, // F18: each workspace has its own Support Portal
  { section: 'User Survey', cards: ['User Surveys', 'Schedule Survey'] },
  { section: 'Request Management', cards: ['Request Form', 'Request Status', 'Request Feedback Setting', 'Response Templates', 'Request Categories', 'Request Templates', 'Feedback Form', 'Service Request Custom Rules', 'Request Form Rule', 'Request Model', 'Print Template'] },
  { section: 'Service Catalog', cards: ['Service Catalog'] },
  { section: 'Knowledge Management', cards: ['Knowledge Custom Rules'] },
  { section: 'Task Management', cards: ['Task Types', 'Task Form', 'Task Form Rule', 'Task Status'] },
  { section: 'Problem Management', cards: [], itOnly: true },
  { section: 'Change Management', cards: [], itOnly: true },
  { section: 'Release Management', cards: [], itOnly: true },
];
/** IT-only cards inside a section every workspace has (Freshservice's HR workspace has no Priority Matrix). */
const IT_ONLY_CARDS = ['Priority Matrix', 'Incident Custom Rules', 'Incident Schedules'];

const ACTIONS: Record<string, WorkspaceAdminAction> = { 'Business Hours': 'hours', SLA: 'sla', 'Support Portal': 'portal' };
const actionFor = (section: string, card: string): WorkspaceAdminAction | undefined => {
  if (ACTIONS[card]) return ACTIONS[card];
  const c = scopedCardFor(section, card);
  return c ? `p:${c.slug}` : undefined;
};

/** The Admin tick box that opens each card (rolesData.permissionFor — one map for Organization and workspace admin). */
export const permissionForCard = (section: string, card: string) => permissionFor(section, card);

/** Where a card holds only PART of the ServiceOps page inside a workspace, its description says which part (F04). */
const DESC: Record<string, string> = {
  'Business Hours': 'This workspace’s calendars. The organization’s calendars can be used here too.',
  'System Preference': 'Request and task preferences for this workspace.',
  Emails: 'Incoming mailboxes whose mail becomes this workspace’s requests.',
  'Support Portal': 'Its team card on the Support Portal and what requesters can do in this team.',
  'Event Notifications': 'Request, task and survey alerts sent from this workspace.',
};

/** A workspace's admin, narrowed to what the viewer's roles allow there (F03d): Workspace Settings tick boxes pick
 *  the cards; the Audit Log card needs View Workspace Audit Log. */
export function workspaceAdminFor(w: Workspace, viewAs: ViewAs = loadStore().viewAs): WorkspaceAdminSection[] {
  const it = w.type === 'it';
  const can = (label?: string) => !label || canIn(viewAs, w, label);
  const own: WorkspaceAdminSection = {
    key: 'workspace', title: 'Workspace', desc: 'Details, team and history of this workspace', icon: 'LayoutTemplate',
    cards: [
      { title: 'Workspace', desc: 'Details and status of this workspace.', icon: 'LayoutTemplate', href: '', action: 'details' },
      { title: 'Team', desc: 'Technicians in this workspace, their role, groups and scope.', icon: 'Users', href: '', action: 'team' },
      ...(can('View Workspace Audit Log') ? [{ title: 'Audit Log', desc: 'Every change made to this workspace.', icon: 'ClipboardList', href: '', action: 'audit' as const }] : []),
    ],
  };
  const sections = SCOPE.filter((s) => it || !s.itOnly).map((s) => {
    const src = ADMIN_SECTIONS.find((x) => x.title === s.section)!;
    const extra = it ? src.cards.filter((c) => IT_ONLY_CARDS.includes(c.title)) : [];
    const cards = s.cards.length ? src.cards.filter((c) => s.cards.includes(c.title) || extra.includes(c)) : src.cards;
    return { key: src.key, title: src.title, desc: src.desc, icon: src.icon, cards: cards.filter((c) => can(permissionForCard(src.title, c.title))).map((c) => ({ ...c, desc: DESC[c.title] ?? c.desc, action: actionFor(src.title, c.title) })) };
  });
  return [own, ...sections.filter((s) => s.cards.length > 0)];
}

/** The workspace's own admin home. ⚠️ `<id>` alone is the workspace RECORD page (opened from the
 *  Workspaces list, global admin); its settings live under `<id>/settings` (Juli, 2026-10-27). */
export const settingsPath = (id: number) => `${id}/settings`;

/** Where an action lives, as the segment after `organization/workspace/`. */
export const actionPath = (id: number, action: WorkspaceAdminAction): string => {
  if (action === 'details') return `${id}`;
  if (action === 'team' || action === 'audit') return `${id}/${action}`;
  if (action.startsWith('p:')) return `${id}/settings/do/${action.slice(2)}`;
  return `${id}/settings/do/${action}`;
};
