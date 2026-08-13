import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Boxes, Check, ChevronsUpDown, ClipboardList, Download, GalleryHorizontal, Gauge, Grid2x2, Heading,
  HelpCircle, Image as ImageIcon, Images, LayoutGrid, LayoutTemplate, LifeBuoy, Link2, List, Mail,
  Megaphone, Minus, MousePointerClick, MoveVertical, PanelTop, Phone, Rows3, Search, Shapes, Share2,
  ShoppingCart, Smile, Square, Table, Timer, Type, X, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  IconAssets, IconKnowledge, IconMyApproval, IconRequest, IconTask,
} from './SidebarIcons';
import { PORTAL_ELEMENT_GROUPS, PORTAL_ELEMENTS } from './supportPortalData';
import type { PortalElement, PortalElementGroup } from './supportPortalData';

/* Add → Elements.
 *
 * Swaps into the builder's design panel rather than opening a second drawer — one panel, one place
 * to look. Layout follows Duda's Elements list: a search, then caps group headers over single-line
 * rows of icon-badge + name. The rows reuse the icon-badge treatment the Admin Overview cards use,
 * so this reads as the same product.
 *
 * **Components comes first** on purpose. Those are the blocks a support portal is actually made of;
 * the generic toolkit below them is the long tail. A system component already on the page renders
 * disabled with an "Added" chip — you cannot have two "My Requests" blocks, so the row says so
 * instead of letting an admin build a broken page. */

/* Icon registry — data holds strings so the catalogue stays plain. ServiceOps blocks deliberately
   use the product's own sidebar glyphs, so a portal component looks like the module it surfaces. */
const ICONS: Record<string, ReactNode> = {
  // Components
  search: <Search size={16} />,
  services: <ShoppingCart size={16} />,
  categories: <Grid2x2 size={16} />,
  requests: <IconRequest size={16} />,
  approvals: <IconMyApproval size={16} />,
  assets: <IconAssets size={16} />,
  tasks: <IconTask size={16} />,
  announcements: <Megaphone size={16} />,
  knowledge: <IconKnowledge size={16} />,
  faq: <HelpCircle size={16} />,
  contact: <LifeBuoy size={16} />,
  // Layout
  tabs: <PanelTop size={16} />,
  accordionAdv: <Rows3 size={16} />,
  divider: <Minus size={16} />,
  // Basic
  text: <Type size={16} />,
  button: <MousePointerClick size={16} />,
  spacer: <MoveVertical size={16} />,
  largeTitle: <Heading size={18} />,
  smallTitle: <Heading size={14} />,
  file: <Download size={16} />,
  list: <List size={16} />,
  countdown: <Timer size={16} />,
  table: <Table size={16} />,
  accordion: <ChevronsUpDown size={16} />,
  textImage: <LayoutTemplate size={16} />,
  card: <Square size={16} />,
  // Visual
  image: <ImageIcon size={16} />,
  slider: <GalleryHorizontal size={16} />,
  gallery: <Images size={16} />,
  icon: <Smile size={16} />,
  shape: <Shapes size={16} />,
  // Business
  call: <Phone size={16} />,
  mail: <Mail size={16} />,
  form: <ClipboardList size={16} />,
  share: <Share2 size={16} />,
  nav: <Link2 size={16} />,
  // Custom
  actionCard: <LayoutGrid size={16} />,
  actionIcon: <Zap size={16} />,
  kpi: <Gauge size={16} />,
  searchCustom: <Search size={16} />,
  predefined: <Boxes size={16} />,
};

const icon = (key: string) => ICONS[key] ?? <Square size={16} />;

const searchText = (e: PortalElement) => `${e.name} ${e.group} ${e.keywords ?? ''}`.toLowerCase();

export function SupportPortalAddPanel() {
  const [query, setQuery] = useState('');
  /** Components added during this session, on top of the ones the page already renders. */
  const [added, setAdded] = useState<string[]>([]);

  const q = query.trim().toLowerCase();

  // ── group navigation ──────────────────────────────────────────────────────
  const scrollerRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeGroup, setActiveGroup] = useState<PortalElementGroup>('Components');
  /** Ignore the scroll-spy briefly after a tab click, so the smooth scroll isn't fought mid-flight. */
  const lockUntil = useRef(0);

  /** Elements per group, after search. Groups with no hits are dropped entirely. */
  const groups = useMemo(() => {
    const hits = q ? PORTAL_ELEMENTS.filter((e) => searchText(e).includes(q)) : PORTAL_ELEMENTS;
    return PORTAL_ELEMENT_GROUPS
      .map((g) => ({ group: g as PortalElementGroup, items: hits.filter((e) => e.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const isAdded = (e: PortalElement) => !!e.onPage || added.includes(e.id);

  const add = (e: PortalElement) => {
    setAdded((prev) => [...prev, e.id]);
    toast.success(`“${e.name}” added to the page`);
  };

  /** A search can remove the group the tabs are pointing at. */
  useEffect(() => {
    if (groups.length && !groups.some((g) => g.group === activeGroup)) setActiveGroup(groups[0].group);
  }, [groups, activeGroup]);

  const goToGroup = (g: PortalElementGroup) => {
    const wrap = groupRefs.current[g];
    const sc = scrollerRef.current;
    if (!wrap || !sc) return;
    // Measured, not offsetTop: the wrapper's offsetParent isn't the scroller.
    const delta = wrap.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    sc.scrollTo({ top: sc.scrollTop + delta - 4, behavior: 'smooth' });
    setActiveGroup(g);
    lockUntil.current = Date.now() + 700;
  };

  /** Scroll-spy — the tab follows manual scrolling, so the strip never lies about where you are. */
  const onScroll = () => {
    if (Date.now() < lockUntil.current) return;
    const sc = scrollerRef.current;
    if (!sc) return;
    // The last group can never reach the top — there is nothing below it to scroll. Once the list
    // bottoms out, that group IS what you are looking at, so say so rather than snapping back.
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2 && groups.length) {
      setActiveGroup(groups[groups.length - 1].group);
      return;
    }
    const top = sc.getBoundingClientRect().top;
    let current = groups[0]?.group;
    groups.forEach(({ group }) => {
      const el = groupRefs.current[group];
      // 44px ≈ the sticky header's own height, so a group counts as "reached" as it pins.
      if (el && el.getBoundingClientRect().top - top <= 44) current = group;
    });
    if (current && current !== activeGroup) setActiveGroup(current);
  };

  // Keep the active tab in view as the spy moves it.
  useEffect(() => {
    stripRef.current?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeGroup]);

  // ── drag-to-scroll the tab strip ──────────────────────────────────────────
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current || !stripRef.current) return;
      const dx = e.clientX - drag.current.x;
      if (Math.abs(dx) > 3) drag.current.moved = true;
      stripRef.current.scrollLeft = drag.current.left - dx;
    };
    const up = () => {
      if (!drag.current) return;
      // Cleared on the next tick so the tab's click handler can still see `moved`.
      const d = drag.current;
      setTimeout(() => { if (drag.current === d) drag.current = null; }, 0);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const startStripDrag = (e: React.MouseEvent) => {
    if (!stripRef.current) return;
    drag.current = { x: e.clientX, left: stripRef.current.scrollLeft, moved: false };
    document.body.style.cursor = 'grabbing';
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search — the project's standard compact field. */}
      <div className="flex-shrink-0 px-4 pb-3 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for elements"
            className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#364658]"
            ><X size={14} /></button>
          )}
        </div>
      </div>

      {/* Group tabs — jump to a group without scrolling for it. Drag the strip sideways to reach
          the ones past the edge; the panel is only 400px so they will not all fit. */}
      {groups.length > 1 && (
        <div
          ref={stripRef}
          onMouseDown={startStripDrag}
          /* scrollbar-hide (theme.css), not the arbitrary utilities — the global
             `.overflow-x-auto` auto-hide rules are declared later and win on source order,
             so `[scrollbar-width:none]` here was silently doing nothing. */
          className="scrollbar-hide flex flex-shrink-0 cursor-grab select-none gap-1.5 overflow-x-auto border-b border-[#F0F2F5] px-4 pb-3 active:cursor-grabbing"
        >
          {groups.map(({ group }) => {
            const on = group === activeGroup;
            return (
              <button
                key={group}
                data-active={on}
                onClick={() => {
                  // A drag that ends on a tab must not also select it.
                  if (drag.current?.moved) return;
                  goToGroup(group);
                }}
                className={`h-7 flex-shrink-0 rounded px-2.5 text-[12px] font-medium transition-colors ${
                  on ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#364658] hover:bg-[#F5F7FA]'
                }`}
              >{group}</button>
            );
          })}
        </div>
      )}

      <div ref={scrollerRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F7FA]">
              <Search className="size-5 text-[#9CA3AF]" />
            </span>
            <p className="text-[14px] font-medium text-[#364658]">No elements found</p>
            <p className="mt-1 max-w-[260px] text-[13px] leading-[1.5] text-[#7B8FA5]">
              Nothing matches “{query}”. Try “approvals”, “image” or “button”.
            </p>
          </div>
        ) : groups.map(({ group, items }) => (
          /* ⚠️ Each group MUST be its own block, not `contents`. With `contents` the wrapper leaves
             layout, every sticky header inherits the scroller as its containing block, and they all
             pin at top 0 forever — which also makes every header report the same position, breaking
             both scroll-to-group and the spy. Scoped per group, a header un-pins as its own group
             scrolls out and the next one takes over, which is the behaviour we wanted anyway. */
          <div key={group} ref={(el) => { groupRefs.current[group] = el; }}>
            <h3 className="sticky top-0 z-10 bg-white pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">
              {group}
            </h3>
            <div className="space-y-2">
              {items.map((e) => {
                const done = isAdded(e);
                if (done) {
                  return (
                    <div
                      key={e.id}
                      title={`${e.name} is already on this page`}
                      className="flex w-full cursor-not-allowed items-center gap-3 rounded border border-[#F0F2F5] bg-[#FAFBFC] px-3 py-2.5"
                    >
                      {/* Icon takes the label's colour, so a row reads as one muted unit. */}
                      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]">
                        {icon(e.icon)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[#9CA3AF]">{e.name}</span>
                      {/* A tick says "already here" in a fraction of the width the word did. */}
                      <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#ECFDF3] text-[#22A06B]">
                        <Check size={13} strokeWidth={2.5} />
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={e.id}
                    draggable
                    onDragStart={(ev) => {
                      // The canvas reads this to know what was dropped.
                      ev.dataTransfer.setData('text/portal-element', e.id);
                      ev.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => add(e)}
                    title={`Drag “${e.name}” onto the page`}
                    className="group/el flex w-full cursor-grab items-center gap-3 rounded border border-[#E5E7EB] bg-white px-3 py-2.5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)] active:cursor-grabbing"
                  >
                    {/* Icon and label share one colour in every state — they are one thing. */}
                    <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#364658] transition-colors group-hover/el:bg-[#EBF5FF] group-hover/el:text-[#3D8BD0]">
                      {icon(e.icon)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#364658] transition-colors group-hover/el:text-[#3D8BD0]">{e.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
