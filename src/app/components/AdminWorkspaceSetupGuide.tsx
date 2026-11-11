import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, Check, CornerDownLeft, Inbox, Layers, Lightbulb, Mail, Rocket, Search, X } from 'lucide-react';
import { GUIDE_STEPS, KIND_TEMPLATE, guideState } from './workspaceData';
import type { GuideStep, Workspace } from './workspaceData';
import { WorkspaceIcon } from './workspaceUi';

/* Workspace setup guide — a focused dialog OVER the workspace's settings home, never part of the page. ESM F01 §2n.
 *
 * Reference (Freshservice, re-checked live 2026-10-30, F01c §6): a separate guide over a dimmed page; steps on the
 * left, one step on the right with a picture of the result, one action and "I'll do it later"; never blocks publish.
 * Ours, not a copy: ServiceOps blue rail with a segmented bar (no ring), a LIVE preview that changes as you choose
 * (no illustrations), the action done right in the step (no "Take me there"), Go Live without an "I'm ready" box.
 * Entry: a "Set up · n/3" button in the settings header; opens on its own the first time after Create. */

interface SetupPanelProps {
  workspace: Workspace;
  canGoLive: boolean;
  onEmail: (email: string) => void;
  onComplete: (step: 'catalog' | 'knowledge', items: string[]) => void;
  onMark: (step: GuideStep, state: 'skipped' | 'todo') => void;
  onGoLive: () => void;
}

type StepState = 'done' | 'skipped' | 'todo';
type Pane = GuideStep | 'live';

const COPY: Record<Pane, { title: string; line: string; icon: typeof Mail }> = {
  email: { title: 'Connect a support email', line: 'Every email sent here becomes a request in this workspace.', icon: Mail },
  catalog: { title: 'Set up the service catalog', line: 'The services employees can request. Keep the ones you need.', icon: Layers },
  knowledge: { title: 'Publish help articles', line: 'Answers employees see before they raise a request.', icon: Lightbulb },
  live: { title: 'Go live', line: 'Make the workspace available to everyone.', icon: Rocket },
};
const RAIL: Record<Pane, string> = { email: 'Support email', catalog: 'Service catalog', knowledge: 'Knowledge base', live: 'Go live' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const primary = 'inline-flex h-9 items-center gap-1.5 rounded-md bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-40';
const later = 'h-9 rounded-md px-3 text-[13px] font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#364658]';

const seenKey = (id: number) => `serviceops.esm.setupSeen.${id}`;
const seen = (id: number) => { try { return localStorage.getItem(seenKey(id)) === '1'; } catch { return true; } };
const markSeen = (id: number) => { try { localStorage.setItem(seenKey(id), '1'); } catch { /* storage unavailable */ } };

export function WorkspaceSetupPanel(p: SetupPanelProps) {
  const { workspace: w } = p;
  const states = GUIDE_STEPS.map((s) => guideState(w, s.id));
  const done = states.filter((s) => s === 'done').length;
  const fresh = states.every((s) => s === 'todo');
  const [open, setOpen] = useState(() => fresh && !seen(w.id));
  useEffect(() => { if (open) markSeen(w.id); }, [open, w.id]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex h-8 items-center gap-2 rounded-full border border-[#CFE0F1] bg-[#F5FAFF] pl-2 pr-3 text-[12px] font-medium text-[#1F5F99] transition-colors hover:bg-[#EBF5FF]">
        <span className="flex gap-0.5">{states.map((s, i) => <span key={i} className={`h-1.5 w-3 rounded-full ${s === 'done' ? 'bg-[#22C55E]' : s === 'skipped' ? 'bg-[#93C5FD]' : 'bg-[#DCE7F3]'}`} />)}</span>
        Set up · {done}/{GUIDE_STEPS.length}
      </button>
      {open && <SetupDialog {...p} states={states} onClose={() => setOpen(false)} />}
    </>
  );
}

function SetupDialog({ workspace: w, canGoLive, onEmail, onComplete, onMark, onGoLive, states, onClose }: SetupPanelProps & { states: StepState[]; onClose: () => void }) {
  const stateOf = (id: GuideStep) => states[GUIDE_STEPS.findIndex((s) => s.id === id)];
  const [pane, setPane] = useState<Pane>(() => GUIDE_STEPS.find((s) => guideState(w, s.id) === 'todo')?.id ?? 'live');
  const panes: Pane[] = [...GUIDE_STEPS.map((s) => s.id), 'live'];
  const next = () => setPane(panes[Math.min(panes.indexOf(pane) + 1, panes.length - 1)]);
  const doLater = () => { if (pane !== 'live' && stateOf(pane) === 'todo') onMark(pane, 'skipped'); next(); };
  const handled = states.filter((s) => s !== 'todo').length;

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F172A]/45 p-4 animate-in fade-in duration-150" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal aria-label={`Set up ${w.name}`} className="flex h-[min(560px,92vh)] w-[min(940px,100%)] overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Rail */}
        <aside className="hidden w-[270px] flex-shrink-0 flex-col bg-gradient-to-b from-[#1F5F99] to-[#3D8BD0] p-5 text-white md:flex">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-white/95 p-0.5"><WorkspaceIcon type={w.type} colour={w.colour} /></span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">Set up {w.name}</p>
              <p className="text-[12px] text-white/70">Optional · skip anything</p>
            </div>
          </div>
          <div className="mt-4 flex gap-1">{states.map((s, i) => <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${s === 'done' ? 'bg-white' : s === 'skipped' ? 'bg-white/45' : 'bg-white/20'}`} />)}</div>
          <p className="mt-1.5 text-[11px] text-white/70">{states.filter((s) => s === 'done').length} of {GUIDE_STEPS.length} done{handled > states.filter((s) => s === 'done').length ? ` · ${handled - states.filter((s) => s === 'done').length} for later` : ''}</p>

          <nav className="mt-6 space-y-1">
            {panes.map((id, i) => {
              const st: StepState = id === 'live' ? 'todo' : stateOf(id);
              const on = pane === id;
              return (
                <button key={id} onClick={() => setPane(id)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${on ? 'bg-white text-[#1F2D3D] shadow-sm' : 'text-white/90 hover:bg-white/10'}`}>
                  <span className={`flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${st === 'done' ? 'bg-[#22C55E] text-white' : on ? 'bg-[#3D8BD0] text-white' : st === 'skipped' ? 'border border-dashed border-white/60' : 'bg-white/20'}`}>
                    {st === 'done' ? <Check size={13} strokeWidth={3} /> : id === 'live' ? <Rocket size={12} /> : i + 1}
                  </span>
                  <span className="flex-1 text-[13px] font-medium">{RAIL[id]}</span>
                  {st === 'skipped' && <span className={`text-[11px] ${on ? 'text-[#94A3B8]' : 'text-white/60'}`}>Later</span>}
                </button>
              );
            })}
          </nav>
          <p className="mt-auto text-[11px] leading-[1.5] text-white/65">Close any time. Pick it up again from “Set up” on this page.</p>
        </aside>

        {/* Step */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div key={pane} className="flex flex-1 flex-col overflow-y-auto px-7 pb-5 pt-6 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="flex items-start gap-3">
              <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF5FF] text-[#3D8BD0]">{(() => { const I = COPY[pane].icon; return <I size={19} />; })()}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[18px] font-semibold text-[#1F2D3D]">{COPY[pane].title}</h2>
                <p className="mt-0.5 text-[13px] text-[#64748B]">{COPY[pane].line}</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex size-8 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#364658]"><X size={17} /></button>
            </div>

            {pane === 'email' && <EmailStep w={w} state={stateOf('email')} onLater={doLater} onSave={(e) => { onEmail(e); next(); }} />}
            {pane === 'catalog' && <PickStep key="c" w={w} kind="catalog" state={stateOf('catalog')} options={KIND_TEMPLATE[w.type].requests} initial={w.setup.catalogItems} onLater={doLater} onSave={(x) => { onComplete('catalog', x); next(); }} />}
            {pane === 'knowledge' && <PickStep key="k" w={w} kind="knowledge" state={stateOf('knowledge')} options={KIND_TEMPLATE[w.type].articles} initial={w.setup.articles} onLater={doLater} onSave={(x) => { onComplete('knowledge', x); next(); }} />}
            {pane === 'live' && <LiveStep w={w} states={states} canGoLive={canGoLive} onOpen={setPane} onLater={onClose} onGoLive={() => { onClose(); onGoLive(); }} />}
          </div>
        </section>
      </div>
    </div>
  );
}

/* Grey stage that holds the live preview, then the controls, then the footer. */
function Body({ preview, controls, footer }: { preview: ReactNode; controls: ReactNode; footer: ReactNode }) {
  return (
    <>
      <div className="mt-5 rounded-xl bg-gradient-to-br from-[#F1F6FC] to-[#EEF0FB] p-5">{preview}</div>
      <div className="mt-5 flex-1">{controls}</div>
      <div className="mt-4 flex items-center justify-end gap-2">{footer}</div>
    </>
  );
}

function PortalFrame({ w, children }: { w: Workspace; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[460px] overflow-hidden rounded-lg border border-white bg-white shadow-[0_6px_20px_rgba(31,95,153,0.12)]">
      <div className="flex items-center gap-1.5 border-b border-[#F0F2F5] px-3 py-2">
        <span className="size-2 rounded-full bg-[#FCA5A5]" /><span className="size-2 rounded-full bg-[#FCD34D]" /><span className="size-2 rounded-full bg-[#86EFAC]" />
        <span className="ml-2 text-[11px] text-[#94A3B8]">Support Portal · {w.name}</span>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

function EmailStep({ w, state, onSave, onLater }: { w: Workspace; state: StepState; onSave: (e: string) => void; onLater: () => void }) {
  const [v, setV] = useState(w.setup.email || `${w.name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'support'}@company.com`);
  const ok = EMAIL.test(v.trim());
  return (
    <Body
      preview={
        <div className="mx-auto flex max-w-[460px] items-center gap-3">
          <div className="flex-1 rounded-lg bg-white p-3 text-[12px] shadow-[0_6px_20px_rgba(31,95,153,0.12)]">
            <p className="flex items-center gap-1.5 text-[#94A3B8]"><Inbox size={12} /> To <span className="truncate font-medium text-[#1F5F99]">{v || '…'}</span></p>
            <p className="mt-1.5 font-medium text-[#364658]">Need help with my reimbursement</p>
          </div>
          <ArrowRight size={18} className="flex-shrink-0 text-[#93C5FD]" />
          <div className="flex-1 rounded-lg bg-white p-3 text-[12px] shadow-[0_6px_20px_rgba(31,95,153,0.12)]">
            <p className="flex items-center gap-1.5 text-[#94A3B8]"><CornerDownLeft size={12} /> New request</p>
            <p className="mt-1.5 font-medium text-[#364658]">in <span className="text-[#1F5F99]">{w.name}</span></p>
          </div>
        </div>
      }
      controls={
        <label className="block max-w-[420px]">
          <span className="mb-1.5 block text-[12px] font-medium text-[#364658]">Support email</span>
          <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ok) onSave(v.trim()); }}
            className={`h-10 w-full rounded-md border px-3 text-[14px] text-[#364658] focus:outline-none focus:ring-2 ${v && !ok ? 'border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#d1d5db] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]/20'}`} />
        </label>
      }
      footer={<>
        <button onClick={onLater} className={later}>{state === 'todo' ? 'I’ll do it later' : 'Next'}</button>
        <button onClick={() => onSave(v.trim())} disabled={!ok} className={primary}>{state === 'done' ? 'Update' : 'Use this email'}</button>
      </>}
    />
  );
}

function PickStep({ w, kind, state, options, initial, onSave, onLater }: {
  w: Workspace; kind: 'catalog' | 'knowledge'; state: StepState; options: string[]; initial?: string[]; onSave: (x: string[]) => void; onLater: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(() => initial ?? options);
  const toggle = (o: string) => setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : options.filter((x) => p.includes(x) || x === o)));
  const n = picked.length;
  const catalog = kind === 'catalog';
  return (
    <Body
      preview={
        <PortalFrame w={w}>
          {catalog ? (
            <div className="grid grid-cols-3 gap-2">
              {picked.map((p) => (
                <div key={p} className="rounded-md border border-[#EEF1F5] p-2 animate-in fade-in zoom-in-95 duration-150">
                  <span className="mb-1.5 flex size-6 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]"><Layers size={12} /></span>
                  <p className="truncate text-[11px] font-medium text-[#364658]">{p}</p>
                </div>
              ))}
              {!n && <p className="col-span-3 py-3 text-center text-[12px] text-[#94A3B8]">No services yet</p>}
            </div>
          ) : (
            <div>
              <div className="mb-2 flex h-7 items-center gap-1.5 rounded border border-[#EEF1F5] px-2 text-[11px] text-[#94A3B8]"><Search size={11} /> How can we help?</div>
              <ul className="space-y-1">
                {picked.map((p) => <li key={p} className="flex items-center gap-2 rounded px-1.5 py-1 text-[12px] text-[#1F5F99] animate-in fade-in duration-150"><BookOpen size={12} className="text-[#F59E0B]" />{p}</li>)}
                {!n && <li className="py-2 text-center text-[12px] text-[#94A3B8]">No articles yet</li>}
              </ul>
            </div>
          )}
        </PortalFrame>
      }
      controls={
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const on = picked.includes(o);
            return (
              <button key={o} onClick={() => toggle(o)} aria-pressed={on}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-all active:scale-95 ${on ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#1F5F99]' : 'border-[#E2E8F0] text-[#94A3B8] hover:text-[#64748B]'}`}>
                {on ? <Check size={12} strokeWidth={3} /> : <span className="size-3 rounded-full border border-[#CBD5E1]" />}{o}
              </button>
            );
          })}
        </div>
      }
      footer={<>
        <button onClick={onLater} className={later}>{state === 'todo' ? 'I’ll do it later' : 'Next'}</button>
        <button onClick={() => onSave(picked)} disabled={!n} className={primary}>{state === 'done' ? 'Update' : catalog ? `Add ${n} service${n === 1 ? '' : 's'}` : `Publish ${n} article${n === 1 ? '' : 's'}`}</button>
      </>}
    />
  );
}

function LiveStep({ w, states, canGoLive, onOpen, onLater, onGoLive }: {
  w: Workspace; states: StepState[]; canGoLive: boolean; onOpen: (p: Pane) => void; onLater: () => void; onGoLive: () => void;
}) {
  const open = GUIDE_STEPS.filter((_, i) => states[i] !== 'done');
  return (
    <Body
      preview={
        <PortalFrame w={w}>
          <p className="mb-2 text-[11px] font-medium text-[#94A3B8]">Which team do you need?</p>
          <div className="grid grid-cols-3 gap-2">
            {['IT', w.name, 'Facilities'].filter((x, i, a) => a.indexOf(x) === i).map((x) => (
              <div key={x} className={`rounded-md border px-2 py-2.5 text-center text-[12px] font-medium ${x === w.name ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#1F5F99] ring-2 ring-[#3D8BD0]/15' : 'border-[#EEF1F5] text-[#94A3B8]'}`}>{x}</div>
            ))}
          </div>
        </PortalFrame>
      }
      controls={
        open.length
          ? <p className="text-[13px] text-[#64748B]">Not done yet: {open.map((s, i) => <span key={s.id}>{i > 0 && ', '}<button onClick={() => onOpen(s.id)} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">{RAIL[s.id]}</button></span>)}. That’s fine — you can finish them after going live.</p>
          : <p className="text-[13px] text-[#15803D]">Everything is set up.</p>
      }
      footer={<>
        <button onClick={onLater} className={later}>I’ll do it later</button>
        {canGoLive ? <button onClick={onGoLive} className={primary}><Rocket size={14} /> Go Live</button> : <span className="text-[12px] text-[#7B8FA5]">An Organization Admin makes it Live.</span>}
      </>}
    />
  );
}
