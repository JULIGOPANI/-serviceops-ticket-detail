import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, ChevronLeft, Eye, House, LayoutTemplate, RotateCcw,
  Palette, PanelRight, Paintbrush, Pencil, Plus, Redo2, Undo2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { AiSparkle } from './AiSparkle';
import { SupportPortalPreview } from './SupportPortalPreview';
import { SupportPortalAddPanel } from './SupportPortalAddPanel';
import { PortalBrandingPanel } from './PortalBrandingPanel';
import { PortalThemePanel, DEFAULT_THEME, buttonOf, packOf, paletteOf, swatchesOf } from './PortalThemePanel';
import type { PortalTheme } from './PortalThemePanel';
import { PortalElementPanel } from './PortalElementPanel';
import { CanvasProvider } from './PortalCanvas';
import {
  DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER, addColumn, moveIn, nodeById, parseItemId,
  placedType, registerPlaced,
} from './portalPageModel';
import { PortalWidgetDrawer } from './PortalWidgetDrawer';
import { WIDGET_FOR_NODE, WIDGET_FOR_TYPE, specById, structureSpecId } from './portalWidgetSpec';
import type { Cfg, WidgetSpec } from './portalWidgetSpec';
import type { CustomSection, NodeStyle, PlacedElement, PortalPageContent, PortalStyles } from './portalPageModel';
import { PORTAL_ELEMENTS } from './supportPortalData';
import type { IconChoice } from './PortalIconPicker';
import type { PortalPage } from './supportPortalData';

/* Support Portal page builder.
 *
 * Full-screen on purpose: the admin sidebar and the product header both give way to the builder's
 * own top bar, because a canvas competing with two navigations has nowhere to be. Leaving is the
 * back arrow, which is why the trail can be dropped.
 *
 * Layout is canvas → design panel → icon rail. The panel is dragged from its LEFT edge and clamped
 * to 340-600px: 340 is the floor, and 600 the ceiling because past it the canvas stops representing
 * the page a requester sees. */

const MIN_W = 340;
const MAX_W = 600;

interface SupportPortalBuilderProps {
  page: PortalPage;
  /** Hero tint from the template this page was started from. */
  accent?: string;
  onRename: (name: string) => void;
  onPublish: () => void;
  onExit: () => void;
}

type RailKey = 'add' | 'theme' | 'branding' | 'templates' | 'ai';

const RAIL: { key: RailKey; label: string; icon: (on: boolean) => ReactNode }[] = [
  { key: 'add', label: 'Add', icon: () => <Plus size={18} /> },
  { key: 'theme', label: 'Theme', icon: () => <Paintbrush size={18} /> },
  { key: 'branding', label: 'Branding', icon: () => <Palette size={18} /> },
  { key: 'templates', label: 'Templates', icon: () => <LayoutTemplate size={18} /> },
  { key: 'ai', label: 'AI', icon: (on) => <AiSparkle size={18} className={on ? '' : 'opacity-90'} /> },
];

/** Each panel says what it is for rather than that it is unfinished — an empty state is a
 *  description of the panel's job, not an apology for it. */
const PANEL_COPY: Record<RailKey, { title: string; body: string }> = {
  add: {
    // Add is a real panel now — this entry only supplies the header title.
    title: 'Elements',
    body: '',
  },
  theme: {
    /* ⚠️ "Site styles", not "this page": one theme paints every page of the portal, so a title that
       scopes it to the page you happen to be on promises an override that does not exist. */
    title: 'Site styles',
    body: 'Mode, colours, type and button shape for the whole portal.',
  },
  branding: {
    title: 'Brand this page',
    body: 'Logo, favicon and brand colors inherited from Organization › Branding will appear here, with per-page overrides.',
  },
  templates: {
    title: 'Templates',
    body: 'Swap this page for another layout, or save the current one as a reusable template for your other portals.',
  },
  ai: {
    title: 'Build with AI',
    body: 'Describe the portal you want — “a catalog-first page for HR” — and AI will lay the blocks out for you.',
  },
};

/* ── Illustration ────────────────────────────────────────────────────────── */

/** Line-art design surface + stylus. Inline so the panel carries no image asset. */
function SelectElementArt() {
  return (
    <svg viewBox="0 0 140 106" className="h-[106px] w-[140px]" aria-hidden>
      <g fill="none" stroke="#A3AFBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="24" y="12" width="84" height="64" rx="6" />
        <rect x="9" y="30" width="14" height="38" rx="4" fill="#FFFFFF" />
        <path d="M13 38h6M13 45h6M13 52h6" />
        <path d="M34 24h30" />
        <path d="M34 54h44M34 63h32" />
        <path d="M96 88l22-22 7 7-22 22-9.5 2.5z" />
        <path d="M111 73l7 7" />
      </g>
      <rect x="34" y="34" width="34" height="11" rx="3" fill="#C3E059" />
      <path d="M114 20l2.2 4.8 4.8 2.2-4.8 2.2-2.2 4.8-2.2-4.8-4.8-2.2 4.8-2.2z" fill="#DCE3EC" />
    </svg>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

function PanelEmptyState({ active }: { active: RailKey | null }) {
  if (!active) {
    return (
      <div className="flex flex-col items-center px-8 pt-16 text-center">
        <SelectElementArt />
        <p className="mt-5 text-[16px] font-semibold text-[#475467]">Select an element to start</p>
        <p className="mt-1.5 max-w-[300px] text-[14px] leading-[1.55] text-[#5B7A99]">
          It’ll show the design panel with all the design options for that element right here.
        </p>
      </div>
    );
  }
  const copy = PANEL_COPY[active];
  const item = RAIL.find((r) => r.key === active)!;
  return (
    <div className="flex flex-col items-center px-8 pt-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#7B8FA5]">
        {item.icon(false)}
      </span>
      <p className="mt-4 text-[16px] font-semibold text-[#475467]">{copy.title}</p>
      <p className="mt-1.5 max-w-[300px] text-[14px] leading-[1.55] text-[#5B7A99]">{copy.body}</p>
    </div>
  );
}

/* ── Builder ─────────────────────────────────────────────────────────────── */

export function SupportPortalBuilder({ page, accent, onRename, onPublish, onExit }: SupportPortalBuilderProps) {
  const [width, setWidth] = useState(MIN_W);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<RailKey | null>(null);
  const [preview, setPreview] = useState(false);
  /* The portal's own style system. It lives HERE rather than in the panel because the canvas has to
     paint with it — a theme panel that only changed itself would be a colour picker with no page. */
  const [theme, setTheme] = useState<PortalTheme>(DEFAULT_THEME);

  // ── canvas state ──────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [content, setContent] = useState<PortalPageContent>(DEFAULT_CONTENT);
  const [styles, setStyles] = useState<PortalStyles>({});

  const setStyle = useCallback((id: string, p: Partial<NodeStyle>) => {
    setStyles((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }, []);

  /* Replaces a node's whole style object — how Revert DELETES a key. A patch cannot express
     "unset", and writing the parent's current value instead would be a copy, not a link. */
  const replaceStyle = useCallback((id: string, next: NodeStyle) => {
    setStyles((prev) => ({ ...prev, [id]: next }));
  }, []);

  /* ── widget config (spec §9) ──────────────────────────────────────────────
   *
   * One store for every widget instance, fixed page block and dropped element alike, keyed by node
   * id. Defaults live on the spec, so a node that has never been edited holds nothing at all and
   * `cfgFor` composes it — which is what makes Reset to default a one-line delete. */
  const [widgetCfg, setWidgetCfg] = useState<Record<string, Cfg>>({});

  /** The widget spec behind a node, whether it is a fixed block or something an admin dropped.
   *  ⚠️ Both routes must land on the SAME spec, or one widget would edit two different ways. */
  /* ⚠️ An ITEM belongs to its widget's config, not its own. `el-3~i2` resolves to el-3's spec and
     el-3's cfg; the drawer slices the item out of the collection. Keying config by the item id would
     scatter one widget's content across N stores and break Reset, duplicate and reorder. */
  /* A card's Title/Subtext node edits the CARD's config — the words live on the card, not on a
     store of their own, or the canvas and the panel would hold two copies of one sentence. */
  const ownerOf = (id: string) => parseItemId(id)?.widget ?? id.replace(/-(title|sub)$/, '');

  const specForNode = useCallback((id: string | null): WidgetSpec | undefined => {
    if (!id) return undefined;
    /* ⚠️ The ORIGINAL id first. A card's Title node shares its CONFIG with the card — that is what
       `ownerOf` is for — but it must not share its PANEL, or clicking the title opens the card and
       the one thing you aimed at is the one thing you cannot edit. Config and panel resolve
       differently here on purpose. */
    const own = structureSpecId(id);
    if (own === 'card_title' || own === 'card_sub') return specById(own);

    const owner = ownerOf(id);
    const direct = WIDGET_FOR_NODE[owner];
    if (direct) return specById(direct);
    const t = placedType(owner);
    if (t && WIDGET_FOR_TYPE[t]) return specById(WIDGET_FOR_TYPE[t]);
    /* Structure and chrome last: a widget that happens to live in a section must resolve to the
       widget, not to the section it sits in. */
    const structure = structureSpecId(owner);
    return structure ? specById(structure) : undefined;
  }, []);

  /* Per-NODE seeds, for values a shared spec default cannot express. The page's bands each have
     their own column count, so the Section spec deliberately carries none — it would have to be
     wrong for two of the three. */
  const NODE_CFG_SEED: Record<string, Cfg> = {
    /* ⚠️ `hasCards` is what gates the Card-templates control. Only the Quick Actions band holds
       action cards, so only it gets the picker — offering a card layout on a section with no cards
       is a control that cannot do anything. Seeded per NODE because the section SPEC is shared by
       every band and every added section. */
    quick: { cols: '3', hasCards: true },
    work: { cols: '3' },
    records: { cols: '2' },
  };

  const cfgFor = useCallback((id: string): Cfg => {
    const owner = ownerOf(id);
    return {
      ...(specForNode(owner)?.defaults ?? {}),
      ...(NODE_CFG_SEED[owner] ?? {}),
      ...(widgetCfg[owner] ?? {}),
    };
  }, [specForNode, widgetCfg]);

  const patchCfg = useCallback((id: string, patch: Cfg) => {
    setWidgetCfg((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  /** Selecting an element takes over the panel — the design panel IS the element editor. */
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) { setActive(null); setCollapsed(false); }
  }, []);

  /** Sections the admin has added, each pinned to the block it was inserted after. */
  const [sections, setSections] = useState<{ afterId: string; section: CustomSection }[]>([]);
  const nextSectionId = useRef(1);

  const addSection = useCallback((afterId: string, rows: number[][]) => {
    const section: CustomSection = { id: `sec-${nextSectionId.current++}`, rows, items: {} };
    setSections((prev) => {
      /* ⚠️ When the seam belongs to an ADDED section, the new one goes directly after it and
         inherits its anchor. Pushing to the end of the array put it at the foot of the page
         instead — you clicked between two bands and it appeared somewhere else entirely. */
      const at = prev.findIndex((x) => x.section.id === afterId);
      if (at < 0) return [...prev, { afterId, section }];
      const next = [...prev];
      next.splice(at + 1, 0, { afterId: prev[at].afterId, section });
      return next;
    });
    select(section.id);
    toast.success('Section added');
  }, [select]);

  /** Per-placed-element icon and text. Kept beside the sections so the canvas can render them. */
  const [icons, setIcons] = useState<Record<string, IconChoice | undefined>>({});
  const [placedText, setPlacedText] = useState<Record<string, { title?: string; desc?: string }>>({});

  const nextElementId = useRef(1);
  /** Builds the instance and registers it so the canvas and panel can describe it. */
  const makeElement = useCallback((type: string, parent: string) => {
    const def = PORTAL_ELEMENTS.find((e) => e.id === type);
    const el: PlacedElement = { id: `el-${nextElementId.current++}`, type, name: def?.name ?? 'Element' };
    registerPlaced(el.id, el.name, el.type, parent);
    return el;
  }, []);

  /** Elements dropped straight into a built-in row (Quick Actions, Cards Row, Records Row). */
  const [rowExtras, setRowExtras] = useState<Record<string, PlacedElement[]>>({});

  const dropInRow = useCallback((rowId: string, type: string) => {
    const el = makeElement(type, rowId);
    setRowExtras((prev) => ({ ...prev, [rowId]: [...(prev[rowId] ?? []), el] }));
    select(el.id);
    toast.success(`${el.name} added`);
  }, [makeElement, select]);

  const dropInColumn = useCallback((columnId: string, type: string) => {
    const sectionId = columnId.replace(/-c\d+$/, '');
    const el = makeElement(type, columnId);
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId
        ? { ...s, section: { ...s.section, items: { ...s.section.items, [columnId]: el } } }
        : s
    )));
    select(el.id);
    toast.success(`${el.name} added`);
  }, [makeElement, select]);

  /* Dropping on a seam builds the section for you — one column, the element inside it. */
  const dropAtSeam = useCallback((afterId: string, type: string) => {
    const section: CustomSection = { id: `sec-${nextSectionId.current++}`, rows: [[1]], items: {} };
    const col = `${section.id}-c0`;
    const el = makeElement(type, col);
    section.items[col] = el;
    setSections((prev) => [...prev, { afterId, section }]);
    select(el.id);
    toast.success(`${el.name} added in a new section`);
  }, [makeElement, select]);

  const addColumnBeside = useCallback((columnId: string, side: 'left' | 'right') => {
    const sectionId = columnId.replace(/-c\d+$/, '');
    const index = Number(/-c(\d+)$/.exec(columnId)?.[1] ?? 0);
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId ? { ...s, section: addColumn(s.section, index, side) } : s
    )));
  }, []);

  /* ── page order & membership — what the toolbar's move/delete rewrite ── */
  const [blockOrder, setBlockOrder] = useState<string[]>(DEFAULT_BLOCK_ORDER);
  const [rowOrder, setRowOrder] = useState<Record<string, string[]>>(DEFAULT_ROW_ORDER);
  const [removed, setRemoved] = useState<string[]>([]);

  /* Reset to default — every store the canvas reads, back to its seed.
     ⚠️ It must clear ALL of them. Missing one leaves the page in a state that is neither the
     default nor what you built: an added section whose widget config was wiped, or a block still
     hidden by `removed` after its content came back. The list is the state list, in order. */
  const resetPage = useCallback(() => {
    setContent(DEFAULT_CONTENT);
    setStyles({});
    setWidgetCfg({});
    setSections([]);
    setIcons({});
    setPlacedText({});
    setRowExtras({});
    setBlockOrder(DEFAULT_BLOCK_ORDER);
    setRowOrder(DEFAULT_ROW_ORDER);
    setRemoved([]);
    setSelectedId(null);
    toast.success('Page reset to default');
  }, []);

  const sectionOfColumn = (id: string) => id.replace(/-c\d+$/, '');
  const placedParent = (id: string) => nodeById(id)?.parent;

  /** Every column id in a section, in render order — ids run across rows, not per row. */
  const columnIds = (s: CustomSection) => {
    const ids: string[] = [];
    let i = 0;
    s.rows.forEach((row) => row.forEach(() => ids.push(`${s.id}-c${i++}`)));
    return ids;
  };

  /** Catalogue types the page is already carrying — what makes a single-instance block read "added". */
  const placedTypes = [
    ...sections.flatMap((s) => Object.values(s.section.items).map((el) => el.type)),
    ...Object.values(rowExtras).flatMap((list) => list.map((el) => el.type)),
    /* ⚠️ The AD card is a member of the Quick Actions row, not a placed element, so it is invisible
       to both lists above. Without this the palette kept offering a card the page already had. */
    ...(content.quick.some((q) => q.id === 'quick-ad') ? ['act-ad'] : []),
  ];

  /* Click-to-add. The library is not a catalogue you can only drag out of.
   *
   * ⚠️ Clicking a row used to mark it "added" and place nothing — the worst of both, because the
   * one signal saying it worked was the signal that lied. An add now always lands somewhere real:
   * the column whose "+" aimed it, else a free column in the section you are in, else the row you
   * are in, else its own new section at the foot of the page. Selecting the result is the proof. */
  const addElement = useCallback((type: string, anchorOverride?: string) => {
    /* ⚠️ An action card is not a generic placed element — it is a member of the Quick Actions row,
       and the row is what gives it its shape, its share of the width and its editor. So adding one
       appends to the row's CONTENT rather than dropping a stand-in element somewhere; that is the
       only way the fourth card comes out identical to the three beside it instead of merely
       similar. */
    if (type === 'act-ad') {
      if (content.quick.some((q) => q.id === 'quick-ad')) { toast.error('AD Self Service is already on the page'); return; }
      setContent((c) => ({ ...c, quick: [...c.quick, { id: 'quick-ad', title: 'AD Self Service', desc: 'Reset your domain password' }] }));
      setRowOrder((o) => ({ ...o, quick: [...(o.quick ?? DEFAULT_ROW_ORDER.quick), 'quick-ad'] }));
      /* ⚠️ Widen the row to four. The section is three columns, so a fourth card would wrap to a
         full-width row of its own — which is not 'a fourth action card', it is a different block
         that happens to look like one. The Columns control still overrides this afterwards. */
      patchCfg('quick', { cols: '4' });
      select('quick-ad');
      toast.success('AD Self Service added');
      return;
    }

    // A placed element stands in for the column it sits in, so "add another" means "add beside me".
    /* ⚠️ The anchor can be passed IN. The canvas picker adds from the toolbar of the thing you
       clicked "+" on, and `selectedId` has not re-rendered yet at that point — reading state here
       would aim the add at whatever was selected before. */
    const sel = anchorOverride ?? selectedId;
    const anchor = sel && /^el-\d+$/.test(sel) ? placedParent(sel) ?? sel : sel;

    const secId = anchor ? /^sec-\d+/.exec(anchor)?.[0] : undefined;
    const sec = secId ? sections.find((s) => s.section.id === secId)?.section : undefined;
    if (sec) {
      const aimed = anchor && /^sec-\d+-c\d+$/.test(anchor) && !sec.items[anchor] ? anchor : undefined;
      const target = aimed ?? columnIds(sec).find((c) => !sec.items[c]);
      // Every column full falls through: a new section beats silently replacing someone's element.
      if (target) { dropInColumn(target, type); return; }
    }

    const row = anchor && (rowOrder[anchor] ? anchor : Object.keys(rowOrder).find((r) => rowOrder[r].includes(anchor)));
    if (row) { dropInRow(row, type); return; }

    const last = blockOrder.filter((b) => !removed.includes(b)).slice(-1)[0] ?? 'hero';
    dropAtSeam(last, type);
  }, [content.quick, selectedId, sections, rowOrder, blockOrder, removed, dropInColumn, dropInRow, dropAtSeam, select, patchCfg]);

  const moveNode = useCallback((id: string, dir: 'prev' | 'next') => {
    const step = dir === 'prev' ? -1 : 1;
    // A top-level band moves within the page.
    if (blockOrder.includes(id)) { setBlockOrder((o) => moveIn(o, id, step)); return; }
    // A card moves within its row.
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row) { setRowOrder((o) => ({ ...o, [row]: moveIn(o[row], id, step) })); return; }
    // An added section moves among the sections pinned to the same anchor.
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => {
        const i = prev.findIndex((s) => s.section.id === id);
        const j = i + step;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
      return;
    }
    toast.success('This element sits on its own — nothing to swap it with');
  }, [blockOrder, rowOrder]);

  /** Which ordered list an id lives in, so a drag knows what it can be dropped among. */
  const listOf = useCallback((id: string): 'block' | 'section' | string | null => {
    if (blockOrder.includes(id)) return 'block';
    if (/^sec-\d+$/.test(id)) return 'section';
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    return row ?? null;
  }, [blockOrder, rowOrder]);

  const areSiblings = useCallback((a: string, b: string) => {
    const la = listOf(a);
    return !!la && la === listOf(b);
  }, [listOf]);

  /* Lift a placed element out of whichever home holds it, and hand it back.
     ⚠️ Detach must clear BOTH homes for the same reason delete does — a column and a built-in row
     are two different stores, and an element that half-moves is an element that gets duplicated. */
  const detachElement = useCallback((id: string): PlacedElement | null => {
    let taken: PlacedElement | null = null;
    setSections((prev) => prev.map((sec) => {
      const col = Object.keys(sec.section.items).find((c) => sec.section.items[c].id === id);
      if (!col) return sec;
      taken = sec.section.items[col];
      const items = { ...sec.section.items };
      delete items[col];
      return { ...sec, section: { ...sec.section, items } };
    }));
    setRowExtras((prev) => {
      const hit = Object.keys(prev).find((r) => prev[r].some((e) => e.id === id));
      if (!hit) return prev;
      taken = taken ?? prev[hit].find((e) => e.id === id) ?? null;
      return { ...prev, [hit]: prev[hit].filter((e) => e.id !== id) };
    });
    return taken;
  }, []);

  /* Move a placed element into a column, anywhere on the page.
     ⚠️ A column holds ONE element, so landing on an occupied one SWAPS the two rather than
     overwriting — dropping onto a filled column used to be the one gesture that could destroy work,
     and a swap is what you meant by dragging one thing onto another anyway. */
  const relocateElement = useCallback((id: string, destCol: string) => {
    const destSec = destCol.replace(/-c[0-9]+$/, '');
    let occupant: PlacedElement | null = null;
    let sourceCol: string | null = null;
    setSections((prev) => {
      prev.forEach((sec) => {
        const col = Object.keys(sec.section.items).find((c) => sec.section.items[c].id === id);
        if (col) sourceCol = col;
        if (sec.section.id === destSec && sec.section.items[destCol]) occupant = sec.section.items[destCol];
      });
      return prev;
    });
    const moving = detachElement(id);
    if (!moving) return;
    setSections((prev) => prev.map((sec) => {
      if (sec.section.id !== destSec) return sec;
      const items = { ...sec.section.items, [destCol]: moving };
      return { ...sec, section: { ...sec.section, items } };
    }));
    registerPlaced(moving.id, moving.name, moving.type, destCol);
    if (occupant && sourceCol) {
      setSections((prev) => prev.map((sec) => {
        if (!sourceCol!.startsWith(sec.section.id)) return sec;
        return { ...sec, section: { ...sec.section, items: { ...sec.section.items, [sourceCol!]: occupant! } } };
      }));
      registerPlaced(occupant.id, occupant.name, occupant.type, sourceCol);
    }
    select(id);
    toast.success(occupant ? 'Swapped places' : `${moving.name} moved`);
  }, [detachElement, select]);

  /** Drag-to-reorder: lift `source` out of its list and drop it at `target`'s index. */
  const moveTo = useCallback((source: string, target: string) => {
    /* ⚠️ A placed element is not confined to the list it started in. Reordering handles siblings;
       everything else is a RELOCATION, which is what dragging across sections has to mean — the
       old code refused it with "drop it on something in the same row", so the only way to move an
       element between sections was to delete it and build it again. */
    if (/^el-[0-9]+$/.test(source)) {
      const destCol = /^sec-[0-9]+-c[0-9]+$/.test(target)
        ? target
        : /^el-[0-9]+$/.test(target)
          ? (nodeById(target)?.parent ?? null)
          : null;
      if (destCol && /^sec-[0-9]+-c[0-9]+$/.test(destCol)) { relocateElement(source, destCol); return; }
    }
    const list = listOf(source);
    if (!list || list !== listOf(target)) {
      toast.error('Drop it on a column, or on something in the same row');
      return;
    }
    const reorder = (arr: string[]) => {
      const from = arr.indexOf(source);
      const to = arr.indexOf(target);
      if (from < 0 || to < 0) return arr;
      const next = [...arr];
      next.splice(from, 1);
      next.splice(to, 0, source);
      return next;
    };
    if (list === 'block') setBlockOrder(reorder);
    else if (list === 'section') {
      setSections((prev) => {
        const ids = prev.map((s) => s.section.id);
        const order = reorder(ids);
        return order.map((sid) => prev.find((s) => s.section.id === sid)!);
      });
    } else setRowOrder((o) => ({ ...o, [list]: reorder(o[list]) }));
    toast.success('Moved');
  }, [listOf, relocateElement]);

  /** Only things with their own identity can be cloned; a fixed page band has none. */
  const canDuplicate = useCallback((id: string) => /^sec-\d+$/.test(id) || /^el-\d+$/.test(id), []);

  const duplicateNode = useCallback((id: string) => {
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => {
        const found = prev.find((s) => s.section.id === id);
        if (!found) return prev;
        const copyId = `sec-${nextSectionId.current++}`;
        const items: Record<string, PlacedElement> = {};
        Object.entries(found.section.items).forEach(([col, el]) => {
          const newCol = col.replace(found.section.id, copyId);
          const clone = { ...el, id: `el-${nextElementId.current++}` };
          registerPlaced(clone.id, clone.name, clone.type, newCol);
          items[newCol] = clone;
        });
        return [...prev, { afterId: found.afterId, section: { id: copyId, rows: found.section.rows, items } }];
      });
      toast.success('Section duplicated');
      return;
    }
    // A placed element clones into a fresh column beside its own.
    const col = placedParent(id);
    if (!col) return;
    const secId = sectionOfColumn(col);
    const index = Number(/-c(\d+)$/.exec(col)?.[1] ?? 0);
    let cloneId: string | null = null;
    setSections((prev) => prev.map((s) => {
      if (s.section.id !== secId) return s;
      const grown = addColumn(s.section, index, 'right');
      const newCol = `${secId}-c${index + 1}`;
      const src = s.section.items[col];
      const items: Record<string, PlacedElement> = { ...s.section.items };
      if (src) {
        const clone = { ...src, id: `el-${nextElementId.current++}` };
        registerPlaced(clone.id, clone.name, clone.type, newCol);
        items[newCol] = clone;
        cloneId = clone.id;
      }
      return { ...s, section: { ...grown, items } };
    }));
    /* ⚠️ A copy has to arrive as a COPY — same content, same design, and open for editing. Cloning
       the placement alone produced a blank element wearing the original's name, and left the panel
       pointing at what you copied FROM, so the next edit landed on the wrong element. Config and
       style are both keyed by node id, so each is copied across explicitly. */
    if (cloneId) {
      setWidgetCfg((m) => (m[id] ? { ...m, [cloneId!]: { ...m[id] } } : m));
      setStyles((m) => (m[id] ? { ...m, [cloneId!]: { ...m[id] } } : m));
      select(cloneId);
    }
    toast.success('Element duplicated');
  }, [select]);

  const deleteNode = useCallback((id: string) => {
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => prev.filter((s) => s.section.id !== id));
    } else if (/^sec-\d+-c\d+$/.test(id)) {
      /* ⚠️ A COLUMN, which is what you actually have selected when you click an empty section —
         the column is the innermost selectable thing inside it. Delete used to fall through to the
         `removed` branch here and silently do nothing, which is why deleting an empty section
         appeared broken. Removing the last column removes the section: a section with no columns
         is not an empty section, it is nothing. */
      const secId = /^sec-\d+/.exec(id)?.[0];
      setSections((prev) => prev.flatMap((s) => {
        if (s.section.id !== secId) return [s];
        const ids = columnIds(s.section);
        if (ids.length <= 1) return [];
        const at = ids.indexOf(id);
        let seen = 0;
        const rows = s.section.rows
          .map((row) => {
            const start = seen;
            seen += row.length;
            return at >= start && at < seen ? row.filter((_, i) => start + i !== at) : row;
          })
          .filter((row) => row.length > 0);
        const items = { ...s.section.items };
        delete items[id];
        return [{ ...s, section: { ...s.section, rows, items } }];
      }));
    } else if (/^el-\d+$/.test(id)) {
      /* ⚠️ A placed element has TWO possible homes — a section column, or a built-in row via
         `rowExtras`. Delete only ever looked in the columns, so anything dropped into Quick Actions
         or a cards row reported "Removed" and stayed on the page. Both homes are cleared; an element
         lives in one of them, so the other pass is a no-op. */
      const col = placedParent(id);
      if (col) {
        setSections((prev) => prev.map((s) => {
          if (s.section.items[col]?.id !== id) return s;
          const items = { ...s.section.items };
          delete items[col];
          return { ...s, section: { ...s.section, items } };
        }));
      }
      setRowExtras((prev) => {
        const hit = Object.keys(prev).find((r) => prev[r].some((e) => e.id === id));
        return hit ? { ...prev, [hit]: prev[hit].filter((e) => e.id !== id) } : prev;
      });
    } else {
      const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
      if (row) setRowOrder((o) => ({ ...o, [row]: o[row].filter((x) => x !== id) }));
      else setRemoved((r) => [...r, id]);
    }
    select(null);
    toast.success('Removed');
  }, [rowOrder, select]);

  /* "+" opens the element library — the one place elements come from.
     It also SELECTS the target, so the canvas still shows where the next add is aimed while the
     panel is showing the list, and `addElement` knows where a click should land. Not via select(),
     which would clear the panel it just opened. */
  /* ⚠️ A ref, not a direct call: `addElement` is declared after this and closes over state that
     changes every render, so capturing it in this callback's deps would either be a use-before-
     declaration or a stale copy. */
  const addElementRef = useRef<((type: string, anchor?: string) => void) | null>(null);

  const addInside = useCallback((id: string, type?: string) => {
    setSelectedId(id);
    /* The canvas toolbar picks a type itself, so there is nothing left to choose — placing it and
       swapping the panel to the library would send you somewhere you no longer needed to go. */
    if (type) { addElementRef.current?.(type, id); return; }
    setActive('add');
    setCollapsed(false);
    toast.success('Pick an element to add here — click it, or drag it onto the page');
  }, []);

  /* Inline text edits, routed to whichever store actually owns the words.
   *
   * ⚠️ There is no single text store, and that is deliberate — a card's title belongs to the card's
   * CONFIG, the hero's heading to page CONTENT, a dropped Text element to its own config. Writing
   * to one place would give the canvas and the panel two copies of the same sentence, which is the
   * thing this builder has kept avoiding. So the router mirrors exactly how the panel reads them,
   * and both surfaces stay views of one value.
   *
   * ⚠️ `-title` / `-sub` suffixes are card text nodes; `ownerOf` already strips them for config, so
   * the same rule decides the KEY here. */
  const setText = useCallback((id: string, text: string) => {
    const card = /^(.*)-(title|sub)$/.exec(id);
    if (card) { patchCfg(card[1], { [card[2] === 'title' ? 'title' : 'sub']: text }); return; }

    if (id === 'hero-title') { patchCfg('hero', { heading: text }); return; }
    if (id === 'hero-subtitle') { patchCfg('hero', { sub: text }); return; }

    // The three list-card headings each own a `title` on their own widget.
    if (/^(requests|approvals|knowledge|assets|cis)-title$/.test(id)) {
      patchCfg(id.replace(/-title$/, ''), { title: text });
      return;
    }

    // A dropped Text element keeps its words as HTML on its own config.
    if (/^el-\d+$/.test(id)) { patchCfg(id, { html: text }); return; }

    // An item's sub-element — the words live on the item, inside its widget's config.
    const item = parseItemId(id);
    if (item) {
      const owner = item.widget;
      setWidgetCfg((prev) => {
        const cfg = prev[owner] ?? {};
        const list = (cfg[item.key ?? 'items'] as Cfg[]) ?? [];
        return {
          ...prev,
          [owner]: { ...cfg, [item.key ?? 'items']: list.map((it, i) => (String(it.id ?? i) === item.item ? { ...it, [item.part ?? 'title']: text } : it)) },
        };
      });
    }
  }, [patchCfg]);

  /* Replace a placed element with a different kind, in the same spot.
     ⚠️ It takes a NEW id rather than mutating the old one's type: config and style are keyed by id,
     so reusing it would leave a Divider wearing a Button's stored padding and font. A replacement is
     a different element in the same place, and its settings should start clean. */
  const replaceElement = useCallback((id: string, type: string) => {
    const home = nodeById(id)?.parent ?? null;
    if (!home) return;
    const made = makeElement(type, home);
    if (/^sec-[0-9]+-c[0-9]+$/.test(home)) {
      setSections((prev) => prev.map((sec) => (
        sec.section.items[home]?.id === id
          ? { ...sec, section: { ...sec.section, items: { ...sec.section.items, [home]: made } } }
          : sec
      )));
    } else {
      setRowExtras((prev) => (
        prev[home] ? { ...prev, [home]: prev[home].map((e) => (e.id === id ? made : e)) } : prev
      ));
    }
    select(made.id);
    toast.success(`Replaced with ${made.name}`);
  }, [makeElement, select]);

  addElementRef.current = addElement;

  const canvasCtx = {
    selectedId, hoverId, select, setHover: setHoverId, styles, setStyle, setText,
    addSection, addColumnBeside, dropInColumn, dropAtSeam, dropInRow,
    moveNode, duplicateNode, deleteNode, canDuplicate, addInside, moveTo, areSiblings, replaceElement,
  };

  // Title — inline edit, committed on Enter or blur, abandoned on Escape.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page.name);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(page.name); }, [page.name]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  /** 'saving' for a beat after a change, so the check means something. */
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touch = useCallback(() => {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState('saved'), 900);
  }, []);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === page.name) { setDraft(page.name); return; }
    onRename(next);
    touch();
  };

  // ── panel resize ──────────────────────────────────────────────────────────
  const drag = useRef<{ x: number; w: number } | null>(null);
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { x: e.clientX, w: width };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      // Dragging LEFT widens the panel, so the delta is inverted.
      const next = drag.current.w + (drag.current.x - e.clientX);
      setWidth(Math.min(MAX_W, Math.max(MIN_W, next)));
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  const openPanel = (key: RailKey) => {
    setCollapsed(false);
    /* ⚠️ Theme is its OWN panel, not the Page drawer. It was routed there while it was three colour
       fields; a theme is now mode + palette + type + button shape, which is a surface of its own —
       and the Page layer's own theme fields were removed with this change so there is still one door. */
    // Clicking the lit icon again returns to the design panel rather than doing nothing.
    setActive((prev) => (prev === key && !collapsed ? null : key));
  };

  /* ⚠️ The theme paints through ONE wrapper, not by rewriting every block: font + page colour are
     inline, and dark mode is a class the stylesheet answers, so a widget that never asked about the
     theme still obeys it. */
  const themeSw = swatchesOf(theme);
  /* ⚠️ The accent is the PALETTE's accent slot, full stop. Deferring to the page's own `accent` prop
     for one palette meant picking ServiceOps-light silently produced a different colour from the one
     shown in its swatch strip — a palette you cannot trust to be the palette. */
  const themeAccent = themeSw[3];
  const themeWrap = {
    fontFamily: packOf(theme).body,
    background: themeSw[0],
    color: themeSw[4],
    '--portal-heading': packOf(theme).heading,
    '--portal-accent': themeAccent,
    '--portal-btn-radius': `${buttonOf(theme).radius}px`,
  } as React.CSSProperties;
  const themeClass = `portal-themed ${theme.mode === 'dark' ? 'portal-dark' : ''}`;

  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
  const divider = <span className="mx-1 h-5 w-px bg-[#E5E7EB]" />;

  // ── preview ───────────────────────────────────────────────────────────────
  if (preview) {
    return (
      <div className="fixed inset-0 z-[9500] flex flex-col bg-[#EEF1F5]">
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4">
          <div className="flex items-center gap-2 text-[13px] text-[#7B8FA5]">
            <Eye size={16} className="text-[#3D8BD0]" />
            Previewing <span className="font-medium text-[#364658]">{page.name}</span> as a requester sees it
          </div>
          <button
            onClick={() => setPreview(false)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          ><X size={14} /> Exit preview</button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto ${themeClass}`} style={themeWrap}>
          {/* Preview must behave like the real portal — selection off. */}
          <CanvasProvider value={{ ...canvasCtx, enabled: false, selectedId: null, hoverId: null, select: () => {}, setHover: () => {} }}>
            <SupportPortalPreview accent={themeAccent} content={content} sections={sections} icons={icons} placedText={placedText} blockOrder={blockOrder} rowOrder={rowOrder} removed={removed} rowExtras={rowExtras} cfg={cfgFor} />
          </CanvasProvider>
        </div>
      </div>
    );
  }

  return (
    /* ⚠️ Starts BELOW the 56px product header rather than at inset-0. The header is still on the
       page while the builder is open, so covering it would leave the logo and global search
       painted over by a canvas that has no use for that strip. */
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-[9000] flex flex-col bg-[#EEF1F5]">
      {/* ── Top bar ── the builder's own chrome; the admin sidebar is deliberately gone. */}
      <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white pl-2 pr-3">
        <button onClick={onExit} title="Back to Support Portal Customization" className={iconBtn}>
          <ArrowLeft size={18} />
        </button>

        {/* Inline title */}
        <div className="flex min-w-0 items-center gap-2">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') { setDraft(page.name); setEditing(false); }
              }}
              className="h-8 w-[260px] rounded border border-[#3D8BD0] bg-white px-2 text-[14px] font-medium text-[#364658] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              title="Rename page"
              className="group/title flex min-w-0 items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-[#F5F7FA]"
            >
              <span className="truncate text-[14px] font-medium text-[#364658]">{page.name}</span>
              <Pencil size={13} className="flex-shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover/title:opacity-100" />
            </button>
          )}
          <span className={`flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
            page.status === 'Published' ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'
          }`}>{page.status}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Nothing has been edited yet, so these say so rather than clicking into nowhere. */}
          <Tooltip><TooltipTrigger asChild>
            <button disabled className={`${iconBtn} cursor-not-allowed opacity-40 hover:bg-transparent`}><Undo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>Nothing to undo</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <button disabled className={`${iconBtn} cursor-not-allowed opacity-40 hover:bg-transparent`}><Redo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>Nothing to redo</TooltipContent></Tooltip>

          {divider}

          {/* ⚠️ Bordered secondary, not a third plain text button. Reset throws away every edit on
              the page, so it must not sit in the same visual class as Preview, which throws away
              nothing — the weight is the warning. */}
          <button
            onClick={resetPage}
            title="Put every block, style and setting back to the page's default"
            className="ml-1 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >Reset to default</button>
          <button
            onClick={() => setPreview(true)}
            className="inline-flex h-8 items-center rounded px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F3F4F6]"
          >Preview</button>
          <button
            onClick={onPublish}
            className="inline-flex h-8 items-center rounded bg-[#1E293B] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0F172A]"
          >Publish</button>

          {divider}

          <Tooltip><TooltipTrigger asChild>
            <button onClick={() => toast.success('Opening the live support portal')} className={iconBtn}><House size={17} /></button>
          </TooltipTrigger><TooltipContent>Open live portal</TooltipContent></Tooltip>
        </div>
      </div>

      {/* ── Work area ── */}
      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <div className="relative min-w-0 flex-1 overflow-y-auto p-5">
          <div
            className={`mx-auto max-w-[1600px] overflow-hidden rounded-lg border border-[#E1E6ED] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)] ${themeClass}`}
            style={themeWrap}
          >
            <CanvasProvider value={{ ...canvasCtx, enabled: true }}>
              <SupportPortalPreview accent={themeAccent} content={content} sections={sections} icons={icons} placedText={placedText} blockOrder={blockOrder} rowOrder={rowOrder} removed={removed} rowExtras={rowExtras} cfg={cfgFor} />
            </CanvasProvider>
          </div>

          {/* With the panel hidden the rail is the only way back to it — this restores the last one. */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="Show design panel"
              className="fixed right-[72px] top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-l border border-r-0 border-[#E1E6ED] bg-white text-[#64748B] shadow-sm transition-colors hover:text-[#3D8BD0]"
            ><ChevronLeft size={16} /></button>
          )}
        </div>

        {/* Drag handle — its own 5px strip so the 1px seam is still easy to grab. */}
        {!collapsed && (
          <div
            onMouseDown={startDrag}
            title="Drag to resize"
            className="group/rz relative w-[5px] flex-shrink-0 cursor-col-resize bg-[#E5E7EB] transition-colors hover:bg-[#3D8BD0]"
          >
            <span className="absolute left-1/2 top-1/2 h-8 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C3CBD6] transition-colors group-hover/rz:bg-white" />
          </div>
        )}

        {/* Design panel */}
        {!collapsed && (
          <aside style={{ width }} className="flex flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] px-2.5">
              <Tooltip><TooltipTrigger asChild>
                <button onClick={() => setCollapsed(true)} className={iconBtn}><PanelRight size={17} /></button>
              </TooltipTrigger><TooltipContent>Hide panel</TooltipContent></Tooltip>

              {active && <span className="truncate px-1 text-[13px] font-medium text-[#364658]">{PANEL_COPY[active].title}</span>}

              <div className="ml-auto flex items-center gap-0.5">
                <Tooltip><TooltipTrigger asChild>
                  {/* ⚠️ Reset, not Help. It replaces the "Reset all design on this element" link that
                      used to sit at the FOOT of the panel — below every control, so you scrolled past
                      everything to reach the one thing that undoes it. Same action, at the top, where
                      the panel's other controls are. */}
                  <button
                    onClick={() => { if (selectedId) { replaceStyle(selectedId, {}); setWidgetCfg((m) => { const n = { ...m }; delete n[ownerOf(selectedId)]; return n; }); toast.success('Element reset'); } }}
                    disabled={!selectedId}
                    className={`${iconBtn} disabled:opacity-40`}
                  ><RotateCcw size={16} /></button>
                </TooltipTrigger><TooltipContent>{selectedId ? 'Reset this element to default' : 'Select an element to reset it'}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <button
                    onClick={() => (active ? setActive(null) : setCollapsed(true))}
                    className={iconBtn}
                  ><X size={17} /></button>
                </TooltipTrigger><TooltipContent>{active ? 'Back to design panel' : 'Close panel'}</TooltipContent></Tooltip>
              </div>
            </div>

            {/* A rail panel wins while one is open; otherwise the panel is the element editor,
                falling back to the "select something" empty state. */}
            {active === 'add' ? (
              <div className="min-h-0 flex-1"><SupportPortalAddPanel onAdd={addElement} placedTypes={placedTypes} /></div>
            ) : active === 'theme' ? (
              <div className="flex min-h-0 flex-1 flex-col"><PortalThemePanel theme={theme} onChange={(patch) => setTheme((t) => ({ ...t, ...patch }))} /></div>
            ) : active === 'branding' ? (
              <div className="min-h-0 flex-1"><PortalBrandingPanel /></div>
            ) : active ? (
              <div className="min-h-0 flex-1 overflow-y-auto"><PanelEmptyState active={active} /></div>
            ) : selectedId && specForNode(selectedId) ? (
              /* A widget the specification covers gets the spec-driven drawer. Everything else in
                 the 65-element palette keeps the editor it already had — this adds, it does not
                 take away. */
              <div className="min-h-0 flex-1">
                <PortalWidgetDrawer
                  nodeId={selectedId}
                  spec={specForNode(selectedId)!}
                  cfg={cfgFor(selectedId)}
                  setCfg={(patch) => patchCfg(ownerOf(selectedId), patch)}
                  styles={styles}
                  setStyle={setStyle}
                  replaceStyle={replaceStyle}
                  onSelect={select}
                  icon={icons[selectedId]}
                  setIcon={(c) => setIcons((p) => ({ ...p, [selectedId]: c }))}
                  canDuplicate={canDuplicate(selectedId)}
                  onDuplicate={() => duplicateNode(selectedId)}
                  onDelete={() => deleteNode(selectedId)}
                  onOpenSetting={(section, card) =>
                    toast.success(`This lives in Admin › ${section}${card ? ` › ${card}` : ''}`)}
                />
              </div>
            ) : selectedId ? (
              <div className="min-h-0 flex-1">
                <PortalElementPanel
                  nodeId={selectedId}
                  content={content}
                  setContent={(fn) => setContent((c) => fn(c))}
                  styles={styles}
                  setStyle={setStyle}
                  onSelect={select}
                  icons={icons}
                  setIcon={(id, c) => setIcons((p) => ({ ...p, [id]: c }))}
                  placedText={placedText}
                  setPlacedText={(id, patch) => setPlacedText((p) => ({ ...p, [id]: { ...p[id], ...patch } }))}
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto"><PanelEmptyState active={null} /></div>
            )}
          </aside>
        )}

        {/* Icon rail — the right-most edge of the builder. Sized to the longest label
            ("Templates") so no caption spills past its own highlight.

            AI sits apart at the BOTTOM and carries a standing gradient tint: it is not a fifth
            panel of the same kind, it is the shortcut past all four, so it reads as its own thing
            rather than the last item of a list. */}
        <div className="flex w-[72px] flex-shrink-0 flex-col items-center gap-3 border-l border-[#e5e7eb] bg-white py-4">
          {RAIL.map((r) => {
            const on = active === r.key && !collapsed;
            const ai = r.key === 'ai';
            return (
              <button
                key={r.key}
                onClick={() => openPanel(r.key)}
                className={`flex w-[60px] flex-col items-center gap-1.5 rounded py-2 transition-all ${
                  ai ? 'mt-auto border' : ''
                } ${
                  ai
                    ? on
                      ? 'border-[#C4B5FD] bg-gradient-to-b from-[#EDE9FE] to-[#FCE7F3] text-[#6D28D9] shadow-[0_0_0_3px_rgba(124,58,237,0.10)]'
                      : 'border-[#EDE9FE] bg-gradient-to-b from-[#F5F3FF] to-[#FDF2F8] text-[#7C3AED] hover:border-[#C4B5FD] hover:shadow-[0_0_0_3px_rgba(124,58,237,0.08)]'
                    : on
                      ? 'bg-[#EBF5FF] text-[#3D8BD0]'
                      : 'text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]'
                }`}
              >
                {r.icon(on)}
                <span className="text-[11px] font-medium leading-none">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
