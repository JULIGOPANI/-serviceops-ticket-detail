# Portal builder — conformance sweep results

Run 20 Aug 2026 with [`portal-conformance.js`](portal-conformance.js) against every widget and
section on the seeded page. **27 nodes, ~370 controls driven.** A control counts as INERT when
changing it produced no change anywhere in the node's rendered subtree.

Re-run any time with `await __audit.run()` — the point is that this list shrinks and stays shrunk.

---

## Scoreboard

| Node | controls | working | inert |
|---|---|---|---|
| Hero | 9 | 8 | **0** |
| My Requests | 10 | 9 | 1 |
| Knowledge | 10 | 9 | 1 |
| My CIs | 7 | 6 | 1 |
| Announcements | 7 | 6 | 1 |
| Advanced Tabs | 8 | 7 | 1 |
| Spacer | 2 | 1 | 1 |
| Feedback | 14 | 12 | 2 |
| Approvals | 10 | 8 | 2 |
| My Assets | 10 | 8 | 2 |
| Card | 10 | 7 | 2 |
| Text | 13 | 11 | 2 |
| Divider | 9 | 6 | 3 |
| Cards Row | 15 | 11 | 4 |
| Records Row | 15 | 11 | 4 |
| Text with Image | 20 | 15 | 4 |
| Quick Actions | 19 | 14 | 5 |
| Button | 18 | 12 | 5 |
| Action Card | 17 | 11 | 5 |
| AD Self Service | 17 | 11 | 6 |
| Image | 11 | 4 | 6 |
| Contact Us | 17 | 10 | 7 |
| Featured Services | 12 | 5 | 7 |
| Table | 15 | 8 | 7 |
| KPI | 16 | 8 | 8 |
| Accordion | 25 | 15 | 10 |
| **Media Slider** | **33** | **11** | **22** |

---

## A. Shared causes — fix once, fixes many

These are not 60 separate bugs. Four causes account for most of the list.

### A1. Corner-radius UNIT select — inert on 12 nodes
`Contact Us · Feedback · AD Self Service · Text with Image (×2) · Image · Media Slider · Action Card ·
Quick Actions · Cards Row · Records Row · Approvals · My Assets`

The px/% unit dropdown beside the radius slider. Changing the unit never re-renders.

### A2. Typography `Font` select — inert on 6 nodes
`Text · Button · Table · Accordion (×2) · Text with Image`

Choosing a font family does nothing. This is a P3 pack field the renderers don't read.

### A3. Alignment options — inert on 8 nodes
`Divider (×3) · Table (×3) · Accordion (×3) · Image (×2) · Contact Us (×2) · Featured Services (×2) ·
KPI (×2) · Quick/Cards/Records "Content alignment"`

The single biggest cluster, and the one you have raised most often.

### A4. Section `Presets` — inert on Quick Actions, Cards Row, Records Row
The preset tiles do not restructure the built-in bands. (They *do* work on added `sec-N` sections —
that path was fixed earlier; the built-in bands were not.)

---

## B. Worst single widget — Media Slider

**22 of 33 controls inert.** Autoplay, Pause on hover, Loop, Allow swipe, transition speed, arrow
position, dot position/style, aspect ratio, fit, caption position — none of them reach the renderer.
`SliderRender` reads a small fraction of what its spec declares.

Recommend rebuilding its renderer against its spec rather than patching control by control.

---

## C. Individually broken

| Node | Control |
|---|---|
| Advanced Tabs | border colour select |
| Spacer | height `%` range |
| Card | `Link` text field · columns option |
| Text | a `px` range |
| Table | Header option · Font weight · Horizontal scroll toggle |
| Accordion | Show-one-at-a-time · Show-first-expanded toggles |
| Image | two ranges · Shadow toggle |
| Action Card · AD Self Service | Shadow toggle |
| KPI | `Counts` source select · a `px` range |
| Button | Button style option |
| My CIs | Show CI type toggle |

---

## D. Candidates for REMOVAL, not repair — needs your approval

Per your "batch them and ask once". Each is a control whose effect cannot exist in context:

1. **Featured Services → Divider between items** — its items are a grid, not a stack. Nothing to
   divide.
2. **`Show message` empty-state option on Announcements, My Requests, Knowledge** — these widgets
   have data, so the empty-state preview cannot show. Either hide the group when the widget has
   records (matching what we did for Arrangement on My CIs), or leave it and accept it looks dead.
3. **Section `Name` field** — reported inert and *correctly so*: it is editor-only ("Only you see
   this"). Not a bug; listed so it is not re-reported.

---

## E. Harness false positives — fix in the harness, not the product

- **Upload zones** (`Drop an image or browse`) on Action Card, AD Self Service, Button, KPI — need a
  real file; should report `skipped`.
- **`Name`** — editor-only by design.
- **`Opens` / `On click, go to`** — non-visual by nature; partially caught by `NON_VISUAL` already.
- Some **`None`** options are Fill-already-None; the `isOn` check misses a few segment styles.

---

## Suggested order

1. **A3 alignment** — biggest cluster, and the thing that has cost you the most time.
2. **A1 radius unit** — 12 nodes, almost certainly one shared fix.
3. **A4 section presets on built-in bands.**
4. **A2 font select.**
5. **B Media Slider** — its own piece of work.
6. **C** individually.
7. **D** once you have approved the removals.
