import { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { SideDrawer, initials, primaryBtn, secondaryBtn } from './workspaceUi';
import { AccessEditor } from './WorkspaceAccessSection';
import { TECHNICIANS, accessOf, canGiveRole, membershipsOf, technicianById } from './workspaceData';
import type { MemberAccess, ViewAs, Workspace } from './workspaceData';
import { accessSentence } from './AccessCells';

/* Add technicians to a workspace — from its Team tab. ESM F02/F03.
 * Freshservice's flow is the concept (people → groups → roles, one short panel, F01c §8.2); the UI is ServiceOps'
 * and as light as possible (Juli, 2026-10-30: "too much clicking, cluttered"):
 *   · type a name or email → matches drop down → click (or Enter) adds the person as a chip;
 *   · below, the SAME Technician Groups · Scope · Workspace roles editor as the technician form, pre-filled (workspace
 *     roles only by people with Assign Roles in Workspace, F03e). Their Organization roles don’t change here;
 *   · one summary line and Add. Nothing hidden behind popovers. */

interface Props {
  workspace: Workspace;
  workspaces: Workspace[];
  viewAs: ViewAs;
  onClose: () => void;
  onAdd: (ids: number[], access: MemberAccess) => void;
}

export function AddTechniciansDrawer({ workspace: w, workspaces, viewAs, onClose, onAdd }: Props) {
  const [q, setQ] = useState('');
  const [ids, setIds] = useState<number[]>([]);
  const [access, setAccess] = useState<MemberAccess>(() => accessOf(w, -1));
  const query = q.trim().toLowerCase();
  const matches = query ? TECHNICIANS.filter((t) => !w.setup.memberIds.includes(t.id) && !ids.includes(t.id) && `${t.name} ${t.email}`.toLowerCase().includes(query)).slice(0, 6) : [];
  const pick = (id: number) => { setIds((p) => [...p, id]); setQ(''); };

  return (
    <SideDrawer width={620} icon={<UserPlus size={19} />} title={`Add technicians to ${w.name}`} sub="Existing technician accounts. Their other workspaces don’t change." onClose={onClose}
      footer={
        <>
          <span className="mr-auto truncate text-[12px] text-[#64748B]">{ids.length ? `${ids.length} × ${accessSentence(access)}` : 'Type a name to add someone'}</span>
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button disabled={!ids.length} onClick={() => onAdd(ids, access)} className={primaryBtn}>Add {ids.length > 1 ? `${ids.length} technicians` : 'technician'}</button>
        </>
      }>
      <div className="space-y-6 px-6 py-5">
        <section>
          <div className="mb-2 text-[13px] font-semibold text-[#364658]">Technicians</div>
          <div className="relative">
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-2 py-1.5 focus-within:border-[#3D8BD0] focus-within:ring-1 focus-within:ring-[#3D8BD0]">
              <Search size={14} className="text-[#9ca3af]" />
              {ids.map((id) => {
                const t = technicianById(id)!;
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5FF] py-0.5 pl-0.5 pr-1.5 text-[12px] font-medium text-[#1F5F99] animate-in zoom-in-95 duration-150">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#3D8BD0] text-[9px] font-semibold text-white">{initials(t.name)}</span>{t.name}
                    <button onClick={() => setIds((p) => p.filter((x) => x !== id))} aria-label={`Remove ${t.name}`} className="text-[#6B9AC4] hover:text-[#1F5F99]"><X size={12} /></button>
                  </span>
                );
              })}
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search technicians"
                onKeyDown={(e) => { if (e.key === 'Enter' && matches[0] && !matches[0].disabled) { e.preventDefault(); pick(matches[0].id); } if (e.key === 'Backspace' && !q && ids.length) setIds((p) => p.slice(0, -1)); }}
                placeholder={ids.length ? 'Add more…' : 'Type a name or email'} className="min-w-[160px] flex-1 border-0 bg-transparent py-1 text-[13px] text-[#364658] outline-none placeholder:text-[#9ca3af]" />
            </div>
            {matches.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded border border-[#E5E7EB] bg-white shadow-lg">
                {matches.map((t, i) => {
                  const elsewhere = membershipsOf(workspaces, t.id).map((m) => m.w.name);
                  return (
                    <li key={t.id}>
                      <button disabled={t.disabled} onClick={() => pick(t.id)} className={`flex w-full items-center gap-2.5 px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${i === 0 ? 'bg-[#F5FAFF]' : 'hover:bg-[#F9FAFB]'}`}>
                        <span className="flex size-7 items-center justify-center rounded-full bg-[#E0ECF8] text-[10px] font-semibold text-[#36577A]">{initials(t.name)}</span>
                        <span className="min-w-0 flex-1"><span className="block text-[13px] text-[#1F2D3D]">{t.name}</span><span className="block text-[11px] text-[#7B8FA5]">{t.email}</span></span>
                        <span className="text-right text-[11px] text-[#94A3B8]">{t.disabled ? 'Account disabled' : <>{elsewhere.length ? <>In {elsewhere.join(', ')}</> : 'In no workspace yet'}</>}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {query && matches.length === 0 && <p className="mt-1.5 text-[12px] text-[#94A3B8]">No technician matches, or they already work in {w.name}.</p>}
        </section>

        <section className={ids.length ? '' : 'pointer-events-none opacity-50'}>
          <div className="mb-3 text-[13px] font-semibold text-[#364658]">Their access in {w.name}</div>
          <AccessEditor w={w} a={access} onChange={setAccess} canGive={(r) => canGiveRole(viewAs, w, r)} />
          <p className="mt-3 text-[12px] text-[#94A3B8]">Their roles stay as they are: roles belong to the person and count in every workspace they work in.</p>
        </section>
      </div>
    </SideDrawer>
  );
}
