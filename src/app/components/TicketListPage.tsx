import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { TicketTable } from './TicketTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { TicketDrawer } from './TicketDrawer';
import { PersonaSwitcher } from './PersonaSwitcher';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { loadStore, personaInfo, saveStore } from './workspaceData';
import { assigneeFor, canSeeTicket, placeFor } from './ticketAccess';

export interface Ticket {
  id: string;
  subject: string;
  requester: string;
  dueBy: Date;
  createdBy: Date;
  assignedTo: {
    name: string;
    initials: string;
    avatar?: string;
  };
  status: 'Open' | 'In Progress' | 'Completed' | 'Pending' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  /** F05: the workspace that owns the ticket, its technician group and assignee (prototype placement). */
  workspaceId?: number;
  groupName?: string;
  technicianId?: number;
}

// Mock data
export const generateMockTickets = (): Ticket[] => {
  const subjects = [
    "Don't you hate me too? it name it that...",
    "Employee Onboarding",
    "My Internet Down",
    "WiFi is not working",
    "Employee Onboarding",
    "Request for Apple MacBook Pro Allocation",
    "Employee Onboarding",
    "help",
    "Employee Onboarding",
    "Laptop charger not working",
    "WiFi is not working",
    "Employee Onboarding",
    "help",
    "Employee Onboarding",
    "My Internet Down",
    "Employee Onboarding",
    "WiFi is not working"
  ];
  
  const requesters = ['Manual', 'Prashant Pandhe', 'Arnav Desai', 'Agnika Mir', 'Ashish'];
  const assignees = [
    { name: 'Amou Desai', initials: 'AD' },
    { name: 'Keetion Dale', initials: 'KD' },
    { name: 'Shreyak Dalal', initials: 'SD' },
    { name: 'Kaison Potai', initials: 'KP' },
    { name: 'Novak Potai', initials: 'NP' },
    { name: 'Rahul Shukla', initials: 'RS' },
    { name: 'Keetion Dale', initials: 'KD' },
    { name: 'Pratik Patial', initials: 'PP' }
  ];
  
  const statuses: Ticket['status'][] = ['Open', 'In Progress', 'Completed', 'Pending', 'Closed'];
  const priorities: Ticket['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];
  
  void assignees; // F05: assignees now come from each workspace's team (ticketAccess.assigneeFor)
  return Array.from({ length: 65 }, (_, i) => {
    const place = placeFor(i);
    const who = assigneeFor(i, place.workspaceId);
    return {
    id: `INC-${String(i + 30).padStart(2, '0')}`,
    subject: place.subject ?? subjects[i % subjects.length],
    requester: requesters[i % requesters.length],
    dueBy: new Date(2022, 3, 20 + (i % 10), 2 + (i % 12), 34),
    createdBy: new Date(2022, 3, 19 + (i % 8), 3 + (i % 12), 30),
    assignedTo: { name: who.name, initials: who.initials },
    workspaceId: place.workspaceId, groupName: who.groupName, technicianId: who.technicianId,
    status: i === 9 ? 'Closed' : (i === 2 ? 'Open' : statuses[i % statuses.length]), // INC-39 (index 9) should be Closed, INC-32 (index 2) should be Open
    priority: priorities[i % priorities.length]
  } as Ticket;
  });
};

export function TicketListPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [tickets] = useState<Ticket[]>(generateMockTickets());
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof Ticket | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // F05: the list shows only what the signed-in person may open (the server's rule, ticketAccess.canSeeTicket).
  const [rev, setRev] = useState(0);
  const store = loadStore();
  const viewAs = store.viewAs;
  const [wsFilter, setWsFilter] = useState<number | 'all'>('all');
  void rev;

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenTicket = (ticket: Ticket) => {
    // INC-33 opens the SECOND design option of the detail page (TicketDrawerV2);
    // every other ticket keeps the existing V1 TicketDrawer.
    openInStack(ticket.id === 'INC-33' ? 'request-v2' : 'request', ticket.id, ticket.subject, ticket);
  };

  const handleCloseDrawer = () => {
    setOpenTickets([]);
    setActiveTicketId(null);
  };

  const handleCloseTab = (ticketId: string) => {
    const newOpenTickets = openTickets.filter(t => t.id !== ticketId);
    setOpenTickets(newOpenTickets);
    
    // If closing active ticket, switch to another tab or close drawer
    if (activeTicketId === ticketId) {
      if (newOpenTickets.length > 0) {
        setActiveTicketId(newOpenTickets[newOpenTickets.length - 1].id);
      } else {
        setActiveTicketId(null);
      }
    }
  };

  const handleTabChange = (ticketId: string) => {
    setActiveTicketId(ticketId);
  };

  // Open a clicked relation (Problem / Change / Release / Asset …) as a new tab in the same drawer.
  const handleOpenRelation = (rel: { ticketId: string; subject: string; status: string; priority: string; assignedTo: { name: string } }) => {
    const mapStatus = (s: string): Ticket['status'] => {
      const v = (s || '').toLowerCase();
      if (v.includes('progress')) return 'In Progress';
      if (v.includes('resolved') || v.includes('complete')) return 'Completed';
      if (v.includes('pending')) return 'Pending';
      if (v.includes('closed')) return 'Closed';
      if (v.includes('cancel')) return 'Cancelled';
      return 'Open';
    };
    const mapPriority = (p: string): Ticket['priority'] => {
      const v = (p || '').toLowerCase();
      if (v.includes('urgent') || v === 'p1') return 'Urgent';
      if (v.includes('high') || v === 'p2') return 'High';
      if (v.includes('low') || v === 'p4') return 'Low';
      return 'Medium';
    };
    const name = rel.assignedTo?.name || 'Unassigned';
    handleOpenTicket({
      id: rel.ticketId,
      subject: rel.subject,
      requester: name,
      dueBy: new Date(),
      createdBy: new Date(),
      assignedTo: { name, initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() },
      status: mapStatus(rel.status),
      priority: mapPriority(rel.priority),
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentTicketIds = new Set(
        tickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(t => t.id)
      );
      setSelectedTickets(currentTicketIds);
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const newSelected = new Set(selectedTickets);
    if (checked) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleSort = (column: keyof Ticket) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // F05: rows the person may open, then the Workspace filter, then search.
  const verdictOf = (t: Ticket) => (t.workspaceId ? canSeeTicket(store, viewAs, { workspaceId: t.workspaceId, groupName: t.groupName ?? '', technicianId: t.technicianId ?? 0 }) : { ok: true, why: '' });
  const allowed = tickets.filter((t) => verdictOf(t).ok);
  const myWorkspaces = store.workspaces.filter((w) => allowed.some((t) => t.workspaceId === w.id));
  const hiddenCount = tickets.length - allowed.length;
  // Filter tickets based on search query
  let filteredTickets = wsFilter === 'all' ? allowed : allowed.filter((t) => t.workspaceId === wsFilter);
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredTickets = filteredTickets.filter(ticket => {
      // Search by ticket ID
      if (ticket.id.toLowerCase().includes(query)) return true;
      // Search by subject
      if (ticket.subject.toLowerCase().includes(query)) return true;
      // Search by requester
      if (ticket.requester.toLowerCase().includes(query)) return true;
      // Search by assignee name
      if (ticket.assignedTo.name.toLowerCase().includes(query)) return true;
      // Search by status
      if (ticket.status.toLowerCase().includes(query)) return true;
      // Search by priority
      if (ticket.priority.toLowerCase().includes(query)) return true;
      return false;
    });
  }

  // Sort tickets
  let sortedTickets = [...filteredTickets];
  if (sortColumn) {
    sortedTickets.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === 'assignedTo') {
        aVal = (a.assignedTo as any).name;
        bVal = (b.assignedTo as any).name;
      }

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc' 
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }

  // Paginate
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentPageTickets = paginatedTickets.map(t => t.id);
  const allCurrentPageSelected = currentPageTickets.every(id => selectedTickets.has(id)) && currentPageTickets.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="request" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedTickets.size} onOpenAdmin={() => onNavigate('admin')} />
        <Toolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {/* F05: Workspace filter (one Requests list for every workspace, decided 2026-11-02) + prototype View as. */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F5] bg-white px-4 py-2">
          <span className="text-[12px] font-medium text-[#64748B]">Workspace</span>
          {([{ id: 'all' as const, name: `All my workspaces (${allowed.length})`, colour: '' }, ...myWorkspaces.map((w) => ({ id: w.id, name: `${w.name} (${allowed.filter((t) => t.workspaceId === w.id).length})`, colour: w.colour }))]).map((o) => (
            <button key={String(o.id)} onClick={() => { setWsFilter(o.id); setCurrentPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${wsFilter === o.id ? 'border-[#3D8BD0] bg-[#EBF5FF] font-medium text-[#1F5F99]' : 'border-[#DFE5ED] bg-white text-[#475569] hover:border-[#3D8BD0]'}`}>
              {o.colour && <span className="size-2 rounded-full" style={{ background: o.colour }} />}{o.name}
            </button>
          ))}
          {hiddenCount > 0 && <span className="text-[11px] text-[#94A3B8]">Only requests you can open are listed.</span>}
          <div className="ml-auto w-[300px] [&>div]:px-0 [&>div]:pt-0"><PersonaSwitcher onChange={(v) => { saveStore({ ...loadStore(), viewAs: v }); setWsFilter('all'); setCurrentPage(1); setRev((n) => n + 1); }} /></div>
        </div>
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <TicketTable
              tickets={paginatedTickets}
              selectedTickets={selectedTickets}
              allSelected={allCurrentPageSelected}
              onSelectAll={handleSelectAll}
              onSelectTicket={handleSelectTicket}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onTicketClick={handleOpenTicket}
              workspaceOf={(t) => { const w = store.workspaces.find((x) => x.id === t.workspaceId); return w ? { name: w.name, colour: w.colour, confidential: !!w.confidential, why: verdictOf(t).why } : undefined; }}
            />
            {paginatedTickets.length === 0 && (
              <div className="px-4 py-14 text-center text-[13px] text-[#94A3B8]">No requests for {personaInfo(viewAs).name} here.</div>
            )}
            
          </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={sortedTickets.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
        </main>
      </div>
      
      <TicketDrawer
        openTickets={openTickets}
        activeTicketId={activeTicketId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
export const MOCK_TICKETS: Ticket[] = generateMockTickets();
