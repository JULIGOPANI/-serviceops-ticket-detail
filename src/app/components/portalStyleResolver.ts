/* Support Portal builder — the style inheritance engine (spec §1.1, §8.2).
 *
 * The rule the whole drawer rests on: **a child inherits every value from its parent layer until it
 * explicitly overrides one.** That is what makes "Revert to inherited" safe — reverting deletes the
 * local key and the value falls back to whatever the parent says NOW, so the link is never severed
 * and an editor can always undo a local change without knowing what the parent value was.
 *
 * ⚠️ The chain is resolved per KEY, not per node. A card that overrides its background still
 * inherits its padding. Storing a whole resolved style object on the child would freeze the
 * parent's values at the moment of the first edit — which is exactly the one-way override §8.2
 * calls a support-ticket generator.
 *
 * The layers, outermost first: page → section → column → widget → item → sub-element. `nodePath()`
 * already walks the registry, so the only thing added here is the synthetic PAGE root: the page is
 * a real editing layer (L0) but it is not a node on the canvas.
 */

import { nodePath } from './portalPageModel';
import type { NodeStyle, PortalStyles, RoleType, TypeRole } from './portalPageModel';

/** L0. Not in PORTAL_NODES because nothing on the canvas draws it, but it owns the theme. */
export const PAGE_ID = 'page';

/* ── The theme: the value every chain terminates in ──────────────────────────
 *
 * These are the defaults the spec's tables call `inherit`. Being a real object rather than a set of
 * `?? fallback` expressions scattered through the packs is what lets the drawer TELL you where a
 * value comes from — "Theme" is a legitimate answer, "undefined" is not. */
export const PORTAL_THEME: NodeStyle = {
  align: 'left',
  // P1
  bgFill: 'none',
  bg: '#FFFFFF',
  bgOverlay: 0,
  bgScope: 'section',
  borderMode: 'line',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  borderStyle: 'solid',
  radius: 8,
  elevation: 'none',
  // P2
  widthPct: 100,
  spaceTop: 0,
  spaceBottom: 0,
  // P4
  arrangement: 'list',
  columns: 3,
  gap: 8,
  density: 'comfortable',
  dividers: true,
  itemAlign: 'left',
  equalHeight: false,
  // P5
  ratio: 'Original',
  fit: 'cover',
  focal: 'center',
  shape: 'rounded',
  mediaRadius: 8,
  mediaOverlay: 0,
  captionPos: 'below',
  // P6
  iconSize: 20,
  iconColor: '#3D8BD0',
  iconShape: 'none',
  iconFill: '#EBF5FF',
  iconPos: 'left',
  // P7
  hover: 'tint',
  pressed: 'tint',
  transition: 'normal',
  // P8
  emptyMsg: 'No Data Found',
  emptyMode: 'show',
  loading: 'skeleton',
};

/** Per-role type defaults. `font: 'inherit'` is the portal-wide typeface from the Page layer. */
export const THEME_TYPE: Record<TypeRole, Required<Omit<RoleType, 'color'>> & { color: string }> = {
  title:    { font: 'inherit', size: 100, weight: 'bold',    color: '#364658', align: 'left', lineHeight: 'normal', maxLines: 0 },
  subtitle: { font: 'inherit', size: 100, weight: 'medium',  color: '#475467', align: 'left', lineHeight: 'normal', maxLines: 0 },
  body:     { font: 'inherit', size: 100, weight: 'regular', color: '#364658', align: 'left', lineHeight: 'normal', maxLines: 0 },
  meta:     { font: 'inherit', size: 100, weight: 'regular', color: '#7B8FA5', align: 'left', lineHeight: 'normal', maxLines: 0 },
  link:     { font: 'inherit', size: 100, weight: 'medium',  color: '#3D8BD0', align: 'left', lineHeight: 'normal', maxLines: 0 },
};

/** The base px each role renders at before P3's size percentage scales it. */
export const ROLE_BASE_PX: Record<TypeRole, number> = {
  title: 16, subtitle: 14, body: 13, meta: 12, link: 13,
};

export const ROLE_LABEL: Record<TypeRole, string> = {
  title: 'Title', subtitle: 'Subtitle', body: 'Body', meta: 'Meta', link: 'Link',
};

/* ── Resolution ───────────────────────────────────────────────────────────── */

export type StyleSource = 'own' | 'inherited' | 'theme';

export interface Resolved<T> {
  value: T;
  source: StyleSource;
  /** Which node the value came from, when it was inherited. */
  fromId?: string;
  /** That node's human name, for "Inherited from Cards Row". */
  fromName?: string;
}

/** The ancestor chain including the synthetic page root, outermost first. */
export function styleChain(nodeId: string): { id: string; name: string }[] {
  const path = nodePath(nodeId).map((n) => ({ id: n.id, name: n.name }));
  return [{ id: PAGE_ID, name: 'Page' }, ...path];
}

/**
 * Where does `key` actually come from for this node?
 *
 * Walks the chain from the node OUTWARD, so the nearest explicit value wins, and terminates in the
 * theme. `source` is what the drawer badges: `own` = this layer set it, `inherited` = an ancestor
 * did, `theme` = nobody has, it is the portal default.
 */
export function resolve<K extends keyof NodeStyle>(
  styles: PortalStyles,
  nodeId: string,
  key: K,
): Resolved<NonNullable<NodeStyle[K]>> {
  const chain = styleChain(nodeId);
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const v = styles[chain[i].id]?.[key];
    if (v !== undefined) {
      const own = i === chain.length - 1;
      return {
        value: v as NonNullable<NodeStyle[K]>,
        source: own ? 'own' : 'inherited',
        fromId: own ? undefined : chain[i].id,
        fromName: own ? undefined : chain[i].name,
      };
    }
  }
  return { value: PORTAL_THEME[key] as NonNullable<NodeStyle[K]>, source: 'theme' };
}

/** Convenience for the common "I only need the value" case. */
export const styleValue = <K extends keyof NodeStyle>(styles: PortalStyles, id: string, key: K) =>
  resolve(styles, id, key).value;

/** The same walk for one field of one typography role. */
export function resolveType(
  styles: PortalStyles,
  nodeId: string,
  role: TypeRole,
  key: keyof RoleType,
): Resolved<NonNullable<RoleType[keyof RoleType]>> {
  const chain = styleChain(nodeId);
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const v = styles[chain[i].id]?.type?.[role]?.[key];
    if (v !== undefined) {
      const own = i === chain.length - 1;
      return {
        value: v as NonNullable<RoleType[keyof RoleType]>,
        source: own ? 'own' : 'inherited',
        fromId: own ? undefined : chain[i].id,
        fromName: own ? undefined : chain[i].name,
      };
    }
  }
  return {
    value: THEME_TYPE[role][key as keyof typeof THEME_TYPE.title] as NonNullable<RoleType[keyof RoleType]>,
    source: 'theme',
  };
}

/** Every P3 field for one role, already resolved — what the preview renders text with. */
export function roleStyle(styles: PortalStyles, nodeId: string, role: TypeRole): React.CSSProperties {
  const g = <K extends keyof RoleType>(k: K) => resolveType(styles, nodeId, role, k).value as RoleType[K];
  const size = (g('size') as number) ?? 100;
  const weight = g('weight');
  const lh = g('lineHeight');
  const maxLines = (g('maxLines') as number) ?? 0;
  const css: React.CSSProperties = {
    fontSize: `${Math.round((ROLE_BASE_PX[role] * size) / 100)}px`,
    fontWeight: weight === 'bold' ? 700 : weight === 'medium' ? 500 : 400,
    color: g('color') as string,
    textAlign: g('align') as React.CSSProperties['textAlign'],
    lineHeight: lh === 'tight' ? 1.25 : lh === 'relaxed' ? 1.75 : 1.5,
  };
  const font = g('font') as string;
  if (font && font !== 'inherit') css.fontFamily = font;
  if (maxLines > 0) {
    css.display = '-webkit-box';
    css.WebkitBoxOrient = 'vertical';
    css.WebkitLineClamp = maxLines;
    css.overflow = 'hidden';
  }
  return css;
}

/* ── Painting ─────────────────────────────────────────────────────────────
 *
 * ⚠️ Only values a HUMAN chose are painted — a key whose nearest source is the theme is skipped.
 *
 * That is not a shortcut, it is what keeps inheritance honest against a page whose resting look
 * comes from Tailwind classes rather than from this object. If the theme's `radius: 8` were emitted
 * as inline CSS, every card on the page would be restyled the moment the engine shipped, and the
 * theme table would be silently competing with the class list for the same property. Skipping
 * theme-sourced keys means: the page looks exactly as it did until someone edits something, and
 * then the edit paints — at whichever layer they made it, on every descendant that has not
 * overridden it. The drawer still SHOWS the theme value, which is truthful: it is what the class is
 * already doing.
 */

/** Reads one key only if somebody actually set it, at this layer or an ancestor. */
export function chosen<K extends keyof NodeStyle>(styles: PortalStyles, id: string, key: K): NodeStyle[K] | undefined {
  const r = resolve(styles, id, key);
  return r.source === 'theme' ? undefined : r.value;
}

/** The container CSS for a node: everything P1/P5 own, resolved through the chain. */
export function containerCss(styles: PortalStyles, id: string): React.CSSProperties {
  const css: React.CSSProperties = {};
  const g = <K extends keyof NodeStyle>(k: K) => chosen(styles, id, k);

  const fill = g('bgFill');
  if (fill === 'color') css.background = (g('bg') as string) ?? undefined;
  else if (fill === 'image') {
    const img = g('bgImage') as string | undefined;
    const overlay = ((g('bgOverlay') as number) ?? 0) / 100;
    if (img) {
      css.backgroundImage = overlay > 0
        ? `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})), url(${img})`
        : `url(${img})`;
      css.backgroundSize = 'cover';
      css.backgroundPosition = 'center';
    }
  } else if (fill === undefined) {
    // Legacy: `bg` set on its own by the old colour field, before P1 existed.
    const bg = g('bg');
    if (bg) css.background = bg as string;
  }

  const border = g('borderMode');
  if (border === 'none') css.border = 'none';
  else if (border === 'line') {
    css.borderWidth = `${(g('borderWidth') as number) ?? 1}px`;
    css.borderStyle = (g('borderStyle') as string) ?? 'solid';
    css.borderColor = (g('borderColor') as string) ?? '#E5E7EB';
  } else if (border === 'shadow') {
    css.border = 'none';
    css.boxShadow = '0 1px 2px rgba(16,24,40,0.06), 0 4px 12px rgba(16,24,40,0.08)';
  } else if (g('borderWidth')) {
    css.borderWidth = `${g('borderWidth')}px`;
    css.borderStyle = (g('borderStyle') as string) ?? 'solid';
    css.borderColor = (g('borderColor') as string) ?? '#E5E7EB';
  }

  const elevation = g('elevation');
  if (elevation === 'subtle') css.boxShadow = '0 1px 2px rgba(16,24,40,0.05)';
  else if (elevation === 'raised') css.boxShadow = '0 4px 6px -2px rgba(16,24,40,0.06), 0 12px 20px -4px rgba(16,24,40,0.12)';

  const corners = g('corners');
  if (corners) {
    css.borderTopLeftRadius = `${corners.tl}px`; css.borderTopRightRadius = `${corners.tr}px`;
    css.borderBottomRightRadius = `${corners.br}px`; css.borderBottomLeftRadius = `${corners.bl}px`;
  } else {
    const r = g('radius');
    if (r !== undefined) css.borderRadius = `${r}px`;
  }

  /* ⚠️ PADDING IS OWN-ONLY, never resolved through the chain — the same rule height already has.
     Inherited, a section's 24px landed on its heading, its subtitle, its search box and every card
     inside it, so setting the banner's left padding indented all of its contents by the same amount
     ON TOP of moving the band's own edge. Padding is the space between a box and ITS contents; it
     is meaningless as a statement about somebody else's box, which is exactly why it cannot
     cascade. `styles[id]` reads only what this node set. */
  const own = styles[id];
  const pad = own?.padding;
  if (pad) {
    /* ⚠️ PER SIDE, and only where a value exists. Writing all four unconditionally meant an unset
       side emitted `0`, which beats the element's own class — so setting the top padding of a
       section removed its side gutters. Undefined here leaves that edge to whatever paints it. */
    if (pad.top !== undefined) css.paddingTop = `${pad.top}px`;
    if (pad.bottom !== undefined) css.paddingBottom = `${pad.bottom}px`;
    if (pad.left !== undefined) css.paddingLeft = `${pad.left}%`;
    if (pad.right !== undefined) css.paddingRight = `${pad.right}%`;
  } else {
    const py = own?.padY;
    if (py !== undefined) { css.paddingTop = `${py}px`; css.paddingBottom = `${py}px`; }
  }

  const align = g('align');
  if (align) css.textAlign = align;
  /* ⚠️ HEIGHT IS OWN-ONLY, never resolved through the chain, and it is applied in `sizeOf` — not
     here. Resolving it meant a height dragged on a widget was INHERITED by everything inside it:
     the card's title node came out 386px tall, which pushed the count and "View all" to the bottom
     of the card and squeezed the list of approvals out of sight entirely. A height is a statement
     about one box, the way width and flex already are; the two are listed together in `sizeOf` for
     exactly this reason. */

  // Legacy text keys, still written by the canvas's dark rich-text toolbar.
  const color = g('color'); if (color) css.color = color as string;
  /* ⚠️ Painted as backgroundColor on the TEXT node only. It is deliberately separate from bgFill —
     a highlight sits behind the words, a fill sits behind the block, and one key doing both would
     mean highlighting a heading also tinted the card around it. */
  const textBg = g('textBg'); if (textBg) css.backgroundColor = textBg as string;
  const fs = g('fontSize'); const heading = g('heading');
  if (fs) css.fontSize = `${fs}px`;
  else if (heading) css.fontSize = `${HEADING_SIZE_MAP[heading as string] ?? 15}px`;
  const bold = g('bold'); if (bold !== undefined) css.fontWeight = bold ? 700 : undefined;
  if (g('italic')) css.fontStyle = 'italic';
  if (g('underline')) css.textDecoration = 'underline';

  return css;
}

/** Kept local so the resolver does not import the whole page model for one lookup. */
const HEADING_SIZE_MAP: Record<string, number> = { PAR: 15, H1: 34, H2: 28, H3: 22, H4: 18, H5: 16, H6: 13 };

/** The wrapper CSS: P2's outer spacing and width share. */
export function boxCss(styles: PortalStyles, id: string): React.CSSProperties {
  const css: React.CSSProperties = {};
  const wp = chosen(styles, id, 'widthPct');
  if (wp !== undefined && wp < 100) { css.width = `${wp}%`; css.maxWidth = '100%'; css.flex = '0 0 auto'; }
  const st = chosen(styles, id, 'spaceTop');
  if (st) css.marginTop = `${st}px`;
  const sb = chosen(styles, id, 'spaceBottom');
  if (sb) css.marginBottom = `${sb}px`;
  return css;
}

/* ── Writing ─────────────────────────────────────────────────────────────── */

/** Reverting DELETES the key rather than writing the parent's current value — that is the whole
 *  difference between a link and a copy. Writing the value would look identical today and drift
 *  the moment the parent changes. */
export function revertKeys(style: NodeStyle | undefined, keys: (keyof NodeStyle)[]): NodeStyle {
  const next = { ...(style ?? {}) };
  keys.forEach((k) => { delete next[k]; });
  return next;
}

export function revertRole(style: NodeStyle | undefined, role: TypeRole): NodeStyle {
  const next = { ...(style ?? {}) };
  if (next.type) {
    const type = { ...next.type };
    delete type[role];
    next.type = type;
  }
  return next;
}

/** True when this layer has set any of `keys` itself — drives the group's Overridden badge. */
export const hasOwn = (styles: PortalStyles, id: string, keys: (keyof NodeStyle)[]) =>
  keys.some((k) => styles[id]?.[k] !== undefined);

export const hasOwnRole = (styles: PortalStyles, id: string, role: TypeRole) => {
  const r = styles[id]?.type?.[role];
  return !!r && Object.values(r).some((v) => v !== undefined);
};
