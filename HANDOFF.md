# Handoff — 2026-08-20 17:30

## Read first

In `CLAUDE.md`, the two newest bullets: **"Support Portal — the entry point, the
two tabs, and the listing"** and **"Support Portal Settings tab"**. They cover
everything this session changed and the trap behind each decision.

Then **[audit/FINDINGS.md](audit/FINDINGS.md)** — still the live defect backlog
for the builder itself, untouched this session.

## What we worked on this session

Moved Support Portal Customization out of Organization and into **Support
Channels**, gave it two tabs (Customization | Settings), built the Settings page
from the live product screen, and rebuilt the listing to the real product's
columns.

## Completed

- **Entry point moved.** `Support Channels › Support Portal` is now the single
  destination. The Organization card is **removed**, not left as a second door;
  `CARD_MODULES` in `AdminPage.tsx` is keyed `'Support Channels/Support Portal'`.
- **Two tabs, one heading.** Title + one-liner render **above** the tab strip and
  do not change with it. A `shell(body)` helper renders head → tabs → pane once,
  so the empty state, the listing and Settings can't drift apart.
- **Settings tab** — new `AdminSupportPortalSettings.tsx`: nine accordions
  (Request expanded, eight collapsed), toggle/radio/number/chips rows, dependent
  rows removed rather than disabled, and a search that matches rows and
  force-opens their groups.
- **Listing rebuilt** to `Portal name · URL · Status · Enabled · ⋮`. Name is the
  link in with a `Default` badge; Status is one cell holding pill + "N days ago
  by …" + the amber `Unpublished changes` chip; the default portal's toggle and
  Delete are disabled *with the reason on them*.
- **Three bugs found while verifying** — a latent temporal-dead-zone on the
  `tabs` const, a kebab menu clipped by the table's `overflow-x-auto` (now
  portalled to the body), and a `portalUrl()` that invented a hostname per portal
  (now a path).
- `.playwright-mcp/` added to `.gitignore`.

## In progress

Nothing mid-flight.

## Next steps

1. **A3 — alignment** (8 nodes, audit's biggest cluster). Implement against
   `LAYOUT-ALIGNMENT-SPEC.md` §3, which REPLACES the earlier preset/alignment
   work — including removing the `hasContent` gate.
2. **A1 — corner-radius unit select** (12 nodes, almost certainly one shared fix).
3. **A2 — typography Font select** (6 nodes).
4. **Free positioning** — the model was answered last session (see the section
   below, kept verbatim). All four asks land together.
5. **The 4 quick-action cards still wrap to two rows** despite `cols.quick: 4`.
6. **Extend harness coverage** from 23% — it sweeps widgets and sections but not
   child nodes, columns, page chrome, toolbars, drag/resize or undo.
7. **Two removal candidates awaiting a decision** (FINDINGS §D): the empty-state
   `Show message` option on widgets that have data, and confirming the section
   `Name` field is correctly inert.

## Decisions made

- **One destination, two tabs — and the old card is deleted.** Two nav rows both
  named for the support portal would make an admin remember which one holds the
  switch they want.
- **The heading does not change per tab.** Customization and Settings are two
  views of one subject; saying which view you're in is the strip's job.
- **Status is a sentence, not a word.** Pill + who/when + the unpublished-changes
  warning are one story; across three columns the reader has to reassemble it.
- **A Delete item was added beyond the reference screen.** Duplicate creates a
  row, and without Delete that row could never be removed. Disabled with a reason
  on the default portal. **Flagged to the user — easy to drop if unwanted.**
- **URLs are paths on the tenant domain**, not a hostname per portal.
- **Dependent settings rows are removed, not greyed.** A disabled control
  explaining a state you can already see is noise.

## Gotchas & notes

- ⚠️ **`npm run build` is esbuild only — it is NOT a typecheck.** `React.ReactNode`
  with no `React` import, and a `createPortal` with no import, both build green.
  Only the browser catches them.
- ⚠️ **Check the dev server folder.** `localhost:5173` serves a *different copy*
  (`...--main_Final\...`). This work is on **5174** — verify by fetching a file
  only this copy has, e.g.
  `curl localhost:5174/src/app/components/AdminSupportPortalSettings.tsx`.
- ⚠️ **The Bash tool strips backslashes inside heredocs** and mangles nested
  quotes — write scripts with the Write tool and run the file. A multi-step node
  script that throws part-way writes nothing, so earlier successful edits in the
  same run are silently lost.
- ⚠️ **`overflow-x-auto` on a table wrapper clips any menu inside it.** Portal to
  `document.body` with fixed positioning and re-measure on scroll/resize.
- ⚠️ Python is not on PATH in this environment; use node for scripting.

## Free positioning — the model, ANSWERED 20 Aug 2026 (still outstanding)

These four asks are one piece of work:

1. **Banner heading/subtext draggable across the WHOLE banner** (today it only
   reaches about half).
2. **Custom action cards placeable anywhere by dragging.**
3. **Search bar resizable from all four corners**, narrowing until the icon meets
   the placeholder.
4. **Text draggable among the other text of its section**, cursor changing to a hand.

> **Scope: freely placed WITHIN ITS OWN SECTION — never floating above the page.**
> **The gap it leaves behind: leave the current behaviour alone.**
> **At narrower widths: the section makes itself responsive.**

⚠️ Today `freePlaced` (in `PortalCanvas`) is hero-only and stores position as a %
of the hero BAND. Extending it means the same mechanism keyed to whichever section
the element belongs to — which is why all four land together.
