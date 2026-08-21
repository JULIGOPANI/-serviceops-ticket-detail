import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

/* The table's content, edited as a SHEET.
 *
 * ⚠️ Replaces adding rows one at a time from the panel. A table is a grid, and the only editor
 * anybody is fluent in for a grid is a grid — row-by-row through a side panel meant holding the
 * shape of the thing in your head while editing it through a keyhole.
 *
 * ⚠️ The sheet is EXACTLY the table's limit — 10 × 10 — rather than the content plus a margin of
 * trailing blanks. Growing by blanks meant the grid was a different size for every table, so it
 * never filled the dialog: three columns of content rendered five 180px columns inside an 1100px
 * box and left a dead white strip down the right, with six empty rows under it. Since a table
 * cannot exceed ten either way, showing all ten is both the honest picture of the limit and the
 * only size that fills the space — the blanks ARE the room to grow, so there is nothing left to
 * pad. Cells share the width instead of being fixed, so the sheet has no horizontal scroll and no
 * leftover edge at any dialog width. */

type Grid = string[][];

/** The table's hard limit, on both axes (spec §7.17). */
const SIZE = 10;

/** Trims the trailing blanks back off, so what is stored is what was actually typed. */
export function trimGrid(g: Grid): Grid {
  const rows = g.filter((r) => r.some((c) => c.trim()));
  if (!rows.length) return [];
  let width = 0;
  rows.forEach((r) => r.forEach((c, i) => { if (c.trim()) width = Math.max(width, i + 1); }));
  return rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
}

/** Squares the content up to exactly SIZE × SIZE — padding what is short, dropping what is over. */
const fit = (g: Grid): Grid =>
  Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => g[r]?.[c] ?? ''));

export function PortalTableContent({ value, onApply, onClose }: {
  value: Grid;
  onApply: (g: Grid) => void;
  onClose: () => void;
}) {
  const [grid, setGrid] = useState<Grid>(() => fit(value));



  const setCell = (r: number, c: number, v: string) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = v;
      /* Typing in the last row or column grows the sheet, so there is always somewhere to go next.
         Growing on EDIT rather than on a button is what makes it feel endless. */
      if (r === next.length - 1) next.push(Array.from({ length: next[0].length }, () => ''));
      if (c === next[0].length - 1) next.forEach((row) => row.push(''));
      return next;
    });
  };

  /* ⚠️ `min-w-0`, no fixed width. A 180px cell is what left the dead strip; sharing the row means
     ten columns land exactly on the dialog's edge however wide it is. */
  const cell = 'h-9 min-w-0 border-b border-r border-[#E5E7EB] px-2 text-[13px] text-[#364658] focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-[92vh] w-[920px] max-w-full flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-5 py-3">
          <h2 className="text-[15px] font-semibold text-[#364658]">Table content</h2>
          {/* ⚠️ Clear All sits with the ✕ in the heading row, not above the sheet. It acts on the
              WHOLE table, which is what the title names — down beside the "type into the sheet"
              line it read as advice about the sentence above it, and it sat where the eye goes to
              start typing rather than where you go to act on the thing as a whole. It stays a link
              rather than a button: it throws away every row, and it must not look like the controls
              that add them. */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => { setGrid(fit([])); toast.success('Cleared — nothing is saved until you Apply'); }}
              className="text-[13px] font-medium text-[#3D8BD0] hover:underline"
            >Clear All</button>
            <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-2.5">
          <p className="text-[13px] text-[#64748B]">Type into the sheet. A table stops at {SIZE} × {SIZE}.</p>
        </div>

        {/* ⚠️ No scroll container. The whole sheet is 10 × 10 and it fits, so a scroll box would only
            ever add an inner edge and a gutter to a grid that has nothing beyond it. */}
        <div className="border-y border-l border-[#E5E7EB]">
          {grid.map((row, r) => (
            <div key={r} className="grid grid-cols-10">
              {row.map((v, c) => (
                <input
                  key={c}
                  value={v}
                  onChange={(e) => setCell(r, c, e.target.value)}
                  /* The first row reads as the header, because that is what the table does with
                     it — the sheet should not need a legend to say so. */
                  className={`${cell} ${r === 0 ? 'bg-[#F9FAFB] font-semibold' : 'bg-white'}`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3">
          <button onClick={onClose} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button
            onClick={() => { onApply(trimGrid(grid)); onClose(); toast.success('Table content updated'); }}
            className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
          >Apply</button>
        </div>
      </div>
    </div>
  );
}
