# Handoff — 2026-08-18 16:56

## Read first

In `CLAUDE.md`, the seven **Support Portal** bullets covering the Theme panel, the
child-selection model, resize semantics, undo/redo, panel and rail chrome, the
element hover preview, and the colour picker. Between them they describe every
surface this session touched and, more usefully, the traps behind each one.

## What we worked on this session

The Support Portal builder, in four passes: made child elements individually
selectable with their own scoped editors, fixed what resizing actually means
(width, height, and the top bar), added undo/redo, and rebuilt the Theme panel,
the Branding panel and the colour picker.

## Completed

- **Child selection.** A widget's heading, its "View all" link and an action
  card's icon are now nodes in their own right: clicking one selects it and the
  drawer shows only that child's Content and Design. All are inline-editable, and
  inline and panel edits write the same value.
- **Resizing.** Width is now a percentage of the parent (it could only shrink
  before). Height is a real height that clips, clamped to the parent band, with
  the clip on an inner box so the toolbar and handles are not eaten. Added the
  missing bottom-centre grip and removed the padding pill that was stealing its
  clicks. The top bar is the exception — its bottom drag adds vertical padding.
- **Undo/redo**, snapshot-based, with `Ctrl+Z` / `Ctrl+Shift+Z`. Verified on text
  and config edits.
- **Theme panel rebuilt** as one scrolling panel: Theme-style and Fonts dropdowns
  that open as instant popups on the product's own field chrome, then Colours
  (Primary / Secondary / Neutral tabs, light-dark switch on the heading, circles
  with no hex) and Custom. Eight styles, eight palettes.
- **Branding** cut back to support-portal-only settings; titled "Branding".
- **Colour picker** rebuilt to the reference: horizontal hue + alpha rails,
  Hex/R/G/B/A, fixed swatch grid, Done/Cancel. Recent list removed.
- **Element hover preview** — a dark wireframe card with a variant carousel and a
  line on why to use each element.
- **Panel chrome**: no header bar, reset beside the element's name, rail is
  Widgets · Theme · Branding · AI, every panel titled the same way.
- Earlier in the session: working floating-toolbar actions (delete across both
  element homes, canvas element picker with replace-in-place, cross-section drag
  with swap, duplicate that clones config + style), and the vertical-rail rich
  text editor.

## In progress

Nothing mid-flight. Everything above is built and verified in the browser.

## Next steps

1. **Undo/redo gap** — deleting a built-in block is recorded (the buttons enable
   correctly) but the block does not come back. Text and config restore fine, so
   the fault is specific to whatever state the delete path writes. Start by
   logging what `removed` / `rowOrder` actually contain across the delete and the
   restore.
2. **Icon picker default** — the Icon tab opens with nothing highlighted for an
   untouched card rather than showing the card's shipped default. There is no
   map from card → default icon key yet; that needs to exist first.
3. **Instant tooltip** on the toolbar's Add/Replace button — the label is right
   ("Add widget" / "Replace widget") but it is still a native `title`, so it keeps
   the OS hover delay.
4. Carried over: Accordion/List parent selection (the widget has almost no hit
   area — the fix must NOT wrap it in a second `<Sel id={nodeId}>`, `ColumnBody`
   already uses that id); per-row table selection (needs `Sel` able to render as a
   `<tr>`); an added section's Columns control does not restructure its `rows`.

## Decisions made

- **Config and panel resolve differently for a child node** — same value, its own
  editor. That single split is what makes inline and sidebar editing one edit.
- **Width as a percentage, not pixels** — responsive, growable to exactly the
  parent's width, and impossible to set larger than the space that exists.
- **Snapshots over a command log for undo** — a log needs every edit surface to
  remember to record itself; a snapshot cannot be forgotten.
- **Only Primary varies by theme.** Secondary is the status language and Neutral
  is the greyscale floor; a theme that re-tinted them would be changing what a
  colour means.
- **No Recent in the colour picker** — per-browser, so two admins see different
  shortcuts and neither matches the palette.
- **A theme-style card shows font and button but no colour** — one authority for
  colour, or the palette you edited gets silently overruled.
- **The left rail gets no styling controls at all** — it is the product's own
  navigation, and it appears on every screen of the portal.

## Gotchas & notes

- ⚠️ **A missing component in JSX is a runtime `ReferenceError` that builds
  green.** Used `<Tooltip>` in a file that never imported it and blanked the page;
  `npm run build` is esbuild only and will never catch this class of error. Check
  the browser console after any edit that adds JSX.
- ⚠️ **The Bash tool strips backslashes inside heredocs** — `node <<'EOF'` gets
  `\d` as `d`, so regex anchors silently fail to match. Write the script with the
  Write tool and run the file, or use backslash-free anchors.
- ⚠️ **A multi-step node script that throws part-way writes nothing** — a later
  failing anchor silently discards the earlier successful edits, which then look
  applied in the diff you remember but are not in the file. Re-check after a
  partial failure.
- ⚠️ Vite hot-swaps a module without its dependents; the canvas can show stale
  behaviour while the code is right. Hard-refresh before judging anything.
- ⚠️ When driving the app from DevTools, tab buttons render lowercase in
  `textContent` (`capitalize` is CSS), and "Theme" matches two buttons — the rail
  one carries `w-[60px]`.
