import type { CSSProperties } from 'react';
/* Support Portal builder — the page model.
 *
 * Three things live here and nothing else does:
 *   1. NODES     — every selectable thing on the canvas, and its parent, so the chip's chevron can
 *                  step up a level. Selection is EXPLICIT rather than DOM-walked: a fixed registry
 *                  is what lets the panel know which editor to show and the toolbar know which
 *                  actions apply.
 *   2. CONTENT   — the editable values the canvas renders. The panel writes here, the preview reads
 *                  here, so an edit is visible immediately and the two cannot drift.
 *   3. STYLE     — per-node visual overrides, applied by the preview.
 */

export type NodeKind =
  | 'section'   // a page band: hero, a card block, the footer
  | 'column'    // a column inside an added section
  | 'card'      // a tile inside a row (a quick-action card)
  | 'text'      // an editable string — gets the rich-text toolbar
  | 'search'    // the hero search field
  | 'nav'       // the header's link row
  | 'rail'      // the left icon rail
  | 'list';     // a data list inside a card block

/** Which content editor the panel renders for a node. */
export type ContentKind =
  | 'hero' | 'quickActions' | 'actionCard' | 'requests' | 'approvals'
  | 'knowledge' | 'assets' | 'cis' | 'text' | 'nav' | 'search' | 'row' | 'placed'
  | 'item' | 'subelement' | 'none';

export interface PortalNodeDef {
  id: string;
  /** Shown in the canvas chip and as the panel title. */
  name: string;
  kind: NodeKind;
  /** Parent node id — drives the chip's ❯ step-up and the panel breadcrumb. */
  parent?: string;
  content: ContentKind;
}

/* ⚠️ Every id here must be rendered by SupportPortalPreview with the same id, or the chip will name
 *    something the panel cannot edit. Keep the two in step. */
export const PORTAL_NODES: PortalNodeDef[] = [
  /* L0 — the page itself. Not drawn on the canvas, but it OWNS the theme, so it needs a node or
     its drawer has nothing to describe. */
  { id: 'page', name: 'Page', kind: 'section', content: 'none' },

  // ── chrome ──
  { id: 'header', name: 'Header', kind: 'section', content: 'none' },
  { id: 'header-logo', name: 'Logo', kind: 'card', parent: 'header', content: 'none' },
  { id: 'header-actions', name: 'Actions', kind: 'card', parent: 'header', content: 'none' },
  { id: 'rail', name: 'Sidebar', kind: 'rail', content: 'none' },

  // ── hero ──
  { id: 'hero', name: 'Hero', kind: 'section', content: 'hero' },
  { id: 'hero-title', name: 'Heading', kind: 'text', parent: 'hero', content: 'text' },
  { id: 'hero-subtitle', name: 'Subtitle', kind: 'text', parent: 'hero', content: 'text' },
  { id: 'hero-search', name: 'Search', kind: 'search', parent: 'hero', content: 'search' },

  /* ── quick actions ──
   * The row IS the section — full width, left edge to right edge — and each tile is a column
   * inside it. That is what lets an admin restyle or re-lay-out the whole band at once instead of
   * three cards one at a time. */
  { id: 'quick', name: 'Quick Actions', kind: 'section', content: 'quickActions' },
  { id: 'quick-incident', name: 'New Incident', kind: 'card', parent: 'quick', content: 'actionCard' },
  { id: 'quick-service', name: 'Request Service', kind: 'card', parent: 'quick', content: 'actionCard' },
  { id: 'quick-knowledge', name: 'Knowledge', kind: 'card', parent: 'quick', content: 'actionCard' },
  /* ⚠️ Declared but NOT in DEFAULT_CONTENT.quick — the node has to exist for selection and for the
     drawer to describe it, while the page stays three cards until an admin adds the fourth. */
  { id: 'quick-ad', name: 'AD Self Service', kind: 'card', parent: 'quick', content: 'actionCard' },

  // ── the work row — one section, three cards ──
  { id: 'work', name: 'Cards Row', kind: 'section', content: 'row' },
  { id: 'requests', name: 'My Requests', kind: 'card', parent: 'work', content: 'requests' },
  { id: 'requests-title', name: 'Title', kind: 'text', parent: 'requests', content: 'text' },
  { id: 'requests-list', name: 'Request List', kind: 'list', parent: 'requests', content: 'requests' },

  { id: 'approvals', name: 'Approvals', kind: 'card', parent: 'work', content: 'approvals' },
  { id: 'approvals-title', name: 'Title', kind: 'text', parent: 'approvals', content: 'text' },

  { id: 'knowledge', name: 'Knowledge', kind: 'card', parent: 'work', content: 'knowledge' },
  { id: 'knowledge-title', name: 'Title', kind: 'text', parent: 'knowledge', content: 'text' },

  /* Records row — Assets and CIs were floating as their own bands. Every card now lives inside a
     parent section, so the whole row can be styled, spaced and re-laid-out as one thing. */
  { id: 'records', name: 'Records Row', kind: 'section', content: 'row' },
  { id: 'assets', name: 'My Assets', kind: 'card', parent: 'records', content: 'assets' },
  { id: 'cis', name: 'My CIs', kind: 'card', parent: 'records', content: 'cis' },
];

/* Sections an admin adds are not in the static registry — their ids carry their own shape:
 *   sec-3        a section
 *   sec-3-c0     column 0 of that section
 * so a node can be described without threading the sections array through the canvas. */
/** Placed elements register here so `nodeById` can describe them without a lookup table. */
const PLACED: Record<string, { name: string; type: string; parent: string }> = {};
export const registerPlaced = (id: string, name: string, type: string, parent: string) => {
  PLACED[id] = { name, type, parent };
};
/** The element sitting inside this container, if one is. A column holds at most one. */
export const placedIn = (parentId: string) => Object.keys(PLACED).find((k) => PLACED[k].parent === parentId) ?? null;

/* Collection items and their sub-elements (spec §4).
 *
 * An item's id carries its whole lineage — `el-3~i2` is item 2 of widget el-3, `el-3~i2~answer` is
 * that item's Answer sub-element — so a node can be described without threading the collection
 * through the canvas, exactly the way added sections already work.
 *
 * ⚠️ Names are REGISTERED rather than derived. §2.1 says an item is titled by its own text ("How do
 * I reset my password?"), which lives in the widget's config; a registry keeps `nodeById` a pure
 * lookup instead of giving it a dependency on the config store. */
const ITEM_NAMES: Record<string, string> = {};
export const registerItemName = (id: string, name: string) => { ITEM_NAMES[id] = name; };

export const itemNodeId = (widgetId: string, itemId: string) => `${widgetId}~i${itemId}`;
export const subNodeId = (itemNode: string, part: string) => `${itemNode}~${part}`;
/** `el-3~i2` → `{ widget: 'el-3', item: '2' }`, or null when the id is not an item. */
export function parseItemId(id: string): { widget: string; item: string; part?: string } | null {
  const m = /^(.+?)~i([^~]+)(?:~(.+))?$/.exec(id);
  return m ? { widget: m[1], item: m[2], part: m[3] } : null;
}

export function nodeById(id: string): PortalNodeDef | undefined {
  const found = PORTAL_NODES.find((n) => n.id === id);
  if (found) return found;
  const placed = PLACED[id];
  if (placed) {
    return { id, name: placed.name, kind: renderSpec(placed.type).kind, parent: placed.parent, content: 'placed' };
  }
  const item = parseItemId(id);
  if (item) {
    return item.part
      ? { id, name: ITEM_NAMES[id] ?? item.part, kind: 'text', parent: itemNodeId(item.widget, item.item), content: 'subelement' }
      : { id, name: ITEM_NAMES[id] ?? 'Item', kind: 'card', parent: item.widget, content: 'item' };
  }
  /* A quick-action card carries its own text nodes, so the words are edited by clicking them.
     ⚠️ Only CONFIGURED copy gets a node. A live-data row — a request, an approval, an article —
     comes from the backend and is not the admin's to rewrite, so it is never selectable. */
  /* A list widget's heading and "View all" link — selectable in their own right so the drawer can
     answer about them rather than about the widget they sit in. */
  /* ⚠️ `label` and `sub` belong here too. A KPI's caption and a card's subtext are the same kind
     of thing as a widget heading — words the admin wrote — and leaving them out of this list is why
     they could be seen on the canvas but never edited there. */
  /* ⚠️ `cl0` / `cv0` are a contact line's LABEL and VALUE. A widget with a fixed set of authored
     rows needs a node per part, and the four generic suffixes could not name six things. They are
     numbered rather than named because the rows are positional — line 0 is line 0 whatever it is
     currently called, which is what lets the label itself be editable. */
  const listTxt = /^(.+)-(title|sub|label|viewall|cl\d+|cv\d+)$/.exec(id);
  if (listTxt && !/^quick-/.test(id)) {
    return {
      id,
      name: (/^cl/.test(listTxt[2]) ? 'Label' : /^cv/.test(listTxt[2]) ? 'Value'
        : ({ title: 'Heading', sub: 'Subtext', label: 'Label', viewall: 'Link' } as Record<string, string>)[listTxt[2]]),
      kind: 'text',
      parent: listTxt[1],
      content: 'text',
    };
  }
  const ico = /^(.+)-icon$/.exec(id);
  if (ico) return { id, name: 'Icon', kind: 'icon', parent: ico[1], content: 'none' };
  const txt = /^(quick-[a-z]+)-(title|sub)$/.exec(id);
  if (txt) {
    return {
      id,
      name: txt[2] === 'title' ? 'Title' : 'Subtext',
      kind: 'text',
      parent: txt[1],
      content: 'text',
    };
  }
  const col = /^(sec-\d+)-c\d+$/.exec(id);
  if (col) return { id, name: 'Column', kind: 'column', parent: col[1], content: 'none' };
  if (/^sec-\d+$/.test(id)) return { id, name: 'Section', kind: 'section', content: 'none' };
  return undefined;
}

/** The catalogue type behind a placed node, for the panel's content editor. */
export const placedType = (id: string) => PLACED[id]?.type;

/** ['hero', 'hero-title'] — root first, for the panel breadcrumb. */
export function nodePath(id: string): PortalNodeDef[] {
  const out: PortalNodeDef[] = [];
  let cur = nodeById(id);
  while (cur) {
    out.unshift(cur);
    cur = cur.parent ? nodeById(cur.parent) : undefined;
  }
  return out;
}

/* ── Content ─────────────────────────────────────────────────────────────── */

/** The statuses a requester's list can be filtered to — ServiceOps' own set. */
export const REQUEST_STATUSES = ['Open', 'In Progress', 'Pending', 'On Hold', 'Resolved', 'Closed', 'Reopened'];
export const REQUEST_SCOPES = ['Raised by me', 'Raised for me', 'All in my department', 'Everything I can view'];

export interface PortalPageContent {
  /** Columns each full-width row is laid out in — the section's own layout. */
  cols: { quick: number; work: number; records: number };
  hero: { title: string; subtitle: string; placeholder: string; showSearch: boolean };
  quick: { id: string; title: string; desc: string }[];
  requests: { title: string; statuses: string[]; scope: string; show: number };
  approvals: { title: string; show: number };
  knowledge: { title: string; show: number };
  assets: { title: string };
  cis: { title: string };
}

/* Page order and membership — what the toolbar's move / delete actions actually rewrite.
 *
 * The hero is not in the list: the quick-actions row overlaps it by a negative margin, so it is the
 * one band whose position is structural rather than a preference. */
export const DEFAULT_BLOCK_ORDER = ['quick', 'work', 'records'];

export const DEFAULT_ROW_ORDER: Record<string, string[]> = {
  quick: ['quick-incident', 'quick-service', 'quick-knowledge'],
  work: ['requests', 'approvals', 'knowledge'],
  records: ['assets', 'cis'],
};

/** Which row a fixed card belongs to, so a move knows which list to reorder. */
export function rowOf(nodeId: string): string | undefined {
  return Object.keys(DEFAULT_ROW_ORDER).find((row) => DEFAULT_ROW_ORDER[row].includes(nodeId));
}

/** Moves `id` one step inside `list`, returning a new array. */
export function moveIn(list: string[], id: string, dir: -1 | 1): string[] {
  const i = list.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export const DEFAULT_CONTENT: PortalPageContent = {
  cols: { quick: 3, work: 3, records: 2 },
  hero: {
    title: 'Welcome to Support Portal',
    subtitle: 'Search our support center knowledge base',
    placeholder: 'How can we help you?',
    showSearch: true,
  },
  quick: [
    { id: 'quick-incident', title: 'New Incident', desc: 'Report an incident' },
    { id: 'quick-service', title: 'Request Service', desc: 'Browse the services offered' },
    { id: 'quick-knowledge', title: 'Knowledge', desc: 'Browse knowledge' },
  ],
  requests: { title: 'My Open Requests', statuses: ['Open', 'In Progress'], scope: 'Raised by me', show: 5 },
  approvals: { title: 'Pending Approvals', show: 2 },
  knowledge: { title: 'Most Read', show: 3 },
  assets: { title: 'My Assets' },
  cis: { title: 'My CIs' },
};

/* ── Style ───────────────────────────────────────────────────────────────── */

/** One side of the spacing matrix. Vertical sides are px, horizontal are % — Duda's defaults. */
/* ⚠️ Every side is OPTIONAL, and undefined means "untouched", not zero. With four required numbers
   the matrix had to seed a box of zeros, so the first slider you moved wrote all four — dragging a
   section's vertical padding silently zeroed its 24px side gutters and threw its content against
   the page edge. A side nobody has set has no opinion, and the element keeps whatever it rested at. */
export interface SpacingBox { top?: number; right?: number; bottom?: number; left?: number }
export const ZERO_BOX: SpacingBox = { top: 0, right: 0, bottom: 0, left: 0 };

/* The five typography ROLES (spec P3). Exposed per role rather than per element, so a widget shows
   only the roles it actually has — a Count tile has a `title` and a `meta` and nothing else. */
export type TypeRole = 'title' | 'subtitle' | 'body' | 'meta' | 'link';

export interface RoleType {
  /** 'inherit' or a theme font key. Defaults to inherit and must STAY there — a per-widget
   *  typeface is an escape hatch for one pull-quote, not a way to build a page in six fonts. */
  font?: string;
  /** % of the role's base size, 80–200. */
  size?: number;
  weight?: 'regular' | 'medium' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  /** 0 = no clamp. */
  maxLines?: number;
}

export interface NodeStyle {
  align?: 'left' | 'center' | 'right' | 'stretch';
  /** Dragged width as a PERCENTAGE of the parent, 5–100. See the note in `sizeOf`. */
  widthPct?: number;
  /** Free placement inside the banner, as a % of the band. Own-only, like height and padding. */
  freeX?: number;
  freeY?: number;
  /** The second axis. `stretch` fills the row's height, which is what makes short cards match tall
      ones without anybody typing a number. */
  alignY?: 'start' | 'center' | 'end' | 'stretch';
  /* ── P1 Container ── */
  bgFill?: 'none' | 'color' | 'image';
  bgImage?: string;
  /** 0–80 %. Exists only for image fills — its job is keeping text readable over artwork. */
  bgOverlay?: number;
  /** Sections only. 'page' MOVES the background behind every section (see §7.21). */
  bgScope?: 'section' | 'page';
  borderMode?: 'none' | 'line' | 'shadow';
  elevation?: 'none' | 'subtle' | 'raised';
  /* ── P2 Size & position ── */
  /** % of its column, 10–100. Distinct from `width`, which is the px a resize drag produced. */
  widthPct?: number;
  spaceTop?: number;
  spaceBottom?: number;
  /** Per-side border strokes, set from the Border gear. */
  borderSides?: { top: number; right: number; bottom: number; left: number };
  shadowOn?: boolean;
  shadowColor?: string;
  shadowType?: string;
  shadowPos?: string;
  /** Size: height follows width while this is on. */
  keepRatio?: boolean;
  /* ── P3 Typography, per role ── */
  type?: Partial<Record<TypeRole, RoleType>>;
  /* ── P4 List & grid ── */
  arrangement?: 'list' | 'grid';
  columns?: number;
  gap?: number;
  density?: 'compact' | 'comfortable';
  dividers?: boolean;
  itemAlign?: 'left' | 'center';
  equalHeight?: boolean;
  /* ── P5 Media ── */
  ratio?: string;
  fit?: 'cover' | 'contain';
  focal?: string;
  shape?: 'rectangle' | 'rounded' | 'circle';
  mediaRadius?: number;
  mediaOverlay?: number;
  captionPos?: 'below' | 'overlay' | 'hidden';
  /* ── P6 Icon ── */
  iconSize?: number;
  iconColor?: string;
  iconShape?: 'none' | 'square' | 'circle';
  iconFill?: string;
  iconPos?: 'left' | 'top' | 'right';
  /* ── P7 Interactive states ── */
  hover?: 'none' | 'lift' | 'tint' | 'outline';
  pressed?: 'none' | 'tint';
  transition?: 'none' | 'fast' | 'normal';
  /* ── P8 Empty, loading, error ── */
  emptyMsg?: string;
  emptyMode?: 'show' | 'hide';
  loading?: 'skeleton' | 'spinner';
  errorMsg?: string;
  /** Outer spacing. Vertical in px, horizontal in %. */
  margin?: SpacingBox;
  /** Inner spacing. Same units. */
  padding?: SpacingBox;
  /** Horizontal sides move together until this is broken — the matrix's link toggle. */
  marginLinked?: boolean;
  paddingLinked?: boolean;
  /** Set by dragging a resize handle, in px. */
  width?: number;
  height?: number;
  /** Share of its row, set by a horizontal drag. Siblings carry one too, so the row always fills. */
  flex?: number;
  /** Per-corner radius; when set it overrides the single `radius`. */
  corners?: { tl: number; tr: number; br: number; bl: number };
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  /** Section background, as a CSS colour. */
  bg?: string;
  radius?: number;
  /** Vertical padding, px. */
  padY?: number;
  // text-only
  color?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** DFLT / PAR / H1…H6 — the theme style this text is bound to. */
  heading?: string;
}

export type PortalStyles = Record<string, NodeStyle>;

export const TEXT_STYLES = ['PAR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

/** Sizes the H-levels map to, so picking a level visibly changes the canvas. */
export const HEADING_SIZE: Record<string, number> = {
  PAR: 15, H1: 34, H2: 28, H3: 22, H4: 18, H5: 16, H6: 13,
};

/* ── Added sections ──────────────────────────────────────────────────────── */

/** A layout is rows of column weights, so the picker tile and the section it creates are drawn
 *  from the SAME data — a tile can never promise a shape the section doesn't produce. */
export interface SectionLayout { id: string; rows: number[][] }

export const SECTION_LAYOUTS: SectionLayout[] = [
  { id: 'l1', rows: [[1]] },
  { id: 'l2', rows: [[1, 1]] },
  { id: 'l3', rows: [[1], [1]] },
  { id: 'l4', rows: [[1, 1, 1]] },
  { id: 'l5', rows: [[1], [1], [1]] },
  { id: 'l6', rows: [[1, 2]] },
  { id: 'l7', rows: [[2, 1]] },
  { id: 'l8', rows: [[1, 1], [1]] },
  { id: 'l9', rows: [[1], [1, 1]] },
  { id: 'l10', rows: [[1, 1], [1, 1]] },
];

/** An element the admin dropped on the canvas. Blank by design — content and style are theirs. */
export interface PlacedElement {
  /** Instance id, e.g. `el-3`. */
  id: string;
  /** Catalogue id from PORTAL_ELEMENTS, e.g. `b-text`. */
  type: string;
  name: string;
}

export interface CustomSection {
  id: string;
  /** Rows of column weights. Column ids are derived: `${id}-c${index}` across the whole section. */
  rows: number[][];
  /** What sits in each column, keyed by column id. A column may still be empty. */
  items: Record<string, PlacedElement>;
}

/* Catalogue type → how the canvas treats it.
 *
 * `bare` is the important flag: a Text or a Title drops straight onto the section's own surface
 * with only the section's padding around it. Wrapping every element in a white card would give the
 * page a boundary the designer never asked for. Only things that genuinely ARE a card say so. */
export interface ElementRenderSpec { kind: NodeKind; bare: boolean }

const CARD_TYPES = new Set([
  'c-services', 'c-categories', 'c-requests', 'c-approvals', 'c-assets', 'c-tasks',
  'c-announcements', 'c-knowledge', 'c-faq', 'c-contact', 'c-feedback',
  'b-card', 'b-table', 'b-accordion', 'b-text-image',
  /* ⚠️ Listed, or removing it from SELF_SURFACED changes nothing: renderSpec falls through to a
     bare default, so the KPI stayed flat by a different route than the one that was fixed. */
  'x-kpi',
]);

/* ⚠️ These two are NOT in CARD_TYPES, deliberately. `Surface` wraps a card-shaped element in a
   white box with a border and 16px of padding — and both of these already render exactly that
   themselves, from their own config, so they came out as a card inside a card: a hard white
   boundary and a ring of padding nobody chose, with the outer one ignoring every fill and radius
   the panel offered. An element that paints its own surface must be bare. */
/* Every element that renders AS an action card — the page's four fixed destinations plus the
 * palette's own configurable one.
 *
 * ⚠️ AD Self Service was missing from the renderer while its SPEC already promised "the identical
 * card UI as the other three". The other three are built-in page blocks, so they are drawn by the
 * preview and looked right; AD Self Service is the only one you can place, so it fell through to
 * the generic icon-and-title placeholder — no white card, and a Style section writing keys that
 * branch never read. Naming the set once is what stops the two halves drifting again. */
export const ACTION_TYPES = new Set(['x-action-card', 'act-incident', 'act-service', 'act-ad', 'act-knowledge']);

/* ⚠️ An action card paints its OWN surface from config, so wrapping it in Surface gives a card
   inside a card. A KPI does not — its configured body is an icon beside a number, with no box of
   any kind — so it sits in CARD_TYPES instead. Membership is about whether the element draws a
   surface, not about which group it sits in. */
const SELF_SURFACED = ACTION_TYPES;

const TEXT_TYPES = new Set(['b-text', 'b-large-title', 'b-small-title']);

export function renderSpec(type: string): ElementRenderSpec {
  if (TEXT_TYPES.has(type)) return { kind: 'text', bare: true };
  if (SELF_SURFACED.has(type)) return { kind: 'card', bare: true };
  if (CARD_TYPES.has(type)) return { kind: 'card', bare: false };
  if (type === 'c-search') return { kind: 'search', bare: true };
  if (type === 'b-list') return { kind: 'list', bare: true };
  return { kind: 'card', bare: true };
}

/** Column id for the nth column of a section, counted across all its rows. */
/* True when the element draws its OWN white card, so its padding and its dragged height belong to
 * THAT card rather than to the wrapper around it.
 *
 * ⚠️ Padding on the wrapper is grey space AROUND a card, not breathing room INSIDE it — which is
 * both why the padding sliders looked like they were insetting the whole widget and why dragging a
 * section taller clipped the card: the height went on the wrapper, the card kept its own size, and
 * the overflow box cut it off. The painted box has to own both values. */
export function paintsOwnSurface(id: string): boolean {
  /* ⚠️ The built-in quick-action cards too. Their Sel is a bare wrapper and the white card is a div
     INSIDE it, so padding applied to the wrapper landed between the selection outline and the card
     — visible as a growing gap around a card that never got roomier, which is not what padding
     means anywhere else on this page. A placed Action Card was already covered; these three were
     the same shape of thing reached by a different code path. */
  if (/^quick-/.test(id)) return true;
  const t = placedType(id);
  if (!t) return false;
  /* ⚠️ SELF_SURFACED types count too. They are marked `bare` because they must not be wrapped in
     the generic Surface — they draw their OWN card — but "bare" was being read as "has no box", so
     an Action Card's padding went onto the wrapper and appeared outside the card it was supposed to
     be inside. Bare means nobody wraps it; it does not mean there is nothing to pad. */
  return ACTION_TYPES.has(t) || !renderSpec(t).bare;
}

export const colId = (sectionId: string, index: number) => `${sectionId}-c${index}`;

/** Inserts a column beside `colIndex`, keeping every column in that row equal width. */
export function addColumn(section: CustomSection, colIndex: number, side: 'left' | 'right'): CustomSection {
  let seen = 0;
  const rows = section.rows.map((row) => {
    const start = seen;
    seen += row.length;
    if (colIndex < start || colIndex >= seen) return row;
    const at = colIndex - start + (side === 'right' ? 1 : 0);
    const next = [...row];
    next.splice(at, 0, 1);
    // Equal width is the point of the affordance — reset the weights rather than inheriting them.
    return next.map(() => 1);
  });
  /* ⚠️ The ITEMS have to move with the columns. Column ids are positional (`-c3` is the fourth
     column counted across every row), so inserting a column silently renames every column after it
     — and this function used to return the new `rows` while leaving `items` keyed by the OLD
     numbering. Everything to the right of the insertion therefore stayed under a key that now
     belongs to its neighbour, and Duplicate wrote the clone straight over the element beside it:
     one element gained, one destroyed, no error, no way back. Positional keys are only safe if
     every insertion re-keys, which is why this belongs here rather than in each caller. */
  const at = colIndex + (side === 'right' ? 1 : 0);
  const items: Record<string, PlacedElement> = {};
  Object.entries(section.items).forEach(([col, el]) => {
    const n = Number(/-c([0-9]+)$/.exec(col)?.[1] ?? -1);
    items[n >= at ? colId(section.id, n + 1) : col] = el;
  });
  return { ...section, rows, items };
}

/* The container styling a widget writes through its own CONFIG — fill, background image, border and
 * radius (spec §7.20/§7.21).
 *
 * ⚠️ It lives here, not in the preview, because two different renderers paint action cards — the
 * built-in quick cards and a dropped Action Card element — and they were painting from two different
 * places. The panel writes these keys into widget config; the built-in card was reading `styleOf`,
 * which is the STYLE store, so Fill, Background colour and Image were saved and never shown. One
 * function, both call sites, no way for them to disagree again. */
export function fillCss(c: Record<string, unknown>): CSSProperties {
  const fill = String(c.fill ?? 'none');
  const width = Number(c.borderWidth ?? 0);
  const css: CSSProperties = {
    /* ⚠️ backgroundColor, NOT the `background` shorthand. The shorthand resets backgroundImage,
       Size and Position, so mixing the two in one object makes React warn and makes the image fill
       fight the colour fill depending on which rendered last. Long-hand, the four are independent. */
    backgroundColor: fill === 'color' ? String(c.bg ?? '#FFFFFF') : undefined,
    backgroundImage: fill === 'image' && c.bgImage ? `url(${String(c.bgImage)})` : undefined,
    backgroundSize: fill === 'image' ? 'cover' : undefined,
    backgroundPosition: fill === 'image' ? 'center' : undefined,
    /* ⚠️ Border and radius only once there IS a fill — the panel gates its own fields the same way,
       and a 1px rule around a transparent band is a box drawn round nothing. */
    borderWidth: fill !== 'none' && width ? width : undefined,
    borderStyle: fill !== 'none' && width ? 'solid' : undefined,
    borderColor: fill !== 'none' && width ? String(c.borderColor ?? '#E5E7EB') : undefined,
    borderRadius: fill !== 'none' ? Number(c.radius ?? 0) || undefined : undefined,
  };
  /* ⚠️ UNSET keys are dropped, not returned as undefined. Spread over a base object, an explicit
     undefined DELETES whatever the base set — so a card whose fill is 'none' had its default white
     background and border stripped by the very function meant to leave them alone. The tell is a
     lone `border-image: none` left in the inline style where the border used to be. */
  return Object.fromEntries(Object.entries(css).filter(([, v]) => v !== undefined));
}
