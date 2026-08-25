# Prompt — Build an advanced Table element (Tiptap "Table Node" parity)

> Hand this whole file to the project that will build the Table element. It is written as the brief,
> not as notes about the brief. Reference: https://tiptap.dev/docs/ui-components/node-components/table-node
> and https://tiptap.dev/docs/editor/extensions/nodes/table

---

## 0. What I want

Build a **table element that behaves like a real spreadsheet-grade table editor**, not a static grid
that can only be filled in from a side panel. I have used Tiptap's Table Node demo and I want that
level of capability: hover handles on every row and column, drag to reorder, a grid size picker on
insert, cell selection, merge and split, per-cell alignment and background, sort, duplicate, move,
clear, header toggles, column resizing, fit-to-width — all of it working on the canvas, with the
settings panel handling only what the canvas cannot express.

**Every item in §5 must actually work.** A control that renders but changes nothing is a defect, not
a placeholder. If something is genuinely out of scope for this pass, remove the control rather than
shipping it inert.

---

## 1. Implementation route (pick one, then follow the same contract)

- **Inside a rich-text / ProseMirror editor** → build on `@tiptap/extension-table` + `@tiptap/pm/tables`
  and the `table-node` UI kit (`npx @tiptap/cli@latest add table-node`). You get `TableKit`,
  `TableHandleExtension`, `NodeBackground`, `NodeAlignment` and the selection plumbing for free.
- **Standalone React element** (page builder / widget) → implement the same command surface and the
  same interaction model yourself. Do not invent different names: §3's command list is the contract
  either way, so the two can be swapped later without rewriting callers.

Stack assumption: React + TypeScript + Tailwind. Adjust if yours differs, but keep the names.

---

## 2. Data model

```ts
type CellAlign  = 'left' | 'center' | 'right' | 'justify'
type VertAlign  = 'top'  | 'middle' | 'bottom'

type TableCell = {
  id: string
  content: string          // rich text if the host supports it, plain string otherwise
  colspan: number          // default 1
  rowspan: number          // default 1
  isHeader: boolean        // this cell renders as <th>
  bg?: string              // per-cell background colour
  textAlign?: CellAlign
  verticalAlign?: VertAlign
}

type TableRow   = { id: string; cells: TableCell[]; isHeader?: boolean }

type TableModel = {
  rows: TableRow[]
  colWidths: number[]      // px or %, one per column — drives <colgroup>
  headerRow: boolean
  headerColumn: boolean
  caption?: string
}
```

Rules:
- **`colgroup` + `table-layout: fixed` always.** Column width is a property of the column, not of
  whatever the longest cell in it happens to contain.
- **`colspan`/`rowspan` are first-class.** Every operation below (insert, delete, move, sort,
  resize, select) must stay correct in the presence of merged cells — that is the single hardest
  requirement in this document and the one most implementations get wrong.
- A structural repair pass (`fixTables()`) runs after any operation that could leave a ragged grid:
  every row ends up with the same effective column count, orphaned spans are clipped.

---

## 3. Command API (the contract)

Names taken from Tiptap so the two are interchangeable. Every one returns whether it ran, and every
one is undoable as a **single** step.

**Create / destroy**
- `insertTable({ rows = 3, cols = 3, withHeaderRow = true })`
- `deleteTable()`
- `fixTables()` — inspect and repair every table in the document

**Columns**
- `addColumnBefore()` · `addColumnAfter()` · `deleteColumn()`
- `toggleHeaderColumn()`

**Rows**
- `addRowBefore()` · `addRowAfter()` · `deleteRow()`
- `toggleHeaderRow()`

**Cells**
- `mergeCells()` — merge all selected cells into one
- `splitCell()` — split a merged cell back apart
- `mergeOrSplit()` — merge when several are selected, split when one is
- `toggleHeaderCell()`
- `setCellAttribute(name, value)` — e.g. `backgroundColor`, `textAlign`, `verticalAlign`
- `setCellSelection({ anchorCell, headCell })` — programmatic rectangular selection

**Navigation**
- `goToNextCell()` · `goToPreviousCell()`

**Beyond the base extension — these are the Table Node UI features and they matter most to me:**
- `moveRow(index, 'up' | 'down')` · `moveColumn(index, 'left' | 'right')`
- `duplicateRow(index)` · `duplicateColumn(index)`
- `sortByColumn(index, 'asc' | 'desc')` — **header rows are excluded from the sort, and empty cells
  always sort to the end**, in both directions
- `clearRowContent(index, { resetAttrs })` · `clearColumnContent(index, { resetAttrs })` —
  `resetAttrs` also clears the cell's colour and alignment, not just its text
- `alignCells(value, 'textAlign' | 'verticalAlign')` — applies to the whole current selection
- `fitTableToWidth()` — recompute `colWidths` so the table exactly fills its container

---

## 4. On-canvas interaction — the part I care most about

This is what the demo does and what a settings panel cannot replace. Build all of it.

**4.1 Insert — visual grid picker.** The insert button opens an **8 × 8 hover grid**; hovering
highlights the R × C the click will produce and the label reads the live dimensions ("4 × 3"). A
`maxRows` / `maxCols` prop caps it (default 8 each). `onInserted(rows, cols)` fires after insert.

**4.2 Row and column handles.** Hovering the table shows a thin **handle bar above every column and
left of every row**. A handle: highlights its whole row/column on hover, **selects** it on click,
**drags to reorder** it, and **opens the handle menu** on click of its chevron or on right-click.
Reordering shows a live drop indicator between the two neighbours it will land between.

**4.3 Handle menu.** The menu that opens off a row/column handle contains, in this order and with
irrelevant items *disabled with a reason* rather than hidden:
Insert before · Insert after · Duplicate · Move up/left · Move down/right · Sort ascending ·
Sort descending · Clear content · Header row/column toggle · Cell background · Alignment · Delete.

**4.4 Cell selection.** Click-and-drag across cells selects a **rectangle**; Shift+click extends it;
clicking a handle selects the whole row/column; a select-all corner cell (top-left of the handle
rails) selects the table. Selected cells get a tinted fill and a single continuous stroke around the
outside of the region — not one border per cell.

**4.5 Column resize.** A drag handle sits on every column boundary (`handleWidth: 5`, `cellMinWidth: 25`,
`lastColumnResizable: true`). Dragging shows a live guide line, respects the minimum, and writes to
`colWidths`. Double-clicking a boundary auto-fits that column to its content.

**4.6 Extend buttons.** A **`+` at the right edge and a `+` at the bottom edge** append a column or a
row in one click. They appear on table hover only.

**4.7 Floating cell toolbar.** With a cell selection live, a floating toolbar offers: merge/split,
horizontal align (left/center/right), vertical align (top/middle/bottom), cell background colour,
header toggle, clear. It flips above/below to stay on screen (use a positioning lib — Floating UI or
equivalent) and never covers the selection it describes.

**4.8 Fit to width.** One button, in the table's own toolbar, that redistributes column widths so the
table exactly fills its container.

---

## 5. Functionality checklist — every one must work

Tick these off in the browser, not in the build log.

**Structure**
1. Insert table with chosen R × C, with or without a header row
2. Insert column before / after (at cursor, and at any index from a handle)
3. Insert row before / after (same)
4. Delete row · delete column · delete table
5. Duplicate row · duplicate column (content, spans and cell styling all copied)
6. Move row up/down · move column left/right (by menu **and** by dragging the handle)
7. Sort by a column ascending / descending — headers excluded, blanks last
8. Clear row / column content, with an optional "also reset colours and alignment"
9. Automatic structure repair after any of the above

**Cells**
10. Merge selected cells · split a merged cell · merge-or-split as one toggle
11. Per-cell background colour (and clearing it back to none)
12. Per-cell horizontal alignment: left / center / right / justify
13. Per-cell vertical alignment: top / middle / bottom
14. Toggle an individual cell to a header cell
15. Cell content editing: text, and rich text where the host supports it

**Headers**
16. Toggle first row as header · toggle first column as header — both independently
17. Header cells render as `<th>` with `scope="col"` / `scope="row"`

**Sizing**
18. Drag-resize any column boundary, minimum width enforced
19. Double-click a boundary to auto-fit that column
20. Fit whole table to container width
21. Horizontal scroll when the table is wider than its container — the *table* scrolls inside its own
    container, the page never scrolls sideways

**Selection**
22. Rectangular cell selection by drag and by Shift+click
23. Whole row / whole column / whole table selection
24. Copy and paste a cell range — including pasting a range from Excel or Google Sheets, which must
    map into cells rather than landing as one blob of text

**Presentation**
25. Optional caption / title above the table
26. Striped rows, via two row background colours rather than a stripe switch
27. Border control that distinguishes the **frame** (the box around the table) from the **grid lines**
    (between cells) — one switch answering for both is wrong
28. Cell padding
29. Header and body typography set independently (family, weight, size, colour, bold/italic/underline)

---

## 6. Settings panel

The panel owns only what the canvas cannot express. Anything with a handle, a drag or a floating
control on the canvas must **not** get a second control in the panel — two controls for one value
means the one you are not looking at wins the last write.

- **Content**: caption/title, "first row is a header", "first column is a header", and a
  full-grid sheet editor for bulk entry (paste from a spreadsheet lands here correctly).
- **Style — Header** and **Style — Rows** as two states of one segmented control: background,
  font family, weight, size, colour, format chips.
- **Table**: cell padding, default alignment, horizontal-scroll-on-narrow.
- **Frame**: border width/colour/radius for the outer box, separately from the grid lines.
- **Not in the panel**: column widths, row order, merges, per-cell colour, per-cell alignment.
  Those are canvas gestures.

---

## 7. Keyboard

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | next / previous cell — `Tab` in the last cell **appends a new row** |
| `Arrow keys` | move the caret; at a cell edge, move to the adjacent cell |
| `Shift+Arrow` | extend the cell selection |
| `Ctrl/Cmd+A` | select cell → select table (progressive) |
| `Enter` | new line inside the cell |
| `Backspace` / `Delete` on a selection | clear the selected cells' content |
| `Ctrl/Cmd+Z` / `Shift+Z` | undo / redo — every operation above is one step |

Full keyboard reachability for every handle, menu item and resize handle. Nothing may be
mouse-only.

---

## 8. Accessibility

- Real `<table>` / `<thead>` / `<tbody>` / `<th scope>` / `<td>` — never divs pretending.
- `aria-label` on every handle, menu item and resize handle, naming the row/column it acts on
  ("Column 3 options", not "options").
- Menus are proper menus: roving focus, `Escape` closes and returns focus to the trigger.
- Selection state announced via `aria-selected` on the cells in the region.
- Focus visible on every interactive affordance, including the resize handles.

---

## 9. Theming

Expose CSS custom properties so the table can be reskinned without touching the component, and
support a `.dark` class for dark mode:

```
--tt-table-border-color
--tt-table-selected-bg
--tt-table-selected-stroke
--tt-table-column-resize-handle-bg
--tt-table-cell-padding
--tt-table-handle-bg-color
--tt-table-extend-icon-color
--tt-table-margin-block
--tt-table-pad-inline-start / --tt-table-pad-inline-end
--tt-table-pad-block-start  / --tt-table-pad-block-end
```

---

## 10. Rules that must hold

1. **Merged cells never break an operation.** Deleting a column that a merged cell spans, sorting a
   table containing one, moving a row through one — each has a defined, correct outcome. Decide it
   deliberately (clip the span, or refuse with a reason); do not leave it to chance.
2. **Sorting never moves a header** and never scatters blanks through the middle.
3. **`table-layout: fixed` + `colgroup`.** Column widths are data, not a consequence of content.
4. **The table scrolls, the page does not.** Overflow lives on the table's own wrapper.
5. **One undo step per user action.** A merge is one Ctrl+Z, not four.
6. **Every menu item that cannot apply is disabled with a reason on it** — never silently absent, and
   never present-but-inert.
7. **Paste from a spreadsheet maps to cells.** This is the single most common real-world entry path
   and pasting a 4 × 6 range must produce a 4 × 6 range.
8. **If a component takes a menu or renderer as a prop, define it at module scope** (or memoise it).
   An inline arrow function creates a new component type every render and will throw
   "Maximum update depth exceeded".

---

## 11. Definition of done

Demonstrate, in a browser, on one table:

- Insert 4 × 4 from the grid picker → drag column 2's handle to position 4 → the header follows
- Merge a 2 × 2 block → split it → both are one undo step each
- Sort by column 3 descending with one blank cell present → header stays put, blank lands last
- Resize column 1 to the minimum, then Fit to width → all four columns are equal
- Select a 2 × 3 region → set a background colour and centre-align → both apply to exactly six cells
- Paste a 3 × 5 range copied from Excel → lands as 15 cells
- Do the entire above sequence with the keyboard only
- Reload: every width, merge, colour and alignment survives

---

## 12. Non-goals for this pass

Formulas, sorting persisted as a view rather than a mutation, filtering, pagination inside the table,
and binding the table to a live data source. This is an **authored** table: short, stable content.
Past roughly ten rows the right answer is a data-bound list, not a bigger table editor.
