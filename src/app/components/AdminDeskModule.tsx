import { useEffect, useState } from 'react';
import { ChevronRight, CloudOff, ExternalLink, FlaskConical, Info, Lock, MoreHorizontal, Plus, Search, SearchX, X } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { DeskForm } from './AdminDeskForm';
import { AdminDeskCreate } from './AdminDeskCreate';
import { AdminDeskPage } from './AdminDeskPage';
import { AdminDeskHome } from './AdminDeskHome';
import { actionPath } from './deskAdmin';
import { AdminDeskSetupDrawer } from './AdminDeskSetupDrawer';
import type { DeskAction, DeskTab } from './AdminDeskPage';
import { ConfirmDialog, DeskRowBody, Notice, primaryBtn } from './deskUi';
import { DEMO_OPTIONS, MAX_DESKS, missingEssentials, newSetup, STATUS_LABEL, TYPE_LABEL, VIEW_AS_OPTIONS, loadStore, saveStore, seedFor, sortDesks } from './deskData';
import type { DemoData, ViewAs, Desk, DeskDraft, DeskStatus, DeskStore, SetupStep } from './deskData';

/* Desks — Admin › Platform Configuration › Organization. ESM feature F01.
 *
 * Address: #/admin/organization/desk[/create | /<id>[/members | /settings | /edit]].
 *   list        a ROW LIST (Juli, 2026-10-14: no cards, no numbers): icon, name, code, owners,
 *               description, kind, status; hover shows Open + a ⋯ menu. Status tabs + search.
 *               Shaped on ManageEngine's Service Instances list (rows, Go to Instance, Actions).
 *   /<id>               the desk's OWN ADMIN HOME (AdminDeskHome) — switching to a desk is like
 *                       entering its own instance (Freshservice workspace settings, ManageEngine
 *                       instance Setup). Setup is a slim banner there, not the page.
 *   /<id>/details       Desk details (AdminDeskPage, Overview tab) · /<id>/members  Team tab
 *   /<id>/edit          Desk details with the edit drawer (AdminDeskForm) over it
 *   /<id>/do/<step>     a setup drawer (team | requests | reach) over the desk home
 *   /create             the two-step New desk modal (AdminDeskCreate). Create opens the desk home.
 *
 * ⚠️ Status changes are ACTIONS with a confirm, never a form field: each one starts or stops
 * requests arriving, so each says what will happen.
 * ⚠️ Not-found and permission-denied are different screens: not-found never says "denied". */

const LOAD_MS = 600;
type Filter = 'all' | DeskStatus;

/* ⚠️ Prototype controls are NOT a product feature and must not look like one. */
function PrototypeControls({ demo, viewAs, onDemo, onViewAs, onReset }: {
  demo: DemoData; viewAs: ViewAs; onDemo: (d: DemoData) => void; onViewAs: (v: ViewAs) => void; onReset: () => void;
}) {
  const radio = (name: string, checked: boolean, label: string, onChange: () => void) => (
    <label key={label} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-[13px] text-[#364658] hover:bg-[#F5F7FA]">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-3.5 accent-[#3D8BD0]" />
      {label}
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
        <PopoverContent align="end" className="w-[320px] bg-white p-0">
          <div className="border-b border-[#EEF1F5] px-4 py-3">
            <div className="text-[13px] font-semibold text-[#364658]">Prototype controls</div>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">For reviewing this prototype only. Not part of ServiceOps.</p>
          </div>
          <div className="border-b border-[#EEF1F5] px-2 py-3">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Demo data</div>
            {DEMO_OPTIONS.map((o) => radio('desk-demo', demo === o.value, o.label, () => onDemo(o.value)))}
            <button type="button" onClick={onReset} className="ml-2 mt-2 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Reset demo data</button>
          </div>
          <div className="px-2 py-3">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">View as</div>
            {VIEW_AS_OPTIONS.map((o) => radio('desk-view-as', viewAs === o.value, o.label, () => onViewAs(o.value)))}
          </div>
        </PopoverContent>
      </Popover>
      <span className="rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#92400E]">Not a feature</span>
    </div>
  );
}

type Confirm = { kind: DeskAction; id: number } | null;

interface AdminDeskModuleProps {
  /** The segments after the list route: 'create', '<id>', '<id>/edit', or undefined for the grid. */
  path?: string;
  onPath: (path: string | undefined) => void;
  onBackToApp: () => void;
}

export function AdminDeskModule({ path, onPath, onBackToApp }: AdminDeskModuleProps) {
  const [store, setStore] = useState<DeskStore>(loadStore);
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
  const { desks } = store;

  const applyDemo = (demo: DemoData) => {
    setStore((s) => ({ ...s, demo, desks: seedFor(demo) }));
    setQuery('');
    setFilter('all');
    setConfirm(null);
    onPath(undefined);
    setLoadKey((k) => k + 1);
  };

  const controls = (
    <PrototypeControls
      demo={store.demo}
      viewAs={store.viewAs}
      onDemo={applyDemo}
      onViewAs={(viewAs) => setStore((s) => ({ ...s, viewAs }))}
      onReset={() => applyDemo('four')}
    />
  );

  // ── mutations ──
  const update = (id: number, patch: Partial<Desk>) =>
    setStore((s) => ({ ...s, desks: s.desks.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));

  const createDesk = (d: DeskDraft) => {
    const id = Math.max(0, ...desks.map((w) => w.id)) + 1;
    setStore((s) => ({
      ...s,
      desks: [...s.desks, {
        ...d, id, status: 'setup', isDefault: false, ticketCount: 0, setup: newSetup(d.type, d.name),
        createdOn: new Date().toISOString().slice(0, 10),
      }],
    }));
    setFilter('all');
    setQuery('');
    onPath(String(id));
    toast.success(`${d.name} desk created`, { description: 'Follow Get started on its page, then Go Live.' });
  };

  const saveDesk = (id: number, d: DeskDraft) => {
    const w = desks.find((x) => x.id === id)!;
    // Type never changes after create; the code only while still in Setup (and never for IT).
    update(id, { ...d, type: w.type, code: w.isDefault || w.status !== 'setup' ? w.code : d.code });
    onPath(`${id}/details`);
    toast.success(`${d.name} updated`);
  };

  const runConfirm = () => {
    if (!confirm) return;
    const w = desks.find((x) => x.id === confirm.id);
    if (!w) return;
    if (confirm.kind === 'delete') {
      if (w.isDefault || w.ticketCount > 0) return; // guarded in the UI too
      setStore((s) => ({ ...s, desks: s.desks.filter((x) => x.id !== w.id) }));
      onPath(undefined);
      toast.success(`${w.name} deleted`);
    } else {
      const status: DeskStatus = confirm.kind === 'inactive' ? 'inactive' : 'live';
      update(w.id, { status });
      toast.success(confirm.kind === 'live' ? `${w.name} is now Live` : confirm.kind === 'inactive' ? `${w.name} is now Inactive` : `${w.name} is Live again`);
    }
    setConfirm(null);
  };

  // ── permission denied ──
  if (store.viewAs === 'technician') {
    return (
      <div className="px-6 pb-6 pt-6">
        <div className="flex justify-end">{controls}</div>
        <Notice icon={<Lock size={28} strokeWidth={1.6} />} title="You don't have permission to view this page" action={<button onClick={onBackToApp} className={primaryBtn}>Back to app</button>}>
          Ask your administrator if you need access to Desk settings.
        </Notice>
      </div>
    );
  }

  const atLimit = desks.length >= MAX_DESKS;
  const [idPart, sub, third] = (path ?? '').split('/');
  const current = /^\d+$/.test(idPart) ? desks.find((w) => w.id === Number(idPart)) : undefined;
  const editing = current && sub === 'edit' ? current : undefined;
  const tab: DeskTab = sub === 'members' ? 'members' : 'overview';
  const drawer: SetupStep | null = sub === 'do' && (third === 'team' || third === 'requests' || third === 'reach') ? third : null;
  const notFound = !!path && path !== 'create' && !current && !loading;

  if (notFound) {
    return (
      <div className="px-6 pb-6 pt-6">
        <Notice icon={<SearchX size={28} strokeWidth={1.6} />} title="Desk does not exist" action={<button onClick={() => onPath(undefined)} className={primaryBtn}>Back to Desks</button>}>
          This desk does not exist, or you do not have access to it.
        </Notice>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = sortDesks(desks).filter((w) =>
    !q || w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || TYPE_LABEL[w.type].toLowerCase().includes(q));
  const cards = matches.filter((w) => filter === 'all' || w.status === filter);
  const showError = !loading && store.demo === 'error';
  const onlyIt = !loading && !showError && desks.length === 1 && desks[0].isDefault;

  const newDesk = () => onPath('create');
  const newButton = (
    <button disabled={loading || atLimit} onClick={newDesk} className={`${primaryBtn} ${atLimit ? 'pointer-events-none' : ''}`}>
      <Plus size={15} /> New desk
    </button>
  );

  const target = confirm ? desks.find((w) => w.id === confirm.id) : undefined;
  const b = (s: string) => <strong className="font-semibold text-[#364658]">{s}</strong>;

  const menuItem = 'cursor-pointer text-[13px]';
  const cardMenu = (w: Desk) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${w.name}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658] data-[state=open]:bg-[#F1F5F9]"
        ><MoreHorizontal size={18} /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[190px]" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem className={menuItem} onSelect={() => onPath(`${w.id}/edit`)}>Edit</DropdownMenuItem>
        {w.status === 'setup' && <DropdownMenuItem className={menuItem} onSelect={() => setConfirm({ kind: 'live', id: w.id })}>Go Live</DropdownMenuItem>}
        {w.status === 'live' && !w.isDefault && <DropdownMenuItem className={menuItem} onSelect={() => setConfirm({ kind: 'inactive', id: w.id })}>Make Inactive</DropdownMenuItem>}
        {w.status === 'inactive' && <DropdownMenuItem className={menuItem} onSelect={() => setConfirm({ kind: 'reactivate', id: w.id })}>Make Live again</DropdownMenuItem>}
        {!w.isDefault && w.ticketCount === 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={`${menuItem} text-[#DC2626] focus:text-[#DC2626]`} onSelect={() => setConfirm({ kind: 'delete', id: w.id })}>Delete</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const FILTERS: Filter[] = ['all', 'live', 'setup', 'inactive'];

  const renderConfirm = () => confirm && target && (
    <ConfirmDialog
      title={
        confirm.kind === 'live' ? `Make ${target.name} Live?`
          : confirm.kind === 'inactive' ? `Make ${target.name} Inactive?`
            : confirm.kind === 'reactivate' ? `Make ${target.name} Live again?`
              : `Delete ${target.name}?`
      }
      confirmLabel={confirm.kind === 'live' ? (missingEssentials(target).length ? 'Go Live anyway' : 'Go Live') : confirm.kind === 'inactive' ? 'Make Inactive' : confirm.kind === 'reactivate' ? 'Make Live' : 'Delete'}
      danger={confirm.kind === 'delete' || confirm.kind === 'inactive'}
      onCancel={() => setConfirm(null)}
      onConfirm={runConfirm}
    >
      {confirm.kind === 'live' && (
        <>
          <p>{b(target.name)} will start taking requests. Its short code {b(target.code)} is locked from now on.</p>
          {missingEssentials(target).length > 0 && (
            <div className="mt-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-[#92400E]">
              <div className="font-semibold">Not set up yet</div>
              <ul className="mt-1 space-y-0.5">{missingEssentials(target).map((m) => <li key={m.id}>• {m.text}</li>)}</ul>
            </div>
          )}
        </>
      )}
      {confirm.kind === 'inactive' && <p>{b(target.name)} will stop taking new requests. Its existing tickets stay available and reportable. You can make it Live again later.</p>}
      {confirm.kind === 'reactivate' && <p>{b(target.name)} will start taking requests again.</p>}
      {confirm.kind === 'delete' && <p>{b(target.name)} has no tickets. Deleting it removes the desk. This cannot be undone.</p>}
    </ConfirmDialog>
  );

  // ── a desk: its own admin home, or its details/team pages ──
  if (current && !loading) {
    const id = current.id;
    const onDetails = sub === 'details' || sub === 'members' || sub === 'edit';
    return (
      <>
        {onDetails ? (
          <AdminDeskPage
            key={id}
            desk={current}
            tab={tab}
            onTab={(t) => onPath(t === 'overview' ? `${id}/details` : `${id}/members`)}
            onBack={() => onPath(String(id))}
            onEdit={() => onPath(`${id}/edit`)}
            onAction={(kind) => setConfirm({ kind, id })}
            onStep={(step) => onPath(`${id}/do/${step}`)}
          />
        ) : (
          <AdminDeskHome
            key={id}
            desk={current}
            onAction={(a) => onPath(actionPath(id, a))}
            onStep={(step) => onPath(`${id}/do/${step}`)}
            onGoLive={() => setConfirm({ kind: 'live', id })}
          />
        )}
        {drawer && (
          <AdminDeskSetupDrawer
            desk={current}
            step={drawer}
            onClose={() => onPath(String(id))}
            onSave={(setup) => { update(id, { setup }); onPath(String(id)); toast.success('Saved'); }}
          />
        )}
        {editing && (
          <DeskForm key={editing.id} mode="edit" desk={editing} desks={desks} onCancel={() => onPath(`${id}/details`)} onSubmit={(d) => saveDesk(editing.id, d)} />
        )}
        {renderConfirm()}
      </>
    );
  }

  return (
    <div className="min-h-full bg-[#F7F9FB] px-6 pb-10 pt-6">
      {/* Head */}
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold text-[#1F2D3D]">Desks</h1>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
            Each department (IT, HR, Facilities, Finance…) runs its own service desk in one ServiceOps.{' '}
            <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-0.5 text-[13px] text-[#364658] underline underline-offset-2 hover:text-[#3D8BD0]">View Docs <ExternalLink size={12} /></a>
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 pt-0.5">
          {controls}
          {atLimit && !loading ? (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild><span className="inline-flex cursor-not-allowed">{newButton}</span></TooltipTrigger>
              <TooltipContent>You have reached the limit of {MAX_DESKS} desks.</TooltipContent>
            </Tooltip>
          ) : newButton}
        </div>
      </div>

      {onlyIt && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#DCEBFA] bg-white px-4 py-3.5 text-[13px] leading-[1.6] text-[#36577A] shadow-sm">
          <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Info size={16} /></span>
          <div>
            ServiceOps runs as one <strong className="font-semibold">IT</strong> desk, exactly as before. Everything that existed before desks
            (tickets, groups, catalog and settings) is in IT. Add a desk to give HR, Facilities or Finance their own.
          </div>
        </div>
      )}

      {showError ? (
        <Notice icon={<CloudOff size={28} strokeWidth={1.6} />} title="Couldn't load desks" action={<button onClick={() => applyDemo('four')} className={primaryBtn}>Retry</button>}>
          Something went wrong while loading this page.
        </Notice>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          {/* Status tabs + search */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[#EEF1F5] px-5">
            <div role="tablist" aria-label="Filter by status" className="flex gap-5">
              {FILTERS.map((f) => {
                const on = filter === f;
                return (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setFilter(f)}
                    className={`-mb-px border-b-2 py-3 text-[13px] font-medium transition-colors ${
                      on ? 'border-[#3D8BD0] text-[#1F2D3D]' : 'border-transparent text-[#64748B] hover:text-[#364658]'
                    }`}
                  >{f === 'all' ? 'All' : STATUS_LABEL[f]}</button>
                );
              })}
            </div>
            <div className="relative my-2 ml-auto w-[260px] max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search desks"
                aria-label="Search desks"
                className="h-9 w-full rounded-lg border border-[#DFE5ED] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
              />
              {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>}
            </div>
          </div>

          {/* Rows */}
          <ul aria-busy={loading} className="divide-y divide-[#EEF1F5]">
            {loading ? [0, 1, 2, 3].map((i) => (
              <li key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
                <div className="size-10 rounded-lg bg-[#EEF1F5]" />
                <div className="flex-1 space-y-2"><div className="h-3 w-1/4 rounded bg-[#EEF1F5]" /><div className="h-2.5 w-1/2 rounded bg-[#F3F5F8]" /></div>
              </li>
            )) : cards.length === 0 ? (
              <li className="px-5 py-12 text-center text-[13px] text-[#7B8FA5]">
                {q ? <>No desks match “{query}”.</> : <>No {filter === 'all' ? '' : STATUS_LABEL[filter as DeskStatus].toLowerCase() + ' '}desks.</>}
              </li>
            ) : cards.map((w) => (
              <li
                key={w.id}
                role="button"
                tabIndex={0}
                data-desk-row={w.code}
                aria-label={`Open ${w.name}`}
                onClick={() => onPath(String(w.id))}
                onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPath(String(w.id)); } }}
                className={`group cursor-pointer px-5 py-3.5 transition-colors hover:bg-[#F8FAFC] focus:outline-none focus-visible:bg-[#F5FAFF] ${w.status === 'inactive' ? 'opacity-70 hover:opacity-100' : ''}`}
              >
                <DeskRowBody
                  d={w}
                  actions={
                    <>
                      <span className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#3D8BD0] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        Open <ChevronRight size={14} />
                      </span>
                      {cardMenu(w)}
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {path === 'create' && !loading && (
        <AdminDeskCreate desks={desks} onCancel={() => onPath(undefined)} onCreate={createDesk} />
      )}
      {renderConfirm()}
    </div>
  );
}
