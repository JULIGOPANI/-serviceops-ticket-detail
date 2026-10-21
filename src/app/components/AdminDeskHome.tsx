import { useState } from 'react';
import { ChevronDown, ChevronRight, LayoutList, Mail, Rocket, Search, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminIcon } from './AdminIcons';
import { DESK_ADMIN } from './deskAdmin';
import type { DeskAdminAction, DeskAdminItem } from './deskAdmin';
import { DefaultTag, DeskIcon, StatusPill, tint } from './deskUi';
import { TYPE_LABEL, setupDoneCount, stepDone } from './deskData';
import type { Desk, SetupStep } from './deskData';
import { GetStartedRow } from './AdminDeskPage';

/* A desk's OWN admin home — what opens when you switch to a desk. ESM F01 (Juli, 2026-10-16).
 *
 * Same layout as the company-wide admin Overview, the way Freshservice's workspace settings mirror
 * its Global Settings and ManageEngine's instance Setup is a full admin of its own (both seen live,
 * Features/F01-service-desk.md §2c). Setup is NOT the page: it is a slim banner on top that expands
 * into the Get started list (Freshservice: "Set up Finance workspace · 20% · Proceed").
 * The groups come from deskAdmin.ts and are provisional until F04. */

interface AdminDeskHomeProps {
  desk: Desk;
  onAction: (action: DeskAdminAction) => void;
  onStep: (step: SetupStep) => void;
  onGoLive: () => void;
}

export function AdminDeskHome({ desk, onAction, onStep, onGoLive }: AdminDeskHomeProps) {
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [setupOpen, setSetupOpen] = useState(false);
  const done = setupDoneCount(desk);
  const q = query.trim().toLowerCase();

  const groups = DESK_ADMIN
    .map((g) => ({ ...g, visible: !q || g.title.toLowerCase().includes(q) ? g.items : g.items.filter((i) => `${i.title} ${i.desc}`.toLowerCase().includes(q)) }))
    .filter((g) => g.visible.length > 0);

  const open = (item: DeskAdminItem) => {
    if (item.action) onAction(item.action);
    else toast(`${item.title} for ${desk.name}`, { description: `Designed in ${item.feature}. Whether it is per desk is decided in F04.` });
  };
  const toggle = (k: string) => setClosed((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const team = desk.setup.memberIds.length;
  const types = desk.setup.requestTypes.filter((r) => r.on);

  return (
    <div className="min-h-full bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Head: whose settings these are */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <DeskIcon type={desk.type} colour={desk.colour} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-semibold text-[#364658]">{desk.name} settings</h1>
                {desk.isDefault && <DefaultTag />}
                <StatusPill status={desk.status} />
              </div>
              <p className="mt-1 text-[13px] text-[#7B8FA5]">Settings that apply only to the {TYPE_LABEL[desk.type]} desk. Company-wide settings are under All settings.</p>
            </div>
          </div>
          <div className="relative w-[320px] max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${desk.name} settings...`}
              className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>}
          </div>
        </div>

        {/* Setup: a slim banner that expands — not the page */}
        {done < 4 && desk.status !== 'inactive' && !q && (
          <div className="mt-5 overflow-hidden rounded-xl border border-[#DCEBFA] bg-white shadow-sm">
            <button onClick={() => setSetupOpen((o) => !o)} className="flex w-full items-center gap-4 px-4 py-3 text-left" style={{ background: `linear-gradient(90deg, ${tint(desk.colour, 0.08)} 0%, #ffffff 70%)` }}>
              <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#3D8BD0] shadow-sm"><Rocket size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-[#1F2D3D]">Set up {desk.name}</span>
                <span className="block text-[12px] text-[#64748B]">Team, request types and a way in, then Go Live.</span>
              </span>
              <span className="hidden items-center gap-2.5 sm:flex">
                <span className="text-[12px] font-medium text-[#475569]">{done} of 4</span>
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E5E7EB]"><span className="block h-full rounded-full bg-[#22C55E] transition-all" style={{ width: `${(done / 4) * 100}%` }} /></span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white">
                {setupOpen ? 'Hide' : 'Continue'} <ChevronDown size={14} className={`transition-transform ${setupOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {setupOpen && (
              <ol className="border-t border-[#EEF1F5] animate-in fade-in duration-200">
                <GetStartedRow done={stepDone.team(desk)} icon={Users} title="Team & groups"
                  summary={stepDone.team(desk) ? `${team} technician${team > 1 ? 's' : ''} · ${desk.setup.groups.join(', ') || 'no groups'}` : 'Pick the technicians who work here and name the groups'}
                  action={stepDone.team(desk) ? 'Edit' : 'Add team'} onClick={() => onStep('team')} />
                <GetStartedRow done={stepDone.requests(desk)} icon={LayoutList} title="Request types"
                  summary={stepDone.requests(desk) ? `${types.length} request types` : `${desk.setup.requestTypes.length} suggested for this kind of desk. Review them`}
                  action={stepDone.requests(desk) ? 'Edit' : 'Review'} onClick={() => onStep('requests')} />
                <GetStartedRow done={stepDone.reach(desk)} icon={Mail} title="Email & portal"
                  summary={stepDone.reach(desk) ? [desk.setup.portal && 'On the Support Portal', desk.setup.email.trim()].filter(Boolean).join(' · ') : 'Not reachable yet'}
                  action={stepDone.reach(desk) ? 'Edit' : 'Set up'} onClick={() => onStep('reach')} />
                <GetStartedRow last done={desk.status !== 'setup'} icon={Rocket} title="Go Live"
                  summary={desk.status !== 'setup' ? 'Open for requests' : `Open ${desk.name} for requests`}
                  action={desk.status !== 'setup' ? 'Live' : 'Go Live'} onClick={() => desk.status === 'setup' && onGoLive()} />
              </ol>
            )}
          </div>
        )}

        {/* The desk's settings groups — same shape as the company-wide Overview */}
        <div className="mt-5 space-y-3">
          {groups.map((g) => {
            const GroupIcon = adminIcon(g.icon);
            const isOpen = q ? true : !closed.has(g.title);
            return (
              <div key={g.title} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                <button onClick={() => toggle(g.title)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F9FAFB]">
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#364658]"><GroupIcon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[#364658]">{g.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#7B8FA5]">{g.desc}</span>
                  </span>
                  <ChevronDown size={18} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-[#F0F2F5] p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {g.visible.map((it) => (
                        <button
                          key={it.title}
                          onClick={() => open(it)}
                          className="group flex flex-col items-start rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)]"
                        >
                          <span className="flex w-full items-center gap-2">
                            <span className="truncate text-[14px] font-medium text-[#364658]">{it.title}</span>
                            {!it.action && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-px font-mono text-[10px] text-[#94A3B8]">{it.feature}</span>}
                            <ChevronRight size={14} className="ml-auto text-[#CBD5E1] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3D8BD0]" />
                          </span>
                          <span className="mt-1.5 block text-[12px] leading-[1.5] text-[#7B8FA5]">{it.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {groups.length === 0 && <p className="py-12 text-center text-[13px] text-[#7B8FA5]">No {desk.name} settings match “{query}”.</p>}
        </div>
      </div>
    </div>
  );
}
