import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, LayoutTemplate, PenLine, X } from 'lucide-react';
import { PORTAL_TEMPLATES, TEMPLATE_CATEGORIES } from './supportPortalData';
import type { PortalTemplate } from './supportPortalData';
import { TemplateArt } from './SupportPortalTemplateGallery';

/* Create Support Portal — two steps, one dialog.
 *
 * ⚠️ The steps are ORDERED because the second genuinely depends on the first. You cannot choose a
 * layout for a portal that does not exist yet: step 1 creates the record — name, address, who signs
 * in — and step 2 decides what is on it. That is why step 2 is unreachable until step 1 is saved,
 * and why the step marker is a real state rather than decoration.
 *
 * ⚠️ Saving step 1 CREATES the portal, as a Draft, before step 2 is answered. Closing the dialog
 * from step 2 therefore leaves a real portal in the listing rather than throwing the details away —
 * the same rule the old New-page routes followed, for the same reason: nothing an admin has typed
 * should disappear because they stopped to think about the next question.
 */

export interface PortalDetails {
  name: string;
  company: string;
  url: string;
  idp: string;
  ssoOnly: boolean;
}

/* Mock, like every other list in this prototype. Company is required, so it has to have options. */
const COMPANIES = ['Acme Corporation', 'Acme EMEA', 'Acme Manufacturing', 'Northwind Logistics'];
const IDPS = ['None — use ServiceOps login', 'Azure AD', 'Okta', 'Google Workspace', 'SAML 2.0'];

const label = 'mb-1 block text-[13px] text-[#7B8FA5]';
const input = 'h-9 w-full rounded border border-[#d1d5db] px-2.5 text-[13px] text-[#364658] outline-none transition-colors focus:border-[#3D8BD0]';

const Req = () => <span className="text-[#EF4444]"> *</span>;

/** The two-dot progress marker. Says which step you are on and whether the other is reachable. */
function Steps({ step, canGoBack, onBack }: { step: 1 | 2; canGoBack: boolean; onBack: () => void }) {
  const rows: { n: 1 | 2; title: string }[] = [
    { n: 1, title: 'Support portal details' },
    { n: 2, title: 'Support portal customization' },
  ];
  return (
    <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-3">
      {rows.map((r, i) => {
        const done = step > r.n;
        const on = step === r.n;
        /* ⚠️ Step 1 stays clickable from step 2 — the details are editable until you leave, and a
           marker you cannot press is a picture of progress rather than a way through it. Step 2 is
           NOT clickable from step 1: it has nothing to show until the portal exists. */
        const clickable = r.n === 1 && canGoBack;
        return (
          <div key={r.n} className="flex items-center gap-3">
            <button
              onClick={clickable ? onBack : undefined}
              disabled={!clickable}
              className={`flex items-center gap-2 rounded px-1.5 py-1 text-left transition-colors ${
                clickable ? 'cursor-pointer hover:bg-[#F5F7FA]' : 'cursor-default'
              }`}
            >
              <span
                className={`flex size-[22px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                  done ? 'bg-[#3D8BD0] text-white'
                    : on ? 'bg-[#3D8BD0] text-white'
                      : 'border border-[#DFE5ED] bg-white text-[#9CA3AF]'
                }`}
              >{done ? <Check size={12} strokeWidth={3} /> : r.n}</span>
              <span className={`text-[13px] ${on || done ? 'font-medium text-[#364658]' : 'text-[#9CA3AF]'}`}>{r.title}</span>
            </button>
            {i === 0 && <span className={`h-px w-8 ${step > 1 ? 'bg-[#3D8BD0]' : 'bg-[#E5E7EB]'}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function CreateSupportPortalModal({ onClose, onSaveDetails, onScratch, onTemplate }: {
  onClose: () => void;
  /** Step 1 → creates the portal as a Draft and unlocks step 2. */
  onSaveDetails: (d: PortalDetails) => void;
  /** Step 2 → a blank canvas. */
  onScratch: () => void;
  /** Step 2 → this template. `null` means the Default, which IS the standard portal page. */
  onTemplate: (t: PortalTemplate | null) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [saved, setSaved] = useState(false);
  const [d, setD] = useState<PortalDetails>({
    name: '', company: '', url: '', idp: IDPS[0], ssoOnly: false,
  });
  const [route, setRoute] = useState<'none' | 'template'>('none');
  const [category, setCategory] = useState<string>('All');

  const set = (k: keyof PortalDetails, v: string | boolean) => setD((p) => ({ ...p, [k]: v }));
  /* ⚠️ Save is DISABLED until the three required fields are filled, rather than validating after
     the click. A button that can only tell you what is wrong once you press it makes you press it
     to find out. */
  const ready = d.name.trim() && d.company.trim() && d.url.trim();

  const save = () => {
    if (!ready) return;
    onSaveDetails(d);
    setSaved(true);
    setStep(2);
  };

  const templates = PORTAL_TEMPLATES.filter((t) => category === 'All' || t.category === category);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-[#0F172A]/40 p-6 pt-[6vh]">
      <div className="flex max-h-[88vh] w-full max-w-[880px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_48px_-12px_rgba(16,24,40,0.25)]">
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#E5E7EB] px-5 py-3.5">
          <h2 className="flex-1 text-[16px] font-semibold text-[#364658]">Create Support Portal</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>

        <Steps step={step} canGoBack={saved} onBack={() => setStep(1)} />

        {step === 1 ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {/* Two columns, as in the product: what the portal IS on the left, who it belongs to
                  and how people sign in on the right. */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={label}>Support Portal Name<Req /></label>
                  <input className={input} value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="Support Portal Name" />
                </div>
                <div>
                  <label className={label}>Company<Req /></label>
                  <select className={`${input} app-select`} value={d.company} onChange={(e) => set('company', e.target.value)}>
                    <option value="">Select</option>
                    {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Support Portal URL<Req /></label>
                  <input className={input} value={d.url} onChange={(e) => set('url', e.target.value)} placeholder="Support Portal URL" />
                </div>
                <div>
                  <label className={label}>Identity Provider</label>
                  <select className={`${input} app-select`} value={d.idp} onChange={(e) => set('idp', e.target.value)}>
                    {IDPS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </div>

              {/* ⚠️ Removed, not greyed, until a provider is chosen — enforcing SSO with no SSO
                  configured is a switch with nothing behind it, and the same rule the Branding
                  panel already follows. */}
              {d.idp !== IDPS[0] && (
                <div className="mt-6">
                  <label className={label}>Enforce to authenticate with Single Sign-On Only</label>
                  <button
                    role="switch"
                    aria-checked={d.ssoOnly}
                    onClick={() => set('ssoOnly', !d.ssoOnly)}
                    className={`relative mt-1 inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors ${d.ssoOnly ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}
                  >
                    <span className={`inline-block size-[14px] rounded-full bg-white transition-transform ${d.ssoOnly ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
              <button onClick={onClose} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
              <button
                onClick={save}
                disabled={!ready}
                title={ready ? undefined : 'Name, Company and URL are required'}
                className={`inline-flex h-9 items-center rounded px-4 text-[13px] font-medium text-white transition-colors ${
                  ready ? 'bg-[#3D8BD0] hover:bg-[#2d6ca0]' : 'cursor-not-allowed bg-[#B6C2D5]'
                }`}
              >Save</button>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {route === 'none' ? (
              /* The two ways to fill a portal. Neither is a default — a blank page and a ready-made
                 one are different intentions, not a primary and a fallback. */
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'scratch', Icon: PenLine, title: 'Create from scratch', desc: 'Start with an empty page and build it block by block.', run: onScratch },
                  { key: 'template', Icon: LayoutTemplate, title: 'Use Template', desc: 'Start from your current portal or a ready-made layout.', run: () => setRoute('template') },
                ].map((o) => (
                  <button
                    key={o.key}
                    onClick={o.run}
                    className="flex flex-col items-start rounded-lg border border-[#E5E7EB] bg-white p-5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><o.Icon size={20} /></span>
                    <span className="mt-3 text-[14px] font-semibold text-[#364658]">{o.title}</span>
                    <span className="mt-1 text-[12px] leading-[1.55] text-[#7B8FA5]">{o.desc}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* ⚠️ The DEFAULT sits in its own band above the grid. It is a template — you can
                    start from it like any other — but it is also the portal your requesters are
                    looking at right now, and a tile sitting eighth in a row of eight cannot say
                    that. Separated and labelled, the reader never has to work out which one is
                    "the real one". */}
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Start from your portal</p>
                <button
                  onClick={() => onTemplate(null)}
                  className="flex w-full items-start gap-4 rounded-lg border border-[#E5E7EB] bg-white p-3 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]"
                >
                  <span className="w-[132px] flex-shrink-0 overflow-hidden rounded border border-[#E5E7EB]">
                    <TemplateArt layout="classic" accent="#3D8BD0" />
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#364658]">Support Portal</span>
                      <span className="rounded bg-[#E8F1FB] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">Default</span>
                    </span>
                    <span className="mt-1 block text-[12px] leading-[1.55] text-[#7B8FA5]">
                      The standard ServiceOps portal — the banner, quick actions, requests, approvals
                      and knowledge your requesters see today.
                    </span>
                  </span>
                </button>

                <div className="mt-6 flex items-center gap-2 border-t border-[#E5E7EB] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Templates</p>
                  <span className="ml-auto flex flex-wrap items-center gap-1.5">
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`h-7 rounded px-2.5 text-[12px] font-medium transition-colors ${
                          category === c ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
                        }`}
                      >{c}</button>
                    ))}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onTemplate(t)}
                      className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]"
                    >
                      <TemplateArt layout={t.layout} accent={t.accent} />
                      <span className="block px-3 py-2.5">
                        <span className="block truncate text-[13px] font-medium text-[#364658]">{t.name}</span>
                        <span className="mt-0.5 block line-clamp-2 text-[11px] leading-[1.5] text-[#9CA3AF]">{t.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {/* Never a dead end — the other route stays one click away from inside this one. */}
                <button
                  onClick={onScratch}
                  className="mt-5 text-[13px] font-medium text-[#3D8BD0] hover:underline"
                >Start from a blank page instead</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
