import { useEffect, useState } from 'react';
import { CirclePause, CirclePlay, CloudOff, ExternalLink, FlaskConical, Info, Lock, Pencil, Plus, Rocket, Search, SearchX, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { DeskForm } from './AdminDeskForm';
import { AdminDeskPage } from './AdminDeskPage';
import type { DeskAction } from './AdminDeskPage';
import { ConfirmDialog, DefaultTag, IconAction, Notice, Owners, StatusPill, primaryBtn } from './deskUi';
import {
  DEMO_OPTIONS, MAX_DESKS, NEW_SETUP, SETUP_STEPS, TYPE_LABEL, VIEW_AS_OPTIONS, loadStore, missingRequired, saveStore,
  seedFor, sortDesks,
} from './deskData';
import type { DemoData, ViewAs, Desk, DeskDraft, DeskStatus, DeskStore, SetupStepId } from './deskData';

/* Desks — Admin › Platform Configuration › Organization. ESM feature F01, first level.
 *
 * Addressed by the URL: #/admin/organization/desk[/create | /<id> | /<id>/edit]. The list follows
 * the prototype's admin-listing standard (white surface, head + View Docs, search left / CTA right,
 * full-bleed table). Create and Edit open a right drawer. <id> is the desk page (AdminDeskPage):
 * Create lands there, on the setup checklist, rather than back on the list.
 *
 * ⚠️ Status changes are row ACTIONS, not a form field: each one is a decision with consequences
 * (requests start or stop arriving), so each gets its own confirm that says what will happen.
 * ⚠️ Not-found and permission-denied are different screens: not-found never says "denied". */


const COLUMNS = ['Desk', 'Type', 'Owners', 'Status', 'Tickets', 'Action'];
const LOAD_MS = 700;

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
            {DEMO_OPTIONS.map((o) => radio('ws-demo', demo === o.value, o.label, () => onDemo(o.value)))}
            <button type="button" onClick={onReset} className="ml-2 mt-2 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Reset demo data</button>
          </div>
          <div className="px-2 py-3">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">View as</div>
            {VIEW_AS_OPTIONS.map((o) => radio('ws-view-as', viewAs === o.value, o.label, () => onViewAs(o.value)))}
          </div>
        </PopoverContent>
      </Popover>
      <span className="rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#92400E]">Not a feature</span>
    </div>
  );
}

type Confirm = { kind: DeskAction; id: number } | null;

interface AdminDeskModuleProps {
  /** The segments after the list route: 'create', '<id>', '<id>/edit', or undefined for the list. */
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
  const [confirm, setConfirm] = useState<Confirm>(null);
  /* Edit opened from a list row closes back to the list; from the desk page, back to the page.
     Not in the URL: a reloaded /<id>/edit has no origin, and the desk page is the safe answer. */
  const [editFromList, setEditFromList] = useState(false);
  const { desks } = store;

  const applyDemo = (demo: DemoData) => {
    setStore((s) => ({ ...s, demo, desks: seedFor(demo) }));
    setQuery('');
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
        ...d, id, status: 'setup', isDefault: false, ticketCount: 0,
        createdOn: new Date().toISOString().slice(0, 10), setup: NEW_SETUP(),
      }],
    }));
    // Land on the new desk's setup checklist: an empty desk's next job is setup, not the list.
    onPath(String(id));
    toast.success(`${d.name} created`, { description: 'Finish the required setup steps, then Go Live.' });
  };

  const closeEdit = (id: number) => { onPath(editFromList ? undefined : String(id)); setEditFromList(false); };

  const saveDesk = (id: number, d: DeskDraft) => {
    const w = desks.find((x) => x.id === id)!;
    // Type never changes after create; the code only while still in Setup (and never for IT).
    update(id, { ...d, type: w.type, code: w.isDefault || w.status !== 'setup' ? w.code : d.code });
    closeEdit(id);
    toast.success(`${d.name} updated`);
  };

  const markStep = (id: number, step: SetupStepId) => {
    const w = desks.find((x) => x.id === id)!;
    update(id, { setup: { ...w.setup, [step]: true } });
    const st = SETUP_STEPS.find((x) => x.id === step)!;
    toast.success(`${st.title}: done`, { description: `Prototype only. The real screen is designed in ${st.feature}.` });
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
      if (confirm.kind === 'live' && missingRequired(w).length) return; // guarded in the UI too
      const status: DeskStatus = confirm.kind === 'inactive' ? 'inactive' : 'live';
      update(w.id, { status });
      toast.success(confirm.kind === 'live' ? `${w.name} is now Live` : confirm.kind === 'inactive' ? `${w.name} is now Inactive` : `${w.name} is Live again`);
    }
    setConfirm(null);
  };

  // ── permission denied ──
  if (store.viewAs === 'technician') {
    return (
      <div className="px-4 pb-6 pt-6">
        <div className="flex justify-end">{controls}</div>
        <Notice icon={<Lock size={28} strokeWidth={1.6} />} title="You don't have permission to view this page" action={<button onClick={onBackToApp} className={primaryBtn}>Back to app</button>}>
          Ask your administrator if you need access to Desk settings.
        </Notice>
      </div>
    );
  }

  const atLimit = desks.length >= MAX_DESKS;
  const [idPart, sub] = (path ?? '').split('/');
  const current = /^\d+$/.test(idPart) ? desks.find((w) => w.id === Number(idPart)) : undefined;
  const editing = current && sub === 'edit' ? current : undefined;
  const notFound = !!path && path !== 'create' && !current && !loading;

  if (notFound) {
    return (
      <div className="px-4 pb-6 pt-6">
        <Notice icon={<SearchX size={28} strokeWidth={1.6} />} title="Desk does not exist" action={<button onClick={() => onPath(undefined)} className={primaryBtn}>Back to Desks</button>}>
          This desk does not exist, or you do not have access to it.
        </Notice>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const rows = sortDesks(desks).filter((w) =>
    !q || w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || TYPE_LABEL[w.type].toLowerCase().includes(q));
  const showError = !loading && store.demo === 'error';
  const onlyIt = !loading && !showError && desks.length === 1 && desks[0].isDefault;

  const createButton = (
    <button disabled={loading || atLimit} onClick={() => onPath('create')} className={`${primaryBtn} ${atLimit ? 'pointer-events-none' : ''}`}>
      <Plus size={15} /> Create Desk
    </button>
  );

  const target = confirm ? desks.find((w) => w.id === confirm.id) : undefined;
  const b = (s: string) => <strong className="font-semibold text-[#364658]">{s}</strong>;

  function renderConfirm() {
    if (!confirm || !target) return null;
    return (
        <ConfirmDialog
          title={
            confirm.kind === 'live' ? `Make ${target.name} Live?`
              : confirm.kind === 'inactive' ? `Make ${target.name} Inactive?`
                : confirm.kind === 'reactivate' ? `Make ${target.name} Live again?`
                  : `Delete ${target.name}?`
          }
          confirmLabel={confirm.kind === 'live' ? 'Go Live' : confirm.kind === 'inactive' ? 'Make Inactive' : confirm.kind === 'reactivate' ? 'Make Live' : 'Delete'}
          danger={confirm.kind === 'delete' || confirm.kind === 'inactive'}
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
        >
          {confirm.kind === 'live' && <p>{b(target.name)} will start taking requests. Its short code {b(target.code)} is locked from now on.</p>}
          {confirm.kind === 'inactive' && <p>{b(target.name)} will stop taking new requests. Its {target.ticketCount.toLocaleString()} existing tickets stay available and reportable. You can make it Live again later.</p>}
          {confirm.kind === 'reactivate' && <p>{b(target.name)} will start taking requests again.</p>}
          {confirm.kind === 'delete' && <p>{b(target.name)} has no tickets. Deleting it removes the desk and its setup. This cannot be undone.</p>}
        </ConfirmDialog>
    );
  }

  const editDrawer = editing && !loading && (
    <DeskForm key={editing.id} mode="edit" desk={editing} desks={desks} onCancel={() => closeEdit(editing.id)} onSubmit={(d) => saveDesk(editing.id, d)} />
  );

  // ── the desk page ──
  if (current && !(editing && editFromList)) {
    return (
      <>
        {renderConfirm()}
        {editDrawer}
        <AdminDeskPage
          desk={current}
          onBack={() => onPath(undefined)}
          onEdit={() => onPath(`${current.id}/edit`)}
          onAction={(kind) => setConfirm({ kind, id: current.id })}
          onStep={(step) => markStep(current.id, step)}
        />
      </>
    );
  }

  return (
    <div className="px-4 pb-6 pt-6">
      {renderConfirm()}
      {editDrawer}
      <div className="mb-4 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-semibold text-[#364658]">Desks</h1>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
            Give each department (IT, HR, Facilities, Finance…) its own service desk in one ServiceOps.{' '}
            <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-0.5 text-[13px] text-[#364658] underline underline-offset-2 hover:text-[#3D8BD0]">View Docs <ExternalLink size={12} /></a>
          </p>
        </div>
        <div className="flex-shrink-0 pt-0.5">{controls}</div>
      </div>

      {onlyIt && (
        <div className="mb-4 flex items-start gap-2.5 rounded border border-[#DCEBFA] bg-[#F5FAFF] px-3.5 py-3 text-[13px] leading-[1.6] text-[#36577A]">
          <Info size={16} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
          <div>
            ServiceOps is running as one <strong className="font-semibold">IT</strong> desk, exactly as before. Everything that existed before desks
            (tickets, groups, catalog and settings) is in IT. Create a desk to give HR, Facilities or Finance their own.
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <div className="relative w-[280px] max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search desks"
            className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>}
        </div>
        <div className="ml-auto">
          {atLimit && !loading ? (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild><span className="inline-flex cursor-not-allowed">{createButton}</span></TooltipTrigger>
              <TooltipContent>You have reached the limit of {MAX_DESKS} desks.</TooltipContent>
            </Tooltip>
          ) : createButton}
        </div>
      </div>

      {showError ? (
        <Notice icon={<CloudOff size={28} strokeWidth={1.6} />} title="Couldn't load desks" action={<button onClick={() => applyDemo('four')} className={primaryBtn}>Retry</button>}>
          Something went wrong while loading this page.
        </Notice>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed" aria-busy={loading}>
            <colgroup>
              <col style={{ width: '30%' }} /><col style={{ width: '11%' }} /><col style={{ width: '20%' }} />
              <col style={{ width: '12%' }} /><col style={{ width: '10%' }} /><col style={{ width: '112px' }} />
            </colgroup>
            <thead className="border-b border-[#e5e7eb]">
              <tr>{COLUMNS.map((h) => <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {loading ? [0, 1, 2, 3].map((r) => (
                <tr key={r}>{COLUMNS.map((c, i) => (
                  <td key={c} className="px-4 py-3.5"><div className="h-3 animate-pulse rounded bg-[#E9EDF2]" style={{ width: `${[60, 40, 70, 45, 30, 55][(r + i) % 6]}%` }} /></td>
                ))}</tr>
              )) : rows.length === 0 ? (
                <tr><td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No desks match “{query}”.</td></tr>
              ) : rows.map((w) => {
                const deleteTip = w.isDefault ? 'The IT desk cannot be deleted.'
                  : w.ticketCount > 0 ? `Has ${w.ticketCount} tickets, so it can't be deleted. Make it Inactive instead.` : 'Delete';
                return (
                  <tr key={w.id} data-desk-row={w.code} className="transition-colors hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 align-top">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: w.colour }} />
                        <button onClick={() => onPath(String(w.id))} className="truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0] hover:underline">{w.name}</button>
                        {w.isDefault && <DefaultTag />}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 pl-[18px] text-[12px] text-[#7B8FA5]">
                        <span className="font-mono">{w.code}</span>
                        {w.description && <><span>·</span><span className="truncate" title={w.description}>{w.description}</span></>}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-[13px] text-[#364658]">{TYPE_LABEL[w.type]}</td>
                    <td className="px-4 py-3 align-top"><Owners ids={w.ownerIds} /></td>
                    <td className="px-4 py-3 align-top"><StatusPill status={w.status} /></td>
                    <td className="px-4 py-3 align-top text-[13px] text-[#364658]">{w.ticketCount.toLocaleString()}</td>
                    <td className="px-4 py-2 align-top">
                      <div className="flex items-center gap-0.5">
                        <IconAction name="Edit" tip="Edit" onClick={() => { setEditFromList(true); onPath(`${w.id}/edit`); }}><Pencil size={15} /></IconAction>
                        {w.status === 'setup' && (() => {
                          const left = missingRequired(w).length;
                          return (
                            <IconAction
                              name="Go Live"
                              tip={left ? `${left} required setup step${left > 1 ? 's' : ''} left. Open the desk to finish setup.` : 'Go Live'}
                              disabled={left > 0}
                              onClick={() => setConfirm({ kind: 'live', id: w.id })}
                            ><Rocket size={15} /></IconAction>
                          );
                        })()}
                        {w.status === 'live' && (
                          <IconAction
                            name="Make Inactive"
                            tip={w.isDefault ? 'The IT desk is always Live.' : 'Make Inactive'}
                            disabled={w.isDefault}
                            onClick={() => setConfirm({ kind: 'inactive', id: w.id })}
                          ><CirclePause size={15} /></IconAction>
                        )}
                        {w.status === 'inactive' && (
                          <IconAction name="Make Live again" tip="Make Live again" onClick={() => setConfirm({ kind: 'reactivate', id: w.id })}><CirclePlay size={15} /></IconAction>
                        )}
                        <IconAction name="Delete" tip={deleteTip} disabled={w.isDefault || w.ticketCount > 0} danger onClick={() => setConfirm({ kind: 'delete', id: w.id })}><Trash2 size={15} /></IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {path === 'create' && !loading && (
        <DeskForm mode="create" desks={desks} onCancel={() => onPath(undefined)} onSubmit={createDesk} />
      )}
    </div>
  );
}
