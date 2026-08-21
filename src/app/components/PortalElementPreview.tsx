import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/* Element preview — what this thing looks like on a page, and why you would reach for it.
 *
 * ⚠️ A WIREFRAME, not a screenshot and not the real component. The library is a list of names, and a
 * name is the worst possible description of a visual element — "Text" and "List" and "Card" all
 * sound equally plausible for the same job. A grey-bar sketch answers "what shape does this leave on
 * my page" in the time it takes to hover, which is the actual question, and it does it without
 * promising specific copy or colours the element does not yet have.
 *
 * ⚠️ The dark surface is deliberate. This floats over a white panel on a white canvas; a light card
 * would read as part of the page it is describing. Dark is the one value that says "this is a note
 * about the thing, not the thing".
 *
 * ⚠️ Variants CAROUSEL rather than a grid. Button is four different buttons and Text is five
 * different blocks — the whole reason someone hesitates over these rows is that the name hides the
 * range. Cycling shows the range without asking for a click, and the dots make it clear more exists
 * even in the first second. */

interface Variant { name: string; art: ReactNode }
interface Preview { why: string; variants: Variant[] }

/* ── Wireframe primitives ─────────────────────────────────────────────────────
   Every sketch is built from these four, so no two previews can drift into
   different visual languages. Widths are fractions of the card, never pixels. */
const bar = (w: string, h = 8, cls = 'bg-[#4A4A4E]') => (
  <span className={`block rounded-full ${cls}`} style={{ width: w, height: h }} />
);
const box = (children: ReactNode, cls = '') => (
  <span className={`flex flex-col gap-1.5 rounded-md border border-[#4A4A4E] bg-[#2C2C30] p-2.5 ${cls}`}>{children}</span>
);
const dot = (size = 14, cls = 'bg-[#4A4A4E]') => (
  <span className={`block flex-shrink-0 rounded-full ${cls}`} style={{ width: size, height: size }} />
);
const pill = (w: string, cls: string) => (
  <span className={`block h-6 ${cls}`} style={{ width: w }} />
);

const stack = (children: ReactNode, cls = '') => (
  <span className={`flex w-full flex-col gap-2 ${cls}`}>{children}</span>
);
const row = (children: ReactNode, cls = '') => (
  <span className={`flex w-full items-center gap-2 ${cls}`}>{children}</span>
);

/* ── The catalogue ────────────────────────────────────────────────────────────
   ⚠️ `why` answers "why this one rather than the one above it", not "what is a button". A
   description that restates the name is the thing people learn to skip. */
const PREVIEWS: Record<string, Preview> = {
  /* Basic — the elements whose name hides the most range, which is why they carry the most variants. */
  'b-button': {
    why: 'One clear next step. Use the filled style for the action you want taken, and the quieter ones for everything beside it.',
    variants: [
      { name: 'Primary', art: row(<>{pill('86px', 'rounded-md bg-[#5B8DEF]')}</>, 'justify-center') },
      { name: 'Secondary', art: row(<>{pill('86px', 'rounded-md bg-[#4A4A4E]')}</>, 'justify-center') },
      { name: 'Outline', art: row(<>{pill('86px', 'rounded-md border border-[#5B8DEF] bg-transparent')}</>, 'justify-center') },
      { name: 'Text link', art: row(<>{bar('72px', 8, 'bg-[#5B8DEF]')}</>, 'justify-center') },
    ],
  },
  'b-text': {
    why: 'Any words that are not a heading — a paragraph, a note, a caption. One element that becomes whichever of those you set it to.',
    variants: [
      { name: 'Paragraph', art: stack(<>{bar('100%')}{bar('92%')}{bar('64%')}</>) },
      { name: 'Heading', art: stack(<>{bar('70%', 14)}{bar('100%', 6, 'bg-[#3A3A3E]')}{bar('80%', 6, 'bg-[#3A3A3E]')}</>) },
      { name: 'Small text', art: stack(<>{bar('100%', 6)}{bar('86%', 6)}</>) },
      { name: 'Quote', art: row(<>{bar('3px', 34, 'bg-[#5B8DEF] rounded-sm')}{stack(<>{bar('100%')}{bar('72%')}</>)}</>) },
    ],
  },
  'b-list': {
    why: 'Points that belong together and are read in order. Each row is one idea, so nothing gets buried mid-paragraph.',
    variants: [
      { name: 'Bulleted', art: stack(<>{row(<>{dot(6)}{bar('80%')}</>)}{row(<>{dot(6)}{bar('64%')}</>)}{row(<>{dot(6)}{bar('72%')}</>)}</>) },
      { name: 'With description', art: stack(<>{row(<>{dot(6)}{stack(<>{bar('60%')}{bar('88%', 6, 'bg-[#3A3A3E]')}</>, 'gap-1')}</>, 'items-start')}{row(<>{dot(6)}{stack(<>{bar('52%')}{bar('76%', 6, 'bg-[#3A3A3E]')}</>, 'gap-1')}</>, 'items-start')}</>) },
      { name: 'Numbered', art: stack(<>{row(<>{bar('8px', 8, 'bg-[#5B8DEF]')}{bar('80%')}</>)}{row(<>{bar('8px', 8, 'bg-[#5B8DEF]')}{bar('64%')}</>)}{row(<>{bar('8px', 8, 'bg-[#5B8DEF]')}{bar('72%')}</>)}</>) },
    ],
  },
  'b-divider': {
    why: 'A visible break between two things that would otherwise read as one. Cheaper than a whole section.',
    variants: [
      { name: 'Line', art: stack(<>{bar('100%', 6, 'bg-[#3A3A3E]')}{bar('100%', 2, 'bg-[#5A5A5E]')}{bar('80%', 6, 'bg-[#3A3A3E]')}</>) },
      { name: 'Spacer', art: stack(<>{bar('100%', 6, 'bg-[#3A3A3E]')}{<span className="block h-5" />}{bar('80%', 6, 'bg-[#3A3A3E]')}</>) },
    ],
  },
  'b-accordion': {
    why: 'Long answers that most people will not read. Collapsed, the page stays short; open, nobody had to leave it.',
    variants: [
      { name: 'Collapsed', art: stack(<>{row(<>{bar('64%')}{<span className="ml-auto">{dot(8)}</span>}</>)}{bar('100%', 1, 'bg-[#3A3A3E]')}{row(<>{bar('56%')}{<span className="ml-auto">{dot(8)}</span>}</>)}</>) },
      { name: 'One open', art: stack(<>{row(<>{bar('64%')}{<span className="ml-auto">{dot(8, 'bg-[#5B8DEF]')}</span>}</>)}{stack(<>{bar('100%', 6, 'bg-[#3A3A3E]')}{bar('82%', 6, 'bg-[#3A3A3E]')}</>, 'gap-1 pl-2')}{bar('100%', 1, 'bg-[#3A3A3E]')}{row(<>{bar('56%')}</>)}</>) },
    ],
  },
  'b-table': {
    why: 'Values that are compared across rows. If the reader needs to scan one column, this is the only layout that lets them.',
    variants: [
      { name: 'Table', art: stack(<>{row(<>{bar('30%', 6, 'bg-[#6A6A6E]')}{bar('30%', 6, 'bg-[#6A6A6E]')}{bar('30%', 6, 'bg-[#6A6A6E]')}</>)}{bar('100%', 1, 'bg-[#4A4A4E]')}{row(<>{bar('30%')}{bar('30%')}{bar('30%')}</>)}{row(<>{bar('30%')}{bar('30%')}{bar('30%')}</>)}</>) },
    ],
  },
  'b-text-image': {
    why: 'A picture that belongs to the words beside it. The text wraps, so the two read as one thought rather than two blocks.',
    variants: [
      { name: 'Image left', art: row(<>{box(<>{dot(18, 'bg-[#5A5A5E]')}</>, 'h-[52px] w-[52px] items-center justify-center')}{stack(<>{bar('100%')}{bar('88%')}{bar('60%')}</>)}</>, 'items-start') },
      { name: 'Image right', art: row(<>{stack(<>{bar('100%')}{bar('88%')}{bar('60%')}</>)}{box(<>{dot(18, 'bg-[#5A5A5E]')}</>, 'h-[52px] w-[52px] items-center justify-center')}</>, 'items-start') },
    ],
  },
  'b-tabs': {
    why: 'Several full pages of content in one block, when only one is wanted at a time.',
    variants: [
      { name: 'Tabs', art: stack(<>{row(<>{bar('26%', 8, 'bg-[#5B8DEF]')}{bar('22%')}{bar('24%')}</>)}{bar('100%', 1, 'bg-[#4A4A4E]')}{stack(<>{bar('100%', 6, 'bg-[#3A3A3E]')}{bar('76%', 6, 'bg-[#3A3A3E]')}</>, 'gap-1')}</>) },
    ],
  },

  /* Visual */
  'v-image': {
    why: 'A picture in its own right — a screenshot, a photo, a diagram. Placed as an element so it can be sized and aligned.',
    variants: [{ name: 'Image', art: box(<>{row(<>{dot(20, 'bg-[#5A5A5E]')}</>, 'justify-center')}</>, 'h-[76px] items-center justify-center') }],
  },
  'v-slider': {
    why: 'Several images in the height of one. Worth it when the pictures are alternatives rather than a sequence.',
    variants: [{ name: 'Slider', art: stack(<>{box(<>{row(<>{dot(18, 'bg-[#5A5A5E]')}</>, 'justify-center')}</>, 'h-[58px] items-center justify-center')}{row(<>{dot(5, 'bg-[#5B8DEF]')}{dot(5)}{dot(5)}</>, 'justify-center')}</>) }],
  },
  'v-icon': {
    why: 'A single symbol carrying meaning on its own — a status, a category, a nudge toward an action.',
    variants: [{ name: 'Icon', art: row(<>{box(<>{dot(20, 'bg-[#5B8DEF]')}</>, 'h-[46px] w-[46px] items-center justify-center')}</>, 'justify-center') }],
  },

  /* Live data — one preview each; these have no styling variants, they have a data source. */
  'c-requests': {
    why: 'The requester’s own open tickets. The single most common reason anyone opens the portal at all.',
    variants: [{ name: 'My Requests', art: stack(<>{row(<>{bar('44%', 9, 'bg-[#6A6A6E]')}{<span className="ml-auto">{bar('28px', 8, 'bg-[#5B8DEF]')}</span>}</>)}{row(<>{bar('18px', 8, 'bg-[#5B8DEF]')}{bar('54%')}{<span className="ml-auto">{pill('34px', 'h-3 rounded-full bg-[#4A4A4E]')}</span>}</>)}{row(<>{bar('18px', 8, 'bg-[#5B8DEF]')}{bar('46%')}{<span className="ml-auto">{pill('34px', 'h-3 rounded-full bg-[#4A4A4E]')}</span>}</>)}</>) }],
  },
  'c-approvals': {
    why: 'Things waiting on this person. It belongs high on the page because it is work only they can unblock.',
    variants: [{ name: 'Pending Approvals', art: stack(<>{row(<>{bar('50%', 9, 'bg-[#6A6A6E]')}</>)}{row(<>{stack(<>{bar('70%')}{bar('44%', 6, 'bg-[#3A3A3E]')}</>, 'gap-1')}{<span className="ml-auto flex gap-1">{dot(12, 'bg-[#3E7B57]')}{dot(12, 'bg-[#8A4444]')}</span>}</>, 'items-start')}</>) }],
  },
  'c-knowledge': {
    why: 'Articles that answer the questions people were about to raise a ticket about. Deflection, without saying no to anyone.',
    variants: [{ name: 'Most Read', art: stack(<>{row(<>{bar('40%', 9, 'bg-[#6A6A6E]')}</>)}{row(<>{dot(12)}{bar('64%')}</>)}{row(<>{dot(12)}{bar('54%')}</>)}{row(<>{dot(12)}{bar('60%')}</>)}</>) }],
  },
  'c-announcements': {
    why: 'One message everybody needs before they do anything else — an outage, a maintenance window, a deadline.',
    variants: [{ name: 'Announcements', art: box(<>{row(<>{dot(14, 'bg-[#5B8DEF]')}{bar('56%')}</>)}{bar('100%', 6, 'bg-[#3A3A3E]')}{bar('72%', 6, 'bg-[#3A3A3E]')}</>) }],
  },

  /* Actions — fixed destinations, so the preview shows the card shape they all share. */
  'act-incident': {
    why: 'The way in for “something is broken”. A card rather than a link, because it is the page’s main job.',
    variants: [{ name: 'Action card', art: box(<>{row(<>{box(<>{dot(14, 'bg-[#5B8DEF]')}</>, 'h-8 w-8 items-center justify-center')}{stack(<>{bar('62%')}{bar('84%', 6, 'bg-[#3A3A3E]')}</>, 'gap-1')}</>)}</>) }],
  },
};

/* Everything without an entry still gets a card — a generic block sketch and its group's reason.
   ⚠️ Falling back to NOTHING would make the hover feel broken on exactly the rows people are least
   sure about; a plain sketch is honest and still says "this is a block on your page". */
const FALLBACK: Preview = {
  why: 'Drops onto the page as its own block. Select it to set its content and style.',
  variants: [{ name: 'Block', art: stack(<>{bar('58%', 9, 'bg-[#6A6A6E]')}{bar('100%', 6, 'bg-[#3A3A3E]')}{bar('84%', 6, 'bg-[#3A3A3E]')}</>) }],
};

const CARD_W = 300;

export function PortalElementPreview({ elementId, anchor }: { elementId: string; anchor: DOMRect }) {
  const preview = PREVIEWS[elementId] ?? FALLBACK;
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(anchor.top);

  /* ⚠️ Measured AFTER render and clamped to the viewport. The card's height depends on how many
     variants it holds and how long the reason is, so a fixed estimate puts short ones too low and
     clips tall ones off the bottom. */
  useEffect(() => {
    const h = ref.current?.offsetHeight ?? 200;
    const wanted = anchor.top + anchor.height / 2 - h / 2;
    setTop(Math.max(12, Math.min(wanted, window.innerHeight - h - 12)));
  }, [anchor.top, anchor.height, elementId, preview.why, preview.variants.length]);

  const many = preview.variants.length > 1;

  return createPortal(
    /* Portalled to the body: the library scrolls, so a popover inside it is clipped the moment it is
       taller than the space beside its row. `pointer-events-none` keeps the card from stealing the
       hover that is keeping it open. */
    <div
      ref={ref}
      style={{ top, left: Math.max(12, anchor.left - CARD_W - 12), width: CARD_W }}
      className="pointer-events-none fixed z-[10002] overflow-hidden rounded-xl bg-[#1C1C1F] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)]"
    >
      {/* The stage — a dotted ground so the sketches read as "on a page", with each variant framed
          the way the canvas frames a selection. */}
      <div
        className="relative px-4 py-4"
        style={{
          backgroundImage: 'radial-gradient(circle, #3A3A3E 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }}
      >
        <div className="flex flex-col gap-2.5">
          {preview.variants.map((v) => (
            <div key={v.name}>
              {/* ⚠️ The name sits ABOVE its own sketch, not in a shared caption. With every variant
                  on screen at once a single label could only ever name one of them, and the reader
                  would have to guess which. A lone variant needs no label — the row you are hovering
                  already said what it is. */}
              {many && (
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">{v.name}</p>
              )}
              <div className="w-full rounded-lg border border-white/85 bg-[#232326] px-3.5 py-3">
                {v.art}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-3.5 pt-3">
        <p className="text-[12px] leading-[1.5] text-white/55">{preview.why}</p>
      </div>
    </div>,
    document.body,
  );
}
