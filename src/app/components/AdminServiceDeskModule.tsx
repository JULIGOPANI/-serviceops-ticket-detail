import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CloudOff, FlaskConical, Headset, Lock, Pencil, Plus, Search, SearchX, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PrimaryTag, ServiceDeskForm } from './AdminServiceDeskForm';
import {
  DEMO_OPTIONS, MAX_SERVICE_DESKS, VIEW_AS_OPTIONS, audienceSummary, loadStore, membersOf, saveStore,
  seedFor, sortDesks,
} from './serviceDeskData';
import type { DemoData, DeskDraft, DeskStore, DraftMember, ViewAs } from './serviceDeskData';

/* Service Desks — Admin › Platform Configuration › Organization. ESM build slice S1.
 *
 * One module, four screens, all addressed by the URL (#/admin/organization/service-desk[/create|/:id]):
 *   list · create · edit · not-found. Plus the page-level permission-denied screen.
 *
 * ⚠️ Exactly ONE primary desk, always. Make Primary moves the flag, delete refuses the primary, and
 * the first desk ever created is primary whether or not its box was ticked.
 *
 * ⚠️ Not-found and permission-denied are DIFFERENT screens on purpose. Not-found hides whether a
 * record exists (the product answers `404 "request does not exist."`), so it must never say
 * forbidden/denied/403. Denied is about a whole page the viewer is not entitled to. */

const primaryBtn = 'inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-50';
const secondaryBtn = 'inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';

const COLUMNS = ['Name', 'Description', 'Visibility', 'Technicians', 'Action'];
const LOAD_MS = 800;

// ── Small pieces ───────────────────────────────────────────────────────────

/** An icon action whose tooltip still shows when it is disabled — the tooltip IS the explanation. */
function IconAction({ name, tip, disabled, danger, onClick, children }: {
  name: string; tip: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        {/* A disabled button fires no pointer events, so the wrapper carries the hover. */}
        <span className={`inline-flex ${disabled ? 'cursor-not-allowed' : ''}`}>
          <button
            type="button"
            aria-label={name}
            disabled={disabled}
            onClick={onClick}
            className={`flex size-8 items-center justify-center rounded transition-colors ${
              disabled
                ? 'pointer-events-none text-[#CBD5E1]'
                : danger
                  ? 'text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#364658]'
            }`}
          >{children}</button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function ConfirmDialog({ title, children, confirmLabel, danger, onCancel, onConfirm }: {
  title: string; children: ReactNode; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sd-confirm-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-[460px] max-w-full rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
          <h2 id="sd-confirm-title" className="text-[16px] font-semibold text-[#364658]">{title}</h2>
          <button onClick={onCancel} aria-label="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>
        <p className="px-5 pb-5 text-[13px] leading-[1.6] text-[#64748B]">{children}</p>
        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button onClick={onCancel} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button
            onClick={onConfirm}
            className={`inline-flex h-8 items-center rounded px-3.5 text-[13px] font-medium text-white transition-colors ${
              danger ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#3D8BD0] hover:bg-[#2d6ca0]'
            }`}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ⚠️ Prototype controls are NOT a product feature and must not look like one: a dashed button and a
   "Not a feature" tag. They exist so every state of this slice is reachable in a browser. */
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
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded border border-dashed border-[#94A3B8] bg-white px-3 text-[13px] font-medium text-[#64748B] transition-colors hover:border-[#64748B] hover:text-[#364658]"
          ><FlaskConical size={15} /> Prototype controls</button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[340px] bg-white p-0">
          <div className="border-b border-[#EEF1F5] px-4 py-3">
            <div className="text-[13px] font-semibold text-[#364658]">Prototype controls</div>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">For reviewing this prototype only — not part of ServiceOps.</p>
          </div>
          <div className="border-b border-[#EEF1F5] px-2 py-3">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Demo data</div>
            {DEMO_OPTIONS.map((o) => radio('sd-demo', demo === o.value, o.label, () => onDemo(o.value)))}
            <button
              type="button"
              onClick={onReset}
              className="ml-2 mt-2 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >Reset demo data</button>
          </div>
          <div className="px-2 py-3">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">View as</div>
            {VIEW_AS_OPTIONS.map((o) => radio('sd-view-as', viewAs === o.value, o.label, () => onViewAs(o.value)))}
          </div>
        </PopoverContent>
      </Popover>
      <span className="rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#92400E]">Not a feature</span>
    </div>
  );
}

/** A centred message inside the white content area — empty, error, not-found and denied share it. */
function Notice({ icon, title, children, action, dashed }: {
  icon: ReactNode; title: string; children: ReactNode; action?: ReactNode; dashed?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg px-6 py-20 text-center ${dashed ? 'border border-dashed border-[#D9E0EA] bg-[#FCFDFE]' : ''}`}>
      <span className="flex size-16 items-center justify-center rounded-full bg-[#EBF5FF] text-[#3D8BD0]">{icon}</span>
      <h2 className="mt-4 text-[16px] font-semibold text-[#364658]">{title}</h2>
      <div className="mt-1.5 max-w-[520px] text-[13px] leading-[1.6] text-[#7B8FA5]">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SkeletonTable() {
  const widths = ['62%', '80%', '48%', '30%', '56%'];
  return (
    <table className="w-full min-w-[900px] table-fixed" aria-busy="true" aria-label="Loading Service Desks">
      <Cols />
      <thead className="border-b border-[#e5e7eb]">
        <tr>{COLUMNS.map((h) => <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-[#e5e7eb] bg-white">
        {[0, 1, 2, 3, 4].map((r) => (
          <tr key={r} data-skeleton-row>
            {COLUMNS.map((c, i) => (
              <td key={c} className="px-4 py-3.5">
                <div className="h-3 animate-pulse rounded bg-[#E9EDF2]" style={{ width: i === 4 ? '70%' : widths[(r + i) % widths.length] }} />
                {i === 0 && <div className="mt-2 h-2.5 w-[30%] animate-pulse rounded bg-[#F1F4F8]" />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Cols() {
  return (
    <colgroup>
      <col style={{ width: '24%' }} />
      <col />
      <col style={{ width: '22%' }} />
      <col style={{ width: '12%' }} />
      <col style={{ width: '132px' }} />
    </colgroup>
  );
}

// ── Module ─────────────────────────────────────────────────────────────────

interface AdminServiceDeskModuleProps {
  /** The segment after the list route: 'create', a desk id, or undefined for the list. */
  path?: string;
  onPath: (path: string | undefined) => void;
  onBackToApp: () => void;
}

type Confirm = { kind: 'primary' | 'delete'; id: number } | null;

export function AdminServiceDeskModule({ path, onPath, onBackToApp }: AdminServiceDeskModuleProps) {
  const [store, setStore] = useState<DeskStore>(loadStore);
  useEffect(() => { saveStore(store); }, [store]);

  /* The list "loads" once when the module opens, and again on every demo-data change or Retry.
     Bumping the key restarts the timer. */
  const [loadKey, setLoadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loadKey]);

  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<Confirm>(null);

  const { desks, memberships } = store;
  const primary = desks.find((d) => d.isPrimary);

  const applyDemo = (demo: DemoData) => {
    setStore((s) => ({ ...s, demo, ...seedFor(demo) }));
    setQuery('');
    setConfirm(null);
    setLoadKey((k) => k + 1);
  };
  const setViewAs = (viewAs: ViewAs) => setStore((s) => ({ ...s, viewAs }));

  const controls = (
    <PrototypeControls
      demo={store.demo}
      viewAs={store.viewAs}
      onDemo={applyDemo}
      onViewAs={setViewAs}
      onReset={() => applyDemo('four')}
    />
  );

  // ── mutations ──

  const createDesk = (draft: DeskDraft, members: DraftMember[]) => {
    setStore((s) => {
      const id = Math.max(0, ...s.desks.map((d) => d.id)) + 1;
      const makePrimary = s.desks.length === 0 || draft.isPrimary;
      return {
        ...s,
        desks: [
          ...s.desks.map((d) => (makePrimary ? { ...d, isPrimary: false } : d)),
          { ...draft, id, isPrimary: makePrimary },
        ],
        memberships: [...s.memberships, ...members.map((x) => ({ ...x, serviceDeskId: id }))],
      };
    });
    onPath(undefined);
    toast.success('Service Desk created successfully');
  };

  const updateDesk = (id: number, draft: DeskDraft, members: DraftMember[]) => {
    setStore((s) => ({
      ...s,
      // The identifier and the primary flag are never changed from this form.
      desks: s.desks.map((d) => (d.id === id ? { ...d, ...draft, id, identifier: d.identifier, isPrimary: d.isPrimary } : d)),
      memberships: [
        ...s.memberships.filter((x) => x.serviceDeskId !== id),
        ...members.map((x) => ({ ...x, serviceDeskId: id })),
      ],
    }));
    onPath(undefined);
    toast.success('Service Desk updated successfully');
  };

  const makePrimary = (id: number) => {
    setStore((s) => ({ ...s, desks: s.desks.map((d) => ({ ...d, isPrimary: d.id === id })) }));
    setConfirm(null);
    toast.success('Primary Service Desk updated');
  };

  const deleteDesk = (id: number) => {
    // The primary desk's delete is disabled; guarded here too so no path can reach zero primaries.
    if (desks.find((d) => d.id === id)?.isPrimary) return;
    setStore((s) => ({
      ...s,
      desks: s.desks.filter((d) => d.id !== id),
      memberships: s.memberships.filter((x) => x.serviceDeskId !== id),
    }));
    setConfirm(null);
    toast.success('Service Desk deleted successfully');
  };

  // ── permission-denied: every route, before anything else is decided ──
  if (store.viewAs === 'technician') {
    return (
      <div className="px-4 pb-6 pt-6">
        {/* The controls stay reachable, or a reviewer who switched to Technician could not switch back. */}
        <div className="flex justify-end">{controls}</div>
        <Notice
          icon={<Lock size={28} strokeWidth={1.6} />}
          title="You don't have permission to view this page"
          action={<button onClick={onBackToApp} className={primaryBtn}>Back to app</button>}
        >
          Ask your administrator if you need access to Service Desk settings.
        </Notice>
      </div>
    );
  }

  // ── create ──
  if (path === 'create') {
    return (
      <ServiceDeskForm
        key="create"
        mode="create"
        desks={desks}
        memberships={memberships}
        onCancel={() => onPath(undefined)}
        onSubmit={createDesk}
      />
    );
  }

  // ── edit / not-found ──
  if (path) {
    const desk = /^\d+$/.test(path) ? desks.find((d) => d.id === Number(path)) : undefined;
    if (!desk) {
      return (
        <div className="px-4 pb-6 pt-6">
          <Notice
            icon={<SearchX size={28} strokeWidth={1.6} />}
            title="Service Desk does not exist"
            action={<button onClick={() => onPath(undefined)} className={primaryBtn}>Back to Service Desks</button>}
          >
            This Service Desk does not exist, or you do not have access to it.
          </Notice>
        </div>
      );
    }
    return (
      <ServiceDeskForm
        key={`edit-${desk.id}`}
        mode="edit"
        desk={desk}
        desks={desks}
        memberships={memberships}
        onCancel={() => onPath(undefined)}
        onSubmit={(draft, members) => updateDesk(desk.id, draft, members)}
      />
    );
  }

  // ── list ──
  const atLimit = desks.length >= MAX_SERVICE_DESKS;
  const q = query.trim().toLowerCase();
  const rows = sortDesks(desks).filter((d) => !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  const showError = !loading && store.demo === 'error';
  const empty = !loading && !showError && desks.length === 0;

  const createButton = (
    <button disabled={loading || atLimit} onClick={() => onPath('create')} className={`${primaryBtn} ${atLimit ? 'pointer-events-none' : ''}`}>
      <Plus size={15} /> Create Service Desk
    </button>
  );

  const head = (
    <div className="mb-4 flex flex-wrap items-start gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-[20px] font-semibold text-[#364658]">Service Desks</h1>
        <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
          Run HR, Facilities, Finance and IT as separate service desks inside one ServiceOps.
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3 pt-0.5">
        {atLimit && !loading ? (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild><span className="inline-flex cursor-not-allowed">{createButton}</span></TooltipTrigger>
            <TooltipContent>You have reached the limit of {MAX_SERVICE_DESKS} Service Desks.</TooltipContent>
          </Tooltip>
        ) : createButton}
        {controls}
      </div>
    </div>
  );

  const confirmTarget = confirm ? desks.find((d) => d.id === confirm.id) : undefined;

  return (
    <div className="px-4 pb-6 pt-6">
      {head}

      {loading ? (
        <div className="overflow-x-auto"><SkeletonTable /></div>
      ) : showError ? (
        <Notice
          dashed
          icon={<CloudOff size={28} strokeWidth={1.6} />}
          title="Couldn't load Service Desks"
          action={<button onClick={() => applyDemo('four')} className={primaryBtn}>Retry</button>}
        >
          Something went wrong while loading this page.
        </Notice>
      ) : empty ? (
        <Notice
          dashed
          icon={<Headset size={28} strokeWidth={1.6} />}
          title="No Service Desks yet"
          action={<button onClick={() => onPath('create')} className={primaryBtn}><Plus size={15} /> Create Service Desk</button>}
        >
          <p>ServiceOps is running as a single service desk, exactly as it does today.</p>
          <p>Create a Service Desk to start running HR, Facilities or Finance as their own desk, with their own catalog, technicians and requests.</p>
        </Notice>
      ) : (
        <>
          <div className="mb-3">
            <div className="relative w-[280px] max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Service Desks"
                aria-label="Search Service Desks"
                className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#364658]"><X size={15} /></button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed">
              <Cols />
              <thead className="border-b border-[#e5e7eb]">
                <tr>{COLUMNS.map((h) => <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] bg-white">
                {rows.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                    No Service Desks match “{query}”.
                  </td></tr>
                ) : rows.map((d) => {
                  const ms = membersOf(memberships, d.id);
                  const managers = ms.filter((x) => x.membershipType === 'manager').length;
                  const audience = audienceSummary(d);
                  return (
                    <tr key={d.id} data-desk-row={d.identifier} className="transition-colors hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 align-top">
                        <div className="flex min-w-0 items-center gap-2">
                          <button
                            onClick={() => onPath(String(d.id))}
                            className="truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0] hover:underline"
                          >{d.name}</button>
                          {d.isPrimary && <PrimaryTag />}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-[#7B8FA5]">/{d.identifier}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="truncate text-[13px] text-[#64748B]" title={d.description}>{d.description || '—'}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {d.visibility === 'restricted' ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border border-[#FCD34D] bg-[#FFFBEB] px-2 py-0.5 text-[12px] font-medium text-[#B45309]">
                            <Lock size={11} /> Restricted
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-sm border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[12px] font-medium text-[#475569]">Open</span>
                        )}
                        {audience && <div className="mt-1 truncate text-[12px] text-[#7B8FA5]" title={`Audience: ${audience}`}>Audience: {audience}</div>}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-[13px] font-medium text-[#364658]">{ms.length}</div>
                        <div className="text-[12px] text-[#7B8FA5]">{managers} {managers === 1 ? 'manager' : 'managers'}</div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex items-center gap-0.5">
                          <IconAction name="Edit" tip="Edit" onClick={() => onPath(String(d.id))}><Pencil size={15} /></IconAction>
                          <IconAction
                            name="Make Primary"
                            tip={d.isPrimary ? 'This is already the primary Service Desk.' : 'Make Primary'}
                            disabled={d.isPrimary}
                            onClick={() => setConfirm({ kind: 'primary', id: d.id })}
                          ><Star size={15} /></IconAction>
                          <IconAction
                            name="Delete"
                            tip={d.isPrimary ? 'The primary Service Desk cannot be deleted.' : 'Delete'}
                            disabled={d.isPrimary}
                            danger
                            onClick={() => setConfirm({ kind: 'delete', id: d.id })}
                          ><Trash2 size={15} /></IconAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {confirm?.kind === 'primary' && confirmTarget && (
        <ConfirmDialog
          title="Make this the primary Service Desk?"
          confirmLabel="Make Primary"
          onCancel={() => setConfirm(null)}
          onConfirm={() => makePrimary(confirmTarget.id)}
        >
          <strong className="font-semibold text-[#364658]">{confirmTarget.name}</strong> will become the primary Service Desk.{' '}
          {primary && <><strong className="font-semibold text-[#364658]">{primary.name}</strong> will no longer be primary.{' '}</>}
          Any request that is not routed to a specific desk will go to <strong className="font-semibold text-[#364658]">{confirmTarget.name}</strong>.
        </ConfirmDialog>
      )}

      {confirm?.kind === 'delete' && confirmTarget && (() => {
        const n = membersOf(memberships, confirmTarget.id).length;
        return (
          <ConfirmDialog
            title={`Delete ${confirmTarget.name}?`}
            confirmLabel="Delete"
            danger
            onCancel={() => setConfirm(null)}
            onConfirm={() => deleteDesk(confirmTarget.id)}
          >
            <strong className="font-semibold text-[#364658]">{confirmTarget.name}</strong> has {n} {n === 1 ? 'technician' : 'technicians'}. Deleting it removes the desk and its configuration. This cannot be undone.
          </ConfirmDialog>
        );
      })()}
    </div>
  );
}
