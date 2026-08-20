import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown, Copy, ExternalLink, LayoutTemplate, MonitorSmartphone, PenLine, Plus, Search,
  Eye, MoreVertical, RotateCcw, Settings, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminSupportPortalSettings } from './AdminSupportPortalSettings';
import { Pagination } from './Pagination';
import { SupportPortalBuilder } from './SupportPortalBuilder';
import { SupportPortalTemplateGallery } from './SupportPortalTemplateGallery';
import {
  DEFAULT_PORTAL_PAGE, PORTAL_TEMPLATES, formatPortalStamp, nextPageId, relPortalStamp, uniquePageName,
} from './supportPortalData';
import type { PortalPage, PortalTemplate } from './supportPortalData';

/* One row's actions. A kebab rather than a rail of icons: five verbs, two of which ("Duplicate
   layout", "Reset layout to default") are phrases no glyph says, so an icon row would need a
   tooltip per item to be readable at all. */
function RowMenu({ isDefault, onCustomize, onPreview, onSettings, onDuplicate, onReset, onDelete }: {
  isDefault: boolean;
  onCustomize: () => void; onPreview: () => void; onSettings: () => void;
  onDuplicate: () => void; onReset: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  /* ⚠️ PORTALLED to the body with fixed positioning. The table sits in an `overflow-x-auto`
     wrapper, so an absolutely-positioned menu inside it is clipped to the row — the first
     build showed a 6px sliver of white under the kebab and nothing else. Measured on open and
     re-measured on scroll/resize so it stays with its button. */
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const W = 210;
    setAt({ top: r.bottom + 4, left: Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8)) });
  };
  useEffect(() => {
    if (!open) return;
    place();
    const away = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]';
  const run = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <div className="flex justify-start">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="More actions"
        className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
      ><MoreVertical size={16} /></button>
      {open && at && createPortal(
        <div
          ref={ref}
          style={{ position: 'fixed', top: at.top, left: at.left }}
          className="z-[10000] w-[210px] overflow-hidden rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg"
        >
          <button onClick={run(onCustomize)} className={item}><PenLine size={14} /> Customize</button>
          <button onClick={run(onPreview)} className={item}><Eye size={14} /> Preview</button>
          <button onClick={run(onSettings)} className={item}><Settings size={14} /> Portal settings</button>
          <div className="my-1 h-px bg-[#E5E7EB]" />
          <button onClick={run(onDuplicate)} className={item}><Copy size={14} /> Duplicate layout</button>
          <button onClick={run(onReset)} className={item}><RotateCcw size={14} /> Reset layout to default</button>
          {/* ⚠️ Not in the reference screen, but a duplicated portal with no way to remove it is a
              dead row. Disabled WITH the reason on the default rather than hidden. */}
          <div className="my-1 h-px bg-[#E5E7EB]" />
          <button
            onClick={run(onDelete)}
            disabled={isDefault}
            title={isDefault ? 'The default portal cannot be deleted — requesters have to land somewhere' : undefined}
            className={`${item} ${isDefault ? 'cursor-not-allowed text-[#C4CDD8] hover:bg-transparent' : 'text-[#EF4444] hover:bg-[#FEF3F2]'}`}
          ><Trash2 size={14} /> Delete</button>
        </div>,
        document.body,
      )}
    </div>
  );
}

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

/* Support Portal — one destination, two things you can do there.
 *
 * ⚠️ TABS, not two nav rows. Customization decides what the portal LOOKS like; Settings decides what
 * a requester may DO on it. They are the same subject, so splitting them across the sidebar would
 * make an admin remember which of two identically-named rows holds the switch they want. */
export function AdminSupportPortalModule({ onBuilder }: { onBuilder?: (open: boolean) => void }) {
  const [tab, setTab] = useState<'customization' | 'settings'>('customization');
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
  /* Which portals are switched on. Absent means ON — a portal you have never touched is live. */
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const isOn = (p: PortalPage) => p.id === DEFAULT_PORTAL_PAGE.id || enabled[p.id] !== false;
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

  /* The strip sits above whichever pane is showing, in the tab styling the detail pages use. */
  const tabs = (
    <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] px-4">
      {([['customization', 'Customization'], ['settings', 'Settings']] as const).map(([id, label]) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`px-2 py-3 text-[13px] font-medium transition-colors border-b-2 ${
            tab === id
              ? 'border-[#3D8BD0] text-[#3D8BD0]'
              : 'border-transparent text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#f9fafb] hover:text-[#364658]'
          }`}
        >{label}</button>
      ))}
    </div>
  );

  /* ⚠️ The head sits ABOVE the tabs and does NOT change with them. Customization and Settings are
     two views of ONE subject, so a title that rewrote itself per tab would read as two different
     pages sharing a nav row — and saying which view you are in is the strip's job, not the title's. */
  const shell = (body: ReactNode) => (
    <>
      <div className="px-4 pt-6">{head}</div>
      {tabs}
      {body}
    </>
  );

  if (tab === 'settings') return shell(<AdminSupportPortalSettings />);

  // ── empty state ── no page has been built yet, so there is nothing to search or filter.
  if (pages.length === 0) {
    return (
      <>
        {shell(
        <div className="px-4 py-6">
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
        </div>)}
        {overlays}
      </>
    );
  }

  // ── listing ───────────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const rows = pages.filter((p) =>
    (scope === 'All' || p.status === scope)
    && (!q || [p.name, p.modifiedBy, p.status].some((f) => f.toLowerCase().includes(q))));
  const totalPages = Math.ceil(rows.length / perPage) || 1;
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const counts: Record<Scope, number> = {
    All: pages.length,
    Published: pages.filter((p) => p.status === 'Published').length,
    Draft: pages.filter((p) => p.status === 'Draft').length,
  };

  /* ⚠️ A portal is a PATH on the tenant's domain, not a domain of its own. The first pass built
     'support.<slug>.com', which reads like every portal owns a hostname somebody would have to
     register. The default page is the site root; everything else hangs off it. */
  const portalUrl = (p: PortalPage) => {
    if (p.id === DEFAULT_PORTAL_PAGE.id) return 'support.acme.com';
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'support.acme.com/' + (slug || p.id.toLowerCase());
  };


  return (
    <>
      {shell(
      <div className="px-4 py-6">
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
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['Portal name', 'URL', 'Status', 'Enabled', ''].map((h, i) => (
                  <th key={h || i} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {pageRows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                  No portal pages match this filter.
                </td></tr>
              ) : pageRows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-[#f9fafb]">
                  {/* The NAME is the way in. The SPP-# pill was a handle nobody refers to a portal by. */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="inline-flex max-w-full items-center gap-2 text-left text-[13px] font-medium text-[#3D8BD0] hover:underline"
                      title={p.name}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.id === DEFAULT_PORTAL_PAGE.id && (
                        <span className="shrink-0 rounded bg-[#E8F1FB] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">Default</span>
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={portalUrl(p)}
                      onClick={(e) => e.preventDefault()}
                      className="text-[13px] text-[#7B8FA5] hover:text-[#3D8BD0] hover:underline"
                    >{portalUrl(p)}</a>
                  </td>
                  {/* ⚠️ Status is a SENTENCE, not a word: the pill says what state the portal is in,
                      the line under it says who left it that way and when, and the amber chip warns
                      that what is live is not what is saved. Split across three columns those stop
                      being one story and the admin has to reassemble it. */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${
                        p.status === 'Published' ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>{p.status}</span>
                      <span className="whitespace-nowrap text-[12px] text-[#7B8FA5]">{relPortalStamp(p.modifiedAt)} by {p.modifiedBy}</span>
                      {p.status === 'Published' && p.dirty && (
                        <span className="whitespace-nowrap rounded-sm bg-[#FEF6E7] px-2 py-0.5 text-[12px] font-medium text-[#B54708]">Unpublished changes</span>
                      )}
                    </div>
                  </td>
                  {/* ⚠️ The DEFAULT portal cannot be switched off — a requester has to land somewhere.
                      Disabled with the reason on it rather than hidden, so the rule is legible. */}
                  <td className="px-4 py-3">
                    <button
                      role="switch"
                      aria-checked={isOn(p)}
                      disabled={p.id === DEFAULT_PORTAL_PAGE.id}
                      title={p.id === DEFAULT_PORTAL_PAGE.id
                        ? 'The default portal is always on — requesters have to land somewhere'
                        : isOn(p) ? 'Switch this portal off' : 'Switch this portal on'}
                      onClick={() => setEnabled((e) => ({ ...e, [p.id]: !isOn(p) }))}
                      className={`relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors ${
                        isOn(p) ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'
                      } ${p.id === DEFAULT_PORTAL_PAGE.id ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span className={`inline-block size-[14px] rounded-full bg-white transition-transform ${
                        isOn(p) ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <RowMenu
                      isDefault={p.id === DEFAULT_PORTAL_PAGE.id}
                      onCustomize={() => setEditingId(p.id)}
                      onPreview={() => toast.success(`Opening ${p.name} in preview`)}
                      onSettings={() => setTab('settings')}
                      onDuplicate={() => duplicate(p)}
                      onReset={() => toast.success(`${p.name} layout reset to the ServiceOps default`)}
                      onDelete={() => setConfirmId(p.id)}
                    />
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
      </div>)}
      {overlays}
    </>
  );
}
