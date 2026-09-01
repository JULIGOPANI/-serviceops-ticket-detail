/* Support Portal — the Record List's custom filter, as a condition builder.
 *
 * A flyout to the LEFT of the design panel, holding groups of key / operator / value rows.
 *
 * ⚠️ WHY IT IS NOT A VIEW INSIDE THE DROPDOWN. It was, and the dropdown is 320px, which is why the
 * old builder stacked each condition as one line of prose you clicked to edit. A row that shows the
 * field, the operator and the value at once needs about 520px — so it has to leave the panel. To
 * the left is the only direction with room: the panel is already against the right edge of the
 * window, and the canvas it covers is transient and comes straight back.
 *
 * ⚠️ AND inside a group, OR between groups. See `ConditionGroup` for why this is groups rather than
 * a join dropdown on every row.
 *
 * ⚠️ Portalled to document.body with fixed positioning. The design panel is `overflow-y-auto`, and
 * an absolutely-positioned surface inside it is clipped the moment it is taller than the space
 * below its trigger — the trap that has already caught the colour picker, the icon picker, the
 * table's alignment flyout and the listing's kebab.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Plus, Search, Trash2, X } from 'lucide-react';
import {
  DATE_PRESETS, OPERATORS, PEOPLE, TAG_SUGGESTIONS, UNASSIGNED,
  fieldByKey, fieldsFor, personAvatar,
} from './portalRecordFilters';
import type { Condition, ConditionGroup, FilterField } from './portalRecordFilters';

const W = 560;

/* ── a small popover, anchored under whatever opened it ─────────────────────── */

function Pop({ anchor, onClose, children, width = 240 }: {
  anchor: DOMRect; onClose: () => void; children: React.ReactNode; width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    /* A frame's delay, or the very click that opened this closes it again. */
    const t = setTimeout(() => document.addEventListener('mousedown', away), 0);
    document.addEventListener('keydown', esc);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);
  /* Flipped up when there is more room above than below — a value list opened on the last row of a
     tall group would otherwise run off the bottom of the window. */
  const below = window.innerHeight - anchor.bottom > 260;
  return createPortal(
    <div
      ref={ref}
      className="fixed z-[10060] rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]"
      style={{
        width,
        left: Math.min(anchor.left, window.innerWidth - width - 12),
        ...(below ? { top: anchor.bottom + 4 } : { bottom: window.innerHeight - anchor.top + 4 }),
      }}
    >{children}</div>,
    document.body,
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-1">
      <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 w-full rounded border border-[#d1d5db] pl-7 pr-2 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none"
      />
    </div>
  );
}

const cell = 'flex h-8 min-w-0 items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-2 text-left text-[12px] text-[#364658] transition-colors hover:border-[#9CA3AF]';

/* ── the value cell — five shapes, one control ──────────────────────────────── */

function ValueCell({ field, cond, onChange }: {
  field: FilterField; cond: Condition; onChange: (c: Condition) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [q, setQ] = useState('');

  const toggle = (v: string) => onChange({
    ...cond,
    values: cond.values.includes(v) ? cond.values.filter((x) => x !== v) : [...cond.values, v],
  });

  /* ⚠️ TEXT is typed in place, not behind a popover. It is the one kind whose value is not chosen
     from a list, so a popover would be a click and a second surface to reach a plain input. */
  if (field.kind === 'text') {
    return (
      <input
        value={cond.values[0] ?? ''}
        onChange={(e) => onChange({ ...cond, values: e.target.value ? [e.target.value] : [] })}
        placeholder="Value"
        className="h-8 min-w-0 flex-1 rounded border border-[#d1d5db] px-2 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
      />
    );
  }

  const options = field.kind === 'person'
    ? [UNASSIGNED, ...PEOPLE.map((p) => p.name)]
    : field.kind === 'date' ? DATE_PRESETS
      : field.kind === 'tags' ? TAG_SUGGESTIONS
        : (field.options ?? []);
  const shown = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  const label = cond.values.length === 0
    ? 'Select'
    : cond.values.length <= 2 ? cond.values.join(', ') : `${cond.values[0]} +${cond.values.length - 1}`;

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => setAnchor(anchor ? null : ref.current!.getBoundingClientRect())}
        className={`${cell} flex-1`}
      >
        <span className={`min-w-0 flex-1 truncate ${cond.values.length ? '' : 'text-[#9CA3AF]'}`}>{label}</span>
        <ChevronDown size={12} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {anchor && (
        <Pop anchor={anchor} onClose={() => { setAnchor(null); setQ(''); }}>
          {options.length > 8 && <SearchRow value={q} onChange={setQ} placeholder="Search" />}
          <div className="max-h-[220px] space-y-0.5 overflow-y-auto">
            {shown.map((o) => {
              const on = cond.values.includes(o);
              const av = field.kind === 'person' && o !== UNASSIGNED ? personAvatar(o) : null;
              return (
                <button
                  key={o}
                  type="button"
                  /* ⚠️ A DATE is one value, so picking replaces rather than adds — "due today or
                     tomorrow" is not a question Equals asks, and two ticks would promise it. */
                  onClick={() => (field.kind === 'date' ? onChange({ ...cond, values: [o] }) : toggle(o))}
                  className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-[#F5F7FA]"
                >
                  <span className="flex size-3.5 flex-shrink-0 items-center justify-center">
                    {on && <Check size={12} className="text-[#3D8BD0]" />}
                  </span>
                  {av && (
                    <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: av.bg }}>{av.initials}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]">{o}</span>
                </button>
              );
            })}
            {shown.length === 0 && <p className="px-1.5 py-2 text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>}
            {/* A tag that is not in the suggestion list is still a tag somebody uses. */}
            {field.kind === 'tags' && q && !options.includes(q) && (
              <button type="button" onClick={() => { toggle(q); setQ(''); }}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1.5 text-left text-[12px] text-[#3D8BD0] hover:bg-[#F5F7FA]">
                <Plus size={11} /> Add “{q}”
              </button>
            )}
          </div>
        </Pop>
      )}
    </>
  );
}

/* ── the field cell ────────────────────────────────────────────────────────── */

function FieldCell({ fields, cond, onChange }: {
  fields: FilterField[]; cond: Condition; onChange: (c: Condition) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [q, setQ] = useState('');
  const current = fields.find((f) => f.key === cond.field);
  const shown = q ? fields.filter((f) => f.label.toLowerCase().includes(q.toLowerCase())) : fields;
  return (
    <>
      <button ref={ref} type="button" onClick={() => setAnchor(anchor ? null : ref.current!.getBoundingClientRect())} className={`${cell} w-[150px] flex-shrink-0`}>
        <span className={`min-w-0 flex-1 truncate ${current ? '' : 'text-[#9CA3AF]'}`}>{current?.label ?? 'Select field'}</span>
        <ChevronDown size={12} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {anchor && (
        <Pop anchor={anchor} onClose={() => { setAnchor(null); setQ(''); }}>
          <SearchRow value={q} onChange={setQ} placeholder="Search fields" />
          <div className="max-h-[220px] space-y-0.5 overflow-y-auto">
            {shown.map((f) => (
              <button
                key={f.key}
                type="button"
                /* ⚠️ Changing the field RESETS the operator and the value. An operator belongs to a
                   kind, so "Contains" left behind on a status field is a comparison that field
                   cannot make — and the old value would be an option from a list nobody is looking
                   at any more. Better to clear it than to carry something meaningless forward. */
                onClick={() => { onChange({ field: f.key, op: OPERATORS[f.kind][0], values: [] }); setAnchor(null); setQ(''); }}
                className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-[#F5F7FA]"
              >
                <span className="flex size-3.5 flex-shrink-0 items-center justify-center">
                  {f.key === cond.field && <Check size={12} className="text-[#3D8BD0]" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]">{f.label}</span>
              </button>
            ))}
            {shown.length === 0 && <p className="px-1.5 py-2 text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>}
          </div>
        </Pop>
      )}
    </>
  );
}

/* ── the builder ───────────────────────────────────────────────────────────── */

export function PortalConditionBuilder({ anchor, moduleKey, statuses, seed, seedFrom, onApply, onClose }: {
  /** The filter field's rect — the flyout sits to the left of it. */
  anchor: DOMRect;
  moduleKey: string;
  statuses: string[];
  seed: ConditionGroup[];
  /** The preset the seed came from, named so the header can say the work started somewhere. */
  seedFrom?: string;
  onApply: (groups: ConditionGroup[]) => void;
  onClose: () => void;
}) {
  const fields = fieldsFor(moduleKey, statuses);
  /* ⚠️ A DRAFT, committed by Apply. Every other control in this panel writes live, but a filter is
     read as one statement — an admin part-way through "status is X **or** priority is Y" has, for a
     few seconds, said something they do not mean, and watching the card empty and refill under a
     half-built rule teaches them the builder is broken. */
  const [groups, setGroups] = useState<ConditionGroup[]>(
    seed.length ? seed.map((g) => ({ rows: g.rows.map((r) => ({ ...r })) })) : [{ rows: [] }],
  );
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    /* To the LEFT of the field, top-aligned with it, clamped into the window. */
    const left = Math.max(12, anchor.left - W - 10);
    const top = Math.min(Math.max(12, anchor.top), Math.max(12, window.innerHeight - 460));
    setPos({ top, left });
  }, [anchor]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const patchRow = (gi: number, ri: number, c: Condition) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { rows: g.rows.map((r, j) => (j === ri ? c : r)) } : g)));
  const addRow = (gi: number) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { rows: [...g.rows, { field: '', op: '', values: [] }] } : g)));
  /* ⚠️ Removing the last row of a group removes the GROUP. An empty bracket on screen is a rule
     that matches everything, drawn as though it were a rule — and it would OR that "everything"
     against the groups beside it, quietly widening the filter to all records. */
  const dropRow = (gi: number, ri: number) =>
    setGroups((gs) => gs
      .map((g, i) => (i === gi ? { rows: g.rows.filter((_, j) => j !== ri) } : g))
      .filter((g, i) => i !== gi || g.rows.length > 0));

  const rowsTotal = groups.reduce((t, g) => t + g.rows.length, 0);
  /* A row only counts once it is complete; a half-written one must filter nothing rather than
     everything. Mirrors `rowComplete` in AdminBomTargeting for the same reason. */
  const complete = (r: Condition) => !!r.field && !!r.op && (r.values.length > 0);

  return createPortal(
    <>
      {/* ⚠️ NO backdrop over the panel. The dropdown that launched this stays open behind it, and a
          scrim would grey out the very field whose value is being edited. Escape and Cancel close. */}
      <div
        ref={ref}
        className="fixed z-[10050] flex max-h-[calc(100vh-24px)] flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-[0_16px_40px_-8px_rgba(16,24,40,0.24)]"
        style={{ width: W, top: pos.top, left: pos.left }}
      >
        <div className="flex flex-shrink-0 items-start gap-3 border-b border-[#F0F2F5] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#364658]">Custom filter</p>
            <p className="mt-0.5 text-[11px] leading-[1.5] text-[#7B8FA5]">
              {seedFrom
                ? <>Started from <span className="font-medium text-[#5A6B80]">{seedFrom}</span>. Conditions in a group must all match; groups match on their own.</>
                : <>Conditions in a group must all match. A record matching any one group is shown.</>}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={15} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {groups.map((g, gi) => (
            <div key={gi}>
              {/* ⚠️ The OR is a LABELLED RULE between two groups, not a word floating in the gap.
                  It is the only thing on the surface saying the groups are alternatives, so it has
                  to read as a join rather than as a heading for the block under it. */}
              {gi > 0 && (
                <div className="my-2 flex items-center gap-2">
                  <span className="h-px flex-1 bg-[#E5E7EB]" />
                  <span className="rounded bg-[#EEF2F7] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#5A6B80]">OR</span>
                  <span className="h-px flex-1 bg-[#E5E7EB]" />
                </div>
              )}
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FCFDFE] p-2.5">
                {g.rows.map((c, ri) => {
                  const f = c.field ? fieldByKey(moduleKey, c.field, statuses) : undefined;
                  return (
                    <div key={ri}>
                      {/* AND sits BETWEEN rows, at the left, so the column of joins reads down the
                          group rather than being repeated on every row including the first. */}
                      {ri > 0 && <p className="py-1 pl-1 text-[11px] font-semibold text-[#9CA3AF]">AND</p>}
                      <div className="flex items-center gap-1.5">
                        <FieldCell fields={fields} cond={c} onChange={(n) => patchRow(gi, ri, n)} />
                        <select
                          value={c.op}
                          disabled={!f}
                          onChange={(e) => patchRow(gi, ri, { ...c, op: e.target.value })}
                          className="app-select h-8 w-[128px] flex-shrink-0 rounded border border-[#d1d5db] bg-white px-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none disabled:bg-[#F8FAFC] disabled:text-[#9CA3AF]"
                        >
                          {f ? OPERATORS[f.kind].map((o) => <option key={o} value={o}>{o}</option>) : <option value="">—</option>}
                        </select>
                        {f
                          ? <ValueCell field={f} cond={c} onChange={(n) => patchRow(gi, ri, n)} />
                          /* Until a field is chosen there is nothing to compare against, so the cell
                             says so rather than offering an input that cannot mean anything yet. */
                          : <span className="flex h-8 min-w-0 flex-1 items-center rounded border border-dashed border-[#E5E7EB] px-2 text-[12px] text-[#9CA3AF]">Pick a field first</span>}
                        <button
                          type="button"
                          onClick={() => dropRow(gi, ri)}
                          title="Remove this condition"
                          className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                        ><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
                {g.rows.length === 0 && (
                  <p className="px-1 py-1.5 text-[12px] text-[#9CA3AF]">No conditions in this group yet.</p>
                )}
                <button
                  type="button"
                  onClick={() => addRow(gi)}
                  className="mt-2 flex items-center gap-1.5 rounded px-1 py-1 text-[12px] font-medium text-[#3D8BD0] hover:underline"
                ><Plus size={12} /> Add condition</button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setGroups((gs) => [...gs, { rows: [] }])}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-[#CBD5E1] px-3 py-2 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F8FBFE]"
          ><Plus size={13} /> Add OR group</button>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-[#F0F2F5] px-4 py-3">
          <button
            type="button"
            onClick={() => setGroups([{ rows: [] }])}
            disabled={rowsTotal === 0}
            className="text-[12px] text-[#6B7280] transition-colors hover:text-[#DC2626] disabled:cursor-not-allowed disabled:text-[#D1D5DB]"
          >Clear all</button>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >Cancel</button>
            <button
              type="button"
              /* ⚠️ Incomplete rows are DROPPED on apply, not saved half-written. A row with a field
                 and no value filters nothing, so keeping it would put a rule on screen that does
                 not do anything — and the count under the field would disagree with the card. */
              onClick={() => onApply(
                groups.map((g) => ({ rows: g.rows.filter(complete) })).filter((g) => g.rows.length > 0),
              )}
              className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3480c4]"
            >Apply</button>
          </span>
        </div>
      </div>
    </>,
    document.body,
  );
}
