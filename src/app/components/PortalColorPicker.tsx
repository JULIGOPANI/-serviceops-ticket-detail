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

/* ⚠️ A FIXED preset grid, not a remembered one. A recently-used strip is per-browser, so the
   shortcut two admins see is different and neither matches the palette — and on a themed portal it
   is the exact move the theme exists to make unnecessary. These two rows are the same for everyone,
   so a colour is where it was last time. */
const PRESETS = [
  '#C00000', '#F0A030', '#F2E23C', '#8B5A2B', '#7CC63E', '#2E6B14', '#D924D9', '#8B2FF0',
  '#4A90E2', '#3FE0C0', '#B5E86A', '#000000', '#3F3F46', '#8E8E93', '#FFFFFF',
];

const CHECKER = 'linear-gradient(45deg, #E5E7EB 25%, transparent 25%), linear-gradient(-45deg, #E5E7EB 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E5E7EB 75%), linear-gradient(-45deg, transparent 75%, #E5E7EB 75%)';

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
  const alphaRef = useRef<HTMLDivElement>(null);
  /* What the popover opened with, so Cancel has something to go back TO. A ref, not state: every
     drag re-renders, and a state copy would track the exploration it exists to undo. */
  const opened = useRef(value);
  const rgb = hexToRgb(/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#000000');

  /** Emits a hex, or an rgba() once the alpha rail has been moved off full. */
  const emit = (h: string, o: number) => {
    if (o >= 100) { onChange(h); return; }
    const c = hexToRgb(/^#[0-9A-Fa-f]{6}$/.test(h) ? h : '#000000');
    onChange(`rgba(${c.r}, ${c.g}, ${c.b}, ${(o / 100).toFixed(2)})`);
  };

  const setChannel = (k: 'r' | 'g' | 'b', raw: string) => {
    const n = Math.max(0, Math.min(255, Number(raw.replace(/[^0-9]/g, '')) || 0));
    const next = { ...rgb, [k]: n };
    const h = '#' + [next.r, next.g, next.b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    setHex(h);
    setHsv(hexToHsv(h));
    emit(h, opacity);
  };

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

  /* ⚠️ HORIZONTAL. The rail runs under the spectrum rather than beside it, so the reading is x, not
     y — the old vertical maths would have set the hue from wherever the pointer happened to sit
     vertically, which is not a dimension this control has any more. */
  const pickHueX = (e: React.MouseEvent) => dragOn(hueRef.current, e, (x, _y, r) => {
    const h = clamp((x - r.left) / r.width) * 360;
    setHsv((p) => ({ ...p, h }));
    commit(hsvToHex(h, hsv.s, hsv.v));
  });

  const pickAlpha = (e: React.MouseEvent) => dragOn(alphaRef.current, e, (x, _y, r) => {
    const o = Math.round(clamp((x - r.left) / r.width) * 100);
    setOpacity(o);
    emit(hex, o);
  });

  const eyedropper = async () => {
    const EyeDropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!EyeDropper) return;
    try { commit((await new EyeDropper().open()).sRGBHex); } catch { /* dismissed */ }
  };
  const hasEyedropper = typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper !== 'undefined';


  /* Portalled and fixed. The design panel is an overflow-y-auto column, so an absolutely
     positioned popover inside it gets clipped the moment it is taller than the space below the
     field — which this one always is. */
  const H = 560;
  const top = Math.max(8, Math.min(anchor.bottom + 8, window.innerHeight - H - 8));
  const left = Math.max(8, Math.min(anchor.right - 286, window.innerWidth - 294));

  /* ── the popover ──────────────────────────────────────────────────────────
   *
   * ⚠️ NO Recent list. A recently-used strip is a shortcut back to a colour you already chose, which
   * on a themed portal is precisely the move the theme exists to make unnecessary — and it is
   * per-browser, so the shortcut two admins see is different, and neither matches the palette. The
   * theme swatches and a fixed preset grid answer the same question without inventing a state.
   *
   * ⚠️ Done and Cancel, not close-and-keep. The spectrum is dragged, so every intermediate colour
   * lands on the page as you move — without a Cancel the only way out of an exploration is to
   * remember what you started from and find it again. Cancel restores the value the popover opened
   * with. */
  return createPortal(
    <div
      ref={ref}
      style={{ top, left }}
      className="fixed z-[10000] w-[286px] rounded-lg border border-[#E5E7EB] bg-white p-3.5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]"
    >
      {/* Spectrum */}
      <div
        ref={svRef}
        onMouseDown={pickSv}
        className="relative h-[150px] w-full cursor-crosshair rounded"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hsvToHex(hsv.h, 1, 1)})` }}
      >
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
        />
      </div>

      {/* Hue and alpha rails, with the live colour beside them. */}
      <div className="mt-2.5 flex gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div
            ref={hueRef}
            onMouseDown={pickHueX}
            className="relative h-3.5 w-full cursor-pointer rounded-sm"
            style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          >
            <span
              className="pointer-events-none absolute top-1/2 h-[18px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-[#CBD5E1] bg-white shadow"
              style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
          <div
            ref={alphaRef}
            onMouseDown={pickAlpha}
            className="relative h-3.5 w-full cursor-pointer rounded-sm"
            style={{
              backgroundImage: `linear-gradient(to right, transparent, ${hex}), ${CHECKER}`,
              backgroundSize: 'auto, 8px 8px',
            }}
          >
            <span
              className="pointer-events-none absolute top-1/2 h-[18px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-[#CBD5E1] bg-white shadow"
              style={{ left: `${opacity}%` }}
            />
          </div>
        </div>
        <span
          className="size-[38px] flex-shrink-0 rounded border border-black/10"
          style={{ background: hex }}
        />
      </div>

      {/* Hex · R · G · B · A — labels UNDER the fields, as in the reference: the value is what you
          read, the label only says which channel it belongs to. */}
      <div className="mt-2.5 flex gap-1.5">
        {([
          ['Hex', hex.replace('#', ''), (v: string) => {
            const next = '#' + v.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
            setHex(next.toUpperCase());
            if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(next)) { setHsv(hexToHsv(next)); onChange(next); }
          }, 'flex-[1.6]'],
          ['R', String(rgb.r), (v: string) => setChannel('r', v), 'flex-1'],
          ['G', String(rgb.g), (v: string) => setChannel('g', v), 'flex-1'],
          ['B', String(rgb.b), (v: string) => setChannel('b', v), 'flex-1'],
          ['A', (opacity / 100).toFixed(2).replace(/0+$/, '').replace(/.$/, '') || '0', (v: string) => {
            const o = Math.round(Math.max(0, Math.min(1, Number(v) || 0)) * 100);
            setOpacity(o);
            emit(hex, o);
          }, 'flex-1'],
        ] as [string, string, (v: string) => void, string][]).map(([label, val, on, flex]) => (
          <span key={label} className={`${flex} min-w-0`}>
            <input
              value={val}
              onChange={(e) => on(e.target.value)}
              className="h-8 w-full rounded border border-[#d1d5db] px-1.5 text-center text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            <span className="mt-0.5 block text-center text-[11px] text-[#9CA3AF]">{label}</span>
          </span>
        ))}
      </div>

      <div className="-mx-3.5 my-3 h-px bg-[#E5E7EB]" />

      {/* Theme palette first, then the fixed presets — a portal should be built from its own
          colours, and the presets are the escape hatch rather than the starting point. */}
      <div className="grid grid-cols-8 gap-1.5">
        {THEME_COLORS.map((c) => <Swatch key={c} color={c} on={c.toLowerCase() === hex.toLowerCase()} onPick={() => commit(c)} />)}
        {PRESETS.map((c) => <Swatch key={c} color={c} on={c.toLowerCase() === hex.toLowerCase()} onPick={() => commit(c)} />)}
        <Swatch color="transparent" none onPick={() => { onChange('transparent'); setHex('TRANSPARENT'); }} />
      </div>

      <div className="mt-3.5 flex items-center justify-center gap-2">
        <button
          onClick={onClose}
          className="inline-flex h-8 flex-1 items-center justify-center rounded bg-[#0EA5E9] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#0284C7]"
        >Done</button>
        <button
          onClick={() => { onChange(opened.current); onClose(); }}
          className="inline-flex h-8 flex-1 items-center justify-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
        >Cancel</button>
      </div>

      {hasEyedropper && (
        <button
          onClick={eyedropper}
          className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded text-[12px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
        ><Pipette size={14} /> Pick from screen</button>
      )}
    </div>,
    document.body,
  );
}

/* The row that opens it — swatch + hex, matching the panel's other fields. */
/* ⚠️ Circle only, no hex. In a palette of seventeen rows the code beside every one turned the list
   into a spreadsheet — and nobody recognises a colour by its code, so the text was noise sitting
   where the colour should be. The value is what the picker is for. */
export function ColorDot({ value, onChange, title }: { value: string; onChange: (v: string) => void; title?: string }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={btnRef}
        title={title}
        onClick={() => setAnchor(anchor ? null : btnRef.current!.getBoundingClientRect())}
        className="size-6 flex-shrink-0 rounded-full border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] transition-transform hover:scale-110"
        style={{ background: value }}
      />
      {anchor && <PortalColorPicker value={value} onChange={onChange} anchor={anchor} onClose={() => setAnchor(null)} />}
    </>
  );
}

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
