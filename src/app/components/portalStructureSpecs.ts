/* Support Portal builder — structure and chrome (spec §7.20–7.24, build step 7).
 *
 * The Banner, the Section, the Page, the left rail and the top bar. These differ from §7's widgets
 * in one way that shapes everything: they are not things an admin ADDS, they are things the page
 * already is. So none of them can be deleted from the palette's point of view, and two of them —
 * the rail and the bar — hold destinations the product owns rather than content the admin writes.
 */

import type { WidgetSpec } from './portalWidgetSpec';

/* ── §7.20 Banner ────────────────────────────────────────────────────────── */

export const HERO_SPEC: WidgetSpec = {
  id: 'hero', name: 'Banner', group: 'Structure', reuse: 'single', family: 'collection',
  fields: [
    { key: 'heading', label: 'Heading', control: 'text', group: 'Content' },
    { key: 'sub', label: 'Sub-heading', control: 'text', group: 'Content' },
    { key: 'showSearch', label: 'Show the search bar', control: 'toggle', group: 'Content' },
    { key: 'searchPlaceholder', label: 'Search placeholder', control: 'text', group: 'Content', when: (c) => c.showSearch !== false },
    { key: 'height', label: 'Height', control: 'slider', tab: 'style', group: 'Banner', min: 120, max: 600 },
    {
      key: 'contentAlign', label: 'Content alignment', control: 'nine', tab: 'style', group: 'Banner',
    },
    /* Removed on request: Stretch to the page edges, Content max width, Heading colour, and with the
       colour gone the Contrast guard that measured it. The renderer still reads the same cfg keys,
       so each falls back to its default and the band looks exactly as it did — putting any of them
       back is one line here, not a rebuild. */
    { key: 'searchWidth', label: 'Search width', control: 'slider', tab: 'style', group: 'Search', min: 40, max: 100, unit: '%', when: (c) => c.showSearch !== false },
    { key: 'searchRadius', label: 'Search corner radius', control: 'slider', tab: 'style', group: 'Search', min: 0, max: 24, when: (c) => c.showSearch !== false },
  ],
  packs: ['P1'],
  /* §7.20 — nothing in the palette can put a banner back, so Duplicate and Delete would be a
     one-way door. The overflow carries Move up / Move down / Reset to default only. */
  noDelete: true,
  /* ⚠️ No Parts collection. The heading, sub-heading and search bar are each wrapped in <Sel> on
     the canvas, so they are reached by clicking the words themselves — a list of them here was a
     second route to the same three places, and it was the only "collection" in the file with
     nothing to add, reorder or delete. */
  defaults: {
    heading: 'Welcome to Support Portal',
    sub: 'Search our support center knowledge base',
    showSearch: true,
    searchPlaceholder: 'How can we help you?',
    fullBleed: false,
    height: 260, contentAlign: 'center', contentMaxWidth: 70,
    headingColor: '#FFFFFF', searchWidth: 70, searchRadius: 4,
    // §7.20's search sub-element.
    searchScope: 'knowledge', searchSuggestions: true,
  },
};

/** L6 — the Search bar's own drawer. Reached by selecting the search field on the canvas. */
export const HERO_SEARCH_FIELDS: WidgetSpec['fields'] = [
  { key: 'searchPlaceholder', label: 'Placeholder', control: 'text', group: 'Content' },
  {
    key: 'searchScope', label: 'Scope', control: 'segmented', group: 'Content',
    options: [{ value: 'knowledge', label: 'Knowledge' }, { value: 'all', label: 'All' }],
  },
  { key: 'searchSuggestions', label: 'Show suggestions as they type', control: 'toggle', group: 'Content' },
  { key: 'showSearch', label: 'Show the search bar', control: 'toggle', group: 'Content' },
];

/* ── §7.21 Section ───────────────────────────────────────────────────────── */

export const SECTION_SPEC: WidgetSpec = {
  id: 'section', name: 'Section', group: 'Structure', reuse: 'many', family: 'container',
  /* The accordion model. ⚠️ NO Typography — a section has no type of its own; its children carry
     the text. And the STYLE accordion is three mutually exclusive fills, not a pile of always-on
     rows: None hides everything, Colour shows background + border + radius, Image shows the upload
     with border + radius only. Fields that do not apply are removed, never greyed. */
  panel: {
    content: [
      { key: 'name', label: 'Name', control: 'text', help: 'Only you see this — it labels the section in the editor.' },
      /* Chosen HERE, on the parent, so every card in the row shares a shape. A row of cards that
         do not agree reads as an accident, which is why the card has no Layout accordion. */
      { key: 'cardTemplate', label: 'Card templates', control: 'templates', when: (c) => c.hasCards === true },
    ],
    accordions: [
      {
        id: 'layout', open: true,
        fields: [
          { key: 'cols', label: 'Columns', control: 'segmented',
            options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
          { key: 'distribute', label: 'Content alignment', control: 'distribute' },
          { key: 'valign', label: 'Columns alignment', control: 'valign', divider: true },
          { key: 'colGap', label: 'Gap between columns', control: 'sliderUnit', min: 0, max: 48, unit: 'px', divider: true },
        ],
      },
      {
        id: 'style',
        fields: [
          { key: 'fill', label: 'Fill', control: 'segmented',
            options: [{ value: 'none', label: 'None' }, { value: 'color', label: 'Colour' }, { value: 'image', label: 'Image' }] },
          { key: 'bg', label: 'Background colour', control: 'color', when: (c) => c.fill === 'color' },
          { key: 'bgImage', label: 'Image', control: 'upload', when: (c) => c.fill === 'image' },
          { key: 'borderWidth', label: 'Border', control: 'borderRow', when: (c) => c.fill !== 'none' },
            { key: 'radius', label: 'Corner radius', control: 'radius', when: (c) => c.fill !== 'none' },
            { key: 'shadowOn', label: 'Shadow', control: 'shadow' },
        ],
      },
      { id: 'spacing', spacing: 'both' },
      {
        id: 'size',
        fields: [{ key: 'minHeight', label: 'Height', control: 'sliderUnit', min: 0, max: 800, unit: 'px' }],
      },
    ],
  },
  noDelete: true,
  fields: [], packs: [],
  /* ⚠️ NO cols/padTop/padBottom default — a spec default is shared by EVERY section, and the bands
     do not share a column count. Seeded per node in the builder instead. */
  defaults: { name: 'New section', cardTemplate: 'left', distribute: 'start', valign: 'start', colGap: 16, fill: 'none', borderWidth: 0, borderColor: '#E5E7EB', radius: 8, minHeight: 0 },
};

/** L2 — a column owns its width and the alignment of the blocks inside it. Nothing else (§7.21). */
export const COLUMN_SPEC: WidgetSpec = {
  id: 'column', name: 'Column', group: 'Structure', reuse: 'many', family: 'container',
  fields: [
    { key: 'width', label: 'Width', control: 'slider', tab: 'style', group: 'Column', min: 10, max: 90, unit: '%' },
    {
      key: 'blockAlign', label: 'Align the blocks inside', control: 'segmented', tab: 'style', group: 'Column',
      options: [{ value: 'start', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }],
    },
  ],
  packs: ['P1'],
  noDelete: true,
  notes: [{ tone: 'info', text: 'A column owns its width and how the blocks inside it sit. Everything else belongs to the section above it or the blocks within it.' }],
  defaults: { width: 50, blockAlign: 'start' },
};

/* ── §7.22 Page ──────────────────────────────────────────────────────────── */

export const PAGE_SPEC: WidgetSpec = {
  id: 'page', name: 'Page', group: 'Structure', reuse: 'single', family: 'container',
  fields: [
  ],
  packs: ['P1'],
  noDelete: true,
  /* ⚠️ Typeface, text scale and the palette USED to live here as three colour fields. They moved to
     the Theme panel in the rail when a theme became mode + palette + type + button shape — a page is
     one of the things a theme paints, not the place the theme is kept. */
  notes: [{ tone: 'info', text: 'Typeface and colours are set once for the whole portal in Theme, in the right-hand rail. This page keeps its own background and spacing.' }],
  defaults: {},
};

/* ── §7.23 Left rail ─────────────────────────────────────────────────────── */

const RAIL_ITEMS = [
  { id: 'r1', name: 'Requests', route: '/requests' },
  { id: 'r2', name: 'Changes', route: '/changes' },
  { id: 'r3', name: 'My Assets', route: '/assets' },
  { id: 'r4', name: 'My CIs', route: '/cis', perm: 'Allow Requester to Access My CI' },
  { id: 'r5', name: 'Knowledge', route: '/knowledge', perm: 'Allow Requester To Access Knowledge' },
  { id: 'r6', name: 'My Approvals', route: '/approvals', perm: 'Allow Requester To Access My Approvals' },
  { id: 'r7', name: 'My Team', route: '/team' },
  { id: 'r8', name: 'Tasks', route: '/tasks' },
];

export const RAIL_SPEC: WidgetSpec = {
  id: 'rail', name: 'Left rail', group: 'Chrome', reuse: 'single', family: 'collection',
  fields: [
    { key: 'railWidth', label: 'Rail width', control: 'slider', tab: 'style', group: 'Rail', min: 48, max: 96 },
    { key: 'railIconSize', label: 'Icon size', control: 'slider', tab: 'style', group: 'Rail', min: 14, max: 28 },
    {
      key: 'railLabels', label: 'Labels', control: 'segmented', tab: 'style', group: 'Rail',
      options: [{ value: 'icon', label: 'Icon only' }, { value: 'both', label: 'Icon + label' }],
    },
    {
      key: 'railActive', label: 'Active item', control: 'segmented', tab: 'style', group: 'Rail',
      options: [{ value: 'tint', label: 'Tint' }, { value: 'bar', label: 'Side bar' }, { value: 'bold', label: 'Bold' }],
    },
    { key: 'railSpacing', label: 'Item spacing', control: 'slider', tab: 'style', group: 'Rail', min: 0, max: 24 },
  ],
  packs: ['P1'],
  noDelete: true,
  /* §7.23 — order and visibility are the admin's; the destinations are the product's. So the list
     has no Add and no Delete, and a permission the requester lacks is not something to "enable"
     from here. */
  notes: [{
    tone: 'info',
    text: 'These destinations belong to the product — you can reorder them and hide them, but not add or remove them. A destination the requester is not permitted to reach never appears, whatever the order.',
  }],
  collection: {
    key: 'items', group: 'Destinations', addLabel: '', emptyHint: '',
    noAdd: true, hideable: true,
    label: (it) => String(it.name ?? ''),
    meta: (it) => String(it.route ?? ''),
    seed: () => ({}),
    fields: [],
  },
  defaults: {
    items: RAIL_ITEMS,
    railWidth: 64, railIconSize: 18, railLabels: 'icon', railActive: 'tint', railSpacing: 8,
  },
};

/* ── §7.24 Top bar ───────────────────────────────────────────────────────── */

/* Every action the real top bar carries, in its real order. ⚠️ The four NAVIGATION links were
   removed (the left rail already reaches all of them) — the ACTIONS were not, and rebuilding the
   bar from this list is what makes reordering the logo against them actually work. */
const NAV_ITEMS = [
  { id: 'n0', name: 'Logo', kind: 'logo', fixedVisible: true },
  { id: 'n1', name: 'Ask AI', kind: 'action' },
  { id: 'n2', name: 'Create', kind: 'action' },
  { id: 'n3', name: 'Text', kind: 'action' },
  { id: 'n4', name: 'Conversations', kind: 'action' },
  { id: 'n5', name: 'Notifications', kind: 'action' },
  { id: 'n6', name: 'Shortcuts', kind: 'action' },
  { id: 'n7', name: 'Home', kind: 'action' },
  { id: 'n8', name: 'Help', kind: 'action' },
  { id: 'n9', name: 'Profile', kind: 'action' },
];

export const NAVBAR_SPEC: WidgetSpec = {
  id: 'navbar', name: 'Top bar', group: 'Chrome', reuse: 'single', family: 'container',
  /* ⚠️ NO item list. The bar is two things, not ten: the logo, and the actions AS ONE BLOCK.
     Letting someone drag Bell between Home and Help is a freedom nobody wants and a bar nobody can
     read — the action cluster is a unit that belongs top-right. What IS worth arranging is where
     the logo sits against it, which is the one control below. */
  panel: {
    content: [
      { key: 'logoSrc', label: 'Logo', control: 'upload' },
      {
        key: 'logoPos', label: 'Logo position', control: 'segmented',
        options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }],
      },
    ],
    accordions: [
      {
        id: 'style', open: true,
        fields: [
          { key: 'barBg', label: 'Background colour', control: 'color' },
          { key: 'barHeight', label: 'Bar height', control: 'sliderUnit', min: 48, max: 96, unit: 'px' },
          { key: 'barDivider', label: 'Divider under the bar', control: 'toggle' },
          /* The SHARED shadow block — same control, same four keys, same rendered CSS as the action
             cards and every other widget. A bespoke on/off + colour pair here meant the bar's
             shadow was the one shadow in the builder you could not aim or sink. */
          { key: 'shadowOn', label: 'Shadow', control: 'shadow' },
        ],
      },
      { id: 'spacing', spacing: 'both' },
    ],
  },
  noDelete: true,
  fields: [], packs: [],
  defaults: {
    logoSrc: '', logoPos: 'left',
    barBg: '#FFFFFF', barHeight: 56, barDivider: true,
    shadowOn: false, shadowColor: '#0F172A', shadowType: 'outer', shadowPos: 'bottom',
  },
};

export const STRUCTURE_SPECS: WidgetSpec[] = [
  HERO_SPEC, SECTION_SPEC, COLUMN_SPEC, PAGE_SPEC, RAIL_SPEC, NAVBAR_SPEC,
];
