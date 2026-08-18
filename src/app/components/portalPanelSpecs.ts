/* Support Portal builder — the new-element panels (NEW-ELEMENT-PANELS-SPEC §3).
 *
 * These use the ACCORDION model, not the P1–P8 packs: Content first and always open, then only the
 * styling accordions that element actually needs, in panel order, with one opening by default.
 *
 * ⚠️ Blank in the §4 coverage matrix means ABSENT. A Spacer has no Content section because it has
 * nothing to author; a Divider has no padding box because a line has no inside. Rendering an empty
 * group instead would be the thing the spec spends its whole first section arguing against.
 *
 * This file covers §6's step 4 — the six elements with no collection. They are pure compositions of
 * the control kit and the shared groups, which is exactly why the spec sequences them first: if one
 * of them needs a control that does not exist, the kit was not finished.
 */

import type { WidgetField, WidgetSpec } from './portalWidgetSpec';

/* ── G1 — background & container (§2) ───────────────────────────────────────
 * Composed by the drawer when an accordion lists `G1`; declared here so the rows read in one place.
 * ⚠️ Video is deliberately not offered — the reference's own mapping specifies Color/Image only. */

/* ── shared rows ─────────────────────────────────────────────────────────── */

const alignmentFields: WidgetField[] = [{
  key: 'align', label: 'Alignment', control: 'segmented',
  options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }],
}];

/* ── §3.6 Divider ────────────────────────────────────────────────────────── */

export const DIVIDER_SPEC: WidgetSpec = {
  id: 'divider', name: 'Divider', group: 'Layout', reuse: 'many', family: 'flat',
  panel: {
    content: [
      { key: 'label', label: 'Label', control: 'text', help: 'Optional text sitting on the line.' },
      {
        key: 'labelPos', label: 'Label position', control: 'segmented', when: (c) => !!c.label,
        options: [{ value: 'center', label: 'Centre' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
      },
    ],
    accordions: [
      {
        id: 'style', open: true,
        fields: [
          /* The shape is CHOSEN BY LOOKING, in a popup of drawn lines — six options is past what a
             segmented control can hold (§3), and 'zigzag' as a word is a worse description of a
             zigzag than a zigzag is. */
          { key: 'lineStyle', label: 'Layout', control: 'lineStyle' },
          { key: 'lineColor', label: 'Colour', control: 'color' },
          { key: 'thickness', label: 'Line width', control: 'sliderUnit', min: 1, max: 8, unit: 'px' },
        ],
      },
      /* Stretch is the fourth option, not a separate Size row: a divider either sits at a width you
         gave it or fills its column, and two controls for one decision let them contradict. */
      {
        id: 'alignment',
        fields: [{
          key: 'align', label: 'Alignment', control: 'segmented',
          options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }, { value: 'stretch', label: 'Stretch' }],
        }],
      },
      { id: 'spacing', spacing: 'both' },
    ],
  },
  fields: [], packs: [],
  defaults: { label: '', labelPos: 'center', lineStyle: 'solid', thickness: 2, lineColor: '#94A3B8', width: 100, align: 'stretch' },
};

/* ── §3.7 Spacer ─────────────────────────────────────────────────────────── */

export const SPACER_SPEC: WidgetSpec = {
  id: 'spacer', name: 'Spacer', group: 'Basic', reuse: 'many', family: 'flat',
  panel: {
    /* ⚠️ NO content section. A spacer has nothing to author, only a size — so the panel opens
       directly on Size and says why in one line, rather than showing an empty group. */
    contentNote: 'A spacer has nothing to write — only a height. It adds vertical room where section padding is the wrong tool.',
    accordions: [
      {
        id: 'size', open: true, info: 'A spacer adds vertical room where section padding is the wrong tool.',
        fields: [
          { key: 'width', label: 'Width', control: 'sliderUnit', min: 10, max: 100, unit: '%' },
          { key: 'height', label: 'Height', control: 'sliderUnit', min: 8, max: 400, unit: 'px' },
        ],
      },
    ],
  },
  fields: [], packs: [],
  // No Layout, no Spacing, no Alignment: a spacer IS spacing.
  defaults: { width: 100, height: 200 },
};

/* ── §3.8 Large Title / Small Title ──────────────────────────────────────── */

const titleSpec = (id: string, name: string, text: string, level: string): WidgetSpec => ({
  id, name, group: 'Basic', reuse: 'many', family: 'flat',
  panel: {
    content: [
      { key: 'text', label: 'Text', control: 'text' },
      {
        key: 'level', label: 'Heading level', control: 'select',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        /* ⚠️ Level is document STRUCTURE — it drives screen readers and anchors. Size is
           typography, and lives in Style. Someone who wants smaller text must not be silently
           demoting an H2 to an H4. */
        help: 'Document structure, not size. Set the size on the text toolbar over the words themselves.',
      },
      /* ⚠️ Eyebrow, Sub-heading and Anchor id removed. A title element is the words and their
         level — an eyebrow and a sub-heading are two more titles, and stacking three text fields
         inside one element is how you end up unable to style the middle one. Place another Title
         above or below instead; each then gets its own toolbar and its own spacing. */
    ],
    accordions: [
      {
        id: 'style', open: true,
        /* ⚠️ NO G3 typography group. A title is a TEXT element, so its typeface, size, weight and
           colour are set on the floating toolbar over the words themselves. G1 stays — a background
           and a rule beneath are properties of the block, not of the type, and the toolbar has
           neither. */
        groups: ['G1'],
        fields: [
          { key: 'rule', label: 'Rule beneath', control: 'toggle' },
          { key: 'ruleColor', label: 'Rule colour', control: 'color', when: (c) => c.rule === true },
          { key: 'ruleThickness', label: 'Rule thickness', control: 'sliderUnit', min: 1, max: 8, unit: 'px', when: (c) => c.rule === true },
        ],
      },
      // Its own accordion for text-like elements, per the reference's Text Block. Justify included.
      {
        id: 'alignment',
        fields: [{
          key: 'align', label: 'Alignment', control: 'segmented',
          options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }, { value: 'justify', label: 'Justify' }],
        }],
      },
      { id: 'spacing', spacing: 'both' },
    ],
  },
  fields: [], packs: [],
  // No Layout and no Size — the reference's Text Block set is Style · Alignment · Spacing.
  defaults: { text, level, align: 'left', rule: false, ruleColor: '#E5E7EB', ruleThickness: 1 },
});

export const TITLE_LG_SPEC = titleSpec('title_lg', 'Large Title', 'Large Title', 'h2');
export const TITLE_SM_SPEC = titleSpec('title_sm', 'Small Title', 'Small Title', 'h3');

/* ── §3.13 Icon ──────────────────────────────────────────────────────────── */

export const ICON_SPEC: WidgetSpec = {
  id: 'icon_el', name: 'Icon', group: 'Visual', reuse: 'many', family: 'flat',
  panel: {
    content: [
      // The picker IS the Change-icon action — it shows what is chosen and opens the library.
      { key: 'icon', label: 'Icon', control: 'icon' },
      {
        key: 'a11yLabel', label: 'Alt text', control: 'text',
        /* ⚠️ Said out loud. Blank marks the mark decorative and hides it from screen readers, which
           is the right default for an ornament and the wrong one for a meaningful icon — so it is
           never a silent behaviour. */
        help: 'Shown if the icon does not load, and read out by screen readers. Leave blank only for decoration.',
      },
      {
        key: 'link', label: 'Link', control: 'select',
        options: [
          { value: 'none', label: 'Not a link' }, { value: 'url', label: 'External link' },
          { value: 'page', label: 'A page in this portal' }, { value: 'email', label: 'Compose an email' },
          { value: 'phone', label: 'Call a number' },
        ],
      },
      { key: 'url', label: 'URL', control: 'text', when: (c) => c.link === 'url' },
      { key: 'caption', label: 'Caption', control: 'text', help: 'Optional.' },
    ],
    accordions: [
      /* ⚠️ Layout is ONE choice from five drawn frames, not four independent switches. Shape, fill,
         border and ring offered separately let you build things that are not frames at all — a ring
         with no fill, a border on nothing — and then the panel has to explain itself. */
      { id: 'layout', open: true, fields: [{ key: 'frame', label: 'Layout', control: 'iconFrame' }] },
      {
        id: 'style',
        fields: [
          { key: 'iconColor', label: 'Icon colour', control: 'color' },
          // Absent on the bare frame: there is no box to fill or outline.
          { key: 'containerFill', label: 'Background colour', control: 'color', when: (c) => c.frame !== 'none' },
          { key: 'borderWidth', label: 'Border', control: 'borderRow', when: (c) => c.frame !== 'none' },
          { key: 'radius', label: 'Corner radius', control: 'radius', when: (c) => c.frame === 'rounded-fill' },
        ],
      },
      { id: 'alignment', fields: alignmentFields },
      { id: 'spacing', spacing: 'both' },
      {
        id: 'size',
        fields: [
          { key: 'iconSize', label: 'Width', control: 'sliderUnit', min: 12, max: 96, unit: 'px' },
          /* ⚠️ Height follows width unless it is set. An icon is square by nature, so a height that
             silently diverged would distort every glyph in the library. */
          { key: 'iconHeight', label: 'Height', control: 'sliderUnit', min: 12, max: 96, unit: 'px' },
        ],
      },
    ],
  },
  fields: [], packs: [],
  defaults: {
    a11yLabel: '', link: 'none', url: '', caption: '',
    frame: 'none',
    iconColor: '#3D8BD0', containerFill: '#EBF5FF',
    borderWidth: 0, borderColor: '#E5E7EB', radius: 8,
    iconSize: 24, iconHeight: 24, align: 'left',
  },
};

/* ── §3.14 Shape ─────────────────────────────────────────────────────────── */

export const SHAPE_SPEC: WidgetSpec = {
  id: 'shape_el', name: 'Shape', group: 'Visual', reuse: 'many', family: 'flat',
  panel: {
    content: [
      {
        key: 'shape', label: 'Shape', control: 'segmented',
        options: [{ value: 'rect', label: 'Rectangle' }, { value: 'circle', label: 'Circle' }, { value: 'triangle', label: 'Triangle' }, { value: 'wave', label: 'Wave' }],
      },
    ],
    contentNote: 'Decorative — hidden from screen readers.',
    accordions: [
      {
        id: 'style', open: true,
        fields: [
          { key: 'fill', label: 'Fill', control: 'color' },
          { key: 'strokeColor', label: 'Stroke colour', control: 'color' },
          { key: 'strokeWidth', label: 'Stroke width', control: 'sliderUnit', min: 0, max: 12, unit: 'px' },
          { key: 'radius', label: 'Corner radius', control: 'sliderUnit', min: 0, max: 48, unit: 'px', when: (c) => c.shape === 'rect' },
          { key: 'rotation', label: 'Rotation', control: 'sliderUnit', min: -180, max: 180, unit: '°' },
          { key: 'opacity', label: 'Opacity', control: 'sliderUnit', min: 0, max: 100, unit: '%' },
          {
            key: 'layer', label: 'Layer', control: 'segmented',
            options: [{ value: 'behind', label: 'Behind' }, { value: 'flow', label: 'In flow' }, { value: 'front', label: 'In front' }],
          },
        ],
      },
      // Margin only — a shape has no inside either.
      { id: 'spacing', spacing: 'margin' },
      {
        id: 'size',
        fields: [
          { key: 'shapeWidth', label: 'Width', control: 'sliderUnit', min: 10, max: 100, unit: '%' },
          { key: 'shapeHeight', label: 'Height', control: 'sliderUnit', min: 8, max: 400, unit: 'px' },
        ],
      },
      { id: 'alignment', fields: alignmentFields },
    ],
  },
  fields: [], packs: [],
  defaults: {
    shape: 'rect', fill: '#3D8BD0', strokeColor: '#3D8BD0', strokeWidth: 0,
    radius: 8, rotation: 0, opacity: 100, layer: 'flow',
    shapeWidth: 100, shapeHeight: 80, align: 'left',
  },
};

/* ── Navigation Links (Basic) ────────────────────────────────────────────────
 *
 * ⚠️ Its own element, NOT a Button action. A button has one destination; a nav is a SET of them,
 * ordered, and the set is the thing being authored. Folding it into Button would have meant
 * dropping five buttons in a row and calling that a menu. */

/* ── A card's own words ─────────────────────────────────────────────────────
 *
 * Two tiny panels so a title and a subtext can be selected and rewritten IN PLACE. ⚠️ The text
 * key writes to the CARD's config, not a store of its own — the words live on the card, and two
 * copies of one sentence is how a canvas and a panel start disagreeing.
 *
 * ⚠️ NO Style accordion. Typeface, size, weight and colour are on the floating text toolbar over
 * the selected words; a second set in the sidebar is two places to change one thing. */
const textSpec = (id: string, name: string, key: string): WidgetSpec => ({
  id, name, group: 'Basic', reuse: 'many', family: 'flat',
  panel: {
    content: [{ key, label: name, control: 'text' }],
    accordions: [
      { id: 'alignment', open: true, fields: alignmentFields },
      { id: 'spacing', spacing: 'both' },
    ],
  },
  fields: [], packs: [],
  defaults: {},
});

export const CARD_TITLE_SPEC = textSpec('card_title', 'Title', 'title');
export const CARD_SUB_SPEC = textSpec('card_sub', 'Subtext', 'sub');

export const PANEL_SPECS: WidgetSpec[] = [
  DIVIDER_SPEC, SPACER_SPEC, TITLE_LG_SPEC, TITLE_SM_SPEC, ICON_SPEC, SHAPE_SPEC,
  CARD_TITLE_SPEC, CARD_SUB_SPEC,
];

/** Palette element → panel spec. Separate from WIDGET_FOR_TYPE only for readability. */
export const PANEL_FOR_TYPE: Record<string, string> = {
  'l-divider': 'divider',
  'b-spacer': 'spacer',
  'b-large-title': 'title_lg',
  'b-small-title': 'title_sm',
  'v-icon': 'icon_el',
  'v-shape': 'shape_el',
};
