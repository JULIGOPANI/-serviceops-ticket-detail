import { useState, useEffect } from 'react';
import { X, Search, Download, Columns3, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { bomComponents, bomCryptoAssets, bomAiModels, excludedPathsFor } from './bomData';
import type { BomType } from './bomData';

/* Side drawer listing every record in ONE BOM scope — opened from "View components / crypto
 * assets / models · N" on a version card. The shell (search + filter selects, grid, pagination,
 * Export) is shared; only the columns differ per BOM type. */

const ORIGIN_STYLE: Record<string, { bg: string; text: string }> = {
  'Open-source': { bg: '#ECFDF3', text: '#22A06B' },
  Proprietary: { bg: '#EFF6FF', text: '#3D8BD0' },
  'Third-party': { bg: '#FEF7E6', text: '#D97706' },
};
const COMPLIANCE_STYLE: Record<string, { bg: string; text: string }> = {
  Compliant: { bg: '#ECFDF3', text: '#22A06B' },
  Deprecated: { bg: '#FEF7E6', text: '#D97706' },
  'Quantum-vulnerable': { bg: '#FEF3F2', text: '#DC2626' },
};

function TintPill({ value, map }: { value: string; map: Record<string, { bg: string; text: string }> }) {
  const s = map[value] ?? { bg: '#F1F5F9', text: '#64748B' };
  return (
    <span className="inline-block rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {value}
    </span>
  );
}

/** One exclude pattern inline; the rest collapse into a +N chip with the full list on hover. */
function ExcludedPaths({ paths }: { paths: string[] }) {
  if (!paths.length) return <span className="text-[12px] text-[#9ca3af]">—</span>;
  const [first, ...rest] = paths;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="max-w-[150px] truncate rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 font-mono text-[11px] text-[#475467]" title={first}>
        {first}
      </span>
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-sm bg-[#EEF2F6] px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B]">
              +{rest.length}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-wrap">
            <span className="flex flex-col gap-0.5 font-mono text-[12px]">
              {rest.map((p) => <span key={p}>{p}</span>)}
            </span>
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

/** Borderless select used for the column filters across the top of the grid. */
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const active = value !== label;
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] font-medium transition-colors ${
          active ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'
        }`}
      >
        <span className="max-w-[120px] truncate">{value}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''} ${active ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-[220px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
            <div className="max-h-[280px] overflow-y-auto">
              {[label, ...options].map((o) => (
                <button
                  key={o}
                  onClick={() => { onChange(o); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] transition-colors ${
                    value === o ? 'bg-[#F1F5F9] text-[#364658]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <span className="truncate">{o}</span>
                  {value === o && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** The four filter columns differ per BOM type — an algorithm has no ecosystem or licence. */
const labelsFor = (t: BomType): [string, string, string, string] =>
  t === 'SBOM' ? ['Type', 'Ecosystem', 'License', 'Origin']
    : t === 'CBOM' ? ['Primitive', 'Algorithm', 'Protocol', 'Compliance']
      : ['Provider', 'Task', 'Source', 'License'];

interface BomComponentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  endpointId: string;
  hostName: string;
  productKey: string;
  productLabel: string;
  type: BomType;
  version: number;
  format: string;
}

export function BomComponentsPanel({
  isOpen, onClose, endpointId, hostName, productKey, productLabel, type, version, format,
}: BomComponentsPanelProps) {
  const [search, setSearch] = useState('');
  // Filters start at their own label = "no filter"; that label changes with the BOM type.
  const [f1, setF1] = useState(() => labelsFor(type)[0]);
  const [f2, setF2] = useState(() => labelsFor(type)[1]);
  const [f3, setF3] = useState(() => labelsFor(type)[2]);
  const [f4, setF4] = useState(() => labelsFor(type)[3]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => { setCurrentPage(1); }, [search, f1, f2, f3, f4]);
  // A different BOM type / scope means different filter columns — clear back to the new labels.
  useEffect(() => {
    if (!isOpen) return;
    const l = labelsFor(type);
    setF1(l[0]); setF2(l[1]); setF3(l[2]); setF4(l[3]); setSearch(''); setCurrentPage(1);
  }, [isOpen, type, productKey, version]);

  if (!isOpen) return null;

  const title = type === 'SBOM' ? 'Software components' : type === 'CBOM' ? 'Cryptographic assets' : 'AI models';

  // One row shape per BOM type — the grid renders whatever the adapter returns.
  type Cell = string | { pill: string; map: Record<string, { bg: string; text: string }> } | { excluded: string[] };
  type Row = { cells: Cell[]; mono: number[]; link?: number; search: string; f: [string, string, string, string] };
  let headers: string[] = [];
  const filterLabels = labelsFor(type);
  let rows: Row[] = [];
  const excl = (name: string) => ({ excluded: excludedPathsFor(endpointId, productKey, name) });

  if (type === 'SBOM') {
    headers = ['Component', 'Version', 'Type', 'Ecosystem', 'PURL', 'License', 'Origin', 'Excluded Paths'];
    rows = bomComponents(endpointId, productKey).map((c) => ({
      cells: [c.name, c.version, c.type, c.ecosystem, c.purl, c.license, { pill: c.origin, map: ORIGIN_STYLE }, excl(c.name)],
      mono: [0, 1, 4],
      link: 4,
      search: `${c.name} ${c.version} ${c.type} ${c.ecosystem} ${c.purl} ${c.license} ${c.origin}`.toLowerCase(),
      f: [c.type, c.ecosystem, c.license, c.origin],
    }));
  } else if (type === 'CBOM') {
    // CBOM columns are genuinely different from SBOM: an algorithm has no ecosystem or PURL,
    // it has a primitive, a key length, where it is used and whether it survives PQC migration.
    headers = ['Asset', 'Primitive', 'Algorithm', 'Key Length', 'Protocol', 'Location', 'Expiry', 'Compliance', 'Excluded Paths'];
    rows = bomCryptoAssets(endpointId, productKey).map((c) => ({
      cells: [c.name, c.primitive, c.algorithm, c.keyLength, c.protocol, c.location, c.expiry ?? '—', { pill: c.compliance, map: COMPLIANCE_STYLE }, excl(c.name)],
      mono: [2, 3, 5],
      search: `${c.name} ${c.primitive} ${c.algorithm} ${c.keyLength} ${c.protocol} ${c.location} ${c.compliance}`.toLowerCase(),
      f: [c.primitive, c.algorithm, c.protocol, c.compliance],
    }));
  } else {
    headers = ['Model', 'Provider', 'Version', 'Task', 'Parameters', 'Source', 'License', 'Used For', 'Excluded Paths'];
    rows = bomAiModels(endpointId, productKey).map((m) => ({
      cells: [m.name, m.provider, m.version, m.task, m.parameters, m.source, m.license, m.usage, excl(m.name)],
      mono: [0, 2],
      search: `${m.name} ${m.provider} ${m.version} ${m.task} ${m.source} ${m.license} ${m.usage}`.toLowerCase(),
      f: [m.provider, m.task, m.source, m.license],
    }));
  }

  const opts = (i: 0 | 1 | 2 | 3) => Array.from(new Set(rows.map((r) => r.f[i]))).sort();
  const q = search.trim().toLowerCase();
  const filtered = rows
    .filter((r) => !q || r.search.includes(q))
    .filter((r) => f1 === filterLabels[0] || r.f[0] === f1)
    .filter((r) => f2 === filterLabels[1] || r.f[1] === f2)
    .filter((r) => f3 === filterLabels[2] || r.f[2] === f3)
    .filter((r) => f4 === filterLabels[3] || r.f[3] === f4);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageRows = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const noun = type === 'SBOM' ? 'components' : type === 'CBOM' ? 'crypto assets' : 'models';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50">
      <div className="flex h-full w-[1240px] max-w-[96vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">{title}</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">
              {endpointId} · {hostName} · {productLabel} · {type} v{version} · {format}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => toast.success(`${filtered.length} ${noun} exported`)}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3479b5]"
            >
              <Download size={15} /> Export
            </button>
            <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Select field to search..."
              className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            {search ? (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            )}
          </div>
          <FilterSelect label={filterLabels[0]} value={f1} options={opts(0)} onChange={setF1} />
          <FilterSelect label={filterLabels[1]} value={f2} options={opts(1)} onChange={setF2} />
          <FilterSelect label={filterLabels[2]} value={f3} options={opts(2)} onChange={setF3} />
          <FilterSelect label={filterLabels[3]} value={f4} options={opts(3)} onChange={setF4} />
          <button className="flex size-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]" title="Columns">
            <Columns3 size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="min-h-0 flex-1 overflow-auto px-5">
          {/* SBOM carries a long PURL column, so it needs more room than the other two. */}
          <table className={`w-full ${type === 'SBOM' ? 'min-w-[1320px]' : 'min-w-[1180px]'}`}>
            <thead className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-white">
              <tr>
                <th className="w-[40px] px-4 py-2.5 text-left">
                  <input type="checkbox" className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0" />
                </th>
                {headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {pageRows.length === 0 ? (
                <tr><td colSpan={headers.length + 1} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No {noun} match your filters.</td></tr>
              ) : pageRows.map((r, i) => (
                <tr key={i} className="transition-colors hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0" />
                  </td>
                  {r.cells.map((c, ci) => (
                    <td key={ci} className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">
                      {typeof c === 'string' ? (
                        <span
                          className={`block max-w-[300px] truncate ${r.mono.includes(ci) ? 'font-mono' : ''} ${r.link === ci ? 'text-[#3D8BD0]' : ''}`}
                          title={c}
                        >{c}</span>
                      ) : 'excluded' in c ? (
                        <ExcludedPaths paths={c.excluded} />
                      ) : (
                        <TintPill value={c.pill} map={c.map} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note + pagination */}
        <div className="border-t border-[#E5E7EB] bg-white">
          <div className="px-5 pt-2 text-[12px] text-[#7B8FA5]">
            Showing {filtered.length} of {rows.length} {noun} for {productLabel}
            {type === 'SBOM' && ' · captures the CERT-In minimum elements (supplier, license, origin, direct + transitive dependencies, hash).'}
            {type === 'CBOM' && ' · algorithms, keys and certificates in use, with post-quantum posture.'}
            {type === 'AI BOM' && ' · models this product invokes, with provider, licence and purpose.'}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}
