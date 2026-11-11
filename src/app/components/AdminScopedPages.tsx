import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDown, ArrowUp, ChevronRight, Copy, Download, FolderPlus, GripVertical, Inbox, Lock, Pencil, Plus, PlusCircle, Settings2, Trash2, Upload, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';
import { SideDrawer } from './workspaceUi';
import { loadStore, saveStore } from './workspaceData';
import type { Workspace, WorkspaceSetup } from './workspaceData';
import { ORG } from './workspaceSettingsData';
import type { Owner } from './workspaceSettingsData';
import { PAGES, RULE_KINDS, isLayered, orgTabsOf, orgViewOf } from './scopedCards';
import type { ScopedCard, ScopedTab } from './scopedCards';
import {
  FEEDBACK_FIELD_TYPES, FIELD_TYPES, IMPACTS, PRIORITIES, STATUS_COLOURS, SYSTEM_FIELDS, TASK_SYSTEM_FIELDS,
  catalogCategories, groupDesc, loadPages, savePages, seedRows, seedSettings, storeKey,
} from './scopedPagesData';
import type { PagesStore, Rec } from './scopedPagesData';
import {
  Dot, FormRow, GroupRow, IconBtn, LayerNote, OrgLock, PageHead, SearchBox, poss, Toggle, WorkspaceChips, inputCls, orgToast, primaryBtn, secondaryBtn, td, th,
} from './AdminScopedSettings';

/* Every per-workspace ServiceOps admin page, working. ESM F04 (built 2026-11-02 after reading each live page).
 *
 * One component renders the ~15 ServiceOps page types (scopedCards.ts PAGES) with the live layout: page head →
 * module tabs (black active pill on a light bar) → toolbar → the page's own body. ESM adds only F04:
 *   - inside a workspace the page is locked to it and shows only the tabs that belong to a workspace
 *     (Problem/Change/Release only for IT); Organization tabs (Asset, CMDB, User…) never appear there;
 *   - F04 rev. 2 (Juli 2026-11-03, Q1–Q3 — replaces the Workspace ▾ selector): with two or more workspaces the
 *     organization's admin shows only Organization tabs and the LAYERED tabs (scopedCards.ts LAYERED), with the
 *     organization's records; inside a workspace a layered tab shows the organization's records read-only, in run
 *     order, next to its own; Service Catalog in the organization's admin reads across every workspace. With ONE
 *     workspace nothing is split: the page is today's;
 *   - every record is owned (scopedPagesData.ts) and a workspace starts from its template's copy. */

interface Props {
  card: ScopedCard;
  workspaces: Workspace[];
  /** Inside a workspace's settings: locked to it. */
  locked?: Workspace;
  /** Writes to the workspace record (groups, support email) when the workspace module owns the store. */
  onPatchWorkspace?: (id: number, setup: Partial<WorkspaceSetup>, audit: string) => void;
  /** Organization admin: open this page inside a workspace's settings (switching, Freshservice-style). */
  onOpenInWorkspace?: (id: number, slug: string) => void;
}

const nowStamp = () => new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/,(?=[^,]*$)/, '');
const nextId = (xs: { id: number }[]) => xs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const singular = (s: string) => s.replace(/ies$/, 'y').replace(/s$/, '');

function usePages(): [PagesStore, (fn: (s: PagesStore) => PagesStore) => void] {
  const [store, setStore] = useState<PagesStore>(loadPages);
  const update = (fn: (s: PagesStore) => PagesStore) => setStore((s) => { const n = fn(s); savePages(n); return n; });
  return [store, update];
}

export function ScopedPage({ card, workspaces: initial, locked, onPatchWorkspace, onOpenInWorkspace }: Props) {
  const def = PAGES[card.page];
  /* In the organization's admin nothing else holds the workspace store, so this page writes it itself. */
  const [workspaces, setWorkspaces] = useState(initial);
  const patchWorkspace = onPatchWorkspace ?? ((id: number, setup: Partial<WorkspaceSetup>) => {
    const s = loadStore();
    const next = s.workspaces.map((w) => (w.id === id ? { ...w, setup: { ...w.setup, ...setup } } : w));
    saveStore({ ...s, workspaces: next });
    setWorkspaces((ws) => ws.map((w) => (w.id === id ? { ...w, setup: { ...w.setup, ...setup } } : w)));
  });
  const [store, update] = usePages();
  const multi = workspaces.length > 1;
  // Organization admin with two or more workspaces: organization records only (Q1). undefined = not that mode.
  const orgView = !locked && multi ? orgViewOf(card) : undefined;
  const [tabKey, setTabKey] = useState(orgView?.tab ?? card.tab);
  const defaultWs = workspaces.find((w) => w.isDefault) ?? workspaces[0];

  const allowed = (t: ScopedTab, w?: Workspace) => t.scope === 'ws' || (t.scope === 'it' && w?.type === 'it') || (t.scope === 'org' && !locked);
  // Inside a workspace: only its own tabs. Organization admin: Organization + layered tabs, or every tab with one workspace.
  const tabs = locked ? def.tabs.filter((t) => allowed(t, locked)) : orgView ? orgTabsOf(def.key) : def.tabs;
  const tab = tabs.find((t) => t.key === tabKey) ?? tabs[0] ?? def.tabs.find((t) => t.key === card.tab) ?? def.tabs[0];
  /* One workspace = today's page: its records ARE that workspace's (Q3). */
  const ws = locked ?? (orgView ? defaultWs : workspaces[0]);
  const layered = isLayered(def.key, tab.key);
  const owner: Owner = tab.scope === 'org' || orgView ? ORG : ws?.id ?? 1;
  const key = storeKey(def.key, tab.key, owner);

  const rows: Rec[] = store.rows[key] ?? seedRows(def.key, tab.key, owner, owner === ORG ? undefined : ws);
  const setRows = (fn: (r: Rec[]) => Rec[]) => update((s) => ({ ...s, rows: { ...s.rows, [key]: fn(s.rows[key] ?? rows) } }));
  const settings = store.settings[key] ?? seedSettings(def.key, tab.key, owner === ORG ? undefined : ws);
  const setSettings = (v: Record<string, unknown>) => update((s) => ({ ...s, settings: { ...s.settings, [key]: v } }));
  // Inside a workspace, a layered tab also shows the organization's records that reach this workspace (Q2).
  const orgKey = storeKey(def.key, tab.key, ORG);
  const reaches = (r: Rec) => { const t = r.workspaces as number[] | undefined; return !t?.length || (!!locked && t.includes(locked.id)); };
  const orgLayer: Rec[] | undefined = locked && multi && layered ? (store.rows[orgKey] ?? seedRows(def.key, tab.key, ORG)).filter(reaches) : undefined;

  const whose = owner === ORG ? 'the organization' : ws?.name ?? '';
  const title = tab.title ?? def.title;
  const sub = tab.sub ?? def.sub;
  const switchTab = (k: string) => setTabKey(k);

  const head = def.kind === 'rules' ? null : <PageHead title={title} sub={sub} workspace={locked} />;
  const scopeBar = null;
  const noun = def.key === 'workflow' ? 'workflows' : 'rules';
  const layerNote = multi && layered && (locked || orgView) ? (
    <LayerNote>
      {def.key === 'form'
        ? (locked
          ? <>Organization fields are on every workspace’s {tab.label.toLowerCase()} form. They are locked here and keep their value when a request moves to another workspace.</>
          : <>Fields added here appear on <b>every workspace’s {tab.label.toLowerCase()} form</b> and keep their value when a request moves to another workspace. A workspace adds its own fields in its settings.</>)
        : (locked
          ? <>Run order on {poss(locked.name)} {tab.label.toLowerCase()}s: <b>organization {noun} first, then {poss(locked.name)}</b>, so {poss(locked.name)} win where both act.</>
          : <>Organization {noun} run on every workspace’s {tab.label.toLowerCase()}s (or the ones you pick) <b>before each workspace’s own</b>; a workspace’s {noun} win where both act. Each workspace’s {noun} are in its own settings.</>)}
    </LayerNote>
  ) : null;
  const tabStrip = !def.hideTabs && tabs.length > 1 && (
    <div className="mb-4 flex flex-wrap gap-1 rounded-md bg-[#EEF2F6] p-1">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => switchTab(t.key)}
          className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${t.key === tab.key ? 'bg-[#1F2937] text-white' : 'text-[#364658] hover:bg-white'}`}>{t.label}</button>
      ))}
    </div>
  );

  if (!ws) return null;
  if (orgView && !orgView.visible) {
    const where = def.tabs.find((t) => t.key === card.tab)?.scope === 'it' ? workspaces.filter((w) => w.type === 'it') : workspaces;
    return (
      <div className="px-4 py-6">
        <PageHead title={title} sub={sub} />
        <div className="max-w-[720px] rounded-lg border border-[#E5E7EB] p-5">
          <p className="text-[14px] font-semibold text-[#364658]">{card.card} belong to each workspace</p>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#64748B]">There are no organization {card.card.toLowerCase()}: each workspace keeps its own. Open a workspace’s settings to change them.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {where.map((w) => (
              <button key={w.id} onClick={() => onOpenInWorkspace?.(w.id, card.slug)} className={secondaryBtn}><Dot colour={w.colour} />{w.name}<ChevronRight size={14} className="text-[#94A3B8]" /></button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // An IT-only page reached by its address inside a non-IT workspace (its card isn't shown there).
  if (locked && !allowed(tab, locked)) {
    return (
      <div className="px-4 py-6">
        <PageHead title={title} sub={sub} workspace={locked} />
        <p className="max-w-[640px] rounded-md border border-dashed border-[#CBD5E1] px-4 py-6 text-[13px] text-[#64748B]">
          {title} belongs to IT processes, so only IT workspaces have it. {locked.name} doesn’t.
        </p>
      </div>
    );
  }
  const body = (() => {
    const p = { def: def.key, tab, rows, setRows, settings, setSettings, ws, owner, whose, scopeBar, store, workspaces, onPatchWorkspace: patchWorkspace, locked, orgLayer, layered: multi && layered, aggregate: !!orgView?.aggregate, onOpenInWorkspace: (id: number) => onOpenInWorkspace?.(id, card.slug) };
    switch (def.kind) {
      case 'list': return <ListBody {...p} createLabel={def.createLabel} />;
      case 'notifications': return <NotificationsBody {...p} />;
      case 'values': return <ValuesBody {...p} label={tab.label} />;
      case 'status': return <StatusBody {...p} />;
      case 'category': return <CategoryBody {...p} />;
      case 'rules': return <RulesBody {...p} tabStrip={tabStrip} />;
      case 'assignment': return <AssignmentBody {...p} />;
      case 'feedback': return <FeedbackBody {...p} />;
      case 'pref': return <PrefBody {...p} />;
      case 'matrix': return <MatrixBody {...p} />;
      case 'form': return <FormBody {...p} />;
      case 'catalog': return <CatalogBody {...p} />;
      case 'emails': return <EmailsBody {...p} />;
      case 'groups': return <GroupsBody {...p} />;
    }
    return null;
  })();

  return (
    <div className="px-4 py-6">
      {head}
      {def.kind !== 'rules' && tabStrip}
      {layerNote}
      {/* Keyed by tab + owner, so switching either starts the body afresh (drafts, search, paging). */}
      <div key={key}>{body}</div>
    </div>
  );
}

interface BodyProps {
  def: string; tab: ScopedTab; rows: Rec[]; setRows: (fn: (r: Rec[]) => Rec[]) => void;
  settings: Record<string, unknown>; setSettings: (v: Record<string, unknown>) => void;
  ws: Workspace; owner: Owner; whose: string; scopeBar: ReactNode; store: PagesStore; workspaces: Workspace[];
  onPatchWorkspace?: Props['onPatchWorkspace']; locked?: Workspace;
  /** Inside a workspace, layered tab: the organization's records that reach it (read-only, run first). */
  orgLayer?: Rec[];
  /** The tab has an organization layer and there are two or more workspaces. */
  layered: boolean;
  /** Organization admin, Service Catalog: read across every workspace. */
  aggregate: boolean;
  onOpenInWorkspace: (id: number) => void;
}

function Toolbar({ scopeBar, q, setQ, children }: { scopeBar: ReactNode; q?: string; setQ?: (v: string) => void; children?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      {scopeBar}
      {setQ && <SearchBox value={q ?? ''} onChange={setQ} />}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

function Empty({ cols, children }: { cols: number; children: ReactNode }) {
  return <tr><td colSpan={cols} className="px-4 py-10 text-center text-[13px] text-[#7B8FA5]">{children}</td></tr>;
}

function UpdateBar({ onUpdate, onCancel }: { onUpdate: () => void; onCancel: () => void }) {
  return (
    <div className="mt-5 flex max-w-[740px] justify-end gap-2 border-t border-[#E5E7EB] pt-4">
      <button onClick={onUpdate} className={primaryBtn}>Update</button>
      <button onClick={onCancel} className={secondaryBtn}>Cancel</button>
    </div>
  );
}

// ── list pages ─────────────────────────────────────────────────────────────────────────────────

type ColKind = 'num' | 'text' | 'muted' | 'toggle' | 'pill' | 'id' | 'default';
interface Col { key: string; label: string; kind?: ColKind }
interface Field { key: string; label: string; type?: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'workspaces' | 'moveTo'; options?: string[]; required?: boolean; hint?: string }

const COLS: Record<string, Col[]> = {
  workflow: [{ key: 'name', label: 'Name', kind: 'num' }, { key: 'type', label: 'Type' }, { key: 'trigger', label: 'Trigger', kind: 'muted' }, { key: 'created', label: 'Created Date' }, { key: 'version', label: 'Version' }, { key: 'status', label: 'Status', kind: 'pill' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  approval: [{ key: 'name', label: 'Name', kind: 'num' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  scenario: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description', kind: 'muted' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  incidentSchedule: [{ key: 'name', label: 'Name' }, { key: 'subject', label: 'Subject' }, { key: 'scheduleType', label: 'Schedule Type' }, { key: 'next', label: 'Next Execution Time' }, { key: 'last', label: 'Last Execution Time' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  taskSchedule: [{ key: 'name', label: 'Name' }, { key: 'subject', label: 'Subject' }, { key: 'scheduleType', label: 'Schedule Type' }, { key: 'frequency', label: 'Frequency' }, { key: 'next', label: 'Next Execution Time' }, { key: 'last', label: 'Last Execution Time' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  surveys: [{ key: 'sid', label: 'ID', kind: 'id' }, { key: 'name', label: 'Name' }, { key: 'status', label: 'Status', kind: 'pill' }, { key: 'start', label: 'Start Date' }, { key: 'end', label: 'End Date' }, { key: 'owner', label: 'Owner' }],
  scheduleSurvey: [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status', kind: 'pill' }, { key: 'scheduleType', label: 'Schedule Type' }, { key: 'next', label: 'Next Execution Time' }, { key: 'last', label: 'Last Execution Time' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  response: [{ key: 'name', label: 'Name' }, { key: 'createdBy', label: 'Created By', kind: 'muted' }, { key: 'updatedBy', label: 'Updated By', kind: 'muted' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  print: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description', kind: 'muted' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }, { key: 'isDefault', label: 'Default', kind: 'default' }],
  templates: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description', kind: 'muted' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
  formRule: [{ key: 'name', label: 'Name', kind: 'num' }, { key: 'executionOn', label: 'Rule Execution On' }, { key: 'applicableFor', label: 'Rule Applicable For' }, { key: 'event', label: 'Rule Event' }, { key: 'created', label: 'Created Date' }, { key: 'enabled', label: 'Enabled', kind: 'toggle' }],
};
COLS.model = COLS.templates; COLS.printChange = COLS.print;

const SCHEDULE = ['Once', 'Daily', 'Weekly', 'Monthly'];
const FIELDS: Record<string, Field[]> = {
  workflow: [{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'type', label: 'Type', type: 'select', options: ['Event', 'Periodic'], required: true }, { key: 'trigger', label: 'Trigger', required: true }],
  approval: [{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' }],
  scenario: [{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' }],
  incidentSchedule: [{ key: 'name', label: 'Name', required: true }, { key: 'subject', label: 'Subject', required: true }, { key: 'scheduleType', label: 'Schedule Type', type: 'select', options: SCHEDULE, required: true }, { key: 'next', label: 'Start', type: 'date' }],
  taskSchedule: [{ key: 'name', label: 'Name', required: true }, { key: 'subject', label: 'Subject', required: true }, { key: 'scheduleType', label: 'Schedule Type', type: 'select', options: SCHEDULE, required: true }, { key: 'frequency', label: 'Frequency' }, { key: 'next', label: 'Start', type: 'date' }],
  surveys: [{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'start', label: 'Survey Start Date', type: 'date', required: true }, { key: 'validity', label: 'Validity Days', type: 'number', required: true }],
  scheduleSurvey: [{ key: 'name', label: 'Name', required: true }, { key: 'scheduleType', label: 'Schedule Type', type: 'select', options: SCHEDULE, required: true }, { key: 'next', label: 'Start', type: 'date' }],
  response: [{ key: 'name', label: 'Name', required: true }, { key: 'content', label: 'Content', type: 'textarea', required: true }],
  print: [{ key: 'name', label: 'Template Name', required: true }, { key: 'description', label: 'Template Description', type: 'textarea' }, { key: 'format', label: 'Print Format', type: 'textarea', required: true }],
  templates: [{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' }],
  model: [{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' }],
  formRule: [{ key: 'name', label: 'Name', required: true }, { key: 'executionOn', label: 'Rule Execution On', type: 'select', options: ['On Create', 'On Edit', 'On Create and Edit'], required: true },
    { key: 'applicableFor', label: 'Rule Applicable For', type: 'select', options: ['All Users', 'Technicians', 'Requesters'], required: true }, { key: 'event', label: 'Rule Event', type: 'select', options: ['On Form Load', 'On Field Change', 'On Form Submit'], required: true }],
};
FIELDS.printChange = FIELDS.print;

function defaults(def: string, rows: Rec[]): Partial<Rec> {
  const stamp = nowStamp();
  switch (def) {
    case 'workflow': return { type: 'Event', created: stamp, version: 'v1', status: 'Draft', enabled: false };
    case 'surveys': return { sid: `SUR-${13 + rows.length}`, status: 'Design', owner: 'Amit Kulkarni', end: '---' };
    case 'scheduleSurvey': return { status: 'Design', scheduleType: 'Once', last: '---', enabled: true };
    case 'incidentSchedule': case 'taskSchedule': return { scheduleType: 'Once', last: '---', enabled: true };
    case 'response': return { createdBy: `Amit Kulkarni · ${stamp}`, updatedBy: `Amit Kulkarni · ${stamp}`, enabled: true };
    case 'formRule': return { executionOn: 'On Create and Edit', applicableFor: 'All Users', event: 'On Form Load', created: stamp, enabled: true };
    case 'print': case 'printChange': return { enabled: true, isDefault: false };
  }
  return { enabled: true };
}

function Pill({ v }: { v: string }) {
  const tone = /Published|Live|Launched/.test(v) ? 'bg-[#DCFCE7] text-[#166534]' : /Draft|Design/.test(v) ? 'bg-[#F1F5F9] text-[#475569]' : /Expired|Closed|Cancel/.test(v) ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#EBF5FF] text-[#1F5F99]';
  return <span className={`inline-flex rounded-sm px-2 py-0.5 text-[12px] font-medium ${tone}`}>{v}</span>;
}

function RecordDrawer({ title, sub, fields, rec, onClose, onSave, workspaces = [] }: { title: string; sub: string; fields: Field[]; rec: Partial<Rec>; onClose: () => void; onSave: (r: Partial<Rec>) => void; workspaces?: Workspace[] }) {
  const [d, setD] = useState<Partial<Rec>>(rec);
  const ok = fields.every((f) => !f.required || String(d[f.key] ?? '').trim());
  return (
    <SideDrawer title={title} sub={sub} width={560} onClose={onClose}
      footer={<><button onClick={onClose} className={secondaryBtn}>Cancel</button><button disabled={!ok} onClick={() => onSave(d)} className={`${primaryBtn} disabled:opacity-40`}>{rec.id ? 'Update' : 'Create'}</button></>}>
      <div className="space-y-4 px-6 py-5">
        {fields.map((f) => f.type === 'workspaces' ? (
          // Not a <label>: a label around buttons hands every click on its text to the first button ("All workspaces").
          <div key={f.key}>
            <span className="mb-1.5 block text-[13px] font-medium text-[#364658]">{f.label}</span>
            <WorkspaceChips workspaces={workspaces} value={(d[f.key] as number[] | undefined) ?? []} onChange={(v) => setD({ ...d, [f.key]: v })} />
            {f.hint && <span className="mt-1 block text-[12px] text-[#7B8FA5]">{f.hint}</span>}
          </div>
        ) : (
          <FormRow key={f.key} label={f.label} required={f.required} hint={f.hint}>
            {f.type === 'moveTo' ? <select value={String(d[f.key] ?? '')} onChange={(e) => setD({ ...d, [f.key]: e.target.value ? Number(e.target.value) : undefined })} className={`${inputCls} app-select`}><option value="">Don’t move</option>{workspaces.map((w) => <option key={w.id} value={w.id}>Move to {w.name}</option>)}</select>
              : f.type === 'textarea' ? <textarea rows={4} value={String(d[f.key] ?? '')} onChange={(e) => setD({ ...d, [f.key]: e.target.value })} className={`${inputCls} h-auto py-2`} placeholder={f.label} />
              : f.type === 'select' ? <select value={String(d[f.key] ?? f.options![0])} onChange={(e) => setD({ ...d, [f.key]: e.target.value })} className={`${inputCls} app-select`}>{f.options!.map((x) => <option key={x}>{x}</option>)}</select>
                : <input type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} value={String(d[f.key] ?? '')} onChange={(e) => setD({ ...d, [f.key]: e.target.value })} className={inputCls} placeholder={f.label} />}
          </FormRow>
        ))}
      </div>
    </SideDrawer>
  );
}

function ListBody({ def, tab, rows, setRows, owner, whose, scopeBar, createLabel, workspaces, orgLayer, layered, locked }: BodyProps & { createLabel?: string }) {
  // The organization's own records on a layered tab carry the Workspace condition (and, for a workflow, the move).
  const orgRecords = owner === ORG && layered;
  const wsName = (id: unknown) => workspaces.find((w) => w.id === id)?.name ?? 'removed';
  const targets = (r: Rec) => { const t = r.workspaces as number[] | undefined; return t?.length ? t.map(wsName).join(', ') : 'All workspaces'; };
  const cols: Col[] = orgRecords ? [COLS[def][0], { key: 'workspaces', label: 'Workspaces' }, ...(def === 'workflow' ? [{ key: 'moveTo', label: 'Moves to' }] : []), ...COLS[def].slice(1)] : COLS[def];
  const fields: Field[] = orgRecords ? [...FIELDS[def].slice(0, 1),
    { key: 'workspaces', label: 'Workspace', type: 'workspaces', hint: 'The condition only an organization record has. None picked = every workspace.' },
    ...FIELDS[def].slice(1),
    ...(def === 'workflow' ? [{ key: 'moveTo', label: 'Action · Move to workspace', type: 'moveTo' as const, hint: 'Only organization workflows can move a request to another workspace.' }] : [])] : FIELDS[def];
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState<Partial<Rec> | null>(null);
  const [orgOpen, setOrgOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(25);
  const match = (r: Rec) => !q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase());
  const shown = rows.filter(match);
  const orgShown = (orgLayer ?? []).filter(match);
  const save = (d: Partial<Rec>) => {
    if (d.id) {
      setRows((rs) => rs.map((r) => (r.id === d.id ? { ...r, ...d, ...(def === 'response' ? { updatedBy: `Amit Kulkarni · ${nowStamp()}` } : {}) } as Rec : r)));
      toast.success(`${d.name} updated`);
    } else {
      const rec = { ...defaults(def, rows), ...(orgRecords ? { workspaces: [] } : {}), ...d, id: nextId(rows) } as Rec;
      if ((def === 'incidentSchedule' || def === 'taskSchedule' || def === 'scheduleSurvey') && !d.next) rec.next = '---';
      setRows((rs) => [...rs, rec]);
      toast.success(`${rec.name} created`, { description: orgRecords ? `Runs before each workspace’s own · ${targets(rec)}.` : owner === ORG ? 'Organization-wide.' : `Applies to ${whose} only.` });
    }
    setDrawer(null);
  };
  const cell = (r: Rec, c: Col, n: number, readOnly: boolean) => {
    const v = r[c.key];
    if (c.key === 'workspaces') return <td key={c.key} className={`${td} whitespace-nowrap text-[#64748B]`}>{targets(r)}</td>;
    if (c.key === 'moveTo') return <td key={c.key} className={`${td} whitespace-nowrap`}>{v ? <span className="inline-flex items-center gap-1.5"><Dot colour={workspaces.find((w) => w.id === v)?.colour ?? '#94A3B8'} />{wsName(v)}</span> : <span className="text-[#94A3B8]">---</span>}</td>;
    if (readOnly && (c.kind === 'toggle' || c.kind === 'default')) return <td key={c.key} className={`${td} text-[12px] text-[#64748B]`}>{v ? 'Yes' : 'No'}</td>;
    if (c.kind === 'toggle') return <td key={c.key} className={td}><Toggle on={!!v} label={`${c.label} ${r.name}`} onChange={(x) => { setRows((rs) => rs.map((y) => (y.id === r.id ? { ...y, [c.key]: x } : y))); toast.success(`${r.name} ${x ? 'enabled' : 'disabled'}`); }} /></td>;
    if (c.kind === 'default') return <td key={c.key} className={td}><Toggle on={!!v} label={`Set ${r.name} as default`} onChange={() => { setDefault(r.id); toast.success(`${r.name} is the default`); }} /></td>;
    if (c.kind === 'pill') return <td key={c.key} className={td}><Pill v={String(v ?? '')} /></td>;
    if (c.kind === 'id') return <td key={c.key} className={td}><span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">{String(v)}</span></td>;
    if (c.key === 'name') return <td key={c.key} className={`${td} min-w-[240px]`}><button onClick={() => (readOnly ? orgToast(r.name, def === 'workflow' ? 'workflow' : 'rule', `It runs on ${poss(locked?.name ?? '')} ${tab.label.toLowerCase()}s before ${poss(locked?.name ?? '')} own.`) : setDrawer(r))} className="text-left text-[13px] font-medium hover:text-[#3D8BD0]">{c.kind === 'num' ? `${n}. ` : ''}{r.name}</button></td>;
    return <td key={c.key} className={`${td} ${c.kind === 'muted' ? 'max-w-[380px] truncate text-[#64748B]' : 'whitespace-nowrap'}`} title={c.kind === 'muted' ? String(v ?? '') : undefined}>{String(v ?? '---')}</td>;
  };
  const setDefault = (id: number) => setRows((rs) => rs.map((r) => ({ ...r, isDefault: r.id === id })));
  return (
    <>
      <Toolbar scopeBar={scopeBar} q={q} setQ={(v) => { setQ(v); setPage(1); }}>
        {def === 'approval' && <button onClick={() => toast(`Approval Setting for ${whose}`, { description: 'The same ServiceOps Approval Setting, kept per workspace.' })} className={secondaryBtn}>Approval Setting</button>}
        {createLabel && <button onClick={() => setDrawer({ ...defaults(def, rows) })} className={primaryBtn}><Plus size={15} /> {createLabel}</button>}
      </Toolbar>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-[#e5e7eb]"><tr>{cols.map((c) => <th key={c.key} className={th}>{c.label}</th>)}<th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {/* Inside a workspace, in run order: the organization's records first (read-only), then its own. */}
            {orgLayer && (
              <>
                <GroupRow cols={cols.length + 1} open={orgOpen} onToggle={() => setOrgOpen((o) => !o)} label={`Organization (${orgShown.length})`} sub="runs first · read-only here" />
                {orgOpen && orgShown.map((r, i) => (
                  <tr key={`org-${r.id}`} className="hover:bg-[#f9fafb]">
                    {cols.map((c) => cell(r, c, i + 1, true))}
                    <td className={td}><OrgLock what={def === 'workflow' ? 'workflow' : 'rule'} /></td>
                  </tr>
                ))}
                <GroupRow cols={cols.length + 1} label={`${locked?.name} (${shown.length})`} sub="runs after · wins where both act" dot={locked?.colour} />
              </>
            )}
            {shown.slice((page - 1) * per, page * per).map((r, i) => (
              <tr key={r.id} className="hover:bg-[#f9fafb]">
                {cols.map((c) => cell(r, c, (page - 1) * per + i + 1, false))}
                <td className={td}>
                  <span className="inline-flex items-center gap-0.5">
                    <IconBtn label="Edit" onClick={() => setDrawer(r)}><Pencil size={15} /></IconBtn>
                    <IconBtn label="Copy" onClick={() => { setRows((rs) => [...rs, { ...r, id: nextId(rs), name: `Copy of ${r.name}`, isDefault: false }]); toast.success(`Copy of ${r.name} created`); }}><Copy size={15} /></IconBtn>
                    {!r.isDefault && <IconBtn label="Delete" danger onClick={() => { setRows((rs) => rs.filter((y) => y.id !== r.id)); toast.success(`${r.name} deleted`); }}><Trash2 size={15} /></IconBtn>}
                  </span>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <Empty cols={cols.length + 1}>{q ? 'No Data Found' : <>No Data Found{createLabel && <> · <button onClick={() => setDrawer({ ...defaults(def, rows) })} className="font-medium text-[#3D8BD0] hover:underline">{createLabel}</button></>}</>}</Empty>}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(shown.length / per) || 1} itemsPerPage={per} totalItems={shown.length} onPageChange={setPage} onItemsPerPageChange={(n) => { setPer(n); setPage(1); }} />
      {drawer && <RecordDrawer title={drawer.id ? `Edit ${drawer.name}` : createLabel ?? 'Create'} sub={orgRecords ? `Organization · ${tab.label} · runs before each workspace’s own` : owner === ORG ? `Organization · ${tab.label}` : `${whose} · ${tab.label}`} fields={fields} rec={drawer} workspaces={workspaces} onClose={() => setDrawer(null)} onSave={save} />}
    </>
  );
}

// ── Event Notifications ────────────────────────────────────────────────────────────────────────

function NotificationsBody({ tab, rows, setRows, whose, scopeBar }: BodyProps) {
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Rec | null>(null);
  const shown = rows.filter((r) => !q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <Toolbar scopeBar={scopeBar} q={q} setQ={setQ} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-[#e5e7eb]"><tr><th className={th}>Name</th><th className={th}>Enabled</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {shown.map((r) => (
              <tr key={r.id} className="hover:bg-[#f9fafb]">
                <td className={td}><button onClick={() => setEdit(r)} className="text-left text-[13px] font-medium hover:text-[#3D8BD0]">{r.name}</button></td>
                <td className={td}><Toggle on={!!r.enabled} label={r.name} onChange={(v) => { setRows((rs) => rs.map((y) => (y.id === r.id ? { ...y, enabled: v } : y))); toast.success(`${v ? 'Enabled' : 'Disabled'} for ${whose}`, { description: r.name }); }} /></td>
                <td className={td}><IconBtn label="Edit" onClick={() => setEdit(r)}><Pencil size={15} /></IconBtn></td>
              </tr>
            ))}
            {shown.length === 0 && <Empty cols={3}>No Data Found</Empty>}
          </tbody>
        </table>
      </div>
      {edit && (
        <RecordDrawer title={edit.name} sub={`${whose} · ${tab.label} notification`} rec={{ subject: `[${'${id}'}] ${edit.name}`, body: 'Hello ${recipient},\n\n…', ...edit }}
          fields={[{ key: 'subject', label: 'Subject', required: true }, { key: 'body', label: 'Email Content', type: 'textarea', required: true }]}
          onClose={() => setEdit(null)} onSave={(d) => { setRows((rs) => rs.map((y) => (y.id === edit.id ? { ...y, ...d } as Rec : y))); setEdit(null); toast.success('Notification updated', { description: `Only ${whose} sends this wording.` }); }} />
      )}
    </>
  );
}

// ── simple value lists (Task Types, Change Types, Risk, Reason…) ───────────────────────────────

function ValuesBody({ rows, setRows, whose, scopeBar, label }: BodyProps & { label: string }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const add = () => { const n = name.trim(); if (!n) return; if (rows.some((r) => r.name.toLowerCase() === n.toLowerCase())) { toast.error(`${n} already exists`); return; } setRows((rs) => [...rs, { id: nextId(rs), name: n }]); setName(''); setAdding(false); toast.success(`${n} added for ${whose}`); };
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      <button onClick={() => setAdding(true)} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]"><PlusCircle size={16} /> Add {singular(label)}</button>
      <div className="max-w-[560px] space-y-2">
        {adding && (
          <div className="flex items-center gap-2 rounded-md border border-[#3D8BD0] bg-white px-3 py-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }} placeholder={singular(label)} className="h-8 flex-1 text-[13px] text-[#364658] outline-none" />
            <button onClick={add} className={primaryBtn}>Add</button><button onClick={() => setAdding(false)} className={secondaryBtn}>Cancel</button>
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="group flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5">
            {editId === r.id ? (
              <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => setEditId(null)}
                onKeyDown={(e) => { if (e.key === 'Enter' && editName.trim()) { setRows((rs) => rs.map((y) => (y.id === r.id ? { ...y, name: editName.trim() } : y))); setEditId(null); toast.success('Updated'); } if (e.key === 'Escape') setEditId(null); }}
                className="h-7 flex-1 text-[13px] text-[#364658] outline-none" />
            ) : <span className="flex-1 text-[13px] text-[#364658]">{r.name}</span>}
            <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <IconBtn label="Edit" onClick={() => { setEditId(r.id); setEditName(r.name); }}><Pencil size={14} /></IconBtn>
              <IconBtn label="Delete" danger onClick={() => { setRows((rs) => rs.filter((y) => y.id !== r.id)); toast.success(`${r.name} deleted`); }}><Trash2 size={14} /></IconBtn>
            </span>
          </div>
        ))}
        {rows.length === 0 && !adding && <p className="py-6 text-[13px] text-[#7B8FA5]">No Data Found</p>}
      </div>
    </>
  );
}

// ── Status ─────────────────────────────────────────────────────────────────────────────────────

function StatusBody({ rows, setRows, whose, scopeBar }: BodyProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [colour, setColour] = useState(STATUS_COLOURS[7]);
  const [editId, setEditId] = useState<number | null>(null);
  const flip = (r: Rec, k: 'sla' | 'uc') => { setRows((rs) => rs.map((y) => (y.id === r.id ? { ...y, [k]: !y[k] } : y))); toast.success(`${k === 'sla' ? 'Run SLA' : 'Run UC'} ${r[k] ? 'off' : 'on'} for ${r.name}`); };
  const setDefault = (r: Rec) => { setRows((rs) => rs.map((y) => (!!y.final === !!r.final ? { ...y, isDefault: y.id === r.id } : y))); toast.success(`${r.name} is the default ${r.final ? 'closing' : 'opening'} status`); };
  const add = () => {
    const n = name.trim(); if (!n) return;
    setRows((rs) => { const i = rs.findIndex((x) => x.final); const rec: Rec = { id: nextId(rs), name: n, colour, sla: false, uc: false, isDefault: false }; return i < 0 ? [...rs, rec] : [...rs.slice(0, i), rec, ...rs.slice(i)]; });
    setName(''); setAdding(false); toast.success(`${n} added`, { description: `A status for ${whose} only.` });
  };
  const sw = (on: boolean, label: string, onClick: () => void) => <span title={label}><Toggle on={on} label={label} onChange={onClick} /></span>;
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      <button onClick={() => setAdding(true)} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]"><PlusCircle size={16} /> Add Status</button>
      <div className="max-w-[560px] space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="group flex items-center gap-2.5 rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5">
            <Dot colour={String(r.colour)} />
            {editId === r.id ? (
              <input autoFocus defaultValue={r.name} onBlur={() => setEditId(null)} onKeyDown={(e) => { const v = (e.target as HTMLInputElement).value.trim(); if (e.key === 'Enter' && v) { setRows((rs) => rs.map((y) => (y.id === r.id ? { ...y, name: v } : y))); setEditId(null); } if (e.key === 'Escape') setEditId(null); }} className="h-7 flex-1 text-[13px] outline-none" />
            ) : <button onDoubleClick={() => !r.system && setEditId(r.id)} className="flex-1 text-left text-[13px] text-[#364658]">{r.name}</button>}
            {!r.system && <span className="flex items-center opacity-0 group-hover:opacity-100"><IconBtn label="Edit" onClick={() => setEditId(r.id)}><Pencil size={14} /></IconBtn><IconBtn label="Delete" danger onClick={() => { setRows((rs) => rs.filter((y) => y.id !== r.id)); toast.success(`${r.name} deleted`); }}><Trash2 size={14} /></IconBtn></span>}
            <span className="flex items-center gap-2">
              {!r.final && <>{sw(!!r.sla, 'Run SLA', () => flip(r, 'sla'))}{sw(!!r.uc, 'Run UC', () => flip(r, 'uc'))}</>}
              {sw(!!r.isDefault, 'Set As Default', () => setDefault(r))}
            </span>
          </div>
        ))}
        {adding && (
          <div className="rounded-md border border-[#3D8BD0] bg-white p-3">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }} placeholder="Status name" className={inputCls} />
            <div className="mt-2 flex items-center gap-1.5">{STATUS_COLOURS.map((c) => <button key={c} aria-label={c} onClick={() => setColour(c)} className={`size-5 rounded-full ${colour === c ? 'ring-2 ring-[#3D8BD0] ring-offset-1' : ''}`} style={{ background: c }} />)}</div>
            <div className="mt-3 flex justify-end gap-2"><button onClick={() => setAdding(false)} className={secondaryBtn}>Cancel</button><button onClick={add} disabled={!name.trim()} className={`${primaryBtn} disabled:opacity-40`}>Add</button></div>
          </div>
        )}
      </div>
      <p className="mt-3 text-[12px] text-[#7B8FA5]">Toggles: Run SLA · Run UC · Set As Default. Open, Resolved and Closed are system statuses.</p>
    </>
  );
}

// ── Categories ─────────────────────────────────────────────────────────────────────────────────

function CategoryBody({ rows, setRows, whose, scopeBar }: BodyProps) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState<number | 'top' | null>(null);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const kids = (r: Rec) => (r.children as string[] | undefined) ?? [];
  const add = () => {
    const n = name.trim(); if (!n) return;
    if (adding === 'top') setRows((rs) => [...rs, { id: nextId(rs), name: n, colour: STATUS_COLOURS[rs.length % STATUS_COLOURS.length] }]);
    else setRows((rs) => rs.map((r) => (r.id === adding ? { ...r, children: [...kids(r), n] } : r)));
    if (typeof adding === 'number') setOpen((s) => new Set(s).add(adding));
    toast.success(`${n} added`, { description: `A ${whose} category.` }); setName(''); setAdding(null);
  };
  const shown = rows.filter((r) => !q.trim() || [r.name, ...kids(r)].some((x) => x.toLowerCase().includes(q.trim().toLowerCase())));
  const addRow = (indent: boolean) => (
    <div className={`flex items-center gap-2 rounded-md border border-[#3D8BD0] bg-white px-3 py-2 ${indent ? 'ml-7' : ''}`}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(null); }} placeholder="Category name" className="h-8 flex-1 text-[13px] outline-none" />
      <button onClick={add} className={primaryBtn}>Add</button><button onClick={() => setAdding(null)} className={secondaryBtn}>Cancel</button>
    </div>
  );
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {scopeBar}
        <button onClick={() => toast('Category Configuration', { description: `Same ServiceOps settings, kept for ${whose}.` })} className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">Category Configuration <Settings2 size={14} /></button>
      </div>
      <div className="max-w-[560px]">
        <div className="relative mb-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search By Name" className={inputCls} /></div>
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <button onClick={() => { setAdding('top'); setName(''); }} className="inline-flex items-center gap-1 font-medium text-[#3D8BD0] hover:underline"><PlusCircle size={15} /> Add Category</button>
          <span className="flex items-center gap-2 text-[#3D8BD0]">
            <button onClick={() => toast('Drag categories to re-order')} className="hover:underline">Re-order</button>|
            <button onClick={() => toast('Import categories from CSV')} className="inline-flex items-center gap-1 hover:underline"><Upload size={13} /> Import</button>|
            <button onClick={() => toast.success(`Exported ${rows.length} ${whose} categories`)} className="inline-flex items-center gap-1 hover:underline"><Download size={13} /> Export</button>
          </span>
        </div>
        <div className="space-y-2">
          {adding === 'top' && addRow(false)}
          {shown.map((r) => (
            <div key={r.id}>
              <div className="group flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5">
                {kids(r).length ? <button aria-label="Expand" onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })}><ChevronRight size={14} className={`text-[#64748B] transition-transform ${open.has(r.id) ? 'rotate-90' : ''}`} /></button> : <span className="w-[14px]" />}
                <Dot colour={String(r.colour ?? '#CBD5E1')} />
                {editId === r.id ? (
                  <input autoFocus defaultValue={r.name} onBlur={() => setEditId(null)}
                    onKeyDown={(e) => { const v = (e.target as HTMLInputElement).value.trim(); if (e.key === 'Enter' && v) { setRows((rs) => rs.map((y) => (y.id === r.id ? { ...y, name: v } : y))); setEditId(null); toast.success('Category renamed'); } if (e.key === 'Escape') setEditId(null); }}
                    className="h-7 flex-1 bg-transparent text-[13px] text-[#364658] outline-none" />
                ) : <span className="flex-1 text-[13px] text-[#364658]">{r.name}{kids(r).length > 0 && <span className="ml-1.5 text-[12px] text-[#7B8FA5]">{kids(r).length}</span>}</span>}
                <IconBtn label="Add sub-category" onClick={() => { setAdding(r.id); setName(''); }}><PlusCircle size={15} /></IconBtn>
                <IconBtn label="Edit" onClick={() => setEditId(r.id)}><Pencil size={15} /></IconBtn>
                <IconBtn label="Delete" danger onClick={() => { setRows((rs) => rs.filter((y) => y.id !== r.id)); toast.success(`${r.name} deleted`); }}><Trash2 size={15} /></IconBtn>
              </div>
              {(open.has(r.id) || q) && kids(r).map((c) => (
                <div key={c} className="ml-7 mt-2 flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-[#364658]">
                  <span className="flex-1">{c}</span>
                  <IconBtn label="Delete" danger onClick={() => setRows((rs) => rs.map((y) => (y.id === r.id ? { ...y, children: kids(y).filter((x) => x !== c) } : y)))}><Trash2 size={14} /></IconBtn>
                </div>
              ))}
              {adding === r.id && <div className="mt-2">{addRow(true)}</div>}
            </div>
          ))}
          {shown.length === 0 && adding === null && <p className="py-6 text-[13px] text-[#7B8FA5]">No Data Found</p>}
        </div>
      </div>
    </>
  );
}

// ── Custom Rules ───────────────────────────────────────────────────────────────────────────────

function RulesBody({ tab, settings, setSettings, ws, whose, scopeBar, store, owner, tabStrip, locked }: BodyProps & { tabStrip: ReactNode }) {
  const kinds = RULE_KINDS[tab.key] ?? [];
  const [kind, setKind] = useState(kinds[0]?.key ?? '');
  const k = kinds.find((x) => x.key === kind) ?? kinds[0];
  const ruleKey = `${kind}`;
  const all = (settings[ruleKey] as Record<string, string[]> | undefined) ?? { interaction: [], mandatory: [], state: [] };
  const [draft, setDraft] = useState<Record<string, string[]>>(all);
  const formTab = tab.key === 'incident' || tab.key === 'service_request' ? 'request' : tab.key;
  const custom = (store.rows[storeKey('form', formTab, owner)] ?? seedRows('form', formTab, owner, ws)).filter((f) => f.type !== 'Section' && f.type !== 'Label').map((f) => f.name);
  const ticket = ['incident', 'service_request', 'problem'].includes(tab.key);
  const mandatory = tab.key === 'knowledge' ? ['Approval Status'] : [...(ticket ? ['Solution', 'Assignee', 'Approval', 'Technician Group', 'Diagnosis', 'Category'] : ['Assignee', 'Location', 'Technician Group', 'Category']), ...custom];
  const sections: [string, string, string[]][] = [
    ...(ticket ? [['interaction', 'User Interaction', ['Request must have at least one communication with Requester.', 'Request must have at least one note.']] as [string, string, string[]]] : []),
    ['mandatory', 'Mandatory Field', mandatory],
    ...(ticket ? [['state', 'Require State', ['All Tasks must be closed', 'All approvals must be Ignored/Rejected/Approved/Referred back', 'Request must have at least one worklog', 'All Problems must be closed', 'All Changes must be closed', 'All Releases must be closed']] as [string, string, string[]]] : []),
  ];
  const tick = (sec: string, item: string) => setDraft((d) => { const cur = d[sec] ?? []; return { ...d, [sec]: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item] }; });
  if (!k) return null;
  return (
    <>
      <PageHead title={k.label} sub={k.sub} workspace={locked} />
      {tabStrip}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {scopeBar}
        <div className="inline-flex flex-wrap gap-1">
          {kinds.map((x) => <button key={x.key} onClick={() => { setKind(x.key); setDraft(((settings[x.key] as Record<string, string[]> | undefined) ?? { interaction: [], mandatory: [], state: [] })); }}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium ${x.key === k.key ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#1F5F99]' : 'border-[#d1d5db] text-[#364658] hover:bg-[#f9fafb]'}`}>{x.label}</button>)}
        </div>
      </div>
      {sections.map(([sec, label, items]) => (
        <section key={sec} className="mt-5">
          <h3 className="border-b border-[#E5E7EB] pb-2 text-[14px] font-semibold text-[#364658]">{label}</h3>
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2.5 md:grid-cols-2">
            {items.map((it) => (
              <label key={it} className="flex items-center gap-2 text-[13px] text-[#364658]">
                <input type="checkbox" checked={(draft[sec] ?? []).includes(it)} onChange={() => tick(sec, it)} className="size-4 accent-[#3D8BD0]" />{it}
                {custom.includes(it) && <span className="text-[11px] text-[#7B8FA5]">· {whose} field</span>}
              </label>
            ))}
          </div>
        </section>
      ))}
      <UpdateBar onUpdate={() => { setSettings({ ...settings, [ruleKey]: draft }); toast.success(`${k.label} updated`, { description: `For ${whose} only.` }); }} onCancel={() => setDraft(all)} />
    </>
  );
}

// ── settings pages ─────────────────────────────────────────────────────────────────────────────

function AssignmentBody({ tab, settings, setSettings, whose, scopeBar }: BodyProps) {
  const [v, setV] = useState(String(settings.strategy ?? 'Manual'));
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      <div className="max-w-[740px]">
        <p className="mb-2 text-[13px] text-[#7B8FA5]">Strategy</p>
        <div className="flex flex-wrap gap-5">
          {['Manual', 'Round Robin', 'Smart Balance'].map((s) => <label key={s} className="inline-flex items-center gap-2 text-[13px] text-[#364658]"><input type="radio" checked={v === s} onChange={() => setV(s)} className="size-4 accent-[#3D8BD0]" />{s}</label>)}
        </div>
        {v !== 'Manual' && <p className="mt-3 text-[12px] text-[#7B8FA5]">Assigns {tab.label.toLowerCase()}s among {whose}’s technicians in the request’s technician group.</p>}
      </div>
      <UpdateBar onUpdate={() => { setSettings({ strategy: v }); toast.success(`Auto Assignment: ${v}`, { description: `${whose} · ${tab.label}` }); }} onCancel={() => setV(String(settings.strategy ?? 'Manual'))} />
    </>
  );
}

function SwitchRow({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-3 py-1.5 text-[13px] text-[#364658]"><Toggle on={on} label={label} onChange={onChange} />{label}</label>;
}

function FeedbackBody({ settings, setSettings, whose, scopeBar }: BodyProps) {
  const set = (k: string, v: boolean) => { setSettings({ ...settings, [k]: v }); toast.success('Feedback setting updated', { description: `For ${whose} only.` }); };
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      <div className="max-w-[740px]">
        <h3 className="text-[16px] font-medium text-[#364658]">Send Feedback on Request Status</h3>
        <div className="mt-2"><SwitchRow on={!!settings.onlyOne} label="Allow Only one Feedback Response" onChange={(v) => set('onlyOne', v)} /><SwitchRow on={!!settings.resolved} label="Resolved" onChange={(v) => set('resolved', v)} /><SwitchRow on={!!settings.closed} label="Closed" onChange={(v) => set('closed', v)} /></div>
        <div className="my-4 border-t border-[#E5E7EB]" />
        <h3 className="text-[16px] font-medium text-[#364658]">Send Feedback Manually</h3>
        <div className="mt-2"><SwitchRow on={!!settings.manual} label="Technicians can send the feedback form from a request" onChange={(v) => set('manual', v)} /></div>
      </div>
    </>
  );
}

const PREF_FIELDS: Record<string, { key: string; label: string; kind?: 'select'; options?: string[] }[]> = {
  request_preference: [{ key: 'guestOnBehalf', label: 'Allow Technician to Create Incident/Request Service on behalf of guest requester' }, { key: 'lastConversation', label: 'Populate Last Conversation In Reply' },
    { key: 'receivedAsFirstResponse', label: 'Consider Request Received Email as first response' }, { key: 'mergeStatus', label: 'Merge Request Status', kind: 'select', options: ['Closed', 'Resolved'] },
    { key: 'supportLevel', label: 'Support Level Preference', kind: 'select', options: ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3'] }],
  task_preference: [{ key: 'reopenClosed', label: 'Allow user to Re-open Closed Task' }, { key: 'deleteTask', label: 'Allow User to delete Task' }],
  user_preference: [{ key: 'welcomeGuest', label: 'Send Welcome Email to Guest Requester' }, { key: 'dnd', label: 'Allow Technician to Change Do not Disturb mode' }, { key: 'approvalAsset', label: 'Run Approval Workflow on Asset Assignment' }, { key: 'approvalCi', label: 'Run Approval Workflow on CI Assignment' }],
};

function PrefBody({ tab, settings, setSettings, whose, scopeBar }: BodyProps) {
  const fields = PREF_FIELDS[tab.key];
  const [d, setD] = useState<Record<string, unknown>>(settings);
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      {!fields ? (
        <p className="max-w-[740px] rounded-md border border-dashed border-[#CBD5E1] px-4 py-6 text-[13px] text-[#64748B]">{tab.label} is an Organization setting and is unchanged by ESM: the same ServiceOps page as today.</p>
      ) : (
        <div className="max-w-[740px]">
          {tab.key !== 'user_preference' && <h3 className="mb-1 text-[16px] font-medium text-[#364658]">{tab.label}</h3>}
          {fields.map((f) => f.kind === 'select'
            ? <div key={f.key} className="mt-3 max-w-[260px]"><FormRow label={f.label}><select value={String(d[f.key] ?? f.options![0])} onChange={(e) => setD({ ...d, [f.key]: e.target.value })} className={`${inputCls} app-select`}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select></FormRow></div>
            : <SwitchRow key={f.key} on={!!d[f.key]} label={f.label} onChange={(v) => setD({ ...d, [f.key]: v })} />)}
          <UpdateBar onUpdate={() => { setSettings(d); toast.success(`${tab.label} updated`, { description: tab.scope === 'org' ? 'Organization-wide.' : `For ${whose} only.` }); }} onCancel={() => setD(settings)} />
        </div>
      )}
    </>
  );
}

function MatrixBody({ settings, setSettings, whose, scopeBar }: BodyProps) {
  const grid = (settings.grid as string[][]) ?? [];
  const colour = (p: string) => PRIORITIES.find((x) => x.name === p)?.colour ?? '#CBD5E1';
  const set = (i: number, j: number, v: string) => { setSettings({ ...settings, grid: grid.map((row, a) => row.map((c, b) => (a === i && b === j ? v : c))) }); toast.success(`${IMPACTS[i]} × ${PRIORITIES[j].name} → ${v}`, { description: `${whose} priority matrix` }); };
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border border-[#E5E7EB] text-[13px]">
          <thead>
            <tr><th rowSpan={2} className="w-[200px] border border-[#E5E7EB] py-3 font-semibold text-[#364658]">Impact</th><th colSpan={4} className="border border-[#E5E7EB] py-3 font-semibold text-[#364658]">Urgency</th></tr>
            <tr>{PRIORITIES.map((p) => <th key={p.name} className="border border-[#E5E7EB] py-3 font-semibold text-[#364658]">{p.name}</th>)}</tr>
          </thead>
          <tbody>
            {IMPACTS.map((imp, i) => (
              <tr key={imp}>
                <td className="border border-[#E5E7EB] py-3 text-center font-semibold text-[#364658]">{imp}</td>
                {grid[i]?.map((c, j) => (
                  <td key={j} className="border border-[#E5E7EB] py-2 text-center">
                    <span className="inline-flex items-center gap-1.5"><Dot colour={colour(c)} />
                      <select aria-label={`${imp} ${PRIORITIES[j].name}`} value={c} onChange={(e) => set(i, j, e.target.value)} className="cursor-pointer bg-transparent text-[13px] text-[#364658] outline-none">{PRIORITIES.map((p) => <option key={p.name}>{p.name}</option>)}</select>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 border-t border-[#E5E7EB] pt-4"><SwitchRow on={!!settings.enabled} label="Enable" onChange={(v) => { setSettings({ ...settings, enabled: v }); toast.success(`Priority Matrix ${v ? 'enabled' : 'disabled'} for ${whose}`); }} /></div>
    </>
  );
}

// ── Form builder ───────────────────────────────────────────────────────────────────────────────

function FormBody({ tab, rows, setRows, whose, scopeBar, owner, layered, orgLayer }: BodyProps) {
  const orgFields = owner === ORG && layered;
  const palette = tab.key === 'feedback' ? FEEDBACK_FIELD_TYPES : FIELD_TYPES;
  const system = tab.key === 'feedback' ? [] : tab.key === 'task' ? TASK_SYSTEM_FIELDS : SYSTEM_FIELDS;
  const [edit, setEdit] = useState<Rec | null>(null);
  const addField = (type: string) => { const rec: Rec = { id: nextId(rows), name: type === 'Section' ? 'New Section' : `New ${type}`, type }; setRows((rs) => [...rs, rec]); setEdit(rec); toast.success(orgFields ? `${type} added to every workspace’s ${tab.label.toLowerCase()} form` : `${type} added to ${whose}’s ${tab.label.toLowerCase()} form`); };
  const move = (id: number, d: -1 | 1) => setRows((rs) => { const i = rs.findIndex((r) => r.id === id); const j = i + d; if (j < 0 || j >= rs.length) return rs; const n = [...rs]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      <div className="flex min-h-[520px] overflow-hidden rounded-lg border border-[#E5E7EB]">
        <aside className="w-[230px] flex-shrink-0 overflow-y-auto border-r border-[#E5E7EB] bg-white px-3 py-4">
          <p className="mb-2 px-1 text-[14px] font-semibold text-[#364658]">Custom Fields</p>
          {palette.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="px-1 pb-1 text-[12px] font-medium text-[#7B8FA5]">{g.group}</p>
              {g.items.map((it) => (
                <button key={it} onClick={() => addField(it)} className="group flex w-full items-center justify-between rounded px-1.5 py-1.5 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]">
                  {it}<span className="flex items-center gap-1 text-[#CBD5E1] group-hover:text-[#3D8BD0]"><Plus size={13} /><GripVertical size={13} /></span>
                </button>
              ))}
            </div>
          ))}
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto bg-[#F9FAFB] p-4">
          <p className="mb-3 text-[15px] font-semibold text-[#364658]">{tab.label === 'Feedback' ? 'Feedback Form' : `${tab.label} Form`}</p>
          {rows.length === 0 && <p className="mb-3 rounded-md border border-dashed border-[#CBD5E1] bg-white px-4 py-5 text-center text-[13px] text-[#7B8FA5]">{orgFields ? 'No organization fields yet. Pick a field type on the left to put it on every workspace’s form.' : `No custom fields yet. Pick a field type on the left to add it to ${whose}’s form.`}</p>}
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className={`group flex items-center gap-3 rounded-md border bg-white px-3 py-2.5 ${r.type === 'Section' ? 'border-[#94A3B8]' : 'border-[#E5E7EB]'}`}>
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${r.type === 'Section' ? 'text-[15px] font-semibold' : 'text-[13px] font-medium'} text-[#364658]`}>{r.name}{r.required ? <span className="text-[#DC2626]"> *</span> : null}</p>
                  <p className="text-[12px] text-[#7B8FA5]">{String(r.type)} · {orgFields ? 'on every workspace’s form' : `${whose} only`}</p>
                </div>
                <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <IconBtn label="Move up" onClick={() => move(r.id, -1)}><ArrowUp size={14} /></IconBtn>
                  <IconBtn label="Move down" onClick={() => move(r.id, 1)}><ArrowDown size={14} /></IconBtn>
                  <IconBtn label="Edit" onClick={() => setEdit(r)}><Pencil size={14} /></IconBtn>
                  <IconBtn label="Delete" danger onClick={() => { setRows((rs) => rs.filter((y) => y.id !== r.id)); toast.success(`${r.name} removed`); }}><X size={15} /></IconBtn>
                </span>
              </div>
            ))}
          </div>
          {orgLayer && orgLayer.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#64748B]"><Lock size={12} /> Organization fields · on every workspace’s form</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {orgLayer.map((f) => (
                  <button key={f.id} onClick={() => orgToast(f.name, 'field', 'It is on every workspace’s form and keeps its value when a request moves workspace.')}
                    className="flex items-center justify-between gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-left text-[13px] text-[#64748B] hover:border-[#CBD5E1]">
                    <span className="truncate">{f.name}</span><span className="flex-shrink-0 rounded-sm bg-[#EBF5FF] px-1.5 py-px text-[10px] font-semibold text-[#3D8BD0]">Organization</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {system.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#64748B]"><Lock size={12} /> System fields · shared by every workspace</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {system.map((s) => <div key={s} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-[#64748B]">{s}</div>)}
              </div>
            </div>
          )}
        </div>
      </div>
      {edit && (
        <RecordDrawer title={`Edit ${edit.name}`} sub={`${String(edit.type)} · ${whose} ${tab.label.toLowerCase()} form`} rec={{ ...edit, required: edit.required ? 'Yes' : 'No' }}
          fields={[{ key: 'name', label: 'Field Name', required: true }, { key: 'required', label: 'Required', type: 'select', options: ['No', 'Yes'] }, { key: 'hint', label: 'Hint Text' }]}
          onClose={() => setEdit(null)} onSave={(d) => { setRows((rs) => rs.map((y) => (y.id === edit.id ? { ...y, ...d, required: d.required === 'Yes' } as Rec : y))); setEdit(null); toast.success('Field updated'); }} />
      )}
    </>
  );
}

// ── Service Catalog ────────────────────────────────────────────────────────────────────────────

function CatalogBody(props: BodyProps) {
  if (props.aggregate) return <CatalogAcross {...props} />;
  return <CatalogOwn {...props} />;
}

function CatalogOwn({ rows, setRows, ws, whose, scopeBar, settings, setSettings }: BodyProps) {
  const cats = (settings.categories as string[] | undefined) ?? [...new Set([...catalogCategories(ws), ...rows.map((r) => String(r.category))])];
  const fromSetup = (ws.setup.catalogItems ?? []).filter((n) => !rows.some((r) => r.name === n));
  const all: Rec[] = [...rows, ...fromSetup.map((name, i) => ({ id: 10000 + i, name, category: cats[0] ?? ws.name, fromSetup: true }))];
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState<Partial<Rec> | null>(null);
  const [newCat, setNewCat] = useState<string | null>(null);
  const addCat = () => { const n = (newCat ?? '').trim(); if (n && !cats.includes(n)) { setSettings({ ...settings, categories: [...cats, n] }); toast.success(`${n} added to ${whose}`); } setNewCat(null); };
  const shown = all.filter((r) => (!cat || r.category === cat) && (!q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <>
      {scopeBar && <div className="mb-3">{scopeBar}</div>}
      <div className="flex min-h-[520px] gap-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
        <aside className="w-[260px] flex-shrink-0 border-r border-[#E5E7EB] p-4">
          <div className="mb-3 flex items-center justify-between"><p className="text-[16px] font-semibold text-[#364658]">Service Categories</p>
            <IconBtn label="Add category" onClick={() => setNewCat('')}><FolderPlus size={16} /></IconBtn></div>
          {newCat !== null && <input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} onBlur={addCat} onKeyDown={(e) => { if (e.key === 'Enter') addCat(); if (e.key === 'Escape') setNewCat(null); }} placeholder="Category name" className={`${inputCls} mb-2`} />}
          <button onClick={() => setCat(null)} className={`w-full rounded px-2.5 py-2 text-left text-[13px] ${cat === null ? 'bg-[#EEF2F6] font-medium' : 'hover:bg-[#F5F7FA]'} text-[#364658]`}>All Service Categories</button>
          {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`mt-0.5 w-full rounded px-2.5 py-2 text-left text-[13px] ${cat === c ? 'bg-[#EEF2F6] font-medium' : 'hover:bg-[#F5F7FA]'} text-[#364658]`}>{c}</button>)}
        </aside>
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3"><p className="text-[16px] font-semibold text-[#364658]">Services</p><SearchBox value={q} onChange={setQ} />
            <button onClick={() => setDrawer({ category: cat ?? cats[0] })} className={`${primaryBtn} ml-auto`}><Plus size={15} /> Add Service</button></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((r) => (
              <div key={r.id} className="group flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3 hover:border-[#3D8BD0]">
                <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#3D8BD0]"><Inbox size={18} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-[#364658]">{r.name}</span><span className="block text-[12px] text-[#7B8FA5]">{String(r.category)}{r.fromSetup ? ' · added in setup' : ''}</span></span>
                {!r.fromSetup && <span className="opacity-0 group-hover:opacity-100"><IconBtn label="Delete" danger onClick={() => { setRows((rs) => rs.filter((y) => y.id !== r.id)); toast.success(`${r.name} removed`); }}><Trash2 size={14} /></IconBtn></span>}
              </div>
            ))}
          </div>
          {shown.length === 0 && <p className="py-10 text-center text-[13px] text-[#7B8FA5]">No services{cat ? ` in ${cat}` : ''} yet.</p>}
          <p className="mt-4 text-[12px] text-[#7B8FA5]">Only {whose}’s services. Employees see every workspace’s services on the Support Portal (F18).</p>
        </div>
      </div>
      {drawer && <RecordDrawer title="Add Service" sub={`${whose} Service Catalog`} rec={drawer}
        fields={[{ key: 'name', label: 'Service Name', required: true }, { key: 'category', label: 'Service Category', type: 'select', options: cats, required: true }, { key: 'description', label: 'Description', type: 'textarea' }]}
        onClose={() => setDrawer(null)} onSave={(d) => { setRows((rs) => [...rs, { ...d, id: nextId(rs) } as Rec]); setDrawer(null); toast.success(`${d.name} added to ${whose}’s catalog`); }} />}
    </>
  );
}

/** Organization admin, two or more workspaces: every workspace's services in one read-across list (Freshservice's
 *  global Service Catalog, Freshservice-Analysis/11 §10). No Add here: a service is added inside its workspace. */
function CatalogAcross({ store, workspaces, onOpenInWorkspace }: BodyProps) {
  const all = workspaces.flatMap((w) => {
    const own = store.rows[storeKey('catalog', 'request', w.id)] ?? seedRows('catalog', 'request', w.id, w);
    const fromSetup: Rec[] = (w.setup.catalogItems ?? []).filter((n) => !own.some((r) => r.name === n)).map((name, i) => ({ id: 10000 + i, name, category: catalogCategories(w)[0] ?? w.name }));
    return [...own, ...fromSetup].map((r): Rec & { ws: Workspace } => ({ ...r, ws: w }));
  });
  const [q, setQ] = useState('');
  const [wsId, setWsId] = useState<number | null>(null);
  const shown = all.filter((r) => (wsId === null || r.ws.id === wsId) && (!q.trim() || `${r.name} ${String(r.category)}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <>
      <LayerNote>Every workspace’s services, read across. Each service belongs to one workspace and is changed in that workspace’s settings; employees see all of them on the Support Portal.</LayerNote>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} />
        <div className="flex flex-wrap gap-1 rounded-md bg-[#EEF2F6] p-1">
          <button onClick={() => setWsId(null)} className={`rounded px-3 py-1.5 text-[13px] font-medium ${wsId === null ? 'bg-[#1F2937] text-white' : 'text-[#364658] hover:bg-white'}`}>All workspaces</button>
          {workspaces.map((w) => <button key={w.id} onClick={() => setWsId(w.id)} className={`rounded px-3 py-1.5 text-[13px] font-medium ${wsId === w.id ? 'bg-[#1F2937] text-white' : 'text-[#364658] hover:bg-white'}`}>{w.name}</button>)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-[#e5e7eb]"><tr>{['Service', 'Service Category', 'Workspace', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {shown.map((r) => (
              <tr key={`${r.ws.id}-${r.id}`} onClick={() => onOpenInWorkspace(r.ws.id)} className="group cursor-pointer hover:bg-[#f9fafb]">
                <td className={td}><span className="inline-flex items-center gap-2.5"><span className="flex size-7 items-center justify-center rounded bg-[#F1F5F9] text-[#3D8BD0]"><Inbox size={14} /></span><span className="font-medium">{r.name}</span></span></td>
                <td className={`${td} text-[#64748B]`}>{String(r.category)}</td>
                <td className={td}><span className="inline-flex items-center gap-1.5"><Dot colour={r.ws.colour} />{r.ws.name}</span></td>
                <td className={`${td} text-right`}><span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] opacity-0 group-hover:opacity-100">Open in {r.ws.name} <ChevronRight size={14} /></span></td>
              </tr>
            ))}
            {shown.length === 0 && <Empty cols={4}>No services match.</Empty>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-[#7B8FA5]">Showing {shown.length} of {all.length} services from {workspaces.length} workspaces</p>
    </>
  );
}

// ── Emails ─────────────────────────────────────────────────────────────────────────────────────

function EmailsBody({ tab, rows, setRows, ws, whose, scopeBar, onPatchWorkspace }: BodyProps) {
  const [drawer, setDrawer] = useState<Partial<Rec> | null>(null);
  const incoming = tab.key === 'incoming';
  const setupMail = incoming && ws.setup.email && !rows.some((r) => r.email === ws.setup.email) ? [{ id: 9999, name: `${ws.name} support email`, email: ws.setup.email, protocol: 'imap', server: '—', port: '993', security: 'TLS', group: ws.setup.groups[0] ?? '---', category: '---', enabled: true, primary: rows.length === 0, fromSetup: true } as Rec] : [];
  const all = [...setupMail, ...rows];
  if (tab.key === 'email_preference') return <>{scopeBar && <div className="mb-3">{scopeBar}</div>}<p className="max-w-[740px] rounded-md border border-dashed border-[#CBD5E1] px-4 py-6 text-[13px] text-[#64748B]">Email Preference is an Organization setting and is unchanged by ESM: the same ServiceOps page as today.</p></>;
  const kv = (k: string, v: unknown) => <div><p className="text-[12px] text-[#7B8FA5]">{k}</p><p className="text-[13px] text-[#364658]">{String(v ?? '---')}</p></div>;
  return (
    <>
      <Toolbar scopeBar={scopeBar}>
        <button onClick={() => toast(`Configure ${incoming ? 'Incoming' : 'Outgoing'} Email Rules`)} className={secondaryBtn}>Configure {incoming ? 'Incoming' : 'Outgoing'} Email Rules</button>
        <button onClick={() => setDrawer({ protocol: incoming ? 'imap' : 'SMTP', port: incoming ? '993' : '587', security: 'TLS', enabled: true })} className={primaryBtn}><Plus size={15} /> Add {incoming ? 'Incoming' : 'Outgoing'} Email Server</button>
      </Toolbar>
      <div className="space-y-3">
        {all.map((r) => (
          <div key={r.id} className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <div className="mb-3 flex items-center gap-2">
              <p className="flex-1 text-[14px] font-semibold text-[#364658]">{r.name}{r.fromSetup ? <span className="ml-2 text-[12px] font-normal text-[#7B8FA5]">set in setup</span> : null}</p>
              <button onClick={() => toast.success(`Connection to ${String(r.server)} OK`)} className={secondaryBtn}>Test Connection</button>
              <IconBtn label="Edit" onClick={() => setDrawer(r)}><Pencil size={15} /></IconBtn>
              <IconBtn label="Delete" danger onClick={() => { if (r.fromSetup) onPatchWorkspace?.(ws.id, { email: '' }, 'Removed the support email'); else setRows((rs) => rs.filter((y) => y.id !== r.id)); toast.success(`${r.name} deleted`); }}><Trash2 size={15} /></IconBtn>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {kv('Email', r.email)}{kv('Protocol', r.protocol)}{incoming ? kv('Technician Group', r.group) : kv('Server', r.server)}
              {kv('Server', r.server)}{kv('Port', r.port)}{kv('Security Type', r.security)}
              {kv('Enabled', r.enabled ? 'Yes' : 'No')}{kv('Primary', r.primary ? 'Yes' : 'No')}{incoming && kv('Category', r.category)}
            </div>
          </div>
        ))}
        {all.length === 0 && <p className="rounded-lg border border-dashed border-[#CBD5E1] px-4 py-10 text-center text-[13px] text-[#7B8FA5]">{whose} has no {incoming ? 'incoming mailbox' : 'mail server'} yet.</p>}
      </div>
      {incoming && <p className="mt-3 text-[12px] text-[#7B8FA5]">Mail to these addresses becomes {whose} requests. Sending uses the organization’s outgoing server.</p>}
      {drawer && <RecordDrawer title={drawer.id ? `Edit ${drawer.name}` : `Add ${incoming ? 'Incoming' : 'Outgoing'} Email Server`} sub={incoming ? `${whose} mailbox` : 'Organization mail server'} rec={drawer}
        fields={[{ key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', required: true }, { key: 'server', label: 'Server', required: true }, { key: 'port', label: 'Port', required: true },
          { key: 'security', label: 'Security Type', type: 'select', options: ['TLS', 'SSL', 'None'] }, ...(incoming ? [{ key: 'group', label: 'Technician Group', type: 'select' as const, options: ws.setup.groups.length ? ws.setup.groups : ['---'] }, { key: 'category', label: 'Category' }] : [])]}
        onClose={() => setDrawer(null)}
        onSave={(d) => {
          if (d.fromSetup) onPatchWorkspace?.(ws.id, { email: String(d.email) }, `Support email set to ${d.email}`);
          else if (d.id) setRows((rs) => rs.map((y) => (y.id === d.id ? { ...y, ...d } as Rec : y)));
          else setRows((rs) => [...rs, { ...d, id: nextId(rs), primary: rs.length === 0 } as Rec]);
          setDrawer(null); toast.success('Mail server saved');
        }} />}
    </>
  );
}

// ── Technician Groups (the workspace's own groups — the same list the Team tab uses) ───────────

function GroupsBody({ ws, whose, scopeBar, onPatchWorkspace, settings, setSettings }: BodyProps) {
  const [drawer, setDrawer] = useState<Partial<Rec> | null>(null);
  const [q, setQ] = useState('');
  const descs = (settings.descs as Record<string, string> | undefined) ?? {};
  const members = (g: string) => ws.setup.memberIds.filter((id) => (ws.setup.access[id]?.groups ?? []).includes(g)).length;
  const write = (groups: string[], audit: string, access = ws.setup.access) => {
    if (onPatchWorkspace) onPatchWorkspace(ws.id, { groups, access }, audit);
    else { const s = loadStore(); saveStore({ ...s, workspaces: s.workspaces.map((w) => (w.id === ws.id ? { ...w, setup: { ...w.setup, groups, access } } : w)) }); }
  };
  const shown = ws.setup.groups.filter((g) => !q.trim() || g.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <Toolbar scopeBar={scopeBar} q={q} setQ={setQ}><button onClick={() => setDrawer({})} className={primaryBtn}><Plus size={15} /> Create Technician Group</button></Toolbar>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-[#e5e7eb]"><tr>{['Name', 'Description', 'Technicians', 'Actions'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {shown.map((g) => (
              <tr key={g} className="hover:bg-[#f9fafb]">
                <td className={td}><button onClick={() => setDrawer({ id: 1, name: g, description: descs[g] ?? groupDesc(g), old: g })} className="text-[13px] font-medium hover:text-[#3D8BD0]">{g}</button></td>
                <td className={`${td} max-w-[420px] truncate text-[#64748B]`}>{descs[g] ?? groupDesc(g)}</td>
                <td className={td}>{members(g)}</td>
                <td className={td}><span className="inline-flex gap-0.5">
                  <IconBtn label="Edit" onClick={() => setDrawer({ id: 1, name: g, description: descs[g] ?? groupDesc(g), old: g })}><Pencil size={15} /></IconBtn>
                  <IconBtn label="Delete" danger onClick={() => {
                    const access = Object.fromEntries(Object.entries(ws.setup.access).map(([k, a]) => [k, { ...a, groups: a.groups.filter((x) => x !== g) }]));
                    write(ws.setup.groups.filter((x) => x !== g), `Deleted technician group ${g}`, access); toast.success(`${g} deleted`, { description: 'Its technicians stay in the workspace.' });
                  }}><Trash2 size={15} /></IconBtn></span></td>
              </tr>
            ))}
            {shown.length === 0 && <Empty cols={4}>No Data Found</Empty>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-[#7B8FA5]">{whose}’s groups. Technicians join them on the workspace’s Team tab or on their own technician page.</p>
      {drawer && <RecordDrawer title={drawer.old ? `Edit ${drawer.old}` : 'Create Technician Group'} sub={`${whose} technician group`} rec={drawer}
        fields={[{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' }]}
        onClose={() => setDrawer(null)}
        onSave={(d) => {
          const n = String(d.name).trim(); const old = drawer.old as string | undefined;
          if (!old && ws.setup.groups.includes(n)) { toast.error(`${n} already exists in ${whose}`); return; }
          const groups = old ? ws.setup.groups.map((x) => (x === old ? n : x)) : [...ws.setup.groups, n];
          const access = old && old !== n ? Object.fromEntries(Object.entries(ws.setup.access).map(([k, a]) => [k, { ...a, groups: a.groups.map((x) => (x === old ? n : x)) }])) : ws.setup.access;
          write(groups, old ? `Renamed technician group ${old} to ${n}` : `Created technician group ${n}`, access);
          setSettings({ ...settings, descs: { ...descs, [n]: String(d.description ?? '') } });
          setDrawer(null); toast.success(old ? `${n} updated` : `${n} created`);
        }} />}
    </>
  );
}

