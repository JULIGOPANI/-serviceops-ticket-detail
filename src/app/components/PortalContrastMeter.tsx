/* Support Portal builder — the contrast readout (spec §3 "Meter", §7.20).
 *
 * A permanent row, not a validation that appears once something is already wrong: the point is that
 * an editor choosing a heading colour over artwork can SEE the consequence while they choose. It
 * shows the ratio, a verdict, and a one-click Fix it — and it never blocks.
 */

import { useEffect, useState } from 'react';
import { Check, TriangleAlert, Wand2 } from 'lucide-react';
import { contrastRatio, fixContrast, hexToRgb, judge, sampleImage, withOverlay } from './portalContrast';

export interface BackdropSpec {
  fill: 'none' | 'color' | 'image';
  color?: string;
  image?: string;
  overlay: number;
  /** What is behind this band when it paints nothing of its own. */
  pageColor: string;
}

/** Resolves the REAL backdrop — artwork average blended with the overlay, or the page behind. */
export function useBackdrop(spec: BackdropSpec): [number, number, number] {
  const [rgb, setRgb] = useState<[number, number, number]>(() => hexToRgb(spec.pageColor));

  useEffect(() => {
    let live = true;
    if (spec.fill === 'image' && spec.image) {
      sampleImage(spec.image).then((avg) => { if (live) setRgb(avg); });
    } else if (spec.fill === 'color' && spec.color) {
      setRgb(hexToRgb(spec.color));
    } else {
      setRgb(hexToRgb(spec.pageColor));
    }
    return () => { live = false; };
  }, [spec.fill, spec.color, spec.image, spec.pageColor]);

  return rgb;
}

export function ContrastMeter({ textColor, backdrop, overlay, onFix }: {
  textColor: string;
  backdrop: [number, number, number];
  overlay: number;
  onFix: (next: { color: string; overlay: number }) => void;
}) {
  const blended = withOverlay(backdrop, overlay / 100);
  const c = judge(contrastRatio(textColor, blended));

  return (
    <div className={`mt-3 rounded p-2.5 ${c.passes ? 'bg-[#F6FEF9]' : 'bg-[#FFFBEB]'}`}>
      <div className="flex items-center gap-2">
        <span className={`flex-shrink-0 ${c.passes ? 'text-[#22A06B]' : 'text-[#B54708]'}`}>
          {c.passes ? <Check size={14} /> : <TriangleAlert size={14} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-medium text-[#364658]">
            Contrast {c.ratio.toFixed(2)}:1 — {c.verdict}
          </span>
          <span className="block text-[11px] leading-[1.5] text-[#7B8FA5]">
            {c.passes
              ? 'Readable against what is actually behind it.'
              : '4.5:1 is the floor for body text. You can ship this anyway — but people will struggle to read it.'}
          </span>
        </span>
        {!c.passes && (
          <button
            onClick={() => onFix(fixContrast(backdrop, overlay))}
            className="flex flex-shrink-0 items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-[#3D8BD0] shadow-sm transition-colors hover:bg-[#EBF5FF]"
          ><Wand2 size={11} /> Fix it</button>
        )}
      </div>
      {/* The swatch pair is the readout people actually trust — the number confirms it. */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className="flex h-7 flex-1 items-center justify-center rounded text-[12px] font-medium"
          style={{ background: `rgb(${blended.map(Math.round).join(',')})`, color: textColor }}
        >Sample heading</span>
      </div>
    </div>
  );
}
