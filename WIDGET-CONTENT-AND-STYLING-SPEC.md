# Support Portal Builder — Widget Content & Styling Specification

> **Scope of this document**
> Every widget the Support Portal home-layout builder can place, and for each one:
> what it *does*, what its **Content** panel holds, what its **Styling** panel holds,
> and — for widgets that contain sub-elements — how the drawer descends layer by layer
> into those children and back out again.
>
> This file describes **behaviour, structure, data and control semantics only**.
> It deliberately does **not** describe visual design.

---

## 0. Build prompt — read this before building anything

**You are implementing the side drawer (settings panel) for a portal page builder.**

1. **Reuse the existing design system. Build nothing new.**
   Every control, row, tab, accordion, breadcrumb, list item, toggle, colour picker, upload
   zone, callout, badge and empty state in this document **must** be composed from the
   components, tokens, spacing scale, typography scale, icon set and interaction patterns that
   already exist in your project. If a control described here looks like something you already
   have, it *is* that thing — use it. Do not fork a component to add a variant that the design
   system already covers, and do not invent a second way to render a form row.

2. **This document gives you semantics, not styling.**
   Where it says "segmented control", "chips", "slider", "list row with drag handle", it is
   naming a *role*. Map that role onto your own component and let your own design language,
   density, colour, radius, motion and dark-mode rules apply automatically.

3. **One drawer, one pattern, N widgets.**
   Do not build 20 bespoke panels. Build the drawer shell once (§2), build the shared control
   kit once (§3), build the shared style packs once (§5), build the item-list contract once
   (§4) — then every widget in §7 is a small declarative composition of those pieces. If a
   widget in §7 needs something that does not exist in §3–§5, add it to §3–§5 first and reuse
   it from there.

4. **Ignore any inline/floating toolbar.**
   The source prototype also has a floating toolbar that appears on the canvas when a block is
   selected, and several canvas drag gestures. **They are out of scope.** Everything in this
   document is reachable from the side drawer alone. Where a property historically lived only
   as a canvas gesture (width, height, padding, column split, table column width, inline text
   editing), this document places it in the drawer as a real field. The drawer is the complete
   and sufficient editing surface.

5. **Content and Styling are two tabs at every level.**
   Every selectable thing — page, section, widget, item, sub-element — opens the same drawer
   with the same two tabs. A level that has nothing to style still shows the Styling tab with
   its inherited values and an explanation, never a missing tab.

---

## 1. The layer model

The user's mental model is *drilling in*. A portal page is not two levels (page → widget); it is
up to seven, and **each layer owns its own content, its own styling, its own alignment and its
own spacing.** The drawer must make the current depth obvious and the way back trivial.

| # | Layer | Example | Owns |
|---|---|---|---|
| L0 | **Page** | Portal home | Page background, theme colours, typeface, global text scale |
| L1 | **Section** | "Quick actions" band, Banner | Band background, top/bottom padding, column count, column gap, vertical alignment |
| L2 | **Column** | 70 / 30 split | Column width, its own alignment of the blocks inside it |
| L3 | **Widget (block)** | FAQ, Card, Media Slider, My Open Requests | Everything in §7 for that widget: its content and its container styling |
| L4 | **Collection track** | The FAQ list, the slider track, the gallery grid, the card's child stack, the table body | How the set is arranged: columns, gap, dividers, per-view count, item alignment |
| L5 | **Item** | One FAQ entry, one slide, one photo, one table row, one card child block, one feedback question | Its own content fields, plus style overrides against the widget default |
| L6 | **Sub-element** | FAQ Question text / Answer text; slide Heading / Caption / CTA; banner Heading / Sub-heading / Search bar; gallery caption | Its own text, its own typography, its own alignment |

### 1.1 Rules that hold at every layer

- **Inherit by default, override explicitly.** A child starts by inheriting every style value
  from its parent layer. The drawer shows the state as `Inherited` or `Overridden` per field
  group, with a **Revert to inherited** action that never destroys the link. This is the safety
  property: an editor can always undo a local change without knowing what the parent value was.
- **A layer never edits its parent's geometry.** An item cannot set the widget's width; it can
  set its own. A sub-element cannot set the item's padding.
- **Descend by selection, return by breadcrumb.** Selecting a child on the canvas opens that
  child's drawer directly (not the parent's). The breadcrumb is the only navigation needed.
- **Every layer is deletable/duplicatable from its *parent's* item list**, not from its own
  drawer — except widgets and sections, which carry their own destructive actions in the drawer
  header overflow.

---

## 2. The drawer shell

One shell, used by every layer. Build it once.

```
┌─ DRAWER ────────────────────────────────────────────┐
│ ‹ Back            [ ⋮ overflow ]                     │  header row 1
│ Home layout › Main › FAQ › Q2                        │  breadcrumb (ancestors clickable)
│ Question & Answer                                    │  title = what is selected
│ [ Content ] [ Styling ]                              │  tabs
├──────────────────────────────────────────────────────┤
│ ▸ Group                                              │  collapsible groups
│    field row                                         │
│    field row + helper text                           │
│ ▸ Group                                              │
│ ⚠ callout / ⓘ note                                   │
├──────────────────────────────────────────────────────┤
│ (sticky, only where a level has a primary action)    │  e.g. "Add question"
└──────────────────────────────────────────────────────┘
```

### 2.1 Shell behaviours

| Element | Behaviour |
|---|---|
| **Back** | Goes to the immediate parent layer. At the root of a widget it goes back to the **Widget palette**, which is the drawer's resting state when nothing is selected. |
| **Breadcrumb** | Full ancestor path, truncating from the middle when long. Every ancestor is clickable and opens that layer's drawer. The last crumb is the current selection and is not a link. |
| **Title** | The human name of the selected thing. For items, the item's own text if it has one (`"How do I reset my password?"`), otherwise `Item 2`. |
| **Tabs** | `Content` and `Styling`. Tab choice is remembered per layer *type* for the session — an editor who is styling five slides in a row should not have to re-click Styling each time. |
| **Overflow ⋮** | Layer-level destructive/structural actions: Duplicate, Delete, Reset to default, Hide from requesters. Never in the tab body. |
| **Groups** | Collapsible. Open/closed state remembered per widget type. Groups with zero visible fields (because of conditional logic) are not rendered at all — never rendered empty. |
| **Sticky footer** | Only for layers whose primary job is adding children (FAQ, Slider, Gallery, Table, Card, Feedback follow-ups). Holds the single **Add …** action so it stays reachable in a long list. |
| **Empty state** | When nothing is selected the drawer shows the **Widget palette** grouped as in §6. |
| **Live apply** | Every change applies to the canvas immediately. There is no Save inside the drawer. Publishing is a page-level action. |
| **Undo** | Every drawer change is one undo step. Continuous controls (slider, colour, text typing) coalesce into a single step per interaction, not per keystroke. |

### 2.2 Conditional fields

Fields appear and disappear based on other fields (e.g. a Button's URL field only exists when its
action is *External link*). Rules:

- A field that does not apply is **removed**, not disabled.
- A field that applies but is **blocked by a dependency the editor can fix** is shown disabled
  with the reason and a link to the fix. Disabled-with-reason and absent mean different things
  and must look different.
- Changing a parent field that invalidates children clears them and says so in a note.

---

## 3. The shared control kit

Map each role onto an existing component. These are the only control types this whole
specification uses.

| Role | Used for | Notes |
|---|---|---|
| **Text field** | Titles, labels, URLs, emails, alt text | Single line |
| **Text area** | Descriptions, FAQ answers, captions | Auto-growing, 3–8 rows |
| **Rich text** | Text widget body, banner greeting | Bold / italic / underline / bulleted list / link / clear formatting. **This lives in the drawer**, since the inline toolbar is out of scope |
| **Number field** | Row counts, days, dimensions | With min/max, and a unit suffix |
| **Slider** | Padding, gap, opacity, overlay, scale, radius | Always paired with a live numeric readout and an editable number |
| **Segmented control** | 2–4 mutually exclusive options (alignment, fill type, scale type, card layout) | Never more than 4 |
| **Select** | 5+ mutually exclusive options (action type, KPI source, page target, transition) | |
| **Toggle** | Boolean show/hide, on/off | Label sits with the toggle, no separate label column |
| **Chips (multi-select)** | Status filters, choice options | Toggling a chip is immediate |
| **Colour** | Any colour property | Swatch + hex input, both bound to the same value |
| **Upload / drop zone** | Images, icons, logos, files | Click or drag. Shows a preview and a Remove action once set |
| **Icon picker** | Any icon property | Renders the marks themselves, never a list of names. Includes a **None** option and an **Upload your own** path. An uploaded icon supersedes a picked one; picking a built-in clears the upload |
| **Grid picker** | Table size | Sweep a 10×10 grid; live `R × C` readout |
| **List row** | Every collection item (§4) | The single most reused component in this spec |
| **Inherit row** | Any field that can inherit from a parent layer | Shows `Inherited` / `Overridden` state, the parent's value, and **Revert to inherited** |
| **Note — info** | Explaining where a value comes from, or what a control does | |
| **Note — warning** | A gate is closed, a setting is off, a choice has a consequence | Carries a deep link to the setting where one exists |
| **Meter** | Contrast readout on any text-over-background pairing | Value, verdict, and a one-click **Fix it** |
| **Badge** | `Placed`, `Locked`, `Hidden`, `Inherited`, `Overridden` | |

---

## 4. The collection contract (the part with sub-elements)

This is the pattern behind FAQ, Media Slider, Photo Gallery, Card children, Table rows, Feedback
follow-up questions, the left rail and the top bar. **Build it once and reuse it for all of them.**

A collection widget has three drawer levels:

```
L3  Widget            "FAQ"              → widget content + widget styling + the item list
L5  Item              "Q2"               → that item's content + that item's style overrides
L6  Sub-element       "Answer"           → that text's content + its typography
```

### 4.1 The item list, as it appears in the widget's Content tab

Every item is one **list row** with a fixed anatomy:

| Slot | Purpose | Notes |
|---|---|---|
| **Drag handle** | Reorder within the collection | Drag is confined to its own collection — an item can never be dropped into a different widget or onto the page |
| **Index / thumbnail** | `1`, `2`, `3` for text items; the media thumbnail for slides and photos; the widget glyph for card children | |
| **Primary label** | The item's own text — the question, the slide heading, the photo caption, the child block's type | Falls back to `Item N` when empty |
| **Secondary label** | One line of the most useful metadata — answer preview, media filename, link target, block type | Optional |
| **Quick actions** | **Duplicate** · **Delete** · **Hide** (where the collection supports hiding) | Icon actions, right-aligned |
| **Open affordance** | Opens the item's own drawer (L5) | The whole row is the target; the quick actions do not trigger it |

Additional list behaviours, identical everywhere:

- **Keyboard reorder.** Move up / move down must remain available for anyone not dragging —
  either as keyboard support on the focused row or as an overflow action. Drag is never the only
  way to reorder.
- **Add.** A single **Add …** action in the sticky footer. New items are appended, immediately
  selected, and their drawer opened, so the editor types straight into the new thing rather than
  hunting for it. A newly added item is seeded with realistic placeholder content, never
  `Untitled`.
- **Delete.** Removes immediately and raises an undo affordance. No confirmation dialog for a
  single item; confirmation only when deleting the whole widget or section takes children with it.
- **Empty collection.** The list area shows an explanatory empty state and the Add action; the
  widget on the canvas shows its own empty state (§7 per widget).
- **Limits.** Where a collection has a maximum (§7), the Add action disables at the limit and
  says why. Silent no-ops are forbidden.

### 4.2 The item drawer (L5)

- **Content tab** — the item's own fields. These differ per widget and are listed in §7.
- **Styling tab** — *only* the properties that are legitimately per-item. Every field starts as
  **Inherited** from the widget-level style and shows the inherited value. Overriding one field
  does not detach the rest.
- **Header** — breadcrumb ends in the item; overflow carries Duplicate / Delete / Hide so the
  editor does not have to navigate back to the list to act on the item they are looking at.

### 4.3 The sub-element drawer (L6)

Reached by selecting a distinct part of an item on the canvas (a slide's heading, a FAQ answer,
the banner's search bar). Holds:

- **Content tab** — the text or the source for just that part.
- **Styling tab** — typography, colour, alignment and spacing for just that part, inheriting from
  the item, which inherits from the widget, which inherits from the section, which inherits from
  the page theme. The drawer shows which ancestor a value is currently coming from.

---

## 5. Shared style packs

Every widget's Styling tab is assembled from these packs. Build each pack once as a component
that takes a value object and emits changes; do not re-author these fields per widget.

### P1 — Container
Applies to: every widget, every section, cards, slides, gallery tiles.

| Property | Control | Range / options | Default |
|---|---|---|---|
| Background fill | Segmented | None · Colour · Image | None |
| Background colour | Colour | — | inherit |
| Background image | Upload / preset | — | — |
| Background overlay | Slider | 0–80 % | 0 |
| Background scope *(sections only)* | Segmented | This section · Whole page | This section |
| Border | Segmented | None · Line · Shadow | Line |
| Border colour | Colour | — | inherit |
| Corner radius | Slider | 0–24 px | inherit |
| Padding | Slider (linked, expandable to 4 sides) | 0–48 px | 16 |
| Elevation / shadow depth | Segmented | None · Subtle · Raised | None |

> **Overlay exists only for image fills** — its job is keeping text readable over arbitrary
> artwork. When fill ≠ image, the field is removed, not disabled.

### P2 — Size & position
Applies to: every widget (block-level), columns, media.

| Property | Control | Range | Default |
|---|---|---|---|
| Width | Slider + number | 10–100 % of its column | 100 |
| Height | Number | auto, or 60 px+ | auto |
| Horizontal alignment | Segmented | Left · Centre · Right | Left |
| Outer spacing (top / bottom) | Slider | 0–64 px | 0 |

> Width snaps to 5 % steps by default with a fine-grained modifier; the numeric field always
> accepts any integer.

### P3 — Typography roles
Applies to: every text-bearing widget. Exposed per **role**, not per element, so one widget shows
only the roles it actually has.

| Role | Where it appears |
|---|---|
| `title` | Widget/card/section heading |
| `subtitle` | Sub-heading, description, prompt |
| `body` | Answer text, description, caption body |
| `meta` | Dates, categories, counts, requester names, status text |
| `link` | "View all", CTA text links |

Per role: **Typeface** (Inherit from theme + the theme's font list) · **Size** (slider, 80–200 %
of the role's base) · **Weight** (segmented: Regular · Medium · Bold) · **Colour** · **Alignment**
(segmented: Left · Centre · Right) · **Line height** (segmented: Tight · Normal · Relaxed) ·
**Max lines / truncation** (number, 0 = no clamp).

> **Typeface defaults to Inherit and must stay that way.** A per-widget typeface is an escape
> hatch for one pull-quote or legal line, not a way to build a page in six fonts. Portal-wide
> type is a Theme decision.

### P4 — List & grid arrangement
Applies to: all list-card widgets, FAQ, Gallery, Featured Services, Card children, Table.

| Property | Control | Range / options | Default |
|---|---|---|---|
| Arrangement | Segmented | List · Grid | per widget |
| Columns | Segmented / number | 1–6 | per widget |
| Gap between items | Slider | 0–32 px | 8 |
| Row density | Segmented | Compact · Comfortable | Comfortable |
| Dividers between items | Toggle | — | on for lists |
| Item alignment | Segmented | Left · Centre | Left |
| Equal-height items | Toggle | — | off |

### P5 — Media
Applies to: Image, Card image, Slider slides, Gallery photos, Banner background.

| Property | Control | Range / options | Default |
|---|---|---|---|
| Aspect ratio | Segmented / select | Original · 1:1 · 4:3 · 16:9 · 21:9 · Custom | Original |
| Fit | Segmented | Cover · Contain | Cover |
| Focal point | 9-point picker or draggable point | — | Centre |
| Shape | Segmented | Rectangle · Rounded · Circle | Rounded |
| Corner radius | Slider | 0–24 px | inherit |
| Overlay | Slider | 0–80 % | 0 |
| Caption position | Segmented | Below · Overlay · Hidden | Below |

### P6 — Icon
Applies to: Action cards, Button, Count tile, Card, rail and navbar items.

| Property | Control | Options | Default |
|---|---|---|---|
| Source | Icon picker | None · Library mark · Uploaded image | widget default |
| Size | Slider | 12–48 px | 20 |
| Colour | Colour | — | inherit |
| Container shape | Segmented | None · Square · Circle | None |
| Container fill | Colour | — | — |
| Position relative to text | Segmented | Left · Top · Right | Left |

### P7 — Interactive states
Applies to: anything clickable — cards, list rows, buttons, slides, gallery tiles, FAQ headers.

| Property | Control | Options | Default |
|---|---|---|---|
| Hover treatment | Segmented | None · Lift · Tint · Outline | Tint |
| Pressed / active treatment | Segmented | None · Tint | Tint |
| Focus ring | Toggle (locked on) | — | on |
| Disabled treatment | *read-only, from design system* | — | — |
| Transition speed | Segmented | None · Fast · Normal | Normal |

> Focus ring is not an editor decision. Show it as a locked-on row with a note rather than
> hiding it, so nobody goes looking for a switch that should not exist.

### P8 — Empty, loading and error presentation
Applies to: every live-data widget.

| Property | Control | Notes |
|---|---|---|
| Empty-state message | Text field | Default per widget; e.g. `No Data Found` |
| Empty-state visibility | Segmented | Show message · Hide the whole widget |
| Loading treatment | Segmented | Skeleton · Spinner | Skeleton |
| Error message | Text field | Falls back to the platform default |

---

## 6. Widget catalogue

**Reuse** — `single` = only one per page (the palette shows it as *Placed* and greys it once used);
`many` = freely repeatable.
**Family** — `flat` = direct field editing; `collection` = has an item list and deeper layers.

| Group | Widget | id | Reuse | Family | Gate |
|---|---|---|---|---|---|
| Live data | My Open Requests | `my_requests` | single | flat | Request **module** |
| Live data | Pending Approvals | `pending_approvals` | single | flat | *Allow Requester To Access My Approvals* |
| Live data | My Assets | `my_assets` | single | flat | *Allow Requester to Access My Assets* |
| Live data | My CIs | `my_cis` | single | flat | *Allow Requester to Access My CI* |
| Live data | Announcements | `announcements` | single | flat | — |
| Live data | Most Read Knowledge | `most_read` | single | flat | *Allow Requester To Access Knowledge* |
| Live data | Contact Us | `contact_us` | single | flat | — |
| Live data | Featured Services | `featured_services` | single | flat | Catalog module + *Access Service Catalog* |
| Live data | Feedback | `feedback` | single | **collection** | *Allow Requester To Submit Feedback* |
| Actions | New Incident | `act_incident` | single | flat | *Allow Requester to create Incident* |
| Actions | Request Service | `act_service` | single | flat | *Access Service Catalog* |
| Actions | AD Self Service | `act_ad` | single | flat | — |
| Actions | Knowledge | `act_knowledge` | single | flat | *Access Knowledge* |
| Actions | Button / Link | `button` | many | flat | — |
| Actions | Count tile | `count_tile` | many | flat | per selected source |
| Content | Text | `text` | many | flat | — |
| Content | Image | `image` | many | flat | — |
| Content | Card | `card` | many | **collection** | — |
| Content | FAQ (accordion) | `faq` | many | **collection** | — |
| Content | Table (static) | `table` | many | **collection** | — |
| Content | Media Slider † | `media_slider` | many | **collection** | — |
| Content | Photo Gallery † | `photo_gallery` | many | **collection** | — |
| Structure | Banner | `hero` section | single | **collection** | — |
| Structure | Section | `section` | many | container | — |
| Structure | Page | `page` | single | container | — |
| Chrome | Left rail | `rail` | single | **collection** | per item permission |
| Chrome | Top bar | `navbar` | single | **collection** | — |

> † **Media Slider and Photo Gallery are specified here as new widget types.** They do not exist
> in the current prototype's palette. They are included because they were named in the brief and
> because they are the clearest expressions of the collection contract. Everything else in this
> table is already implemented and is documented as it behaves.

### 6.1 Palette states

| State | When | Presentation |
|---|---|---|
| Available | Placeable now | Draggable onto the page; clicking adds it to the current column |
| **Placed** | A `single` widget already on this page | Greyed, badge `Placed`, not draggable |
| **Locked — permission** | The permission it needs is off | Greyed, lock badge, names the exact setting, **and offers a link straight to that setting** |
| **Locked — module** | The module is not licensed | Greyed, lock badge, explains it is a licence not a switch — no link, because there is nothing the editor can toggle |
| **Locked — feature licence** | The feature licence is absent | Greyed, lock badge, says to talk to the account team |

A widget already on the page whose gate later closes is **never silently removed**. It stays,
flagged on the canvas and in its drawer as *hidden from requesters*, naming the cause — because
the fix is the cause, not the symptom.

---

## 7. Widget specifications

### 7.0 The list-card family (shared)

`my_requests` · `pending_approvals` · `my_assets` · `my_cis` · `announcements` · `most_read`

These six render the same shape — a card with a heading, an optional total count, N rows of live
records, and an optional "View all" link — so they share a **Styling** tab wholesale and differ
only in their **Content** tab.

**Shared Styling tab** — P1 Container · P2 Size & position · P3 Typography (`title`, `body`,
`meta`, `link`) · P4 List arrangement · P7 Interactive states · P8 Empty/loading. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Header | Show total count | Toggle | — | on |
| Header | Count style | Segmented | Badge · Plain text | Badge |
| Header | Show "View all" link | Toggle | — | on where the widget has a target page |
| Header | Link label | Text | — | `View all` |
| Rows | Show record ID | Toggle | — | on |
| Rows | ID placement | Segmented | Before title · Below title | Before title |
| Rows | Row layout | Segmented | Single line · Stacked | per widget |
| Status pill | Colour source | Segmented | Status colour · Neutral | Status colour |

---

#### 7.1 My Open Requests `my_requests`

The requester's own open tickets. Gated on the **Request module**, deliberately *not* on
"allow create incident" — a requester who cannot raise a ticket can still have tickets.

**Content tab**

| Group | Field | Control | Default | Range / options |
|---|---|---|---|---|
| Content | Title | Text | `My Open Requests` | — |
| Content | Statuses to include | Chips | Open, In Progress, Pending | Open · In Progress · Pending · Resolved · Closed |
| Content | Rows to show | Number | 5 | 1–10 |
| Content | Show status pill | Toggle | on | — |
| Content | Show created date | Toggle | on | — |

**Styling** — the shared list-card pack (§7.0). Row layout default: *Single line*.
**Empty state** — `No Data Found`.

---

#### 7.2 Pending Approvals `pending_approvals`

| Group | Field | Control | Default | Range |
|---|---|---|---|---|
| Content | Title | Text | `Pending Approvals` | — |
| Content | Rows to show | Number | 3 | 1–10 |
| Content | Show requester | Toggle | on | — |
| Content | Show raised date | Toggle | on | — |

**Styling** — shared list-card pack.

---

#### 7.3 My Assets `my_assets` · 7.4 My CIs `my_cis`

Identical shape, different source.

| Group | Field | Control | Default | Range |
|---|---|---|---|---|
| Content | Title | Text | `My Assets` / `My CIs` | — |
| Content | Rows to show | Number | 5 | 1–10 |
| Content | Show asset type / CI type | Toggle | on | — |

**Styling** — shared list-card pack.
**Note** — My CIs is commonly empty on real instances; its empty state is a first-class case, not
an afterthought. Do not invent placeholder rows in preview.

---

#### 7.5 Announcements `announcements`

| Group | Field | Control | Default | Range |
|---|---|---|---|---|
| Content | Title | Text | `Announcements` | — |
| Content | Rows to show | Number | 3 | 1–10 |
| Content | Show date | Toggle | on | — |

**Styling** — shared list-card pack. Row layout default: *Stacked*. No total count, no "View all".

---

#### 7.6 Most Read Knowledge `most_read`

| Group | Field | Control | Default | Range |
|---|---|---|---|---|
| Content | Title | Text | `Most Read` | — |
| Content | Articles to show | Number | 3 | 1–10 |
| Content | Show category | Toggle | on | — |
| Content | Show date | Toggle | on | — |

**Styling** — shared list-card pack. Row layout default: *Stacked*; category and date render as a
single `meta` line.

---

#### 7.7 Contact Us `contact_us`

| Group | Field | Control | Default |
|---|---|---|---|
| Content | Title | Text | `Contact Us` |
| Content | Show email | Toggle | on |
| Content | Show phone | Toggle | on |
| Content | Show hours | Toggle | on |

**The values themselves are not editable here.** Email and phone come from the portal's own
settings so every portal stays consistent. The drawer must say so in an info note **and link to
where they are edited**. Do not offer a local text field that silently diverges from the record.

**Styling** — P1 · P2 · P3 (`title`, `body`, `meta`) · P4 (list) · P6 (optional leading icon per
line) · P8.

---

#### 7.8 Featured Services `featured_services`

The requester's favourite catalogue items — a favourites list, not a browse-all grid.

| Group | Field | Control | Default | Range / options |
|---|---|---|---|---|
| Content | Title | Text | `Featured Services` | — |
| Content | Services to show | Number | 6 | 1–12 |
| Content | Columns | Segmented | 3 | 1 · 2 · 3 |
| Content | Show icon | Toggle | on | — |
| Content | Show description | Toggle | off | — |
| Content | "Browse catalog" link | Toggle + text | on, `Browse catalog` | — |

**Styling** — P1 · P2 · P3 (`title`, `body`, `meta`) · **P4 (grid)** · P6 (service icon) · P7 · P8.
Columns appears in both tabs by intent: it is a content decision at 1–3 and an arrangement
decision beyond that. Bind both to the same value; never let them disagree.

---

#### 7.9 Feedback `feedback` — **collection**

A rating, plus optional follow-up questions. A rating alone gives a score and never a reason;
follow-ups are what make it actionable, so they belong here — optional, and asked *after* the
rating, never instead of it.

**L3 — Widget Content tab**

| Group | Field | Control | Default | Options |
|---|---|---|---|---|
| Content | Title | Text | `How are we doing?` | — |
| Content | Prompt | Text | `Rate your last resolved request` | — |
| Content | Scale | Segmented | Stars | Stars · 1–5 |
| Content | Ask follow-up questions after the rating | Toggle | off | — |
| Questions *(when follow-ups on)* | **Item list** (§4.1) | — | 1 seeded question | max 5 |
| Behaviour *(when follow-ups on)* | Ask when | Select | After every rating | After every rating · Only when the rating is 3 or below |

> Helper on *Ask when*: asking only on low scores keeps the happy path to one click.

**L5 — Question item drawer, Content tab**

| Field | Control | Default | Options |
|---|---|---|---|
| Question | Text | — | placeholder: *What could we have done better?* |
| Answer type | Segmented | Free text | Free text · Choose one · Yes / No |
| Options | Chips (editable set) | — | only when *Choose one*; seeded Speed · Clarity · The fix itself · Communication |
| Required | Toggle | off | — |

**L5 — Question item Styling tab** — P3 (`body` for the question label) · P4 (gap between
questions) · inherit everything else.

**L3 — Widget Styling tab** — P1 · P2 · P3 (`title`, `subtitle`, `body`) · P4 · P7 · plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Rating | Mark size | Slider | 16–40 px | 20 |
| Rating | Mark colour — filled / empty | Colour ×2 | — | inherit |
| Rating | Alignment | Segmented | Left · Centre | Left |

**States** — the widget only appears to a requester who has a resolved request to rate; the drawer
says so. On the canvas it always renders its resting state, because that is what is being composed.

---

#### 7.10 Action cards `act_incident` · `act_service` · `act_ad` · `act_knowledge`

Four singletons, one shape: icon, title, subtitle, one destination.

| Group | Field | Control | Default (per type) |
|---|---|---|---|
| Content | Title | Text | `New Incident` / `Request Service` / `AD Self Service` / `Knowledge` |
| Content | Subtitle | Text | `Report an issue you are facing` / `Browse the service catalog` / `Reset your domain password` / `Search help articles` |
| Content | Icon | Icon picker | `incident` / `cart` / `key` / `book` |

The destination is fixed by the widget type and is **not** editable — that is what distinguishes an
action card from a Button. State this in a note rather than leaving the editor hunting for it.

**Styling** — P1 · P2 · P3 (`title`, `subtitle`) · **P6 Icon** · P7. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Layout | Icon position | Segmented | Left · Top | Left |
| Layout | Content alignment | Segmented | Left · Centre | Left |

---

#### 7.11 Button / Link `button`

Absorbs what would otherwise be three widgets — Button, Quick Link and Icon Action are *styles*
of one thing, not separate types.

**Content tab**

| Group | Field | Control | Default | Options / shown when |
|---|---|---|---|---|
| Content | Label | Text | `Contact the service desk` | When style = Icon, helper: *becomes the tooltip and the screen-reader name* |
| Content | Style | Segmented | Primary | Primary · Outline · Link · Icon |
| Content | Icon | Icon picker | none | — |
| Content | Opens | Select | External link | External link · A page in this portal · Download a file · Compose an email · Call a number |
| Content | URL | Text | `https://` | when *External link* |
| Content | Open in a new tab | Toggle | on | when *External link* |
| Content | Page | Select | My Requests | when *A page in this portal* — My Requests · Service Catalog · Knowledge · My Approvals · My Assets · Report an issue |
| Content | File | Upload | — | when *Download a file* |
| Content | Shown as | Text | — | when *Download a file*; blank falls back to the uploaded file name |
| Content | Send to | Text | — | when *Compose an email* |
| Content | Number | Text | — | when *Call a number* |

> The action list deliberately excludes "new incident form" and "service catalog" as button
> targets — those are the New Incident and Request Service action cards, and two ways to make the
> same link is one way too many.

**Styling** — P2 · P3 (`link`) · P6 · P7. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Button | Size | Segmented | Small · Medium · Large | Medium |
| Button | Full width | Toggle | — | off |
| Button | Corner radius | Slider | 0–24 px | inherit |
| Button | Fill / text / border colour | Colour ×3 | — | inherit from theme per style |

---

#### 7.12 Count tile `count_tile`

A number with a label. A count is a filtered list with the rows hidden, so it takes the same
status filter the list widgets take.

| Group | Field | Control | Default | Options |
|---|---|---|---|---|
| Content | Label | Text | `Open requests` | — |
| Content | Counts | Select | My requests | My requests · My changes · Approvals waiting on me · My assets · My CIs · Feedback you owe us |
| Content | Statuses to count | Chips | all | **only for sources that support a status filter** (My requests, My changes). Leaving all clear counts every one |
| Content | Icon | Icon picker | source default | — |

**Gating is per source, not per widget.** Each source carries its own permission and module. When
the selected source is gated off, the drawer warns naming *that* setting — with a link — and the
tile is flagged on the canvas. When the source has no status filter, replace the chips with an
info note explaining that the endpoint returns a single total. Never render an inert filter.

**Styling** — P1 · P2 · P3 (`title` for the number, `meta` for the label) · P6 · P7. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Tile | Layout | Segmented | Icon left · Icon top · No icon | Icon left |
| Tile | Number size | Slider | 100–300 % | 180 |
| Tile | Number / label colour | Colour ×2 | — | inherit |

---

#### 7.13 Text `text`

**All text editing happens in the drawer**, since the inline toolbar is out of scope.

| Group | Field | Control | Default |
|---|---|---|---|
| Content | Text | **Rich text** — bold, italic, underline, bulleted list, link, clear formatting | `Double-click to edit this text.` |

**Styling** — P2 · P3 (`body`) with the full role set. Plus:

| Group | Property | Control | Range | Default |
|---|---|---|---|---|
| Text | Typeface | Select | Inherit from theme + the theme's fonts | **Inherit** |
| Text | Size | Slider | 80–200 % | 100 |
| Text | Alignment | Segmented | Left · Centre · Right · Justify | Left |
| Text | Column count | Segmented | 1 · 2 | 1 |

> Typeface must default to Inherit and the helper must point at Theme as the place to set the
> portal-wide typeface. This field exists for the one line that has to differ.

---

#### 7.14 Image `image`

| Group | Field | Control | Default |
|---|---|---|---|
| Content | Image | Upload / drop | — |
| Content | Alt text | Text | — · helper: *read aloud by screen readers* |
| Content | Caption | Text | — |
| Content | Link | Text (URL) | — |
| Content | Open in a new tab | Toggle | on · when a link is set |

**Styling** — P2 · **P5 Media** · P3 (`meta` for the caption) · P7.
**Empty state** — a clear "no image chosen" placeholder on the canvas, never a broken image.

---

#### 7.15 Card `card` — **collection**

A container, not a fixed title/body pair. One card, four shapes; the template thumbnails replace
what would otherwise be an alignment control, because *where the image sits* is the real question
and it is recognised by looking rather than by reading a word.

**L3 — Content tab**

| Group | Field | Control | Default | Options / shown when |
|---|---|---|---|---|
| Card properties | Layout | Template picker (visual thumbnails) | Icon left | Icon left · Icon top · Icon right · Text only |
| Card properties | Image | Upload | — | hidden when layout = Text only |
| Card properties | Shape | Segmented | Circle | Circle · Square · **Banner** (Banner only offered when layout = Icon top) |
| Card properties | Card title | Text | `Custom card` | — |
| Card properties | Description | Text area | `Add card description` | — |
| Card properties | Link | Text (URL) | — | helper: *leave blank to make it read-only* |
| Card properties | Open in a new tab | Toggle | on | when a link is set |
| Extra content | **Item list** (§4.1) of child blocks | — | empty | Add: **Text** · **Image** · **Button** |

> Switching layout away from *Icon top* while shape is *Banner* silently strands a stretched bar
> beside the title — so the shape falls back to Circle and the drawer says it did.

**L5 — Child block drawer**
A child block is an ordinary widget. It opens the **same Content and Styling panels** as its
type does out on the page (§7.13 Text, §7.14 Image, §7.11 Button) — one way to edit a button,
whether it sits in a card or on the page. The only differences:

- The breadcrumb reads `… › Card · <card title> › Button`.
- **P2 Size & position is removed.** A child takes the card's width; its geometry is the card's
  job. Say this in a note rather than showing a width field that does nothing.
- Move and remove live in the card's item list **and** in the child drawer's overflow.

**L3 — Styling tab** — P1 Container (full, including background image + overlay) · P2 · P3
(`title`, `body`) · P4 (gap between child blocks) · P5 (the card image) · P7. Plus:

| Group | Property | Control | Range | Default |
|---|---|---|---|---|
| Card | Padding | Slider | 0–40 px | 16 |
| Card | Border | Segmented | Line · Shadow · None | Line |
| Card | Content alignment | Segmented | Left · Centre | Left |

---

#### 7.16 FAQ `faq` — **collection**

An accordion of **authored** Q&A. It is not fetched from anywhere — the platform has no FAQ
entity — so the drawer must never imply a data source. Anything needing review or versioning
belongs in a knowledge article instead, and the drawer should say so once, in a note.

**L3 — Content tab**

| Group | Field | Control | Default | Notes |
|---|---|---|---|---|
| Content | Title | Text | `Frequently asked questions` | — |
| Questions | **Item list** (§4.1) | — | 3 seeded real questions | Row shows index, the question text, and a preview of the answer |
| Behaviour | Show the first answer open | Toggle | on | — |
| Behaviour | Let more than one answer be open at once | Toggle | off | — |

> New questions must be seeded with realistic text, not `New question`. The list rows must show
> the actual question text — an editor scanning six rows of `Item 1…6` cannot find anything.

**L5 — Question item drawer, Content tab**

| Field | Control | Notes |
|---|---|---|
| Question | Text | placeholder: *What do people ask?* |
| Answer | **Rich text** | placeholder: *The answer, in plain language.* Links and lists matter here |
| Open by default | Toggle | Overrides the widget's *first answer open* for this item |

**L6 — Sub-elements: `Question` and `Answer`**
Each is separately selectable and opens its own drawer with the text on the Content tab and
P3 Typography on the Styling tab, inheriting from the item.

**L3 — Styling tab** — P1 · P2 · P3 (`title` for the widget heading, `subtitle` for questions,
`body` for answers) · P4 (gap, dividers) · P7. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Accordion | Item container | Segmented | Flat · Bordered · Card per item | Flat |
| Accordion | Divider between items | Toggle | — | on |
| Accordion | Chevron position | Segmented | Left · Right | Right |
| Accordion | Chevron rotates on open | Toggle | — | on |
| Accordion | Question padding | Slider | 8–24 px | 12 |
| Accordion | Answer indent | Slider | 0–32 px | 0 |
| Accordion | Open-item background | Colour | — | none |
| Accordion | Expand animation | Segmented | None · Fast · Normal | Normal |

**L5 — Item Styling tab** — question/answer typography, item background, item padding. Every
field starts **Inherited** from the accordion.

---

#### 7.17 Table (static) `table` — **collection**

Authored text in a grid. It binds to nothing, which is exactly when it is right: stable, short
content that is not already a record in the system — an escalation matrix, support hours by
region, severity definitions. Reach for a live widget when the data already exists as records,
and for a knowledge article past about ten rows.

**L3 — Content tab**

| Group | Field | Control | Default | Range |
|---|---|---|---|---|
| Content | Size | **Grid picker** with live `R × C` readout | 3 × 3 | up to **10 × 10** |
| Content | Title | Text | — | optional |
| Content | First row is a header | Toggle | on | — |
| Cells | **Editable grid** — every cell typed directly in the drawer | — | seeded example | — |
| Rows | **Item list** (§4.1) — one row per record, with drag / duplicate / delete | — | — | — |
| Columns | Column list — reorder, duplicate, delete, and set width | — | equal widths | width 5–80 % each |

> The 10 × 10 cap is not a technical limit. It is the point past which a static table wants
> search, sorting and paging — which means it wants to be a knowledge article. The picker stops
> there rather than letting someone build something that will not survive real content.
>
> Growing pads with blanks; shrinking truncates. Existing text keeps its cell, so resizing never
> scrambles what is already typed — and the size control must warn that shrinking discards cells
> outside the new shape.

**L5 — Row item drawer** — the row's cells as individual fields, plus a *header row* marker for
the first row and row-level style overrides.
**L6 — Cell** — the cell's text, its alignment, and its typography.

**L3 — Styling tab** — P1 · P2 · P3 (`title`, `body`, `meta`) · P7. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Table | Bordered | Toggle | — | on |
| Table | Striped rows | Toggle | — | off |
| Table | Header emphasis | Segmented | Bold · Filled · None | Bold |
| Table | Cell padding | Slider | 4–20 px | 8 |
| Table | Column widths | Per-column slider / number | 5–80 % each, normalised to 100 | equal |
| Table | Cell alignment per column | Segmented per column | Left · Centre · Right | Left |
| Table | Horizontal scroll on narrow screens | Toggle | — | on |

---

#### 7.18 Media Slider `media_slider` — **collection** † *(new)*

A rotating set of media panels, each with its own artwork, copy and call to action. The clearest
case of "one widget, many items, each item with its own sub-elements".

**L3 — Content tab**

| Group | Field | Control | Default | Range / options |
|---|---|---|---|---|
| Content | Title | Text | — | optional; hidden when blank |
| Slides | **Item list** (§4.1) — thumbnail, slide heading, media type | 1 empty slide | max 10 |
| Playback | Autoplay | Toggle | off | — |
| Playback | Interval | Number (s) | 5 | 2–20 · when autoplay on |
| Playback | Pause on hover | Toggle | on | when autoplay on |
| Playback | Loop | Toggle | on | — |
| Navigation | Show arrows | Toggle | on | — |
| Navigation | Show dots | Toggle | on | — |
| Navigation | Allow swipe / drag | Toggle | on | — |
| Navigation | Keyboard navigation | Toggle (locked on) | on | accessibility floor, not an option |

**L5 — Slide item drawer, Content tab**

| Group | Field | Control | Notes |
|---|---|---|---|
| Media | Media type | Segmented | Image · Video |
| Media | Source | Upload / URL | — |
| Media | Alt text | Text | required for images; the drawer warns when blank |
| Media | Poster image | Upload | video only |
| Text | Heading | Text | sub-element `Heading` |
| Text | Caption | Text area | sub-element `Caption` |
| Action | Call to action | Toggle | reveals the fields below |
| Action | CTA label | Text | — |
| Action | CTA opens | Select | same action set as §7.11 Button |
| Visibility | Hide this slide | Toggle | keeps it in the deck without publishing it |

**L6 — Slide sub-elements: `Media`, `Heading`, `Caption`, `CTA`** — each selectable, each with its
own Content and Styling, each inheriting from the slide.

**L3 — Styling tab** — P1 · P2 · **P5 Media** · P3 (`title`, `subtitle`, `body`) · P7. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Track | Slides per view | Number | 1–4 | 1 |
| Track | Gap between slides | Slider | 0–32 px | 0 |
| Track | Transition | Segmented | Slide · Fade | Slide |
| Track | Transition speed | Segmented | Fast · Normal · Slow | Normal |
| Slide | Height | Segmented + number | Auto · Fixed (px) · Aspect ratio | Aspect 16:9 |
| Slide | Content position | 9-point picker | — | Bottom-left |
| Slide | Content max width | Slider | 30–100 % | 60 |
| Slide | Text-over-media overlay | Slider | 0–80 % | 30 |
| Arrows | Placement | Segmented | Inside · Outside · Over media | Over media |
| Arrows | Size / colour | Slider + Colour | — | inherit |
| Dots | Placement | Segmented | Over media · Below | Over media |
| Dots | Style | Segmented | Dots · Bars · Numbers | Dots |

**Contrast guard** — when a slide places text over media, run the same contrast meter described
in §7.20 against the resolved backdrop (media average luminance blended with the overlay), and
offer the same one-click fix.

**L5 — Slide Styling tab** — per-slide overrides of content position, overlay, and the three
typography roles. All start **Inherited**.

---

#### 7.19 Photo Gallery `photo_gallery` — **collection** † *(new)*

A grid of images with optional captions and a lightbox. Same collection contract as the slider,
different arrangement.

**L3 — Content tab**

| Group | Field | Control | Default | Range / options |
|---|---|---|---|---|
| Content | Title | Text | — | optional |
| Photos | **Item list** (§4.1) — thumbnail, caption, filename | empty | max 24 |
| Photos | Bulk add | Multi-file upload | — | adds one item per file, appended in selection order |
| Behaviour | Open in lightbox on click | Toggle | on | — |
| Behaviour | Show captions in lightbox | Toggle | on | when lightbox on |
| Behaviour | Show more / paginate after | Number | 0 | 0 = show all · 1–24 |

**L5 — Photo item drawer, Content tab**

| Field | Control | Notes |
|---|---|---|
| Image | Upload | — |
| Alt text | Text | required; the drawer warns when blank |
| Caption | Text | sub-element `Caption` |
| Link | Text (URL) | overrides the lightbox for this photo |
| Hide this photo | Toggle | — |

**L3 — Styling tab** — P1 · P2 · **P4 Grid** · **P5 Media** · P3 (`title`, `meta`) · P7. Plus:

| Group | Property | Control | Options | Default |
|---|---|---|---|---|
| Grid | Layout | Segmented | Grid · Masonry · Justified rows | Grid |
| Grid | Columns | Number | 1–6 | 3 |
| Grid | Gap | Slider | 0–32 px | 8 |
| Tile | Aspect ratio | Segmented | Original · 1:1 · 4:3 · 16:9 | 1:1 |
| Tile | Fit | Segmented | Cover · Contain | Cover |
| Tile | Corner radius | Slider | 0–24 px | inherit |
| Caption | Position | Segmented | Below · Overlay · Hidden | Below |
| Caption | Alignment | Segmented | Left · Centre | Left |
| Hover | Effect | Segmented | None · Zoom · Dim · Reveal caption | Zoom |

**L5 — Photo Styling tab** — per-photo aspect ratio, focal point, and column span (1–3), all
starting **Inherited**.

---

#### 7.20 Banner `hero` — **collection**, and a section

The banner is a section like any other — it is selected, moved and given a background with the
same controls — but its contents are special, and **an editor edits its parts separately**. So the
banner is four selectable things, not one:

| Sub-element | Opens |
|---|---|
| **Banner** (the band itself) | Background, height, full-bleed, heading colour + contrast guard |
| **Heading** | The heading text + its typography + the contrast guard |
| **Sub-heading** | The sub-heading text + its typography |
| **Search bar** | Search preferences — placeholder, scope, suggestions, and whether it appears at all |

**L1/L3 — Banner Content tab**

| Group | Field | Control | Default |
|---|---|---|---|
| Content | Heading | Text | `Welcome to Support Portal` |
| Content | Sub-heading | Text | `Search our support center knowledge base` |
| Content | Show the search bar | Toggle | on |
| Content | Search placeholder | Text | `How can we help you?` · when search shown |
| Content | Stretch to the page edges (full bleed) | Toggle | off |

**L6 — Search bar drawer, Content tab**

| Field | Control | Default | Notes |
|---|---|---|---|
| Placeholder | Text | `How can we help you?` | — |
| Scope | Segmented | Knowledge | Knowledge · All |
| Show suggestions as they type | Toggle | on | — |
| Show the search bar | Toggle | on | — |

> **Scope must tell the truth.** Knowledge is what the search actually reaches today. Selecting
> *All* shows a warning saying the cross-entity endpoint does not exist yet — the option is there
> because that is where this is going, not because it works now. And when the knowledge permission
> is off, the drawer warns that search currently returns nothing, with a link to that setting.
> Neither hiding the option nor shipping a box that quietly searches less than it claims is
> acceptable.

**L1/L3 — Banner Styling tab** — **P1 Container** (background fill / colour / image / overlay,
with the section-or-page scope decision) · P3 (`title`, `subtitle`) · plus:

| Group | Property | Control | Range | Default |
|---|---|---|---|---|
| Banner | Height | Slider + number | 120–600 px | 260 |
| Banner | Full bleed | Toggle | — | off |
| Banner | Content alignment | 9-point picker | — | Centre |
| Banner | Content max width | Slider | 40–100 % | 70 |
| Heading | Colour | Colour | — | — |
| Heading | **Contrast** | **Meter** | — | see below |
| Search | Width | Slider | 40–100 % | 70 |
| Search | Corner radius | Slider | 0–24 px | inherit |

**The contrast guard is non-negotiable and is the single most important behaviour in this file.**

- It computes the **real** backdrop: the background artwork's average luminance blended with the
  overlay strength — and, when the background has been pushed to the page, the *page's*
  background, because that is what is genuinely behind the text.
- It shows a live ratio and a verdict, warning below **4.5:1**.
- It offers a one-click **Fix it** that picks a readable heading colour and, if that is still not
  enough, raises the overlay until it is.
- It is a **warning, not a block**. A stylised look can be worth the trade-off. But it must be
  impossible to walk past.
- Apply the same guard anywhere text sits over an image: slide text, card-over-image titles,
  section backgrounds with text.

**Banner omits Duplicate and Delete.** Nothing in the palette can put a banner back, so a one-way
door there would be a trap. Its overflow carries Move up / Move down / Reset to default only.

---

#### 7.21 Section `section` — container layer

| Group | Field | Control | Default | Range |
|---|---|---|---|---|
| Content | Name | Text | `New section` | Helper: *only you see this — it labels the section in the editor* |
| Layout | Columns | Segmented | 1 | 1 · 2 · 3 · 4 |
| Layout | Column widths | Per-column slider, normalised to 100 % | equal | 10–90 % each |
| Spacing | Space above | Slider | 28 px | 0–120 |
| Spacing | Space below | Slider | 28 px | 0–120 |
| Spacing | Gap between columns | Slider | 16 px | 0–48 |
| Spacing | Columns align | Segmented | Top | Top · Equal height |
| Background | **P1 Container** with **scope** | — | None | This section · **Whole page** |

**The "Whole page" scope is not a flag — it moves the background.** Choosing it puts the
background behind *every* section and stops this section painting its own, so an editor who wants
company artwork across the whole portal sets it once rather than on every band. Sections with
their own background paint over it. Flipping back brings it home and restores the page's own
colour — the choice is never one-way. The section must carry a visible `page background` marker
so it is obvious where that artwork is coming from.

**Column drawer (L2)** — width, and the alignment of the blocks inside it. Nothing else.

---

#### 7.22 Page `page` — root layer

| Group | Field | Control | Notes |
|---|---|---|---|
| Background | **P1 Container** | Fill / colour / image / overlay for the whole page |
| Typography | Typeface | Select | The portal-wide font. Every widget's typeface field inherits from here |
| Typography | Text size | Slider | 90–115 %; scales every size together. Beyond that range the layout breaks, which is why it stops there |
| Theme | Colour palette | Colour set × Light / Dark | Primary, secondary and neutral ramps, per mode |
| Theme | Preset | Preset picker | Replaces every colour; **keeps the chosen typeface**, so trying palettes never silently loses the font |

---

#### 7.23 Left rail `rail` — **collection** (chrome)

The portal's own navigation rail. Order and visibility are editable; the destinations are not.

**Content tab** — an **item list** (§4.1) where each row shows the destination's icon, its label,
and its route. Row actions: **reorder** (drag or arrows) and **hide**. There is no add and no
delete — the destinations are the product's.

**Gating** — a destination the requester is not permitted to reach never appears, whatever the
order. Its row shows the reason and links to the setting that governs it. Do not let an editor
"enable" something a permission forbids.

**Styling tab** — icon size, label visibility (icon only · icon + label), active-item treatment,
rail width, item spacing. All inherit from theme.

---

#### 7.24 Top bar `navbar` — **collection** (chrome)

**Content tab** — an **item list** (§4.1) of the bar's items, including the **logo**, which orders
alongside the actions rather than being pinned. Row actions: reorder, hide.

- **The logo cannot be hidden.** Its hide action is *disabled with a reason*, not absent — that
  says *deliberately not allowed* instead of leaving someone hunting for it.
- **Reordering is confined to the bar.** A bar item dragged onto the page or the rail finds no
  drop target and springs back. A drop line that appears where a thing cannot land is a lie.
- The bar keeps its logo-left / actions-right reading through a flexible gap that rides
  immediately behind the logo — move the logo and the gap moves with it. That is *why* there is no
  separate "logo position" control: dragging already says it.
- The logo image itself is uploaded under portal Appearance, not here. Link to it.

**Styling tab** — bar height, icon size, item spacing, background, and the divider under the bar.

---

## 8. Cross-cutting behaviours

### 8.1 Gating, in three kinds

Most widgets depend on something being switched on, and there are three different somethings.
The drawer must say **which**, because only one of them is the editor's to fix.

| Gate | Who can change it | Drawer treatment |
|---|---|---|
| **Permission** | The editor, right here | Warning + **link straight to that setting** |
| **Module licence** | The instance's licence | Warning, no link, says it is a licence |
| **Feature licence** | The account team | Warning, no link, says who to talk to |

Turning a permission off while widgets depend on it must warn which widgets are now hidden, and
offer **Undo**. Never silently strand a placed widget.

### 8.2 Inheritance

Applies to portal-level fields against organisation defaults, to per-portal permission groups
against the default portal, and to every style value against its parent layer.

- State is shown per field or per group as `Inherited` / `Overridden`.
- The parent value is always visible, even while overridden.
- **Revert to inherited** restores it in one click and never severs the link.
- A one-way override is a support-ticket generator. There are none in this system.

### 8.3 Draft, publish and undo

- Layout, appearance and chrome edits write to a **draft**. Requesters keep seeing the published
  version until Publish.
- Settings that are not part of the composed look save immediately and say so.
- **Publish exists only where there is a draft to publish.** A Publish button that sometimes
  publishes nothing teaches people to distrust it.
- Undo / Redo cover every drawer change, every reorder, every add and delete — one step per
  interaction. Delete raises an inline undo affordance as well.
- Leaving with an unpublished draft warns, and explains the draft is kept.

### 8.4 Validation and honesty rules

These are the rules that make the drawer trustworthy. Apply them everywhere.

1. **Never render an inert control.** If a filter cannot filter, replace it with a note explaining
   why — do not show it greyed and hope.
2. **Never show a field that duplicates a value owned elsewhere.** Show the value, say where it
   lives, and link there.
3. **Absent ≠ disabled.** Inapplicable fields are removed. Blocked-but-fixable fields are disabled
   with a reason and a route to the fix.
4. **Seed with real content.** New widgets and new items arrive with plausible copy so the thing
   reads as something on the day it is dropped.
5. **Warn on consequence, at the moment of the choice.** Shrinking a table, switching a card
   template, choosing an unsupported search scope, turning off a permission — each says what it
   will cost, before or as it happens.
6. **Every destructive action is undoable**, and says so.

### 8.5 Accessibility floor

Not editor-configurable, and shown as locked rows with a note rather than hidden:

- Focus rings on every interactive element.
- Keyboard reordering everywhere drag exists.
- Alt text prompted on every image; the drawer warns when it is blank rather than blocking.
- The 4.5:1 contrast guard on every text-over-background pairing.
- Accordion, slider and gallery all keyboard-operable and screen-reader labelled.
- Motion: autoplay and transitions respect a reduced-motion preference automatically.

---

## 9. Configuration schema

The shape each widget's config takes. `style` is present on every widget and every item, holds
only overridden values, and inherits everything else from its parent layer.

```jsonc
// Common envelope — every block, at every layer
{
  "id": "b12",
  "type": "faq",
  "w": 100,                    // width %, P2
  "h": null,                   // height px or null = auto, P2
  "align": "left",             // P2
  "hidden": false,
  "cfg":   { /* per-type content, below */ },
  "style": { /* only overridden values from the packs in §5 */ }
}
```

```jsonc
// Live-data list cards
my_requests       { title, count: 1-10, statuses: [], showStatus, showDate }
pending_approvals { title, count: 1-10, showRequester, showDate }
my_assets         { title, count: 1-10, showType }
my_cis            { title, count: 1-10, showType }
announcements     { title, count: 1-10, showDate }
most_read         { title, count: 1-10, showCategory, showDate }
contact_us        { title, showEmail, showPhone, showHours }
featured_services { title, count: 1-12, columns: 1|2|3, showIcon, showDesc }

// Collection: feedback
feedback {
  title, prompt,
  scale: "stars" | "number",
  askFollowUp: bool,
  askWhen: "always" | "low",
  questions: [
    { id, q, type: "text"|"choice"|"yesno", options: [], required: bool, style: {} }
  ]
}

// Actions
act_incident | act_service | act_ad | act_knowledge
  { title, sub, icon, iconSrc }

button {
  label, style: "primary"|"outline"|"link"|"icon",
  icon, iconSrc,
  action: "url"|"page"|"download"|"email"|"phone",
  url, newTab, page, fileSrc, fileName, email, phone
}

count_tile { label, source, statuses: [], icon, iconSrc }

// Content
text  { html, font: "inherit"|<fontKey>, size: 80-200 }
image { src, alt, caption, link, newTab }

// Collection: card
card {
  template: "left"|"top"|"right"|"none",
  image, imageShape: "circle"|"square"|"wide",
  title, body, link, newTab,
  bg: { fill: "none"|"color"|"image", color, image, overlay: 0-80 },
  border: "line"|"shadow"|"none",
  pad: 0-40,
  children: [ { id, type: "text"|"image"|"button", cfg: {...}, style: {} } ]
}

// Collection: faq
faq {
  title, openFirst: bool, allowMultiOpen: bool,
  items: [ { id, q, a, openByDefault: bool, style: {} } ]
}

// Collection: table
table {
  title, headerRow: bool, striped: bool, bordered: bool,
  widths: [ /* % per column, or null for equal */ ],
  aligns: [ /* per column */ ],
  rows: [ [ "cell", "cell" ] ]        // max 10 x 10
}

// Collection: media_slider  (new)
media_slider {
  title,
  autoplay: bool, interval: 2-20, pauseOnHover: bool, loop: bool,
  arrows: bool, dots: bool, swipe: bool,
  perView: 1-4, transition: "slide"|"fade", speed: "fast"|"normal"|"slow",
  slides: [ {
    id, hidden,
    media: { kind: "image"|"video", src, alt, poster, focal },
    heading, caption,
    cta: { enabled, label, action, url, page, newTab },
    style: {}
  } ]
}

// Collection: photo_gallery  (new)
photo_gallery {
  title,
  layout: "grid"|"masonry"|"justified",
  columns: 1-6, gap: 0-32, ratio, fit: "cover"|"contain",
  captionPos: "below"|"overlay"|"hidden",
  lightbox: bool, lightboxCaptions: bool, showMoreAfter: 0-24,
  photos: [ { id, hidden, src, alt, caption, link, span: 1-3, focal, style: {} } ]
}

// Structure
hero    { heading, sub, showSearch, searchPlaceholder, searchScope: "knowledge"|"all",
          searchSuggestions, headingColor, fullBleed, height: 120-600 }
section { name, cols: [ { id, w, blocks: [] } ], padTop: 0-120, padBottom: 0-120,
          gap: 0-48, valign: "top"|"stretch",
          background: { fill, color, image, overlay, scope: "section"|"page" } }
page    { pageBg: {...}, theme: { light: {...}, dark: {...}, fontFamily, fontCustom, fontScale } }

// Chrome
rail    { items: [ { id, label, glyph, route, perm, hidden } ] }
navbar  { items: [ { id, key, label, glyph, hidden, fixedVisible } ] }
```

---

## 10. Build order

Build in this order; each step is usable before the next exists.

1. **Drawer shell** (§2) — header, breadcrumb, tabs, groups, overflow, sticky footer, empty state.
2. **Control kit** (§3) — every role mapped onto an existing component.
3. **Style packs** (§5) — P1–P8 as composable, value-in/change-out components.
4. **Flat widgets** (§7.1–7.8, 7.10–7.14) — these are pure compositions of steps 2 and 3 and
   should need almost no new code each.
5. **Collection contract** (§4) — the item list, the item drawer, the sub-element drawer,
   inheritance and reordering.
6. **Collection widgets** (§7.9, 7.15–7.19) — FAQ first (simplest sub-elements), then Card, then
   Table, then Slider and Gallery.
7. **Structure and chrome** (§7.20–7.24) — Banner, Section, Page, rail, top bar.
8. **Cross-cutting** (§8) — gating, inheritance, draft/publish/undo, validation, accessibility.

If step 4 requires new components, step 2 or 3 was not finished. Go back rather than forking.
