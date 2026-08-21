import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, ChevronLeft, Eye, RotateCcw,
  Palette, PanelRight, Paintbrush, Pencil, Plus, Redo2, SlidersHorizontal, Undo2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { AiSparkle } from './AiSparkle';
import { SupportPortalPreview } from './SupportPortalPreview';
import { AdminSupportPortalSettings } from './AdminSupportPortalSettings';
import { SupportPortalAddPanel } from './SupportPortalAddPanel';
import { PortalBrandingPanel } from './PortalBrandingPanel';
import { PRESETS, isRowAxis, presetOf } from './PortalSectionLayout';
import type { PresetId } from './PortalSectionLayout';
import { PortalThemePanel, DEFAULT_THEME, buttonOf, packOf, paletteOf, swatchesOf, faceOf, ThemeModeToggle } from './PortalThemePanel';
import type { PortalTheme } from './PortalThemePanel';
import { PortalElementPanel } from './PortalElementPanel';
import { CanvasProvider } from './PortalCanvas';
import {
  DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER, addColumn, moveIn, nodeById, parseItemId,
  placedType, registerPlaced, colId,
} from './portalPageModel';
import { PortalWidgetDrawer } from './PortalWidgetDrawer';
import { WIDGET_FOR_NODE, WIDGET_FOR_TYPE, specById, structureSpecId } from './portalWidgetSpec';
import type { Cfg, WidgetSpec } from './portalWidgetSpec';
import type { CustomSection, NodeStyle, PlacedElement, PortalPageContent, PortalStyles } from './portalPageModel';
import { PORTAL_ELEMENTS, PORTAL_EMPTY_WIDGETS } from './supportPortalData';
import { IconPopover } from './PortalIconPicker';
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

type RailKey = 'add' | 'theme' | 'branding' | 'settings' | 'ai';

const RAIL: { key: RailKey; label: string; icon: (on: boolean) => ReactNode }[] = [
  /* ⚠️ "Widgets", not "Add". The rail names PLACES, not verbs — Theme, Branding, Templates are all
     nouns, and "Add" made one item read as an action while its neighbours read as destinations. */
  { key: 'add', label: 'Widgets', icon: () => <Plus size={18} /> },
  { key: 'theme', label: 'Theme', icon: () => <Paintbrush size={18} /> },
  { key: 'branding', label: 'Branding', icon: () => <Palette size={18} /> },
  /* ⚠️ BELOW Branding, and inside the portal rather than beside the listing. What a requester may
     DO on this portal is a property of this portal — the same kind of statement as its theme and
     its logo — so it belongs on the rail with them. */
  { key: 'settings', label: 'Settings', icon: () => <SlidersHorizontal size={18} /> },
  { key: 'ai', label: 'AI', icon: (on) => <AiSparkle size={18} className={on ? '' : 'opacity-90'} /> },
];

/** Each panel says what it is for rather than that it is unfinished — an empty state is a
 *  description of the panel's job, not an apology for it. */
const PANEL_COPY: Record<RailKey, { title: string; body: string }> = {
  add: {
    // Add is a real panel now — this entry only supplies the header title.
    title: 'Widgets',
    body: 'Everything you can put on the page.',
  },
  /* ⚠️ Every rail panel is titled with the NAME OF ITS RAIL ITEM, and carries one line under it.
     They had drifted into three different shapes — an imperative ("Brand this page"), a noun phrase
     ("Site styles") and a bare label — so which panel you were in read as a different kind of place
     each time, on a rail whose items are all the same kind of thing. */
  theme: {
    title: 'Theme',
    body: 'Style, type and colour for every page of this portal.',
  },
  branding: {
    /* ⚠️ "Branding", not "Brand this page". The brand is org-wide — page-scoped wording promised a
       per-page override that has never existed. */
    title: 'Branding',
    body: 'The organisation identity, shared by every portal.',
  },
  settings: {
    title: 'Settings',
    body: 'What a requester can do on this portal.',
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

export function SupportPortalBuilder({ page, accent, onRename, onPublish, onExit, openOn, onOpenConsumed }: SupportPortalBuilderProps & {
  /* Which rail panel to land on. The listing's "Portal settings" action opens the portal AT its
     settings rather than at the canvas — asking for settings and being given a blank widget library
     is the builder answering a different question from the one you pressed. */
  openOn?: RailKey;
  onOpenConsumed?: () => void;
}) {
  const [width, setWidth] = useState(MIN_W);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<RailKey | null>(openOn ?? null);
  /* ⚠️ Consumed ONCE, on mount. Left standing, every later close of the panel would be undone by the
     next render and the rail item could never be switched off. */
  useEffect(() => { if (openOn) onOpenConsumed?.(); }, []);
  const [preview, setPreview] = useState(false);
  /* The portal's own style system. It lives HERE rather than in the panel because the canvas has to
     paint with it — a theme panel that only changed itself would be a colour picker with no page. */
  const [theme, setTheme] = useState<PortalTheme>(DEFAULT_THEME);

  /* ── Undo / redo ───────────────────────────────────────────────────────────
   *
   * ⚠️ SNAPSHOTS of the whole page, not a log of commands. This builder has eleven independent state
   * atoms and edits arrive from four surfaces — the canvas, the drawer, the rail panels and inline
   * text — so a command log would need every one of them to remember to record itself, and the first
   * one that forgot would make undo quietly skip a step. A snapshot cannot be forgotten: an effect
   * watches the state and records whatever it finds.
   *
   * ⚠️ The effect must not record its OWN restore, or undo would push the state it just popped and
   * you could never get further back than one step — `applying` is what stops that.
   * ⚠️ It also compares against the top of the stack before pushing: React re-runs effects on
   * unrelated renders, and an identical snapshot would fill the history with steps that change
   * nothing, so undo would appear to do nothing several times in a row. */
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const applying = useRef(false);
  const [histTick, setHistTick] = useState(0);

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
  const rowOrderRef = useRef<Record<string, string[]>>(DEFAULT_ROW_ORDER);
  const widgetCfgRef = useRef<Record<string, Cfg>>({});
  const [widgetCfg, setWidgetCfg] = useState<Record<string, Cfg>>({});
  /* ⚠️ Declared ABOVE their first assignment. Put after it, the assignment ran against an
     undefined binding and took the whole builder down on mount. */
  widgetCfgRef.current = widgetCfg;

  /** The widget spec behind a node, whether it is a fixed block or something an admin dropped.
   *  ⚠️ Both routes must land on the SAME spec, or one widget would edit two different ways. */
  /* ⚠️ An ITEM belongs to its widget's config, not its own. `el-3~i2` resolves to el-3's spec and
     el-3's cfg; the drawer slices the item out of the collection. Keying config by the item id would
     scatter one widget's content across N stores and break Reset, duplicate and reorder. */
  /* A card's Title/Subtext node edits the CARD's config — the words live on the card, not on a
     store of their own, or the canvas and the panel would hold two copies of one sentence. */
  /* ⚠️ `-viewall` strips too. The link's label is a key on the WIDGET's config, so its own node has
     to resolve to the widget for reading and writing — the panel it opens is separate (see
     `specForNode`), which is the whole point: same value, different editor. */
  const ownerOf = (id: string) => parseItemId(id)?.widget ?? id.replace(/-(title|sub|label|viewall|icon|search|caption|cl\d+|cv\d+)$/, '');

  const specForNode = useCallback((id: string | null): WidgetSpec | undefined => {
    if (!id) return undefined;
    /* ⚠️ The ORIGINAL id first. A card's Title node shares its CONFIG with the card — that is what
       `ownerOf` is for — but it must not share its PANEL, or clicking the title opens the card and
       the one thing you aimed at is the one thing you cannot edit. Config and panel resolve
       differently here on purpose. */
    const own = structureSpecId(id);
    if (['card_title', 'card_sub', 'card_icon', 'list_title', 'list_label', 'list_link', 'search', 'image_caption'].includes(own ?? '')) return specById(own);

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
  const sectionsRef = useRef<{ afterId: string; section: CustomSection }[]>([]);

  const NODE_CFG_SEED: Record<string, Cfg> = {
    /* ⚠️ `hasCards` is what gates the Card-templates control. Only the Quick Actions band holds
       action cards, so only it gets the picker — offering a card layout on a section with no cards
       is a control that cannot do anything. Seeded per NODE because the section SPEC is shared by
       every band and every added section. */
    quick: { cols: '4', hasCards: true },
    work: { cols: '3' },
    records: { cols: '2' },
  };

  /* ⚠️ `hasContent` is DERIVED, never stored. It gates the Alignment accordion, and a stored flag
     would have to be updated by every path that adds or removes an element — drop, click-to-add,
     replace, delete, undo — and the first one that forgot would leave a section claiming to be empty
     while holding something, or the reverse. Reading the current shape each time cannot go stale. */
  /* ⚠️ Read through a REF, not the state directly. `cfgFor` is declared above `sections`, so naming
     the state here — even only in a dependency array — is a use-before-initialisation that throws at
     module evaluation and blanks the page. The ref is assigned on every render just below the state,
     so it is always current by the time anything calls this. */
  const sectionHasContent = useCallback((id: string) => {
    const sec = sectionsRef.current.find((s) => s.section.id === id)?.section;
    if (sec) return Object.keys(sec.items).length > 0;
    // A built-in band always holds its own widgets.
    return true;
  }, []);

  /* ⚠️ DERIVED, like `hasContent` — the preset row lights from the section's actual shape rather
     than from a stored id, so a layout changed by the canvas adders and one changed by the preset
     row cannot disagree about which tile is current. The double underscore marks these as read-only
     view keys: nothing writes them back. */
  const sectionShape = useCallback((id: string) => {
    const sec = sectionsRef.current.find((x) => x.section.id === id)?.section;
    if (sec) {
      /* ⚠️ Same substitution the preset itself makes, or the tile ROW and the tile ACTION disagree:
         an empty two-row section reported 0 and was offered the two-item tile set, so the shape it
         already had was not among the shapes it could be given. */
      const cells = sec.rows.reduce((a, r) => a + r.length, 0);
      return {
        __count: Math.max(Object.keys(sec.items).length, cells),
        __preset: presetOf(sec.rows),
        __rowAxis: isRowAxis(sec.rows),
      };
    }
    /* ⚠️ A BUILT-IN band, whose shape is a column COUNT on its config rather than a `rows` array.
       This used to return a hard-coded `{ count: 0, preset: 'cols' }`, which broke the preset row
       in two visible ways at once: the tile row never lit the preset you were actually on — pick
       Stacked and the canvas restacked while Columns stayed selected — and `count: 0` meant
       presetsFor() offered the two-item set, so a three-card band was missing a tile it had earned.
       The current preset has to be DERIVED from the same number applyPreset writes, or the control
       is describing a section other than the one in front of you. */
    const items = rowOrderRef.current[id]?.length ?? 0;
    if (!items) return { __count: 0, __preset: 'cols' as PresetId, __rowAxis: true };
    const cols = Number(widgetCfgRef.current[id]?.cols ?? items);
    const preset: PresetId = cols <= 1 ? 'stack' : cols >= items ? 'cols' : cols === 3 ? 'three' : 'grid';
    return { __count: items, __preset: preset, __rowAxis: cols > 1 };
  }, []);

  const cfgFor = useCallback((id: string): Cfg => {
    const owner = ownerOf(id);
    return {
      ...(specForNode(owner)?.defaults ?? {}),
      ...(NODE_CFG_SEED[owner] ?? {}),
      /* ⚠️ Built-in bands get the shape as well. They were handed a bare `__rowAxis: true` with no
         `__preset` and no `__count`, so the preset row had nothing to light and nothing to size
         itself from — the two symptoms above. */
      ...(/^sec-\d+$/.test(owner)
        ? { hasContent: sectionHasContent(owner), ...sectionShape(owner) }
        : { hasContent: true, ...sectionShape(owner) }),
      /* ⚠️ Whether this widget has any records, so the panel can stand down the controls that only
         describe records. Arranging nothing is not a setting, it is a control with no referent. */
      /* ⚠️ The ROW's card template, seeded so the card's own picker opens on the shape it is
         actually wearing. widgetCfg[owner] is spread after this, so a card that has chosen its
         own still wins — this only fills the gap before it chooses. */
      ...(/^quick-/.test(owner) ? { cardTemplate: widgetCfgRef.current.quick?.cardTemplate ?? 'left' } : {}),
      __noData: PORTAL_EMPTY_WIDGETS.has(owner),
      ...(widgetCfg[owner] ?? {}),
    };
  }, [specForNode, widgetCfg, sectionHasContent]);

  const patchCfg = useCallback((id: string, patch: Cfg) => {
    /* ⚠️ Responsive behaviour CLEARS the widths already dragged onto this section's first-layer
       columns. Fill stores a share of the row (`flex`) and Fixed stores a width of its own
       (`widthPct`); a value left behind by the other mode is read by the wrong rule and the row
       either collapses or overflows. Redistributing is also the truthful answer to "what does this
       row do now" — the rule it distributes by is exactly what you changed.
       ⚠️ The columns are found in the DOM rather than from state, because a section's first layer
       has three different shapes — an added section's `rows`, a built-in band's card list, and
       whatever has been dropped alongside them — and the rendered page is the one place all three
       agree. A direct child is one whose nearest `[data-node]` ancestor is this section. */
    if (patch.resize !== undefined) {
      const host = document.querySelector(`[data-node="${id}"]`);
      const cols = host
        ? [...host.querySelectorAll<HTMLElement>('[data-node]')]
            .filter((k) => k.parentElement?.closest('[data-node]') === host)
            .map((k) => k.dataset.node!)
        : [];
      if (cols.length) {
        setStyles((prev) => {
          const next = { ...prev };
          let touched = false;
          cols.forEach((c) => {
            const s = next[c];
            if (!s || (s.flex === undefined && s.widthPct === undefined && s.width === undefined)) return;
            const { flex, widthPct, width, ...rest } = s;
            next[c] = rest;
            touched = true;
          });
          return touched ? next : prev;
        });
      }
    }
    setWidgetCfg((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  /** Selecting an element takes over the panel — the design panel IS the element editor. */
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) { setActive(null); setCollapsed(false); }
  }, []);

  /** Sections the admin has added, each pinned to the block it was inserted after. */
  /* ⚠️ EVERY catalogue element is on the page from the start, two to a section, appended after the
     last built-in band. This is a design prototype whose whole job is letting someone open a widget,
     change a field and watch the page answer — and a control you cannot see the effect of is a
     control nobody can review. Seeding them makes the page long, which is the price of every widget
     being one click from its own live example instead of needing to be placed first.
     ⚠️ registerPlaced is called HERE, not at render: it is what lets nodeById() name a dropped
     element, and the normal add path calls it at ADD time — a seeded element never goes through
     that path, so without this every seeded node would open a drawer with no identity. */
  const [sections, setSections] = useState<{ afterId: string; section: CustomSection }[]>(() => {
    /* ⚠️ ONE element per section, one column wide. Two to a row made each element share its width
       and its baseline with an unrelated neighbour, so a Divider sat beside a Table and neither was
       being shown at the size it will really be used at. Full width down a single column is how the
       portal page itself is built, and it means every element can be selected, resized and styled
       without its partner moving at the same time. */
    const pool = PORTAL_ELEMENTS.filter((e) => !e.onPage && !e.hidden);
    return pool.map((def, i) => {
      const id = `sec-${i + 1}`;
      const cid = colId(id, 0);
      const inst: PlacedElement = { id: `el-${i + 1}`, type: def.id, name: def.name };
      registerPlaced(inst.id, inst.name, inst.type, cid);
      return { afterId: 'records', section: { id, rows: [[1]], items: { [cid]: inst } } };
    });
  });
  sectionsRef.current = sections;
  const nextSectionId = useRef(sectionsRef.current.length + 1);
  /* ⚠️ Past the seeded ids. Starting at 1 would mint an `el-1` that already exists, and config and
     style are keyed by id — the new element would silently wear the seeded one's settings. */
  const seededElements = sectionsRef.current.reduce((n, x) => n + Object.keys(x.section.items).length, 0);

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
  /* ⚠️ ONE icon store, written from two places. The canvas popover and the panel's icon field both
     land here, so an icon changed inline is the same icon the panel then shows — the alternative is
     two truths for one glyph. */
  const [iconPick, setIconPick] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [placedText, setPlacedText] = useState<Record<string, { title?: string; desc?: string }>>({});

  const nextElementId = useRef(seededElements + 1);
  /** Builds the instance and registers it so the canvas and panel can describe it. */
  const makeElement = useCallback((type: string, parent: string) => {
    const def = PORTAL_ELEMENTS.find((e) => e.id === type);
    const el: PlacedElement = { id: `el-${nextElementId.current++}`, type, name: def?.name ?? 'Element' };
    registerPlaced(el.id, el.name, el.type, parent);
    return el;
  }, []);

  /** Elements dropped straight into a built-in row (Quick Actions, Cards Row, Records Row). */
  const [rowExtras, setRowExtras] = useState<Record<string, PlacedElement[]>>({});
  /* ⚠️ Read by `detachElement`, which must know what it is holding BEFORE the state settles. */
  const rowExtrasRef = useRef<Record<string, PlacedElement[]>>({});
  rowExtrasRef.current = rowExtras;

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
  rowOrderRef.current = rowOrder;
  const [removed, setRemoved] = useState<string[]>([]);

  /* Reset to default — every store the canvas reads, back to its seed.
     ⚠️ It must clear ALL of them. Missing one leaves the page in a state that is neither the
     default nor what you built: an added section whose widget config was wiped, or a block still
     hidden by `removed` after its content came back. The list is the state list, in order. */
  /* Everything an edit can touch, in one string. ⚠️ Order matters only in that it must be STABLE —
     the recorder compares snapshots by value to decide whether anything actually changed. */
  const snapshot = JSON.stringify({
    content, styles, widgetCfg, sections, placedText, rowExtras, icons, blockOrder, rowOrder, removed, theme,
  });

  useEffect(() => {
    /* ⚠️ The flag is CLEARED on a timeout, not here. Clearing it in the effect assumed the effect
       always runs after a restore — but if the restored state happens to equal the current one,
       React skips the re-render, the effect never fires, and the flag stays raised forever. From
       that point every real edit is silently swallowed by this guard and undo appears to stop
       working. The timeout always fires, whether or not anything re-rendered. */
    if (applying.current) return;
    if (past.current[past.current.length - 1] === snapshot) return;
    past.current.push(snapshot);
    /* A new edit ends the redo branch — you cannot redo into a future that no longer follows from
       the present. Every editor works this way and quietly not doing it is how redo starts
       reapplying changes from a page the user already abandoned. */
    if (future.current.length) future.current = [];
    setHistTick((n) => n + 1);
  }, [snapshot]);

  const restore = useCallback((raw: string) => {
    const v = JSON.parse(raw);
    applying.current = true;
    // Effects flush before a 0 ms timeout, so the recorder has already seen the flag by now.
    setTimeout(() => { applying.current = false; }, 0);
    setContent(v.content); setStyles(v.styles); setWidgetCfg(v.widgetCfg);
    setSections(v.sections); setPlacedText(v.placedText); setRowExtras(v.rowExtras);
    setIcons(v.icons); setBlockOrder(v.blockOrder); setRowOrder(v.rowOrder);
    setRemoved(v.removed); setTheme(v.theme);
  }, []);

  /* ⚠️ The stack holds states, not diffs, so the CURRENT state is its last entry — undo pops that,
     keeps it for redo, and restores the one beneath. Treating the top as "the thing to go back to"
     is the classic off-by-one that makes the first undo do nothing. */
  const canUndo = past.current.length > 1;
  const canRedo = future.current.length > 0;
  const undo = useCallback(() => {
    if (past.current.length < 2) return;
    const cur = past.current.pop()!;
    future.current.push(cur);
    restore(past.current[past.current.length - 1]);
    setHistTick((n) => n + 1);
    select(null);
  }, [restore]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(next);
    restore(next);
    setHistTick((n) => n + 1);
    select(null);
  }, [restore]);

  /* Ctrl/⌘+Z and Ctrl/⌘+Shift+Z — ignored while typing, or the shortcut would fight the field's own
     undo and win, throwing away a sentence to undo a layout change. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

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
  /* ⚠️ A preset RESTRUCTURES, and the widgets come with it. Reading the items out in cell order and
     writing them back into the new cells in the same order is what makes "3 across → stacked" keep
     A, B, C as A, B, C — rebuilding the rows alone would leave every item keyed to a column id that
     no longer exists, which is a section that empties itself when you change its shape.
     ⚠️ The new shape is sized to the CONTENT, not to the preset's nominal cell count, so nothing is
     ever dropped: four widgets in "three across" become 3 + 1, not 3 and a deletion. */
  const applyPreset = useCallback((sectionId: string, preset: PresetId) => {
    /* ⚠️ A BUILT-IN band is not in `sections` — its shape is a column COUNT on its config, not a
       `rows` array — so the reflow below found nothing and the preset silently did nothing on the
       three bands that ship with the page. They are the sections most people will ever touch, so
       "sections" here has to mean both kinds. One preset, two storage shapes. */
    if (!/^sec-[0-9]+$/.test(sectionId)) {
      const n = Object.keys(NODE_CFG_SEED[sectionId] ?? {}).length ? Number(cfgFor(sectionId).cols ?? 3) : 3;
      const cols = preset === 'stack' ? '1' : preset === 'grid' ? '2' : preset === 'three' ? '3' : String(Math.max(2, n));
      patchCfg(sectionId, { cols });
      toast.success(`${PRESETS[preset].title} layout applied`);
      return;
    }
    setSections((prev) => prev.map((entry) => {
      if (entry.section.id !== sectionId) return entry;
      const sec = entry.section;
      const ordered: PlacedElement[] = [];
      let n = -1;
      sec.rows.forEach((row) => row.forEach(() => { n += 1; const it = sec.items[colId(sec.id, n)]; if (it) ordered.push(it); }));
      const cells = sec.rows.reduce((a, r) => a + r.length, 0);
      const rows = PRESETS[preset].rows(Math.max(ordered.length, cells, 1));
      const items: Record<string, PlacedElement> = {};
      let i = -1;
      rows.forEach((row) => row.forEach(() => {
        i += 1;
        const el = ordered[i];
        if (!el) return;
        const cid = colId(sec.id, i);
        items[cid] = el;
        registerPlaced(el.id, el.name, el.type, cid);
      }));
      return { ...entry, section: { ...sec, rows, items } };
    }));
    toast.success(`${PRESETS[preset].title} layout applied`);
  }, []);

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
    /* ⚠️ Found from the REFS, not from inside the state updaters. The updaters were where `taken`
       used to be assigned, and React only runs an updater eagerly when that hook's queue is empty —
       so detaching from a SECTION happened to work and detaching from a built-in ROW returned null.
       The caller then bailed out after the element had already been removed: it vanished off the
       page with no toast and no home. Reading first and writing second cannot half-move anything. */
    let taken: PlacedElement | null = null;
    for (const sec of sectionsRef.current) {
      const col = Object.keys(sec.section.items).find((c) => sec.section.items[c].id === id);
      if (col) { taken = sec.section.items[col]; break; }
    }
    if (!taken) {
      const rows = rowExtrasRef.current;
      const hit = Object.keys(rows).find((r) => rows[r].some((e) => e.id === id));
      if (hit) taken = rows[hit].find((e) => e.id === id) ?? null;
    }
    if (!taken) return null;

    /* Clear BOTH homes — a column and a built-in row are two different stores, and an element that
       half-moves is an element that gets duplicated. */
    setSections((prev) => prev.map((sec) => {
      const col = Object.keys(sec.section.items).find((c) => sec.section.items[c].id === id);
      if (!col) return sec;
      const items = { ...sec.section.items };
      delete items[col];
      return { ...sec, section: { ...sec.section, items } };
    }));
    setRowExtras((prev) => {
      const hit = Object.keys(prev).find((r) => prev[r].some((e) => e.id === id));
      if (!hit) return prev;
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
  /* ⚠️ Resolve a dragged or dropped node to the thing that can actually BE placed.
     A drag aims at what you can see, and what you can see is usually a CHILD: a card's title, an
     image's caption, a widget's heading. None of those has a home of its own — they are parts of
     the element that owns them — so a drop on one used to fall through every branch below and end
     at "Drop it on a column, or on something in the same row", which is an error message about a
     rule the person had not broken. Walking up to the owner makes "I dragged the words" mean "move
     the thing the words belong to", which is the only reading that can be honoured. */
  const placeable = useCallback((id: string): string => {
    let cur = id;
    for (let i = 0; i < 6; i += 1) {
      if (/^el-\d+$/.test(cur) || /^sec-\d+(-c\d+)?$/.test(cur) || listOf(cur)) return cur;
      const parent = nodeById(cur)?.parent;
      if (!parent || parent === cur) break;
      cur = parent;
    }
    return cur;
  }, [listOf]);

  /** Where a node lives: a section column, or a built-in row. Null for a page-level band. */
  const homeOf = useCallback((id: string): { kind: 'col' | 'row'; id: string } | null => {
    if (/^sec-\d+-c\d+$/.test(id)) return { kind: 'col', id };
    if (/^el-\d+$/.test(id)) {
      const p = nodeById(id)?.parent;
      if (p && /^sec-\d+-c\d+$/.test(p)) return { kind: 'col', id: p };
      if (p && rowOrderRef.current[p]) return { kind: 'row', id: p };
    }
    const row = listOf(id);
    if (row && row !== 'block' && row !== 'section') return { kind: 'row', id: row };
    return null;
  }, [listOf]);

  /* Moving a placed element into a built-in row — Quick Actions, the work row, the records row.
     ⚠️ Detach first, in both stores: an element that half-moves is an element that gets duplicated. */
  const moveIntoRow = useCallback((id: string, rowId: string) => {
    const moving = detachElement(id);
    if (!moving) return;
    setRowExtras((prev) => ({ ...prev, [rowId]: [...(prev[rowId] ?? []), moving] }));
    registerPlaced(moving.id, moving.name, moving.type, rowId);
    select(id);
    toast.success(`${moving.name} moved`);
  }, [detachElement, select]);

  /* A drop on a SEAM builds the element its own section there — the same courtesy dropping a NEW
     element on a seam already gets. Without it the only way to move something out of a crowded
     column was to delete it and drag a fresh one from the library, losing everything it carried. */
  const moveToSeam = useCallback((id: string, afterId: string) => {
    const moving = detachElement(id);
    if (!moving) return;
    const section: CustomSection = { id: `sec-${nextSectionId.current++}`, rows: [[1]], items: {} };
    const col = colId(section.id, 0);
    section.items[col] = moving;
    registerPlaced(moving.id, moving.name, moving.type, col);
    setSections((prev) => [...prev, { afterId, section }]);
    select(id);
    toast.success(`${moving.name} moved to a new section`);
  }, [detachElement, select]);

  const moveTo = useCallback((source: string, target: string) => {
    /* Both ends resolve to something placeable first — see the note on `placeable`. */
    const src = placeable(source);
    const dst = placeable(target);
    if (src === dst) return;

    /* ⚠️ A placed element is not confined to the list it started in. Reordering handles siblings;
       everything else is a RELOCATION, which is what dragging across sections has to mean — the
       old code refused it with "drop it on something in the same row", so the only way to move an
       element between sections was to delete it and build it again. */
    if (/^el-[0-9]+$/.test(src)) {
      const home = homeOf(dst);
      /* A column takes it directly; landing on an occupant swaps the two. */
      if (home?.kind === 'col') { relocateElement(src, home.id); return; }
      /* A built-in card, or the row it sits in — join that row rather than refusing. This is the
         "find a column on its own" case: you aimed at a place on the page, not at a slot. */
      if (home?.kind === 'row') { moveIntoRow(src, home.id); return; }
    }
    const list = listOf(src);
    if (!list || list !== listOf(dst)) {
      /* ⚠️ Nothing left to try, so say what WOULD work rather than restating the rule that failed.
         Every other route above is now open, so reaching here means the two really have no common
         ground — a page band dropped onto a card, say. */
      toast.error('Drop it on a section, a column, or a seam between blocks');
      return;
    }
    const reorder = (arr: string[]) => {
      const from = arr.indexOf(src);
      const to = arr.indexOf(dst);
      if (from < 0 || to < 0) return arr;
      const next = [...arr];
      next.splice(from, 1);
      next.splice(to, 0, src);
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
  }, [listOf, relocateElement, placeable, homeOf, moveIntoRow]);

  /** Only things with their own identity can be cloned; a fixed page band has none. */
  /** The palette type that renders the same widget as a fixed page block, so it can be cloned. */
  const CLONE_TYPE: Record<string, string> = {
    requests: 'c-requests', approvals: 'c-approvals', knowledge: 'c-knowledge',
    assets: 'c-assets', cis: 'c-cis',
    'quick-incident': 'act-incident', 'quick-service': 'act-service',
    'quick-knowledge': 'act-knowledge', 'quick-ad': 'act-ad',
  };

  const canDuplicate = useCallback(
    (id: string) => /^sec-\d+$/.test(id) || /^el-\d+$/.test(id) || !!CLONE_TYPE[id],
    [],
  );

  const duplicateNode = useCallback((id: string) => {
    /* A fixed page block — clone it as a placed element of the equivalent palette type, into the
       row it already sits in, carrying everything that makes it look like itself. */
    const cloneType = CLONE_TYPE[id];
    if (cloneType) {
      const row = Object.keys(rowOrderRef.current).find((r) => rowOrderRef.current[r].includes(id));
      if (!row) return;
      const el = makeElement(cloneType, row);
      setRowExtras((prev) => ({ ...prev, [row]: [...(prev[row] ?? []), el] }));
      /* ⚠️ The config, the style and the words are copied TOO. Cloning the placement alone produced
         a card wearing the widget's factory defaults beside one the admin had spent ten minutes on,
         which reads as the button having done the wrong thing rather than half of the right one. */
      setWidgetCfg((prev) => ({ ...prev, [el.id]: { ...prev[id] } }));
      setStyles((prev) => {
        const next = { ...prev };
        if (prev[id]) next[el.id] = { ...prev[id] };
        /* Its child text nodes carry their own styles under their own ids. */
        ['-title', '-sub', '-viewall', '-icon'].forEach((suffix) => {
          if (prev[id + suffix]) next[el.id + suffix] = { ...prev[id + suffix] };
        });
        return next;
      });
      setPlacedText((prev) => (prev[id] ? { ...prev, [el.id]: { ...prev[id] } } : prev));
      setIcons((prev) => (prev[id] ? { ...prev, [el.id]: prev[id] } : prev));
      select(el.id);
      toast.success(`${el.name} copied`);
      return;
    }
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
      /* ⚠️ Read the items off GROWN, not off the original. addColumn now re-keys them for the new
         column numbering, so spreading the pre-insert map would put every neighbour back under its
         old key and undo the shift the clone depends on. */
      const items: Record<string, PlacedElement> = { ...grown.items };
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
    /* An image's caption — markup, on the image's own config, which is the key its panel writes. */
    const cap = /^(.+)-caption$/.exec(id);
    if (cap) { patchCfg(cap[1], { caption: text }); return; }
    const card = /^(.*)-(title|sub)$/.exec(id);
    if (card) { patchCfg(card[1], { [card[2] === 'title' ? 'title' : 'sub']: text }); return; }

    if (id === 'hero-title') { patchCfg('hero', { heading: text }); return; }
    /* A "View all" label, edited on the canvas. Same key the panel writes. */
    const link = /^(.+)-viewall$/.exec(id);
    if (link) { patchCfg(link[1], { viewAllLabel: text }); return; }
    if (id === 'hero-subtitle') { patchCfg('hero', { sub: text }); return; }

    // Every list widget's heading owns a `title` on its own widget.
    if (/-title$/.test(id)) {
      patchCfg(id.replace(/-title$/, ''), { title: text });
      return;
    }

    // A dropped Text element keeps its words as HTML on its own config.
    if (/^el-\d+$/.test(id)) { patchCfg(id, { html: text }); return; }

    /* A placed element's own words — a KPI's label, a custom card's title or subtext. The suffix IS
       the config key, which is why these need no per-type branch. */
    const placedTxt = /^(el-\d+)-(title|sub|label)$/.exec(id);
    if (placedTxt) { patchCfg(placedTxt[1], { [placedTxt[2]]: text }); return; }

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
    /* ⚠️ A built-in widget can be replaced too. It has no `el-` identity to swap, so the swap is
       expressed the only way the model can express it: hide the block and drop the replacement into
       the row it occupied. Without this, a filled slot could only ever offer "add inside", which is
       a promise a one-widget slot cannot keep. */
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row) {
      setRemoved((prev) => (prev.includes(id) ? prev : [...prev, id]));
      dropInRow(row, type);
      return;
    }
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
  }, [makeElement, select, rowOrder, dropInRow]);

  addElementRef.current = addElement;

  /* ⚠️ It selects the ICON node, not the card that owns the icon. The canvas already called
     `select('<card>-icon')` before this ran, and this overwrote it with the card's own id — so the
     picker opened while the outline and the sidebar both showed the parent, which is the one thing
     clicking an icon must not do. The VALUE still keys off the card (`icons[ownerOf(id)]`), because
     that is where the glyph is stored; only the selection differs. */
  const pickIcon = useCallback((id: string, anchor: DOMRect) => {
    setSelectedId(`${id}-icon`);
    setIconPick({ id, rect: anchor });
  }, []);

  const canvasCtx = {
    selectedId, hoverId, select, setHover: setHoverId, styles, setStyle, setText,
    addSection, addColumnBeside, dropInColumn, dropAtSeam, dropInRow,
    moveNode, duplicateNode, deleteNode, canDuplicate, addInside, moveTo, moveToSeam, areSiblings, replaceElement, pickIcon, applyPreset,
    onWholePage: () => { const on = cfgFor('hero').bgWholePage === true; patchCfg('hero', { bgWholePage: !on }); toast.success(on ? 'Background is banner-only again' : 'Background applied to the whole page'); },
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

  /* See the note on the panel below — the library is the resting state, not an empty page. */
  const panelKey: RailKey | null = active ?? (selectedId ? null : 'add');

  const openPanel = (key: RailKey) => {
    /* ⚠️ Clicking the LIT item closes the panel outright — the rail is the switch, so it has to
       switch off as well as on. This has to run BEFORE `setCollapsed(false)`; putting the toggle
       after it meant every click re-opened the panel first and the close never survived the same
       tick. */
    if (key === active && !collapsed) { setActive(null); setCollapsed(true); return; }
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
    fontFamily: faceOf(theme, 'body').css,
    background: themeSw[0],
    color: themeSw[4],
    '--portal-heading': faceOf(theme, 'heading').css,
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
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
            ><Undo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>{canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
            ><Redo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>{canRedo ? 'Redo (Ctrl+Shift+Z)' : 'Nothing to redo'}</TooltipContent></Tooltip>

          {divider}

          {/* ⚠️ Bordered secondary, not a third plain text button. Reset throws away every edit on
              the page, so it must not sit in the same visual class as Preview, which throws away
              nothing — the weight is the warning. */}
          <button
            onClick={resetPage}
            title="Put every block, style and setting back to the page's default"
            className="ml-1 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >Reset to default</button>
          {/* ⚠️ The same bordered secondary as Reset to default. It was the only bare-text control in a
              row of three, so the bar read as two buttons and a word rather than as a set of
              actions — and the least destructive of the three looked the least like something you
              could press. */}
          <button
            onClick={() => setPreview(true)}
            className="ml-1 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >Preview</button>
          <button
            onClick={onPublish}
            className="inline-flex h-8 items-center rounded bg-[#1E293B] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0F172A]"
          >Publish</button>

        </div>
      </div>

      {/* ── Work area ── */}
      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <div className="relative min-w-0 flex-1 overflow-y-auto p-5">
          <div
            /* The box a floating toolbar must stay inside — the design panel owns the space to its right. */
            data-portal-canvas
            className={`mx-auto max-w-[1600px] rounded-lg border border-[#E1E6ED] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)] ${themeClass}`}
            style={themeWrap}
          >
            <CanvasProvider value={{ ...canvasCtx, enabled: true }}>
              <SupportPortalPreview accent={themeAccent} content={content} sections={sections} icons={icons} placedText={placedText} blockOrder={blockOrder} rowOrder={rowOrder} removed={removed} rowExtras={rowExtras} cfg={cfgFor} setCfg={patchCfg} />
            </CanvasProvider>
          </div>

          {/* With the panel hidden the rail is the only way back to it — this restores the last one. */}
          {/* The inline half of the icon field. Anchored to the icon that was clicked, writing the
              same store the panel writes. */}
          {iconPick && (
            <IconPopover
              value={icons[iconPick.id]}
              anchor={iconPick.rect}
              onPick={(c) => { setIcons((m) => ({ ...m, [iconPick.id]: c })); setIconPick(null); }}
              onClose={() => setIconPick(null)}
            />
          )}
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
            {/* ⚠️ DERIVED, not a second piece of state. With nothing selected and no rail panel open
                the panel shows the Widgets library — on arrival and again every time you deselect.
                Holding it in state would mean every path that clears a selection had to remember to
                put the library back, and the first one that forgot would leave a blank panel. */}
            {/* ⚠️ NO header bar. It carried a close button and a divider above every panel — a second
                way to dismiss something the rail already dismisses, and a rule across the top that
                separated the panel from the one thing naming what you had selected. Reset is the only
                action that belonged here, and it belongs BESIDE the name of the thing it resets, not
                floating above it. A rail panel still needs its own title, so it keeps one line. */}
            {panelKey && (
              <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-[13px] font-semibold text-[#364658]">{PANEL_COPY[panelKey].title}</p>
                  {/* ⚠️ Light / dark rides on the THEME panel's title, not down beside the palette.
                      Every field in this panel means something different depending on which mode is
                      on, so it is the panel's switch rather than the colour section's — and three
                      fields below the fold it read as "edit the dark colours" instead of "show me
                      this portal in dark". */}
                  {panelKey === 'theme' && (
                    <ThemeModeToggle mode={theme.mode} onChange={(m) => setTheme((t) => ({ ...t, mode: m }))} />
                  )}
                </div>
                {PANEL_COPY[panelKey].body && (
                  <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">{PANEL_COPY[panelKey].body}</p>
                )}
              </div>
            )}

            {/* A rail panel wins while one is open; otherwise the panel is the element editor,
                falling back to the "select something" empty state. */}
            {panelKey === 'add' ? (
              <div className="min-h-0 flex-1"><SupportPortalAddPanel onAdd={addElement} placedTypes={placedTypes} /></div>
            ) : active === 'theme' ? (
              <div className="flex min-h-0 flex-1 flex-col"><PortalThemePanel theme={theme} onChange={(patch) => setTheme((t) => ({ ...t, ...patch }))} /></div>
            ) : active === 'branding' ? (
              <div className="min-h-0 flex-1"><PortalBrandingPanel /></div>
            ) : active === 'settings' ? (
              <div className="min-h-0 flex-1 overflow-y-auto"><AdminSupportPortalSettings compact /></div>
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
                  onReset={() => { replaceStyle(selectedId, {}); setWidgetCfg((m) => { const n = { ...m }; delete n[ownerOf(selectedId)]; return n; }); toast.success('Element reset'); }}
                  applyPreset={applyPreset}
                  icon={icons[ownerOf(selectedId)]}
                  setIcon={(c) => setIcons((p) => ({ ...p, [ownerOf(selectedId)]: c }))}
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
