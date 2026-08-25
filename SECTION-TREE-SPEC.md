# Section structure — parent section down to the innermost row/column

> Written from the handwritten note of 25 Aug 2026. This file is the STRUCTURE. The drag mechanic,
> the blue line and the label chip stay in [SECTION-ROW-COLUMN-DRAG-PROMPT.md](SECTION-ROW-COLUMN-DRAG-PROMPT.md);
> this one says what the thing being dragged into actually is.

---

## 0. What the note asks for, in one line

> *"In short all level feasibility in row, col. split."*

Every container, at every depth, can be treated as a row or as a column, and can be split. Not
"sections have columns" — **containers all the way down**, one rule, applied the same at every
level.

---

## 1. One node type does all of it: a BOX

A section is a box. A column is a box. A row is a box. The cell a widget sits in is a box. They are
not four things — they are one thing in four positions.

⚠️ **This is the whole design.** The moment there are three kinds of container, "split" has to mean
three different things, the panel has to decide which of three editors to show, and the note's "all
level feasibility" becomes three features that drift apart. One type, one split, one panel.

```ts
interface Box {
  id: string;              // stable, minted once — 'sec-3', 'sec-3-b7'
  dir: 'row' | 'column';   // THE BEHAVIOUR — how this box lays its children out
  weight: number;          // its share of the parent's main axis
  children?: Box[];        // a BRANCH — sub-boxes
  el?: PlacedElement;      // a LEAF — one widget. Empty leaf = no children, no el.
}
```

A box is a **branch** or a **leaf**, never both. A section is just the root box of its own tree.

---

## 2. Behaviour — `dir` is literally `flex-direction`

The note: *"we can give section's behaviour — how user wants to treat sec? row / column."*

| Behaviour | Children run | Each child reads as | Split adds |
|---|---|---|---|
| `row` | left → right | a **Column** | one more Column |
| `column` | top → bottom | a **Row** | one more Row |

Which is the note's rule exactly:

> *"If row is selected as behaviour → will split in column.*
> *If Col. is selected as behaviour → will split it in rows."*

⚠️ **Flipping the behaviour never destroys anything.** The children and their order are untouched;
only the axis changes. That is what makes the note's *"sub section as column, but I can rearrange to
top & bottom"* a **one-click** operation rather than a rebuild — the same three sub-sections, laid
out the other way.

⚠️ **A box is named by its PARENT's behaviour, and the name is derived, never stored.** Parent is a
`row` ⇒ this child is a "Column". Parent is a `column` ⇒ it is a "Row". So the breadcrumb reads
`Section ❯ Column ❯ Row ❯ Text`, and flipping a parent renames its children automatically. A stored
name would go on saying "Column" about something that is now stacked.

---

## 3. Split — one operation, four levels deep, same everywhere

**On a leaf** — it becomes a branch with two children. The element that was there moves into the
first; the second is empty. (Word, Figma and Duda all do this; nobody expects their content to be
destroyed by a split.)

**On a branch** — one more empty child is appended.

**The direction is always the box's own `dir`.** Nothing else decides it — not where you clicked,
not what is inside, not the depth.

### Defaults, taken from the note

| Box | Default `dir` | Why — the note's words |
|---|---|---|
| A new section's root | `row` | *"sub section as column"* — the first split gives columns side by side |
| Any leaf | `column` | *"In sub section — always add row-wise widget"* — a second widget lands BELOW |

⚠️ A leaf holding one element has an *unobservable* direction — it only shows itself when a second
element arrives. That is deliberate: it means **"widgets always add row-wise" is not a special case,
it is just the leaf default**, and an admin who wants them side by side flips one control instead of
learning a different rule.

---

## 4. Ids — stable, minted, never positional

Today a column is `sec-3-c0`, counted across every row. Inserting a column therefore **renames every
column after it**, and `addColumn` has to re-key `items` to compensate — the comment in
`portalPageModel.ts` records that Duplicate once wrote a clone straight over its neighbour because
of exactly this: one element gained, one destroyed, no error, no way back.

⚠️ **In a tree, positional ids are far worse.** `widgetCfg`, `styles`, `placedText` and `icons` are
*all* keyed by node id. A split near the top of the tree would silently renumber an entire subtree
and every stored value would land on the wrong box — a page that quietly rearranges its own
styling, which is the single hardest class of bug to report.

So: **`sec-3-b7`, from a counter that only ever increases.** Position lives in the tree; identity
does not. Split, move, delete and reorder then touch no other store, and none of the four id-keyed
stores needs to know the tree exists.

**`nodeById` gets a registry, not a regex.** It currently synthesises a column from the id shape
(`/^(sec-\d+)-c\d+$/`) because that avoids threading the sections array through the canvas. A tree
cannot be read off an id, so boxes register themselves the way placed elements and collection items
already do — `registerBox(id, parent, dir, index, count)` — and `nodeById` stays a pure lookup.
Same pattern, same file, no new concept.

---

## 5. Limits

| Limit | Value | Why |
|---|---|---|
| Columns in one row | **4** | Matches the four action cards, the widest set the page has. Narrower than a quarter stops being readable. |
| Rows stacked in a column | none | A tall column of rows costs nothing; a wide row of columns costs readability. The cap belongs on one axis only. |
| Nesting depth | **4 below the section** — `Section ❯ Column ❯ Row ❯ Column ❯ Row` | Settled 25 Aug. Recursive either way; the cap is about how deep a page can get before nobody can read it. |
| Responsive | not modelled | Confirmed 25 Aug: desktop only, one weight per box. Logged in `future-tasks.md` so it is a decision rather than an omission. |

At a limit, **Split is disabled with the reason on it** — never missing, never a silent no-op. That
is how every other cap in this product behaves (the OS-upgrade single-select, the collection `max`).

---

## 6. What this changes on screen

Everything below already exists. None of it is a new surface — it is the existing affordances made
to follow `dir` instead of assuming "horizontal".

- **`ColumnAdders`** (the white `+` at left and right of a live column) becomes axis-aware: left/right
  on a `row` box, **top/bottom** on a `column` box. The centre `+` — "add an element here" — is
  unchanged.
- **The floating toolbar's `←→` / `↓↑`** already flips by kind. It now flips by the parent's `dir`,
  which is the same question asked correctly.
- **A Behaviour control** — `Row | Column` segmented — on every box's panel, in Layout.
- **A Split action** on the toolbar for containers, labelled with what it will do
  ("Split into columns" / "Split into rows") rather than a bare icon.
- **The drop targets** from the drag brief resolve to boxes instead of `-cN` columns; the blue line's
  orientation is the parent box's `dir`, which is the measured Duda rule in §2.1b of that file.

---

## 7. Migration — every existing layout survives exactly

`rows: number[][]` maps to a tree with no visual change:

| Today | Becomes |
|---|---|
| `[[1]]` | root `dir:'row'`, one empty leaf |
| `[[1,1]]` | root `dir:'row'`, two leaves |
| `[[1],[1]]` | root `dir:'column'`, two leaves |
| `[[1,1],[1]]` | root `dir:'column'` → [ box `dir:'row'` [leaf, leaf], leaf ] |

⚠️ **A single-row layout FLATTENS** — root becomes the row itself rather than a column containing one
row. Otherwise every two-column section would arrive one level deeper than it needs to be, and the
breadcrumb would read `Section ❯ Row ❯ Column ❯ Text` for the simplest shape on the page.

The ten `SECTION_LAYOUTS` tiles are unchanged — they are still drawn from `rows`, which now feeds
the migration instead of feeding the renderer.

---

## 8. Settled 25 Aug 2026

1. **Depth is capped at 4 below the section** — `Section > Column > Row > Column > Row`. The model
   is recursive, so unlimited was equally buildable; the cap is a product choice about how deep a
   page can get before nobody can read it or unpick it. At the limit **Split is disabled with the
   reason on it**, never missing and never a silent no-op.

2. **Split lives on the floating toolbar**, beside the existing `+`, labelled with what it will do
   ("Split into columns" / "Split into rows") rather than a bare icon. Every other placement action
   is already there, so it joins a set instead of starting a second one.

---

## 9. Scope of this pass

**In:** added sections (`sec-N`) and everything inside them, plus custom widgets built by adding a
new section — confirmed 25 Aug.

**Out:** the built-in bands (hero, Quick Actions, the live-data rows) keep exactly today's
behaviour. `LOCKED_ROWS` still fences Quick Actions, and it stays the single funnel every add route
ends at.
