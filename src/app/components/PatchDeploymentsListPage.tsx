import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, FileText, Download, RefreshCw, History, Columns3, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatchDeploymentsTable } from './PatchDeploymentsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import type { Patch } from './PatchesListPage';

export type DeploymentStatus = 'Ready to Deploy' | 'In Progress' | 'Completed' | 'Cancelled' | 'Expired' | 'Draft';

export interface PatchDeployment {
  id: string;
  name: string;
  status: DeploymentStatus;
  deploymentPolicy: string;
  /** Scheduled install-after datetime, or null = --- (deploy immediately / not scheduled) */
  installAfter: string | null;
  /** Deployment window expiry, or null = --- (no expiry) */
  expiryDate: string | null;
}

// Realistic deployment runs: named after the patch wave they roll out, scoped by ring/policy.
export const mockPatchDeployments: PatchDeployment[] = [
  { id: 'PDR-1433', name: 'April 2026 Patch Tuesday — Production Servers Wave 2', status: 'Ready to Deploy', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Jul 25, 2026 10:00 PM', expiryDate: 'Fri, Jul 31, 2026 06:00 AM' },
  { id: 'PDR-1432', name: 'Chrome 124 Security Update — All Workstations', status: 'Ready to Deploy', deploymentPolicy: 'Browser Updates — Silent Install', installAfter: 'Thu, Jul 23, 2026 08:00 PM', expiryDate: null },
  { id: 'PDR-1431', name: 'KB5036894 Cumulative Update — Finance Department', status: 'In Progress', deploymentPolicy: 'Workstations — Business Hours Safe', installAfter: 'Tue, Jul 21, 2026 09:00 PM', expiryDate: 'Tue, Jul 28, 2026 09:00 PM' },
  { id: 'PDR-1430', name: 'Defender Platform 4.18.24030 — Fleet-wide', status: 'In Progress', deploymentPolicy: 'Security Definitions — Immediate', installAfter: null, expiryDate: null },
  { id: 'PDR-1429', name: 'Internal Agent Updater Hotfix — Priority Rollout', status: 'Completed', deploymentPolicy: 'Critical Security — Immediate', installAfter: 'Wed, Jul 08, 2026 06:30 PM', expiryDate: 'Fri, Jul 10, 2026 06:30 PM' },
  { id: 'PDR-1428', name: 'Acrobat Reader DC Security Update — Design Team', status: 'Completed', deploymentPolicy: 'Third-Party Apps — Weekly Window', installAfter: 'Mon, Jul 06, 2026 10:00 PM', expiryDate: null },
  { id: 'PDR-1427', name: 'April 2026 Patch Tuesday — Pilot Ring', status: 'Completed', deploymentPolicy: 'Pilot Ring — Early Validation', installAfter: 'Thu, Apr 16, 2026 09:00 PM', expiryDate: 'Thu, Apr 23, 2026 09:00 PM' },
  { id: 'PDR-1426', name: '.NET Framework 4.8.1 Rollup — Application Servers', status: 'Ready to Deploy', deploymentPolicy: 'App Servers — Maintenance Window', installAfter: 'Sun, Jul 26, 2026 02:00 AM', expiryDate: 'Sun, Aug 02, 2026 02:00 AM' },
  { id: 'PDR-1425', name: 'Edge 124 Security Update — Kiosk Devices', status: 'Draft', deploymentPolicy: 'Kiosk Devices — Overnight Only', installAfter: null, expiryDate: null },
  { id: 'PDR-1424', name: 'PuTTY 0.81 (CVE-2024-31497) — Engineering Workstations', status: 'Completed', deploymentPolicy: 'Critical Security — Immediate', installAfter: 'Wed, Apr 16, 2026 11:00 AM', expiryDate: 'Fri, Apr 18, 2026 11:00 AM' },
  { id: 'PDR-1423', name: 'Firefox 125.0.2 Update — Support Team', status: 'Cancelled', deploymentPolicy: 'Browser Updates — Silent Install', installAfter: 'Wed, Apr 22, 2026 08:30 PM', expiryDate: null },
  { id: 'PDR-1422', name: 'March 2026 Cumulative — Windows Server 2022 Fleet', status: 'Completed', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Mar 28, 2026 11:00 PM', expiryDate: 'Sat, Apr 04, 2026 06:00 AM' },
  { id: 'PDR-1421', name: 'Servicing Stack Update KB5034439 — Server Ring 1', status: 'Completed', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Feb 21, 2026 11:30 PM', expiryDate: null },
  { id: 'PDR-1420', name: 'Zoom Client 5.17.11 — Conference Room PCs', status: 'Expired', deploymentPolicy: 'Shared Devices — Overnight Only', installAfter: 'Mon, Mar 09, 2026 01:00 AM', expiryDate: 'Mon, Mar 16, 2026 01:00 AM' },
  { id: 'PDR-1419', name: 'Java SE 8u411 Security Patch — Legacy App Hosts', status: 'Expired', deploymentPolicy: 'Legacy Systems — Manual Approval', installAfter: 'Tue, Mar 03, 2026 09:00 PM', expiryDate: 'Tue, Mar 10, 2026 09:00 PM' },
  { id: 'PDR-1418', name: 'February 2026 Patch Tuesday — Remote Office Mumbai', status: 'Completed', deploymentPolicy: 'Remote Offices — Bandwidth Throttled', installAfter: 'Fri, Feb 13, 2026 10:00 PM', expiryDate: 'Fri, Feb 20, 2026 10:00 PM' },
  { id: 'PDR-1417', name: 'February 2026 Patch Tuesday — Remote Office Pune', status: 'Completed', deploymentPolicy: 'Remote Offices — Bandwidth Throttled', installAfter: 'Sat, Feb 14, 2026 10:00 PM', expiryDate: 'Sat, Feb 21, 2026 10:00 PM' },
  { id: 'PDR-1416', name: 'VLC 3.0.20 Security Update — Media Workstations', status: 'Cancelled', deploymentPolicy: 'Third-Party Apps — Weekly Window', installAfter: null, expiryDate: null },
  { id: 'PDR-1415', name: 'Windows 11 24H2 Feature Enablement — IT Pilot', status: 'Draft', deploymentPolicy: 'Pilot Ring — Early Validation', installAfter: 'Mon, Aug 03, 2026 09:00 PM', expiryDate: 'Mon, Aug 17, 2026 09:00 PM' },
  { id: 'PDR-1414', name: 'January 2026 Cumulative — Domain Controllers', status: 'Completed', deploymentPolicy: 'Domain Controllers — One at a Time', installAfter: 'Sun, Jan 18, 2026 03:00 AM', expiryDate: 'Sun, Jan 25, 2026 03:00 AM' },
  { id: 'PDR-1413', name: 'Git for Windows 2.44 — Developer Machines', status: 'Completed', deploymentPolicy: 'Developer Tools — Self Service', installAfter: null, expiryDate: null },
  { id: 'PDR-1412', name: '7-Zip 24.05 Update — All Workstations', status: 'Ready to Deploy', deploymentPolicy: 'Third-Party Apps — Weekly Window', installAfter: 'Wed, Jul 29, 2026 08:00 PM', expiryDate: null },
  { id: 'PDR-1411', name: 'January 2026 Patch Tuesday — HR & Finance Ring', status: 'Completed', deploymentPolicy: 'Workstations — Business Hours Safe', installAfter: 'Fri, Jan 16, 2026 09:30 PM', expiryDate: 'Fri, Jan 23, 2026 09:30 PM' },
  { id: 'PDR-1410', name: 'Notepad++ 8.6.5 Update — Engineering Workstations', status: 'Cancelled', deploymentPolicy: 'Developer Tools — Self Service', installAfter: null, expiryDate: null },
  { id: 'PDR-1409', name: 'December 2025 Cumulative — Warehouse Terminals', status: 'Expired', deploymentPolicy: 'Shared Devices — Overnight Only', installAfter: 'Sat, Dec 20, 2025 01:00 AM', expiryDate: 'Sat, Dec 27, 2025 01:00 AM' },
  { id: 'PDR-1408', name: 'December 2025 Patch Tuesday — Production Servers Wave 1', status: 'Completed', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Dec 13, 2025 11:00 PM', expiryDate: 'Sat, Dec 20, 2025 06:00 AM' },
  { id: 'PDR-1407', name: 'Defender Definition Refresh — VPN-only Laptops', status: 'Completed', deploymentPolicy: 'Security Definitions — Immediate', installAfter: null, expiryDate: null },
  { id: 'PDR-1406', name: 'November 2025 Cumulative — Executive Laptops', status: 'Completed', deploymentPolicy: 'VIP Devices — Manual Approval', installAfter: 'Mon, Nov 17, 2025 08:00 PM', expiryDate: 'Mon, Nov 24, 2025 08:00 PM' },
];

// Toolbar tailored to the Patch Deployments list (title + view + action icons + CTA).
function PatchDeploymentsToolbar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  const IconBtn = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <button className="flex h-[30px] w-[30px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]" title={title}>
      {children}
    </button>
  );
  return (
    <div className="bg-white">
      {/* First Row: Title + view dropdown + actions */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] font-semibold text-[#364658]">Patch Deployments</h1>
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
            <span>Pending Deployments</span>
            <ChevronDown size={16} className="text-[#6b7280]" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn title="New"><FileText size={16} /></IconBtn>
          <IconBtn title="Export"><Download size={16} /></IconBtn>
          <IconBtn title="Refresh"><RefreshCw size={16} /></IconBtn>
          <IconBtn title="History"><History size={16} /></IconBtn>
          <IconBtn title="Columns"><Columns3 size={16} /></IconBtn>
          <button className="ml-2 flex h-[34px] items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">
            <Plus size={15} />
            Create Patch Deployment
          </button>
        </div>
      </div>

      {/* Second Row: Full-width Search */}
      <div className="px-6 pb-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Select field to search..."
            className="h-[36px] w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658] transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Adapt a deployment record onto the Patch shape the cloned PatchDeploymentDrawer body expects
 *  (same pattern as the drawer clone chain's XToAssetShape adapters). */
const deploymentToPatchShape = (d: PatchDeployment): Patch => ({
  id: d.id,
  name: d.name,
  severity: 'Unspecified',
  releaseDate: d.installAfter ?? '---',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: d.status === 'Draft' || d.status === 'Cancelled' ? 'Not Approved' : 'Approved',
  category: 'Deployment',
  deployment: { status: d.status, policy: d.deploymentPolicy, installAfter: d.installAfter, expiryDate: d.expiryDate },
});

export function PatchDeploymentsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [deployments] = useState<PatchDeployment[]>(mockPatchDeployments);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenDeployment = (d: PatchDeployment) => {
    openInStack('patch-deployments', d.id, d.name, deploymentToPatchShape(d));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(deployments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(d => d.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  let filtered = deployments;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = deployments.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      d.deploymentPolicy.toLowerCase().includes(q) ||
      (d.installAfter ?? '').toLowerCase().includes(q) ||
      (d.expiryDate ?? '').toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(d => d.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="patch-deployments" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <PatchDeploymentsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <PatchDeploymentsTable
              deployments={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onDeploymentClick={handleOpenDeployment}
            />
          </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
        </main>
      </div>
    </div>
  );
}
