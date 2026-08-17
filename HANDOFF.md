# Handoff — 2026-08-17 16:30

## Read first
`CLAUDE.md` → the **Support Portal Customization** bullets under *Key context*, especially the
two new ones at the end of that run:

- *"Support Portal — the palette, and the widgets that own a real panel"* — what the element
  library looks like now and which widgets got a real settings panel this session.
- *"Support Portal — selection-model and layout bugs fixed"* — **read this before touching
  `Sel`, `PortalItemList` or the table renderer.** Three of the bugs fixed this session were
  caused by assumptions those files quietly made.

Everything else in `CLAUDE.md` is unchanged.

## What we worked on this session
Content and styling panels for the Support Portal page builder — giving List, Accordion, Table,
Text with Image, Button and Card real, spec-driven settings panels — plus consolidating the
element palette and fixing several bugs the new panels exposed.

## Completed

**Palette**
- Groups are now **Live data · Actions · Basic · Visual · Business · Custom**. *Components* split
  into Live data (backend-fed) and Actions (fixed destinations); **Layout** folded into Basic once
  it held only Divider + Advanced Tabs.
- **Advanced Accordion deleted** — it was a second palette name for the same widget.
- **FAQ** shown as already placed; **My CIs** and the four action cards added as real entries.
- **AD Self Service** adds a genuine 4th action card (and widens the row to 4 columns).

**Widget panels** (all data-driven, in `portalCollectionSpecs.ts` + `PortalCollectionRender.tsx`)
- **List** — items with title + description; Item Style set once on the widget; Divider group.
- **Accordion** — its own spec (no longer a FAQ alias): Display rules, Collapsed Style,
  Expansion icon, Expanded Style.
- **Table** — Header · Rows · Table · Frame. Columns editor, Style pack and Even-column-width
  toggle removed; columns are always an equal share.
- **Text with Image** — image position, upload, alt text, rich paragraph; Image style + Text style.
  The image floats so text genuinely wraps.
- **Button** — DESIGN is two tabs, *Button style* and *Button text*.
- **Card** — Layout + Shape moved to DESIGN; padding/border/radius read from the shared pack;
  Media section removed.
- **Spacer** and **Divider** rebuilt to the reference (Divider gets a 6-shape layout picker).

**Bugs fixed**
- Hiding one list item hid **every** item — `PortalItemList` matched by `item.id`, which is
  `undefined` on seeded items. Everything is index-keyed now.
- Table columns never lined up — each `<tr>` was wrapped in a `<div>` by `Sel`, which breaks the
  table box model entirely.
- Card templates, section Height and Content alignment were inert — the controls wrote config
  nothing read.
- Column `+` adders vanished when a child element was selected.

**Panel chrome**
- Right drawer opens at **340px**; alignment rows use the recessed-track component; toggle spacing
  standardised; per-field Reset and the "Overridden" badge removed; breadcrumb replaced by a back
  arrow on the title row; product header kept visible above the builder.

## In progress
Nothing mid-flight — the build is clean and every change above was verified in the browser except
where noted under *Gotchas*.

## Next steps
1. **CSV upload popup for Table** — the spreadsheet-style dialog with *Upload CSV* / *Clear All*
   from the reference. The spec fields are done; the modal and a `csv` control kind are not. This
   is the largest outstanding piece.
2. **Accordion + List parent selection.** Items are individually selectable but the widget itself
   has almost no hit area, so clicking always lands on an item and the blue chip always shows the
   item's name. Fix in `AccordionRender` / `ListRender`: give the widget a real parent surface with
   items nested inside it. ⚠️ Do **not** just wrap the output in `<Sel id={nodeId}>` — `ColumnBody`
   already wraps placed elements with that id, and two nested `data-node="el-N"` nodes break
   toolbar positioning and every `document.querySelector('[data-node=…]')` lookup.
3. **Text direction** is omitted from List, Accordion, Button and Table, per an earlier standing
   instruction — but several recent reference images include it. One decision, then one line per
   widget.
4. **Per-row table selection**, if wanted — needs `Sel` able to render as a `<tr>` rather than a
   `<div>`.
5. Carried over from before: an added section's Columns control still doesn't restructure its
   `rows` array; the rail/top-bar styling writes config the chrome doesn't read back.

## Decisions made
- **Live data vs Actions is a real split, not labelling.** Live-data widgets fetch from the
  backend, so their rows carry no per-row content controls; action cards are fixed destinations
  and do. The palette groups reflect that.
- **One widget, one panel.** Advanced Accordion was removed and both accordion routes now resolve
  to one spec, for the same reason `l-accordion` and `b-accordion` couldn't both stay.
- **Item styling lives on the widget, not the item.** Every point in a list, and every row of an
  accordion, has to look like its neighbours — that's what makes it a list. Words are per item;
  look is per widget.
- **Removed rather than duplicated:** header emphasis presets, striped-rows toggle, the card's own
  padding slider and border preset, the table's Style pack. Each was a second control answering a
  question a shared component already answers properly.
- **Even column width is the default** for tables, and the per-column width editor is gone with it.
- **Warn, never block** kept for alt text; **hide, don't blank** for item descriptions, so nothing
  written is lost.

## Gotchas & notes
- ⚠️ **Vite hot-swaps a spec without its renderer.** This bit four times: the panel updates and the
  canvas still shows the old element. Hard-refresh (or restart the dev server) before deciding a
  new widget is broken.
- ⚠️ **`npm run build` is esbuild only — it does not typecheck.** A module const referenced before
  its declaration builds green and blanks the page at runtime. That happened once with the shared
  `FONTS` list; it's fixed, but the class of bug is live.
- ⚠️ **Don't edit JSX through `node -e` / bash heredocs** — `${...}` in template literals gets
  mangled by the shell. Broke the build once this session. Use the editor tools.
- The dev server for this project runs on **port 5199** (5173 is served by a different folder).
- A blank page mid-session turned out to be `ERR_NETWORK_CHANGED`, not a code fault — check the
  console before debugging.
- Nothing was committed during the session; this handoff accompanies the first commit of all of it.
