import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Plus, Sparkles, X } from 'lucide-react';
import { OwnerPicker, inputCls } from './AdminWorkspaceForm';
import { WorkspaceIcon, WorkspaceRowBody, tint } from './workspaceUi';
import { CREATABLE_TYPES, KIND_TEMPLATE, MAX_DESCRIPTION, MAX_NAME, TYPE_COLOUR, TYPE_LABEL } from './workspaceData';
import type { Workspace, WorkspaceDraft, WorkspaceType } from './workspaceData';

/* Add Workspace — two steps in one modal. ESM F01 (UI 2026-10-21; fields per the brief of 2026-10-28).
 *   1 Select a template: template tiles, then a dashed "Start from Scratch" card set apart by "or";
 *     "What's included" opens under them.
 *   2 Workspace details: live row preview, then Name · Description · Workspace Type · Workspace Admin(s).
 * Create makes the workspace in Setup and opens its Overview (the setup guide). Templates only seed
 * configuration: no separate instance, no user accounts. The chosen Workspace Admins become members with
 * the Workspace Admin role — an explicit permission, not an "owner" label. */

interface AdminWorkspaceCreateProps {
  workspaces: Workspace[];
  onCancel: () => void;
  onCreate: (draft: WorkspaceDraft) => void;
  /** Set when the last create attempt failed; the modal stays open with the message. */
  error?: string;
}

const TYPE_TINT = TYPE_COLOUR;

const STEPS = [
  { n: 1, title: 'Select a template', sub: 'What kind of team is it for?' },
  { n: 2, title: 'Workspace details', sub: 'Name, type and its admins' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#EEF1F5] bg-white p-5">
      <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Label({ htmlFor, children, required, hint }: { htmlFor?: string; children: ReactNode; required?: boolean; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-[#364658]">{children}{required && <span className="ml-0.5 text-[#DC2626]">*</span>}</label>
      {hint && <span className="text-[11px] text-[#94A3B8]">{hint}</span>}
    </div>
  );
}

const Err = ({ msg }: { msg?: string }) => (msg ? <p className="mt-1.5 text-[12px] text-[#DC2626]">{msg}</p> : null);

export function AdminWorkspaceCreate({ workspaces, onCancel, onCreate, error }: AdminWorkspaceCreateProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<WorkspaceType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adminIds, setAdminIds] = useState<number[]>([]);
  const [colour, setColour] = useState(TYPE_TINT.it);
  const [submitted, setSubmitted] = useState(false);

  /* Escape closes the innermost thing: an open dropdown first, then the modal. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[data-radix-popper-content-wrapper]')) return;
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const defaultName = (t: WorkspaceType) => (t === 'general' || t === 'it' ? '' : t === 'hr' ? 'Human Resources' : TYPE_LABEL[t]);
  const pick = (t: WorkspaceType) => {
    // The kind's own colour and name are the natural defaults; both stay editable.
    if (!name || (type && name === defaultName(type))) setName(defaultName(t));
    setType(t);
    setColour(TYPE_TINT[t]);
  };

  const errors: Record<string, string | undefined> = {
    name: !name.trim() ? 'Give the workspace a name.'
      : workspaces.some((d) => d.name.trim().toLowerCase() === name.trim().toLowerCase()) ? 'A workspace with this name already exists.'
        : undefined,
    admins: adminIds.length === 0 ? 'Choose at least one Workspace Admin.' : undefined,
  };
  const show = (k: string) => (submitted ? errors[k] : undefined);

  const submit = () => {
    setSubmitted(true);
    if (!type || Object.values(errors).some(Boolean)) return;
    onCreate({ name: name.trim(), type, description: description.trim(), adminIds, colour });
  };

  const accent = type ? colour : '#3D8BD0';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F172A]/55 p-4 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="ws-create-title"
        className="flex h-[min(680px,calc(100vh-32px))] w-[1000px] max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">

        {/* Rail */}
        <aside className="relative hidden w-[260px] flex-shrink-0 flex-col overflow-hidden px-6 py-7 text-white transition-colors duration-500 md:flex"
          style={{ background: `linear-gradient(160deg, ${accent} 0%, ${tint(accent, 0.75)} 55%, #1F2D3D 140%)` }}>
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              {type ? <span className="scale-[0.9] rounded-lg bg-white"><WorkspaceIcon type={type} colour={colour} /></span> : <Sparkles size={20} />}
            </div>
            <h2 id="ws-create-title" className="mt-4 text-[20px] font-semibold leading-tight">{step === 2 && name.trim() ? name.trim() : 'Add Workspace'}</h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-white/80">Give a team its own service desk in ServiceOps.</p>
          </div>
          <ol className="relative mt-8 space-y-1">
            {STEPS.map((s, i) => {
              const done = step > s.n;
              const on = step === s.n;
              return (
                <li key={s.n} className="relative flex gap-3 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && <span className={`absolute left-[13px] top-8 h-[calc(100%-28px)] w-0.5 rounded-full ${done ? 'bg-white' : 'bg-white/30'}`} />}
                  <span className={`relative z-10 flex size-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                    done ? 'bg-white text-[#15803D]' : on ? 'bg-white text-[#1F2D3D]' : 'border border-white/50 text-white/80'
                  }`}>{done ? <Check size={14} strokeWidth={3} /> : s.n}</span>
                  <span className={on || done ? 'text-white' : 'text-white/70'}>
                    <span className="block text-[14px] font-semibold">{s.title}</span>
                    <span className="block text-[12px] opacity-80">{s.sub}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="relative mt-auto rounded-lg bg-white/15 px-3 py-2.5 text-[12px] leading-[1.5] text-white/90">
            Starts in <strong className="font-semibold">Setup</strong>. Employees can’t see it until you make it Live.
          </p>
        </aside>

        {/* Step */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-[#EEF1F5] px-7 py-5">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-[#3D8BD0]">Step {step} of 2</div>
              <h3 className="mt-0.5 text-[18px] font-semibold text-[#1F2D3D]">{step === 1 ? 'Select a template' : 'Workspace details'}</h3>
            </div>
            <button onClick={onCancel} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F3F4F6]"><X size={18} /></button>
          </header>

          <div key={step} className="min-h-0 flex-1 overflow-y-auto bg-[#FAFBFC] px-7 py-6 animate-in fade-in slide-in-from-right-2 duration-200">
            {step === 1 ? (
              <>
                <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Start from a template</div>
                <div role="radiogroup" aria-label="Template" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {CREATABLE_TYPES.filter((t) => t.value !== 'general').map((t) => {
                    const on = type === t.value;
                    return (
                      <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => pick(t.value)}
                        className={`group relative flex flex-col items-start rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${on ? 'shadow-md' : 'border-[#E5E7EB]'}`}
                        style={on ? { borderColor: TYPE_TINT[t.value], boxShadow: `0 0 0 1px ${TYPE_TINT[t.value]}` } : undefined}
                      >
                        {on && <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full text-white animate-in zoom-in duration-150" style={{ backgroundColor: TYPE_TINT[t.value] }}><Check size={12} strokeWidth={3} /></span>}
                        <WorkspaceIcon type={t.value} colour={TYPE_TINT[t.value]} />
                        <span className="mt-3 block text-[15px] font-semibold text-[#1F2D3D]">{TYPE_LABEL[t.value]}</span>
                        <span className="mt-1 block text-[12px] leading-[1.5] text-[#7B8FA5]">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  <span className="h-px flex-1 bg-[#E5E7EB]" /> or <span className="h-px flex-1 bg-[#E5E7EB]" />
                </div>
                {/* ⚠️ Kept apart from the templates on purpose (Juli, 2026-10-23): it is not "one more team",
                    it is the way out when no template fits, so it must read differently at a glance. */}
                <button type="button" role="radio" aria-checked={type === 'general'} onClick={() => pick('general')}
                  className={`group relative flex w-full items-center gap-4 rounded-xl border-2 border-dashed p-4 text-left transition-all hover:shadow-md ${
                    type === 'general' ? 'bg-[#EEF2FF]' : 'border-[#CBD5E1] bg-white hover:border-[#818CF8]'
                  }`}
                  style={type === 'general' ? { borderColor: TYPE_TINT.general } : undefined}
                >
                  <span className="flex size-11 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed transition-colors group-hover:bg-[#EEF2FF]"
                    style={{ borderColor: tint(TYPE_TINT.general, 0.45), color: TYPE_TINT.general }}>
                    <Plus size={20} strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[#1F2D3D]">Start from Scratch</span>
                    <span className="mt-0.5 block text-[12px] leading-[1.5] text-[#7B8FA5]">
                      For any other team (Marketing, Procurement, Admin…). Only three basic request types and no suggested groups; you build the rest.
                    </span>
                  </span>
                  {type === 'general'
                    ? <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full text-white animate-in zoom-in duration-150" style={{ backgroundColor: TYPE_TINT.general }}><Check size={12} strokeWidth={3} /></span>
                    : <span className="flex-shrink-0 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-medium text-[#64748B]">Blank</span>}
                </button>

                {type && (
                  <div key={type} className="mt-5 overflow-hidden rounded-xl border bg-white animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ borderColor: tint(TYPE_TINT[type], 0.35) }}>
                    <div className="flex items-center gap-2 px-5 py-3 text-[13px] font-semibold text-[#1F2D3D]" style={{ background: tint(TYPE_TINT[type], 0.08) }}>
                      <Sparkles size={14} style={{ color: TYPE_TINT[type] }} /> {type === 'general' ? 'What a blank workspace starts with' : `What’s included in the ${TYPE_LABEL[type]} template`}
                    </div>
                    <div className="grid grid-cols-1 gap-5 px-5 py-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Request types</div>
                        <ul className="space-y-1.5">{KIND_TEMPLATE[type].requests.map((r) => <li key={r} className="flex items-center gap-2 text-[13px] text-[#364658]"><Check size={13} className="text-[#22C55E]" />{r}</li>)}</ul>
                      </div>
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Technician groups</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(KIND_TEMPLATE[type].groups.length ? KIND_TEMPLATE[type].groups : ['One team group']).map((g) => <span key={g} className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-0.5 text-[12px] text-[#475569]">{g}</span>)}
                        </div>
                        <ul className="mt-3 space-y-1">{KIND_TEMPLATE[type].includes.map((x) => <li key={x} className="flex items-center gap-2 text-[12px] text-[#475569]"><Check size={12} className="text-[#22C55E]" />{x}</li>)}</ul>
                        <p className="mt-3 text-[12px] leading-[1.5] text-[#94A3B8]">Starting configuration only, all editable later. It creates no user accounts.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {type && (
                  <div className="rounded-xl border border-[#DCEBFA] bg-white px-5 py-4 shadow-sm">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]"><Sparkles size={12} /> How it will appear in Workspaces</div>
                    <WorkspaceRowBody d={{ name: name.trim(), type, colour, status: 'setup', isDefault: false, adminIds, description: description.trim() }} />
                  </div>
                )}
                <Section title="Basics">
                  <div>
                    <Label htmlFor="ws-name" required hint={`${name.length}/${MAX_NAME}`}>Workspace name</Label>
                    <input id="ws-name" autoFocus value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} placeholder={type === 'it' ? 'e.g. IT Europe' : type === 'general' ? 'e.g. Marketing' : 'e.g. Human Resources'} className={inputCls(show('name'))} />
                    <Err msg={show('name')} />
                  </div>
                  <div>
                    <Label htmlFor="ws-desc" hint={`${description.length}/${MAX_DESCRIPTION}`}>What does this team handle?</Label>
                    <textarea id="ws-desc" value={description} maxLength={MAX_DESCRIPTION} onChange={(e) => setDescription(e.target.value)} rows={2}
                      placeholder={`e.g. ${type && type !== 'general' && type !== 'it' ? CREATABLE_TYPES.find((t) => t.value === type)!.desc : 'What requests this team takes'}`}
                      className="w-full resize-none rounded border border-[#d1d5db] bg-white px-3 py-2 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
                  </div>
                </Section>
                <Section title="Type and administration">
                  <div>
                    <Label htmlFor="ws-type" required hint="From the template">Workspace Type</Label>
                    <select id="ws-type" value={type ?? ''} onChange={(e) => pick(e.target.value as WorkspaceType)} className="app-select h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]">
                      {CREATABLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.value === 'general' ? 'General (from scratch)' : TYPE_LABEL[t.value]}</option>)}
                    </select>
                    <p className="mt-1.5 text-[12px] text-[#94A3B8]">Can change while the workspace is in Setup; locked once it goes Live.</p>
                  </div>
                  <div>
                    <Label required hint="Members with the Workspace Admin role">Workspace Admins</Label>
                    <OwnerPicker value={adminIds} onChange={setAdminIds} error={show('admins')} />
                    <Err msg={show('admins')} />
                    {!show('admins') && <p className="mt-1.5 text-[12px] text-[#94A3B8]">They manage this workspace’s team and configuration, with Global Access to its tickets.</p>}
                  </div>
                </Section>
                {error && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#991B1B]">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span><strong className="font-semibold">Couldn’t create the workspace.</strong> {error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="flex items-center gap-2 border-t border-[#EEF1F5] px-7 py-4">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]"><ArrowLeft size={15} /> Change template</button>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={onCancel} className="inline-flex h-10 items-center rounded-lg border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]">Cancel</button>
              {step === 1 ? (
                <button onClick={() => setStep(2)} disabled={!type} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#3D8BD0] px-5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-50">Continue <ArrowRight size={15} /></button>
              ) : (
                <button onClick={submit} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#3D8BD0] px-5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#2d6ca0]"><Check size={15} /> Create Workspace</button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
