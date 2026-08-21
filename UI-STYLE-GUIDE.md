# ServiceOps UI Style Guide

Every visual rule in this product — from a status dot to a full detail page. Hand this file to
another project and an agent can restyle that project's existing components to match, **without
inventing new ones**.

**Stack it assumes:** React + TypeScript + **Tailwind CSS v4**. Colors are written as arbitrary
hex values in brackets (`text-[#364658]`), not theme tokens — deliberate, and consistent across
~30k class usages. Icons are **lucide-react**.

---

## Contents

| | |
| --- | --- |
| **Foundations** | [1 Color](#1-color) · [2 Typography](#2-typography) · [3 Spacing, radius, elevation](#3-spacing-radius-elevation) |
| **Atoms** | [4 Buttons](#4-buttons) · [5 AI Insight card](#5-ai-insight-card) · [6 Icons](#6-icons) · [7 Form controls](#7-form-controls) · [8 Pills, badges, chips, dots](#8-pills-badges-chips-dots) |
| **Molecules** | [9 Tables & grids](#9-tables--grids) · [10 Cards](#10-cards) · [11 Tabs](#11-tabs) · [12 Dropdowns & menus](#12-dropdowns-popovers-menus) · [13 Tooltips](#13-tooltips) |
| **Surfaces** | [14 Side panels & drawers](#14-side-panels--drawers) · [15 Modals](#15-modals-centred) |
| **Pages** | [16 Detail page anatomy](#16-detail-page-anatomy) · [17 Page layouts](#17-page-layouts) · [18 Pagination](#18-pagination) · [19 Feedback & states](#19-feedback--states) |
| **Reference** | [20 Traps](#20-traps) · [21 Restyling checklist](#21-checklist-for-restyling-an-existing-project) · [22 Coverage map](#22-coverage-map) · [23 Provenance](#23-provenance) |

---

## 0. How to use this file

> **The rule that matters most: restyle, don't rebuild.**
>
> When you find an element in the target project that matches something below, **change its
> classes to these** and keep the component. Do not create `ButtonV2`, `NewCard`, or a parallel
> set. One component per job, restyled in place. If two components in the target do the same job,
> merge them into whichever one this guide describes.

Working order:

1. **§1–3** (color, type, spacing) are the foundation — apply first, everywhere.
2. **§4–13** are atoms and molecules. Match by *job*, not by name: a "CTA", "submit button" and
   "primary action" are all §4.1.
3. **§14–19** are surfaces and pages. Only touch these once the atoms are consistent.
4. **§20** lists the traps that will bite you. Read it before you start.
5. **§22** is the coverage map — use it to confirm nothing was missed.

If something in the target has no equivalent here, style it from the primitives in §1–3 rather
than importing a look from elsewhere.

---

## 1. Color

Values below are the ones actually in use, ordered by frequency. There are no other greys — if you
need one, it is already in this list.

> **Hex case.** This guide writes hex uppercase throughout. The codebase is mixed — uppercase
> dominates (`#E5E7EB` 1680 vs 547) but a few high-traffic classes are lowercase, notably the ID
> pill `bg-[#e8f4fd]` and the input border `border-[#d1d5db]`. Case is cosmetic to CSS, but
> Tailwind treats `bg-[#E8F4FD]` and `bg-[#e8f4fd]` as two different classes and emits both. Pick
> one case per project and stay on it; when editing this codebase, match the file you are in.

### 1.1 Text

| Role | Hex | Use |
| --- | --- | --- |
| **Primary text** | `#364658` | Every heading, label, table cell, field value. The default. |
| **Muted text** | `#7B8FA5` | Field labels, secondary lines, captions, inactive icons. |
| **Placeholder / disabled** | `#9CA3AF` | Input placeholders, empty values, zero counts, attribution lines. |
| **Secondary grey** | `#64748B` | Toolbar text, meta rows, footer text. |
| **Tertiary grey** | `#6B7280` | Inactive tab labels, header icon rail. |
| **Strong / numeric** | `#111827` | Large stat numbers only. Rare. |

### 1.2 Brand

| Role | Hex | Use |
| --- | --- | --- |
| **Primary** | `#3D8BD0` | Primary buttons, links, active states, focus rings, selected rows. |
| **Primary hover** | `#2F7AB8` | Hover on a filled primary button. |
| **Primary hover (alt)** | `#3578B5` | Same job; both exist. Prefer `#2F7AB8` for new work. |
| **Primary pressed** | `#2E6BA4` | Active/pressed on filled primary. |
| **Primary tint** | `#EBF5FF` | Selected row fill, active pill fill, active rail icon. |
| **Primary tint (soft)** | `#E8F4FD` | ID pills. |
| **Primary tint (softest)** | `#F0F8FF` | Icon-button hover on white. |

### 1.3 AI gradient

The one gradient in the product. Used **only** for AI surfaces — never for ordinary emphasis.

```
linear-gradient(90deg, #4CB1FE 0%, #731EFB 24.52%, #F911E3 100%)
                       blue        violet            magenta
```

| Use | Value |
| --- | --- |
| Card background wash | the gradient at **`opacity: 0.03`** on an absolutely-positioned layer |
| Sparkle icon fill | the gradient, via an SVG `linearGradient` (stops at 0% / 20.44% / 99.68%) |
| Primary CTA border | the gradient at **80% alpha** as `border-box`, over a white `padding-box` |
| Secondary CTA fill | the gradient at **12% alpha** composited over `#FFF` |
| Loading bar | the gradient at `background-size: 200% 100%`, sliding |
| Bullet / accent | flat `#8B5CF6` — the gradient does not work at 4px |

### 1.4 Status

| Meaning | Text | Dot | Tint background |
| --- | --- | --- | --- |
| **Success / positive** | `#22A06B` | `#22C55E` | `#F0FDF4` |
| **Danger / breach** | `#DC2626` | `#EF4444` | `#FEF3F2` |
| **Warning / pending** | `#D97706` | `#F59E0B` | `#FFF7ED` |
| **Important / high** | `#EA580C` | `#EA580C` | `#FFF7ED` |
| **Neutral / closed** | `#64748B` | `#94A3B8` | `#F1F5F9` |
| **Info / AI** | `#8B5CF6` | `#8B5CF6` | `#F3E8FF` |

**Value → dot map.** Reuse this rather than re-deciding:

```
Open          #3D8BD0     In Use / Active     #22C55E     Healthy    #22C55E
In Progress   #F59E0B     Available           #3D8BD0     Warning    #F59E0B
Pending       #F59E0B     Expired             #EF4444     Critical   #EF4444
Completed     #22C55E     Inactive / Closed   #94A3B8     Operational #94A3B8
Resolved      #22C55E     Cancelled           #94A3B8

Priority:  Urgent/P1 #EF4444 · High #EF4444 · Medium/P2 #F59E0B · Low #22C55E · P3 #3D8BD0
Severity:  Critical #DC2626 · Important #EA580C · Moderate #F59E0B · Low #22C55E · Unspecified #94A3B8
```

### 1.5 Surfaces & borders

| Role | Hex |
| --- | --- |
| **Page background (app shell)** | `#F7F9FC` |
| **Surface / card / table** | `#FFFFFF` |
| **Row hover** | `#F9FAFB` |
| **Subtle fill / hover** | `#F5F7FA` |
| **Icon-button hover** | `#F3F4F6` |
| **Inset panel fill** | `#F1F5F9` |
| **Border — content** | `#E5E7EB` |
| **Border — control** | `#DFE5ED` |
| **Border — input** | `#D1D5DB` |
| **Hairline inside a card** | `#F0F2F5` |
| **Rule / divider (light)** | `#EEF2F6` |

> ⚠️ `#E5E7EB` and `#DFE5ED` are both in heavy use and are **not** interchangeable by convention:
> `#E5E7EB` separates *content* (card edges, table rules), `#DFE5ED` outlines *controls* (buttons,
> inputs, dropdowns, panel headers). Keep that split.

---

## 2. Typography

Font: **Inter**, system fallback stack, set on `body`.

Sizes are always explicit arbitrary values (`text-[13px]`) — never `text-sm`/`text-base`, because
the preflight base is 16px and utilities fight it.

| Size | Weight | Used for |
| --- | --- | --- |
| `text-[20px]` | `font-semibold` | Page title (list page, admin page head) |
| `text-[18px]` | `font-semibold` | Detail-page subject, section hero |
| `text-[16px]` | `font-semibold` | Panel/drawer title, modal title |
| `text-[15px]` | `font-semibold` | Card title, version number, section-group title |
| `text-[14px]` | `font-medium`/`font-semibold` | Content tab labels, card headings, accordion titles, AI card title |
| **`text-[13px]`** | `normal`/`font-medium` | **The workhorse.** Body, table cells, buttons, inputs, field values, menu items, AI summary body. |
| **`text-[12px]`** | `normal`/`font-semibold` | Table headers (semibold), field labels, meta rows, pills, AI CTA labels (`text-xs`). |
| `text-[11px]` | `font-medium`/`font-semibold` | Uppercase group headers, badges, key caps, counts, attribution. |
| `text-[10px]` | `font-semibold` | Uppercase section labels in popups, avatar initials. |

**Uppercase group header** — above every grouped list:

```html
<div class="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Group name</div>
```

**Numbers:** add `tabular-nums` to any column of figures (counts, sizes, dates, pagination) so
digits don't jitter between rows.

---

## 3. Spacing, radius, elevation

### 3.1 Radius — the single most important consistency rule

> **Every interactive control is `rounded` (4px).** Buttons, icon buttons, inputs, selects,
> textareas, tabs, filter pills, search fields, pagination controls, chip inputs, segmented
> toggles, **AI CTAs**. No exceptions.

Deliberately different:

| Radius | What |
| --- | --- |
| `rounded` **4px** | **All controls.** |
| `rounded-sm` **2px** | Status badges and severity pills only. |
| `rounded-lg` **8px** | Surfaces: cards, dropdown menus, popovers, modals, clickable record cards, **AI insight card**. |
| `rounded-xl` **12px** | Large grouped containers; the **compact AI summary** on asset Overviews. |
| `rounded-full` | Avatars-as-circles, status dots, toggles, removable chips. |

Adding a new control? It is `rounded`. If you reach for `rounded-md`, stop — wrong value here.

### 3.2 Control heights

| Height | What |
| --- | --- |
| **`h-8` / `size-8` (32px)** | Everything in a detail page or toolbar: buttons, icon buttons, pills, grid search, pagination, right-rail group icons. |
| **`h-9` / `size-9` (36px)** | List-page toolbars and **form fields inside side panels/modals** — forms stay internally consistent at 36px. |
| `h-7` / `size-7` (28px) | Compact icon badges beside a section or card title. |
| `h-5 w-9` | Toggle switch. |
| `size-6` | Avatar, inline count circle. |
| `size-4` | Checkbox. |

### 3.3 Padding rhythm

```
Page gutter (app list page)   px-6
Page gutter (admin panes)     px-4        ← admin is tighter, deliberately
Detail-page body gutter       px-6
Card padding                  p-4  or  p-5
AI insight card               px-6 py-3  (full-width)  ·  p-4 (compact)
Table cell                    px-4 py-3
Table header cell             px-4 py-2.5
Panel/drawer header           px-5 py-3
Panel/drawer body             px-5 py-4
Dropdown item                 px-3 py-2   (compact: px-2 py-1.5)
Right-panel accordion header  p-4
Section gap                   space-y-3 / gap-3
```

### 3.4 Elevation

| Token | Use |
| --- | --- |
| `shadow-sm` | Resting card that needs lift; AI CTA on hover. Most cards use a border instead. |
| `shadow-lg` | Dropdowns, popovers, inline menus. **Default for anything floating.** |
| `shadow-xl` | Side drawers and modals. |
| `shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)]` | Hover lift on a clickable card. |

Scrim behind an overlay: `bg-black/40` (drawers) · `bg-black/50` (stacked drawers) ·
`bg-[#0F172A]/40` (command overlay).

---

## 4. Buttons

### 4.1 Primary

```html
<button class="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px]
               font-medium text-white transition-colors hover:bg-[#2F7AB8]
               disabled:cursor-not-allowed disabled:bg-[#CBD5E1]">
  <Plus size={15} /> Label
</button>
```

Form/panel version: `h-9`, `px-4`. Disabled is a **grey fill** (`bg-[#CBD5E1]`), not reduced
opacity — opacity makes the label unreadable on blue.

### 4.2 Secondary (bordered)

```html
<button class="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3
               text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">
  Label
</button>
```

### 4.3 Tertiary (text / link)

```html
<button class="inline-flex items-center gap-1 rounded px-2 py-1 text-[13px] font-medium
               text-[#3D8BD0] transition-colors hover:bg-[#F5FAFF]">
  Label <ChevronRight size={14} />
</button>
```

> ⚠️ **A bare `<button>` does not inherit its parent's font size here.** The preflight leaves it at
> 16px. Every text button needs an explicit `text-[Npx]`, or a link inside a 12px row renders at
> 16px. Check with `getComputedStyle` when a link looks too big.

### 4.4 Destructive

```html
<button class="inline-flex h-8 items-center gap-1.5 rounded px-3 text-[13px] font-medium
               text-[#DC2626] transition-colors hover:bg-[#FEF3F2]">
  Delete
</button>
```

Filled destructive (confirmation dialogs only): `bg-[#DC2626] text-white hover:bg-[#B91C1C]`.

### 4.5 Icon button

```html
<!-- Bare: content areas, toolbars, panel headers -->
<button class="flex size-8 items-center justify-center rounded text-[#7B8FA5]
               transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
  <Icon size={15} />
</button>

<!-- Boxed: page/detail headers, beside bordered controls -->
<button class="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white
               text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]">
  <Icon size={15} />
</button>
```

**Close (✕) is standardised everywhere** — every side panel, modal and popover:

```html
<button class="flex size-8 items-center justify-center rounded text-[#7B8FA5]
               transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
  <X size={18} />
</button>
```

Vertically centre it against the header text (`items-center` on the header row). Small chip-remove
✕ buttons (icon ≤14px) are excluded.

### 4.6 Split button

A primary action plus a chevron half. Pin `h-8` on the **wrapper** and give the inner buttons no
vertical padding, or they drift to 30/34px.

---

## 5. AI Insight card

> The one AI surface in the product. It carries the AI gradient (§1.3) and nothing else does.
> **Reuse this component** for the ticket-detail AI summary, the dashboard's main AI insight, and
> per-widget AI insights. Do not build a second AI card.

### 5.1 Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  ✦  AI Summary                                              │  ← gradient sparkle + title
│                                                             │
│  One or two sentences of plain summary text.                │  ← body, 13px
│                                                             │
│  KEY POINTS                                                 │  ← 11px uppercase muted
│   • First point                                             │  ← purple 4px bullets
│   • Second point                                            │
│                                                             │
│  Generated by <name> at <timestamp>                         │  ← 11px attribution
│                                                             │
│  [✦ Insight with AI]  [⌕ Similar tickets]                   │  ← CTA row
└─────────────────────────────────────────────────────────────┘
   3% gradient wash · 1px #DFE5ED border · rounded-lg
```

### 5.2 Container

The gradient is a **separate absolutely-positioned layer at 3% opacity**, not a background on the
card. That keeps the text at full contrast while the wash stays behind it.

```html
<div class="relative rounded-lg border border-[#DFE5ED]">
  <!-- Gradient wash -->
  <div
    aria-hidden
    class="pointer-events-none absolute inset-0 rounded-lg"
    style="opacity: 0.03;
           background: linear-gradient(90deg, #4CB1FE 0%, #731EFB 24.52%, #F911E3 100%);"
  ></div>

  <!-- Content sits above the wash -->
  <div class="relative px-6 py-3">…</div>
</div>
```

> ⚠️ The wash layer needs `pointer-events-none`, and the content needs `relative` — without both,
> the layer eats clicks on the CTAs beneath it.

### 5.3 Header

```html
<div class="flex items-center gap-2">
  <AiSparkle size={18} />
  <span class="text-[14px] font-semibold text-[#364658]">AI Summary</span>
</div>
```

Retitle per context — **AI Summary** (record detail) · **AI Insights** (dashboard) ·
**Insights** (widget). Everything else is identical.

**The sparkle** is a self-contained SVG carrying its own gradient — never a flat lucide
`Sparkles` in this header:

```tsx
export function AiSparkle({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="ai-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"      stopColor="#4CB1FE" />
          <stop offset="20.44%"  stopColor="#731EFB" />
          <stop offset="99.68%"  stopColor="#F911E3" />
        </linearGradient>
      </defs>
      <path fill="url(#ai-sparkle-grad)" d="…" />
    </svg>
  );
}
```

> ⚠️ Two of these on one page collide on the `id`. Give each instance a unique gradient id
> (suffix a counter or the card key) or the second renders black.

Sizes: `18` in a card header · `13–14` inside a CTA.

### 5.4 Body & key points

```html
<div class="mb-4 text-[13px] leading-relaxed text-[#364658]">
  One or two sentences of summary.
</div>

<div class="mb-3">
  <h4 class="mb-2 text-[11px] font-semibold text-[#7B8FA5]">KEY POINTS</h4>
  <ul class="space-y-1.5">
    <li class="flex items-start gap-2 text-[13px] text-[#364658]">
      <span class="mt-[7px] size-1 flex-shrink-0 rounded-full bg-[#8B5CF6]"></span>
      <span>Point text</span>
    </li>
  </ul>
</div>

<div class="mb-4 text-[11px] text-[#9CA3AF]">Generated by <name> at <timestamp></div>
```

> ⚠️ The bullet is a **`size-1` span with `mt-[7px]`**, not a list marker or a `•` glyph. A glyph
> sits on the text baseline and misaligns against a wrapped first line; the offset span optically
> centres on the first line at 13px.

### 5.5 CTA buttons — the AI action row

Two variants. **The first CTA in a row is primary, every other is secondary.**

```html
<div class="flex flex-wrap items-center gap-2">

  <!-- PRIMARY: white fill, gradient BORDER (80% alpha) -->
  <button
    style="background: linear-gradient(white, white) padding-box,
                       linear-gradient(90deg, rgba(76,177,254,0.80) 0%,
                                              rgba(115,30,251,0.80) 41.49%,
                                              rgba(249,17,227,0.80) 100%) border-box;
           border: 1px solid transparent;"
    class="group flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-xs
           font-medium text-[#364658] transition-all duration-200
           hover:text-[#3D8BD0] hover:shadow-sm">
    <Sparkles size={13} class="flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
    <span>Insight with AI</span>
  </button>

  <!-- SECONDARY: gradient TINT fill (12% alpha) over white, no border -->
  <button
    style="background: linear-gradient(90deg, rgba(76,177,254,0.12) 0%,
                                              rgba(115,30,251,0.12) 41.49%,
                                              rgba(249,17,227,0.12) 100%), #FFF;"
    class="group flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-xs
           font-medium text-[#364658] transition-all duration-200
           hover:text-[#3D8BD0] hover:shadow-sm">
    <Search size={13} class="flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
    <span>Similar tickets</span>
  </button>
</div>
```

Shared across both: `rounded` · `px-3 py-2` · `text-xs font-medium` · `text-[#364658]` ·
`whitespace-nowrap` · hover turns the label `#3D8BD0` and adds `shadow-sm` · the icon scales to
110% via `group-hover`.

> ⚠️ **The gradient border needs the double-background trick.** `linear-gradient(white, white)
> padding-box` paints the fill, the gradient `border-box` paints the ring, and
> `border: 1px solid transparent` reserves the space. Drop any one of the three and you get a
> black border or no border at all.

**Icons by action** — `Sparkles` (analyse / insight) · `Search` (find similar) · `FileText`
(suggest article) · `Lightbulb` (recommendation). One icon per action, at `size={13}`.

### 5.6 Loading state

Replace the body with a 2px gradient bar that slides:

```html
<div class="relative h-0.5 w-full overflow-hidden">
  <div style="height:100%;
              background: linear-gradient(90deg,#4CB1FE 0%,#731EFB 24.52%,#F911E3 100%);
              background-size: 200% 100%;
              animation: gradientSlide 2s linear infinite;"></div>
</div>
```

```css
@keyframes gradientSlide {
  0%   { background-position: 200% 0%; }
  100% { background-position: 0% 0%; }
}
```

The title switches to **"Generating Summary…"** while loading. Keep the header and CTAs mounted so
the card doesn't change height.

### 5.7 Variants

| Variant | Container | When |
| --- | --- | --- |
| **Full-width** (default) | `rounded-lg border border-[#DFE5ED]` + 3% wash, `px-6 py-3` | Record detail page; **dashboard main AI insight** |
| **Compact** | `rounded-xl border border-[#E7E1F7]` + lavender gradient, `p-4`, no title | Asset Overview tabs; **per-widget AI insight** |
| **Inline / widget** | Compact, points capped at 2, one CTA | Inside a dashboard widget |

The compact background is its own soft wash rather than the 3% layer:

```html
<div class="rounded-xl border border-[#E7E1F7] p-4"
     style="background: linear-gradient(118deg,#FCFBFF 0%,#F6F3FE 55%,#FCF3FA 100%)">
  <div class="flex items-start gap-2.5">
    <Sparkles size={18} class="mt-0.5 flex-shrink-0 text-[#8B5CF6]" />
    <div class="min-w-0">…summary, points, CTAs…</div>
  </div>
</div>
```

The compact variant **has no title** — the sparkle carries the meaning, and a heading on a
two-line card is noise.

### 5.8 Applying it to a dashboard

- **Main insight** — full-width variant across the top of the dashboard, above the widget grid.
  Title **"AI Insights"**. 2–4 key points. CTAs sized to the dashboard's actions.
- **Widget insight** — compact variant inside the widget body, below the chart. **Max 2 points**,
  **one CTA**. If the widget is under ~280px tall, drop the points and keep the one-line summary.
- Never show two full-width AI cards on one screen. One per surface.

**Rules that hold in every placement:** the 3% wash (or lavender for compact) · the gradient
sparkle · `#8B5CF6` bullets · 13px body · 11px muted attribution · the two CTA variants with the
first primary.

---

## 6. Icons

- Library: **lucide-react**. One family, no mixing. The AI sparkle (§5.3) is the one custom SVG.
- Sizes: **`15`** inside 32px controls · **`16`** for nav and section icons · `18` for panel-header
  actions, close buttons and the AI card sparkle · `13–14` inline with 12–13px text.
- Default `#7B8FA5`; `#364658` on hover; `#3D8BD0` when active.
- An icon decorating a label is `flex-shrink-0` — it must never compress when the label wraps.

**Icon badge** — an icon in a tinted square beside a section or card title:

```html
<span class="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5]">
  <Icon size={16} />
</span>
<!-- Brand-tinted -->
<span class="flex size-7 items-center justify-center rounded-lg bg-[#3D8BD0]/10 text-[#3D8BD0]">
```

Decorative badges carry **no border** — a border makes them read as buttons.

---

## 7. Form controls

### 7.1 Text input

```html
<input class="h-9 w-full rounded border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#364658]
              placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none
              focus:ring-1 focus:ring-[#3D8BD0]" />
```

### 7.2 Search input

Magnifier **on the left**, `size={15}`, `text-[#9CA3AF]` at `left-3`; input gets `pl-9`. A clear ✕
sits at `right-2.5` when there is a value.

```html
<div class="relative w-[280px]">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
  <input placeholder="Search" class="h-9 w-full rounded border border-[#D1D5DB] bg-white pl-9 pr-8 …" />
</div>
```

Inside a detail page the same control is `h-8` with `text-[12px]`.

### 7.3 Native select

Add the global `.app-select` class — strips the OS arrow, paints a lucide-style chevron:

```css
.app-select {
  appearance: none;
  background-image: url("data:image/svg+xml,…chevron-down stroke='%237B8FA5'…");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 16px;
  padding-right: 2.25rem !important;
}
.app-select::-ms-expand { display: none; }
```

Compact "unit" selects joined to an input (`border-l-0 rounded-r`) stay native.

### 7.4 Custom select / dropdown trigger

```html
<button class="inline-flex h-9 w-full items-center justify-between gap-2 rounded border
               border-[#DFE5ED] bg-white px-3 text-left text-[13px] text-[#364658]
               transition-colors hover:border-[#3D8BD0]">
  <span class="truncate">Value</span>
  <ChevronDown size={15} class="flex-shrink-0 text-[#7B8FA5] transition-transform" />
</button>
```

Rotate the chevron 180° when open.

### 7.5 Label

```html
<label class="mb-1.5 block text-[13px] font-medium text-[#364658]">
  Field name <span class="text-[#DC2626]">*</span>
</label>
```

Compact form variant: `text-[12px] font-medium text-[#7B8FA5]`.

### 7.6 Checkbox

Native, tinted: `class="size-3.5 accent-[#3D8BD0]"`.
Custom (in menus, to match the row):

```html
<span class="flex size-4 flex-shrink-0 items-center justify-center rounded-[3px] border
             ${on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#CBD5E1]'}">
  {on && <Check size={11} strokeWidth={3} />}
</span>
```

### 7.7 Toggle switch

```html
<button class="flex h-5 w-9 flex-shrink-0 items-center rounded-full px-0.5 transition-colors
               ${on ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}">
  <span class="size-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}" />
</button>
```

### 7.8 Textarea

Same border/focus treatment as the input: `rounded`, `px-3 py-2`, `text-[13px]`, `resize-none`
with an explicit `rows`.

### 7.9 Chip input (recipients, tags)

A bordered wrapper holding chips plus a borderless input; type + Enter/comma commits a chip.

```html
<div class="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded border border-[#D1D5DB]
            bg-white px-2 py-1.5 focus-within:border-[#3D8BD0] focus-within:ring-1
            focus-within:ring-[#3D8BD0]">
  <!-- chips per §8.6 -->
  <input class="min-w-[80px] flex-1 bg-transparent text-[13px] outline-none" />
</div>
```

### 7.10 Date field

Native `type="date"` / `type="time"` styled as §7.1. Custom pickers use the dropdown surface (§12)
with a month grid; today is `border-[#3D8BD0]`, selected is `bg-[#3D8BD0] text-white`.

---

## 8. Pills, badges, chips, dots

### 8.1 Status dot

`size-2 rounded-full` with the §1.4 color, immediately before its label with `gap-1.5`.
`size-1.5` in dense meta rows · `size-2.5` for an agent-health dot before an ID · `size-1` for AI
key-point bullets.

```html
<span class="inline-flex items-center gap-1.5">
  <span class="size-2 rounded-full bg-[#22C55E]"></span>
  <span class="text-[13px] text-[#364658]">Active</span>
</span>
```

### 8.2 ID pill

```html
<span class="rounded bg-[#E8F4FD] px-2 py-0.5 text-[13px] font-semibold text-[#3D8BD0]
             flex-shrink-0">INC-1042</span>
```

Table/row variant `px-1.5 py-0.5 text-[11px]`; clickable adds
`cursor-pointer hover:bg-[#D0E8F9] transition-colors`. Always `whitespace-nowrap flex-shrink-0` —
an ID wrapping over two lines is unreadable.

### 8.3 Status badge (tinted)

```html
<span class="rounded-sm px-2 py-0.5 text-[11px] font-medium" style="background:TINT;color:TEXT">
  Critical
</span>
```

`rounded-sm` is deliberate — it separates a *state badge* from a *control*.

### 8.4 Count badge

```html
<span class="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B]">12</span>
<!-- active -->
<span class="rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">12</span>
<!-- risk -->
<span class="rounded-sm bg-[#FEF3F2] px-1.5 py-0.5 text-[11px] font-semibold text-[#DC2626]">3</span>
```

### 8.5 Filter pill (toggleable)

```html
<button class="rounded px-2 py-0.5 text-[12px] font-medium transition-colors
               ${on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#7B8FA5] hover:bg-[#F3F4F6]'}">
  All
</button>
```

An "All" pill is always first; zero-count pills are hidden.

### 8.6 Removable chip

```html
<span class="flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658]">
  Label <button><X size={11} class="text-[#7B8FA5]" /></button>
</span>
```

Selected-filter chips use a **light-grey fill, not blue** — a popup with many selections must stay
neutral.

### 8.7 Avatar

A person's initials in a **`rounded` square** — not a circle:

```html
<span class="inline-flex items-center gap-2">
  <span class="flex size-6 items-center justify-center rounded bg-[#3D8BD0] text-[10px]
               font-medium text-white">RM</span>
  <span class="text-[12px] text-[#364658]">Rohan Mehta</span>
</span>
```

Per-person colors come from the record: `#6366F1` `#10B981` `#F59E0B` `#EC4899` `#3D8BD0`
`#8B5CF6` `#EF4444` `#14B8A6` `#84CC16` `#64748B`. Unassigned `#D1D5DB`.

### 8.8 Keyboard cap

```html
<kbd class="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border
            border-[#DFE5ED] bg-[#F8FAFC] px-1 font-sans text-[10px] font-medium
            text-[#7B8FA5]">⌘K</kbd>
```


### 8.9 Sentiment badge — the one `rounded-full` badge

Sentiment is the deliberate exception to §8.3's `rounded-sm` rule: it reads as a *mood*, not a
state, and the pill shape is what separates the two at a glance.

```html
<span class="inline-flex flex-shrink-0 cursor-default items-center gap-1 rounded-full px-2 py-0.5
             text-[12px] font-medium" style="background:BG; color:TEXT">
  <span class="text-[13px] leading-none">🙂</span> Positive
</span>
```

| Sentiment | Background | Text |
| --- | --- | --- |
| Positive | `#ECFDF5` | `#059669` |
| Neutral | `#EFF8FF` | `#175CD3` |
| Unknown | `#F3F4F6` | `#4B5563` |
| Negative | `#FEF2F2` | `#DC2626` |

### 8.10 Progress bar

A single-value bar — seat pressure, install progress, upload progress:

```html
<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
  <span class="block h-full rounded-full transition-all"
        style="width: 62%; background: #3D8BD0"></span>
</div>
```

Track `#F1F5F9` (or `#EEF2F6` on a tinted surface). Fill takes the meaning color from §1.4 —
`#F59E0B` when a limit is close, `#EF4444` past it.

### 8.11 Stacked status bar

A proportional bar showing several statuses at once — deployment outcomes, BOM scan results:

```html
<div class="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-[#EEF2F6]">
  <span style="width: 62%; background: #22C55E"></span>
  <span style="width: 18%; background: #EF4444"></span>
  <span style="width: 12%; background: #F59E0B"></span>
  <span style="width:  8%; background: #94A3B8"></span>
</div>
```

`gap-px` keeps adjacent segments legible without a border. Segment order is fixed —
success · failed · in progress · other — so the bar reads the same everywhere. A zero-width
segment is omitted, not rendered at 0.

### 8.12 Numbered step marker

Used for diagnosis/solution cards and any ordered list of actions:

```html
<span class="flex size-[24px] flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0]
             text-xs font-semibold text-white">1</span>
```

In a vertical list the markers are joined by a `w-px bg-[#E5E7EB]` connector running between them.

### 8.13 Stage / stepper bar

A horizontal lifecycle strip (Change and Release stages). Each node is a circle joined by a
connector; the connector before a completed node is filled, the rest is `#E5E7EB`.

```
  ●───────●───────○───────○
Submitted Approval Planning Implementation
```

- Completed node: `bg-[#3D8BD0]` with a white check.
- Current node: `bg-white border-2 border-[#3D8BD0]`.
- Future node: `bg-white border border-[#E5E7EB]`.
- Label under each node, `text-[11px]`, `#364658` when reached and `#9CA3AF` when not.

### 8.14 Spotlight overlay (product tour)

```html
<div class="fixed inset-0 z-[9999]">
  <div class="absolute inset-0 bg-black/60 backdrop-blur-[4px] transition-all duration-300"></div>
  <!-- cut-out around the highlighted element, then a step card per §10.1 -->
</div>
```

A heavier scrim than a drawer's `bg-black/40`, plus a blur, because the point is to remove
everything except one element.

---

## 9. Tables & grids

One table style. Borderless, full-bleed, **no card wrapper**.

```html
<table class="w-full">
  <thead class="border-b border-[#E5E7EB]">
    <tr class="bg-white">
      <th class="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">
        Column
      </th>
    </tr>
  </thead>
  <tbody class="divide-y divide-[#E5E7EB] bg-white">
    <tr class="transition-colors hover:bg-[#F9FAFB]">
      <td class="px-4 py-3 text-[13px] text-[#364658]">Value</td>
    </tr>
  </tbody>
</table>
```

- Header `text-[12px] font-semibold`, body `text-[13px]`.
- Rows separated by `divide-y`, **not** per-cell borders.
- Hover `#F9FAFB`. Selected row `#EBF5FF`.
- Numeric/date columns get `tabular-nums`; short values get `whitespace-nowrap`.
- Empty cell renders `—` in `text-[#9CA3AF]`, never blank.
- Actions column is right-aligned icon buttons (§4.5), revealed on row hover when destructive.
- Empty state: `<td colSpan={N} class="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">`.

> ⚠️ `overflow-x-auto` + `min-w` does **not** stop a table clipping — `whitespace-nowrap` columns
> just demand more width and the last column runs off the edge. Inside a fixed-width panel use
> **`table-fixed` with a `<colgroup>`**, sizing every column and letting one flexible column absorb
> the rest with `truncate`.

---

## 10. Cards

### 10.1 Content card

```html
<div class="rounded-lg border border-[#E5E7EB] bg-white p-4">…</div>
```

`p-5` when the card holds a labelled field grid.

### 10.2 Clickable / module card

```html
<button class="group flex flex-col items-start rounded-lg border border-[#E5E7EB] bg-white p-3.5
               text-left transition-all hover:border-[#3D8BD0]
               hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)]">
  <span class="flex items-center gap-2.5">
    <span class="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9]
                 text-[#7B8FA5] transition-colors group-hover:bg-[#EBF5FF] group-hover:text-[#3D8BD0]">
      <Icon size={16} />
    </span>
    <span class="truncate text-[14px] font-medium text-[#364658]">Title</span>
  </span>
  <span class="mt-2 block text-[12px] leading-[1.5] text-[#7B8FA5]">Description</span>
</button>
```

> ⚠️ **`flex flex-col items-start` is required.** Chrome vertically centres `<button>` content, so
> a card with a one-line description floats against a taller neighbour in the same grid row.

### 10.3 KPI card

```html
<div class="rounded-lg border border-[#E5E7EB] bg-white p-4 transition-all hover:border-[#3D8BD0]">
  <div class="flex items-center gap-2.5">
    <span class="flex size-7 items-center justify-center rounded-lg" style="background:COLOR1A">
      <Icon size={16} style="color:COLOR" />
    </span>
    <span class="text-[12px] text-[#7B8FA5]">Label</span>
  </div>
  <div class="mt-2 text-[20px] font-semibold" style="color:COLOR">42</div>
</div>
```

Value is **20px wide / 18px narrow** (`drawerWidth > 1080`). Grid 3-up wide, 2-up narrow.
The tint is the value color at `1A` alpha suffix.

### 10.4 Donut / gauge card

A KPI card whose value is a ring. Diameter **148px wide / 116px narrow**. Legend rows sit right of
the ring with a `min-w-[84px]` label so values align in a column. `col-span-2` in a 6-track grid;
**full-width 1-up in narrow view**.

### 10.5 List-preview card

Shows the first 2 records inline as `bg-[#F9FAFB]` rows, then a `+N more ›` link. The card body is
a plain div — **only the link navigates**.

### 10.6 Inset panel

Metadata block inside a tab — grey, borderless:

```html
<div class="rounded-lg bg-[#F9FAFB] p-5">…</div>
```

---

## 11. Tabs

### 11.1 Content tabs (underline) — the detail-page tab bar

```html
<button class="flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[14px]
               font-medium transition-colors
               ${on ? 'border-[#3D8BD0] text-[#3D8BD0]'
                    : 'border-transparent text-[#6B7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}">
  Label <span class="count badge" />
</button>
```

Container: `flex items-center gap-2.5 border-b border-[#EEF2F6]`.
Every tab carries `border-b-2` (transparent when inactive) so nothing shifts on selection. Hover
shows a light fill **and** a grey underline — no top radius.

### 11.2 Segmented toggle

```html
<div class="flex items-center rounded border border-[#DFE5ED] bg-white p-0.5">
  <button class="rounded px-2.5 py-1 text-[12px] font-medium transition-colors
                 ${on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#64748B] hover:bg-[#F5F7FA]'}">
    Card
  </button>
</div>
```

### 11.3 Scope / filter pill row

`flex flex-wrap items-center gap-1.5`, each pill per §8.5.

---

## 12. Dropdowns, popovers, menus

Surface:

```html
<div class="absolute z-50 mt-1 rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
```

Item:

```html
<button class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px]
               transition-colors
               ${on ? 'bg-[#F5FAFF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'}">
  <span class="truncate">Label</span>
  {on && <Check size={15} class="flex-shrink-0 text-[#3D8BD0]" />}
</button>
```

- Section label: `px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]`.
- Divider: `border-t border-[#F0F2F5]`.
- Long lists: `max-h-[240px] overflow-y-auto`, with a search field once options exceed ~6.
- Dismiss with a transparent sibling: `<div class="fixed inset-0 z-40" onClick={close} />`.
- A 3-dot menu is `w-[248px]` with `whitespace-nowrap` labels so long items stay on one line.

> ⚠️ A container holding an upward-opening menu must **not** be `overflow-hidden` — it clips the
> menu. Give the header its own `rounded-t-[6px]` instead of clipping the parent.
>
> ⚠️ A menu inside an `overflow-x-auto` wrapper (a table) is clipped to a sliver. Portal it to
> `document.body` with fixed positioning and re-measure on scroll/resize.

---

## 13. Tooltips

Radix, near-black surface, **700 ms delay** globally (the `TooltipProvider` default; pass
`delayDuration={0}` only where the tip is the control's whole affordance).

The shared `TooltipContent` renders `bg-primary text-primary-foreground rounded-md px-3 py-1.5
text-xs` with a matching arrow. `--primary` is `#030213`.

Never use the native `title` attribute where a Radix tooltip is available — the two look different
and fire at different speeds.

> ⚠️ `TooltipContent` applies `text-balance`, which splits long text into equal short lines inside
> a wide box, leaving the right half blank. Override per-tooltip with `text-wrap`.

---

## 14. Side panels & drawers

```html
<div class="fixed inset-0 z-[9999] flex items-center justify-end bg-black/40">
  <div class="flex h-full w-[560px] max-w-[95vw] flex-col bg-white shadow-xl">

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
      <div class="min-w-0">
        <h3 class="text-[16px] font-semibold text-[#364658]">Title</h3>
        <p class="mt-0.5 text-[13px] text-[#7B8FA5]">Context line</p>
      </div>
      <button class="close per §4.5"><X size={18} /></button>
    </div>

    <!-- Body -->
    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">…</div>

    <!-- Footer -->
    <div class="flex items-center justify-between border-t border-[#DFE5ED] px-5 py-3">
      <span class="text-[13px] text-[#7B8FA5]">Summary</span>
      <div class="flex items-center gap-2">
        <button class="secondary">Cancel</button>
        <button class="primary"><Check size={15} /> Save</button>
      </div>
    </div>
  </div>
</div>
```

**Widths by job:** `440px` picker · `560px` form · `720–820px` table/detail · `880px`+ dense
multi-column · `1240px` full grid. Always with `max-w-[95vw]`.

A drawer stacked on another uses the next z-index up (`z-[10001]`) and `bg-black/50`.

---

## 15. Modals (centred)

Same recipe as §14 but `items-center justify-center`, and the card is
`w-[720px] max-w-[95vw] rounded-lg shadow-xl` with a `max-h-[85vh]` scrolling body.

---

## 16. Detail page anatomy

Every module's detail page — Ticket, Problem, Change, Release, Hardware / Software / Non-IT /
Consumable Asset, Software License, Contract, Purchase, CMDB CI, Patch, Patch Deployment,
Endpoint, Vulnerability, Detected CVE — is the **same shell**. Only the tab list and the right
panel's field set differ.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Tab] [Tab] [More ▾]                              — ▢ ✕              │  16.1  tab strip
├──────────────────────────────────────────────────────────────────────┤
│ ● INC-32  My Internet Down                    ⧉ ✎ [Add Relation] ⋮   │  16.3  header
│ Status ● Open │ Priority ● High │ Assignee RM │ SLA ● Overdue        │  16.4  KPI strip
├──────────────────────────────────────────────────────────────────────┤
│ Overview  Conversation 16  Tasks  Approvals 2  Relations  Audit      │  16.5  tab bar
├───────────────────────────────────────────┬──────────────────────────┤
│                                           │ Properties          [▤]  │
│  ✦ AI Summary  (§5)                       │ ┌──────────────────┐ [◷] │  16.6  right panel
│  KPI cards / tab content                  │ │ SLA Status       │ [◔] │
│                                           │ │ Request Fields   │ [✉] │
│                                           │ └──────────────────┘     │
└───────────────────────────────────────────┴──────────────────────────┘
```

### 16.1 Tab strip (open records)

Fixed-width tabs; measures itself and shows as many as fit, then a **"More (N) ▾"** dropdown.

```html
<div class="flex items-center border-b border-[#e5e7eb] bg-white overflow-x-clip">
  <div class="w-[170px] flex-shrink-0 cursor-pointer border-r border-[#e5e7eb] px-3 py-2
              transition-opacity ${active ? 'bg-white' : 'bg-[#F9FAFB] opacity-70'}">
    <span class="ID pill (§8.2, 11px)"></span>
    <span class="truncate text-[12px] text-[#364658]">Subject</span>
  </div>
</div>
```

- Tab width **170px**, `py-2` → the bar lands at ~36px.
- Container is **`overflow-x-clip`**, never `overflow-hidden` or `auto` — y must stay visible so
  the More dropdown escapes.
- Drag-to-reorder: dragged tab dims, a blue left-edge indicator marks the drop target.
- Hover shows a white card: ID · subject · technician · status dot · priority dot.

### 16.2 Window controls

Grouped top-**right**, in order **minimise · maximise/restore · close**:

```html
<button class="border-l border-[#e5e7eb] p-2 hover:bg-[#e5e7eb]"><svg d="M5 12h14" /></button>
<button class="p-2 hover:bg-[#e5e7eb]"><Square /> or <Copy /></button>
<button class="p-2 hover:bg-[#e5e7eb]"><X /></button>
```

`p-2` keeps the bar compact. The minimise button carries the `border-l` divider separating the
control group from the tabs.

**Minimised rail** — a ~24px right-edge strip that widens on hover, each open record a vertical ID
chip stacked from the top. The active chip highlight is **inset** (`w-[calc(100%-8px)] mx-auto`,
`rounded-sm`) so it floats inside the bar rather than touching the border.

### 16.3 Header

```html
<div class="flex items-start justify-between gap-3 px-6 py-3">
  <div class="min-w-0">
    <div class="flex items-center gap-2">
      <span class="size-2.5 rounded-full bg-[#22C55E]"></span>   <!-- agent dot, assets/CI only -->
      <span class="ID pill (§8.2, 13px)">INC-32</span>
      <h1 class="truncate text-[18px] font-semibold text-[#364658]">Subject</h1>
    </div>
    <!-- KPI strip (§16.4) -->
  </div>
  <div class="flex flex-shrink-0 items-center gap-2">
    <!-- boxed icon buttons (§4.5): copy id, copy url, watch, edit -->
    <!-- split button: Add Relation ▾ -->
    <!-- split button: Status ▾ -->
    <!-- 3-dot menu, boxed h-8 w-8 -->
  </div>
</div>
```

All header controls are **32px** (`h-8`), including the 3-dot trigger, which is boxed
(`border border-[#DFE5ED]`) so it matches its neighbours.

**Copy buttons** give green ✓ "Copied!" feedback for ~1.6s, then revert.

### 16.4 Header KPI strip

A single compact line under the subject. Per chip:

```html
<span class="inline-flex items-center gap-1.5">
  <span class="size-2 rounded-full bg-COLOR"></span>          <!-- optional -->
  <span class="text-[11px] text-[#7B8FA5]">Label</span>
  <span class="text-[12px] font-medium text-[#364658]">Value</span>
</span>
<span class="h-3 w-px flex-shrink-0 bg-[#E5E7EB]"></span>     <!-- separator -->
```

Chips per module — Ticket: Status · Priority · Assignee · SLA/Approval · Created. Problem: Root
Cause · Affected · Workaround. Change: Type · Scheduled. Release: Type · Go-Live. Hardware:
Status · Used By · Warranty · Impact · Managed By. Patch: Category · Severity · Approval · Release
Date · KB. Endpoint: System Health · Missing Patches · Reboot · Last Scan.

A time-sensitive chip (expiry, due date) appears **only when it is near or past** — an "expires in
340 days" chip is noise.

### 16.5 Content tab bar

Per §11.1, plus overflow: `moreButtonWidth` is **computed** as the widest tab label + 24, because
the More button relabels to the selected overflow tab's name and must reserve the worst case. The
strip container is `overflow-x-clip`.

### 16.6 Right properties panel

**Icon rail** — a vertical column of 32px group switchers on the right edge:

```html
<button class="flex size-8 items-center justify-center rounded border transition-all
               ${active ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                        : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F9FAFB]'}">
  <Icon size={16} />
</button>
```

Groups: Properties (`FileText`) · Activity or Attachments (`Activity`/`Paperclip`) · Suggestions
(`Lightbulb`) · Notifications (`Bell`) · Integration (`Blocks`) · keyboard-shortcuts button pinned
at the bottom with `mt-auto`.

**Panel header** — sticky search row, 86px tall, `bg-white`.

**Accordion**:

```html
<button class="flex w-full items-center justify-between p-4 transition-colors hover:bg-[#F9FAFB]">
  <span class="flex items-center gap-2">
    <Icon size={16} class="text-[#7B8FA5]" />
    <span class="text-[14px] font-semibold text-[#364658]">Section title</span>
  </span>
  <ChevronDown size={18} class="text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}" />
</button>
<div class="px-4 pb-4">…fields…</div>
```

**Field row** — label left, value right, on one centred line:

```html
<div class="flex items-center justify-between gap-3">
  <span class="text-[13px] text-[#7B8FA5]">Label</span>
  <span class="truncate text-right text-[13px] font-medium text-[#364658]">Value</span>
</div>
```

An editable field's value is an inline input with a plain-text look: transparent border, grey fill
on hover, blue ring on focus. A read-only value is plain text. A dot-carrying value (status,
priority) puts the `size-2` dot before the text.

**Tags row** — the last upfront field before "View more":

```html
<div class="flex flex-wrap items-center gap-1.5">
  <!-- removable chips per §8.6 -->
  <button class="text-[12px] font-medium text-[#3D8BD0]">+ Add tag</button>
</div>
```

**"View more"** reveals the extra fields *and* the System Fields subsection — one toggle, not two.
System Fields render as a labelled subsection: uppercase 12px header + top hairline.

**SLA Status card** — header `p-4`, content tighter (`px-4 pb-4 space-y-2`), 12px labels,
`py-0.5` pills, hourglass icons 10×13. Each row's label reveals a pencil on hover.

### 16.7 Overview tab

Order, top to bottom:

1. **AI insight card** (§5) — full-width for records, compact for assets.
2. **KPI grid** — §10.3, 3-up wide / 2-up narrow, capped at one row.
3. **Donut cards** (§10.4) where the module has bucketed data.
4. **List-preview cards** (§10.5).
5. **Detail sections** — inset panels (§10.6) with label-over-value grids, 4-up wide / 2-up narrow.

**Impact KPI pills** — icon badge + count + label, using the *sidebar module icons* so the visual
language matches the nav. A colored severity dot precedes a priority value. Zero-count types are
hidden; the whole card hides when all are zero; it spans 2 columns at 3+ pills. Clicking navigates
to the Relations tab pre-filtered.

**AI-suggested action pill** on a KPI card — hover reveals a gradient `rounded-sm` "✨ <action>"
pill that opens the AI chat with a tailored answer.

### 16.8 Conversation tab

- Sub-tabs **All Activities · Technician · Requester** (`text-[13px]`), then search / filter / sort
  icon buttons on the same row.
- **Public message**: white card, `rounded-lg border border-[#E5E7EB]`, avatar + name + timestamp
  header, body 13px.
- **Internal note / collaborate**: `bg-[rgba(245,133,24,0.10)]` with `border-l-2 border-[#F58518]`
  and an **Internal** pill reading "Not Visible to Requester".
- **Trimmed quote** (••• toggle) expands to a full email header — From · Date · To · Subject.
- Every email address is a hover-underline span; click copies and toasts.
- **Composer** — see §16.15.

### 16.9 Tasks tab

- Toolbar: search, filter icon, **`ArrowUpDown`** sort.
- Staged tasks render in a single accordion with a step-selector row of pills (number badge +
  `done/total`, active one blue). Manually added tasks sit in an "Additional Tasks" list outside it.
- **Task card**: `rounded border border-[#E5E7EB] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]`,
  TA-id chip + subject on one line, then a compact meta row of editable chips (status · priority ·
  assignee · due date) whose labels are `title` tooltips and whose chevrons appear on hover only.

### 16.10 Approvals tab

- Accordions are **multi-open** (a `Set`, not a single key); the level selection is **per approval**
  (a map keyed by approval id).
- Level tabs: `rounded-t-lg text-[12px] font-medium border border-b-0`.
- 3-dot menu order: **Refer back · Ignore · Remind · Delete**.
- The chat icon opens a right-side comments panel; comments render as orange note blocks (§16.8)
  with an **Internal** pill, plus a search + sort toolbar.

### 16.11 Relations tab

One filter pill per relation type **that has data**, with a count, next to an always-first **All**
pill; in narrow view it falls back to a dropdown. Rows use the standard borderless grid (§9).

### 16.12 Audit Trail / History

- Entries **grouped by day** with a weekday-date header.
- Time inline next to the event (`🕐 h:mm AM/PM`), not far right.
- Action as a subtle pill; before→after values as inline chips (`field  old → new`).
- Connecting timeline line; per-entry `py-3.5 px-2 -mx-2 rounded-lg hover:bg-[#F9FAFB]`.
- Toolbar: **Filter** (From/To date popup → Apply/Clear, icon highlights when active) and
  **Download** (PDF/Excel/CSV segmented + a green Password-Protected toggle).

> ⚠️ Buttons here are styled via a shared `iconBtn` const string, not an inline `className` —
> sweeps that match `className=` will miss them.

### 16.13 Relationship / topology canvas

- Canvas fills the viewport (`h-[calc(100%-48px)]`, `min-h-0`); background very light grey
  `#FAFBFC` with dots.
- Toolbar **left**: node search (`Ctrl+F`, `Esc` clears) · a merged **Filter** pill (funnel icon,
  label = first selection + "+N", blue when set) · **Saved Views** pill (bookmark icon).
- Toolbar **right**: segmented view group (Full / Tree / Grid) · Refresh · Download popup ·
  Settings · Full screen.
- Nodes: square blue centre node, circular type-ringed item nodes, labels absolute so edges attach
  to icon centres. Node colors group into 4: Assets (amber) · Users (indigo) · CI (pink) ·
  Department (green). A node with open linked records renders **solid red**.
- Edges animate as dashed `#3D8BD0` on hover, always flowing parent→child.
- **Hover card** — 550ms delay, screen-space, flips below top nodes, hover-persistent: type badge +
  clickable ID pill + detail rows + a red "N active issues linked" strip.
- Canvas controls: keyboard-shortcut popup / fit / zoom top-right, d-pad bottom-left, minimap and
  legend bottom-right (mutually exclusive).

### 16.14 Module-specific tabs

| Module | Distinctive tabs |
| --- | --- |
| Ticket | Conversation · Tasks · Approvals · Relations · Audit · Resolution |
| Problem | Analysis & Resolution (Root Cause / Symptoms / Impact / Work Around cards) |
| Change / Release | Stage-prefixed status dropdown (`"<Stage>: <Sub>"`) |
| Hardware Asset | Hardware (category sub-nav) · Software (card/list toggle) · Baseline · Financials |
| Software Asset | Consolidated Software · Installation · Meter |
| Consumable | Quantity & Allocation (segmented toggle + Allocate) |
| Software License | Allocation · Attachment (type filter + Add drawer) |
| Purchase | Purchase Details (line-item table + totals bar) · Settlements |
| CMDB CI | **Map-first**: Dependency Map ⇄ CI Details segmented toggle · Running Process |
| Patch | Vulnerabilities · Endpoint · Deployment · Superseded (React Flow map) |
| Patch Deployment | Patches · Deployment matrix (patch × endpoint) · Topology view |
| Endpoint | BOM · Patches · Deployment (Patch / Package / Registry sub-pills) |
| Detected CVE | CVSS 3.1 Metrics card · References card |

### 16.15 Rich-text composer

Row 1 = quick actions (AI Assist · Insert from Template · Insert Knowledge `Lightbulb` ·
Attachment · Image · Link · Emoji · text-formatting toggle · Undo/Redo).

Toggling formatting reveals a **floating** row (`absolute bottom-full`) so the editor height never
jumps: text-style dropdown, B/I/U, numeric font-size menu, align, lists, text-background and
text-color grids, table.

To/Cc are chip inputs (§7.9). Send / Save-as-Draft are **icon-only** — a filled-blue
`SendHorizontal` and a bordered Save.

> ⚠️ The composer card must **not** be `overflow-hidden` (it clips the upward font-size and color
> menus) — the grey header carries its own `rounded-t-[6px]` instead.
>
> ⚠️ The editable surface is an **uncontrolled** `contentEditable` that mirrors its external value
> only while unfocused. Re-writing its HTML on every keystroke resets the caret and types
> backwards.

---

## 17. Page layouts

### 17.1 List page

```
Header (56px, white, border-b #E5E7EB)
Sidebar (54px icon rail)  |  Content
                          |  ├─ Toolbar: title + view dropdown · action icons · search
                          |  ├─ Table (full-bleed, §9)
                          |  └─ Pagination (§18)
```

Gutter `px-6`. Toolbar controls `h-9`.

### 17.2 Admin listing — the standard

An admin listing is the same surface as a technician list page, so it renders on **white**, not the
hub's `#F7F9FC`, with **`px-4`** gutters.

```
Page head    20px semibold title → one-line subtitle ending in a "View Docs ↗" link.
             NO breadcrumb — the nav already says where you are.
Toolbar      compact w-[280px] search (magnifier LEFT, placeholder "Search")
             → scope tabs (if any) → primary CTA on the right
Table        full-bleed, no card wrapper (§9)
Pagination   shared component
```

Drop the tabs or the CTA when a module has none rather than faking them.

### 17.3 Three-level settings nav

| Level | Treatment | Click |
| --- | --- | --- |
| **1 Section** | icon + chevron | expands only — the pane is untouched |
| **2 Module** | icon, `pl-9` | opens that module on the right |
| **3 Submodule** | **no icon**, inside a `border-l` rail | opens that submodule |

The level-3 rail: the group sits in `border-l border-[#E5E7EB]`; each row carries
`-ml-px border-l-2 border-transparent` and on hover paints `border-[#3D8BD0]`, so the highlight
begins at the rail and runs into the row.

### 17.4 Dashboard (where the AI card lands)

```
Header
Sidebar  |  ✦ AI Insights          (full-width AI card, §5.7)
         |  ┌──────────┬──────────┬──────────┐
         |  │ Widget   │ Widget   │ Widget   │   each may carry a compact
         |  │  chart   │  chart   │  chart   │   AI card (§5.7) below its chart
         |  │ ✦ insight│          │ ✦ insight│
         |  └──────────┴──────────┴──────────┘
```

Widget shell is §10.1 (`rounded-lg border border-[#E5E7EB] bg-white p-4`) with a `text-[14px]
font-semibold` title row.

---

## 18. Pagination

```html
<div class="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] bg-white px-6 py-2.5">
  <span class="text-[12px] tabular-nums text-[#64748B]">
    Showing <span class="font-medium text-[#364658]">1–10</span> of
    <span class="font-medium text-[#364658]">65</span>
  </span>
  <!-- Rows per page select (h-8, .app-select) + page buttons -->
</div>
```

Page button: `flex h-8 min-w-8 items-center justify-center rounded px-2 text-[12px] tabular-nums`,
active `bg-[#3D8BD0] text-white`. Ellipsis is a non-interactive `text-[#9CA3AF]` span.

**Hide the whole bar when `totalItems <= 10`** — the smallest page size means there can be no
second page. Reset to page 1 whenever a search or filter changes, or a hidden bar strands a stale
page.

---

## 19. Feedback & states

### 19.1 Empty state

```html
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
    <Icon class="size-6 text-[#9CA3AF]" />
  </div>
  <p class="text-[14px] font-medium text-[#364658]">Nothing here yet</p>
  <p class="mt-1 max-w-[420px] text-[13px] leading-[1.6] text-[#7B8FA5]">
    One sentence saying what would appear and how to get it.
  </p>
</div>
```

An empty state always offers the action that fills it. Never a bare "No data".

### 19.2 Skeleton

```html
<div class="h-3 w-[52%] animate-pulse rounded bg-[#F1F5F9]"></div>
```

Skeletons mirror the shape of what is loading so the layout doesn't jump.

### 19.3 Inline warning / error strip

```html
<div class="flex items-center gap-2.5 rounded border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2 text-[12px]">
  <AlertTriangle size={14} class="flex-shrink-0 text-[#EA580C]" />
  <span class="text-[#9A3412]">Message.</span>
  <button class="ml-auto flex items-center gap-1 rounded border border-[#FED7AA] bg-white px-2 py-0.5
                 font-medium text-[#9A3412]"><RotateCw size={11} /> Retry</button>
</div>
```

Info variant: `border-[#DFE5ED] bg-[#F8FAFC]` with `text-[#64748B]`.

### 19.4 Toasts (sonner)

Styled **globally**, never per call site:

```css
[data-sonner-toast][data-type='success'] { color: #16A34A; }
[data-sonner-toast][data-type='error']   { color: #DC2626; }
```

### 19.5 Scrollbars

Thumbs are transparent until the pointer is over the scroll area, so several bars are never visible
at once. Gutter stays reserved so nothing shifts. Applied globally to Tailwind's overflow
utilities; thumb `#CBD5E1` on hover, `#94A3B8` when dragged.

```css
.overflow-y-auto, .overflow-auto, .overflow-x-auto { scrollbar-width: thin; scrollbar-color: transparent transparent; }
.overflow-y-auto:hover, .overflow-auto:hover, .overflow-x-auto:hover { scrollbar-color: #CBD5E1 transparent; }
```

---

## 20. Traps

Read these before restyling anything.

1. **Tailwind v4 preflight sets `cursor: default` on buttons.** Restore globally:
   ```css
   button:not(:disabled), [role='button']:not([aria-disabled='true']) { cursor: pointer; }
   ```
2. **A bare `<button>` does not inherit font size** — it stays at the 16px base. Every text button
   needs an explicit `text-[Npx]`.
3. **Chrome vertically centres button content**, so a card with a short description floats against
   a taller sibling. Add `flex flex-col items-start`.
4. **`overflow-hidden` clips upward-opening menus.** Round the header instead of the container.
5. **`overflow-x-auto` clips any menu inside it** — portal the menu to `document.body`.
6. **`overflow-x-auto` + `min-w` will not stop a table clipping.** Use `table-fixed` + `colgroup`.
7. **`space-y-*` puts margin on non-last children**, and `position: sticky` clamps the margin box —
   a sticky card ends up short of its pin by exactly that margin.
8. **The shared tooltip applies `text-balance`** — override with `text-wrap` for long text.
9. **Preflight strips list and heading styles inside `contentEditable`.** Restore them globally or
   rich-text output renders unstyled.
10. **The AI gradient border needs all three parts** — white `padding-box`, gradient `border-box`,
    and `border: 1px solid transparent`. Drop one and it renders black or not at all.
11. **Two AI sparkles on one page share an SVG gradient `id`** — the second renders black. Make the
    id unique per instance.
12. **A JSX comment `{/* … */}` is invalid directly inside a parenthesised expression** (right after
    `{cond && (`) — it parses as an object literal. Use `/* … */` there.
13. **`rounded-md` is not part of the application layer.** In hand-written components it is always
    a mistake — you meant `rounded`. The vendored shadcn/Radix primitives under `ui/` keep their
    own conventions; leave those alone and restyle at the call site.

---

## 21. Checklist for restyling an existing project

- [ ] Replace every grey with one from §1.1/§1.5. Delete one-off greys.
- [ ] Replace `text-sm`/`text-base`/`text-lg` with explicit `text-[Npx]` from §2.
- [ ] Set **every control** to `rounded` (§3.1). Reserve `rounded-lg` for surfaces.
- [ ] Normalise control heights to `h-8` (detail/toolbar) or `h-9` (forms) — §3.2.
- [ ] Point all buttons at the four variants in §4. Delete extra variants.
- [ ] Replace every AI/insight surface with the §5 card. Delete parallel AI cards.
- [ ] Reserve the AI gradient for AI only — remove it from non-AI emphasis.
- [ ] Swap the icon library to lucide-react at the sizes in §6.
- [ ] Rebuild tables on §9 — remove card wrappers and per-cell borders.
- [ ] Give every table and list an empty state (§19.1).
- [ ] Move floating surfaces to `shadow-lg` + `rounded-lg` + `border-[#DFE5ED]` (§12).
- [ ] Set the tooltip delay to 700 ms once, globally (§13).
- [ ] Apply the global CSS in §20.1, §19.4 and §19.5.
- [ ] Search the application layer for `rounded-md` and remove every one.

---

## 22. Coverage map

Every UI element type in this product and where it is specified. Use this to confirm nothing was
missed when restyling.

| Element | § |
| --- | --- |
| Accordion (right panel) | 16.6 |
| AI insight card — container, header, body, CTAs, loading, variants | **5** |
| Approval card, level tabs, comment popup | 16.10 |
| Audit trail entry, day group, toolbar | 16.12 |
| Avatar | 8.7 |
| Badge — status, count, severity | 8.3, 8.4 |
| Badge — sentiment (rounded-full) | 8.9 |
| Bullet (AI key point) | 5.4 |
| Button — primary, secondary, tertiary, destructive, icon, split, close | 4 |
| Card — content, clickable, KPI, donut, list-preview, inset | 10 |
| Checkbox | 7.6 |
| Chip — removable, filter, ID pill, keyboard cap | 8.2, 8.5, 8.6, 8.8 |
| Chip input | 7.9 |
| Composer (rich text) | 16.15 |
| Content tabs + overflow | 11.1, 16.5 |
| Conversation blocks, internal note, quoted email | 16.8 |
| Dashboard layout + widget AI card | 17.4, 5.8 |
| Date field / picker | 7.10 |
| Detail page shell | 16 |
| Donut / gauge | 10.4 |
| Dropdown, popover, 3-dot menu | 12 |
| Drawer / side panel | 14 |
| Empty state | 19.1 |
| Field row (label/value, editable) | 16.6 |
| Filter pill row | 8.5, 11.3 |
| Header (detail page) | 16.3 |
| Header KPI strip | 16.4 |
| Icon badge | 6 |
| Icon rail (right panel groups) | 16.6 |
| Impact pills | 16.7 |
| Input, search, select, textarea, label | 7 |
| List page layout | 17.1 |
| Admin listing layout | 17.2 |
| Minimised drawer rail | 16.2 |
| Modal | 15 |
| Module-specific tabs (all 17 modules) | 16.14 |
| Numbered step marker | 8.12 |
| Pagination | 18 |
| Progress bar (single value) | 8.10 |
| Relations grid + filter pills | 16.11 |
| Scrollbars | 19.5 |
| Segmented toggle | 11.2 |
| Settings nav (3 levels) | 17.3 |
| Skeleton | 19.2 |
| Spotlight overlay (product tour) | 8.14 |
| Stacked status bar | 8.11 |
| Stage / stepper bar | 8.13 |
| SLA status card | 16.6 |
| Status dot | 8.1 |
| Table / grid | 9 |
| Tab strip (open records) + window controls | 16.1, 16.2 |
| Tags row | 16.6 |
| Task card | 16.9 |
| Toast | 19.4 |
| Toggle switch | 7.7 |
| Tooltip | 13 |
| Topology canvas, nodes, hover card | 16.13 |
| Warning / error strip | 19.3 |

**Known gaps — deliberately not specified here:** the Support Portal builder's own canvas chrome
(it is an authoring tool with its own conventions, documented in `LAYOUT-ALIGNMENT-SPEC.md`), and
chart internals (see the project's data-viz guidance).

---

## 23. Provenance

Every value here was read out of this codebase, not designed for the document. The palette in §1 is
ordered by real usage frequency across ~30k class occurrences; the recipes are the patterns that
actually repeat.

Regenerate the evidence at any time:

```bash
# Palette by usage
grep -ohE '#[0-9A-Fa-f]{6}' src/app/components/*.tsx | tr 'a-f' 'A-F' | sort | uniq -c | sort -rn | head -40

# Type scale by usage
grep -ohE 'text-\[[0-9]+px\]' src/app/components/*.tsx | sort | uniq -c | sort -rn

# Radius distribution
grep -ohE '\brounded(-[a-z]+)?\b' src/app/components/*.tsx | sort | uniq -c | sort -rn

# The AI card, verbatim
grep -n "linear-gradient(90deg, #4CB1FE" src/app/components/*.tsx
```

If a number in this file ever disagrees with those commands, the commands are right.
