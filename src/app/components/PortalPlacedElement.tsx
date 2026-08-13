import { Image as ImageIcon, Minus, Search, Star } from 'lucide-react';
import { PORTAL_ELEMENTS } from './supportPortalData';
import { renderSpec } from './portalPageModel';
import type { PlacedElement } from './portalPageModel';
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

export function PortalPlacedElement({ item, icon, text }: {
  item: PlacedElement;
  icon?: IconChoice;
  text?: { title?: string; desc?: string };
}) {
  const def = PORTAL_ELEMENTS.find((e) => e.id === item.type);
  const spec = renderSpec(item.type);
  const label = def?.name ?? item.name;
  const glyph = iconNode(icon, 20);

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

    case 'l-divider':
      return <Minus className="w-full text-[#E5E7EB]" strokeWidth={1} />;

    case 'b-spacer':
      return <div className="h-8" />;

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
    case 'x-search':
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

    case 'z-nav':
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
