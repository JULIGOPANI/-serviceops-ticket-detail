/* Ready-made banner artwork for the support portal.
 *
 * ⚠️ Every one is an inline SVG turned into a data URI, not a file. The published page runs under a
 * strict CSP that blocks every external host, so a banner fetched from anywhere would render as a
 * blank band on the live portal while looking fine in the editor — the worst kind of difference. A
 * data URI is the artwork itself, so what you pick is what ships.
 *
 * ⚠️ They are LANDSCAPE bands (1440×420), the shape a banner actually is, and each one keeps its
 * left third quiet. That is where the heading, the sub-heading and the search bar sit, so a design
 * whose focal point is on the left is a design you cannot write on.
 *
 * The set is deliberately two halves: seasonal artwork an admin puts up for a few weeks, and the
 * service-desk themes a portal wears the rest of the year.
 */

export interface PortalBanner {
  id: string;
  name: string;
  group: 'Seasonal' | 'Service desk';
  /** One line on when to reach for it — the thumbnail says what it looks like, not what it is for. */
  note: string;
  src: string;
}

/* ⚠️ Parentheses are percent-encoded ON TOP of encodeURIComponent, which leaves them alone.
   The artwork references its own gradients as fill="url(#g…)", and an unquoted CSS
   `url(data:…url(#g…)…)` ends at the FIRST closing paren — the browser then drops the whole
   declaration as invalid, so every thumbnail rendered blank, with an empty style attribute and
   nothing in the console to say why. Call sites quote the URL too; either alone would fix it, both
   together mean a future call site cannot reintroduce it. */
const svg = (body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice">${body}</svg>`,
  ).replace(/\(/g, '%28').replace(/\)/g, '%29')}`;

/** A soft radial glow — the one shape every one of these uses to keep the left side calm. */
const glow = (cx: number, cy: number, r: number, colour: string, stop = 0.55) =>
  `<radialGradient id="g${cx}${cy}" cx="50%" cy="50%" r="50%">
     <stop offset="0%" stop-color="${colour}" stop-opacity="${stop}"/>
     <stop offset="100%" stop-color="${colour}" stop-opacity="0"/>
   </radialGradient>
   <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g${cx}${cy})"/>`;

/** Scattered dots, seeded by hand so the artwork is identical every render. */
const sparks = (pts: [number, number, number][], colour: string, op = 0.7) =>
  pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}" opacity="${op}"/>`).join('');

/* ── Seasonal ─────────────────────────────────────────────────────────────── */

const DIWALI = svg(`
  <defs><linearGradient id="d" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#2B1055"/><stop offset="55%" stop-color="#7B2D8E"/><stop offset="100%" stop-color="#F2711C"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#d)"/>
  ${glow(1180, 120, 320, '#FFC857')}
  ${sparks([[1010, 78, 3], [1096, 150, 2], [1240, 62, 2.5], [1320, 190, 3], [1150, 250, 2], [1390, 110, 2]], '#FFE9A8')}
  <g opacity="0.92">
    ${[1060, 1160, 1260, 1360].map((x, i) => `
      <g transform="translate(${x},${190 + (i % 2) * 34})">
        <path d="M0 0c-26 0-44 14-44 30s18 26 44 26 44-10 44-26S26 0 0 0z" fill="#FFD37A"/>
        <ellipse cx="0" cy="-2" rx="12" ry="7" fill="#8A4B12"/>
        <path d="M0-8c5-14 0-24-0-30-6 8-10 18 0 30z" fill="#FFF0C2"/>
      </g>`).join('')}
  </g>
  <g opacity="0.5" stroke="#FFE9A8" stroke-width="2" fill="none">
    <path d="M980 330q60-40 120 0t120 0 120 0"/>
  </g>`);

const NEW_YEAR = svg(`
  <defs><linearGradient id="n" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#06203A"/><stop offset="60%" stop-color="#0B3C6B"/><stop offset="100%" stop-color="#1E6FA8"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#n)"/>
  ${glow(1220, 150, 300, '#8FD3FF')}
  <g stroke="#CDEBFF" stroke-width="1.6" opacity="0.75" fill="none">
    ${Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return `<line x1="1180" y1="150" x2="${1180 + Math.cos(a) * 150}" y2="${150 + Math.sin(a) * 150}"/>`;
    }).join('')}
  </g>
  ${sparks([[1180, 150, 6], [1320, 90, 3], [1060, 240, 3], [1380, 250, 2.5], [1100, 70, 2]], '#FFFFFF', 0.9)}`);

const HOLI = svg(`
  <defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#123B63"/><stop offset="100%" stop-color="#2E6F9E"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#h)"/>
  ${glow(1100, 180, 260, '#FF6B9A')}
  ${glow(1290, 110, 220, '#FFD166')}
  ${glow(1230, 300, 220, '#5BE7C4')}
  ${sparks([[1010, 120, 4], [1150, 60, 3], [1360, 200, 4], [1080, 330, 3], [1400, 320, 3]], '#FFFFFF', 0.55)}`);

const MONSOON = svg(`
  <defs><linearGradient id="m" x1="0" y1="0" x2="0.6" y2="1">
    <stop offset="0%" stop-color="#0E2A3B"/><stop offset="100%" stop-color="#2C6E7F"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#m)"/>
  ${glow(1240, 90, 300, '#9FE7F5', 0.4)}
  <g stroke="#BFEAF5" stroke-width="2" opacity="0.5" stroke-linecap="round">
    ${Array.from({ length: 22 }, (_, i) => {
      const x = 960 + i * 22;
      const y = 40 + ((i * 47) % 220);
      return `<line x1="${x}" y1="${y}" x2="${x - 14}" y2="${y + 46}"/>`;
    }).join('')}
  </g>`);

/* ── Service desk ─────────────────────────────────────────────────────────── */

const DEFAULT_DESK = svg(`
  <defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1B4F80"/><stop offset="100%" stop-color="#050B18"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#s)"/>
  <g stroke="#7FB2DA" stroke-width="1.4" opacity="0.35" fill="none">
    ${[[1000, 90], [1140, 190], [1290, 100], [1380, 260], [1080, 300], [1240, 330]]
      .map(([x, y], i, arr) => arr.slice(i + 1).map(([x2, y2]) =>
        Math.hypot(x2 - x, y2 - y) < 230 ? `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/>` : '').join('')).join('')}
  </g>
  ${sparks([[1000, 90, 5], [1140, 190, 6], [1290, 100, 5], [1380, 260, 4], [1080, 300, 4], [1240, 330, 5]], '#BBD8F0', 0.9)}`);

const MAINTENANCE = svg(`
  <defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#3B2A05"/><stop offset="100%" stop-color="#8A5A0B"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#w)"/>
  ${glow(1210, 190, 300, '#FFC94A')}
  <g opacity="0.28">
    ${Array.from({ length: 12 }, (_, i) =>
      `<rect x="${940 + i * 48}" y="-40" width="24" height="520" fill="#FFD782" transform="rotate(18 ${940 + i * 48} 210)"/>`).join('')}
  </g>`);

const SECURITY = svg(`
  <defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0B2E23"/><stop offset="100%" stop-color="#146B4E"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#c)"/>
  ${glow(1230, 170, 280, '#5BE7C4')}
  <g opacity="0.5" fill="none" stroke="#8FF0D4" stroke-width="2">
    <path d="M1210 88l86 34v76c0 54-36 90-86 106-50-16-86-52-86-106v-76z"/>
    <path d="M1176 196l24 24 46-52"/>
  </g>`);

const ONBOARDING = svg(`
  <defs><linearGradient id="o" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1E1B4B"/><stop offset="100%" stop-color="#6D5BD0"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#o)"/>
  ${glow(1250, 140, 280, '#C4B5FD')}
  <g opacity="0.55" fill="none" stroke="#DDD6FE" stroke-width="2">
    ${[0, 1, 2].map((i) => `<rect x="${1060 + i * 110}" y="${150 + i * 26}" width="86" height="112" rx="10"/>`).join('')}
  </g>
  ${sparks([[1040, 96, 3], [1330, 300, 3], [1400, 120, 2.5]], '#EDE9FE', 0.8)}`);

const CALM = svg(`
  <defs><linearGradient id="q" x1="0" y1="0" x2="1" y2="0.4">
    <stop offset="0%" stop-color="#F1F5F9"/><stop offset="100%" stop-color="#CBD8E6"/>
  </linearGradient></defs>
  <rect width="1440" height="420" fill="url(#q)"/>
  <g opacity="0.6" fill="none" stroke="#9BB4CC" stroke-width="1.6">
    <path d="M900 420q140-180 300-120t240-40"/>
    <path d="M960 420q140-140 300-90t180-70"/>
  </g>`);

export const PORTAL_BANNERS: PortalBanner[] = [
  { id: 'desk', name: 'Service Desk', group: 'Service desk', note: 'The everyday portal look.', src: DEFAULT_DESK },
  { id: 'calm', name: 'Calm Light', group: 'Service desk', note: 'A light band for dark heading text.', src: CALM },
  { id: 'maint', name: 'Maintenance Window', group: 'Service desk', note: 'Put it up while a change is running.', src: MAINTENANCE },
  { id: 'sec', name: 'Security Awareness', group: 'Service desk', note: 'For a patch push or a phishing drill.', src: SECURITY },
  { id: 'onboard', name: 'New Joiner', group: 'Service desk', note: 'Onboarding season, when SRs spike.', src: ONBOARDING },
  { id: 'diwali', name: 'Diwali', group: 'Seasonal', note: 'Lamps and warm light.', src: DIWALI },
  { id: 'newyear', name: 'New Year', group: 'Seasonal', note: 'A quiet firework over deep blue.', src: NEW_YEAR },
  { id: 'holi', name: 'Holi', group: 'Seasonal', note: 'Colour, kept off the heading side.', src: HOLI },
  { id: 'monsoon', name: 'Monsoon', group: 'Seasonal', note: 'Rain, for the wet months.', src: MONSOON },
];
