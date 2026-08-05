import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Settings, Columns3, Download, RefreshCw, Layers, Check } from 'lucide-react';
import { toast } from 'sonner';
import { BomComponentsPage } from './BomComponentsPage';
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

interface EndpointBomTabProps {
  endpointId: string;
  hostName: string;
}

export function EndpointBomTab({ endpointId, hostName }: EndpointBomTabProps) {
  const record = bomForEndpoint(endpointId);
  const [type, setType] = useState<BomType>('SBOM');
  // Default to the OS scope — it is the one every host has, and it rolls up everything unclaimed.
  const [productKey, setProductKey] = useState<string>(
    record.products.some((p) => p.key === OS_PRODUCT_KEY) ? OS_PRODUCT_KEY : (record.products[0]?.key ?? OS_PRODUCT_KEY),
  );
  const [showProducts, setShowProducts] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [downloadFor, setDownloadFor] = useState<number | null>(null);
  const [runsPanel, setRunsPanel] = useState<{ title: string; subtitle: string; runs: BomScanRun[] } | null>(null);
  // When set, the tab is showing the full component listing instead of the version timeline.
  const [componentsFor, setComponentsFor] = useState<number | null>(null);

  // A different endpoint means a different set of products — reset the whole tab.
  useEffect(() => {
    const ps = bomForEndpoint(endpointId).products;
    setProductKey(ps.some((p) => p.key === OS_PRODUCT_KEY) ? OS_PRODUCT_KEY : (ps[0]?.key ?? OS_PRODUCT_KEY));
    setType('SBOM'); setComponentsFor(null); setShowProducts(false);
  }, [endpointId]);

  const product = record.products.find((p) => p.key === productKey) ?? record.products[0];
  const productLabel = product ? (product.version ? `${product.name} ${product.version}` : product.name) : 'OS / base platform';
  const versions = product ? bomVersions(endpointId, product.key, type) : [];
  const count = product ? componentCount(endpointId, product.key, type) : 0;

  // No BOM at all on this host — nothing below the header applies.
  if (!record.products.length) {
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

  // Full component listing takes over the tab (breadcrumb back returns here).
  if (componentsFor !== null && product) {
    return (
      <BomComponentsPage
        endpointId={endpointId}
        hostName={hostName}
        productKey={product.key}
        productLabel={productLabel}
        type={type}
        version={componentsFor}
        format="CycloneDX 1.6"
        onBack={() => setComponentsFor(null)}
      />
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

      {/* Product & scope */}
      <h3 className="text-[15px] font-semibold text-[#364658]">Product &amp; scope</h3>
      <div className="mt-3 flex items-end gap-3">
        <div className="min-w-0">
          <label className="mb-1 block text-[12px] text-[#7B8FA5]">Product</label>
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
                  {record.products.map((p) => (
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
          <div className="mb-1 mt-7 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#364658]">{type} versions</h3>
              <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[12px] font-semibold text-[#64748B]">
                {versions.length}
              </span>
            </div>
            <button
              onClick={() => setShowCompare(true)}
              disabled={versions.length < 2}
              className="inline-flex h-8 items-center gap-1.5 rounded border border-[#3D8BD0] bg-white px-3 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#F5FAFF] disabled:cursor-not-allowed disabled:border-[#DFE5ED] disabled:text-[#9CA3AF] disabled:hover:bg-white"
              title={versions.length < 2 ? 'Needs at least two versions to compare' : undefined}
            >
              <Columns3 size={15} /> Compare versions
            </button>
          </div>
          <p className="mb-4 text-[13px] text-[#7B8FA5]">
            A version appears only when a scan finds a change — the line between two versions shows how many scans ran in that gap.
          </p>

          {versions.map((v, i) => (
            <div key={v.v}>
              {/* Version card — the current one is tinted so the head of the chain is obvious */}
              <div className={`rounded-lg border p-4 ${v.state === 'Current' ? 'border-[#3D8BD0] bg-[#F8FBFF]' : 'border-[#E5E7EB] bg-white'}`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-[15px] font-semibold text-[#364658]">v{v.v}</span>
                  <span className="text-[14px] text-[#364658]">{v.generatedAt}</span>
                  <span
                    className="rounded-sm px-2 py-0.5 text-[12px] font-medium"
                    style={v.state === 'Current'
                      ? { backgroundColor: '#E8F4FD', color: '#3D8BD0' }
                      : { backgroundColor: '#F1F5F9', color: '#64748B' }}
                  >{v.state}</span>

                  <div className="ml-auto flex flex-shrink-0 items-center gap-2">
                    <span className="rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#64748B]">{v.format}</span>
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
                    {v.state === 'Current' && (
                      <button
                        onClick={() => toast.success(`Re-scanning ${productLabel} on ${hostName}`)}
                        className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
                        title={`Re-scan v${v.v}`}
                      ><RefreshCw size={15} /></button>
                    )}
                    <button
                      onClick={() => setComponentsFor(v.v)}
                      className="inline-flex h-8 items-center gap-1 rounded px-2 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#F5FAFF]"
                    >
                      {viewLabel(type)} · {count}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[13px] text-[#7B8FA5]">{v.change}</p>
              </div>

              {/* Connector — the scans that ran in this gap (including the ones that changed nothing) */}
              <button
                onClick={() => setRunsPanel({
                  title: v.v === 1 ? 'Scans before v1' : `Scans between v${v.v - 1} and v${v.v}`,
                  subtitle: `${v.runs.length} run${v.runs.length === 1 ? '' : 's'} · the last one produced v${v.v}`,
                  runs: v.runs,
                })}
                className="group flex w-full items-center gap-2 py-2.5 pl-5 text-left"
              >
                <span className="size-1.5 flex-shrink-0 rounded-full border border-[#CBD5E1] bg-white" />
                <span className="text-[13px] text-[#7B8FA5]">
                  <span className="font-medium text-[#364658]">{v.gapLabel.split(' ').slice(0, 2).join(' ')}</span>
                  {' '}{v.gapLabel.split(' ').slice(2).join(' ')}
                </span>
                <span className="text-[13px] font-medium text-[#3D8BD0] opacity-0 transition-opacity group-hover:opacity-100">View</span>
              </button>
              {i === versions.length - 1 && <div className="h-2" />}
            </div>
          ))}
        </>
      )}

      {/* Sub-screens */}
      <BomScanPathsPanel
        isOpen={showPaths}
        onClose={() => setShowPaths(false)}
        endpointId={endpointId}
        hostName={hostName}
        products={record.products}
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
