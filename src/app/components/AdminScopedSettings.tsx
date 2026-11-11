import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronRight, Copy, ExternalLink, Layers, Lock, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Pagination } from './Pagination';
import { DefaultTag, SideDrawer } from './workspaceUi';
import type { Workspace } from './workspaceData';
import {
  DAYS, ORG, TIME_ZONES, hoursUsableIn, loadSettings, orgSlasFor, saveSettings, workingHoursLabel,
} from './workspaceSettingsData';
import type { BusinessHours, Owner, SettingsStore, Sla, SlaModule, SlaType } from './workspaceSettingsData';

/* The ServiceOps Business Hours and SLA screens, made workspace-aware. ESM F04 (decided 2026-11-02).
 *
 * The pages are the live ones (172.16.15.185 /admin/business-hours and /admin/sla, checked 2026-10-30 and
 * 2026-11-02): same title, subtitle, columns, buttons and row actions. ESM adds only what F04 decided:
 *   - F04 rev. 2 (Juli 2026-11-03, replaces D2's Workspace ▾ selector): Organization settings show the
 *     organization's records; a workspace's own records are in its settings. One workspace = today's page.
 *   - D3: Business Hours is Shared + own. A workspace lists the organization's calendars in an
 *     "Organization" group (usable, read-only here) above its own.
 *   - SLA = Organization + own (rev. 2, replaces D1): a workspace's SLAs are matched first, then the
 *     organization's (which may be aimed at some workspaces). Problem / Change / Release only where IT is. */

export const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
export const searchCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
export const primaryBtn = 'inline-flex h-9 items-center gap-1.5 rounded bg-[#1F2937] px-4 text-[13px] font-medium text-white hover:bg-[#111827]';
export const secondaryBtn = 'inline-flex h-9 items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#f9fafb]';
export const th = 'whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';
export const td = 'px-4 py-3 text-[13px] text-[#364658]';

function useSettings(): [SettingsStore, (fn: (s: SettingsStore) => SettingsStore) => void] {
  const [store, setStore] = useState<SettingsStore>(loadSettings);
  const update = (fn: (s: SettingsStore) => SettingsStore) => setStore((s) => { const n = fn(s); saveSettings(n); return n; });
  return [store, update];
}

const nextId = (xs: { id: number }[]) => xs.reduce((m, x) => Math.max(m, x.id), 0) + 1;

export function Dot({ colour }: { colour: string }) {
  return <span className="inline-block size-2.5 flex-shrink-0 rounded-full" style={{ background: colour }} />;
}

export function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} aria-label={label} className={`inline-flex size-7 items-center justify-center rounded hover:bg-[#F1F5F9] ${danger ? 'text-[#DC2626]' : 'text-[#64748B] hover:text-[#364658]'}`}>{children}</button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative inline-flex h-[18px] w-8 flex-shrink-0 items-center rounded-full transition-colors ${on ? 'bg-[#22C55E]' : 'bg-[#94A3B8]'}`}>
      <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

// ── Organization layer (F04 rev. 2, Juli 2026-11-03) ──────────────────────────────────────────

/** The run-order line on a layered page: says which records win, in the page's own words. */
export function LayerNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex max-w-[900px] items-start gap-2 rounded-md border border-[#DBEAFE] bg-[#F5FAFF] px-3 py-2 text-[12px] leading-[1.55] text-[#364658]">
      <Layers size={14} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" /><span>{children}</span>
    </div>
  );
}

/** A grey group header row inside a listing table: "<Workspace> (n)" or "Organization (n)". */
export function GroupRow({ cols, label, sub, dot, open, onToggle }: { cols: number; label: string; sub?: string; dot?: string; open?: boolean; onToggle?: () => void }) {
  const inner = (
    <>
      {onToggle ? <ChevronRight size={14} className={`text-[#7B8FA5] transition-transform ${open ? 'rotate-90' : ''}`} /> : dot ? <Dot colour={dot} /> : null}
      {label}{sub && <span className="font-normal text-[#7B8FA5]">· {sub}</span>}
    </>
  );
  return (
    <tr className="bg-[#F9FAFB]">
      <td colSpan={cols} className="px-4 py-2">
        {onToggle ? <button onClick={onToggle} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#364658]">{inner}</button>
          : <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#364658]">{inner}</span>}
      </td>
    </tr>
  );
}

/** The lock shown instead of row actions on an organization record inside a workspace. */
export function OrgLock({ what }: { what: string }) {
  return (
    <Tooltip><TooltipTrigger asChild><span className="inline-flex size-7 items-center justify-center text-[#94A3B8]"><Lock size={14} /></span></TooltipTrigger>
      <TooltipContent side="top">Organization {what} · changed in Organization settings</TooltipContent></Tooltip>
  );
}

/** "IT’s", "Human Resources’" — the possessive the run-order lines need. */
export const poss = (name: string) => (name.endsWith('s') ? `${name}’` : `${name}’s`);

export const orgToast = (name: string, what: string, how: string) =>
  toast(`${name} is an organization ${what}`, { description: `${how} Organization Admins change it in Organization settings.` });

/** Pick workspaces for an organization record's Workspace condition. Empty = every workspace. */
export function WorkspaceChips({ workspaces, value, onChange }: { workspaces: Workspace[]; value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button onClick={() => onChange([])} className={`h-8 rounded border px-2.5 text-[12px] font-medium ${value.length === 0 ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#1F5F99]' : 'border-[#d1d5db] text-[#64748B] hover:bg-[#f9fafb]'}`}>All workspaces</button>
      {workspaces.map((w) => {
        const on = value.includes(w.id);
        return (
          <button key={w.id} onClick={() => onChange(on ? value.filter((x) => x !== w.id) : [...value, w.id])}
            className={`inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[12px] font-medium ${on ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#1F5F99]' : 'border-[#d1d5db] text-[#64748B] hover:bg-[#f9fafb]'}`}>
            <Dot colour={w.colour} />{w.name}{on && <Check size={13} />}
          </button>
        );
      })}
    </div>
  );
}

// ── page chrome ────────────────────────────────────────────────────────────────────────────────

export function PageHead({ title, sub, workspace }: { title: string; sub: string; workspace?: Workspace }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5">
        <h1 className="text-[20px] font-semibold text-[#364658]">{title}</h1>
        {/* Inside a workspace the page is locked to it; say which, quietly. */}
        {workspace && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[12px] font-medium text-[#364658]"><Dot colour={workspace.colour} />{workspace.name}</span>}
      </div>
      <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
        {sub}{' '}
        <button onClick={() => toast.success(`Opening the ${title} documentation`)} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">View Docs <ExternalLink size={12} /></button>
      </p>
    </div>
  );
}

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-[280px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search" className={searchCls} />
      {value && <button onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>}
    </div>
  );
}

export function FormRow({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#364658]">{label}{required && <span className="text-[#DC2626]"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[#7B8FA5]">{hint}</span>}
    </label>
  );
}

// ── Business Hours (Shared + own) ──────────────────────────────────────────────────────────────

interface ScreenProps {
  workspaces: Workspace[];
  /** Inside a workspace's settings: locked to it, no selector. */
  locked?: Workspace;
}

export function BusinessHoursScreen({ workspaces, locked }: ScreenProps) {
  const [store, update] = useSettings();
  // Organization settings hold the organization's calendars; a workspace's own are in its settings (Q1).
  const scope: Owner = locked ? locked.id : ORG;
  const ws = workspaces.find((w) => w.id === scope);
  const [q, setQ] = useState('');
  const [orgOpen, setOrgOpen] = useState(true);
  const [drawer, setDrawer] = useState<{ mode: 'add' | 'edit'; rec?: BusinessHours } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const match = (h: BusinessHours) => !q.trim() || `${h.name} ${h.description} ${h.timeZone}`.toLowerCase().includes(q.trim().toLowerCase());
  const orgRows = store.hours.filter((h) => h.owner === ORG && match(h));
  const ownRows = ws ? store.hours.filter((h) => h.owner === ws.id && match(h)) : orgRows;
  const usedBy = (h: BusinessHours) => store.slas.filter((s) => s.hoursId === h.id);

  const save = (rec: BusinessHours) => {
    update((s) => ({ ...s, hours: s.hours.some((h) => h.id === rec.id) ? s.hours.map((h) => (h.id === rec.id ? rec : h)) : [...s.hours, rec] }));
    toast.success(drawer?.mode === 'edit' ? `${rec.name} updated` : `${rec.name} added`, { description: rec.owner === ORG ? 'Every workspace can use it.' : `Only ${ws?.name} can use it.` });
    setDrawer(null);
  };
  const copy = (h: BusinessHours) => {
    const rec: BusinessHours = { ...h, id: nextId(store.hours), owner: scope, name: `Copy of ${h.name}`, isDefault: false, holidays: h.holidays.map((x) => ({ ...x })) };
    update((s) => ({ ...s, hours: [...s.hours, rec] }));
    toast.success(`${rec.name} added`, { description: scope === ORG ? 'Shared with every workspace.' : `A copy for ${ws?.name}; change it without affecting other workspaces.` });
  };
  const remove = (h: BusinessHours) => {
    const used = usedBy(h);
    if (used.length) {
      const where = [...new Set(used.map((s) => (s.owner === ORG ? 'Organization' : workspaces.find((w) => w.id === s.owner)?.name ?? 'a workspace')))].join(', ');
      toast.error(`${h.name} is in use`, { description: `${used.length} SLA${used.length > 1 ? 's count' : ' counts'} in it (${where}). Change ${used.length > 1 ? 'those SLAs' : 'that SLA'} first.` });
      return;
    }
    update((s) => ({ ...s, hours: s.hours.filter((x) => x.id !== h.id) }));
    toast.success(`${h.name} deleted`);
  };

  const row = (h: BusinessHours, readOnly: boolean) => (
    <tr key={h.id} className="hover:bg-[#f9fafb]">
      <td className={td}>
        <span className="inline-flex items-center gap-2">
          <button onClick={() => (readOnly ? toast(`${h.name} belongs to the organization`, { description: 'Use it in this workspace’s SLAs, or copy it to change it here.' }) : setDrawer({ mode: 'edit', rec: h }))} className="text-[13px] font-medium hover:text-[#3D8BD0]">{h.name}</button>
          {h.isDefault && <DefaultTag />}
          {h.holidays.length > 0 && <span className="text-[12px] text-[#7B8FA5]">· {h.holidays.length} holiday{h.holidays.length > 1 ? 's' : ''}</span>}
        </span>
      </td>
      <td className={td}>{workingHoursLabel(h)}</td>
      <td className={`${td} whitespace-nowrap`}>{h.timeZone}</td>
      <td className={`${td} text-[#64748B]`}>{h.description || ''}</td>
      <td className={td}>
        <span className="inline-flex items-center gap-0.5">
          <IconBtn label={readOnly ? `Copy to ${ws?.name}` : 'Copy'} onClick={() => copy(h)}><Copy size={15} /></IconBtn>
          {readOnly ? (
            <Tooltip><TooltipTrigger asChild><span className="inline-flex size-7 items-center justify-center text-[#94A3B8]"><Lock size={14} /></span></TooltipTrigger>
              <TooltipContent side="top">Organization calendar · only Organization Admins change it</TooltipContent></Tooltip>
          ) : (
            <>
              <IconBtn label="Edit" onClick={() => setDrawer({ mode: 'edit', rec: h })}><Pencil size={15} /></IconBtn>
              {!h.isDefault && <IconBtn label="Delete" danger onClick={() => remove(h)}><Trash2 size={15} /></IconBtn>}
            </>
          )}
        </span>
      </td>
    </tr>
  );

  const total = ws ? orgRows.length + ownRows.length : orgRows.length;
  const pageOwn = ownRows.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4 py-6">
      <PageHead title="Business Hours" sub="Set operating hours used to calculate SLAs and schedules." workspace={locked} />
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <span className="hidden text-[12px] text-[#7B8FA5] lg:inline">
          {ws ? `${ws.name} can use the organization’s calendars and its own.` : 'Organization calendars can be used by every workspace.'}
        </span>
        <button onClick={() => setDrawer({ mode: 'add' })} className={`${primaryBtn} ml-auto`}><Plus size={15} /> Add Business Hours</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead className="border-b border-[#e5e7eb]">
            <tr>{['Name', 'Working Hours', 'Time Zone', 'Description', 'Actions'].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {ws && (
              <>
                <tr className="bg-[#F9FAFB]">
                  <td colSpan={5} className="px-4 py-2">
                    <button onClick={() => setOrgOpen((o) => !o)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#364658]">
                      <ChevronRight size={14} className={`text-[#7B8FA5] transition-transform ${orgOpen ? 'rotate-90' : ''}`} />
                      Organization ({orgRows.length})
                      <span className="font-normal text-[#7B8FA5]">· shared with every workspace</span>
                    </button>
                  </td>
                </tr>
                {orgOpen && orgRows.map((h) => row(h, true))}
                <tr className="bg-[#F9FAFB]">
                  <td colSpan={5} className="px-4 py-2 text-[12px] font-semibold text-[#364658]">
                    <span className="inline-flex items-center gap-1.5"><Dot colour={ws.colour} />{ws.name} ({ownRows.length})</span>
                  </td>
                </tr>
              </>
            )}
            {pageOwn.map((h) => row(h, false))}
            {ws && ownRows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-[13px] text-[#7B8FA5]">
                {q ? 'No calendars match.' : <>{ws.name} has no calendars of its own yet. Its SLAs can use the organization’s, or <button onClick={() => setDrawer({ mode: 'add' })} className="font-medium text-[#3D8BD0] hover:underline">add one</button>.</>}
              </td></tr>
            )}
            {!ws && orgRows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[13px] text-[#7B8FA5]">No calendars match.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(ownRows.length / perPage) || 1} itemsPerPage={perPage} totalItems={ownRows.length} onPageChange={setPage} onItemsPerPageChange={(n) => { setPerPage(n); setPage(1); }} />
      <p className="mt-3 text-[12px] text-[#7B8FA5]">Showing {total} calendar{total === 1 ? '' : 's'}</p>
      {drawer && (
        <HoursDrawer owner={drawer.rec?.owner ?? scope} ownerName={ws?.name} rec={drawer.rec} nextId={nextId(store.hours)} onClose={() => setDrawer(null)} onSave={save} />
      )}
    </div>
  );
}

function HoursDrawer({ owner, ownerName, rec, nextId: id, onClose, onSave }: {
  owner: Owner; ownerName?: string; rec?: BusinessHours; nextId: number; onClose: () => void; onSave: (h: BusinessHours) => void;
}) {
  const [d, setD] = useState<BusinessHours>(rec ?? { id, owner, name: '', description: '', timeZone: TIME_ZONES[0], mode: 'custom', days: DAYS.slice(0, 5), from: '09:00', to: '18:00', holidays: [] });
  const [hName, setHName] = useState('');
  const [hDate, setHDate] = useState('');
  const set = (p: Partial<BusinessHours>) => setD((x) => ({ ...x, ...p }));
  const ok = d.name.trim().length > 0 && (d.mode === '24x7' || d.days.length > 0);
  return (
    <SideDrawer title={rec ? 'Edit Business Hours' : 'Add Business Hours'} width={560} onClose={onClose}
      sub={owner === ORG ? 'Organization calendar · every workspace can use it' : `${ownerName} calendar · only ${ownerName} can use it`}
      footer={<div className="flex justify-end gap-2"><button onClick={onClose} className={secondaryBtn}>Cancel</button><button disabled={!ok} onClick={() => onSave({ ...d, name: d.name.trim() })} className={`${primaryBtn} disabled:opacity-40`}>{rec ? 'Update' : 'Add'}</button></div>}>
      <div className="space-y-4 px-6 py-5">
        <FormRow label="Name" required><input autoFocus value={d.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="Name" /></FormRow>
        <FormRow label="Description"><textarea value={d.description} onChange={(e) => set({ description: e.target.value })} rows={2} className={`${inputCls} h-auto py-2`} placeholder="Description" /></FormRow>
        <FormRow label="Time Zone" required>
          <select value={d.timeZone} onChange={(e) => set({ timeZone: e.target.value })} className={`${inputCls} app-select`}>{TIME_ZONES.map((t) => <option key={t}>{t}</option>)}</select>
        </FormRow>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-[#364658]">Working Hours</span>
          <div className="flex gap-4">
            {(['24x7', 'custom'] as const).map((m) => (
              <label key={m} className="inline-flex items-center gap-2 text-[13px] text-[#364658]">
                <input type="radio" checked={d.mode === m} onChange={() => set({ mode: m })} className="accent-[#3D8BD0]" />{m === '24x7' ? '24 hrs X 7 days' : 'Custom'}
              </label>
            ))}
          </div>
          {d.mode === 'custom' && (
            <div className="mt-3 rounded-lg border border-[#E5E7EB] p-3">
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                  const on = d.days.includes(day);
                  return <button key={day} onClick={() => set({ days: on ? d.days.filter((x) => x !== day) : DAYS.filter((x) => x === day || d.days.includes(x)) })}
                    className={`h-8 min-w-[44px] rounded border px-2 text-[12px] font-medium ${on ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#1F5F99]' : 'border-[#d1d5db] text-[#64748B] hover:bg-[#f9fafb]'}`}>{day}</button>;
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[13px] text-[#364658]">
                <input type="time" value={d.from} onChange={(e) => set({ from: e.target.value })} className={`${inputCls} w-[130px]`} />
                <span className="text-[#7B8FA5]">to</span>
                <input type="time" value={d.to} onChange={(e) => set({ to: e.target.value })} className={`${inputCls} w-[130px]`} />
              </div>
            </div>
          )}
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-[#364658]">Yearly Holidays</span>
          {d.holidays.length > 0 && (
            <ul className="mb-2 divide-y divide-[#F0F2F5] rounded-lg border border-[#E5E7EB]">
              {d.holidays.map((h, i) => (
                <li key={`${h.name}-${i}`} className="flex items-center gap-3 px-3 py-2 text-[13px] text-[#364658]">
                  <span className="flex-1">{h.name}</span>
                  <span className="text-[#7B8FA5]">{h.date}{h.recurring ? ' · every year' : ''}</span>
                  <IconBtn label="Remove holiday" danger onClick={() => set({ holidays: d.holidays.filter((_, j) => j !== i) })}><X size={14} /></IconBtn>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input value={hName} onChange={(e) => setHName(e.target.value)} placeholder="Holiday" className={inputCls} />
            <input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} className={`${inputCls} w-[160px]`} />
            <button disabled={!hName.trim() || !hDate} onClick={() => { set({ holidays: [...d.holidays, { name: hName.trim(), date: hDate, recurring: true }] }); setHName(''); setHDate(''); }}
              className={`${secondaryBtn} flex-shrink-0 disabled:opacity-40`}>Add Holiday</button>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}

// ── SLA (Organization + own, F04 rev. 2) ──────────────────────────────────────────────────────

export function SlaScreen({ workspaces, locked }: ScreenProps) {
  const [store, update] = useSettings();
  const multi = workspaces.length > 1;
  /* Inside a workspace: its SLAs + the organization's it meets. Organization admin with two or more workspaces: the
     organization's SLAs only (Q1). With one workspace: that workspace's, i.e. today's page (Q3). */
  const ws: Workspace | undefined = locked ?? (multi ? undefined : workspaces[0]);
  const owner: Owner = ws ? ws.id : ORG;
  const it = ws ? ws.type === 'it' : workspaces.some((w) => w.type === 'it');
  const modules: SlaModule[] = it ? ['Request', 'Problem', 'Change', 'Release'] : ['Request'];
  const [tab, setTab] = useState<SlaModule>('Request');
  const mod = modules.includes(tab) ? tab : 'Request';
  const [q, setQ] = useState('');
  const [orgOpen, setOrgOpen] = useState(true);
  const [drawer, setDrawer] = useState<{ rec?: Sla } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const match = (s: Sla) => !q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase());
  const rows = store.slas.filter((s) => s.owner === owner && s.module === mod && match(s));
  const orgRows = locked && multi ? orgSlasFor(store.slas, locked.id, mod).filter(match) : [];
  const hoursName = (s: Sla) => {
    if (s.hoursId === null) return <>Calendar Hours</>;
    const h = store.hours.find((x) => x.id === s.hoursId);
    return <>Business Hours <span className="text-[#7B8FA5]">· {h?.name ?? 'removed'}{h?.owner === ORG && owner !== ORG ? ' (Organization)' : ''}</span></>;
  };
  const targets = (s: Sla) => (s.workspaces?.length ? s.workspaces.map((id) => workspaces.find((w) => w.id === id)?.name ?? 'removed').join(', ') : 'All workspaces');
  const patch = (id: number, p: Partial<Sla>) => update((s) => ({ ...s, slas: s.slas.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const whose = ws?.name ?? 'the organization';

  const save = (rec: Sla) => {
    update((s) => ({ ...s, slas: s.slas.some((x) => x.id === rec.id) ? s.slas.map((x) => (x.id === rec.id ? rec : x)) : [...s.slas, rec] }));
    toast.success(drawer?.rec ? `${rec.name} updated` : `${rec.name} created`, {
      description: rec.owner === ORG ? `Matched after each workspace’s own SLAs · ${targets(rec)}.` : `Applies to ${whose} ${rec.module.toLowerCase()}s.`,
    });
    setDrawer(null);
  };
  const cols = ['Name', ...(owner === ORG ? ['Workspaces'] : []), 'Type', 'Operational Hours', 'Enabled', 'Response Time', 'Resolution Time', 'OLA Enabled', 'Actions'];

  const row = (s: Sla, n: number, readOnly: boolean) => (
    <tr key={s.id} className="hover:bg-[#f9fafb]">
      <td className={td}><button onClick={() => (readOnly ? orgToast(s.name, 'SLA', `${poss(locked?.name ?? '')} own SLAs are matched first; this one applies when none of them match.`) : setDrawer({ rec: s }))} className="text-left text-[13px] font-medium hover:text-[#3D8BD0]">{n}. {s.name}</button></td>
      {owner === ORG && <td className={`${td} text-[#64748B]`}>{targets(s)}</td>}
      <td className={`${td} whitespace-nowrap`}>{s.type}</td>
      <td className={`${td} whitespace-nowrap`}>{hoursName(s)}</td>
      <td className={td}>{readOnly ? <span className="text-[12px] text-[#64748B]">{s.enabled ? 'Yes' : 'No'}</span> : <Toggle on={s.enabled} label={`Enable ${s.name}`} onChange={(v) => { patch(s.id, { enabled: v }); toast.success(`${s.name} ${v ? 'enabled' : 'disabled'}`); }} />}</td>
      <td className={`${td} whitespace-nowrap`}>{s.response}</td>
      <td className={`${td} whitespace-nowrap`}>{s.resolution}</td>
      <td className={td}>{s.type === 'UC' ? <span className="text-[#94A3B8]">---</span> : readOnly ? <span className="text-[12px] text-[#64748B]">{s.ola ? 'Yes' : 'No'}</span> : <Toggle on={s.ola} label={`OLA for ${s.name}`} onChange={(v) => patch(s.id, { ola: v })} />}</td>
      <td className={td}>
        {readOnly ? <OrgLock what="SLA" /> : (
          <span className="inline-flex items-center gap-0.5">
            <IconBtn label="Edit" onClick={() => setDrawer({ rec: s })}><Pencil size={15} /></IconBtn>
            <IconBtn label="Copy" onClick={() => { const rec = { ...s, id: nextId(store.slas), name: `Copy of ${s.name}`, enabled: false }; update((x) => ({ ...x, slas: [...x.slas, rec] })); toast.success(`${rec.name} created (disabled)`); }}><Copy size={15} /></IconBtn>
            <IconBtn label="Delete" danger onClick={() => { update((x) => ({ ...x, slas: x.slas.filter((y) => y.id !== s.id) })); toast.success(`${s.name} deleted`); }}><Trash2 size={15} /></IconBtn>
          </span>
        )}
      </td>
    </tr>
  );

  return (
    <div className="px-4 py-6">
      <PageHead title="SLA" sub="Set response and resolution targets with breach actions." workspace={locked} />
      {multi && (
        <LayerNote>
          {locked
            ? <>{/^[AEIOU]/.test(locked.name) ? 'An' : 'A'} {locked.name} {mod.toLowerCase()} is matched against <b>{poss(locked.name)} SLAs first</b>, then the organization’s. The first match applies.</>
            : <>Organization SLAs apply in every workspace (or the ones you pick) <b>after each workspace’s own</b>: they catch the requests a workspace’s SLAs don’t match. Each workspace’s SLAs are in its own settings.</>}
        </LayerNote>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => toast(`SLA Setting for ${whose}`, { description: 'The same ServiceOps SLA Setting.' })} className={secondaryBtn}>SLA Setting</button>
          <button onClick={() => setDrawer({})} className={primaryBtn}><Plus size={15} /> Create SLA</button>
        </div>
      </div>
      {/* Problem, Change and Release are IT processes: their tabs appear only where IT workspaces are (F01 §2g). */}
      {modules.length > 1 && (
        <div className="mb-3 inline-flex rounded-md bg-[#EEF2F6] p-0.5">
          {modules.map((m) => (
            <button key={m} onClick={() => { setTab(m); setPage(1); }} className={`rounded px-3 py-1.5 text-[13px] font-medium ${mod === m ? 'bg-[#1F2937] text-white' : 'text-[#364658] hover:bg-white'}`}>{m}</button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="border-b border-[#e5e7eb]">
            <tr>{cols.map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {locked && multi && <GroupRow cols={cols.length} label={`${locked.name} (${rows.length})`} sub="matched first" dot={locked.colour} />}
            {rows.slice((page - 1) * perPage, page * perPage).map((s, i) => row(s, (page - 1) * perPage + i + 1, false))}
            {rows.length === 0 && (
              <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-[13px] text-[#7B8FA5]">
                {q ? 'No SLAs match.' : <>{ws ? `${ws.name} has` : 'The organization has'} no {mod.toLowerCase()} SLAs. <button onClick={() => setDrawer({})} className="font-medium text-[#3D8BD0] hover:underline">Create one</button></>}
              </td></tr>
            )}
            {locked && multi && (
              <>
                <GroupRow cols={cols.length} open={orgOpen} onToggle={() => setOrgOpen((o) => !o)} label={`Organization (${orgRows.length})`} sub="matched when none of the above match · read-only here" />
                {orgOpen && orgRows.map((s, i) => row(s, i + 1, true))}
              </>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(rows.length / perPage) || 1} itemsPerPage={perPage} totalItems={rows.length} onPageChange={setPage} onItemsPerPageChange={(n) => { setPerPage(n); setPage(1); }} />
      {drawer && (
        <SlaDrawer workspace={ws} workspaces={workspaces} module={mod} rec={drawer.rec}
          calendars={ws ? hoursUsableIn(store.hours, ws.id) : store.hours.filter((h) => h.owner === ORG)}
          nextId={nextId(store.slas)} onClose={() => setDrawer(null)} onSave={save} />
      )}
    </div>
  );
}

function SlaDrawer({ workspace: w, workspaces, module, rec, calendars, nextId: id, onClose, onSave }: {
  workspace?: Workspace; workspaces: Workspace[]; module: SlaModule; rec?: Sla; calendars: BusinessHours[]; nextId: number; onClose: () => void; onSave: (s: Sla) => void;
}) {
  const [d, setD] = useState<Sla>(rec ?? { id, owner: w ? w.id : ORG, ...(w ? {} : { workspaces: [] }), module, name: '', type: 'SLA and OLA', hoursId: null, enabled: true, response: '4 Hours', resolution: '2 Days', ola: false });
  const set = (p: Partial<Sla>) => setD((x) => ({ ...x, ...p }));
  const org = calendars.filter((c) => c.owner === ORG);
  const own = calendars.filter((c) => c.owner !== ORG);
  // An organization SLA on Problem/Change/Release can only reach IT workspaces.
  const reachable = d.module === 'Request' ? workspaces : workspaces.filter((x) => x.type === 'it');
  return (
    <SideDrawer title={rec ? 'Edit SLA' : 'Create SLA'} width={560} onClose={onClose}
      sub={w ? `${w.name} · ${d.module} · matched before the organization’s SLAs` : `Organization · ${d.module} · matched after each workspace’s own SLAs`}
      footer={<div className="flex justify-end gap-2"><button onClick={onClose} className={secondaryBtn}>Cancel</button><button disabled={!d.name.trim()} onClick={() => onSave({ ...d, name: d.name.trim() })} className={`${primaryBtn} disabled:opacity-40`}>{rec ? 'Update' : 'Create'}</button></div>}>
      <div className="space-y-4 px-6 py-5">
        <FormRow label="Name" required><input autoFocus value={d.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="Name" /></FormRow>
        {!w && (
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-[#364658]">Workspace</span>
            <WorkspaceChips workspaces={reachable} value={d.workspaces ?? []} onChange={(v) => set({ workspaces: v })} />
            <span className="mt-1 block text-[12px] text-[#7B8FA5]">The condition only an organization SLA has. None picked = every workspace.</span>
          </div>
        )}
        <FormRow label="Type" required>
          <select value={d.type} onChange={(e) => set({ type: e.target.value as SlaType })} className={`${inputCls} app-select`}><option>SLA and OLA</option><option>UC</option></select>
        </FormRow>
        <FormRow label="Operational Hours" required hint={w ? 'Business hours come from the organization’s calendars or this workspace’s own.' : 'Organization SLAs count in the organization’s calendars.'}>
          <select value={d.hoursId ?? ''} onChange={(e) => set({ hoursId: e.target.value ? Number(e.target.value) : null })} className={`${inputCls} app-select`}>
            <option value="">Calendar Hours</option>
            <optgroup label="Organization">{org.map((c) => <option key={c.id} value={c.id}>Business Hours · {c.name}</option>)}</optgroup>
            {w && own.length > 0 && <optgroup label={w.name}>{own.map((c) => <option key={c.id} value={c.id}>Business Hours · {c.name}</option>)}</optgroup>}
          </select>
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Response Time"><input value={d.response} onChange={(e) => set({ response: e.target.value })} className={inputCls} /></FormRow>
          <FormRow label="Resolution Time" required><input value={d.resolution} onChange={(e) => set({ resolution: e.target.value })} className={inputCls} /></FormRow>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[#364658]"><Toggle on={d.enabled} label="Enabled" onChange={(v) => set({ enabled: v })} /> Enabled</label>
      </div>
    </SideDrawer>
  );
}
