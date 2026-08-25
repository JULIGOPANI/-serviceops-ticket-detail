/* The Table element — a spreadsheet-grade editor on the canvas, not a grid filled in from a panel.
 *
 * Everything structural is a gesture here: the grid picker on insert, the row and column handles,
 * drag-to-reorder, the boundary resize, the extend buttons, the rectangular cell selection and the
 * floating toolbar. The panel keeps what a gesture cannot express (TABLE-ELEMENT-PROMPT.md §6).
 *
 * ⚠️ THE HANDLES ARE AN OVERLAY, not table children. A <div> anywhere between <table>, <tbody> and
 * <tr> takes the row out of the table box model — each row becomes its own anonymous table, the
 * columns stop lining up and every cell sizes to its own longest word. This project has already
 * been bitten by exactly that (the note on `Sel` never wrapping a <tr>). So the rails are absolutely
 * positioned over a measured geometry, and the <table> underneath stays a real, unpolluted table.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown,
  Copy, Eraser, Heading, Maximize2, Plus, Trash2,
} from 'lucide-react';
import { useCanvas } from './PortalCanvas';
import { PortalColorPicker } from './PortalColorPicker';
import {
  MAX_DIM, addColumnAfter, addColumnBefore, addColumnBlocked, addRowAfter, addRowBefore,
  addRowBlocked, cellAt, cellStarts, clearCells, clearColumnContent, clearRowContent, columnCount,
  deleteColumn, deleteColumnBlocked, deleteRow, deleteRowBlocked, duplicateColumn, duplicateRow,
  fitTableToWidth, insertTable, moveColumn, moveRow, reorderColumn, reorderRow, resizeColumn,
  setCellAttribute, setCellContent, tableFrom, toggleHeaderCell,
} from './portalTableModel';
import type { CellAlign, TableModel, VertAlign } from './portalTableModel';

type Cfg = Record<string, unknown>;

/* ── the 10 × 10 insert picker ───────────────────────────────────────────── */

/** ⚠️ TEN, not the brief's eight — the task says 10×10 and the same number is the hard ceiling on
 *  every later insert, so the picker cannot offer a shape the table would then refuse to keep. */
export function TableGridPicker({ onPick, onCancel }: { onPick: (rows: number, cols: number) => void; onCancel?: () => void }) {
  const [over, setOver] = useState<{ r: number; c: number } | null>(null);
  const label = over ? `${over.r} × ${over.c}` : 'Insert table';
  return (
    <div className="inline-block rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10)]">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${MAX_DIM}, 16px)` }}
        onMouseLeave={() => setOver(null)}
      >
        {Array.from({ length: MAX_DIM * MAX_DIM }).map((_, i) => {
          const r = Math.floor(i / MAX_DIM) + 1;
          const c = (i % MAX_DIM) + 1;
          const on = !!over && r <= over.r && c <= over.c;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${r} by ${c}`}
              onMouseEnter={() => setOver({ r, c })}
              onClick={() => onPick(r, c)}
              className={`size-4 rounded-[2px] border transition-colors ${
                on ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#D9E0EA] bg-white hover:border-[#3D8BD0]'
              }`}
            />
          );
        })}
      </div>
      {/* The label reads the LIVE dimensions, so the number is decided before the click rather than
          discovered after it. */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-[#364658]">{label}</span>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[12px] text-[#6B7280] hover:text-[#364658]">Cancel</button>
        )}
      </div>
    </div>
  );
}

/* ── geometry, measured ──────────────────────────────────────────────────── */

interface Geo { x: number[]; w: number[]; y: number[]; h: number[]; width: number; height: number }

/* ── the handle menu ─────────────────────────────────────────────────────── */

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  run?: () => void;
  /** Disabled WITH a reason on it — never hidden, never inert (§10.6). */
  blocked?: string | null;
  divider?: boolean;
}

function HandleMenu({ items, x, y, onClose }: { items: MenuItem[]; x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', away);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('mousedown', away); window.removeEventListener('keydown', esc); };
  }, [onClose]);
  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: x, top: y }}
      className="absolute z-[70] min-w-[196px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10)]"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it, i) => (
        <div key={it.label + i}>
          {it.divider && <div className="my-1 h-px bg-[#F1F5F9]" />}
          <button
            type="button"
            role="menuitem"
            disabled={!!it.blocked}
            title={it.blocked ?? undefined}
            onClick={() => { if (!it.blocked) { it.run?.(); onClose(); } }}
            className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] ${
              it.blocked ? 'cursor-not-allowed text-[#C3CBD6]' : 'text-[#364658] hover:bg-[#F5F7FA]'
            }`}
          >
            <span className="flex size-4 items-center justify-center text-current">{it.icon}</span>
            {it.label}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── the element ─────────────────────────────────────────────────────────── */

export function PortalTable({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { enabled, setCfg } = useCanvas();
  const model = useMemo(() => tableFrom(cfg), [cfg]);
  const cols = columnCount(model);
  const rows = model.rows.length;

  /* ⚠️ Every write goes through here, so the whole table is ONE config key. Undo already snapshots
     widget config, which is what makes a merge or a reorder a single Ctrl+Z rather than one step
     per cell touched. */
  const write = useCallback((m: TableModel) => setCfg?.(nodeId, { table: m }), [setCfg, nodeId]);

  /* A table that has never been given a size shows the picker instead of a default 3×3 — the shape
     is the first decision, and guessing it means the first act is always to correct the guess. */
  const [picking, setPicking] = useState(false);
  const fresh = !cfg.table && !(cfg.rows as unknown[])?.length;

  const wrapRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ kind: 'row' | 'col'; index: number; x: number; y: number } | null>(null);
  const [sel, setSel] = useState<{ r0: number; c0: number; r1: number; c1: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ kind: 'row' | 'col'; from: number; to: number } | null>(null);
  /* ⚠️ The colour popover PORTALS itself to the body and positions from the trigger’s viewport
     rect, so what is stored here is that rect — not a position of our own. Positioning it inside
     this element would clip it the moment the table sat near the bottom of the design panel. */
  const [colorAt, setColorAt] = useState<DOMRect | null>(null);
  const dragRef = useRef<typeof drag>(null);
  dragRef.current = drag;

  /* ── measure ──
     ⚠️ Read off the RENDERED cells, not computed from colWidths. The two agree in the simple case,
     but a percentage of a container that has not laid out yet is zero — and the rails would then
     draw at the left edge for one frame every time the panel is resized. */
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const table = tableRef.current;
    if (!wrap || !table) return;
    const base = wrap.getBoundingClientRect();
    const firstRow = table.tBodies[0]?.rows[0] ?? table.tHead?.rows[0];
    if (!firstRow) return;
    const x: number[] = []; const w: number[] = [];
    [...firstRow.cells].forEach((c) => {
      const r = c.getBoundingClientRect();
      x.push(r.left - base.left); w.push(r.width);
    });
    const y: number[] = []; const h: number[] = [];
    const allRows = [...(table.tHead?.rows ?? []), ...(table.tBodies[0]?.rows ?? [])];
    allRows.forEach((tr) => {
      const r = tr.getBoundingClientRect();
      y.push(r.top - base.top); h.push(r.height);
    });
    const tr = table.getBoundingClientRect();
    setGeo({ x, w, y, h, width: tr.width, height: tr.height });
  }, []);

  useLayoutEffect(() => { measure(); }, [measure, model, cfg]);
  useEffect(() => {
    if (!enabled) return undefined;
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [enabled, measure]);

  /* ── selection helpers ── */
  const selIds = useMemo(() => {
    if (!sel) return [] as string[];
    const ids: string[] = [];
    const [r0, r1] = [Math.min(sel.r0, sel.r1), Math.max(sel.r0, sel.r1)];
    const [c0, c1] = [Math.min(sel.c0, sel.c1), Math.max(sel.c0, sel.c1)];
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        const cell = model.rows[r] && cellAt(model.rows[r], c);
        if (cell && !ids.includes(cell.id)) ids.push(cell.id);
      }
    }
    return ids;
  }, [sel, model]);

  const selRect = useMemo(() => {
    if (!sel || !geo) return null;
    const [r0, r1] = [Math.min(sel.r0, sel.r1), Math.max(sel.r0, sel.r1)];
    const [c0, c1] = [Math.min(sel.c0, sel.c1), Math.max(sel.c0, sel.c1)];
    if (geo.x[c0] === undefined || geo.y[r0] === undefined) return null;
    return {
      left: geo.x[c0],
      top: geo.y[r0],
      width: (geo.x[c1] ?? 0) + (geo.w[c1] ?? 0) - geo.x[c0],
      height: (geo.y[r1] ?? 0) + (geo.h[r1] ?? 0) - geo.y[r0],
    };
  }, [sel, geo]);

  /* ── drag to reorder a row or a column ── */
  const startReorder = (kind: 'row' | 'col', index: number) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDrag({ kind, from: index, to: index });
    const move = (ev: MouseEvent) => {
      const wrap = wrapRef.current; const g = geo;
      if (!wrap || !g) return;
      const base = wrap.getBoundingClientRect();
      if (kind === 'col') {
        const px = ev.clientX - base.left;
        let to = g.x.findIndex((x, i) => px < x + g.w[i] / 2);
        if (to < 0) to = g.x.length - 1;
        setDrag((d) => (d ? { ...d, to } : d));
      } else {
        const py = ev.clientY - base.top;
        let to = g.y.findIndex((y, i) => py < y + g.h[i] / 2);
        if (to < 0) to = g.y.length - 1;
        setDrag((d) => (d ? { ...d, to } : d));
      }
    };
    const up = () => {
      const d = dragRef.current;
      if (d && d.to !== d.from) write(d.kind === 'col' ? reorderColumn(model, d.from, d.to) : reorderRow(model, d.from, d.to));
      setDrag(null);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ── drag a column boundary ── */
  const startResize = (col: number) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const total = geo?.width || 1;
    const base = model;
    const move = (ev: MouseEvent) => {
      const deltaPct = ((ev.clientX - startX) / total) * 100;
      write(resizeColumn(base, col, deltaPct));
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ── cell mouse: click to edit, drag to select a rectangle ── */
  const cellDown = (r: number, c: number) => (e: React.MouseEvent) => {
    if (!enabled) return;
    e.stopPropagation();
    if (editing) return;
    if (e.shiftKey && sel) { setSel({ ...sel, r1: r, c1: c }); return; }
    setSel({ r0: r, c0: c, r1: r, c1: c });
    let moved = false;
    const move = (ev: MouseEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const td = el?.closest?.('[data-cell]') as HTMLElement | null;
      if (!td) return;
      const rr = Number(td.dataset.r); const cc = Number(td.dataset.c);
      if (rr !== r || cc !== c) moved = true;
      setSel((s) => (s ? { ...s, r1: rr, c1: cc } : s));
    };
    const up = () => {
      /* A click that never left its cell is an EDIT, not a one-cell selection. Word, Sheets and
         Tiptap all behave this way and it saves a double-click on the commonest action there is. */
      if (!moved) { const cell = cellAt(model.rows[r], c); if (cell) setEditing(cell.id); }
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ── keyboard ── */
  const onCellKey = (r: number, c: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const back = e.shiftKey;
      let nr = r; let nc = c + (back ? -1 : 1);
      if (nc >= cols) { nc = 0; nr = r + 1; }
      if (nc < 0) { nc = cols - 1; nr = r - 1; }
      /* ⚠️ Tab out of the LAST cell appends a row (§7) — unless the table is at its ceiling, in
         which case it simply stops rather than silently doing nothing somewhere else. */
      if (nr >= rows) {
        if (addRowBlocked(model)) return;
        write(addRowAfter(model, rows - 1));
        setTimeout(() => setEditing(null), 0);
        return;
      }
      if (nr < 0) return;
      const cell = model.rows[nr] && cellAt(model.rows[nr], nc);
      if (cell) setEditing(cell.id);
      return;
    }
    if (e.key === 'Escape') { (e.target as HTMLElement).blur(); setEditing(null); }
  };

  useEffect(() => {
    if (!enabled || editing || !sel) return undefined;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        write(clearCells(model, selIds));
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [enabled, editing, sel, selIds, model, write]);

  /* ── the picker, for a table that has no shape yet ── */
  if (fresh || picking) {
    return (
      <div className="flex flex-col items-start gap-3" onClick={(e) => e.stopPropagation()}>
        <TableGridPicker
          onPick={(r, c) => { write(insertTable({ rows: r, cols: c, withHeaderRow: cfg.headerRow !== false })); setPicking(false); }}
          onCancel={picking ? () => setPicking(false) : undefined}
        />
      </div>
    );
  }

  /* ── menus ── */
  const rowMenu = (i: number): MenuItem[] => [
    { label: 'Insert row above', icon: <ArrowUp size={14} />, blocked: addRowBlocked(model), run: () => write(addRowBefore(model, i)) },
    { label: 'Insert row below', icon: <ArrowDown size={14} />, blocked: addRowBlocked(model), run: () => write(addRowAfter(model, i)) },
    { label: 'Duplicate row', icon: <Copy size={14} />, blocked: addRowBlocked(model), run: () => write(duplicateRow(model, i)) },
    { label: 'Move up', icon: <ArrowUp size={14} />, divider: true, blocked: i === 0 ? 'Already the first row' : null, run: () => write(moveRow(model, i, 'up')) },
    { label: 'Move down', icon: <ArrowDown size={14} />, blocked: i === rows - 1 ? 'Already the last row' : null, run: () => write(moveRow(model, i, 'down')) },
    /* ⚠️ Writes the CONFIG key, not the model — the panel's "First row is a header" switch writes
       the same one, so the menu item and the switch are two ways to reach one value rather than two
       values that drift. `tableFrom` applies it to the model on every read. */
    { label: model.headerRow ? 'Remove header row' : 'Make header row', icon: <Heading size={14} />, divider: true, blocked: i === 0 ? null : 'Only the first row can be the header', run: () => setCfg?.(nodeId, { headerRow: !model.headerRow }) },
    { label: 'Clear contents', icon: <Eraser size={14} />, run: () => write(clearRowContent(model, i)) },
    { label: 'Delete row', icon: <Trash2 size={14} />, divider: true, blocked: deleteRowBlocked(model), run: () => write(deleteRow(model, i)) },
  ];

  const colMenu = (i: number): MenuItem[] => [
    { label: 'Insert column left', icon: <ArrowLeft size={14} />, blocked: addColumnBlocked(model), run: () => write(addColumnBefore(model, i)) },
    { label: 'Insert column right', icon: <ArrowRight size={14} />, blocked: addColumnBlocked(model), run: () => write(addColumnAfter(model, i)) },
    { label: 'Duplicate column', icon: <Copy size={14} />, blocked: addColumnBlocked(model), run: () => write(duplicateColumn(model, i)) },
    { label: 'Move left', icon: <ArrowLeft size={14} />, divider: true, blocked: i === 0 ? 'Already the first column' : null, run: () => write(moveColumn(model, i, 'left')) },
    { label: 'Move right', icon: <ArrowRight size={14} />, blocked: i === cols - 1 ? 'Already the last column' : null, run: () => write(moveColumn(model, i, 'right')) },
    { label: model.headerColumn ? 'Remove header column' : 'Make header column', icon: <Heading size={14} />, divider: true, blocked: i === 0 ? null : 'Only the first column can be the header', run: () => setCfg?.(nodeId, { firstColumn: !model.headerColumn }) },
    { label: 'Clear contents', icon: <Eraser size={14} />, run: () => write(clearColumnContent(model, i)) },
    { label: 'Fit columns to width', icon: <Maximize2 size={14} />, run: () => write(fitTableToWidth(model)) },
    { label: 'Delete column', icon: <Trash2 size={14} />, divider: true, blocked: deleteColumnBlocked(model), run: () => write(deleteColumn(model, i)) },
  ];

  /* ── styling from the panel ── */
  const pad = Number(cfg.cellPad ?? 8);
  const fmt = (v: unknown) => {
    const on = Array.isArray(v) ? (v as string[]) : [];
    return {
      fontWeight: on.includes('Bold') ? 700 : undefined,
      textDecoration: on.includes('Underline') ? 'underline' : undefined,
      fontStyle: on.includes('Italic') ? 'italic' : undefined,
    };
  };
  const face = (p: 'head' | 'row'): CSSProperties => ({
    fontFamily: cfg[`${p}Font`] === 'Inherit from theme' ? undefined : (cfg[`${p}Font`] as string),
    fontWeight: ({ Light: 300, Normal: 400, Medium: 500, Semibold: 600, Bold: 700 } as Record<string, number>)[
      String(cfg[`${p}Weight`] ?? (p === 'head' ? 'Semibold' : 'Normal'))],
    fontSize: Number(cfg[`${p}Size`] ?? 13),
    color: String(cfg[`${p}Color`] ?? '#364658'),
    ...fmt(cfg[`${p}Format`]),
  });
  const bw = Number(cfg.frameBorderWidth ?? 1);
  const bc = String(cfg.frameBorderColor ?? '#E5E7EB');

  const RAIL = 14;
  const inSel = (r: number, c: number) => !!sel
    && r >= Math.min(sel.r0, sel.r1) && r <= Math.max(sel.r0, sel.r1)
    && c >= Math.min(sel.c0, sel.c1) && c <= Math.max(sel.c0, sel.c1);

  return (
    <div
      className="relative"
      style={enabled ? { paddingTop: RAIL + 4, paddingLeft: RAIL + 4 } : undefined}
      onMouseLeave={() => { setHoverRow(null); setHoverCol(null); }}
    >
      <div ref={wrapRef} className={`relative ${cfg.hScroll !== false ? 'overflow-x-auto' : ''}`}>
        {/* ⚠️ A real <table> with a real <colgroup> and `table-fixed`. Column width is a property of
            the column; without both halves the browser sizes from content and the colgroup is
            ignored entirely. */}
        <table ref={tableRef} className="w-full table-fixed border-collapse">
          <colgroup>
            {model.colWidths.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
          </colgroup>
          {model.headerRow && (
            <thead>
              <tr>{model.rows[0].cells.map((cell, ci) => (
                <TableCellView
                  key={cell.id} tag="th" cell={cell} r={0} c={cellStarts(model.rows[0])[ci]}
                  pad={pad} bw={bw} bc={bc} face={face('head')} enabled={enabled}
                  editing={editing === cell.id} selected={inSel(0, cellStarts(model.rows[0])[ci])}
                  defaultAlign={cfg.cellAlign as CellAlign}
                  onDown={cellDown(0, cellStarts(model.rows[0])[ci])}
                  onKey={onCellKey(0, cellStarts(model.rows[0])[ci])}
                  onCommit={(v) => { write(setCellContent(model, cell.id, v)); setEditing(null); }}
                  onHover={(r, c) => { setHoverRow(r); setHoverCol(c); }}
                />
              ))}</tr>
            </thead>
          )}
          <tbody>
            {model.rows.slice(model.headerRow ? 1 : 0).map((row, bi) => {
              const ri = bi + (model.headerRow ? 1 : 0);
              const starts = cellStarts(row);
              const bodyIndex = model.headerRow ? ri - 1 : ri;
              const stripe = String((bodyIndex % 2 === 0 ? cfg.evenBg : cfg.oddBg) ?? '#FFFFFF');
              return (
                /* ⚠️ NEVER wrapped. A div between <tbody> and <tr> makes every row its own anonymous
                   table — the columns stop aligning and the colgroup stops applying. */
                <tr key={row.id} style={{ background: stripe }}>
                  {row.cells.map((cell, ci) => (
                    <TableCellView
                      key={cell.id}
                      tag={cell.isHeader || (model.headerColumn && ci === 0) ? 'th' : 'td'}
                      scope={model.headerColumn && ci === 0 ? 'row' : undefined}
                      cell={cell} r={ri} c={starts[ci]}
                      pad={pad} bw={bw} bc={bc}
                      face={face(cell.isHeader || (model.headerColumn && ci === 0) ? 'head' : 'row')}
                      enabled={enabled}
                      editing={editing === cell.id} selected={inSel(ri, starts[ci])}
                      defaultAlign={cfg.cellAlign as CellAlign}
                      onDown={cellDown(ri, starts[ci])}
                      onKey={onCellKey(ri, starts[ci])}
                      onCommit={(v) => { write(setCellContent(model, cell.id, v)); setEditing(null); }}
                      onHover={(r, c) => { setHoverRow(r); setHoverCol(c); }}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── the selection region: ONE stroke around the outside, not a border per cell ── */}
        {enabled && selRect && (
          <span
            className="pointer-events-none absolute z-[40] rounded-[2px]"
            style={{ ...selRect, boxShadow: 'inset 0 0 0 2px var(--tt-table-selected-stroke, #3D8BD0)' }}
          />
        )}
      </div>

      {/* ── overlay: rails, drop indicator, resize grips, extend buttons ── */}
      {enabled && geo && (
        <>
          {/* column rail */}
          {geo.x.map((x, i) => (
            <button
              key={`ch${i}`}
              type="button"
              aria-label={`Column ${i + 1} options`}
              onMouseEnter={() => setHoverCol(i)}
              onMouseDown={startReorder('col', i)}
              onClick={(e) => {
                e.stopPropagation();
                setSel({ r0: 0, c0: i, r1: rows - 1, c1: i });
                const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const w = wrapRef.current!.getBoundingClientRect();
                setMenu({ kind: 'col', index: i, x: b.left - w.left, y: RAIL + 6 });
              }}
              style={{ left: x + RAIL + 4, width: geo.w[i] - 2, top: 0, height: RAIL }}
              className={`absolute z-[50] flex items-center justify-center rounded-[3px] transition-colors ${
                hoverCol === i || (sel && Math.min(sel.c0, sel.c1) <= i && i <= Math.max(sel.c0, sel.c1))
                  ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#9CA3AF] hover:bg-[#DDE5EC]'
              }`}
            ><ChevronDown size={11} /></button>
          ))}
          {/* row rail */}
          {geo.y.map((y, i) => (
            <button
              key={`rh${i}`}
              type="button"
              aria-label={`Row ${i + 1} options`}
              onMouseEnter={() => setHoverRow(i)}
              onMouseDown={startReorder('row', i)}
              onClick={(e) => {
                e.stopPropagation();
                setSel({ r0: i, c0: 0, r1: i, c1: cols - 1 });
                const w = wrapRef.current!.getBoundingClientRect();
                const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMenu({ kind: 'row', index: i, x: RAIL + 6, y: b.top - w.top + RAIL });
              }}
              style={{ top: y + RAIL + 4, height: geo.h[i] - 2, left: 0, width: RAIL }}
              className={`absolute z-[50] flex items-center justify-center rounded-[3px] transition-colors ${
                hoverRow === i || (sel && Math.min(sel.r0, sel.r1) <= i && i <= Math.max(sel.r0, sel.r1))
                  ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#9CA3AF] hover:bg-[#DDE5EC]'
              }`}
            ><ChevronDown size={11} className="-rotate-90" /></button>
          ))}

          {/* select-all corner */}
          <button
            type="button"
            aria-label="Select the whole table"
            onClick={(e) => { e.stopPropagation(); setSel({ r0: 0, c0: 0, r1: rows - 1, c1: cols - 1 }); }}
            style={{ width: RAIL, height: RAIL }}
            className="absolute left-0 top-0 z-[50] rounded-[3px] bg-[#EEF2F6] transition-colors hover:bg-[#DDE5EC]"
          />

          {/* live drop indicator while reordering */}
          {drag && drag.to !== drag.from && (
            drag.kind === 'col'
              ? <span className="pointer-events-none absolute z-[60] w-[2px] bg-[#3D8BD0]" style={{ left: geo.x[drag.to] + RAIL + 4 + (drag.to > drag.from ? geo.w[drag.to] : 0), top: RAIL + 4, height: geo.height }} />
              : <span className="pointer-events-none absolute z-[60] h-[2px] bg-[#3D8BD0]" style={{ top: geo.y[drag.to] + RAIL + 4 + (drag.to > drag.from ? geo.h[drag.to] : 0), left: RAIL + 4, width: geo.width }} />
          )}

          {/* column-boundary resize grips */}
          {geo.x.slice(0, -1).map((x, i) => (
            <span
              key={`rz${i}`}
              onMouseDown={startResize(i)}
              style={{ left: x + geo.w[i] + RAIL + 4 - 3, top: RAIL + 4, height: geo.height }}
              className="absolute z-[55] w-[6px] cursor-col-resize hover:bg-[#3D8BD0]/30"
            />
          ))}

          {/* extend by one, at the right and bottom edges */}
          <button
            type="button"
            aria-label="Add a column"
            title={addColumnBlocked(model) ?? 'Add a column'}
            disabled={!!addColumnBlocked(model)}
            onClick={(e) => { e.stopPropagation(); write(addColumnAfter(model, cols - 1)); }}
            style={{ left: RAIL + 6 + geo.width + 4, top: RAIL + 4 + geo.height / 2 - 9 }}
            className="absolute z-[50] flex size-[18px] items-center justify-center rounded-full border border-[#DFE5ED] bg-white text-[#6B7280] shadow-sm transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0] disabled:cursor-not-allowed disabled:opacity-40"
          ><Plus size={12} /></button>
          <button
            type="button"
            aria-label="Add a row"
            title={addRowBlocked(model) ?? 'Add a row'}
            disabled={!!addRowBlocked(model)}
            onClick={(e) => { e.stopPropagation(); write(addRowAfter(model, rows - 1)); }}
            style={{ left: RAIL + 4 + geo.width / 2 - 9, top: RAIL + 6 + geo.height + 4 }}
            className="absolute z-[50] flex size-[18px] items-center justify-center rounded-full border border-[#DFE5ED] bg-white text-[#6B7280] shadow-sm transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0] disabled:cursor-not-allowed disabled:opacity-40"
          ><Plus size={12} /></button>

          {/* ⚠️ Cell padding is dragged from the BOTTOM edge, as asked. It writes the SAME `cellPad`
              key the panel slider writes, so the two are one value with two affordances rather than
              two controls that can disagree. */}
          <span
            onMouseDown={(e) => {
              e.preventDefault(); e.stopPropagation();
              const startY = e.clientY; const start = pad;
              const move = (ev: MouseEvent) => {
                const next = Math.min(28, Math.max(2, Math.round(start + (ev.clientY - startY) / (rows * 2))));
                setCfg?.(nodeId, { cellPad: next });
              };
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move);
              window.addEventListener('mouseup', up);
            }}
            title="Drag to change cell padding"
            style={{ left: RAIL + 4, top: RAIL + 4 + geo.height - 3, width: geo.width }}
            className="absolute z-[45] h-[6px] cursor-row-resize hover:bg-[#3D8BD0]/30"
          />

          {menu && (
            <HandleMenu
              items={menu.kind === 'row' ? rowMenu(menu.index) : colMenu(menu.index)}
              x={menu.x} y={menu.y}
              onClose={() => setMenu(null)}
            />
          )}

          {/* ── floating cell toolbar ── */}
          {sel && !editing && selRect && (
            <CellToolbar
              left={selRect.left + RAIL + 4}
              top={selRect.top + RAIL + 4}
              width={selRect.width}
              onAlign={(v) => write(setCellAttribute(model, selIds, 'textAlign', v))}
              onVAlign={(v) => write(setCellAttribute(model, selIds, 'verticalAlign', v))}
              onHeader={() => selIds.forEach((id, i) => { if (i === 0) write(toggleHeaderCell(model, id)); })}
              onClear={() => write(clearCells(model, selIds, { resetAttrs: true }))}
              onColor={(e) => setColorAt((e.currentTarget as HTMLElement).getBoundingClientRect())}
            />
          )}
          {colorAt && (
            <PortalColorPicker
              value={String(model.rows.flatMap((r) => r.cells).find((c) => c.id === selIds[0])?.bg ?? '#FFFFFF')}
              onChange={(v) => write(setCellAttribute(model, selIds, 'bg', v))}
              onClose={() => setColorAt(null)}
              anchor={colorAt}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ── one cell ────────────────────────────────────────────────────────────── */

function TableCellView({
  tag, scope, cell, r, c, pad, bw, bc, face, enabled, editing, selected, defaultAlign, onDown, onKey, onCommit, onHover,
}: {
  tag: 'td' | 'th';
  scope?: 'row' | 'col';
  cell: { id: string; content: string; colspan: number; rowspan: number; bg?: string; textAlign?: CellAlign; verticalAlign?: VertAlign };
  r: number; c: number; pad: number; bw: number; bc: string; face: CSSProperties;
  enabled: boolean; editing: boolean; selected: boolean; defaultAlign?: CellAlign;
  onDown: (e: React.MouseEvent) => void;
  onKey: (e: React.KeyboardEvent) => void;
  onCommit: (v: string) => void;
  onHover: (r: number, c: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = tag as 'td';

  /* ⚠️ UNCONTROLLED, and mirrored only while unfocused. Writing the value back into a
     contentEditable on every keystroke resets the caret to the start — which is the reversed-typing
     bug this codebase has hit in the approval composer and again in the rich-text control.
     ⚠️ `tag` IS A DEPENDENCY, and it is not obvious why. Switching a cell between <td> and <th>
     keeps the same component instance — same key, same component type — so React does not remount
     it and this effect does not re-run; but the returned ELEMENT type changed, so React tears down
     the DOM subtree and builds a new one. `ref.current` then points at a brand-new empty div that
     nothing ever fills. Turning on "First column is a header" blanked every cell in that column,
     silently, with no error: the model still held the text and the DOM had thrown it away. */
  useEffect(() => {
    if (!editing && ref.current && ref.current.textContent !== cell.content) ref.current.textContent = cell.content;
  }, [cell.content, editing, tag]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges(); sel?.addRange(range);
    }
  }, [editing]);

  return (
    <Tag
      data-cell
      data-r={r}
      data-c={c}
      scope={scope ?? (tag === 'th' ? 'col' : undefined)}
      colSpan={cell.colspan > 1 ? cell.colspan : undefined}
      rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
      aria-selected={selected || undefined}
      onMouseEnter={() => onHover(r, c)}
      onMouseDown={onDown}
      style={{
        padding: pad,
        textAlign: cell.textAlign ?? defaultAlign ?? 'left',
        verticalAlign: cell.verticalAlign ?? 'middle',
        background: cell.bg,
        ...(bw > 0 ? { border: `${bw}px solid ${bc}` } : {}),
        wordBreak: 'break-word',
        ...face,
        ...(selected ? { background: cell.bg ?? 'var(--tt-table-selected-bg, #EBF5FF)' } : {}),
      }}
    >
      <div
        ref={ref}
        contentEditable={enabled && editing}
        suppressContentEditableWarning
        onKeyDown={onKey}
        onBlur={(e) => onCommit(e.currentTarget.textContent ?? '')}
        className="min-h-[1.2em] outline-none"
        style={{ cursor: enabled ? 'text' : undefined }}
      />
    </Tag>
  );
}

/* ── the floating cell toolbar ───────────────────────────────────────────── */

function CellToolbar({ left, top, width, onAlign, onVAlign, onHeader, onClear, onColor }: {
  left: number; top: number; width: number;
  onAlign: (v: CellAlign) => void;
  onVAlign: (v: VertAlign) => void;
  onHeader: () => void;
  onClear: () => void;
  onColor: (e: React.MouseEvent) => void;
}) {
  const btn = 'flex size-7 items-center justify-center rounded text-[#364658] transition-colors hover:bg-[#F5F7FA]';
  /* ⚠️ It sits ABOVE the selection and never over it — the toolbar describes the cells, so covering
     them would hide the thing it is about. Clamped to 0 so a selection at the very top of the
     element still shows its toolbar rather than pushing it off the canvas. */
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ left: Math.max(0, left + width / 2), top: Math.max(0, top - 40), transform: 'translateX(-50%)' }}
      className="absolute z-[75] flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      <button type="button" className={btn} title="Align left" onClick={() => onAlign('left')}><AlignLeft size={14} /></button>
      <button type="button" className={btn} title="Align centre" onClick={() => onAlign('center')}><AlignCenter size={14} /></button>
      <button type="button" className={btn} title="Align right" onClick={() => onAlign('right')}><AlignRight size={14} /></button>
      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />
      <button type="button" className={btn} title="Align top" onClick={() => onVAlign('top')}><ArrowUp size={14} /></button>
      <button type="button" className={btn} title="Align middle" onClick={() => onVAlign('middle')}><AlignCenter size={14} className="rotate-90" /></button>
      <button type="button" className={btn} title="Align bottom" onClick={() => onVAlign('bottom')}><ArrowDown size={14} /></button>
      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />
      <button type="button" className={btn} title="Cell background" onClick={onColor}><span className="size-3.5 rounded-[2px] border border-[#D9E0EA] bg-gradient-to-br from-[#EBF5FF] to-[#FDE68A]" /></button>
      <button type="button" className={btn} title="Toggle header cell" onClick={onHeader}><Heading size={14} /></button>
      <button type="button" className={btn} title="Clear contents and styling" onClick={onClear}><Eraser size={14} /></button>
    </div>
  );
}
