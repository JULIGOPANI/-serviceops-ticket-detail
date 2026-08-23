# Handoff — 2026-08-24 00:19

## Read first
Three **CLAUDE.md** bullets were rewritten in place this session — start there:

- *"Support Portal builder — Add panel, canvas selection, and the element editor"* — the
  group tab strip now uses the product's inline underline treatment, and why it is 13px
  rather than the detail page's 14.
- *"Support Portal — Branding and the logo"* — one spacing rhythm, no rule under a
  section head, no Inherited badge, no info cards.
- *"Support Portal — element preview on hover"* — rewritten end to end. It carries the
  group-shape rules and the Tailwind-literal trap that would otherwise cost an hour.

## What we worked on this session
Three rounds of designer review on the **Support Portal builder**: the Widgets panel's
tab styling, the Branding panel's spacing and chrome, and a full rebuild of the element
hover previews. Everything was measured in Chrome before commit; two commits pushed.

## Completed
- **Widget library tabs use the product's inline tab treatment**
  (`SupportPortalAddPanel.tsx`). They were pills. Now `px-2 py-3 border-b-2`, `gap-2.5`,
  active `#3D8BD0` underline, inactive `#6b7280` with `hover:bg-[#F5F7FA]
  hover:border-[#CBD5E1]` — measured identical to `TicketDrawer`'s tab row except the
  font size. The strip lost its `pb-3` so a tab's underline touches the strip's own rule.
- **Branding panel spacing fixed** (`PortalBrandingPanel.tsx`). `ReadOnly` carried its
  own `mb-4` while `Field` spaces with `mt-4 first:mt-0`, so Portal name → Company had
  **no gap** and a `Field` after a hand-spaced row got a double one. Every row goes
  through `Field` now; measured, all five rows sit **74px** apart.
- **`Head` lost its `border-b`** (now `mb-1 mt-7`), the **`Inherited` badge is gone**
  (component deleted), and **both grey ⓘ `Note` cards are gone** (component deleted).
  `Info` stays — the Help Icon tooltip still uses it.
- **All 21 element hover previews rebuilt** (`PortalElementPreview.tsx`, a full
  rewrite). One sketch per element, each matching that element's real renderer; none
  falls through to the generic block. Heights now 170–261px (Text was 457px, is 215px).
  - **Text** shows real words — heading, body, caption.
  - **Button** is a **2×2 grid** of four real buttons at the sketch's full width.
  - Shared shapes: `listCard()` for Live data, `actionCard()` for Actions.
  - The element's own palette glyph is passed in as an `icon` **prop** from the panel.

## In progress
Nothing mid-flight. Working tree clean, both commits pushed.

## Next steps
- **Optional:** make the **AD Self Service** action card repeatable. It is the one
  element that still refuses a second instance — `quick-ad` is a fixed key in
  `WIDGET_FOR_NODE`, so a second would have no spec and open nothing. Doing it properly
  means unique ids through `content.quick`, `rowOrder`, the cfg store and `ownerOf`,
  plus a prefix fallback in the spec lookup. `addElement` refuses with a toast today.
- **Kill the stale dev server on port 5173** — it serves an old build (tab title still
  reads "Ticket Listing & Full Detail page"). This session verified on **5180**.
- The four parked Support Portal features stay parked — read
  [future-tasks.md](future-tasks.md) before touching AI, Media Slider, Advanced Tabs or
  custom templates.

## Decisions made
- **Widget tabs are 13px, not the detail page's 14.** Every other line in that panel is
  11–13px, so a 14px tab row would be the largest type on the surface it navigates.
  Everything else about the recipe is identical.
- **Pills were saying the wrong thing.** A pill reads as a filter — a set you pick from
  — where these are places you go.
- **A section head owns no rule.** A heading and its fields are one block; a hairline
  between them cuts the title from what it titles. The space *above* separates sections.
- **One sketch per element, never a stack of variants.** Four stacked wireframes doubled
  the card's height and made the reader scan a column to find the one they meant. Where
  an element has a real range, the range goes *inside* the sketch.
- **The four Action previews are deliberately identical.** They ARE the same card on the
  page — the icon and the words are the whole difference. A sketch that invented four
  shapes to look more interesting would be lying.
- **Basic elements sit on the page ground with no card.** Not a stylistic choice:
  `renderSpec()` marks them `bare`, and it is the clearest signal of "adds a block" vs
  "puts content on your page". `b-card` is the one exception, which is why its sketch is
  the one with a border.
- **The preview's icon is a prop, not an import.** `SupportPortalAddPanel` imports
  `PortalElementPreview`, so reaching back for `elementIcon` would be a cycle. One
  registry, one direction.

## Gotchas & notes
- ⚠️ **Tailwind scans SOURCE TEXT for class names.** A class built by interpolation —
  `` `bg-[${ACCENT}]` `` — never appears in the file, so the utility is never generated
  and the element silently renders unstyled. Nine of them were in the first draft of
  `PortalElementPreview`. Write accent classes out literally.
- ⚠️ **`ToggleRow` reads an unset key as ON** (`cfg[key] !== false`), so any new toggle
  that should ship off needs an explicit `false` in the spec defaults.
- **Vite HMR did not pick up the preview rewrite** — the old variant labels kept
  rendering until a hard reload (`ignoreCache`). Hard-refresh before judging a rewritten
  component; this has now bitten twice on this file family.
- **`take_screenshot` intermittently times out** on this page; calling it a second time
  succeeds. Not a page fault.
- **Synthetic canvas clicks:** `elementFromPoint` selects the innermost `Sel`. To reach a
  container, find the `outline-offset-1` wrappers containing the text and
  `dispatchEvent(new MouseEvent('click', {bubbles:true}))` on the **wrapper**, walking
  the index from 0 (Section) upward. There is no step-up arrow on the hover chip.
- `npm run build` is **esbuild only** — not a typecheck. Everything above was confirmed
  by measuring in Chrome DevTools, not by the green tick.
