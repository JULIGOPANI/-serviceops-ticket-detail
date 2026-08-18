import { useMemo, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

/* The table's content, edited as a SHEET.
 *
 * ⚠️ Replaces adding rows one at a time from the panel. A table is a grid, and the only editor
 * anybody is fluent in for a grid is a grid — row-by-row through a side panel meant holding the
 * shape of the thing in your head while editing it through a keyhole.
 *
 * ⚠️ "Infinite" rows and columns are trailing BLANKS, not a scroll trick: there is always one empty
 * row below the last filled one and one empty column to its right, so the sheet grows by typing
 * into it. Nothing is added until something is written, which is why a fresh table is not a
 * hundred empty cells. */

type Grid = string[][];

const BLANK_ROWS = 6;
const BLANK_COLS = 2;

/** Trims the trailing blanks back off, so what is stored is what was actually typed. */
export function trimGrid(g: Grid): Grid {
  const rows = g.filter((r) => r.some((c) => c.trim()));
  if (!rows.length) return [];
  let width = 0;
  rows.forEach((r) => r.forEach((c, i) => { if (c.trim()) width = Math.max(width, i + 1); }));
  return rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
}

/** Pads with the trailing blanks that make the sheet feel endless. */
const pad = (g: Grid): Grid => {
  const width = Math.max(1, ...g.map((r) => r.length)) + BLANK_COLS;
  const rows = g.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
  for (let i = 0; i < BLANK_ROWS; i += 1) rows.push(Array.from({ length: width }, () => ''));
  return rows;
};

/* ⚠️ A real CSV split, not `line.split(',')`. Quoted fields containing commas are the normal case
   in exported data — "Doe, Jane" — and a naive split turns one column into two for that row only,
   which is worse than refusing the file. */
function parseCsv(text: string): Grid {
  const rows: Grid = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function PortalTableContent({ value, onApply, onClose }: {
  value: Grid;
  onApply: (g: Grid) => void;
  onClose: () => void;
}) {
  const [grid, setGrid] = useState<Grid>(() => pad(value));
  const fileRef = useRef<HTMLInputElement>(null);

  const width = useMemo(() => Math.max(1, ...grid.map((r) => r.length)), [grid]);

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

  const load = (file: File) => {
    if (!/\.csv$/i.test(file.name)) { toast.error('That is not a .csv file'); return; }
    const fr = new FileReader();
    fr.onload = () => {
      const parsed = parseCsv(String(fr.result));
      if (!parsed.length) { toast.error('That file had no rows in it'); return; }
      setGrid(pad(parsed));
      toast.success(`${parsed.length} rows loaded — review them, then Apply`);
    };
    fr.readAsText(file);
  };

  const cell = 'h-9 w-[180px] flex-shrink-0 border-b border-r border-[#E5E7EB] px-3 text-[13px] text-[#364658] focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-[86vh] w-[1100px] max-w-full flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-5 py-3">
          <h2 className="text-[15px] font-semibold text-[#364658]">Table content</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <p className="text-[13px] text-[#64748B]">Type into the sheet, or upload a CSV to replace what is here.</p>
            {/* ⚠️ Clear All is a LINK, not a button. It throws away every row, and it must not look
                like the thing beside it that adds them. */}
            <button
              onClick={() => { setGrid(pad([])); toast.success('Cleared — nothing is saved until you Apply'); }}
              className="mt-1 text-[13px] font-medium text-[#3D8BD0] hover:underline"
            >Clear All</button>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-9 flex-shrink-0 items-center gap-2 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
          ><Upload size={15} /> Upload CSV</button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }}
          />
        </div>

        {/* Both axes scroll; the sheet is wider and taller than the dialog on purpose. */}
        <div className="min-h-0 flex-1 overflow-auto border-y border-[#E5E7EB]">
          <div className="inline-block min-w-full">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {Array.from({ length: width }).map((_, c) => (
                  <input
                    key={c}
                    value={row[c] ?? ''}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    /* The first row reads as the header, because that is what the table does with
                       it — the sheet should not need a legend to say so. */
                    className={`${cell} ${r === 0 ? 'bg-[#F9FAFB] font-semibold' : 'bg-white'}`}
                  />
                ))}
              </div>
            ))}
          </div>
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
