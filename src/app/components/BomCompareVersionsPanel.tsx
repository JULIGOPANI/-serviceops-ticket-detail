import { useState, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronRight, Check, Plus, Minus, ShieldAlert } from 'lucide-react';
import { bomDiff, bomVersions, componentCount } from './bomData';
import type { BomType, BomProduct, BomDiffEntry } from './bomData';

/* Compare two versions of one BOM scope — a side drawer, so the version rail stays behind it.
 * Reading order: which scope → which two versions → what changed, with the CVEs that rode in on
 * the change called out before the full list. */

const KIND_COLOR: Record<BomDiffEntry['kind'], string> = {
  Added: '#22C55E', Updated: '#F59E0B', Removed: '#EF4444', Unchanged: '#94A3B8',
};
const KIND_PILL: Record<BomDiffEntry['kind'], { bg: string; text: string }> = {
  Added: { bg: '#ECFDF3', text: '#22A06B' },
  Updated: { bg: '#FEF7E6', text: '#D97706' },
  Removed: { bg: '#FEF3F2', text: '#DC2626' },
  Unchanged: { bg: '#F1F5F9', text: '#64748B' },
};

type TabKey = 'All' | 'Added' | 'Updated' | 'Removed' | 'Unchanged';

/** One version end of the comparison: number, changeable via dropdown, with date + size below. */
function VersionBox({
  label, value, options, onChange, dateOf, countOf,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
  dateOf: (v: number) => string;
  countOf: (v: number) => number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{label}</div>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full rounded border border-[#DFE5ED] bg-white px-3 py-2 text-left transition-colors hover:border-[#3D8BD0]"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-semibold text-[#364658]">v{value}</span>
            <ChevronDown size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
          <span className="mt-0.5 block text-[12px] text-[#7B8FA5]">{dateOf(value)}</span>
          <span className="mt-0.5 block text-[12px] font-medium text-[#364658]">{countOf(value)} components</span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
              {options.map((o) => (
                <button
                  key={o}
                  onClick={() => { onChange(o); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    o === value ? 'bg-[#F5FAFF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <span>v{o} <span className="text-[#7B8FA5]">· {dateOf(o)}</span></span>
                  {o === value && <Check size={15} className="text-[#3D8BD0]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DiffRow({ e }: { e: BomDiffEntry }) {
  const [open, setOpen] = useState(false);
  const sign = e.kind === 'Added' ? <Plus size={14} />
    : e.kind === 'Removed' ? <Minus size={14} />
      : e.kind === 'Updated' ? <span className="text-[14px] leading-none">~</span>
        : <span className="text-[14px] leading-none">=</span>;
  return (
    <div className="rounded border border-[#E5E7EB] bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]">
        <span className="flex size-4 flex-shrink-0 items-center justify-center" style={{ color: KIND_COLOR[e.kind] }}>{sign}</span>
        <span className="truncate font-mono text-[13px] text-[#364658]">{e.name}</span>
        {e.bump && <span className="flex-shrink-0 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">{e.bump}</span>}
        {e.cves?.length ? (
          <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-sm bg-[#FEF3F2] px-1.5 py-0.5 text-[11px] font-semibold text-[#DC2626]">
            {e.cves.length} CVE
          </span>
        ) : null}
        <span className="ml-auto flex flex-shrink-0 items-center gap-1.5 font-mono text-[13px]">
          {e.fromVersion && <span className="text-[#9CA3AF] line-through">{e.fromVersion}</span>}
          {e.fromVersion && <ChevronRight size={13} className="text-[#9CA3AF]" />}
          <span className="font-semibold text-[#364658]">{e.version}</span>
        </span>
        <ChevronDown size={15} className={`flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-[#F0F2F5] px-3 py-2.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[#7B8FA5]">Ecosystem</div>
              <div className="mt-0.5 text-[13px] text-[#364658]">{e.ecosystem}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[#7B8FA5]">Change</div>
              <div className="mt-0.5 text-[13px] text-[#364658]">
                {e.kind === 'Added' ? 'First seen in this version'
                  : e.kind === 'Removed' ? 'No longer present on this host'
                    : e.kind === 'Updated' ? `${e.bump} version bump`
                      : 'Identical in both versions'}
              </div>
            </div>
            {e.cves?.length ? (
              <div className="col-span-2">
                <div className="text-[11px] uppercase tracking-wide text-[#7B8FA5]">Known vulnerabilities</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {e.cves.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-sm bg-[#FEF3F2] px-1.5 py-0.5 font-mono text-[12px] text-[#DC2626]">
                      <ShieldAlert size={12} />{c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

interface BomCompareVersionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  endpointId: string;
  hostName: string;
  /** Every scope on the host, so the comparison can be re-pointed without leaving the drawer. */
  products: BomProduct[];
  /** Scope selected in the BOM tab — the default here. */
  productKey: string;
  type: BomType;
}

export function BomCompareVersionsPanel({
  isOpen, onClose, endpointId, hostName, products, productKey, type,
}: BomCompareVersionsPanelProps) {
  const [scopeKey, setScopeKey] = useState(productKey);
  const [showScopes, setShowScopes] = useState(false);
  const [newer, setNewer] = useState(0);
  const [older, setOlder] = useState(0);
  const [tab, setTab] = useState<TabKey>('All');
  const [search, setSearch] = useState('');

  const scope = products.find((p) => p.key === scopeKey) ?? products[0];
  const versions = scope ? bomVersions(endpointId, scope.key, type) : [];
  const nums = versions.map((v) => v.v).sort((a, b) => b - a); // newest first

  // Default to the latest version compared with the one before it.
  useEffect(() => {
    if (!isOpen) return;
    setScopeKey(productKey); setTab('All'); setSearch('');
  }, [isOpen, productKey, type]);

  useEffect(() => {
    if (!isOpen) return;
    const vs = (scope ? bomVersions(endpointId, scope.key, type) : []).map((v) => v.v).sort((a, b) => b - a);
    setNewer(vs[0] ?? 0);
    setOlder(vs[1] ?? vs[0] ?? 0);
  }, [isOpen, scopeKey, type, endpointId]);

  if (!isOpen || !scope) return null;

  const dateOf = (v: number) => versions.find((x) => x.v === v)?.generatedAt.split(' ').slice(0, 3).join(' ') ?? '—';
  const countOf = () => componentCount(endpointId, scope.key, type);

  // Always diff oldest → newest, whichever box holds which, so the labels stay truthful.
  const lo = Math.min(newer, older);
  const hi = Math.max(newer, older);
  const diff = lo === hi
    ? { added: [], updated: [], removed: [], unchangedEntries: [], unchanged: 0 }
    : bomDiff(endpointId, scope.key, type, lo, hi);

  const TABS: { key: TabKey; n: number }[] = [
    { key: 'All', n: diff.added.length + diff.updated.length + diff.removed.length + diff.unchanged },
    { key: 'Added', n: diff.added.length },
    { key: 'Updated', n: diff.updated.length },
    { key: 'Removed', n: diff.removed.length },
    { key: 'Unchanged', n: diff.unchanged },
  ];

  const q = search.trim().toLowerCase();
  const bySearch = (l: BomDiffEntry[]) => (q ? l.filter((e) => e.name.toLowerCase().includes(q)) : l);
  const listFor = (t: TabKey): BomDiffEntry[] =>
    t === 'Added' ? bySearch(diff.added)
      : t === 'Updated' ? bySearch(diff.updated)
        : t === 'Removed' ? bySearch(diff.removed)
          : t === 'Unchanged' ? bySearch(diff.unchangedEntries)
            : bySearch([...diff.added, ...diff.updated, ...diff.removed, ...diff.unchangedEntries]);
  const rows = listFor(tab);

  // Every CVE that arrived, changed or left with this diff, tagged by what happened to it.
  const cveRows = [...diff.added, ...diff.updated, ...diff.removed]
    .flatMap((e) => (e.cves ?? []).map((cve) => ({ cve, name: e.name, kind: e.kind })));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50">
      <div className="flex h-full w-[860px] max-w-[96vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">Compare BOMs</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">{endpointId} · {hostName} · {type}</p>
          </div>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
            <X size={18} />
          </button>
        </div>

        {/* Scope + version pickers */}
        <div className="border-b border-[#F0F2F5] px-5 py-4">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Scanned Paths</div>
          <div className="relative">
            <button
              onClick={() => setShowScopes((v) => !v)}
              className="inline-flex h-9 w-[340px] max-w-full items-center justify-between gap-2 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] text-[#364658] transition-colors hover:border-[#3D8BD0]"
            >
              <span className="truncate">
                {scope.name}{scope.version && <span className="ml-1.5 text-[#7B8FA5]">{scope.version}</span>}
              </span>
              <ChevronDown size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${showScopes ? 'rotate-180' : ''}`} />
            </button>
            {showScopes && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowScopes(false)} />
                <div className="absolute left-0 top-full z-50 mt-1 w-[340px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                  {products.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => { setScopeKey(p.key); setShowScopes(false); }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                        p.key === scopeKey ? 'bg-[#F5FAFF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <span className="truncate">{p.name}{p.version && <span className="ml-1.5 text-[#7B8FA5]">{p.version}</span>}</span>
                      {p.key === scopeKey && <Check size={15} className="text-[#3D8BD0]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 text-[13px] font-medium text-[#364658]">Compare versions</div>
          <div className="mt-2 flex items-end gap-3">
            <VersionBox label="Version" value={newer} options={nums} onChange={setNewer} dateOf={dateOf} countOf={countOf} />
            <span className="pb-4 text-[13px] text-[#7B8FA5]">with</span>
            <VersionBox label="Version" value={older} options={nums} onChange={setOlder} dateOf={dateOf} countOf={countOf} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] px-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${
                tab === t.key ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'
              }`}
            >
              {t.key}
              <span className={`rounded px-1 py-0.5 text-[12px] font-medium ${tab === t.key ? 'bg-[#E8F4FD] text-[#3D8BD0]' : 'bg-[#E5E7EB] text-[#364658]'}`}>{t.n}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components..."
              className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            {search ? (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {lo === hi ? (
            <div className="py-14 text-center text-[13px] text-[#9CA3AF]">Pick two different versions to compare.</div>
          ) : (
            <>
              {/* Critical vulnerabilities lead the All tab — the reason to read a diff at all */}
              {tab === 'All' && cveRows.length > 0 && (
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldAlert size={15} className="text-[#DC2626]" />
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-[#DC2626]">Critical vulnerability</span>
                    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FEF3F2] px-1 text-[11px] font-semibold text-[#DC2626]">{cveRows.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cveRows.map(({ cve, name, kind }, i) => (
                      <div key={`${cve}-${i}`} className="flex items-center gap-2.5 rounded border border-[#FEE4E2] bg-[#FFFBFA] px-3 py-2">
                        <ShieldAlert size={14} className="flex-shrink-0 text-[#DC2626]" />
                        <span className="font-mono text-[13px] font-semibold text-[#DC2626]">{cve}</span>
                        <span className="truncate font-mono text-[13px] text-[#7B8FA5]">{name}</span>
                        <span
                          className="ml-auto flex-shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: KIND_PILL[kind].bg, color: KIND_PILL[kind].text }}
                        >{kind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rows.length === 0 ? (
                <div className="py-14 text-center text-[13px] text-[#9CA3AF]">
                  {q ? 'No components match your search.' : `Nothing ${tab.toLowerCase()} between v${lo} and v${hi}.`}
                </div>
              ) : (
                <div className="space-y-2">
                  {rows.map((e, i) => <DiffRow key={`${e.kind}-${e.name}-${i}`} e={e} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#F0F2F5] px-5 py-3 text-center text-[12px] text-[#7B8FA5]">
          Comparing v{lo} → v{hi} of {scope.name} · {diff.unchanged} unchanged
        </div>
      </div>
    </div>
  );
}
