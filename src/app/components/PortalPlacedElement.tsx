import type { ReactNode } from 'react';
import { Image as ImageIcon, Search, Star } from 'lucide-react';
import { PORTAL_ELEMENTS } from './supportPortalData';
import { renderSpec } from './portalPageModel';
import type { PlacedElement } from './portalPageModel';
import { COLLECTION_RENDERERS } from './PortalCollectionRender';
import { LineMark } from './PortalLineStyles';
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

/** Card-shaped elements get a surface; everything else sits directly on the section. */
function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">{children}</div>;
}

/* The four spec-driven element types that render from their own config rather than the generic
   title/description placeholder. Returns null for everything else, which falls through to the
   blank states below. */
const BTN_SIZE: Record<string, string> = { sm: 'h-7 px-3 text-[12px]', md: 'h-9 px-4 text-[13px]', lg: 'h-11 px-5 text-[14px]' };

function specDrivenBody(type: string, cfg: Record<string, unknown> | undefined, glyph: React.ReactNode) {
  if (!cfg) return null;

  if (type === 'b-text') {
    const html = String(cfg.html ?? '');
    if (!html) return null;
    return (
      <div
        style={{ textAlign: cfg.textAlign as never, columnCount: cfg.textCols === '2' ? 2 : undefined }}
        className="text-[15px] leading-[1.6] text-[#364658]"
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

  if (type === 'b-button') {
    const style = String(cfg.style ?? 'primary');
    const label = String(cfg.label ?? 'Button');
    const common = `inline-flex items-center justify-center gap-2 font-medium ${BTN_SIZE[String(cfg.size ?? 'md')]} ${cfg.fullWidth ? 'w-full' : ''}`;
    const radius = { borderRadius: `${Number(cfg.radius ?? 6)}px` };
    /* Each style has its OWN inherited text colour — white reads on a filled button and is
       invisible on an outline one. Falling back per style is what "inherit from theme per style"
       means; a single stored default cannot express it. */
    const text = (cfg.textColor as string) ?? (style === 'primary' || style === 'icon' ? '#FFFFFF' : '#3D8BD0');
    const fill = (cfg.fillColor as string) ?? '#3D8BD0';
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
      btn = <span title={label} style={{ ...radius, ...face, background: fill, color: text }} className="inline-flex size-9 items-center justify-center">{glyph ?? '★'}</span>;
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
    if (!src) return null;
    return (
      <figure className="m-0">
        <img src={src} alt={String(cfg.alt ?? '')} className="w-full rounded object-cover" />
        {!!cfg.caption && <figcaption className="mt-1.5 text-[12px] text-[#7B8FA5]">{String(cfg.caption)}</figcaption>}
      </figure>
    );
  }

  if (type === 'x-kpi') {
    const noIcon = cfg.layout === 'none';
    const top = cfg.layout === 'top';
    return (
      <div className={`flex gap-3 ${top ? 'flex-col' : 'items-center'}`}>
        {!noIcon && (
          <span className="flex size-11 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#475467]">{glyph ?? '#'}</span>
        )}
        <span className="min-w-0">
          <span style={{ fontSize: `${Math.round((16 * Number(cfg.numberSize ?? 180)) / 100)}px`, color: String(cfg.numberColor ?? '#364658') }} className="block font-semibold leading-none">12</span>
          <span style={{ color: String(cfg.labelColor ?? '#7B8FA5') }} className="mt-1 block truncate text-[13px]">{String(cfg.label ?? 'Open requests')}</span>
        </span>
      </div>
    );
  }

  return null;
}

export function PortalPlacedElement({ item, icon, text, cfg }: {
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
  if (Collection && cfg) return <Collection nodeId={item.id} cfg={cfg} glyph={glyph} />;

  const configured = specDrivenBody(item.type, cfg, glyph);
  if (configured) return spec.bare ? configured : <Surface>{configured}</Surface>;

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
    return spec.bare ? body : <Surface>{body}</Surface>;
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
      return (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded border border-dashed border-[#C3CBD6] bg-[#FAFBFC]">
          <ImageIcon size={26} className="text-[#C3CBD6]" />
        </div>
      );

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
        <Surface>
          <div className="text-[12px] text-[#9CA3AF]">Metric</div>
          <div className="mt-1 text-[26px] font-semibold text-[#C3CBD6]">—</div>
        </Surface>
      );

    case 'b-table':
      return (
        <Surface>
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
      <Surface>
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
