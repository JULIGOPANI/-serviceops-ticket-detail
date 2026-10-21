import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Lock, Sparkles, X } from 'lucide-react';
import { Field, OwnerPicker, inputCls } from './AdminDeskForm';
import { DeskIcon, DeskRowBody } from './deskUi';
import { CODE_PATTERN, COLOURS, CREATABLE_TYPES, KIND_TEMPLATE, MAX_DESCRIPTION, MAX_NAME, TYPE_LABEL, codeFrom } from './deskData';
import type { Desk, DeskDraft, DeskType } from './deskData';

/* New desk — a two-step guided flow in one modal. ESM F01.
 *
 *   1. What kind of desk?  Tiles, one per kind (IT shown but taken). Picking one shows WHAT'S
 *      INCLUDED (suggested request types and groups) beside the tiles, as Freshservice previews a
 *      template; Continue moves on.
 *   2. Details, with the desk's ROW previewed live above the form, exactly as it will appear in
 *      the Desks list, so the colour, code and owners are judged in place rather than imagined.
 *   Create opens the new desk's own page, where Get started takes over.
 *
 * The desk is created in Setup. Nothing else is asked here: who works in it (F02) and which
 * settings it owns (F04) are separate decisions, not create-time questions. */

interface AdminDeskCreateProps {
  desks: Desk[];
  onCancel: () => void;
  onCreate: (draft: DeskDraft) => void;
}

const TYPE_TINT: Record<DeskType, string> = {
  it: '#3D8BD0', hr: '#7C3AED', facilities: '#0D9488', finance: '#D97706', legal: '#64748B', general: '#4F46E5',
};

export function AdminDeskCreate({ desks, onCancel, onCreate }: AdminDeskCreateProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<DeskType | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [ownerIds, setOwnerIds] = useState<number[]>([]);
  const [colour, setColour] = useState(COLOURS[1]);
  const [submitted, setSubmitted] = useState(false);

  const takenCodes = desks.map((d) => d.code);
  useEffect(() => {
    if (!codeTouched) setCode(codeFrom(name, takenCodes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, codeTouched]);

  /* Escape closes the innermost thing: an open dropdown first, then the modal. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[data-radix-popper-content-wrapper]')) return;
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const pick = (t: DeskType) => {
    setType(t);
    // The type's own colour is the natural default; the admin can still change it.
    setColour(TYPE_TINT[t]);
    if (!name || Object.values(TYPE_LABEL).includes(name) || name === 'Human Resources') setName(t === 'general' ? '' : TYPE_LABEL[t] === 'HR' ? 'Human Resources' : TYPE_LABEL[t]);
  };

  const errors: Record<string, string | undefined> = {
    name: !name.trim() ? 'Give the desk a name.'
      : desks.some((d) => d.name.trim().toLowerCase() === name.trim().toLowerCase()) ? 'A desk with this name already exists.'
        : undefined,
    code: !code ? 'Short code is required.'
      : !CODE_PATTERN.test(code) ? 'Use 2–6 capital letters or numbers, starting with a letter.'
        : takenCodes.includes(code) ? `${code} is already used by another desk.`
          : undefined,
    owners: ownerIds.length === 0 ? 'Add at least one owner.' : undefined,
  };
  const show = (k: string) => (submitted ? errors[k] : undefined);

  const submit = () => {
    setSubmitted(true);
    if (!type || Object.values(errors).some(Boolean)) return;
    onCreate({ name: name.trim(), type, code, description: description.trim(), ownerIds, colour });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="desk-create-title"
        className="flex max-h-[min(720px,calc(100vh-32px))] w-[880px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Header with the two steps */}
        <div className="flex items-center gap-4 border-b border-[#EEF1F5] px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="desk-create-title" className="text-[17px] font-semibold text-[#1F2D3D]">New desk</h2>
            <ol className="mt-1.5 flex items-center gap-2 text-[12px]">
              {['Kind of desk', 'Details'].map((label, i) => {
                const n = (i + 1) as 1 | 2;
                const done = step > n;
                const on = step === n;
                return (
                  <li key={label} className="flex items-center gap-2">
                    {i > 0 && <span className="h-px w-6 bg-[#DFE5ED]" />}
                    <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                      done ? 'bg-[#22C55E] text-white' : on ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF1F5] text-[#7B8FA5]'
                    }`}>{done ? <Check size={11} strokeWidth={3} /> : n}</span>
                    <span className={on ? 'font-medium text-[#364658]' : 'text-[#7B8FA5]'}>{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <button onClick={onCancel} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-[#F3F4F6]"><X size={18} className="text-[#64748B]" /></button>
        </div>

        {step === 1 ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="px-6 py-6">
            <p className="text-[14px] text-[#475569]">Which team is this desk for?</p>
            <div role="radiogroup" aria-label="Kind of desk" className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CREATABLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={type === t.value}
                  onClick={() => pick(t.value)}
                  className={`group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-md ${
                    type === t.value ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#E5E7EB]'
                  }`}
                >
                  <DeskIcon type={t.value} colour={TYPE_TINT[t.value]} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[#1F2D3D]">{TYPE_LABEL[t.value]}</span>
                    <span className="mt-0.5 block text-[12px] leading-[1.5] text-[#7B8FA5]">{t.desc}</span>
                  </span>
                </button>
              ))}
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] p-4 opacity-80" aria-disabled="true">
                <DeskIcon type="it" colour="#94A3B8" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#64748B]">IT <Lock size={12} /></span>
                  <span className="mt-0.5 block text-[12px] leading-[1.5] text-[#94A3B8]">Already set up. Every ServiceOps has exactly one IT desk.</span>
                </span>
              </div>
            </div>
          </div>
          {/* What's included — Freshservice previews a template before you pick it (seen live 2026-10-16). */}
          <aside className="border-t border-[#EEF1F5] bg-[#F8FAFC] px-5 py-6 md:border-l md:border-t-0">
            {type ? (
              <div key={type} className="animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="flex items-center gap-2.5">
                  <DeskIcon type={type} colour={TYPE_TINT[type]} />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">What’s included</div>
                    <div className="text-[15px] font-semibold text-[#1F2D3D]">{TYPE_LABEL[type]} desk</div>
                  </div>
                </div>
                <div className="mt-4 text-[12px] font-semibold text-[#475569]">Suggested request types</div>
                <ul className="mt-1.5 space-y-1">
                  {KIND_TEMPLATE[type].requests.map((r) => <li key={r} className="flex items-center gap-2 text-[13px] text-[#364658]"><Check size={13} className="text-[#22C55E]" />{r}</li>)}
                </ul>
                {KIND_TEMPLATE[type].groups.length > 0 && (
                  <>
                    <div className="mt-4 text-[12px] font-semibold text-[#475569]">Suggested groups</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">{KIND_TEMPLATE[type].groups.map((g) => <span key={g} className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-0.5 text-[12px] text-[#475569]">{g}</span>)}</div>
                  </>
                )}
                <p className="mt-4 text-[12px] leading-[1.6] text-[#7B8FA5]">You review and change all of this after creating the desk.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-[13px] text-[#94A3B8]">Pick a kind to see what’s included.</div>
            )}
          </aside>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {type && (
              <div className="sticky top-0 z-10 border-b border-[#EEF1F5] bg-[#F8FAFC] px-6 py-4">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                  <Sparkles size={12} /> How it will appear in Desks
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
                  <DeskRowBody d={{ name: name.trim(), code, type, colour, status: 'setup', isDefault: false, ownerIds, description: description.trim() }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-x-6 px-6 py-6 md:grid-cols-2">
              <div>
              <Field id="desk-name" label="Desk name" required error={show('name')}>
                <input id="desk-name" autoFocus value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} placeholder="e.g. Human Resources" className={inputCls(show('name'))} />
              </Field>
              <Field
                id="desk-code"
                label="Short code"
                required
                error={show('code')}
                helper="Suggested from the name. Shows in lists and on tickets. Locked once the desk goes Live."
              >
                <input
                  id="desk-code"
                  value={code}
                  maxLength={6}
                  onChange={(e) => { setCodeTouched(true); setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); }}
                  placeholder="e.g. HR"
                  className={`${inputCls(show('code'))} w-[140px] font-mono tracking-wide`}
                />
              </Field>
              </div>
              <div>
              <Field id="desk-desc" label="What does this team handle?" helper={`${description.length}/${MAX_DESCRIPTION}`}>
                <textarea
                  id="desk-desc"
                  value={description}
                  maxLength={MAX_DESCRIPTION}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Onboarding, payroll, leave and policies"
                  className="w-full resize-none rounded border border-[#d1d5db] bg-white px-3 py-2 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                />
              </Field>
              <Field label="Owners" required error={show('owners')} helper="The people accountable for this desk.">
                <OwnerPicker value={ownerIds} onChange={setOwnerIds} error={show('owners')} />
              </Field>
              <Field label="Colour">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
                  {COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={colour === c}
                      aria-label={c}
                      onClick={() => setColour(c)}
                      className={`flex size-7 items-center justify-center rounded-full ring-offset-2 transition-shadow ${colour === c ? 'ring-2 ring-[#364658]' : 'hover:ring-2 hover:ring-[#CBD5E1]'}`}
                      style={{ backgroundColor: c }}
                    >{colour === c && <Check size={13} strokeWidth={3} className="text-white" />}</button>
                  ))}
                </div>
              </Field>
              <p className="mt-5 text-[12px] leading-[1.6] text-[#7B8FA5]">
                New desks start in <strong className="font-semibold text-[#475569]">Setup</strong>. Employees can't raise requests in it until you make it Live.
              </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-[#EEF1F5] px-6 py-3.5">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]">
              <ArrowLeft size={14} /> Change kind
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={onCancel} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
            {step === 1 && (
              <button onClick={() => setStep(2)} disabled={!type} className="inline-flex h-9 items-center rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-50">Continue</button>
            )}
            {step === 2 && (
              <button onClick={submit} className="inline-flex h-9 items-center rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]">Create desk</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
