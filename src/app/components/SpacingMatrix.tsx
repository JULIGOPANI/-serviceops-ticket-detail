import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ZERO_BOX } from './portalPageModel';
import type { NodeStyle, SpacingBox } from './portalPageModel';

/* Padding and margin, as two sliders each.
 *
 * ⚠️ Replaces the nested-box matrix. The matrix showed four sides at once and made you aim at a
 * small edge to change one; almost every real edit is "more room above and below" or "more room
 * left and right". So the resting control is one slider per AXIS — vertical and horizontal — and
 * the four individual sides live behind the advanced button on each row, for the times they differ.
 *
 * ⚠️ Dragging an axis writes BOTH of its sides. That is what makes the slider honest: the number
 * under the handle is the value both sides now hold, not an average of two that disagree. Sides set
 * separately in advanced mode are shown as a dash until the axis is dragged again. */

type Ring = 'margin' | 'padding';
type Side = keyof SpacingBox;

interface Props {
  style: NodeStyle;
  onChange: (patch: Partial<NodeStyle>) => void;
  /* ⚠️ Restricts the widget to ONE ring. A divider and a shape have no inside, so they get a margin
     box and no padding box at all — NEW-ELEMENT-PANELS-SPEC §3.6/§3.14. Showing both and letting one
     do nothing is the failure that spec spends its first section arguing against. */
  only?: Ring;
}

const AXES = {
  vertical: ['top', 'bottom'] as Side[],
  horizontal: ['left', 'right'] as Side[],
};
type Axis = keyof typeof AXES;

/** Vertical sides are px, horizontal are %, matching the rest of the product. */
const unitOf = (axis: Axis) => (axis === 'horizontal' ? '%' : 'px');
const maxOf = (axis: Axis) => (axis === 'horizontal' ? 50 : 120);

/* The axis glyphs: a dashed box with the two edges this row controls drawn solid. Reading which
   pair a slider moves off a picture is faster than reading the words "top and bottom". */
function AxisIcon({ axis }: { axis: Axis }) {
  const solid = '#64748B';
  const dash = '#CBD5E1';
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      {axis === 'vertical' ? (
        <>
          <path d="M3 3h12M3 15h12" stroke={solid} strokeWidth="2" strokeLinecap="round" />
          <path d="M3 6v6M15 6v6" stroke={dash} strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M3 3v12M15 3v12" stroke={solid} strokeWidth="2" strokeLinecap="round" />
          <path d="M6 3h6M6 15h6" stroke={dash} strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function SpacingMatrix({ style, onChange, only }: Props) {
  const [advanced, setAdvanced] = useState<string | null>(null);
  const [live, setLive] = useState<string | null>(null);

  const boxOf = (r: Ring): SpacingBox => (r === 'margin' ? style.margin : style.padding) ?? ZERO_BOX;
  const write = (r: Ring, next: SpacingBox) =>
    onChange(r === 'margin' ? { margin: next } : { padding: next });

  /** The axis value, or null when its two sides were set to different numbers. */
  const axisValue = (r: Ring, axis: Axis): number | null => {
    const box = boxOf(r);
    const [a, b] = AXES[axis];
    return box[a] === box[b] ? (box[a] ?? 0) : null;
  };

  const setAxis = (r: Ring, axis: Axis, v: number) => {
    const box = boxOf(r);
    const [a, b] = AXES[axis];
    write(r, { ...box, [a]: v, [b]: v });
  };

  const setSide = (r: Ring, side: Side, v: number) => write(r, { ...boxOf(r), [side]: v });

  const row = (r: Ring, axis: Axis) => {
    const key = `${r}-${axis}`;
    const value = axisValue(r, axis);
    const unit = unitOf(axis);
    const open = advanced === key;
    return (
      <div key={key}>
        <div className="flex items-center gap-2.5">
          <span className="flex-shrink-0 text-[#64748B]"><AxisIcon axis={axis} /></span>

          <span className="relative flex-1">
            <input
              type="range"
              min={0}
              max={maxOf(axis)}
              value={value ?? 0}
              onChange={(e) => setAxis(r, axis, Number(e.target.value))}
              onMouseDown={() => setLive(key)}
              onMouseUp={() => setLive(null)}
              onBlur={() => setLive(null)}
              className="portal-range w-full"
            />
            {/* The bubble only while dragging — a value permanently under the handle competes with
                the number the advanced rows already show. */}
            {live === key && (
              <span className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[11px] font-medium text-white">
                {value ?? 0}
              </span>
            )}
          </span>

          <button
            onClick={() => setAdvanced(open ? null : key)}
            title={open ? 'Hide the individual sides' : 'Set each side separately'}
            className={`flex size-6 flex-shrink-0 items-center justify-center rounded transition-colors ${
              open ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#9CA3AF] hover:bg-[#F1F5F9] hover:text-[#364658]'
            }`}
          ><SlidersHorizontal size={14} /></button>
        </div>

        {open && (
          <div className="mt-2 flex gap-2 pl-7">
            {AXES[axis].map((side) => (
              <label key={side} className="flex flex-1 items-center gap-1.5">
                <span className="w-10 flex-shrink-0 text-[11px] capitalize text-[#9CA3AF]">{side}</span>
                <span className="relative flex-1">
                  <input
                    type="number"
                    value={boxOf(r)[side] ?? 0}
                    onChange={(e) => setSide(r, side, Number(e.target.value))}
                    className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-2 pr-6 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF]">{unit}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const block = (r: Ring) => (
    <div className="mt-4 first:mt-0">
      <div className="mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{r}</span>
      </div>
      <div className="space-y-3">
        {row(r, 'vertical')}
        {row(r, 'horizontal')}
      </div>
    </div>
  );

  return (
    <div>
      {only !== 'margin' && block('padding')}
      {only !== 'padding' && block('margin')}
    </div>
  );
}
