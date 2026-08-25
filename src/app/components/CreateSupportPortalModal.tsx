import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, PenLine, X } from 'lucide-react';
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

/** The five things a portal is, asked once and reused by Create and by Edit details. */
export function PortalDetailsFields({ value, onChange }: {
  value: PortalDetails; onChange: (next: PortalDetails) => void;
}) {
  const set = (k: keyof PortalDetails, v: string | boolean) => onChange({ ...value, [k]: v });
  return (
    <>
      {/* Two columns, as in the product: what the portal IS on the left, who it belongs to and how
          people sign in on the right. */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className={label}>Support Portal Name<Req /></label>
          <input className={input} value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Support Portal Name" />
        </div>
        <div>
          <label className={label}>Company<Req /></label>
          <select className={`${input} app-select`} value={value.company} onChange={(e) => set('company', e.target.value)}>
            <option value="">Select</option>
            {COMPANIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Support Portal URL<Req /></label>
          <input className={input} value={value.url} onChange={(e) => set('url', e.target.value)} placeholder="Support Portal URL" />
        </div>
        <div>
          <label className={label}>Identity Provider</label>
          <select className={`${input} app-select`} value={value.idp} onChange={(e) => set('idp', e.target.value)}>
            {IDPS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>

      {/* ⚠️ Removed, not greyed, until a provider is chosen — enforcing SSO with no SSO configured
          is a switch with nothing behind it, and the same rule the Branding panel follows. */}
      {value.idp !== IDPS[0] && (
        <div className="mt-6">
          <label className={label}>Enforce to authenticate with Single Sign-On Only</label>
          <button
            role="switch"
            aria-checked={value.ssoOnly}
            onClick={() => set('ssoOnly', !value.ssoOnly)}
            className={`relative mt-1 inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors ${value.ssoOnly ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}
          >
            <span className={`inline-block size-[14px] rounded-full bg-white transition-transform ${value.ssoOnly ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
      )}
    </>
  );
}

/** Name, Company and URL are required — see the note on Create's Save. */
export const detailsReady = (d: PortalDetails) => !!(d.name.trim() && d.company.trim() && d.url.trim());

/* Edit details — the same five questions, on a portal that already exists.
 *
 * ⚠️ It opens IMMEDIATELY after a Copy. A duplicate inherits everything including the URL, and two
 * portals cannot answer on one address — so rather than creating a quiet conflict and waiting for
 * someone to find it, the copy asks for the details that have to differ at the moment it is made. */
export function EditPortalDetailsModal({ title, initial, onClose, onSave }: {
  title: string;
  initial: PortalDetails;
  onClose: () => void;
  onSave: (d: PortalDetails) => void;
}) {
  const [d, setD] = useState<PortalDetails>(initial);
  const ready = detailsReady(d);
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-[#0F172A]/40 p-6 pt-[10vh]">
      <div className="flex w-full max-w-[880px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_48px_-12px_rgba(16,24,40,0.25)]">
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-3.5">
          <h2 className="flex-1 text-[16px] font-semibold text-[#364658]">{title}</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>
        <div className="px-5 py-5"><PortalDetailsFields value={d} onChange={setD} /></div>
        <div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button onClick={onClose} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button
            onClick={() => ready && onSave(d)}
            disabled={!ready}
            title={ready ? undefined : 'Name, Company and URL are required'}
            className={`inline-flex h-9 items-center rounded px-4 text-[13px] font-medium text-white transition-colors ${
              ready ? 'bg-[#3D8BD0] hover:bg-[#2d6ca0]' : 'cursor-not-allowed bg-[#B6C2D5]'
            }`}
          >Save</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The two-dot progress marker. Says which step you are on and whether the other is reachable. */
function Steps({ step, canGoBack, onBack }: { step: 1 | 2; canGoBack: boolean; onBack: () => void }) {
  const rows: { n: 1 | 2; title: string }[] = [
    { n: 1, title: 'Support portal details' },
    { n: 2, title: 'Support portal customization' },
  ];
  /* ⚠️ A GREY BAND with a chevron between the steps, not two blue dots on a rule. The rule read as
     a progress bar that was always half full — it said the same thing on both steps — while the two
     identically-blue circles gave no way to tell where you WERE from where you had BEEN. Here the
     finished step is greyed with a tick, the current one is dark with its number, and the chevron
     points the way through: three signals that each say one thing.
     ⚠️ The tick is #3D8BD0, not the reference's green. Green is this product's healthy/success
     colour and a completed step is neither — it is simply behind you. */
  return (
    <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F7F9FC] px-5 py-2.5">
      {rows.map((r, i) => {
        const done = step > r.n;
        const on = step === r.n;
        /* ⚠️ Step 1 stays clickable from step 2 — the details are editable until you leave, and a
           marker you cannot press is a picture of progress rather than a way through it. Step 2 is
           NOT clickable from step 1: it has nothing to show until the portal exists. */
        const clickable = r.n === 1 && canGoBack;
        return (
          <div key={r.n} className="flex items-center gap-2">
            <button
              onClick={clickable ? onBack : undefined}
              disabled={!clickable}
              className={`flex items-center gap-2 rounded px-1.5 py-1 text-left transition-colors ${
                clickable ? 'cursor-pointer hover:bg-[#EEF2F6]' : 'cursor-default'
              }`}
            >
              <span
                className={`flex size-[20px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                  done ? 'bg-[#3D8BD0] text-white'
                    : on ? 'bg-[#364658] text-white'
                      : 'border border-[#DFE5ED] bg-white text-[#9CA3AF]'
                }`}
              >{done ? <Check size={11} strokeWidth={3} /> : r.n}</span>
              <span className={`text-[13px] ${
                on ? 'font-semibold text-[#364658]' : done ? 'text-[#9CA3AF]' : 'text-[#C3CBD6]'
              }`}>{r.title}</span>
            </button>
            {i === 0 && <ChevronRight size={14} className="flex-shrink-0 text-[#C3CBD6]" />}
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
  const [category, setCategory] = useState<string>('All');

  /* ⚠️ Save is DISABLED until the three required fields are filled, rather than validating after
     the click. A button that can only tell you what is wrong once you press it makes you press it
     to find out. */
  const ready = detailsReady(d);

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
              <PortalDetailsFields value={d} onChange={setD} />
            </div>

            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
              <button onClick={onClose} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
              {/* ⚠️ The label CHANGES once the portal exists. The first Save creates a Draft; every
                  later one edits that same record — so a button still reading "Save" would be doing
                  something different from what it says, and the old behaviour (a second Save made a
                  SECOND portal) was exactly that difference going unannounced. */}
              <button
                onClick={save}
                disabled={!ready}
                title={ready ? undefined : 'Name, Company and URL are required'}
                className={`inline-flex h-9 items-center rounded px-4 text-[13px] font-medium text-white transition-colors ${
                  ready ? 'bg-[#3D8BD0] hover:bg-[#2d6ca0]' : 'cursor-not-allowed bg-[#B6C2D5]'
                }`}
              >{saved ? 'Save changes' : 'Save'}</button>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {/* ⚠️ ONE screen, not a fork. Step 2 used to open on two big cards — "Create from
                    scratch" and "Use Template" — which asked you to choose a KIND of start before
                    you could see any of the starts. From-scratch is one row and the templates are
                    six tiles: they fit together, so the question was costing a click to answer
                    something the screen could simply show.
                    ⚠️ From-scratch is an IMMEDIATE action, exactly like a template tile. Every
                    starting point on this screen is one click, so there is no selected state to
                    carry and no Create button to press afterwards. */}
                <button
                  onClick={onScratch}
                  className="flex w-full items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]"
                >
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><PenLine size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[#364658]">Start from scratch</span>
                    <span className="mt-0.5 block text-[12px] leading-[1.5] text-[#7B8FA5]">An empty page you build block by block.</span>
                  </span>
                  <ChevronRight size={16} className="flex-shrink-0 text-[#C3CBD6]" />
                </button>

                <div className="mt-5 flex items-center gap-2 border-t border-[#E5E7EB] pt-5">
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
                  {/* ⚠️ The DEFAULT is the grid's FIRST TILE, in every category. It used to sit in a
                      band of its own above the templates, labelled "Start from your portal", on the
                      reasoning that a tile eighth in a row of eight cannot say "this is the one your
                      requesters see today". The badge says it instead — and pinning it first means
                      the one starting point that always applies is always in the same place, which
                      the separate band could only achieve by not being a template at all.
                      ⚠️ It ignores the category chips, because it HAS no category: it is not an IT
                      or an HR layout, it is the portal that already exists. */}
                  <button
                    onClick={() => onTemplate(null)}
                    className="overflow-hidden rounded-lg border border-[#3D8BD0]/40 bg-white text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]"
                  >
                    <TemplateArt layout="portal" accent="#3D8BD0" />
                    <span className="block px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-[#364658]">Support Portal</span>
                        <span className="flex-shrink-0 rounded bg-[#E8F1FB] px-1.5 py-0.5 text-[10px] font-medium text-[#3D8BD0]">Default</span>
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-[11px] leading-[1.5] text-[#9CA3AF]">
                        The standard ServiceOps portal your requesters see today.
                      </span>
                    </span>
                  </button>
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

                {/* ⚠️ The "start from a blank page instead" link is GONE. It existed because you had
                    to commit to the template ROUTE before you could see any templates, so the screen
                    owed you a way back out. With from-scratch sitting at the top of this same
                    screen, the link was a second door to a room you are already standing in. */}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
