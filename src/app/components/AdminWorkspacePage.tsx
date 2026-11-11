import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight, CirclePause, CirclePlay, History, Info, Lock, MoreHorizontal, Pencil, Rocket, Search, Settings2, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { DefaultTag, StatusPill, WorkspaceIcon, initials, primaryBtn, secondaryBtn } from './workspaceUi';
import { STATUS_HELP, TYPE_LABEL, accessOf, adminIdsOf, canGiveRole, canIn, membershipsOf, scopeLabel, technicianById } from './workspaceData';
import type { MemberAccess, OrgAdmin, ViewAs, Workspace } from './workspaceData';
import { AccessEditor } from './WorkspaceAccessSection';
import { ConfidentialRow, PortalAccessRow } from './WorkspacePrivacyRows';
import type { PortalAccess } from './workspaceData';
import { canWorkspace } from './rolesData';

/* The workspace RECORD page — #/admin/organization/workspace/<id> · <id>/team · <id>/audit. ESM F01 + F02/F03.
 *
 * Shaped like Freshservice's workspace page [VERIFIED frenchfries, 2026-10-28]: a header with the
 * workspace's icon, name, type and status, Edit and a ⋯ menu; then its people. Tabs:
 *   Overview   details. Setup lives only inside the workspace (its settings home), never here.
 *   Team       sections Workspace Admins · Technicians; each person a card: their ROLES (the person's, read-only
 *              here: they count in every workspace) · groups and scope HERE. ✎ opens the same Groups · Scope ·
 *              Workspace roles editor as the technician form (roles only with Assign Roles in Workspace, F03e). Adding =
 *              AddTechniciansDrawer. Organization Admins as one footer line. (F03 rethink, 2026-11-03)
 *   Audit Log  every change to this workspace
 * Each control follows one tick box of the viewer's roles in THIS workspace (F03d): Edit = Edit Workspace Details ·
 * Go Live / Deactivate / Reactivate = Change Workspace Status · Team add / edit / remove = Manage Workspace Team (giving
 * roles here = Assign Roles in Workspace, never above their own) · Audit Log tab = View Workspace Audit Log · Delete =
 * Manage Workspaces (Organization). A person with only Workspace Settings sees this page read-only. */

export type WorkspaceAction = 'live' | 'inactive' | 'reactivate' | 'delete';
export type WorkspaceTab = 'overview' | 'team' | 'audit';

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
      <div>
        <div className="text-[13px] font-medium text-[#364658]">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] leading-[1.5] text-[#94A3B8]">{hint}</div>}
      </div>
      <div className="min-w-0 text-[14px] text-[#364658]">{children}</div>
    </div>
  );
}

function Card({ title, sub, action, children, tone, icon }: { title: string; sub?: ReactNode; action?: ReactNode; children?: ReactNode; tone?: 'danger'; icon?: ReactNode }) {
  return (
    <section className={`overflow-hidden rounded-xl border bg-white ${tone === 'danger' ? 'border-[#FECACA]' : 'border-[#E5E7EB]'}`}>
      <div className={`flex items-center justify-between gap-4 px-6 py-4 ${children ? 'border-b border-[#EEF1F5]' : ''}`}>
        <div className="flex min-w-0 items-start gap-3">
          {icon && <span className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]">{icon}</span>}
          <div className="min-w-0">
            <h2 className={`text-[15px] font-semibold ${tone === 'danger' ? 'text-[#B91C1C]' : 'text-[#1F2D3D]'}`}>{title}</h2>
            {sub && <div className="mt-0.5 text-[13px] text-[#7B8FA5]">{sub}</div>}
          </div>
        </div>
        {action}
      </div>
      {children && <div className="divide-y divide-[#F1F4F8]">{children}</div>}
    </section>
  );
}

const Avatar = ({ name, size = 9 }: { name: string; size?: number }) => (
  <span className={`flex size-${size} flex-shrink-0 items-center justify-center rounded-full bg-[#E0ECF8] text-[12px] font-semibold text-[#36577A]`}>{initials(name)}</span>
);
const chip = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px]';

/** A disabled action that still explains itself. */
function Gate({ allowed, reason, children }: { allowed: boolean; reason: string; children: ReactNode }) {
  if (allowed) return <>{children}</>;
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild><span className="inline-flex cursor-not-allowed [&>*]:pointer-events-none [&>*]:opacity-50">{children}</span></TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-wrap">{reason}</TooltipContent>
    </Tooltip>
  );
}

interface AdminWorkspacePageProps {
  workspace: Workspace;
  viewAs: ViewAs;
  tab: WorkspaceTab;
  onTab: (tab: WorkspaceTab) => void;
  onBack: () => void;
  onConfigure: () => void;
  onEdit: () => void;
  onAction: (kind: WorkspaceAction) => void;
  workspaces: Workspace[];
  onAddMembers: () => void;
  orgAdmins: OrgAdmin[];
  /** Inline edit of one member's access. The module refuses a change that leaves no Workspace Admin. */
  onChangeAccess: (id: number, access: MemberAccess) => void;
  onRemoveMembers: (ids: number[]) => void;
  onOpenTechnician: (id: number) => void;
  /** F05 / F02a §9: change Confidential or Portal Access (audited by the module). */
  onPatch: (patch: { confidential?: boolean; portalAccess?: PortalAccess }, audit: string) => void;
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function AdminWorkspacePage(p: AdminWorkspacePageProps) {
  const { workspace: w, viewAs, onTab } = p;
  const can = (label: string) => canIn(viewAs, w, label);
  const canEdit = can('Edit Workspace Details');
  const canStatus = can('Change Workspace Status');
  const canTeam = can('Manage Workspace Team');
  const canRemoveWs = can('Manage Workspaces');
  const tab: WorkspaceTab = p.tab === 'audit' && !can('View Workspace Audit Log') ? 'overview' : p.tab;
  const admins = adminIdsOf(w);
  const canDelete = canRemoveWs && !w.isDefault && w.ticketCount === 0;
  const typeLocked = w.isDefault || w.status !== 'setup';
  const TABS: { id: WorkspaceTab; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: 'Overview', icon: Info }, { id: 'team', label: 'Team', icon: Users },
    ...(can('View Workspace Audit Log') ? [{ id: 'audit' as const, label: 'Audit Log', icon: History }] : []),
  ];
  const [teamQ, setTeamQ] = useState('');
  const [editing, setEditing] = useState<{ id: number; access: MemberAccess } | null>(null);
  const matchQ = (id: number) => { const t = technicianById(id); return !teamQ.trim() || `${t?.name} ${t?.email}`.toLowerCase().includes(teamQ.trim().toLowerCase()); };
  const byName = (a: number, b: number) => (technicianById(a)?.name ?? '').localeCompare(technicianById(b)?.name ?? '');
  const adminRows = admins.filter(matchQ).sort(byName);
  const techRows = w.setup.memberIds.filter((id) => !admins.includes(id) && matchQ(id)).sort(byName);
  const menuItem = 'cursor-pointer text-[13px]';

  return (
    <div className="min-h-full bg-[#F7F9FB]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 pt-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px]">
          <button onClick={p.onBack} className="text-[13px] text-[#3D8BD0] hover:underline">Workspaces</button>
          <ChevronRight size={14} className="text-[#94A3B8]" />
          <span className="truncate text-[#64748B]">{w.name}</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <WorkspaceIcon type={w.type} colour={w.colour} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[22px] font-semibold text-[#1F2D3D]">{w.name}</h1>
              {w.isDefault && <DefaultTag />}
              <StatusPill status={w.status} />
            </div>
            <p className="mt-0.5 text-[13px] text-[#64748B]">{TYPE_LABEL[w.type]} workspace · Created {fmtDate(w.createdOn)}</p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <button onClick={p.onConfigure} className={secondaryBtn}><Settings2 size={15} /> Workspace Settings</button>
            {canEdit && <button onClick={p.onEdit} className={secondaryBtn}><Pencil size={14} /> Edit</button>}
            {canStatus && w.status === 'setup' && <button onClick={() => p.onAction('live')} className={primaryBtn}><Rocket size={15} /> Go Live</button>}
            {canStatus && w.status === 'inactive' && <button onClick={() => p.onAction('reactivate')} className={primaryBtn}><CirclePlay size={15} /> Reactivate</button>}
            {(canStatus || canRemoveWs) && !w.isDefault && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="More actions" className="flex size-9 items-center justify-center rounded-lg border border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]"><MoreHorizontal size={17} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  {canStatus && w.status === 'live' && <DropdownMenuItem className={menuItem} onSelect={() => p.onAction('inactive')}><CirclePause size={14} /> Deactivate</DropdownMenuItem>}
                  {canStatus && w.status === 'inactive' && <DropdownMenuItem className={menuItem} onSelect={() => p.onAction('reactivate')}><CirclePlay size={14} /> Reactivate</DropdownMenuItem>}
                  {canRemoveWs && <DropdownMenuItem className={`${menuItem} text-[#DC2626] focus:text-[#DC2626]`} disabled={!canDelete} onSelect={() => p.onAction('delete')}><X size={14} /> Delete{!canDelete && <span className="ml-auto text-[11px] text-[#94A3B8]">has tickets</span>}</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div role="tablist" className="mt-4 flex gap-2.5">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => onTab(t.id)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${tab === t.id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'}`}
            ><t.icon size={15} />{t.label}</button>
          ))}
        </div>
      </div>

      <div key={tab} className="mx-auto max-w-[1180px] space-y-5 px-6 py-6 animate-in fade-in duration-200">
        {tab === 'overview' && (
          <>
            {w.status === 'inactive' && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-6 py-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B]"><CirclePause size={18} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-[#1F2D3D]">Inactive since {w.inactiveSince ? fmtDate(w.inactiveSince) : 'deactivation'}</h2>
                  <p className="text-[13px] text-[#64748B]">It takes no new requests. Its records are kept and can still be read.</p>
                </div>
                {canStatus && <button onClick={() => p.onAction('reactivate')} className={primaryBtn}><CirclePlay size={15} /> Reactivate</button>}
              </div>
            )}

            <Card title="Workspace details" sub="Who this workspace is for and who administers it." action={canEdit ? <button onClick={p.onEdit} className={secondaryBtn}><Pencil size={14} /> Edit</button> : undefined}>
              <Row label="Workspace Name">{w.name}</Row>
              <Row label="Description">{w.description || <span className="text-[#94A3B8]">No description</span>}</Row>
              <Row label="Workspace Type" hint={typeLocked ? 'Locked once the workspace has gone Live.' : 'Can still change while in Setup.'}>
                <span className="inline-flex items-center gap-2">{TYPE_LABEL[w.type]}{typeLocked && <Lock size={12} className="text-[#94A3B8]" />}</span>
              </Row>
              <Row label="Workspace Admins" hint="Members given a role with admin permissions in this workspace (e.g. Workspace Admin).">
                <div className="flex flex-wrap items-center gap-2">
                  {admins.map((id) => {
                    const t = technicianById(id)!;
                    return (
                      <span key={id} className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white py-1 pl-1 pr-3">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#E0ECF8] text-[10px] font-semibold text-[#36577A]">{initials(t.name)}</span>
                        <span className="text-[13px]">{t.name}</span>
                      </span>
                    );
                  })}
                  <button onClick={() => onTab('team')} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">Manage in Team</button>
                </div>
              </Row>
              <Row label="Confidential" hint="Only members see its tickets and settings. Super Admin and Organization Admins too.">
                <ConfidentialRow w={w} viewAs={viewAs} canEdit={canEdit} onChange={(on) => p.onPatch({ confidential: on }, on ? 'Made the workspace confidential: only members see its tickets and settings' : 'Turned confidential off')} />
              </Row>
              <Row label="Portal Access" hint="Which employees see this workspace on the Support Portal.">
                <PortalAccessRow w={w} canEdit={canEdit} onChange={(pa) => p.onPatch({ portalAccess: pa }, `Changed Portal Access: ${pa.mode === 'groups' ? 'only ' + pa.groups.join(', ') : pa.mode === 'public' ? 'Public' : 'all logged-in users'}${pa.except.length ? ' except ' + pa.except.join(', ') : ''}`)} />
              </Row>
              <Row label="Created">{fmtDate(w.createdOn)}</Row>
              <Row label="Status" hint={STATUS_HELP[w.status]}>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill status={w.status} />
                  {w.isDefault && <span className="text-[12px] text-[#94A3B8]">The default IT workspace is always Live.</span>}
                  {!canStatus && !w.isDefault && <span className="text-[12px] text-[#94A3B8]">Your roles here don’t include Change Workspace Status.</span>}
                </div>
              </Row>
            </Card>

          </>
        )}

        {tab === 'team' && (() => {
          const person = (id: number) => {
            const t = technicianById(id);
            if (!t) return null;
            const a = accessOf(w, id);
            const isEditing = editing?.id === id;
            const lockAdmin = admins.length === 1 && admins[0] === id;
            const editable = canTeam;
            const others = membershipsOf(p.workspaces, id).filter((m) => m.w.id !== w.id);
            return (
              <div key={id} className={`group/card rounded-lg border bg-white transition-shadow ${isEditing ? 'border-[#93C5FD] shadow-sm' : 'border-[#E5E7EB] hover:shadow-sm'}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => p.onOpenTechnician(id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar name={t.name} size={9} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2"><span className="truncate text-[14px] font-medium text-[#1F2D3D] hover:text-[#3D8BD0]">{t.name}</span>{(a.roles ?? []).map((r) => <span key={r} className={`${chip} border-[#E9D5FF] bg-[#FAF5FF] text-[#6B21A8]`}>{r}</span>)}{t.disabled && <span className={`${chip} border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]`}>Disabled</span>}</span>
                      <span className="block truncate text-[12px] text-[#64748B]">
                        {scopeLabel(a)}{' · '}{a.groups.length ? a.groups.join(', ') : <span className="text-[#B45309]">no group</span>}
                      </span>
                      {others.length > 0 && <span className="block truncate text-[11px] text-[#94A3B8]">Also in {others.map((m) => m.w.name).join(', ')}</span>}
                    </span>
                  </button>
                  {editable && !isEditing && (
                    <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
                      <button onClick={() => setEditing({ id, access: { ...a } })} aria-label={`Edit ${t.name}'s access`} className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] hover:text-[#3D8BD0]"><Pencil size={14} /></button>
                      {lockAdmin
                        ? <Gate allowed={false} reason="The only Workspace Admin can’t be removed. Make someone else an admin first."><button aria-label={`Remove ${t.name}`} className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B]"><X size={14} /></button></Gate>
                        : <button onClick={() => p.onRemoveMembers([id])} aria-label={`Remove ${t.name}`} className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] hover:border-[#FECACA] hover:text-[#DC2626]"><X size={14} /></button>}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <div className="border-t border-[#EEF1F5] px-4 py-4 animate-in fade-in duration-150">
                    <AccessEditor w={w} a={editing.access} onChange={(next) => setEditing({ id, access: next })} canGive={(r) => canGiveRole(viewAs, w, r)} />
                    <p className="mt-3 text-[12px] text-[#94A3B8]">Roles here count in {w.name}; a role’s Admin › Global part also gives Organization settings, so you can only give roles within your own permissions.</p>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      {lockAdmin && !canWorkspace({ [w.id]: editing.access.roles ?? [] }, w.id, 'Assign Roles in Workspace') && <span className="mr-auto text-[12px] text-[#DC2626]">They are the only one here who can give roles: keep such a role.</span>}
                      <button onClick={() => setEditing(null)} className="h-8 rounded px-3 text-[13px] text-[#64748B] hover:bg-[#F5F7FA]">Cancel</button>
                      <button disabled={lockAdmin && !canWorkspace({ [w.id]: editing.access.roles ?? [] }, w.id, 'Assign Roles in Workspace')} onClick={() => { p.onChangeAccess(id, editing.access); setEditing(null); }} className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0] disabled:opacity-40">Save</button>
                    </div>
                  </div>
                )}
              </div>
            );
          };
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-[280px] max-w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input value={teamQ} onChange={(e) => setTeamQ(e.target.value)} placeholder="Search the team" aria-label="Search the team" className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-8 pr-3 text-[13px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
                </div>
                {canTeam && <button onClick={p.onAddMembers} className={`${primaryBtn} ml-auto`}><UserPlus size={15} /> Add Technicians</button>}
              </div>

              <section>
                <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#1F2D3D]">Workspace Admins <span className="rounded-full bg-[#F3E8FF] px-2 text-[11px] font-semibold text-[#6B21A8]">{admins.length}</span></h2>
                <p className="mb-2.5 mt-0.5 text-[12px] text-[#7B8FA5]">Given a role with admin permissions in {w.name}; what they can change follows that role’s tick boxes.</p>
                <div className="space-y-2">{adminRows.map(person)}</div>
              </section>

              <section>
                <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#1F2D3D]">Technicians <span className="rounded-full bg-[#EBF5FF] px-2 text-[11px] font-semibold text-[#1F5F99]">{w.setup.memberIds.length - admins.length}</span></h2>
                <p className="mb-2.5 mt-0.5 text-[12px] text-[#7B8FA5]">Work on {w.name} requests with the scope and groups shown here, and their own roles.</p>
                <div className="space-y-2">
                  {techRows.map(person)}
                  {techRows.length === 0 && canTeam && (
                    <button onClick={p.onAddMembers} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#DCE3EC] px-4 py-6 text-[13px] text-[#7B8FA5] hover:border-[#93C5FD] hover:text-[#3D8BD0]">
                      <UserPlus size={16} /> {teamQ ? 'No one matches.' : `Add the technicians who work on ${w.name} requests`}
                    </button>
                  )}
                </div>
              </section>

              <p className="flex flex-wrap items-center gap-2 border-t border-[#EEF1F5] pt-3 text-[12px] text-[#64748B]">
                <ShieldCheck size={14} className="text-[#6B21A8]" /> Organization Admins also manage {w.name} without being members:
                {p.orgAdmins.map(({ id }) => <span key={id} className="font-medium text-[#364658]">{technicianById(id)?.name}</span>)}
              </p>
            </div>
          );
        })()}

        {tab === 'audit' && (
          <Card icon={<History size={16} />} title="Audit Log" sub={`Every change to ${w.name}: team, settings and status.`}>
            {[...w.audit].reverse().map((e, i) => {
              const by = technicianById(e.by);
              return (
                <div key={i} className="flex items-start gap-3 px-6 py-3.5">
                  <Avatar name={by?.name ?? '?'} size={8} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-[#364658]"><strong className="font-semibold text-[#1F2D3D]">{by?.name ?? 'System'}</strong> {e.text.charAt(0).toLowerCase() + e.text.slice(1)}</div>
                    <div className="text-[12px] text-[#94A3B8]">{new Date(e.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
