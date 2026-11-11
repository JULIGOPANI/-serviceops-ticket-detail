import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Copy, Globe2, Info, LayoutGrid, Lock, Plus, Search, Ticket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Notice, initials, primaryBtn } from './workspaceUi';
import { adminIdsOf, canAtOrg, holdersOfRole, loadStore, orgKeeperIds, placeLabel, roleMapIn, saveStore, setRoleAt, sortWorkspaces } from './workspaceData';
import type { Place, WorkspaceStore } from './workspaceData';
import { MODULE_OF, PARENT, PERM_MODULES, ROLE_TABS, flat, isSuperAdmin, loadRoles, moduleWhere, roleSummary, saveRoles, withinOwn } from './rolesData';
import type { PermNode, Role } from './rolesData';

/* Admin › Users › Roles — ESM F03f (Juli, 2026-11-04). The ServiceOps screens [VERIFIED 172.16.15.185, 2026-11-04]:
 *   #/admin/roles          list: Name · Description · Technician Count · Actions (open, clone, enable)
 *   #/admin/roles/<id>     Edit Role: Name, Description, tabs Permissions (18 modules left, checkbox tree right) · Users.
 *                          A built-in role opens READ ONLY (ServiceOps disables every box) on its first ticked tab, and
 *                          is changed by Clone.
 *   #/admin/roles/create   Create Role
 * ESM: roles stay as they are; the Admin tab gets two sub-tabs, Global (Organization settings) and Workspace (a
 * workspace's own settings), module by module; every new tick box carries a New pill. A role is given in a workspace
 * (technician form › Workspace Access, or the Users tab here). */

interface Props { path?: string; onPath: (p: string | undefined) => void; onBackToApp: () => void }

const input = 'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
const box = input.replace('w-full ', '');
const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#364658]';

export function AdminRolesModule({ path, onPath, onBackToApp }: Props) {
  const [store, setStore] = useState<WorkspaceStore>(loadStore);
  const [roles, setRoles] = useState<Role[]>(loadRoles);
  useEffect(() => { saveStore(store); }, [store]);
  useEffect(() => { saveRoles(roles); }, [roles]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'predefined' | 'custom'>('all');

  if (!canAtOrg(store.viewAs, 'Manage Roles')) {
    return <div className="px-4 py-6"><Notice icon={<Lock size={28} strokeWidth={1.6} />} title="You can’t manage roles" action={<button onClick={onBackToApp} className={primaryBtn}>Back to app</button>}>Roles are created and changed by people whose role has <b>Admin › Global › Manage Roles</b>.</Notice></div>;
  }

  if (path === 'create' || /^\d+$/.test(path ?? '') || /^clone-\d+$/.test(path ?? '')) {
    const src = roles.find((r) => r.id === Number((path ?? '').replace('clone-', '')));
    if (path !== 'create' && !src) return <div className="px-4 py-6"><Notice icon={<Lock size={28} strokeWidth={1.6} />} title="Role does not exist" action={<button onClick={() => onPath(undefined)} className={primaryBtn}>Back to Roles</button>}>This role does not exist.</Notice></div>;
    const draft: Role = path === 'create' ? { id: 0, name: '', desc: '', kind: 'custom', enabled: true, grants: [] }
      : path!.startsWith('clone-') ? { ...src!, id: 0, name: `${src!.name} (copy)`, kind: 'custom', isNew: false, locked: undefined }
      : src!;
    return (
      <RoleForm key={path} role={draft} roles={roles} store={store} setStore={setStore} onCancel={() => onPath(undefined)} onClone={(id) => onPath(`clone-${id}`)}
        onSave={(r) => {
          if (!r.id) {
            const id = Math.max(...roles.map((x) => x.id)) + 1;
            setRoles((rs) => [...rs, { ...r, id }]);
            toast.success(`${r.name} created`, { description: 'Give it in a workspace: technician form › Workspace Access, or this role’s Users tab.' });
            onPath(String(id));
            return;
          }
          const old = roles.find((x) => x.id === r.id)!;
          setRoles((rs) => rs.map((x) => (x.id === r.id ? r : x)));
          if (old.name !== r.name) {
            const ren = (xs?: string[]) => xs?.map((x) => (x === old.name ? r.name : x));
            setStore((s) => ({ ...s,
              workspaces: s.workspaces.map((w) => ({ ...w, setup: { ...w.setup, access: Object.fromEntries(Object.entries(w.setup.access).map(([k, a]) => [k, { ...a, roles: ren(a.roles) }])) } })),
            }));
          }
          toast.success(`${r.name} updated`);
          onPath(undefined);
        }} />
    );
  }

  const query = q.trim().toLowerCase();
  const rows = roles.filter((r) => (kind === 'all' || r.kind === kind) && (!query || `${r.name} ${r.desc}`.toLowerCase().includes(query)));
  return (
    <div className="min-h-full bg-white">
      <div className="px-4 pb-3 pt-5">
        <h1 className="text-[20px] font-semibold text-[#364658]">Roles</h1>
        <p className="mt-1 text-[13px] text-[#7B8FA5]">Define granular permissions for technician operations. <a href="#" onClick={(e) => e.preventDefault()} className="text-[13px] text-[#364658] underline underline-offset-2">View Docs</a></p>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <div className="relative w-[280px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search roles" className={`${input} pl-8`} />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Filter roles" className={`app-select ${box} w-[160px]`}>
          <option value="all">All Roles</option><option value="predefined">Predefined Roles</option><option value="custom">Custom Roles</option>
        </select>
        <button onClick={() => onPath('create')} className={`${primaryBtn} ml-auto`}><Plus size={15} /> Create Role</button>
      </div>
      <table className="w-full table-fixed">
        <colgroup><col className="w-[28%]" /><col /><col className="w-[140px]" /><col className="w-[120px]" /></colgroup>
        <thead className="border-b border-[#e5e7eb]">
          <tr>{['Name', 'Description', 'Technician Count', 'Actions'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {rows.map((r) => {
            const n = new Set(holdersOfRole(store, r.name).map((a) => a.techId)).size;
            return (
              <tr key={r.id} className="cursor-pointer hover:bg-[#f9fafb]" onClick={() => onPath(String(r.id))}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-[#1F2D3D]">
                    {r.name}{r.locked && <Lock size={12} className="text-[#94A3B8]" aria-label="Built-in" />}{r.isNew && <span className="rounded bg-[#EDE9FE] px-1.5 text-[10px] font-semibold text-[#6D28D9]">New</span>}
                  </span>
                </td>
                <td className="truncate px-4 py-3 text-[13px] text-[#64748B]" title={r.desc}>{r.desc}</td>
                <td className="px-4 py-3 text-[13px] text-[#364658]">{n || 'No Technician Assigned'}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-0.5">
                    <button onClick={() => onPath(String(r.id))} aria-label={`Open ${r.name}`} title={r.locked ? 'View' : 'Edit'} className={iconBtn}><ChevronRight size={15} /></button>
                    <button onClick={() => onPath(`clone-${r.id}`)} aria-label={`Clone ${r.name}`} title="Clone" className={iconBtn}><Copy size={14} /></button>
                    <button role="switch" aria-checked={r.enabled} aria-label={`${r.enabled ? 'Disable' : 'Enable'} ${r.name}`} disabled={!!r.locked}
                      onClick={() => {
                        if (r.enabled) {
                          // Disabling must not leave a workspace, or the organization, with nobody who can give roles.
                          const before = roles; const off = roles.map((x) => (x.id === r.id ? { ...x, enabled: false } : x));
                          saveRoles(off);
                          const orphan = store.workspaces.find((w) => adminIdsOf(w).length === 0 && w.setup.memberIds.length > 0);
                          const noOrg = orgKeeperIds(store.workspaces, store.technicians).length === 0;
                          saveRoles(before);
                          if (orphan || noOrg) { toast.error(`Can’t disable ${r.name}`, { description: noOrg ? 'Nobody else could manage roles and users.' : `Nobody in ${orphan!.name} could give roles any more.` }); return; }
                        }
                        setRoles((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
                      }}
                      className={`relative ml-1 h-4 w-7 rounded-full transition-colors disabled:opacity-50 ${r.enabled ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'}`}>
                      <span className={`absolute top-0.5 size-3 rounded-full bg-white transition-all ${r.enabled ? 'left-3.5' : 'left-0.5'}`} />
                    </button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-3 text-right text-[12px] text-[#7B8FA5]">Showing 1-{rows.length} of {rows.length} items</div>
    </div>
  );
}

function RoleForm({ role, roles, store, setStore, onCancel, onSave, onClone }: {
  role: Role; roles: Role[]; store: WorkspaceStore; setStore: (f: (s: WorkspaceStore) => WorkspaceStore) => void; onCancel: () => void; onSave: (r: Role) => void; onClone: (id: number) => void;
}) {
  const [name, setName] = useState(role.name);
  const [desc, setDesc] = useState(role.desc);
  const [grants, setGrants] = useState<Set<string>>(() => new Set(role.grants));
  const [tab, setTab] = useState<'perm' | 'users'>('perm');
  // Open on the first tab that has ticks, so a role never looks empty (Juli, 2026-11-04).
  const tabOf = (id: string) => (MODULE_OF.get(id) === 'wsadmin' ? 'admin' : MODULE_OF.get(id));
  const [mod, setMod] = useState(() => ROLE_TABS.find((m) => role.grants.some((id) => tabOf(id) === m.key))?.key ?? 'request');
  // Admin sub-tab: Global or Workspace; opens where the role has ticks.
  const [adminTab, setAdminTab] = useState<'admin' | 'wsadmin'>(() => (role.grants.some((id) => MODULE_OF.get(id) === 'admin') || !role.grants.some((id) => MODULE_OF.get(id) === 'wsadmin') ? 'admin' : 'wsadmin'));
  const [err, setErr] = useState('');
  const isNew = !role.id;
  /* No escalation in the role editor (F03f QA E1, as Freshservice: "no agent can edit their own role"):
   * · a role you hold opens read only; · you can only tick boxes you have yourself (Super Admin exempt). */
  const myMap = roleMapIn(store.workspaces, store.viewAs);
  const superMe = isSuperAdmin(myMap);
  const myIds = useMemo(() => new Set(loadRoles().filter((r) => r.enabled && Object.values(myMap).flat().includes(r.name)).flatMap((r) => r.grants)), [store]);
  const mine = (id: string) => superMe || myIds.has(id);
  const heldByMe = !isNew && !superMe && Object.values(myMap).flat().includes(role.name);
  const builtIn = !!role.locked;
  const locked = builtIn || heldByMe;
  const original = useMemo(() => new Set(isNew ? [] : role.grants), [role, isNew]);
  const notMine = [...grants].filter((id) => !mine(id) && !original.has(id));
  const live: Role = { ...role, name: name.trim(), desc, grants: [...grants] };
  const sum = roleSummary(live);

  const toggle = (x: PermNode) => {
    if (locked) return;
    setGrants((g) => {
      const next = new Set(g);
      const all = [x, ...flat(x.children ?? [])].map((y) => y.id);
      // A parent counts as "on" only when all of its children are (it shows a half tick otherwise).
      if (all.every((id) => next.has(id) || !mine(id))) all.forEach((id) => next.delete(id));
      else { all.filter(mine).forEach((id) => next.add(id)); if (mine(x.id)) { let p = PARENT.get(x.id); while (p) { next.add(p); p = PARENT.get(p); } } }
      return next;
    });
  };
  const m = PERM_MODULES.find((x) => x.key === (mod === 'admin' ? adminTab : mod))!;
  const idsOfTab = flat(m.tree).map((x) => x.id);
  const allOn = idsOfTab.every((id) => grants.has(id));
  const setTabAll = (on: boolean) => setGrants((g) => { const n = new Set(g); idsOfTab.forEach((id) => (on ? mine(id) && n.add(id) : n.delete(id))); return n; });
  const countIn = (key: string) => [...grants].filter((id) => MODULE_OF.get(id) === key).length;
  const countTab = (key: string) => (key === 'admin' ? countIn('admin') + countIn('wsadmin') : countIn(key));
  const totalTab = (key: string) => flat(PERM_MODULES.find((x) => x.key === key)!.tree).length + (key === 'admin' ? flat(PERM_MODULES.find((x) => x.key === 'wsadmin')!.tree).length : 0);
  const submit = () => {
    const nm = name.trim();
    if (!nm) { setErr('Name is required.'); return; }
    if (roles.some((r) => r.id !== role.id && r.name.toLowerCase() === nm.toLowerCase())) { setErr('A role with this name already exists.'); return; }
    if (!grants.size) { setErr('Tick at least one permission.'); return; }
    if (notMine.length) { setErr(`${notMine.length} ticked permission${notMine.length > 1 ? 's are' : ' is'} not yours to give. You can only give permissions you have yourself.`); return; }
    onSave(live);
  };
  const holders = isNew ? [] : holdersOfRole(store, role.name);

  return (
    <div className="min-h-full bg-white">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#EEF1F5] bg-white px-4 py-3">
        <button onClick={onCancel} aria-label="Back to Roles" className={`${iconBtn} border border-[#DFE5ED]`}><ChevronLeft size={16} /></button>
        <h1 className="text-[18px] font-semibold text-[#364658]">{isNew ? 'Create Role' : locked ? role.name : 'Edit Role'}</h1>
        {builtIn && <span className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]"><Lock size={11} /> Built-in · read only</span>}
        {!builtIn && heldByMe && <span className="inline-flex items-center gap-1 rounded bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#92400E]"><Lock size={11} /> You hold this role · someone else must change it</span>}
        <span className="ml-auto flex gap-2">
          <button onClick={onCancel} className="h-9 rounded border border-[#DFE5ED] px-3.5 text-[13px] text-[#364658] hover:bg-[#F5F7FA]">{locked ? 'Back' : 'Cancel'}</button>
          {locked
            ? <button onClick={() => onClone(role.id)} className={primaryBtn}><Copy size={14} /> {builtIn ? 'Clone to customise' : 'Clone'}</button>
            : <button onClick={submit} className={primaryBtn}>{isNew ? 'Create Role' : 'Update Role'}</button>}
        </span>
      </div>

      <div className="grid gap-4 px-4 pt-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-[#64748B]">Name <span className="text-[#DC2626]">*</span></span>
          <input value={name} disabled={locked} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="Name" className={`${input} disabled:bg-[#F8FAFC]`} />
          {err && <span className="mt-1 block text-[12px] text-[#DC2626]">{err}{notMine.length > 0 && <button type="button" onClick={() => { setGrants((g) => new Set([...g].filter((id) => !notMine.includes(id)))); setErr(''); }} className="ml-2 font-medium text-[#3D8BD0] hover:underline">Untick the ones I don’t have</button>}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-[#64748B]">Description</span>
          <textarea value={desc} disabled={locked} onChange={(e) => setDesc(e.target.value)} placeholder="Description..." rows={2} className="w-full rounded border border-[#d1d5db] px-3 py-2 text-[13px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0] disabled:bg-[#F8FAFC]" />
        </label>
      </div>

      {/* What this role gives — live, in plain words */}
      <div className="mx-4 mt-4 grid gap-2 rounded-lg border border-[#DCEBFA] bg-[#F8FBFF] p-3 md:grid-cols-4">
        <div className="flex items-start gap-2"><Ticket size={15} className="mt-0.5 text-[#3D8BD0]" /><div className="min-w-0"><div className="text-[12px] font-semibold text-[#364658]">Ticket work</div><div className="text-[12px] text-[#64748B]">{sum.ticket.join(', ') || 'None'}</div></div></div>
        <div className="flex items-start gap-2"><Globe2 size={15} className="mt-0.5 text-[#3D8BD0]" /><div className="min-w-0"><div className="text-[12px] font-semibold text-[#364658]">Organization data</div><div className="text-[12px] text-[#64748B]">{sum.orgData.join(', ') || 'None'}</div></div></div>
        <div className="flex items-start gap-2"><Building2 size={15} className="mt-0.5 text-[#3D8BD0]" /><div className="min-w-0"><div className="text-[12px] font-semibold text-[#364658]">Admin › Global</div><div className="text-[12px] text-[#64748B]">{sum.global ? `${sum.global} tick box${sum.global > 1 ? 'es' : ''}` : 'None'}</div></div></div>
        <div className="flex items-start gap-2"><LayoutGrid size={15} className="mt-0.5 text-[#7C3AED]" /><div className="min-w-0"><div className="text-[12px] font-semibold text-[#364658]">Admin › Workspace</div><div className="text-[12px] text-[#64748B]">{sum.workspace ? `${sum.workspace} tick box${sum.workspace > 1 ? 'es' : ''}` : 'None'}</div></div></div>
        <p className="flex items-start gap-1.5 border-t border-[#DCEBFA] pt-2 text-[12px] leading-[1.5] text-[#475569] md:col-span-4">
          <Info size={13} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
          <span>A role is given <b>in a workspace</b> (technician form › Workspace Access). There, its ticket tabs and <b>Admin › Workspace</b> count. Its <b>Admin › Global</b> tab and Organization data tabs give access to <b>Organization settings</b>.</span>
        </p>
      </div>

      <div className="mt-4 flex gap-1 border-y border-[#EEF1F5] bg-[#F8FAFC] px-4 py-1.5">
        {(['perm', 'users'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`h-8 rounded px-3 text-[13px] font-medium ${tab === t ? 'bg-white text-[#1F2D3D] shadow-sm' : 'text-[#64748B] hover:text-[#364658]'}`}>
            {t === 'perm' ? 'Permissions' : <>Users {!isNew && <span className="ml-1 text-[#94A3B8]">{holders.length}</span>}</>}
          </button>
        ))}
      </div>

      {tab === 'perm' ? (
        <div className="flex min-h-[460px]">
          <ul className="w-[230px] flex-shrink-0 border-r border-[#EEF1F5] p-2">
            {ROLE_TABS.map((x) => {
              const c = countTab(x.key);
              const total = totalTab(x.key);
              const w = moduleWhere(x.key);
              return (
                <li key={x.key}>
                  <button onClick={() => setMod(x.key)} className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left ${mod === x.key ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] ${mod === x.key ? 'font-medium text-[#1F5F99]' : 'text-[#364658]'}`}>{x.label}</span>
                      <span className="block text-[10px] text-[#94A3B8]">{w === 'ws' ? 'Records in the workspace' : w === 'org' ? 'Organization records' : 'Global + Workspace settings'}</span>
                    </span>
                    {c > 0 && <span className={`rounded-full px-1.5 text-[10px] font-semibold ${c === total ? 'bg-[#3D8BD0] text-white' : 'bg-[#DBEAFE] text-[#1F5F99]'}`}>{c === total ? 'All' : `${c}/${total}`}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="min-w-0 flex-1 p-4">
            {mod === 'admin' && (
              <div role="tablist" aria-label="Admin settings" className="mb-3 flex gap-1 rounded-lg bg-[#F1F5F9] p-1">
                {([['admin', 'Global', 'Organization settings'], ['wsadmin', 'Workspace', 'A workspace’s own settings']] as const).map(([k, l, sub]) => (
                  <button key={k} role="tab" aria-selected={adminTab === k} onClick={() => setAdminTab(k)}
                    className={`flex flex-1 items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors ${adminTab === k ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}>
                    {k === 'admin' ? <Building2 size={15} className="text-[#3D8BD0]" /> : <LayoutGrid size={15} className="text-[#7C3AED]" />}
                    <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#1F2D3D]">{l}{k === 'wsadmin' && <span className="ml-1.5 rounded bg-[#EDE9FE] px-1.5 text-[10px] font-semibold text-[#6D28D9]">New</span>}</span><span className="block text-[11px] text-[#7B8FA5]">{sub}</span></span>
                    <span className="text-[11px] text-[#64748B]">{countIn(k)}/{flat(PERM_MODULES.find((x) => x.key === k)!.tree).length}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#1F2D3D]">{mod === 'admin' ? (adminTab === 'admin' ? 'Admin › Global' : 'Admin › Workspace') : m.label}</h2>
              {m.scope === 'it' && <span className="text-[12px] text-[#7B8FA5]">Used only in IT workspaces.</span>}
              <span className="text-[12px] text-[#94A3B8]">{countIn(m.key)} of {idsOfTab.length} ticked</span>
              {!locked && <button onClick={() => setTabAll(!allOn)} className="ml-auto text-[12px] font-medium text-[#3D8BD0] hover:underline">{allOn ? 'Clear this tab' : 'Tick all on this tab'}</button>}
            </div>
            {mod === 'admin' && adminTab === 'admin' && <p className="mb-3 text-[12px] text-[#7B8FA5]">Organization settings pages. Counts in Organization settings, whichever workspace the role is given in. <b className="font-medium text-[#475569]">Manage All Workspaces</b> makes this role’s Workspace tab count in every workspace.</p>}
            {mod === 'admin' && adminTab === 'wsadmin' && <p className="mb-3 text-[12px] text-[#7B8FA5]">A workspace’s own settings, module by module. Counts in the workspace where the role is given.</p>}
            {mod !== 'admin' && moduleWhere(m.key) === 'ws' && <p className="mb-3 text-[12px] text-[#7B8FA5]">Works on the records of the workspace where the role is given (that workspace’s Scope still decides which tickets).</p>}
            {mod !== 'admin' && moduleWhere(m.key) === 'org' && <p className="mb-3 text-[12px] text-[#7B8FA5]">Organization records, shared by all workspaces. Counts from whichever workspace the role is given in.</p>}
            <Tree key={m.key} nodes={m.tree} grants={grants} onToggle={toggle} locked={locked} depth={0} mine={mine} />
          </div>
        </div>
      ) : (
        <UsersTab role={live} isNew={isNew} store={store} setStore={setStore} />
      )}
    </div>
  );
}

function Tree({ nodes, grants, onToggle, locked, depth, mine }: { nodes: PermNode[]; grants: Set<string>; onToggle: (n: PermNode) => void; locked: boolean; depth: number; mine: (id: string) => boolean }) {
  return (
    <ul className={depth ? 'ml-5 border-l border-[#E5E7EB] pl-3' : ''}>
      {nodes.map((x) => <TreeRow key={x.id} node={x} grants={grants} onToggle={onToggle} locked={locked} depth={depth} mine={mine} />)}
    </ul>
  );
}

function TreeRow({ node: x, grants, onToggle, locked, depth, mine }: { node: PermNode; grants: Set<string>; onToggle: (n: PermNode) => void; locked: boolean; depth: number; mine: (id: string) => boolean }) {
  const [open, setOpen] = useState(true); // ServiceOps opens every branch
  const kids = x.children ?? [];
  const on = grants.has(x.id) && flat(kids).every((k) => grants.has(k.id));
  const some = !on && (grants.has(x.id) || flat(kids).some((k) => grants.has(k.id)));
  return (
    <li>
      <div className="group flex min-h-9 items-center gap-2 rounded px-1.5 py-1 hover:bg-[#F8FAFC]">
        {kids.length ? <button onClick={() => setOpen(!open)} aria-label={open ? 'Collapse' : 'Expand'} className="text-[#94A3B8] hover:text-[#364658]"><ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} /></button> : <span className="w-3.5" />}
        <button role="checkbox" aria-checked={on ? true : some ? 'mixed' : false} aria-label={x.label} disabled={locked || (!on && !some && !mine(x.id))} title={!locked && !on && !mine(x.id) ? 'You don’t have this permission yourself, so you can’t give it.' : undefined} onClick={() => onToggle(x)}
          className={`flex size-4 flex-shrink-0 items-center justify-center rounded border transition-colors disabled:cursor-default ${on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : some ? 'border-[#3D8BD0] bg-white' : 'border-[#CBD5E1] bg-white'} ${locked && !on && !some ? 'opacity-60' : ''}`}>
          {on ? <svg viewBox="0 0 12 12" className="size-3"><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="2" /></svg> : some ? <span className="h-0.5 w-2 rounded bg-[#3D8BD0]" /> : null}
        </button>
        <span onClick={() => onToggle(x)} className={`${locked ? '' : 'cursor-pointer'} text-[13px] ${on ? 'font-medium text-[#1F2D3D]' : 'text-[#475569]'}`}>{x.label}</span>
        {x.isNew && <span className="rounded bg-[#EDE9FE] px-1.5 text-[10px] font-semibold text-[#6D28D9]">New</span>}
        {x.note && <span className="hidden truncate text-[11px] text-[#94A3B8] lg:inline">{x.note}</span>}
      </div>
      {open && kids.length > 0 && <Tree nodes={kids} grants={grants} onToggle={onToggle} locked={locked} depth={depth + 1} mine={mine} />}
    </li>
  );
}

/* Users tab. ServiceOps lists the people who hold the role and adds or removes them. With ESM each row also says WHERE
 * it was given: Everywhere, Organization only, or a workspace (a workspace needs the person to be in it). */
function UsersTab({ role, isNew, store, setStore }: { role: Role; isNew: boolean; store: WorkspaceStore; setStore: (f: (s: WorkspaceStore) => WorkspaceStore) => void }) {
  const [tech, setTech] = useState('');
  const [place, setPlace] = useState<string>('');
  const [q, setQ] = useState('');
  const rows = useMemo(() => holdersOfRole(store, role.name), [store, role.name]);
  if (isNew) return <p className="px-4 py-10 text-center text-[13px] text-[#94A3B8]">Create the role first, then give it to technicians.</p>;

  const techWs = tech ? sortWorkspaces(store.workspaces).filter((w) => w.setup.memberIds.includes(Number(tech))) : [];
  const toPlace = (v: string): Place => Number(v);
  const already = (id: number, p: Place) => rows.some((a) => a.techId === id && a.place === p);
  const me = roleMapIn(store.workspaces, store.viewAs);
  const canPeople = canAtOrg(store.viewAs, 'Update User');
  const add = () => {
    const id = Number(tech);
    if (!id || !place) return;
    const p = toPlace(place);
    if (!isSuperAdmin(me) && !withinOwn(role, me, p)) { toast.error('You can’t give this role there', { description: 'It has permissions you don’t have yourself in that workspace (or in Organization settings).' }); return; }
    if (already(id, p)) { toast.error('Already given there'); return; }
    const t = store.technicians.find((x) => x.id === id)!;
    setStore((s) => setRoleAt(s, id, role.name, p, true));
    toast.success(`${t.name} now has ${role.name}`, { description: `Where: ${placeLabel(store, p)}.` });
    setTech(''); setPlace('');
  };
  const remove = (id: number, p: Place) => {
    if (!isSuperAdmin(me) && !withinOwn(role, me, p)) { toast.error('You can’t remove this role there', { description: 'It has permissions you don’t have yourself.' }); return; }
    const t = store.technicians.find((x) => x.id === id)!;
    const w = store.workspaces.find((x) => x.id === p)!;
    const next = setRoleAt(store, id, role.name, p, false);
    const after = next.workspaces.find((x) => x.id === p)!;
    if (adminIdsOf(w).includes(id) && adminIdsOf(after).length === 0) { toast.error(`${t.name} is the only one who can give roles in ${w.name}`, { description: 'Give a role with Assign Roles in Workspace there to someone else first.' }); return; }
    if (orgKeeperIds(store.workspaces, store.technicians).includes(id) && orgKeeperIds(next.workspaces, next.technicians).length === 0) { toast.error(`${t.name} is the only one who can manage roles and users`, { description: 'Give Manage Roles + Update User to someone else first.' }); return; }
    setStore(() => next);
    toast.success(`${role.name} removed from ${t.name}`, { description: `In ${w.name}.` });
  };
  const query = q.trim().toLowerCase();
  const shown = rows.filter((a) => { const t = store.technicians.find((x) => x.id === a.techId); return !query || `${t?.name} ${t?.email} ${placeLabel(store, a.place)}`.toLowerCase().includes(query); });

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-medium text-[#364658]">Give this role to</span>
        <select value={tech} onChange={(e) => { setTech(e.target.value); setPlace(''); }} aria-label="Technician" className={`app-select ${box} w-[210px]`}>
          <option value="">Select technician</option>
          {store.technicians.filter((t) => !t.disabled).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={place} onChange={(e) => setPlace(e.target.value)} disabled={!tech} aria-label="Workspace" className={`app-select ${box} w-[200px] disabled:bg-[#F8FAFC]`}>
          <option value="">in workspace…</option>
          {techWs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button onClick={add} disabled={!tech || !place || !canPeople} title={canPeople ? undefined : 'Needs Admin › Global › Update User'} className={primaryBtn}><Plus size={15} /> Add</button>
        <div className="relative ml-auto w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search users" className={`${input} pl-8`} />
        </div>
      </div>
      <p className="mb-2 text-[12px] text-[#7B8FA5]">A role is given in a workspace the technician works in. Its Admin › Global part then also gives them Organization settings.</p>
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb]">
          <tr>{['Name', 'Email', 'Workspace', 'Department', 'Action'].map((h) => <th key={h} className="px-3 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {shown.map((a) => {
            const t = store.technicians.find((x) => x.id === a.techId)!;
            return (
              <tr key={`${a.techId}-${a.place}`} className="hover:bg-[#f9fafb]">
                <td className="px-3 py-2.5"><span className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded bg-[#3D8BD0] text-[10px] font-semibold text-white">{initials(t.name)}</span><span className="text-[13px] text-[#1F2D3D]">{t.name}</span></span></td>
                <td className="px-3 py-2.5 text-[13px] text-[#364658]">{t.email}</td>
                <td className="px-3 py-2.5"><PlaceChip label={placeLabel(store, a.place)} place={a.place} /></td>
                <td className="px-3 py-2.5 text-[13px] text-[#364658]">{t.department ?? '---'}</td>
                <td className="px-3 py-2.5"><button disabled={!canPeople} onClick={() => remove(a.techId, a.place)} aria-label={`Remove ${role.name} from ${t.name} (${placeLabel(store, a.place)})`} className={`${iconBtn} text-[#DC2626] hover:text-[#B91C1C]`}><Trash2 size={15} /></button></td>
              </tr>
            );
          })}
          {shown.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-[13px] text-[#94A3B8]">No technician has this role yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function PlaceChip({ label }: { label: string; place?: Place }) {
  return <span className="inline-flex items-center gap-1 rounded bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-medium text-[#1F5F99]">{label}</span>;
}
