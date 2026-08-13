# Duda — per-element design panel, content editing & selection quick-actions

Companion to [DUDA-ADD-AND-THEME-RESEARCH.md](DUDA-ADD-AND-THEME-RESEARCH.md). That file covers the
two *global* panels (Add, Theme). **This file covers what happens after you select something** — the
quick actions that appear on the element, and the panel that edits its styling and its content.

This is the material that fills our builder's `Select an element to start` empty state.

> ## Provenance
> **✅ CONFIRMED** — read directly off screenshots of the real Duda editor, in the reference Figma
> file `MMa6kIOd9EiVGRSzYuEn7J`, section **"Duda"** (`1:95`, images `1:96`–`1:105`).
>
> Those screenshots are of the **Beauty Salon** template — the same one later instantiated live as
> site `4fa39e6e` on a free-trial account, so everything here describes the same editor build that
> produced the Add and Theme data in the companion file.
> **📄 DOCS** — from Duda's public help centre; consistent with the screenshots but not seen.
> **🔶** — still inference.
>
> An earlier revision of this file guessed at §2 and §3. The screenshots corrected several things —
> most importantly the design panel's real accordion names, which are **not** what the docs imply.

---

## 1. Editor chrome (for context) ✅

**Left side panel** (icon over label, ~60px wide), top to bottom:
`Add · Pages · Layers · Theme · CMS · AEO/SEO · Bookings · More (⋯)`
— with an **AI button pinned at the bottom** of the rail as a small gradient circle.

> Note for us: Duda puts AI at the bottom of its **left** rail. Our rail is on the right, and we
> pinned AI to its bottom — same idea, mirrored side. Consistent.

**Top bar:** hamburger · duda logo · **page dropdown ("Home ▾")** · *[centre]* three device icons ·
*[right]* undo · redo · **✓ save indicator** · share · **Preview** · **Publish** (dark) · home icon.

This matches the top bar we already built almost exactly.

---

## 2. The selection model ✅

```
Section
└── Column
    └── Inner Column  ──or──  Advanced Grid
        └── Widget
```

Confirmed live: the design panel breadcrumb on a selected image read
**`Section > Column > Advanced Grid >`** with **Image** as the title — four levels deep.

**Two ways to reach a parent:**
1. The **blue selection chip** at the top-left of the selection reads `❯ Column` — the chevron
   expands it into the ancestor path.
2. The design panel's **breadcrumb** is clickable.

**Canvas affordances ✅**
- Selected element: **solid blue outline** + square resize handles.
- Sections and columns: **dashed grey outlines**, always visible.
- Each section carries a small blue **`Section`** chip at its top-left.
- **An empty column shows a grey `+` circle in its centre.** Small `+` circles also sit on a
  column's left/right edges for inserting a sibling.
- A section's bottom edge becomes a **thick blue drag bar** with a `⋮⋮⋮` grip for resizing, and the
  blue **`+ Add Section`** pill sits on the boundary between two sections.

---

## 3. Quick actions on selection

### 3.1 The floating menu — confirmed per element type ✅

A light/white pill toolbar that appears above the selection. **Its contents change by type:**

| Element | Toolbar contents, left → right |
| --- | --- |
| **Section** | `⋮` drag · **Design** · `↓` `↑` move down/up · `⧉` duplicate · `▣` clear all padding · `🗑` delete · `⋯` more |
| **Column** | `⋮` drag · **Design** · `←` `→` move left/right · `+` add · `⧉` duplicate · `▣` clear all padding · `⊨` align · `🗑` delete · `⋯` more |
| **Image widget** | `⋮` drag · **✦ AI** · **Manage Image** · **Edit Design** · `+` · `⧉` · `🗑` · `⋯` |
| **Text widget** | Replaced entirely by the **dark text toolbar** — see §3.3 |

Three things worth stealing:

1. **Move arrows are axis-aware** — a section gets `↓ ↑`, a column gets `← →`. The control matches
   the direction the thing can actually move.
2. **A widget's content button is named after the widget** — it says **"Manage Image"**, not
   "Edit Content". Paired with **"Edit Design"**, the content/design split is unmissable.
3. **Sections have no `+`** — you add to a section via `+ Add Section` on its boundary, not from
   its toolbar. Different scope, different affordance.

### 3.2 The `⋯` More Actions menu — confirmed verbatim ✅

Captured on a **Section**. Grouped by separators exactly as shown:

```
  +   Add                        ›
  ↺   Reset to Site Theme        ›
  ▤   Save as Section            ›
  ⧉   Copy
 ───────────────────────────────
 </>  Edit CSS
 </>  Add CSS Class Name
  ▤   Connect to Data
 ───────────────────────────────
  💬  Add Comment
  🔒  Lock Editing for Client
  🔗  Add Link
  ⚓  Set as Anchor
 ───────────────────────────────
  👁  Hide From                  ›
```

Note **"Reset to Site Theme"** sitting in the first group — the escape hatch from the per-property
override rule, one click from any element. And **"Lock Editing for Client"**, which is an agency
concern we have a direct analogue for: locking a portal block so a junior admin can't move it.

### 3.3 The text toolbar ✅

Selecting text swaps the light floating menu for a **dark (near-black) toolbar**:

`⋮⋮` · **✦ AI** · **B** · *I* · **U** · `⋯` · **A̲** text colour · **T̶ₓ** clear formatting ·
**`Heading 3*` ▾** · **font family ▾** (`Instrument…`) · **size ▾** (`64`) · ⤢ ·
🔗 link · align ▾ · numbered list · bullet list · list style ▾ · ¶ direction · 🔗 ·
↶ undo · ↷ redo · **✓ done**

⚠️ **The asterisk in `Heading 3*` is the override indicator** — it marks that this text has been
changed away from the Site Theme's H3. That one glyph is how Duda makes the per-property override
rule visible at the point of editing. **We should copy this.**

### 3.4 Inline canvas gestures 📄

- **Inline margins** — drag the element's edge, in the same direction as the column. Dragging
  **unlinks** the margins; editing in the panel keeps them linked.
- **Drag to rearrange** — a **blue box** previews the drop target.
- **Snap to Align / Snap to Grid** with rulers (Classic editor only).

---

## 4. The design panel — confirmed structure ✅

**Header:** panel-collapse icon (left) · `?` · `✕` (right) — this is the exact header our builder
already has.

**Below it:** the **breadcrumb** (`Section ❯ Column ❯ Advanced Grid ❯`), then the **element name**
as a large title (`Text Block`, `Column`, `Image`), then a small grey subtitle (`Frame`).

**Then collapsible accordions.** ⚠️ The real names are **not** what the docs suggest:

| Accordion | Notes |
| --- | --- |
| **Layout** | |
| **Style** | Holds background — there is no separate "Background" section |
| **Spacing** | |
| **Size** ⓘ | Carries an info icon |
| **Animations & Effects** | Carries a right-aligned icon + an **orange dot when something is set** |
| **Alignment** | Appears as its own accordion **for a Text Block**, but lives *inside* Layout for a Column |

**Which accordions appear depends on the element.** A Text Block showed `Style · Alignment ·
Spacing`; a Column showed `Layout · Style · Spacing · Size · Animations & Effects`.

### 4.1 Layout — on a Column ✅

- **Presets** — 2 icon buttons (vertical / horizontal)
- **Content alignment** — **two rows**:
  - row 1: 5 icons — horizontal distribution (left, centre, right, space-between, space-around)
  - row 2: 4 icons — vertical alignment (top, middle, bottom, stretch)

### 4.2 Style ✅

Tabs across the top — **`Color | Image | Video`** (a Text Block showed only `Color | Image`):

| Control | Detail |
| --- | --- |
| **Background color** ⓘ | Swatch; a slashed-circle swatch means *none* |
| **Change color on scroll** ⓘ | Toggle |
| **Corner radius** ⚙ | Slider + numeric field + **unit dropdown** (`px` / `%`) |
| **Border** ⚙ | Slider + numeric field (`0px`) + colour swatch |
| **Shadow** | Toggle |

Every setting that has more behind it carries a **⚙ gear** that opens the advanced form — a nice way
to keep the panel shallow without hiding capability.

**On an Image**, Style instead leads with three big icon toggles — **`Cover` | `Full image` |
`No repeat`** (selected one turns **orange**) — then:
- **Position** — a **3×3 dot grid** picker
- **Don't optimize image** ⓘ toggle
- **Border** ⚙ · **Corner radius** ⚙ · **Shadow** toggle
- **Hover effect for desktop** — a pill row (`None`, `Zoom out`, …)

### 4.3 Spacing ✅

Labelled **"Padding (inner spacing)"**, rendered as the familiar **nested box editor**: a value on
each of the four sides with a **link icon in the centre**, and the top value (`0px`) sitting above
the box. Horizontal sides showed **`0%`** and vertical **`0px`** — confirming the docs' default of
*horizontal in %, vertical in px*.

### 4.4 Size 📄 / Animations & Effects 📄

Not captured expanded. From the docs:
**Size** — height/width + min/max; a Section can only set height, a Column only width.
**Animations & Effects** — trigger (Hover / Scroll / Entrance) + animation, full catalog in §6.

---

## 5. Content editing ✅

Content opens as a **separate floating dialog**, not a panel section. Captured: **`IMAGE CONTENT`**.

- **Dark header bar** with the title centred, `?` and `✕` at the right
- **Draggable** (grab handle at the bottom edge), floats over the canvas
- Body is itself accordions — the captured one had **`Image`** and **`Alternate image on hover`**

Contents of the `Image` accordion, verbatim:

| Field | Control |
| --- | --- |
| *preview* | Thumbnail of the current image |
| *meta* | `Name: …-1920w.png` and `Size: 1858x2467` |
| **Replace** | Button, plus a swap icon and a pencil (edit) icon |
| **Link image** | Row with a `›` chevron |
| **Image alt text tag** ⓘ | With an **`All Alt Text ↗`** link out to a bulk editor |
| **Alt text** | Text input with an **orange AI generate button** inside it |
| **Tooltip** ⓘ | Text input |
| **Caption** | Text input |
| **Alternate image on hover** | Accordion containing a dashed dropzone |

Two patterns worth taking: **AI generation offered inline inside the field it fills**, and a
**link out to the bulk editor** for the same data across the whole site.

---

## 6. Animation catalog 📄

**Hover** (Editor 2.0): Grow · Shrink · Move top · Move bottom · Move right · Move left · Rotate · Opacity · Grayscale · Shadow
**Scroll**: Fade · Slide · Bounce · Roll · Rotate · Zoom · Flip — plus start/end scroll settings
**Entrance**: Fade in · Slide in · Bounce in · Rotate in · Roll in · Zoom in · Flip in · Flash · Pulse · Rubber band · Shake · Swing · Tada · Wobble

Desktop and tablet are **linked**; mobile is **separate**. A **Pause Animation** control freezes
them while editing.

---

## 7. Breakpoints and per-screen overrides 📄

| Breakpoint | Range |
| --- | --- |
| **Wide desktop** | 1400px+ *(flex-in-Classic only)* |
| **Desktop** | 1025–1399px — **default** |
| **Tablet** | 768–1024px |
| **Mobile landscape** | 468–767px *(flex-in-Classic only)* |
| **Mobile** | ≤767px |

**The inheritance rule:**
- **Design, layout and content** changes cascade to every breakpoint, whichever one you made them on.
- **Position and size** changes do **not** cascade.
- Overridable per breakpoint: **Alignment · Position · Size · Spacing**.
- ⚠️ **Once overridden, you cannot undo it from the main breakpoint.** The `Reset to Site Theme`
  action in the `⋯` menu is the way back.

**Hide From ›** (the `⋯` menu) hides per breakpoint; hiding a container hides everything inside it.

---

## 8. What the Squarespace reference adds

Same Figma file, the `Squarespace (Web)` frames. Two patterns beat Duda's:

### 8.1 "Add a Section" — a full-screen modal with live previews ✅

- `CLOSE` top-left, title **"Add a Section"**
- Left column: **`+ Add Blank`**, **`♡ Saved`**, then categories — **Introduce** (Intro, About,
  Contact, Team, FAQs), **Sell** (Products, Services, Group Events, Content & Memberships,
  Scheduling, Donations), **Showcase** (Images, Portfolio, Testimonials…)
- Right: a gallery of **real rendered previews in the site's own theme**, 2 across
- Top-right: a **density toggle** (three icons: dense grid / medium grid / single large)

Rendering previews **in the current theme** rather than as generic thumbnails is the detail that
makes this feel trustworthy. Our template gallery draws wireframes; this is the upgrade path.

### 8.2 "Site Styles" — every row previews what it controls ✅

Right panel titled **Site Styles**, `CLOSE` above it. Rows, each a card with a **live preview**:

| Row | Preview shown |
| --- | --- |
| **Themes** (selected) | `Aa` + a 5-swatch colour ramp + a `Button` chip |
| **Fonts** › | "**Heading**" in the heading face over "This is your paragraph." in the body face |
| **Colors** › | The 5-swatch ramp |
| **Buttons** › | A live `Button` chip |
| **Forms** › | A `Text` input + a check button |
| **Miscellaneous** › | — |

The **Themes** popover groups presets under **PROFESSIONAL / PLAYFUL / SOPHISTICATED**, each a wide
card rendering `Aa` + ramp + Button *on that theme's own background*.

**This is a better model for our Theme panel than Duda's.** A row that shows you the thing rather
than naming it removes a whole class of "what does this control?" guessing.

---

## 9. Mapping to our Support Portal builder 🔶

### 9.1 What our design panel should contain

| Duda accordion | Keep? | For our blocks |
| --- | --- | --- |
| **Layout** | **Yes** | Per-block presets (Quick actions: 3-up / 2-up / list), items per row, full width |
| **Style** | **Yes** | Color/Image tabs, background, corner radius, border, shadow — our tokens, not free values |
| **Spacing** | **Yes, simplified** | The nested box editor is good; bind it to our spacing scale rather than free px |
| **Size** | Partly | Min-height on the hero. Not per-widget width |
| **Alignment** | **Yes** | For free elements (hero heading, CTA row) |
| **Animations & Effects** | **No** for V1 | An ITSM portal does not need 31 animations |

### 9.2 Proposed quick actions per block 🔶

| Block | Floating toolbar |
| --- | --- |
| **Hero** | `⋮` · **Design** · `↓ ↑` · `⧉` · `🗑` · `⋯` |
| **Quick actions** | `⋮` · **Manage tiles** · **Edit Design** · `↓ ↑` · `⧉` · `🗑` · `⋯` |
| **Requests / Approvals / Knowledge** | `⋮` · **Manage list** · **Edit Design** · `↓ ↑` · `⧉` · `🗑` · `⋯` |
| **`⋯` on any block** | Add · **Reset to Site Theme** · Save as Section · Copy · Add Comment · **Lock Editing** · Set as Anchor · **Hide From** › |

### 9.3 The five details most worth copying

1. **The `*` override marker** on the style dropdown (`Heading 3*`). One glyph, and the theme
   relationship becomes legible at the point of editing.
2. **`Reset to Site Theme` one click away** in the `⋯` menu — the counterpart that makes #1 safe.
3. **The content button named after the widget** ("Manage Image" / "Manage tiles"), sitting beside
   "Edit Design". No user has to learn what "content" means in the abstract.
4. **The breadcrumb + expandable selection chip** — without it, a background behind a card is
   unreachable.
5. **Preview-in-the-row** (Squarespace Site Styles) — show the button, the type pairing, the ramp.

---

## Reference index

Figma file `MMa6kIOd9EiVGRSzYuEn7J`:

| Node | What it shows |
| --- | --- |
| `1:96` | Text Block selected — dark text toolbar, design panel (Style/Alignment/Spacing) |
| `1:97` | `+ Add Section` → **"What type of section?"** → Layouts / Designed / AI-Generated · design-panel empty state |
| `1:98` | **"Choose a layout for your section"** — 10-tile wireframe grid |
| `1:99` | Column selected — floating menu, Layout accordion expanded |
| `1:100` | Floating menu with **"Clear all padding"** tooltip |
| `1:101` | Section selected — floating menu with `↓ ↑`, section drag bar |
| `1:102` | **`⋯` More Actions menu**, full |
| `1:103` | Column with content — Style accordion (Color/Image/Video) |
| `1:104` | Image selected — **IMAGE CONTENT** dialog + image Style accordion |
| `1:105` | IMAGE CONTENT scrolled — Tooltip, Caption, Alternate image on hover |
| `1:8` | Squarespace **Add a Section** modal |
| `1:81` | Squarespace **Site Styles** + Themes popover |
| `1:69`–`1:78` | Squarespace "Updating style" (not yet reviewed) |
| `1:10`–`1:47` | Squarespace block-adding flows (not yet reviewed) |
