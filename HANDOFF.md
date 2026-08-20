# Handoff — 2026-08-20 11:19

## Read first

In `CLAUDE.md`, the six newest **Portal builder** bullets: the conformance
harness, the layout & alignment model, padding belonging to the painted box,
`fillCss`, child text nodes, and hidden catalogue elements. Between them they
cover everything this session touched and the trap behind each change.

Then read **[audit/FINDINGS.md](audit/FINDINGS.md)** — it is the current defect
list and the plan.

## What we worked on this session

Shifted from building features to **making what exists actually work**. Built an
automated conformance sweep, researched Duda's real layout model to replace
guesswork, and fixed the highest-impact defects it found.

## Completed

- **Conformance harness** — `audit/portal-conformance.js`, re-runnable with
  `await __audit.run()`. Baseline: **27 nodes, ~370 controls, ~60 inert**, triaged
  in `audit/FINDINGS.md` into four shared causes.
- **Layout research** — `LAYOUT-ALIGNMENT-SPEC.md`, measured from Duda's DOM.
  Preset sets, alignment vocabularies, defaults and the empty-section question all
  answered empirically rather than assumed.
- **Section presets on built-in bands** (audit cause A4) — the tile now tracks the
  preset you are on, and a 3-card band offers 3 tiles instead of 2.
- **Padding lands inside the card** — for placed widgets, added sections and the
  built-in banner action cards. Dragging a section taller no longer clips.
- **Featured Services** — card templates added and driving the canvas; Icon group,
  Divider and `Show icon` removed; icon-top now centres its text.
- **Contact Us** — every line's label and value editable in the panel and inline.
- **Inline editing** extended to widget headings, Feedback's title/prompt, Button
  label, Image caption, Title eyebrow/subtitle, and the icon on placed Action
  Card / AD Self Service / KPI.
- **Panel simplification** — Arrangement removed everywhere, Shadow removed from
  action cards, Icon group removed from Contact Us, accordions open on selection.
- **Table sheet** is 10 × 10 and fills its dialog; CSV over the cap clips and says so.
- **Spacer, Advanced Tabs and Media Slider hidden** from the palette, search and seed.

## In progress

Nothing half-written. The audit is the backlog, not a mid-flight change.

## Next steps

1. **A3 — alignment** (8 nodes). Biggest cluster and the longest-running
   complaint. Implement against `LAYOUT-ALIGNMENT-SPEC.md` §3, which REPLACES the
   earlier preset/alignment work rather than extending it — including removing the
   `hasContent` gate.
2. **A1 — corner-radius unit select** (12 nodes, almost certainly one shared fix).
3. **A2 — typography Font select** (6 nodes).
4. **Extend harness coverage** from 23% — it has swept widgets and sections but
   not child nodes, columns, page chrome, toolbars, drag/resize or undo.
5. **Two removal candidates still awaiting a decision** (FINDINGS §D): the
   empty-state `Show message` option on widgets that have data, and confirming the
   section `Name` field is correctly inert.

## Decisions made

- **Audit before fixing.** One re-runnable sweep beats a manual pass, because the
  next change re-opens the same questions. ~60 defects turned out to be four
  shared causes, which a widget-by-widget approach would have fixed repeatedly.
- **Duda's model is measured, not copied wholesale.** We took the axis rule and
  the preset behaviour; we deliberately skipped "More options" (Items per row /
  Items Fit) as more configuration than this user base wants.
- **Hidden, not deleted.** A `hidden` flag keeps specs and renderers intact so
  existing pages keep working and the decision is one flag to reverse.
- **Two controls for one value is the recurring fault**, and the canvas wins. That
  rule is why Arrangement, Shadow, the Contact Us Icon group and `Show icon` all
  left the panel this session.
- **Removals are batched for one approval** rather than decided unilaterally.

## Gotchas & notes

- ⚠️ **`npm run build` is esbuild only — it is NOT a typecheck.** Three runtime
  crashes shipped green this session: `createPortal` used without an import, refs
  declared *after* the line that assigns them, and a `<Tooltip>` with no import.
  Only the browser catches these.
- ⚠️ **Check the dev server is the right folder.** `localhost:5173` was serving
  `...--main_Final\...` — a different copy — for an entire session. The symptom
  (an admin gear with no handler) looked nothing like the cause. Work is served
  from a second instance on **5174**.
- ⚠️ **Hand-rolled browser probes cried wolf three times**: an expand loop that
  toggled accordions *shut* by running twice, a selector matching a wrapper
  instead of the tile, and reading a node's text while the floating toolbar lives
  inside it. Drive through the harness, which has guards for all three.
- ⚠️ **The Bash tool strips backslashes inside heredocs** and mangles nested
  quotes — write scripts with the Write tool and run the file.
- ⚠️ One empty section was left behind on the Duda research site
  (`serviceops-portal-research`); it is unpublished and it is a one-click delete.
