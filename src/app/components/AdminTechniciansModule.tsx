import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, ChevronLeft, Download, Eye, KeyRound, ListFilter, Lock, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { Notice, initials, primaryBtn } from './workspaceUi';
import { WorkspaceAccessSection } from './WorkspaceAccessSection';
import { accessSentence } from './AccessCells';
import { canWorkspace, globalLabels, hasGlobalAccess, isSuperAdmin, ticketModulesIn, withinOwn, workspaceLabels } from './rolesData';
import type { RoleMap } from './rolesData';
import {
  DEPARTMENTS, LICENSE_TYPES, orgKeeperIds, LOCATIONS, SCOPE_OPTIONS, SUPPORT_LEVELS,
  accessOf, adminIdsOf, canAtOrg, loadStore, membershipsOf, roleMapIn, saveStore, scopeLabel, sortWorkspaces,
} from './workspaceData';
import type { MemberAccess, ScopeLevel, Technician, Workspace, WorkspaceStore } from './workspaceData';

/* Admin › Users › Technicians — ESM F02/F03, fitted INTO the existing ServiceOps screens
 * [VERIFIED live 2026-10-30, Features/F01-service-desk.md §2m]:
 *   #/admin/users/technician            the ServiceOps list (Name · Email · Logon Name · Department · Action) + a
 *                                       Workspaces column. 👁 opens the ServiceOps view panel, which gains a
 *                                       Workspaces tab.
 *   #/admin/users/technician/<id>       the ServiceOps Edit Technician form; /create = Add Technician.
 * ESM changes to the form (F03 rethink, Juli 2026-11-03):
 *   · Roles stay ONE field of the person, as in ServiceOps (now listing Organization roles, F03d): they count in
 *     Organization settings and every workspace they work in. Giving the built-in Organization Admin role (or any role
 *     with Organization Admin tick boxes) makes them an Organization Admin — no switch;
 *   · Scope and Groups move into WORKSPACE ACCESS — one row per workspace they work in (+ Add Workspace), each with
 *     its WORKSPACE ROLES (e.g. Workspace Admin) that count only there;
 *   · a "What they can do" summary reads the result back in plain words.
 * Every other field stays where ServiceOps has it. Nothing changes until Update. Organization Admins only. */

interface Props {
  path?: string;
  onPath: (path: string | undefined) => void;
  onBackToApp: () => void;
}

const now = () => new Date().toISOString().slice(0, 16);
const input = 'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
const select = `app-select ${input}`;
const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#364658]';

function Field({ label, required, children, wide }: { label: string; required?: boolean; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className="mb-1.5 block text-[13px] text-[#64748B]">{label}{required && <span className="ml-0.5 text-[#DC2626]">*</span>}</label>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'}`}>
      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export function AdminTechniciansModule({ path, onPath, onBackToApp }: Props) {
  const [store, setStore] = useState<WorkspaceStore>(loadStore);
  useEffect(() => { saveStore(store); }, [store]);
  const [q, setQ] = useState('');
  const [view, setView] = useState<number | null>(null);
  const isOrg = canAtOrg(store.viewAs, 'View Users');
  const me = store.viewAs;

  if (!isOrg) {
    return (
      <div className="px-4 py-6">
        <Notice icon={<Lock size={28} strokeWidth={1.6} />} title="Only Organization Admins manage technician accounts" action={<button onClick={onBackToApp} className={primaryBtn}>Back to app</button>}>
          Workspace Admins add technicians from their workspace’s Team tab.
        </Notice>
      </div>
    );
  }

  /** Save the form: the account's own fields, then its memberships workspace by workspace (each change audited). */
  const save = (t: Technician, rows: { wsId: number; access: MemberAccess }[], isNew: boolean) => {
    setStore((s) => {
      const technicians = isNew ? [...s.technicians, t] : s.technicians.map((x) => (x.id === t.id ? t : x));
      const workspaces = s.workspaces.map((w) => {
        const row = rows.find((r) => r.wsId === w.id);
        const was = w.setup.memberIds.includes(t.id);
        if (!row && !was) return w;
        const access = { ...w.setup.access };
        const sentence = accessSentence;
        if (!row) {
          delete access[t.id];
          return { ...w, setup: { ...w.setup, memberIds: w.setup.memberIds.filter((m) => m !== t.id), access }, audit: [...w.audit, { at: now(), by: me, text: `Removed ${t.name} from the team (their account and other workspaces are unchanged)` }] };
        }
        const before = was ? sentence(accessOf(w, t.id)) : '';
        access[t.id] = row.access;
        const after = sentence(row.access);
        if (was && before === after) return w;
        return {
          ...w, setup: { ...w.setup, memberIds: was ? w.setup.memberIds : [...w.setup.memberIds, t.id], access },
          audit: [...w.audit, { at: now(), by: me, text: was ? `Changed ${t.name}’s access: ${after}` : `Added ${t.name} as ${after}` }],
        };
      });
      return { ...s, technicians, workspaces };
    });
    onPath(undefined);
    toast.success(isNew ? `${t.name} added` : `${t.name} updated`, { description: rows.length ? `Works in ${rows.map((r) => store.workspaces.find((w) => w.id === r.wsId)?.name).join(', ')}.` : 'Not in any workspace yet.' });
  };

  // ── Add / Edit Technician ──
  if (path === 'create' || /^\d+$/.test(path ?? '')) {
    const tech = path === 'create' ? undefined : store.technicians.find((t) => t.id === Number(path));
    if (path !== 'create' && !tech) {
      return <div className="px-4 py-6"><Notice icon={<Lock size={28} strokeWidth={1.6} />} title="Technician does not exist" action={<button onClick={() => onPath(undefined)} className={primaryBtn}>Back to Technicians</button>}>This technician does not exist.</Notice></div>;
    }
    return <TechnicianForm key={path} store={store} tech={tech} onCancel={() => onPath(undefined)} onSave={save} />;
  }

  // ── list (ServiceOps) ──
  const query = q.trim().toLowerCase();
  const rows = store.technicians.filter((t) => !query || `${t.name} ${t.email} ${t.logonName ?? ''} ${t.department ?? ''}`.toLowerCase().includes(query));
  const viewed = view !== null ? store.technicians.find((t) => t.id === view) : undefined;
  return (
    <div className="min-h-full bg-white">
      <div className="px-4 pb-3 pt-5">
        <h1 className="text-[20px] font-semibold text-[#364658]">Technicians</h1>
        <p className="mt-1 text-[13px] text-[#7B8FA5]">Create and manage technician profiles, roles, and access. <a href="#" onClick={(e) => e.preventDefault()} className="text-[13px] text-[#364658] underline underline-offset-2">View Docs</a></p>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <button className="inline-flex h-9 items-center gap-2 rounded border border-[#d1d5db] px-3 text-[13px] text-[#64748B]"><ListFilter size={14} /> All Technicians <ChevronDown size={13} /></button>
        <div className="relative w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search technicians" className={`${input} pl-8`} />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => onPath('create')} className={primaryBtn}><Plus size={15} /> Add Technician</button>
          <button className={`${iconBtn} border border-[#DFE5ED]`} aria-label="Export"><Download size={15} /></button>
          <button className={`${iconBtn} border border-[#DFE5ED]`} aria-label="Refresh"><RefreshCw size={15} /></button>
        </div>
      </div>
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb]">
          <tr>{['Name', 'Email', 'Logon Name', 'Department', 'Workspaces', 'Action'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {rows.map((t) => {
            const ms = membershipsOf(store.workspaces, t.id);
            return (
              <tr key={t.id} className="hover:bg-[#f9fafb]">
                <td className="px-4 py-2.5"><span className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded bg-[#3D8BD0] text-[10px] font-semibold text-white">{initials(t.name)}</span><span className={`size-2 rounded-full ${t.disabled ? 'bg-[#94A3B8]' : 'bg-[#22C55E]'}`} /><span className="text-[13px] text-[#1F2D3D]">{t.name}</span></span></td>
                <td className="px-4 py-2.5 text-[13px] text-[#364658]">{t.email}</td>
                <td className="px-4 py-2.5 text-[13px] text-[#364658]">{t.logonName ?? '---'}</td>
                <td className="px-4 py-2.5 text-[13px] text-[#364658]">{t.department ?? '---'}</td>
                <td className="px-4 py-2.5 text-[13px] text-[#364658]">{ms.length ? ms.map((m) => m.w.name).join(', ') : <span className="text-[#94A3B8]">---</span>}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-0.5">
                    <button onClick={() => setView(t.id)} aria-label={`View ${t.name}`} className={iconBtn}><Eye size={15} /></button>
                    <button onClick={() => toast('Reset password', { description: 'Unchanged ServiceOps action.' })} aria-label="Reset password" className={iconBtn}><KeyRound size={15} /></button>
                    <button onClick={() => onPath(String(t.id))} aria-label={`Edit ${t.name}`} className={iconBtn}><Pencil size={15} /></button>
                    <button onClick={() => toast('Delete technician', { description: 'Unchanged ServiceOps action.' })} aria-label="Delete" className={`${iconBtn} text-[#DC2626] hover:text-[#B91C1C]`}><Trash2 size={15} /></button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-3 text-right text-[12px] text-[#7B8FA5]">Showing 1-{rows.length} of {rows.length} items</div>
      {viewed && <ViewPanel tech={viewed} workspaces={store.workspaces} onClose={() => setView(null)} onEdit={() => { setView(null); onPath(String(viewed.id)); }} />}
    </div>
  );
}

/* The ServiceOps 👁 panel. ESM adds one tab, Workspaces; the rest is as today. */
function ViewPanel({ tech, workspaces, onClose, onEdit }: { tech: Technician; workspaces: Workspace[]; onClose: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState<'profile' | 'workspaces' | 'requests' | 'assets' | 'ci'>('profile');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const ms = membershipsOf(workspaces, tech.id);
  const rows: [string, string][] = [['Name', tech.name], ['Email', tech.email], ['Logon Name', tech.logonName ?? '---'], ['Roles', ms.map(({ w, access }) => `${w.name}: ${(access.roles ?? []).join(', ') || '—'}`).join(' · ') || '---'], ['Department', tech.department ?? '---'], ['Manager', tech.manager ?? '---'], ['Location', tech.location ?? '---'], ['Contact No.', tech.contactNo ?? '---'], ['Status', tech.disabled ? 'Blocked' : 'Unblocked']];
  return (
    <div className="fixed inset-0 z-[9995] flex justify-end bg-[#0F172A]/30" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside ref={ref} role="dialog" aria-label={tech.name} className="flex h-full w-[680px] max-w-[95vw] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between border-b border-[#EEF1F5] px-4 py-3">
          <h2 className="text-[17px] font-semibold text-[#1F2D3D]">{tech.name}</h2>
          <span className="flex items-center gap-1"><button onClick={onEdit} aria-label="Edit" className={iconBtn}><Pencil size={15} /></button><button onClick={onClose} aria-label="Close" className={iconBtn}><X size={18} /></button></span>
        </header>
        <div className="flex items-center gap-4 px-4 py-4">
          <span className="flex size-16 items-center justify-center rounded bg-[#3D8BD0] text-[24px] font-medium text-white">{initials(tech.name)}</span>
          <div><div className="text-[18px] text-[#1F2D3D]">{tech.name}</div><div className="text-[13px]"><span className="text-[#3D8BD0]">{tech.email}</span> <span className="text-[#64748B]">( Technician )</span></div></div>
        </div>
        <div className="mx-4 flex gap-1 rounded bg-[#EEF2F8] p-1">
          {([['profile', 'Profile'], ['workspaces', 'Workspaces'], ['requests', 'Recent Requests'], ['assets', 'Assets'], ['ci', 'CI']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded px-3 py-1.5 text-[13px] ${tab === k ? 'bg-[#1F2D3D] text-white' : 'text-[#364658] hover:bg-white'}`}>{l}</button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {tab === 'profile' && (
            <table className="w-full text-[13px]"><tbody className="divide-y divide-[#EEF1F5]">{rows.map(([k, v]) => <tr key={k}><td className="w-1/2 py-2 text-[#64748B]">{k}</td><td className="py-2 text-[#364658]">{v}</td></tr>)}</tbody></table>
          )}
          {tab === 'workspaces' && (ms.length ? (
            <table className="w-full text-[13px]">
              <thead className="border-b border-[#e5e7eb]"><tr>{['Workspace', 'Scope', 'Groups', 'Roles here'].map((h) => <th key={h} className="py-2 text-left text-[12px] font-semibold text-[#364658]">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#EEF1F5]">{ms.map(({ w, access }) => (
                <tr key={w.id}><td className="py-2 pr-2 text-[#1F2D3D]">{w.name}</td><td className="py-2 pr-2 text-[#364658]">{scopeLabel(access)}</td><td className="py-2 pr-2 text-[#364658]">{access.groups.join(', ') || '---'}</td><td className="py-2 text-[#364658]">{(access.roles ?? []).join(', ') || '---'}</td></tr>
              ))}</tbody>
            </table>
          ) : <p className="py-6 text-center text-[13px] text-[#94A3B8]">Not in any workspace. Edit the technician to add one.</p>)}
          {(tab === 'requests' || tab === 'assets' || tab === 'ci') && <p className="py-6 text-center text-[13px] text-[#94A3B8]">As in ServiceOps today.</p>}
        </div>
      </aside>
    </div>
  );
}

/* ServiceOps' Add / Edit Technician page, restructured (Juli, 2026-10-30) with Freshservice as REFERENCE ONLY
 * [VERIFIED frenchfries 2026-10-30: Add Agent = "Basic details" + "Additional information" sections; the agent page
 * keeps Permissions on its own tab]. Same ServiceOps fields, now split:
 *   identity strip   avatar · name · email · live summary (workspaces, account) — updates as you type
 *   Profile          Basic details · Additional information (collapsible), the ServiceOps fields
 *   Permissions      Roles (the person's) · Workspace Access (scope · groups · Workspace Admin per workspace) ·
 *                    Organization-wide (Asset Scope) · What they can do (read-back)
 * Saved together on Add / Update, like ServiceOps. A tab with a problem shows a red dot and opens on submit. */
type FormTab = 'profile' | 'permissions';

function Section({ title, sub, open, onToggle, children }: { title: string; sub: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F9FAFB]">
        <ChevronDown size={16} className={`text-[#7B8FA5] transition-transform ${open ? '' : '-rotate-90'}`} />
        <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-[#1F2D3D]">{title}</span><span className="block text-[12px] text-[#7B8FA5]">{sub}</span></span>
      </button>
      {open && <div className="border-t border-[#EEF1F5] px-4 py-4 animate-in fade-in duration-150">{children}</div>}
    </section>
  );
}

function TechnicianForm({ store, tech, onCancel, onSave }: {
  store: WorkspaceStore; tech?: Technician; onCancel: () => void;
  onSave: (t: Technician, rows: { wsId: number; access: MemberAccess }[], isNew: boolean) => void;
}) {
  const isNew = !tech;
  const [t, setT] = useState<Technician>(() => tech ? { ...tech } : { id: Math.max(...store.technicians.map((x) => x.id)) + 1, name: '', email: '', licenseType: 'Named User', allowLogin: true, location: 'Asia', roles: ['Request Specialist Technician'] });
  const all = sortWorkspaces(store.workspaces);
  const [rows, setRows] = useState<{ wsId: number; access: MemberAccess }[]>(() => tech ? all.filter((w) => w.setup.memberIds.includes(tech.id)).map((w) => ({ wsId: w.id, access: { ...accessOf(w, tech.id) } })) : []);
  const roleMap: RoleMap = Object.fromEntries(rows.map((r) => [r.wsId, r.access.roles ?? []]));
  const orgAdmin = hasGlobalAccess(roleMap);
  const [tab, setTab] = useState<FormTab>('profile');
  const [openSec, setOpenSec] = useState({ basic: true, more: !isNew });
  const [dnd, setDnd] = useState(false);
  const [assetScope, setAssetScope] = useState<ScopeLevel>('group');
  const [tried, setTried] = useState(false);
  const patch = (p: Partial<Technician>) => setT((x) => ({ ...x, ...p }));

  // Errors are checked on Add / Update, like the ServiceOps form.
  const onlyAdminOf = (w: Workspace) => !!tech && adminIdsOf(w).length === 1 && adminIdsOf(w)[0] === tech.id;
  const rowError = (r: { wsId: number; access: MemberAccess }) =>
    onlyAdminOf(all.find((w) => w.id === r.wsId)!) && !canWorkspace({ [r.wsId]: r.access.roles ?? [] }, r.wsId, 'Assign Roles in Workspace') ? 'They are the only one here who can give roles (Assign Roles in Workspace). Keep such a role, or give one to someone else first.' : '';
  const removedAdmin = tech ? all.filter((w) => onlyAdminOf(w) && !rows.some((r) => r.wsId === w.id)) : [];
  const emailTaken = !!t.email.trim() && store.technicians.some((x) => x.id !== t.id && x.email.toLowerCase() === t.email.trim().toLowerCase());
  const profileErrors = [!t.name.trim() && 'Name is required.', emailTaken && 'Another technician uses this email.'].filter(Boolean) as string[];
  // Would saving leave nobody who can manage roles and users? Check with this form's rows applied.
  const wsAfter = store.workspaces.map((w) => { const r = rows.find((x) => x.wsId === w.id); const memberIds = w.setup.memberIds.filter((m) => m !== t.id).concat(r ? [t.id] : []); const access = { ...w.setup.access }; if (r) access[t.id] = r.access; else delete access[t.id]; return { ...w, setup: { ...w.setup, memberIds, access } }; });
  const lastOrg = !!tech && orgKeeperIds(store.workspaces, store.technicians).includes(tech.id) && orgKeeperIds(wsAfter, store.technicians).length === 0;
  const permErrors = [rows.some((r) => !(r.access.roles ?? []).length) && 'Give at least one role in every workspace they work in.', !rows.length && 'Add at least one workspace.', ...rows.map(rowError).filter(Boolean), ...removedAdmin.map((w) => `${t.name || 'This technician'} is the only Workspace Admin of ${w.name}; make someone else admin there first.`), lastOrg && 'They are the only one who can manage roles and users (Admin › Global › Manage Roles + Update User). Keep such a role, or give one to someone else first.'].filter(Boolean) as string[];
  const submit = () => {
    setTried(true);
    if (profileErrors.length) { setTab('profile'); setOpenSec((o) => ({ ...o, basic: true })); return; }
    if (permErrors.length) { setTab('permissions'); return; }
    onSave({ ...t, name: t.name.trim(), email: t.email.trim() }, rows, isNew);
  };
  const errs = tab === 'profile' ? profileErrors : permErrors;
  const admins = rows.filter((r) => (r.access.roles ?? []).length > 0).length;
  const Dot = () => <span className="h-3 w-px bg-[#E5E7EB]" />;

  return (
    <div className="min-h-full bg-[#F7F9FB]">
      <div className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={onCancel} aria-label="Back" className="flex size-7 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] hover:bg-[#F5F7FA]"><ChevronLeft size={15} /></button>
          <h1 className="text-[17px] font-medium text-[#1F2D3D]">{isNew ? 'Add Technician' : 'Edit Technician'}</h1>
          <span className="ml-auto flex gap-2">
            <button onClick={submit} disabled={!canAtOrg(store.viewAs, isNew ? 'Create User' : 'Update User')} title={canAtOrg(store.viewAs, isNew ? 'Create User' : 'Update User') ? undefined : `Needs Admin › Global › ${isNew ? 'Create User' : 'Update User'}`} className="inline-flex h-9 items-center rounded bg-[#1F2D3D] px-4 text-[13px] font-medium text-white hover:bg-[#364658] disabled:opacity-40">{isNew ? 'Add' : 'Update'}</button>
            <button onClick={onCancel} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] text-[#364658] hover:bg-[#F5F7FA]">Cancel</button>
          </span>
        </div>
        {/* identity strip — reads back what is being entered */}
        <div className="flex flex-wrap items-center gap-4 px-4 pb-1">
          <span className="flex size-12 items-center justify-center rounded-lg bg-[#3D8BD0] text-[18px] font-medium text-white">{t.name.trim() ? initials(t.name) : '?'}</span>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-[#1F2D3D]">{t.name.trim() || 'New technician'}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#64748B]">
              <span>{t.email.trim() || 'No email yet'}</span><Dot />
              <span>{rows.length ? `${rows.length} workspace${rows.length > 1 ? 's' : ''}${admins ? ` · admin in ${admins}` : ''}` : 'No workspace yet'}</span><Dot />
              <span>{t.licenseType ?? 'Named User'} · {t.allowLogin !== false ? 'Can log in' : 'Login off'}</span>
              {orgAdmin && <><Dot /><span className="font-medium text-[#6B21A8]">Organization Admin</span></>}
            </div>
          </div>
        </div>
        <div role="tablist" className="mt-1 flex gap-2.5 px-4">
          {([['profile', 'Profile', profileErrors.length], ['permissions', 'Permissions', permErrors.length]] as const).map(([k, l, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${tab === k ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'}`}>
              {l}
              {k === 'permissions' && <span className={`rounded-full px-1.5 text-[11px] font-semibold ${tab === k ? 'bg-[#EBF5FF] text-[#1F5F99]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{rows.length}</span>}
              {tried && n > 0 && <span className="size-1.5 rounded-full bg-[#DC2626]" aria-label="Has problems" />}
            </button>
          ))}
        </div>
      </div>

      <div key={tab} className="mx-auto max-w-[900px] space-y-4 px-4 py-5 animate-in fade-in duration-150">
        {tried && errs.length > 0 && <div role="alert" className="rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#991B1B]">{errs.map((e) => <div key={e}>{e}</div>)}</div>}

        {tab === 'profile' ? (
          <>
            <Section title="Basic details" sub="Name, sign-in and how to reach them." open={openSec.basic} onToggle={() => setOpenSec((o) => ({ ...o, basic: !o.basic }))}>
              <div className="flex gap-6">
                <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  <Field label="Name" required><input value={t.name} onChange={(e) => patch({ name: e.target.value })} className={input} aria-label="Name" /></Field>
                  <Field label="Email"><input value={t.email} onChange={(e) => patch({ email: e.target.value })} className={input} aria-label="Email" /></Field>
                  <Field label="Logon Name"><input value={t.logonName ?? ''} onChange={(e) => patch({ logonName: e.target.value })} className={input} /></Field>
                  <Field label="Contact No"><input value={t.contactNo ?? ''} onChange={(e) => patch({ contactNo: e.target.value })} placeholder="Contact No" className={input} /></Field>
                  <Field label="Alternate Contact No. 1"><input placeholder="Alternate Contact No. 1" className={input} /></Field>
                  <Field label="Timezone"><select className={select} defaultValue="(GMT+05:30) Calcutta"><option>(GMT+05:30) Calcutta</option><option>(GMT+00:00) London</option></select></Field>
                  <Field label="Location"><select value={t.location ?? ''} onChange={(e) => patch({ location: e.target.value })} className={select}><option value="">Location</option>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</select></Field>
                </div>
                <div className="hidden w-[150px] flex-shrink-0 text-center md:block">
                  <div className="mx-auto flex size-[110px] items-center justify-center rounded-lg bg-[#3D8BD0] text-[40px] text-white">{initials(t.name || '?')}</div>
                  <div className="mt-2 text-[12px]"><span className="text-[#3D8BD0]">Change</span> <span className="text-[#CBD5E1]">|</span> <span className="text-[#DC2626]">Remove</span></div>
                </div>
              </div>
            </Section>

            <Section title="Additional information" sub="Organization, licence, login and preferences." open={openSec.more} onToggle={() => setOpenSec((o) => ({ ...o, more: !o.more }))}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <Field label="Department"><select value={t.department ?? ''} onChange={(e) => patch({ department: e.target.value })} className={select}><option value="">Department</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
                <Field label="Manager"><select value={t.manager ?? ''} onChange={(e) => patch({ manager: e.target.value })} className={select}><option value="">Manager</option>{store.technicians.filter((x) => x.id !== t.id).map((x) => <option key={x.id}>{x.name}</option>)}</select></Field>
                <Field label="Support Level"><select value={t.supportLevel ?? ''} onChange={(e) => patch({ supportLevel: e.target.value })} className={select}><option value="">Support Level</option>{SUPPORT_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field>
                <Field label="License Type" required><select value={t.licenseType ?? 'Named User'} onChange={(e) => patch({ licenseType: e.target.value })} className={select}>{LICENSE_TYPES.map((l) => <option key={l}>{l}</option>)}</select></Field>
                <Field label="Allow to Login"><Toggle on={t.allowLogin !== false} onChange={(v) => patch({ allowLogin: v })} label="Allow to Login" /></Field>
                <Field label="Do Not Disturb"><Toggle on={dnd} onChange={setDnd} label="Do Not Disturb" /></Field>
                <Field label="Date Time Format" required><select className={select}><option>ddd, MMM DD, YYYY hh:mm A</option></select></Field>
                <Field label="Time Format" required><select className={select}><option>12 Hours</option><option>24 Hours</option></select></Field>
                <Field label="Signature" wide><textarea rows={3} placeholder="Signature" className="w-full rounded border border-[#d1d5db] px-3 py-2 text-[13px] focus:border-[#3D8BD0] focus:outline-none" /></Field>
              </div>
            </Section>

            <div className="flex justify-end">
              <button onClick={() => setTab('permissions')} className="inline-flex h-9 items-center gap-1.5 rounded border border-[#3D8BD0] bg-white px-4 text-[13px] font-medium text-[#3D8BD0] hover:bg-[#EBF5FF]">Next: Permissions <ChevronLeft size={14} className="rotate-180" /></button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <WorkspaceAccessSection workspaces={all} rows={rows} onChange={setRows} techName={t.name} errorOf={(r) => (tried ? rowError(r) : '')}
                canGive={(w, role) => { const me = roleMapIn(store.workspaces, store.viewAs); return isSuperAdmin(me) || withinOwn(role, me, w.id); }} />
            </div>


            <section className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <div className="text-[14px] font-semibold text-[#1F2D3D]">Organization-wide</div>
              <p className="mt-0.5 text-[12px] text-[#7B8FA5]">This applies in every workspace.</p>
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <Field label="Asset Scope" wide>
                  <div className="flex flex-wrap gap-1.5">
                    {SCOPE_OPTIONS.map((sc) => (
                      <button key={sc.value} type="button" onClick={() => setAssetScope(sc.value)} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${assetScope === sc.value ? 'border-[#3D8BD0] bg-[#F5FAFF] font-medium text-[#1F5F99]' : 'border-[#DFE5ED] bg-white text-[#475569] hover:border-[#3D8BD0]'}`}>
                        <span className={`flex size-3.5 items-center justify-center rounded-full border ${assetScope === sc.value ? 'border-[#3D8BD0]' : 'border-[#CBD5E1]'}`}>{assetScope === sc.value && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}</span>{sc.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[12px] text-[#94A3B8]">As today: asset access is not per workspace yet.</p>
                </Field>
              </div>
            </section>

            <WhatTheyCanDo name={t.name.trim() || 'This technician'} rows={rows} all={all} />
          </>
        )}
      </div>
    </div>
  );
}

/* "What they can do" — the form's own read-back of the roles given in each workspace, in plain words (F03f). */
function WhatTheyCanDo({ name, rows, all }: { name: string; rows: { wsId: number; access: MemberAccess }[]; all: Workspace[] }) {
  const wsName = (id: number) => all.find((w) => w.id === id)?.name ?? '';
  const short = (xs: string[]) => { const n = xs.map((l) => l.replace(/^Manage /, '')); return `${n.slice(0, 4).join(', ')}${n.length > 4 ? ` and ${n.length - 4} more` : ''}`; };
  const m: RoleMap = Object.fromEntries(rows.map((r) => [r.wsId, r.access.roles ?? []]));
  const g = globalLabels(m);
  const lines: { ok: boolean; warn?: boolean; text: string }[] = [
    g.length ? { ok: true, text: `Organization settings (Admin › Global): ${short(g)}.` } : { ok: false, text: 'No Organization settings.' },
    ...(g.includes('Manage All Workspaces') ? [{ ok: true, text: 'Manage All Workspaces: their Admin › Workspace ticks count in every workspace.' }] : []),
    ...rows.map((r) => {
      const here = workspaceLabels(m, r.wsId);
      const tickets = ticketModulesIn(m, r.wsId);
      return { ok: true, warn: !tickets.length && !here.length, text: `${wsName(r.wsId)}: ${tickets.length ? `${tickets.join(', ')} · ${scopeLabel(r.access)}${r.access.groups.length ? `, in ${r.access.groups.join(', ')}` : ''}` : 'no ticket permission here'}${here.length ? ` · settings here: ${short(here)}` : ''}.` };
    }),
    ...(rows.length ? [] : [{ ok: false, text: 'No workspace yet: they can’t see or work on any ticket.' }]),
  ];
  return (
    <section className="rounded-lg border border-[#DCEBFA] bg-[#F8FBFF] p-4">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1F2D3D]"><ShieldCheck size={16} className="text-[#3D8BD0]" /> What {name} can do</div>
      <p className="mt-0.5 text-[12px] text-[#7B8FA5]">Worked out from the roles given in each workspace above. Updates as you change them.</p>
      <ul className="mt-3 space-y-1.5">
        {lines.map((l) => (
          <li key={l.text} className="flex items-start gap-2 text-[13px] leading-[1.5]">
            {l.warn ? <TriangleAlert size={14} className="mt-0.5 flex-shrink-0 text-[#D97706]" /> : l.ok ? <Check size={14} className="mt-0.5 flex-shrink-0 text-[#16A34A]" /> : <X size={14} className="mt-0.5 flex-shrink-0 text-[#94A3B8]" />}
            <span className={l.warn ? 'text-[#92400E]' : l.ok ? 'text-[#364658]' : 'text-[#7B8FA5]'}>{l.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
