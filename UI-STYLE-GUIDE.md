# ServiceOps UI Style Guide

Every visual rule in this product, from a status dot to a full page. Copy this file into another
project and an agent can restyle that project's existing components to match — **without inventing
new ones**.

**Stack it assumes:** React + TypeScript + **Tailwind CSS v4**. Colors are written as arbitrary
hex values in brackets (`text-[#364658]`), not theme tokens — that is deliberate and consistent
across ~30k class usages here. Icons are **lucide-react**.

---

## 0. How to use this file

> **The rule that matters most: restyle, don't rebuild.**
>
> When you find an element in the target project that matches something below, **change its
> classes to these** and keep the component. Do not create `ButtonV2`, `NewCard`, or a parallel
> set. One component per job, restyled in place. If two components in the target do the same job,
> merge them into whichever one this guide describes.

Working order:

1. **Section 1–3** (color, type, spacing) are the foundation — apply these first, everywhere.
2. **Section 4–12** are the atoms and molecules. Match by *job*, not by name: a "CTA", "submit
   button" and "primary action" are all §4.1.
3. **Section 13–17** are layouts. Only touch these once the atoms are consistent.
4. **Section 18** lists the traps that will bite you. Read it before you start.

If something in the target project has no equivalent here, style it from the primitives in §1–3
rather than importing a look from elsewhere.

---

## 1. Color

Values below are the ones actually in use, ordered by how often. There are no other greys — if you
need one, it is already in this list.

### 1.1 Text

| Role | Hex | Use |
| --- | --- | --- |
| **Primary text** | `#364658` | Every heading, label, table cell, field value. The default. |
| **Muted text** | `#7B8FA5` | Field labels, secondary lines, captions, inactive icons. |
| **Placeholder / disabled** | `#9CA3AF` | Input placeholders, empty values, zero counts. |
| **Secondary grey** | `#64748B` | Toolbar text, meta rows, footer text. |
| **Tertiary grey** | `#6B7280` | Inactive tab labels, header icon rail. |
| **Strong / numeric** | `#111827` | Large stat numbers only. Rare. |

### 1.2 Brand

| Role | Hex | Use |
| --- | --- | --- |
| **Primary** | `#3D8BD0` | Primary buttons, links, active states, focus rings, selected rows. |
| **Primary hover** | `#2F7AB8` | Hover on a filled primary button. |
| **Primary hover (alt)** | `#3578B5` | Same job; both appear. Prefer `#2F7AB8` for new work. |
| **Primary pressed** | `#2E6BA4` | Active/pressed on filled primary. |
| **Primary tint** | `#EBF5FF` | Selected row fill, active pill fill. |
| **Primary tint (soft)** | `#E8F4FD` | ID pills. |
| **Primary tint (softest)** | `#F0F8FF` | Icon-button hover on a white surface. |

### 1.3 Status

| Meaning | Hex | Tint background |
| --- | --- | --- |
| **Success / positive** | `#22A06B` text, `#22C55E` dot | `#F0FDF4` |
| **Danger / breach** | `#DC2626` text, `#EF4444` dot | `#FEF3F2` / `#FEF2F2` |
| **Warning / pending** | `#D97706` text, `#F59E0B` dot | `#FFF7ED` |
| **Critical (severity)** | `#DC2626` | `#FEF3F2` |
| **Important / high** | `#EA580C` | `#FFF7ED` |
| **Neutral / closed** | `#94A3B8` dot, `#64748B` text | `#F1F5F9` |
| **Info / AI** | `#8B5CF6` | `#F3E8FF` |

**Dot colors by value** — reuse this map rather than re-deciding:

```
Open          #3D8BD0     In Use / Active     #22C55E
In Progress   #F59E0B     Available           #3D8BD0
Pending       #F59E0B     Expired / Critical  #EF4444
Completed     #22C55E     Inactive / Closed   #94A3B8
Resolved      #22C55E     Healthy             #22C55E
Cancelled     #94A3B8     Warning             #F59E0B

Priority:  Urgent/P1 #EF4444 · High #EF4444 · Medium/P2 #F59E0B · Low #22C55E
Severity:  Critical #DC2626 · Important #EA580C · Moderate #F59E0B · Low #22C55E · Unspecified #94A3B8
```

### 1.4 Surfaces & borders

| Role | Hex |
| --- | --- |
| **Page background (app shell)** | `#F7F9FC` |
| **Surface / card / table** | `#FFFFFF` |
| **Row hover** | `#F9FAFB` |
| **Subtle fill / hover** | `#F5F7FA` |
| **Icon-button hover** | `#F3F4F6` |
| **Inset panel fill** | `#F1F5F9` |
| **Border — default** | `#E5E7EB` |
| **Border — control** | `#DFE5ED` |
| **Border — input** | `#D1D5DB` |
| **Border — hairline inside a card** | `#F0F2F5` |
| **Rule / divider (light)** | `#EEF2F6` |

> ⚠️ `#E5E7EB` and `#DFE5ED` are both in heavy use and are **not** interchangeable by convention:
> `#E5E7EB` separates *content* (card edges, table rules), `#DFE5ED` outlines *controls* (buttons,
> inputs, dropdowns). Keep that split.

---

## 2. Typography

Font: **Inter**, with a system fallback stack. Set on `body`.

Sizes are always explicit arbitrary values (`text-[13px]`) — never `text-sm`/`text-base`, because
the preflight base size is 16px and utilities would fight it.

| Size | Weight | Used for |
| --- | --- | --- |
| `text-[20px]` | `font-semibold` | Page title (list page, admin page head) |
| `text-[18px]` | `font-semibold` | Detail-page subject, section hero |
| `text-[16px]` | `font-semibold` | Panel/drawer title, modal title |
| `text-[15px]` | `font-semibold` | Card title, version number, section-group title |
| `text-[14px]` | `font-medium` | Content tab labels, card headings, list item titles |
| **`text-[13px]`** | `normal` / `font-medium` | **The workhorse.** Body text, table cells, buttons, inputs, field values, menu items. |
| **`text-[12px]`** | `normal` / `font-semibold` | Table headers (semibold), field labels, meta rows, secondary lines, pills. |
| `text-[11px]` | `font-medium` / `font-semibold` | Group headers (uppercase), badges, key caps, counts. |
| `text-[10px]` | `font-semibold` | Uppercase section labels inside popups. |

**Uppercase group header** — used above every grouped list:

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
> toggles. No exceptions.

Deliberately different:

| Radius | What |
| --- | --- |
| `rounded` **4px** | **All controls.** |
| `rounded-sm` **2px** | Status badges and severity pills only. |
| `rounded-lg` **8px** | Surfaces: cards, dropdown menus, popovers, modals, clickable record cards. |
| `rounded-xl` **12px** | Large grouped containers (a bordered section wrapping several cards). |
| `rounded-full` | Avatars, status dots, toggles, removable chips. |

When adding any new control to this product, it is `rounded`. If you are reaching for
`rounded-md`, stop — that is the wrong value here.

### 3.2 Control heights

| Height | What |
| --- | --- |
| **`h-8` / `size-8` (32px)** | Everything inside a detail page or toolbar: buttons, icon buttons, pills, grid search, pagination. |
| **`h-9` / `size-9` (36px)** | List-page toolbars and **form fields inside side panels/modals** — forms stay internally consistent at 36px. |
| `h-7` / `size-7` (28px) | Compact icon badges beside a section title. |
| `h-5 w-9` | Toggle switch. |
| `size-4` | Checkbox. |

### 3.3 Padding rhythm

```
Page gutter (app list page)  px-6
Page gutter (admin panes)    px-4        ← admin is tighter, deliberately
Card padding                 p-4  or  p-5
Table cell                   px-4 py-3
Table header cell            px-4 py-2.5
Panel/drawer header          px-5 py-3
Panel/drawer body            px-5 py-4
Dropdown item                px-3 py-2  (compact: px-2 py-1.5)
Section gap                  space-y-3  /  gap-3
```

### 3.4 Elevation

| Token | Use |
| --- | --- |
| `shadow-sm` | Resting card that needs lift. Most cards use a border instead. |
| `shadow-lg` | Dropdowns, popovers, inline menus. **The default for anything floating.** |
| `shadow-xl` | Side drawers and modals. |
| `shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)]` | Hover lift on a clickable card. |

Scrim behind an overlay: `bg-black/40` (drawers) or `bg-[#0F172A]/40` (command overlay).

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

- Form/panel version: `h-9`, `px-4`.
- Disabled is a **grey fill** (`bg-[#CBD5E1]`), not reduced opacity — opacity makes the label
  unreadable on blue.

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

> ⚠️ **A bare `<button>` does not inherit its parent's font size here.** The Tailwind preflight
> leaves it at the 16px base. Every text button needs an explicit `text-[Npx]`, or a link inside a
> 12px row renders at 16px. Verify with `getComputedStyle` when a link looks too big.

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
<!-- Bare: inside content areas, toolbars, panel headers -->
<button class="flex size-8 items-center justify-center rounded text-[#7B8FA5]
               transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
  <Icon size={15} />
</button>

<!-- Boxed: page/detail headers, where it sits beside bordered controls -->
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
✕ buttons (icon ≤14px) are excluded from this.

### 4.6 Split button

A primary action with a chevron half. Pin `h-8` on the **wrapper**, and give the inner buttons no
vertical padding, or they drift to 30/34px.

---

## 5. Icons

- Library: **lucide-react**. One family, no mixing.
- Sizes: **`size={15}`** inside 32px controls · **`size={16}`** for nav and section icons ·
  `size={18}` for panel-header actions and close buttons · `size={13–14}` inline with 12–13px text.
- Default color `#7B8FA5`; `#364658` on hover; `#3D8BD0` when active.
- An icon that decorates a label is `flex-shrink-0` — it must never compress when the label wraps.

**Icon badge** (an icon in a tinted square, used beside section and card titles):

```html
<span class="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5]">
  <Icon size={16} />
</span>
<!-- Brand-tinted variant -->
<span class="flex size-7 items-center justify-center rounded-lg bg-[#3D8BD0]/10 text-[#3D8BD0]">
```

Decorative badges carry **no border** — a border makes them read as buttons.

---

## 6. Form controls

### 6.1 Text input

```html
<input class="h-9 w-full rounded border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#364658]
              placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none
              focus:ring-1 focus:ring-[#3D8BD0]" />
```

### 6.2 Search input

Magnifier **on the left**, `size={15}`, `text-[#9CA3AF]`, absolutely positioned at `left-3`;
input gets `pl-9`. A clear ✕ sits at `right-2.5` when there is a value.

```html
<div class="relative w-[280px]">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
  <input placeholder="Search" class="h-9 w-full rounded border border-[#D1D5DB] bg-white pl-9 pr-8 …" />
</div>
```

Inside a detail page the same control is `h-8` with `text-[12px]`.

### 6.3 Native select

Add the global `.app-select` class — it strips the OS arrow and paints a lucide-style chevron:

```css
.app-select {
  appearance: none;
  background-image: url("data:image/svg+xml,…chevron-down stroke='%237B8FA5'…");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 16px;
  padding-right: 2.25rem !important;
}
```

Compact "unit" selects joined to an input (`border-l-0 rounded-r`) stay native.

### 6.4 Custom select / dropdown trigger

```html
<button class="inline-flex h-9 w-full items-center justify-between gap-2 rounded border
               border-[#DFE5ED] bg-white px-3 text-left text-[13px] text-[#364658]
               transition-colors hover:border-[#3D8BD0]">
  <span class="truncate">Value</span>
  <ChevronDown size={15} class="flex-shrink-0 text-[#7B8FA5] transition-transform rotate-180?" />
</button>
```

### 6.5 Label

```html
<label class="mb-1.5 block text-[13px] font-medium text-[#364658]">
  Field name <span class="text-[#DC2626]">*</span>
</label>
```

Compact form variant: `text-[12px] font-medium text-[#7B8FA5]`.

### 6.6 Checkbox

Native, tinted: `class="size-3.5 accent-[#3D8BD0]"`.
Custom (inside menus, to match the row):

```html
<span class="flex size-4 flex-shrink-0 items-center justify-center rounded-[3px] border
             ${on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#CBD5E1]'}">
  {on && <Check size={11} strokeWidth={3} />}
</span>
```

### 6.7 Toggle switch

```html
<button class="flex h-5 w-9 flex-shrink-0 items-center rounded-full px-0.5 transition-colors
               ${on ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}">
  <span class="size-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}" />
</button>
```

### 6.8 Textarea

Same border/focus treatment as the input; `rounded`, `px-3 py-2`, `text-[13px]`, `resize-none`
with an explicit `rows`.

---

## 7. Pills, badges, chips, dots

### 7.1 Status dot

`size-2 rounded-full` with the color from §1.3, immediately before its label with `gap-1.5`.
`size-1.5` in dense meta rows, `size-2.5` for an agent-health dot before an ID.

```html
<span class="inline-flex items-center gap-1.5">
  <span class="size-2 rounded-full bg-[#22C55E]"></span>
  <span class="text-[13px] text-[#364658]">Active</span>
</span>
```

### 7.2 ID pill

The record identifier, everywhere it appears:

```html
<span class="rounded bg-[#E8F4FD] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">INC-1042</span>
```

Compact (inside a row): `px-1.5 py-0.5 text-[11px]`. Always `whitespace-nowrap flex-shrink-0` —
an ID that wraps across two lines is unreadable.

### 7.3 Status badge (tinted)

```html
<span class="rounded-sm px-2 py-0.5 text-[11px] font-medium" style="background:TINT; color:TEXT">
  Critical
</span>
```

`rounded-sm` here is deliberate — it is what separates a *state badge* from a *control*.

### 7.4 Count badge

```html
<span class="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B]">12</span>
<!-- active -->
<span class="rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">12</span>
```

### 7.5 Filter pill (toggleable)

```html
<button class="rounded px-2 py-0.5 text-[12px] font-medium transition-colors
               ${on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#7B8FA5] hover:bg-[#F3F4F6]'}">
  All
</button>
```

### 7.6 Removable chip

```html
<span class="flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658]">
  Label <button><X size={11} class="text-[#7B8FA5]" /></button>
</span>
```

Selected-filter chips use a light-grey fill, **not** a blue fill — a popup with many selections
must stay neutral.

### 7.7 Avatar

A person's initials in a **`rounded` square** — not a circle. `rounded-full` is for the small
placeholder/action circles, not for people.

```html
<span class="inline-flex items-center gap-2">
  <span class="flex h-6 w-6 items-center justify-center rounded bg-[#3D8BD0] text-[10px]
               font-medium text-white">RM</span>
  <span class="text-[12px] text-[#364658]">Rohan Mehta</span>
</span>
```

Per-person colors come from the record, drawn from this set: `#6366F1`, `#10B981`, `#F59E0B`,
`#EC4899`, `#3D8BD0`, `#8B5CF6`, `#EF4444`, `#14B8A6`, `#84CC16`, `#64748B`. Unassigned is
`#D1D5DB`.

### 7.8 Keyboard cap

```html
<kbd class="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border
            border-[#DFE5ED] bg-[#F8FAFC] px-1 font-sans text-[10px] font-medium text-[#7B8FA5]">⌘K</kbd>
```

---

## 8. Tables & grids

The one table style. Borderless, full-bleed, **no card wrapper**.

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

Rules:

- Header `text-[12px] font-semibold`, body `text-[13px]`.
- Rows are separated by `divide-y`, **not** per-cell borders.
- Hover `#F9FAFB`. Selected row `#EBF5FF`.
- Numeric / date columns get `tabular-nums`; short values get `whitespace-nowrap`.
- Empty cell renders `—` in `text-[#9CA3AF]`, never blank.
- Actions column is right-aligned icon buttons (§4.5), revealed on row hover where the action is
  destructive.
- Empty state: `<td colSpan={N} class="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">`.

> ⚠️ `overflow-x-auto` + `min-w` does **not** stop a table clipping — `whitespace-nowrap` columns
> just demand more width and the last column runs off the edge. Inside a fixed-width panel use
> **`table-fixed` with a `<colgroup>`**, sizing every column and letting one flexible column
> absorb the rest with `truncate`.

---

## 9. Cards

### 9.1 Content card

```html
<div class="rounded-lg border border-[#E5E7EB] bg-white p-4">…</div>
```

`p-5` when the card holds a labelled field grid.

### 9.2 Clickable / module card

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

### 9.3 KPI card

Tinted icon badge + label + colored value:

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

Value is **20px in a wide container, 18px in a narrow one**. Grid: 3-up wide, 2-up narrow.

### 9.4 Inset panel

For a metadata block inside a tab — grey, borderless:

```html
<div class="rounded-lg bg-[#F9FAFB] p-5">…</div>
```

---

## 10. Tabs

### 10.1 Content tabs (underline)

```html
<button class="flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[14px]
               font-medium transition-colors
               ${on ? 'border-[#3D8BD0] text-[#3D8BD0]'
                    : 'border-transparent text-[#6B7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}">
  Label <span class="count badge" />
</button>
```

Container: `flex items-center gap-2.5 border-b border-[#EEF2F6]`.
Every tab carries `border-b-2` (transparent when inactive) so nothing shifts on selection.
Hover shows a light fill **and** a grey underline — no top radius.

### 10.2 Segmented toggle

```html
<div class="flex items-center rounded border border-[#DFE5ED] bg-white p-0.5">
  <button class="rounded px-2.5 py-1 text-[12px] font-medium transition-colors
                 ${on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#64748B] hover:bg-[#F5F7FA]'}">
    Card
  </button>
</div>
```

### 10.3 Scope / filter pill row

`flex flex-wrap items-center gap-1.5`, each pill per §7.5. An "All" pill is always first.

---

## 11. Dropdowns, popovers, menus

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

- Section label inside a menu: `px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]`.
- Divider: `border-t border-[#F0F2F5]`.
- Long lists: `max-h-[240px] overflow-y-auto`, with a search field above once options exceed ~6.
- Dismiss with a transparent full-screen sibling: `<div class="fixed inset-0 z-40" onClick={close} />`.

> ⚠️ A container that holds an upward-opening menu must **not** be `overflow-hidden` — it clips
> the menu. Give the header its own `rounded-t-[6px]` instead of clipping the parent.

---

## 12. Tooltips

Radix, near-black surface, **700 ms delay** globally (set once as the `TooltipProvider` default;
pass `delayDuration={0}` only where the tip is the control's whole affordance).

```html
<Tooltip><TooltipTrigger asChild>{trigger}</TooltipTrigger>
  <TooltipContent side="top">Text</TooltipContent>
</Tooltip>
```

The shared `TooltipContent` renders `bg-primary text-primary-foreground rounded-md px-3 py-1.5
text-xs`, with a matching arrow. `--primary` is `#030213`.

Never use the native `title` attribute where a Radix tooltip is available — the two look different
and fire at different speeds. (The exception in this codebase is a plain `title` on a control whose
tip is one short word, where the 700 ms Radix delay would feel slow.)

> ⚠️ The shared `TooltipContent` applies `text-balance`, which splits long text into equal short
> lines inside a wide box, leaving the right half blank. Override per-tooltip with `text-wrap`.

---

## 13. Side panels & drawers

```html
<div class="fixed inset-0 z-[9999] flex items-center justify-end bg-black/40">
  <div class="flex h-full w-[560px] max-w-[95vw] flex-col bg-white shadow-xl">

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
      <div class="min-w-0">
        <h3 class="text-[16px] font-semibold text-[#364658]">Title</h3>
        <p class="mt-0.5 text-[13px] text-[#7B8FA5]">Context line</p>
      </div>
      <button class="close button per §4.5"><X size={18} /></button>
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
multi-column. Always with `max-w-[95vw]`.

A drawer stacked on top of another uses the next z-index up (`z-[10001]`) so it layers correctly.

---

## 14. Modals (centred)

Same recipe as §13 but `items-center justify-center`, and the card is
`w-[720px] max-w-[95vw] rounded-lg shadow-xl` with a `max-h-[85vh]` body.

---

## 15. Page layouts

### 15.1 List page

```
Header (56px, white, border-b #E5E7EB)
Sidebar (54px icon rail)  |  Content
                          |  ├─ Toolbar: title + view dropdown · action icons · search
                          |  ├─ Table (full-bleed, §8)
                          |  └─ Pagination (§16)
```

Content gutter `px-6`. Toolbar controls are `h-9`.

### 15.2 Admin listing — the standard

An admin listing is the same surface as a technician list page, so it renders on **white**, not the
hub's `#F7F9FC`, with **`px-4`** gutters.

```
Page head    20px semibold title → one-line subtitle ending in a "View Docs ↗" link.
             NO breadcrumb — the nav already says where you are.
Toolbar      compact w-[280px] search (magnifier LEFT, placeholder "Search")
             → scope tabs (if any) → primary CTA on the right
Table        full-bleed, no card wrapper (§8)
Pagination   shared component
```

Drop the tabs or the CTA when a module has none rather than faking them.

### 15.3 Detail page (drawer)

```
Tab strip     open records, window controls (minimise · maximise · close) at top-RIGHT
Header        ID pill + subject + KPI strip + action icons
Tab bar       content tabs (§10.1)
Body          tab content            |  Right properties panel (accordions + icon rail)
```

Header KPI chip pattern:

```html
<span class="inline-flex items-center gap-1.5">
  <span class="size-2 rounded-full bg-COLOR"></span>
  <span class="text-[11px] text-[#7B8FA5]">Label</span>
  <span class="text-[12px] font-medium text-[#364658]">Value</span>
</span>
<span class="h-3 w-px bg-[#E5E7EB]"></span>   <!-- separator -->
```

### 15.4 Three-level nav (settings)

Each level looks different so depth reads without counting indents:

| Level | Treatment | Click |
| --- | --- | --- |
| **1 Section** | icon + chevron | expands only — the pane is untouched |
| **2 Module** | icon, `pl-9` | opens that module on the right |
| **3 Submodule** | **no icon**, inside a `border-l` rail | opens that submodule |

The level-3 rail: the group sits in `border-l border-[#E5E7EB]`; each row carries
`-ml-px border-l-2 border-transparent` and on hover paints `border-[#3D8BD0]`, so the highlight
begins at the rail and runs into the row.

---

## 16. Pagination

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

## 17. Feedback & states

### 17.1 Empty state

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

### 17.2 Skeleton

```html
<div class="h-3 w-[52%] animate-pulse rounded bg-[#F1F5F9]"></div>
```

Skeletons mirror the shape of what is loading so the layout doesn't jump.

### 17.3 Inline warning / error strip

```html
<div class="flex items-center gap-2.5 rounded border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2 text-[12px]">
  <AlertTriangle size={14} class="flex-shrink-0 text-[#EA580C]" />
  <span class="text-[#9A3412]">Message.</span>
  <button class="ml-auto flex items-center gap-1 rounded border border-[#FED7AA] bg-white px-2 py-0.5
                 font-medium text-[#9A3412]"><RotateCw size={11} /> Retry</button>
</div>
```

Info variant: `border-[#DFE5ED] bg-[#F8FAFC]` with `text-[#64748B]`.

### 17.4 Toasts (sonner)

Styled **globally**, never per call site:

```css
[data-sonner-toast][data-type='success'] { color: #16A34A; }
[data-sonner-toast][data-type='error']   { color: #DC2626; }
```

### 17.5 Scrollbars

Thumbs are transparent until the pointer is over the scroll area, so several bars are never visible
at once. Gutter stays reserved so nothing shifts. Applied globally to Tailwind's overflow
utilities; thumb `#CBD5E1` on hover, `#94A3B8` when dragged.

---

## 18. Traps

Read these before restyling anything.

1. **Tailwind v4 preflight sets `cursor: default` on buttons.** Restore it globally:
   ```css
   button:not(:disabled), [role='button']:not([aria-disabled='true']) { cursor: pointer; }
   ```
2. **A bare `<button>` does not inherit font size** — it stays at the 16px base. Every text button
   needs an explicit `text-[Npx]`.
3. **Chrome vertically centres button content**, so a card with a short description floats against
   a taller sibling. Add `flex flex-col items-start`.
4. **`overflow-hidden` clips upward-opening menus.** Round the header instead of the container.
5. **`overflow-x-auto` + `min-w` will not stop a table clipping.** Use `table-fixed` + `colgroup`.
6. **`space-y-*` puts margin on non-last children**, and `position: sticky` clamps the margin box —
   a sticky card ends up short of its pin by exactly that margin.
7. **The shared tooltip applies `text-balance`** — override with `text-wrap` for long text.
8. **Preflight strips list and heading styles inside `contentEditable`.** Restore them in global
   CSS or rich-text output renders unstyled.
9. **A JSX comment `{/* … */}` is invalid directly inside a parenthesised expression** (right after
   `{cond && (`) — it parses as an object literal. Use `/* … */` there.
10. **`rounded-md` is not part of the application layer.** In hand-written product components it
    is always a mistake — you meant `rounded`. The exception is the vendored shadcn/Radix
    primitives under `ui/` (tooltip, dialog, slider…), which keep their own class conventions;
    leave those alone and restyle at the call site.

---

## 19. Checklist for restyling an existing project

- [ ] Replace every grey with one from §1.1/§1.4. Delete one-off greys.
- [ ] Replace `text-sm`/`text-base`/`text-lg` with explicit `text-[Npx]` from §2.
- [ ] Set **every control** to `rounded` (§3.1). Reserve `rounded-lg` for surfaces.
- [ ] Normalise control heights to `h-8` (detail/toolbar) or `h-9` (forms) — §3.2.
- [ ] Point all buttons at the four variants in §4. Delete extra variants.
- [ ] Swap the icon library to lucide-react at the sizes in §5.
- [ ] Rebuild tables on §8 — remove card wrappers and per-cell borders.
- [ ] Give every table an empty state and every list an empty state (§17.1).
- [ ] Move floating surfaces to `shadow-lg` + `rounded-lg` + `border-[#DFE5ED]` (§11).
- [ ] Set the tooltip delay to 700 ms once, globally (§12).
- [ ] Apply the global CSS in §18.1 and §17.4/§17.5.
- [ ] Search the application layer for `rounded-md` and remove every one (leave `ui/` primitives).

---

## 20. Provenance

Every value here was read out of this codebase, not designed for the document. The palette in §1
is ordered by real usage frequency across ~30k class occurrences; the recipes in §4–§17 are the
patterns that actually repeat.

Regenerate the evidence at any time:

```bash
# Palette by usage
grep -ohE '#[0-9A-Fa-f]{6}' src/app/components/*.tsx | tr 'a-f' 'A-F' | sort | uniq -c | sort -rn | head -40

# Type scale by usage
grep -ohE 'text-\[[0-9]+px\]' src/app/components/*.tsx | sort | uniq -c | sort -rn

# Radius distribution
grep -ohE '\brounded(-[a-z]+)?\b' src/app/components/*.tsx | sort | uniq -c | sort -rn
```

If a number in this file ever disagrees with those commands, the commands are right.
