import { useState, useEffect } from 'react';
import { X, Search, Plus, SquarePen, Trash2, ShieldCheck, Clock, TriangleAlert, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_EXCLUDE_PATHS, availableProducts, componentCount, OS_PRODUCT_KEY } from './bomData';
import type { BomProduct } from './bomData';

/* Manage scan paths — the host's BOM scan configuration. Which product owns which directory
 * decides which BOM a component lands in, so this is the panel that shapes every other screen. */

const STATUS_STYLE: Record<BomProduct['status'], { bg: string; text: string; icon: typeof ShieldCheck }> = {
  Scanned: { bg: '#ECFDF3', text: '#22A06B', icon: ShieldCheck },
  Pending: { bg: '#FEF7E6', text: '#D97706', icon: Clock },
  Failed: { bg: '#FEF3F2', text: '#DC2626', icon: TriangleAlert },
};

interface BomScanPathsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  endpointId: string;
  hostName: string;
  products: BomProduct[];
}

export function BomScanPathsPanel({ isOpen, onClose, endpointId, hostName, products }: BomScanPathsPanelProps) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<BomProduct[]>(products);
  const [excludes, setExcludes] = useState<string[]>(DEFAULT_EXCLUDE_PATHS);
  const [pattern, setPattern] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Re-seed from the host each time the panel opens (edits are local to the session).
  useEffect(() => {
    if (!isOpen) return;
    setRows(products); setExcludes(DEFAULT_EXCLUDE_PATHS); setSearch(''); setPattern(''); setShowAdd(false);
  }, [isOpen, endpointId]);

  if (!isOpen) return null;

  const addPattern = () => {
    const p = pattern.trim();
    if (!p) return;
    if (excludes.includes(p)) { setPattern(''); return; } // duplicates ignored
    setExcludes((prev) => [...prev, p]);
    setPattern('');
  };
  const addProduct = (key: string, name: string, version: string, path: string) => {
    setRows((prev) => [
      { key, name, version, path, source: 'agent · directory scan', status: 'Pending', lastScan: '—', findings: 0 },
      ...prev,
    ]);
    setShowAdd(false);
    toast.success(`${name} added — it will be scanned on the next agent check-in`);
  };
  const removeProduct = (key: string, name: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
    toast.error(`${name} removed from this host's scan configuration`);
  };

  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q));
  const addable = availableProducts(rows.map((r) => r.key));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50">
      <div className="flex h-full w-[900px] max-w-[95vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">Manage scan paths</h3>
            <p className="mt-0.5 font-mono text-[13px] text-[#7B8FA5]">{hostName}</p>
          </div>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Search + add product */}
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
              />
              {search ? (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              )}
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowAdd((v) => !v)}
                disabled={addable.length === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3479b5] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
              >
                <Plus size={15} /> Add product
              </button>
              {showAdd && addable.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAdd(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-[280px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                    <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Products not yet scanned</div>
                    {addable.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => addProduct(p.key, p.name, p.version, p.path)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] text-[#364658]">{p.name} <span className="text-[#7B8FA5]">{p.version}</span></span>
                          <span className="block truncate font-mono text-[12px] text-[#9CA3AF]">{p.path}</span>
                        </span>
                        <Plus size={14} className="flex-shrink-0 text-[#3D8BD0]" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product path table */}
          <table className="w-full">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['Product', 'Ver.', 'Path', 'Source', 'Status', 'Last Scan', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {visible.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-[13px] text-[#9CA3AF]">No products match your search.</td></tr>
              ) : visible.map((r) => {
                const s = STATUS_STYLE[r.status];
                const Icon = s.icon;
                const comps = componentCount(endpointId, r.key, 'SBOM');
                return (
                  <tr key={r.key} className="transition-colors hover:bg-[#f9fafb]">
                    <td className="px-3 py-3 text-[13px] font-medium text-[#364658]">
                      <span className="block max-w-[150px] truncate" title={r.name}>{r.name}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[13px] text-[#364658]">{r.version ?? '—'}</td>
                    <td className="px-3 py-3 font-mono text-[13px] text-[#364658]">
                      <span className="block max-w-[150px] truncate" title={r.path}>{r.path}</span>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-[#7B8FA5]">
                      <span className="block max-w-[110px] truncate" title={r.source}>{r.source}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
                          <Icon size={12} />{r.status}
                        </span>
                        <span className="text-[12px] text-[#9CA3AF]">{r.status === 'Pending' ? '—' : `${comps} comp.`}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[13px] text-[#364658]">{r.lastScan}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => toast.success(`Editing the scan path for ${r.name}`)}
                          className="flex size-7 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                          title="Edit"
                        ><SquarePen size={14} /></button>
                        <button
                          onClick={() => removeProduct(r.key, r.name)}
                          disabled={r.key === OS_PRODUCT_KEY}
                          className="flex size-7 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#FEF3F2] hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#7B8FA5]"
                          title={r.key === OS_PRODUCT_KEY ? 'The OS scope cannot be removed' : 'Delete'}
                        ><Trash2 size={14} /></button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Host-wide exclusions */}
          <div className="mt-5 rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Exclude paths — host-wide</div>
                <p className="mt-1 max-w-[620px] text-[13px] text-[#64748B]">
                  Skipped everywhere on this host (glob patterns); applies to every product
                  <span className="font-semibold text-[#364658]"> and </span>
                  the OS-base scan. Keeps runtime data/logs out and stops scans stalling.
                </p>
              </div>
              <span className="inline-flex h-[22px] min-w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white px-1.5 text-[12px] font-semibold text-[#64748B] ring-1 ring-[#E5E7EB]">
                {excludes.length}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {excludes.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-white px-2 py-1 font-mono text-[12px] text-[#364658]">
                  {p}
                  <button
                    onClick={() => setExcludes((prev) => prev.filter((x) => x !== p))}
                    className="text-[#9CA3AF] transition-colors hover:text-[#DC2626]"
                  ><X size={12} /></button>
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPattern(); } }}
                placeholder="Add pattern — e.g. **/logs, /data, C:\..."
                className="h-8 flex-1 rounded border border-[#d1d5db] bg-white px-3 font-mono text-[13px] text-[#364658] placeholder:font-mono placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
              />
              <button
                onClick={addPattern}
                className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              >
                <Plus size={15} /> Add
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[#9CA3AF]">Press Enter to add. Duplicates are ignored.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#DFE5ED] px-5 py-3">
          <button onClick={onClose} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">
            Cancel
          </button>
          <button
            onClick={() => { toast.success('Scan configuration saved'); onClose(); }}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3479b5]"
          >
            <Check size={15} /> Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
