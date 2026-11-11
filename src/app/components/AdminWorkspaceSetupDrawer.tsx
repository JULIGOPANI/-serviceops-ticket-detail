import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Globe, LayoutList, Mail, Plus, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { KIND_TEMPLATE, TYPE_LABEL } from './workspaceData';
import type { Workspace, WorkspaceSetup, SetupStep } from './workspaceData';

/* Three drawers a workspace's settings and setup guide open: Technician Groups, Request Categories and
 * Emails (support email & portal). Saving writes real workspace data.
 * Members are NOT managed here: they are added with roles, groups and scope on the Team tab. */

const META: Record<SetupStep, { icon: LucideIcon; title: string; sub: (d: Workspace) => string }> = {
  groups: { icon: Users, title: 'Technician Groups', sub: (d) => `The groups ${d.name}'s requests are assigned to.` },
  requests: { icon: LayoutList, title: 'Request Categories', sub: (d) => `What employees can ask ${d.name}. Suggested for ${d.type === 'hr' ? 'an HR' : `a ${TYPE_LABEL[d.type]}`} workspace.` },
  reach: { icon: Mail, title: 'Emails', sub: (d) => `How employees reach ${d.name}.` },
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

interface AdminWorkspaceSetupDrawerProps {
  workspace: Workspace;
  step: SetupStep;
  onClose: () => void;
  onSave: (setup: WorkspaceSetup) => void;
}

export function AdminWorkspaceSetupDrawer({ workspace, step, onClose, onSave }: AdminWorkspaceSetupDrawerProps) {
  const [d, setD] = useState<WorkspaceSetup>(() => ({
    ...workspace.setup, memberIds: [...workspace.setup.memberIds], groups: [...workspace.setup.groups], requestTypes: workspace.setup.requestTypes.map((r) => ({ ...r })),
  }));
  const [newGroup, setNewGroup] = useState('');
  const [newType, setNewType] = useState('');
  const patch = (p: Partial<WorkspaceSetup>) => setD((x) => ({ ...x, ...p }));
  const meta = META[step];
  const Icon = meta.icon;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
  const suggestedGroups = KIND_TEMPLATE[workspace.type].groups.filter((g) => !d.groups.includes(g));

  const save = () => onSave(d);

  return (
    <div className="fixed inset-0 z-[9995] flex justify-end bg-[#0F172A]/30 animate-in fade-in duration-150" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={meta.title} className="flex h-full w-[540px] max-w-[95vw] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        <header className="flex items-start gap-3 border-b border-[#EEF1F5] px-6 py-4">
          <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Icon size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold text-[#1F2D3D]">{meta.title}</h2>
            <p className="mt-0.5 text-[13px] text-[#64748B]">{meta.sub(workspace)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F3F4F6]"><X size={18} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 'groups' && (
            <>
              <div>
                {label('Technician groups')}
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
                <p className="mt-2 text-[12px] text-[#94A3B8]">Who is in which group is set per member on the Team tab. Removing a group takes it off its members here.</p>
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
                  <p className="mt-0.5 text-[13px] text-[#64748B]">Employees see {workspace.name} and its request types when they look for help. Only after it goes Live.</p>
                </div>
                <Toggle on={d.portal} label="Show on the Support Portal" onChange={(v) => patch({ portal: v })} />
              </div>
              <div className={`rounded-xl border px-4 py-4 transition-colors ${d.email.trim() ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#E5E7EB]'}`}>
                <div className="flex items-start gap-3">
                  <Mail size={20} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-[#1F2D3D]">Support email</div>
                    <p className="mt-0.5 text-[13px] text-[#64748B]">Emails to this address become {workspace.name} requests.</p>
                    <input value={d.email} onChange={(e) => patch({ email: e.target.value })} placeholder={`e.g. ${workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@company.com`} className={`${input} mt-3`} />
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
