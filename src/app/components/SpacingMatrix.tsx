import { useState } from 'react';
import { Link, Link2Off, Trash2 } from 'lucide-react';
import { ZERO_BOX } from './portalPageModel';
import type { NodeStyle, SpacingBox } from './portalPageModel';

/* The spacing matrix — nested boxes, outer = margin, inner = padding.
 *
 * One widget for both, because they are one idea: the space outside the element and the space
 * inside it. Whichever ring you touch tints and renames the label above, so the control is always
 * telling you which of the two you are editing.
 *
 * Vertical sides are px and horizontal are %, matching the defaults the rest of the product uses.
 * The centre link ties the two horizontal sides together — change one and the other follows, until
 * you break it. */

type Ring = 'margin' | 'padding';
type Side = keyof SpacingBox;

interface Props {
  style: NodeStyle;
  onChange: (patch: Partial<NodeStyle>) => void;
}

const unitOf = (side: Side) => (side === 'left' || side === 'right' ? '%' : 'px');

export function SpacingMatrix({ style, onChange }: Props) {
  const [ring, setRing] = useState<Ring>('padding');
  const [focus, setFocus] = useState<{ ring: Ring; side: Side } | null>(null);

  const margin = style.margin ?? ZERO_BOX;
  const padding = style.padding ?? ZERO_BOX;
  const box = (r: Ring) => (r === 'margin' ? margin : padding);
  const linked = (r: Ring) => (r === 'margin' ? style.marginLinked !== false : style.paddingLinked !== false);

  const setSide = (r: Ring, side: Side, raw: string) => {
    const v = Math.max(0, Math.min(side === 'left' || side === 'right' ? 100 : 200, Number(raw) || 0));
    const current = box(r);
    let next: SpacingBox = { ...current, [side]: v };
    // Linked only ever means the horizontal pair — vertical sides are independent by design.
    if (linked(r) && (side === 'left' || side === 'right')) next = { ...next, left: v, right: v };
    onChange(r === 'margin' ? { margin: next } : { padding: next });
  };

  const toggleLink = (r: Ring) =>
    onChange(r === 'margin' ? { marginLinked: !linked('margin') } : { paddingLinked: !linked('padding') });

  const reset = () => onChange({ margin: ZERO_BOX, padding: ZERO_BOX });

  /** A side cell: reads as plain text until focused, then becomes an input with its unit. */
  const Cell = ({ r, side, className = '' }: { r: Ring; side: Side; className?: string }) => {
    const on = focus?.ring === r && focus.side === side;
    const v = box(r)[side];
    if (on) {
      return (
        <span className={`inline-flex items-center overflow-hidden rounded border border-[#3D8BD0] bg-white ${className}`}>
          <input
            autoFocus
            type="number"
            value={v}
            onChange={(e) => setSide(r, side, e.target.value)}
            onBlur={() => setFocus(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setFocus(null); }}
            className="h-6 w-9 bg-transparent px-1 text-center text-[12px] text-[#364658] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="border-l border-[#E5E7EB] bg-[#F7F9FC] px-1 text-[11px] leading-[24px] text-[#7B8FA5]">{unitOf(side)}</span>
        </span>
      );
    }
    return (
      <button
        onClick={() => { setRing(r); setFocus({ ring: r, side }); }}
        className={`rounded px-1 text-[12px] text-[#364658] transition-colors hover:bg-white ${className}`}
      >{v}{unitOf(side)}</button>
    );
  };

  const LinkBtn = ({ r }: { r: Ring }) => (
    <button
      onClick={() => { setRing(r); toggleLink(r); }}
      title={linked(r) ? 'Unlink left and right' : 'Link left and right'}
      className={`flex size-6 items-center justify-center rounded transition-colors ${
        linked(r) ? 'bg-[#CFE6FA] text-[#3D8BD0]' : 'text-[#9CA3AF] hover:bg-[#F3F4F6]'
      }`}
    >{linked(r) ? <Link size={13} /> : <Link2Off size={13} />}</button>
  );

  return (
    <div>
      <div className="mb-2 text-[12px] font-medium text-[#364658]">
        {ring === 'margin' ? 'Margin (outer spacing)' : 'Padding (inner spacing)'}
      </div>

      {/* Outer ring — margin */}
      <div
        onMouseEnter={() => !focus && setRing('margin')}
        className={`rounded border p-2 transition-colors ${ring === 'margin' ? 'border-[#BBDDF6] bg-[#EFF7FE]' : 'border-[#E5E7EB] bg-white'}`}
      >
        <div className="flex justify-center"><Cell r="margin" side="top" /></div>
        <div className="flex items-center gap-2">
          <Cell r="margin" side="left" />

          {/* Inner ring — padding */}
          <div
            onMouseEnter={(e) => { e.stopPropagation(); if (!focus) setRing('padding'); }}
            className={`flex-1 rounded border p-2 transition-colors ${ring === 'padding' ? 'border-[#BBDDF6] bg-[#EFF7FE]' : 'border-[#E5E7EB] bg-white'}`}
          >
            <div className="flex justify-center"><Cell r="padding" side="top" /></div>
            <div className="flex items-center justify-between gap-1 py-1">
              <Cell r="padding" side="left" />
              <LinkBtn r="padding" />
              <Cell r="padding" side="right" />
            </div>
            <div className="flex justify-center"><Cell r="padding" side="bottom" /></div>
          </div>

          <Cell r="margin" side="right" />
        </div>
        <div className="flex justify-center"><Cell r="margin" side="bottom" /></div>
      </div>

      {/* Slider drives whichever side was last touched — the matrix says which, this sets how much. */}
      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={focus && (focus.side === 'left' || focus.side === 'right') ? 100 : 120}
          value={focus ? box(focus.ring)[focus.side] : 0}
          disabled={!focus}
          onChange={(e) => focus && setSide(focus.ring, focus.side, e.target.value)}
          className="flex-1 accent-[#3D8BD0] disabled:opacity-40"
        />
        <button
          onClick={reset}
          title="Reset spacing"
          className="flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
        ><Trash2 size={14} /></button>
      </div>
      {!focus && (
        <p className="mt-1.5 text-[11px] text-[#9CA3AF]">Click a value to edit it, then drag the slider.</p>
      )}
    </div>
  );
}
