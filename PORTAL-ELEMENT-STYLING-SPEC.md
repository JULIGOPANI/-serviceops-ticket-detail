# Support Portal builder — element & styling spec

Every element in **Add → Elements** (41 across 6 groups), what it renders, what its **Content**
section edits, and which **Style** blocks it gets.

> Spec only — nothing here is built yet, and no existing design is changed by this document.
> Source of truth for the catalogue: `PORTAL_ELEMENTS` in `supportPortalData.ts`.

---

## 1. Style blocks

Rather than inventing controls per element, twelve reusable blocks. An element's styling is the
**set of blocks it gets** — which is what keeps forty elements from becoming forty bespoke panels.

| # | Block | Controls |
| --- | --- | --- |
| **A** | **Box** | Background (colour · image · gradient) · Border (width, style, colour) · Corner radius (all / per corner) · Shadow |
| **B** | **Spacing** | Margin + Padding matrix (vertical px, horizontal %) — *built* |
| **C** | **Size** | Width (share of row, or px) · Min height · Align in row — *built* |
| **D** | **Typography** | Theme style (DFLT/PAR/H1–H6) · Font · Size · Weight · Colour · Line height · Letter spacing · Align · Uppercase |
| **E** | **Icon** | Glyph picker · Size · Colour · Badge (none / tinted / filled / outlined) · Badge radius |
| **F** | **Layout** | Direction · Columns or items per row · Gap · Wrap · Content alignment |
| **G** | **States** | Hover · Active · Focus · Disabled — each: background, border, text, shadow, transform |
| **H** | **Rows** | Row density · Divider (on/off, colour) · Zebra · Row hover · Row radius · Empty-state text |
| **I** | **Media** | Fit (cover/contain/fill) · Position (9-point) · Aspect ratio · Overlay colour + opacity · Filter |
| **J** | **Pills** | Radius · Style (tinted / solid / outline) · Size · Per-status colour map |
| **K** | **Rule** | Orientation · Thickness · Style (solid/dashed/dotted) · Length · Colour |
| **L** | **Field** | Height · Radius · Border · Fill · Placeholder colour · Icon side · Focus ring |

Every element additionally gets **B (Spacing)** and **C (Size)** — they are the two things any block
on a canvas must be able to do, so they are assumed below rather than repeated.

---

## 2. Components (11)

The ServiceOps blocks a portal is actually made of. All are **data-backed**, so their Content is a
query plus display options, and their Style is mostly the card shell + the rows inside it.

| Element | Renders | Content controls | Style blocks |
| --- | --- | --- | --- |
| **Search** | Hero search field | Placeholder · Scope (KB / catalog / both) · Submit behaviour · Show icon | **A · D · L · G** |
| **Services** | Catalog tiles | Source (category / featured / manual) · Count · Show description · Show icon · CTA label | **A · D · E · F · G · J** |
| **Categories** | Category grid | Categories (all / picked) · Count · Show counts · Sort | **A · D · E · F · G** |
| **My Requests** | Request list card | Statuses shown · Scope · Show N · Columns (id/subject/date/status) · Title · Empty text · "View all" link | **A · D · H · J** |
| **Approvals** | Approval list card | Show N · Show actions (approve/reject/refer) · Title · Empty text | **A · D · H · J** |
| **My Assets** | Asset list card | Asset types · Show N · Columns · Title · Empty text | **A · D · H · J** |
| **My Tasks** | Task list card | Statuses · Scope · Show N · Title · Empty text | **A · D · H · J** |
| **Announcements** | Announcement banner/list | Source · Show N · Layout (banner / list / carousel) · Dismissible · Severity filter | **A · D · F · H · J** |
| **Knowledge** | Article list card | Collection · Sort (most read / recent) · Show N · Show tags · Title | **A · D · E · H · J** |
| **FAQ** | Q&A accordion | Source · Show N · Expand first · Allow multi-open | **A · D · H · G** |
| **Contact / Escalation** | Contact block | Channels (phone/email/chat) · Hours · Escalation link · Layout | **A · D · E · F · G** |

**Shared family:** *My Requests · Approvals · My Assets · My Tasks · Knowledge* are one component
with different data — build the **card shell + H + J** once and vary the query.

---

## 3. Layout (3)

| Element | Renders | Content controls | Style blocks |
| --- | --- | --- | --- |
| **Advanced Tabs** | Tabbed container | Tabs (add/rename/reorder/delete) · Default tab · Icons on/off | **A · D · F · G** + tab-strip style (underline / pill / enclosed), active colour, tab align |
| **Advanced Accordion** | Collapsible container | Panels (add/rename/reorder) · Default open · Allow multi-open · Chevron side | **A · D · G** + header style, divider, icon rotation |
| **Divider** | Horizontal / vertical rule | Orientation · Label (optional, centred) | **K** (+ **D** when labelled) |

---

## 4. Basic (12)

| Element | Renders | Content controls | Style blocks |
| --- | --- | --- | --- |
| **Text** | Paragraph | Rich text · Link | **D** |
| **Button** | CTA | Label · Link · Variant (primary/secondary/ghost) · Icon + side · Full width | **A · D · E · G** |
| **Spacer** | Vertical gap | Height | *size only* |
| **Large Title** | H1–H2 | Text · Level | **D** |
| **Small Title** | H3–H6 | Text · Level | **D** |
| **File Download** | Download CTA | File · Label · Show size/type · Icon | **A · D · E · G** |
| **List** | Bulleted / numbered list | Items · Type (bullet/number/check/icon) · Marker icon | **D · E** + marker colour, indent, item gap |
| **Countdown** | Timer | Target date/time · Units shown · Expiry behaviour · Labels | **A · D** + digit style, separator, unit-label style |
| **Table** | Data grid | Columns (add/rename/reorder/width/align) · Rows (manual or bound to a record set) · Header on/off · Sortable columns · Rows per page · Empty text | **A · D · H · J** + header style (fill, weight, caps), grid lines (none / rows / rows + columns), cell density, column align, first-column emphasis |
| **Accordion** | Simple collapsible | Items · Default open · Multi-open | **A · D · G** |
| **Text with Image** | Split media + copy | Text · Image · Side (left/right) · Ratio · Vertical align | **A · D · I · F** |
| **Card** | Generic container | Title · Body · Link · Media on/off | **A · D · F · G** |

---

## 5. Visual (5)

| Element | Renders | Content controls | Style blocks |
| --- | --- | --- | --- |
| **Image** | Single image | Source · Alt · Tooltip · Caption · Link · Hover image | **A · I · G** |
| **Media Slider** | Carousel | Slides · Autoplay + interval · Transition · Arrows · Dots · Loop | **A · I · G · F** + control colour/position |
| **Photo Gallery** | Image grid | Images · Columns · Gap · Lightbox on/off · Captions | **A · I · F** |
| **Icon** | Single glyph | Glyph · Link · Label + position | **E · G** |
| **Shape** | Decorative shape | Type (rect/circle/blob/line) · Rotation | **A** + fill, stroke, opacity |

---

## 6. Business (5)

| Element | Renders | Content controls | Style blocks |
| --- | --- | --- | --- |
| **Click to Call** | Phone CTA | Number · Label · Icon · Show number inline | **A · D · E · G** |
| **Click to Mail** | Email CTA | Address · Subject prefill · Label · Icon | **A · D · E · G** |
| **Contact Form** | Form | Fields (add/reorder/required) · Submit label · Success message · Recipient | **A · D · L · G** + field gap, label position, error style |
| **Share** | Social share row | Networks · Layout (row/grid) · Show labels | **E · F · G** |
| **Navigation Links** | Link row | Links (add/reorder/rename) · Target · Active-state source | **D · F · G** + separator, active indicator |

---

## 7. Custom (5)

ServiceOps-specific compositions — the ones with no Duda equivalent.

| Element | Renders | Content controls | Style blocks |
| --- | --- | --- | --- |
| **Action Card** | Large quick-action tile | Title · Description · Icon · Link · Badge | **A · D · E · G** |
| **Action Icon** | Compact icon shortcut | Icon · Label · Link | **E · D · G** |
| **KPI** | Metric tile | Metric source · Label · Format · Trend on/off · Comparison period · Threshold colours | **A · D · E** + value type scale, trend colours |
| **Search** *(custom)* | Inline search | Placeholder · Scope · Results target | **A · D · L · G** |
| **Predefined Cards** | Preset card set | Preset · Which cards · Order | inherits the preset's blocks |

---

## 8. What this implies for the panel

**Three things worth deciding before building:**

1. **Style sections should be assembled from the blocks, not hand-written per element.** A panel
   built as `blocksFor(node).map(renderBlock)` is one place to fix a control; forty bespoke panels
   are forty places. The current panel already hints at this (Layout / Style / Spacing drawers) —
   the blocks table is what fills them.

2. **States (G) is the biggest gap.** Nothing in the builder currently edits hover or active, yet
   almost every interactive element above needs it. It wants its own drawer with a state switcher
   at the top, so you style *the hover* rather than hunting for hover fields.

3. **Pills (J) should be theme-level, not per-element.** Five components render status pills. If
   each one styles its own, two lists on the same page will disagree about what "Open" looks like.
   This belongs in Theme, with a per-element override.

**Build order suggestion** — highest leverage first:

| Order | Work | Covers |
| --- | --- | --- |
| 1 | **A (Box)** — finish background image/gradient + shadow | 30 of 40 elements |
| 2 | **D (Typography)** — full set, bound to theme styles | 25 |
| 3 | **H + J (Rows + Pills)** | the 5 data components **+ Table**, the highest-traffic blocks |
| 4 | **G (States)** | every interactive element |
| 5 | **E (Icon)** | 12 |
| 6 | **F (Layout)** | containers |
| 7 | **I (Media)** | 4 |
| 8 | **K, L** | Divider, fields |

---

## 9. Open questions

1. **Do Components stay single-instance?** Today a system component can only be added once (the
   Add panel greys it). If two "My Requests" blocks with different status filters are wanted, that
   rule and the "Added" tick both have to change.
2. **Where do per-status colours live** — Theme, or per element? §8.3 argues Theme.
3. **Does Spacer need Style at all**, or is height its whole definition? Currently listed as
   size-only.
4. **Predefined Cards** is a preset rather than an element — should it live in Add at all, or in
   the Sections picker where the other presets are?
