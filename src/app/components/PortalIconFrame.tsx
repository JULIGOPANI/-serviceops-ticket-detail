import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/* The five ways an icon can be framed, chosen by LOOKING.
 *
 * ⚠️ One function draws both the picker swatch and the canvas, so a tile can never promise a frame
 * you do not get — the same rule the divider's line picker and the section layout tiles follow.
 *
 * ⚠️ The frame is ONE choice, not four independent switches. Offering shape, fill, border and ring
 * separately lets you build combinations that are not frames at all (a ring with no fill, a border
 * on nothing), and then the panel has to explain itself. Five named results is the whole set. */
export const ICON_FRAMES = ['none', 'circle-outline', 'rounded-fill', 'square-outline', 'circle-ring'] as const;
export type IconFrame = (typeof ICON_FRAMES)[number];

export const FRAME_LABEL: Record<IconFrame, string> = {
  'none': 'No frame',
  'circle-outline': 'Circle outline',
  'rounded-fill': 'Rounded square',
  'square-outline': 'Square outline',
  'circle-ring': 'Circle with ring',
};

/** The frame's own box, at whatever size the caller gives it. Content is the icon itself. */
export function IconFrameBox({ frame, size, color, fill, border, borderColor, radius, children }: {
  frame: IconFrame;
  /** The icon's own size; the frame sizes itself around it. */
  size: number;
  color: string;
  fill: string;
  border: number;
  borderColor: string;
  radius: number;
  children: React.ReactNode;
}) {
  if (frame === 'none') {
    return <span style={{ color, lineHeight: 0 }} className="inline-flex">{children}</span>;
  }
  const pad = Math.round(size * 0.55);
  const box: React.CSSProperties = {
    color,
    width: size + pad,
    height: size + pad,
    borderWidth: border,
    borderStyle: 'solid',
  };
  if (frame === 'circle-outline') {
    Object.assign(box, { borderRadius: 999, borderColor, background: 'transparent' });
  } else if (frame === 'rounded-fill') {
    Object.assign(box, { borderRadius: radius, borderWidth: 0, background: fill });
  } else if (frame === 'square-outline') {
    Object.assign(box, { borderRadius: 0, borderColor, background: fill });
  } else {
    /* The ring is a second edge drawn OUTSIDE the border, so it never eats into the icon's room —
       a second border would, and the icon would shrink every time the ring got thicker. */
    Object.assign(box, {
      borderRadius: 999,
      borderColor,
      background: fill,
      boxShadow: `0 0 0 ${Math.max(2, border + 1)}px ${borderColor}`,
    });
  }
  return <span style={box} className="inline-flex items-center justify-center">{children}</span>;
}

/** A small drawn heart, so a swatch reads as "an icon in a frame" without needing a real one. */
const Heart = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 21s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9z" />
  </svg>
);

/** "Select layout" — the five frames as drawn rows in a dropdown. */
export function IconFramePicker({ value, onChange }: { value: IconFrame; onChange: (v: IconFrame) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const swatch = (f: IconFrame, size: number) => (
    <IconFrameBox frame={f} size={size} color="#64748B" fill="#E2E8F0" border={1} borderColor="#94A3B8" radius={8}>
      <Heart size={size} />
    </IconFrameBox>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center gap-3 rounded border border-[#d1d5db] bg-white px-3 text-left transition-colors hover:border-[#3D8BD0]"
      >
        <span className="flex flex-shrink-0 items-center">{swatch(value, 14)}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{FRAME_LABEL[value]}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
          <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Select layout</div>
          {ICON_FRAMES.map((f) => (
            <button
              key={f}
              onClick={() => { onChange(f); setOpen(false); }}
              title={FRAME_LABEL[f]}
              className={`flex w-full items-center gap-3 rounded px-2 py-2 transition-colors ${
                value === f ? 'bg-[#EBF5FF] ring-1 ring-[#3D8BD0]' : 'hover:bg-[#F5F7FA]'
              }`}
            >
              <span className="flex w-8 flex-shrink-0 justify-center">{swatch(f, 16)}</span>
              <span className="text-[13px] text-[#364658]">{FRAME_LABEL[f]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
