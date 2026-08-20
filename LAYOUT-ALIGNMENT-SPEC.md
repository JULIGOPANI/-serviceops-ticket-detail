# Layout & Alignment — how it must work for every section, column and widget

Derived by inspecting **Duda's** section panel directly (site `serviceops-portal-research`,
19 Aug 2026). Everything marked *measured* was read out of the live DOM — the option ids quoted are
Duda's own `data-auto` values.

---

## 1. The complete section Layout model (measured)

Duda's Layout group is:

```
Layout
  Presets            horizontal | 2x1 | vertical
  Content alignment  ▸ horizontal row  (5 options)
                     ▸ vertical row    (4 options)
  Full width
```

⚠️ Duda also hides an `Items per row` number and an `Items Fit` switch behind a **More options**
disclosure. **We are deliberately NOT taking those** — decided 19 Aug 2026. The preset tiles are our
whole shape control. That has one consequence, in §1.4.

### 1.1 The preset set is CONTEXT-DEPENDENT — and here is the rule (measured)

The tiles offered change with how many cells the section has:

| Cells | Presets offered | Count |
|---|---|---|
| 2 | `horizontal` · `vertical` | 2 |
| 3 | `horizontal` · **`2x1`** · `vertical` | 3 |
| 4 | `horizontal` · **`2x2`** · **`3x1`** · `vertical` | 4 |

**`A x B` means "A items on the first row, B on the second".** `2x1` = 2 then 1 (n=3).
`2x2` = 2 then 2, `3x1` = 3 then 1 (both n=4).

> **The rule:** the set is always
> `[horizontal]` + `[every two-row split A+B where A+B = n, A ≥ 2, B ≥ 1, A < n]` + `[vertical]`.
>
> - `horizontal` is the n-in-one-row case; `vertical` is the one-per-row case. They are the two ends.
> - The middle tiles are every meaningful wrap between them.
> - n = 2 has no middle, because its only split (1+1) *is* vertical — which is why a 2-cell section
>   shows just two tiles.

Predicted (not yet measured): n = 5 → `horizontal · 3x2 · 4x1 · vertical`.

⚠️ **The set tracks the CELL COUNT, not the content.** An *empty* 3-column section offers all three
tiles and an *empty* 2-column section offers two — verified by adding both from the Layouts picker
with nothing in them. So this is a function of the section's shape, available immediately.

⚠️ **A preset that would draw an empty cell is never offered.**

The **More options** disclosure appears exactly when there IS a middle tile — i.e. from n = 3 up.
Below that there is nothing to configure beyond the direction, so Duda does not offer the control.

### 1.2 Content alignment — two rows, always present, named by direction

The rows are `horizontal-alignment` and `vertical-alignment`. **Both are always shown, both are
always named by SCREEN direction** — never "content" vs "columns". What changes is the option set:

| Preset | horizontal row | vertical row |
|---|---|---|
| **horizontal** (a row) | start · center · end · **space-between · space-around** | start · center · end · **stretch** |
| **vertical** (a stack) | start · center · end · **stretch** | start · center · end · **space-between · space-around** |

Verified by switching the preset and re-reading both controls.

> **The MAIN axis distributes. The CROSS axis aligns.**
>
> - The axis the section lays out along (**main**) gets 5: `start`, `center`, `end`,
>   `space-between`, `space-around` — all about **sharing leftover room between items**.
> - The other axis (**cross**) gets 4: `start`, `center`, `end`, `stretch` — about **where one item
>   sits within the band's thickness**. `stretch` exists only here.
>
> `space-*` can never appear on the cross axis (there is one item per line to space out), and
> `stretch` can never appear on the main axis (items already stack along it).

### 1.3 Measured defaults

Main → `flex-start`. Cross → `stretch`. That is exactly what flexbox does with no CSS written, so
**the lit button on the cross axis must be `stretch`, not `start`.**

### 1.4 Free space — the consequence of dropping `Items Fit`

Duda has an explicit `Items Fit: fixed | stretch`. **stretch** makes items divide the full width;
**fixed** lets them take their natural width, which is what leaves room for main-axis alignment to
act on. We are not taking that control.

⚠️ So the row must decide for itself. Our cards carry `flex: 1 1 …` and therefore fill the row, which
means `justify-content` has nothing to distribute and every main-axis option would be inert.

> **Rule: choosing any main-axis value other than the filling default packs the row**
> (`flex: 0 1 auto` on the children). Choosing "centre" IS the decision not to stretch them.

That is the only reading under which the control does anything, and an implied behaviour beats an
inert control. The filling default stays `flex-start`, so an untouched row is unchanged.

### 1.5 Rest of the section panel, in order

```
Layout    Presets · [Items per row · Items Fit] · Content alignment · Full width
Style     Colour/Image/Video · Background colour · Overlay · Corner radius · Border · Shadow
Spacing   Spacing between columns · Padding (inner spacing)
Size      Height
Animations & Effects
```

**"Spacing between columns"** lives on the SECTION next to padding — the gap belongs to the
container, not the items.

---

## 2. Adding a section — the shape is chosen at ADD time (measured)

`+ Add Section` → **"What type of section?"** → **Layouts** (blank) / **Designed** / **AI-Generated**.
The Layouts route offers exactly ten:

```
LAYOUT_1COL         LAYOUT_2COLS        LAYOUT_3COLS
LAYOUT_2ROWS        LAYOUT_3ROWS
LAYOUT_1COL_2ROWS   LAYOUT_2COLS_1ROW   LAYOUT_1ROW_2COLS
LAYOUT_2COLS_2COLS  LAYOUT_2ROWS_1COL
```

A freshly added section starts at **0% padding**; template sections carry 2% / 6% / 2%.

**Empty sections get the identical Layout panel** — Presets, both alignment rows, nothing disabled.
These are STRUCTURAL controls: they describe how the box will lay out whatever goes in it, which is
a question you answer *before* putting anything there.

---

## 3. What to build in our builder

### 3.1 Separate SHAPE from DIRECTION

| Concept | Ours today | Should be |
|---|---|---|
| **Shape** — column/row counts | preset tiles (Columns/Grid/Three/Stacked) | keep tiles; they write `rows` |
| **Direction** — row vs stack | inferred from the tile | derived from the resulting shape via `isRowAxis(rows)`, and it is what drives the alignment vocabulary |
| **Fit** — fill vs natural width | implied by the chosen alignment | stays implied — see §1.4 |

### 3.2 Offer only presets that fit the item count

`presetsFor(n)` already does this and it matches Duda: never offer a shape that would draw an empty
cell. Extend it with the compound `2x1` shape at n = 3.

### 3.3 Rename the two alignment rows by DIRECTION

- ~~"Content alignment"~~ → **Horizontal alignment**
- ~~"Columns alignment"~~ → **Vertical alignment**

…both under one **Content alignment** label. Naming them by role forces the reader to work out which
physical direction each moves things — and the answer flips with the preset, so the label is wrong
half the time.

### 3.4 Option sets follow the axis

```
mainAxisOptions  = [start, center, end, space-between, space-around]   // 5
crossAxisOptions = [start, center, end, stretch]                       // 4

rowAxis:  horizontal = main,  vertical = cross
stack:    horizontal = cross, vertical = main
```

### 3.5 Which CSS property each row writes depends on the axis

```
rowAxis:  horizontal → justify-content,  vertical → align-items
stack:    horizontal → align-items,      vertical → justify-content
```

Mapping them unconditionally makes every control on a stacked section drive the wrong direction.

### 3.6 Remove the `hasContent` gate

Alignment must show on an empty section. Measured, §2.

### 3.7 Gap belongs to the container

"Spacing between items" goes in the **Spacing** group of the section/column — not in a per-widget
Arrangement pack.

---

## 4. Levels, and what each one gets

| Level | Shape (presets) | Direction | H-align | V-align | Gap |
|---|---|---|---|---|---|
| **Section** (built-in or added, empty or full) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Column** | ❌ | always a stack | ✅ cross (4) | ✅ main (5) | ❌ |
| **Widget** | ❌ | ❌ | ❌ | ❌ | ✅ only if it renders a LIST |

A widget's own box is placed by its column; giving it a second alignment control would be two
controls for one value.

---

## 5. Still unmeasured (do NOT guess)

1. **Column-level Layout.** I could not select a bare column in Duda, so the Column row above is
   reasoned from the flex model rather than measured.
2. **Widget-level alignment.** Whether a widget may align itself inside its column, or that is
   purely the column's job.
3. ~~**What `2x1` does at other counts.**~~ **ANSWERED — measured at n = 2, 3, 4.** See §1.1 for the
   rule. n = 5 and above are predicted from it, not observed.
