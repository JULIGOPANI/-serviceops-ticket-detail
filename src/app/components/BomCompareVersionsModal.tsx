import { useState, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronRight, Check, Plus, Minus, ShieldAlert } from 'lucide-react';
import { bomDiff } from './bomData';
import type { BomType, BomVersion, BomDiffEntry } from './bomData';

/* Compare two versions of one BOM scope. The question this screen answers is "what actually
 * changed between these two scans, and does any of it matter for security". */

const KIND_COLOR: Record<BomDiffEntry['kind'], string> = { Added: '#22C55E', Updated: '#F59E0B', Removed: '#EF4444' };

/** Compact select used for the version pickers and the ecosystem / sort filters. */
function MiniSelect({ value, options, onChange, width = 'w-[120px]' }: { value: string; options: string[]; onChange: (v: string) => void; width?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-8 ${width} items-center justify-between gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F7FA]`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-full rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
            <div className="max-h-[260px] overflow-y-auto">
              {options.map((o) => (
                <button
                  key={o}
                  onClick={() => { onChange(o); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-left text-[13px] transition-colors ${
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

function DiffRow({ e }: { e: BomDiffEntry }) {
  const [open, setOpen] = useState(false);
  const sign = e.kind === 'Added' ? <Plus size={14} /> : e.kind === 'Removed' ? <Minus size={14} /> : <span className="text-[14px] leading-none">~</span>;
  return (
    <div className="rounded border border-[#E5E7EB] bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]">
        <span className="flex size-4 flex-shrink-0 items-center justify-center" style={{ color: KIND_COLOR[e.kind] }}>{sign}</span>
        <span className="truncate font-mono text-[13px] text-[#364658]">{e.name}</span>
        {e.bump && (
          <span className="flex-shrink-0 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">{e.bump}</span>
        )}
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
                {e.kind === 'Added' ? 'First seen in this version' : e.kind === 'Removed' ? 'No longer present on this host' : `${e.bump} version bump`}
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

interface BomCompareVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpointId: string;
  hostName: string;
  productKey: string;
  productLabel: string;
  type: BomType;
  versions: BomVersion[];
}

export function BomCompareVersionsModal({
  isOpen, onClose, endpointId, hostName, productKey, productLabel, type, versions,
}: BomCompareVersionsModalProps) {
  const ordered = [...versions].sort((a, b) => a.v - b.v);
  const defaultTo = ordered.length ? ordered[ordered.length - 1].v : 1;
  const defaultFrom = ordered.length > 1 ? ordered[ordered.length - 2].v : defaultTo;

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [search, setSearch] = useState('');
  const [ecosystem, setEcosystem] = useState('All ecosystems');
  const [sort, setSort] = useState('Sort: Name');
  const [securityOnly, setSecurityOnly] = useState(false);

  // Reset the pickers whenever the modal opens for a different scope.
  useEffect(() => {
    if (!isOpen) return;
    setFrom(defaultFrom); setTo(defaultTo); setSearch(''); setEcosystem('All ecosystems');
    setSort('Sort: Name'); setSecurityOnly(false);
  }, [isOpen, endpointId, productKey, type]);

  if (!isOpen) return null;

  const diff = bomDiff(endpointId, productKey, type, from, to);
  const total = diff.added.length + diff.updated.length + diff.removed.length + diff.unchanged;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const ecosystems = ['All ecosystems', ...Array.from(new Set([...diff.added, ...diff.updated, ...diff.removed].map((e) => e.ecosystem))).sort()];
  const q = search.trim().toLowerCase();
  const apply = (list: BomDiffEntry[]) => {
    let out = list
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .filter((e) => ecosystem === 'All ecosystems' || e.ecosystem === ecosystem)
      .filter((e) => !securityOnly || (e.cves?.length ?? 0) > 0);
    out = [...out].sort((a, b) => (sort === 'Sort: Name' ? a.name.localeCompare(b.name) : a.ecosystem.localeCompare(b.ecosystem)));
    return out;
  };
  const updated = apply(diff.updated);
  const added = apply(diff.added);
  const removed = apply(diff.removed);
  const nothing = !updated.length && !added.length && !removed.length;

  const versionOptions = ordered.map((v) => `v${v.v}`);
  const Section = ({ kind, list }: { kind: BomDiffEntry['kind']; list: BomDiffEntry[] }) =>
    list.length === 0 ? null : (
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: KIND_COLOR[kind] }} />
          <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: KIND_COLOR[kind] }}>{kind}</span>
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EEF2F6] px-1 text-[11px] font-semibold text-[#64748B]">{list.length}</span>
        </div>
        <div className="space-y-2">{list.map((e, i) => <DiffRow key={`${e.name}-${i}`} e={e} />)}</div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-6">
      <div className="flex max-h-[88vh] w-[1000px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-5">
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold text-[#364658]">Compare versions</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">{hostName} · {productLabel} · {type}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <MiniSelect value={`v${from}`} options={versionOptions} onChange={(v) => setFrom(Number(v.slice(1)))} width="w-[76px]" />
            <ChevronRight size={16} className="text-[#9CA3AF]" />
            <MiniSelect value={`v${to}`} options={versionOptions} onChange={(v) => setTo(Number(v.slice(1)))} width="w-[76px]" />
            <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Change summary + proportional bar */}
        <div className="px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {([['Added', diff.added.length], ['Updated', diff.updated.length], ['Removed', diff.removed.length]] as const).map(([k, n]) => (
              <span key={k} className="inline-flex items-baseline gap-1.5">
                <span className="size-2 self-center rounded-full" style={{ backgroundColor: KIND_COLOR[k as BomDiffEntry['kind']] }} />
                <span className="text-[16px] font-semibold text-[#364658]">{n}</span>
                <span className="text-[13px] text-[#364658]">{k}</span>
                <span className="text-[12px] text-[#9CA3AF]">{pct(n)}%</span>
              </span>
            ))}
            <span className="inline-flex items-baseline gap-1.5">
              <span className="size-2 self-center rounded-full bg-[#CBD5E1]" />
              <span className="text-[16px] font-semibold text-[#364658]">{diff.unchanged}</span>
              <span className="text-[13px] text-[#364658]">Unchanged</span>
              <span className="text-[12px] text-[#9CA3AF]">{pct(diff.unchanged)}%</span>
            </span>
          </div>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
            {([['Added', diff.added.length], ['Updated', diff.updated.length], ['Removed', diff.removed.length]] as const).map(([k, n]) => (
              <div key={k} style={{ width: `${pct(n)}%`, backgroundColor: KIND_COLOR[k as BomDiffEntry['kind']] }} />
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-6 py-4">
          <div className="relative flex-1">
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
          <MiniSelect value={ecosystem} options={ecosystems} onChange={setEcosystem} width="w-[150px]" />
          <MiniSelect value={sort} options={['Sort: Name', 'Sort: Ecosystem']} onChange={setSort} width="w-[150px]" />
          <button
            onClick={() => setSecurityOnly((v) => !v)}
            className={`inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded border px-2.5 text-[13px] font-medium transition-colors ${
              securityOnly ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'
            }`}
          >
            Security only
          </button>
        </div>

        {/* Diff list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          {nothing ? (
            <div className="py-14 text-center text-[13px] text-[#9CA3AF]">
              {securityOnly ? 'No vulnerable components changed between these versions.' : 'No changes match your filters.'}
            </div>
          ) : (
            <>
              <Section kind="Updated" list={updated} />
              <Section kind="Added" list={added} />
              <Section kind="Removed" list={removed} />
            </>
          )}
        </div>

        {/* Footer note */}
        <div className="border-t border-[#F0F2F5] px-6 py-3 text-center text-[12px] text-[#7B8FA5]">
          {diff.unchanged} component{diff.unchanged === 1 ? '' : 's'} unchanged between v{from} and v{to} — not listed.
        </div>
      </div>
    </div>
  );
}
