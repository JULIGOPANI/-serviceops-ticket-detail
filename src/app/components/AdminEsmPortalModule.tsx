import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Eye, Info, Lock, Plus, RotateCcw, Settings2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { loadStore, orgCan, sortWorkspaces } from './workspaceData';
import type { Workspace } from './workspaceData';
import { EMPLOYEES, portalSummary, portalVerdict } from './WorkspacePrivacyRows';
import { DEFAULT_ESM, loadEsm, orderTeams, portalHost, sameConfig, saveEsm, wsPortalOf } from './esmPortalData';
import type { EsmPortalConfig, EsmStore } from './esmPortalData';
import { CARD_ICON, EsmLanding } from './EsmPortalView';
import { Toggle, inputCls } from './AdminScopedSettings';
import { actionPath } from './workspaceAdmin';

/* Admin › Global › Support Channels › ESM Portal  (NEW, ESM F18 — Juli 2026-11-05).
 * Customises ONLY the landing page employees see before they pick a team (ManageEngine's ESM Portal customisation):
 * heading, banner, search text, card heading/style/order, My requests strip, links, landing rule, sign-up.
 * Each team's own page (branding, settings, layout) lives in that workspace: Settings › Support Channels › Support Portal.
 * Draft → Preview → Publish, like the Support Portal builder. Permission: Admin › Global › Manage Support Channels. */

const sec = 'rounded-lg border border-[#E5E7EB] bg-white';
const Label = ({ children }: { children: ReactNode }) => <span className="mb-1 block text-[12px] font-medium text-[#475569]">{children}</span>;
const PRESETS: [string, string][] = [['#1E3A8A', '#7C3AED'], ['#0F172A', '#334155'], ['#0D9488', '#0369A1'], ['#7C2D12', '#DB2777'], ['#3D8BD0', '#22C55E']];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className={sec}>
      <div className="border-b border-[#F0F2F5] px-4 py-3"><div className="text-[14px] font-semibold text-[#364658]">{title}</div>{hint && <div className="mt-0.5 text-[12px] text-[#7B8FA5]">{hint}</div>}</div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

export function AdminEsmPortalModule({ viewAs, onOpenWorkspace }: { viewAs: number; onOpenWorkspace: (path: string) => void }) {
  const [esm, setEsm] = useState<EsmStore>(loadEsm);
  const [who, setWho] = useState('Karan Mehta');
  const workspaces = sortWorkspaces(loadStore().workspaces);
  const d = esm.draft;
  const dirty = !sameConfig(esm.draft, esm.published);
  const set = (patch: Partial<EsmPortalConfig>) => setEsm((s) => { const n = { ...s, draft: { ...s.draft, ...patch } }; saveEsm(n); return n; });
  const live = workspaces.filter((w) => w.status === 'live');
  const ordered = orderTeams(workspaces, d.order);
  const me = EMPLOYEES.find((e) => e.name === who)!;

  if (!orgCan(viewAs, 'Support Channels', 'ESM Portal')) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16 text-center">
        <Lock size={28} className="mx-auto text-[#94A3B8]" />
        <h1 className="mt-3 text-[16px] font-semibold text-[#364658]">You don’t have permission to view this page</h1>
        <p className="mt-1 text-[13px] text-[#7B8FA5]">The ESM Portal needs Admin › Global › Manage Support Channels.</p>
      </div>
    );
  }

  const move = (id: number, dir: -1 | 1) => {
    const ids = ordered.map((w) => w.id);
    const i = ids.indexOf(id); const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    set({ order: ids });
  };
  const publish = () => setEsm((s) => { const n = { ...s, published: s.draft, publishedAt: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }; saveEsm(n); toast.success('ESM Portal published', { description: 'Employees see the new landing page now.' }); return n; });
  const discard = () => setEsm((s) => { const n = { ...s, draft: s.published }; saveEsm(n); toast('Changes discarded'); return n; });
  const cardState = (w: Workspace) => w.status !== 'live' ? { tone: 'bg-[#F1F5F9] text-[#64748B]', text: w.status === 'setup' ? 'Hidden · in Setup' : 'Hidden · Inactive' } : w.portalAccess && w.portalAccess.mode !== 'logged_in' ? { tone: 'bg-[#FEF6E7] text-[#B54708]', text: portalSummary(w.portalAccess) } : { tone: 'bg-[#ECFDF3] text-[#15803D]', text: 'Everyone' };

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-semibold text-[#364658]">ESM Portal</h1>
            <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-semibold text-[#6D28D9]">New</span>
            <span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${dirty ? 'bg-[#FEF6E7] text-[#B54708]' : 'bg-[#ECFDF3] text-[#22A06B]'}`}>{dirty ? 'Unpublished changes' : 'Published'}</span>
            <span className="text-[12px] text-[#7B8FA5]">{esm.publishedAt}</span>
          </div>
          <p className="mt-1 max-w-[760px] text-[13px] leading-[1.6] text-[#7B8FA5]">The landing page employees see at <b className="font-medium text-[#364658]">support.acme.com</b> before they pick a team. Each card opens the Support Portal of that workspace; a team’s own page, branding and requester settings are set in its workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { window.open(`${window.location.pathname}#/portal/home`, '_blank'); }} className="inline-flex h-9 items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#f9fafb]"><Eye size={15} /> Open as employee</button>
          <button disabled={!dirty} onClick={discard} className="inline-flex h-9 items-center gap-1.5 rounded px-3 text-[13px] text-[#64748B] hover:bg-[#F5F7FA] disabled:opacity-40"><RotateCcw size={14} /> Discard</button>
          <button disabled={!dirty} onClick={publish} className="inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#2d6ca0] disabled:opacity-40"><Upload size={14} /> Publish</button>
        </div>
      </div>

      {live.length < 2 && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-[#DBEAFE] bg-[#F5FAFF] px-3 py-2 text-[12px] text-[#364658]"><Info size={14} className="mt-0.5 text-[#3D8BD0]" />Only {live.length} workspace is Live, so employees go straight to its Support Portal. The ESM Portal appears once a second workspace goes Live.</div>
      )}

      <div className="grid gap-4 xl:grid-cols-[440px_1fr]">
        <div className="space-y-4">
          <Section title="Landing page">
            <label className="block"><Label>Heading</Label><input value={d.heading} onChange={(e) => set({ heading: e.target.value })} className={inputCls} /></label>
            <label className="block"><Label>Sub heading</Label><input value={d.subheading} onChange={(e) => set({ subheading: e.target.value })} className={inputCls} /></label>
            <label className="block"><Label>Search placeholder</Label><input value={d.searchPlaceholder} onChange={(e) => set({ searchPlaceholder: e.target.value })} className={inputCls} /></label>
            <div><Label>Banner</Label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map(([a, b]) => <button key={a + b} onClick={() => set({ bannerFrom: a, bannerTo: b })} aria-label="Banner colours" className={`h-7 w-12 rounded border-2 ${d.bannerFrom === a && d.bannerTo === b ? 'border-[#1F2D3D]' : 'border-transparent'}`} style={{ background: `linear-gradient(120deg, ${a}, ${b})` }} />)}
                <input type="color" value={d.bannerFrom} onChange={(e) => set({ bannerFrom: e.target.value })} aria-label="Banner start colour" className="h-7 w-8 cursor-pointer rounded border border-[#d1d5db]" />
                <input type="color" value={d.bannerTo} onChange={(e) => set({ bannerTo: e.target.value })} aria-label="Banner end colour" className="h-7 w-8 cursor-pointer rounded border border-[#d1d5db]" />
              </div>
            </div>
          </Section>

          <Section title="Team cards" hint="One card per Live workspace. Who sees a card is the workspace’s Portal Access; the icon and text come from its Support Portal.">
            <label className="block"><Label>Cards heading</Label><input value={d.cardsHeading} onChange={(e) => set({ cardsHeading: e.target.value })} className={inputCls} /></label>
            <div className="flex items-center gap-2">
              <Label>Style</Label>
              {(['tiles', 'rows'] as const).map((s) => <button key={s} onClick={() => set({ cardStyle: s })} className={`h-7 rounded-full border px-3 text-[12px] ${d.cardStyle === s ? 'border-[#3D8BD0] bg-[#EBF5FF] font-medium text-[#1F5F99]' : 'border-[#DFE5ED] text-[#475569]'}`}>{s === 'tiles' ? 'Tiles' : 'Rows'}</button>)}
              <span className="ml-auto flex items-center gap-2 text-[12px] text-[#475569]">Descriptions <Toggle on={d.showDescriptions} onChange={(v) => set({ showDescriptions: v })} label="Show card descriptions" /></span>
            </div>
            <div className="divide-y divide-[#F0F2F5] rounded-md border border-[#EEF1F5]">
              {ordered.map((w, i) => { const p = wsPortalOf(esm, w); const Icon = CARD_ICON[p.cardIcon]; const st = cardState(w); return (
                <div key={w.id} className="flex items-center gap-2.5 px-3 py-2">
                  <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md text-white" style={{ background: w.colour, opacity: w.status === 'live' ? 1 : 0.45 }}><Icon size={14} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-[#364658]">{w.name}</span><span className="block truncate text-[11px] text-[#7B8FA5]">{portalHost(p)}</span></span>
                  <span className={`max-w-[130px] truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${st.tone}`} title={st.text}>{st.text}</span>
                  <button onClick={() => move(w.id, -1)} disabled={i === 0} aria-label={`Move ${w.name} up`} className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30"><ArrowUp size={13} /></button>
                  <button onClick={() => move(w.id, 1)} disabled={i === ordered.length - 1} aria-label={`Move ${w.name} down`} className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30"><ArrowDown size={13} /></button>
                  <button onClick={() => onOpenWorkspace(actionPath(w.id, 'portal'))} title={`Edit ${w.name}'s Support Portal`} aria-label={`Edit ${w.name}'s Support Portal`} className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9]"><Settings2 size={13} /></button>
                </div>
              ); })}
            </div>
          </Section>

          <Section title="Below the cards">
            <div className="flex items-center justify-between gap-3"><span className="text-[13px] text-[#364658]">My open requests & approvals from every team</span><Toggle on={d.showMyWork} onChange={(v) => set({ showMyWork: v })} label="Show my work" /></div>
            <div><Label>Useful links</Label>
              {d.links.map((l, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <input value={l.label} onChange={(e) => set({ links: d.links.map((x, k) => k === i ? { ...x, label: e.target.value } : x) })} placeholder="Label" aria-label="Link label" className={inputCls} />
                  <input value={l.url} onChange={(e) => set({ links: d.links.map((x, k) => k === i ? { ...x, url: e.target.value } : x) })} placeholder="URL" aria-label="Link URL" className={inputCls} />
                  <button onClick={() => set({ links: d.links.filter((_, k) => k !== i) })} aria-label="Remove link" className="rounded p-1.5 text-[#DC2626] hover:bg-[#FEF2F2]"><Trash2 size={14} /></button>
                </div>
              ))}
              {d.links.length < 6 && <button onClick={() => set({ links: [...d.links, { label: '', url: '' }] })} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline"><Plus size={14} /> Add link</button>}
            </div>
          </Section>

          <Section title="Where employees land" hint="Someone who can see only one team always goes straight to that team’s portal.">
            <label className="block"><Label>People who can see two or more teams open</Label>
              <select value={String(d.landing)} onChange={(e) => set({ landing: e.target.value === 'esm' ? 'esm' : Number(e.target.value) })} className={`${inputCls} app-select`}>
                <option value="esm">The ESM Portal</option>
                {live.map((w) => <option key={w.id} value={w.id}>{w.name}’s Support Portal</option>)}
              </select>
            </label>
            <div className="flex items-center justify-between gap-3"><span className="text-[13px] text-[#364658]">Let each person ⭐ a default team</span><Toggle on={d.allowStar} onChange={(v) => set({ allowStar: v })} label="Allow star" /></div>
          </Section>

          <Section title="Sign-in & registration" hint="One sign-in for every team’s portal. Login, OTP and password pages: Organization › Branding › Theme › Static Pages.">
            <div className="flex items-center justify-between gap-3"><span className="text-[13px] text-[#364658]">Allow Self Registration</span><Toggle on={d.selfRegistration} onChange={(v) => set({ selfRegistration: v })} label="Allow Self Registration" /></div>
            {d.selfRegistration && (
              <div className="flex flex-wrap items-center gap-2">
                <Label>Registration Type</Label>
                {(['Allow everyone', 'Set of Domains'] as const).map((t) => <button key={t} onClick={() => set({ registrationType: t })} className={`h-7 rounded-full border px-3 text-[12px] ${d.registrationType === t ? 'border-[#3D8BD0] bg-[#EBF5FF] font-medium text-[#1F5F99]' : 'border-[#DFE5ED] text-[#475569]'}`}>{t}</button>)}
                {d.registrationType === 'Set of Domains' && <input value={d.domains} onChange={(e) => set({ domains: e.target.value })} placeholder="acme.com, acme.in" aria-label="Domains" className={inputCls} />}
              </div>
            )}
          </Section>
          <button onClick={() => set(DEFAULT_ESM)} className="text-[12px] text-[#64748B] hover:underline">Reset to default</button>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-[#64748B]">
            <Eye size={14} /> Live preview of your draft as
            <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Preview as employee" className="app-select h-7 rounded border border-[#d1d5db] bg-white px-2 text-[12px]">
              {EMPLOYEES.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
            <span>· sees {workspaces.filter((w) => portalVerdict(w, me).ok).length} of {workspaces.length} teams</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB] shadow-sm">
            <div className="flex h-7 items-center gap-1.5 border-b border-[#E5E7EB] bg-[#F1F5F9] px-3"><span className="size-2 rounded-full bg-[#F87171]" /><span className="size-2 rounded-full bg-[#FBBF24]" /><span className="size-2 rounded-full bg-[#34D399]" /><span className="ml-3 text-[11px] text-[#94A3B8]">support.acme.com</span></div>
            <div className="max-h-[720px] overflow-y-auto">
              <EsmLanding preview cfg={d} esm={esm} workspaces={workspaces} me={me} onOpenTeam={(w) => toast(`Opens ${w.name}’s Support Portal`, { description: portalHost(wsPortalOf(esm, w)) })} onRequests={() => toast('Opens All my requests')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
