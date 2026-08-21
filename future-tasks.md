# Support Portal — parked features

Four features that are **built or part-built and deliberately switched off**, so the work is not
thrown away and nobody has to start from scratch when they come back.

Nothing here is a proposal. Every item names the files, the flag that hides it, the styling that is
already decided, and the specific reason it was parked — so the next session can pick one up and
finish it rather than re-deciding it.

**How each one is hidden, and why it matters:** a parked feature keeps its spec, its renderer and
its panel. That is what makes restoring it one flag rather than one rebuild, and it is why an
existing page that already carries the element keeps working instead of rendering a hole.

---

## 1 · AI — build and edit sections by describing them

**Status:** panel shell exists; the rail item is commented out.
**Hidden by:** one commented line in `SupportPortalBuilder.tsx`'s `RAIL` array (21 Aug 2026).

### What exists today

| Piece | Where | State |
|---|---|---|
| Rail item + gradient treatment | `SupportPortalBuilder.tsx` → `RAIL`, and the rail's `className` block keyed on `r.key === 'ai'` | commented out; **styling intact** |
| `RailKey` union member `'ai'` | `SupportPortalBuilder.tsx` | still there |
| Panel copy | `PANEL_COPY.ai` — *"Build with AI / Describe the portal you want — “a catalog-first page for HR” — and AI will lay the blocks out for you."* | still there |
| Empty state | `PanelEmptyState` renders it from `PANEL_COPY` | works |
| Icon | `AiSparkle.tsx` (gradient sparkle, already used across the ticket drawers) | shared |

**Restoring it is uncommenting one line.** The union, the copy and the rail's gradient are all still
in place precisely so that is true.

### Styling already decided — do not re-litigate

- **AI sits apart at the BOTTOM of the rail with `mt-auto` and a standing gradient tint**
  (`from-[#F5F3FF] to-[#FDF2F8]`, border `#EDE9FE`, text `#7C3AED`; active adds
  `shadow-[0_0_0_3px_rgba(124,58,237,0.10)]`). It is **not a fifth panel of the same kind** — it is
  the shortcut past all four, so it must read as its own thing rather than the last item of a list.
- Every rail panel is titled with the **name of its rail item** and carries **one line** under it.
  Do not let AI's panel drift into a different shape from Theme, Branding and Settings.

### What is still to build

1. **A panel that takes a prompt** and lays blocks out — the empty state describes this; nothing
   generates anything yet.
2. **⭐ Section-level AI (the real ask).** An **AI icon on a selected parent section**, which
   instructs AI to customise *that section only*. This is the part that matters: portal-wide
   generation is a demo, section-scoped editing is a tool. Whatever it produces must go through the
   same writers everything else uses:
   - structure → `addSection` / `applyPreset` / `addColumn` (`SupportPortalBuilder.tsx`)
   - content → `patchCfg(nodeId, …)` (the widget config store)
   - styling → `setStyle(nodeId, …)` (the style store)

   ⚠️ **AI must not get its own store.** Anything it writes has to land where the panel writes, or
   the canvas and the drawer start disagreeing about the same section — the single most common bug
   class in this builder, and the reason `fillCss`, `ownerOf` and the child-node model all exist.
3. **Undo has to cover it.** Undo is snapshot-based (`SupportPortalBuilder.tsx`) over eleven state
   atoms; an AI edit that writes through the normal setters is recorded for free. One that reaches
   past them is not.

### Where the icon would go

`PortalCanvas.tsx` → `ElementToolbar`. The section toolbar already carries `⠿ ← → + ⧉ [3 aligns] 🗑`
and each button is real. An AI button belongs at the end of that bar, and — per the standing rule in
this file's neighbours — must **do something on click**, not open a "coming soon".

---

## 2 · Media Slider — a carousel banner

**Status:** built, hidden.
**Hidden by:** `hidden: true` on `v-slider` in `supportPortalData.ts` (20 Aug 2026).

### Why it was parked

The conformance sweep (`audit/portal-conformance.js`, results in `audit/FINDINGS.md`) found
**22 of its 33 controls inert** — they stored a value and painted nothing. That is the worst state a
widget can be in: it looks configurable and is not, which teaches people to distrust every other
panel too. Hiding it was cheaper than shipping it broken.

### What exists

- Palette entry `v-slider` (group **Visual**, keywords `carousel gallery`), `hidden: true`.
- A collection spec in `portalCollectionSpecs.ts` — slides as `§4.1` items with the shared
  `PortalItemList` (drag handle, thumbnail, duplicate/delete/hide, keyboard reorder, undo toast).
- A renderer in `PortalCollectionRender.tsx`.
- Sub-elements per slide (heading, body) wrapped in `<Sel>`, so clicking a slide's heading selects
  **that heading** — the §4.3 rule.

### To finish

1. **Re-run the sweep against it.** `await __audit.run()` with the builder open, then
   `__audit.report()`. Fix by cause, not by control — the last pass found ~60 defects that were four
   shared causes.
2. **Decide what the banner carousel actually is.** Two different products:
   - the **hero** cycling through images (a Banner setting — it already has fit / focal point /
     overlay / the `PortalBannerPicker` gallery), or
   - a **slider widget** you drop into a section like any other.

   ⚠️ These are not the same feature. Doing both means two places to author a carousel, which is the
   "two controls for one value" trap this builder keeps re-learning.
3. Autoplay, interval, transition and dot/arrow styling are **not specified**. Ask before inventing
   them.

---

## 3 · Advanced Tabs — tabbed content on the portal

**Status:** part-built, hidden.
**Hidden by:** `hidden: true` on `l-tabs` in `supportPortalData.ts` (20 Aug 2026).

### Why it was parked

It shipped alongside an **Advanced Accordion** that was deleted outright: one widget with two
palette names, editing two different ways depending on which row you clicked. Tabs survived that
cleanup but was never finished.

### What exists

- Palette entry `l-tabs` (group **Basic**), `hidden: true`.
- It sat in the old **Layout** group, which was folded into **Basic** when only Divider and Tabs
  were left in it. Divider is now hidden too (21 Aug 2026), so **Tabs is the last thing that group
  was for** — check whether Basic still reads correctly when it comes back.

### To finish

1. **A collection spec**, exactly like Accordion's: tabs are items with a label and a body, so reuse
   `PortalItemList` and the `CollectionSpec` shape in `portalCollectionSpecs.ts`. Accordion is the
   template to copy — same two-field item, same inline editing, same sub-elements.
2. **Decide the reuse rule.** Accordion is `many` (a page can have several). Tabs almost certainly
   is too. ⚠️ Reuse comes from the **spec's `single`/`many`**, not from the palette group — the
   group rule once greyed FAQ out after one use.
3. **Tab strip styling** must match the product: `px-2 py-3`, `border-b-2`, inactive hover =
   light-grey fill + `border-[#CBD5E1]`, active = `#3D8BD0`, container `gap-2.5`. This is the
   product-wide tab treatment; the builder must not invent a second one.
4. ⚠️ **Do not wrap a `<tr>`-like structure in `<Sel>`.** `Sel` renders a `<div>` — the table widget
   was broken by exactly this. If a tab panel needs per-row selection, check the element it renders
   as first.

---

## 4 · Custom templates — edit a template and save it as your own

**Status:** entry point built; the save-back half is not.
**Hidden by:** nothing — the route is live, it just cannot produce a *user* template yet.

### What exists

- The **`New page ▾`** CTA on the Support Portal listing offers two routes:
  **Create Support Portal** (blank) and **Use Template**.
- `SupportPortalTemplateGallery.tsx` — category chips, search, wireframe thumbnails **drawn per
  `layout`** so a tile can never promise a shape you do not get, a right rail listing exactly the
  blocks that will land, double-click to use, and a *"start from a blank page instead"* footer link
  so the gallery is never a dead end.
- `PORTAL_TEMPLATES` in `supportPortalData.ts` — 7 templates, each with a `layout`
  (`classic | spotlight | catalog | knowledge | minimal | status`), an `accent` that tints its hero,
  and a category.
- A page created from a template records **"Started from &lt;template&gt;"** on the record
  (`PortalPage.source`) — though the listing no longer shows that column.

### To finish

1. **Save-as-template** from inside the builder: take the current page's `blockOrder`, `rowOrder`,
   `sections`, `widgetCfg`, `styles`, `icons`, `placedText`, `removed` and `rowExtras` (the same
   eleven atoms `Reset to default` clears and undo snapshots) and store them as a user template.
2. **Two kinds of template in one gallery.** Product templates cannot be edited or deleted; user
   ones can. ⚠️ They need to be visibly different in the gallery, or someone will try to delete a
   product one and be refused with no reason visible — the rule the default portal's disabled
   toggle and Delete already follow (disabled **with the reason on them**, never hidden).
3. **`layout` drives the thumbnail.** A user template has no hand-drawn wireframe, so either derive
   the tile from its real block list or render a live mini-preview. Do **not** fall back to a
   generic tile — the whole reason the gallery is trustworthy is that the tile is drawn from the
   same data the section is built from.
4. Naming, overwrite and duplicate-name behaviour are **not specified**. Ask.

---

## Rules that apply to all four

These are hard-won and cost real debugging time. They are not style preferences.

- **One value, one control.** The recurring fault in this builder is two controls writing the same
  thing, and whichever you are not looking at wins the last write. The canvas wins over the panel
  where both could exist.
- **Absent ≠ disabled.** A control that cannot apply is **removed**; a control that is *refused* is
  **disabled with the reason on it**. Never a greyed control with no explanation.
- **`npm run build` is esbuild only — it is NOT a typecheck.** A missing import, a ref used before
  its declaration or a removed variable still referenced in JSX all build green and blank the page.
  **Verify in the browser.**
- **Escape Tailwind bracket classes in raw CSS** — `.bg-\[\#F1F5F9\]`. Unescaped, the browser reads
  `[#F1F5F9]` as an attribute selector, calls the rule invalid and drops it **silently**. This took
  out most of the dark theme once already.
- **Widths, paddings and heights are OWN-only; spacing above and below inherits.** A width resolved
  through the chain hands itself to every text child — see `boxCss` in `portalStyleResolver.ts`.
- **The Bash tool strips backslashes inside heredocs.** Write scripts with the editor and run the
  file, or build backslashes from `String.fromCharCode(92)`.

## Where to read next

- `CLAUDE.md` — the Support Portal bullets under **Key context** carry the trap behind every
  decision above.
- `audit/FINDINGS.md` — the live defect list, including the Media Slider count.
- `LAYOUT-ALIGNMENT-SPEC.md` — the measured layout/alignment model.
- `WIDGET-CONTENT-AND-STYLING-SPEC.md` — the widget panel contract (§4 collections is what Tabs and
  the Slider both need).
