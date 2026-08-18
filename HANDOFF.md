# Handoff — 2026-08-18 11:11

## Read first

In `CLAUDE.md`, the four newest Support Portal bullets — **Theme**, **the floating
toolbar**, **the rich text editor**, and the **Bash-heredoc backslash** warning.
Everything this session touched is described there. The older Support Portal
bullets (widget spec registry, collection contract, structure & chrome) are still
accurate and are the background you need before changing any panel.

## What we worked on this session

The Support Portal builder: built the **Theme (Site styles) panel** the rail item
had only ever shown a placeholder for, made every button on the **canvas floating
toolbar** actually work, and rebuilt the **rich text editor** around a vertical
action rail.

## Completed

- **Theme panel** (`PortalThemePanel.tsx`, new). Mode (Light/Dark) + four cards —
  Theme, Fonts, Colours, Buttons — each previewing what it opens and opening its
  own screen. 6 palettes (each with a light *and* a dark set), 6 heading/body font
  pairings, 6 button shapes. No Forms section, as asked.
- **The theme actually paints the canvas.** One wrapper carries the font, the page
  colour and three CSS variables; dark mode is a `.portal-dark` class answered in
  `src/styles/theme.css`. Verified live: Dark → `#0F172A`; Forest → `#101F19`;
  Merriweather pairing → hero `<h2>` in Merriweather with body text still Inter;
  button shape → `--portal-btn-radius` 6px → 999px → 0px.
- `PAGE_SPEC` lost its Typography and Theme groups (they moved to the panel), so
  there is one place to set type and colour rather than two.
- **Toolbar delete** now clears both of an element's possible homes — this was the
  Spacer bug. Verified: element 2 → 1, and deleting a *filled* section removed the
  section and its element together.
- **Toolbar "+"** opens the element library on the canvas; on a filled element it
  replaces in place. Verified: Spacer → Divider, same spot.
- **Cross-section drag**, with a swap when the destination column is occupied.
  Verified: `el-2` sec-1-c0 → sec-2-c0 and `el-4` back the other way.
- **Duplicate** clones config + style and selects the clone, so the side drawer
  opens on the copy with its data filled in.
- **Three alignment icons** replace the single cycling button; axis-aware
  (left/centre/right for cards and columns, top/middle/bottom for sections).
- **Rich text editor** rebuilt: font style full-width on top, 200px writing
  surface, 38px scrolling vertical rail to its right in the order
  `B·U·I | align ×3 · lists | everything else`. Image and video removed.

## In progress

Nothing mid-flight. Every change above is built and verified in the browser.

## Next steps

1. **The floating dark `TextToolbar`** on the canvas (in `PortalCanvas.tsx`) is
   still the old horizontal bar. Bringing it in line with the new sidebar editor
   was offered and not yet asked for.
2. **A Divider has two alignment controls** — the toolbar buttons (writing
   `NodeStyle.align`) and an Alignment group in its side drawer (writing widget
   config). Two doors to one room; worth collapsing to one.
3. Carried over from earlier sessions: Accordion/List parent selection (the items
   are selectable but the widget itself has almost no hit area — the fix must NOT
   wrap it in a second `<Sel id={nodeId}>`, `ColumnBody` already uses that id);
   per-row table selection (needs `Sel` able to render as a `<tr>`); an added
   section's Columns control does not restructure its `rows`; the rail/top-bar
   styling writes config the chrome does not read back.

## Decisions made

- **Theme is its own panel, not the Page drawer.** The old routing was right when
  a theme was three colour fields; it is now four independent decisions, so it
  earns a surface — and the Page layer's theme fields were removed at the same
  time so there is still one door.
- **Two modes, no "auto".** A portal is designed and looked at; a mode that
  follows the visitor's OS is a page its designer never sees.
- **Fonts are pairings, not a flat list.** Choosing two faces that work together
  is the hard part of typography and the part an admin should not have to do.
- **The theme paints through one wrapper.** Threading a mode flag through every
  block would mean a widget can forget to obey the theme; a class + variables
  means it cannot.
- **A replacement gets a new id.** Config and style are keyed by id, so reusing
  one would leave the new element wearing the old one's stored padding.
- **Dropping onto an occupied column swaps rather than overwrites** — overwrite
  was the one gesture in the builder that could destroy work.
- **Three align buttons rather than one that cycles**, and **a vertical rail
  rather than a wrapping toolbar** — both for the same reason: a control whose
  position or state you have to rediscover each time is a control you stop
  trusting.
- **Image and video left the text editor.** An image belongs on the page as an
  Image element the builder can place, select and style.

## Gotchas & notes

- ⚠️ **The Bash tool strips backslashes inside heredocs.** `node <<'EOF'` receives
  `\d` as `d`, so any anchor string containing a regex silently fails to match and
  you get a confusing "anchor not found". Use the Write tool for the script, or
  pick backslash-free anchors. Cost about 20 minutes this session.
- ⚠️ `npm run build` is **esbuild only — not a typecheck.** A removed variable
  still referenced in JSX builds green and blanks the page at runtime. Always
  check the browser after a refactor.
- ⚠️ Vite hot-swaps a spec without its renderer, so the panel can look right while
  the canvas shows the old element. Hard-refresh before judging any new widget.
- ⚠️ When driving the app from DevTools, `Theme` matches **two** buttons — a
  Typography row inside the Page drawer and the rail item. Match the rail one on
  its `w-[60px]` class.
