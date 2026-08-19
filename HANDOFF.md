# Handoff — 2026-08-19 11:40

## Read first

In `CLAUDE.md`, the six newest **Support Portal** bullets: what the panel no
longer holds, the section end to end, resize part two, Branding and the logo,
surfaces and text styles, and the icon picker / text toolbar. Between them they
cover everything this session touched and — more usefully — the trap behind each
change.

## What we worked on this session

Continued refining the Support Portal builder: stripped four whole sections out
of the panels, unified section spacing and fills, rebuilt Branding down to the
fields that belong to one portal, gave the logo its own layer, and fixed a run of
bugs where a control existed but wrote to something nothing read back.

## Completed

- **Panels emptied of what the canvas already does.** Layout and Size removed
  from every widget (and P2 with Size); Shadow removed from the shared P1 pack and
  the Table spec; a text child's Alignment accordion removed.
- **Sections unified**: one padding rhythm (24 / 12 / no margin), fills painting
  the whole section rather than the inner row, no seam under the hero, and
  Alignment appearing only once a section has content.
- **Resize**: the top grip drags the gap above an element (to −120px), both side
  handles are squares that resize, and the top bar grows by padding instead.
- **Most Read is responsive** to its own width via `@container` — clean down to
  ~250px (see Next steps for where it still breaks).
- **Statuses is a multi-select** with Select all / Clear, replacing five chips.
- **Branding** cut to the ten fields that belong to this portal, with a live
  Inherited badge; the **logo** moved to its own layer with an upload container
  and the shared style pack.
- **Every UploadZone** shows a 92px chequerboard preview + "Replace image".
- **Icon picker**: selecting an icon selects the icon; upload is a primary
  "Upload SVG or PNG" button.
- **Text toolbar** is white, its colour control is a real button with a
  Canva-style glyph, and the align buttons are clickable again.
- **Card fixes**: the icon-top template centres its text, the text-only template
  works, and action cards / KPIs no longer render inside a second card.

## In progress

Nothing half-written. Two things are implemented but **unverified end to end** —
see Next steps 1 and 2.

## Next steps

1. **Elements dropped from the Widgets panel land in a built-in row, and that row
   path renders them without a `<Sel>` wrapper** — so no `el-N` node exists to
   select. This blocked verification of the toolbar B/I/U click-through and is
   worth fixing on its own: an element you cannot select is an element you cannot
   edit. `ColumnBody` already wraps its placed elements; the row path needs the
   same.
2. **Text styles from the floating toolbar** — the fix is in (`Sel` spreads
   `styleOf` for text nodes) but could not be exercised because of 1. Worth a
   manual click of B on a card subtitle.
3. **Most Read below ~205px** still overflows; the pressure is the card HEADER
   (title + count + View all), not the rows. Hiding the count and collapsing to
   the chevron below ~220px would finish it.
4. **Undo of a deleted built-in block** still does not restore the block —
   recorded but not reversed. Text and config restore fine, so it is specific to
   whatever state the delete path writes.
5. Carried over: Accordion/List parent selection; per-row table selection (needs
   `Sel` able to render as `<tr>`); an added section's Columns control does not
   restructure its `rows`.

## Decisions made

- **Two controls for one value is the recurring fault**, and the canvas wins.
  That single rule is why Layout, Size, Shadow and the text Alignment accordion
  all left the panel this session.
- **An element that paints its own surface must be `bare`** — otherwise it gets a
  second box whose fill and radius nothing can reach.
- **Alignment is a question about content**, so it does not exist before there is
  any; `hasContent` is derived per render rather than stored.
- **Replace, not Remove**, on every image slot — these are always filled, so
  swapping is the common move and the destructive verb should not be on it.
- **The section fill belongs to the section**, padding included, or a background
  reads as a floating rectangle.
- **The gap above an element is a better question than its top edge** — dragging
  the top to grow something moves it into the block above.

## Gotchas & notes

- ⚠️ **The Bash tool strips backslashes inside heredocs.** It bit twice more this
  session; the second time it compiled `/^sec-\d+$/` to `/^sec-d+$/`, which is a
  valid regex that silently matches nothing — the Alignment gate looked
  implemented and did nothing. Write the script with the Write tool, or use
  backslash-free anchors, or build the backslash with `String.fromCharCode(92)`.
- ⚠️ **`npm run build` is esbuild only.** Two blank-page runtime errors shipped
  green this session: a `<Tooltip>` used without an import, and a `useCallback`
  naming `sections` in its dep array while declared above it (TDZ). Check the
  browser console after any edit.
- ⚠️ **A multi-step node script that throws part-way writes nothing** — the
  earlier successful edits are silently discarded.
- ⚠️ A JSX comment cannot be the first thing inside a parenthesised `return`.
- ⚠️ A flex item's basis is its content, so truncation needs `w-0` alongside
  `flex-1`; and `flex-wrap` lets an item wrap instead of shrinking, which is the
  opposite of responsive.
