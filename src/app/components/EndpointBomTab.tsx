import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Settings, Columns3, Download, Layers, Check, Search, X, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { BomComponentsPanel } from './BomComponentsPanel';
import { BomCompareVersionsModal } from './BomCompareVersionsModal';
import { BomScanPathsPanel } from './BomScanPathsPanel';
import { BomScanRunsPanel } from './BomScanRunsPanel';
import { bomForEndpoint, bomVersions, componentCount, OS_PRODUCT_KEY } from './bomData';
import type { BomType, BomVersion, BomScanRun } from './bomData';

/* BOM tab of the ENDPOINT detail page.
 *
 * Reading order top to bottom: which KIND of BOM (SBOM / CBOM / AI BOM) → which PRODUCT scope on
 * this host → the version history for that scope. A version only exists where a scan found a
 * change, so the connector between two cards accounts for the scans that found nothing. */

const BOM_TYPES: BomType[] = ['SBOM', 'CBOM', 'AI BOM'];

/** "View components" / "View crypto assets" / "View models" — the noun follows the BOM type. */
const viewLabel = (t: BomType) => (t === 'SBOM' ? 'View components' : t === 'CBOM' ? 'View crypto assets' : 'View models');

interface DownloadPopoverProps {
  version: BomVersion;
  type: BomType;
  productLabel: string;
  count: number;
  onClose: () => void;
}

/** Format picker — a BOM is generated as CycloneDX and converted on export. */
function DownloadPopover({ version, type, productLabel, count, onClose }: DownloadPopoverProps) {
  const [format, setFormat] = useState<'CycloneDX 1.6' | 'SPDX 2.3'>('CycloneDX 1.6');
  const OPTIONS = [
    { id: 'CycloneDX 1.6' as const, note: 'OWASP standard · what this BOM was generated as' },
    { id: 'SPDX 2.3' as const, note: 'Linux Foundation standard · converted on export' },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 w-[380px] rounded-lg border border-[#DFE5ED] bg-white p-4 shadow-lg">
        <h4 className="text-[14px] font-semibold text-[#364658]">Download {type} v{version.v} — {productLabel}</h4>
        <p className="mt-1 text-[13px] text-[#7B8FA5]">
          {count} component{count === 1 ? '' : 's'} · generated {version.generatedAt} · {version.state === 'Current' ? 'current version' : 'superseded version'}
        </p>
        <div className="mt-3 space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setFormat(o.id)}
              className={`flex w-full items-start gap-2.5 rounded border p-3 text-left transition-colors ${
                format === o.id ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
              }`}
            >
              <span className={`mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${format === o.id ? 'border-[#3D8BD0]' : 'border-[#CBD5E1]'}`}>
                {format === o.id && <span className="size-2 rounded-full bg-[#3D8BD0]" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#364658]">{o.id}</span>
                <span className="mt-0.5 block text-[12px] text-[#7B8FA5]">{o.note}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">
            Cancel
          </button>
          <button
            onClick={() => { toast.success(`${type} v${version.v} downloaded as ${format}`); onClose(); }}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3479b5]"
          >
            <Download size={15} /> Download
          </button>
        </div>
      </div>
    </>
  );
}

/* Version search — the only thing worth searching a short version rail by is WHEN it was
 * generated, so the box builds a date condition: field → operator → value, the same three-step
 * shape the components drawer uses. */
export type DateFilter =
  | { kind: 'all' }
  | { kind: 'within'; label: string; days: number }
  | { kind: 'before'; date: string }
  | { kind: 'after'; date: string }
  | { kind: 'between'; from: string; to: string };

type DateOperator = 'is within' | 'is before' | 'is after' | 'is between';
const DATE_OPERATORS: DateOperator[] = ['is within', 'is before', 'is after', 'is between'];

const DATE_PRESETS: { label: string; days: number }[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'This quarter', days: 90 },
  { label: 'Last 6 months', days: 182 },
  { label: 'This year', days: 365 },
];

const dateFilterOp = (f: DateFilter): string =>
  f.kind === 'all' ? '' : f.kind === 'within' ? 'is within' : f.kind === 'between' ? 'is between' : `is ${f.kind}`;

const dateFilterValue = (f: DateFilter): string => {
  switch (f.kind) {
    case 'all': return '';
    case 'within': return f.label;
    case 'before': case 'after': return f.date;
    case 'between': return `${f.from || '…'} → ${f.to || '…'}`;
  }
};

/** Parse the module's "Jun 16, 2026 08:33 AM" stamps — resolves to LOCAL midnight of that day. */
const parseStamp = (s: string) => new Date(s.split(' ').slice(0, 3).join(' ').replace(',', ''));

/** A yyyy-mm-dd picker value as LOCAL midnight. `new Date('2026-06-12')` would parse as UTC,
 *  which lands mid-morning in +05:30 and lets same-day versions slip past "is before". */
const localDay = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1).getTime();
};

function VersionDateSearch({ value, onChange }: { value: DateFilter; onChange: (f: DateFilter) => void }) {
  // null = closed. {} = picking the field. {field} = picking the operator. {field, op} = value.
  const [step, setStep] = useState<{ field?: 'Date'; op?: DateOperator } | null>(null);
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  const active = value.kind !== 'all';

  const close = () => { setStep(null); setD1(''); setD2(''); };
  const apply = (f: DateFilter) => { onChange(f); close(); };

  const dateInput = 'h-8 w-full rounded border border-[#d1d5db] bg-white px-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

  return (
    <div className="relative min-w-0 flex-1">
      <div
        onClick={() => setStep((s) => (s ? null : {}))}
        className={`flex min-h-8 w-full max-w-[460px] cursor-pointer flex-wrap items-center gap-1.5 rounded border bg-white px-2.5 py-1 transition-colors ${
          step || active ? 'border-[#3D8BD0]' : 'border-[#d1d5db] hover:border-[#3D8BD0]'
        }`}
      >
        {active && !step && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[12px] text-[#3D8BD0]">
            <CalendarDays size={12} />
            <span className="font-medium">Date</span>
            <span className="text-[#7B8FA5]">{dateFilterOp(value)}</span>
            <span className="font-medium">{dateFilterValue(value)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onChange({ kind: 'all' }); }}
              className="text-[#3D8BD0]/70 hover:text-[#DC2626]"
            ><X size={12} /></button>
          </span>
        )}
        {/* Breadcrumb of what has been chosen so far */}
        {step && (
          <span className="inline-flex items-center gap-1 text-[13px] text-[#364658]">
            {step.field && <span className="font-medium">{step.field}</span>}
            {step.field && <ChevronRight size={13} className="text-[#9CA3AF]" />}
            {step.op && <span className="text-[#7B8FA5]">{step.op}</span>}
            {step.op && <ChevronRight size={13} className="text-[#9CA3AF]" />}
          </span>
        )}
        {!active && !step && <span className="text-[13px] text-[#9ca3af]">Search versions by date...</span>}
        <Search className="ml-auto flex-shrink-0 text-[#9ca3af]" size={16} />
      </div>

      {step && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
            {/* Step 1 — field */}
            {!step.field && (
              <>
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Filter by field</div>
                <button
                  onClick={() => setStep({ field: 'Date' })}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                >
                  <span className="inline-flex items-center gap-2"><CalendarDays size={14} className="text-[#7B8FA5]" />Date</span>
                  <ChevronRight size={14} className="text-[#9CA3AF]" />
                </button>
              </>
            )}

            {/* Step 2 — operator */}
            {step.field && !step.op && (
              <>
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Operator</div>
                {DATE_OPERATORS.map((op) => (
                  <button
                    key={op}
                    onClick={() => { setStep({ ...step, op }); setD1(''); setD2(''); }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                  >
                    {op}<ChevronRight size={14} className="text-[#9CA3AF]" />
                  </button>
                ))}
              </>
            )}

            {/* Step 3 — value; quick presets for "is within", a date picker otherwise */}
            {step.field && step.op === 'is within' && (
              <>
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Quick ranges</div>
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => apply({ kind: 'within', label: p.label, days: p.days })}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                      value.kind === 'within' && value.label === p.label ? 'bg-[#F5FAFF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {p.label}
                    {value.kind === 'within' && value.label === p.label && <Check size={15} className="text-[#3D8BD0]" />}
                  </button>
                ))}
                <div className="my-1 border-t border-[#F0F2F5]" />
                <button
                  onClick={() => setStep({ ...step, op: 'is between' })}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                >
                  Custom range…<ChevronRight size={14} className="text-[#9CA3AF]" />
                </button>
              </>
            )}

            {step.field && (step.op === 'is before' || step.op === 'is after') && (
              <div className="px-3 pb-2 pt-2">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Date</div>
                <input type="date" value={d1} onChange={(e) => setD1(e.target.value)} className={dateInput} />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={close} className="inline-flex h-7 items-center rounded border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
                  <button
                    onClick={() => d1 && apply(step.op === 'is before' ? { kind: 'before', date: d1 } : { kind: 'after', date: d1 })}
                    disabled={!d1}
                    className="inline-flex h-7 items-center rounded bg-[#3D8BD0] px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3479b5] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
                  >Apply</button>
                </div>
              </div>
            )}

            {step.field && step.op === 'is between' && (
              <div className="px-3 pb-2 pt-2">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Custom range</div>
                <div className="flex items-center gap-2">
                  <input type="date" value={d1} onChange={(e) => setD1(e.target.value)} className={dateInput} />
                  <span className="text-[12px] text-[#9CA3AF]">to</span>
                  <input type="date" value={d2} onChange={(e) => setD2(e.target.value)} className={dateInput} />
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={close} className="inline-flex h-7 items-center rounded border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
                  <button
                    onClick={() => (d1 || d2) && apply({ kind: 'between', from: d1, to: d2 })}
                    disabled={!d1 && !d2}
                    className="inline-flex h-7 items-center rounded bg-[#3D8BD0] px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3479b5] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
                  >Apply</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface EndpointBomTabProps {
  endpointId: string;
  hostName: string;
}

export function EndpointBomTab({ endpointId, hostName }: EndpointBomTabProps) {
  const record = bomForEndpoint(endpointId);
  // Products are editable in Manage scan paths, so they live in state rather than being read
  // straight from the record on every render.
  const [products, setProducts] = useState(record.products);
  const defaultKey = (ps: typeof products) => (ps.find((p) => p.isDefault) ?? ps.find((p) => p.key === OS_PRODUCT_KEY) ?? ps[0])?.key ?? OS_PRODUCT_KEY;
  const [type, setType] = useState<BomType>('SBOM');
  const [productKey, setProductKey] = useState<string>(() => defaultKey(record.products));
  const [showProducts, setShowProducts] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [downloadFor, setDownloadFor] = useState<number | null>(null);
  const [runsPanel, setRunsPanel] = useState<{ title: string; subtitle: string; runs: BomScanRun[] } | null>(null);
  // Version whose component listing is open in the side drawer (null = drawer closed).
  const [componentsFor, setComponentsFor] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: 'all' });

  // A different endpoint means a different set of products — reset the whole tab.
  useEffect(() => {
    const ps = bomForEndpoint(endpointId).products;
    setProducts(ps);
    setProductKey(defaultKey(ps));
    setType('SBOM'); setComponentsFor(null); setShowProducts(false); setDateFilter({ kind: 'all' });
  }, [endpointId]);

  const product = products.find((p) => p.key === productKey) ?? products[0];
  const productLabel = product ? (product.version ? `${product.name} ${product.version}` : product.name) : 'OS / base platform';
  const versions = product ? bomVersions(endpointId, product.key, type) : [];
  const count = product ? componentCount(endpointId, product.key, type) : 0;

  // Date filter over the rail. Presets are relative to the newest version, so the demo data
  // stays inside the window instead of ageing out of it.
  const shownVersions = (() => {
    if (dateFilter.kind === 'all' || versions.length === 0) return versions;
    const at = (v: BomVersion) => parseStamp(v.generatedAt).getTime();
    const dayEnd = (d: string) => localDay(d) + 86399999;
    switch (dateFilter.kind) {
      case 'within': {
        // Relative to the NEWEST version, so demo data never ages out of its own filter.
        const cutoff = at(versions[0]) - dateFilter.days * 86400000;
        return versions.filter((v) => at(v) >= cutoff);
      }
      // "before"/"after" exclude the named day itself — a version dated Jun 12 is neither
      // before nor after Jun 12.
      case 'before': return versions.filter((v) => at(v) < localDay(dateFilter.date));
      case 'after': return versions.filter((v) => at(v) > dayEnd(dateFilter.date));
      case 'between': {
        const from = dateFilter.from ? localDay(dateFilter.from) : -Infinity;
        const to = dateFilter.to ? dayEnd(dateFilter.to) : Infinity;
        return versions.filter((v) => at(v) >= from && at(v) <= to);
      }
    }
  })();

  // No BOM at all on this host — nothing below the header applies.
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
          <Layers className="size-6 text-[#9CA3AF]" />
        </div>
        <p className="text-[14px] font-medium text-[#364658]">No BOM generated for this endpoint</p>
        <p className="mt-1 max-w-[440px] text-[13px] text-[#7B8FA5]">
          The agent has not completed a Bill of Materials scan on this host yet. Run
          <span className="font-medium text-[#364658]"> Scan Now </span>
          to generate the first SBOM.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {/* BOM type sub-tabs — the counts are the reason to switch */}
      <div className="mb-5 inline-flex items-center gap-1 rounded border border-[#DFE5ED] p-1">
        {BOM_TYPES.map((t) => {
          const n = product ? componentCount(endpointId, product.key, t) : 0;
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                type === t ? 'bg-[#3D8BD0] text-white' : 'text-[#364658] hover:bg-[#F5F7FA]'
              }`}
            >
              {t}
              <span className={type === t ? 'text-white/80' : 'text-[#7B8FA5]'}>· {n}</span>
            </button>
          );
        })}
      </div>

      {/* Section title first — the versions are what this tab is about; the product select below
          is the scope control for them, not a separate section. */}
      <div className="flex items-center gap-2">
        <h3 className="text-[15px] font-semibold text-[#364658]">{type} versions</h3>
        <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[12px] font-semibold text-[#64748B]">
          {versions.length}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-[#7B8FA5]">
        A version appears only when a scan finds a change — the line between two versions shows how many scans ran in that gap.
      </p>

      {/* Scope control — items-end so the CTA sits on the select's baseline, not the label's */}
      <div className="mt-6 flex items-end gap-3">
        <div className="min-w-0">
          <label className="mb-1.5 block text-[12px] font-medium text-[#7B8FA5]">Scanned Paths</label>
          <div className="relative">
            <button
              onClick={() => setShowProducts((v) => !v)}
              className="inline-flex h-9 w-[300px] items-center justify-between gap-2 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] text-[#364658] transition-colors hover:border-[#3D8BD0]"
            >
              <span className="truncate">
                {product?.name}
                {product?.version && <span className="ml-1.5 text-[#7B8FA5]">{product.version}</span>}
              </span>
              <ChevronDown size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${showProducts ? 'rotate-180' : ''}`} />
            </button>
            {showProducts && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProducts(false)} />
                <div className="absolute left-0 top-full z-50 mt-1 w-[300px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                  <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Products on this host</div>
                  {products.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => { setProductKey(p.key); setShowProducts(false); setComponentsFor(null); }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                        p.key === productKey ? 'bg-[#F5FAFF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <span className="truncate">
                        {p.name}
                        {p.version && <span className={`ml-1.5 ${p.key === productKey ? 'text-[#3D8BD0]/70' : 'text-[#7B8FA5]'}`}>{p.version}</span>}
                      </span>
                      {/* findings on that scope — the reason to look at it */}
                      <span
                        className={`inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                          p.findings > 0 ? 'bg-[#FEF7E6] text-[#D97706]' : 'bg-[#EEF2F6] text-[#94A3B8]'
                        }`}
                      >{p.findings}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowPaths(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded border border-[#3D8BD0] bg-[#F5FAFF] px-3 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
        >
          <Settings size={15} /> Manage scan paths
        </button>
      </div>
      <p className="mt-2 text-[13px] text-[#7B8FA5]">
        {product?.key === OS_PRODUCT_KEY
          ? 'Everything not claimed by another product on this host rolls up here.'
          : <>Scanned at <span className="font-mono text-[#364658]">{product?.path}</span> on this host · {count} component{count === 1 ? '' : 's'}.</>}
      </p>

      {/* Version timeline */}
      {versions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
            <Layers className="size-6 text-[#9CA3AF]" />
          </div>
          <p className="text-[13px] text-[#7B8FA5]">
            No {type} for {productLabel}. Selection is kept — pick another product to compare.
          </p>
        </div>
      ) : (
        <>
          {/* Version-rail toolbar: date search + compare */}
          <div className="mb-3 mt-5 flex items-center justify-between gap-3">
            <VersionDateSearch value={dateFilter} onChange={setDateFilter} />
            <button
              onClick={() => setShowCompare(true)}
              disabled={versions.length < 2}
              className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded border border-[#3D8BD0] bg-white px-3 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#F5FAFF] disabled:cursor-not-allowed disabled:border-[#DFE5ED] disabled:text-[#9CA3AF] disabled:hover:bg-white"
              title={versions.length < 2 ? 'Needs at least two versions to compare' : undefined}
            >
              <Columns3 size={15} /> Compare versions
            </button>
          </div>

          {shownVersions.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#E5E7EB] py-10 text-center text-[13px] text-[#9CA3AF]">
              No versions generated in this period.
            </div>
          )}

          {shownVersions.map((v, i) => (
            <div key={v.v}>
              {/* Version card — the current one is tinted so the head of the chain is obvious */}
              {/* Left block (identity + change dots) and right block (actions) are siblings on one
                  centred row, so the actions sit against the middle of both lines, not the first. */}
              <div className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${v.state === 'Current' ? 'border-[#3D8BD0] bg-[#F8FBFF]' : 'border-[#E5E7EB] bg-white'}`}>
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-[15px] font-semibold text-[#364658]">v{v.v}</span>
                  <span className="text-[14px] text-[#364658]">{v.generatedAt}</span>
                  <span
                    className="rounded-sm px-2 py-0.5 text-[12px] font-medium"
                    style={v.state === 'Current'
                      ? { backgroundColor: '#E8F4FD', color: '#3D8BD0' }
                      : { backgroundColor: '#F1F5F9', color: '#64748B' }}
                  >{v.state}</span>
                  {/* Format sits with the state tag — both describe what this version IS. */}
                  <span className="rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#64748B]">{v.format}</span>
                </div>
                  {/* What this version changed — green added · red removed · amber updated. */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {([
                      ['#22C55E', v.added, 'added'],
                      ['#EF4444', v.removed, 'removed'],
                      ['#F59E0B', v.updated, 'updated'],
                    ] as const).map(([color, n, label]) => (
                      <span key={label} className="inline-flex items-center gap-1.5">
                        <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: n > 0 ? color : '#CBD5E1' }} />
                        <span className={`text-[13px] font-semibold ${n > 0 ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{n}</span>
                        <span className="text-[13px] text-[#7B8FA5]">{label}</span>
                      </span>
                    ))}
                    {v.v === 1 && <span className="text-[13px] text-[#9CA3AF]">· initial agent scan</span>}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setDownloadFor(downloadFor === v.v ? null : v.v)}
                      className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
                      title={`Download v${v.v}`}
                    ><Download size={15} /></button>
                    {downloadFor === v.v && (
                      <DownloadPopover
                        version={v}
                        type={type}
                        productLabel={productLabel}
                        count={count}
                        onClose={() => setDownloadFor(null)}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setComponentsFor(v.v)}
                    className="inline-flex h-8 items-center gap-1 rounded px-2 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#F5FAFF]"
                  >
                    {viewLabel(type)} · {count}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Connector — the scans that ran in this gap (including the ones that changed nothing) */}
              <button
                onClick={() => setRunsPanel({
                  title: v.v === 1 ? 'Scans before v1' : `Scans between v${v.v - 1} and v${v.v}`,
                  subtitle: `${v.runs.length} run${v.runs.length === 1 ? '' : 's'} · the last one produced v${v.v}`,
                  runs: v.runs,
                })}
                className="group flex w-full items-center gap-2 py-4 pl-5 text-left"
              >
                <span className="size-1.5 flex-shrink-0 rounded-full border border-[#CBD5E1] bg-white" />
                <span className="text-[13px] text-[#7B8FA5]">
                  <span className="font-medium text-[#364658]">{v.gapLabel.split(' ').slice(0, 2).join(' ')}</span>
                  {' '}{v.gapLabel.split(' ').slice(2).join(' ')}
                </span>
                <span className="text-[13px] font-medium text-[#3D8BD0] opacity-0 transition-opacity group-hover:opacity-100">View</span>
              </button>
              {i === shownVersions.length - 1 && <div className="h-2" />}
            </div>
          ))}
        </>
      )}

      {/* Sub-screens */}
      <BomComponentsPanel
        isOpen={componentsFor !== null}
        onClose={() => setComponentsFor(null)}
        endpointId={endpointId}
        hostName={hostName}
        productKey={product?.key ?? OS_PRODUCT_KEY}
        productLabel={productLabel}
        type={type}
        version={componentsFor ?? 0}
        format="CycloneDX 1.6"
      />
      <BomScanPathsPanel
        isOpen={showPaths}
        onClose={() => setShowPaths(false)}
        endpointId={endpointId}
        hostName={hostName}
        products={products}
        onProductsChange={(next) => {
          setProducts(next);
          // Follow the default scope if it moved, or if the selected product was deleted.
          if (!next.some((p) => p.key === productKey)) setProductKey(defaultKey(next));
          else {
            const movedDefault = next.find((p) => p.isDefault);
            if (movedDefault && !record.products.find((p) => p.key === movedDefault.key)?.isDefault) setProductKey(movedDefault.key);
          }
        }}
      />
      <BomCompareVersionsModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        endpointId={endpointId}
        hostName={hostName}
        productKey={product?.key ?? OS_PRODUCT_KEY}
        productLabel={productLabel}
        type={type}
        versions={versions}
      />
      <BomScanRunsPanel
        isOpen={!!runsPanel}
        onClose={() => setRunsPanel(null)}
        title={runsPanel?.title ?? ''}
        subtitle={runsPanel?.subtitle ?? ''}
        runs={runsPanel?.runs ?? []}
      />
    </div>
  );
}

/** BOM Info group for the endpoint's right-hand properties rail — the facts a compliance
 *  reviewer asks for (format, freshness, signature, CMDB linkage). */
export function BomInfoPanel({ endpointId }: { endpointId: string }) {
  const record = bomForEndpoint(endpointId);
  const product = record.products[0];
  if (!product) return null;
  const versions = bomVersions(endpointId, product.key, 'SBOM');
  const current = versions.find((v) => v.state === 'Current');
  const rows: [string, React.ReactNode][] = [
    ['Format', 'CycloneDX 1.6'],
    ['Generated', record.lastGenerated ?? '—'],
    ['BOM version', current ? `v${current.v} · living SBOM` : '—'],
    ['Components', String(componentCount(endpointId, product.key, 'SBOM'))],
    ['Signed', <span className="inline-flex items-center gap-1 text-[#22A06B]">cosign <Check size={13} /></span>],
  ];
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-[#7B8FA5]" />
        <h4 className="text-[14px] font-semibold text-[#364658]">BOM Info</h4>
      </div>
      <p className="mt-1 text-[12px] text-[#7B8FA5]">{product.name}{product.version ? ` ${product.version}` : ''} · SBOM</p>
      <div className="mt-3 space-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <span className="text-[13px] text-[#7B8FA5]">{k}</span>
            <span className="text-right text-[13px] font-medium text-[#364658]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
