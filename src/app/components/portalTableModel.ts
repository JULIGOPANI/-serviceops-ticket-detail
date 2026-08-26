/* The Table element's data model and command API.
 *
 * Split from the renderer on purpose: every structural operation is a pure function from one model
 * to the next, so "insert a column" can be reasoned about — and later undone as ONE step — without
 * knowing anything about handles, menus or the DOM. The names come from Tiptap
 * (TABLE-ELEMENT-PROMPT.md §3) so this and a ProseMirror-backed table stay interchangeable.
 *
 * ⚠️ `colspan`/`rowspan` are in the model from day one but nothing PRODUCES a value above 1 yet —
 * merge and split are the second pass. They are here rather than added later because every
 * operation below has to stay correct in their presence, and retro-fitting that is the thing the
 * brief calls the hardest requirement in the document. Writing the ops span-aware from the start
 * costs a few lines each; discovering later that eight of them assume a rectangular grid does not.
 */

export type CellAlign = 'left' | 'center' | 'right' | 'justify';
export type VertAlign = 'top' | 'middle' | 'bottom';

export interface TableCell {
  id: string;
  content: string;
  colspan: number;
  rowspan: number;
  isHeader: boolean;
  bg?: string;
  /** Per-cell TEXT colour. ⚠️ Separate from `bg`: a table cell has two colours worth setting and
   *  one control cannot mean both. */
  color?: string;
  textAlign?: CellAlign;
  verticalAlign?: VertAlign;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
  isHeader?: boolean;
}

export interface TableModel {
  rows: TableRow[];
  /** One per column, as a PERCENTAGE. Drives `<colgroup>`; see the note on `fitTableToWidth`. */
  colWidths: number[];
  headerRow: boolean;
  headerColumn: boolean;
  caption?: string;
  /** Monotonic id counter. ⚠️ Ids are MINTED, never positional — selection, the floating toolbar
   *  and the drag handles all key off them, and a positional id would re-point every one of them
   *  at a different cell the moment a row was inserted above. */
  next: number;
}

/* ⚠️ TEN, not eight. The brief's picker says 8×8; the task says 10×10 twice and it wins, and the
   note already on this widget explains why the ceiling exists at all: past about ten rows a static
   table wants search, sorting and paging, which means it wants to be a knowledge article rather
   than a bigger table editor. Same number caps the picker AND every later insert, so the limit
   cannot be walked around one row at a time. */
export const MAX_DIM = 10;

/* ── minting ─────────────────────────────────────────────────────────────── */

const mint = (m: { next: number }) => `tc${m.next++}`;

const blankCell = (m: { next: number }, isHeader = false): TableCell =>
  ({ id: mint(m), content: '', colspan: 1, rowspan: 1, isHeader });

/** Even shares that always total 100, whatever the column count divides into. */
export function evenWidths(cols: number): number[] {
  if (cols <= 0) return [];
  const base = Math.floor((100 / cols) * 100) / 100;
  const out = Array.from({ length: cols }, () => base);
  /* ⚠️ The remainder goes on the LAST column rather than being left off. Three columns at 33.33%
     leaves a 0.01% sliver of the container unpainted, which shows as a hairline the frame border
     does not cover. */
  out[cols - 1] = Math.round((100 - base * (cols - 1)) * 100) / 100;
  return out;
}

/* ── create ──────────────────────────────────────────────────────────────── */

export function insertTable({ rows = 3, cols = 3, withHeaderRow = true }: { rows?: number; cols?: number; withHeaderRow?: boolean } = {}): TableModel {
  const r = Math.min(Math.max(1, rows), MAX_DIM);
  const c = Math.min(Math.max(1, cols), MAX_DIM);
  const m: TableModel = { rows: [], colWidths: evenWidths(c), headerRow: withHeaderRow, headerColumn: false, next: 0 };
  m.rows = Array.from({ length: r }, (_, ri) => ({
    id: mint(m),
    cells: Array.from({ length: c }, () => blankCell(m, withHeaderRow && ri === 0)),
  }));
  return m;
}

/* ── geometry ────────────────────────────────────────────────────────────── */

/** The number of COLUMNS the grid actually has, counting spans rather than cell objects. */
export const columnCount = (m: TableModel): number =>
  Math.max(0, ...m.rows.map((r) => r.cells.reduce((n, c) => n + c.colspan, 0)));

export const rowCount = (m: TableModel): number => m.rows.length;

/** Which grid column each cell in a row starts at, so a cell can be addressed by column index even
 *  once spans exist. Returns one start index per cell, in cell order. */
export function cellStarts(row: TableRow): number[] {
  const out: number[] = [];
  let at = 0;
  row.cells.forEach((c) => { out.push(at); at += c.colspan; });
  return out;
}

/** The cell occupying grid column `col` of this row, or undefined where a span from another cell
 *  covers it. */
export function cellAt(row: TableRow, col: number): TableCell | undefined {
  const starts = cellStarts(row);
  const i = starts.findIndex((s, n) => col >= s && col < s + row.cells[n].colspan);
  return i < 0 ? undefined : row.cells[i];
}

/* ── limits ──────────────────────────────────────────────────────────────── */

/* ⚠️ These return a REASON, not a boolean. Every menu item that cannot apply stays visible and
   disabled with the reason on it (brief §10.6) — a missing item reads as a bug and an inert one
   reads as a worse bug. */
export const addRowBlocked = (m: TableModel): string | null =>
  (rowCount(m) >= MAX_DIM ? `A table holds ${MAX_DIM} rows at most` : null);
export const addColumnBlocked = (m: TableModel): string | null =>
  (columnCount(m) >= MAX_DIM ? `A table holds ${MAX_DIM} columns at most` : null);
export const deleteRowBlocked = (m: TableModel): string | null =>
  (rowCount(m) <= 1 ? 'A table needs at least one row' : null);
export const deleteColumnBlocked = (m: TableModel): string | null =>
  (columnCount(m) <= 1 ? 'A table needs at least one column' : null);

/* ── repair ──────────────────────────────────────────────────────────────── */

/** Bring every row to the same effective column count and keep `colWidths` in step.
 *
 *  ⚠️ Run after ANY structural operation. A ragged grid is not a rendering problem you can see and
 *  fix later — `table-layout: fixed` reads the colgroup, so one short row silently shifts every
 *  cell after it into the wrong column. */
export function fixTable(m: TableModel): TableModel {
  const cols = columnCount(m);
  if (!cols) return m;
  const next = { ...m, rows: m.rows.map((r) => ({ ...r, cells: [...r.cells] })) };
  next.rows.forEach((r) => {
    let width = r.cells.reduce((n, c) => n + c.colspan, 0);
    while (width < cols) { r.cells.push(blankCell(next)); width += 1; }
    /* Clip a span that runs off the right edge rather than dropping the cell — the content is the
       author's, the overhang is ours. */
    while (width > cols) {
      const last = r.cells[r.cells.length - 1];
      if (last.colspan > 1) { last.colspan -= 1; width -= 1; } else { r.cells.pop(); width -= 1; }
    }
  });
  if (next.colWidths.length !== cols) next.colWidths = evenWidths(cols);
  return next;
}

/* ── rows ────────────────────────────────────────────────────────────────── */

function insertRow(m: TableModel, index: number): TableModel {
  if (addRowBlocked(m)) return m;
  const next = { ...m, rows: [...m.rows] };
  const cols = columnCount(m) || 1;
  next.rows.splice(index, 0, { id: mint(next), cells: Array.from({ length: cols }, () => blankCell(next)) });
  return fixTable(next);
}

export const addRowBefore = (m: TableModel, index: number) => insertRow(m, index);
export const addRowAfter = (m: TableModel, index: number) => insertRow(m, index + 1);

export function deleteRow(m: TableModel, index: number): TableModel {
  if (deleteRowBlocked(m)) return m;
  const next = { ...m, rows: m.rows.filter((_, i) => i !== index) };
  /* ⚠️ The header follows the FIRST row, not the row that used to be first. Deleting row 0 with a
     header on would otherwise leave `headerRow: true` pointing at what was row 1 while that row's
     cells still say `isHeader: false` — the table renders a header-shaped row with body cells. */
  if (index === 0 && next.headerRow) next.rows[0] = { ...next.rows[0], cells: next.rows[0].cells.map((c) => ({ ...c, isHeader: true })) };
  return fixTable(next);
}

export function duplicateRow(m: TableModel, index: number): TableModel {
  if (addRowBlocked(m)) return m;
  const src = m.rows[index];
  if (!src) return m;
  const next = { ...m, rows: [...m.rows] };
  /* Content, spans AND cell styling all copied — a duplicate that dropped the colours would be a
     blank row wearing the original's shape. New ids, because two cells cannot share one. */
  const copy: TableRow = { ...src, id: mint(next), cells: src.cells.map((c) => ({ ...c, id: mint(next) })) };
  /* ⚠️ A duplicated HEADER row lands as a body row. Two header rows is not what "duplicate" means
     here, and `headerRow` names the first row only. */
  if (index === 0 && m.headerRow) copy.cells = copy.cells.map((c) => ({ ...c, isHeader: false }));
  next.rows.splice(index + 1, 0, copy);
  return fixTable(next);
}

export function moveRow(m: TableModel, index: number, dir: 'up' | 'down'): TableModel {
  const to = index + (dir === 'up' ? -1 : 1);
  return reorderRow(m, index, to);
}

/** Move the row at `from` so it sits at `to`. Shared by the menu and the drag handle so the two
 *  cannot disagree about what "between these two" means. */
export function reorderRow(m: TableModel, from: number, to: number): TableModel {
  if (from === to || to < 0 || to >= m.rows.length || from < 0 || from >= m.rows.length) return m;
  const rows = [...m.rows];
  const [moved] = rows.splice(from, 1);
  rows.splice(to, 0, moved);
  const next = { ...m, rows };
  /* ⚠️ The header is a POSITION, not a row. Dragging the header down makes the row that arrives at
     the top the header — otherwise the table shows header styling in the middle of its body and no
     header at the top, which is neither of the two things the user was choosing between. */
  if (next.headerRow) {
    next.rows = next.rows.map((r, i) => ({ ...r, cells: r.cells.map((c) => ({ ...c, isHeader: i === 0 })) }));
  }
  return next;
}

export function clearRowContent(m: TableModel, index: number, { resetAttrs = false } = {}): TableModel {
  const next = { ...m, rows: m.rows.map((r, i) => (i !== index ? r : {
    ...r,
    cells: r.cells.map((c) => ({
      ...c,
      content: '',
      ...(resetAttrs ? { bg: undefined, color: undefined, textAlign: undefined, verticalAlign: undefined } : {}),
    })),
  })) };
  return next;
}

/* ── columns ─────────────────────────────────────────────────────────────── */

function insertColumn(m: TableModel, col: number): TableModel {
  if (addColumnBlocked(m)) return m;
  const next = { ...m, rows: m.rows.map((r) => ({ ...r, cells: [...r.cells] })) };
  next.rows.forEach((r, ri) => {
    const starts = cellStarts(r);
    /* The insertion point is the first cell that STARTS at or after `col`. A cell whose span
       straddles the point grows instead of being cut in two — splitting somebody's merged cell is
       not what "insert a column here" offers to do. */
    let at = starts.findIndex((s) => s >= col);
    if (at < 0) at = r.cells.length;
    const straddling = starts.findIndex((s, i) => col > s && col < s + r.cells[i].colspan);
    if (straddling >= 0) { r.cells[straddling] = { ...r.cells[straddling], colspan: r.cells[straddling].colspan + 1 }; return; }
    r.cells.splice(at, 0, blankCell(next, next.headerRow && ri === 0));
  });
  next.colWidths = evenWidths(columnCount(next));
  return fixTable(next);
}

export const addColumnBefore = (m: TableModel, col: number) => insertColumn(m, col);
export const addColumnAfter = (m: TableModel, col: number) => insertColumn(m, col + 1);

export function deleteColumn(m: TableModel, col: number): TableModel {
  if (deleteColumnBlocked(m)) return m;
  const next = { ...m, rows: m.rows.map((r) => ({ ...r, cells: [...r.cells] })) };
  next.rows.forEach((r) => {
    const starts = cellStarts(r);
    const i = starts.findIndex((s, n) => col >= s && col < s + r.cells[n].colspan);
    if (i < 0) return;
    /* ⚠️ A cell SPANNING the deleted column shrinks; it is not removed. Removing it would take the
       neighbouring columns' content with it — the brief names this as the case implementations get
       wrong, and clipping is the defined outcome we chose. */
    if (r.cells[i].colspan > 1) r.cells[i] = { ...r.cells[i], colspan: r.cells[i].colspan - 1 };
    else r.cells.splice(i, 1);
  });
  next.colWidths = evenWidths(columnCount(next));
  return fixTable(next);
}

export function duplicateColumn(m: TableModel, col: number): TableModel {
  if (addColumnBlocked(m)) return m;
  const next = { ...m, rows: m.rows.map((r) => ({ ...r, cells: [...r.cells] })) };
  next.rows.forEach((r) => {
    const starts = cellStarts(r);
    const i = starts.findIndex((s, n) => col >= s && col < s + r.cells[n].colspan);
    if (i < 0) return;
    r.cells.splice(i + 1, 0, { ...r.cells[i], id: mint(next), colspan: 1 });
  });
  next.colWidths = evenWidths(columnCount(next));
  return fixTable(next);
}

export function moveColumn(m: TableModel, col: number, dir: 'left' | 'right'): TableModel {
  return reorderColumn(m, col, col + (dir === 'left' ? -1 : 1));
}

export function reorderColumn(m: TableModel, from: number, to: number): TableModel {
  const cols = columnCount(m);
  if (from === to || to < 0 || to >= cols || from < 0 || from >= cols) return m;
  const next = { ...m, rows: m.rows.map((r) => ({ ...r, cells: [...r.cells] })) };
  next.rows.forEach((r) => {
    const starts = cellStarts(r);
    const fi = starts.findIndex((s, n) => from >= s && from < s + r.cells[n].colspan);
    const ti = starts.findIndex((s, n) => to >= s && to < s + r.cells[n].colspan);
    if (fi < 0 || ti < 0 || fi === ti) return;
    const [moved] = r.cells.splice(fi, 1);
    r.cells.splice(ti, 0, moved);
  });
  const w = [...next.colWidths];
  const [mw] = w.splice(from, 1);
  w.splice(to, 0, mw);
  next.colWidths = w;
  return next;
}

export function clearColumnContent(m: TableModel, col: number, { resetAttrs = false } = {}): TableModel {
  return {
    ...m,
    rows: m.rows.map((r) => {
      const starts = cellStarts(r);
      const i = starts.findIndex((s, n) => col >= s && col < s + r.cells[n].colspan);
      if (i < 0) return r;
      const cells = [...r.cells];
      cells[i] = {
        ...cells[i],
        content: '',
        ...(resetAttrs ? { bg: undefined, color: undefined, textAlign: undefined, verticalAlign: undefined } : {}),
      };
      return { ...r, cells };
    }),
  };
}

/* ── headers ───────────────────────────────────────────────────────────────
 * ⚠️ There is no `toggleHeaderRow`/`toggleHeaderColumn` here. Which row and which column are
 * headers is CONFIG (`headerRow` / `firstColumn`), written by the panel switch and by the handle
 * menu alike and applied to the model by `withHeaders` on every read — one value, two affordances.
 * A model-level toggle would be a third place to set it, and the last caller would win. */

export function toggleHeaderCell(m: TableModel, cellId: string): TableModel {
  return {
    ...m,
    rows: m.rows.map((r) => ({ ...r, cells: r.cells.map((c) => (c.id === cellId ? { ...c, isHeader: !c.isHeader } : c)) })),
  };
}

/* ── cells ───────────────────────────────────────────────────────────────── */

export function setCellContent(m: TableModel, cellId: string, content: string): TableModel {
  return { ...m, rows: m.rows.map((r) => ({ ...r, cells: r.cells.map((c) => (c.id === cellId ? { ...c, content } : c)) })) };
}

/** Apply one attribute across a set of cells — the floating toolbar's whole job. */
export function setCellAttribute(m: TableModel, ids: string[], name: 'bg' | 'color' | 'textAlign' | 'verticalAlign', value: unknown): TableModel {
  const set = new Set(ids);
  return {
    ...m,
    rows: m.rows.map((r) => ({
      ...r,
      /* An explicit `undefined` CLEARS the attribute — that is how "no background" is expressed,
         and it has to be distinguishable from "not passed". */
      cells: r.cells.map((c) => (set.has(c.id) ? { ...c, [name]: value } as TableCell : c)),
    })),
  };
}

export function clearCells(m: TableModel, ids: string[], { resetAttrs = false } = {}): TableModel {
  const set = new Set(ids);
  return {
    ...m,
    rows: m.rows.map((r) => ({
      ...r,
      cells: r.cells.map((c) => (set.has(c.id)
        ? { ...c, content: '', ...(resetAttrs ? { bg: undefined, color: undefined, textAlign: undefined, verticalAlign: undefined } : {}) }
        : c)),
    })),
  };
}

/** Sort the BODY rows by one column's text.
 *
 * ⚠️ The header never moves — it is not data, and a sort that carried it into the middle of the
 * table would be sorting the wrong thing. ⚠️ Blank cells go LAST in both directions, not first in
 * one of them: an empty cell is an absence, and an absence has no place in an ordering — putting it
 * at the end is the only answer that reads the same whichever way you sorted.
 * ⚠️ Numbers compare as numbers where both sides are numeric, so 9 sorts before 10. */
export function sortByColumn(m: TableModel, col: number, dir: 'asc' | 'desc'): TableModel {
  const head = m.headerRow ? m.rows.slice(0, 1) : [];
  const body = m.headerRow ? m.rows.slice(1) : [...m.rows];
  const text = (r: TableRow) => (cellAt(r, col)?.content ?? '').trim();
  const sorted = [...body].sort((a, b) => {
    const x = text(a); const y = text(b);
    if (!x && !y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    const nx = Number(x); const ny = Number(y);
    const cmp = (!Number.isNaN(nx) && !Number.isNaN(ny))
      ? nx - ny
      : x.localeCompare(y, undefined, { sensitivity: 'base', numeric: true });
    return dir === 'asc' ? cmp : -cmp;
  });
  return { ...m, rows: [...head, ...sorted] };
}

/* ── merge and split ──────────────────────────────────────────────────────
 *
 * ⚠️ ACROSS a row only — `colspan`. Merging DOWN is refused with a reason, and that is a decision
 * rather than an omission. A `rowspan` means the rows beneath no longer tile their own width, so
 * every function that assumes "row N has one cell per column" has to learn a coverage map first:
 * `fixTable`, `cellAt`, `cellStarts`, `columnCount`, insert/delete column, and both reorders. The
 * brief names this as the hardest requirement in the document and says to decide the outcome
 * deliberately or refuse with a reason — this refuses, out loud, on the control.
 * `rowspan` stays in the model and the renderer still emits it, so the day that map is written
 * nothing else has to change. */

/** Why these cells cannot be merged, or null when they can. */
export function mergeBlockedBecause(m: TableModel, r0: number, r1: number, c0: number, c1: number): string | null {
  if (r0 !== r1) return 'Merging down is not supported yet — merge cells across one row';
  if (c0 === c1) return 'Select more than one cell to merge';
  const row = m.rows[r0];
  if (!row) return 'Nothing selected';
  return null;
}

/** Merge one row's selected cells into a single cell spanning them.
 *
 *  ⚠️ Content is JOINED, not discarded. Merging three cells that each say something and keeping only
 *  the leftmost is a silent deletion — and the one thing you cannot do about a silent deletion is
 *  notice it. Blank cells contribute nothing, so the common case (one filled cell, two empty) reads
 *  exactly as expected. */
export function mergeCells(m: TableModel, r0: number, r1: number, c0: number, c1: number): TableModel {
  if (mergeBlockedBecause(m, r0, r1, c0, c1)) return m;
  const next = { ...m, rows: m.rows.map((r) => ({ ...r, cells: [...r.cells] })) };
  const row = next.rows[r0];
  const starts = cellStarts(row);
  const first = starts.findIndex((s, i) => c0 >= s && c0 < s + row.cells[i].colspan);
  const last = starts.findIndex((s, i) => c1 >= s && c1 < s + row.cells[i].colspan);
  if (first < 0 || last < 0 || last < first) return m;
  const taken = row.cells.slice(first, last + 1);
  const span = taken.reduce((n, c) => n + c.colspan, 0);
  const merged: TableCell = {
    ...taken[0],
    colspan: span,
    content: taken.map((c) => c.content.trim()).filter(Boolean).join(' '),
  };
  row.cells.splice(first, taken.length, merged);
  return next;
}

/** Split a merged cell back into one cell per column it covered.
 *
 *  ⚠️ The content stays in the FIRST of the new cells rather than being divided. There is no honest
 *  way to decide which words belonged to which column, and guessing at a split point would scatter
 *  somebody's sentence across three cells. */
export function splitCell(m: TableModel, cellId: string): TableModel {
  const next = { ...m, rows: m.rows.map((r) => ({ ...r, cells: [...r.cells] })) };
  for (const row of next.rows) {
    const i = row.cells.findIndex((c) => c.id === cellId);
    if (i < 0) continue;
    const cell = row.cells[i];
    if (cell.colspan <= 1) return m;
    const extra = Array.from({ length: cell.colspan - 1 }, () => blankCell(next, cell.isHeader));
    row.cells.splice(i, 1, { ...cell, colspan: 1 }, ...extra);
    return next;
  }
  return m;
}

/** True when this cell spans more than one column — what makes Split available. */
export const isMerged = (m: TableModel, cellId: string): boolean =>
  m.rows.some((r) => r.cells.some((c) => c.id === cellId && c.colspan > 1));

/* ── sizing ──────────────────────────────────────────────────────────────── */

export const MIN_COL_PCT = 5;

/** Resize the boundary between `col` and `col + 1`, taking from one and giving to the other.
 *
 *  ⚠️ The pair always totals what it did before, so the table stays exactly 100% wide and no other
 *  column moves. Dragging one boundary and watching four columns shuffle is what happens when each
 *  width is set independently and the remainder is left to the browser. */
export function resizeColumn(m: TableModel, col: number, deltaPct: number): TableModel {
  const w = [...m.colWidths];
  if (col < 0 || col + 1 >= w.length) return m;
  const pair = w[col] + w[col + 1];
  const a = Math.min(Math.max(MIN_COL_PCT, w[col] + deltaPct), pair - MIN_COL_PCT);
  w[col] = Math.round(a * 100) / 100;
  w[col + 1] = Math.round((pair - a) * 100) / 100;
  return { ...m, colWidths: w };
}

/** Every column an equal share of the container. ⚠️ This IS "fit to width": widths are stored as
 *  percentages, so filling the container exactly is what equal shares already mean. */
export const fitTableToWidth = (m: TableModel): TableModel => ({ ...m, colWidths: evenWidths(columnCount(m)) });

/** Write a plain grid of strings back onto a model, keeping every cell's identity and styling where
 *  the shape still has a cell for it.
 *
 *  ⚠️ This is what keeps the panel's sheet editor and the canvas ONE editor rather than two. The
 *  sheet used to read and write `cfg.rows` while the canvas owns `cfg.table`; once a table had been
 *  touched on the canvas, every edit typed into the sheet was stored and silently ignored — the
 *  exact "two controls for one value, and the one you are not looking at wins" failure the brief's
 *  §6 opens by forbidding. */
export function applyGrid(base: TableModel, grid: string[][]): TableModel {
  const rows = Math.min(grid.length || 1, MAX_DIM);
  const cols = Math.min(Math.max(1, ...grid.map((r) => r.length)), MAX_DIM);
  const next: TableModel = { ...base, rows: [], colWidths: base.colWidths, next: base.next };
  next.rows = Array.from({ length: rows }, (_, ri) => {
    const old = base.rows[ri];
    return {
      id: old?.id ?? mint(next),
      cells: Array.from({ length: cols }, (_, ci) => {
        const cell = old && cellAt(old, ci);
        /* Reuse the cell OBJECT where one exists, so its colour, alignment and header flag survive
           an edit to its text — a sheet that reset the styling of every cell it touched would make
           bulk entry destructive. */
        return cell
          ? { ...cell, colspan: 1, rowspan: 1, content: grid[ri]?.[ci] ?? '' }
          : { ...blankCell(next, next.headerRow && ri === 0), content: grid[ri]?.[ci] ?? '' };
      }),
    };
  });
  if (next.colWidths.length !== cols) next.colWidths = evenWidths(cols);
  return fixTable(next);
}

/** The model as a plain grid of strings — what the sheet editor shows. */
export const gridOf = (m: TableModel): string[][] =>
  m.rows.map((r) => r.cells.flatMap((c) => [c.content, ...Array.from({ length: c.colspan - 1 }, () => '')]));

/** Resize a table to R × C, keeping whatever content still has a cell.
 *
 *  ⚠️ It does NOT rebuild from scratch. Choosing a size from the picker on a table you have already
 *  filled in should not empty it — growing adds blank cells, shrinking drops only what falls outside
 *  the new shape, and everything inside it keeps its text, its colour and its alignment. */
export function resizeTable(base: TableModel, rows: number, cols: number): TableModel {
  const r = Math.min(Math.max(1, rows), MAX_DIM);
  const c = Math.min(Math.max(1, cols), MAX_DIM);
  const grid = gridOf(base);
  const next = Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => grid[i]?.[j] ?? ''));
  return applyGrid(base, next);
}

/* ── reading older config ────────────────────────────────────────────────── */

/** Build a model from whatever the widget's config currently holds.
 *
 *  ⚠️ Three shapes have to land here, because two of them are already on real pages: the new
 *  `table` model, the `{ id, cells: string[] }` rows the sheet editor wrote, and the bare
 *  `string[][]` before that. A migration script would have been a fourth thing to remember to run;
 *  reading all three at the point of use cannot be forgotten. */
export function tableFrom(cfg: Record<string, unknown>): TableModel {
  const stored = cfg.table as TableModel | undefined;
  if (stored?.rows?.length) {
    /* Trust it, but never trust its width array — a column added by an older build would leave the
       colgroup one short and shift every cell after it. */
    const m = stored.colWidths?.length === columnCount(stored) ? stored : fixTable({ ...stored, colWidths: [] });
    return withHeaders(m, cfg);
  }
  const legacy: string[][] = ((cfg.rows as unknown[]) ?? []).map((r) =>
    (Array.isArray(r) ? (r as string[]) : ((r as Record<string, unknown>)?.cells as string[]) ?? []));
  if (!legacy.length) return insertTable({ rows: 3, cols: 3, withHeaderRow: cfg.headerRow !== false });
  const headerRow = cfg.headerRow !== false;
  const m: TableModel = { rows: [], colWidths: [], headerRow, headerColumn: cfg.firstColumn === true, next: 0 };
  m.rows = legacy.map((cells, ri) => ({
    id: mint(m),
    cells: cells.map((content) => ({ ...blankCell(m, headerRow && ri === 0), content })),
  }));
  m.colWidths = evenWidths(columnCount(m));
  return fixTable(m);
}

/** Force the two header flags to match CONFIG.
 *
 *  ⚠️ Headers live in config, not in the model, and this is the only place that is enforced. Both
 *  the panel's toggles and the handle menu's write `headerRow` / `firstColumn`, so the two are one
 *  value with two affordances. Storing them on the model as well would give the menu and the panel
 *  a copy each, and whichever was touched last would win — which is how a table ends up showing a
 *  header-styled row with a panel switch that says there is no header. */
function withHeaders(m: TableModel, cfg: Record<string, unknown>): TableModel {
  const headerRow = cfg.headerRow !== false;
  const headerColumn = cfg.firstColumn === true;
  if (m.headerRow === headerRow && m.headerColumn === headerColumn) return m;
  return {
    ...m,
    headerRow,
    headerColumn,
    rows: m.rows.map((r, ri) => ({
      ...r,
      cells: r.cells.map((c, ci) => ({ ...c, isHeader: (headerRow && ri === 0) || (headerColumn && ci === 0) })),
    })),
  };
}
