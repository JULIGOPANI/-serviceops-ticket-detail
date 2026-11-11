import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminIcon } from './AdminIcons';
import { workspaceAdminFor } from './workspaceAdmin';
import type { WorkspaceAdminAction } from './workspaceAdmin';
import { DefaultTag, StatusPill, WorkspaceIcon } from './workspaceUi';
import { TYPE_LABEL } from './workspaceData';
import type { Workspace } from './workspaceData';
import { WorkspaceSetupPanel } from './AdminWorkspaceSetupGuide';
import type { GuideStep } from './workspaceData';

/* A workspace's OWN configuration home — `<id>/settings`. ESM F01.
 *
 * The same page as ServiceOps' Admin Overview (collapsible sections of module cards, same titles and
 * descriptions), showing only the modules that belong to this workspace (workspaceAdmin.ts). A plain
 * header says which workspace you are in, as Freshservice's workspace admin does. */

interface AdminWorkspaceHomeProps {
  workspace: Workspace;
  onAction: (action: WorkspaceAdminAction) => void;
  canGoLive: boolean;
  onEmail: (email: string) => void;
  onComplete: (step: 'catalog' | 'knowledge', items: string[]) => void;
  onMark: (step: GuideStep, state: 'skipped' | 'todo') => void;
  onGoLive: () => void;
}

export function AdminWorkspaceHome({ workspace: w, onAction, canGoLive, onEmail, onComplete, onMark, onGoLive }: AdminWorkspaceHomeProps) {
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();
  const all = workspaceAdminFor(w);
  const total = all.reduce((n, s) => n + s.cards.length, 0);

  const sections = all
    .map((s) => ({ ...s, visible: !q || s.title.toLowerCase().includes(q) ? s.cards : s.cards.filter((c) => `${c.title} ${c.desc}`.toLowerCase().includes(q)) }))
    .filter((s) => s.visible.length > 0);
  const toggle = (k: string) => setClosed((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div className="min-h-full bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <WorkspaceIcon type={w.type} colour={w.colour} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-semibold text-[#364658]">{w.name} Settings</h1>
                {w.isDefault && <DefaultTag />}
                <StatusPill status={w.status} />
                {w.status === 'setup' && <WorkspaceSetupPanel workspace={w} canGoLive={canGoLive} onEmail={onEmail} onComplete={onComplete} onMark={onMark} onGoLive={onGoLive} />}
              </div>
              <p className="mt-1 text-[13px] text-[#7B8FA5]">Settings that apply only to the {TYPE_LABEL[w.type]} workspace {w.name}. Everything else is in the organization’s admin.</p>
            </div>
          </div>
          <div className="relative w-[320px] max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${total} settings...`}
              className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
            {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>}
          </div>
        </div>


        <div className="mt-5 space-y-3">
          {sections.map((s) => {
            const SectionIcon = adminIcon(s.icon);
            const open = q ? true : !closed.has(s.key);
            return (
              <div key={s.key} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                <button onClick={() => toggle(s.key)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F9FAFB]">
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#364658]"><SectionIcon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-[#364658]">{s.title}</span>
                      <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">{s.visible.length}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#7B8FA5]">{s.desc}</span>
                  </span>
                  <ChevronDown size={18} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="border-t border-[#F0F2F5] p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {s.visible.map((c) => {
                        const CardIcon = adminIcon(c.icon);
                        return (
                          <button key={c.title} onClick={() => (c.action ? onAction(c.action) : toast(`${c.title} for ${w.name}`, { description: 'The same ServiceOps screen, showing only this workspace’s records.' }))}
                            className="group flex flex-col items-start rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)]">
                            <span className="flex w-full items-center gap-2.5">
                              <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5] transition-colors group-hover:bg-[#EBF5FF] group-hover:text-[#3D8BD0]"><CardIcon size={16} /></span>
                              <span className="truncate text-[14px] font-medium text-[#364658]">{c.title}</span>
                              <ChevronRight size={14} className="ml-auto text-[#CBD5E1] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3D8BD0]" />
                            </span>
                            <span className="mt-2 block text-[12px] leading-[1.5] text-[#7B8FA5]">{c.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {sections.length === 0 && <p className="py-12 text-center text-[13px] text-[#7B8FA5]">No {w.name} settings match “{query}”.</p>}
        </div>
      </div>
    </div>
  );
}
