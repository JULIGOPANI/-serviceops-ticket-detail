/* Support Portal builder — the contrast guard (spec §7.20).
 *
 * "The single most important behaviour in this file." What makes it worth anything is that it
 * computes the REAL backdrop rather than the one the settings imply:
 *
 *   • a flat colour fill → that colour;
 *   • an image fill → the artwork's average luminance, blended with the overlay strength, because
 *     an overlay is exactly the thing people reach for to rescue unreadable text;
 *   • a background pushed to the PAGE (§7.21's "Whole page" scope) → the page's background, since
 *     that is what is genuinely behind the text once this section stops painting its own.
 *
 * It WARNS, it does not block. A stylised look can be worth the trade-off — but it must be
 * impossible to walk past, which is why the meter is a permanent row rather than a validation that
 * appears only when something is already wrong.
 */

export interface Contrast {
  ratio: number;
  passes: boolean;
  verdict: string;
}

/* ── colour maths ────────────────────────────────────────────────────────── */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

/** WCAG relative luminance. */
export function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fg: string, bgRgb: [number, number, number]): number {
  const l1 = luminance(hexToRgb(fg));
  const l2 = luminance(bgRgb);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Blends an overlay (black, 0–1 alpha) over a colour — what the eye actually receives. */
export const withOverlay = ([r, g, b]: [number, number, number], alpha: number): [number, number, number] =>
  [r * (1 - alpha), g * (1 - alpha), b * (1 - alpha)];

/* ── sampling real artwork ───────────────────────────────────────────────── */

const SAMPLE_CACHE = new Map<string, [number, number, number]>();

/**
 * The average colour of an image, sampled on a tiny canvas.
 *
 * ⚠️ Averaging is the honest approximation here: a per-pixel worst case would flag almost every
 * photograph, and the guard's job is to catch "white text on a bright sky", not to be a proof. The
 * result is cached because the same artwork is re-measured on every keystroke otherwise.
 */
export function sampleImage(src: string): Promise<[number, number, number]> {
  const hit = SAMPLE_CACHE.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 16; c.height = 16;
        const ctx = c.getContext('2d');
        if (!ctx) return resolve([128, 128, 128]);
        ctx.drawImage(img, 0, 0, 16, 16);
        const { data } = ctx.getImageData(0, 0, 16, 16);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n += 1; }
        const avg: [number, number, number] = [r / n, g / n, b / n];
        SAMPLE_CACHE.set(src, avg);
        resolve(avg);
      } catch {
        // A cross-origin image taints the canvas. Mid-grey is the honest "cannot tell" answer.
        resolve([128, 128, 128]);
      }
    };
    img.onerror = () => resolve([128, 128, 128]);
    img.src = src;
  });
}

/* ── the verdict ─────────────────────────────────────────────────────────── */

export function judge(ratio: number): Contrast {
  const passes = ratio >= 4.5;
  return {
    ratio,
    passes,
    verdict: ratio >= 7 ? 'Excellent' : passes ? 'Passes' : ratio >= 3 ? 'Too low for body text' : 'Hard to read',
  };
}

/**
 * The one-click fix (§7.20): pick a readable heading colour first, and only if that is still not
 * enough, raise the overlay until it is.
 *
 * Colour before overlay on purpose — swapping the text colour costs the design nothing, while
 * darkening the artwork changes the look. The cheaper change is tried first.
 */
export function fixContrast(bgRgb: [number, number, number], overlay: number): { color: string; overlay: number } {
  const best = (bg: [number, number, number]) =>
    (contrastRatio('#FFFFFF', bg) >= contrastRatio('#111827', bg) ? '#FFFFFF' : '#111827');

  const base = withOverlay(bgRgb, overlay / 100);
  let color = best(base);
  if (contrastRatio(color, base) >= 4.5) return { color, overlay };

  // Still not enough — walk the overlay up in 5-point steps, which is what an editor would do.
  for (let o = overlay; o <= 80; o += 5) {
    const blended = withOverlay(bgRgb, o / 100);
    color = best(blended);
    if (contrastRatio(color, blended) >= 4.5) return { color, overlay: o };
  }
  return { color: '#FFFFFF', overlay: 80 };
}
