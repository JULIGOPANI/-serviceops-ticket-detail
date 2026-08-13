import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, Check, ChevronLeft, Eye, House, HelpCircle, LayoutTemplate, Loader2, MessageCircle,
  Palette, PanelRight, Paintbrush, Pencil, Plus, Redo2, Share, Undo2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { AiSparkle } from './AiSparkle';
import { SupportPortalPreview } from './SupportPortalPreview';
import { SupportPortalAddPanel } from './SupportPortalAddPanel';
import { PortalElementPanel } from './PortalElementPanel';
import { CanvasProvider } from './PortalCanvas';
import {
  DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER, addColumn, moveIn, nodeById, registerPlaced,
} from './portalPageModel';
import type { CustomSection, NodeStyle, PlacedElement, PortalPageContent, PortalStyles } from './portalPageModel';
import { PORTAL_ELEMENTS } from './supportPortalData';
import type { IconChoice } from './PortalIconPicker';
import type { PortalPage } from './supportPortalData';

/* Support Portal page builder.
 *
 * Full-screen on purpose: the admin sidebar and the product header both give way to the builder's
 * own top bar, because a canvas competing with two navigations has nowhere to be. Leaving is the
 * back arrow, which is why the trail can be dropped.
 *
 * Layout is canvas → design panel → icon rail. The panel is dragged from its LEFT edge and clamped
 * to 400-600px: 400 is the floor because a design panel narrower than that reflows its own controls,
 * and 600 the ceiling because past it the canvas stops representing the page a requester sees. */

const MIN_W = 400;
const MAX_W = 600;

interface SupportPortalBuilderProps {
  page: PortalPage;
  /** Hero tint from the template this page was started from. */
  accent?: string;
  onRename: (name: string) => void;
  onPublish: () => void;
  onExit: () => void;
}

type RailKey = 'add' | 'theme' | 'branding' | 'templates' | 'ai';

const RAIL: { key: RailKey; label: string; icon: (on: boolean) => ReactNode }[] = [
  { key: 'add', label: 'Add', icon: () => <Plus size={18} /> },
  { key: 'theme', label: 'Theme', icon: () => <Paintbrush size={18} /> },
  { key: 'branding', label: 'Branding', icon: () => <Palette size={18} /> },
  { key: 'templates', label: 'Templates', icon: () => <LayoutTemplate size={18} /> },
  { key: 'ai', label: 'AI', icon: (on) => <AiSparkle size={18} className={on ? '' : 'opacity-90'} /> },
];

/** Each panel says what it is for rather than that it is unfinished — an empty state is a
 *  description of the panel's job, not an apology for it. */
const PANEL_COPY: Record<RailKey, { title: string; body: string }> = {
  add: {
    // Add is a real panel now — this entry only supplies the header title.
    title: 'Elements',
    body: '',
  },
  theme: {
    title: 'Theme this page',
    body: 'Typography, color and spacing scales for the portal will be set here, then applied to every block at once.',
  },
  branding: {
    title: 'Brand this page',
    body: 'Logo, favicon and brand colors inherited from Organization › Branding will appear here, with per-page overrides.',
  },
  templates: {
    title: 'Templates',
    body: 'Swap this page for another layout, or save the current one as a reusable template for your other portals.',
  },
  ai: {
    title: 'Build with AI',
    body: 'Describe the portal you want — “a catalog-first page for HR” — and AI will lay the blocks out for you.',
  },
};

/* ── Illustration ────────────────────────────────────────────────────────── */

/** Line-art design surface + stylus. Inline so the panel carries no image asset. */
function SelectElementArt() {
  return (
    <svg viewBox="0 0 140 106" className="h-[106px] w-[140px]" aria-hidden>
      <g fill="none" stroke="#A3AFBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="24" y="12" width="84" height="64" rx="6" />
        <rect x="9" y="30" width="14" height="38" rx="4" fill="#FFFFFF" />
        <path d="M13 38h6M13 45h6M13 52h6" />
        <path d="M34 24h30" />
        <path d="M34 54h44M34 63h32" />
        <path d="M96 88l22-22 7 7-22 22-9.5 2.5z" />
        <path d="M111 73l7 7" />
      </g>
      <rect x="34" y="34" width="34" height="11" rx="3" fill="#C3E059" />
      <path d="M114 20l2.2 4.8 4.8 2.2-4.8 2.2-2.2 4.8-2.2-4.8-4.8-2.2 4.8-2.2z" fill="#DCE3EC" />
    </svg>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

function PanelEmptyState({ active }: { active: RailKey | null }) {
  if (!active) {
    return (
      <div className="flex flex-col items-center px-8 pt-16 text-center">
        <SelectElementArt />
        <p className="mt-5 text-[16px] font-semibold text-[#475467]">Select an element to start</p>
        <p className="mt-1.5 max-w-[300px] text-[14px] leading-[1.55] text-[#5B7A99]">
          It’ll show the design panel with all the design options for that element right here.
        </p>
      </div>
    );
  }
  const copy = PANEL_COPY[active];
  const item = RAIL.find((r) => r.key === active)!;
  return (
    <div className="flex flex-col items-center px-8 pt-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#7B8FA5]">
        {item.icon(false)}
      </span>
      <p className="mt-4 text-[16px] font-semibold text-[#475467]">{copy.title}</p>
      <p className="mt-1.5 max-w-[300px] text-[14px] leading-[1.55] text-[#5B7A99]">{copy.body}</p>
    </div>
  );
}

/* ── Builder ─────────────────────────────────────────────────────────────── */

export function SupportPortalBuilder({ page, accent, onRename, onPublish, onExit }: SupportPortalBuilderProps) {
  const [width, setWidth] = useState(MIN_W);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<RailKey | null>(null);
  const [preview, setPreview] = useState(false);

  // ── canvas state ──────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [content, setContent] = useState<PortalPageContent>(DEFAULT_CONTENT);
  const [styles, setStyles] = useState<PortalStyles>({});

  const setStyle = useCallback((id: string, p: Partial<NodeStyle>) => {
    setStyles((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }, []);

  /** Selecting an element takes over the panel — the design panel IS the element editor. */
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) { setActive(null); setCollapsed(false); }
  }, []);

  /** Sections the admin has added, each pinned to the block it was inserted after. */
  const [sections, setSections] = useState<{ afterId: string; section: CustomSection }[]>([]);
  const nextSectionId = useRef(1);

  const addSection = useCallback((afterId: string, rows: number[][]) => {
    const section: CustomSection = { id: `sec-${nextSectionId.current++}`, rows, items: {} };
    setSections((prev) => [...prev, { afterId, section }]);
    select(section.id);
    toast.success('Section added');
  }, [select]);

  /** Per-placed-element icon and text. Kept beside the sections so the canvas can render them. */
  const [icons, setIcons] = useState<Record<string, IconChoice | undefined>>({});
  const [placedText, setPlacedText] = useState<Record<string, { title?: string; desc?: string }>>({});

  const nextElementId = useRef(1);
  /** Builds the instance and registers it so the canvas and panel can describe it. */
  const makeElement = useCallback((type: string, parent: string) => {
    const def = PORTAL_ELEMENTS.find((e) => e.id === type);
    const el: PlacedElement = { id: `el-${nextElementId.current++}`, type, name: def?.name ?? 'Element' };
    registerPlaced(el.id, el.name, el.type, parent);
    return el;
  }, []);

  const dropInColumn = useCallback((columnId: string, type: string) => {
    const sectionId = columnId.replace(/-c\d+$/, '');
    const el = makeElement(type, columnId);
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId
        ? { ...s, section: { ...s.section, items: { ...s.section.items, [columnId]: el } } }
        : s
    )));
    select(el.id);
    toast.success(`${el.name} added`);
  }, [makeElement, select]);

  /* Dropping on a seam builds the section for you — one column, the element inside it. */
  const dropAtSeam = useCallback((afterId: string, type: string) => {
    const section: CustomSection = { id: `sec-${nextSectionId.current++}`, rows: [[1]], items: {} };
    const col = `${section.id}-c0`;
    const el = makeElement(type, col);
    section.items[col] = el;
    setSections((prev) => [...prev, { afterId, section }]);
    select(el.id);
    toast.success(`${el.name} added in a new section`);
  }, [makeElement, select]);

  const addColumnBeside = useCallback((columnId: string, side: 'left' | 'right') => {
    const sectionId = columnId.replace(/-c\d+$/, '');
    const index = Number(/-c(\d+)$/.exec(columnId)?.[1] ?? 0);
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId ? { ...s, section: addColumn(s.section, index, side) } : s
    )));
  }, []);

  /* ── page order & membership — what the toolbar's move/delete rewrite ── */
  const [blockOrder, setBlockOrder] = useState<string[]>(DEFAULT_BLOCK_ORDER);
  const [rowOrder, setRowOrder] = useState<Record<string, string[]>>(DEFAULT_ROW_ORDER);
  const [removed, setRemoved] = useState<string[]>([]);

  const sectionOfColumn = (id: string) => id.replace(/-c\d+$/, '');
  const placedParent = (id: string) => nodeById(id)?.parent;

  const moveNode = useCallback((id: string, dir: 'prev' | 'next') => {
    const step = dir === 'prev' ? -1 : 1;
    // A top-level band moves within the page.
    if (blockOrder.includes(id)) { setBlockOrder((o) => moveIn(o, id, step)); return; }
    // A card moves within its row.
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row) { setRowOrder((o) => ({ ...o, [row]: moveIn(o[row], id, step) })); return; }
    // An added section moves among the sections pinned to the same anchor.
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => {
        const i = prev.findIndex((s) => s.section.id === id);
        const j = i + step;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
      return;
    }
    toast.success('This element sits on its own — nothing to swap it with');
  }, [blockOrder, rowOrder]);

  /** Only things with their own identity can be cloned; a fixed page band has none. */
  const canDuplicate = useCallback((id: string) => /^sec-\d+$/.test(id) || /^el-\d+$/.test(id), []);

  const duplicateNode = useCallback((id: string) => {
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => {
        const found = prev.find((s) => s.section.id === id);
        if (!found) return prev;
        const copyId = `sec-${nextSectionId.current++}`;
        const items: Record<string, PlacedElement> = {};
        Object.entries(found.section.items).forEach(([col, el]) => {
          const newCol = col.replace(found.section.id, copyId);
          const clone = { ...el, id: `el-${nextElementId.current++}` };
          registerPlaced(clone.id, clone.name, clone.type, newCol);
          items[newCol] = clone;
        });
        return [...prev, { afterId: found.afterId, section: { id: copyId, rows: found.section.rows, items } }];
      });
      toast.success('Section duplicated');
      return;
    }
    // A placed element clones into a fresh column beside its own.
    const col = placedParent(id);
    if (!col) return;
    const secId = sectionOfColumn(col);
    const index = Number(/-c(\d+)$/.exec(col)?.[1] ?? 0);
    setSections((prev) => prev.map((s) => {
      if (s.section.id !== secId) return s;
      const grown = addColumn(s.section, index, 'right');
      const newCol = `${secId}-c${index + 1}`;
      const src = s.section.items[col];
      const items: Record<string, PlacedElement> = { ...s.section.items };
      if (src) {
        const clone = { ...src, id: `el-${nextElementId.current++}` };
        registerPlaced(clone.id, clone.name, clone.type, newCol);
        items[newCol] = clone;
      }
      return { ...s, section: { ...grown, items } };
    }));
    toast.success('Element duplicated');
  }, []);

  const deleteNode = useCallback((id: string) => {
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => prev.filter((s) => s.section.id !== id));
    } else if (/^el-\d+$/.test(id)) {
      const col = placedParent(id);
      setSections((prev) => prev.map((s) => {
        if (!col || !s.section.items[col]) return s;
        const items = { ...s.section.items };
        delete items[col];
        return { ...s, section: { ...s.section, items } };
      }));
    } else {
      const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
      if (row) setRowOrder((o) => ({ ...o, [row]: o[row].filter((x) => x !== id) }));
      else setRemoved((r) => [...r, id]);
    }
    select(null);
    toast.success('Removed');
  }, [rowOrder, select]);

  /* "+" opens the element library — the one place elements come from.
     It also SELECTS the target, so the canvas still shows where the next drop is aimed while the
     panel is showing the list. Not via select(), which would clear the panel it just opened. */
  const addInside = useCallback((id: string) => {
    setSelectedId(id);
    setActive('add');
    setCollapsed(false);
    toast.success('Drag an element from the list onto the page');
  }, []);

  const canvasCtx = {
    selectedId, hoverId, select, setHover: setHoverId, styles, setStyle,
    addSection, addColumnBeside, dropInColumn, dropAtSeam,
    moveNode, duplicateNode, deleteNode, canDuplicate, addInside,
  };

  // Title — inline edit, committed on Enter or blur, abandoned on Escape.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page.name);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(page.name); }, [page.name]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  /** 'saving' for a beat after a change, so the check means something. */
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touch = useCallback(() => {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState('saved'), 900);
  }, []);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === page.name) { setDraft(page.name); return; }
    onRename(next);
    touch();
  };

  // ── panel resize ──────────────────────────────────────────────────────────
  const drag = useRef<{ x: number; w: number } | null>(null);
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { x: e.clientX, w: width };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      // Dragging LEFT widens the panel, so the delta is inverted.
      const next = drag.current.w + (drag.current.x - e.clientX);
      setWidth(Math.min(MAX_W, Math.max(MIN_W, next)));
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  const openPanel = (key: RailKey) => {
    setCollapsed(false);
    // Clicking the lit icon again returns to the design panel rather than doing nothing.
    setActive((prev) => (prev === key && !collapsed ? null : key));
  };

  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
  const divider = <span className="mx-1 h-5 w-px bg-[#E5E7EB]" />;

  // ── preview ───────────────────────────────────────────────────────────────
  if (preview) {
    return (
      <div className="fixed inset-0 z-[9500] flex flex-col bg-[#EEF1F5]">
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4">
          <div className="flex items-center gap-2 text-[13px] text-[#7B8FA5]">
            <Eye size={16} className="text-[#3D8BD0]" />
            Previewing <span className="font-medium text-[#364658]">{page.name}</span> as a requester sees it
          </div>
          <button
            onClick={() => setPreview(false)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          ><X size={14} /> Exit preview</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Preview must behave like the real portal — selection off. */}
          <CanvasProvider value={{ ...canvasCtx, enabled: false, selectedId: null, hoverId: null, select: () => {}, setHover: () => {} }}>
            <SupportPortalPreview accent={accent} content={content} sections={sections} icons={icons} placedText={placedText} blockOrder={blockOrder} rowOrder={rowOrder} removed={removed} />
          </CanvasProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9000] flex flex-col bg-[#EEF1F5]">
      {/* ── Top bar ── the builder's only chrome; the admin nav is deliberately gone. */}
      <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white pl-2 pr-3">
        <button onClick={onExit} title="Back to Support Portal Customization" className={iconBtn}>
          <ArrowLeft size={18} />
        </button>

        {/* Inline title */}
        <div className="flex min-w-0 items-center gap-2">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') { setDraft(page.name); setEditing(false); }
              }}
              className="h-8 w-[260px] rounded border border-[#3D8BD0] bg-white px-2 text-[14px] font-medium text-[#364658] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              title="Rename page"
              className="group/title flex min-w-0 items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-[#F5F7FA]"
            >
              <span className="truncate text-[14px] font-medium text-[#364658]">{page.name}</span>
              <Pencil size={13} className="flex-shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover/title:opacity-100" />
            </button>
          )}
          <span className={`flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
            page.status === 'Published' ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'
          }`}>{page.status}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Nothing has been edited yet, so these say so rather than clicking into nowhere. */}
          <Tooltip><TooltipTrigger asChild>
            <button disabled className={`${iconBtn} cursor-not-allowed opacity-40 hover:bg-transparent`}><Undo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>Nothing to undo</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <button disabled className={`${iconBtn} cursor-not-allowed opacity-40 hover:bg-transparent`}><Redo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>Nothing to redo</TooltipContent></Tooltip>

          {divider}

          <Tooltip><TooltipTrigger asChild>
            <span className="flex size-8 items-center justify-center rounded text-[#22A06B]">
              {saveState === 'saving' ? <Loader2 size={16} className="animate-spin text-[#7B8FA5]" /> : <Check size={17} />}
            </span>
          </TooltipTrigger><TooltipContent>{saveState === 'saving' ? 'Saving…' : 'All changes saved'}</TooltipContent></Tooltip>

          {divider}

          <Tooltip><TooltipTrigger asChild>
            <button onClick={() => toast.success('Comments are on for this page')} className={iconBtn}><MessageCircle size={17} /></button>
          </TooltipTrigger><TooltipContent>Comments</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <button onClick={() => toast.success('Share link copied')} className={iconBtn}><Share size={16} /></button>
          </TooltipTrigger><TooltipContent>Share</TooltipContent></Tooltip>

          <button
            onClick={() => setPreview(true)}
            className="ml-1 inline-flex h-8 items-center rounded px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F3F4F6]"
          >Preview</button>
          <button
            onClick={onPublish}
            className="inline-flex h-8 items-center rounded bg-[#1E293B] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0F172A]"
          >Publish</button>

          {divider}

          <Tooltip><TooltipTrigger asChild>
            <button onClick={() => toast.success('Opening the live support portal')} className={iconBtn}><House size={17} /></button>
          </TooltipTrigger><TooltipContent>Open live portal</TooltipContent></Tooltip>
        </div>
      </div>

      {/* ── Work area ── */}
      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <div className="relative min-w-0 flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-[1600px] overflow-hidden rounded-lg border border-[#E1E6ED] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
            <CanvasProvider value={{ ...canvasCtx, enabled: true }}>
              <SupportPortalPreview accent={accent} content={content} sections={sections} icons={icons} placedText={placedText} blockOrder={blockOrder} rowOrder={rowOrder} removed={removed} />
            </CanvasProvider>
          </div>

          {/* With the panel hidden the rail is the only way back to it — this restores the last one. */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="Show design panel"
              className="fixed right-[72px] top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-l border border-r-0 border-[#E1E6ED] bg-white text-[#64748B] shadow-sm transition-colors hover:text-[#3D8BD0]"
            ><ChevronLeft size={16} /></button>
          )}
        </div>

        {/* Drag handle — its own 5px strip so the 1px seam is still easy to grab. */}
        {!collapsed && (
          <div
            onMouseDown={startDrag}
            title="Drag to resize"
            className="group/rz relative w-[5px] flex-shrink-0 cursor-col-resize bg-[#E5E7EB] transition-colors hover:bg-[#3D8BD0]"
          >
            <span className="absolute left-1/2 top-1/2 h-8 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C3CBD6] transition-colors group-hover/rz:bg-white" />
          </div>
        )}

        {/* Design panel */}
        {!collapsed && (
          <aside style={{ width }} className="flex flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] px-2.5">
              <Tooltip><TooltipTrigger asChild>
                <button onClick={() => setCollapsed(true)} className={iconBtn}><PanelRight size={17} /></button>
              </TooltipTrigger><TooltipContent>Hide panel</TooltipContent></Tooltip>

              {active && <span className="truncate px-1 text-[13px] font-medium text-[#364658]">{PANEL_COPY[active].title}</span>}

              <div className="ml-auto flex items-center gap-0.5">
                <Tooltip><TooltipTrigger asChild>
                  <button onClick={() => toast.success('Opening builder help')} className={iconBtn}><HelpCircle size={17} /></button>
                </TooltipTrigger><TooltipContent>Help</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <button
                    onClick={() => (active ? setActive(null) : setCollapsed(true))}
                    className={iconBtn}
                  ><X size={17} /></button>
                </TooltipTrigger><TooltipContent>{active ? 'Back to design panel' : 'Close panel'}</TooltipContent></Tooltip>
              </div>
            </div>

            {/* A rail panel wins while one is open; otherwise the panel is the element editor,
                falling back to the "select something" empty state. */}
            {active === 'add' ? (
              <div className="min-h-0 flex-1"><SupportPortalAddPanel /></div>
            ) : active ? (
              <div className="min-h-0 flex-1 overflow-y-auto"><PanelEmptyState active={active} /></div>
            ) : selectedId ? (
              <div className="min-h-0 flex-1">
                <PortalElementPanel
                  nodeId={selectedId}
                  content={content}
                  setContent={(fn) => setContent((c) => fn(c))}
                  styles={styles}
                  setStyle={setStyle}
                  onSelect={select}
                  icons={icons}
                  setIcon={(id, c) => setIcons((p) => ({ ...p, [id]: c }))}
                  placedText={placedText}
                  setPlacedText={(id, patch) => setPlacedText((p) => ({ ...p, [id]: { ...p[id], ...patch } }))}
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto"><PanelEmptyState active={null} /></div>
            )}
          </aside>
        )}

        {/* Icon rail — the right-most edge of the builder. Sized to the longest label
            ("Templates") so no caption spills past its own highlight.

            AI sits apart at the BOTTOM and carries a standing gradient tint: it is not a fifth
            panel of the same kind, it is the shortcut past all four, so it reads as its own thing
            rather than the last item of a list. */}
        <div className="flex w-[72px] flex-shrink-0 flex-col items-center gap-3 border-l border-[#e5e7eb] bg-white py-4">
          {RAIL.map((r) => {
            const on = active === r.key && !collapsed;
            const ai = r.key === 'ai';
            return (
              <button
                key={r.key}
                onClick={() => openPanel(r.key)}
                className={`flex w-[60px] flex-col items-center gap-1.5 rounded py-2 transition-all ${
                  ai ? 'mt-auto border' : ''
                } ${
                  ai
                    ? on
                      ? 'border-[#C4B5FD] bg-gradient-to-b from-[#EDE9FE] to-[#FCE7F3] text-[#6D28D9] shadow-[0_0_0_3px_rgba(124,58,237,0.10)]'
                      : 'border-[#EDE9FE] bg-gradient-to-b from-[#F5F3FF] to-[#FDF2F8] text-[#7C3AED] hover:border-[#C4B5FD] hover:shadow-[0_0_0_3px_rgba(124,58,237,0.08)]'
                    : on
                      ? 'bg-[#EBF5FF] text-[#3D8BD0]'
                      : 'text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]'
                }`}
              >
                {r.icon(on)}
                <span className="text-[11px] font-medium leading-none">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
