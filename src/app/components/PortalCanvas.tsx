import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlignCenter, AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical,
  AlignLeft, AlignRight, AlignStartHorizontal, AlignStartVertical, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUp, Baseline, Bold, ChevronRight, Copy, GripHorizontal, GripVertical, Italic, Link2,
  MoveHorizontal, MoveVertical, Plus,
  Replace, SquareDashed, Trash2, Underline,
} from 'lucide-react';
// ArrowLeft stays in use by the card toolbar's "Move left".
import { toast } from 'sonner';
import { AiSparkle } from './AiSparkle';
import { HEADING_SIZE, SECTION_LAYOUTS, TEXT_STYLES, ZERO_BOX, nodeById, nodePath, placedIn } from './portalPageModel';
import { boxCss, containerCss } from './portalStyleResolver';
import { PORTAL_ELEMENTS, PORTAL_ELEMENT_GROUPS } from './supportPortalData';
import { elementIcon } from './SupportPortalAddPanel';
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
  addInside: (id: string, elementType?: string) => void;
  /** Opens the icon grid against a node, on the canvas — the inline half of the icon field. */
  pickIcon: (id: string, anchor: DOMRect) => void;
  /** Swaps a placed element for a different kind, in the same spot. */
  replaceElement: (id: string, elementType: string) => void;
  /** Drops `sourceId` at `targetId`'s position — the grip's drag-to-reorder. */
  moveTo: (sourceId: string, targetId: string) => void;
  /** True when the two ids sit in the same list, so a drop between them is meaningful. */
  areSiblings: (a: string, b: string) => boolean;
  /** Writes a text node's words back to whichever store owns them — the inline-edit path. */
  setText: (id: string, text: string) => void;
}

const Ctx = createContext<CanvasCtx>({
  enabled: false, selectedId: null, hoverId: null,
  select: () => {}, setHover: () => {}, styles: {}, setStyle: () => {}, setText: () => {},
  addSection: () => {}, addColumnBeside: () => {}, dropInColumn: () => {}, dropAtSeam: () => {}, dropInRow: () => {},
  moveNode: () => {}, duplicateNode: () => {}, deleteNode: () => {}, canDuplicate: () => false, addInside: () => {},
  moveTo: () => {}, areSiblings: () => false, replaceElement: () => {}, pickIcon: () => {},
});

/** Reads a dragged catalogue element off a drop event, or null when it isn't one of ours. */
export const draggedElement = (e: React.DragEvent) => e.dataTransfer.getData('text/portal-element') || null;
/** Reads a node being dragged by its grip. Same caveat: only readable on `drop`. */
export const draggedNode = (e: React.DragEvent) => e.dataTransfer.getData('text/portal-move') || null;
export const MOVE_MIME = 'text/portal-move';

export const CanvasProvider = Ctx.Provider;
export const useCanvas = () => useContext(Ctx);

/* Style for a node, as inline CSS the preview spreads onto its element.
 *
 * ⚠️ RESOLVED, not own-only: a value set on a section now paints on every descendant that has not
 * overridden it, which is the §1.1 inheritance model. `containerCss` skips anything whose nearest
 * source is the theme, so the page's resting look still comes from its Tailwind classes and only
 * deliberate edits paint. See the note in portalStyleResolver.
 *
 * Vertical padding is px and horizontal is %, the units the spacing matrix edits in. Margin is
 * applied by sizeOf() on the WRAPPER; only padding belongs on the painted element. A dragged height
 * is a FLOOR (minHeight), never a fixed height, so content is never clipped. */
export function styleOf(styles: PortalStyles, id: string): React.CSSProperties {
  return containerCss(styles, id);
}

/* Size lives on the SELECTION WRAPPER, not on the painted element inside it.
 *
 * Two reasons. The outline and handles are drawn on the wrapper, so with the size on the child the
 * box you see and the box you drag drift apart. And a dragged height is a FLOOR, not a fixed
 * height — `minHeight` lets an element grow when its content needs more room, so resizing never
 * clips or squashes what is inside it. `maxWidth: 100%` keeps a resized card inside its grid cell
 * instead of bursting out of the layout. */
export function sizeOf(styles: PortalStyles, id: string): React.CSSProperties {
  /* P2's outer spacing and width share resolve through the chain; the drag-set values below are
     deliberately OWN-only — a px width dragged on one card is about that card, and inheriting it
     would resize every sibling that had never been touched. */
  const css: React.CSSProperties = { ...boxCss(styles, id) };
  const s = styles[id];
  if (!s) return css;
  /* A row member takes a SHARE, not a width: every sibling carries one, so the row always adds up
     to 100% and stays aligned however you drag. A standalone element still takes a plain width. */
  if (s.flex !== undefined) css.flex = `${s.flex} 1 0%`;
  /* ⚠️ A dragged width is a PERCENTAGE OF THE PARENT, not a pixel count.
     Three things were wrong with px. It could only ever shrink — `maxWidth: 100%` capped growth at
     the element's own current box, so dragging outward past the content did nothing and the handle
     read as broken. It did not respond: a width fixed in pixels stayed put when its section, its
     column or the panel beside it changed size, so a layout built at one width fell apart at
     another. And it let a small element ask for more room than its parent had. A share of the parent
     fixes all three at once: 100% is the parent's full width and is reachable by dragging, and every
     value in between stays true when the parent moves. */
  else if (s.widthPct !== undefined) { css.width = `${s.widthPct}%`; css.maxWidth = '100%'; css.flex = '0 0 auto'; }
  else if (s.width !== undefined) { css.width = `${s.width}px`; css.maxWidth = '100%'; css.flex = '0 0 auto'; }
  /* ⚠️ HEIGHT, not min-height, and the overflow is hidden with it. As a floor, dragging the bottom
     edge of a five-row list did nothing visible — the content already exceeded the number you were
     setting, so the box kept its content height and the handle felt broken. A widget given a height
     shows what fits in it and crops the rest, which is the whole point of dragging the edge: you are
     deciding how much of a long list this part of the page gets to spend. */
  if (s.height !== undefined) {
    /* ⚠️ The wrapper becomes a flex COLUMN when it takes a height. Its child card carries `h-full`,
       and a percentage height inside a plain block resolves against the wrong box — the card came
       out 664px inside a 386px wrapper, so the visible 386px was the card's empty lower half and the
       list appeared to vanish. As a flex column the child fills exactly the height that was set, and
       the clip lands where the handle was dropped. */
    css.height = `${s.height}px`;
    /* ⚠️ NO `overflow: hidden` here. The selection chrome — the floating toolbar at `-top-11`, the
       handles at `-3px` — are children of this same wrapper, so clipping it clipped THEM: the moment
       a widget had a dragged height its toolbar vanished and its handles were squeezed inside the
       card. The clip belongs to the content alone, and `Sel` puts it on an inner box (see `clipped`
       below) that the chrome sits outside of. */
    css.display = 'flex';
    css.flexDirection = 'column';
  }
  /* ⚠️ Alignment is applied to the element as a flex ITEM, not to its children. "Align this card
     bottom" is a statement about where the card sits in the row, and `alignSelf` is the only
     property that says it — text-align inside the card would move the words instead. */
  if (s.alignY !== undefined) {
    css.alignSelf = ({ start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' } as const)[s.alignY];
  }
  if (s.align === 'stretch') { css.flexGrow = 1; css.width = '100%'; }
  if (s.margin) {
    css.marginTop = `${s.margin.top}px`; css.marginBottom = `${s.margin.bottom}px`;
    css.marginLeft = `${s.margin.left}%`; css.marginRight = `${s.margin.right}%`;
  }
  return css;
}

/* ── toolbars ────────────────────────────────────────────────────────────── */

const btn = 'flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
const btnOff = 'flex size-7 items-center justify-center rounded text-[#CBD5E1] cursor-not-allowed';
const btnOn = 'flex size-7 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]';

/* One axis of alignment: a button showing what is set, and a popup of the four ways to set it.
   ⚠️ The trigger shows the CURRENT option's glyph, not a generic "align" symbol. A fixed icon would
   make the bar say only "alignment lives here", where this one answers "and it is currently left". */
function AlignAxis({ axis, value, options, open, onToggle, onPick }: {
  axis: 'h' | 'v';
  value: string;
  options: [string, string, ReactNode][];
  open: boolean;
  onToggle: () => void;
  onPick: (v: string) => void;
}) {
  const current = options.find(([v]) => v === value) ?? options[0];
  return (
    <div className="relative">
      <button
        className={open ? btnOn : btn}
        title={`${axis === 'h' ? 'Horizontal' : 'Vertical'} alignment — ${current[1].toLowerCase()}`}
        onClick={onToggle}
      >{current[2]}</button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={onToggle} />
          {/* Below the bar, so the options never cover the element you are aligning. */}
          <div className="absolute left-1/2 top-[calc(100%+6px)] z-[61] flex -translate-x-1/2 items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]">
            {options.map(([v, label, ic]) => (
              <button
                key={v}
                className={value === v ? btnOn : btn}
                title={label}
                onClick={() => onPick(v)}
              >{ic}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* The element library, on the canvas.
 *
 * ⚠️ Same catalogue as the Add panel, deliberately — two lists of "everything you can put on a page"
 * would drift the first time one gained an element. Components already on the page are disabled
 * here for the same reason they are there: no portal has two "My Requests".  */
function ElementPicker({ mode, onPick, onClose }: { mode: 'add' | 'replace'; onPick: (type: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const groups = PORTAL_ELEMENT_GROUPS.map((g) => ({
    group: g,
    items: PORTAL_ELEMENTS.filter((e) => e.group === g && !e.onPage
      && (!q || `${e.name} ${e.keywords ?? ''}`.toLowerCase().includes(q.toLowerCase()))),
  })).filter((g) => g.items.length);

  return (
    <>
      {/* Clicking anywhere else closes it — a popover that only closes from its own ✕ is a modal
          pretending not to be one. */}
      <span className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-1/2 top-[calc(100%+8px)] z-[61] max-h-[340px] w-[260px] -translate-x-1/2 overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]"
      >
        <div className="sticky top-0 z-10 bg-white px-2 pb-1.5 pt-1">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={mode === 'replace' ? 'Replace with…' : 'Search elements'}
            className="h-8 w-full rounded border border-[#DFE5ED] px-2.5 text-[12px] outline-none focus:border-[#3D8BD0]"
          />
        </div>
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{group}</p>
            {items.map((el) => (
              <button
                key={el.id}
                onClick={() => onPick(el.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[#364658] transition-colors hover:bg-[#F5F9FD]"
              >
                <span className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#64748B]">
                  {elementIcon(el.icon)}
                </span>
                <span className="truncate">{el.name}</span>
              </button>
            ))}
          </div>
        ))}
        {!groups.length && <p className="px-3 py-4 text-center text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>}
      </div>
    </>
  );
}

/* Light toolbar for everything that isn't text. Icons only: Content and Style both live in the
   right panel, so a "Design" pill here would be a second door to a room you are already in.
   Every button does the thing it says — nothing here is a placeholder. */
function ElementToolbar({ id, kind, name }: { id: string; kind: string; name: string }) {
  const { styles, setStyle, moveNode, duplicateNode, deleteNode, canDuplicate, addInside, replaceElement } = useCanvas();
  const [picking, setPicking] = useState(false);
  const [axis, setAxis] = useState<'h' | 'v' | null>(null);

  /** Side-by-side things move on the horizontal axis; stacked bands move on the vertical one. */
  const horizontal = kind === 'card' || kind === 'column';
  const moves: [string, ReactNode, 'prev' | 'next'][] = horizontal
    ? [['Move left', <ArrowLeft key="l" size={15} />, 'prev'], ['Move right', <ArrowRight key="r" size={15} />, 'next']]
    : [['Move down', <ArrowDown key="d" size={15} />, 'next'], ['Move up', <ArrowUp key="u" size={15} />, 'prev']];

  /* ⚠️ A CARD is not on this list any more. A widget occupies its slot completely — "add an element
     inside My Assets" was an offer the model could never honour, and it was the only thing the
     button said on every built-in block. Sections, columns and navs genuinely hold children; a card
     holds itself, so it gets Replace. */
  const canAdd = kind === 'section' || kind === 'column' || kind === 'nav';
  /** A dropped element — for these, the action means swap this for another kind, in place. */
  const placed = /^el-[0-9]+$/.test(id);
  /* ⚠️ Add and REPLACE are one slot showing one of two icons, because they are the same intent
     aimed at two states: an empty container has room for something, a full one already has the
     something. A "+" over a filled column promised an addition it could never make — a column holds
     one element — and the click either replaced silently or fell through to a new section elsewhere
     on the page. The icon now says which of the two will happen before you press it. */
  /* ⚠️ Only a COLUMN can be "full" — it holds exactly one element, so once something is in it the
     only thing "+" could honestly mean is swap. A section, card, nav or built-in row can always take
     another child, so they keep Add however much is already inside them. Testing "does this contain
     anything" instead of "can this contain more" put Replace on the Quick Actions row, which has
     room for a fourth card. */
  const occupant = /^sec-[0-9]+-c[0-9]+$/.test(id) ? placedIn(id) : null;
  const swaps = placed || !!occupant || kind === 'card';
  const swapTarget = placed ? id : occupant ?? (kind === 'card' ? id : null);
  const dupOk = canDuplicate(id);

  /* ⚠️ THREE buttons, not one that cycles. A cycling control makes you read the tooltip to find out
     what state you are in and click up to twice to reach the one you want — for three mutually
     exclusive options that are each one glyph wide, showing all three costs two slots and removes
     both problems. The lit one is also the answer to "how is this aligned?", which the single
     button could only tell you in a tooltip. */
  /* ⚠️ TWO axis buttons, each opening its own options — not six buttons in the bar. An element has
     two independent alignments and they answer different questions ("where across?" and "where
     down?"); laying all six out flat makes one row of near-identical glyphs where the pairing is
     invisible, and doubles a toolbar that already competes for width. The axis button shows the
     option currently set, so the bar still answers both questions at a glance. */
  const alignH = String(styles[id]?.align ?? 'left');
  const alignV = String(styles[id]?.alignY ?? 'start');
  const H_OPTS: [string, string, ReactNode][] = [
    ['left', 'Left', <AlignStartVertical key="l" size={15} />],
    ['center', 'Centre', <AlignCenterVertical key="c" size={15} />],
    ['right', 'Right', <AlignEndVertical key="r" size={15} />],
    ['stretch', 'Stretch', <MoveHorizontal key="s" size={15} />],
  ];
  const V_OPTS: [string, string, ReactNode][] = [
    ['start', 'Top', <AlignStartHorizontal key="t" size={15} />],
    ['center', 'Middle', <AlignCenterHorizontal key="m" size={15} />],
    ['end', 'Bottom', <AlignEndHorizontal key="b" size={15} />],
    ['stretch', 'Stretch', <MoveVertical key="s" size={15} />],
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      {/* The grip drags the element itself — pick it up here, drop it on a sibling to reorder. */}
      <span
        draggable
        onDragStart={(e) => { e.dataTransfer.setData(MOVE_MIME, id); e.dataTransfer.effectAllowed = 'move'; }}
        title="Drag to move"
        className="flex size-7 cursor-grab items-center justify-center text-[#9CA3AF] active:cursor-grabbing"
      ><GripVertical size={14} /></span>
      {moves.map(([label, ic, dir]) => (
        <button key={label} className={btn} title={label} onClick={() => moveNode(id, dir)}>{ic}</button>
      ))}
      {/* ⚠️ "+" opens the list HERE rather than swapping the side panel to it. Sending you to
          another surface to pick, then back to the canvas to see the result, is three steps for one
          decision — and on a FILLED element the same gesture means swap, which is a change you want
          to make while looking at what you are replacing. */}
      {(canAdd || placed || kind === 'card') && (
        <div className="relative">
          <button
            className={btn}
            title={swaps ? 'Replace widget' : 'Add widget'}
            onClick={() => setPicking((v) => !v)}
          >{swaps ? <Replace size={15} /> : <Plus size={15} />}</button>
          {picking && (
            <ElementPicker
              mode={swaps ? 'replace' : 'add'}
              onPick={(type) => {
                setPicking(false);
                if (swaps && swapTarget) replaceElement(swapTarget, type); else addInside(id, type);
              }}
              onClose={() => setPicking(false)}
            />
          )}
        </div>
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
      <AlignAxis
        axis="h"
        value={alignH}
        options={H_OPTS}
        open={axis === 'h'}
        onToggle={() => setAxis((a) => (a === 'h' ? null : 'h'))}
        onPick={(v) => { setStyle(id, { align: v as never }); setAxis(null); }}
      />
      <AlignAxis
        axis="v"
        value={alignV}
        options={V_OPTS}
        open={axis === 'v'}
        onToggle={() => setAxis((a) => (a === 'v' ? null : 'v'))}
        onPick={(v) => { setStyle(id, { alignY: v as never }); setAxis(null); }}
      />
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
    /** How tall this element may become before it outgrows the section holding it. */
    maxH: number;
    /** True when the parent lays its children out in a line, so widths are shares of it. */
    inRow: boolean;
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
        /* ⚠️ `d.inRow` — not "has siblings". The hero's heading, subtitle and search box are three
           [data-node] children of one STACKED block, so counting siblings called them a row and sent
           the drag down the flex-share path: it wrote `flex` on all three, which does nothing in a
           block container, and dragging the heading's edge appeared completely dead. A share only
           means something when the parent actually lays its children out in a line. */
        if (horiz && d.inRow && d.siblings.length > 1) {
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
          const px = d.corner.includes('w') ? d.w - dx : d.w + dx;
          patch.widthPct = Math.max(5, Math.min(100, Math.round((px / Math.max(d.parentW, 1)) * 100)));
          setLive({ kind: 'size', label: `${patch.widthPct}% of parent` });
        }

        /* ⚠️ Clamped to the SECTION, not to the viewport. A widget taller than the band holding it
           either spills over the block below it or silently stretches the band — both of which mean
           the height you dragged is not the height you get. The ceiling is captured once at
           mousedown: the section's own height follows its tallest child, so measuring it live would
           let the element chase a limit it was itself pushing upward. */
        /* ⚠️ The TOP BAR grows by padding, not by height. Its contents are a logo and a row of
           controls, both vertically centred — giving the band a taller height just pushes empty
           space to the outside of them, which is not what "make the navbar taller" means. Adding
           padding moves the bar's own edges away from its contents, so the bar breathes instead of
           the page gaining a gap. Half the drag per side, so the edge tracks the cursor. */
        if (id === 'header' && (d.corner.includes('s') || d.corner.includes('n'))) {
          const delta = d.corner.includes('n') ? -dy : dy;
          const v = Math.max(0, Math.min(64, Math.round(d.pad.top + delta / 2)));
          patch.padding = { ...d.pad, top: v, bottom: v };
          setLive({ kind: 'padY', label: `${v}px` });
        } else {
          if (d.corner.includes('s')) patch.height = Math.max(24, Math.min(d.maxH, Math.round(d.h + dy)));
          if (d.corner.includes('n')) patch.height = Math.max(24, Math.min(d.maxH, Math.round(d.h - dy)));
        }
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
    /* The band this element lives in — the nearest ancestor node that is not a column, since a
       column is only ever as tall as the section around it and would be a circular ceiling. */
    let band: HTMLElement | null = el.parentElement?.closest('[data-node]') as HTMLElement | null;
    while (band && /-c\d+$/.test(band.dataset.node ?? '')) {
      band = band.parentElement?.closest('[data-node]') as HTMLElement | null;
    }
    const bandRect = band?.getBoundingClientRect();
    drag.current = {
      kind, corner, x: e.clientX, y: e.clientY, w: r.width, h: r.height,
      pad: styles[id]?.padding ?? ZERO_BOX,
      /* No band (a top-level block) means no ceiling but its own screen — a page can be any length,
         so an arbitrary cap there would be a rule invented rather than a rule enforced.
         ⚠️ The element's OWN content height is a floor under the ceiling. A band is as tall as its
         tallest child, so an element that fills its band would cap at exactly its current height —
         and once shrunk, the band shrinks with it and the next drag caps lower still. That ratchets
         one way: shrink a list once and you could never show all of it again. Being able to return
         to "all of my content" is not the same freedom as growing past the section, so it is allowed
         and the section cap still holds everywhere it means something. */
      maxH: Math.max(bandRect ? bandRect.bottom - r.top : Number.POSITIVE_INFINITY, el.scrollHeight, 24),
      inRow: (() => {
        const ps = el.parentElement ? getComputedStyle(el.parentElement) : null;
        return !!ps && (ps.display === 'flex' || ps.display === 'inline-flex') && !ps.flexDirection.startsWith('column');
      })(),
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
    /* ⚠️ The BOTTOM-centre grip was missing: height could only be dragged from a corner, which also
       changes the width, so "make this list taller" was not a gesture the canvas offered. */
    ['s', '-bottom-[3px] left-1/2 -translate-x-1/2 cursor-ns-resize'],
    ['e', '-right-[3px] top-1/2 -translate-y-1/2 cursor-ew-resize'],
  ];

  return (
    /* ⚠️ pointer-events-none on the WRAPPER, auto on each handle. Without it this overlay covers
       the whole selected element and swallows clicks on its children — so selecting a section made
       everything inside it unreachable. */
    <span className="pointer-events-none absolute inset-0 z-20">
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

      {/* ⚠️ There is NO bottom padding pill any more. It sat at exactly `-bottom-[3px] left-1/2` —
          the same point as the height grip — and being painted after it, it won every click: dragging
          the bottom edge of a list silently added vertical padding instead of making the widget
          taller. Two grips cannot share one edge, and on a list of data the edge means height.
          Vertical padding is still fully editable, in the panel's Spacing matrix, where it is
          labelled and numeric rather than guessed from a 6px pill. */}
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
  const { enabled, addSection, setStyle, dropAtSeam, hoverId } = useCanvas();
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

  /* The seam belongs to the section ABOVE it, so hovering anywhere in that section offers the
     "+ Add Section" CTA — hunting for a hairline between two bands is a worse way to find "add a
     section here" than simply being over the section you want to add after.
     ⚠️ The blue rule is NOT part of that offer: it is the section's bottom EDGE, i.e. the resize
     handle. Drawing it across the page every time the pointer crossed a section made the canvas
     flash a thick line on every move, for a grip nobody had reached for. It appears only once you
     are actually at the seam, beside the CTA — where dragging it is the next thing you'd do. */
  const withinSection = !!hoverId && nodePath(hoverId).some((n) => n.id === afterId);
  const showPill = hover || picking || withinSection || !!live;
  const showLine = hover || picking || !!live;

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
      {showLine && (
        <>
          {/* The bar IS the section's bottom edge — drag it to stretch. */}
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
        </>
      )}
      {showPill && (
        <button
          onClick={() => setPicking((p) => !p)}
          className="absolute left-1/2 top-1/2 z-10 inline-flex h-7 -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-[#3D8BD0] px-3.5 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-[#2d6ca0]"
        >+ Add Section</button>
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
export function ColumnAdders({ columnId, filled }: { columnId: string; filled?: boolean }) {
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
      {/* ⚠️ Only on an EMPTY column. On a filled one it would sit on top of the element it is
          offering to replace, and a column holds one thing — so the side adders, which make room
          rather than compete for it, are the whole offer there. */}
      {!filled && (
        <button
          onClick={(e) => { e.stopPropagation(); addInside(columnId); }}
          title="Add an element here"
          className={`${dot} absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2`}
        ><Plus size={13} /></button>
      )}
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
  /* Where the toolbar goes when there is no room above the element.
     `true`  — just inside its own top edge, for a tall band like the hero whose top strip is empty.
     'under' — fully below its bottom edge, for a short dense bar like the portal's top navigation,
               where "just inside the top" is directly on top of the logo and the actions. */
  toolbarBelow?: boolean | 'under';
  /** Layout defaults from the page (a row member's default share). sizeOf overrides these. */
  style?: React.CSSProperties;
}) {
  const { enabled, selectedId, hoverId, select, setHover, styles, moveTo, setText } = useCanvas();
  const ref = useRef<HTMLDivElement>(null);
  const [moveOver, setMoveOver] = useState(false);
  const node = nodeById(id);
  // Size applies in preview too — a resized page must publish the way it was designed.
  const size = { ...baseStyle, ...sizeOf(styles, id) };
  /* A dragged height crops its content — on an inner box, so the chrome above can overflow freely. */
  const clipped = styles[id]?.height !== undefined;
  const body = clipped
    ? <div className="min-h-0 w-full flex-1 overflow-hidden">{children}</div>
    : children;
  if (!enabled || !node) return <div style={size} className={className}>{body}</div>;

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
      /* Grip-drag drop target. The dragged id is unreadable during dragover, so accept broadly
         here and let moveTo decide whether the two are actually siblings. */
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(MOVE_MIME)) return;
        e.preventDefault();
        e.stopPropagation();
        setMoveOver(true);
      }}
      onDragLeave={() => setMoveOver(false)}
      onDrop={(e) => {
        setMoveOver(false);
        const src = draggedNode(e);
        if (!src || src === id) return;
        e.preventDefault();
        e.stopPropagation();
        moveTo(src, id);
      }}
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
          /* ⚠️ SECONDARY, not primary. Blue is this builder's "you did something / this is active"
             colour — a blue chip on every hover competed with the actual selection for attention,
             on an element you had not chosen yet. Slate says the same word more quietly.
             ⚠️ The step-up chevron is gone with it: the chip is pointer-events-none, so the arrow
             was never clickable — it looked like a control and behaved like an illustration. Moving
             up a level is the panel breadcrumb's job, where it actually works. */
          /* ⚠️ An OUTLINE chip on white — the secondary treatment, matching every other quiet
             control in this builder. A filled badge of any colour reads as a state you have entered;
             this is a label for something the pointer is merely passing over. */
          className={`pointer-events-none absolute left-0 z-30 flex items-center rounded-sm border border-[#DFE5ED] bg-white px-1.5 text-[10px] font-medium leading-[16px] text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${
            toolbarBelow === 'under' ? 'top-full' : toolbarBelow ? 'top-0' : '-top-[18px]'
          }`}
        >
          {node.name}
        </span>
      )}

      {moveOver && <span className="pointer-events-none absolute inset-0 z-30 rounded ring-2 ring-[#3D8BD0] ring-offset-2" />}

      {on && <SelectionHandles id={id} elRef={ref} />}

      {on && (
        <div className={`absolute left-0 z-40 ${
          toolbarBelow === 'under' ? 'top-full mt-1' : toolbarBelow ? 'top-5' : '-top-11'
        }`}>
          {node.kind === 'text' ? <TextToolbar id={id} /> : <ElementToolbar id={id} kind={node.kind} name={node.name} />}
        </div>
      )}

      {/* ── Inline editing ──────────────────────────────────────────────────────
          A selected TEXT node becomes editable in place, so the words can be changed where you are
          looking at them rather than only in the panel.

          ⚠️ It writes on BLUR, not on every keystroke. React re-rendering a contentEditable while
          you type puts the caret back at the start — the bug this codebase already hit twice, in
          the approval-comment editor and the rich composer. Blur-sync means the sidebar catches up
          the moment you click away, and the caret never moves under you.
          ⚠️ `suppressContentEditableWarning` is required because the children ARE React nodes; the
          alternative is rendering the text as a bare string and losing its styling. */}
      {on && node.kind === 'text' ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const next = (e.currentTarget.textContent ?? '').trim();
            setText(id, next);
          }}
          onKeyDown={(e) => {
            // Enter commits rather than inserting a line break — these are labels, not paragraphs.
            if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
            if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur();
          }}
          className="outline-none"
        >{children}</div>
      ) : body}
    </div>
  );
}
