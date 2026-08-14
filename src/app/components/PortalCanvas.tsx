import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Baseline, Bold,
  ChevronRight, Copy, GripHorizontal, GripVertical, Italic, Link2, Plus, SquareDashed,
  StretchHorizontal, Trash2, Underline,
} from 'lucide-react';
// ArrowLeft stays in use by the card toolbar's "Move left".
import { toast } from 'sonner';
import { AiSparkle } from './AiSparkle';
import { HEADING_SIZE, SECTION_LAYOUTS, TEXT_STYLES, ZERO_BOX, nodeById } from './portalPageModel';
import type { NodeStyle, PortalStyles, SpacingBox } from './portalPageModel';

/* Canvas selection layer.
 *
 * Selection is explicit — every selectable thing wraps itself in <Sel id="…"> and the registry in
 * portalPageModel says what it is. Clicking stops propagation, so the innermost wrapper wins and
 * the chip's ❯ steps back up; that is the whole "blocks + their key children" model.
 *
 * The floating toolbar is KIND-AWARE, the way Duda's is: a section gets ↓↑ because that is the axis
 * it can move on, a card gets ←→, and text swaps the light bar for the dark rich-text one. Showing
 * a section the same buttons as a paragraph would be quicker to build and wrong. */

interface CanvasCtx {
  /** False in Preview, where the page must behave like the real portal. */
  enabled: boolean;
  selectedId: string | null;
  hoverId: string | null;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  styles: PortalStyles;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  /** Adds a section with `layout` after the block at `afterId`. */
  addSection: (afterId: string, rows: number[][]) => void;
  /** Splits a column, keeping every column in that row equal width. */
  addColumnBeside: (columnId: string, side: 'left' | 'right') => void;
  /** Drops a catalogue element into a column. */
  dropInColumn: (columnId: string, elementType: string) => void;
  /** Drops onto a seam — builds a new one-column section there and puts the element in it. */
  dropAtSeam: (afterId: string, elementType: string) => void;
  /** Drops into a built-in row, alongside the cards already there. */
  dropInRow: (rowId: string, elementType: string) => void;
  /* ── toolbar actions ── */
  moveNode: (id: string, dir: 'prev' | 'next') => void;
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  /** True when this node has an identity that can be cloned. */
  canDuplicate: (id: string) => boolean;
  addInside: (id: string) => void;
}

const Ctx = createContext<CanvasCtx>({
  enabled: false, selectedId: null, hoverId: null,
  select: () => {}, setHover: () => {}, styles: {}, setStyle: () => {},
  addSection: () => {}, addColumnBeside: () => {}, dropInColumn: () => {}, dropAtSeam: () => {}, dropInRow: () => {},
  moveNode: () => {}, duplicateNode: () => {}, deleteNode: () => {}, canDuplicate: () => false, addInside: () => {},
});

/** Reads a dragged catalogue element off a drop event, or null when it isn't one of ours. */
export const draggedElement = (e: React.DragEvent) => e.dataTransfer.getData('text/portal-element') || null;

export const CanvasProvider = Ctx.Provider;
export const useCanvas = () => useContext(Ctx);

/** Style overrides for a node, as inline CSS the preview can spread onto its element. */
export function styleOf(styles: PortalStyles, id: string): React.CSSProperties {
  const s = styles[id];
  if (!s) return {};
  const css: React.CSSProperties = {};
  if (s.align) css.textAlign = s.align;
  if (s.bg) css.background = s.bg;
  if (s.radius !== undefined) css.borderRadius = `${s.radius}px`;
  // Per-corner wins over the single value — it is the more specific instruction.
  if (s.corners) {
    css.borderTopLeftRadius = `${s.corners.tl}px`; css.borderTopRightRadius = `${s.corners.tr}px`;
    css.borderBottomRightRadius = `${s.corners.br}px`; css.borderBottomLeftRadius = `${s.corners.bl}px`;
  }
  if (s.borderWidth) {
    css.borderWidth = `${s.borderWidth}px`;
    css.borderStyle = s.borderStyle ?? 'solid';
    css.borderColor = s.borderColor ?? '#E5E7EB';
  }
  if (s.padY !== undefined) { css.paddingTop = `${s.padY}px`; css.paddingBottom = `${s.padY}px`; }
  // Vertical sides in px, horizontal in % — the units the matrix edits in. Margin is applied by
  // sizeOf() on the wrapper; only padding belongs on the painted element.
  if (s.padding) {
    css.paddingTop = `${s.padding.top}px`; css.paddingBottom = `${s.padding.bottom}px`;
    css.paddingLeft = `${s.padding.left}%`; css.paddingRight = `${s.padding.right}%`;
  }
  /* The same floor the wrapper gets, so the painted box grows with it rather than sitting short
     inside a taller outline. A FLOOR, not a fixed height — content is never clipped. */
  if (s.height !== undefined) css.minHeight = `${s.height}px`;
  if (s.color) css.color = s.color;
  if (s.fontSize) css.fontSize = `${s.fontSize}px`;
  if (s.heading && !s.fontSize) css.fontSize = `${HEADING_SIZE[s.heading]}px`;
  if (s.bold !== undefined) css.fontWeight = s.bold ? 700 : undefined;
  if (s.italic) css.fontStyle = 'italic';
  if (s.underline) css.textDecoration = 'underline';
  return css;
}

/* Size lives on the SELECTION WRAPPER, not on the painted element inside it.
 *
 * Two reasons. The outline and handles are drawn on the wrapper, so with the size on the child the
 * box you see and the box you drag drift apart. And a dragged height is a FLOOR, not a fixed
 * height — `minHeight` lets an element grow when its content needs more room, so resizing never
 * clips or squashes what is inside it. `maxWidth: 100%` keeps a resized card inside its grid cell
 * instead of bursting out of the layout. */
export function sizeOf(styles: PortalStyles, id: string): React.CSSProperties {
  const s = styles[id];
  if (!s) return {};
  const css: React.CSSProperties = {};
  /* A row member takes a SHARE, not a width: every sibling carries one, so the row always adds up
     to 100% and stays aligned however you drag. A standalone element still takes a plain width. */
  if (s.flex !== undefined) css.flex = `${s.flex} 1 0%`;
  else if (s.width !== undefined) { css.width = `${s.width}px`; css.maxWidth = '100%'; css.flex = '0 0 auto'; }
  if (s.height !== undefined) css.minHeight = `${s.height}px`;
  if (s.margin) {
    css.marginTop = `${s.margin.top}px`; css.marginBottom = `${s.margin.bottom}px`;
    css.marginLeft = `${s.margin.left}%`; css.marginRight = `${s.margin.right}%`;
  }
  return css;
}

/* ── toolbars ────────────────────────────────────────────────────────────── */

const btn = 'flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
const btnOff = 'flex size-7 items-center justify-center rounded text-[#CBD5E1] cursor-not-allowed';

/* Light toolbar for everything that isn't text. Icons only: Content and Style both live in the
   right panel, so a "Design" pill here would be a second door to a room you are already in.
   Every button does the thing it says — nothing here is a placeholder. */
function ElementToolbar({ id, kind, name }: { id: string; kind: string; name: string }) {
  const { styles, setStyle, moveNode, duplicateNode, deleteNode, canDuplicate, addInside } = useCanvas();

  /** Side-by-side things move on the horizontal axis; stacked bands move on the vertical one. */
  const horizontal = kind === 'card' || kind === 'column';
  const moves: [string, ReactNode, 'prev' | 'next'][] = horizontal
    ? [['Move left', <ArrowLeft key="l" size={15} />, 'prev'], ['Move right', <ArrowRight key="r" size={15} />, 'next']]
    : [['Move down', <ArrowDown key="d" size={15} />, 'next'], ['Move up', <ArrowUp key="u" size={15} />, 'prev']];

  /** A container can take a child; a leaf cannot. */
  const canAdd = kind === 'section' || kind === 'card' || kind === 'column' || kind === 'nav';
  const dupOk = canDuplicate(id);

  /** Alignment cycles — one button, three states, rather than three buttons in a 7-slot bar. */
  const cycleAlign = () => {
    const order = ['left', 'center', 'right'] as const;
    const cur = styles[id]?.align ?? 'left';
    setStyle(id, { align: order[(order.indexOf(cur) + 1) % order.length] });
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      <span className="flex size-7 cursor-grab items-center justify-center text-[#9CA3AF]"><GripVertical size={14} /></span>
      {moves.map(([label, ic, dir]) => (
        <button key={label} className={btn} title={label} onClick={() => moveNode(id, dir)}>{ic}</button>
      ))}
      {canAdd && (
        <button className={btn} title="Add an element inside" onClick={() => addInside(id)}><Plus size={15} /></button>
      )}
      <button
        className={dupOk ? btn : btnOff}
        title={dupOk ? 'Duplicate' : 'This block is part of the page layout and can’t be duplicated'}
        onClick={() => dupOk && duplicateNode(id)}
      ><Copy size={14} /></button>
      {kind === 'section' && (
        <button
          className={btn}
          title="Clear all padding"
          onClick={() => { setStyle(id, { padding: ZERO_BOX }); toast.success(`Padding cleared on ${name}`); }}
        ><SquareDashed size={15} /></button>
      )}
      {horizontal && (
        <button className={btn} title={`Align — ${styles[id]?.align ?? 'left'}`} onClick={cycleAlign}>
          <StretchHorizontal size={15} />
        </button>
      )}
      <button
        className="flex size-7 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]"
        title="Delete"
        onClick={() => deleteNode(id)}
      ><Trash2 size={14} /></button>
    </div>
  );
}

/* Resize handles — functional.
 *
 * SQUARES resize the element (width / height in px). The two PILLS drag SPACING instead: the bottom
 * pill sets vertical padding, the left pill horizontal. That split is deliberate — an element's size
 * and the space inside it are different intentions, so they get different-looking grips, and the
 * magenta guides + live badge appear only for spacing, where you need to see what you are setting. */
function SelectionHandles({ id, elRef }: { id: string; elRef: React.RefObject<HTMLDivElement | null> }) {
  const { styles, setStyle } = useCanvas();
  const [live, setLive] = useState<{ kind: 'size' | 'padY' | 'padX'; label: string } | null>(null);
  const drag = useRef<{
    kind: 'size' | 'padY' | 'padX'; corner: string; x: number; y: number;
    w: number; h: number; pad: SpacingBox; parentW: number;
    /** Node ids sharing this row, their starting widths, and where the dragged one sits. */
    siblings: string[]; widths: number[]; index: number;
  } | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;

      if (d.kind === 'size') {
        const patch: Partial<NodeStyle> = {};
        const horiz = d.corner.includes('e') || d.corner.includes('w');

        /* Widening one card in a row must narrow its neighbours, or the row stops adding up and
           the cards fall out of alignment. Everyone in the row gets a share; the dragged one takes
           what it asked for and the rest split the remainder in their existing proportions. */
        if (horiz && d.siblings.length > 1) {
          const total = d.widths.reduce((a, b) => a + b, 0);
          const i = d.index;
          const floor = 60;
          const target = Math.max(floor, Math.min(d.widths[i] + (d.corner.includes('w') ? -dx : dx), total - floor * (d.siblings.length - 1)));
          const rest = total - target;
          const othersTotal = total - d.widths[i];
          d.siblings.forEach((sib, j) => {
            const w = j === i ? target : othersTotal > 0 ? (d.widths[j] / othersTotal) * rest : rest / (d.siblings.length - 1);
            setStyle(sib, { flex: Math.round(w) });
          });
          setLive({ kind: 'size', label: `${Math.round((target / total) * 100)}% of row` });
        } else if (horiz) {
          patch.width = Math.max(40, Math.round(d.corner.includes('w') ? d.w - dx : d.w + dx));
        }

        if (d.corner.includes('s')) patch.height = Math.max(24, Math.round(d.h + dy));
        if (d.corner.includes('n')) patch.height = Math.max(24, Math.round(d.h - dy));
        if (Object.keys(patch).length) {
          setStyle(id, patch);
          if (!horiz || d.siblings.length <= 1) {
            setLive({ kind: 'size', label: `${patch.width ?? Math.round(d.w)} × ${patch.height ?? Math.round(d.h)}` });
          }
        }
      } else if (d.kind === 'padY') {
        const v = Math.max(0, Math.min(200, Math.round(d.pad.top + dy)));
        setStyle(id, { padding: { ...d.pad, top: v, bottom: v } });
        setLive({ kind: 'padY', label: `${v}px` });
      } else {
        const v = Math.max(0, Math.min(45, Math.round(d.pad.left + (dx / Math.max(d.parentW, 1)) * 100)));
        setStyle(id, { padding: { ...d.pad, left: v, right: v } });
        setLive({ kind: 'padX', label: `${v}%` });
      }
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      setLive(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [id, setStyle]);

  const begin = (e: React.MouseEvent, kind: 'size' | 'padY' | 'padX', corner = '') => {
    e.preventDefault();
    e.stopPropagation();
    const el = elRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Row members are the direct [data-node] children of this element's parent.
    const row = [...(el.parentElement?.children ?? [])].filter((c) => c instanceof HTMLElement && c.dataset.node) as HTMLElement[];
    drag.current = {
      kind, corner, x: e.clientX, y: e.clientY, w: r.width, h: r.height,
      pad: styles[id]?.padding ?? ZERO_BOX,
      parentW: el.parentElement?.getBoundingClientRect().width ?? r.width,
      siblings: row.map((c) => c.dataset.node!),
      widths: row.map((c) => c.getBoundingClientRect().width),
      index: row.indexOf(el),
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = kind === 'padY' ? 'ns-resize'
      : kind === 'padX' ? 'ew-resize'
      : corner === 'n' || corner === 's' ? 'ns-resize'
      : corner === 'e' || corner === 'w' ? 'ew-resize'
      : corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize';
  };

  const sq = 'absolute size-[7px] rounded-[1px] border border-[#3D8BD0] bg-white';
  const pad = styles[id]?.padding ?? ZERO_BOX;
  const corners: [string, string][] = [
    ['nw', '-left-[3px] -top-[3px] cursor-nwse-resize'],
    ['ne', '-right-[3px] -top-[3px] cursor-nesw-resize'],
    ['sw', '-bottom-[3px] -left-[3px] cursor-nesw-resize'],
    ['se', '-bottom-[3px] -right-[3px] cursor-nwse-resize'],
    ['n', '-top-[3px] left-1/2 -translate-x-1/2 cursor-ns-resize'],
    ['e', '-right-[3px] top-1/2 -translate-y-1/2 cursor-ew-resize'],
  ];

  return (
    <span className="absolute inset-0 z-20">
      {/* Magenta guides mark the padded edges while you drag them. */}
      {live?.kind === 'padY' && (
        <>
          <span className="pointer-events-none absolute inset-x-0 h-[2px] bg-[#EC4899]" style={{ top: pad.top }} />
          <span className="pointer-events-none absolute inset-x-0 h-[2px] bg-[#EC4899]" style={{ bottom: pad.bottom }} />
        </>
      )}
      {live?.kind === 'padX' && (
        <>
          <span className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#EC4899]" style={{ left: `${pad.left}%` }} />
          <span className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#EC4899]" style={{ right: `${pad.right}%` }} />
        </>
      )}

      {corners.map(([c, cls]) => (
        <span key={c} onMouseDown={(e) => begin(e, 'size', c)} className={`${sq} ${cls} pointer-events-auto`} />
      ))}

      {/* Pills = spacing grips. Bottom drags vertical padding, left drags horizontal. */}
      <span
        onMouseDown={(e) => begin(e, 'padY')}
        title="Drag to change vertical spacing"
        className="pointer-events-auto absolute -bottom-[3px] left-1/2 h-[6px] w-[18px] -translate-x-1/2 cursor-ns-resize rounded-full border border-[#3D8BD0] bg-white"
      />
      <span
        onMouseDown={(e) => begin(e, 'padX')}
        title="Drag to change horizontal spacing"
        className="pointer-events-auto absolute -left-[3px] top-1/2 h-[18px] w-[6px] -translate-y-1/2 cursor-ew-resize rounded-full border border-[#3D8BD0] bg-white"
      />

      {live && (
        <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[11px] font-medium text-white">
          {live.label}
        </span>
      )}
    </span>
  );
}

/** Dark rich-text toolbar — Duda's treatment, and every control here is real. */
function TextToolbar({ id }: { id: string }) {
  const { styles, setStyle } = useCanvas();
  const s: NodeStyle = styles[id] ?? {};
  const tBtn = (on?: boolean) =>
    `flex size-7 items-center justify-center rounded transition-colors ${on ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-0.5 rounded bg-[#1E293B] px-1.5 py-1 shadow-lg"
    >
      <span className="flex size-7 cursor-grab items-center justify-center text-white/40"><GripVertical size={14} /></span>
      <span className="flex size-7 items-center justify-center"><AiSparkle size={14} /></span>
      <span className="mx-0.5 h-4 w-px bg-white/20" />

      <button className={tBtn(s.bold)} title="Bold" onClick={() => setStyle(id, { bold: !s.bold })}><Bold size={14} /></button>
      <button className={tBtn(s.italic)} title="Italic" onClick={() => setStyle(id, { italic: !s.italic })}><Italic size={14} /></button>
      <button className={tBtn(s.underline)} title="Underline" onClick={() => setStyle(id, { underline: !s.underline })}><Underline size={14} /></button>

      <span className="mx-0.5 h-4 w-px bg-white/20" />

      {/* Theme style. The * is Duda's override marker — it means this text no longer follows the
          theme, which is the one thing that makes a theme panel trustworthy. */}
      <select
        value={s.heading ?? 'PAR'}
        onChange={(e) => setStyle(id, { heading: e.target.value, fontSize: undefined })}
        className="h-7 cursor-pointer rounded bg-white/10 px-1.5 text-[12px] text-white outline-none"
      >
        {TEXT_STYLES.map((t) => <option key={t} value={t} className="text-[#364658]">{t}{s.fontSize ? '*' : ''}</option>)}
      </select>

      <select
        value={s.fontSize ?? HEADING_SIZE[s.heading ?? 'PAR']}
        onChange={(e) => setStyle(id, { fontSize: Number(e.target.value) })}
        className="h-7 w-[52px] cursor-pointer rounded bg-white/10 px-1 text-[12px] text-white outline-none"
      >
        {[12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40, 48].map((n) => (
          <option key={n} value={n} className="text-[#364658]">{n}</option>
        ))}
      </select>

      <span className="mx-0.5 h-4 w-px bg-white/20" />

      <label className={`${tBtn()} relative cursor-pointer`} title="Text color">
        <Baseline size={14} />
        <input
          type="color"
          value={s.color ?? '#364658'}
          onChange={(e) => setStyle(id, { color: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Ic]) => (
        <button key={a} className={tBtn(s.align === a)} title={`Align ${a}`} onClick={() => setStyle(id, { align: a })}>
          <Ic size={14} />
        </button>
      ))}
      <button className={tBtn()} title="Link" onClick={() => toast.success('Link picker opens with the block model')}><Link2 size={14} /></button>
    </div>
  );
}

/* ── add-section seam ────────────────────────────────────────────────────── */

/** Wireframe tile drawn FROM the layout data, so it can't promise a shape you don't get. */
function LayoutTile({ rows }: { rows: number[][] }) {
  return (
    <span className="flex h-[34px] w-[46px] flex-col gap-[3px] rounded-[3px] border border-[#364658] p-[3px]">
      {rows.map((row, i) => (
        <span key={i} className="flex flex-1 gap-[3px]">
          {row.map((w, j) => <span key={j} style={{ flex: w }} className="rounded-[1px] border border-[#364658]" />)}
        </span>
      ))}
    </span>
  );
}

/* The seam between two sections: an invisible strip that becomes a blue bar on hover, carrying the
   "+ Add Section" pill and a drag grip for stretching the section above it. */
export function AddSectionSeam({ afterId }: { afterId: string }) {
  const { enabled, addSection, setStyle, dropAtSeam } = useCanvas();
  const [hover, setHover] = useState(false);
  const [picking, setPicking] = useState(false);
  const [live, setLive] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; h: number } | null>(null);

  /* The bar IS the bottom edge of the block above — dragging it stretches that block. */
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      const h = Math.max(60, Math.round(drag.current.h + (e.clientY - drag.current.y)));
      setStyle(afterId, { height: h });
      setLive(h);
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      setLive(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [afterId, setStyle]);

  /* Clicking away closes the picker — that replaces the Back arrow, which was a second way to do
     what dismissing already does. */
  useEffect(() => {
    if (!picking) return;
    const away = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) { setPicking(false); setHover(false); }
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPicking(false); setHover(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [picking]);

  if (!enabled) return null;

  const beginResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = document.querySelector(`[data-node="${afterId}"]`);
    if (!prev) return;
    drag.current = { y: e.clientY, h: prev.getBoundingClientRect().height };
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const showBar = hover || picking || !!live;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      /* Dropping on the seam builds its own section — an element doesn't have to be aimed into an
         existing one, which would make adding anything a two-step job. */
      onDragOver={(e) => { if (draggedElement(e) !== null || e.dataTransfer.types.includes('text/portal-element')) { e.preventDefault(); setDropping(true); } }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        const type = draggedElement(e);
        setDropping(false);
        if (!type) return;
        e.preventDefault();
        e.stopPropagation();
        dropAtSeam(afterId, type);
      }}
      className={`relative z-30 -my-1 h-3 ${dropping ? 'z-40' : ''}`}
    >
      {dropping && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-[#3D8BD0] shadow-[0_0_0_4px_rgba(61,139,208,0.25)]" />
      )}
      {showBar && (
        <>
          {/* The bar itself doubles as the section's bottom edge — drag it to stretch. */}
          <div
            onMouseDown={beginResize}
            className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 cursor-ns-resize bg-[#3D8BD0]"
            title="Drag to resize the section above"
          >
            <span className="absolute right-[18%] top-1/2 -translate-y-1/2 text-white/70"><GripHorizontal size={14} /></span>
          </div>
          {live !== null && (
            <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[11px] font-medium text-white">
              {live}px
            </span>
          )}
          <button
            onClick={() => setPicking((p) => !p)}
            className="absolute left-1/2 top-1/2 z-10 inline-flex h-7 -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-[#3D8BD0] px-3.5 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-[#2d6ca0]"
          >+ Add Section</button>
        </>
      )}

      {picking && (
        /* Always above the CTA. A seam near the page bottom had nowhere to open downward, and a
           picker that sometimes flips is harder to aim at than one that never moves. */
        <div ref={popRef} className="absolute bottom-7 left-1/2 z-40 w-[430px] -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
          <div className="mb-3 text-center text-[13px] font-medium text-[#364658]">Choose a layout for your section</div>
          <div className="grid grid-cols-5 gap-2">
            {SECTION_LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => { addSection(afterId, l.rows); setPicking(false); setHover(false); }}
                className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-[#F1F5F9]"
              ><LayoutTile rows={l.rows} /></button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** The `+` affordances on an empty column: sides insert a sibling column, centre adds an element. */
export function ColumnAdders({ columnId }: { columnId: string }) {
  const { addColumnBeside, addInside } = useCanvas();
  const dot = 'flex size-5 items-center justify-center rounded-full bg-[#3D8BD0] text-white shadow-sm transition-transform hover:scale-110';
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); addColumnBeside(columnId, 'left'); }}
        title="Add a column to the left"
        className={`${dot} absolute -left-2.5 top-1/2 z-20 -translate-y-1/2`}
      ><Plus size={13} /></button>
      {/* The middle one swaps the right panel to the element library — the list you pick from is
          the answer to "add what?", so it takes the panel rather than opening a second surface. */}
      <button
        onClick={(e) => { e.stopPropagation(); addInside(columnId); }}
        title="Add an element here"
        className={`${dot} absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2`}
      ><Plus size={13} /></button>
      <button
        onClick={(e) => { e.stopPropagation(); addColumnBeside(columnId, 'right'); }}
        title="Add a column to the right"
        className={`${dot} absolute -right-2.5 top-1/2 z-20 -translate-y-1/2`}
      ><Plus size={13} /></button>
    </>
  );
}

/* ── selection wrapper ───────────────────────────────────────────────────── */

export function Sel({ id, children, className = '', toolbarBelow = false, style: baseStyle }: {
  id: string;
  children: ReactNode;
  className?: string;
  /** Bands at the very top have no room above them for the toolbar. */
  toolbarBelow?: boolean;
  /** Layout defaults from the page (a row member's default share). sizeOf overrides these. */
  style?: React.CSSProperties;
}) {
  const { enabled, selectedId, hoverId, select, setHover, styles } = useCanvas();
  const ref = useRef<HTMLDivElement>(null);
  const node = nodeById(id);
  // Size applies in preview too — a resized page must publish the way it was designed.
  const size = { ...baseStyle, ...sizeOf(styles, id) };
  if (!enabled || !node) return <div style={size} className={className}>{children}</div>;

  const on = selectedId === id;
  const hov = hoverId === id && !on;
  const ring = on
    ? 'outline-2 outline-[#3D8BD0]'
    : hov ? 'outline-1 outline-[#3D8BD0]/60' : 'outline-1 outline-transparent';

  return (
    <div
      ref={ref}
      data-node={id}
      style={size}
      onMouseOver={(e) => { e.stopPropagation(); setHover(id); }}
      onMouseOut={(e) => { e.stopPropagation(); setHover(null); }}
      onClick={(e) => { e.stopPropagation(); select(id); }}
      /* No display change here — call sites pass their own layout classes (the header is a flex
         row), so forcing flex-col on every wrapper would rearrange the page. The painted child
         gets the same minHeight instead, which keeps the two boxes the same size. */
      className={`relative outline -outline-offset-1 transition-[outline-color] ${ring} ${className}`}
    >
      {/* Name chip on HOVER only. Once selected, the toolbar and handles say what you have, and the
          panel's breadcrumb handles stepping up — a chip on top of that is one label too many. */}
      {hov && (
        <span
          /* Sits fully ABOVE the element, clear of its top edge. Straddling the border put the
             chip inside the card and covered the content it was meant to label. */
          className={`pointer-events-none absolute left-0 z-30 flex items-center gap-0.5 rounded-sm rounded-b-none bg-[#3D8BD0] px-1.5 text-[10px] font-medium leading-[16px] text-white ${
            toolbarBelow ? 'top-0' : '-top-4'
          }`}
        >
          {node.parent && <ChevronRight size={11} className="rotate-180 opacity-70" />}
          {node.name}
        </span>
      )}

      {on && <SelectionHandles id={id} elRef={ref} />}

      {on && (
        <div className={`absolute left-0 z-40 ${toolbarBelow ? 'top-5' : '-top-11'}`}>
          {node.kind === 'text' ? <TextToolbar id={id} /> : <ElementToolbar id={id} kind={node.kind} name={node.name} />}
        </div>
      )}

      {children}
    </div>
  );
}
