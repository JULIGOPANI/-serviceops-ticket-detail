/* Support Portal builder — the shared control kit (spec §3).
 *
 * These are the ONLY control types the whole widget specification uses. Every field in every pack
 * and every widget is one of these, which is the point: 24 widgets are a declarative composition of
 * this file, not 24 bespoke panels. If a widget needs something that is not here, it belongs here
 * first.
 *
 * Everything is built from the project's existing chrome — the 32px control height, the 4px
 * `rounded` radius, the #3D8BD0 focus ring, `.app-select`. Nothing new was invented.
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Eraser,
  IndentDecrease, IndentIncrease, Info, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough,
  TriangleAlert, Underline, Undo2, Upload, X,
} from 'lucide-react';

/* ── shared chrome ───────────────────────────────────────────────────────── */

export const inputCls =
  'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

export function Field({ label, help, children, action, divider, tight }: {
  label?: string; help?: string; children: ReactNode; action?: ReactNode;
  /* A hairline and real air above this field. Two icon rows stacked with the same 16px gap read as
     one control with eight buttons — the rule is what says they are two separate questions. */
  divider?: boolean;
  /* A field REVEALED by the toggle above it. It belongs to that switch, so it sits close under it —
     at the normal 16px it read as the next independent question rather than the answer to the one
     you just turned on. */
  tight?: boolean;
}) {
  /* ⚠️ The separating rule is #E5E7EB, the app's standard border. At #F0F2F5 it was technically
     present and practically invisible on white — two stacked icon rows still read as one control
     with eight buttons, which is the exact thing the rule exists to prevent. */
  return (
    <div className={divider ? 'mt-5 border-t border-[#E5E7EB] pt-5' : `${tight ? 'mt-1.5' : 'mt-4'} first:mt-0`}>
      {label && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[12px] font-normal text-[#7B8FA5]">{label}</span>
          {action}
        </div>
      )}
      {children}
      {help && <p className="mt-1.5 text-[11px] leading-[1.5] text-[#9CA3AF]">{help}</p>}
    </div>
  );
}

/* ── Group — collapsible, INDEPENDENT (spec §2.1) ─────────────────────────
 *
 * ⚠️ Not a one-at-a-time accordion. Styling means moving between layout, colour and spacing on one
 * thought; a group that shuts the one you were reading to open the next makes you re-open it every
 * time. Open state is remembered per widget type by the drawer, not here.
 * ⚠️ A group with zero visible fields is never rendered empty — the drawer drops it entirely. */
export function Group({ title, open, onToggle, badge, children }: {
  title: string; open: boolean; onToggle: () => void; badge?: ReactNode; children: ReactNode;
}) {
  /* ⚠️ The HEADER is the detail-page properties-panel recipe, byte for byte: `px-4 py-2.5`, the
     `#F9FAFB` hover, an `#E5E7EB` rule between rows. Those panels' components themselves cannot be
     imported — `TicketFieldsAccordion` takes fourteen mode flags and renders a FIXED field set
     rather than children, so it is a ticket-fields component, not a container — but the chrome is
     the part that has to match, and matching it is what makes the builder read as the same product
     as the drawers rather than a tool bolted onto them.
     `-mx-4` bleeds the row to the panel's edge; a hover that stops short of the edge reads as a
     floating strip rather than a row. */
  return (
    <div className="-mx-4 border-b border-[#E5E7EB] last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
      >
        <span className="text-[13px] font-medium text-[#364658]">{title}</span>
        {badge}
        <ChevronDown size={15} className={`ml-auto flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ── Badge (spec §3) ─────────────────────────────────────────────────────── */

const BADGE_TONE: Record<string, string> = {
  Placed: 'bg-[#ECFDF3] text-[#22A06B]',
  Locked: 'bg-[#FEF3F2] text-[#D92D20]',
  Hidden: 'bg-[#F1F5F9] text-[#64748B]',
  Inherited: 'bg-[#F1F5F9] text-[#64748B]',
  Overridden: 'bg-[#EBF5FF] text-[#3D8BD0]',
};

export const Badge = ({ children }: { children: string }) => (
  <span className={`flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${BADGE_TONE[children] ?? BADGE_TONE.Hidden}`}>
    {children}
  </span>
);

/* ── Notes (spec §3) ─────────────────────────────────────────────────────── */

export function Note({ tone = 'info', children, action }: {
  tone?: 'info' | 'warn'; children: ReactNode; action?: { label: string; onClick: () => void };
}) {
  const warn = tone === 'warn';
  return (
    <div className={`mt-3 flex gap-2 rounded p-2.5 ${warn ? 'bg-[#FFFBEB]' : 'bg-[#F7F9FC]'}`}>
      <span className={`mt-[1px] flex-shrink-0 ${warn ? 'text-[#B54708]' : 'text-[#7B8FA5]'}`}>
        {warn ? <TriangleAlert size={13} /> : <Info size={13} />}
      </span>
      <span className="min-w-0 text-[11px] leading-[1.55] text-[#5B7A99]">
        {children}
        {action && (
          <button onClick={action.onClick} className="ml-1 text-[11px] font-medium text-[#3D8BD0] hover:underline">
            {action.label}
          </button>
        )}
      </span>
    </div>
  );
}

/* ── Inherit row (spec §3, §8.2) ──────────────────────────────────────────
 *
 * Wraps any field that can inherit. It shows the state, names the ancestor the value is coming
 * from, and offers Revert. ⚠️ Revert DELETES the local key rather than writing the parent's current
 * value — a copy looks identical today and drifts the moment the parent changes. */
export function InheritRow({ label, state, from, onRevert, help, children }: {
  label: string;
  state: 'own' | 'inherited' | 'theme';
  from?: string;
  onRevert: () => void;
  help?: string;
  children: ReactNode;
}) {
  return (
    <Field
      label={label}
      help={help}
      /* ⚠️ No Reset and no "Following …" note. The whole design resets from one button at the
         foot of the panel, and a per-field Reset put a control on every row for something almost
         nobody does per row. The inheritance MODEL still works exactly as before — it is just not
         narrated on each line. */
    >{children}</Field>
  );
}

/* ── Text ────────────────────────────────────────────────────────────────── */

export const TextField = ({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
);

export const TextArea = ({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) => (
  <textarea
    rows={rows}
    className={`${inputCls} h-auto py-2 leading-[1.5]`}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);

/* ── Rich text (spec §3, §7.13) ───────────────────────────────────────────
 *
 * Exactly the six controls the spec names. Deliberately NOT the product's full `EditorToolbar` —
 * that is a Gmail-style composer built for a 900px conversation pane, and it does not fit, or
 * belong, in a 400px design panel.
 *
 * ⚠️ The editable area is UNCONTROLLED and only mirrors an external value while unfocused. Writing
 * innerHTML on every keystroke resets the caret to the start, which types text backwards — the same
 * trap the approval-comment editor hit. */
/* The block-format menu.
 *
 * ⚠️ A real dropdown, not a native `<select>`. The select had to reset itself to a placeholder after
 * every use, so it could never say what the caret is standing IN — a format control that cannot
 * report the current format is only half a control. This one reads the block live and shows it as
 * its own label.
 *
 * ⚠️ The shortcuts are LISTED, not just bound. A menu that teaches its own accelerators is how
 * anyone stops opening the menu. */
const BLOCKS: { tag: string; label: string; keys: string; cls: string }[] = [
  { tag: '<h1>', label: 'Heading 1', keys: '⌥1', cls: 'text-[19px] font-semibold' },
  { tag: '<h2>', label: 'Heading 2', keys: '⌥2', cls: 'text-[17px] font-semibold' },
  { tag: '<h3>', label: 'Heading 3', keys: '⌥3', cls: 'text-[15px] font-semibold' },
  { tag: '<h4>', label: 'Heading 4', keys: '⌥4', cls: 'text-[14px] font-medium' },
  { tag: '<p>', label: 'Paragraph', keys: '⌥0', cls: 'text-[13px]' },
  { tag: '<blockquote>', label: 'Quote', keys: '⌥Q', cls: 'text-[13px] italic' },
  { tag: '<pre>', label: 'Monospace', keys: '⌥M', cls: 'text-[13px] font-mono' },
];

function BlockFormat({ onPick, wide }: { onPick: (tag: string) => void; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  /* `formatBlock` reports the tag the caret sits in — `div` when nothing has been applied, which
     reads as Paragraph because that is what an unformatted line is. */
  let current = 'Paragraph';
  try {
    const v = document.queryCommandValue('formatBlock')?.toLowerCase();
    current = BLOCKS.find((b) => b.tag === `<${v}>`)?.label ?? 'Paragraph';
  } catch { /* unsupported */ }

  return (
    <div ref={ref} className={`relative ${wide ? 'w-full' : ''}`}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F1F5F9] ${wide ? 'w-full justify-between' : ''}`}
      >
        {current}
        <ChevronDown size={13} className="text-[#9CA3AF]" />
      </button>
      {open && (
        <div className={`absolute left-0 top-full z-50 mt-1 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)] ${wide ? 'w-full' : 'w-[210px]'}`}>
          {BLOCKS.map((b) => (
            <button
              key={b.tag}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(b.tag); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors ${
                current === b.label ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'
              }`}
            >
              {/* Each row is SET in the style it applies — the preview is the label. */}
              <span className={`${b.cls} truncate text-[#364658]`}>{b.label}</span>
              <span className="flex-shrink-0 rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#7B8FA5]">{b.keys}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RichText({ value, onChange, placeholder }: {
  value: string; onChange: (html: string) => void; placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value, focused]);

  const cmd = (c: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(c, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  };

  /* ⚠️ Buttons light up when the CARET is inside that formatting, read live from
     `queryCommandState`. Without it the bar is write-only — you can turn bold on but the toolbar
     never tells you the word you are standing in is already bold, so you toggle it off by accident.
     `tick` re-reads on every selection change and keystroke. */
  const [, setTick] = useState(0);
  const active = (c: string) => {
    try { return document.queryCommandState(c); } catch { return false; }
  };
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, []);

  const btn = 'flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]';
  const btnOn = 'flex size-7 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]';
  const tool = (c: string) => (active(c) ? btnOn : btn);

  /* The rail's contents, in the order the eye should meet them.
   *
   * ⚠️ The hierarchy is the point: the three CHARACTER toggles first, then the three alignments and
   * the two lists — the paragraph-shaping group — then everything else. That is the order people
   * reach for these, and grouping by what a control ACTS ON (a word, a paragraph, the document)
   * beats grouping by how often it is used, because the first is a rule a new user can infer and
   * the second is a ranking only we can see. Separators mark the three tiers. */
  const RAIL: ({ sep: true } | { cmd: string; arg?: string; title: string; ic: ReactNode; toggles?: boolean; run?: () => void })[] = [
    { cmd: 'bold', title: 'Bold', ic: <Bold size={15} />, toggles: true },
    { cmd: 'underline', title: 'Underline', ic: <Underline size={15} />, toggles: true },
    { cmd: 'italic', title: 'Italic', ic: <Italic size={15} />, toggles: true },
    { sep: true },
    { cmd: 'justifyLeft', title: 'Align left', ic: <AlignLeft size={15} />, toggles: true },
    { cmd: 'justifyCenter', title: 'Align centre', ic: <AlignCenter size={15} />, toggles: true },
    { cmd: 'justifyRight', title: 'Align right', ic: <AlignRight size={15} />, toggles: true },
    { cmd: 'insertUnorderedList', title: 'Bulleted list', ic: <List size={15} />, toggles: true },
    { cmd: 'insertOrderedList', title: 'Numbered list', ic: <ListOrdered size={15} />, toggles: true },
    { sep: true },
    { cmd: 'strikeThrough', title: 'Strikethrough', ic: <Strikethrough size={15} />, toggles: true },
    { cmd: 'formatBlock', arg: '<blockquote>', title: 'Quote', ic: <Quote size={15} /> },
    { cmd: 'indent', title: 'Indent', ic: <IndentIncrease size={15} /> },
    { cmd: 'outdent', title: 'Outdent', ic: <IndentDecrease size={15} /> },
    { cmd: 'createLink', title: 'Link', ic: <Link2 size={15} />, run: () => { const u = window.prompt('Link to'); if (u) cmd('createLink', u); } },
    { cmd: 'undo', title: 'Undo', ic: <Undo2 size={15} /> },
    { cmd: 'redo', title: 'Redo', ic: <Redo2 size={15} /> },
    { cmd: 'removeFormat', title: 'Clear formatting', ic: <Eraser size={15} /> },
  ];

  return (
    <div className="rounded border border-[#d1d5db] focus-within:border-[#3D8BD0] focus-within:ring-1 focus-within:ring-[#3D8BD0]">
      {/* ── Font style, full width, on top ──────────────────────────────────────
          It is the only control here that changes what a line IS rather than how it looks, and the
          only one that needs to show its current value in words — so it gets the width to say
          "Heading 2" and a row of its own, instead of competing for space with sixteen glyphs. */}
      <div className="border-b border-[#F0F2F5] px-1.5 py-1">
        <BlockFormat onPick={(tag) => cmd('formatBlock', tag)} wide />
      </div>

      {/* ── Writing surface, with the actions standing beside it ────────────────
          ⚠️ A VERTICAL rail, not a wrapping bar. Sixteen controls across a 340px panel wrapped to
          three rows that reflowed every time the panel was resized, so a button was never twice in
          the same place; stacked in a fixed-width column they hold their positions, the editor gets
          the height back, and the overflow scrolls in the one direction that costs the text nothing.
          ⚠️ Image and video are gone. A portal element is authored, not composed — an image belongs
          on the page as an Image element the builder can place, select and style, and one pasted
          inside a paragraph is invisible to every one of those tools. */}
      <div className="flex items-stretch">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onChange(ref.current?.innerHTML ?? ''); }}
          onInput={() => onChange(ref.current?.innerHTML ?? '')}
          className="min-h-[200px] flex-1 overflow-y-auto px-3 py-2 text-[13px] leading-[1.6] text-[#364658] focus:outline-none empty:before:text-[#9ca3af] empty:before:content-[attr(data-placeholder)]"
        />
        <div className="flex max-h-[200px] w-[38px] flex-shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-l border-[#F0F2F5] py-1">
          {RAIL.map((r, i) => ('sep' in r ? (
            <span key={`s${i}`} className="my-1 h-px w-4 flex-shrink-0 bg-[#E5E7EB]" />
          ) : (
            <button
              key={r.title}
              /* ⚠️ `onMouseDown → preventDefault` on EVERY button. Without it, pressing one blurs the
                 editor, the browser throws the selection away, and the command lands on nothing —
                 the single most important line in this component. */
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => (r.run ? r.run() : cmd(r.cmd, r.arg))}
              title={r.title}
              className={`flex-shrink-0 ${r.toggles ? tool(r.cmd) : btn}`}
            >{r.ic}</button>
          )))}
        </div>
      </div>
    </div>
  );
}

/* ── Number ──────────────────────────────────────────────────────────────── */

export function NumberField({ value, onChange, min = 0, max = 999, unit }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className={`${inputCls} ${unit ? 'pr-10' : ''} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
      />
      {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9CA3AF]">{unit}</span>}
    </div>
  );
}

/* ── Slider — always paired with an editable numeric readout (spec §3) ───── */

export function SliderRow({ value, onChange, min = 0, max = 100, step = 1, unit = 'px' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-[#3D8BD0]"
      />
      <div className="relative w-[70px] flex-shrink-0">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className="h-8 w-full rounded border border-[#d1d5db] pl-2 pr-6 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF]">{unit}</span>
      </div>
    </div>
  );
}

/* ── Segmented — 2–4 options, never more (spec §3) ────────────────────────── */

export function Segmented<T extends string | number | boolean>({ value, options, onChange }: {
  value: T;
  options: { value: T; label?: string; icon?: ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            title={o.title ?? o.label}
            className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded border px-2 text-[12px] font-medium transition-colors ${
              on ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
            }`}
          >{o.icon}{o.label && <span className="truncate">{o.label}</span>}</button>
        );
      })}
    </div>
  );
}

export const ALIGN_OPTIONS = [
  { value: 'left' as const, icon: <AlignLeft size={14} />, title: 'Left' },
  { value: 'center' as const, icon: <AlignCenter size={14} />, title: 'Centre' },
  { value: 'right' as const, icon: <AlignRight size={14} />, title: 'Right' },
];

/* ── Select — 5+ options (spec §3) ───────────────────────────────────────── */

export function SelectField<T extends string>({ value, options, onChange }: {
  value: T; options: readonly T[] | { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  const list = (options as (T | { value: T; label: string })[]).map((o) =>
    typeof o === 'object' ? o : { value: o, label: String(o) });
  return (
    <select className={`${inputCls} app-select`} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {list.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  );
}

/* ── Toggle — label sits WITH the switch, no separate label column ───────── */

export function ToggleRow({ label, on, onChange, help, locked, lockNote }: {
  label: string; on: boolean; onChange: (v: boolean) => void; help?: string;
  /** Accessibility floor (spec §8.5): shown as a locked-on row with a note, never hidden. */
  locked?: boolean; lockNote?: string;
}) {
  /* ⚠️ EVERY switch gets the same air above it, whatever sits above it. Two stacked switches were
     briefly given a tighter gap on the theory that they read as one bank — they read as one ROW
     instead, two labels crowding each other with no space to separate the questions. A switch is
     always its own question; only the field a switch REVEALS hugs it (see Field's `tight`). */
  return (
    <div className="mt-5 first:mt-0">
      <label className={`flex items-center justify-between gap-3 ${locked ? 'cursor-default' : 'cursor-pointer'}`}>
        <span className="text-[13px] text-[#364658]">{label}</span>
        <button
          role="switch"
          aria-checked={on}
          disabled={locked}
          onClick={() => !locked && onChange(!on)}
          className={`relative h-[18px] w-[32px] flex-shrink-0 rounded-full transition-colors ${
            on ? 'bg-[#3D8BD0]' : 'bg-[#D1D5DB]'
          } ${locked ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className={`absolute top-[2px] size-[14px] rounded-full bg-white transition-all ${on ? 'left-[16px]' : 'left-[2px]'}`} />
        </button>
      </label>
      {(help || lockNote) && <p className="mt-1 pr-11 text-[11px] leading-[1.5] text-[#9CA3AF]">{lockNote ?? help}</p>}
    </div>
  );
}

/* ── Chips — multi-select, toggling is immediate (spec §3) ───────────────── */

export function Chips<T extends string>({ value, options, onChange }: {
  value: T[]; options: readonly T[]; onChange: (v: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`h-7 rounded px-2.5 text-[12px] font-medium transition-colors ${
              on ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
            }`}
          >{o}</button>
        );
      })}
    </div>
  );
}

/** An editable chip SET — chips you can add to and remove from (Feedback's answer options). */
export function ChipEditor({ value, onChange, placeholder = 'Add an option' }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded border border-[#d1d5db] p-1.5">
      {value.map((c) => (
        <span key={c} className="flex items-center gap-1 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] text-[#364658]">
          {c}
          <button onClick={() => onChange(value.filter((x) => x !== c))} className="text-[#9CA3AF] hover:text-[#EF4444]">
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); } }}
        onBlur={commit}
        className="min-w-[90px] flex-1 bg-transparent px-1 text-[12px] text-[#364658] placeholder:text-[#9ca3af] focus:outline-none"
      />
    </div>
  );
}

/* ── Grid picker — sweep an R × C grid (spec §3, §7.17) ───────────────────
 *
 * ⚠️ It stops at 10 × 10, and that is not a technical limit: past there a static table wants search,
 * sorting and paging, which means it wants to be a knowledge article. The picker refuses rather than
 * letting someone build something that will not survive real content.
 *
 * Growing pads with blanks; shrinking truncates — and SAYS SO before it happens, because discarding
 * typed cells silently is the kind of thing people only notice a week later. */
export function GridPicker({ rows, cols, onChange, max = 10 }: {
  rows: number; cols: number; onChange: (r: number, c: number) => void; max?: number;
}) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const r = hover?.r ?? rows;
  const c = hover?.c ?? cols;
  return (
    <div>
      <div
        onMouseLeave={() => setHover(null)}
        className="inline-flex flex-col gap-[3px] rounded border border-[#E5E7EB] bg-white p-2"
      >
        {Array.from({ length: max }).map((_, ri) => (
          <span key={ri} className="flex gap-[3px]">
            {Array.from({ length: max }).map((_, ci) => {
              const on = ri < r && ci < c;
              return (
                <button
                  key={ci}
                  onMouseEnter={() => setHover({ r: ri + 1, c: ci + 1 })}
                  onClick={() => onChange(ri + 1, ci + 1)}
                  className={`size-[14px] rounded-[2px] border transition-colors ${
                    on ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#DFE5ED] bg-white'
                  }`}
                />
              );
            })}
          </span>
        ))}
      </div>
      <div className="mt-1.5 text-[12px] font-medium text-[#364658]">{r} × {c}</div>
      {(r < rows || c < cols) && (
        <p className="mt-1 text-[11px] leading-[1.5] text-[#B54708]">
          Smaller than it is now — anything typed outside {r} × {c} is discarded.
        </p>
      )}
    </div>
  );
}

/* ── Upload / drop zone (spec §3) ────────────────────────────────────────── */

export function UploadZone({ value, onChange, accept = 'image/*', hint = 'PNG, JPG, SVG or WebP' }: {
  value?: string; onChange: (dataUrl?: string) => void; accept?: string; hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const read = (file?: File) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => onChange(String(fr.result));
    fr.readAsDataURL(file);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2.5 rounded border border-[#E5E7EB] p-2">
        <img src={value} alt="" className="size-10 flex-shrink-0 rounded object-cover" />
        <span className="min-w-0 flex-1 truncate text-[12px] text-[#7B8FA5]">Image selected</span>
        <button onClick={() => onChange(undefined)} className="flex-shrink-0 text-[12px] font-medium text-[#EF4444] hover:underline">Remove</button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files?.[0]); }}
        className={`flex w-full flex-col items-center gap-1 rounded border border-dashed px-3 py-4 transition-colors ${
          over ? 'border-[#3D8BD0] bg-[#EBF5FF]' : 'border-[#C3CBD6] bg-white hover:border-[#3D8BD0]'
        }`}
      >
        <Upload size={16} className="text-[#7B8FA5]" />
        <span className="text-[12px] text-[#364658]">Drop an image or <span className="font-medium text-[#3D8BD0]">browse</span></span>
        <span className="text-[11px] text-[#9CA3AF]">{hint}</span>
      </button>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => read(e.target.files?.[0] ?? undefined)} />
    </>
  );
}
