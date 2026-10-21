import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Globe, Plus, Search, Settings2, X } from 'lucide-react';
import { DeskIcon } from './deskUi';
import { STATUS_LABEL, loadStore, sortDesks } from './deskData';
import type { Desk } from './deskData';

/* Desk switcher — top of the admin sidebar. ESM F01 (Juli, 2026-10-16).
 *
 * Modelled on what both competitors do (seen live 2026-10-16, Features/F01 §2b):
 *   Freshservice  admin ☰ → panel from the left: "Global Settings" card, then "Workspace Settings"
 *                 with search, every workspace with a Primary / In setup badge, "Create more".
 *   ManageEngine  ☰ → panel from the left: "Instances" list, ★ default, ESM Directory link.
 * Picking "All settings" goes to the company-wide admin (Overview); picking a desk opens that
 * desk's own page. How TECHNICIANS move between desks in the app is F20, not this. */

const BADGE: Record<string, string> = {
  setup: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  inactive: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
};

interface DeskSwitcherProps {
  /** The desk whose page is open, if any. */
  currentDeskId?: number;
  onAllSettings: () => void;
  /** 'create', '<id>', or undefined for the Desks list. */
  onDesk: (path: string | undefined) => void;
}

export function DeskSwitcher({ currentDeskId, onAllSettings, onDesk }: DeskSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [desks, setDesks] = useState<Desk[]>(() => loadStore().desks);

  // Re-read on open and whenever the current desk changes, so a just-created or renamed desk shows.
  useEffect(() => { setDesks(loadStore().desks); }, [open, currentDeskId]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const current = desks.find((d) => d.id === currentDeskId);
  const shown = sortDesks(desks).filter((d) => !q.trim() || `${d.name} ${d.code}`.toLowerCase().includes(q.trim().toLowerCase()));
  const pick = (fn: () => void) => { fn(); setOpen(false); setQ(''); };

  return (
    <>
      <div className="px-4 pt-3">
        <button
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-2.5 py-2 text-left transition-colors hover:border-[#CBD5E1] hover:bg-white"
        >
          {current ? (
            <span className="scale-[0.8]"><DeskIcon type={current.type} colour={current.colour} /></span>
          ) : (
            <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Globe size={16} /></span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{current ? 'Desk' : 'Settings for'}</span>
            <span className="block truncate text-[13px] font-semibold text-[#1F2D3D]">{current ? current.name : 'All desks (company-wide)'}</span>
          </span>
          <ChevronsUpDown size={15} className="flex-shrink-0 text-[#94A3B8]" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[9990]" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="absolute inset-0 bg-[#0F172A]/25 animate-in fade-in duration-150" onMouseDown={() => setOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-label="Switch desk" className="absolute inset-y-0 left-0 flex w-[330px] max-w-[90vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-[#EEF1F5] px-4 py-3">
              <span className="text-[14px] font-semibold text-[#1F2D3D]">Switch desk</span>
              <button onClick={() => setOpen(false)} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F3F4F6]"><X size={17} /></button>
            </div>

            <div className="p-3">
              <button
                onClick={() => pick(onAllSettings)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${!current ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#FAFBFC]'}`}
              >
                <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Settings2 size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[#1F2D3D]">All settings</span>
                  <span className="block text-[12px] leading-[1.4] text-[#7B8FA5]">Users and settings that apply to every desk</span>
                </span>
                {!current && <Check size={16} className="text-[#3D8BD0]" />}
              </button>
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Desks</span>
              <button onClick={() => pick(() => onDesk(undefined))} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Manage desks</button>
            </div>
            <div className="px-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search desks" className="h-9 w-full rounded-lg border border-[#DFE5ED] pl-8 pr-3 text-[13px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
              </div>
            </div>
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
              {shown.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-[#94A3B8]">No desks match “{q}”.</li>}
              {shown.map((d) => {
                const on = d.id === currentDeskId;
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => pick(() => onDesk(String(d.id)))}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${on ? 'bg-[#F5FAFF]' : 'hover:bg-[#F8FAFC]'}`}
                    >
                      <span className="scale-[0.8]"><DeskIcon type={d.type} colour={d.colour} /></span>
                      <span className={`min-w-0 flex-1 truncate text-[13px] ${on ? 'font-semibold text-[#1F2D3D]' : 'font-medium text-[#364658]'} ${d.status === 'inactive' ? 'opacity-60' : ''}`}>{d.name}</span>
                      {d.isDefault ? (
                        <span className="rounded-sm bg-[#EBF5FF] px-1.5 py-px text-[10px] font-semibold text-[#3D8BD0]">Default</span>
                      ) : d.status !== 'live' ? (
                        <span className={`rounded-sm border px-1.5 py-px text-[10px] font-semibold ${BADGE[d.status]}`}>{STATUS_LABEL[d.status]}</span>
                      ) : null}
                      {on && <Check size={15} className="text-[#3D8BD0]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-[#EEF1F5] p-3">
              <button onClick={() => pick(() => onDesk('create'))} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#CBD5E1] py-2.5 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5FAFF]"><Plus size={15} /> New desk</button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
