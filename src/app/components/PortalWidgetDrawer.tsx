/* Support Portal builder — the drawer shell (spec §2), and the renderer for any widget spec.
 *
 * One shell, every layer. Header → breadcrumb → title → Content/Styling tabs → collapsible groups →
 * an optional sticky footer for layers whose job is adding children. A widget is DATA (see
 * portalWidgetSpec.ts); this file is the only thing that knows how to draw one.
 *
 * The rules that make it trustworthy, all from §2.2 and §8.4:
 *   • A field that does not apply is REMOVED, not disabled — absent and disabled mean different
 *     things and must look different.
 *   • A GROUP with no visible fields is not rendered at all, never rendered empty.
 *   • Every change applies to the canvas immediately. There is no Save in here; publishing is a
 *     page-level action.
 */

import { Fragment, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ChevronLeft, ChevronRight, Copy, EyeOff, Layers, List, MoreVertical, PanelLeft, RotateCcw,
  Info, Rows3, Search as SearchIcon, Square, Trash2, Type as TypeIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  REQUEST_STATUSES, itemNodeId, nodeById, nodePath, parseItemId, registerItemName, subNodeId,
} from './portalPageModel';
import type { NodeStyle, PortalStyles } from './portalPageModel';
import { PAGE_ID, hasOwn, resolve } from './portalStyleResolver';
import { ContrastMeter, useBackdrop } from './PortalContrastMeter';
import type { BackdropSpec } from './PortalContrastMeter';
import { ALL_PACKS, packBadge } from './PortalStylePacks';
import {
  ALIGN_OPTIONS, Badge, ChipEditor, Chips, Field, GridPicker, Group, Note, NumberField, RichText,
  SelectField, Segmented, SliderRow, TextField, ToggleRow, UploadZone,
} from './PortalControls';
import { PortalItemList } from './PortalItemList';
import { TemplatePicker } from './PortalSectionControls';
import { BorderRow, RadiusRow, ShadowBlock, SizeRow } from './PortalBoxControls';
import { PortalTableContent } from './PortalTableContent';
import { LineStylePicker } from './PortalLineStyles';
import { IconFramePicker } from './PortalIconFrame';
import type { IconFrame } from './PortalIconFrame';
import type { LineStyle } from './PortalLineStyles';
import { SpacingMatrix } from './SpacingMatrix';
import { ColorField } from './PortalColorPicker';
import { IconField } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';
import { GATE_COPY, gateOpen, specById } from './portalWidgetSpec';
import type { Cfg, WidgetField, WidgetSpec } from './portalWidgetSpec';

/* Which groups are open is remembered per widget TYPE for the session: someone styling five cards
   in a row should not have to re-open the same drawer each time. Module-level on purpose — it is
   session state about a KIND of thing, not about one node. */
const GROUP_MEMORY: Record<string, string[]> = {};

/* §7.19 — one item per file, appended in selection order. Adding 12 photos one at a time is not a
   workflow anybody completes. */
function BulkAdd({ onFiles }: { onFiles: (srcs: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        className="mt-1.5 w-full text-[12px] font-medium text-[#3D8BD0] hover:underline"
      >or add several files at once</button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (!files.length) return;
          Promise.all(files.map((f) => new Promise<string>((res) => {
            const fr = new FileReader();
            fr.onload = () => res(String(fr.result));
            fr.readAsDataURL(f);
          }))).then(onFiles);
        }}
      />
    </>
  );
}

/* ── Alignment, as joined icon buttons ────────────────────────────────────────
 *
 * One bordered group with shared edges — not five separate buttons, because it is one question with
 * one answer. Icon-only: the glyph shows where the content lands, which the words "Left / Centre"
 * describe more slowly. `stretch` and `justify` share a glyph family with the three placements so
 * the row still reads as one set. */
/* ⚠️ BOX-alignment glyphs, not text-align glyphs. `AlignLeft`/`AlignCenter` draw ragged lines of
   type, which say "how the words are set" — but almost every alignment row in this builder positions
   a BLOCK inside its container. A rule with bars against it reads as "put the thing here", which is
   the actual question, and the four of them read as one family. */
const AlignGlyph = ({ kind }: { kind: 'start' | 'center' | 'end' | 'stretch' | 'between' | 'around' }) => {
  const rule = '#64748B';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      {kind === 'start' && (
        <>
          <path d="M2 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="4.5" y="4" width="8" height="2.6" rx="1" fill={rule} />
          <rect x="4.5" y="9.4" width="5" height="2.6" rx="1" fill={rule} />
        </>
      )}
      {kind === 'center' && (
        <>
          <path d="M8 1.5v13" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="2.5" y="4" width="11" height="2.6" rx="1" fill={rule} />
          <rect x="4.5" y="9.4" width="7" height="2.6" rx="1" fill={rule} />
        </>
      )}
      {kind === 'end' && (
        <>
          <path d="M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="3.5" y="4" width="8" height="2.6" rx="1" fill={rule} />
          <rect x="6.5" y="9.4" width="5" height="2.6" rx="1" fill={rule} />
        </>
      )}
      {kind === 'between' && (
        <>
          <path d="M2 2v12M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="4" y="4" width="2.6" height="8" rx="1" fill={rule} />
          <rect x="9.4" y="4" width="2.6" height="8" rx="1" fill={rule} />
        </>
      )}
      {kind === 'around' && (
        <>
          <path d="M2 2v12M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="5.2" y="4" width="2.6" height="8" rx="1" fill={rule} />
          <rect x="8.2" y="4" width="2.6" height="8" rx="1" fill={rule} />
        </>
      )}
      {kind === 'stretch' && (
        <>
          <path d="M2 2v12M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="4.5" y="4" width="7" height="2.6" rx="1" fill={rule} />
          <rect x="4.5" y="9.4" width="7" height="2.6" rx="1" fill={rule} />
        </>
      )}
    </svg>
  );
};

const ALIGN_ICON: Record<string, ReactNode> = {
  left: <AlignGlyph kind="start" />,
  start: <AlignGlyph kind="start" />,
  center: <AlignGlyph kind="center" />,
  right: <AlignGlyph kind="end" />,
  end: <AlignGlyph kind="end" />,
  justify: <AlignGlyph kind="stretch" />,
  between: <AlignGlyph kind="between" />,
  around: <AlignGlyph kind="around" />,
  stretch: <AlignGlyph kind="stretch" />,
};

function AlignRow({ value, options, onChange }: {
  value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-[#DFE5ED]">
      {options.map((o, i) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.label}
            className={`flex h-8 w-9 items-center justify-center transition-colors ${
              i > 0 ? 'border-l border-[#DFE5ED]' : ''
            } ${on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#64748B] hover:bg-[#F5F7FA]'}`}
          >{ALIGN_ICON[o.value]}</button>
        );
      })}
    </div>
  );
}

/* The Table's content CTA. The sheet is a MODAL rather than an inline grid: a spreadsheet inside a
   340px panel is a spreadsheet nobody can read, and content this shape deserves the room. */
function TableContentField({ rows, onChange }: { rows: string[][]; onChange: (g: string[][]) => void }) {
  const [open, setOpen] = useState(false);
  const filled = rows.filter((r) => r.some((c) => String(c ?? '').trim())).length;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center justify-between rounded border border-[#d1d5db] bg-white px-3 text-left text-[13px] text-[#364658] transition-colors hover:border-[#3D8BD0]"
      >
        <span>Manage table content</span>
        <span className="text-[12px] text-[#9CA3AF]">{filled ? `${filled} rows` : 'Empty'}</span>
      </button>
      {open && <PortalTableContent value={rows} onApply={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

/** 9-point placement (§7.20 Banner content, §7.18 slide content). */
const NINE = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'];

function NinePoint({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid w-[84px] grid-cols-3 gap-1">
      {NINE.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          title={p}
          className={`size-6 rounded border transition-colors ${
            value === p ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#DFE5ED] bg-white hover:border-[#3D8BD0]'
          }`}
        />
      ))}
    </div>
  );
}

const THEME_PRESETS = [
  { name: 'ServiceOps', primary: '#3D8BD0', secondary: '#0F172A', neutral: '#64748B' },
  { name: 'Forest', primary: '#22A06B', secondary: '#14342A', neutral: '#5F6B62' },
  { name: 'Ember', primary: '#F58518', secondary: '#3A2410', neutral: '#77675A' },
  { name: 'Violet', primary: '#7C3AED', secondary: '#241548', neutral: '#6B6480' },
];

/** The contrast guard as a field — it samples real artwork, so it needs its own hook. */
function ContrastField({ spec, textColor, onFix }: {
  spec: BackdropSpec; textColor: string; onFix: (n: { color: string; overlay: number }) => void;
}) {
  const backdrop = useBackdrop(spec);
  return <ContrastMeter textColor={textColor} backdrop={backdrop} overlay={spec.overlay} onFix={onFix} />;
}

/* ── §7.17 the column list ───────────────────────────────────────────────────
 *
 * A column is not a thing you can store on its own: it is the Nth cell of every row. So every
 * operation here rewrites EVERY row in lockstep with the widths and alignments — reorder, duplicate
 * and delete all have to move three arrays at once or the table silently desynchronises.
 *
 * ⚠️ Widths are normalised to 100 on every change. A per-column width that does not add up is a
 * table that renders at some other shape than the numbers claim, which is worse than no control.
 */
const clampW = (w: number) => Math.max(5, Math.min(80, Math.round(w)));

/** Forces the set to total exactly 100, absorbing rounding on the last column. */
function normaliseWidths(ws: number[]): number[] {
  const sum = ws.reduce((a, b) => a + b, 0) || 1;
  const out = ws.map((v) => Math.max(5, Math.round((v / sum) * 100)));
  out[out.length - 1] += 100 - out.reduce((a, b) => a + b, 0);
  return out;
}

const equalWidths = (n: number) => normaliseWidths(Array.from({ length: n }, () => Math.round(100 / n)));

function ColumnsEditor({ cfg, onChange }: { cfg: Cfg; onChange: (patch: Cfg) => void }) {
  const rows = (cfg.rows as (Cfg & { cells: string[] })[]) ?? [];
  const count = Number(cfg.cols ?? rows[0]?.cells?.length ?? 3);
  const widths = ((cfg.widths as number[]) ?? equalWidths(count)).slice(0, count);
  const aligns = ((cfg.aligns as string[]) ?? Array.from({ length: count }, () => 'left')).slice(0, count);
  const headerCells = (cfg.headerRow !== false ? rows[0]?.cells : undefined) ?? [];

  /** Every row, plus widths and aligns, transformed by one column-level operation. */
  const apply = (fn: <T>(arr: T[]) => T[]) => onChange({
    rows: rows.map((r) => ({ ...r, cells: fn(r.cells ?? []) })),
    widths: normaliseWidths(fn(widths) as number[]),
    aligns: fn(aligns),
    cols: fn(Array.from({ length: count }, (_, i) => i)).length,
  });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= count) return;
    apply((arr) => { const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  };
  const duplicate = (i: number) => apply((arr) => { const n = [...arr]; n.splice(i + 1, 0, arr[i]); return n; });
  const remove = (i: number) => {
    // A table with no columns is not a table — the last one refuses rather than emptying.
    if (count <= 1) { toast.error('A table needs at least one column'); return; }
    apply((arr) => arr.filter((_, j) => j !== i));
  };

  /* Setting one width squeezes the others proportionally, so the total stays 100 without the
     editor having to do the arithmetic. */
  const setWidth = (i: number, w: number) => {
    const target = clampW(w);
    const rest = widths.map((v, j) => (j === i ? 0 : v));
    const restSum = rest.reduce((a, b) => a + b, 0) || 1;
    const remain = Math.max((count - 1) * 5, 100 - target);
    const next = widths.map((v, j) => (j === i ? target : Math.max(5, Math.round((v / restSum) * remain))));
    onChange({ widths: normaliseWidths(next) });
  };

  const iconBtn = 'flex size-6 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]';
  const total = widths.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded border border-[#E5E7EB] p-2">
          <div className="flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#364658]">
              {headerCells[i]?.trim() || `Column ${i + 1}`}
            </span>
            <button onClick={() => move(i, -1)} disabled={i === 0} title="Move left" className={`${iconBtn} disabled:opacity-30`}><ChevronLeft size={13} /></button>
            <button onClick={() => move(i, 1)} disabled={i === count - 1} title="Move right" className={`${iconBtn} disabled:opacity-30`}><ChevronRight size={13} /></button>
            <button onClick={() => duplicate(i)} title="Duplicate column" className={iconBtn}><Copy size={13} /></button>
            <button onClick={() => remove(i)} title="Delete column" className={`${iconBtn} hover:bg-[#FEF3F2] hover:text-[#EF4444]`}><Trash2 size={13} /></button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <SliderRow value={widths[i] ?? 0} onChange={(v) => setWidth(i, v)} min={5} max={80} unit="%" />
          </div>
          <div className="mt-2">
            <Segmented
              value={aligns[i] ?? 'left'}
              onChange={(v) => onChange({ aligns: aligns.map((a, j) => (j === i ? v : a)) })}
              options={ALIGN_OPTIONS}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[11px] text-[#9CA3AF]">Widths total {total}%</span>
        <button onClick={() => onChange({ widths: equalWidths(count) })} className="text-[11px] font-medium text-[#3D8BD0] hover:underline">
          Make equal
        </button>
      </div>
    </div>
  );
}

/* ── the NEW-ELEMENT accordion panel (NEW-ELEMENT-PANELS-SPEC §1.1–§1.2) ──── */

const ACCORDION_TITLE: Record<string, string> = {
  layout: 'Layout', style: 'Style', spacing: 'Spacing', size: 'Size', alignment: 'Alignment',
};

/* §1.3 — the accordion header carries a dot when anything inside it is set away from default, so a
   collapsed panel still shows where the overrides are. */
const OverrideDot = () => (
  <span title="Something in here is set away from the default" className="size-1.5 flex-shrink-0 rounded-full bg-[#F58518]" />
);

function PanelBody({ spec, nodeId, cfg, renderField, openGroups, toggleGroup, styles, setStyle, replaceStyle, collectionSlot }: {
  spec: WidgetSpec; nodeId: string; cfg: Cfg;
  renderField: (f: WidgetField) => ReactNode;
  openGroups: string[]; toggleGroup: (g: string) => void;
  styles: PortalStyles;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  replaceStyle: (id: string, next: NodeStyle) => void;
  /* §1.4 — the item list sits INSIDE the Content section, so it is passed in rather than rebuilt. */
  collectionSlot?: ReactNode;
}) {
  const panel = spec.panel!;
  const packProps = { styles, id: nodeId, setStyle, replaceStyle };
  const visible = (fs?: WidgetField[]) => (fs ?? []).filter((f) => !f.when || f.when(cfg));

  /** Has anything in this accordion moved off its default? Drives the orange dot. */
  const touched = (a: typeof panel.accordions[number]) => {
    const own = visible(a.fields).some((f) => cfg[f.key] !== undefined && cfg[f.key] !== spec.defaults[f.key]);
    if (own) return true;
    if (a.groups?.includes('G1')) return hasOwn(styles, nodeId, ALL_PACKS.P1.keys);
    if (a.spacing) return hasOwn(styles, nodeId, ['padding', 'margin']);
    return false;
  };

  return (
    <>
      {/* Content is a SECTION, not a tab. An element with nothing to author has none at all — and
          says so in one line rather than showing an empty group. */}
      <SectionLabel>Content</SectionLabel>
      {panel.content?.length ? visible(panel.content).map(renderField) : null}
      {panel.contentNote && (
        <p className="mt-1 text-[12px] leading-[1.55] text-[#7B8FA5]">{panel.contentNote}</p>
      )}
      {collectionSlot}

      {panel.action?.length ? (
        <>
          <SectionLabel>Action</SectionLabel>
          {visible(panel.action).map(renderField)}
        </>
      ) : null}

      <SectionLabel>Design</SectionLabel>
      <div>
        {panel.accordions.map((a) => {
          const key = `acc:${a.id}`;
          const open = openGroups.includes(key) || (a.open && !openGroups.includes(`shut:${a.id}`));
          return (
            <Group
              key={a.id}
              title={ACCORDION_TITLE[a.id]}
              open={!!open}
              onToggle={() => toggleGroup(open ? `shut:${a.id}` : key)}
              badge={(
                <>
                  {a.info && <span title={a.info} className="cursor-help text-[#9CA3AF]"><Info size={12} /></span>}
                  {touched(a) && <OverrideDot />}
                </>
              )}
            >
              {visible(a.fields).map(renderField)}
              {a.groups?.includes('G1') && <ALL_PACKS.P1.Render {...packProps} />}
              {a.groups?.includes('G3') && <ALL_PACKS.P3.Render {...packProps} roles={a.roles} />}
              {/* ⚠️ The spacing accordion shows only the boxes this element HAS. A divider gets a
                  margin box and no padding box, because a line has no inside. */}
              {a.spacing && (
                <SpacingMatrix
                  style={styles[nodeId] ?? {}}
                  onChange={(p) => setStyle(nodeId, p)}
                  only={a.spacing === 'both' ? undefined : a.spacing}
                />
              )}
            </Group>
          );
        })}
      </div>
    </>
  );
}

/** The two headed sections of the one scroll — the only separation Content and Design need. */
/* The label carries an optional ACTION on its right — Expand all / Collapse all for the accordions
   under it. ⚠️ Per SECTION, not one control for the whole panel: Content and Design are separate
   questions, and expanding everything to reach one styling group means scrolling back past every
   content group to get there. */
const SectionLabel = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  /* ⚠️ The gap BELOW the label is deliberately much smaller than the one above it. A label sits
     with the fields it heads, so mt-6 separates one section from the next and mb-1 keeps CONTENT
     attached to the first thing it labels — equal margins made every eyebrow float between two
     sections without saying which one it belonged to. */
  <div className="mb-1 mt-6 flex items-center justify-between gap-2 first:mt-2">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{children}</span>
    {action}
  </div>
);

/** Expand all / Collapse all for one section's accordions. Says which it will do, not which it did. */
function ExpandAll({ keys, openGroups, setOpen }: {
  keys: string[]; openGroups: string[]; setOpen: (next: string[]) => void;
}) {
  if (keys.length < 2) return null;
  const allOpen = keys.every((k) => openGroups.includes(k));
  return (
    <button
      onClick={() => setOpen(allOpen
        ? openGroups.filter((k) => !keys.includes(k))
        : [...new Set([...openGroups, ...keys])])}
      className="text-[11px] font-medium normal-case tracking-normal text-[#3D8BD0] hover:underline"
    >{allOpen ? 'Collapse all' : 'Expand all'}</button>
  );
}

const NODE_ICON: Record<string, ReactNode> = {
  section: <Rows3 size={16} />, card: <Square size={16} />, text: <TypeIcon size={16} />,
  list: <List size={16} />, search: <SearchIcon size={16} />, rail: <PanelLeft size={16} />,
};

export interface WidgetDrawerProps {
  nodeId: string;
  spec: WidgetSpec;
  cfg: Cfg;
  setCfg: (patch: Cfg) => void;
  styles: PortalStyles;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  replaceStyle: (id: string, next: NodeStyle) => void;
  onSelect: (id: string | null) => void;
  /** Clears this element's own config and style. Rendered beside its name, not above the panel. */
  onReset?: () => void;
  icon?: IconChoice;
  setIcon: (c?: IconChoice) => void;
  /** Layer-level structural actions — never in the tab body (§2.1). */
  onDuplicate?: () => void;
  onDelete?: () => void;
  canDuplicate?: boolean;
  /** Opens an admin destination, for the "where this value actually lives" links. */
  onOpenSetting?: (section: string, card?: string) => void;
}

export function PortalWidgetDrawer(props: WidgetDrawerProps) {
  const { nodeId, spec, cfg, setCfg, styles, setStyle, replaceStyle, onSelect, onReset, icon, setIcon } = props;
  const node = nodeById(nodeId);
  const path = nodePath(nodeId);

  const [openGroups, setOpenGroupsState] = useState<string[]>(
    GROUP_MEMORY[spec.id] ?? ['Content', 'Header', 'Layout', 'Text', 'Tile', 'Button', 'P1'],
  );
  const setOpenGroups = (next: string[]) => { GROUP_MEMORY[spec.id] = next; setOpenGroupsState(next); };
  const toggleGroup = (g: string) =>
    setOpenGroups(openGroups.includes(g) ? openGroups.filter((x) => x !== g) : [...openGroups, g]);

  if (!node) return null;

  /* ── which LAYER is selected (spec §4) ───────────────────────────────────
   *
   * The same shell serves the widget (L3), one of its items (L5) and an item's sub-element (L6).
   * `nodeId` carries the lineage, so the only thing that changes is which fields are shown and
   * which slice of config they read and write. Styles always key off the FULL node id, which is
   * what lets an item's override resolve up through the widget to the section and the page. */
  const collection = spec.collection;
  const allItems = (collection ? ((cfg[collection.key] as Cfg[]) ?? []) : []) as (Cfg & { id: string })[];
  const parsed = parseItemId(nodeId);
  const selItem = parsed && collection ? allItems.find((x) => x.id === parsed.item) : undefined;

  const patchItem = (patch: Cfg) => {
    if (!collection || !selItem) return;
    setCfg({ [collection.key]: allItems.map((x) => (x.id === selItem.id ? { ...x, ...patch } : x)) });
  };

  /* What this layer edits. A sub-element edits exactly ONE field of its item — the Answer drawer
     holds the answer, nothing else — which is the whole reason it is its own layer. */
  const subField = parsed?.part && collection
    ? collection.fields.find((f) => f.key === parsed.part)
    : undefined;
  const viewCfg: Cfg = selItem ?? cfg;
  const viewSet = selItem ? patchItem : setCfg;

  /* ⚠️ §7.15 — a card CHILD is an ordinary widget. It opens the same fields its type opens out on
     the page, so there is one way to edit a Button whether it sits in a card or on the canvas.
     Without this the child drawer had no fields at all: `collection.fields` is empty for Card,
     because a child's fields belong to its own type, not to the card. */
  const childSpec = selItem && collection?.childTypes ? specById(String(selItem.type)) : undefined;

  const viewFields: WidgetField[] = subField ? [subField]
    : childSpec ? childSpec.fields
      : selItem ? (collection?.fields ?? [])
        : spec.fields;
  /* A child takes the CARD's width — its geometry is the card's job — so P2 is removed rather than
     shown doing nothing. */
  const viewPacks = childSpec ? childSpec.packs.filter((p) => p !== 'P2')
    : selItem ? (collection?.packs ?? [])
      : spec.packs;
  const viewRoles = childSpec ? childSpec.roles : subField
    ? (collection?.subElements?.find((s) => s.key === subField.key)?.role
      ? [collection!.subElements!.find((s) => s.key === subField.key)!.role!] : ['body' as const])
    : selItem ? collection?.roles : spec.roles;

  /* ── field rendering ── */

  /* A field writes cfg by default, or the STYLE store when it is the same value a pack owns —
     that is what lets Columns sit on both tabs and stay one setting rather than two that drift. */
  const readField = (f: WidgetField) =>
    (f.store === 'style' ? resolve(styles, nodeId, f.key as keyof NodeStyle).value : viewCfg[f.key]);

  /* ⚠️ Segmented options carry strings, but a style key like `columns` holds a NUMBER — writing '2'
     where the pack reads 2 meant the two controls silently stopped agreeing, which is the exact
     failure binding them was meant to prevent. Coerce on the way into the style store. */
  const writeField = (f: WidgetField, v: unknown) => {
    if (f.store === 'style') {
      const numeric = typeof v === 'string' && v !== '' && !Number.isNaN(Number(v));
      setStyle(nodeId, { [f.key]: numeric ? Number(v) : v } as Partial<NodeStyle>);
      return;
    }
    /* §2.2 — a change that invalidates another field repairs it in the SAME write and says so.
       Two writes would render an impossible intermediate state; a silent repair would lose a
       setting nobody saw change. */
    const fallout = f.consequence?.(v, viewCfg);
    viewSet({ [f.key]: v, ...(fallout?.patch ?? {}) });
    if (fallout) toast.success(fallout.say);
  };

  /** Options that depend on state — resolved per render, never cached. */
  const optionsOf = (f: WidgetField) =>
    (typeof f.options === 'function' ? f.options(viewCfg) : f.options);

  const set = (key: string, v: unknown) => viewSet({ [key]: v });

  const renderControl = (f: WidgetField) => {
    const v = readField(f);
    const set = (_k: string, val: unknown) => writeField(f, val);
    switch (f.control) {
      case 'text':
        return <TextField value={(v as string) ?? ''} onChange={(x) => set(f.key, x)} />;
      case 'textarea':
        return <textarea rows={3} value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
          className="h-auto w-full rounded border border-[#d1d5db] px-3 py-2 text-[13px] leading-[1.5] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />;
      case 'rich':
        return <RichText value={(v as string) ?? ''} onChange={(x) => set(f.key, x)} placeholder="Write something…" />;
      case 'number':
        return <NumberField value={(v as number) ?? f.min ?? 0} onChange={(x) => set(f.key, x)} min={f.min} max={f.max} />;
      case 'slider':
        return <SliderRow value={(v as number) ?? f.min ?? 0} onChange={(x) => set(f.key, x)} min={f.min} max={f.max} step={f.step} unit={f.unit} />;
      case 'toggle':
        return null; // toggles render as their own row, below
      case 'chips':
        return <Chips value={(v as string[]) ?? []} options={(optionsOf(f) as string[]) ?? REQUEST_STATUSES} onChange={(x) => set(f.key, x)} />;
      case 'select':
        return <SelectField value={(v as string) ?? ''} options={optionsOf(f) as string[]} onChange={(x) => set(f.key, x)} />;
      case 'segmented': {
        const opts = optionsOf(f) as { value: string; label: string }[];
        /* ⚠️ An ALIGNMENT segmented renders as joined icon buttons, everywhere, detected by its
           option VALUES rather than by its label or its key. Alignment fields are declared in a
           dozen specs under half a dozen key names (`align`, `textAlign`, `contentAlign`,
           `cellAlign`…), so keying off the name would leave some of them as word buttons — and a
           control that looks different in two panels reads as two different controls. */
        if (opts.length && opts.every((o) => ALIGN_ICON[o.value])) {
          return <AlignRow value={v === undefined ? '' : String(v)} options={opts} onChange={(x) => set(f.key, x)} />;
        }
        // Compared as strings so a numeric style value still lights its option.
        return <Segmented value={v === undefined ? '' : String(v)} options={opts} onChange={(x) => set(f.key, x)} />;
      }
      case 'color':
        return <ColorField value={(v as string) ?? '#3D8BD0'} onChange={(x) => set(f.key, x)} />;
      case 'upload':
        return <UploadZone value={v as string} onChange={(x) => set(f.key, x ?? '')} />;
      case 'icon':
        return <IconField value={icon} onChange={setIcon} />;
      case 'chipEditor':
        return <ChipEditor value={(v as string[]) ?? []} onChange={(x) => set(f.key, x)} />;
      case 'nine':
        return <NinePoint value={String(v ?? 'center')} onChange={(x) => set(f.key, x)} />;
      case 'columns':
        return <ColumnsEditor cfg={viewCfg} onChange={(patch) => viewSet(patch)} />;
      case 'sliderUnit':
        // §1.3 — slider, numeric readout and the unit beside it, as one row.
        return <SliderRow value={Number(v ?? f.min ?? 0)} onChange={(x) => set(f.key, x)} min={f.min} max={f.max} step={f.step} unit={f.unit ?? 'px'} />;
      case 'radius':
        return (
          <RadiusRow
            value={Number(v ?? 8)}
            onChange={(x) => set(f.key, x)}
            corners={viewCfg.corners as never}
            onCorners={(c) => set('corners', c)}
          />
        );
      case 'borderRow':
        return (
          <BorderRow
            width={Number(viewCfg.borderWidth ?? 0)}
            color={String(viewCfg.borderColor ?? '#E5E7EB')}
            sides={viewCfg.borderSides as never}
            onSides={(x) => set('borderSides', x)}
            onWidth={(x) => set('borderWidth', x)}
            onColor={(x) => set('borderColor', x)}
          />
        );
      case 'iconFrame':
        return (
          <IconFramePicker
            value={(viewCfg.frame as IconFrame) ?? 'none'}
            onChange={(v) => set('frame', v)}
          />
        );
      /* ⚠️ The shapes are DRAWN, not named. 'Circle' and 'Square' are words for pictures, and the
         picture is both faster to read and impossible to misread. Same rule as the divider's line
         picker and the icon frames. */
      case 'shape': {
        const opts = optionsOf(f) as { value: string; label: string }[];
        const mark = (v: string) => (
          <span className={`inline-block bg-[#94A3B8] ${v === 'circle' ? 'size-4 rounded-full' : v === 'wide' ? 'h-2.5 w-6 rounded-[2px]' : 'size-4 rounded-[3px]'}`} />
        );
        return (
          <span className="inline-flex overflow-hidden rounded border border-[#DFE5ED]">
            {opts.map((o, i) => (
              <button
                key={o.value}
                onClick={() => set(f.key, o.value)}
                title={o.label}
                className={`flex h-8 w-10 items-center justify-center transition-colors ${i > 0 ? 'border-l border-[#DFE5ED]' : ''} ${String(v) === o.value ? 'bg-[#EBF5FF]' : 'bg-white hover:bg-[#F5F7FA]'}`}
              >{mark(o.value)}</button>
            ))}
          </span>
        );
      }
      case 'tableContent': {
        /* Stored as rows of CELLS. The old shape was  objects for the item list;
           the sheet has no per-row identity to carry, so a plain string[][] is the honest form. */
        const raw = (viewCfg.rows as unknown[]) ?? [];
        const grid = raw.map((r) => (Array.isArray(r) ? (r as string[]) : ((r as Cfg)?.cells as string[]) ?? []));
        return <TableContentField rows={grid} onChange={(g) => set('rows', g)} />;
      }
      case 'lineStyle':
        return (
          <LineStylePicker
            value={(viewCfg.lineStyle as LineStyle) ?? 'solid'}
            color={String(viewCfg.lineColor ?? '#94A3B8')}
            thickness={Number(viewCfg.thickness ?? 2)}
            onChange={(v) => set('lineStyle', v)}
          />
        );
      case 'shadow':
        return (
          <ShadowBlock
            value={{
              on: viewCfg.shadowOn === true,
              color: String(viewCfg.shadowColor ?? '#0F172A'),
              type: (viewCfg.shadowType as 'outer' | 'inner') ?? 'outer',
              pos: String(viewCfg.shadowPos ?? 'bottom'),
            }}
            onChange={(x) => viewSet({ shadowOn: x.on, shadowColor: x.color, shadowType: x.type, shadowPos: x.pos })}
          />
        );
      case 'size':
        return (
          <SizeRow
            width={Number(viewCfg.boxWidth ?? 240)}
            height={viewCfg.boxHeight === undefined ? null : Number(viewCfg.boxHeight)}
            keep={viewCfg.keepRatio !== false}
            onChange={(x) => viewSet({
              ...(x.width !== undefined ? { boxWidth: x.width } : {}),
              ...(x.height !== undefined ? { boxHeight: x.height } : {}),
              ...(x.keep !== undefined ? { keepRatio: x.keep } : {}),
            })}
          />
        );
      case 'templates':
        return <TemplatePicker value={String(v ?? 'left')} onChange={(x) => set(f.key, x)} />;
      /* ⚠️ Both render as the SAME joined icon group every other alignment row uses. They used to be
         a recessed pill track, so "Alignment" looked like one control in a text element and a
         different one in an action card — and the difference carried no meaning, since both answer
         "where does this sit". Distribute keeps its five options and valign its four; only the
         chrome is shared. */
      case 'distribute':
        return (
          <AlignRow
            value={String(v ?? 'start')}
            options={[
              { value: 'start', label: 'Left' }, { value: 'center', label: 'Centre' },
              { value: 'end', label: 'Right' }, { value: 'between', label: 'Space between' },
              { value: 'around', label: 'Space around' },
            ]}
            onChange={(x) => set(f.key, x)}
          />
        );
      case 'valign':
        return (
          <AlignRow
            value={String(v ?? 'start')}
            options={[
              { value: 'start', label: 'Top' }, { value: 'center', label: 'Middle' },
              { value: 'end', label: 'Bottom' }, { value: 'stretch', label: 'Equal height' },
            ]}
            onChange={(x) => set(f.key, x)}
          />
        );
      case 'pills':
        return (
          <div className="flex flex-wrap gap-1.5">
            {(optionsOf(f) as { value: string; label: string }[]).map((o) => (
              <button
                key={o.value}
                onClick={() => set(f.key, o.value)}
                className={`h-7 rounded-full px-3 text-[12px] font-medium transition-colors ${
                  String(v) === o.value ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
                }`}
              >{o.label}</button>
            ))}
          </div>
        );
      case 'preset':
        return (
          <div className="grid grid-cols-4 gap-2">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.name}
                /* ⚠️ Replaces every colour and KEEPS the typeface — trying palettes must never
                   silently lose the font someone chose (§7.22). */
                onClick={() => viewSet({ primary: p.primary, secondary: p.secondary, neutral: p.neutral })}
                title={p.name}
                className="flex h-9 items-center justify-center gap-1 rounded border border-[#DFE5ED] transition-colors hover:border-[#3D8BD0]"
              >
                {[p.primary, p.secondary, p.neutral].map((c) => (
                  <span key={c} className="size-3.5 rounded-full" style={{ background: c }} />
                ))}
              </button>
            ))}
          </div>
        );
      case 'contrast': {
        /* The REAL backdrop: this band's own fill, or the page's when the background was pushed
           there. Anything else measures a colour nobody is looking at. */
        const scope = resolve(styles, nodeId, 'bgScope').value;
        const ownFill = resolve(styles, nodeId, 'bgFill').value;
        const pageBg = String(styles[PAGE_ID]?.bg ?? '#0F172A');
        const usePage = scope === 'page' || ownFill === 'none';
        return (
          <ContrastField
            spec={{
              fill: usePage ? 'color' : (ownFill as 'color' | 'image'),
              color: usePage ? pageBg : String(resolve(styles, nodeId, 'bg').value),
              image: String(resolve(styles, nodeId, 'bgImage').value ?? ''),
              overlay: Number(resolve(styles, nodeId, 'bgOverlay').value ?? 0),
              pageColor: pageBg,
            }}
            textColor={String(viewCfg.headingColor ?? '#FFFFFF')}
            onFix={(next) => {
              viewSet({ headingColor: next.color });
              if (next.overlay !== Number(resolve(styles, nodeId, 'bgOverlay').value ?? 0)) {
                setStyle(nodeId, { bgOverlay: next.overlay });
              }
              toast.success('Heading colour adjusted for readability');
            }}
          />
        );
      }
      case 'lockedToggle':
        // The §8.5 floor: shown as a locked-on row with a reason, never hidden.
        return null;
      case 'grid': {
        const rows = ((cfg.rows as Cfg[]) ?? []).length || 3;
        const cols = Number(cfg.cols ?? 3);
        return (
          <GridPicker
            rows={rows}
            cols={cols}
            max={f.max ?? 10}
            onChange={(r, c) => {
              /* Growing pads with blanks, shrinking truncates — and existing text KEEPS its cell,
                 so resizing never scrambles what is already typed. */
              const cur = ((cfg.rows as Cfg[]) ?? []);
              const next = Array.from({ length: r }, (_, i) => {
                const old = cur[i];
                const cells = Array.from({ length: c }, (_, j) => (old?.cells as string[])?.[j] ?? '');
                return { id: old?.id ?? `r${Date.now().toString(36)}${i}`, cells };
              });
              setCfg({ rows: next, cols: c });
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  /* Spacing is decided by what a field SITS NEXT TO, so it is computed here rather than declared per
     field — the lists are already filtered by `when`, so the previous entry is the one actually
     rendered above, not the one that would have been. */
  const renderField = (f: WidgetField, i?: number, arr?: WidgetField[]) => {
    const prev = i != null && arr ? arr[i - 1] : undefined;
    const afterToggle = prev?.control === 'toggle' || prev?.control === 'lockedToggle';
    if (f.control === 'lockedToggle') {
      return <ToggleRow key={f.key} label={f.label} on locked onChange={() => {}} lockNote={f.help} />;
    }
    if (f.control === 'toggle') {
      return (
        <ToggleRow
          key={f.key}
          label={f.label}
          on={cfg[f.key] !== false}
          help={f.help}
          onChange={(x) => set(f.key, x)}
        />
      );
    }
    const blank = f.warnWhenBlank && !String(readField(f) ?? '').trim();
    /* ⚠️ ShadowBlock draws its own "Shadow" row — the toggle IS the label. Letting Field add a
       second one printed "Shadow / Shadow" on every widget that has a shadow. The other box
       controls (radius, border, size) rely on Field's label, so only this one opts out. */
    const selfLabelled = f.control === 'shadow';
    /* ⚠️ A self-labelled block IS a switch row, so it gets NO Field wrapper at all — it owns its own
       spacing exactly like ToggleRow does. Wrapped, it inherited the wrapper's margin and its own
       `first:mt-0` zeroed out, which is how the Shadow block ended up 6px under the Divider switch,
       reading as that switch's setting rather than its own question. The Fragment keeps it a real
       sibling of the other rows so `first:` still resolves against them. */
    if (selfLabelled) return <Fragment key={f.key}>{renderControl(f)}</Fragment>;
    return (
      <Field
        key={f.key}
        label={f.label}
        help={f.help}
        divider={f.divider}
        tight={afterToggle}
      >
        {renderControl(f)}
        {/* Warns, never blocks — a hard stop teaches people to type a space. */}
        {blank && <Note tone="warn">{f.warnWhenBlank}</Note>}
      </Field>
    );
  };

  /* Fields for a tab, already filtered by their `when` predicate, then grouped. ⚠️ A group whose
     every field was filtered out is dropped here rather than rendering an empty accordion. */
  const groupsFor = (which: 'content' | 'style') => {
    const visible = viewFields.filter((f) => (f.tab ?? 'content') === which && (!f.when || f.when(viewCfg)));
    const order: string[] = [];
    const byGroup: Record<string, WidgetField[]> = {};
    visible.forEach((f) => {
      const g = f.group ?? 'Content';
      if (!byGroup[g]) { byGroup[g] = []; order.push(g); }
      byGroup[g].push(f);
    });
    return order.map((g) => ({ group: g, fields: byGroup[g] }));
  };

  /* Widget-level notes belong to the WIDGET. Repeating "these questions are authored, not fetched"
     on every question and every answer is noise, not guidance. */
  const notesFor = (which: 'content' | 'style') =>
    (parsed ? [] : (spec.notes ?? [])).filter((n) => (n.tab ?? 'content') === which && (!n.when || n.when(cfg)));

  const packProps = { styles, id: nodeId, setStyle, replaceStyle, roles: viewRoles as never };
  const open = gateOpen(spec);

  /* ── the collection (§4) ── */
  // Only the WIDGET layer shows the item list; an item does not contain itself.
  const col = selItem ? undefined : collection;
  const items = allItems;

  /* ⚠️ A new item is appended, SELECTED and its drawer OPENED (§4.1) — you type into the new thing
     rather than hunting for it — and it arrives with realistic copy, never `Untitled`. */
  const addItem = (extra?: Cfg) => {
    if (!col) return;
    const id = `${Date.now().toString(36)}${items.length}`;
    const item = { id, ...col.seed(items.length), ...extra };
    setCfg({ [col.key]: [...items, item] });
    onSelect(itemNodeId(nodeId, id));
  };

  const bulkAdd = (srcs: string[]) => {
    if (!col) return;
    const room = col.max ? Math.max(0, col.max - items.length) : srcs.length;
    const take = srcs.slice(0, room);
    const added = take.map((src, i) => ({ id: `${Date.now().toString(36)}b${i}`, ...col.seed(items.length + i), src }));
    setCfg({ [col.key]: [...items, ...added] });
    if (take.length < srcs.length) toast.error(`Added ${take.length} — this gallery holds ${col.max}`);
  };

  /* Item names come from the item's own text (§2.1), registered so the canvas chip and the
     breadcrumb say "How do I reset my password?" rather than "Item 2". */
  /* ⚠️ The WIDGET's node, not the selected one. While an item or a sub-element is selected `nodeId`
     is that deeper node, and building item ids off it produces `el-1~i0~a~i…` — a node that does
     not exist. Item ids always hang off the widget. */
  const widgetNode = parsed?.widget ?? nodeId;

  if (collection) {
    allItems.forEach((it, i) => {
      const inode = itemNodeId(widgetNode, it.id);
      registerItemName(inode, collection.label(it, i) || `Item ${i + 1}`);
      // ⚠️ Sub-elements too, or the Answer drawer is titled `a` — the raw config key, which names
      // nothing an editor recognises.
      collection.subElements?.forEach((se) => registerItemName(subNodeId(inode, se.key), se.name));
    });
  }

  /* §1.4 — the item list belongs INSIDE Content, in both panel models. Built once here so the
     accordion panel and the packs panel cannot drift into two different lists. */
  const collectionBlock = (
    <>
              {col && (!col.when || col.when(cfg)) && (
                <Group
                  title={col.group}
                  open={openGroups.includes(col.group)}
                  onToggle={() => toggleGroup(col.group)}
                  badge={<span className="text-[11px] text-[#9CA3AF]">{items.length}{col.max ? ` / ${col.max}` : ''}</span>}
                >
                  {/* Child blocks are ordinary widgets, so the Add action asks WHICH — a card can hold
                      a Text, an Image or a Button, and they are genuinely different things. */}
                  {col.childTypes && (
                    <div className="mb-1 flex gap-1.5">
                      {col.childTypes.map((ct) => (
                        <button
                          key={ct.type}
                          onClick={() => addItem({ type: ct.type })}
                          className="h-7 flex-1 rounded border border-[#DFE5ED] bg-white text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
                        >+ {ct.label}</button>
                      ))}
                    </div>
                  )}
                  <PortalItemList
                    items={items as never}
                    label={(it, i) => col.label(it as Cfg, i)}
                    meta={col.meta ? (it, i) => col.meta!(it as Cfg, i) : undefined}
                    /* Derived, not declared: the item's first two fields ARE its title and its
                       description, so a collection gets inline editing without restating them. */
                    noOpen={col.noOpen}
                    inlineKeys={col.noOpen || col.fields.length < 2 ? undefined : [col.fields[0].key, col.fields[1].key]}
                    hideable={col.hideable}
                    noAdd={col.noAdd}
                    /* §7.24 — the logo cannot be hidden, and the action is DISABLED with the reason
                       rather than removed: absent would leave someone hunting for it. */
                    lockedHide={(it) => (it.fixedVisible ? `The ${String(it.name)} always shows — a bar without it is not the product’s bar` : undefined)}
                    max={col.max}
                    addLabel={col.addLabel}
                    emptyHint={col.emptyHint}
                    onOpen={(it) => onSelect(itemNodeId(nodeId, it.id))}
                    onChange={(next) => setCfg({ [col.key]: next })}
                    onAdd={() => addItem()}
                  />
                  {col.bulkAdd && <BulkAdd onFiles={(srcs) => bulkAdd(srcs)} />}
                </Group>
              )}
    </>
  );

  return (
    <div className="flex h-full flex-col">
      {/* ── header ── */}
      <div className="flex-shrink-0 border-b border-[#F0F2F5] px-4 pb-0 pt-3">
        {/* ⚠️ No breadcrumb trail above the title. Stepping up to the parent survives as the back
            arrow ON the title row — one control instead of a row of ancestors that mostly repeated
            what the canvas already shows selected. */}
        {/* ⚠️ No back arrow, at any depth. Stepping up is what clicking the parent on the CANVAS
            already does, and the arrow only ever appeared on nested selections — so the header
            shifted position depending on how deep you were, which is the one thing a header should
            not do. Icon and title, left-aligned, always in the same place. */}
        <div className="mb-3 mt-0.5 flex items-center gap-2">
          <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]">
            {NODE_ICON[node.kind] ?? <Layers size={16} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-semibold text-[#364658]">{node.name}</span>
              {cfg.hidden === true && <Badge>Hidden</Badge>}
              {!open && <Badge>Locked</Badge>}
            </span>
            <span className="block text-[12px] text-[#7B8FA5]">{spec.name}</span>
          </span>
          {/* ⚠️ Reset sits with the NAME of what it resets. Above the header it read as a panel
              control — "reset the sidebar" — when it has always been about this one element. */}
          {/* ⚠️ Plain `title`, not the Radix Tooltip — this file never imported it, and a missing
              component in JSX is a runtime ReferenceError that builds clean and blanks the page. */}
          {onReset && (
            <button
              onClick={onReset}
              title="Reset this element to default"
              className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            ><RotateCcw size={15} /></button>
          )}
        </div>

      </div>

      {/* ── body ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-1">
        {/* §8.1 — the drawer must say WHICH kind of gate, because only one of them is the editor's
            to fix. A permission gets a link; a licence deliberately does not. */}
        {!open && spec.gate && (
          <Note
            tone="warn"
            action={spec.gate.kind === 'permission' && spec.gate.section
              ? { label: 'Open that setting', onClick: () => props.onOpenSetting?.(spec.gate!.section!) }
              : undefined}
          >{GATE_COPY[spec.gate.kind](spec.gate.setting)}</Note>
        )}
        {cfg.hidden === true && (
          <Note tone="warn">This widget is hidden from requesters. It stays on the page so you can put it back — nothing was removed.</Note>
        )}

        {/* ⚠️ Spec notes are NOT rendered at all. A standing explanation on every widget stops
            being read after the second time and pushes the first real control below the fold.
            What survives is only what is CONDITIONAL and carries a consequence: a closed gate
            and a hidden widget, both above, and the per-field blank-alt-text warning. */}

        {/* ⚠️ ONE scroll, not two tabs. Content and styling are the same job — you write a title and
            then you decide how it looks — and putting them behind tabs made the second half feel
            like a different screen you had to remember to visit. The section headers below are the
            only separation they need. */}
        {/* ── the NEW-ELEMENT accordion model ──────────────────────────────
            Content first and always open, then only the accordions this element needs, in panel
            order, with one opening by default. Blank in the coverage matrix means ABSENT. */}
        {spec.panel && !parsed ? (
          <PanelBody
            spec={spec}
            nodeId={nodeId}
            cfg={viewCfg}
            renderField={renderField}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            styles={styles}
            setStyle={setStyle}
            replaceStyle={replaceStyle}
            collectionSlot={collectionBlock}
          />
        ) : (
        <>
        <SectionLabel action={<ExpandAll keys={groupsFor('content').map((g) => g.group)} openGroups={openGroups} setOpen={setOpenGroups} />}>Content</SectionLabel>
        {(
          <>
            {groupsFor('content').map(({ group, fields }) => (
              <Group key={group} title={group} open={openGroups.includes(group)} onToggle={() => toggleGroup(group)}>
                {fields.map(renderField)}
              </Group>
            ))}
            {/* The §4 collection, when this widget has one and the state calls for it. */}
            {/* ⚠️ No Parts list. Every part is already reachable by CLICKING it on the canvas —
                that is what `subElements` wrap themselves in `<Sel>` for — so the list was a second
                route to the same place, taking a whole section to say what pointing at the words
                says faster. */}
            {/* Table rows edit their cells rather than a field list. */}
            {selItem && collection?.isTableRow && (
              <Group title="Cells" open={openGroups.includes('Cells')} onToggle={() => toggleGroup('Cells')}>
                {((selItem.cells as string[]) ?? []).map((cell, ci) => (
                  <Field key={ci} label={`Column ${ci + 1}`}>
                    <TextField
                      value={cell}
                      onChange={(v) => patchItem({ cells: ((selItem.cells as string[]) ?? []).map((c, j) => (j === ci ? v : c)) })}
                    />
                  </Field>
                ))}
              </Group>
            )}

            {collectionBlock}
          </>
        )}

        {/* Design owns the spec groups AND every pack, plus the shared Spacing block. */}
        {/* ⚠️ The whole Design section is DROPPED when a widget has nothing to put in it. An empty
            heading over a Spacing block is a section that exists to hold a label. */}
        {/* ⚠️ Design is dropped ENTIRELY — heading and body — when a widget has nothing to style.
            Gating only the heading left the shared Spacing block floating under Content, which reads
            as a content setting and is the one thing it is not. */}
        {(groupsFor('style').length > 0 || (viewPacks ?? []).length > 0) && (
          <SectionLabel action={<ExpandAll keys={[...groupsFor('style').map((g) => g.group), ...(viewPacks ?? []), '__spacing']} openGroups={openGroups} setOpen={setOpenGroups} />}>Design</SectionLabel>
        )}
        {(groupsFor('style').length > 0 || (viewPacks ?? []).length > 0) && (
          <>
            {/* Widget-specific styling first — it is what this widget is, before the generic packs. */}
            {/* ⚠️ A pack whose TITLE matches a spec group is rendered INSIDE that group rather than
                beside it. Row layout is a content-config field but belongs under Arrangement with
                the gap and the dividers; without this merge the panel showed two sections both
                called "Arrangement", which is worse than either placement. */}
            {groupsFor('style').map(({ group, fields }) => {
              const merged = (viewPacks ?? []).filter((pk) => ALL_PACKS[pk]?.title === group);
              return (
                <Group key={group} title={group} open={openGroups.includes(group)} onToggle={() => toggleGroup(group)}>
                  {fields.map(renderField)}
                  {merged.map((pk) => {
                    const P = ALL_PACKS[pk];
                    return <P.Render key={pk} {...packProps} />;
                  })}
                </Group>
              );
            })}
            {(viewPacks ?? []).map((pk) => {
              const pack = ALL_PACKS[pk];
              // Already drawn inside the spec group that shares its title.
              if (!pack || groupsFor('style').some((g) => g.group === pack.title)) return null;
              return (
                <Group
                  key={pk}
                  title={pack.title}
                  open={openGroups.includes(pk)}
                  onToggle={() => toggleGroup(pk)}
                >
                  <pack.Render {...packProps} />
                </Group>
              );
            })}
            {/* ⚠️ Every widget gets the SAME Spacing section, whichever styling model it uses. The
                packs-model widgets had padding buried inside the Style pack as a lone slider, so
                "spacing" meant two different controls depending on which element you had selected.
                One nested-box matrix, one place, everywhere. */}
            <Group
              title="Spacing"
              open={openGroups.includes('__spacing')}
              onToggle={() => toggleGroup('__spacing')}
            >
              <SpacingMatrix style={styles[nodeId] ?? {}} onChange={(p) => setStyle(nodeId, p)} />
            </Group>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}
