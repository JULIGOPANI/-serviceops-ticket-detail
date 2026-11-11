import { WorkspaceSupportPortalPage } from './WorkspaceSupportPortalPage';
import { useEffect, useState } from 'react';
import { BusinessHoursScreen, SlaScreen } from './AdminScopedSettings';
import { ScopedPage } from './AdminScopedPages';
import { scopedCardBySlug } from './scopedCards';
import { ChevronRight, CloudOff, ExternalLink, FlaskConical, Info, Lock, MoreHorizontal, Plus, Search, SearchX, X } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { WorkspaceForm } from './AdminWorkspaceForm';
import { AdminWorkspaceCreate } from './AdminWorkspaceCreate';
import { AdminWorkspacePage } from './AdminWorkspacePage';
import { AdminWorkspaceHome } from './AdminWorkspaceHome';
import { actionPath, settingsPath, permissionForCard } from './workspaceAdmin';
import { AddTechniciansDrawer } from './AdminWorkspaceMemberDrawer';
import { accessSentence } from './AccessCells';
import { AdminWorkspaceSetupDrawer } from './AdminWorkspaceSetupDrawer';
import type { WorkspaceAction, WorkspaceTab } from './AdminWorkspacePage';
import { ConfirmDialog, WorkspaceRowBody, WorkspaceRowHead, Notice, primaryBtn } from './workspaceUi';
import {
  DEMO_OPTIONS, GUIDE_STEPS, MAX_WORKSPACES, STATUS_LABEL, TYPE_LABEL, canAtOrg, orgView, personaInfo,
  adminIdsOf, canAdminister, loadStore, newSetup, orgAdminsOf, saveStore, seedFor, sortWorkspaces, technicianById, canIn,
} from './workspaceData';
import type { DemoData, GuideStep, MemberAccess, Workspace, WorkspaceDraft, WorkspaceStatus, WorkspaceStore, SetupStep } from './workspaceData';
import { canWorkspace } from './rolesData';

/* Workspaces — Admin › Platform Configuration › Organization. ESM F01.
 *
 * Address: #/admin/organization/workspace[ /create | /<id>[ … ] ]
 *   list                  Workspaces directory: Name · Type · Workspace Admin · Description · Status · Actions.
 *                         Row click = the RECORD page. Hover "Settings" = the workspace's own settings.
 *   /<id>                 RECORD page, Overview tab · /<id>/team · /<id>/audit · /<id>/edit (drawer)
 *                         /<id>/do/<step> = a drawer over the record page
 *   /<id>/settings        the workspace's settings home (sidebar swaps to its menu) · /<id>/settings/do/<step>
 *   /create               the two-step Add Workspace modal. Create opens the new workspace's settings, where
 *                         its setup panel is.
 *
 * A new workspace is In Setup. Its setup panel lives only in its own settings (AdminWorkspaceSetupGuide):
 * ServiceOps admin items as steps, any order, each can wait. Go Live is never blocked.
 *
 * Who sees what (prototype "View as", each a real seeded person):
 *   Organization Admin   everything; the only one who creates workspaces, changes status, edits details
 *                        and creates technician accounts.
 *   Workspace Admin      only the workspaces they administer: team and settings.
 *   Technician           no access to this page.
 * ⚠️ These are UI mirrors of server checks. Hiding an action is never the protection. */

const LOAD_MS = 600;
type Filter = 'all' | WorkspaceStatus;
const FILTERS: Filter[] = ['all', 'setup', 'live', 'inactive'];

/* ⚠️ Prototype controls are NOT a product feature and must not look like one. */
function PrototypeControls({ store, onDemo, onReset }: {
  store: WorkspaceStore; onDemo: (d: DemoData) => void; onReset: () => void;
}) {
  const radio = (name: string, checked: boolean, label: string, sub: string | undefined, onChange: () => void) => (
    <label key={label} className="flex cursor-pointer items-start gap-2.5 rounded px-2 py-1.5 text-[13px] text-[#364658] hover:bg-[#F5F7FA]">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 size-3.5 accent-[#3D8BD0]" />
      <span>{label}{sub && <span className="block text-[11px] text-[#94A3B8]">{sub}</span>}</span>
    </label>
  );
  return (
    <div className="flex items-center gap-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded border border-dashed border-[#94A3B8] bg-white px-3 text-[13px] font-medium text-[#64748B] transition-colors hover:border-[#64748B] hover:text-[#364658]">
            <FlaskConical size={15} /> Prototype controls
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[330px] bg-white p-0">
          <div className="border-b border-[#EEF1F5] px-4 py-3">
            <div className="text-[13px] font-semibold text-[#364658]">Prototype controls</div>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">For reviewing this prototype only. Not part of ServiceOps.</p>
          </div>
          <p className="border-b border-[#EEF1F5] px-4 py-2.5 text-[12px] text-[#7B8FA5]">Viewing as <span className="font-medium text-[#364658]">{personaInfo(store.viewAs).name}</span>. Change it from <span className="font-medium text-[#364658]">View as</span> at the top of the admin sidebar.</p>
          <div className="px-2 py-3">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Demo data</div>
            {DEMO_OPTIONS.map((o) => radio('workspace-demo', store.demo === o.value, o.label, undefined, () => onDemo(o.value)))}
            <button type="button" onClick={onReset} className="ml-2 mt-2 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Reset demo data</button>
          </div>
        </PopoverContent>
      </Popover>
      <span className="rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#92400E]">Not a feature</span>
    </div>
  );
}

type Confirm = { kind: WorkspaceAction; id: number } | null;
const now = () => new Date().toISOString().slice(0, 16);

interface AdminWorkspaceModuleProps {
  path?: string;
  onPath: (path: string | undefined) => void;
  onBackToApp: () => void;
}

export function AdminWorkspaceModule({ path, onPath, onBackToApp }: AdminWorkspaceModuleProps) {
  const [store, setStore] = useState<WorkspaceStore>(loadStore);
  useEffect(() => { saveStore(store); }, [store]);

  const [loadKey, setLoadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loadKey]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [memberDrawer, setMemberDrawer] = useState(false);
  const { workspaces, viewAs } = store;
  const me = viewAs;
  const isOrg = orgView(viewAs);
  const canCreate = canAtOrg(viewAs, 'Manage Workspaces');

  const applyDemo = (demo: DemoData) => {
    setStore((s) => ({ ...s, demo, workspaces: seedFor(demo) }));
    setQuery(''); setFilter('all'); setConfirm(null);
    onPath(undefined);
    setLoadKey((k) => k + 1);
  };

  const controls = (
    <PrototypeControls
      store={store}
      onDemo={applyDemo}
      onReset={() => applyDemo('four')}
    />
  );

  // ── mutations: every change to a workspace is written to its audit log ──
  const update = (id: number, patch: (w: Workspace) => Partial<Workspace>, audit?: string) =>
    setStore((s) => ({
      ...s,
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, ...patch(w), audit: audit ? [...w.audit, { at: now(), by: me, text: audit }] : w.audit } : w)),
    }));
  const nameOf = (id: number) => technicianById(id)?.name ?? 'someone';

  const createWorkspace = (d: WorkspaceDraft) => {
    const id = Math.max(0, ...workspaces.map((w) => w.id)) + 1;
    const ws: Workspace = {
      id, name: d.name, type: d.type, description: d.description, colour: d.colour, status: 'setup', isDefault: false, ticketCount: 0,
      createdOn: new Date().toISOString().slice(0, 10), setup: newSetup(d.type, d.name, d.adminIds),
      audit: [{ at: now(), by: me, text: `Created the workspace from the ${TYPE_LABEL[d.type]} template, with ${d.adminIds.map(nameOf).join(', ')} as Workspace Admin` }],
    };
    setStore((s) => ({ ...s, workspaces: [...s.workspaces, ws] }));
    setFilter('all'); setQuery('');
    onPath(settingsPath(id));
    toast.success(`${d.name} workspace created`, { description: 'It is in Setup, visible only to its admins until you make it Live.' });
  };

  const saveWorkspace = (id: number, d: WorkspaceDraft) => {
    const w = workspaces.find((x) => x.id === id)!;
    const typeLocked = w.isDefault || w.status !== 'setup';
    update(id, () => ({ name: d.name, description: d.description, colour: d.colour, type: typeLocked ? w.type : d.type }),
      `Edited details${!typeLocked && d.type !== w.type ? ` and changed the type to ${TYPE_LABEL[d.type]}` : ''}`);
    onPath(String(id));
    toast.success(`${d.name} updated`);
  };

  const setMembers = (id: number, ids: number[], access: MemberAccess) => update(id, (w) => {
    const next = { ...w.setup.access };
    ids.forEach((m) => { next[m] = access; });
    return { setup: { ...w.setup, memberIds: Array.from(new Set([...w.setup.memberIds, ...ids])), access: next } };
  }, `Added ${ids.map(nameOf).join(', ')} as ${accessSentence(access)}`);
  /** Inline edit from the Team table. Refused when it would leave the workspace without a Workspace Admin. */
  const changeAccess = (w: Workspace, memberId: number, access: MemberAccess) => {
    const admins = adminIdsOf(w);
    if (admins.length === 1 && admins[0] === memberId && !canWorkspace({ [w.id]: access.roles ?? [] }, w.id, 'Assign Roles in Workspace')) {
      toast.error(`${w.name} needs at least one person who can give roles`, { description: 'Give a role with Assign Roles in Workspace to someone else first.' });
      return;
    }
    update(w.id, (x) => ({ setup: { ...x.setup, access: { ...x.setup.access, [memberId]: access } } }), `Changed ${nameOf(memberId)}’s access: ${accessSentence(access)}`);
  };
  const removeMembers = (w: Workspace, ids: number[]) => {
    const admins = adminIdsOf(w);
    const keep = admins.every((a) => ids.includes(a)) ? admins[0] : undefined;
    const gone = ids.filter((m) => m !== keep);
    if (!gone.length) return;
    update(w.id, (x) => {
      const access = { ...x.setup.access };
      gone.forEach((m) => { delete access[m]; });
      return { setup: { ...x.setup, memberIds: x.setup.memberIds.filter((m) => !gone.includes(m)), access } };
    }, `Removed ${gone.map(nameOf).join(', ')} from the team (their accounts and other workspaces are unchanged)`);
    toast.success(gone.length === 1 ? `${nameOf(gone[0])} removed from ${w.name}` : `${gone.length} technicians removed from ${w.name}`,
      { description: keep !== undefined ? `${nameOf(keep)} stays: ${w.name} needs a Workspace Admin.` : 'Their accounts and other workspaces are unchanged.' });
  };

  const runConfirm = () => {
    if (!confirm) return;
    const w = workspaces.find((x) => x.id === confirm.id);
    if (!w) return;
    if (confirm.kind === 'delete') {
      if (w.isDefault || w.ticketCount > 0) return;
      setStore((s) => ({ ...s, workspaces: s.workspaces.filter((x) => x.id !== w.id) }));
      onPath(undefined);
      toast.success(`${w.name} deleted`);
      setConfirm(null);
      return;
    }
    if (confirm.kind === 'inactive') update(w.id, () => ({ status: 'inactive', inactiveSince: new Date().toISOString().slice(0, 10) }), 'Deactivated the workspace: normal processing paused');
    else update(w.id, () => ({ status: 'live', inactiveSince: undefined }), confirm.kind === 'live' ? 'Made the workspace Live' : 'Reactivated the workspace');
    toast.success(confirm.kind === 'live' ? `${w.name} is now Live` : confirm.kind === 'inactive' ? `${w.name} is now Inactive` : `${w.name} is Live again`);
    setConfirm(null);
  };

  const segs = (path ?? '').split('/');
  const [idPart] = segs;
  const current = /^\d+$/.test(idPart) ? workspaces.find((w) => w.id === Number(idPart)) : undefined;
  const inSettings = segs[1] === 'settings';
  const rest = inSettings ? segs.slice(2) : segs.slice(1);
  const tab: WorkspaceTab = !inSettings && (rest[0] === 'team' || rest[0] === 'audit') ? rest[0] : 'overview';
  const editing = current && !inSettings && rest[0] === 'edit' ? current : undefined;
  const drawer = rest[0] === 'do' && (['groups', 'requests', 'reach'] as string[]).includes(rest[1]) ? rest[1] as SetupStep : null;
  // F04: settings screens that open as a page inside the workspace, locked to it.
  const screen = inSettings && rest[0] === 'do' && (rest[1] === 'hours' || rest[1] === 'sla' || rest[1] === 'portal') ? rest[1] : null;
  const scopedCard = inSettings && rest[0] === 'do' ? scopedCardBySlug(rest[1] ?? '') : undefined;
  const base = current ? (inSettings ? settingsPath(current.id) : String(current.id)) : '';
  const allowed = current ? canAdminister(viewAs, current) : false;
  // F03d: a settings page opens only with its Workspace Settings tick box in this workspace.
  const needs = scopedCard ? permissionForCard(scopedCard.section, scopedCard.card) : screen === 'sla' ? 'Manage SLA' : screen === 'hours' ? 'Manage Business Hour' : screen === 'portal' ? 'Manage Support Channels' : undefined;
  const pageAllowed = !current || !needs || canIn(viewAs, current, needs);

  const target = confirm ? workspaces.find((w) => w.id === confirm.id) : undefined;
  const b = (s: string) => <strong className="font-semibold text-[#364658]">{s}</strong>;
  const setGuide = (w: Workspace, step: GuideStep, state: 'skipped' | 'todo') => {
    const title = GUIDE_STEPS.find((g) => g.id === step)!.title;
    const next = { ...w.setup.guide };
    if (state === 'todo') delete next[step]; else next[step] = state;
    update(w.id, (x) => ({ setup: { ...x.setup, guide: next } }), state === 'skipped' ? `Setup: skipped ${title}` : `Setup: reopened ${title}`);
  };
  const completeGuide = (w: Workspace, step: 'catalog' | 'knowledge', items: string[]) => {
    const list = step === 'catalog' ? { catalogItems: items } : { articles: items };
    update(w.id, (x) => ({ setup: { ...x.setup, ...list, guide: { ...x.setup.guide, [step]: 'done' } } }),
      step === 'catalog' ? `Setup: added ${items.length} services to the Service Catalog` : `Setup: published ${items.length} knowledge articles`);
    toast.success(step === 'catalog' ? `${items.length} services added` : `${items.length} articles published`, { description: `Visible to employees once ${w.name} is Live.` });
  };
  const setEmail = (w: Workspace, email: string) => {
    update(w.id, (x) => ({ setup: { ...x.setup, email } }), `Setup: support email set to ${email}`);
    toast.success('Support email saved', { description: `Mail to ${email} becomes ${w.name} requests.` });
  };

  const renderConfirm = () => {
    if (!confirm || !target) return null;
    return (
      <ConfirmDialog
        title={confirm.kind === 'live' ? `Make ${target.name} Live?` : confirm.kind === 'inactive' ? `Deactivate ${target.name}?` : confirm.kind === 'reactivate' ? `Reactivate ${target.name}?` : `Delete ${target.name}?`}
        confirmLabel={confirm.kind === 'live' ? 'Go Live' : confirm.kind === 'inactive' ? 'Deactivate' : confirm.kind === 'reactivate' ? 'Reactivate' : 'Delete'}
        danger={confirm.kind === 'delete' || confirm.kind === 'inactive'}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      >
        {confirm.kind === 'live' && <p>{b(target.name)} will appear on the Support Portal and start taking requests. Anything you skipped can still be set up in its Workspace Settings.</p>}
        {confirm.kind === 'inactive' && <p>{b(target.name)} stops taking new requests. Its records and history are kept, and you can reactivate it later.</p>}
        {confirm.kind === 'reactivate' && <p>{b(target.name)} takes requests again.</p>}
        {confirm.kind === 'delete' && <p>{b(target.name)} has no tickets. Deleting it removes the workspace and its settings. Its members keep their accounts. This cannot be undone.</p>}
      </ConfirmDialog>
    );
  };

  const denied = (title: string, body: string, action?: { label: string; go: () => void }) => (
    <div className="px-6 pb-6 pt-6">
      <div className="flex justify-end">{controls}</div>
      <Notice icon={<Lock size={28} strokeWidth={1.6} />} title={title} action={action ? <button onClick={action.go} className={primaryBtn}>{action.label}</button> : <button onClick={onBackToApp} className={primaryBtn}>Back to app</button>}>{body}</Notice>
    </div>
  );

  // ── permission denied ──
  if (!isOrg && !workspaces.some((w) => canAdminister(viewAs, w))) {
    return denied('You don’t have permission to view this page', 'Workspace administration is for Organization Admins and Workspace Admins.');
  }
  if (path === 'create' && !canCreate) return denied('Only Organization Admins can add workspaces', 'Ask your Organization Admin if your team needs a workspace.', { label: 'Back to Workspaces', go: () => onPath(undefined) });
  if (current && allowed && !pageAllowed) return denied('You don’t have permission to view this page', `Your roles in ${current.name} don’t include ${needs}.`, { label: `${current.name} settings`, go: () => onPath(settingsPath(current.id)) });
  if (current && !allowed && current.confidential && !current.setup.memberIds.includes(viewAs)) return denied(`${current.name} is confidential`, 'Only its members can open its tickets and settings — Super Admin and Organization Admins too. Ask one of its Workspace Admins to add you.', { label: 'Back to Workspaces', go: () => onPath(undefined) });
  if (current && !allowed) return denied(`You don’t administer ${current.name}`, 'Workspace Admins can open only the workspaces they administer. Ask an Organization Admin for access.', { label: 'Back to Workspaces', go: () => onPath(undefined) });

  const notFound = !!path && path !== 'create' && !current && !loading;
  if (notFound) {
    return (
      <div className="px-6 pb-6 pt-6">
        <Notice icon={<SearchX size={28} strokeWidth={1.6} />} title="Workspace does not exist" action={<button onClick={() => onPath(undefined)} className={primaryBtn}>Back to Workspaces</button>}>
          This workspace does not exist, or you do not have access to it.
        </Notice>
      </div>
    );
  }

  // ── a workspace: its record page, or its configuration home (/settings) ──
  if (current && !loading) {
    const id = current.id;
    return (
      <>
        {scopedCard ? (
          <ScopedPage key={`${scopedCard.slug}-${id}`} card={scopedCard} workspaces={workspaces} locked={current}
            onPatchWorkspace={(wid, setup, audit) => update(wid, (x) => ({ setup: { ...x.setup, ...setup } }), audit)} />
        ) : screen ? (
          screen === 'portal' ? <WorkspaceSupportPortalPage key={`portal-${id}`} w={current} /> : screen === 'sla' ? <SlaScreen key={`sla-${id}`} workspaces={workspaces} locked={current} /> : <BusinessHoursScreen key={`hours-${id}`} workspaces={workspaces} locked={current} />
        ) : inSettings ? (
          <AdminWorkspaceHome key={id} workspace={current} onAction={(a) => onPath(actionPath(id, a))} canGoLive={canIn(viewAs, current, 'Change Workspace Status')} onEmail={(e) => setEmail(current, e)} onComplete={(st, items) => completeGuide(current, st, items)}
            onMark={(st, state) => setGuide(current, st, state)} onGoLive={() => setConfirm({ kind: 'live', id })} />
        ) : (
          <AdminWorkspacePage
            key={id}
            workspace={current}
            viewAs={viewAs}
            tab={tab}
            onTab={(t) => onPath(t === 'overview' ? String(id) : `${id}/${t}`)}
            onBack={() => onPath(undefined)}
            onConfigure={() => onPath(settingsPath(id))}
            onEdit={() => onPath(`${id}/edit`)}
            onAction={(kind) => setConfirm({ kind, id })}
            workspaces={workspaces}
            onAddMembers={() => setMemberDrawer(true)}
            orgAdmins={orgAdminsOf(store)}
            onChangeAccess={(memberId, access) => changeAccess(current, memberId, access)}
            onRemoveMembers={(ids) => removeMembers(current, ids)}
            onPatch={(patch, audit) => update(current.id, () => patch, audit)}
            onOpenTechnician={(techId) => { window.location.hash = `#/admin/users/technician/${techId}`; }}
          />
        )}
        {drawer && (
          <AdminWorkspaceSetupDrawer
            workspace={current}
            step={drawer}
            onClose={() => onPath(base)}
            onSave={(setup) => {
              const access = Object.fromEntries(Object.entries(setup.access).map(([k, a]) => [k, { ...a, groups: a.groups.filter((g) => setup.groups.includes(g)) }]));
              update(id, () => ({ setup: { ...setup, access } }), drawer === 'groups' ? `Updated technician groups: ${setup.groups.join(', ') || 'none'}` : drawer === 'requests' ? 'Updated request categories' : 'Updated support email and portal');
              onPath(base); toast.success('Saved');
            }}
          />
        )}
        {memberDrawer && !inSettings && (
          <AddTechniciansDrawer
            workspace={current}
            workspaces={workspaces}
            viewAs={viewAs}
            onClose={() => setMemberDrawer(false)}
            onAdd={(ids, access) => {
              setMembers(id, ids, access);
              setMemberDrawer(false);
              toast.success(`${ids.length} technician${ids.length > 1 ? 's' : ''} added to ${current.name}`, { description: 'Their access in other workspaces is unchanged.' });
            }}
          />
        )}
        {editing && (
          <WorkspaceForm key={editing.id} mode="edit" workspace={editing} workspaces={workspaces} onCancel={() => onPath(String(id))} onSubmit={(d) => saveWorkspace(editing.id, d)} />
        )}
        {renderConfirm()}
      </>
    );
  }

  // ── directory ──
  const atLimit = workspaces.length >= MAX_WORKSPACES;
  const mine = isOrg ? workspaces : workspaces.filter((w) => canAdminister(viewAs, w));
  const q = query.trim().toLowerCase();
  const matches = sortWorkspaces(mine).filter((w) => !q || w.name.toLowerCase().includes(q));
  const rows = matches.filter((w) => filter === 'all' || w.status === filter);
  const showError = !loading && store.demo === 'error';
  const onlyIt = !loading && !showError && isOrg && workspaces.length === 1 && workspaces[0].isDefault;

  const addButton = (
    <button disabled={loading || atLimit} onClick={() => onPath('create')} className={`${primaryBtn} ${atLimit ? 'pointer-events-none' : ''}`}>
      <Plus size={15} /> Add Workspace
    </button>
  );

  const menuItem = 'cursor-pointer text-[13px]';
  const rowMenu = (w: Workspace) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Actions for ${w.name}`} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
          className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658] data-[state=open]:bg-[#F1F5F9]"
        ><MoreHorizontal size={18} /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem className={menuItem} onSelect={() => onPath(String(w.id))}>Open Workspace</DropdownMenuItem>
        <DropdownMenuItem className={menuItem} onSelect={() => onPath(`${w.id}/team`)}>Team</DropdownMenuItem>
        <DropdownMenuItem className={menuItem} onSelect={() => onPath(settingsPath(w.id))}>Workspace Settings</DropdownMenuItem>
        {canIn(viewAs, w, 'Edit Workspace Details') && <DropdownMenuItem className={menuItem} onSelect={() => onPath(`${w.id}/edit`)}>Edit</DropdownMenuItem>}
        {canIn(viewAs, w, 'Change Workspace Status') && (w.status !== 'live' || !w.isDefault) && <DropdownMenuSeparator />}
        {canIn(viewAs, w, 'Change Workspace Status') && w.status === 'setup' && <DropdownMenuItem className={menuItem} onSelect={() => setConfirm({ kind: 'live', id: w.id })}>Go Live</DropdownMenuItem>}
        {canIn(viewAs, w, 'Change Workspace Status') && w.status === 'live' && !w.isDefault && <DropdownMenuItem className={menuItem} onSelect={() => setConfirm({ kind: 'inactive', id: w.id })}>Deactivate</DropdownMenuItem>}
        {canIn(viewAs, w, 'Change Workspace Status') && w.status === 'inactive' && <DropdownMenuItem className={menuItem} onSelect={() => setConfirm({ kind: 'reactivate', id: w.id })}>Reactivate</DropdownMenuItem>}
        {canCreate && !w.isDefault && w.ticketCount === 0 && <DropdownMenuItem className={`${menuItem} text-[#DC2626] focus:text-[#DC2626]`} onSelect={() => setConfirm({ kind: 'delete', id: w.id })}>Delete</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-full bg-[#F7F9FB] px-6 pb-10 pt-6">
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold text-[#1F2D3D]">Workspaces</h1>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
            Each department (IT, HR, Facilities, Finance…) is a workspace with its own team and configuration, in one ServiceOps.{' '}
            <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-0.5 text-[13px] text-[#364658] underline underline-offset-2 hover:text-[#3D8BD0]">View Docs <ExternalLink size={12} /></a>
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 pt-0.5">
          {controls}
          {canCreate && (atLimit && !loading ? (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild><span className="inline-flex cursor-not-allowed">{addButton}</span></TooltipTrigger>
              <TooltipContent>You have reached the limit of {MAX_WORKSPACES} workspaces.</TooltipContent>
            </Tooltip>
          ) : addButton)}
        </div>
      </div>

      {!isOrg && !loading && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#DCEBFA] bg-white px-4 py-3 text-[13px] leading-[1.6] text-[#36577A]">
          <Info size={16} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
          <span>You administer {mine.length === 1 ? b(mine[0].name) : `${mine.length} workspaces`}. Other workspaces are managed by their own admins and aren’t listed. Creating workspaces and changing their status is done by Organization Admins.</span>
        </div>
      )}

      {onlyIt && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#DCEBFA] bg-white px-4 py-3.5 text-[13px] leading-[1.6] text-[#36577A] shadow-sm">
          <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Info size={16} /></span>
          <div>ServiceOps runs as one <strong className="font-semibold">IT</strong> workspace, exactly as before. Everything that existed before workspaces (tickets, groups, catalog and settings) is in IT.</div>
        </div>
      )}

      {showError ? (
        <Notice icon={<CloudOff size={28} strokeWidth={1.6} />} title="Couldn't load workspaces" action={<button onClick={() => applyDemo('four')} className={primaryBtn}>Retry</button>}>
          Something went wrong while loading this page.
        </Notice>
      ) : !loading && mine.length === 0 ? (
        <Notice icon={<Lock size={28} strokeWidth={1.6} />} title="You don’t administer any workspace" action={<button onClick={onBackToApp} className={primaryBtn}>Back to app</button>}>
          Ask an Organization Admin to make you a Workspace Admin.
        </Notice>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#EEF1F5] px-5">
            <div role="tablist" aria-label="Filter by status" className="flex gap-5">
              {FILTERS.map((f) => (
                <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                  className={`-mb-px border-b-2 py-3 text-[13px] font-medium transition-colors ${filter === f ? 'border-[#3D8BD0] text-[#1F2D3D]' : 'border-transparent text-[#64748B] hover:text-[#364658]'}`}
                >{f === 'all' ? 'All' : STATUS_LABEL[f]}</button>
              ))}
            </div>
            <div className="relative my-2 ml-auto w-[260px] max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by workspace name" aria-label="Search workspaces"
                className="h-9 w-full rounded-lg border border-[#DFE5ED] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
              {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>}
            </div>
          </div>
          <WorkspaceRowHead />
          <ul aria-busy={loading} className="divide-y divide-[#EEF1F5]">
            {loading ? [0, 1, 2, 3].map((i) => (
              <li key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
                <div className="size-10 rounded-lg bg-[#EEF1F5]" />
                <div className="flex-1 space-y-2"><div className="h-3 w-1/4 rounded bg-[#EEF1F5]" /><div className="h-2.5 w-1/2 rounded bg-[#F3F5F8]" /></div>
              </li>
            )) : rows.length === 0 ? (
              <li className="px-5 py-12 text-center">
                <SearchX size={24} className="mx-auto text-[#CBD5E1]" />
                <p className="mt-2 text-[13px] text-[#7B8FA5]">{q ? <>No workspaces match “{query}”{filter !== 'all' && ` in ${STATUS_LABEL[filter as WorkspaceStatus]}`}.</> : <>No {STATUS_LABEL[filter as WorkspaceStatus].toLowerCase()} workspaces.</>}</p>
                <button onClick={() => { setQuery(''); setFilter('all'); }} className="mt-3 text-[13px] font-medium text-[#3D8BD0] hover:underline">Clear search and filters</button>
              </li>
            ) : rows.map((w) => (
              <li key={w.id} role="button" tabIndex={0} data-workspace-row={w.id} aria-label={`Open ${w.name}`}
                onClick={() => onPath(String(w.id))}
                onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPath(String(w.id)); } }}
                className={`group cursor-pointer px-5 py-3 transition-colors hover:bg-[#F8FAFC] focus:outline-none focus-visible:bg-[#F5FAFF] ${w.status === 'inactive' ? 'opacity-75 hover:opacity-100' : ''}`}
              >
                <WorkspaceRowBody
                  d={{ ...w, adminIds: adminIdsOf(w) }}
                  actions={
                    <>
                      <button type="button" onClick={(e) => { e.stopPropagation(); onPath(settingsPath(w.id)); }} onKeyDown={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center gap-0.5 whitespace-nowrap rounded-lg px-2 text-[13px] font-medium text-[#3D8BD0] opacity-0 transition-opacity hover:bg-[#EBF5FF] focus-visible:opacity-100 group-hover:opacity-100 group-focus-visible:opacity-100"
                      >Settings <ChevronRight size={14} /></button>
                      {rowMenu(w)}
                    </>
                  }
                />
              </li>
            ))}
          </ul>
          {onlyIt && (
            <div className="flex flex-col items-center border-t border-dashed border-[#E5E7EB] px-6 py-10 text-center">
              <div className="text-[14px] font-semibold text-[#1F2D3D]">No department workspaces yet</div>
              <p className="mt-1 max-w-[420px] text-[13px] text-[#7B8FA5]">Add one for HR, Facilities, Finance or any other team. It starts in Setup with a short guide, and goes Live when you’re ready.</p>
              <div className="mt-4">{addButton}</div>
            </div>
          )}
        </div>
      )}

      {path === 'create' && !loading && (
        <AdminWorkspaceCreate workspaces={workspaces} onCancel={() => onPath(undefined)} onCreate={createWorkspace} />
      )}
      {renderConfirm()}
    </div>
  );
}
