import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/* The six divider shapes, drawn rather than named.
 *
 * ⚠️ Each swatch is rendered by the SAME function the canvas uses, so a tile can never promise a
 * line you do not get — the picker and the page are one implementation, not two that look alike. */
export const LINE_STYLES = ['solid', 'dashed', 'dotted', 'zigzag', 'wavy', 'gradient'] as const;
export type LineStyle = (typeof LINE_STYLES)[number];

export const LINE_LABEL: Record<LineStyle, string> = {
  solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted',
  zigzag: 'Zigzag', wavy: 'Wavy', gradient: 'Gradient',
};

/** One line, at any width/colour/thickness. Used by the canvas AND by every picker swatch. */
export function LineMark({ style, color, thickness }: { style: LineStyle; color: string; thickness: number }) {
  if (style === 'gradient') {
    return (
      <span
        className="block w-full"
        style={{ height: thickness, background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    );
  }
  if (style === 'zigzag' || style === 'wavy') {
    /* An SVG so the shape scales with the line width instead of being a fixed picture of one. */
    const amp = Math.max(3, thickness * 2);
    const d = style === 'zigzag'
      ? `M0 ${amp} L5 0 L10 ${amp} L15 0 L20 ${amp}`
      : `M0 ${amp} Q2.5 0 5 ${amp} T10 ${amp} T15 ${amp} T20 ${amp}`;
    return (
      <svg className="block w-full" height={amp * 2} viewBox={`0 0 20 ${amp * 2}`} preserveAspectRatio="none" aria-hidden>
        <path d={d} fill="none" stroke={color} strokeWidth={thickness} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  return <span className="block w-full" style={{ borderTopWidth: thickness, borderTopStyle: style, borderTopColor: color }} />;
}

/** "Select Layout" — a dropdown that opens the six shapes as drawn rows. */
export function LineStylePicker({ value, color, thickness, onChange }: {
  value: LineStyle; color: string; thickness: number; onChange: (v: LineStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center gap-3 rounded border border-[#d1d5db] bg-white px-3 text-left transition-colors hover:border-[#3D8BD0]"
      >
        <span className="flex min-w-0 flex-1 items-center"><LineMark style={value} color={color} thickness={thickness} /></span>
        <span className="flex-shrink-0 text-[12px] text-[#7B8FA5]">{LINE_LABEL[value]}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
          <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Select layout</div>
          {LINE_STYLES.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              title={LINE_LABEL[s]}
              className={`flex h-11 w-full items-center rounded px-2 transition-colors ${
                value === s ? 'bg-[#EBF5FF] ring-1 ring-[#3D8BD0]' : 'hover:bg-[#F5F7FA]'
              }`}
            ><LineMark style={s} color={color} thickness={thickness} /></button>
          ))}
        </div>
      )}
    </div>
  );
}
