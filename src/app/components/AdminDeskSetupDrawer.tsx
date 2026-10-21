import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Globe, LayoutList, Mail, Plus, Search, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { initials } from './deskUi';
import { KIND_TEMPLATE, TECHNICIANS, TYPE_LABEL } from './deskData';
import type { Desk, DeskSetup, SetupStep } from './deskData';

/* The three "Get started" essentials, each done in a right drawer over the desk page — the way
 * Freshservice adds workspace managers/agents (a right drawer: search existing users → groups →
 * roles from licence; seen live 2026-10-16). Saving writes real desk data; the Get started row then
 * ticks itself from that data (deskData `stepDone`).
 * ⚠️ Team: technicians are PICKED from the existing list (Admin › Users). Nobody is created here. */

const META: Record<SetupStep, { icon: LucideIcon; title: string; sub: (d: Desk) => string }> = {
  team: { icon: Users, title: 'Team & groups', sub: (d) => `Who works in ${d.name}, and the groups requests are assigned to.` },
  requests: { icon: LayoutList, title: 'Request types', sub: (d) => `What employees can ask ${d.name}. Suggested for ${d.type === 'hr' ? 'an HR' : `a ${TYPE_LABEL[d.type]}`} desk.` },
  reach: { icon: Mail, title: 'Email & portal', sub: (d) => `How employees reach ${d.name}.` },
};

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${on ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

const label = (t: string, extra?: ReactNode) => (
  <div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{t}</span>{extra}</div>
);
const input = 'h-9 w-full rounded-lg border border-[#DFE5ED] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

interface AdminDeskSetupDrawerProps {
  desk: Desk;
  step: SetupStep;
  onClose: () => void;
  onSave: (setup: DeskSetup) => void;
}

export function AdminDeskSetupDrawer({ desk, step, onClose, onSave }: AdminDeskSetupDrawerProps) {
  const [d, setD] = useState<DeskSetup>(() => ({
    ...desk.setup, memberIds: [...desk.setup.memberIds], groups: [...desk.setup.groups], requestTypes: desk.setup.requestTypes.map((r) => ({ ...r })),
  }));
  const [q, setQ] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newType, setNewType] = useState('');
  const patch = (p: Partial<DeskSetup>) => setD((x) => ({ ...x, ...p }));
  const meta = META[step];
  const Icon = meta.icon;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const people = TECHNICIANS.filter((t) => !q.trim() || `${t.name} ${t.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  const addGroup = (g: string) => {
    const name = g.trim();
    if (!name || d.groups.some((x) => x.toLowerCase() === name.toLowerCase())) return;
    patch({ groups: [...d.groups, name] });
    setNewGroup('');
  };
  const addType = () => {
    const name = newType.trim();
    if (!name || d.requestTypes.some((r) => r.name.toLowerCase() === name.toLowerCase())) return;
    patch({ requestTypes: [...d.requestTypes, { name, on: true }] });
    setNewType('');
  };
  const suggestedGroups = KIND_TEMPLATE[desk.type].groups.filter((g) => !d.groups.includes(g));

  const save = () => onSave(step === 'requests' ? { ...d, requestsReviewed: true } : d);

  return (
    <div className="fixed inset-0 z-[9995] flex justify-end bg-[#0F172A]/30 animate-in fade-in duration-150" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={meta.title} className="flex h-full w-[540px] max-w-[95vw] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        <header className="flex items-start gap-3 border-b border-[#EEF1F5] px-6 py-4">
          <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Icon size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold text-[#1F2D3D]">{meta.title}</h2>
            <p className="mt-0.5 text-[13px] text-[#64748B]">{meta.sub(desk)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F3F4F6]"><X size={18} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 'team' && (
            <>
              {label('Technicians', <span className="text-[12px] text-[#7B8FA5]">{d.memberIds.length} selected</span>)}
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search existing technicians" className={`${input} pl-8`} />
              </div>
              <ul className="space-y-1">
                {people.map((t) => {
                  const on = d.memberIds.includes(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => patch({ memberIds: on ? d.memberIds.filter((m) => m !== t.id) : [...d.memberIds, t.id] })}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${on ? 'bg-[#F5FAFF]' : 'hover:bg-[#F8FAFC]'}`}
                      >
                        <span className={`flex size-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${on ? 'bg-[#3D8BD0] text-white' : 'bg-[#E0ECF8] text-[#36577A]'}`}>
                          {on ? <Check size={15} strokeWidth={3} /> : initials(t.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-[#364658]">{t.name}</span>
                          <span className="block truncate text-[12px] text-[#7B8FA5]">{t.email}</span>
                        </span>
                        {desk.ownerIds.includes(t.id) && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-px text-[10px] font-semibold uppercase text-[#64748B]">Owner</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[12px] text-[#94A3B8]">Technicians come from Admin › Users. Nobody is created here.</p>

              <div className="mt-6">
                {label('Groups')}
                <div className="flex flex-wrap gap-2">
                  {d.groups.map((g) => (
                    <span key={g} className="inline-flex items-center gap-1.5 rounded-full border border-[#DCEBFA] bg-[#F5FAFF] py-1 pl-3 pr-1.5 text-[13px] text-[#364658]">
                      {g}
                      <button onClick={() => patch({ groups: d.groups.filter((x) => x !== g) })} aria-label={`Remove ${g}`} className="flex size-5 items-center justify-center rounded-full text-[#64748B] hover:bg-white"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                {suggestedGroups.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] text-[#7B8FA5]">Suggested:</span>
                    {suggestedGroups.map((g) => (
                      <button key={g} onClick={() => addGroup(g)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#CBD5E1] px-2.5 py-0.5 text-[12px] text-[#475569] hover:border-[#3D8BD0] hover:text-[#3D8BD0]"><Plus size={11} />{g}</button>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addGroup(newGroup); }} placeholder="Add a group" className={input} />
                  <button onClick={() => addGroup(newGroup)} disabled={!newGroup.trim()} className="inline-flex h-9 items-center rounded-lg border border-[#3D8BD0] px-3 text-[13px] font-medium text-[#3D8BD0] hover:bg-[#EBF5FF] disabled:opacity-40">Add</button>
                </div>
                <p className="mt-2 text-[12px] text-[#94A3B8]">Who belongs to which group, and roles, are refined later (F02, F03, F11).</p>
              </div>
            </>
          )}

          {step === 'requests' && (
            <>
              {label('Request types', <span className="text-[12px] text-[#7B8FA5]">{d.requestTypes.filter((r) => r.on).length} on</span>)}
              <ul className="space-y-2">
                {d.requestTypes.map((r, i) => (
                  <li key={r.name} className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${r.on ? 'border-[#DCEBFA] bg-white' : 'border-[#EEF1F5] bg-[#FAFBFC]'}`}>
                    <span className={`flex-1 text-[13px] ${r.on ? 'font-medium text-[#364658]' : 'text-[#94A3B8] line-through'}`}>{r.name}</span>
                    <Toggle on={r.on} label={r.name} onChange={(v) => patch({ requestTypes: d.requestTypes.map((x, j) => (j === i ? { ...x, on: v } : x)) })} />
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <input value={newType} onChange={(e) => setNewType(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addType(); }} placeholder="Add your own, e.g. Relocation support" className={input} />
                <button onClick={addType} disabled={!newType.trim()} className="inline-flex h-9 items-center rounded-lg border border-[#3D8BD0] px-3 text-[13px] font-medium text-[#3D8BD0] hover:bg-[#EBF5FF] disabled:opacity-40">Add</button>
              </div>
              <p className="mt-3 text-[12px] leading-[1.6] text-[#94A3B8]">Each request type becomes a category with a simple form. Fields, approvals and catalog details are refined later (F09, F10).</p>
            </>
          )}

          {step === 'reach' && (
            <div className="space-y-3">
              <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 transition-colors ${d.portal ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#E5E7EB]'}`}>
                <Globe size={20} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-[#1F2D3D]">Show on the Support Portal</div>
                  <p className="mt-0.5 text-[13px] text-[#64748B]">Employees see {desk.name} and its request types when they look for help. Only after it goes Live.</p>
                </div>
                <Toggle on={d.portal} label="Show on the Support Portal" onChange={(v) => patch({ portal: v })} />
              </div>
              <div className={`rounded-xl border px-4 py-4 transition-colors ${d.email.trim() ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#E5E7EB]'}`}>
                <div className="flex items-start gap-3">
                  <Mail size={20} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-[#1F2D3D]">Support email</div>
                    <p className="mt-0.5 text-[13px] text-[#64748B]">Emails to this address become {desk.name} requests.</p>
                    <input value={d.email} onChange={(e) => patch({ email: e.target.value })} placeholder={`e.g. ${desk.code.toLowerCase()}@company.com`} className={`${input} mt-3`} />
                    <p className="mt-2 text-[12px] text-[#94A3B8]">The mailbox is connected once in Support Channels › Email (F15).</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#EEF1F5] px-6 py-3.5">
          <button onClick={onClose} className="inline-flex h-9 items-center rounded-lg border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]">Cancel</button>
          <button onClick={save} className="inline-flex h-9 items-center rounded-lg bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">Save</button>
        </footer>
      </aside>
    </div>
  );
}
