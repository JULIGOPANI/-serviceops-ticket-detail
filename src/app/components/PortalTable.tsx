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
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowDownAZ, ArrowDownZA, ArrowLeft, ArrowRight,
  ArrowUp, ChevronRight, Copy, Eraser, GripHorizontal, GripVertical, Heading, Maximize2, Palette,
  Plus, Trash2,
} from 'lucide-react';
import { useCanvas } from './PortalCanvas';
import {
  MAX_DIM, addColumnAfter, addColumnBefore, addColumnBlocked, addRowAfter, addRowBefore,
  addRowBlocked, cellAt, cellStarts, clearCells, clearColumnContent, clearRowContent, columnCount,
  deleteColumn, deleteColumnBlocked, deleteRow, deleteRowBlocked, duplicateColumn, duplicateRow,
  fitTableToWidth, insertTable, moveColumn, moveRow, reorderColumn, reorderRow, resizeColumn,
  setCellAttribute, setCellContent, sortByColumn, tableFrom, toggleHeaderCell,
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

/* ── the menu, with submenus ──────────────────────────────────────────────── */

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  run?: () => void;
  /** Disabled WITH a reason on it — never hidden, never inert (§10.6). */
  blocked?: string | null;
  divider?: boolean;
  /** Opens a flyout instead of acting. */
  children?: React.ReactNode;
}

/** Named colours, the way a document editor offers them.
 *
 * ⚠️ NAMES, not a spectrum. This is a table cell, not a brand palette — you are marking one value
 * as a warning or a total, and "Red" says that where #DC2626 does not. The portal's own colour
 * picker is still the right tool for anything that IS a design decision. */
const CELL_COLORS: [string, string][] = [
  ['Default', ''], ['Gray', '#6B7280'], ['Brown', '#92400E'], ['Orange', '#C2410C'],
  ['Yellow', '#A16207'], ['Green', '#15803D'], ['Blue', '#1D4ED8'], ['Purple', '#6D28D9'],
  ['Pink', '#BE185D'], ['Red', '#B91C1C'],
];
const CELL_BGS: [string, string][] = [
  ['None', ''], ['Gray', '#F3F4F6'], ['Brown', '#F5EFE9'], ['Orange', '#FFF1E7'],
  ['Yellow', '#FEF7E0'], ['Green', '#ECFDF3'], ['Blue', '#EFF6FF'], ['Purple', '#F5F0FF'],
  ['Pink', '#FDF2F8'], ['Red', '#FEF2F2'],
];

function ColorFlyout({ onText, onBg }: { onText: (c: string) => void; onBg: (c: string) => void }) {
  return (
    <div className="max-h-[300px] w-[190px] overflow-y-auto py-1">
      <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Text colour</p>
      {CELL_COLORS.map(([name, hex]) => (
        <button
          key={`t${name}`}
          type="button"
          onClick={() => onText(hex)}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]"
        >
          <span className="flex size-4 items-center justify-center text-[13px] font-semibold" style={{ color: hex || '#364658' }}>A</span>
          {name} text
        </button>
      ))}
      <div className="my-1 h-px bg-[#F1F5F9]" />
      <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Background</p>
      {CELL_BGS.map(([name, hex]) => (
        <button
          key={`b${name}`}
          type="button"
          onClick={() => onBg(hex)}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]"
        >
          <span
            className="size-4 flex-shrink-0 rounded-[3px] border border-[#E5E7EB]"
            style={{ background: hex || '#FFFFFF' }}
          />
          {name}
        </button>
      ))}
    </div>
  );
}

function AlignFlyout({ onH, onV }: { onH: (v: CellAlign) => void; onV: (v: VertAlign) => void }) {
  const row = 'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]';
  return (
    <div className="w-[168px] py-1">
      <button type="button" className={row} onClick={() => onH('left')}><AlignLeft size={14} /> Align left</button>
      <button type="button" className={row} onClick={() => onH('center')}><AlignCenter size={14} /> Align centre</button>
      <button type="button" className={row} onClick={() => onH('right')}><AlignRight size={14} /> Align right</button>
      <div className="my-1 h-px bg-[#F1F5F9]" />
      <button type="button" className={row} onClick={() => onV('top')}><ArrowUp size={14} /> Align top</button>
      <button type="button" className={row} onClick={() => onV('middle')}><AlignCenter size={14} className="rotate-90" /> Align middle</button>
      <button type="button" className={row} onClick={() => onV('bottom')}><ArrowDown size={14} /> Align bottom</button>
    </div>
  );
}

function HandleMenu({ items, x, y, onClose }: { items: MenuItem[]; x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
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
      /* ⚠️ A capped height with its own scroll. The column menu is twelve items and the table can
         sit anywhere on a long page — without this the last few rows fall off the bottom of the
         canvas, which is exactly where Delete lives. */
      className="absolute z-[70] max-h-[320px] min-w-[214px] overflow-y-auto overflow-x-visible rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10)]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((it, i) => (
        <div key={it.label + i} className="relative">
          {it.divider && <div className="my-1 h-px bg-[#F1F5F9]" />}
          <button
            type="button"
            role="menuitem"
            disabled={!!it.blocked}
            title={it.blocked ?? undefined}
            onMouseEnter={() => setOpenSub(it.children ? it.label : null)}
            onClick={() => {
              if (it.blocked) return;
              if (it.children) { setOpenSub((s) => (s === it.label ? null : it.label)); return; }
              it.run?.();
              onClose();
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] ${
              it.blocked ? 'cursor-not-allowed text-[#C3CBD6]' : 'text-[#364658] hover:bg-[#F5F7FA]'
            }`}
          >
            <span className="flex size-4 flex-shrink-0 items-center justify-center text-current">{it.icon}</span>
            <span className="flex-1">{it.label}</span>
            {it.children && <ChevronRight size={13} className="flex-shrink-0 text-[#9CA3AF]" />}
          </button>
          {it.children && openSub === it.label && (
            /* ⚠️ Rendered to the LEFT when there is no room on the right. The menu itself is already
               positioned against the handle, so a flyout that always opened right ran off the canvas
               on any column past the middle of the table. */
            <div
              className={`absolute top-0 z-[80] rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10)] ${
                x > 420 ? 'right-full mr-1' : 'left-full ml-1'
              }`}
              onMouseLeave={() => setOpenSub(null)}
            >{it.children}</div>
          )}
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
  /* ⚠️ Read by the drag handler, which must measure against the CURRENT layout rather than the one
     that existed when the press began — the table reflows the moment a row is lifted. */
  const geoRef = useRef<Geo | null>(null);
  geoRef.current = geo;
  /** Where the dragged ghost sits, in viewport coordinates. Null when nothing is being dragged. */
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ kind: 'row' | 'col' | 'cell'; index: number; x: number; y: number } | null>(null);
  const [sel, setSel] = useState<{ r0: number; c0: number; r1: number; c1: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ kind: 'row' | 'col'; from: number; to: number } | null>(null);
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

  /* ── drag to reorder a row or a column ──
   *
   * ⚠️ A 4px THRESHOLD before it becomes a drag. The handle is also the menu button, and without a
   * threshold every press started a drag — so a plain click reordered nothing, opened the menu on
   * release, and felt like the drag had failed. Nothing moves until the pointer has actually
   * travelled, which is what makes one control do both jobs.
   * ⚠️ `geo` is read from a REF, not from the closure. The value captured at mousedown is a
   * snapshot: the first `setDrag` re-renders, the table reflows around the lifted row, and the
   * handler goes on measuring against geometry that no longer exists — which is why the drop
   * indicator drifted one column off partway across a wide table.
   * ⚠️ Listeners go on the WINDOW and `preventDefault` is called on the move, so a drag that leaves
   * the table — or the browser's own text selection — cannot swallow it. */
  const startReorder = (kind: 'row' | 'col', index: number) => (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX; const sy = e.clientY;
    let live = false;

    const at = (ev: MouseEvent) => {
      const wrap = wrapRef.current; const g = geoRef.current;
      if (!wrap || !g) return index;
      const base = wrap.getBoundingClientRect();
      if (kind === 'col') {
        const px = ev.clientX - base.left;
        const i = g.x.findIndex((x, n) => px < x + g.w[n] / 2);
        return i < 0 ? g.x.length - 1 : i;
      }
      const py = ev.clientY - base.top;
      const i = g.y.findIndex((y, n) => py < y + g.h[n] / 2);
      return i < 0 ? g.y.length - 1 : i;
    };

    const move = (ev: MouseEvent) => {
      if (!live) {
        if (Math.abs(ev.clientX - sx) < 4 && Math.abs(ev.clientY - sy) < 4) return;
        live = true;
        setDrag({ kind, from: index, to: index });
      }
      ev.preventDefault();
      setGhost({ x: ev.clientX, y: ev.clientY });
      const to = at(ev);
      setDrag((d) => (d ? { ...d, to } : d));
    };

    const up = () => {
      const d = dragRef.current;
      if (live && d && d.to !== d.from) {
        write(d.kind === 'col' ? reorderColumn(model, d.from, d.to) : reorderRow(model, d.from, d.to));
      }
      setDrag(null);
      setGhost(null);
      /* ⚠️ Swallow the click that a real press-and-release always fires afterwards, or every drag
         would end by opening the menu it just used as a handle. Only after a drag — a plain click
         must still reach the button. */
      if (live) window.addEventListener('click', (c) => { c.stopPropagation(); c.preventDefault(); }, { capture: true, once: true });
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
  const colorItems = (ids: string[]) => (
    <ColorFlyout
      onText={(c) => write(setCellAttribute(model, ids, 'color', c || undefined))}
      onBg={(c) => write(setCellAttribute(model, ids, 'bg', c || undefined))}
    />
  );
  const alignItems = (ids: string[]) => (
    <AlignFlyout
      onH={(v) => write(setCellAttribute(model, ids, 'textAlign', v))}
      onV={(v) => write(setCellAttribute(model, ids, 'verticalAlign', v))}
    />
  );
  /** Every cell id in one row / one column — what a handle menu's Colour and Alignment act on. */
  const rowIds = (i: number) => (model.rows[i]?.cells ?? []).map((c) => c.id);
  const colIds = (c: number) => model.rows.map((r) => cellAt(r, c)?.id).filter(Boolean) as string[];

  const rowMenu = (i: number): MenuItem[] => [
    { label: 'Insert row above', icon: <ArrowUp size={14} />, blocked: addRowBlocked(model), run: () => write(addRowBefore(model, i)) },
    { label: 'Insert row below', icon: <ArrowDown size={14} />, blocked: addRowBlocked(model), run: () => write(addRowAfter(model, i)) },
    { label: 'Move up', icon: <ArrowUp size={14} />, divider: true, blocked: i === 0 ? 'Already the first row' : null, run: () => write(moveRow(model, i, 'up')) },
    { label: 'Move down', icon: <ArrowDown size={14} />, blocked: i === rows - 1 ? 'Already the last row' : null, run: () => write(moveRow(model, i, 'down')) },
    { label: 'Colour', icon: <Palette size={14} />, divider: true, children: colorItems(rowIds(i)) },
    { label: 'Alignment', icon: <AlignLeft size={14} />, children: alignItems(rowIds(i)) },
    { label: 'Duplicate row', icon: <Copy size={14} />, divider: true, blocked: addRowBlocked(model), run: () => write(duplicateRow(model, i)) },
    /* ⚠️ Writes the CONFIG key, not the model — the panel's "First row is a header" switch writes
       the same one, so the menu item and the switch are two ways to reach one value rather than two
       values that drift. `tableFrom` applies it to the model on every read. */
    { label: model.headerRow ? 'Remove header row' : 'Make header row', icon: <Heading size={14} />, divider: true, blocked: i === 0 ? null : 'Only the first row can be the header', run: () => setCfg?.(nodeId, { headerRow: !model.headerRow }) },
    { label: 'Clear contents', icon: <Eraser size={14} />, run: () => write(clearRowContent(model, i)) },
    { label: 'Delete row', icon: <Trash2 size={14} />, divider: true, blocked: deleteRowBlocked(model), run: () => write(deleteRow(model, i)) },
  ];

  /* What a SELECTION can be given. ⚠️ Deliberately short: everything structural belongs to a whole
     row or column, and offering "insert" or "delete" against an arbitrary rectangle would raise a
     question the model has no answer to. */
  const cellMenu = (): MenuItem[] => [
    { label: 'Colour', icon: <Palette size={14} />, children: colorItems(selIds) },
    { label: 'Alignment', icon: <AlignLeft size={14} />, children: alignItems(selIds) },
    { label: selIds.length > 1 ? 'Toggle header cells' : 'Toggle header cell', icon: <Heading size={14} />, divider: true, run: () => { let m = model; selIds.forEach((id) => { m = toggleHeaderCell(m, id); }); write(m); } },
    { label: 'Clear contents', icon: <Eraser size={14} />, run: () => write(clearCells(model, selIds, { resetAttrs: true })) },
  ];

  const colMenu = (i: number): MenuItem[] => [
    { label: 'Insert column left', icon: <ArrowLeft size={14} />, blocked: addColumnBlocked(model), run: () => write(addColumnBefore(model, i)) },
    { label: 'Insert column right', icon: <ArrowRight size={14} />, blocked: addColumnBlocked(model), run: () => write(addColumnAfter(model, i)) },
    { label: 'Move left', icon: <ArrowLeft size={14} />, divider: true, blocked: i === 0 ? 'Already the first column' : null, run: () => write(moveColumn(model, i, 'left')) },
    { label: 'Move right', icon: <ArrowRight size={14} />, blocked: i === cols - 1 ? 'Already the last column' : null, run: () => write(moveColumn(model, i, 'right')) },
    /* ⚠️ Sorting a table with ONE body row is a no-op, so it says so rather than doing nothing. */
    { label: 'Sort column A → Z', icon: <ArrowDownAZ size={14} />, divider: true, blocked: rows - (model.headerRow ? 1 : 0) < 2 ? 'Nothing to sort — one row' : null, run: () => write(sortByColumn(model, i, 'asc')) },
    { label: 'Sort column Z → A', icon: <ArrowDownZA size={14} />, blocked: rows - (model.headerRow ? 1 : 0) < 2 ? 'Nothing to sort — one row' : null, run: () => write(sortByColumn(model, i, 'desc')) },
    { label: 'Colour', icon: <Palette size={14} />, divider: true, children: colorItems(colIds(i)) },
    { label: 'Alignment', icon: <AlignLeft size={14} />, children: alignItems(colIds(i)) },
    { label: 'Duplicate column', icon: <Copy size={14} />, divider: true, blocked: addColumnBlocked(model), run: () => write(duplicateColumn(model, i)) },
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
              style={{ left: x + RAIL + 4, width: geo.w[i] - 2, top: 0, height: RAIL, cursor: drag?.kind === 'col' ? 'grabbing' : 'grab' }}
              /* ⚠️ A GRIP, not a chevron. The bar is a drag handle first and a menu button second —
                 a chevron says "this opens something" and says nothing at all about picking it up,
                 which is exactly the half of the control people could not find. */
              className={`absolute z-[50] flex items-center justify-center rounded-full transition-colors ${
                drag?.kind === 'col' && drag.from === i
                  ? 'bg-[#3D8BD0] text-white'
                  : hoverCol === i || (sel && Math.min(sel.c0, sel.c1) <= i && i <= Math.max(sel.c0, sel.c1))
                    ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#9CA3AF] hover:bg-[#DDE5EC]'
              }`}
            ><GripHorizontal size={12} /></button>
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
              style={{ top: y + RAIL + 4, height: geo.h[i] - 2, left: 0, width: RAIL, cursor: drag?.kind === 'row' ? 'grabbing' : 'grab' }}
              className={`absolute z-[50] flex items-center justify-center rounded-full transition-colors ${
                drag?.kind === 'row' && drag.from === i
                  ? 'bg-[#3D8BD0] text-white'
                  : hoverRow === i || (sel && Math.min(sel.r0, sel.r1) <= i && i <= Math.max(sel.r0, sel.r1))
                    ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#9CA3AF] hover:bg-[#DDE5EC]'
              }`}
            ><GripVertical size={12} /></button>
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

          {/* ⚠️ A GHOST under the cursor, so a drag looks like carrying something rather than like
              nothing happening. It is the row or column's own text at 70% on a white card — enough
              to recognise WHICH one you picked up, which a plain grey rectangle cannot say.
              ⚠️ `position: fixed` with viewport coordinates: the table sits inside a scrolling
              canvas, so anything positioned against the wrapper lags the cursor the moment the page
              scrolls under it. */}
          {drag && ghost && (
            <span
              className="pointer-events-none fixed z-[9999] max-w-[220px] truncate rounded border border-[#3D8BD0] bg-white px-2.5 py-1.5 text-[12px] text-[#364658] opacity-90 shadow-[0_8px_20px_rgba(16,24,40,0.18)]"
              style={{ left: ghost.x + 12, top: ghost.y + 12 }}
            >
              {drag.kind === 'col'
                ? (cellAt(model.rows[0], drag.from)?.content || `Column ${drag.from + 1}`)
                : (model.rows[drag.from]?.cells[0]?.content || `Row ${drag.from + 1}`)}
            </span>
          )}

          {menu && (
            <HandleMenu
              items={menu.kind === 'row' ? rowMenu(menu.index) : menu.kind === 'cell' ? cellMenu() : colMenu(menu.index)}
              x={menu.x} y={menu.y}
              onClose={() => setMenu(null)}
            />
          )}

          {/* ── the selection's own handle ──
              ⚠️ This REPLACES the floating toolbar. That bar hovered above the selection and, on any
              cell in the top row, sat directly over the column rail — so the rail's handles could
              not be clicked at all while a cell was selected, which is how the drag came to look
              broken. It also duplicated the handle menus: two surfaces offering Colour, Alignment
              and Clear, which is the trap this builder keeps having to close.
              One round grip on the selection's right edge, and the same menu the rails use. */}
          {sel && !editing && selRect && (
            <button
              type="button"
              aria-label="Cell options"
              onClick={(e) => {
                e.stopPropagation();
                const w = wrapRef.current!.getBoundingClientRect();
                const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMenu({ kind: 'cell', index: 0, x: b.right - w.left + 6, y: b.top - w.top });
              }}
              style={{ left: selRect.left + RAIL + 4 + selRect.width - 5, top: selRect.top + RAIL + 4 + selRect.height / 2 - 5 }}
              className="absolute z-[60] size-[10px] rounded-full border-2 border-white bg-[#3D8BD0] shadow-[0_1px_3px_rgba(16,24,40,0.3)] transition-transform hover:scale-125"
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
        /* ⚠️ AFTER `face`, or the panel's Header/Rows colour wins and the per-cell one is stored and
           never seen. The panel sets what the whole table looks like; a cell colour is the override
           you reached for on top of it, so it has to be the last word. `undefined` leaves `face`
           alone, which is what "Default text" means. */
        ...(cell.color ? { color: cell.color } : {}),
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
