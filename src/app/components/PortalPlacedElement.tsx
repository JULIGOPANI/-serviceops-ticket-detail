import type { ReactNode } from 'react';
import { Image as ImageIcon, Search, Star } from 'lucide-react';
import { PORTAL_ELEMENTS } from './supportPortalData';
import { ACTION_TYPES, fillCss, renderSpec } from './portalPageModel';
import type { PlacedElement } from './portalPageModel';
import { COLLECTION_RENDERERS } from './PortalCollectionRender';
import { ImageUploadZone } from './PortalControls';
import { useCanvas } from './PortalCanvas';
import { containerCss } from './portalStyleResolver';

import { LineMark } from './PortalLineStyles';
import { Sel } from './PortalCanvas';
import type { LineStyle } from './PortalLineStyles';
import { iconNode } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';

/* A dropped element, in its BLANK state.
 *
 * Nothing here carries content or styling — that is the admin's job once it is on the page. What it
 * does carry is the element's own shape, so a Text reads as text and a card reads as a card the
 * moment it lands. Blank is not the same as featureless: a placeholder that looks like the thing
 * it will become is what makes the canvas legible while it is half-built. */

const empty = 'text-[13px] text-[#9CA3AF]';

/** The chosen container styling and nothing else — no resting classes, so an element that has
 *  set none of it is untouched. Used where a widget paints its own chrome and only needs the
 *  block-level Fill / Border / Radius laid over the top. */
function StyledBox({ children, id }: { children: React.ReactNode; id: string }) {
  const { styles } = useCanvas();
  const css = containerCss(styles ?? {}, id);
  return Object.keys(css).length ? <div style={css}>{children}</div> : <>{children}</>;
}

/** Card-shaped elements get a surface; everything else sits directly on the section.
 *
 * ⚠️ It resolves from STYLES, not from widget config. The P1 pack writes bgFill / bg / radius /
 * borderMode with setStyle, so a Surface reading cfg.fill and cfg.radius was looking in the wrong
 * store under the wrong names — which is why Fill, Border and Corner radius were storable and
 * invisible on every card-shaped element. containerCss already knows how to turn those keys into
 * CSS, and it deliberately emits nothing for values nobody chose, so an untouched element keeps
 * exactly the resting classes below. */
function Surface({ children, id }: { children: React.ReactNode; id: string }) {
  const { styles } = useCanvas();
  /* ⚠️ Padding and height come from the node's own style and land HERE, on the painted box. Sel
     deliberately withholds them for exactly this reason — see paintsOwnSurface. `minHeight` rather
     than `height` so a card asked to be taller grows and its contents stay laid out inside it,
     instead of the card keeping its size while a wrapper crops it. */
  const own = styles?.[id] ?? {};
  const pad = own.padding;
  const inner: React.CSSProperties = {
    ...(pad?.top !== undefined ? { paddingTop: pad.top } : {}),
    ...(pad?.bottom !== undefined ? { paddingBottom: pad.bottom } : {}),
    ...(pad?.left !== undefined ? { paddingLeft: `${pad.left}%` } : {}),
    ...(pad?.right !== undefined ? { paddingRight: `${pad.right}%` } : {}),
    ...(own.height !== undefined ? { minHeight: own.height } : {}),
  };
  const css = { ...containerCss(styles ?? {}, id), ...inner };
  const cls = [
    css.borderRadius === undefined ? "rounded-lg" : "",
    css.borderWidth === undefined ? "border border-[#E5E7EB]" : "",
    css.background === undefined && css.backgroundColor === undefined ? "bg-white" : "",
    /* The resting 16px only while nobody has set their own — otherwise the class would win on the
       sides the slider left alone and the two would disagree edge by edge. */
    pad ? "" : "p-4",
    "flex flex-col",
  ].filter(Boolean).join(" ");
  return <div className={cls} style={css}>{children}</div>;
}

/* The four spec-driven element types that render from their own config rather than the generic
   title/description placeholder. Returns null for everything else, which falls through to the
   blank states below. */
const BTN_SIZE: Record<string, string> = { sm: 'h-7 px-3 text-[12px]', md: 'h-9 px-4 text-[13px]', lg: 'h-11 px-5 text-[14px]' };

/* ⚠️ `nodeId` is threaded in so the words inside an element can be their OWN nodes. Without it the
   whole element was the smallest selectable thing, so a KPI's label or a custom card's title could
   be read on the canvas and changed only from the panel — which is exactly the knowledge a canvas
   exists to make unnecessary. The suffix matches the config key it writes. */
function specDrivenBody(type: string, cfg: Record<string, unknown> | undefined, glyph: React.ReactNode, nodeId: string) {
  if (!cfg) return null;
  /* eslint-disable-next-line react-hooks/rules-of-hooks -- called unconditionally from one caller. */
  const { enabled, select, pickIcon, styles } = useCanvas();
  const ownStyle = styles?.[nodeId];
  const T = ({ part, children, ...rest }: { part: string; children: React.ReactNode } & React.ComponentProps<typeof Sel>) =>
    <Sel id={`${nodeId}-${part}`} {...rest}>{children}</Sel>;

  if (type === 'b-text') {
    const html = String(cfg.html ?? '');
    if (!html) return null;
    return (
      <div
        style={{
          textAlign: cfg.textAlign as never,
          columnCount: cfg.textCols === '2' ? 2 : undefined,
          fontFamily: cfg.font === 'Inherit from theme' ? undefined : (cfg.font as string),
          fontWeight: ({ Light: 300, Normal: 400, Medium: 500, Semibold: 600, Bold: 700 } as Record<string, number>)[String(cfg.weight ?? 'Normal')],
          fontSize: Number(cfg.size ?? 15),
          color: String(cfg.color ?? '#364658'),
          /* Stored as a PERCENT so the slider reads in whole numbers; a 1.6 on a slider is a
             number nobody can aim at. */
          lineHeight: Number(cfg.lineHeight ?? 160) / 100,
          letterSpacing: Number(cfg.letterSpacing ?? 0) ? `${Number(cfg.letterSpacing)}px` : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  /* A divider IS its configuration — there is no meaningful empty state for a line, so it renders
     from cfg the moment it lands. Stretch is an alignment value, not a separate width control. */
  if (type === 'l-divider') {
    const align = String(cfg.align ?? 'stretch');
    const stretch = align === 'stretch';
    return (
      <span
        className="block w-full"
        style={{ textAlign: stretch ? undefined : (align as never) }}
      >
        <span
          className="inline-block align-middle"
          style={{ width: stretch ? '100%' : `${Number(cfg.width ?? 100)}%` }}
        >
          <LineMark
            style={(cfg.lineStyle as LineStyle) ?? 'solid'}
            color={String(cfg.lineColor ?? '#94A3B8')}
            thickness={Number(cfg.thickness ?? 2)}
          />
        </span>
      </span>
    );
  }

  /* ⚠️ A spacer is blank by design, so on the live portal it is nothing at all. In the EDITOR it
     still has to be selectable, which is why it keeps its box here rather than carrying a
     "show while editing" switch — an invisible element you cannot click is not a setting anybody
     wants off. `Sel` supplies the outline; this only owns the size. */
  if (type === 'b-spacer') {
    return <span className="block" style={{ width: `${Number(cfg.width ?? 100)}%`, height: Number(cfg.height ?? 200) }} />;
  }

  /* ⚠️ Drawn to match the page's OWN action cards, not merely similar to them. A dropped Action
     Card that looked different from New Incident sitting three inches above it would read as a
     second, worse kind of card — so this is the same surface, the same icon badge and the same
     title/subtitle pair the quick row renders. */
  /* ⚠️ ALL the action types, not just the palette's custom one. Same branch, same card, same
     config keys — which is what makes AD Self Service identical to Request Service rather than
     merely described as identical. */
  if (ACTION_TYPES.has(type)) {
    /* The card TEMPLATE decides where the icon sits and whether there is one — the same four
       shapes the sections and Featured Services use. iconPos remains the fallback for a card that
       has never had a template picked. */
    const tpl = String(cfg.cardTemplate ?? (cfg.iconPos === 'top' ? 'top' : 'left'));
    const top = tpl === 'top';
    const iconRight = tpl === 'right';
    const noIcon = tpl === 'none';
    const centre = top;
    const bw = Number(cfg.borderWidth ?? 0);
    return (
      <div
        style={{
          /* ⚠️ Through the SAME fillCss the built-in cards use. Hand-rolled here, this branch read
             `fill === 'color'` and never looked at `bgImage` at all — so the Image option in its own
             Style accordion did nothing, on the one element whose whole job is to be a tile. */
          /* LONGHAND defaults. A `background` or `border` shorthand here is expanded by the
             browser into its longhands, so any longhand arriving after it — even an absent one —
             wipes what the shorthand set. */
          backgroundColor: '#FFFFFF',
          borderWidth: 1, borderStyle: 'solid', borderColor: '#E5E7EB',
          /* ⚠️ The node's own padding and dragged height land HERE, on the painted card — Sel
             withholds both for this node (paintsOwnSurface). The `p-4` class stays, so sides the
             slider never touched keep their resting 16px instead of collapsing to zero. */
          ...(() => { const pad = ownStyle?.padding; const h = ownStyle?.height; return {
            ...(pad?.top !== undefined ? { paddingTop: pad.top } : {}),
            ...(pad?.bottom !== undefined ? { paddingBottom: pad.bottom } : {}),
            ...(pad?.left !== undefined ? { paddingLeft: `${pad.left}%` } : {}),
            ...(pad?.right !== undefined ? { paddingRight: `${pad.right}%` } : {}),
            ...(h !== undefined ? { minHeight: h } : {}),
          }; })(),
          /* No radius here — `rounded-lg` on the class list, exactly as the built-in quick cards
             have it, so an untouched card is 10px on both paths. fillCss still overrides it the
             moment a fill is chosen, which is the only time the panel offers the control. */
          ...fillCss(cfg),
          ...(bw > 0 ? { borderWidth: bw, borderStyle: 'solid', borderColor: String(cfg.borderColor ?? '#E5E7EB') } : {}),
          minHeight: Number(cfg.minHeight) || undefined,
        }}
        className={`flex h-full gap-3 rounded-lg p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.06)] ${
          top ? 'flex-col' : iconRight ? 'flex-row-reverse items-center' : 'items-center'
        } ${centre ? 'items-center text-center' : ''}`}
      >
        {/* ⚠️ The icon is its own LAYER and opens the picker in place, exactly as the built-in
            quick-action cards do. On a placed card it was the one part you could see and not touch:
            you had to know it lived in the panel, which is the knowledge a canvas exists to remove.
            Selecting it and opening the grid are ONE gesture, because an icon has exactly one thing
            to change. */}
        {!noIcon && <Sel id={`${nodeId}-icon`} className="flex-shrink-0">
          <span
            role={enabled ? 'button' : undefined}
            onClick={enabled ? (ev) => { ev.stopPropagation(); select(`${nodeId}-icon`); pickIcon(nodeId, (ev.currentTarget as HTMLElement).getBoundingClientRect()); } : undefined}
            title={enabled ? 'Click to change this icon' : undefined}
            className="flex size-11 items-center justify-center rounded bg-[#F1F5F9] text-[#475467]"
          >
            {glyph ?? <Star size={22} />}
          </span>
        </Sel>}
        <span className="min-w-0 flex-1">
          <T part="title" className="block">
            <span className="block truncate text-[16px] font-semibold text-[#364658]">{String(cfg.title ?? 'Action card')}</span>
          </T>
          <T part="sub" className="block">
            <span className="block truncate text-[13px] text-[#7B8FA5]">{String(cfg.sub ?? 'Add a subtext')}</span>
          </T>
        </span>
      </div>
    );
  }

  if (type === 'b-button') {
    const style = String(cfg.style ?? 'primary');
    const label = <T part="label">{String(cfg.label ?? 'Button')}</T>;
    const common = `inline-flex items-center justify-center gap-2 font-medium ${BTN_SIZE[String(cfg.size ?? 'md')]} ${cfg.fullWidth ? 'w-full' : ''}`;
    /* ⚠️ The fallback is the THEME's variable, not a literal: an untouched button has to follow the
       theme's button style, while one that set its own radius keeps it. A hard 6 made every button
       opt out of the theme by default. */
    const radius = { borderRadius: cfg.radius != null ? `${Number(cfg.radius)}px` : 'var(--portal-btn-radius, 6px)' };
    /* Each style has its OWN inherited text colour — white reads on a filled button and is
       invisible on an outline one. Falling back per style is what "inherit from theme per style"
       means; a single stored default cannot express it. */
    const text = (cfg.textColor as string) ?? (style === 'primary' || style === 'icon' ? '#FFFFFF' : '#3D8BD0');
    const fill = (cfg.fillColor as string) ?? 'var(--portal-accent, #3D8BD0)';
    /* The Button text tab. Every row of it lands on the label — a typography control that changes
       nothing is the exact thing §8.4 rule 1 forbids. */
    const on = Array.isArray(cfg.fontFormat) ? (cfg.fontFormat as string[]) : [];
    const face: React.CSSProperties = {
      fontFamily: cfg.font === 'Inherit from theme' ? undefined : (cfg.font as string),
      fontWeight: on.includes('Bold') ? 700
        : ({ Light: 300, Normal: 400, Medium: 500, Semibold: 600, Bold: 700 } as Record<string, number>)[String(cfg.fontWeight ?? 'Medium')],
      fontSize: cfg.fontSize ? Number(cfg.fontSize) : undefined,
      textDecoration: on.includes('Underline') ? 'underline' : undefined,
      fontStyle: on.includes('Italic') ? 'italic' : undefined,
      justifyContent: ({ left: 'flex-start', center: 'center', right: 'flex-end' } as Record<string, string>)[String(cfg.textAlign ?? 'center')],
    };
    let btn: ReactNode;
    if (style === 'icon') {
      btn = <span title={String(cfg.label ?? 'Button')} style={{ ...radius, ...face, background: fill, color: text }} className="inline-flex size-9 items-center justify-center">{glyph ?? '★'}</span>;
    } else if (style === 'link') {
      btn = <span style={{ ...face, color: text }} className="underline">{glyph}{label}</span>;
    } else if (style === 'outline') {
      btn = <span style={{ ...radius, ...face, borderColor: (cfg.borderColor as string) ?? '#3D8BD0', color: text }} className={`${common} border bg-white`}>{glyph}{label}</span>;
    } else {
      btn = <span style={{ ...radius, ...face, background: fill, color: text }} className={common}>{glyph}{label}</span>;
    }
    /* A button is inline, so it can only be placed by the block around it — which is why Alignment
       lives on the button rather than being something you reach for on its column. */
    return <span className="block" style={{ textAlign: (cfg.contentAlign as never) ?? 'left' }}>{btn}</span>;
  }

  if (type === 'v-image') {
    const src = String(cfg.src ?? '');
    const caption = String(cfg.caption ?? '');
    /* ⚠️ The four templates the action card uses, meaning the same four things: where the picture
       sits relative to its words. 'top' is the default — a picture with its caption underneath is
       what a caption IS — and 'none' is Text only, where the caption carries the block on its own. */
    const tpl = String(cfg.template ?? 'top');
    const stacked = tpl === 'top' || tpl === 'none';
    const bw = Number(cfg.borderWidth ?? 0);
    /* ⚠️ Nothing to draw only when there is NEITHER a picture nor words. A caption written
       before the file is uploaded used to render nothing at all, so the text you had just typed
       vanished and the element looked broken rather than unfinished. */
    if (!src && !caption) return null;
    const picture = tpl === 'none' || !src ? null : (
      <img
        src={src}
        /* ⚠️ The alt text IS what the browser shows when the file will not load, so it is the
           same value doing both jobs — not a caption and not a tooltip. */
        alt={String(cfg.alt ?? '')}
        style={{
          borderRadius: Number(cfg.radius ?? 8),
          ...(bw > 0 ? { border: `${bw}px solid ${String(cfg.borderColor ?? '#E5E7EB')}` } : {}),
        }}
        className="block w-full object-cover"
      />
    );
    /* ⚠️ RICH, so it is rendered as markup and edited in the panel's writing surface. A caption
       carrying a link or an emphasised word had nowhere to live while this was one line of text. */
    /* ⚠️ NOT wrapped in an inner div any more. Sel turns a selected text node into the
       contentEditable itself, and an element whose only child is a `dangerouslySetInnerHTML` div
       gives the caret a box it cannot leave — you could type, and the markup you typed was thrown
       away because the editable surface and the rendered one were two different elements. Rendering
       the HTML straight into Sel's own child makes the thing you edit the thing you see. */
    const words = caption ? (
      <T part="caption" className="portal-caption min-w-0 flex-1 text-[12px] leading-[1.55] text-[#7B8FA5]">
        <span dangerouslySetInnerHTML={{ __html: caption }} />
      </T>
    ) : null;
    return (
      <figure className={`m-0 flex min-w-0 gap-2.5 ${
        stacked ? 'flex-col' : tpl === 'right' ? 'flex-row-reverse items-start' : 'flex-row items-start'
      }`}>
        {/* ⚠️ Side by side the picture takes a SHARE, not its natural width — an image beside text
            with no basis takes the whole row and leaves the caption a column of single letters. */}
        {picture && <span className={stacked ? 'block min-w-0' : 'block w-2/5 min-w-0 flex-shrink-0'}>{picture}</span>}
        {words}
      </figure>
    );
  }

  if (type === 'x-kpi') {
    const noIcon = cfg.layout === 'none';
    const top = cfg.layout === 'top';
    return (
      <div className={`flex gap-3 ${top ? 'flex-col' : 'items-center'}`}>
        {!noIcon && (
          <Sel id={`${nodeId}-icon`} className="flex-shrink-0">
            <span
              role={enabled ? 'button' : undefined}
              onClick={enabled ? (ev) => { ev.stopPropagation(); select(`${nodeId}-icon`); pickIcon(nodeId, (ev.currentTarget as HTMLElement).getBoundingClientRect()); } : undefined}
              title={enabled ? 'Click to change this icon' : undefined}
              className="flex size-11 items-center justify-center rounded bg-[#F1F5F9] text-[#475467]"
            >{glyph ?? '#'}</span>
          </Sel>
        )}
        <span className="min-w-0">
          <span style={{ fontSize: `${Math.round((16 * Number(cfg.numberSize ?? 180)) / 100)}px`, color: String(cfg.numberColor ?? '#364658') }} className="block font-semibold leading-none">12</span>
          <T part="label" className="mt-1 block">
            <span style={{ color: String(cfg.labelColor ?? '#7B8FA5') }} className="block truncate text-[13px]">{String(cfg.label ?? 'Open requests')}</span>
          </T>
        </span>
      </div>
    );
  }

  return null;
}

function PlacedBody({ item, icon, text, cfg }: {
  item: PlacedElement;
  icon?: IconChoice;
  text?: { title?: string; desc?: string };
  /** Widget config, for the element types the specification covers (spec §9). */
  cfg?: Record<string, unknown>;
}) {
  const def = PORTAL_ELEMENTS.find((e) => e.id === item.type);
  const spec = renderSpec(item.type);
  const label = def?.name ?? item.name;
  const glyph = iconNode(icon, 20);

  /* ⚠️ A widget the spec drives renders from its CONFIG, not from the generic title/description
     store — otherwise its drawer would look like it worked and change nothing, which §8.4 rule 1
     exists to prevent. Only the types in WIDGET_FOR_TYPE reach this branch. */
  /* A collection widget draws itself — it owns items, arrangement and its own chrome, so it goes
     straight onto the section rather than inside the generic card surface. */
  const Collection = COLLECTION_RENDERERS[item.type];
  /* ⚠️ Wrapped in StyledBox, not returned bare. A collection owns its ITEMS and their arrangement,
     which is why it does not sit inside the generic Surface — but Fill, Border and Corner radius
     are statements about the block as a whole, and returning the renderer straight out meant the
     Style pack wrote those keys for eight widgets that never read one of them. StyledBox emits only
     what a human actually chose, so an untouched collection renders exactly as it did. */
  /* ⚠️ A DATA widget gets the same white card as every other data widget. Announcements and Contact
     Us were rendering flat onto the grey page beside My Requests and Pending Approvals, which sit in
     white cards — so two widgets doing the identical job looked like different kinds of thing, and
     the page had no consistent edge between one block and the next.
     ⚠️ Group, not type: what earns a card is being a panel of DATA (Live data and Custom), which is
     also the rule the palette now sorts by. A Divider, a Spacer, a Title or an Image is a collection
     renderer too, and a white card around a horizontal rule would be nonsense — those keep the bare
     StyledBox. Action Card and KPI paint their own surface and are excluded for the older reason:
     they would end up as a card inside a card. */
  const dataWidget = (def?.group === 'Live data' || def?.group === 'Custom') && !renderSpec(item.type).bare;
  if (Collection && cfg) {
    const drawn = <Collection nodeId={item.id} cfg={cfg} glyph={glyph} />;
    return dataWidget ? <Surface id={item.id}>{drawn}</Surface> : <StyledBox id={item.id}>{drawn}</StyledBox>;
  }

  const configured = specDrivenBody(item.type, cfg, glyph, item.id);
  if (configured) return spec.bare ? configured : <Surface id={item.id}>{configured}</Surface>;

  /* Once an icon or a title is set, the element stops being a placeholder and renders what it was
     given — the same component, just no longer blank. */
  if (glyph || text?.title || text?.desc) {
    const body = (
      <div className="flex items-center gap-3">
        {glyph && (
          <span className="flex size-11 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#475467] [&>span>svg]:size-5">
            {glyph}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-[#364658]">{text?.title || label}</span>
          {text?.desc && <span className="block truncate text-[13px] text-[#7B8FA5]">{text.desc}</span>}
        </span>
      </div>
    );
    return spec.bare ? body : <Surface id={item.id}>{body}</Surface>;
  }

  switch (item.type) {
    /* ── bare text: only the section's own padding around it ── */
    case 'b-text':
      return <p className="text-[15px] leading-[1.6] text-[#9CA3AF]">Your text goes here. Select it to edit the content.</p>;
    case 'b-large-title':
      return <h2 className="text-[28px] font-semibold leading-tight text-[#9CA3AF]">Large title</h2>;
    case 'b-small-title':
      return <h3 className="text-[18px] font-semibold leading-tight text-[#9CA3AF]">Small title</h3>;

    case 'b-button':
      return (
        <button className="inline-flex h-9 items-center rounded border border-dashed border-[#C3CBD6] px-4 text-[13px] font-medium text-[#9CA3AF]">
          Button
        </button>
      );

    case 'v-image':
      /* ⚠️ WIRED, not decorative. This was a dashed box with a picture glyph in it that opened
         nothing and accepted nothing — it looked exactly like a dropzone and was the one place in
         the module where dragging an image onto the obvious target did nothing at all. It is the
         same component the panel draws, at the `md` size the canvas needs. */
      return <ImageDropSlot id={item.id} />;

    case 'v-icon':
    case 'x-action-icon':
      return (
        <span className="flex size-11 items-center justify-center rounded border border-dashed border-[#C3CBD6] text-[#C3CBD6]">
          <Star size={20} />
        </span>
      );

    case 'c-search':
      return (
        <div className="flex h-11 w-full items-center gap-2 rounded border border-dashed border-[#C3CBD6] bg-white px-4">
          <span className={`flex-1 ${empty}`}>Search…</span>
          <Search size={17} className="text-[#C3CBD6]" />
        </div>
      );

    case 'b-list':
      return (
        <ul className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <li key={i} className={`flex items-center gap-2 ${empty}`}>
              <span className="size-1 rounded-full bg-[#C3CBD6]" /> List item
            </li>
          ))}
        </ul>
      );

    case 'b-nav':
      return (
        <nav className="flex flex-wrap gap-5">
          {['Link one', 'Link two', 'Link three'].map((l) => <span key={l} className={empty}>{l}</span>)}
        </nav>
      );

    /* ── card-shaped: a real surface, still empty inside ── */
    case 'x-kpi':
      return (
        <Surface id={item.id}>
          <div className="text-[12px] text-[#9CA3AF]">Metric</div>
          <div className="mt-1 text-[26px] font-semibold text-[#C3CBD6]">—</div>
        </Surface>
      );

    case 'b-table':
      return (
        <Surface id={item.id}>
          <div className="grid grid-cols-3 gap-2 border-b border-[#F0F2F5] pb-2 text-[12px] font-semibold text-[#9CA3AF]">
            <span>Column</span><span>Column</span><span>Column</span>
          </div>
          {[0, 1].map((r) => (
            <div key={r} className="grid grid-cols-3 gap-2 border-b border-[#F0F2F5] py-2.5 text-[13px] text-[#C3CBD6]">
              <span>—</span><span>—</span><span>—</span>
            </div>
          ))}
        </Surface>
      );

    default:
      break;
  }

  /* Data components and anything not yet given its own blank state: a titled empty card, which is
     exactly what these render before they are pointed at data. */
  if (!spec.bare) {
    return (
      <Surface id={item.id}>
        <div className="text-[15px] font-semibold text-[#9CA3AF]">{label}</div>
        <div className="mt-3 flex items-center justify-center rounded border border-dashed border-[#E5E7EB] py-8">
          <span className={empty}>No data configured</span>
        </div>
      </Surface>
    );
  }

  return (
    <div className="flex items-center justify-center rounded border border-dashed border-[#C3CBD6] py-6">
      <span className={empty}>{label}</span>
    </div>
  );
}

/* ⚠️ ONE wrapper for every element that has no box of its own. renderSpec calls most things
   `bare` — text, collections, images, tabs, the action tiles — meaning they sit straight on the
   section with no surface, so the Style pack could offer Fill, Border and Corner radius to eleven
   widgets that had nothing to apply them to. A non-bare element already paints those through
   Surface, and a text node through Sel, so wrapping either would draw the border twice; this covers
   exactly the gap between them. StyledBox emits only what a human chose, so nothing untouched moves. */
/* The canvas half of an image slot.
 *
 * ⚠️ Its own component because it needs a hook — `useCanvas` cannot be called inside the switch
 * that renders every placed element, and lifting the hook to the top of that function would run it
 * for the forty types that have no use for it. */
function ImageDropSlot({ id }: { id: string }) {
  const { setCfg } = useCanvas();
  return (
    <ImageUploadZone
      size="md"
      label="Upload an image for this element"
      onFile={(src) => setCfg(id, { src })}
    />
  );
}

export function PortalPlacedElement(props: React.ComponentProps<typeof PlacedBody>) {
  const spec = renderSpec(props.item.type);
  const body = <PlacedBody {...props} />;
  /* A collection wraps itself (above), so wrapping again here would draw its border twice. */
  return spec.bare && spec.kind !== "text" && !COLLECTION_RENDERERS[props.item.type]
    ? <StyledBox id={props.item.id}>{body}</StyledBox>
    : body;
}
