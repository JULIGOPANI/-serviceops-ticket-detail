import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, ExternalLink, Eye, Info, Lock, MousePointerClick, Pencil, Plus, RotateCcw, Settings2, Upload, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { canAtOrg, loadStore, orgCan, sortWorkspaces } from './workspaceData';
import { EMPLOYEES, portalVerdict } from './WorkspacePrivacyRows';
import { DEFAULT_ESM, loadEsm, orderTeams, portalHost, sameConfig, saveEsm, wsPortalOf } from './esmPortalData';
import type { EsmPortalConfig, EsmStore } from './esmPortalData';
import { CARD_ICON, EsmLanding } from './EsmPortalView';
import { Toggle } from './AdminScopedSettings';
import { actionPath } from './workspaceAdmin';

/* Admin › Global › Support Channels › ESM Portal  (NEW, ESM F18 — Juli 2026-11-05; minimum configuration 2026-11-17).
 * Module page = one portal card + Customize. Customize = full screen (admin menu hidden, like the Support Portal
 * builder): live preview on the LEFT where the headings are edited in place, ONE panel on the RIGHT with only
 * Banner · Team order · Below the cards. Deliberately NOT configurable (Juli: "minimum configuration"): search text,
 * card style, descriptions, landing rule, ⭐ default team, self registration.
 * Permissions: Admin › Global › Manage Support Channels › Manage ESM Portal (customize) › Publish ESM Portal. */

const PRESETS: { name: string; from: string; to: string }[] = [
  { name: 'Midnight', from: '#0B0B0C', to: '#1F2937' },
  { name: 'Indigo', from: '#1E3A8A', to: '#7C3AED' },
  { name: 'Slate', from: '#0F172A', to: '#334155' },
  { name: 'Ocean', from: '#0D9488', to: '#0369A1' },
  { name: 'Sunset', from: '#7C2D12', to: '#DB2777' },
  { name: 'Fresh', from: '#3D8BD0', to: '#22C55E' },
];

function Block({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-b border-[#F0F2F5] px-4 py-4 last:border-0">
      <div className="mb-2.5 flex items-center justify-between"><h3 className="text-[13px] font-semibold text-[#364658]">{title}</h3>{right}</div>
      {children}
    </section>
  );
}

export function AdminEsmPortalModule({ viewAs, onOpenWorkspace, customizing: wantCustomize, onCustomize, onBuilder }: {
  viewAs: number; onOpenWorkspace: (path: string) => void;
  /** `#/admin/esm-portal/customize` — the full-screen editor. */
  customizing?: boolean; onCustomize: (open: boolean) => void;
  /** Tells the admin shell to stand its sidebar down while the editor is open (as the Support Portal builder does). */
  onBuilder?: (open: boolean) => void;
}) {
  const canCustomize = orgCan(viewAs, 'Support Channels', 'ESM Portal');
  const canPublish = canCustomize && canAtOrg(viewAs, 'Publish ESM Portal');
  const customizing = !!wantCustomize && canCustomize;
  useEffect(() => { onBuilder?.(customizing); return () => onBuilder?.(false); }, [customizing, onBuilder]);
  const [esm, setEsm] = useState<EsmStore>(loadEsm);
  const [who, setWho] = useState('Karan Mehta');
  const workspaces = sortWorkspaces(loadStore().workspaces);
  const d = esm.draft;
  const dirty = !sameConfig(esm.draft, esm.published);
  const set = (patch: Partial<EsmPortalConfig>) => setEsm((s) => { const n = { ...s, draft: { ...s.draft, ...patch } }; saveEsm(n); return n; });
  const live = workspaces.filter((w) => w.status === 'live');
  const liveOrdered = orderTeams(workspaces, d.order).filter((w) => w.status === 'live');
  const me = EMPLOYEES.find((e) => e.name === who)!;
  const seen = workspaces.filter((w) => portalVerdict(w, me).ok).length;

  if (!canCustomize) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16 text-center">
        <Lock size={28} className="mx-auto text-[#94A3B8]" />
        <h1 className="mt-3 text-[16px] font-semibold text-[#364658]">You don’t have permission to view this page</h1>
        <p className="mt-1 text-[13px] text-[#7B8FA5]">The ESM Portal needs Admin › Global › Manage Support Channels › Manage ESM Portal.</p>
      </div>
    );
  }

  const move = (id: number, dir: -1 | 1) => {
    const ids = liveOrdered.map((w) => w.id);
    const i = ids.indexOf(id); const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    set({ order: ids });
  };
  const publish = () => setEsm((s) => { const n = { ...s, published: s.draft, publishedAt: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }; saveEsm(n); toast.success('ESM Portal published', { description: 'Employees see the new landing page now.' }); return n; });
  const discard = () => setEsm((s) => { const n = { ...s, draft: s.published }; saveEsm(n); toast('Changes discarded'); return n; });
  const reset = () => { set(DEFAULT_ESM); toast('Back to the default look', { description: 'Publish to make it live.' }); };
  const presetOn = PRESETS.find((p) => p.from === d.bannerFrom && p.to === d.bannerTo);

  const statusPill = (
    <span className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${dirty ? 'bg-[#FEF6E7] text-[#B54708]' : 'bg-[#ECFDF3] text-[#22A06B]'}`}>
      <span className={`size-1.5 rounded-full ${dirty ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'}`} />{dirty ? 'Unpublished changes' : 'Published'}
    </span>
  );
  const singleNote = live.length < 2 && (
    <div className="flex items-start gap-2 rounded-md border border-[#DBEAFE] bg-[#F5FAFF] px-3 py-2 text-[12px] text-[#364658]"><Info size={14} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />Only {live.length} workspace is Live, so employees go straight to its Support Portal. The ESM Portal appears once a second workspace goes Live.</div>
  );
  const openAsEmployee = () => window.open(`${window.location.pathname}#/portal/home`, '_blank');

  /* ── Module page (inside the admin shell): one portal card ───────────────────────────────────── */
  if (!customizing) {
    const facts: [string, string][] = [
      ['Address', 'support.acme.com'],
      ['Team cards', `${live.length} Live workspaces`],
      ['Last published', esm.publishedAt ?? '—'],
    ];
    return (
      <div className="px-4 pb-8 pt-5">
        <h1 className="text-[20px] font-semibold text-[#364658]">ESM Portal</h1>
        <p className="mt-0.5 text-[13px] text-[#7B8FA5]">The landing page employees see before they pick a team. Each team card opens that workspace’s own Support Portal.</p>
        {singleNote && <div className="mt-4">{singleNote}</div>}
        <div className="mt-5 flex flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-5 lg:flex-row">
          <div role="button" tabIndex={0} onClick={() => onCustomize(true)} onKeyDown={(e) => e.key === 'Enter' && onCustomize(true)} aria-label="Customize ESM Portal"
            className="group relative h-[230px] w-full max-w-[400px] flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F7F9FC]">
            <div aria-hidden className="pointer-events-none w-[1200px] origin-top-left scale-[0.333]">
              <EsmLanding preview cfg={d} esm={esm} workspaces={workspaces} me={me} onOpenTeam={() => {}} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center bg-[#0F172A]/0 opacity-0 transition-all group-hover:bg-[#0F172A]/40 group-hover:opacity-100"><span className="inline-flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-[13px] font-medium text-[#364658] shadow"><Pencil size={13} /> Customize</span></span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="text-[16px] font-semibold text-[#364658]">ESM Portal</span>{statusPill}</div>
            <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-[140px_1fr]">
              {facts.map(([k, v]) => [<dt key={k} className="text-[12px] text-[#7B8FA5]">{k}</dt>, <dd key={`${k}v`} className="text-[13px] text-[#364658]">{v}</dd>])}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button onClick={() => onCustomize(true)} className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#2d6ca0]"><Pencil size={14} /> Customize</button>
              <button onClick={openAsEmployee} className="inline-flex h-8 items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#f9fafb]"><Eye size={14} /> Open as employee</button>
              {dirty && <span className="ml-1 text-[12px] text-[#B54708]">Saved changes are waiting to be published.</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Customize: full screen · preview (edit in place) left · one settings panel right ─────────── */
  return (
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-[9000] flex flex-col bg-[#EEF1F5]">
      <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white pl-2 pr-3">
        <button onClick={() => onCustomize(false)} title="Back to ESM Portal" aria-label="Back to ESM Portal" className="rounded p-1.5 text-[#64748B] hover:bg-[#F5F7FA]"><ArrowLeft size={18} /></button>
        <span className="text-[14px] font-medium text-[#364658]">ESM Portal</span>
        {statusPill}
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-2 text-[12px] text-[#64748B]">
            <Eye size={14} /> Preview as
            <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Preview as employee" className="app-select h-7 rounded border border-[#d1d5db] bg-white px-2 text-[12px]">
              {EMPLOYEES.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] text-[#475569]"><Users size={11} /> sees {seen} of {workspaces.length}</span>
          </span>
          <span className="mx-1 h-5 w-px bg-[#E5E7EB]" />
          <button onClick={openAsEmployee} title="Open the published page in a new tab" className="inline-flex h-8 items-center gap-1 rounded px-2.5 text-[12px] font-medium text-[#3D8BD0] hover:bg-[#F5F7FA]">Open <ExternalLink size={12} /></button>
          {dirty && <button onClick={discard} className="inline-flex h-8 items-center gap-1.5 rounded px-3 text-[13px] text-[#64748B] hover:bg-[#F5F7FA]"><RotateCcw size={14} /> Discard</button>}
          <button disabled={!dirty || !canPublish} onClick={publish} title={!canPublish ? 'Needs Admin › Global › Manage Support Channels › Publish ESM Portal' : !dirty ? 'Nothing to publish' : undefined}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-40"><Upload size={14} /> Publish</button>
        </div>
      </div>
      {singleNote && <div className="border-b border-[#E5E7EB] bg-white px-4 py-2">{singleNote}</div>}

      <div className="flex min-h-0 flex-1">
        {/* Live preview — headings are edited right here */}
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="flex h-8 flex-shrink-0 items-center gap-1.5 border-b border-[#E5E7EB] bg-[#F8FAFC] px-3">
              <span className="size-2.5 rounded-full bg-[#E2E8F0]" /><span className="size-2.5 rounded-full bg-[#E2E8F0]" /><span className="size-2.5 rounded-full bg-[#E2E8F0]" />
              <span className="mx-auto rounded-md bg-white px-3 py-0.5 text-[11px] text-[#94A3B8] ring-1 ring-[#E5E7EB]">support.acme.com</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <EsmLanding preview cfg={d} esm={esm} workspaces={workspaces} me={me} onEdit={set}
                onOpenTeam={(w) => toast(`Opens ${w.name}’s Support Portal`, { description: portalHost(wsPortalOf(esm, w)) })} onRequests={() => toast('Opens All my requests')} />
            </div>
          </div>
        </div>

        {/* One settings panel, no tabs */}
        <aside className="flex w-[320px] flex-shrink-0 flex-col border-l border-[#E5E7EB] bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-start gap-2 border-b border-[#F0F2F5] bg-[#F8FAFC] px-4 py-3 text-[12px] leading-[1.5] text-[#475569]">
              <MousePointerClick size={15} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
              <span>Click any heading on the page to change its text.</span>
            </div>

            <Block title="Banner">
              <div className="grid grid-cols-6 gap-1.5">
                {PRESETS.map((p) => { const on = presetOn?.name === p.name; return (
                  <button key={p.name} onClick={() => set({ bannerFrom: p.from, bannerTo: p.to })} aria-pressed={on} title={p.name} aria-label={`${p.name} banner`}
                    className={`relative h-9 rounded-md ring-offset-2 transition-shadow ${on ? 'ring-2 ring-[#3D8BD0]' : 'hover:ring-2 hover:ring-[#CBD5E1]'}`} style={{ background: `linear-gradient(120deg, ${p.from}, ${p.to})` }}>
                    {on && <Check size={14} strokeWidth={3} className="absolute inset-0 m-auto text-white" />}
                  </button>
                ); })}
              </div>
            </Block>

            <Block title="Team cards" right={<span className="text-[11px] text-[#94A3B8]">{liveOrdered.length} Live</span>}>
              <div className="space-y-1">
                {liveOrdered.map((w, i) => { const Icon = CARD_ICON[wsPortalOf(esm, w).cardIcon]; return (
                  <div key={w.id} className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-[#F5F7FA]">
                    <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md" style={{ background: `${w.colour}1A`, color: w.colour }}><Icon size={14} /></span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{w.name}</span>
                    <span className="flex items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <button onClick={() => move(w.id, -1)} disabled={i === 0} aria-label={`Move ${w.name} up`} className="rounded p-1 text-[#64748B] hover:bg-white disabled:opacity-30"><ChevronUp size={14} /></button>
                      <button onClick={() => move(w.id, 1)} disabled={i === liveOrdered.length - 1} aria-label={`Move ${w.name} down`} className="rounded p-1 text-[#64748B] hover:bg-white disabled:opacity-30"><ChevronDown size={14} /></button>
                      <button onClick={() => onOpenWorkspace(actionPath(w.id, 'portal'))} title={`Edit ${w.name}'s card in its Support Portal`} aria-label={`Edit ${w.name}'s Support Portal`} className="rounded p-1 text-[#64748B] hover:bg-white"><Settings2 size={14} /></button>
                    </span>
                  </div>
                ); })}
              </div>
              <p className="mt-2 text-[11px] leading-[1.5] text-[#94A3B8]">Every Live workspace gets a card. Hover to reorder.</p>
            </Block>

            <Block title="Below the cards">
              <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
                <span className="text-[13px] text-[#364658]">Show each person’s requests</span>
                <Toggle on={d.showMyWork} onChange={(v) => set({ showMyWork: v })} label="Show each person’s requests" />
              </label>
              <div className="mt-3">
                <div className="mb-1.5 text-[12px] text-[#7B8FA5]">Quick links</div>
                <div className="space-y-1.5">
                  {d.links.map((l, i) => (
                    <div key={i} className="group flex items-center gap-1 rounded-md border border-[#E5E7EB] pr-1 focus-within:border-[#3D8BD0]">
                      <input value={l.label} onChange={(e) => set({ links: d.links.map((x, k) => k === i ? { ...x, label: e.target.value } : x) })} placeholder="Name" aria-label="Link name"
                        className="h-8 w-[42%] rounded-l-md border-r border-[#F0F2F5] bg-transparent px-2.5 text-[13px] text-[#364658] outline-none" />
                      <input value={l.url} onChange={(e) => set({ links: d.links.map((x, k) => k === i ? { ...x, url: e.target.value } : x) })} placeholder="https://" aria-label="Link address"
                        className="h-8 min-w-0 flex-1 bg-transparent px-2 text-[12px] text-[#64748B] outline-none" />
                      <button onClick={() => set({ links: d.links.filter((_, k) => k !== i) })} aria-label="Remove link" className="rounded p-1 text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]"><X size={13} /></button>
                    </div>
                  ))}
                </div>
                {d.links.length < 6 && <button onClick={() => set({ links: [...d.links, { label: '', url: '' }] })} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline"><Plus size={13} /> Add link</button>}
              </div>
            </Block>
          </div>
          <div className="border-t border-[#F0F2F5] px-4 py-2.5">
            <button onClick={reset} className="text-[12px] text-[#94A3B8] hover:text-[#64748B] hover:underline">Reset to default</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
