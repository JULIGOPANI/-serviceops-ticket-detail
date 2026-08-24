/* Support Portal builder — the widget registry (spec §6 and the flat widgets of §7).
 *
 * Every widget is DATA, not a bespoke panel. A widget declares its content fields, which style
 * packs it has and which typography roles it actually owns; the drawer renders it. That is what
 * makes 16 widgets cost roughly what one costs, and it is why §10 says step 4 should need almost no
 * new code — if a widget here needs something the control kit or the packs lack, the kit was not
 * finished.
 *
 * ⚠️ Only the 28 widgets named in §6 are registered. Every other catalogue element keeps the
 * editor it already had — this file adds, it does not take away.
 */

import type { TypeRole } from './portalPageModel';
import { COLLECTION_SPECS } from './portalCollectionSpecs';
import { STRUCTURE_SPECS } from './portalStructureSpecs';
import { PANEL_FOR_TYPE, PANEL_SPECS } from './portalPanelSpecs';

/* ── field descriptors ───────────────────────────────────────────────────── */

export type ControlKind =
  | 'text' | 'textarea' | 'rich' | 'number' | 'toggle' | 'chips' | 'select'
  | 'segmented' | 'icon' | 'upload' | 'color' | 'slider'
  /** Locked on, shown with a reason — the §8.5 accessibility floor. */
  | 'lockedToggle'
  /** Sweep an R × C grid (§7.17 Table size). */
  | 'grid'
  /** An editable chip SET, not a fixed multi-select (§7.9 answer options). */
  | 'chipEditor'
  /** 9-point content placement (§7.20 Banner, §7.18 slide). */
  | 'nine'
  /** The §7.20 contrast guard — a readout, not an input. */
  | 'contrast'
  /** §7.22's palette presets. */
  | 'preset'
  /** §7.17's column list — reorder, duplicate, delete, width and alignment per column. */
  | 'columns'
  /** Slider + numeric + unit dropdown (§1.3). */
  | 'sliderUnit'
  /** Short mutually-exclusive visual choices, as a pill row (§1.3). */
  | 'pills'
  /** Card-template thumbnails — the shape is recognised by looking, not by reading a word. */
  | 'templates'
  /** Horizontal content distribution, icon-only (5). */
  | 'distribute'
  /** Vertical content alignment, icon-only (4). */
  | 'valign'
  /* The box controls (§1.3): a gear-advanced radius, a one-row border, a shadow block and a
     keep-proportions size. Built once, reused by every element with a box. */
  | 'radius' | 'borderRow' | 'shadow' | 'size'
  /** The six divider shapes, picked from a popup of drawn lines rather than named in a list. */
  | 'lineStyle'
  /** The five icon frames, picked the same way — by looking, not by reading. */
  | 'iconFrame'
  /** Opens the table's content as a SHEET — a grid is edited in a grid. */
  | 'tableContent'
  /** Circle / square / banner, shown as the shapes themselves. */
  | 'shape';

export type Cfg = Record<string, unknown>;

export interface WidgetField {
  key: string;
  label: string;
  control: ControlKind;
  /** Which tab it appears on. §7.0's header/row switches are Styling, per the spec's tables. */
  tab?: 'content' | 'style';
  /** The collapsible group it sits in. Groups with no visible fields are never rendered. */
  group?: string;
  help?: string;
  /** Help that sits in an ⓘ beside the label rather than as a paragraph under the control. */
  info?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /* A function when the option SET depends on state — §7.15 only offers the Banner shape while the
     layout is Icon top, because a stretched bar has nowhere to go beside text. */
  options?: readonly string[] | { value: string; label: string }[]
    | ((c: Cfg) => readonly string[] | { value: string; label: string }[]);
  /** §2.2 — a field that does not apply is REMOVED, not disabled. */
  when?: (c: Cfg) => boolean;
  /* §2.2 — "changing a parent field that invalidates children clears them and SAYS SO". Returns the
     repair plus the sentence explaining it; silent repair is how people lose work they never saw
     change. */
  consequence?: (value: unknown, c: Cfg) => { patch: Cfg; say: string } | undefined;
  /* Which store this field writes.
     ⚠️ `style` is how a field can appear on BOTH tabs without the two disagreeing (§7.8: "Bind both
     to the same value; never let them disagree"). Featured Services' Columns is a content decision
     at 1–3 and an arrangement decision beyond that, so it shows in both places — but it is ONE
     value, held in the style pack's key, not copied into cfg. */
  store?: 'cfg' | 'style';
  /** §8.5 — alt text is prompted and WARNED about when blank, never blocked. */
  warnWhenBlank?: string;
  /** Draw a hairline and extra space above this field, separating it from the one before. */
  divider?: boolean;
}

export interface WidgetNote {
  tone: 'info' | 'warn';
  text: string;
  tab?: 'content' | 'style';
  /** Where the value or the switch actually lives (§8.4 rule 2). */
  link?: { label: string; section: string; card?: string };
  /** Shown only in this state — e.g. "this source has no status filter". */
  when?: (c: Cfg) => boolean;
}

export type GateKind = 'permission' | 'module' | 'feature';

/* The §4 collection contract, as data. A widget declares it and gets the item list, the item drawer
   and the sub-element drawer for free — build it once, reuse it for all six. */
export interface CollectionSpec {
  /** cfg key holding the array. */
  key: string;
  /** Group title in the widget's Content tab. */
  group: string;
  addLabel: string;
  emptyHint: string;
  max?: number;
  /** Collections where an item can be kept without publishing it. */
  hideable?: boolean;
  /** The items carry no settings of their own — no chevron into a per-item drawer. */
  noOpen?: boolean;
  /** Multi-file add, appended in selection order (§7.19). */
  bulkAdd?: boolean;
  /** The list only exists in this state — e.g. Feedback's questions when follow-ups are off. */
  when?: (c: Cfg) => boolean;
  label: (item: Cfg, i: number) => string;
  meta?: (item: Cfg, i: number) => string | undefined;
  /** Realistic placeholder content, never `Untitled` (§8.4 rule 4). */
  seed: (i: number) => Cfg;
  /** The ITEM's own content fields (L5). */
  fields: WidgetField[];
  /** The item's per-item style packs — only what is legitimately per-item (§4.2). */
  packs?: string[];
  roles?: TypeRole[];
  /** Separately selectable parts of an item (L6). */
  subElements?: { key: string; name: string; role?: TypeRole }[];
  /** A child that IS an ordinary widget, opening its own type's panels (§7.15). */
  childTypes?: { type: string; label: string }[];
  /** Table rows edit their cells rather than a field list. */
  isTableRow?: boolean;
  /* ⚠️ §7.23/§7.24 — the rail's destinations and the bar's items belong to the PRODUCT. The admin
     orders and hides them; there is nothing to add and nothing to delete. */
  noAdd?: boolean;
  /** Render the list WITHOUT its accordion — for a panel whose entire content is this list. */
  flat?: boolean;
  /** Parts that always exist rather than items you create (§7.20's Banner). */
  fixed?: { key: string; name: string }[];
}

/* ── the NEW-ELEMENT panel model (NEW-ELEMENT-PANELS-SPEC §1.1–§1.2) ─────────
 *
 * A second, Duda-shaped styling model: named accordions — Layout · Style · Spacing · Size ·
 * Alignment — rather than the P1–P8 packs. Only the seventeen new elements use it; the widgets
 * from WIDGET-CONTENT-AND-STYLING-SPEC keep their packs, per the decision taken on this build.
 *
 * ⚠️ Only the accordions an element NEEDS appear. Blank in the §4 coverage matrix means the
 * accordion is absent, not disabled and not empty — a Divider has no padding, so it shows no
 * Spacing padding box at all. */
export type PanelAccordionId = 'layout' | 'style' | 'spacing' | 'size' | 'alignment';

export interface PanelAccordion {
  id: PanelAccordionId;
  /** The one accordion that opens by default, named per element in §3. */
  open?: boolean;
  /** Shared groups composed in: G1 background & container, G3 text roles. */
  groups?: ('G1' | 'G3')[];
  roles?: TypeRole[];
  /** Spacing accordion: which boxes it shows. A Divider gets margin only. */
  spacing?: 'padding' | 'margin' | 'both';
  /** The ⓘ note on the header, for rows whose behaviour is not obvious from the label. */
  info?: string;
  /** ⚠️ Whole accordions can be conditional, not just fields — an Alignment section on an EMPTY
      section is a heading over controls with nothing to act on, and hiding its fields one by one
      would leave the heading behind. */
  when?: (c: Cfg) => boolean;
  fields?: WidgetField[];
}

export interface PanelModel {
  /** Absent = no Content section at all (Spacer); `contentNote` says so in one line. */
  content?: WidgetField[];
  contentNote?: string;
  /* Its own section between Content and Design: WHERE the thing goes is neither what it says nor
     how it looks, and burying a destination inside Content is how a card ends up pointing nowhere. */
  action?: WidgetField[];
  accordions: PanelAccordion[];
}

export interface WidgetSpec {
  id: string;
  name: string;
  group: 'Live data' | 'Actions' | 'Content' | 'Structure' | 'Chrome'
    | 'Components' | 'Layout' | 'Basic' | 'Visual' | 'Business' | 'Custom';
  /** Present = this element uses the accordion panel model instead of the P1–P8 packs. */
  panel?: PanelModel;
  reuse: 'single' | 'many';
  family: 'flat' | 'collection' | 'container';
  collection?: CollectionSpec;
  /** Structure and chrome cannot be removed — nothing in the palette could put them back. */
  noDelete?: boolean;
  /** §8.1 — three kinds, and only one of them is the editor's to fix. */
  gate?: { kind: GateKind; setting: string; section?: string };
  fields: WidgetField[];
  packs: string[];
  roles?: TypeRole[];
  notes?: WidgetNote[];
  defaults: Cfg;
}

/* ── shared: the list-card family (§7.0) ─────────────────────────────────────
 *
 * Six widgets render the same shape — heading, optional count, N live rows, optional "View all" —
 * so they share their whole Styling tab and differ only in Content. Authored once. */

/* ⚠️ These widgets render LIVE data, so almost nothing about a row is the admin's to arrange — the
   backend decides what a row says. What is left is the frame: whether the header carries a badge,
   whether it offers a link, and how the rows are spaced. Count style, record-ID placement and
   status-pill tone were all removed as controls over content this panel does not own.
   ⚠️ There is no Rows group any more. Row layout is arrangement, so it sits with the gap and the
   dividers under Arrangement rather than in a section of its own holding one control. */
const listCardStyleFields = (opts: { count?: boolean; viewAll?: boolean; statusPill?: boolean }): WidgetField[] => [
  ...(opts.count === false ? [] : [
    { key: 'showCount', label: 'Show count badge', control: 'toggle', tab: 'style', group: 'Header' } as WidgetField,
  ]),
  ...(opts.viewAll === false ? [] : [
    { key: 'showViewAll', label: 'Show “View all” link', control: 'toggle', tab: 'style', group: 'Header' } as WidgetField,
    {
      key: 'viewAllLabel', label: 'Link label', control: 'text', tab: 'style', group: 'Header',
      when: (c) => c.showViewAll !== false,
    } as WidgetField,
  ]),
  {
    key: 'rowLayout', label: 'Row layout', control: 'segmented', tab: 'style', group: 'Layout',
    options: [{ value: 'single', label: 'Single line' }, { value: 'stacked', label: 'Stacked' }],
  },
];

// P7 (Interactive states) removed — hover/focus/pressed styling is not something this panel offers.
const LIST_CARD_PACKS = ['P1', 'P2', 'P4', 'P8'];
/* ⚠️ The six live-data cards, minus P8. P8 is the Empty-state block — "when there is nothing to
   show: show message / hide widget", plus the message itself. What a live card does when its query
   comes back empty is the product's answer, not a per-page decision, and it is the one setting whose
   effect an admin can almost never see while editing. The DEFAULTS still carry the empty-state
   values, so a card with no data still renders its message exactly as it does today. */
const LIVE_CARD_PACKS = LIST_CARD_PACKS.filter((p) => p !== 'P8');
const LIST_CARD_ROLES: TypeRole[] = ['title', 'body', 'meta', 'link'];

const listCardDefaults = {
  showCount: true, countStyle: 'badge', showViewAll: true, viewAllLabel: 'View all',
  showId: true, idPlacement: 'before', rowLayout: 'single', statusTone: 'status',
};

/* ── the registry ────────────────────────────────────────────────────────── */

export const WIDGET_SPECS: WidgetSpec[] = [
  /* ─────────── §7.1 My Open Requests ─────────── */
  {
    id: 'my_requests', name: 'My Open Requests', group: 'Live data', reuse: 'single', family: 'flat',
    // Gated on the Request MODULE, deliberately not on "allow create incident" — a requester who
    // cannot raise a ticket can still have tickets.
    gate: { kind: 'module', setting: 'Request module' },
    /* No fields at all — see the note above the registry. Title, Statuses, Rows to show and the two
       toggles are gone, and with them the Header group that `listCardStyleFields` contributed. */
    fields: [],
    packs: LIVE_CARD_PACKS, roles: LIST_CARD_ROLES,
    defaults: { ...listCardDefaults, title: 'My Open Requests', statuses: ['Open', 'In Progress', 'Pending'], show: 5, showStatus: true, showDate: true },
  },

  /* ─────────── §7.2 Pending Approvals ─────────── */
  {
    id: 'pending_approvals', name: 'Pending Approvals', group: 'Live data', reuse: 'single', family: 'flat',
    gate: { kind: 'permission', setting: 'Allow Requester To Access My Approvals', section: 'Organization' },
    fields: [],
    packs: LIVE_CARD_PACKS, roles: LIST_CARD_ROLES,
    defaults: { ...listCardDefaults, title: 'Pending Approvals', show: 3, showRequester: true, showDate: true },
  },

  /* ─────────── §7.3 My Assets ─────────── */
  {
    id: 'my_assets', name: 'My Assets', group: 'Live data', reuse: 'single', family: 'flat',
    gate: { kind: 'permission', setting: 'Allow Requester to Access My Assets', section: 'Organization' },
    fields: [],
    packs: LIVE_CARD_PACKS, roles: LIST_CARD_ROLES,
    defaults: { ...listCardDefaults, title: 'My Assets', show: 5, showType: true },
  },

  /* ─────────── §7.4 My CIs ─────────── */
  {
    id: 'my_cis', name: 'My CIs', group: 'Live data', reuse: 'single', family: 'flat',
    gate: { kind: 'permission', setting: 'Allow Requester to Access My CI', section: 'Organization' },
    fields: [],
    packs: LIVE_CARD_PACKS, roles: LIST_CARD_ROLES,
    defaults: { ...listCardDefaults, title: 'My CIs', show: 5, showType: true },
  },

  /* ─────────── §7.5 Announcements ─────────── */
  {
    id: 'announcements', name: 'Announcements', group: 'Live data', reuse: 'single', family: 'flat',
    // No total count and no "View all" — an announcement feed has no fuller list to go to.
    fields: [],
    packs: LIVE_CARD_PACKS, roles: LIST_CARD_ROLES,
    defaults: { ...listCardDefaults, title: 'Announcements', show: 3, showDate: true, rowLayout: 'stacked' },
  },

  /* ─────────── §7.6 Most Read Knowledge ─────────── */
  {
    id: 'most_read', name: 'Most Read', group: 'Live data', reuse: 'single', family: 'flat',
    gate: { kind: 'permission', setting: 'Allow Requester To Access Knowledge', section: 'Organization' },
    fields: [],
    packs: LIVE_CARD_PACKS, roles: LIST_CARD_ROLES,
    defaults: { ...listCardDefaults, title: 'Most Read', show: 3, showCategory: true, showDate: true, rowLayout: 'stacked' },
  },

  /* ─────────── §7.7 Contact Us ─────────── */
  {
    id: 'contact_us', name: 'Contact Us', group: 'Live data', reuse: 'single', family: 'flat',
    /* ⚠️ TWO fields. The labels are the product's words — "Email" and "Phone" are what this card
       calls those lines on every portal, and letting one page rename them is how two portals stop
       describing the same thing the same way. The values stay editable because a portal may
       legitimately publish a different address or number to its own requesters.
       The Show-email / Show-phone / Show-hours switches and the whole Hours line went with them:
       with no toggle there is no way to hide a line, so a label and a value you could blank but
       never remove would have been worse than a fixed one. Every string is still in `defaults`, so
       the card renders exactly as it does today. */
    fields: [
      { key: 'cv0', label: 'Email address', control: 'text', group: 'Content' },
      { key: 'cv1', label: 'Phone number', control: 'text', group: 'Content' },
    ],
    /* ⚠️ No P6. Contact Us has no icon of its own — the group was styling a glyph that is not on
       the widget, which is a control with nothing to act on. P4 goes with the global removal. */
    packs: ['P1', 'P2', 'P8'], roles: ['title', 'body', 'meta'],
    // §8.4 rule 2 — show the value, say where it lives, link there. A local field here would
    // silently diverge from the record every other portal reads.
    /* ⚠️ The note no longer talks about switches, because there are none — it now says what is
       actually true of the two fields left: they override the org record for this portal. */
    notes: [{
      tone: 'info',
      text: 'These override what this portal publishes. The organisation record is where they are seeded from and what every other portal reads.',
      link: { label: 'Edit contact details', section: 'Organization', card: 'Company Details' },
    }],
    /* ⚠️ The line strings are seeded HERE as well as being the renderer's fallback. Without them the
       panel opened with three blank inputs while the canvas showed "Email / servicedesk@acme.com" —
       the field looked empty and the page looked filled, so the only way to learn the current value
       was to read it off the page and retype it. A default is what makes the control state a fact. */
    defaults: {
      title: 'Contact Us', showEmail: true, showPhone: true, showHours: true,
      cl0: 'Email', cv0: 'servicedesk@acme.com',
      cl1: 'Phone', cv1: '+91 79 4040 0000',
      cl2: 'Hours', cv2: 'Mon–Fri, 09:00–20:00 IST',
    },
  },

  /* ─────────── §7.8 Featured Services ─────────── */
  {
    id: 'featured_services', name: 'Most Used Services', group: 'Live data', reuse: 'single', family: 'flat',
    gate: { kind: 'permission', setting: 'Access Service Catalog', section: 'Organization' },
    /* ⚠️ ONE control. Show description is the only field here that is genuinely the admin's: the
       catalogue decides which services rank, what they are called and which category they sit in,
       but whether this portal prints the second line is a page decision. Title, Services to show,
       Columns, the Browse link and its label all described data this widget does not own.
       ⚠️ The card-template picker and the gap go too, and that is deliberate: task 22 gives this
       widget the four-card shape, so a picker offering four other shapes would offer to undo the
       design it is about to be given. Every value stays in `defaults`, so nothing moves today. */
    fields: [
      { key: 'showDesc', label: 'Show description', control: 'toggle', group: 'Content' },
    ],
    /* ⚠️ P4 and P6 are gone. P4 brought "Divider between items", which cannot mean anything here —
       these services are a GRID, and there is no gap between rows to rule. P6 brought an Icon group
       (size, colour, container shape, position) whose position row now duplicates the card template
       above, and whose remaining three were styling a glyph the template can switch off entirely.
       The gap was the one control in P4 worth keeping, so it is declared directly rather than
       dragging a pack in for one field. */
    packs: ['P1', 'P2'], roles: ['title', 'body', 'meta'],
    notes: [{ tone: 'info', text: 'A requester’s favourites, not a browse-all grid — the catalogue itself is a page, not a widget.' }],
    // No `columns` here — it lives in the style store so the two controls share one value.
    defaults: { title: 'Most Used Services', show: 6, showDesc: false, showBrowse: true, browseLabel: 'Browse catalog', cardTemplate: 'left' },
  },

  /* ─────────── §7.10 Action cards ─────────── */
  ...([
    /* All FOUR cards. AD Self Service is not on the default page, but it is addable from the
       palette — adding it appends a real fourth action card to the Quick Actions row, so it gets
       the identical spec, the identical drawer and the identical card UI as the other three. */
    ['act_ad', 'AD Self Service', 'Reset your domain password', 'Allow AD Self Service', 'key'],
    ['act_incident', 'New Incident', 'Report an issue you are facing', 'Allow Requester to create Incident', 'incident'],
    ['act_service', 'Request Service', 'Browse the service catalog', 'Access Service Catalog', 'cart'],
    ['act_knowledge', 'Knowledge', 'Search help articles', 'Access Knowledge', 'book'],
    /* ⚠️ The palette's own Action Card, built from the SAME factory rather than a lookalike. It is
       the only one that is  — the four above are the page's fixed destinations, this one is a
       card an admin adds and points wherever they like. Sharing the factory is what guarantees its
       Style, Alignment, Size and Spacing sections are the ones Quick Actions uses. */
    ['act_custom', 'Action Card', 'Describe what this card does', '', 'incident'],
  ] as const).map<WidgetSpec>(([id, title, sub, perm, icon]) => ({
    id, name: title, group: 'Actions', reuse: id === 'act_custom' ? 'many' : 'single', family: 'flat',
    ...(perm ? { gate: { kind: 'permission' as const, setting: perm, section: 'Organization' } } : {}),
    fields: [
      { key: 'title', label: 'Title', control: 'text', group: 'Content' },
      { key: 'sub', label: 'Subtitle', control: 'text', group: 'Content' },
      { key: 'icon', label: 'Icon', control: 'icon', group: 'Content' },
      {
        key: 'iconPos', label: 'Icon position', control: 'segmented', tab: 'style', group: 'Layout',
        options: [{ value: 'left', label: 'Left' }, { value: 'top', label: 'Top' }],
      },
      {
        key: 'contentAlign', label: 'Content alignment', control: 'segmented', tab: 'style', group: 'Layout',
        options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }],
      },
    ],
    /* ⚠️ NO Layout accordion. The card's shape is set on the SECTION via Card templates, so every
       card in the row agrees — offering it again here would be two controls for one value, and the
       loser would be whichever was touched last. */
    panel: {
      content: [
        { key: 'title', label: 'Title', control: 'text' },
        { key: 'sub', label: 'Subtitle', control: 'text' },
        { key: 'icon', label: 'Icon', control: 'icon' },
        /* The only place this is chosen now (see SECTION_SPEC). */
        { key: 'cardTemplate', label: 'Card templates', control: 'templates' },
      ],
      /* ⚠️ ONLY on the custom card. The four fixed cards' destinations come from the backend, keyed
         to the card's identity — an admin does not choose where "New Incident" goes, so offering the
         choice claimed an authority the screen does not have and a setting the product would ignore.
         The custom card exists to point anywhere, so it keeps this.
         It gets its OWN section rather than a row inside Content: where a card GOES is neither what
         it says nor how it looks, and a destination buried among titles is how one ends up pointing
         nowhere. */
      ...(id === 'act_custom' ? {
      action: [
        {
          key: 'destination', label: 'On click, go to', control: 'select',
          options: [
            { value: 'incident', label: 'Report an incident' },
            { value: 'service', label: 'Request a service' },
            { value: 'ad', label: 'AD self service' },
            { value: 'knowledge', label: 'Knowledge' },
            { value: 'url', label: 'External link' },
          ],
        },
        /* ⚠️ "A page in this portal" is gone, and the Page picker it revealed goes with it. A
           dependent field whose parent option no longer exists is a control nothing can ever
           reveal — it survives in the spec looking like a feature and behaves like a bug. The four
           named destinations are what an action card is for; anything else is an External link. */
        { key: 'url', label: 'URL', control: 'text', when: (c) => c.destination === 'url' },
        { key: 'newTab', label: 'Open in a new tab', control: 'toggle', when: (c) => c.destination === 'url' },
        /* ⚠️ Belongs to the DESTINATION, not to the card — it only means anything once the click
           lands on the service catalog, so it appears with "Request a service" and is removed with
           it, the same rule URL and Open-in-a-new-tab already follow. Off by default: a field that
           has just appeared must not have already changed what the card does. */
        {
          key: 'mostUsed', label: 'Most used services', control: 'toggle',
          when: (c) => c.destination === 'service',
          help: 'When a requester clicks this card, the services people request most are shown first.',
        },
      ],
      } : {}),
      accordions: [
        {
          id: 'style', open: true,
          fields: [
            { key: 'fill', label: 'Fill', control: 'segmented',
              options: [{ value: 'none', label: 'None' }, { value: 'color', label: 'Colour' }, { value: 'image', label: 'Image' }] },
            { key: 'bg', label: 'Background colour', control: 'color', when: (c) => c.fill === 'color' },
            { key: 'bgImage', label: 'Image', control: 'upload', when: (c) => c.fill === 'image' },
            { key: 'borderWidth', label: 'Border', control: 'borderRow', when: (c) => c.fill !== 'none' },
            { key: 'radius', label: 'Corner radius', control: 'radius', when: (c) => c.fill !== 'none' },
            /* ⚠️ No Shadow control. The card already carries the one soft shadow the page's card
               language uses, and the toggle drove nothing on the canvas — an inert switch in the
               same accordion as the fill and border that DO work teaches people to distrust the
               whole group. The key stays on the model, so anything already carrying a shadow keeps
               rendering it; there is simply no longer a control to set one. */
          ],
        },
        { id: 'spacing', spacing: 'both' },
        { id: 'size', fields: [{ key: 'minHeight', label: 'Height', control: 'sliderUnit', min: 0, max: 400, unit: 'px' }] },
        /* ⚠️ No Alignment accordion. It moved the WORDS only, so "centre" left the icon where it
           was and the card came out half-aligned — which is not an arrangement anyone chose. The
           card template answers the same question properly: it places the icon AND the text, and
           you recognise the shape by looking instead of reading "centre". */
      ],
    },
    fields: [], packs: [],
    /* Seeded from the card's own identity, so nothing starts pointing nowhere — the admin can
       change it, but the default is the destination the card was already for. */
    defaults: {
      title, sub, icon, iconPos: 'left', contentAlign: 'start',
      destination: id === 'act_custom' ? 'incident' : id.replace('act_', ''),
      url: '', newTab: true,
      /* Off by default. A ToggleRow reads an unset key as ON, so a field that has just appeared
         because you picked a destination would arrive having already changed what the card does. */
      mostUsed: false,
      /* the swatch must state the colour the card would actually paint. Without a bg default the
         ColorField fell back to its own #3D8BD0 while fillCss fell back to white, so the control
         showed blue on a white card and the first click appeared to change nothing. */
      fill: 'none', bg: '#FFFFFF', borderWidth: 0, borderColor: '#E5E7EB', radius: 8,
    },
  })),

  /* ─────────── §7.11 Button / Link ─────────── */
  {
    id: 'button', name: 'Button / Link', group: 'Actions', reuse: 'many', family: 'flat',
    fields: [
      {
        key: 'label', label: 'Label', control: 'text', group: 'Content',
        help: 'When the style is Icon this becomes the tooltip and the screen-reader name.',
      },
      {
        key: 'style', label: 'Style', control: 'segmented', group: 'Content',
        options: [{ value: 'primary', label: 'Primary' }, { value: 'outline', label: 'Outline' }, { value: 'link', label: 'Link' }, { value: 'icon', label: 'Icon' }],
      },
      { key: 'icon', label: 'Icon', control: 'icon', group: 'Content' },
      {
        key: 'action', label: 'Opens', control: 'select', group: 'Action',
        /* ⚠️ File Download, Click to Call, Click to Mail and Share were separate palette entries.
           They are not separate ELEMENTS — they are one button with a different destination, which
           is exactly the duplication the note below warns about. Folded in here and removed from the
           palette, so there is one control for "a thing you click that goes somewhere". */
        options: [
          { value: 'url', label: 'External link' }, { value: 'page', label: 'A page in this portal' },
          { value: 'download', label: 'Download a file' }, { value: 'email', label: 'Compose an email' },
          { value: 'phone', label: 'Call a number' }, { value: 'share', label: 'Share this page' },
        ],
      },
      {
        key: 'shareVia', label: 'Share via', control: 'chips', group: 'Action', when: (c) => c.action === 'share',
        options: ['Email', 'Copy link', 'Teams', 'Slack', 'WhatsApp'],
        help: 'Shares the portal page the button sits on.',
      },
      { key: 'url', label: 'URL', control: 'text', group: 'Action', when: (c) => c.action === 'url' },
      { key: 'newTab', label: 'Open in a new tab', control: 'toggle', group: 'Action', when: (c) => c.action === 'url' },
      {
        key: 'page', label: 'Page', control: 'select', group: 'Action', when: (c) => c.action === 'page',
        options: ['My Requests', 'Service Catalog', 'Knowledge', 'My Approvals', 'My Assets', 'Report an issue'],
      },
      { key: 'file', label: 'File', control: 'upload', group: 'Action', when: (c) => c.action === 'download' },
      {
        key: 'fileName', label: 'Shown as', control: 'text', group: 'Action', when: (c) => c.action === 'download',
        help: 'Leave blank to use the uploaded file’s own name.',
      },
      { key: 'email', label: 'Send to', control: 'text', group: 'Action', when: (c) => c.action === 'email' },
      { key: 'phone', label: 'Number', control: 'text', group: 'Action', when: (c) => c.action === 'phone' },
      /* ── The two tabs ──────────────────────────────────────────────────────
       *
       * A real switch, built from the field engine rather than new drawer machinery: §2.2 already
       * says a field that does not apply is REMOVED, so gating each side on `designTab` gives one
       * group that shows one tab's fields at a time. The BOX and the WORDS are genuinely two
       * questions — you size and colour the button, then you set its type — and separating them is
       * what stops one long column of eleven controls. */
      {
        key: 'designTab', label: '', control: 'segmented', tab: 'style', group: 'Button',
        options: [{ value: 'style', label: 'Button style' }, { value: 'text', label: 'Button text' }],
      },

      // ── Button style — unchanged, exactly the rows that were here before ──
      {
        key: 'size', label: 'Size', control: 'segmented', tab: 'style', group: 'Button',
        options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }],
        when: (c) => (c.designTab ?? 'style') === 'style',
      },
      { key: 'fullWidth', label: 'Full width', control: 'toggle', tab: 'style', group: 'Button', when: (c) => (c.designTab ?? 'style') === 'style' },
      { key: 'radius', label: 'Corner radius', control: 'slider', tab: 'style', group: 'Button', min: 0, max: 24, when: (c) => (c.designTab ?? 'style') === 'style' },
      { key: 'fillColor', label: 'Fill colour', control: 'color', tab: 'style', group: 'Button', when: (c) => (c.designTab ?? 'style') === 'style' && c.style !== 'link' },
      { key: 'borderColor', label: 'Border colour', control: 'color', tab: 'style', group: 'Button', when: (c) => (c.designTab ?? 'style') === 'style' && c.style === 'outline' },

      // ── Button text ──
      { key: 'font', label: 'Font', control: 'select', tab: 'style', group: 'Button', when: (c) => c.designTab === 'text',
        options: ['Inherit from theme', 'Inter', 'Poppins', 'Roboto', 'Source Sans 3', 'Merriweather'] },
      { key: 'fontWeight', label: 'Font weight', control: 'select', tab: 'style', group: 'Button', when: (c) => c.designTab === 'text',
        options: ['Light', 'Normal', 'Medium', 'Semibold', 'Bold'] },
      { key: 'fontSize', label: 'Font size', control: 'sliderUnit', tab: 'style', group: 'Button', min: 10, max: 32, unit: 'px', when: (c) => c.designTab === 'text' },
      /* ⚠️ The SAME key the style tab used to show as "Text colour". One value, one control — a
         second colour field for the same thing is how a panel and a page start disagreeing. */
      { key: 'textColor', label: 'Font colour', control: 'color', tab: 'style', group: 'Button', when: (c) => c.designTab === 'text' },
      { key: 'fontFormat', label: 'Font format', control: 'chips', tab: 'style', group: 'Button', options: ['Bold', 'Underline', 'Italic'], when: (c) => c.designTab === 'text' },
      { key: 'textAlign', label: 'Alignment', control: 'segmented', tab: 'style', group: 'Button', when: (c) => c.designTab === 'text',
        options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }] },
      { key: 'hoverColor', label: 'Hover font colour', control: 'color', tab: 'style', group: 'Button', divider: true, when: (c) => c.designTab === 'text' },
      { key: 'hoverFormat', label: 'Hover font format', control: 'chips', tab: 'style', group: 'Button', options: ['Bold', 'Underline', 'Italic'], when: (c) => c.designTab === 'text' },

      {
        key: 'contentAlign', label: 'Alignment', control: 'segmented', tab: 'style', group: 'Alignment',
        options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }],
      },
    ],
    /* No Size and no Icon pack: a button is sized by its own Size row and its icon is chosen on
       Content — offering either again here would be a second control for one value. */
    packs: [], roles: ['link'],
    notes: [{
      tone: 'info',
      text: '“New incident form” and “Service catalog” are deliberately not in this list — those are the New Incident and Request Service action cards, and two ways to make the same link is one way too many.',
    }],
    /* ⚠️ NO colour defaults. The spec says the three colours inherit "from theme per style", and a
       stored default cannot be per-style: seeding textColor #FFFFFF for Primary painted white text
       on the white Outline button the moment you switched. Unset means the renderer picks the right
       colour for whichever style is active, and a real value only exists once someone chooses one. */
    defaults: {
      label: 'Contact the service desk', style: 'primary', action: 'url', url: 'https://', newTab: true,
      page: 'My Requests', size: 'md', fullWidth: false, radius: 6, contentAlign: 'left',
      designTab: 'style',
      font: 'Inherit from theme', fontWeight: 'Medium', fontSize: 13, fontFormat: [], textAlign: 'center', hoverFormat: [],
    },
  },

  /* ─────────── §7.12 Count tile ─────────── */
  {
    id: 'count_tile', name: 'Count tile', group: 'Actions', reuse: 'many', family: 'flat',
    fields: [
      { key: 'label', label: 'Label', control: 'text', group: 'Content' },
      {
        key: 'source', label: 'Counts', control: 'select', group: 'Content',
        options: ['My requests', 'My changes', 'Approvals waiting on me', 'My assets', 'My CIs'],
      },
      // ⚠️ Only the two sources that HAVE a status filter get chips. On the others the endpoint
      // returns a single total, so the drawer says so rather than rendering an inert filter.
      {
        key: 'statuses', label: 'Statuses to count', control: 'chips', group: 'Content',
        when: (c) => c.source === 'My requests' || c.source === 'My changes',
        help: 'Leaving every chip clear counts all of them.',
      },
      { key: 'icon', label: 'Icon', control: 'icon', group: 'Content' },
      {
        key: 'layout', label: 'Layout', control: 'segmented', tab: 'style', group: 'Tile',
        options: [{ value: 'left', label: 'Icon left' }, { value: 'top', label: 'Icon top' }, { value: 'none', label: 'No icon' }],
      },
      { key: 'numberSize', label: 'Number size', control: 'slider', tab: 'style', group: 'Tile', min: 100, max: 300, step: 10, unit: '%' },
      { key: 'numberColor', label: 'Number colour', control: 'color', tab: 'style', group: 'Tile' },
      { key: 'labelColor', label: 'Label colour', control: 'color', tab: 'style', group: 'Tile' },
    ],
    /* ⚠️ No P6. That pack is the Icon accordion, and a count tile shows one glyph at one size in
       one corner — four controls dressing it sat in the same panel as the number they are not
       about. The icon itself is still chosen in Content, and Layout still says where it goes. */
    packs: ['P1', 'P2'], roles: ['title', 'meta'],
    /* ⚠️ §8.4 rule 1 — never render an inert control, and never silently drop one either. On a
       source with no status filter the chips are REPLACED by this note, so the absence is explained
       rather than looking like a field that failed to load. */
    notes: [{
      tone: 'info',
      when: (c) => c.source !== 'My requests' && c.source !== 'My changes',
      text: 'This source returns a single total — there is no status filter to apply to it, so the status chips are not shown.',
    }],
    defaults: {
      label: 'Open requests', source: 'My requests', statuses: [], layout: 'left',
      numberSize: 180, numberColor: '#364658', labelColor: '#7B8FA5',
    },
  },

  /* ─────────── §7.13 Text ─────────── */
  {
    id: 'text', name: 'Text', group: 'Content', reuse: 'many', family: 'flat',
    fields: [
      /* The editor is the content. Bold/italic/underline, lists, links and headings are applied to
         a SELECTION, so they belong in the writing surface — a panel control can only ever style
         the whole block. */
      { key: 'html', label: 'Text', control: 'rich', group: 'Content' },

      /* ⚠️ These style the WHOLE block, and that is the division of labour: the toolbar styles what
         you selected, these style everything. Both are needed — the toolbar cannot express "this
         paragraph is 18px Poppins" without you selecting all of it first, every time you edit. */
      { key: 'font', label: 'Font', control: 'select', tab: 'style', group: 'Text style',
        options: ['Inherit from theme', 'Inter', 'Poppins', 'Roboto', 'Source Sans 3', 'Merriweather', 'IBM Plex Mono'] },
      { key: 'weight', label: 'Font weight', control: 'select', tab: 'style', group: 'Text style',
        options: ['Light', 'Normal', 'Medium', 'Semibold', 'Bold'] },
      { key: 'size', label: 'Font size', control: 'sliderUnit', tab: 'style', group: 'Text style', min: 10, max: 48, unit: 'px' },
      { key: 'color', label: 'Font colour', control: 'color', tab: 'style', group: 'Text style' },
      { key: 'lineHeight', label: 'Line height', control: 'slider', tab: 'style', group: 'Text style', min: 100, max: 220 },
      { key: 'letterSpacing', label: 'Letter spacing', control: 'slider', tab: 'style', group: 'Text style', min: -2, max: 8 },
      {
        key: 'textCols', label: 'Column count', control: 'segmented', tab: 'style', group: 'Text style',
        options: [{ value: '1', label: '1' }, { value: '2', label: '2' }],
      },
      {
        key: 'textAlign', label: 'Alignment', control: 'segmented', tab: 'style', group: 'Alignment',
        options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }, { value: 'justify', label: 'Justify' }],
      },
    ],
    packs: ['P2'], roles: ['body'],
    defaults: {
      html: 'Double-click to edit this text.', textAlign: 'left', textCols: '1',
      font: 'Inherit from theme', weight: 'Normal', size: 15, color: '#364658',
      lineHeight: 160, letterSpacing: 0,
    },
  },

  /* ─────────── §7.14 Image ─────────── */
  {
    id: 'image', name: 'Image', group: 'Content', reuse: 'many', family: 'flat',
    fields: [
      /* The upload zone IS the replace action once something is in it — it shows the current image
         with its own change and remove controls, so a separate Replace button would be a second
         door to one room. */
      { key: 'src', label: 'Image', control: 'upload', group: 'Content' },
      /* §8.5 — alt text is prompted and WARNED about when blank, never blocked. A hard stop would
         teach people to type a space; a standing warning is what actually gets it filled in.
         ⚠️ Only asked once there IS an image: alt text for nothing is a question with no answer. */
      {
        key: 'alt', label: 'Alt text', control: 'text', group: 'Content',
        help: 'Shown if the image does not load, and read aloud by screen readers.',
        warnWhenBlank: 'No alt text yet — screen-reader users will hear nothing where this image is.',
        when: (c) => !!c.src,
      },
      /* ⚠️ A RICH caption, not a single-line input. A caption is prose — it carries a source, a
         link, an emphasised word — and the one-line field could hold none of that, so anything
         beyond a bare sentence had to go in a Text element underneath and stop being the picture's
         caption at all. */
      { key: 'caption', label: 'Caption', control: 'rich', group: 'Content' },
      /* ⚠️ THREE of the action card's four templates, and for the same reason it has any: where the
         picture sits relative to its words is the shape of the thing, and you recognise a shape by
         looking. "Text only" is the one that does NOT survive here — it hides the picture, and an
         Image element with no image is not a variant of an image, it is a Text element under the
         wrong name, with alt text and a crop still on screen describing nothing. Anyone who wants
         only words already has the Text element. */
      { key: 'template', label: 'Card templates', control: 'templates', group: 'Content', options: ['left', 'top', 'right'] },
      /* ⚠️ Link is the image's ACTION, not its content. Where a click goes is neither what the
         element shows nor how it looks — the same reason the action cards keep their destination in
         a section of its own rather than buried among titles. */
      { key: 'link', label: 'On click, go to', control: 'text', tab: 'style', group: 'Action', help: 'Leave blank to make the image decorative.' },
      { key: 'newTab', label: 'Open in a new tab', control: 'toggle', tab: 'style', group: 'Action', when: (c) => !!c.link },

      // ── Style — the image's own box, using the shared components ──
      { key: 'borderWidth', label: 'Border', control: 'borderRow', tab: 'style', group: 'Style' },
      { key: 'radius', label: 'Corner radius', control: 'radius', tab: 'style', group: 'Style' },
      /* ⚠️ No Shadow, and no Alignment accordion. Shadow was four controls for an effect a support
         portal almost never wants, in the same group as the border and radius that decide how the
         picture reads. Alignment moved the figure only — the card template now says where the
         picture sits, and the floating toolbar aligns the words. */
    ],
    /* ⚠️ No P5 Media. Ratio, fit and focal point crop the picture — that is a decision about the
       IMAGE FILE, and it belongs with the file rather than beside a border slider. P2 stays: Size
       and Spacing are the same rows every other element gets. */
    packs: ['P2'], roles: ['meta'],
    defaults: {
      src: '', alt: '', caption: '', link: '', newTab: true, template: 'top',
      borderWidth: 0, borderColor: '#E5E7EB', radius: 8,
    },
  },
];

/* The six collection widgets live in their own file — they carry a second and third editing layer,
   and mixing them in here made both halves harder to read. */
WIDGET_SPECS.push(...COLLECTION_SPECS, ...STRUCTURE_SPECS, ...PANEL_SPECS);

export const specById = (id?: string) => WIDGET_SPECS.find((w) => w.id === id);

/* ── which canvas node is which widget ───────────────────────────────────────
 *
 * ⚠️ Two routes in, because a widget can be a fixed page block or something an admin dropped. Both
 * must land on the SAME spec, or the same widget would edit differently depending on how it got
 * there. */

/* Structure and chrome. ⚠️ Sections carry dynamic ids (`sec-3`, `sec-3-c0`), so they are matched by
   SHAPE in `structureSpecFor` rather than listed here. */
export const STRUCTURE_FOR_NODE: Record<string, string> = {
  hero: 'hero',
  page: 'page',
  rail: 'rail',
  header: 'navbar',
  'header-logo': 'logo',
  'hero-search': 'search',
  // The three built-in bands are sections like any other.
  quick: 'section',
  work: 'section',
  records: 'section',
};

/** Matches the dynamic ids too: `sec-3` is a Section, `sec-3-c0` a Column. */
export function structureSpecId(nodeId: string): string | undefined {
  if (STRUCTURE_FOR_NODE[nodeId]) return STRUCTURE_FOR_NODE[nodeId];
  /* An image's caption, matched before everything so the words under a picture open the words. */
  if (/-caption$/.test(nodeId)) return 'image_caption';
  /* A card's own words, matched before the card itself so clicking the title opens the TITLE. */
  if (/^quick-[a-z]+-title$/.test(nodeId)) return 'card_title';
  if (/^quick-[a-z]+-sub$/.test(nodeId)) return 'card_sub';
  if (/-icon$/.test(nodeId)) return 'card_icon';
  /* A list widget's heading and its "View all" link are their own panels, matched before the widget
     itself so clicking the words opens the WORDS. */
  if (/-title$/.test(nodeId)) return 'list_title';
  if (/-label$/.test(nodeId)) return 'list_label';
  if (/-sub$/.test(nodeId)) return 'card_sub';
  if (/-viewall$/.test(nodeId)) return 'list_link';
  if (/^sec-\d+-c\d+$/.test(nodeId)) return 'column';
  if (/^sec-\d+$/.test(nodeId)) return 'section';
  return undefined;
}

/** Fixed page blocks. */
export const WIDGET_FOR_NODE: Record<string, string> = {
  requests: 'my_requests',
  approvals: 'pending_approvals',
  knowledge: 'most_read',
  assets: 'my_assets',
  cis: 'my_cis',
  'quick-incident': 'act_incident',
  'quick-service': 'act_service',
  'quick-knowledge': 'act_knowledge',
  'quick-ad': 'act_ad',
};

/** Catalogue elements an admin dropped. Anything absent keeps its existing editor. */
export const WIDGET_FOR_TYPE: Record<string, string> = {
  'c-requests': 'my_requests',
  'c-approvals': 'pending_approvals',
  'c-assets': 'my_assets',
  'c-knowledge': 'most_read',
  'c-announcements': 'announcements',
  'c-contact': 'contact_us',
  'c-services': 'featured_services',
  'c-cis': 'my_cis',
  /* The action cards are reachable from the palette now, so the dropped element resolves to the
     same spec as the fixed page block — one widget, two ways in, never two editors. */
  'act-incident': 'act_incident',
  'act-service': 'act_service',
  'act-knowledge': 'act_knowledge',
  'x-action-card': 'act_custom',
  'act-ad': 'act_ad',
  'b-text': 'text',
  'v-image': 'image',
  'b-button': 'button',
  'x-kpi': 'count_tile',
  // Collection widgets. `b-accordion` and `c-faq` are the same widget reached two ways.
  'c-faq': 'faq',
  /* ⚠️ No longer an alias of FAQ. They look alike but style differently — an accordion owns a
     collapsed and an expanded state, a FAQ does not. */
  'b-accordion': 'accordion',
  'b-list': 'list_el',
  'b-text-image': 'text_image',
  'b-card': 'card',
  'b-table': 'table',
  'v-slider': 'media_slider',
  'v-gallery': 'photo_gallery',
  // The new-element panels (NEW-ELEMENT-PANELS-SPEC) resolve through the same map.
  ...PANEL_FOR_TYPE,
};

/* ── gating (§8.1) ───────────────────────────────────────────────────────────
 *
 * This prototype has no permission or licence model, so the three gate KINDS are demonstrated
 * against a mock map. Flip an entry to false to see the closed treatment: a permission gate warns
 * and links to the exact setting, a module gate warns and does not, because there is nothing the
 * editor can toggle. A widget already on the page is NEVER silently removed when its gate closes —
 * it stays, flagged as hidden from requesters, naming the cause. */
export const GATE_STATE: Record<string, boolean> = {
  'Request module': true,
  'Allow Requester To Access My Approvals': true,
  'Allow Requester to Access My Assets': true,
  'Allow Requester to Access My CI': true,
  'Allow Requester To Access Knowledge': true,
  'Access Service Catalog': true,
  'Allow Requester to create Incident': true,
  'Access Knowledge': true,
};

export const gateOpen = (spec?: WidgetSpec) => !spec?.gate || GATE_STATE[spec.gate.setting] !== false;

export const GATE_COPY: Record<GateKind, (setting: string) => string> = {
  permission: (s) => `Requesters can only see this while “${s}” is on. It is off right now, so this widget is hidden from them.`,
  module: (s) => `This needs the ${s}, which is part of your licence rather than a switch — there is nothing to turn on here.`,
  feature: (s) => `“${s}” is not included in your plan. Your account team can add it.`,
};
