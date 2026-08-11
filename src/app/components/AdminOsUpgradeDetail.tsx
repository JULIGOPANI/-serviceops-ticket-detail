import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, ExternalLink, Search, X } from 'lucide-react';
import { Pagination } from './Pagination';
import { UploadStatusPill, UPLOAD_TONE } from './OsUpgradeUpload';
import { compatCounts, computersFor, prerequisitesFor } from './osUpgradeData';
import type { CompatStatus, OsImage, OsUploadStatus, PrereqKey } from './osUpgradeData';

/* OS Upgrade — detail page.
 *
 * Summary puts the image's metadata next to the prerequisites it enforces, because those two
 * answer the only question an admin has here: what is this ISO, and who can take it. Computers
 * then answers "who" concretely, evaluated from the very rules shown on the card beside it. */

interface AdminOsUpgradeDetailProps {
  image: OsImage;
  /** Live upload state — differs from image.status only while a transfer is in flight. */
  status: OsUploadStatus;
  onBack: () => void;
  onCrumb: (crumb: 'admin' | 'patch' | 'list') => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '14 Oct 2027' → Date. Parsed by hand rather than Date.parse, which is engine-dependent. */
function parseDay(s: string): Date | null {
  const m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(s.trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]);
  return month < 0 ? null : new Date(Number(m[3]), month, Number(m[1]));
}

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

/** Header chips: dot + label + value, divider between — the drawer KPI-strip recipe. */
function KpiChip({ label, value, dot, tone }: { label: string; value: string; dot?: string; tone?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {dot && <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
      <span className="text-[11px] text-[#7B8FA5]">{label}</span>
      <span className="text-[12px] font-medium" style={{ color: tone ?? '#364658' }}>{value}</span>
    </span>
  );
}

const Divider = () => <span className="h-3 w-px bg-[#E5E7EB]" />;

const COMPAT_TONE: Record<CompatStatus, { fg: string; bg: string }> = {
  Compatible: { fg: '#22A06B', bg: '#ECFDF3' },
  Incompatible: { fg: '#DC2626', bg: '#FEF3F2' },
  Unknown: { fg: '#64748B', bg: '#F1F5F9' },
};

/** Grid header for a prerequisite that is also a column. 'TPM Version' would wrap. */
const COL_LABEL: Partial<Record<PrereqKey, string>> = { tpm: 'TPM', disk: 'Free Disk', ram: 'RAM', secureBoot: 'Secure Boot' };

const BUCKETS: CompatStatus[] = ['Compatible', 'Incompatible', 'Unknown'];

export function AdminOsUpgradeDetail({ image, status, onBack, onCrumb }: AdminOsUpgradeDetailProps) {
  const [tab, setTab] = useState<'summary' | 'computers'>('summary');
  const [bucket, setBucket] = useState<CompatStatus>('Compatible');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // The fleet is derived from the image id — memoised so scrolling doesn't rebuild 160 rows.
  const prereqs = useMemo(() => prerequisitesFor(image), [image]);
  const fleet = useMemo(() => computersFor(image), [image]);
  const counts = useMemo(() => compatCounts(fleet), [fleet]);
  const columns = prereqs.filter((p) => p.column);

  const q = search.trim().toLowerCase();
  const rows = fleet
    .filter((c) => c.status === bucket)
    .filter((c) => !q || [c.hostName, c.ipAddress, c.currentOs, c.reasons.join(' ')].some((f) => f.toLowerCase().includes(q)));

  useEffect(() => { setPage(1); }, [bucket, search, image.id]);
  useEffect(() => { setTab('summary'); setBucket('Compatible'); setSearch(''); }, [image.id]);

  const totalPages = Math.ceil(rows.length / perPage) || 1;
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const eos = parseDay(image.eosDate);
  const eosPast = !!eos && eos.getTime() < Date.now();
  const tone = UPLOAD_TONE[status];

  const cellValue = (c: (typeof fleet)[number], key: PrereqKey) => {
    switch (key) {
      case 'ram': return c.ram === null ? <Dash /> : `${c.ram} GB`;
      case 'disk': return c.disk === null ? <Dash /> : `${c.disk} GB`;
      case 'tpm': return c.tpm === null ? <Dash /> : c.tpm.toFixed(1);
      case 'secureBoot': return c.secureBoot === null ? <Dash /> : c.secureBoot ? 'Enabled' : 'Disabled';
      case 'cpuSpeed': return c.cpuSpeed === null ? <Dash /> : `${c.cpuSpeed.toFixed(1)} GHz`;
      case 'cpuCores': return c.cpuCores === null ? <Dash /> : String(c.cpuCores);
      case 'arch': return c.arch ?? <Dash />;
      default: return <Dash />;
    }
  };

  const meta: [string, React.ReactNode][] = [
    ['OS Name', image.title],
    ['Platform', image.platform],
    ['Edition', image.edition],
    ['Architecture', image.architecture],
    ['OS Version', image.osVersion],
    ['Language', image.language],
    ['Size', image.size],
    ['Upload Status', <UploadStatusPill key="s" status={status} />],
    ['Upload Time', image.uploadTime || <Dash />],
    ['End-of-Support Date', (
      <span key="eos" className={eosPast ? 'text-[#DC2626]' : undefined}>
        {image.eosDate}{eosPast && ' · expired'}
      </span>
    )],
    ['ISO File Name', image.fileName || <Dash />],
    ['Reference URL', (
      <a key="ref" href={image.referenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#3D8BD0] hover:underline">
        {image.referenceLabel} <ExternalLink size={12} />
      </a>
    )],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        {([['Admin', 'admin'], ['Patch Management', 'patch'], ['OS Upgrade', 'list']] as const).map(([label, to]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <button onClick={() => onCrumb(to)} className="text-[#3D8BD0] transition-colors hover:underline">{label}</button>
            <ChevronRight size={14} className="text-[#9CA3AF]" />
          </span>
        ))}
        <span className="text-[#64748B]">{image.id}</span>
      </div>

      {/* Title + KPI strip */}
      <div className="mt-2 flex items-start gap-3">
        <button
          onClick={onBack}
          title="Back to OS Upgrade"
          className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
        ><ArrowLeft size={16} /></button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{image.id}</span>
            <h1 className="text-[20px] font-semibold text-[#364658]">{image.title}</h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <KpiChip label="Platform" value={image.platform} />
            <Divider />
            <KpiChip label="Architecture" value={image.architecture} />
            <Divider />
            <KpiChip label="Language" value={image.language} />
            <Divider />
            <KpiChip label="Size" value={image.size} />
            <Divider />
            <KpiChip label="Upload" value={status} dot={tone.dot} tone={tone.fg} />
            <Divider />
            <KpiChip label="EOS" value={image.eosDate} dot={eosPast ? '#EF4444' : undefined} tone={eosPast ? '#DC2626' : undefined} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex items-center gap-2.5 border-b border-[#e5e7eb]">
        {([['summary', 'Summary'], ['computers', 'Computers']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${
              tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:text-[#364658]'
            }`}
          >{label}</button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Metadata — the label-over-value grid used by the endpoint drawer's System Overview */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 xl:col-span-7">
            <h3 className="mb-4 text-[14px] font-semibold text-[#364658]">OS Image Details</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {meta.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <div className="mb-0.5 text-[12px] text-[#64748B]">{label}</div>
                  <div className="break-words text-[13px] font-medium text-[#364658]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites — the rules the Computers tab is evaluated against */}
          <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white p-5 xl:col-span-5">
            <h3 className="text-[14px] font-semibold text-[#364658]">Prerequisites</h3>
            <p className="mt-1 text-[12px] leading-[1.5] text-[#7B8FA5]">
              An endpoint must satisfy every rule below before this upgrade is offered to it.
            </p>
            <div className="mt-3 overflow-hidden rounded border border-[#E5E7EB]">
              <table className="w-full">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    {['Attribute', 'Operator', 'Value'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {prereqs.map((p) => (
                    <tr key={p.key}>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] font-medium text-[#364658]">{p.attribute}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] text-[#3D8BD0]">{p.operator}</td>
                      <td className="px-3 py-2.5 text-[13px] text-[#364658]">{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#F0F2F5] pt-3 text-[12px] text-[#7B8FA5]">
              <span>Evaluated against <span className="font-semibold text-[#364658]">{fleet.length}</span> endpoints ·</span>
              <span className="font-semibold text-[#22A06B]">{counts.Compatible} eligible</span>
              <button onClick={() => setTab('computers')} className="ml-auto font-medium text-[#3D8BD0] hover:underline">View computers ›</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'computers' && (
        /* Full-bleed, no card — same listing chrome as the module's own grid. */
        <div className="mt-4">
          <div>
            {/* Sub-tabs with counts — the patch detail page's bucket pills */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {BUCKETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBucket(b)}
                  className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                    bucket === b ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'
                  }`}
                >
                  {b}
                  <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${
                    bucket === b ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'
                  }`}>{counts[b]}</span>
                </button>
              ))}
            </div>

            <div className="relative mb-3">
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-y border-[#e5e7eb]">
                <tr>
                  {['Host Name', 'IP Address', 'Current OS'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                  ))}
                  {/* Columns follow the prerequisites, so every reason below has a visible value */}
                  {columns.map((p) => (
                    <th key={p.key} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{COL_LABEL[p.key] ?? p.attribute}</th>
                  ))}
                  {['Status', 'Reasons'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5 + columns.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                      No {bucket.toLowerCase()} endpoints{q ? ` match “${search}”` : ''}.
                    </td>
                  </tr>
                ) : pageRows.map((c) => (
                  <tr key={c.hostName} className="transition-colors hover:bg-[#f9fafb]">
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-[#364658]">{c.hostName}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-[#364658]">{c.ipAddress}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">
                      {c.currentOs === 'Unknown' ? <span className="text-[#9CA3AF]">Unknown</span> : c.currentOs}
                    </td>
                    {columns.map((p) => (
                      <td key={p.key} className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{cellValue(c, p.key)}</td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ color: COMPAT_TONE[c.status].fg, backgroundColor: COMPAT_TONE[c.status].bg }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#DC2626]">
                      {c.reasons.length ? c.reasons.join('; ') : <Dash />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            itemsPerPage={perPage}
            totalItems={rows.length}
            onPageChange={setPage}
            onItemsPerPageChange={(v) => { setPerPage(v); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
}
