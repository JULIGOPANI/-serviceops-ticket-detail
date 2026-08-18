import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown, Copy, ExternalLink, LayoutTemplate, MonitorSmartphone, PenLine, Plus, Search,
  SquarePen, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';
import { SupportPortalBuilder } from './SupportPortalBuilder';
import { SupportPortalTemplateGallery } from './SupportPortalTemplateGallery';
import {
  DEFAULT_PORTAL_PAGE, PORTAL_TEMPLATES, formatPortalStamp, nextPageId, uniquePageName,
} from './supportPortalData';
import type { PortalPage, PortalTemplate } from './supportPortalData';

/* Support Portal Customization — Admin › Organization.
 *
 * The listing owns the pages; the builder edits one of them. A page is created the moment a route
 * out of "New page" is chosen — as a Draft — so leaving the builder never loses work and the
 * builder's saved-state indicator is telling the truth. Publish is the only thing that flips a
 * draft live. */

const CURRENT_USER = 'Aarti Shah';

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

const accentFor = (page: PortalPage) => PORTAL_TEMPLATES.find((t) => t.name === page.source)?.accent;

/* ── New page dropdown ───────────────────────────────────────────────────── */

function NewPageMenu({ onScratch, onTemplate, size = 'default' }: {
  onScratch: () => void;
  onTemplate: () => void;
  size?: 'default' | 'large';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const options = [
    {
      key: 'scratch',
      title: 'Customize from scratch',
      desc: 'Open a blank portal page and build it block by block.',
      Icon: PenLine,
      run: onScratch,
    },
    {
      key: 'template',
      title: 'Use Template',
      desc: 'Start from a ready-made layout and change what you need.',
      Icon: LayoutTemplate,
      run: onTemplate,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded bg-[#3D8BD0] font-medium text-white transition-colors hover:bg-[#2d6ca0] ${
          size === 'large' ? 'h-10 px-4 text-[14px]' : 'h-9 px-3.5 text-[13px]'
        }`}
      >
        <Plus size={size === 'large' ? 17 : 15} />
        New page
        <ChevronDown size={size === 'large' ? 16 : 14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        /* Centred under a centred CTA, right-aligned under a toolbar one. */
        <div className={`absolute z-50 mt-1.5 w-[320px] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.03),0_12px_16px_-4px_rgba(16,24,40,0.08)] ${
          size === 'large' ? 'left-1/2 -translate-x-1/2' : 'right-0'
        }`}>
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => { setOpen(false); o.run(); }}
              className="group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F7FA]"
            >
              <span className="mt-px flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5] transition-colors group-hover:bg-[#EBF5FF] group-hover:text-[#3D8BD0]">
                <o.Icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#364658]">{o.title}</span>
                <span className="mt-0.5 block text-[12px] leading-[1.5] text-[#7B8FA5]">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Delete confirm ──────────────────────────────────────────────────────── */

function ConfirmDelete({ page, onCancel, onConfirm }: { page: PortalPage; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="w-[440px] max-w-full rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
          <h2 className="text-[16px] font-semibold text-[#364658]">Delete “{page.name}”?</h2>
          <button onClick={onCancel} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>
        <p className="px-5 pb-5 text-[13px] leading-[1.6] text-[#64748B]">
          {page.status === 'Published'
            ? 'This page is live. Requesters who open it will get a not-found page until you publish another one in its place.'
            : 'This draft has never been published, so nothing changes for requesters.'}
        </p>
        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button onClick={onCancel} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button onClick={onConfirm} className="inline-flex h-8 items-center rounded bg-[#DC2626] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#B91C1C]">Delete page</button>
        </div>
      </div>
    </div>
  );
}

/* ── Module ──────────────────────────────────────────────────────────────── */

type Scope = 'All' | 'Published' | 'Draft';

export function AdminSupportPortalModule({ onBuilder }: { onBuilder?: (open: boolean) => void }) {
  /* ⚠️ Starts with ONE page, not empty. Every tenant already has a support portal — the requester
     is landing somewhere today — so an empty state here would claim the portal does not exist and
     invite the admin to "create" the thing they are actually editing. The default page is a System
     page: it can be customised and duplicated, and the delete action refuses it (see `canDelete`),
     because a portal with no landing page is not a state the product can be in. */
  const [pages, setPages] = useState<PortalPage[]>([DEFAULT_PORTAL_PAGE]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gallery, setGallery] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<Scope>('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const editing = pages.find((p) => p.id === editingId) ?? null;

  // The admin shell collapses its sidebar while the canvas is open.
  useEffect(() => { onBuilder?.(!!editing); }, [editing, onBuilder]);

  const create = (name: string, source: string) => {
    const now = formatPortalStamp(new Date());
    const created: PortalPage = {
      id: nextPageId(pages),
      name: uniquePageName(pages, name),
      type: 'Custom',
      status: 'Draft',
      source,
      audience: 'All requesters',
      modifiedAt: now,
      modifiedBy: CURRENT_USER,
    };
    setPages((prev) => [created, ...prev]);
    setEditingId(created.id);
  };

  const patch = (id: string, changes: Partial<PortalPage>) =>
    setPages((prev) => prev.map((p) => (p.id === id
      ? { ...p, ...changes, modifiedAt: formatPortalStamp(new Date()), modifiedBy: CURRENT_USER }
      : p)));

  const startBlank = () => { setGallery(false); create('New page', 'Blank layout'); };
  const useTemplate = (t: PortalTemplate) => { setGallery(false); create(t.name, t.name); };

  const duplicate = (src: PortalPage) => {
    const now = formatPortalStamp(new Date());
    const copy: PortalPage = {
      ...src,
      id: nextPageId(pages),
      name: uniquePageName(pages, `${src.name} copy`),
      // A copy is never live until it is published on its own merit.
      status: 'Draft',
      modifiedAt: now,
      modifiedBy: CURRENT_USER,
    };
    setPages((prev) => [copy, ...prev]);
    toast.success(`“${src.name}” duplicated`);
  };

  // ── builder ───────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <SupportPortalBuilder
        page={editing}
        accent={accentFor(editing)}
        onRename={(name) => patch(editing.id, { name: uniquePageName(pages.filter((p) => p.id !== editing.id), name) })}
        onPublish={() => {
          patch(editing.id, { status: 'Published' });
          setEditingId(null);
          toast.success(`“${editing.name}” is live on the support portal`);
        }}
        onExit={() => setEditingId(null)}
      />
    );
  }

  const overlays = (
    <>
      {gallery && (
        <SupportPortalTemplateGallery
          onClose={() => setGallery(false)}
          onUse={useTemplate}
          onStartBlank={startBlank}
        />
      )}
      {confirmId && (() => {
        const target = pages.find((p) => p.id === confirmId);
        if (!target) return null;
        return (
          <ConfirmDelete
            page={target}
            onCancel={() => setConfirmId(null)}
            onConfirm={() => {
              setPages((prev) => prev.filter((p) => p.id !== target.id));
              setConfirmId(null);
              toast.success(`“${target.name}” deleted`);
            }}
          />
        );
      })()}
    </>
  );

  const head = (
    <div className="mb-5">
      <h1 className="text-[20px] font-semibold text-[#364658]">Support Portal Customization</h1>
      <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
        Design the pages your requesters land on — build one from scratch or start from a template.{' '}
        <button
          onClick={() => toast.success('Opening the Support Portal Customization documentation')}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline"
        >View Docs <ExternalLink size={12} /></button>
      </p>
    </div>
  );

  // ── empty state ── no page has been built yet, so there is nothing to search or filter.
  if (pages.length === 0) {
    return (
      <>
        <div className="px-4 py-6">
          {head}
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#D9E0EA] bg-[#FCFDFE] px-6 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[#EBF5FF] text-[#3D8BD0]">
              <MonitorSmartphone size={30} strokeWidth={1.6} />
            </span>
            <h2 className="mt-4 text-[16px] font-semibold text-[#364658]">No portal pages yet</h2>
            <p className="mt-1.5 max-w-[440px] text-[13px] leading-[1.6] text-[#7B8FA5]">
              Requesters currently see the default ServiceOps portal. Build a page to change what
              they land on — start blank, or pick a template and edit it.
            </p>
            <div className="mt-5"><NewPageMenu size="large" onScratch={startBlank} onTemplate={() => setGallery(true)} /></div>
            <button
              onClick={() => setGallery(true)}
              className="mt-3 text-[13px] font-medium text-[#3D8BD0] hover:underline"
            >Browse {PORTAL_TEMPLATES.length} templates</button>
          </div>
        </div>
        {overlays}
      </>
    );
  }

  // ── listing ───────────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const rows = pages.filter((p) =>
    (scope === 'All' || p.status === scope)
    && (!q || [p.id, p.name, p.source, p.audience, p.modifiedBy].some((f) => f.toLowerCase().includes(q))));
  const totalPages = Math.ceil(rows.length / perPage) || 1;
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const counts: Record<Scope, number> = {
    All: pages.length,
    Published: pages.filter((p) => p.status === 'Published').length,
    Draft: pages.filter((p) => p.status === 'Draft').length,
  };

  const actionBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';

  return (
    <>
      <div className="px-4 py-6">
        {head}

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search"
              className={inputCls}
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {(['All', 'Published', 'Draft'] as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => { setScope(s); setPage(1); }}
                className={`inline-flex h-9 items-center gap-1.5 rounded px-3 text-[13px] font-medium transition-colors ${
                  scope === s ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#364658] hover:bg-[#F5F7FA]'
                }`}
              >
                {s === 'Draft' ? 'Drafts' : s}
                <span className={`text-[12px] ${scope === s ? 'text-white/75' : 'text-[#9CA3AF]'}`}>{counts[s]}</span>
              </button>
            ))}
          </div>

          <div className="ml-auto"><NewPageMenu onScratch={startBlank} onTemplate={() => setGallery(true)} /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['ID', 'Page Name', 'Type', 'Status', 'Audience', 'Last Modified', 'Modified By', 'Action'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {pageRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                  No portal pages match this filter.
                </td></tr>
              ) : pageRows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-[#f9fafb]">
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]"
                    >{p.id}</button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditingId(p.id)} className="block max-w-[280px] truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]" title={p.name}>
                      {p.name}
                    </button>
                    <div className="max-w-[280px] truncate text-[12px] text-[#7B8FA5]">Started from {p.source}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#475467]">{p.type}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium ${
                      p.status === 'Published' ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      <span className={`size-1.5 rounded-full ${p.status === 'Published' ? 'bg-[#22A06B]' : 'bg-[#94A3B8]'}`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{p.audience}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{p.modifiedAt}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{p.modifiedBy}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingId(p.id)} title="Edit page" className={actionBtn}><SquarePen size={16} /></button>
                      <button onClick={() => duplicate(p)} title="Duplicate page" className={actionBtn}><Copy size={16} /></button>
                      {/* ⚠️ Disabled WITH a reason on the default page, not hidden. A portal with no
                          landing page is not a state the product can be in, and an action that
                          silently vanishes reads as a bug rather than a rule. */}
                      <button
                        onClick={() => setConfirmId(p.id)}
                        disabled={p.id === DEFAULT_PORTAL_PAGE.id}
                        title={p.id === DEFAULT_PORTAL_PAGE.id
                          ? 'The default portal page cannot be deleted — requesters have to land somewhere'
                          : 'Delete page'}
                        className={`flex size-8 items-center justify-center rounded transition-colors ${
                          p.id === DEFAULT_PORTAL_PAGE.id
                            ? 'cursor-not-allowed text-[#C3CBD6]'
                            : 'text-[#EF4444] hover:bg-[#FEF3F2]'
                        }`}
                      ><Trash2 size={16} /></button>
                    </div>
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
          onItemsPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>
      {overlays}
    </>
  );
}
