import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, ChevronDown, Info, Pipette } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* Colour picker.
 *
 * Theme colours come first because a portal should be built from its palette, not from arbitrary
 * hex — picking off the top row is the path of least resistance, which is how a design system
 * actually gets followed. Saved and Recent sit under it for everything else, and the spectrum is
 * last for the times none of that will do.
 *
 * `Recent` is module-level on purpose: it is a property of the session, not of one popover, so it
 * survives closing and reopening on a different element. */

const THEME_COLORS = ['#3D8BD0', '#364658', '#7B8FA5', '#F7F9FC', '#FFFFFF', '#22A06B', '#B45309', '#DC2626'];

let RECENT: string[] = [];
const remember = (hex: string) => {
  RECENT = [hex, ...RECENT.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 14);
};

/* ── colour maths ────────────────────────────────────────────────────────── */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/* ── swatch ──────────────────────────────────────────────────────────────── */

function Swatch({ color, on, onPick, none }: { color: string; on?: boolean; onPick: () => void; none?: boolean }) {
  return (
    <button
      onClick={onPick}
      title={none ? 'No colour' : color}
      className={`relative size-6 flex-shrink-0 rounded-full border transition-transform hover:scale-110 ${
        on ? 'ring-2 ring-[#3D8BD0] ring-offset-1' : ''
      } ${color.toUpperCase() === '#FFFFFF' || none ? 'border-[#DFE5ED]' : 'border-black/10'}`}
      style={{ background: none ? '#fff' : color }}
    >
      {none && <Ban size={13} className="absolute inset-0 m-auto text-[#DC2626]" />}
    </button>
  );
}

/* ── picker ──────────────────────────────────────────────────────────────── */

export function PortalColorPicker({ value, onChange, onClose, anchor }: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  /** Viewport rect of the trigger — the popover is portalled, so it positions itself. */
  anchor: DOMRect;
}) {
  /* ⚠️ No Saved list. A portal is built from its THEME palette, and a per-browser set of saved
     swatches is a second palette that nobody else on the team can see — it quietly competes with
     the one place colour is supposed to be defined. Recent stays because it is a shortcut back to
     what you just used, not an alternative source of truth. */
  const [hsv, setHsv] = useState(() => hexToHsv(value || '#000000'));
  const [hex, setHex] = useState((value || '#000000').toUpperCase());
  const [opacity, setOpacity] = useState(100);
  const ref = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  const commit = (next: string) => {
    setHex(next.toUpperCase());
    setHsv(hexToHsv(next));
    remember(next);
    onChange(next);
  };

  /* Both the spectrum and the hue rail are pointer-dragged, so they share one handler shape. */
  const dragOn = (
    el: HTMLDivElement | null,
    e: React.MouseEvent,
    read: (x: number, y: number, rect: DOMRect) => void,
  ) => {
    if (!el) return;
    const apply = (cx: number, cy: number) => read(cx, cy, el.getBoundingClientRect());
    apply(e.clientX, e.clientY);
    const move = (ev: MouseEvent) => apply(ev.clientX, ev.clientY);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const pickSv = (e: React.MouseEvent) => dragOn(svRef.current, e, (x, y, r) => {
    const s = clamp((x - r.left) / r.width);
    const v = 1 - clamp((y - r.top) / r.height);
    setHsv((p) => ({ ...p, s, v }));
    commit(hsvToHex(hsv.h, s, v));
  });

  const pickHue = (e: React.MouseEvent) => dragOn(hueRef.current, e, (_x, y, r) => {
    const h = clamp((y - r.top) / r.height) * 360;
    setHsv((p) => ({ ...p, h }));
    commit(hsvToHex(h, hsv.s, hsv.v));
  });

  const eyedropper = async () => {
    const EyeDropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!EyeDropper) return;
    try { commit((await new EyeDropper().open()).sRGBHex); } catch { /* dismissed */ }
  };
  const hasEyedropper = typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper !== 'undefined';

  const grid = RECENT;

  /* Portalled and fixed. The design panel is an overflow-y-auto column, so an absolutely
     positioned popover inside it gets clipped the moment it is taller than the space below the
     field — which this one always is. */
  const H = 560;
  const top = Math.max(8, Math.min(anchor.bottom + 8, window.innerHeight - H - 8));
  const left = Math.max(8, Math.min(anchor.right - 286, window.innerWidth - 294));

  return createPortal(
    <div
      ref={ref}
      style={{ top, left }}
      className="fixed z-[10000] w-[286px] rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]"
    >
      {/* Theme first — the palette is the default answer. */}
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">
        Theme colors
        <Tooltip><TooltipTrigger asChild><span className="cursor-help"><Info size={12} /></span></TooltipTrigger>
          <TooltipContent>Colours from this portal's theme. Changing one there updates every element using it.</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {THEME_COLORS.map((c) => <Swatch key={c} color={c} on={c.toLowerCase() === hex.toLowerCase()} onPick={() => commit(c)} />)}
      </div>

      <div className="mt-4 border-b border-[#F0F2F5] pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Recent</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Swatch color="transparent" none onPick={() => { onChange('transparent'); setHex('TRANSPARENT'); }} />
        {grid.map((c) => <Swatch key={c} color={c} on={c.toLowerCase() === hex.toLowerCase()} onPick={() => commit(c)} />)}
        {grid.length === 0 && <span className="py-1 text-[12px] text-[#9CA3AF]">Nothing yet.</span>}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => { RECENT = []; setHex((h) => h); }}
          className="text-[12px] font-medium text-[#3D8BD0] hover:underline"
        >Reset</button>
      </div>

      <div className="-mx-4 my-3 h-px bg-[#F0F2F5]" />

      {/* Spectrum */}
      <div className="relative">
        <select disabled className="app-select h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658]">
          <option>Color</option>
        </select>
      </div>

      <div className="mt-3 flex gap-2">
        <div
          ref={svRef}
          onMouseDown={pickSv}
          className="relative h-[112px] flex-1 cursor-crosshair rounded"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hsvToHex(hsv.h, 1, 1)})` }}
        >
          <span
            className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
          />
        </div>
        <div
          ref={hueRef}
          onMouseDown={pickHue}
          className="relative w-[14px] cursor-pointer rounded-full"
          style={{ background: 'linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
        >
          <span
            className="pointer-events-none absolute left-1/2 size-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ top: `${(hsv.h / 360) * 100}%`, background: hsvToHex(hsv.h, 1, 1) }}
          />
        </div>
      </div>

      {/* Hex + eyedropper */}
      <div className="mt-3 flex items-center gap-2">
        <span className="flex h-8 items-center rounded border border-[#d1d5db] px-2 text-[12px] font-medium text-[#64748B]">HEX</span>
        <input
          value={hex}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setHex(v);
            if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/.test(v)) { setHsv(hexToHsv(v)); remember(v); onChange(v); }
          }}
          className="h-8 min-w-0 flex-1 rounded border border-[#d1d5db] px-2 text-[13px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
        />
        {hasEyedropper && (
          <button onClick={eyedropper} title="Pick from screen" className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
            <Pipette size={15} />
          </button>
        )}
      </div>

      {/* Opacity */}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[12px] text-[#364658]">Opacity</span>
        <input
          type="range" min={0} max={100} value={opacity}
          onChange={(e) => {
            const o = Number(e.target.value);
            setOpacity(o);
            const { r, g, b } = hexToRgb(hex.startsWith('#') ? hex : '#000000');
            onChange(o === 100 ? hex : `rgba(${r}, ${g}, ${b}, ${(o / 100).toFixed(2)})`);
          }}
          className="min-w-0 flex-1 accent-[#3D8BD0]"
        />
        <span className="w-[46px] flex-shrink-0 rounded border border-[#d1d5db] py-0.5 text-center text-[12px] text-[#364658]">{opacity}%</span>
      </div>
    </div>,
    document.body,
  );
}

/* The row that opens it — swatch + hex, matching the panel's other fields. */
export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setAnchor(anchor ? null : btnRef.current!.getBoundingClientRect())}
        className="flex h-9 w-full items-center gap-2 rounded border border-[#d1d5db] bg-white px-2 text-left transition-colors hover:border-[#3D8BD0]"
      >
        <span className="size-5 flex-shrink-0 rounded border border-black/10" style={{ background: value }} />
        <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{value.toUpperCase()}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {anchor && <PortalColorPicker value={value} onChange={onChange} anchor={anchor} onClose={() => setAnchor(null)} />}
    </div>
  );
}
