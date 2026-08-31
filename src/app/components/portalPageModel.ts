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
  /** Text nodes only: its value is HTML, so inline editing commits markup and Enter breaks a line. */
  rich?: boolean;
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
  /* ⚠️ DECLARED even though the page does not ship with one. A card that is not a node still
     RENDERS — `Sel` falls back to a plain div — but it cannot be selected, cannot be named in the
     breadcrumb and opens a blank panel: exactly what "I added a card and nothing happened" looks
     like from the outside, with the card sitting there in plain sight. Same reason `quick-ad` is
     declared here and only sometimes on the page. */
  { id: 'quick-link', name: 'External link', kind: 'card', parent: 'quick', content: 'actionCard' },

  /* ── the two service rows ──
   * ⚠️ Fixed page blocks, NOT palette elements. What they list is chosen by the REQUESTER — their
   * pinned services, and what the organisation asks for most — so an admin adding or removing the
   * section would be arranging a list they do not populate. That is why neither appears in the
   * widget library and why neither can be deleted: the section is the product's, its contents are
   * the requester's, and only the tile's shape is the admin's. */
  { id: 'favourites', name: 'Favourite Services', kind: 'card', content: 'row' },
  { id: 'services', name: 'Most Used Services', kind: 'card', content: 'row' },

  // ── the work row — one section, three cards ──
  { id: 'work', name: 'Cards Row', kind: 'section', content: 'row' },
  { id: 'requests', name: 'My Requests', kind: 'card', parent: 'work', content: 'requests' },
  /* ⚠️ No '-title' nodes for these three — see hasFixedTitle. A node nothing renders is a
     breadcrumb waiting to name a layer that is not there. */
  /* ⚠️ There is no 'requests-list' node. The rows inside My Open Requests were their own selectable
     layer with their own panel — Statuses, Scope, Show — which was a second place to configure the
     same widget, reachable only by clicking the rows rather than the card. It also contradicted the
     widget above it: the card's own panel is gone now because the backend decides what this list
     shows, so a nested layer still offering to filter it was offering something that no longer
     existed anywhere else. Clicking the rows selects the CARD, which is the thing you can act on. */

  { id: 'approvals', name: 'Approvals', kind: 'card', parent: 'work', content: 'approvals' },

  { id: 'knowledge', name: 'Knowledge', kind: 'card', parent: 'work', content: 'knowledge' },

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
/* Boxes register their place in the tree so `nodeById` stays a pure lookup.
 *
 * ⚠️ This replaces a REGEX. The old ids carried their own shape (`sec-3-c0` was column 0 of
 * section 3), which is what let the canvas describe a node without being handed the sections array.
 * A tree has no such shape — depth and parentage are not recoverable from `sec-3-b7` — so the
 * renderer registers each box as it draws it. Same pattern, same file, no new concept.
 *
 * ⚠️ `parentDir` is the PARENT's direction, because that is what names the box: a child of a row is
 * a Column, a child of a column is a Row. Derived, never stored, so flipping a parent renames its
 * children and the words can never go stale. */
const BOXES: Record<string, { parent?: string; parentDir: BoxDir; depth: number }> = {};
export const registerBox = (id: string, parentDir: BoxDir, depth: number, parent?: string) => {
  BOXES[id] = { parent, parentDir, depth };
};
export const boxInfo = (id: string) => BOXES[id];

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
  /* An image's caption. Its own node, so clicking the words under a picture edits THE WORDS —
     before this the caption was reachable only from the image's panel, three fields down. */
  const cap = /^(.+)-caption$/.exec(id);
  if (cap) return { id, name: 'Caption', kind: 'text', rich: true, parent: cap[1], content: 'text' };
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
  /* ⚠️ A box is named by its PARENT’s direction — a child of a row is a Column, a child of a
     column is a Row — so a section flipped from row to column renames every child for free.
     Storing the name would leave "Column" written on something that is now stacked. */
  const box = BOXES[id];
  if (box) return { id, name: box.parentDir === 'row' ? 'Column' : 'Row', kind: 'column', parent: box.parent, content: 'none' };
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
/* ⚠️ Both service rows sit directly under Quick Actions. Everything a requester can START is then
   in the top third — the four action cards, their pinned services, the ones everyone asks for —
   and the lists of things already in flight follow underneath. */
export const DEFAULT_BLOCK_ORDER = ['quick', 'favourites', 'services', 'work', 'records'];

export const DEFAULT_ROW_ORDER: Record<string, string[]> = {
  quick: ['quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge'],
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
  cols: { quick: 4, work: 3, records: 2 },
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
    /* ⚠️ A FOURTH card, shipped by default. `quick-ad` was already declared as a node and already
       had a spec — it was simply absent from the content, so the one action a requester most often
       wants was the one they had to add by hand. It belongs to Quick Actions like the other three,
       not as a loose element dropped elsewhere. */
    { id: 'quick-ad', title: 'AD Self Service', desc: 'Reset your domain password' },
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
  /** A text run's highlight — the background behind the words, not the block's fill. */
  textBg?: string;
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
  /* The font family this text is set in — a `PORTAL_FONTS` id.
   *
   * ⚠️ This USED to store a role ('heading' | 'body') so a bound text followed the theme. Changed on
   * request: the toolbar is a plain font picker now and the theme section is being reworked
   * separately. The consequence is worth knowing — a text given a family here KEEPS it when the
   * theme changes, which is the trade a direct picker always makes. Unset still follows the theme,
   * so an untouched block behaves exactly as before. */
  font?: string;
}

/* The portal's font library — six families, and the only ones anything here offers.
 *
 * ⚠️ Deliberately SHORT. A long list is how a page ends up in a face nobody chose on purpose, and
 * every family costs a webfont request on a page requesters load cold. Six covers the range a
 * support portal actually needs: three neutral sans, one geometric, one serif, one technical.
 * ⚠️ It lives HERE, not in the theme panel, because two places now read it — the Theme panel's own
 * face pickers and the canvas text toolbar. Two copies of one list is two places for a family to be
 * added and only half-supported. `PortalThemePanel` re-exports it as `FONT_FACES` so its existing
 * call sites are untouched.
 * ⚠️ Every family here MUST be loaded in `src/styles/fonts.css`. Only Inter was, so the other five
 * silently fell back to the generic sans and the picker offered six options that rendered
 * identically — a control that looks broken rather than one that does nothing. */
export const PORTAL_FONTS = [
  { id: 'inter', name: 'Inter', css: 'Inter, sans-serif', note: 'Neutral and highly legible.' },
  { id: 'poppins', name: 'Poppins', css: 'Poppins, sans-serif', note: 'Geometric and friendly.' },
  { id: 'source', name: 'Source Sans 3', css: '"Source Sans 3", sans-serif', note: 'Humanist. Good at small sizes.' },
  { id: 'merri', name: 'Merriweather', css: 'Merriweather, serif', note: 'Serif. Editorial and calm.' },
  { id: 'roboto', name: 'Roboto', css: 'Roboto, sans-serif', note: 'Tight and compact.' },
  { id: 'plex', name: 'IBM Plex Sans', css: '"IBM Plex Sans", sans-serif', note: 'Technical and even.' },
];

/** The CSS family for a stored font id, or undefined when it names nothing we ship. */
export const fontCss = (id?: string) => PORTAL_FONTS.find((f) => f.id === id)?.css;

/* Widgets whose HEADING belongs to the product, not to the page.
 *
 * Their content comes from the backend and their panels no longer offer a Title, so a heading you
 * could still retype on the canvas was the last way to make a card lie about what it lists — "My
 * Open Requests" renamed to "Closed tickets" while it goes on listing open ones.
 *
 * ⚠️ Listed EXPLICITLY rather than inferred from the group. Which widgets are the product's is a
 * product decision, and the two things that look like rules here both have exceptions: FAQ and
 * Feedback sit in the same groups but their words are genuinely authored, and the action cards'
 * SUBTITLES stay editable while their titles do not.
 * ⚠️ Both spellings are covered — the fixed page nodes AND the catalogue types — because the same
 * widget dropped from the library gets an `el-N` id and has to behave identically. */
/* ⚠️ `quick-link` is deliberately ABSENT. Every other card in this row is a product destination
   whose name the product owns; that one exists to say where an admin's link goes, so its title is
   theirs to write — which is the whole difference between it and the four beside it. */
const FIXED_TITLE_NODES = new Set([
  'requests', 'approvals', 'knowledge', 'assets', 'cis', 'news', 'services', 'favourites', 'contact',
  'quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge',
]);
const FIXED_TITLE_TYPES = new Set([
  'c-requests', 'c-approvals', 'c-assets', 'c-cis', 'c-announcements', 'c-knowledge',
  'c-services', 'c-favourites', 'c-contact',
  'act-incident', 'act-service', 'act-ad', 'act-knowledge', 'x-action-card',
]);

/** True when this widget's heading is fixed — render the words, do not wrap them in a Sel. */
export function hasFixedTitle(nodeId?: string): boolean {
  if (!nodeId) return false;
  if (FIXED_TITLE_NODES.has(nodeId)) return true;
  const t = placedType(nodeId);
  return !!t && FIXED_TITLE_TYPES.has(t);
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

/* ── The section tree ─────────────────────────────────────────────────────
 *
 * ONE node type does all of it: a BOX. A section is a box, a column is a box, a row is a box, and
 * the cell a widget sits in is a box. They are not four things — they are one thing in four
 * positions.
 *
 * ⚠️ That is the whole design, and it is what the note's "all level feasibility in row, col. split"
 * asks for. The moment there are three kinds of container, "split" has to mean three different
 * things, the panel has to choose between three editors, and one feature becomes three that drift
 * apart. One type, one split, one panel. See SECTION-TREE-SPEC.md.
 */

/** How a box lays its CHILDREN out. Literally `flex-direction`, and literally the note's
 *  "section's behaviour — how user wants to treat sec? row / column".
 *
 *  `row`    children run left → right, so each child reads as a COLUMN and Split adds a column.
 *  `column` children run top → bottom, so each child reads as a ROW and Split adds a row. */
export type BoxDir = 'row' | 'column';

export interface Box {
  /** Stable, minted ONCE — never positional. See the note on `mintBox`. */
  id: string;
  dir: BoxDir;
  /** Share of the parent's main axis. Siblings are reset to equal on split. */
  weight: number;
  /** A BRANCH. Mutually exclusive with `el` — a box is a branch or a leaf, never both. */
  children?: Box[];
  /** A LEAF holding one widget. An empty leaf has neither. */
  el?: PlacedElement;
}

export interface CustomSection {
  id: string;
  /** The section IS the root box of its own tree. */
  root: Box;
  /** Monotonic counter behind `mintBox`. Only ever increases, including across deletes. */
  next: number;
}

/* ⚠️ Ids are MINTED, never derived from position.
 *
 * The old model numbered columns across the whole section (`sec-3-c0`), so inserting one renamed
 * every column after it and `addColumn` had to re-key `items` to compensate — the comment on that
 * function records Duplicate once writing a clone straight over its neighbour because of exactly
 * this: one element gained, one destroyed, no error, no way back.
 *
 * In a TREE that failure gets much worse. `widgetCfg`, `styles`, `placedText` and `icons` are all
 * keyed by node id, so a split near the top would silently renumber a whole subtree and every
 * stored value would land on the wrong box — a page that quietly rearranges its own styling, which
 * is the hardest class of bug there is to report. Position lives in the tree; identity does not. */
export function mintBox(section: { id: string; next: number }, dir: BoxDir, weight = 1): Box {
  return { id: `${section.id}-b${section.next++}`, dir, weight };
}

/** Depth cap, counted BELOW the section: Section > Column > Row > Column > Row. */
export const MAX_BOX_DEPTH = 4;
/** Columns in one row. Rows stacked in a column are deliberately uncapped — a tall column costs
 *  nothing, a wide row costs readability, so the cap belongs on one axis only. */
export const MAX_COLUMNS = 4;

export const isBranch = (b: Box) => Array.isArray(b.children) && b.children.length > 0;

/** Every box in the tree, root first. */
export function boxList(root: Box): Box[] {
  const out: Box[] = [];
  const walk = (b: Box) => { out.push(b); b.children?.forEach(walk); };
  walk(root);
  return out;
}

/** Root → … → the box with this id. Empty when it is not in this tree. */
export function boxPath(root: Box, id: string): Box[] {
  const walk = (b: Box, trail: Box[]): Box[] | null => {
    const next = [...trail, b];
    if (b.id === id) return next;
    for (const c of b.children ?? []) { const hit = walk(c, next); if (hit) return hit; }
    return null;
  };
  return walk(root, []) ?? [];
}

export const findBox = (root: Box, id: string): Box | undefined => boxList(root).find((b) => b.id === id);
export const parentOfBox = (root: Box, id: string): Box | undefined => boxPath(root, id).at(-2);
/** 0 for the section root. */
export const boxDepth = (root: Box, id: string): number => Math.max(0, boxPath(root, id).length - 1);

/** Rebuilds the tree with `fn` applied to the box with this id. Structural sharing is not the point
 *  — a new object every time is what makes React re-render the branch that changed. */
export function mapBox(root: Box, id: string, fn: (b: Box) => Box): Box {
  const walk = (b: Box): Box => (b.id === id ? fn(b) : (b.children ? { ...b, children: b.children.map(walk) } : b));
  return walk(root);
}

/** Equal shares. Split resets rather than inheriting, the way the old `addColumn` did — an even row
 *  is the whole point of the affordance, so carrying the old weights forward would be wrong. */
const evenly = (boxes: Box[]) => boxes.map((b) => ({ ...b, weight: 1 }));

/** Why Split is unavailable on this box, or null when it is available.
 *
 *  ⚠️ Returns a REASON, not a boolean. At a limit the control stays visible and disabled with the
 *  reason on it — never missing, never a silent no-op — which is how every other cap in this
 *  product behaves (the OS-upgrade single-select, a collection's `max`). */
export function splitBlockedBecause(root: Box, id: string): string | null {
  const box = findBox(root, id);
  if (!box) return null;
  const depth = boxDepth(root, id);
  /* A LEAF split adds a level, so it needs room below it; a BRANCH split adds a sibling at the
     level its children already occupy, so it needs room for them. Same check either way. */
  if (depth + 1 > MAX_BOX_DEPTH) return `Nested as deep as a section goes (${MAX_BOX_DEPTH} levels)`;
  if (box.dir === 'row' && isBranch(box) && box.children!.length >= MAX_COLUMNS) {
    return `A row holds ${MAX_COLUMNS} columns at most`;
  }
  return null;
}

/** Split, the ONE structural operation, identical at every level.
 *
 *  On a LEAF the box becomes a branch of two: whatever was in it moves into the first child, the
 *  second is empty. ⚠️ The element is never destroyed — Word, Figma and Duda all preserve it, and
 *  nobody expects splitting a cell to throw its contents away.
 *
 *  On a BRANCH one more empty child is appended.
 *
 *  The DIRECTION is always the box's own `dir`. Nothing else decides it — not where you clicked,
 *  not what is inside, not the depth. */
export function splitBox(section: CustomSection, id: string): CustomSection {
  if (splitBlockedBecause(section.root, id)) return section;
  const next = { ...section };
  const root = mapBox(section.root, id, (b) => {
    if (isBranch(b)) return { ...b, children: evenly([...b.children!, mintBox(next, flip(b.dir))]) };
    /* The leaf's own content moves down a level. Its `dir` stays on the box being split — that is
       what the split is along — and the two new children take the opposite direction, so the next
       split one level down goes the other way without anyone choosing it. */
    const kept = { ...mintBox(next, flip(b.dir)), el: b.el };
    return { id: b.id, dir: b.dir, weight: b.weight, children: [kept, mintBox(next, flip(b.dir))] };
  });
  return { ...next, root };
}

export const flip = (d: BoxDir): BoxDir => (d === 'row' ? 'column' : 'row');

/** Flip a box's behaviour. ⚠️ Non-destructive by construction: the children and their order are
 *  untouched and only the axis changes, which is what makes the note's "sub section as column, but
 *  I can rearrange to top & bottom" one click rather than a rebuild. */
export const setBoxDir = (section: CustomSection, id: string, dir: BoxDir): CustomSection =>
  ({ ...section, root: mapBox(section.root, id, (b) => ({ ...b, dir })) });

/** Insert an empty sibling beside `id`. This is what the axis-aware `+` adders call — `before` is
 *  left on a row and above on a column, which is the same question asked once. */
export function addSibling(section: CustomSection, id: string, before: boolean): CustomSection {
  const parent = parentOfBox(section.root, id);
  if (!parent) return section;
  if (parent.dir === 'row' && (parent.children?.length ?? 0) >= MAX_COLUMNS) return section;
  const next = { ...section };
  const fresh = mintBox(next, flip(parent.dir));
  const root = mapBox(section.root, parent.id, (b) => {
    const at = b.children!.findIndex((c) => c.id === id) + (before ? 0 : 1);
    const kids = [...b.children!];
    kids.splice(at, 0, fresh);
    return { ...b, children: evenly(kids) };
  });
  return { ...next, root };
}

/** Why a neighbour cannot be added on this axis, or null when it can.
 *
 *  ⚠️ A REASON, not a boolean — at a limit the adder stays visible and disabled with the reason on
 *  it, the way Split and every other cap in this product behave. */
export function neighbourBlockedBecause(root: Box, id: string, dir: BoxDir): string | null {
  const parent = parentOfBox(root, id);
  if (parent && parent.dir === dir) {
    if (dir === 'row' && (parent.children?.length ?? 0) >= MAX_COLUMNS) {
      return `A row holds ${MAX_COLUMNS} columns at most`;
    }
    return null;
  }
  /* Wrapping puts a level below this box, so it needs the room a split would need. */
  if (boxDepth(root, id) + 1 > MAX_BOX_DEPTH) return `Nested as deep as a section goes (${MAX_BOX_DEPTH} levels)`;
  return null;
}

/** Add an empty neighbour on a given AXIS, whatever axis the parent happens to lay out along.
 *
 *  This is what lets ONE control mean the same thing at every level: left and right always add a
 *  column, top and bottom always add a row, and neither has to ask what shape it is standing in.
 *
 *  ⚠️ Two cases, and the second is why this is not just `addSibling`. When the parent already runs
 *  along `dir`, the new box is a plain sibling. When it does not — or there is no parent at all,
 *  which is every unsplit section — the box is WRAPPED in a new box of that direction and the empty
 *  neighbour joins it there. Without the wrap, "add a row below" on a section laid out as columns
 *  had nowhere to go and did nothing.
 *
 *  ⚠️ The OUTER box keeps the original id. Anything selected, styled or configured against it still
 *  resolves — the same rule `removeBox`'s collapse follows, and the reason a wrap is not visible as
 *  a loss of everything the admin had set on that box. */
export function addNeighbour(section: CustomSection, id: string, dir: BoxDir, before: boolean): CustomSection {
  if (neighbourBlockedBecause(section.root, id, dir)) return section;
  const parent = parentOfBox(section.root, id);
  if (parent && parent.dir === dir) return addSibling(section, id, before);

  const next = { ...section };
  const root = mapBox(section.root, id, (b) => {
    /* The box's own content moves down a level, keeping its direction and children so nothing
       inside it is rearranged; only a level is added above it. */
    const kept: Box = { ...mintBox(next, b.dir), el: b.el, children: b.children };
    const fresh = mintBox(next, flip(dir));
    return {
      id: b.id,
      dir,
      weight: b.weight,
      children: evenly(before ? [fresh, kept] : [kept, fresh]),
    };
  });
  return { ...next, root };
}

/** Remove a box. ⚠️ A branch left with ONE child collapses into it, so deleting the second of two
 *  columns returns the section to the single column it started as rather than leaving a branch that
 *  looks and behaves exactly like a leaf but answers differently to every structural question. */
export function removeBox(section: CustomSection, id: string): CustomSection {
  const parent = parentOfBox(section.root, id);
  if (!parent) return section;
  const root = mapBox(section.root, parent.id, (b) => {
    const kids = evenly((b.children ?? []).filter((c) => c.id !== id));
    if (kids.length === 0) return { id: b.id, dir: b.dir, weight: b.weight };
    if (kids.length === 1) {
      /* Collapse: the survivor's CONTENT moves up, but the surviving box keeps the PARENT's id so
         anything selected or styled against it still resolves. */
      const only = kids[0];
      return { id: b.id, dir: only.dir, weight: b.weight, children: only.children, el: only.el };
    }
    return { ...b, children: kids };
  });
  return { ...section, root };
}

/** Put an element into a leaf. Returns the section unchanged when the target is a branch — a branch
 *  has no content of its own, only children. */
export const setBoxEl = (section: CustomSection, id: string, el: PlacedElement | undefined): CustomSection =>
  ({ ...section, root: mapBox(section.root, id, (b) => (isBranch(b) ? b : { ...b, el })) });

/** Every empty leaf, in reading order — what "the first free column" means to click-to-add. */
export const freeLeaves = (root: Box): Box[] => boxList(root).filter((b) => !isBranch(b) && !b.el);
/** Every leaf that holds something. */
export const filledLeaves = (root: Box): Box[] => boxList(root).filter((b) => !isBranch(b) && !!b.el);

/** `rows: number[][]` → a tree, with no visual change to any existing layout.
 *
 *  ⚠️ A SINGLE-row layout flattens: the root becomes the row itself rather than a column holding one
 *  row. Otherwise the commonest shape on the page — two columns — would arrive a level deeper than
 *  it needs, and its breadcrumb would read `Section > Row > Column > Text` for the simplest thing
 *  anyone builds. */
export function sectionFromRows(id: string, rows: number[][], startAt = 0): CustomSection {
  /* ⚠️ `startAt` is not decoration. Rebuilding a section (a Layout preset) must not restart the
     counter, or the new cells take ids the old cells already own and every id-keyed store —
     config, style, text, icons — silently applies the old cell's settings to the new one. */
  const section: CustomSection = { id, root: { id, dir: 'row', weight: 1 }, next: startAt };
  const cells = (weights: number[], dir: BoxDir) => weights.map((w) => ({ ...mintBox(section, flip(dir)), weight: w }));

  if (rows.length <= 1) {
    const row = rows[0] ?? [1];
    /* One cell is a plain leaf — a root with a single child is a branch that behaves like a leaf. */
    section.root = row.length <= 1
      ? { id, dir: 'row', weight: 1 }
      : { id, dir: 'row', weight: 1, children: cells(row, 'row') };
    return section;
  }

  section.root = {
    id,
    dir: 'column',
    weight: 1,
    children: rows.map((row) => (row.length <= 1
      ? { ...mintBox(section, 'row'), weight: row[0] ?? 1 }
      : { ...mintBox(section, 'row'), children: cells(row, 'row') })),
  };
  return section;
}



/** `sec-3-b7` and `sec-3` both belong to section `sec-3`. ⚠️ One function, because the ROOT box
 *  carries the section's own id with no suffix — every call site that split the id itself got the
 *  root wrong. */
export const sectionIdOfBox = (boxId: string) => boxId.replace(/-b[0-9]+$/, '');

/** Register a whole tree, so `nodeById` can name every box in it.
 *
 * ⚠️ The ROOT is deliberately NOT registered. Its id is the section id, and `nodeById` answers
 *  that with 'Section' — registering it too would shadow that and label the section a Column. */
export function registerTree(section: CustomSection) {
  const walk = (b: Box, parentDir: BoxDir, depth: number, parent?: string) => {
    if (parent) registerBox(b.id, parentDir, depth, parent);
    b.children?.forEach((c) => walk(c, b.dir, depth + 1, b.id));
  };
  walk(section.root, 'row', 0);
}

/* ── Reading a tree the way the old flat model was read ───────────────────
 *
 * The Layout PRESETS ("Columns", "Grid", "Three across", "Stacked") are whole-section restructures,
 * and they have always been expressed as `rows: number[][]`. They stay that way: a preset is a
 * top-level shape, so it is described at the top level and rebuilt from there.
 *
 * ⚠️ Applying a preset therefore FLATTENS any nesting below the first two levels — which is what
 * "a preset is not a picture of a layout, it IS the layout" has always meant. It rewrites the shape
 * and reflows what is inside; it does not merge with what was there. */
export function sectionRows(section: CustomSection): number[][] {
  const root = section.root;
  if (!isBranch(root)) return [[1]];
  if (root.dir === 'row') return [root.children!.map((c) => c.weight)];
  return root.children!.map((c) => (isBranch(c) && c.dir === 'row' ? c.children!.map((g) => g.weight) : [c.weight]));
}

/** Every placed element in the section, in reading order. */
export const sectionElements = (section: CustomSection): PlacedElement[] =>
  filledLeaves(section.root).map((b) => b.el!);

/** The leaf holding this element, if the section has it. */
export const boxOfElement = (root: Box, elementId: string): Box | undefined =>
  boxList(root).find((b) => b.el?.id === elementId);

/** Rebuild a section to `rows`, pouring `els` back into the new leaves in order.
 *
 * ⚠️ Ids are MINTED FRESH here, and that is correct rather than careless: a preset is a new shape,
 * so its cells are new cells. Keeping the old ids would carry a two-column section's per-column
 * padding onto the three cells of a "Three across" that has no third column to inherit from. The
 * ELEMENTS keep their ids — their config and styling are theirs, and they are only being moved. */
export function sectionRebuild(section: CustomSection, rows: number[][], els: PlacedElement[]): CustomSection {
  /* ⚠️ Minted ids CONTINUE from where this section had got to — they do not restart. Restarting
     would hand the new cells ids the old ones already own, and every store keyed by node id
     (config, style, text, icons) would then apply the old cell’s settings to the new one. */
  const next = sectionFromRows(section.id, rows, section.next);
  const slots = freeLeaves(next.root);
  els.slice(0, slots.length).forEach((el, i) => { slots[i].el = el; });
  return next;
}

/* Catalogue type → how the canvas treats it.
 *
 * `bare` is the important flag: a Text or a Title drops straight onto the section's own surface
 * with only the section's padding around it. Wrapping every element in a white card would give the
 * page a boundary the designer never asked for. Only things that genuinely ARE a card say so. */
export interface ElementRenderSpec { kind: NodeKind; bare: boolean }

const CARD_TYPES = new Set([
  /* ⚠️ 'c-favourites' belongs here beside 'c-services'. The two render the same grid and sit on
     the same page: without it Favourite Services drew its tiles straight onto the page background
     while Most Used Services sat in a white card, so two identical grids read as two different
     kinds of thing for no reason anyone could name. */
  /* ⚠️ 'c-records' belongs here for the same reason 'c-favourites' does, one line up. It is a live
     card — it renders the header, the count, the View-all and the rows that My Open Requests does —
     so drawing it straight onto the page background put two cards of the same kind on one page
     reading as two different kinds of thing: one in a white bordered box, one floating on the
     canvas with no boundary at all. */
  'c-records',
  'c-services', 'c-favourites', 'c-categories', 'c-requests', 'c-approvals', 'c-assets', 'c-tasks',
  'c-announcements', 'c-knowledge', 'c-faq', 'c-contact',
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

/* Rows that hold a FIXED cast and take nothing else.
 *
 * ⚠️ Quick Actions is the product's four destinations, laid out as one row that reads as a set. An
 * arbitrary Text or Image dropped among them does not join the set — it breaks the one thing the row
 * is: four of the same thing.
 *
 * A DRAG is refused by not accepting the dragover at all, so the cursor reads "no drop" the whole way
 * across the row — the conventional signal, and better than accepting the drag and erroring on
 * release, which tells you it worked right up until it did not. Every other route (click-to-add,
 * replace-a-built-in) is refused inside dropInRow with a message, because THOSE would otherwise fail
 * silently with nothing to explain them.
 *
 * Declared here, beside ACTION_TYPES, so the renderer and the builder read one rule instead of two
 * copies of a string. */
export const LOCKED_ROWS = new Set(['quick']);
export const isLockedRow = (rowId: string) => LOCKED_ROWS.has(rowId);

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
  /* ⚠️ The banner SEARCH too. Its Sel is a bare wrapper and the white field is a div inside it, so
     padding landed between the selection outline and the box — visible as a growing blue gutter
     around a search bar that never got roomier — and a dragged height grew the wrapper while the
     field stayed 44px. Both belong to the thing that is painted. */
  if (id === 'hero-search') return true;
  const t = placedType(id);
  if (!t) return false;
  /* ⚠️ SELF_SURFACED types count too. They are marked `bare` because they must not be wrapped in
     the generic Surface — they draw their OWN card — but "bare" was being read as "has no box", so
     an Action Card's padding went onto the wrapper and appeared outside the card it was supposed to
     be inside. Bare means nobody wraps it; it does not mean there is nothing to pad. */
  return ACTION_TYPES.has(t) || !renderSpec(t).bare;
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
