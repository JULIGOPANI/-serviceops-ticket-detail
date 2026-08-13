# Duda — Add panel & Theme panel research

Reference material for building the Support Portal Customization builder's **Add** and **Theme**
panels. Collected 12 Aug 2026.

> ## ⚠️ Provenance — read this first
>
> Mostly compiled from **Duda's public documentation** (support.duda.co + developer.duda.co). The
> live editor could not be reached — Google blocks OAuth from an automated browser — but a set of
> **real editor screenshots** later arrived in the reference Figma file `MMa6kIOd9EiVGRSzYuEn7J`
> (section **"Duda"**), which confirmed the chrome and the Add-Section flow. Those are marked
> **✅ SEEN**.
>
> **✅ LIVE** — read directly out of a running Duda editor. A free-trial account was created and the
> **Beauty Salon** template instantiated as site `4fa39e6e`; §1.2 and §2.0 come from there.
>
> ✅ = verbatim from Duda's docs · **✅ SEEN** = read off a real screenshot · 🔶 = my inference,
> confirm before treating as fact.
>
> Per-element design panel, quick actions and content editing live in the companion file:
> **[DUDA-ELEMENT-DESIGN-AND-QUICK-ACTIONS.md](DUDA-ELEMENT-DESIGN-AND-QUICK-ACTIONS.md)**.

---

## 0. Where these two panels sit

✅ Duda's editor side panel has these top-level items:

| Item | What it does |
| --- | --- |
| **Add** | Drag-and-drop **Widgets, Media and Site Text** onto the canvas |
| **Pages** | Add, view and manage pages and popups |
| **Layers** | Hierarchical tree of the page's elements |
| **Theme** | Default styles for all text, colors, buttons, images, backgrounds, rows, columns, layout, width and spacing |
| **CMS** | Collections and client-collected content |
| **SEO/AEO** | SEO settings |
| **More** | Blog, Store, Bookings, Personalization, App Store, Settings, Site Dashboard |

Top navigation bar (matches the builder top bar we already built): hamburger · page dropdown ·
**device/breakpoint icons** · undo · redo · **save-progress check mark** · site comments · Share ·
Preview · Publish/Republish · Home.

**✅ SEEN** — the real rail, top to bottom: `Add · Pages · Layers · Theme · CMS · AEO/SEO ·
Bookings · More (⋯)`, icon over label, ~60px wide, with an **AI button pinned at the bottom** as a
small gradient circle.

> ### ✅ DECIDED — our rail keeps its five items
> **Add · Theme · Branding · Templates · AI**, AI pinned bottom-right with its gradient tint.
> We deliberately do NOT mirror Duda here: Duda folds brand into Theme and pushes templates up to
> the dashboard, but in ServiceOps **Branding is already its own admin card** (Organization ›
> Branding), so surfacing it as its own rail item keeps the builder consistent with the admin IA
> the user already knows. Our AI-at-the-bottom placement matches Duda's, mirrored to the right side.

Structural model: **header, footer, sections (rows), columns, inner columns**. Every widget lands
inside a section. In flex/Editor 2.0 "rows" are called **sections**.

---

## 1. ADD panel

### 1.1 Panel structure ✅

`Add` opens with these sub-tabs:

- **Elements** — the widget library (search bar at the top, widgets grouped into categories)
- **Sections** — pre-built rows of widgets ("+ Add Section" between sections)
- **Media** — drag an image/icon/video onto the canvas and the matching widget is created for you
- **Custom** — a category *inside Elements* holding site widgets + reusable account widgets

### 1.2 Widget library — the real catalogue ✅ LIVE

Read straight out of the running editor (free-trial account, **Beauty Salon** template, site
`4fa39e6e`) by scrolling the Elements list and dumping it. **These are Duda's own category names
and their exact order** — an earlier revision of this file invented a grouping, and it was wrong.

The panel is two columns: a **category rail** on the left (Layout · Basic · Form · Visuals & Audio ·
Business · Social · Other · Custom, then **Media** and **Site Text** as separate groups) and the
**widget list** on the right, headed by a `Search for widgets` field and grouped under the same
category names in caps.

| Category | Widgets, in panel order |
| --- | --- |
| **LAYOUT** (4) | Advanced Tabs · Advanced Accordion · Advanced Grid · Inner Column |
| **BASIC** (15) | Text · Button · Divider · Spacer · Large Title · Small Title · File · List · Countdown · Table · Breadcrumbs · Accordion · Copyright · Tabs · Text & Image |
| **FORM** (13) | Advanced Form `BETA` · Short Text · Long Text · Number · Email · Phone no. · Multiple Choice · Single Choice · Dropdown · Date · Time · Opt-In · File Upload |
| **VISUALS & AUDIO** (9) | Media Slider · Image · Photo Gallery · Icon · Video · Shape · Before & After · Lottie Animation · Audio |
| **BUSINESS** (14) | Bookings · Click To Call · Map · OpenTable · Click to Email · Contact Form · PayPal · Restaurant Menu · Yelp Reviews · Business Hours · Multi Location · Coupon · Google Calendar · Yext |
| **SOCIAL** (7) | Share · Twitter Feed · Social Icons · RSS Feed · Disqus Comments · Facebook Feed · WhatsApp |
| **OTHER** (3) | HTML · Navigation Links · Hamburger Menu |
| **CUSTOM** | **Remix a ready-made widget**, then the account's own: Expanded Cards · Polaroid Images · Video Masonry Gallery · Italics Hover Text · *Show more* |

**65 stock widgets** across seven categories, plus Custom.

Three things worth noting for our build:

1. **Form fields are widgets.** Short Text, Email, Dropdown, Date, File Upload… are dragged onto the
   canvas individually, not configured inside a monolithic form widget. That is a real IA choice.
2. **`Large Title` and `Small Title` are separate widgets** from `Text` — the heading/body split is
   made at the point of adding, not afterwards in a dropdown.
3. **A row is icon-in-rounded-box + name**, full width, in a bordered card. Simple and scannable —
   no thumbnails at this level.

<details>
<summary>Superseded: the 51 widgets from the docs, grouped by me (kept for reference)</summary>

The help centre has 51 `Widgets: *` articles. The grouping below was **my** invention and does not
match the editor; the names are accurate but the categories are not.

**Basics**
| Widget | Notes |
| --- | --- |
| Text and Titles (Headings) | The core text widget; binds to theme PAR / H1–H6 |
| Button | Inherits theme Primary or Secondary button style |
| Image | |
| Icon | |
| Shape | |
| Spacer | |
| List | |
| Table | |
| Text & Image | Combined layout widget |
| HTML | Raw HTML embed |

**Media**
| Widget |
| --- |
| Video |
| Audio |
| Image Slider |
| Media Slider |
| Lottie Animation |
| Before & After |

**Layout / interaction**
| Widget |
| --- |
| Accordion |
| Advanced Accordion |
| Tabs |
| Advanced Tabs |
| Countdown |

**Contact & conversion**
| Widget |
| --- |
| Contact Forms |
| Advanced Forms |
| Click To Call |
| Click to Email |
| WhatsApp |
| Online Scheduling (vcita) |
| OpenTable (Reservation Button) |
| PayPal Button |
| Coupons |
| File (Download a File Button) |

**Business info**
| Widget |
| --- |
| Business Hours |
| Map |
| Multi Location |
| Restaurant Menu |
| Google Calendar |
| Zoom |

**Navigation**
| Widget |
| --- |
| Navigation Links |
| Hamburger Menu |
| Breadcrumbs |
| Link Picker |
| Copyright |

**Social & reviews**
| Widget |
| --- |
| Social Icons |
| Share (Social) |
| Facebook Feed |
| Facebook Like |
| Facebook Comments |
| Twitter Feed (X) |
| Disqus Comments |
| Yelp Reviews |
| RSS Feeds |

**Blog** (appear once Blog is installed)
| Widget |
| --- |
| Blog: All Posts (and Recent Posts) |
| Blog: Search Posts |

**Custom** ✅ — site widgets and reusable account widgets, including ones generated with AI from
inside the editor ("generate a site custom widget" lives in this panel).

</details>

### 1.3 How a widget gets added ✅

Three routes, all worth copying:

1. **From the library** — click and drag onto the canvas. A **blue placement indicator** shows
   where it will land, labelled `Insert here` / `Insert in new row` / `Insert in new column`.
   (Editor 2.0: widgets can only go into *existing* columns — no new ones are created by a drop.)
2. **From the canvas** — the floating menu's **+** icon, or right-click → *Add widget below*.
   The quick menu shows **the four most popular widgets** plus *More widgets*.
3. **From the Media panel** — dragging an image creates an image widget in one motion.

### 1.4 Media sub-panel ✅

- Search (query is retained until cleared)
- **Site Media** / **Stock Media** tabs
- Sort by date uploaded or alphabetical; filter by Media Manager folder
- **Upload Media** button + a ⋯ menu importing from an existing website, Dropbox, Facebook,
  Google Drive, or a client Content Collection form
- **Manage Media** icon opens the full Media Manager

### 1.5 Sections — the real add flow ✅ SEEN

The flow, captured end to end:

1. Hover the boundary between two sections → a blue **`+ Add Section`** pill appears on the seam
   (the section's bottom edge also becomes a thick blue drag bar with a `⋮⋮⋮` grip).
2. Click it → a white popover asks **"What type of section?"** with **three icon tiles**:

   | Tile | Icon | Leads to |
   | --- | --- | --- |
   | **Layouts** | rectangle | A blank structural layout |
   | **Designed** | ornament | Pre-designed, content-filled sections |
   | **AI-Generated** | sparkle | Generate one from a prompt |

3. Choosing **Layouts** → **`← Back`** + *"Choose a layout for your section"* and a **10-tile
   wireframe grid** (2 rows × 5): 1-column, 2-column, 2-row, 3-column, 3-row, then five asymmetric
   combinations.

> That three-way split — *structure / pre-designed / AI* — is a clean answer to a question our
> template gallery currently conflates. Worth mirroring in our **Add → Sections**.

### 1.5b Sections sub-panel, remaining detail ✅

- Pre-built rows of widgets, inserted via a **+ Add Section** button that appears *between* sections
- **Custom Sections** are user-saved: name + **category** + **visibility** (`Private` / `Staff` /
  `Public`), with a thumbnail
- A row/rows/full page can be saved as a section (*Select only this row* / *Select multiple rows* /
  *Select full page* — header and footer excluded)
- Categories are managed in a **Sections Library** (Dashboard → Custom Assets → Custom Sections →
  Manage Categories); each category toggles **Visible/Hidden**; ordering is **alphabetical and not
  customizable**

### 1.6 Per-widget design settings ✅ (this is what our design panel has to fill)

Every widget's design editor is built from the same set of drawers:

| Drawer | Controls |
| --- | --- |
| **Text Styles** | Overrides the theme text style for this widget |
| **Layout** | A "Select Layout" picker of preset arrangements, specific to the widget |
| **Style** | Color · Border (width slider + gear for more) · Background (image/color/video URL) · Width and Height · Rounded Corners · Shadows · Text (family, weight, …) |
| **Buttons** | Choose **Primary or Secondary** theme style, pick a button layout, override width/height/font/text size, inner + outer spacing, and **Reset to theme style** |
| **Spacing** | **Outer** and **Inner** spacing, four sides each, independently settable |
| **Animation** | Trigger + animation + per-animation options, and **Reset to Default** |

**Responsive text rule ✅ (worth stealing):** text set in Text editor, Contact form, Navigation,
Business, Click to Email, Click to Call and Button widgets auto-scales — **desktop 100% → tablet 85%
→ mobile 80%**, clamped to **min 16px** on tablet/mobile and **max 60px tablet / 40px mobile**.
Setting the size in Theme Text opts out of the scaling.

### 1.7 Animation catalog ✅ (verbatim — directly implementable)

**Hover trigger** (Editor 2.0 only): Grow · Shrink · Move top · Move bottom · Move right ·
Move left · Rotate · Opacity · Grayscale · Shadow

**Scroll trigger**: Fade · Slide · Bounce · Roll · Rotate · Zoom · Flip

**Entrance trigger**: Fade in · Slide in · Bounce in · Rotate in · Roll in · Zoom in · Flip in ·
Flash · Pulse · Rubber band · Shake · Swing · Tada · Wobble

Notes: scroll animations have **start/end scroll settings**; a **Pause Animation** control freezes
them while editing; desktop and tablet animations are **linked**, mobile is **separate**.

---

## 2.0 The real Theme panel ✅ LIVE — and it is already the preview-row model

Captured from the running editor. **Duda has moved to exactly the pattern we chose** (§2.9), so the
decision is now confirmed by both references rather than being a Squarespace import.

**Header:** `SITE THEME` · `?` · panel-dock icon · `✕`

**Onboarding card** (pink tint, dismissible): *"Welcome to Site Theme — Work faster and keep design
consistent everywhere. Any changes you make here will instantly update across your site."* +
`Learn more` + a **Close** link. Worth copying: it states the *consequence* of the panel ("instantly
update across your site"), which is the one thing a user needs to understand before touching it.

**Six sections, in this order.** Each is a row with a `›` chevron and a **live preview underneath**:

| # | Section | The preview shown in the panel |
| --- | --- | --- |
| 1 | **COLORS** | A row of **7 colour swatches + a `+` button** — the actual palette, not labels |
| 2 | **BUTTONS** | Live **Primary** (filled pill) and **Secondary** (text) buttons, rendered for real |
| 3 | **TEXT** | Eight rows, each rendered **in its own typeface at its own relative size** |
| 4 | **WIDTH & SPACING** | — |
| 5 | **IMAGES** | — |
| 6 | **BACKGROUNDS** | — |

**The TEXT rows, with this template's actual values:**

| Key | Value as shown |
| --- | --- |
| `DFLT` | Bricolage Grotesque, 20 |
| `PAR` | Bricolage Grotesque, 20 |
| `H1` | Instrument Serif, 140 |
| `H2` | Instrument Serif, 95 |
| `H3` | Instrument Serif, 64 |
| `H4` | Instrument Serif, 48 |
| `H5` | Instrument Serif, 32 |
| `H6` | Bricolage Grotesque, 16 — *rendered in caps, so all-caps is on for H6* |

Note the label format: **`<Font name>, <size>`** on one line, with the sample text set in that face.
You read the pairing and the scale at a glance without expanding anything. That is the single detail
that makes this panel work, and it is what we should reproduce.

⚠️ Note the H1→H6 ramp is **140/95/64/48/32/16** — enormous by ITSM standards. Our portal type scale
is nothing like this; copy the *panel*, not the values.

---

## 2. THEME panel — section detail 📄

✅ Opening Theme **auto-zooms the canvas to 50%** so the whole page is visible while theming
(restorable to 100% from the top-bar dropdown). Worth copying — it makes global edits legible.

✅ Precedence rule, stated explicitly in the docs and important to model:
**a per-widget edit overrides the theme, permanently, for that property only.** If you hand-set an
H1's *color*, later theme *color* changes skip it — but theme *font-size* changes still apply.

### 2.1 Text ✅

Text types (this is the exact list):

| Key | Meaning |
| --- | --- |
| **DFLT** | Every widget not assigned to a heading or paragraph style (e.g. navigation). Also holds **link** styling: **Default Link State**, **Link On-hover**, **Link Clicked**, plus link color and underline. |
| **PAR** | The text widget (paragraph) |
| **H1 … H6** | Headings and subheadings |

Per text type, these properties:

- Font
- Font size — **set separately for desktop/tablet and for mobile**
- **Scale text** (Editor 2.0) — scales with the parent container's width; inheritable, overridable per widget
- Font color
- Font format
- Text direction
- Font weight
- Line height
- Letter spacing
- All caps
- Text shadow

**Fonts library ✅**
- Built-in font list, previewed in the Font dropdown
- **Add & Manage Fonts** icon → two tabs:
  - **Google fonts** — pick from the Google list; added fonts show in an "Added Google Fonts" list with an X to remove
  - **Custom fonts** — **Upload fonts**, accepting **TTF, OTF, EOT, WOFF2, WOFF** (WOFF/WOFF2 recommended)
- Custom fonts are served from Duda's CDN, not the Google Fonts API, for GDPR
- Removing a font in use reverts that text to the default font; default fonts cannot be removed
- Removing a **Google** font needs a republish; removing an **uploaded** font does not

Text styles can also be edited from the canvas: click a text widget → heading dropdown →
**Update theme**.

### 2.2 Colors ✅

- **Up to 30 theme colors**
- Named slots documented in the developer docs: **Primary**, **Secondary**, **Main Background**,
  **Background 2**, **Background 3**. Values are stored as `rgba(11, 25, 86, 1)` / `rgb(0, 40, 0)`.
- Each color is set by **HEX or RGB entry** or an **eye-dropper**
- **Brand tab → + Add Logo** generates a palette from the uploaded logo (logo comes from Business
  Info in the Content Library; ⋯ menu offers Remove / Replace Image)
- **Set Theme Colors** auto-generator: scans the site, finds the most-used colors, then
  **Connect it for me** or **I'll connect it myself** → *Save & Connect Colors*
- Colors are **connected to widgets** — a widget's color picker lists theme colors at the top, and
  a pencil jumps to the theme editor. Connected widgets update automatically when the slot changes.
- Colors are **renameable** (hover → pencil; the name shows on hover in every color picker).
  Owners/editors only — clients can use but not rename.
- **Remove theme colors** (⋯ next to "Colors") → multi-select → *Remove Selected Colors*, which
  disconnects the widgets bound to them
- Permissions: owners edit; team/clients without Editor permission can **view and use** but not edit

### 2.3 Buttons ✅

Defines **Primary** and **Secondary** button styles site-wide:

- A choice of **button layouts**
- **Text**, **Background color**, **Border**, **Hover state**, **Corners**, **Shadow**
- Per-widget overrides show an **indicator box** on whichever of Primary/Secondary was customised;
  clicking the *other* (un-indicated) style resets the button back to the theme style
- A **Back to Top** button visibility toggle for mobile lives in Site Layout

### 2.4 Images ✅

Image-widget defaults: **image layout**, **border style**, **rounded corners**, **shadow effects**.

### 2.5 Backgrounds ✅

- **Default Background** — a **Color** tab and an **Image** tab (photo gallery or upload).
  Applies to desktop and tablet.
- **Background per page** — pick a page from a dropdown, then set its own image or color
- **Do not optimize this image** toggle, shown once an image is chosen

### 2.6 Width & Spacing (Editor 2.0) ✅

| Section | Controls |
| --- | --- |
| **Page Width** | **1200 px**, **1440 px**, or **Custom** — slider/field, **960–1920 px** or **50–100 vw**. Plus a **Full width** toggle making all new sections full-width by default. |
| **Section Spacing** | Default padding for new blank sections. Four-box padding editor; **horizontal values are linked** with an unlink icon; **set per breakpoint**; **Reset padding** zeroes it. Sections override it locally and can **Reset to theme spacing**. |
| **Column Spacing** | Same four-box editor; **vertical values linked**, unlinkable |
| **Inner Column Spacing** | Same as Column Spacing, for inner columns |

Caveat ✅: sections created before 5 Aug 2025 don't inherit Section Spacing until reconnected;
sections inside the **header** keep header spacing regardless.

### 2.7 Rows & Columns — Classic editor only ✅

Background color + default spacing defaults for rows and columns. Per-row/column edits override.

### 2.8 Site Layout — Classic editor only ✅

- Navigation layout for desktop / tablet / mobile; desktop width **960px or 1200px**
- **Sidebar layout** — header on the left or right, sticky, accepts rows and widgets, custom width.
  Switching to it **keeps the logo and removes all other header widgets**. No shrinking header.
  Below **1090px** the sidebar collapses to an expand-menu icon.

---

## 3. Mapping to our builder 🔶

A first read of how this lands in `SupportPortalBuilder.tsx`, for discussion — not built yet.

| Duda | Ours today | Planned |
| --- | --- | --- |
| Add → Elements | `Add` rail item, empty state | Searchable block library, categories as collapsible groups. Our "widgets" are ServiceOps portal blocks (Hero, Quick actions, My Open Requests, Approvals, Knowledge, Assets, CIs, Announcements, Text, Image, Spacer…) |
| Add → Sections | — | The three-way split from §1.5 — **Layouts / Designed / AI-Generated** — with previews rendered in the current theme (Squarespace's trick), not generic wireframes |
| Add → Media | — | Only worth it if the portal supports image uploads |
| Add → Custom | — | Skip for V1 |
| Theme (whole panel) | `Theme` rail item, empty state | **Squarespace Site Styles rows** (§2.9): Presets · Fonts · Colors · Buttons · Forms — each previewing itself, each drilling into the Duda-depth controls from §2.1–§2.8 |
| Theme → Text | — | Behind **Fonts**: DFLT / PAR / H1–H6, reduced to font, size, weight, color, line-height, letter-spacing (our design system fixes the rest) |
| Theme → Colors | — | Behind **Colors**: named slots mapped onto our tokens — `#3D8BD0` primary, `#364658` text, `#F7F9FC`/`#FFFFFF` backgrounds |
| Theme → Buttons | — | Behind **Buttons**: Primary/Secondary, defaulting to our 4px `rounded` standard |
| Theme → Backgrounds / Width & Spacing | — | Backgrounds and page width are the two worth keeping |
| Duda's per-widget design panel | Our design panel empty state | This is what fills "Select an element to start" — see the companion file |

**Two Duda behaviours worth adopting regardless of scope:**
1. The **50% canvas zoom** when the Theme panel opens.
2. The **override precedence rule** (per-property, not per-element) — it is the single thing that
   makes a theme panel trustworthy, and it has to be designed in from the start, not bolted on.

---

## 2.9 ✅ DECIDED — our Theme panel follows Squarespace "Site Styles", not Duda

Same reference Figma file, the `Squarespace (Web)` frames (`1:81`). **This is the model we are
building.** Every row previews the thing it controls instead of naming it, which removes the "what
does this setting actually change?" guessing that a flat list of labels creates — and it suits a
panel that is only 400–600px wide better than Duda's dense accordions do.

Everything documented in §2.1–§2.8 stays valid as *the content behind each row* — Squarespace's
structure, Duda's depth.

Right panel titled **Site Styles**, `CLOSE` above it. Every row is a card that **previews the thing
it controls**, with a `›` to drill in:

| Row | Preview shown in the row |
| --- | --- |
| **Themes** (selected) | `Aa` + a 5-swatch colour ramp + a `Button` chip |
| **Fonts** › | "**Heading**" in the heading face over "This is your paragraph." in the body face |
| **Colors** › | The 5-swatch ramp |
| **Buttons** › | A live `Button` chip |
| **Forms** › | A `Text` input + a check button |
| **Miscellaneous** › | — |

The **Themes** popover groups presets under **PROFESSIONAL / PLAYFUL / SOPHISTICATED**; each preset
is a wide card rendering `Aa` + ramp + Button **on that theme's own background**, so you judge it as
a whole rather than as a list of values.

Squarespace's **Add a Section** modal is likewise stronger than a wireframe grid: a left column of
categories (**Introduce** — Intro/About/Contact/Team/FAQs, **Sell**, **Showcase**) plus `+ Add
Blank` and `♡ Saved`, and a right-hand gallery of **previews rendered in the site's own theme**,
with a density toggle. See §8 of the companion file.

---

## Gaps — status

**All four earlier gaps are now closed.** A free-trial account
(`zeni.chakalasiya@motadata.com`) was created, the **Beauty Salon** template instantiated as site
`4fa39e6e`, and both panels read directly out of the running editor:

| Was open | Now |
| --- | --- |
| Real category names in Add → Elements | ✅ §1.2 — 8 categories, 65 stock widgets, in panel order |
| Which widgets this template exposes | ✅ §1.2 — this is that template's actual list (Bookings present, Store/Blog absent) |
| Theme panel's real sections | ✅ §2.0 — six sections, in order, with their previews |
| Default theme values | ✅ §2.0 — fonts and sizes for all 8 text styles |

**Remaining, minor:**
1. The **expanded state** of each Theme section (what's inside `COLORS ›`, `WIDTH & SPACING ›`).
   §2.1–§2.8 cover these from the docs; only the visual layout is unseen.
2. **Media** and **Site Text** sub-panels of Add — listed in the rail but not opened.
3. `Yext`, `Bookings` and `Advanced Form (BETA)` are plan/app-dependent and may not appear on every
   account.

The live site remains available at `my.duda.co/home/site/4fa39e6e` for the rest of the trial
(14 days from 12 Aug 2026) if anything else needs checking.

---

## Sources

- [Editor Overview](https://support.duda.co/hc/en-us/articles/26519221644439-Editor-Overview)
- [Widgets: Library and Overview](https://support.duda.co/hc/en-us/articles/26519267254423-Widgets-Library-and-Overview)
- [Site Theme](https://support.duda.co/hc/en-us/articles/26519231815063-Site-Theme)
- [Custom Sections](https://support.duda.co/hc/en-us/articles/26519392733847-Custom-Sections)
- [Media Panel](https://support.duda.co/hc/en-us/articles/31721394896791-Media-Panel)
- [Site Themes — developer docs](https://developer.duda.co/docs/site-themes)
- [Theme Colors in Widgets](https://developer.duda.co/docs/widgets-global-colors)
- Widget list enumerated from the Duda help-center article index (51 `Widgets: *` articles)
