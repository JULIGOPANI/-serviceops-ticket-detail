import { useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Pencil, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { loadStore } from './workspaceData';
import type { Workspace } from './workspaceData';
import { portalSummary } from './WorkspacePrivacyRows';
import { CARD_ICONS, SETTING_GROUPS, loadEsm, mapsTo, portalsOf, saveEsm, signInLabel, wsPortalOf } from './esmPortalData';
import type { WsPortal } from './esmPortalData';
import { CARD_ICON } from './EsmPortalView';
import { IconBtn, PageHead, Toggle, inputCls, td, th } from './AdminScopedSettings';

/* Workspace › Settings › Support Channels › Support Portal  (ESM F18b, Juli 2026-11-18).
 * A workspace is NOT a portal. It is a TEAM SECTION inside every Support Portal that maps it (Admin › Support Channels ›
 * Support Portal › Workspaces). This page holds what belongs to the team:
 *   Edit                    — its card on the portal home (icon, one line) and its section path (/support-portal/hr)
 *   Support Portal Setting  — WHAT REQUESTERS CAN DO IN THIS TEAM (Request · Service Catalog · Change/Asset/CMDB for IT ·
 *                             Knowledge · Approval · Digital Signature) — e.g. HR = Request Service only, IT = all.
 * Address, sign-in, branding, self-registration and the home page layout belong to the PORTAL (the audience).
 * Permission: Admin › Workspace › Manage Support Channels. */

type Panel = 'edit' | 'setting' | null;

function Drawer({ title, sub, onClose, onSave, children }: { title: string; sub: string; onClose: () => void; onSave: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div className="flex h-full w-[620px] max-w-full flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div><h2 className="text-[16px] font-semibold text-[#364658]">{title}</h2><p className="mt-0.5 text-[12px] text-[#7B8FA5]">{sub}</p></div>
          <button onClick={onClose} aria-label="Close"><X size={18} className="text-[#94A3B8]" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button onClick={onClose} className="h-9 rounded border border-[#d1d5db] px-3 text-[13px] text-[#364658] hover:bg-[#f9fafb]">Cancel</button>
          <button onClick={onSave} className="h-9 rounded bg-[#1F2937] px-4 text-[13px] font-medium text-white hover:bg-[#111827]">Update</button>
        </div>
      </div>
    </div>
  );
}
const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div><span className="mb-1 block text-[13px] text-[#7B8FA5]">{label}</span>{children}{hint && <span className="mt-1 block text-[12px] text-[#94A3B8]">{hint}</span>}</div>
);

export function WorkspaceSupportPortalPage({ w }: { w: Workspace }) {
  const [esm, setEsm] = useState(loadEsm);
  const p = wsPortalOf(esm, w);
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState<WsPortal>(p);
  const open = (k: Panel) => { setDraft(wsPortalOf(loadEsm(), w)); setPanel(k); };
  const save = () => {
    // The path is checked only when it is being changed (saving the Setting must never trip over the path).
    if (panel === 'edit' && !w.isDefault && draft.slug !== wsPortalOf(esm, w).slug) {
      if (!draft.slug || ['it', 'home', 'request', 'request-service', 'knowledge', 'my-approval', 'my-tasks'].includes(draft.slug)) { toast.error('Enter a path for this workspace'); return; }
      const taken = loadStore().workspaces.some((x) => x.id !== w.id && wsPortalOf(esm, x).slug === draft.slug);
      if (taken) { toast.error(`/${draft.slug} is already used by another workspace`); return; }
    }
    const before = wsPortalOf(esm, w).slug;
    const saved = before && before !== draft.slug ? { ...draft, oldSlugs: [...new Set([...(draft.oldSlugs ?? []), before])].filter((x) => x !== draft.slug) } : draft;
    const n = { ...esm, wsPortals: { ...esm.wsPortals, [w.id]: saved } };
    saveEsm(n); setEsm(n); setPanel(null);
    toast.success(panel === 'setting' ? `${w.name}: Support Portal Setting updated` : `${w.name}: card updated`, { description: panel === 'setting' ? 'Requesters see the change in this workspace’s section on every portal that shows it.' : undefined });
  };
  const set = (patch: Partial<WsPortal>) => setDraft((d) => ({ ...d, ...patch }));
  const Icon = CARD_ICON[p.cardIcon];
  const status = w.status === 'live' ? { t: 'Shown', c: 'bg-[#ECFDF3] text-[#22A06B]' } : { t: w.status === 'setup' ? 'Hidden until Live' : 'Hidden · Inactive', c: 'bg-[#F1F5F9] text-[#64748B]' };
  const groups = SETTING_GROUPS.filter((g) => !g.itOnly || w.type === 'it');
  const onPortals = portalsOf(esm).filter((a) => mapsTo(a, w.id));
  const offers = [p.settings.createIncident && 'Incident', p.settings.accessCatalog && 'Service Request', w.type === 'it' && p.settings.myChanges && 'My Changes', p.settings.accessKnowledge && 'Knowledge'].filter(Boolean).join(' · ') || 'nothing (all off)';

  return (
    <div className="px-4 pb-8 pt-5">
      <PageHead title="Support Portal" sub={`How ${w.name} appears inside the Support Portal: its workspace card and what requesters can do in it.`} workspace={w} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-[#e5e7eb]"><tr>{['Workspace card', 'Section path', 'Requesters can', 'Status', 'Actions'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="bg-white">
            <tr className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]">
              <td className={td}><span className="inline-flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md text-white" style={{ background: w.colour }}><Icon size={14} /></span><span><span className="block font-medium">{w.name}</span><span className="block max-w-[240px] truncate text-[12px] text-[#64748B]">{p.cardDesc}</span></span></span></td>
              <td className={`${td} text-[#7B8FA5]`}>/support-portal{p.slug ? `/${p.slug}` : ''}</td>
              <td className={td}><span className="text-[12px]">{offers}</span></td>
              <td className={td}><span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${status.c}`}>{status.t}</span></td>
              <td className={td}>
                <div className="flex items-center gap-0.5">
                  <IconBtn label="Edit workspace card" onClick={() => open('edit')}><Pencil size={15} /></IconBtn>
                  <IconBtn label="Support Portal Setting" onClick={() => open('setting')}><Settings size={15} /></IconBtn>
                  <IconBtn label="View as employee" onClick={() => window.open(`${window.location.pathname}#/portal/${p.slug || 'it'}`, '_blank')}><Eye size={15} /></IconBtn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid max-w-[980px] gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] p-3 text-[12px] leading-[1.6] text-[#64748B]"><b className="font-medium text-[#364658]">Shown on:</b> {onPortals.length ? onPortals.map((a) => `${a.name} (${a.url}, ${signInLabel(a).toLowerCase()})`).join(' · ') : 'no portal — map it in Admin › Support Portal'}.</div>
        <div className="rounded-lg border border-[#E5E7EB] p-3 text-[12px] leading-[1.6] text-[#64748B]"><b className="font-medium text-[#364658]">Who sees the workspace:</b> {portalSummary(w.portalAccess)} (Portal Access on the workspace’s Details). Others get no card and “Page Not Found”.</div>
        <div className="rounded-lg border border-[#E5E7EB] p-3 text-[12px] leading-[1.6] text-[#64748B]"><b className="font-medium text-[#364658]">Set on the portal, not here:</b> address, sign-in, branding, home page and self-registration (Admin › Support Channels › Support Portal).</div>
      </div>

      {panel === 'edit' && (
        <Drawer title="Edit workspace card" sub={`${w.name} · the card on the portal home and the workspace’s section path`} onClose={() => setPanel(null)} onSave={save}>
          <Field label="Section path" hint={w.isDefault ? 'IT keeps today’s address, so existing bookmarks and email links still work.' : 'A path inside every portal that shows this workspace. Changing it keeps a redirect from the old path.'}>
            <div className="flex items-center"><span className="inline-flex h-9 items-center rounded-l border border-r-0 border-[#d1d5db] bg-[#F9FAFB] px-3 text-[13px] text-[#7B8FA5]">/support-portal/</span>
              <input value={draft.slug} disabled={w.isDefault} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className={`${inputCls} rounded-l-none disabled:bg-[#F9FAFB]`} /></div>
          </Field>
          <Field label="Card icon">
            <div className="flex gap-2">{CARD_ICONS.map((k) => { const I = CARD_ICON[k]; return <button key={k} onClick={() => set({ cardIcon: k })} aria-label={k} className={`flex size-9 items-center justify-center rounded-lg border-2 text-white ${draft.cardIcon === k ? 'border-[#1F2D3D]' : 'border-transparent'}`} style={{ background: w.colour }}><I size={17} /></button>; })}</div>
          </Field>
          <Field label="Card description" hint="One line under the workspace’s name on the portal home."><input value={draft.cardDesc} onChange={(e) => set({ cardDesc: e.target.value })} maxLength={90} className={inputCls} /></Field>
        </Drawer>
      )}

      {panel === 'setting' && (
        <Drawer title="Support Portal Setting" sub={`${w.name} · what requesters can do in this workspace, on every portal that shows it`} onClose={() => setPanel(null)} onSave={save}>
          {groups.map((g) => (
            <div key={g.title} className="rounded-lg border border-[#E5E7EB]">
              <div className="border-b border-[#F0F2F5] px-3 py-2 text-[13px] font-semibold text-[#364658]">{g.title}{g.itOnly && <span className="ml-2 text-[11px] font-normal text-[#94A3B8]">IT workspaces only</span>}</div>
              {g.rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] text-[#364658]"><span>{r.label}</span><Toggle on={!!draft.settings[r.key]} onChange={(v) => set({ settings: { ...draft.settings, [r.key]: v } })} label={r.label} /></div>
              ))}
            </div>
          ))}
          <p className="text-[12px] text-[#94A3B8]">User (self-registration) belongs to the portal. {w.type !== 'it' && 'Change, Asset and CMDB show only in IT workspaces.'}</p>
        </Drawer>
      )}
    </div>
  );
}
