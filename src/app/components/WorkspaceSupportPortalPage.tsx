import { useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Paintbrush, Pencil, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { loadStore } from './workspaceData';
import type { Workspace } from './workspaceData';
import { portalSummary } from './WorkspacePrivacyRows';
import { CARD_ICONS, ORG_BRANDING, SETTING_GROUPS, loadEsm, portalHost, saveEsm, wsPortalOf } from './esmPortalData';
import type { WsPortal } from './esmPortalData';
import { CARD_ICON } from './EsmPortalView';
import { IconBtn, PageHead, Toggle, inputCls, td, th } from './AdminScopedSettings';
import { SupportPortalBuilder } from './SupportPortalBuilder';
import { workspacePortalPage } from './AdminSupportPortalModule';
import type { PortalPage } from './supportPortalData';

/* Workspace › Settings › Support Channels › Support Portal  (ESM F18, Juli 2026-11-05).
 * The Support Portal MAPPED TO THIS WORKSPACE — the page employees open from its card on the ESM Portal.
 * Same row and the same three actions as the live Support Portals list on 185 (Edit · Support Portal Branding ·
 * Support Portal Setting), minus what is one-for-all: sign-in, Identity Provider, logo/favicon and Static Pages stay
 * Organization (Admin › Organization › Branding), self-registration is on the ESM Portal.
 * + Customize page (the Support Portal builder) and View. Permission: Admin › Workspace › Manage Support Channels. */

type Panel = 'edit' | 'branding' | 'setting' | null;

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
  /* Customize page opens the builder HERE, inside the workspace — never the global Support Portals list. */
  const [building, setBuilding] = useState<PortalPage | null>(null);
  const [draft, setDraft] = useState<WsPortal>(p);
  const [brandTab, setBrandTab] = useState<'details' | 'theme' | 'static'>('details');
  const open = (k: Panel) => { setDraft(wsPortalOf(loadEsm(), w)); setBrandTab('details'); setPanel(k); };
  const save = () => {
    if (!draft.name.trim()) { toast.error('Support Portal Name is required'); return; }
    if (!w.isDefault) {
      if (!draft.slug || draft.slug === 'it' || draft.slug === 'home' || draft.slug === 'requests') { toast.error('Enter a URL path for this portal'); return; }
      const taken = loadStore().workspaces.some((x) => x.id !== w.id && wsPortalOf(esm, x).slug === draft.slug);
      if (taken) { toast.error(`support.acme.com/${draft.slug} is already used by another team`); return; }
    }
    const before = wsPortalOf(esm, w).slug;
    const saved = before && before !== draft.slug ? { ...draft, oldSlugs: [...new Set([...(draft.oldSlugs ?? []), before])].filter((x) => x !== draft.slug) } : draft;
    const n = { ...esm, wsPortals: { ...esm.wsPortals, [w.id]: saved } };
    saveEsm(n); setEsm(n); setPanel(null);
    toast.success(`${draft.name} updated`, { description: panel === 'setting' ? 'Requesters in this portal follow the new settings.' : undefined });
  };
  const set = (patch: Partial<WsPortal>) => setDraft((d) => ({ ...d, ...patch }));
  const Icon = CARD_ICON[p.cardIcon];
  const status = w.status === 'live' ? { t: 'Published', c: 'bg-[#ECFDF3] text-[#22A06B]' } : { t: w.status === 'setup' ? 'Hidden until Live' : 'Hidden · Inactive', c: 'bg-[#F1F5F9] text-[#64748B]' };
  const groups = SETTING_GROUPS.filter((g) => !g.itOnly || w.type === 'it');

  if (building) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-[56px] z-40 flex flex-col bg-white">
        <SupportPortalBuilder
          page={building}
          accent={p.colour || undefined}
          onRename={(name) => setBuilding((b) => (b ? { ...b, name } : b))}
          onPublish={() => { toast.success(`“${building.name}” is live for ${w.name}`); setBuilding(null); }}
          onSaveDraft={() => toast.success(`“${building.name}” saved as a draft`)}
          onExit={() => setBuilding(null)}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-5">
      <PageHead title="Support Portal" sub={`The support portal of ${w.name}: the page employees open from the ${w.name} card on the ESM Portal.`} workspace={w} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-[#e5e7eb]"><tr>{['Support Portal Name', 'Card on ESM Portal', 'Support Portal URL', 'Status', 'Actions'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="bg-white">
            <tr className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]">
              <td className={td}><span className="font-medium">{p.name}</span>{w.isDefault && <span className="ml-2 rounded bg-[#E8F1FB] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">Default</span>}</td>
              <td className={td}><span className="inline-flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-md text-white" style={{ background: w.colour }}><Icon size={13} /></span><span className="max-w-[220px] truncate text-[12px] text-[#64748B]">{p.cardDesc}</span></span></td>
              <td className={`${td} text-[#7B8FA5]`}>{portalHost(p)}</td>
              <td className={td}><span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${status.c}`}>{status.t}</span></td>
              <td className={td}>
                <div className="flex items-center gap-0.5">
                  <IconBtn label="Edit" onClick={() => open('edit')}><Pencil size={15} /></IconBtn>
                  <IconBtn label="Support Portal Branding" onClick={() => open('branding')}><Paintbrush size={15} /></IconBtn>
                  <IconBtn label="Support Portal Setting" onClick={() => open('setting')}><Settings size={15} /></IconBtn>
                  <IconBtn label="View as employee" onClick={() => window.open(`${window.location.pathname}#/portal/${p.slug || 'it'}`, '_blank')}><Eye size={15} /></IconBtn>
                  <button onClick={() => setBuilding({ ...workspacePortalPage(w), name: p.name })} className="ml-2 h-7 rounded border border-[#d1d5db] px-2.5 text-[12px] font-medium text-[#364658] hover:bg-[#f9fafb]">Customize page</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid max-w-[900px] gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-[#E5E7EB] p-3 text-[12px] leading-[1.6] text-[#64748B]"><b className="font-medium text-[#364658]">Who can open it:</b> {portalSummary(w.portalAccess)} (Portal Access on the workspace’s Details). Others don’t see the card, and the link says “Page Not Found”.</div>
        <div className="rounded-lg border border-[#E5E7EB] p-3 text-[12px] leading-[1.6] text-[#64748B]"><b className="font-medium text-[#364658]">Set for all teams:</b> sign-in and Identity Provider, logo, favicon, login/OTP/password pages (Organization › Branding) and self-registration (ESM Portal).</div>
      </div>

      {panel === 'edit' && (
        <Drawer title="Edit Support Portal" sub={`${w.name} · the address and the card employees see on the ESM Portal`} onClose={() => setPanel(null)} onSave={save}>
          <Field label="Support Portal Name *"><input value={draft.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} /></Field>
          <Field label="Support Portal URL *" hint={w.isDefault ? 'The Default workspace keeps today’s address, so existing bookmarks and email links still work.' : 'A path on the same portal: one sign-in for every team. Changing it keeps a redirect from the old path.'}>
            <div className="flex items-center"><span className="inline-flex h-9 items-center rounded-l border border-r-0 border-[#d1d5db] bg-[#F9FAFB] px-3 text-[13px] text-[#7B8FA5]">support.acme.com/</span>
              <input value={draft.slug} disabled={w.isDefault} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className={`${inputCls} rounded-l-none disabled:bg-[#F9FAFB]`} /></div>
          </Field>
          <Field label="Card icon">
            <div className="flex gap-2">{CARD_ICONS.map((k) => { const I = CARD_ICON[k]; return <button key={k} onClick={() => set({ cardIcon: k })} aria-label={k} className={`flex size-9 items-center justify-center rounded-lg border-2 text-white ${draft.cardIcon === k ? 'border-[#1F2D3D]' : 'border-transparent'}`} style={{ background: w.colour }}><I size={17} /></button>; })}</div>
          </Field>
          <Field label="Card description" hint="One line under the team’s name on the ESM Portal."><input value={draft.cardDesc} onChange={(e) => set({ cardDesc: e.target.value })} maxLength={90} className={inputCls} /></Field>
        </Drawer>
      )}

      {panel === 'branding' && (
        <Drawer title="Support Portal Branding" sub={`${w.name} · an empty field uses the Organization’s value (Admin › Organization › Branding)`} onClose={() => setPanel(null)} onSave={save}>
          <div className="flex gap-1 rounded-md bg-[#F1F5F9] p-1">{(['details', 'theme', 'static'] as const).map((t) => <button key={t} onClick={() => setBrandTab(t)} className={`h-8 rounded px-3 text-[13px] ${brandTab === t ? 'bg-[#1F2937] font-medium text-white' : 'text-[#475569]'}`}>{t === 'details' ? 'Details' : t === 'theme' ? 'Theme' : 'Static Pages'}</button>)}</div>
          {brandTab === 'details' && (<>
            <Field label="Support Portal Title"><input value={draft.title} placeholder={`${ORG_BRANDING.title} (Organization)`} onChange={(e) => set({ title: e.target.value })} className={inputCls} /></Field>
            <Field label="Greeting Message"><textarea value={draft.greeting} placeholder={`${ORG_BRANDING.greeting} (Organization)`} onChange={(e) => set({ greeting: e.target.value })} rows={3} className="w-full rounded border border-[#d1d5db] px-3 py-2 text-[13px] focus:border-[#3D8BD0] focus:outline-none" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Support Email"><input value={draft.supportEmail} placeholder={w.setup.email || ORG_BRANDING.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} className={inputCls} /></Field>
              <Field label="Support Contact No."><input value={draft.contactNo} placeholder={ORG_BRANDING.contactNo} onChange={(e) => set({ contactNo: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Support Portal Banner Image (1920px X 550px For Better Resolution)"><button onClick={() => toast('Upload a banner image')} className="h-9 rounded border border-dashed border-[#CBD5E1] px-3 text-[13px] text-[#64748B]">Upload Support Portal Banner Image</button></Field>
          </>)}
          {brandTab === 'theme' && (
            <Field label="Primary Color" hint="Banner, buttons and links on this team’s portal. Empty = the Organization’s Support Portal Theme.">
              <div className="flex items-center gap-2"><input type="color" value={draft.colour || '#0F172A'} onChange={(e) => set({ colour: e.target.value })} aria-label="Primary colour" className="h-9 w-12 cursor-pointer rounded border border-[#d1d5db]" />
                <input value={draft.colour} placeholder="Organization theme" onChange={(e) => set({ colour: e.target.value })} className={inputCls} />
                <button onClick={() => set({ colour: w.colour })} className="whitespace-nowrap text-[12px] text-[#3D8BD0] hover:underline">Use workspace colour</button></div>
            </Field>
          )}
          {brandTab === 'static' && <p className="rounded-md bg-[#F9FAFB] p-3 text-[13px] text-[#64748B]">Login, OTP, 2FA, password and error pages are the same for every team, because sign-in is one for all. Edit them in Admin › Organization › Branding › Theme › Static Pages.</p>}
        </Drawer>
      )}

      {panel === 'setting' && (
        <Drawer title="Support Portal Setting" sub={`${w.name} · what requesters can do in this portal`} onClose={() => setPanel(null)} onSave={save}>
          {groups.map((g) => (
            <div key={g.title} className="rounded-lg border border-[#E5E7EB]">
              <div className="border-b border-[#F0F2F5] px-3 py-2 text-[13px] font-semibold text-[#364658]">{g.title}{g.itOnly && <span className="ml-2 text-[11px] font-normal text-[#94A3B8]">IT workspaces only</span>}</div>
              {g.rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] text-[#364658]"><span>{r.label}</span><Toggle on={!!draft.settings[r.key]} onChange={(v) => set({ settings: { ...draft.settings, [r.key]: v } })} label={r.label} /></div>
              ))}
            </div>
          ))}
          <p className="text-[12px] text-[#94A3B8]">User (self-registration) is set once on the ESM Portal. {w.type !== 'it' && 'Change, Asset and CMDB show only in IT workspaces.'}</p>
        </Drawer>
      )}
    </div>
  );
}
