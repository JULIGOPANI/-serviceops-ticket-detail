# Handoff — 2026-08-21 18:15

## Read first
Everything this session touched is in **CLAUDE.md's Support Portal bullets** — five of
them were rewritten in place:

- *"the entry point, the two tabs, and the listing"* — the new **Action column** and
  what did NOT survive the kebab.
- The **Create modal** bullet — `PortalDetailsFields` / `detailsReady` /
  `EditPortalDetailsModal` are now shared between Create and Edit details.
- *"Blue column adders belong to the SELECTED column only"* — the empty column's `+`,
  its hover colour, and the new glyph.
- *"widget fields — dynamic options and consequences (§2.2)"* — `templates` fields can
  now declare an allow-list, and `when` gates belong to what they depend on.
- *"click-to-add, the seam's two affordances…"* — the **Added tick is gone**; every
  widget is addable, every time.

## What we worked on this session
The **Support Portal admin module** — the listing's row actions, and four builder
fixes from the designer's review. Everything was verified in Chrome before commit and
each batch was pushed to `main` on its own.

## Completed
- **Action column on the Support Portal listing** (`AdminSupportPortalModule.tsx`) —
  the kebab is replaced by the icon rail every other listing uses: **Edit ▾ · Preview ·
  Copy · Delete**, `size={15}`, `#6B7280 → #3D8BD0`, red on delete, `gap-4`.
  Edit carries a two-item menu (*Edit details* / *Customise portal*), portalled to
  `document.body` so the table's `overflow-x-auto` cannot clip it. Delete stays
  disabled with its reason on the default portal.
- **Copy duplicates the whole portal and opens Edit details on the copy immediately.**
  The copy inherits every detail including the URL; two portals cannot answer on one
  address, so it asks at the moment a change is already known to be needed.
- **`PortalDetailsFields` + `detailsReady` + `EditPortalDetailsModal`** extracted from
  `CreateSupportPortalModal.tsx` — Create step 1 and Edit details are now literally the
  same five fields. `DEFAULT_PORTAL_PAGE` seeded with company/url/idp/ssoOnly so Edit
  opens on a filled record.
- **`portalUrl()` returns the address the admin typed** (`p.url`) and only derives one
  from the name for a portal nobody has addressed yet.
- **Empty column's `+` centres both ways** (`SupportPortalPreview.tsx` — `!item`
  forces `justify-center`, ignoring `blockAlign`) and **goes blue while the column is
  live** (`ColumnAdders` in `PortalCanvas.tsx`). Resting and live plus now land on the
  same pixel, so hovering does not move it.
- **`ColumnAddIcon` redrawn from the designer's artwork** — narrow solid track beside a
  wider dashed one, source kept at `src/assets/add-column.svg`.
- **Image element offers three card templates, not four.** `TemplatePicker` takes an
  `only` allow-list; a `templates` field may declare `options`.
- **Action card gained a `mostUsed` toggle** in its ACTION section, gated on
  `destination === 'service'`, seeded `false` in the spec defaults.
- **The widget library greys out nothing.** `isAdded` / `isSingle` / `placedTypes` all
  removed, along with the panel's `placedTypes` and `blank` props.

## In progress
Nothing mid-flight. Working tree clean, all five commits pushed, Pages green.

## Next steps
- **Optional, and only if the designer asks:** make the **AD Self Service** action card
  repeatable. It is the one element that still refuses a second instance, because
  `quick-ad` is a fixed key in `WIDGET_FOR_NODE`. Doing it properly means unique ids
  through `content.quick`, `rowOrder`, the cfg store and `ownerOf`, plus a prefix
  fallback in the spec lookup. `addElement` currently refuses with a toast; a second
  AD-style card is built from the generic **Action Card** element instead.
- **Kill the stale dev server on port 5173** — it is serving an old build (its tab
  still reads "Ticket Listing & Full Detail page") and will mislead anyone who opens
  it. This session verified on a fresh server at **5180**.
- The four parked Support Portal features are still parked — see
  [future-tasks.md](future-tasks.md) before touching AI, Media Slider, Advanced Tabs or
  custom templates.

## Decisions made
- **Edit is one icon with a menu, not two icons.** *Edit details* changes what the
  portal IS; *Customise portal* changes what is ON it. Both are editing, never done in
  the same moment, and no pair of glyphs separates them — a chevron on the pencil says
  there is a choice without spending a second slot in the rail.
- **Three kebab items were dropped and should not come back.** Portal settings and
  Reset layout are both reachable inside the builder; Copy link duplicates the URL
  column, which is already a working link.
- **The copy's name is seeded `uniquePageName(pages, src.name)`**, i.e. as close to
  identical as the uniqueness rule allows — not `"X copy"`. The designer asked for the
  details to be the same; the popup that opens next is where a different name is chosen.
- **`blockAlign` does not apply to an empty column.** That setting is about blocks, and
  an empty column has none — the `+` is the offer to add some, so it centres.
- **The centre `+` is blue while live, grey at rest** — reversing an earlier deliberate
  choice, on request. All three affordances arrive together on hover, and a middle
  button still painted like the resting hint was the only live control that did not
  look live.
- **"Text only" leaves the Image element** because it hides the picture; an Image with
  no image is a Text element under the wrong name, with alt text and a crop still on
  screen describing nothing. The action card keeps it — a card without an icon is still
  a card.
- **`mostUsed` ships OFF.** `ToggleRow` reads an unset key as ON, so a field that has
  only just appeared because you picked a destination must not arrive having already
  changed what the card does.
- **The single-instance palette rule was ours, not the product's.** Two request lists
  filtered to different statuses is a reasonable page, and every placed element carries
  its own id and config, so a second is a second widget rather than a collision. What
  the rule reliably produced was a palette that went dead as a page got built.
- **`onPage` stays on the catalogue** even though the palette no longer reads it — the
  demo seed still needs it to skip components the page renders as built-in bands. What
  a page RENDERS and what an admin may ADD are two questions.

## Gotchas & notes
- **`overlays` is JSX built during render**, so any helper it calls must be declared
  ABOVE it. `portalUrl` sat 130 lines below and was a TDZ crash esbuild could not see —
  it had to be hoisted. Same class of bug as the `tabs` const noted in CLAUDE.md.
- **A `mk()`-style edit script must call `.save()`.** One did not this session, so the
  `PortalDetailsFields` insert silently never reached disk while the build stayed
  green — rollup only caught it at the import (`"EditPortalDetailsModal" is not
  exported`). Check the file, not the exit code.
- **`node -e` in this Bash tool eats backticks.** A CLAUDE.md edit containing
  `` `ColumnAddIcon` `` was shell-interpreted into "command not found". Write the script
  with the Write tool and run the file — same root cause as the heredoc/backslash note
  in CLAUDE.md.
- **Synthetic `elementFromPoint` clicks are unreliable for canvas selection.** The
  innermost `Sel` kept winning. What works: find the `outline-offset-1` wrappers
  containing the text you want and `dispatchEvent(new MouseEvent('click',
  {bubbles:true}))` on the WRAPPER itself, walking the index from 0 (Section) up to the
  element. There is no step-up arrow on the hover chip any more.
- **The dev server on 5174 died mid-session and 5173 is stale.** Verify on a fresh
  `npm run dev -- --port <n>`; the stale server's tab title is the tell.
- `npm run build` is **esbuild only** — it is not a typecheck. Everything here was
  confirmed by measuring in Chrome DevTools, not by the green tick.
