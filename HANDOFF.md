# Handoff — 2026-08-13 19:36

## Read first
CLAUDE.md `## Key context` → the **four Support Portal builder bullets** (they run consecutively,
starting at "Support Portal Customization (Admin › Organization)"). Read them in order: the module
and builder shell, then the Add panel + canvas selection, then the spacing matrix + added sections,
then placement + toolbar actions + the pickers. Also **`## Structure`** → the Support Portal
Customization line for the file map.

Two research/spec docs sit at the repo root and are the source for design decisions here:
- **[DUDA-ADD-AND-THEME-RESEARCH.md](DUDA-ADD-AND-THEME-RESEARCH.md)** — Duda's Add and Theme panels, read from a live editor.
- **[DUDA-ELEMENT-DESIGN-AND-QUICK-ACTIONS.md](DUDA-ELEMENT-DESIGN-AND-QUICK-ACTIONS.md)** — per-element design panel, selection quick-actions, breakpoints.
- **[PORTAL-ELEMENT-STYLING-SPEC.md](PORTAL-ELEMENT-STYLING-SPEC.md)** — all 41 elements × 12 reusable style blocks, plus a build order.

## What we worked on this session
Built **Support Portal Customization** end to end — a new admin module with a page listing, a
template gallery, and a full-screen page builder with canvas selection, an element library, and a
per-element content + style editor. Along the way, researched Duda's builder (created a trial
account and read the real editor) and wrote the element/styling spec that the next phase works from.

## Completed
**Admin module**
- `AdminSupportPortalModule` — empty state → standard admin listing (`SPP-#` pages, scope tabs,
  duplicate/delete with confirm). A page is created as a **Draft the moment a New-page route is
  chosen**, so leaving the builder is lossless; Publish is the only thing that goes live.
- `SupportPortalTemplateGallery` — 7 templates, wireframe thumbnails drawn from layout data,
  right rail listing exactly which blocks land.
- Reached from both the Organization **card** and the level-2 **nav row**, via `CARD_MODULES`.

**Builder shell** (`SupportPortalBuilder`)
- Full-screen; admin sidebar + product header stand down. Inline-editable title, save indicator,
  Preview (real, selection off), Publish.
- Resizable design panel clamped 400–600px; right rail **Add · Theme · Branding · Templates · AI**
  with AI pinned bottom in a gradient pill.

**Add panel** (`SupportPortalAddPanel`)
- 41 elements in 6 groups, Components first. Drag-scrollable group tabs with a scroll-spy.
- Added components show a green tick and are not draggable (one instance each).

**Canvas** (`PortalCanvas`, `SupportPortalPreview`, `portalPageModel`)
- Explicit selection model; blocks + key children; parent step-up via chip chevron and breadcrumb.
- Kind-aware floating toolbars — sections `↓↑`, cards/columns `←→`, text gets the dark rich-text bar.
- **Functional**: resize handles (min-height floor, sibling shares redistribute so a row always
  fills), spacing drag with magenta guides + live badge, seam drag to stretch the band above.
- Add Section seam → 10-layout picker (tiles drawn from the same data the section is built from).
- Columns: split left/right at equal width; drag-to-place from the Add panel; auto-section on seam drop.
- All toolbar actions real (move / delete / clear padding / align / `+`); duplicate correctly
  disabled on fixed blocks.

**Element editor** (`PortalElementPanel`)
- One scroll: CONTENT (per element) → STYLE (Layout / Style / Spacing).
- Content is **wired to the canvas** — My Requests' statuses/scope/show, hero text, nav links,
  action-card title/description/icon all render live.
- `SpacingMatrix` (nested margin/padding rings), `PortalColorPicker`, `PortalIconPicker`
  (43 ITSM icons + SVG upload), per-corner radius, border.

## In progress
Nothing half-written — but **the last four rounds of changes are unverified in the browser**. See
Gotchas. The files to re-check first are `SupportPortalPreview.tsx` (seam `slot()` ordering,
column adders) and `PortalCanvas.tsx` (toolbar action handlers).

## Next steps
1. **Verify in the browser** — drag-to-place, the toolbar actions, the action-card icon picker, and
   the Add Section seams under the lower bands. Three of the last four rounds surfaced bugs only
   visible on screen.
2. **Build the style blocks** in the order set out in PORTAL-ELEMENT-STYLING-SPEC.md §8:
   Box → Typography → Rows + Pills → States → Icon → Layout → Media.
3. **Restore deleted blocks** — a removed built-in band cannot be added back. Needs undo or a
   hidden-blocks list.
4. Confirm whether Components stay **single-instance** (the "Added" tick assumes they do).
5. Decide whether status-pill colours live in **Theme** rather than per element — five components
   render them and will otherwise disagree.

## Decisions made
- **Theme panel follows Squarespace "Site Styles"** (rows that preview what they control) rather
  than Duda's flat accordions. Confirmed later when the live Duda editor turned out to use the same
  pattern.
- **Rail keeps five items** (Add · Theme · Branding · Templates · AI) rather than mirroring Duda —
  Branding is already its own admin card, so a rail item keeps the builder consistent with the
  admin IA.
- **Statuses on My Requests is a display toggle, not a row filter** — otherwise "Show 5" and the
  status list fight over how many rows appear.
- **Size on the selection wrapper, as `minHeight` not `height`** — a dragged height is a floor, so
  resizing never clips content, and the outline always matches the painted box.
- **A row member takes a share, not a width** — every sibling carries one, so a row always adds up.
- **Duplicate disabled on fixed page blocks** rather than faking success — they have no instance
  identity to clone.
- **Elements land blank** (no data, no styling) but shaped like what they will become.

## Gotchas & notes
- ⚠️ **`npm run build` is NOT a typecheck.** TypeScript isn't installed; Vite/esbuild only. A
  removed variable still referenced in JSX passes the build and blanks the page at runtime. The
  browser is the only real gate.
- ⚠️ **The MCP automation Chrome has been stuck** in a relaunch loop for the last several rounds —
  it refuses connections and respawns when killed. Everything since the sibling-resize round is
  built and compiling but **not visually verified**. Clearing it: kill every `chrome.exe` whose
  command line contains `chrome-devtools-mcp`, then retry; sometimes it recovers on its own.
- ⚠️ **Popovers inside the design panel must be portalled.** It is `overflow-y-auto`, so an
  absolutely-positioned popover is clipped once it is taller than the space below its field. Both
  pickers use `createPortal` + fixed positioning.
- ⚠️ **Flex `order` needs every sibling to have one.** Bands take even slots, seams the odd slot
  after them. A seam without one collapses to 0 and the lower seams vanish.
- ⚠️ **`overflow-hidden` on a selection wrapper hides the chip and toolbar** — they sit at `-top-4`
  and `-top-11`, outside the box. This cost a round to find.
- Duda trial account exists (`zeni.chakalasiya@motadata.com`, site `4fa39e6e`, Beauty Salon
  template) — valid ~14 days from 12 Aug 2026 if more of the real editor needs checking. Google
  OAuth cannot be driven from an automated browser; the Duda password form can.
- `image.png`, `04-personas-jtbd.md` and `14-case-study.md` are untracked at the repo root and are
  not part of this feature.
