import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, Lock, Plus, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { StatusPill, WorkspaceIcon, tint } from './workspaceUi';
import { CUSTOM_SCOPES, SCOPE_OPTIONS, accessOf, scopeLabel } from './workspaceData';
import type { MemberAccess, ScopeLevel, Workspace } from './workspaceData';
import { technicianRoles } from './rolesData';
import type { Role } from './rolesData';

/* Workspace Access — the section of the ServiceOps Add/Edit Technician form that holds its Scope and Groups fields,
 * now per workspace (F03 rethink, Juli 2026-11-03). Roles stay a field of the person (above this section).
 * Lives INSIDE the form; saved on Update like every other field.
 *   · one card per workspace, tinted with the workspace's colour, collapsed to a one-line summary;
 *     open it to see Technician Groups · Scope · Workspace roles (F03d), each a click-to-toggle control;
 *   · "Add Workspace" = ONE click: pick a tile (only workspaces not yet assigned) and its card is added, open,
 *     pre-filled with the workspace's defaults and marked New — adjust or just Update (Juli: less clicking). */

export interface AccessRow { wsId: number; access: MemberAccess }

interface Props {
  workspaces: Workspace[];
  rows: AccessRow[];
  onChange: (rows: AccessRow[]) => void;
  techName: string;
  /** Per-workspace problem shown on the card after Update was tried. */
  errorOf: (row: AccessRow) => string;
}

function Part({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#364658]">{icon}{title}</div>
      {children}
      <p className="mt-2 text-[11px] leading-[1.5] text-[#94A3B8]">{hint}</p>
    </div>
  );
}

const toggleChip = (on: boolean) => `inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] transition-all active:scale-95 ${on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0]'}`;

/** One workspace's access: Technician Groups · Scope · Workspace roles. Shared by the technician form, the Team tab
 *  and the add flow. `canGive(role)` = the viewer may give or take that workspace role here (Assign Roles in Workspace,
 *  and never a role with more than their own tick boxes — F03d §3.4). */
export function AccessEditor({ w, a, onChange, canGive = () => true, hideRoles = false }: { w: Workspace; a: MemberAccess; onChange: (a: MemberAccess) => void; canGive?: (r: Role) => boolean; hideRoles?: boolean }) {
  const held = a.roles ?? [];
  const all = technicianRoles();
  return (
    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
      <Part icon={<Users size={14} className="text-[#0D9488]" />} title="Technician Groups" hint={`Requests assigned to these groups reach them. Member of ${a.groups.length} of ${w.setup.groups.length}.`}>
        {w.setup.groups.length ? (
          <div className="flex flex-wrap gap-1.5">
            {w.setup.groups.map((g) => {
              const on = a.groups.includes(g);
              return <button key={g} type="button" onClick={() => onChange({ ...a, groups: on ? a.groups.filter((x) => x !== g) : [...a.groups, g] })} className={toggleChip(on)}>{on && <Check size={11} strokeWidth={3} />}{g}</button>;
            })}
          </div>
        ) : <p className="text-[12px] text-[#B45309]">{w.name} has no groups yet.</p>}
      </Part>
      <Part icon={<span className="size-3.5 rounded-full border-2 border-[#3D8BD0]" />} title="Scope" hint={SCOPE_OPTIONS.find((s) => s.value === a.scope)!.desc + (a.scope === 'custom' ? '' : '.')}>
        <div className="flex flex-wrap gap-1.5">
          {SCOPE_OPTIONS.map((s) => {
            const on = a.scope === s.value;
            return (
              <button key={s.value} type="button" onClick={() => onChange({ ...a, scope: s.value as ScopeLevel, customScope: s.value === 'custom' ? a.customScope ?? CUSTOM_SCOPES[0] : undefined })}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] transition-colors ${on ? 'border-[#3D8BD0] bg-[#F5FAFF] font-medium text-[#1F5F99]' : 'border-[#DFE5ED] bg-white text-[#475569] hover:border-[#3D8BD0]'}`}>
                <span className={`flex size-3.5 items-center justify-center rounded-full border ${on ? 'border-[#3D8BD0]' : 'border-[#CBD5E1]'}`}>{on && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}</span>{s.label}
              </button>
            );
          })}
          {a.scope === 'custom' && (
            <select value={a.customScope} onChange={(e) => onChange({ ...a, customScope: e.target.value })} className="app-select mt-1 h-8 w-full basis-full rounded border border-[#d1d5db] bg-white px-2 text-[12px]">
              {CUSTOM_SCOPES.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
        </div>
      </Part>
      {!hideRoles && <div className="md:col-span-2">
        <Part icon={<ShieldCheck size={14} className="text-[#7C3AED]" />} title={`Roles in ${w.name}`} hint={`Ticket tabs and Admin › Workspace count in ${w.name}; Admin › Global gives Organization settings. Workspace Admin = this workspace’s record, team and every setting.`}>
          <div className="flex flex-wrap gap-1.5">
            {all.map((r) => {
              const on = held.includes(r.name);
              const ok = canGive(r);
              return (
                <button key={r.name} type="button" disabled={!ok} title={ok ? undefined : 'You can’t give or remove this role: it has permissions you don’t have here, or you lack Assign Roles in Workspace.'}
                  onClick={() => onChange({ ...a, roles: on ? held.filter((x) => x !== r.name) : [...held, r.name] })}
                  className={`${toggleChip(on)} ${on ? '!border-[#7C3AED] !bg-[#7C3AED]' : ''} disabled:cursor-not-allowed disabled:opacity-60`}>
                  {!ok ? <Lock size={11} /> : on && <Check size={11} strokeWidth={3} />}{r.name}
                </button>
              );
            })}
            {!all.length && <span className="text-[12px] text-[#94A3B8]">No roles are enabled.</span>}
          </div>
        </Part>
      </div>}
    </div>
  );
}

export function WorkspaceAccessSection({ workspaces, rows, onChange, techName, errorOf, hideRoles = false, canGive }: Props & { hideRoles?: boolean; canGive?: (w: Workspace, r: Role) => boolean }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(rows.slice(0, 1).map((r) => r.wsId)));
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const byId = (id: number) => workspaces.find((w) => w.id === id)!;
  const notIn = workspaces.filter((w) => !rows.some((r) => r.wsId === w.id));
  const setRow = (wsId: number, access: MemberAccess) => onChange(rows.map((r) => (r.wsId === wsId ? { ...r, access } : r)));
  // One card open at a time keeps the form short.
  const toggle = (id: number) => setOpen((s) => (s.has(id) ? new Set() : new Set([id])));
  const admins = rows.filter((r) => (r.access.roles ?? []).length > 0).length;
  const who = techName.trim() || 'This technician';

  const add = (w: Workspace) => {
    onChange([...rows, { wsId: w.id, access: { ...accessOf(w, -1) } }]);
    setOpen(new Set([w.id]));
    setFresh((f) => new Set([...f, w.id]));
    setAdding(false);
  };

  return (
    <section className="md:col-span-2">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold text-[#1F2D3D]">Workspace Access</div>
          <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
            {rows.length ? <>{who} works in <span className="font-medium text-[#364658]">{rows.length} workspace{rows.length > 1 ? 's' : ''}</span>{admins ? <>, admin in {admins}</> : ''}. Where they work, how much they see there, and their groups there.</> : 'Where they work, how much they see there, and their groups there. Add the workspaces this technician works in.'}
          </p>
        </div>
        {!adding && notIn.length > 0 && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex h-8 items-center gap-1.5 rounded border border-[#3D8BD0] bg-white px-3 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"><Plus size={14} /> Add Workspace</button>
        )}
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => {
          const w = byId(r.wsId);
          const isOpen = open.has(r.wsId);
          const err = errorOf(r);
          const wsRoles = r.access.roles ?? [];
          return (
            <div key={r.wsId} className={`overflow-hidden rounded-lg border bg-white transition-shadow ${err ? 'border-[#FCA5A5]' : isOpen ? 'border-[#DCE3EC] shadow-sm' : 'border-[#E5E7EB] hover:shadow-sm'}`}>
              <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: isOpen ? tint(w.colour, 0.06) : undefined, borderLeft: `3px solid ${w.colour}` }}>
                <span className="scale-[0.85]"><WorkspaceIcon type={w.type} colour={w.colour} /></span>
                <button type="button" onClick={() => toggle(r.wsId)} className="min-w-0 flex-1 text-left">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#1F2D3D]">{w.name}</span>
                    {w.status !== 'live' && <StatusPill status={w.status} />}
                    {fresh.has(r.wsId) && <span className="rounded bg-[#DCFCE7] px-1.5 py-px text-[11px] font-medium text-[#15803D]">New · saved on Update</span>}
                    {wsRoles.map((x) => <span key={x} className="rounded bg-[#F3E8FF] px-1.5 py-px text-[11px] font-medium text-[#6B21A8]">{x}</span>)}
                  </span>
                  {!isOpen && <span className="mt-0.5 block truncate text-[12px] text-[#64748B]">{scopeLabel(r.access)} · {r.access.groups.length ? r.access.groups.join(', ') : 'no group'}</span>}
                </button>
                <button type="button" onClick={() => onChange(rows.filter((x) => x.wsId !== r.wsId))} aria-label={`Remove ${w.name}`} title={`Remove from ${w.name}`} className="flex size-8 items-center justify-center rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]"><Trash2 size={14} /></button>
                <button type="button" onClick={() => toggle(r.wsId)} aria-label={isOpen ? `Collapse ${w.name}` : `Expand ${w.name}`} className="flex size-8 items-center justify-center rounded text-[#64748B] hover:bg-[#F1F5F9]"><ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
              </div>
              {isOpen && <div className="border-t border-[#EEF1F5] px-4 py-4 animate-in fade-in duration-150"><AccessEditor w={w} a={r.access} onChange={(a) => setRow(r.wsId, a)} hideRoles={hideRoles} canGive={canGive ? (role) => canGive(w, role) : undefined} /></div>}
              {err && <p className="border-t border-[#FEE2E2] bg-[#FEF2F2] px-4 py-1.5 text-[12px] text-[#B91C1C]">{err}</p>}
            </div>
          );
        })}

        {/* ── Add Workspace: pick a tile, done ── */}
        {adding && (
          <div className="rounded-lg border-2 border-dashed border-[#93C5FD] bg-[#F8FBFF] p-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[#1F2D3D]">Add to which workspace?</span>
              <span className="text-[12px] text-[#7B8FA5]">It is added with its first group and Group Access; change them on the card.</span>
              <button type="button" onClick={() => setAdding(false)} aria-label="Cancel" className="ml-auto flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-white"><X size={15} /></button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {notIn.map((w) => (
                <button key={w.id} type="button" onClick={() => add(w)}
                  className="group flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderTopColor: w.colour, borderTopWidth: 3 }}>
                  <WorkspaceIcon type={w.type} colour={w.colour} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#1F2D3D]">{w.name}</span>
                    <span className="block truncate text-[11px] text-[#7B8FA5]">{w.status === 'setup' ? 'In Setup · ' : w.status === 'inactive' ? 'Inactive · ' : ''}{w.setup.groups.length} groups · {w.setup.memberIds.length} technicians</span>
                  </span>
                  <Plus size={16} className="text-[#CBD5E1] transition-colors group-hover:text-[#3D8BD0]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {rows.length === 0 && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-[#DCE3EC] px-4 py-8 text-center transition-colors hover:border-[#93C5FD] hover:bg-[#F8FBFF]">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#EBF5FF] text-[#3D8BD0]"><Plus size={18} /></span>
            <span className="mt-2 text-[13px] font-medium text-[#1F2D3D]">Add the first workspace</span>
            <span className="text-[12px] text-[#7B8FA5]">Without one, this technician can’t work on any requests.</span>
          </button>
        )}
      </div>
    </section>
  );
}
