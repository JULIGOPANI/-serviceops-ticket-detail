# New Elements — Content & Design Panel Specification

**17 elements. One panel each. Content first, styling below.**

Covers the seventeen palette entries that had no specification: the ones added from the Elements
palette screenshots. Panel structure follows the Duda model documented in
[DUDA-ELEMENT-DESIGN-AND-QUICK-ACTIONS.md](DUDA-ELEMENT-DESIGN-AND-QUICK-ACTIONS.md) — its real
accordion names, its control mechanics, and the mapping decisions its own §9.1 already made for
this product.

| # | Element | Palette group | Spec |
|---|---|---|---|
| 1 | Search | Components | §3.1 |
| 2 | Categories | Components | §3.2 |
| 3 | My Tasks | Components | §3.3 |
| 4 | Advanced Tabs | Layout | §3.4 |
| 5 | Advanced Accordion | Layout | §3.5 |
| 6 | Divider | Layout | §3.6 |
| 7 | Spacer | Basic | §3.7 |
| 8 | Large Title | Basic | §3.8 |
| 9 | Small Title | Basic | §3.8 |
| 10 | List | Basic | §3.9 |
| 11 | Countdown | Basic | §3.10 |
| 12 | Accordion | Basic | §3.11 |
| 13 | Text with Image | Basic | §3.12 |
| 14 | Icon | Visual | §3.13 |
| 15 | Shape | Visual | §3.14 |
| 16 | Contact Form | Business | §3.15 |
| 17 | Action Icon | Custom | §3.16 |

> **Not in this file.** The other ~24 palette entries (My Requests, Approvals, Card, FAQ, Table,
> Media Slider, Photo Gallery, Button, KPI, Action Card, Banner, Section, Page, rail, top bar…)
> are specified in [WIDGET-CONTENT-AND-STYLING-SPEC.md](WIDGET-CONTENT-AND-STYLING-SPEC.md).
> **Where the two files disagree on panel structure, this file wins** — the panel model here
> (content-first, Duda accordions) supersedes the tabbed Content/Styling model and the P1–P8 style
> packs described there. Apply this model to those elements too when you get to them.

---

## 0. BUILD PROMPT — read before writing any code

**You are building the element settings panel for the Support Portal page builder.
Every pixel of it must come from what already exists in ServiceOps.**

### 0.1 The rule

> **Reuse the components, design system, tokens, spacing scale, type scale, icon set, colours and
> interaction patterns from the ServiceOps request/ticket detail page. Build nothing new.**

The detail page is the canonical surface. It already solved every UI problem this panel has: a
side panel that holds properties, collapsible property groups, label-and-control rows, dropdowns,
toggles, chips, date pickers, a rich text composer, attachment upload, validation messages, empty
states, kebab menus and reorderable list rows. **Find each of those in the detail page's code and
use it.** Do not fork a component to add a variant the design system already covers. Do not
re-cut a form row because this panel is narrower. Do not introduce a second way to render a
dropdown.

If a control this document describes genuinely has no equivalent on the detail page:
1. Look at the nearest sibling admin screen (settings forms, filters, the theme editor) — it is
   almost certainly there.
2. Only if it exists nowhere, extend the design system properly — add the variant to the shared
   component, do not create a local one.
3. Record what you added, so the next person reuses it instead of adding a third.

**The product must read as one product.** A builder panel that looks like a different application
than the ticket the requester just raised is a failure, however good it looks on its own.

### 0.2 Role → detail page mapping

Find the component that already plays each role. The right-hand column describes the role, not a
component name — locate the real one in your codebase.

| Role in this panel | What already does this job |
|---|---|
| Panel shell | The detail page's right-hand properties panel — its width, header, scroll behaviour |
| Panel header | The detail page's panel header: collapse control, help `?`, close `✕` |
| Breadcrumb | The detail page's record path / parent-child navigation |
| Collapsible accordion | The detail page's collapsible property groups |
| Label + control row | The detail page's property row |
| Text input, number input | The detail page's form inputs |
| Text area | The detail page's multi-line inputs |
| Rich text | The detail page's reply / note composer |
| Dropdown / select | The detail page's field selectors |
| Multi-select / chips | The detail page's tag and multi-value fields |
| Toggle | The detail page's boolean switches |
| Date + time picker | The detail page's due-date / schedule picker |
| File upload / drop zone | The detail page's attachment control |
| Reorderable list row | The detail page's task / checklist / approval rows — drag handle, label, actions |
| Kebab / overflow menu | The detail page's row and header action menus |
| Badge / pill | The detail page's status and priority pills |
| Inline validation, helper text | The detail page's field-level errors and hints |
| Empty state | The detail page's "no records" states |
| Tooltip, info `ⓘ` | The detail page's field help |
| Colour swatch, unit dropdown, slider, 3×3 grid picker, icon picker | Rare on the detail page — take these from the theme/branding editor, which already has them |

### 0.3 Values come from tokens, never free input

Per the reference file's own mapping (§9.1): *"our tokens, not free values"* and *"bind it to our
spacing scale rather than free px"*.

- **Colour** fields offer the theme palette first; a free hex picker is the secondary path, never
  the default.
- **Spacing** fields snap to the product's spacing scale. The numeric field accepts a scale step,
  not an arbitrary pixel.
- **Type** fields offer the theme's type scale and faces. `Inherit` is always the default.
- **Radius, border, shadow** offer the design system's defined steps.

An element that only ever produces token-valued output cannot drift away from the product.

---

## 1. Panel anatomy

### 1.1 One panel, in this order

Not tabs. Not a floating dialog. **One scrolling panel, content first, styling below it** — the
same order the product already uses everywhere else.

```
┌─ ELEMENT PANEL ─────────────────────────────────┐
│  ⟨collapse⟩                        ?      ✕     │   header
│  Section › Column › List › Item 2               │   breadcrumb, ancestors clickable
│  List Item                                      │   element name, large
│  Basic                                          │   palette group, small + grey
│                                        ⋯        │   overflow (§1.5)
├─────────────────────────────────────────────────┤
│  ▾ CONTENT                                      │   ← always first, always open
│      field row                                  │
│      field row                                  │
│      item list (collections)                    │
│                                                 │
│  ▸ Layout                                       │   ← styling accordions below
│  ▸ Style                                        │
│  ▸ Spacing                                      │
│  ▸ Size                        ⓘ                │
│  ▸ Alignment                                    │
│  ▸ Animations & Effects        ● (orange dot)   │
├─────────────────────────────────────────────────┤
│  + Add item                                     │   sticky, collections only
└─────────────────────────────────────────────────┘
```

Rules:

- **Content is a section, not a tab.** It sits at the top, opens by default, and is the first
  thing a person sees. An element with nothing to author (Spacer) has no Content section at all —
  and the panel says so in one line rather than showing an empty group.
- **Styling accordions sit under Content**, collapsed by default except the one most likely
  wanted for that element (named per element in §3).
- **Only the accordions that element needs appear.** Duda does this and it matters: a Text Block
  shows `Style · Alignment · Spacing`; a Column shows `Layout · Style · Spacing · Size ·
  Animations & Effects`. See the coverage matrix in §4.
- **Open/closed state is remembered per element type** for the session.
- Everything applies live. There is no Save in this panel; publishing is a page-level action.

### 1.2 The accordion set

Duda's real names, confirmed off the editor. Use these words.

| Accordion | Holds |
|---|---|
| **Content** | What the element says and shows. Always first. |
| **Layout** | Presets, arrangement, content distribution and, for container-ish elements, alignment |
| **Style** | Background (`Color | Image` tabs), corner radius, border, shadow — and per-element visual controls. **There is no separate Background accordion**; background lives here |
| **Spacing** | *"Padding (inner spacing)"* — the nested four-sided box editor with a link toggle |
| **Size** ⓘ | Height / width, min / max. Carries an info icon explaining what the element can actually set |
| **Alignment** | Its own accordion for text-like elements; folded **inside Layout** for container-like ones |
| **Animations & Effects** | Trigger + animation. **Deferred — see §1.7** |

### 1.3 Control mechanics carried from Duda

These are the details that make the panel feel considered. Build each once.

| Pattern | Behaviour |
|---|---|
| **⚙ gear on a row** | Opens the advanced form for that property. Keeps the panel shallow without hiding capability. Applies to Corner radius, Border, Shadow, Padding |
| **Unit dropdown** | `px` / `%` beside the numeric field, on radius, border, width, spacing |
| **Nested padding box** | Four side values around a box with a **link icon in the centre**. Linked edits all four; unlinking edits one. Default convention: **horizontal in `%`, vertical in `px`** |
| **Slashed-circle swatch** | A colour swatch showing a slashed circle means *none* — not an empty box, which reads as "not loaded" |
| **`*` override marker** | A style value changed away from the Site Theme shows an asterisk on its control (`Heading 3*`). **This is the single most valuable pattern in the reference** — it makes the theme relationship legible at the point of editing |
| **Reset to Site Theme** | The counterpart that makes the asterisk safe. One click, in the `⋯` menu (§1.5), at every level |
| **Orange dot on an accordion** | The accordion header carries a dot when anything inside it is set away from default. Lets someone scan a collapsed panel and see where the overrides are |
| **ⓘ info icon** | On rows whose behaviour is not obvious from the label — Size, Background colour, Alt text, licence-gated fields |
| **Icon toggles for visual modes** | Three big icon buttons rather than a dropdown where the choice is visual (image fit: `Cover` / `Full image` / `No repeat`). The selected one is clearly marked |
| **3×3 dot grid** | Position / focal point picking. Never two number fields |
| **Pill row** | Short mutually-exclusive visual choices (hover effect) |
| **Inline AI generate** | Where AI can fill a field, the trigger sits **inside that field**, not in a separate section. Applies to alt text and descriptions |
| **Link out to the bulk editor** | Where the same data is editable across the whole portal (alt text, contact details), the row links out to that screen instead of duplicating it |

### 1.4 Collections — elements with sub-elements

Six of the seventeen hold a list of child items: **Search** (popular terms), **Categories**
(chosen categories), **Advanced Tabs** (tabs), **Advanced Accordion** (panels), **List** (items),
**Accordion** (items), **Contact Form** (fields, and each choice field's options).

The item list sits **inside the Content section**. Every row has the same anatomy — build it once,
from the detail page's reorderable list row:

| Slot | Purpose |
|---|---|
| Drag handle | Reorder within this collection only. An item can never leave its element |
| Index or thumbnail | `1 2 3` for text items; the image for media items; the field-type icon for form fields |
| Primary label | The item's own text. Falls back to `Item N` when blank |
| Secondary label | One line of the most useful metadata |
| Quick actions | **Duplicate · Delete · Hide** |
| Row target | Opens that item's own panel |

- **Keyboard reorder is required** wherever drag exists. Drag is never the only way.
- **Add** is a single action in the sticky footer. A new item is appended, selected, and its panel
  opened, seeded with realistic placeholder text — never `Untitled`.
- **Delete** is immediate with an undo affordance. No confirmation for a single item.
- **At the maximum**, Add disables and says why. Never a silent no-op.

**The item's own panel** has the same shape as its parent's: Content first, then only the styling
accordions that item can legitimately own. Every style value starts **Inherited** from the parent
element and shows the parent's value; overriding one field does not detach the rest. The
breadcrumb ends at the item, and the `⋯` menu carries Duplicate / Delete / Hide so nobody has to
navigate back to act on the thing they are looking at.

**Panel-holding containers** — Advanced Tabs and Advanced Accordion — go one level further: their
items hold *other elements*, so the breadcrumb reads `… › Advanced Tabs › Support › Card` and the
child opens its own normal panel. **A container cannot nest itself**: Advanced Tabs and Advanced
Accordion are excluded from the palette shown inside a tab or panel drop zone.

### 1.5 The `⋯` overflow menu

Taken from the reference's confirmed More Actions menu, reduced to what this product has an
answer for. It lives in the **panel header**, not on the canvas — the floating on-canvas toolbar
is out of scope for this build.

```
  ⧉   Duplicate
  ↺   Reset to Site Theme
 ──────────────────────────
  🔒  Lock editing
  ⚓  Set as anchor
  👁  Hide from            ›   (per breakpoint — §1.6)
 ──────────────────────────
  🗑   Delete
```

- **Reset to Site Theme** clears every `*` override on this element and returns it to theme
  values. It is the escape hatch that makes per-property overriding safe.
- **Lock editing** prevents a junior admin moving or deleting this element — the direct analogue
  of the reference's agency-facing "Lock Editing for Client".
- **Delete** raises an undo affordance.
- Dropped from the reference's menu: Edit CSS, Add CSS Class Name, Connect to Data, Add Comment,
  Save as Section. Each needs a product decision this document cannot make on its own — raise
  them before build rather than shipping a menu item with nothing behind it.

### 1.6 Breakpoints and the override cascade

| Breakpoint | Range |
|---|---|
| Desktop | 1025 px and up — **default** |
| Tablet | 768–1024 px |
| Mobile | up to 767 px |

The cascade rule, carried verbatim from the reference:

- **Content and Style changes cascade to every breakpoint**, whichever one they were made on.
- **Size and position changes do not cascade.**
- Overridable per breakpoint: **Alignment · Size · Spacing** (and per-element, anything §3 marks
  as responsive).
- **Once overridden, a breakpoint cannot be un-overridden from the default breakpoint.**
  `Reset to Site Theme` in the `⋯` menu is the way back, and the panel must say so at the moment
  an override is created — not after.
- **Hide from ›** hides the element per breakpoint. Hiding a container hides everything in it, and
  the panel says so before it happens.

### 1.7 Animations & Effects — deferred, deliberately

The reference file's own mapping (§9.1) rules this out: *"**No** for V1 — an ITSM portal does not
need 31 animations."* That judgement stands.

**Do not build the accordion in V1.** It is listed in §1.2 and in the coverage matrix so that the
structure is complete and so nobody re-derives the decision later. The only motion in V1 is what
the design system already provides on the components being reused: the accordion expand, the tab
switch, hover and focus treatments. Those are component behaviour, not element settings.

If it is built later: trigger (Hover / Scroll / Entrance) + animation, desktop and tablet linked,
mobile separate, an orange dot on the accordion when set, and a Pause Animation control while
editing.

---

## 2. Shared field groups

Three groups recur across the seventeen. Build each once and compose.

### G1 — Background & container *(the Style accordion's common half)*

Tabs across the top: **`Color | Image`**. Video is not offered — the reference's own mapping
specifies Color/Image tabs only.

| Row | Control | Notes |
|---|---|---|
| Background colour ⓘ | Swatch, theme palette first | Slashed circle = none |
| Background image | Upload | on the `Image` tab |
| Image fit | Icon toggles | `Cover` · `Full image` · `No repeat` |
| Image position | 3×3 dot grid | — |
| Overlay | Slider `0–80%` | image only; exists so text stays readable |
| Corner radius ⚙ | Slider + numeric + unit dropdown | token steps |
| Border ⚙ | Slider + numeric + colour swatch | token steps |
| Shadow | Toggle, with ⚙ for depth | design-system steps |

### G2 — Spacing *(the Spacing accordion, everywhere)*

Labelled **"Padding (inner spacing)"**. The nested box editor: four side values around a box with
a **link icon in the centre**, the top value sitting above the box. Horizontal defaults to `%`,
vertical to `px`. **Values snap to the product's spacing scale.** Responsive: overridable per
breakpoint.

Where an element also needs outer spacing, a second box labelled **"Margin (outer spacing)"**
appears below it, with the same mechanics.

### G3 — Text roles *(inside Style, per element)*

An element exposes only the roles it actually has: `title` · `subtitle` · `body` · `meta` ·
`link`. Per role: **Typeface** (`Inherit` default, then the theme's faces) · **Size** (theme type
scale) · **Weight** · **Colour** (theme palette) · **Line height** · **Truncate after N lines**.

Every role control carries the **`*` override marker** when it departs from the Site Theme.

---

## 3. The seventeen element panels

Each panel below lists its **Content** section first, then the styling accordions it shows, in
panel order. Accordions not listed for an element **do not appear on that element**.

---

### 3.1 Search *(Components)*

A standalone portal search field, placeable anywhere. The same control the banner carries, freed
from the banner.

**CONTENT**

| Field | Control | Default | Options |
|---|---|---|---|
| Placeholder | Text | `How can we help you?` | — |
| Scope | Segmented | Knowledge | Knowledge · All |
| Show suggestions as they type | Toggle | on | — |
| Show submit button | Toggle | off | — |
| Submit label | Text | `Search` | when submit button on |
| Popular searches | **Item list** (§1.4) | empty | max 6 |

*Item row → panel:* Term (text) · Opens (page or search query) · Hide.

> **Scope must tell the truth.** Knowledge is what the search actually reaches today. Choosing
> **All** shows a warning that the cross-entity endpoint does not exist yet. When the knowledge
> permission is off, warn that search currently returns nothing **and link to that setting**.

**Style** *(open by default)* — G1 background & container, plus:

| Row | Control | Options | Default |
|---|---|---|---|
| Field height | Segmented | Small · Medium · Large | Medium |
| Field fill | Colour | theme palette | inherit |
| Field border ⚙ | Slider + colour | — | inherit |
| Corner radius ⚙ | Slider + unit | — | inherit |
| Icon position | Segmented | Left · Right · None | Left |
| Icon colour | Colour | — | inherit |
| Placeholder text | G3 `meta` role | — | inherit |
| Popular searches | Segmented | Chips · Inline links · Hidden | Chips |

**Spacing** — G2.
**Size** ⓘ — Width (`%` or `px`, unit dropdown) · Max width. Info: *the field never exceeds its
column.* Responsive.
**Alignment** — Left · Centre · Right, for the field within its column. Responsive.

---

### 3.2 Categories *(Components)*

The catalogue's top-level categories as a browsable grid — the browse-all counterpart to Services,
which is a favourites list.

**CONTENT**

| Field | Control | Default | Options |
|---|---|---|---|
| Title | Text | `Browse by category` | — |
| Source | Segmented | All categories | All categories · Chosen categories |
| Categories | **Item list** (picker) | — | when *Chosen* · reorderable · max 12 |
| Categories to show | Number | 6 | 1–12 · when *All* |
| Show item count | Toggle | on | e.g. `Hardware · 12` |
| Show icon | Toggle | on | — |
| Show description | Toggle | off | — |
| "Browse all" link | Toggle + text | on · `Browse catalog` | — |

*Item row → panel (chosen categories only):* Label override · Icon override · Description
override · Hide. Each override shows `Overridden` with a revert; the catalogue record is never
changed.

**Layout** *(open by default)*

| Row | Control | Options | Default |
|---|---|---|---|
| Presets | Icon buttons | Grid · List | Grid |
| Items per row | Segmented | 1 · 2 · 3 · 4 | 3 |
| Gap | Slider, spacing scale | — | 8 |
| Content distribution | Icon row (5) | left · centre · right · space-between · space-around | left |
| Content alignment | Icon row (4) | top · middle · bottom · stretch | top |

**Style** — G1 (applies to the widget container **and**, via a `Tile` sub-group, to each tile):
tile shape (Card · Tile · Text only) · tile background · tile border ⚙ · tile radius ⚙ · shadow ·
icon size · icon colour · hover effect (pill row: None · Lift · Tint) · G3 roles `title`, `body`,
`meta`.

**Spacing** — G2.
**Size** ⓘ — Min height. Info: *width comes from the column.* Responsive.

**Gate** — the Catalog module. Empty state when the instance has no categories.

---

### 3.3 My Tasks *(Components)*

The requester's own open tasks.

**CONTENT**

| Field | Control | Default | Range |
|---|---|---|---|
| Title | Text | `My Tasks` | — |
| Rows to show | Number | 5 | 1–10 |
| Statuses to include | Chips | Open, In Progress | Open · In Progress · Completed · Overdue |
| Show due date | Toggle | on | — |
| Show related record | Toggle | on | the request or change the task belongs to |
| Show overdue flag | Toggle | on | — |
| Show total count | Toggle | on | — |
| "View all" link | Toggle + text | on · `View all` | — |
| Empty-state message | Text | `No Data Found` | — |

**Layout** — Row layout (Single line · Stacked) · Row density (Compact · Comfortable) · Dividers
between rows (toggle).

**Style** *(open by default)* — G1, plus: header count style (Badge · Plain) · overdue flag colour
· status pill colour source (Status colour · Neutral) · G3 roles `title`, `body`, `meta`, `link`
· row hover effect (pill row).

**Spacing** — G2.
**Size** ⓘ — Min height · Max height with scroll. Responsive.

**Gate** — the **Project Requester licence**. That is a licence, not a permission: the panel says
so plainly and offers no link, because there is no switch for the admin to find.

---

### 3.4 Advanced Tabs *(Layout)* — container

A tabbed container. Each tab holds **other elements**, so this is the deepest layer stack in the
builder: element → tab → child element → sub-element.

**CONTENT**

| Field | Control | Default | Options |
|---|---|---|---|
| Tabs | **Item list** (§1.4) | 2 seeded tabs | max 8 |
| Default open tab | Select | first | any tab · *remember the last one* |
| Deep-linkable | Toggle | on | each tab gets a URL fragment so a link can open it |

*Tab row → panel:*
**CONTENT** — Label (text) · Icon (icon picker, optional) · Badge (text, optional) · Hide this tab
(toggle) · **Panel content** (drop zone holding any element except Advanced Tabs and Advanced
Accordion).
**Style · Spacing** — panel background (G1), panel padding (G2), both starting **Inherited**.

Child elements inside a panel open their own normal panels, breadcrumb `… › Advanced Tabs ›
Support › Card`. A panel is a layout context of its own, so children keep their Size and
Alignment accordions.

**Layout** *(open by default)*

| Row | Control | Options | Default |
|---|---|---|---|
| Presets | Icon buttons | Tabs on top · Tabs on left | Top |
| Tab strip alignment | Icon row | Start · Centre · Justified | Start |
| Tab strip style | Segmented | Underline · Pill · Segmented · Enclosed | Underline |
| Overflow behaviour | Segmented | Scroll · Wrap · More menu | Scroll |
| Gap between tabs | Slider, spacing scale | — | 8 |

**Style** — two sub-groups:
*Tab strip* — background (G1 `Color | Image`) · active tab fill · active indicator colour ·
inactive text colour · border ⚙ · radius ⚙ · G3 `link` role for tab labels.
*Panel* — background (G1) · border ⚙ · radius ⚙ · shadow.

**Spacing** — G2 for the panel, plus a separate padding box for the tab strip.
**Size** ⓘ — Min height · Equalise panel height across tabs (toggle). Info: *width comes from the
column.* Responsive.
**Alignment** — inside Layout, per the reference's rule for container-like elements.

**Accessibility floor** — arrow-key navigation between tabs and correct tab/panel semantics. Shown
as locked-on rows with a note, not hidden.

---

### 3.5 Advanced Accordion *(Layout)* — container

A vertical accordion whose panels hold **other elements**.

> **Three accordion-shaped elements exist. They are not duplicates — pick by what a panel holds.**
>
> | Element | A panel holds | Use when |
> |---|---|---|
> | **FAQ** | A question and an answer | Authored Q&A, carrying question/answer semantics |
> | **Accordion** §3.11 | A title and rich text | Any collapsible prose — policies, terms, long notes |
> | **Advanced Accordion** §3.5 | **Any elements** | A collapsible slice of the page — a card grid, a table, an image and a button together |
>
> **Each of the three must say which it is, and what a panel can hold, in its Content section.**
> Without that line, people place the wrong one and then fight it.

**CONTENT**

| Field | Control | Default | Options |
|---|---|---|---|
| Title | Text | — | optional heading above the accordion |
| Panels | **Item list** (§1.4) | 2 seeded panels | max 12 |
| Allow more than one open at once | Toggle | off | — |
| First panel open by default | Toggle | on | — |
| Deep-linkable | Toggle | on | — |

*Panel row → panel:* Label · Icon · Badge · Open by default · Hide · **Panel content** (drop zone,
same nesting exclusion as §3.4). Plus inherited Style and Spacing.

**Layout** *(open by default)* — Chevron position (Left · Right) · Chevron rotates on open
(toggle) · Header content distribution (icon row).

**Style** — Item container (Flat · Bordered · Card per panel) · divider between items (toggle) ·
header background · open-panel background · border ⚙ · radius ⚙ · shadow · G3 roles `title`
(widget heading) and `subtitle` (panel labels) · expand animation (None · Fast · Normal).

**Spacing** — G2 for the panel body, plus a separate padding box for the header row.
**Size** ⓘ — Min height. Responsive.

---

### 3.6 Divider *(Layout)*

**CONTENT**

| Field | Control | Default |
|---|---|---|
| Label | Text | — · optional text sitting on the line |
| Label position | Segmented | Centre · Left · Right |

**Style** *(open by default)*

| Row | Control | Range / options | Default |
|---|---|---|---|
| Line style | Segmented | Solid · Dashed · Dotted | Solid |
| Thickness | Slider + numeric | 1–8 px | 1 |
| Colour | Colour, theme palette | — | inherit |
| Label typography | G3 `meta` role | — | inherit |

**Spacing** — G2, margin box only. A divider has no inner padding; the panel says so rather than
showing a padding box that does nothing.
**Size** ⓘ — Width (slider + unit dropdown, 10–100 %). Info: *the line's width within its column.*
Responsive.
**Alignment** — Left · Centre · Right. Responsive.

---

### 3.7 Spacer *(Basic)*

**No CONTENT section.** A spacer has nothing to author, only a size. The panel opens directly on
Size with a single line of explanation where Content would be — not an empty group.

**Size** ⓘ *(open by default)*

| Row | Control | Range | Default |
|---|---|---|---|
| Height | Slider + numeric + unit dropdown | 8–200 px | 32 |
| Height — Tablet | Slider | override | inherits Desktop |
| Height — Mobile | Slider | override | inherits Desktop |

Info: *a spacer adds vertical room where section padding is the wrong tool.*

**Style** — one row only: **Show while editing** (toggle, on). A spacer is invisible in preview
and must not be invisible on the canvas too, or it cannot be selected.

No Layout, no Spacing, no Alignment accordion — a spacer *is* spacing.

---

### 3.8 Large Title `title_lg` · Small Title `title_sm` *(Basic)*

Two palette entries, one element with two presets. They exist separately because picking a heading
by name is faster than dropping one and then setting its level.

This is the reference's **Text Block** case, and its accordion set is confirmed: `Style ·
Alignment · Spacing`. **No Layout, no Size.**

**CONTENT**

| Field | Control | Default |
|---|---|---|
| Text | Text | `Large Title` / `Small Title` |
| Heading level | Select | H2 for Large, H3 for Small · H1–H6 |
| Eyebrow | Text | — · optional short line above |
| Sub-heading | Text | — · optional line below |
| Anchor id | Text | — · lets a link jump straight here |

> **Level and size are separate, and the panel must not conflate them.** Heading level is document
> structure — it drives screen readers and anchors. Size is typography. Someone who wants smaller
> text must not be silently demoting an H2 to an H4.

**Style** *(open by default)* — G3 roles `title` (the heading), `subtitle` (the sub-heading),
`meta` (the eyebrow). Each control carries the **`*` override marker** when it departs from the
Site Theme — this is the element where that pattern matters most. Plus: text colour · background
(G1 `Color | Image`) · rule beneath (toggle, with colour and thickness).

**Alignment** — its own accordion, per the reference's Text Block. Left · Centre · Right ·
Justify. Responsive.
**Spacing** — G2.

---

### 3.9 List *(Basic)*

An authored list of lines, each with an optional icon and link. Not a data list — for records use
the Components elements. The Content section says so in one line.

**CONTENT**

| Field | Control | Default | Options |
|---|---|---|---|
| Title | Text | — | optional |
| Items | **Item list** (§1.4) | 3 seeded lines | max 20 |
| Marker | Segmented | Icon | Icon · Bullet · Number · None |

*Item row → panel:* Text (rich text) · Icon (icon picker, when marker = Icon) · Secondary text ·
Link (URL or page) · Hide. Style: G3 `body` role and icon colour, both **Inherited**.

**Layout** *(open by default)* — Columns (1 · 2 · 3) · Gap (slider, spacing scale) · Marker
alignment (Top · Middle) · Divider between items (toggle).

**Style** — G1 background & container, plus: marker colour · marker size · G3 roles `title`,
`body`, `meta` · row hover effect (pill row: None · Tint).

**Spacing** — G2, plus a separate padding box for the item row.
**Alignment** — Left · Centre. Responsive.

---

### 3.10 Countdown *(Basic)*

Time remaining to a moment — a maintenance window, a cut-off, a migration date.

**CONTENT**

| Field | Control | Default | Notes |
|---|---|---|---|
| Title | Text | — | optional |
| Counts down to | Date + time picker | — | **required** |
| Time zone | Select | portal default | authored explicitly — a maintenance window in the wrong zone is worse than none |
| Units shown | Chips | Days, Hours, Minutes | Days · Hours · Minutes · Seconds |
| Unit labels | Text ×4 | `Days` `Hrs` `Min` `Sec` | — |
| When it reaches zero | Segmented | Show a message | Show a message · Hide the element · Keep counting up |
| Message at zero | Text | `This window has started.` | when *Show a message* |

**Validation** — a date in the past warns in the panel immediately, rather than shipping a
countdown that reads `0`.

**Layout** *(open by default)* — Presets (icon buttons: Inline · Boxed units · Stacked) · Gap
between units (slider) · Separator (None · Colon · Dot) · Content distribution (icon row).

**Style** — G1, plus: digit typography (G3 `title` role, size 100–400 %) · unit-label typography
(G3 `meta`) · unit box fill · unit box radius ⚙ · unit box border ⚙ · title typography (G3
`title`).

**Spacing** — G2.
**Size** ⓘ — Min height. Responsive.
**Alignment** — Left · Centre · Right. Responsive.

---

### 3.11 Accordion *(Basic)*

The plain collapsible-prose accordion. Its Content section states which of the three accordions it
is — see the comparison in §3.5.

**CONTENT**

| Field | Control | Default |
|---|---|---|
| Title | Text | — · optional |
| Items | **Item list** (§1.4) | 2 seeded items · max 20 |
| First item open by default | Toggle | on |
| Allow more than one open at once | Toggle | off |

*Item row → panel:*
**CONTENT** — Title (text) · Body (**rich text** — the detail page's composer) · Icon (optional) ·
Open by default · Hide.
Sub-elements `Title` and `Body` are separately selectable, each with its own G3 typography,
inheriting from the item.

**Layout** *(open by default)* — Chevron position (Left · Right) · Chevron rotates on open ·
Header content distribution (icon row).

**Style** — Item container (Flat · Bordered · Card per item) · divider between items · header
background · open-item background · border ⚙ · radius ⚙ · shadow · G3 roles `title`, `subtitle`
(item titles), `body` (item bodies) · expand animation (None · Fast · Normal).

**Spacing** — G2 for the body, plus a separate padding box for the header row and a body indent
slider.
**Size** ⓘ — Min height. Responsive.

> **This Style block is identical to Advanced Accordion's (§3.5) and to FAQ's.** Build it once and
> share it across all three.

---

### 3.12 Text with Image *(Basic)*

A paired text-and-image block — the full-width story unit. Distinct from Card: a Card is a
bordered tile in a grid of tiles; this is a composition across the column.

**CONTENT**

| Field | Control | Default | Notes |
|---|---|---|---|
| Image | Upload | — | the detail page's attachment control |
| Alt text ⓘ | Text, with **inline AI generate** | — | warned when blank |
| Eyebrow | Text | — | optional |
| Heading | Text | — | sub-element |
| Body | **Rich text** | — | sub-element |
| Call to action | Toggle | off | reveals label + destination |
| CTA label | Text | — | when CTA on |
| CTA opens | Select + fields | External link | the Button action set — external link · portal page · download · email · phone · share |

**Layout** *(open by default)*

| Row | Control | Options | Default |
|---|---|---|---|
| Presets | Icon buttons | Image left · Image right · Image above · Image below | Image left |
| Image / text ratio | Slider | 30–70 % | 50 |
| Gap | Slider, spacing scale | — | 24 |
| Vertical alignment | Icon row | Top · Middle · Bottom · Stretch | Middle |
| Stack on narrow screens | Toggle | — | on |
| Reverse order when stacked | Toggle | — | off |

**Style** — G1 for the block container, plus an *Image* sub-group carrying the reference's
confirmed image controls: fit icon toggles (`Cover` · `Full image` · `No repeat`) · position 3×3
dot grid · border ⚙ · corner radius ⚙ · shadow toggle · hover effect (pill row: None · Zoom in ·
Zoom out) · **Don't optimize image** ⓘ toggle. Plus G3 roles `title` (heading), `subtitle`
(eyebrow), `body`, and the CTA reusing the Button styling.

**Spacing** — G2.
**Size** ⓘ — Image min height · Image max height · Block min height. Info: *the block's width comes
from its column.* Responsive.

---

### 3.13 Icon *(Visual)*

A single mark, on its own.

**CONTENT**

| Field | Control | Notes |
|---|---|---|
| Icon | **Icon picker** — library marks, upload, none | shows the marks themselves, never a list of names |
| Accessible label | Text | blank marks it decorative and hides it from screen readers — **the panel says this**, it is not a silent behaviour |
| Link | Select + fields | none · the Button action set |
| Caption | Text | optional |

**Style** *(open by default)*

| Row | Control | Options | Default |
|---|---|---|---|
| Icon colour | Colour, theme palette | — | inherit |
| Container shape | Segmented | None · Circle · Rounded square | None |
| Container fill | Colour | — | — |
| Border ⚙ | Slider + colour | — | none |
| Corner radius ⚙ | Slider + unit | — | inherit |
| Shadow | Toggle | — | off |
| Hover effect | Pill row | None · Grow · Tint | None |
| Caption | G3 `meta` role | — | inherit |

**Spacing** — G2.
**Size** ⓘ — Icon size (slider, 12–64 px) · Container size. Responsive.
**Alignment** — Left · Centre · Right. Responsive.

---

### 3.14 Shape *(Visual)*

A decorative form — a rule, a blob, a bracket.

**CONTENT**

| Field | Control | Options | Default |
|---|---|---|---|
| Shape | Picker | Rectangle · Circle · Triangle · Wave · Blob · Custom SVG | Rectangle |
| Custom SVG | Upload | — | when *Custom SVG* |

One line of explanation: *decorative — hidden from screen readers.*

**Style** *(open by default)*

| Row | Control | Range / options | Default |
|---|---|---|---|
| Fill | Colour or gradient, theme palette | — | inherit |
| Stroke colour | Colour | — | none |
| Stroke width | Slider | 0–12 px | 0 |
| Corner radius ⚙ | Slider + unit | — | 0 |
| Rotation | Slider | −180 to 180° | 0 |
| Opacity | Slider | 0–100 % | 100 |
| Flip | Icon toggles | Horizontal · Vertical | — |
| Layer | Segmented | Behind content · In flow · In front | In flow |

**Spacing** — G2, margin box only.
**Size** ⓘ — Width · Height, both with unit dropdowns. Responsive.
**Alignment** — Left · Centre · Right. Responsive.

---

### 3.15 Contact Form *(Business)*

An authored form that raises a request or sends a mail. **The only element in this set that
writes rather than reads**, so its validation and its confirmation are part of the spec, not an
afterthought.

**CONTENT**

| Group | Field | Control | Default | Options |
|---|---|---|---|---|
| Form | Title | Text | `Get in touch` | — |
| Form | Intro | Text area | — | optional |
| Fields | **Item list** (§1.4) | Name, Email, Message seeded | max 12 | |
| Submit | Button label | Text | `Send` | — |
| Submit | **On submit** | Select | Create a request | Create a request · Send an email |
| Submit | Request template | Select | — | when *Create a request* |
| Submit | Send to | Text | — | when *Send an email* |
| Submit | Confirmation | Segmented | Message | Message · Go to a page |
| Submit | Confirmation message | Text area | `Thanks — we've got it.` | when *Message* |
| Privacy | Consent checkbox | Toggle + text | off | — |
| Privacy | Spam protection | Toggle | on | — |

*Field row → panel:*

| Field | Control | Notes |
|---|---|---|
| Label | Text | — |
| Type | Select | Single line · Paragraph · Email · Phone · Number · Date · Dropdown · Checkbox · Radio · File upload |
| Placeholder | Text | — |
| Help text | Text | — |
| Options | **Nested item list** | Dropdown / Radio only — each option its own row with drag, duplicate, delete |
| Required | Toggle | — |
| Maps to | Select | which request attribute this field populates, when submitting creates a request |
| Width | Segmented | Full · Half |
| Hide this field | Toggle | — |

> **A required field that maps to nothing, or a submit action with no destination, must warn in the
> panel.** A form that silently drops what a requester typed is the worst failure in this system.

**Layout** *(open by default)* — Columns (1 · 2) · Field gap (slider, spacing scale) · Label
position (Above · Inline) · Submit button alignment (icon row).

**Style** — G1 for the form container, plus an *Inputs* sub-group: input fill · input border ⚙ ·
input radius ⚙ · input height (Small · Medium · Large) · label typography (G3 `body`) · help-text
typography (G3 `meta`) · error colour. The submit button **reuses the Button element's styling
block** — do not re-author it.

**Spacing** — G2.
**Size** ⓘ — Max width. Info: *a long form reads badly at full page width.* Responsive.

---

### 3.16 Action Icon *(Custom)*

The compact sibling of Action Card — a mark and a short label, for a row of quick entry points.

**CONTENT**

| Field | Control | Default | Options |
|---|---|---|---|
| Destination | Select | Report an incident | Report an incident · Request a service · AD self service · Knowledge · A page in this portal · External link |
| Label | Text | *seeded from the destination* | — |
| Icon | Icon picker | *the destination's default mark* | changing destination re-suggests the icon but never overwrites an explicit choice |
| Show label | Toggle | on | off makes the label the tooltip and the screen-reader name |
| Badge | Segmented + fields | None | None · Static text · Live count (choose a KPI source) |

**Gating follows the destination, not the element.** *Report an incident* needs the create-incident
permission; *Request a service* needs the catalogue module and permission; *Knowledge* needs the
knowledge permission. Change the destination and the panel's warning changes with it — with a link
to the setting where one exists.

**Layout** *(open by default)* — Presets (icon buttons: Icon above label · Icon beside label) ·
Gap (slider) · Content distribution (icon row).

**Style** — Container shape (None · Circle · Rounded square) · container fill · container size ·
icon colour · border ⚙ · radius ⚙ · shadow · hover effect (pill row) · G3 `meta` role for the
label · badge colour.

**Spacing** — G2.
**Size** ⓘ — Icon size · Container size. Responsive.
**Alignment** — Left · Centre · Right. Responsive.

---

## 4. Accordion coverage matrix

Which accordions appear on which element. **Blank means the accordion does not appear at all** —
not disabled, not empty. `●` marks the accordion that opens by default.

| Element | Content | Layout | Style | Spacing | Size | Alignment | Anim. |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Search | ✓ | | ● | ✓ | ✓ | ✓ | *V2* |
| Categories | ✓ | ● | ✓ | ✓ | ✓ | *in Layout* | *V2* |
| My Tasks | ✓ | ✓ | ● | ✓ | ✓ | | *V2* |
| Advanced Tabs | ✓ | ● | ✓ | ✓ | ✓ | *in Layout* | *V2* |
| Advanced Accordion | ✓ | ● | ✓ | ✓ | ✓ | *in Layout* | *V2* |
| Divider | ✓ | | ● | ✓ *(margin)* | ✓ | ✓ | |
| Spacer | | | ✓ | | ● | | |
| Large / Small Title | ✓ | | ● | ✓ | | ✓ | *V2* |
| List | ✓ | ● | ✓ | ✓ | | ✓ | *V2* |
| Countdown | ✓ | ● | ✓ | ✓ | ✓ | ✓ | *V2* |
| Accordion | ✓ | ● | ✓ | ✓ | ✓ | | *V2* |
| Text with Image | ✓ | ● | ✓ | ✓ | ✓ | | *V2* |
| Icon | ✓ | | ● | ✓ | ✓ | ✓ | *V2* |
| Shape | ✓ | | ● | ✓ *(margin)* | ✓ | ✓ | *V2* |
| Contact Form | ✓ | ● | ✓ | ✓ | ✓ | | *V2* |
| Action Icon | ✓ | ● | ✓ | ✓ | ✓ | ✓ | *V2* |

*V2* = Animations & Effects is deferred out of V1 per §1.7. Listed so the structure is complete.

---

## 5. Configuration schema

```jsonc
// Every element carries the same envelope
{
  "id": "e12",
  "type": "list",
  "hidden": false,
  "locked": false,
  "anchor": null,
  "content": { /* the Content section, per type below */ },
  "style": {
    "layout":    { /* Layout accordion */ },
    "style":     { /* Style accordion  */ },
    "spacing":   { padding: {t,r,b,l,linked}, margin: {t,r,b,l,linked} },
    "size":      { /* Size accordion */ },
    "alignment": "left" | "center" | "right",
    "overrides": [ "style.title.size", "spacing.padding.t" ],   // drives the `*` markers
    "tablet":    { /* alignment | size | spacing overrides only */ },
    "mobile":    { /* alignment | size | spacing overrides only */ },
    "hiddenOn":  [ "mobile" ]
  }
}
```

```jsonc
// Content, per element
search        { placeholder, scope: "knowledge"|"all", suggestions,
                showSubmit, submitLabel,
                popular: [ { id, hidden, term, target } ] }

categories    { title, source: "all"|"chosen", count: 1-12,
                showCount, showIcon, showDesc, browseAll: { on, label },
                items: [ { id, hidden, categoryId,
                           labelOverride, iconOverride, descOverride, style } ] }

my_tasks      { title, count: 1-10, statuses: [],
                showDue, showRelated, showOverdue, showTotal,
                viewAll: { on, label }, emptyMessage }

tabs          { defaultOpen: <tabId>|"remember", deepLink,
                items: [ { id, hidden, label, icon, badge,
                           blocks: [ /* any element */ ], style } ] }

accordion_adv { title, openFirst, allowMultiOpen, deepLink,
                items: [ { id, hidden, label, icon, badge, openByDefault,
                           blocks: [ /* any element */ ], style } ] }

divider       { label, labelPos: "center"|"left"|"right" }

spacer        { }                       // size lives entirely in style.size

title_lg |
title_sm      { text, level: "h1".."h6", eyebrow, sub, anchor }

list          { title, marker: "icon"|"bullet"|"number"|"none",
                items: [ { id, hidden, html, icon, secondary, link, style } ] }

countdown     { title, target /* ISO */, timezone, units: [], labels: {},
                atZero: "message"|"hide"|"countUp", zeroMessage }

accordion     { title, openFirst, allowMultiOpen,
                items: [ { id, hidden, title, body /* rich text */, icon,
                           openByDefault, style } ] }

text_image    { src, alt, eyebrow, heading, body,
                cta: { enabled, label, action, url, page, newTab } }

icon          { icon, iconSrc, a11yLabel, caption,
                link: { action, url, page, email, phone } }

shape         { shape: "rect"|"circle"|"triangle"|"wave"|"blob"|"custom", svgSrc }

contact_form  { title, intro, submitLabel,
                onSubmit: "request"|"email", requestTemplate, sendTo,
                confirmation: { kind: "message"|"page", message, page },
                consent: { on, text }, spamProtection,
                fields: [ { id, hidden, label, type, placeholder, help,
                            required, mapsTo, width: "full"|"half",
                            options: [ { id, label, value } ], style } ] }

action_icon   { destination, label, icon, iconSrc, showLabel,
                page, url, newTab,
                badge: { kind: "none"|"text"|"count", text, source } }
```

---

## 6. Build order

1. **Panel shell** (§1.1) — header, breadcrumb, element name, `⋯` menu, the Content section, the
   accordion container. Built from the detail page's properties panel.
2. **Control mechanics** (§1.3) — the gear-advanced pattern, unit dropdown, nested padding box
   with link toggle, slashed swatch, `*` override marker, orange accordion dot, 3×3 grid, icon
   toggles, pill row.
3. **Shared groups** (§2) — G1 background & container, G2 spacing, G3 text roles.
4. **The five elements with no collection** — Divider, Spacer, Titles, Icon, Shape. They are pure
   compositions of steps 2 and 3 and prove the shell before anything complicated lands.
5. **The flat elements** — My Tasks, Countdown, Text with Image, Action Icon.
6. **The item-list contract** (§1.4) — the reorderable row, the item panel, inheritance,
   keyboard reorder. **Six elements depend on this.**
7. **Simple collections** — Accordion, List, Search, Categories.
8. **Contact Form** (§3.15) — the write path, with mapping, validation and confirmation.
9. **Containers** — Advanced Tabs, Advanced Accordion. Last, because a panel that holds any
   element needs every element to exist first.
10. **Breakpoints** (§1.6) — the cascade rule, per-breakpoint overrides, `Hide from`.

If step 4 needs a component that is not already in the product, step 1 or 2 was not finished —
go back to the detail page and find it rather than forking.
If an element in steps 7–9 needs a bespoke item list, step 6 was not finished. Same rule.

---

## 7. Open questions — resolve before build

1. **The `⋯` menu items dropped in §1.5** — Edit CSS, Add CSS Class Name, Connect to Data, Add
   Comment, Save as Section. Each needs a product decision. Shipping a menu item with nothing
   behind it is worse than not shipping it.
2. **One BASIC palette entry is cut off** in the source screenshots, between *List* and
   *Countdown*. It is not specified here. Identify it and add it.
3. **Search appears twice in the palette** — once under Components, once under Custom. This file
   specifies one Search element. Either delete the duplicate entry or give them different names;
   two identically named palette entries is a coin flip for whoever uses it.
4. **`DUDA-ADD-AND-THEME-RESEARCH.md`**, the companion referenced at the top of the Duda file,
   is not in this repository. If the Theme panel work depends on it, it needs to be located —
   §8.2 of the Duda file suggests the Squarespace "Site Styles" preview-in-the-row model is the
   better target for our Theme panel than Duda's own.
