/* F05 · Data privacy between workspaces — the ONE rule for "who can see a ticket, and why" (prototype stand-in for the
 * server check that every way in must apply: /api/*, /api/cportal/*, search, reports, AI, exports).
 * Features/F05-data-privacy-between-workspaces.md §5.1. Checked top to bottom:
 *   R1 Super Admin                       → every workspace, except confidential ones they are not a member of
 *   R2 Global › Manage All Workspaces    → same (Organization Admin)
 *   R3 member of the ticket's workspace  → needs Request permission there, then their Scope there decides
 *   otherwise                            → hidden ("request does not exist.", 404) — sub-records follow the parent. */

import { accessOf, roleMapOf, scopeLabel, seedFor, TECHNICIANS } from './workspaceData';
import type { Workspace, WorkspaceStore } from './workspaceData';
import { canGlobal, isSuperAdmin, ticketModulesIn } from './rolesData';

export interface TicketPlacement { workspaceId: number; groupName: string; technicianId: number }

/* Which workspace each demo ticket lives in (deterministic by position), with subjects that fit the team. */
const HR = ['Payslip query: overtime missing', 'Leave balance correction', 'Employment letter for visa', 'Update bank details', 'Harassment complaint (confidential)', 'Benefits enrolment'];
const FAC = ['AC not working in room 4', 'Desk move to 3rd floor', 'Access card not working', 'Book a meeting room for Friday'];
const FIN = ['Expense claim: client visit', 'Reimbursement status', 'Vendor payment pending'];
const LEGAL = ['NDA for new supplier', 'Contract review: cloud vendor'];
export function placeFor(i: number): { workspaceId: number; subject?: string } {
  const k = i % 13;
  if (i === 25 || i === 51) return { workspaceId: 5, subject: LEGAL[i === 25 ? 0 : 1] };
  if (k === 7 || k === 8 || k === 9) return { workspaceId: 2, subject: HR[(i + k) % HR.length] };
  if (k === 10 || k === 11) return { workspaceId: 3, subject: FAC[i % FAC.length] };
  if (k === 12) return { workspaceId: 4, subject: FIN[i % FIN.length] };
  return { workspaceId: 1 };
}
/** Group + assignee for a ticket, from the seeded team of its workspace (members whose groups include it). */
export function assigneeFor(i: number, workspaceId: number): { groupName: string; technicianId: number; name: string; initials: string } {
  const w = seedFor('four').find((x) => x.id === workspaceId)!;
  const groupName = w.setup.groups[i % Math.max(1, w.setup.groups.length)] ?? w.name;
  const inGroup = w.setup.memberIds.filter((id) => (w.setup.access[id]?.groups ?? []).includes(groupName));
  const pool = inGroup.length ? inGroup : w.setup.memberIds;
  const technicianId = pool[i % pool.length];
  const name = TECHNICIANS.find((t) => t.id === technicianId)?.name ?? 'Unassigned';
  return { groupName, technicianId, name, initials: name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() };
}

export interface Verdict { ok: boolean; why: string }

/** Can person `viewAs` open this ticket? */
export function canSeeTicket(store: WorkspaceStore, viewAs: number, t: TicketPlacement): Verdict {
  const w = store.workspaces.find((x) => x.id === t.workspaceId);
  if (!w) return { ok: false, why: 'Workspace not found.' };
  const m = roleMapOf(viewAs);
  const member = w.setup.memberIds.includes(viewAs);
  const walled = !!w.confidential && !member;
  if (isSuperAdmin(m)) return walled ? { ok: false, why: `${w.name} is confidential: only its members see its tickets, even Super Admin.` } : { ok: true, why: 'Super Admin: every workspace except confidential ones.' };
  if (canGlobal(m, 'Manage All Workspaces')) return walled ? { ok: false, why: `${w.name} is confidential: only its members see its tickets.` } : { ok: true, why: 'Manage All Workspaces: every workspace except confidential ones.' };
  if (!member) return { ok: false, why: `Not a member of ${w.name}.` };
  if (!ticketModulesIn(m, w.id).includes('Request')) return { ok: false, why: `No Request permission in ${w.name}.` };
  const a = accessOf(w, viewAs);
  const mine = t.technicianId === viewAs;
  const inGroup = a.groups.includes(t.groupName);
  switch (a.scope) {
    case 'global': return { ok: true, why: `Member of ${w.name} · Global Access.` };
    case 'global_restricted': return { ok: true, why: `Member of ${w.name} · Global Restricted (can see all; edit only own or group's).` };
    case 'group': return mine || inGroup ? { ok: true, why: `Member of ${w.name} · Group Access (${mine ? 'assigned to them' : `group ${t.groupName}`}).` } : { ok: false, why: `Group Access in ${w.name}: not their group (${t.groupName}) and not assigned to them.` };
    case 'restricted': return mine ? { ok: true, why: `Member of ${w.name} · Restricted (assigned to them).` } : { ok: false, why: `Restricted in ${w.name}: only tickets assigned to them.` };
    default: return mine || inGroup ? { ok: true, why: `Member of ${w.name} · ${scopeLabel(a)}.` } : { ok: false, why: `${scopeLabel(a)} in ${w.name} does not match.` };
  }
}

/** Workspaces a person can see at least something in — for the Workspace filter. */
export const visibleWorkspaces = (store: WorkspaceStore, viewAs: number, tickets: TicketPlacement[]): Workspace[] =>
  store.workspaces.filter((w) => tickets.some((t) => t.workspaceId === w.id && canSeeTicket(store, viewAs, t).ok));
