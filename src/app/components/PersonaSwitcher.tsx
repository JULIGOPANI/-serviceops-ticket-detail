import { useState } from 'react';
import { Check, ChevronDown, FlaskConical, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { PRESETS, loadStore, personaInfo } from './workspaceData';
import type { ViewAs } from './workspaceData';

/* "View as" — a PROTOTYPE control (not a ServiceOps feature), at the top of the admin sidebar, so every admin screen can
 * be seen as ANY technician (Juli, 2026-11-04: test every role case). A few named presets first, then everyone. What
 * they see is worked out from their roles and where each was given (rolesData.canAdmin). Dashed and labelled so it
 * never reads as product UI. */

export function PersonaSwitcher({ onChange }: { onChange: (v: ViewAs) => void }) {
  const store = loadStore();
  const current = store.viewAs;
  const me = personaInfo(current);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const pick = (v: ViewAs) => { setOpen(false); setQ(''); onChange(v); };
  const row = (id: number, title: string, sub: string) => (
    <button key={id} type="button" onClick={() => pick(id)} className={`flex w-full items-start gap-2.5 rounded px-2.5 py-1.5 text-left hover:bg-[#F5F7FA] ${id === current ? 'bg-[#F5FAFF]' : ''}`}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[#364658]">{title}</span>
        <span className="block truncate text-[11px] leading-[1.45] text-[#7B8FA5]">{sub}</span>
      </span>
      {id === current && <Check size={15} className="mt-0.5 text-[#3D8BD0]" />}
    </button>
  );
  const rolesLine = (id: number) => {
    const ws = store.workspaces.filter((w) => (w.setup.access[id]?.roles ?? []).length && w.setup.memberIds.includes(id)).map((w) => `${w.name}: ${w.setup.access[id].roles!.join(', ')}`);
    return ws.join(' · ') || 'No role';
  };
  const people = store.technicians.filter((t) => !t.disabled && (!query || `${t.name} ${rolesLine(t.id)}`.toLowerCase().includes(query)));
  return (
    <div className="px-4 pt-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[#94A3B8] bg-white px-2.5 py-1.5 text-left transition-colors hover:border-[#64748B]">
            <FlaskConical size={14} className="flex-shrink-0 text-[#64748B]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">View as · prototype only</span>
              <span className="block truncate text-[12px] font-medium text-[#364658]">{me.name} · {me.label}</span>
            </span>
            <ChevronDown size={14} className="flex-shrink-0 text-[#94A3B8]" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[360px] bg-white p-0">
          <div className="border-b border-[#EEF1F5] px-4 py-3">
            <div className="text-[13px] font-semibold text-[#364658]">View as</div>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">See the admin exactly as this person would, from their roles and where each role was given. Prototype only.</p>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-1.5">
            <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Presets</div>
            {PRESETS.map((p) => row(p.id, `${personaInfo(p.id).name} · ${p.label}`, rolesLine(p.id)))}
            <div className="mt-2 px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Everyone</div>
            <div className="relative mx-1 mb-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search technicians" aria-label="Search technicians" className="h-8 w-full rounded border border-[#d1d5db] pl-7 pr-2 text-[12px] focus:border-[#3D8BD0] focus:outline-none" />
            </div>
            {people.map((t) => row(t.id, t.name, rolesLine(t.id)))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
