import { useState } from 'react';
import { Check, ChevronDown, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { ColorDot } from './PortalColorPicker';

/* Theme — the portal's own style system.
 *
 * ⚠️ ONE scrolling panel, not a menu of screens. It was four cards that each opened a sub-screen,
 * which meant comparing a font against a palette cost two navigations and you never saw them
 * together — and they only make sense together. Everything is on one surface now: the two choices
 * that reshape the page (style, font) collapse into dropdowns, and the palette, which is the thing
 * an admin actually returns to, stays open underneath them.
 *
 * ⚠️ Mode is LIGHT or DARK, no "auto". A portal is designed and looked at; a mode that follows the
 * visitor's OS is a page its designer never sees. Every colour below carries both values, so the
 * switch re-tints rather than asking anyone to pick twice. */

export interface PortalTheme {
  mode: 'light' | 'dark';
  paletteId: string;
  packId: string;
  buttonId: string;
  /** Overrides on top of the palette — the Custom section and any hand-edited swatch. */
  custom?: Record<string, string>;
}

export const DEFAULT_THEME: PortalTheme = { mode: 'light', paletteId: 'blue', packId: 'inter', buttonId: 'solid' };

/* ── Colour ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ Only PRIMARY varies by theme. Secondary is the status language — green means healthy, red
 * means broken — and a theme that re-tinted it would be changing what a colour MEANS, not how the
 * page looks. Neutral is the greyscale every surface and border is built from; re-tinting that per
 * theme is how a design system loses its floor. So a theme owns four colours and the product owns
 * the other thirteen. That is also why the three sit behind tabs rather than in one long list: they
 * answer to different owners, and mixing them invites edits to the two that are not yours. */
export interface Swatch { key: string; label: string; light: string; dark: string }

export interface Palette {
  id: string; name: string;
  primary: Swatch[];
}

const prim = (
  color: string, alt: string, text: string, bg: string,
  dColor: string, dAlt: string, dText: string, dBg: string,
): Swatch[] => [
  { key: 'primary', label: 'Primary', light: color, dark: dColor },
  { key: 'primaryAlt', label: 'Primary alt', light: alt, dark: dAlt },
  { key: 'pageText', label: 'Page text', light: text, dark: dText },
  { key: 'pageBg', label: 'Page background', light: bg, dark: dBg },
];

export const PALETTES: Palette[] = [
  { id: 'blueMagenta', name: 'Blue Magenta', primary: prim('#69568C', '#3E5277', '#2F4858', '#FFFFFF', '#A48FD1', '#6E86B8', '#E8EEF6', '#141021') },
  { id: 'green', name: 'Green', primary: prim('#4C9A5B', '#2F6B45', '#1B3A28', '#FFFFFF', '#68C77C', '#3E8F5C', '#EAF6EE', '#0E1A13') },
  { id: 'red', name: 'Red', primary: prim('#D6274B', '#96162F', '#3A0E18', '#FFFFFF', '#FF5C7A', '#C23050', '#FDECEF', '#1A0A0E') },
  { id: 'orange', name: 'Orange', primary: prim('#F0842A', '#B85C12', '#40230A', '#FFFFFF', '#FFA35A', '#D97A28', '#FFF3E8', '#1C1108') },
  { id: 'blue', name: 'Blue', primary: prim('#3D8BD0', '#2D6CA0', '#0F172A', '#FFFFFF', '#5AA7E5', '#3D8BD0', '#E8EEF6', '#0F172A') },
  { id: 'slate', name: 'Slate', primary: prim('#475467', '#334155', '#0F172A', '#FFFFFF', '#94A3B8', '#64748B', '#F8FAFC', '#0B1220') },
  { id: 'stone', name: 'Stone', primary: prim('#6B5B4A', '#4A3E32', '#2A211A', '#FFFFFF', '#C4A98C', '#8A7460', '#F5EFE8', '#1A1512') },
  { id: 'teal', name: 'Teal', primary: prim('#0E7C86', '#0A5A61', '#0B2E31', '#FFFFFF', '#3FBFC9', '#12909B', '#E6F6F7', '#08191B') },
];

/* Shared across every theme — see the note above. */
export const SECONDARY: Swatch[] = [
  { key: 'green', label: 'Green', light: '#14B053', dark: '#3ED27A' },
  { key: 'yellow', label: 'Yellow', light: '#E8B407', dark: '#F5C93B' },
  { key: 'orange', label: 'Orange', light: '#F47C22', dark: '#FF9A4D' },
  { key: 'red', label: 'Red', light: '#EC5B5B', dark: '#FF7B7B' },
  { key: 'redDark', label: 'Red dark', light: '#C84235', dark: '#E05C4E' },
  { key: 'redLight', label: 'Red light', light: '#F17A73', dark: '#FF9A93' },
];

export const NEUTRAL: Swatch[] = [
  { key: 'darkest', label: 'Darkest', light: '#05122C', dark: '#F8FAFC' },
  { key: 'darker', label: 'Darker', light: '#374256', dark: '#E2E8F0' },
  { key: 'dark', label: 'Dark', light: '#677387', dark: '#CBD5E1' },
  { key: 'regular', label: 'Regular', light: '#94A3BE', dark: '#94A3B8' },
  { key: 'light', label: 'Light', light: '#B6C2D5', dark: '#475569' },
  { key: 'lighter', label: 'Lighter', light: '#D1DBEC', dark: '#2C384B' },
  { key: 'lightest', label: 'Lightest', light: '#E6EDFB', dark: '#151E2E' },
];

/* Heading + body PAIRINGS, not a flat font list. ⚠️ Choosing two faces that work together is the
   hard part of typography and the part an admin should not have to do. */
export const FONT_PACKS = [
  { id: 'inter', name: 'Inter', heading: 'Inter, sans-serif', body: 'Inter, sans-serif', note: 'The product default. Neutral and highly legible.' },
  { id: 'poppins', name: 'Poppins & Inter', heading: 'Poppins, sans-serif', body: 'Inter, sans-serif', note: 'Geometric headings over a neutral body.' },
  { id: 'source', name: 'Source Sans 3', heading: '"Source Sans 3", sans-serif', body: '"Source Sans 3", sans-serif', note: 'Humanist. Reads well at small sizes.' },
  { id: 'merri', name: 'Merriweather & Inter', heading: 'Merriweather, serif', body: 'Inter, sans-serif', note: 'Serif headings for a more editorial portal.' },
  { id: 'roboto', name: 'Roboto', heading: 'Roboto, sans-serif', body: 'Roboto, sans-serif', note: 'Tight and compact. Good for dense pages.' },
  { id: 'plex', name: 'IBM Plex', heading: '"IBM Plex Sans", sans-serif', body: '"IBM Plex Sans", sans-serif', note: 'Technical, with a strong mono companion.' },
];

export const BUTTON_STYLES = [
  { id: 'solid', name: 'Solid', radius: 6, cls: 'text-white' },
  { id: 'rounded', name: 'Rounded', radius: 999, cls: 'text-white' },
  { id: 'square', name: 'Square', radius: 0, cls: 'text-white' },
  { id: 'outline', name: 'Outline', radius: 6, cls: 'bg-transparent border-2' },
  { id: 'soft', name: 'Soft', radius: 8, cls: '' },
];

/* ⚠️ A theme style carries a palette, a font pairing and a button shape — and shows NO swatches of
   its own in its card. The palette section below is the colour authority; a style card that also
   painted a swatch strip would give two answers to "what colour is this portal", and the one you
   edited would be the one silently overruled the next time you tried a style. */
export const THEME_STYLES = [
  { id: 'clarity', name: 'Clarity', paletteId: 'blue', packId: 'inter', buttonId: 'solid', note: 'The product default — neutral type and lightly rounded buttons.' },
  { id: 'editorial', name: 'Editorial', paletteId: 'stone', packId: 'merri', buttonId: 'outline', note: 'Serif headings and outlined buttons. Reads like a written page.' },
  { id: 'friendly', name: 'Friendly', paletteId: 'green', packId: 'poppins', buttonId: 'rounded', note: 'Geometric type and fully rounded buttons. Approachable.' },
  { id: 'technical', name: 'Technical', paletteId: 'slate', packId: 'plex', buttonId: 'square', note: 'Flat greys and hard corners. Utilitarian by design.' },
  { id: 'warmth', name: 'Warmth', paletteId: 'orange', packId: 'source', buttonId: 'soft', note: 'Amber accents on soft-filled buttons. Inviting without shouting.' },
  { id: 'focus', name: 'Focus', paletteId: 'blueMagenta', packId: 'roboto', buttonId: 'solid', note: 'Compact type and a muted violet accent. The page carries the emphasis.' },
  { id: 'alert', name: 'Alert', paletteId: 'red', packId: 'inter', buttonId: 'solid', note: 'For a status or incident portal, where urgency is the point.' },
  { id: 'calm', name: 'Calm', paletteId: 'teal', packId: 'source', buttonId: 'soft', note: 'Cool teal and humanist type. Quiet under heavy use.' },
];

export const paletteOf = (t: PortalTheme) => PALETTES.find((p) => p.id === t.paletteId) ?? PALETTES[4];
export const packOf = (t: PortalTheme) => FONT_PACKS.find((f) => f.id === t.packId) ?? FONT_PACKS[0];
export const buttonOf = (t: PortalTheme) => BUTTON_STYLES.find((b) => b.id === t.buttonId) ?? BUTTON_STYLES[0];
export const styleOfTheme = (t: PortalTheme) =>
  THEME_STYLES.find((s) => s.paletteId === t.paletteId && s.packId === t.packId && s.buttonId === t.buttonId) ?? null;

/** One swatch's value for the mode that is on, with any override applied. */
export const colorOf = (t: PortalTheme, s: Swatch) => t.custom?.[s.key] ?? (t.mode === 'dark' ? s.dark : s.light);

/** page · surface · muted · accent · ink — what the canvas paints with. */
export const swatchesOf = (t: PortalTheme): [string, string, string, string, string] => {
  const p = paletteOf(t).primary;
  const pick = (k: string) => colorOf(t, p.find((x) => x.key === k)!);
  const n = (k: string) => colorOf(t, NEUTRAL.find((x) => x.key === k)!);
  return [pick('pageBg'), n('lightest'), n('lighter'), pick('primary'), pick('pageText')];
};

/* ── panel chrome ─────────────────────────────────────────────────────────── */

/** A closed row that opens its list beneath it. Used for both of the big choices. */
/* ⚠️ The product's own field chrome — a labelled row over a 36px control with the light chevron,
   the same shape every select in the ticket detail page and the BOM tab uses. It was a bordered
   pill with the label inside it, which is a control this product does not otherwise have.
   ⚠️ And it opens as an INSTANT POPUP layered over the panel, not as an inline expansion. Expanding
   in place pushed the colour section 330px down the panel, so choosing a font moved the thing you
   were comparing it against off screen — and closing it moved everything back, which is the sort of
   jump that makes a panel feel unstable. */
function Dropdown({ label, value, children, open, onToggle }: {
  label: string; value: string; children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-[12px] text-[#7B8FA5]">{label}</p>
      <div className="relative">
        <button
          onClick={onToggle}
          className={`flex h-9 w-full items-center gap-2 rounded border bg-white px-2.5 text-left transition-colors ${
            open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#d1d5db] hover:border-[#3D8BD0]'
          }`}
        >
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{value}</span>
          <ChevronDown size={14} className={`flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            {/* Click anywhere else to dismiss — a popover that only closes from its own trigger is
                a modal pretending not to be one. */}
            <span className="fixed inset-0 z-[70]" onClick={onToggle} />
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[71] max-h-[330px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const Row = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`mb-1 block w-full rounded-md border-2 p-2.5 text-left transition-colors last:mb-0 ${
      on ? 'border-[#3D8BD0] bg-[#F5F9FD]' : 'border-transparent bg-[#F7F9FC] hover:bg-[#F1F5F9]'
    }`}
  >{children}</button>
);

/** The two things a style actually decides — the type and the button. No colour. */
function StylePreview({ packId, buttonId, accent }: { packId: string; buttonId: string; accent: string }) {
  const f = FONT_PACKS.find((x) => x.id === packId)!;
  const b = BUTTON_STYLES.find((x) => x.id === buttonId)!;
  const bare = b.id === 'outline';
  const soft = b.id === 'soft';
  return (
    <span className="flex items-center gap-2.5 rounded-md bg-[#EAF2FB] px-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span style={{ fontFamily: f.heading }} className="block truncate text-[15px] font-bold text-[#0F172A]">Heading</span>
        <span style={{ fontFamily: f.body }} className="block truncate text-[12px] text-[#7B8FA5]">Paragraph text</span>
      </span>
      <span
        style={{
          borderRadius: b.radius,
          background: bare ? 'transparent' : soft ? `${accent}26` : accent,
          borderColor: accent,
          color: bare || soft ? accent : '#FFFFFF',
        }}
        className={`inline-flex h-7 flex-shrink-0 items-center px-3 text-[12px] font-medium ${b.cls}`}
      >Button</span>
    </span>
  );
}

/* ── the panel ────────────────────────────────────────────────────────────── */

type Tab = 'primary' | 'secondary' | 'neutral';

export function PortalThemePanel({ theme, onChange }: { theme: PortalTheme; onChange: (patch: Partial<PortalTheme>) => void }) {
  const [openList, setOpenList] = useState<'style' | 'font' | null>(null);
  const [tab, setTab] = useState<Tab>('primary');
  const style = styleOfTheme(theme);
  const pack = packOf(theme);
  const palette = paletteOf(theme);

  const swatches: Record<Tab, Swatch[]> = { primary: palette.primary, secondary: SECONDARY, neutral: NEUTRAL };

  /* One write, several values. ⚠️ Applying a style's parts one at a time would render impossible
     intermediate themes on the way — a green palette briefly wearing Merriweather — which reads as
     a glitch rather than a change. Overrides clear with it: picking a style means "give me this
     one", not "this one, still wearing the four colours I hand-edited an hour ago". */
  const applyStyle = (st: (typeof THEME_STYLES)[number]) => {
    onChange({ paletteId: st.paletteId, packId: st.packId, buttonId: st.buttonId, custom: {} });
    setOpenList(null);
    toast.success(`${st.name} applied`);
  };

  const setCustom = (key: string, value: string) => onChange({ custom: { ...(theme.custom ?? {}), [key]: value } });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <Dropdown
        label="Theme style"
        value={style?.name ?? 'Custom'}
        open={openList === 'style'}
        onToggle={() => setOpenList((o) => (o === 'style' ? null : 'style'))}
      >
        {THEME_STYLES.map((st) => {
          const p = PALETTES.find((x) => x.id === st.paletteId)!;
          const acc = theme.mode === 'dark' ? p.primary[0].dark : p.primary[0].light;
          return (
            <Row key={st.id} on={style?.id === st.id} onClick={() => applyStyle(st)}>
              {/* Name, then what it looks like, then why you would pick it — the order the question
                  is actually asked in. */}
              <span className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[#364658]">{st.name}</span>
                {style?.id === st.id && <Check size={13} className="text-[#3D8BD0]" />}
              </span>
              <StylePreview packId={st.packId} buttonId={st.buttonId} accent={acc} />
              <span className="mt-1.5 block text-[11px] leading-[1.5] text-[#9CA3AF]">{st.note}</span>
            </Row>
          );
        })}
      </Dropdown>

      <Dropdown
        label="Fonts"
        value={pack.name}
        open={openList === 'font'}
        onToggle={() => setOpenList((o) => (o === 'font' ? null : 'font'))}
      >
        {FONT_PACKS.map((f) => (
          <Row key={f.id} on={f.id === pack.id} onClick={() => { onChange({ packId: f.id }); setOpenList(null); toast.success(`${f.name} applied`); }}>
            {/* ⚠️ Set IN the faces it applies. A font list rendered in the UI's own font is a list of
                words, not a list of fonts.
                ⚠️ The NAME rides on the heading's line, not under the sample. Below, it read as a
                third line of the specimen — a caption competing with the two lines that are the
                actual preview — and it pushed every row 18px taller, so fewer pairings fitted in the
                popover at once, which is the one thing a comparison list must not cost you. */}
            <span className="flex items-baseline gap-2">
              <span style={{ fontFamily: f.heading }} className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[#364658]">HEADING</span>
              <span className="flex flex-shrink-0 items-center gap-1 text-[11px] font-medium text-[#7B8FA5]">
                {f.name}
                {f.id === pack.id && <Check size={12} className="text-[#3D8BD0]" />}
              </span>
            </span>
            <span style={{ fontFamily: f.body }} className="mt-0.5 block text-[12px] text-[#5B7A99]">This is your paragraph.</span>
          </Row>
        ))}
      </Dropdown>

      {/* ── Colours ── */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Colours</span>
        {/* ⚠️ Mode sits ON the palette, because mode is a fact ABOUT the palette — every swatch below
            carries a light and a dark value, and this switch says which of the two you are looking
            at. Higher up the panel it read as "preview the page in dark", which is a different
            promise from "edit the dark colours". */}
        <span className="ml-auto flex items-center gap-0.5 rounded bg-[#F1F5F9] p-0.5">
          {([['light', Sun], ['dark', Moon]] as const).map(([m, Ic]) => (
            <button
              key={m}
              onClick={() => onChange({ mode: m })}
              title={m === 'light' ? 'Light mode' : 'Dark mode'}
              className={`flex size-6 items-center justify-center rounded transition-colors ${
                theme.mode === m ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#9CA3AF] hover:text-[#364658]'
              }`}
            ><Ic size={13} /></button>
          ))}
        </span>
      </div>

      {/* ⚠️ mt-3.5, not mt-2. The tabs sat almost on the heading, so the two read as one control and
          "COLOURS" looked like a label for the tab strip rather than the section head above it. */}
      <div className="mt-3.5 flex gap-1 rounded bg-[#F1F5F9] p-0.5">
        {(['primary', 'secondary', 'neutral'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded py-1 text-[12px] font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#7B8FA5] hover:text-[#364658]'
            }`}
          >{t}</button>
        ))}
      </div>

      <p className="mt-2 text-[11px] leading-[1.5] text-[#9CA3AF]">
        {tab === 'primary' ? 'Set by the theme style. Change one to depart from it.'
          : tab === 'secondary' ? 'Status colours — green means healthy, red means broken. Shared by every theme.'
            : 'The greyscale every surface and border is built from. Shared by every theme.'}
      </p>

      <div className="mt-1.5">
        {swatches[tab].map((sw) => (
          /* ⚠️ A name and a circle, no hex. The value is what the picker is for; printing it beside
             every row turns a palette into a spreadsheet, and nobody recognises a colour by its code. */
          <div key={sw.key} className="flex items-center gap-3 border-b border-dashed border-[#E5E7EB] py-2 last:border-b-0">
            <span className="flex-1 truncate text-[13px] text-[#364658]">{sw.label}</span>
            <ColorDot value={colorOf(theme, sw)} onChange={(v) => setCustom(sw.key, v)} title={sw.label} />
          </div>
        ))}
      </div>

      {/* ── Custom ── */}
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Custom</p>
      <p className="mt-1.5 text-[11px] leading-[1.5] text-[#9CA3AF]">
        Three overrides that sit on top of whichever style is chosen.
      </p>
      <div className="mt-1.5">
        {[
          { key: 'pageBg', label: 'Page background', from: palette.primary.find((x) => x.key === 'pageBg')! },
          { key: 'pageText', label: 'Heading text', from: palette.primary.find((x) => x.key === 'pageText')! },
          { key: 'bodyText', label: 'Body text', from: NEUTRAL.find((x) => x.key === 'dark')! },
        ].map((f) => (
          <div key={f.key} className="flex items-center gap-3 border-b border-dashed border-[#E5E7EB] py-2 last:border-b-0">
            <span className="flex-1 truncate text-[13px] text-[#364658]">{f.label}</span>
            <ColorDot value={theme.custom?.[f.key] ?? colorOf(theme, f.from)} onChange={(v) => setCustom(f.key, v)} title={f.label} />
          </div>
        ))}
      </div>
    </div>
  );
}
