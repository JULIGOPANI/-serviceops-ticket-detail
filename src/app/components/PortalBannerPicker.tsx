import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Images, Search, Upload, X } from 'lucide-react';
import { PORTAL_BANNERS } from './portalBannerGallery';
import type { PortalBanner } from './portalBannerGallery';

/* Pick a ready-made banner, or upload your own.
 *
 * ⚠️ CHOOSE sits BESIDE Replace rather than replacing it. They are two different intentions —
 * "give me something that already works" and "use the file I made" — and a portal admin without a
 * designer needs the first one far more often than the second. Collapsing them into one upload zone
 * is what made the banner the hardest thing on the page to change.
 *
 * ⚠️ Thumbnails are the real artwork at the real ratio, drawn with the same `background-size: cover`
 * the band uses. A swatch or a name would make you apply one to find out what it is, and a banner
 * is the single largest thing on the page to get wrong.
 *
 * ⚠️ Portalled to document.body with fixed positioning: the design panel is `overflow-y-auto`, so a
 * popover taller than the space below its field is clipped the moment it opens. The same reason the
 * colour and icon pickers are portalled.
 */
export function PortalBannerPicker({ value, onPick, onUpload, onClose, anchor }: {
  value?: string;
  onPick: (b: PortalBanner) => void;
  onUpload: () => void;
  onClose: () => void;
  anchor: DOMRect;
}) {
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', key); };
  }, [onClose]);

  const W = 420;
  const H = 480;
  const left = Math.max(8, Math.min(anchor.right - W, window.innerWidth - W - 8));
  const top = anchor.bottom + 8 + H <= window.innerHeight - 8
    ? anchor.bottom + 8
    : Math.max(8, anchor.top - H - 8);

  const needle = q.trim().toLowerCase();
  const shown = PORTAL_BANNERS.filter((b) =>
    !needle || b.name.toLowerCase().includes(needle) || b.note.toLowerCase().includes(needle) || b.group.toLowerCase().includes(needle));
  const groups = ['Service desk', 'Seasonal'].filter((g) => shown.some((b) => b.group === g));

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top, left, width: W, maxHeight: H }}
      className="z-[10000] flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_32px_rgba(16,24,40,0.18)]"
    >
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-3 py-2.5">
        <Images size={15} className="flex-shrink-0 text-[#64748B]" />
        <span className="flex-1 text-[13px] font-semibold text-[#364658]">Choose a banner</span>
        <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={15} /></button>
      </div>

      <div className="border-b border-[#E5E7EB] px-3 py-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search banners"
            className="h-8 w-full rounded border border-[#d1d5db] pl-8 pr-2.5 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {groups.map((g) => (
          <div key={g} className="mb-4 last:mb-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{g}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {shown.filter((b) => b.group === g).map((b) => {
                const on = value === b.src;
                return (
                  <button
                    key={b.id}
                    onClick={() => { onPick(b); onClose(); }}
                    title={b.note}
                    className={`group overflow-hidden rounded border text-left transition-all ${
                      on ? 'border-[#3D8BD0] ring-2 ring-[#3D8BD0]/25' : 'border-[#E5E7EB] hover:border-[#3D8BD0]'
                    }`}
                  >
                    {/* The real artwork at the band's own ratio, cropped the way the band crops it. */}
                    <span
                      className="relative block h-[58px] w-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${b.src}")` }}
                    >
                      {on && (
                        <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-[#3D8BD0] text-white">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className="block px-2 py-1.5">
                      <span className="block truncate text-[12px] font-medium text-[#364658]">{b.name}</span>
                      <span className="block truncate text-[11px] text-[#9CA3AF]">{b.note}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!shown.length && (
          <p className="py-8 text-center text-[13px] text-[#9CA3AF]">No banner matches “{q}”.</p>
        )}
      </div>

      {/* ⚠️ Upload stays reachable FROM here. Someone who opened the gallery and found nothing they
          liked should not have to close it and hunt for the other button. */}
      <div className="border-t border-[#E5E7EB] px-3 py-2.5">
        <button
          onClick={() => { onUpload(); onClose(); }}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded border border-[#DFE5ED] bg-white text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
        ><Upload size={13} /> Upload my own image</button>
      </div>
    </div>,
    document.body,
  );
}
