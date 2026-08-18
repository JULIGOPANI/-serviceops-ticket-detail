import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Field, Segmented } from './PortalControls';

/* Theme — the page's own style system, in the builder rail.
 *
 * ⚠️ Four cards, each a PREVIEW of what it edits, and each opening its own screen. That shape is
 * deliberate: a theme is four independent decisions (mode, palette, type, buttons) and flattening
 * them into one scrolling list means every change costs you your place in the other three. The card
 * shows the current answer, so the panel is readable without opening anything.
 *
 * ⚠️ Mode is LIGHT or DARK, not a third "auto". A portal is a thing an admin designs and looks at;
 * a mode that changes with the visitor's OS is a page the designer cannot see. The palettes carry
 * both sets, so switching mode re-tints rather than re-picking. */

export interface PortalTheme {
  mode: 'light' | 'dark';
  paletteId: string;
  packId: string;
  buttonId: string;
}

export const DEFAULT_THEME: PortalTheme = { mode: 'light', paletteId: 'service', packId: 'inter', buttonId: 'solid' };

export interface Palette {
  id: string; name: string;
  /** page · surface · muted · accent · ink — light first, dark second. */
  light: [string, string, string, string, string];
  dark: [string, string, string, string, string];
}

export const PALETTES: Palette[] = [
  { id: 'stone', name: 'Stone', light: ['#FFFFFF', '#E7D9CC', '#C2CBCC', '#3D4436', '#000000'], dark: ['#14140F', '#2A251F', '#3A4240', '#C9D3C4', '#FFFFFF'] },
  { id: 'service', name: 'ServiceOps', light: ['#FFFFFF', '#EBF5FF', '#DFE5ED', '#3D8BD0', '#0F172A'], dark: ['#0F172A', '#16233A', '#2A3A55', '#5AA7E5', '#FFFFFF'] },
  { id: 'forest', name: 'Forest', light: ['#FFFFFF', '#E8F3EC', '#CBDCD2', '#22A06B', '#14342A'], dark: ['#101F19', '#17301F', '#2A4436', '#4FD39B', '#F2FBF6'] },
  { id: 'ember', name: 'Ember', light: ['#FFFFFF', '#FDF1E5', '#E8D8C8', '#F58518', '#3A2410'], dark: ['#1C1208', '#2C1D0E', '#48331B', '#FFA94D', '#FFF6EC'] },
  { id: 'violet', name: 'Violet', light: ['#FFFFFF', '#F2EEFC', '#DDD5F0', '#7C3AED', '#241548'], dark: ['#150E24', '#211539', '#382657', '#A987F7', '#F5F1FE'] },
  { id: 'slate', name: 'Slate', light: ['#FFFFFF', '#F1F5F9', '#CBD5E1', '#475467', '#0F172A'], dark: ['#0B1220', '#151E2E', '#2C384B', '#94A3B8', '#F8FAFC'] },
];

/* Heading + body PAIRINGS, not a flat font list. ⚠️ Choosing two faces that work together is the
   hard part of typography and the part an admin should not have to do — so the unit of choice is a
   pairing with a name, and the loose "pick any two" version is what produces the ransom notes. */
export const FONT_PACKS = [
  { id: 'inter', name: 'Inter', heading: 'Inter, sans-serif', body: 'Inter, sans-serif', note: 'The product default. Neutral and highly legible.' },
  { id: 'poppins', name: 'Poppins & Inter', heading: 'Poppins, sans-serif', body: 'Inter, sans-serif', note: 'Geometric headings over a neutral body.' },
  { id: 'source', name: 'Source Sans 3', heading: '"Source Sans 3", sans-serif', body: '"Source Sans 3", sans-serif', note: 'Humanist. Reads well at small sizes.' },
  { id: 'merri', name: 'Merriweather & Inter', heading: 'Merriweather, serif', body: 'Inter, sans-serif', note: 'Serif headings for a more editorial portal.' },
  { id: 'roboto', name: 'Roboto', heading: 'Roboto, sans-serif', body: 'Roboto, sans-serif', note: 'Tight and compact. Good for dense pages.' },
  { id: 'plex', name: 'IBM Plex', heading: '"IBM Plex Sans", sans-serif', body: '"IBM Plex Sans", sans-serif', note: 'Technical, with a strong mono companion.' },
];

/* ⚠️ Button STYLE is shape and weight, not colour — colour comes from the palette's accent. The
   three names an admin already has (primary, secondary, tertiary) say WHICH button; these say what
   all of them look like. Two different questions, which is why this is its own screen. */
export const BUTTON_STYLES = [
  { id: 'solid', name: 'Solid', radius: 6, cls: 'text-white' },
  { id: 'rounded', name: 'Rounded', radius: 999, cls: 'text-white' },
  { id: 'square', name: 'Square', radius: 0, cls: 'text-white' },
  { id: 'outline', name: 'Outline', radius: 6, cls: 'bg-transparent border-2' },
  { id: 'soft', name: 'Soft', radius: 8, cls: '' },
  { id: 'underline', name: 'Text only', radius: 0, cls: 'bg-transparent underline' },
];

type Screen = null | 'palette' | 'fonts' | 'buttons';

/** A card whose body IS the preview of what it opens. */
function StyleCard({ title, onOpen, children }: { title: string; onOpen: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onOpen}
      className="mt-2 flex w-full items-center gap-2 rounded-lg bg-[#F7F9FC] p-3 text-left transition-colors hover:bg-[#F1F5F9]"
    >
      <span className="min-w-0 flex-1">
        <span className="mb-2 block text-[12px] font-medium text-[#7B8FA5]">{title}</span>
        {children}
      </span>
      <ChevronRight size={16} className="flex-shrink-0 text-[#9CA3AF]" />
    </button>
  );
}

const Strip = ({ colors }: { colors: string[] }) => (
  <span className="flex h-9 w-full overflow-hidden rounded border border-[#E5E7EB]">
    {colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
  </span>
);

export const paletteOf = (t: PortalTheme) => PALETTES.find((p) => p.id === t.paletteId) ?? PALETTES[1];
export const packOf = (t: PortalTheme) => FONT_PACKS.find((f) => f.id === t.packId) ?? FONT_PACKS[0];
export const buttonOf = (t: PortalTheme) => BUTTON_STYLES.find((b) => b.id === t.buttonId) ?? BUTTON_STYLES[0];
/** page - surface - muted - accent - ink, for whichever mode is on. */
export const swatchesOf = (t: PortalTheme) => (t.mode === 'dark' ? paletteOf(t).dark : paletteOf(t).light);

export function PortalThemePanel({ theme, onChange }: { theme: PortalTheme; onChange: (patch: Partial<PortalTheme>) => void }) {
  const [screen, setScreen] = useState<Screen>(null);
  const mode = theme.mode;
  const setMode = (m: 'light' | 'dark') => onChange({ mode: m });
  const palette = paletteOf(theme);
  const setPalette = (p: Palette) => onChange({ paletteId: p.id });
  const pack = packOf(theme);
  const setPack = (f: (typeof FONT_PACKS)[number]) => onChange({ packId: f.id });
  const btn = buttonOf(theme);
  const setBtn = (b: (typeof BUTTON_STYLES)[number]) => onChange({ buttonId: b.id });

  const swatches = mode === 'dark' ? palette.dark : palette.light;
  const accent = swatches[3];

  const back = (title: string) => (
    <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-4 py-2.5">
      <button
        onClick={() => setScreen(null)}
        className="flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"
      ><ChevronLeft size={16} /></button>
      <span className="text-[13px] font-medium text-[#364658]">{title}</span>
    </div>
  );

  /* ── sub-screens ── */
  if (screen === 'palette') {
    return (
      <div className="flex h-full flex-col">
        {back('Colours')}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="mb-3 text-[12px] leading-[1.55] text-[#7B8FA5]">
            Each palette carries a light and a dark set, so switching mode re-tints the page rather
            than asking you to choose again.
          </p>
          {PALETTES.map((p) => {
            const on = p.id === palette.id;
            return (
              <button
                key={p.id}
                onClick={() => { setPalette(p); toast.success(`${p.name} applied`); }}
                className={`mb-2 flex w-full items-center gap-3 rounded-lg border-2 p-2.5 text-left transition-colors ${
                  on ? 'border-[#3D8BD0] bg-[#F5F9FD]' : 'border-transparent bg-[#F7F9FC] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="mb-1.5 flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-[#364658]">{p.name}</span>
                    {on && <Check size={13} className="text-[#3D8BD0]" />}
                  </span>
                  <Strip colors={mode === 'dark' ? p.dark : p.light} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === 'fonts') {
    return (
      <div className="flex h-full flex-col">
        {back('Fonts')}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {FONT_PACKS.map((f) => {
            const on = f.id === pack.id;
            return (
              <button
                key={f.id}
                onClick={() => { setPack(f); toast.success(`${f.name} applied`); }}
                className={`mb-2 w-full rounded-lg border-2 p-3 text-left transition-colors ${
                  on ? 'border-[#3D8BD0] bg-[#F5F9FD]' : 'border-transparent bg-[#F7F9FC] hover:bg-[#F1F5F9]'
                }`}
              >
                {/* ⚠️ Set IN the faces it applies. A font list rendered in the UI's own font is a
                    list of words, not a list of fonts. */}
                <span style={{ fontFamily: f.heading }} className="block text-[19px] font-semibold text-[#364658]">Heading</span>
                <span style={{ fontFamily: f.body }} className="mt-0.5 block text-[13px] text-[#5B7A99]">This is your paragraph text.</span>
                <span className="mt-2 flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-[#7B8FA5]">{f.name}</span>
                  {on && <Check size={13} className="text-[#3D8BD0]" />}
                </span>
                <span className="mt-0.5 block text-[11px] leading-[1.5] text-[#9CA3AF]">{f.note}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === 'buttons') {
    return (
      <div className="flex h-full flex-col">
        {back('Buttons')}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="mb-3 text-[12px] leading-[1.55] text-[#7B8FA5]">
            The shape every button takes. Which button is primary or secondary stays on the button
            itself — this is how all of them look.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BUTTON_STYLES.map((b) => {
              const on = b.id === btn.id;
              const outline = b.id === 'outline';
              const soft = b.id === 'soft';
              const text = b.id === 'underline';
              return (
                <button
                  key={b.id}
                  onClick={() => { setBtn(b); toast.success(`${b.name} buttons applied`); }}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                    on ? 'border-[#3D8BD0] bg-[#F5F9FD]' : 'border-transparent bg-[#F7F9FC] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span
                    style={{
                      borderRadius: b.radius,
                      background: outline || text ? 'transparent' : soft ? `${accent}22` : accent,
                      borderColor: accent,
                      color: outline || soft || text ? accent : '#FFFFFF',
                    }}
                    className={`inline-flex h-8 items-center px-4 text-[12px] font-medium ${b.cls}`}
                  >Button</span>
                  <span className="text-[11px] font-medium text-[#64748B]">{b.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── the four cards ── */
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      <Field label="Mode">
        {/* ⚠️ Two modes, no "auto". A portal is designed and looked at; a mode that follows the
            visitor's OS is a page its designer never sees. */}
        <Segmented
          value={mode}
          onChange={(m) => setMode(m as 'light' | 'dark')}
          options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
        />
      </Field>

      <StyleCard title="Theme" onOpen={() => setScreen('palette')}>
        <span
          className="flex items-center gap-2 rounded p-2"
          style={{ background: swatches[1] }}
        >
          <span style={{ fontFamily: pack.heading, color: swatches[4] }} className="text-[17px] font-semibold">AA</span>
          <Strip colors={swatches} />
          <span
            style={{ background: accent, borderRadius: btn.radius === 999 ? 999 : btn.radius }}
            className="inline-flex h-6 flex-shrink-0 items-center px-2.5 text-[10px] font-medium text-white"
          >Button</span>
        </span>
      </StyleCard>

      <StyleCard title="Fonts" onOpen={() => setScreen('fonts')}>
        <span style={{ fontFamily: pack.heading }} className="block text-[17px] font-semibold text-[#364658]">HEADING</span>
        <span style={{ fontFamily: pack.body }} className="block text-[12px] text-[#5B7A99]">This is your paragraph.</span>
      </StyleCard>

      <StyleCard title="Colours" onOpen={() => setScreen('palette')}>
        <Strip colors={swatches} />
      </StyleCard>

      <StyleCard title="Buttons" onOpen={() => setScreen('buttons')}>
        <span
          style={{
            background: btn.id === 'outline' || btn.id === 'underline' ? 'transparent' : btn.id === 'soft' ? `${accent}22` : accent,
            borderRadius: btn.radius,
            borderColor: accent,
            color: btn.id === 'outline' || btn.id === 'soft' || btn.id === 'underline' ? accent : '#FFFFFF',
          }}
          className={`inline-flex h-8 items-center px-4 text-[12px] font-medium ${btn.cls}`}
        >Button</span>
      </StyleCard>

      {/* ⚠️ No Forms card. The portal's only form is the hero search, which the Banner already owns —
          a Forms section here would style something this page does not have. */}
    </div>
  );
}
