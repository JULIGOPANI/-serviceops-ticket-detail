import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bell, Check, Info, Keyboard, KeyRound, House, MessageSquare, MessagesSquare, Plus, PanelLeft,
  RotateCcw, Search, ShoppingCart, Type, X, ChevronsRight,
} from 'lucide-react';
import { MotadataLogo } from './Header';
import { AiSparkle } from './AiSparkle';
import {
  IconRequest, IconChange, IconAssets, IconCMDB, IconKnowledge, IconMyApproval, IconMyTeam, IconTask,
} from './SidebarIcons';
import {
  PORTAL_APPROVALS, PORTAL_ARTICLES, PORTAL_OPEN_REQUESTS, REQUEST_STATUS_TONE,
} from './supportPortalData';
import { AddSectionSeam, ColumnAdders, Sel, draggedElement, styleOf, useCanvas } from './PortalCanvas';
import { PAGE_ID, chosen, roleStyle } from './portalStyleResolver';
import { shadowCss } from './PortalBoxControls';
import { PortalPlacedElement } from './PortalPlacedElement';
import { DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER, colId, nodePath } from './portalPageModel';
import type { CustomSection, PlacedElement, PortalPageContent } from './portalPageModel';
import { iconNode } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';

/* The Support Portal page — what an end user sees, rendered inside the builder canvas.
 *
 * Everything editable comes from `content`, and every selectable block wraps itself in <Sel>. That
 * is what makes an edit in the right-hand panel show up here immediately: there is one source for
 * the value and the canvas is just a view of it. */

interface SupportPortalPreviewProps {
  accent?: string;
  content?: PortalPageContent;
  /** Sections the admin has added, keyed to the block they sit after. */
  sections?: { afterId: string; section: CustomSection }[];
  /** Per-placed-element icon and text, so a configured element stops looking blank. */
  icons?: Record<string, IconChoice | undefined>;
  placedText?: Record<string, { title?: string; desc?: string }>;
  /** Page order and membership, rewritten by the toolbar move/delete actions. */
  blockOrder?: string[];
  rowOrder?: Record<string, string[]>;
  removed?: string[];
  /** Elements dropped into a built-in row, rendered after that row's own cards. */
  rowExtras?: Record<string, PlacedElement[]>;
  /* Resolved widget config per node (spec §9). Every field in the drawer reads back through this,
     which is what makes "live apply" real — a control that looks right and changes nothing teaches
     people to distrust the panel. */
  cfg?: (id: string) => Record<string, unknown>;
}

/* ── how a widget's config reaches its rendering ─────────────────────────── */

const EMPTY_CFG: Record<string, unknown> = {};

/* The 9-point picker maps onto text-align plus auto margins — the block moves AND its text follows,
   which is what "content alignment" means on a banner. */
const heroAlignX = (p: string): 'left' | 'center' | 'right' =>
  (p.includes('left') ? 'left' : p.includes('right') ? 'right' : 'center');
const heroML = (p: string) => (p.includes('left') ? '0' : 'auto');
const heroMR = (p: string) => (p.includes('right') ? '0' : 'auto');

/** A list card's chrome, resolved through the inheritance chain (P4). */
function useListChrome(id: string) {
  const { styles } = useCanvas();
  const density = chosen(styles, id, 'density') ?? 'comfortable';
  return {
    dividers: chosen(styles, id, 'dividers') !== false,
    gap: chosen(styles, id, 'gap'),
    rowPad: density === 'compact' ? 6 : 10,
  };
}

/* An added section: rows of equal-height columns, each empty until something is dropped in. The
   grey `+` is the resting affordance; selecting or hovering the column reveals the blue ones that
   split it left/right. */
/* A built-in row that accepts drops.
 *
 * Every section takes an element, not just the ones an admin added — otherwise "add anything
 * anywhere" is only true in half the page. A drop lands in that row alongside the cards already
 * there, sharing the row the same way they do. */
function RowDrop({ rowId, className, style, children }: {
  rowId: string; className: string; style?: React.CSSProperties; children: ReactNode;
}) {
  const { dropInRow } = useCanvas();
  const [over, setOver] = useState(false);
  return (
    <div
      style={style}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('text/portal-element')) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const type = draggedElement(e);
        setOver(false);
        if (!type) return;
        e.preventDefault();
        e.stopPropagation();
        dropInRow(rowId, type);
      }}
      className={`${className} ${over ? 'rounded outline-2 outline-dashed -outline-offset-4 outline-[#3D8BD0]' : ''}`}
    >{children}</div>
  );
}

/* A column: empty and dashed until something is dropped in, then just the element on the section's
   own surface. No wrapper card — the element brings whatever chrome it actually needs. */
function ColumnBody({ id, item, live, icons, placedText, cfg }: { id: string; item?: PlacedElement; live: boolean; icons?: Record<string, IconChoice | undefined>; placedText?: Record<string, { title?: string; desc?: string }>; cfg?: (id: string) => Record<string, unknown> }) {
  const { styles, dropInColumn, addInside } = useCanvas();
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { if (e.dataTransfer.types.includes('text/portal-element')) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const type = draggedElement(e);
        setOver(false);
        if (!type) return;
        e.preventDefault();
        e.stopPropagation();
        dropInColumn(id, type);
      }}
      style={styleOf(styles, id)}
      className={`relative flex h-full min-h-[120px] flex-col justify-center rounded transition-colors ${
        item ? '' : 'items-center border border-dashed'
      } ${over ? 'border-[#3D8BD0] bg-[#EBF5FF]' : item ? '' : 'border-[#C3CBD6]'}`}
    >
      {/* ⚠️ The element gets its OWN Sel. Without one the column was the innermost selectable thing,
          so clicking a collection widget selected the column — and with items now selectable inside
          it, the widget itself became reachable only through the breadcrumb. */}
      {item ? (
        <>
          <Sel id={item.id} className="w-full">
            <PortalPlacedElement item={item} icon={icons?.[item.id]} text={placedText?.[item.id]} cfg={cfg?.(item.id)} />
          </Sel>
          {/* ⚠️ A FILLED column keeps its adders too. They used to appear only on an empty column,
              so the moment you put something in one — or selected what was already there — the way
              to add a column beside it vanished, and the only remaining route was to empty it. */}
          {live && <ColumnAdders columnId={id} filled />}
        </>
      ) : (
        live ? <ColumnAdders columnId={id} /> : (
          /* Unselected columns stay grey but are NOT dead — clicking still opens the element
             library, so you can fill any column without selecting it first. */
          <button
            onClick={(e) => { e.stopPropagation(); addInside(id); }}
            title="Add an element here"
            className="flex size-6 items-center justify-center rounded-full bg-[#C3CBD6] text-white transition-colors hover:bg-[#3D8BD0]"
          ><Plus size={14} /></button>
        )
      )}
      {over && <span className="pointer-events-none absolute inset-0 rounded ring-2 ring-[#3D8BD0]" />}
    </div>
  );
}

function AddedSection({ section, icons, placedText, cfg }: { section: CustomSection; icons?: Record<string, IconChoice | undefined>; placedText?: Record<string, { title?: string; desc?: string }>; cfg?: (id: string) => Record<string, unknown> }) {
  const { styles, selectedId, hoverId } = useCanvas();
  let index = -1;
  return (
    <Sel id={section.id} className="mt-4">
      {/* White: a new section is a blank surface, not a tinted band. */}
      <div style={styleOf(styles, section.id)} className="rounded-lg border border-[#E5E7EB] bg-white p-6">
        <div className="flex flex-col gap-4">
          {section.rows.map((row, r) => (
            <div key={r} className="flex gap-4">
              {row.map((weight, c) => {
                index += 1;
                const id = colId(section.id, index);
                /* Blue adders belong to ONE column at a time — the selected one, or the one the
                   pointer is over. Lighting every column at once put two `+` buttons either side of
                   each shared edge and made the row noisy.
                   ⚠️ Hover counts even while something ELSE is selected, and the hover is matched
                   against the whole PATH rather than the column id: with an element selected inside
                   a column, the pointer is over the element, not the column, and requiring an exact
                   match meant selecting a child silently took the add affordance away. That is the
                   same rule "+ Add Section" already follows on section hover. */
                const live = selectedId === id
                  || (!!hoverId && nodePath(hoverId).some((n) => n.id === id));
                const item = section.items[id];
                return (
                  <Sel key={c} id={id} className="min-h-[120px] flex-1" style={{ flex: weight }}>
                    <ColumnBody id={id} item={item} live={live} icons={icons} placedText={placedText} cfg={cfg} />
                  </Sel>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Sel>
  );
}

/* ── Chrome ──────────────────────────────────────────────────────────────── */

const RAIL_ITEMS = [
  { key: 'requests', label: 'Requests', Icon: ({ size = 19 }: { size?: number }) => <IconRequest size={size} /> },
  { key: 'catalog', label: 'Service Catalog', Icon: ({ size = 19 }: { size?: number }) => <ShoppingCart size={size} strokeWidth={1.7} /> },
  { key: 'changes', label: 'Changes', Icon: ({ size = 19 }: { size?: number }) => <IconChange size={size} /> },
  { key: 'assets', label: 'My Assets', Icon: ({ size = 19 }: { size?: number }) => <IconAssets size={size} /> },
  { key: 'cis', label: 'My CIs', Icon: ({ size = 19 }: { size?: number }) => <IconCMDB size={size} /> },
  { key: 'knowledge', label: 'Knowledge', Icon: ({ size = 19 }: { size?: number }) => <IconKnowledge size={size} /> },
  { key: 'approvals', label: 'My Approvals', Icon: ({ size = 19 }: { size?: number }) => <IconMyApproval size={size} /> },
  { key: 'team', label: 'My Team', Icon: ({ size = 19 }: { size?: number }) => <IconMyTeam size={size} /> },
  { key: 'tasks', label: 'Tasks', Icon: ({ size = 19 }: { size?: number }) => <IconTask size={size} /> },
];

/* §7.23 — the rail's ORDER and VISIBILITY are the admin's; the destinations are the product's. The
   items array is matched against the rail's own glyphs by index, so hiding or reordering in the
   drawer moves the real rail. */
function PortalRail({ cfg = EMPTY_CFG }: { cfg?: Record<string, unknown> }) {
  const width = Number(cfg.railWidth ?? 60);
  const iconSize = Number(cfg.railIconSize ?? 18);
  const spacing = Number(cfg.railSpacing ?? 4);
  const withLabels = cfg.railLabels === 'both';
  const items = (cfg.items as { id: string; name: string; hidden?: boolean }[]) ?? [];
  /* A destination the requester cannot reach never appears, whatever the order (§7.23) — here that
     is the `hidden` flag, which is the only lever an admin has over the set. */
  const order = items.length
    ? items.filter((i) => !i.hidden).map((i) => RAIL_ITEMS.find((r) => r.label === i.name)).filter(Boolean) as typeof RAIL_ITEMS
    : RAIL_ITEMS;

  return (
    <Sel id="rail" className="flex flex-shrink-0 flex-col items-center border-r border-[#e5e7eb] bg-white py-3" style={{ width }}>
      <div className="flex flex-1 flex-col items-center" style={{ gap: spacing }}>
        {order.map(({ key, label, Icon }) => (
          <span key={key} title={label} className="flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[#6b7280]">
            <Icon size={iconSize} />
            {withLabels && <span className="max-w-full truncate text-[9px] leading-none">{label}</span>}
          </span>
        ))}
      </div>
      <span className="mt-3 flex size-8 items-center justify-center">
        <svg viewBox="0 0 24 24" className="size-6">
          <circle cx="12" cy="12" r="10" fill="#F1F5F9" />
          <path d="M12 2a10 10 0 0 1 10 10h-10z" fill="#E11D48" />
          <path d="M12 12v10A10 10 0 0 1 2 12z" fill="#1F2937" />
        </svg>
      </span>
    </Sel>
  );
}

function PortalHeader({ cfg = EMPTY_CFG }: { content?: PortalPageContent; cfg?: Record<string, unknown> }) {
  const { styles } = useCanvas();
  const barHeight = Number(cfg.barHeight ?? 56);
  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#6b7280]';
  const pos = String(cfg.logoPos ?? 'left');

  /* Two units, not ten. The action cluster is ONE selectable block pinned top-right — dragging
     Bell between Home and Help is a freedom nobody wants and a bar nobody can read. What moves is
     the LOGO, against that fixed cluster. */
  const logo = (
    <Sel id="header-logo" className="flex min-w-0 flex-shrink items-center overflow-hidden">
      {cfg.logoSrc ? <img src={String(cfg.logoSrc)} alt="" className="max-h-7 object-contain" /> : <MotadataLogo />}
    </Sel>
  );

  const actions = (
    <Sel id="header-actions" className="flex flex-shrink-0 items-center gap-1.5">
      <span className="inline-flex h-8 items-center gap-1.5 rounded border border-[#3D8BD0] px-2.5 text-[13px] font-medium text-[#364658]"><AiSparkle size={14} /> Ask AI</span>
      <span className="flex size-8 items-center justify-center rounded bg-[#1E293B] text-white"><Plus size={17} /></span>
      <span className={iconBtn}><Type size={17} /></span>
      <span className={iconBtn}><MessagesSquare size={17} /></span>
      <span className={iconBtn}><Bell size={17} /></span>
      <span className={iconBtn}><Keyboard size={17} /></span>
      <span className={iconBtn}><House size={17} /></span>
      <span className={iconBtn}><Info size={17} /></span>
      <span className="flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-[11px] font-semibold text-white">YG</span>
    </Sel>
  );

  const gap = <span className="flex-1" />;

  return (
    <Sel
      id="header"
      /* 'under', not the hero's `true`: the bar is ~60px of logo and actions edge to edge, so a
         toolbar placed just inside its top edge lands squarely on the logo it is meant to let you
         edit. Below the bar it covers the page instead, which is empty at that moment anyway. */
      toolbarBelow="under"
      style={{
        height: barHeight,
        background: String(cfg.barBg ?? '#FFFFFF'),
        borderBottomWidth: cfg.barDivider === false ? 0 : 1,
        boxShadow: shadowCss({
          on: cfg.shadowOn === true,
          color: String(cfg.shadowColor ?? '#0F172A'),
          type: (cfg.shadowType as 'outer' | 'inner') ?? 'outer',
          pos: String(cfg.shadowPos ?? 'bottom'),
        }),
        ...styleOf(styles, 'header'),
      }}
      className="flex flex-shrink-0 items-center border-b border-[#e5e7eb] px-4"
    >
      {/* ⚠️ The clip lives on this INNER row, not on the Sel itself. On the Sel it also clipped the
          selection toolbar, which now hangs below the bar — the bar's contents still have to be
          clipped when the design panel is dragged wide, but a floating control must escape. */}
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span className={iconBtn}><PanelLeft size={18} /></span>
        {pos === 'left' && <>{logo}{gap}{actions}</>}
        {pos === 'center' && <>{gap}{logo}{gap}{actions}</>}
        {pos === 'right' && <>{actions}{gap}{logo}</>}
      </div>
    </Sel>
  );
}

function HeroArtwork() {
  const nodes = [
    [14, 46, 20], [22, 18, 13], [34, 62, 15], [50, 34, 30], [50, 78, 11],
    [64, 16, 14], [69, 58, 13], [78, 30, 12], [88, 46, 15], [93, 74, 12], [8, 78, 10], [41, 22, 9],
  ];
  const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [3, 6], [5, 7], [6, 8], [7, 8], [8, 9], [0, 10], [1, 11], [11, 3]];
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#94A3B8" strokeWidth="0.12" opacity="0.5" />
      ))}
      {nodes.map(([x, y, r], i) => (
        <g key={i} opacity={i === 3 ? 0.28 : 0.16}>
          <circle cx={x} cy={y} r={r / 10} fill="#CBD5E1" opacity="0.35" />
          <circle cx={x} cy={y} r={r / 18} fill="none" stroke="#CBD5E1" strokeWidth="0.15" />
        </g>
      ))}
    </svg>
  );
}

/* ── Cards ───────────────────────────────────────────────────────────────── */

/* The list-card header: title, optional count, optional "View all".
 *
 * Every switch here comes from the widget's own config, so unticking "Show total count" in the
 * drawer removes the badge on the canvas immediately. `nodeId` drives the typography roles, which
 * resolve up the chain — a colour set on the Cards Row lands on all three of its cards. */
function CardShell({ nodeId, titleNodeId, title, count, cfg = EMPTY_CFG, children }: {
  nodeId?: string; titleNodeId?: string; title: string; count: number;
  cfg?: Record<string, unknown>; children: ReactNode;
}) {
  const { styles } = useCanvas();
  const rid = nodeId ?? titleNodeId ?? '';
  const titleCss = rid ? roleStyle(styles, rid, 'title') : undefined;
  const linkCss = rid ? roleStyle(styles, rid, 'link') : undefined;
  const showCount = cfg.showCount !== false;
  const plain = cfg.countStyle === 'plain';
  const showViewAll = cfg.showViewAll !== false;

  /* ⚠️ `@container`, not a viewport breakpoint. A card is resized by dragging ITS edge, so it has to
     respond to its own width — the window never changed. Same mechanism the Software card grid uses.
     The header is one line at any width: the title truncates, the count and the link never shrink,
     and the "View all" WORD drops below 240px so the chevron alone carries the affordance rather
     than the whole row wrapping to two lines. */
  return (
    <div className="@container flex min-w-0 flex-col">
      <div className="flex items-center gap-2 px-4 pb-2.5 pt-3.5">
        {titleNodeId ? (
          <Sel id={titleNodeId} className="min-w-0 flex-1 px-0.5">
            <span style={{ ...titleCss, ...styleOf(styles, titleNodeId) }} className="block truncate text-[15px] font-semibold text-[#364658]">{title}</span>
          </Sel>
        ) : (
          <span style={titleCss} className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#364658]">{title}</span>
        )}
        {showCount && (
          plain
            ? <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">{count}</span>
            : (
              <span className="inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
                {count}
              </span>
            )
        )}
        {showViewAll && (
          <span style={linkCss} className="flex flex-shrink-0 items-center gap-1 text-[#7B8FA5]">
            {/* ⚠️ Tailwind v4 arbitrary container queries are `@min-[…]`, not the v3 plugin's
                `@[…]` — the old form compiles to nothing and the label never hides. */}
            {cfg.viewAllLabel ? <span className="hidden text-[12px] font-medium @min-[240px]:inline">{String(cfg.viewAllLabel)}</span> : null}
            <ChevronsRight size={16} />
          </span>
        )}
      </div>
      <div className="min-h-0 min-w-0 flex-1 px-4 pb-3">{children}</div>
    </div>
  );
}

/* One live row's ID pill — placement is a per-widget decision, so it is drawn in one place.
   ⚠️ `max-w-full truncate` rather than a bare `whitespace-nowrap`: a long one like
   "AST-13: DESKTOP-5JPPI6F" would otherwise set a min-content floor that pushes the card wider than
   its column and defeats every width the section asks for. */
const IdPill = ({ children }: { children: ReactNode }) => (
  <span className="max-w-full flex-shrink truncate whitespace-nowrap rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#475467]">{children}</span>
);

/** The rows container — P4's dividers and gap, resolved. */
function ListBody({ nodeId, children }: { nodeId: string; children: ReactNode }) {
  const { dividers, gap } = useListChrome(nodeId);
  return (
    <div
      style={gap !== undefined ? { display: 'flex', flexDirection: 'column', gap: `${gap}px` } : undefined}
      className={dividers ? 'divide-y divide-[#F0F2F5] border-t border-[#F0F2F5]' : 'border-t border-[#F0F2F5]'}
    >{children}</div>
  );
}

/** One row — P4's density decides how much air it gets. */
function Row({ nodeId, children }: { nodeId: string; children: ReactNode }) {
  const { rowPad } = useListChrome(nodeId);
  return <div style={{ paddingTop: rowPad, paddingBottom: rowPad }}>{children}</div>;
}

/* ── The page ────────────────────────────────────────────────────────────── */

export function SupportPortalPreview({ accent = '#0F172A', content = DEFAULT_CONTENT, sections = [], icons, placedText, blockOrder = DEFAULT_BLOCK_ORDER, rowOrder = DEFAULT_ROW_ORDER, removed = [], rowExtras, cfg }: SupportPortalPreviewProps) {
  const { styles, enabled, select } = useCanvas();
  const st = (id: string) => styleOf(styles, id);
  /** A widget's resolved config, or its rendering defaults when the builder passes none. */
  const wc = (id: string) => cfg?.(id) ?? EMPTY_CFG;
  /* §7.22 — the page layer. Its primary colour drives the hero gradient, so a preset visibly
     retints the page rather than only changing a swatch in the panel. */
  const pageCfg = wc(PAGE_ID);
  const pageAccent = String(pageCfg.primary ?? accent);

  /* A row member's DEFAULT share, before anyone drags it. Rows are flex rather than grid so a
     resize can hand shares around between siblings; grid tracks would ignore them. */
  const share = (cols: number, gap = 16): React.CSSProperties => ({ flex: `1 1 calc((100% - ${(cols - 1) * gap}px) / ${cols})` });

  /* §7.21 — a section owns its column count, its gap and the air above and below it. Read through
     the widget config so the drawer's sliders move the real band. */
  const secCols = (id: string, fallback: number) => Number(wc(id).cols ?? fallback);
  const secGap = (id: string) => Number(wc(id).colGap ?? 16);
  /* ⚠️ Padding is applied only when it has actually been SET. A spec default here would silently
     add space to every band the day the control shipped — the same reason `containerCss` skips
     theme-sourced values. */
  const secBox = (id: string): React.CSSProperties => ({
    paddingTop: wc(id).padTop === undefined ? undefined : Number(wc(id).padTop) || undefined,
    paddingBottom: wc(id).padBottom === undefined ? undefined : Number(wc(id).padBottom) || undefined,
    /* Columns alignment — how the cards sit on the CROSS axis. `stretch` is the odd one out: it is
       the flex default the row already has, so it is expressed as `undefined` rather than a value. */
    alignItems: ({ start: 'flex-start', center: 'center', end: 'flex-end', stretch: undefined } as
      Record<string, string | undefined>)[String(wc(id).valign ?? 'stretch')],
    /* Content alignment — how the cards distribute along the MAIN axis. Inert until now: the
       control wrote the key and nothing read it. */
    justifyContent: ({ start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around' } as
      Record<string, string | undefined>)[String(wc(id).distribute ?? 'start')],
    /* Size › Height. minHeight not height, so a band still grows when its content needs more room —
       a fixed height would clip the cards the moment someone raised the icon size. */
    minHeight: Number(wc(id).minHeight) || undefined,
  });

  /* Statuses is a DISPLAY toggle, not a row filter: unticking one hides that status badge from the
     rows that carry it, and the request itself stays listed. Filtering rows out instead would make
     "Show 5" and the status list fight over how many rows appear. */
  const visibleRequests = PORTAL_OPEN_REQUESTS.slice(0, Number(wc('requests').show ?? content.requests.show));
  const visibleApprovals = PORTAL_APPROVALS.slice(0, Number(wc('approvals').show ?? content.approvals.show));
  const visibleArticles = PORTAL_ARTICLES.slice(0, Number(wc('knowledge').show ?? content.knowledge.show));

  /* The seam under a block, plus any sections added there.
     ⚠️ It MUST carry its own `order`. The bands are sequenced with CSS order inside a flex column,
     and a child without one defaults to 0 — which silently collapsed every seam to the top of the
     page and made the lower ones disappear. Bands take even slots, seams the odd slot after them. */
  const slot = (id: string) => blockOrder.indexOf(id) * 2;
  const after = (id: string) => (
    <div className="px-6" style={{ order: slot(id) + 1 }}>
      <AddSectionSeam afterId={id} />
      {/* ⚠️ Every added section gets its OWN seam too, not just the four built-in bands. Without
          one, the page could only ever grow at the four original anchors: you could add a section
          under the hero but never under the section you had just added, and the CTA a section
          offers on hover had nowhere to appear. The seam's `afterId` is the section itself, which
          is also what makes `addSection` splice the next one in directly below it. */}
      {sections.filter((s) => s.afterId === id).map((s) => (
        <Fragment key={s.section.id}>
          <AddedSection section={s.section} icons={icons} placedText={placedText} cfg={cfg} />
          <AddSectionSeam afterId={s.section.id} />
        </Fragment>
      ))}
    </div>
  );

  /* Order and removal are handled HERE, once, for every card on the page.
     CSS `order` reorders flex siblings without moving the JSX, which keeps a move action to one
     number instead of a structural rewrite of the page body. */
  const card = (id: string, body: ReactNode, cols?: number, gap = 16) => {
    if (removed.includes(id)) return null;
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row && !rowOrder[row].includes(id)) return null;
    const order = row ? rowOrder[row].indexOf(id) : 0;
    return cardInner(id, body, cols, order, gap);
  };

  const cardInner = (id: string, body: ReactNode, cols: number | undefined, order: number, gap = 16) => (
    /* ⚠️ No overflow-hidden here. The chip sits at -top-4 and the toolbar at -top-11, both OUTSIDE
       the wrapper — clipping it silently removes the card's hover outline and quick actions. */
    /* ⚠️ `min-w-0` is what makes the row honour its column count. Without it a card's widest
       unbreakable content — the "AST-13: DESKTOP-5JPPI6F" pill, a long subject — sets a min-content
       floor above the flex basis, and the third card wraps to its own line however many columns the
       section says it has. */
    <Sel id={id} className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white" style={{ ...(cols ? share(cols, gap) : {}), order }}>
      {/* No overflow-hidden: a card must be free to grow past a dragged height rather than clip
          its own rows. The radius is on the Sel wrapper, which keeps the corners. */}
      <div style={st(id)} className="rounded-lg">{body}</div>
    </Sel>
  );

  /* Order and membership come from state, so the toolbar's move and delete actually rewrite what
     the page renders rather than only what it remembers. */
  const inRow = (row: string) => (rowOrder[row] ?? []).filter((x) => !removed.includes(x));
  const quickCards = inRow("quick")
    .map((cid) => content.quick.find((q) => q.id === cid))
    .filter((q): q is typeof content.quick[number] => !!q);

  return (
    <div
      className="flex min-h-full flex-col bg-white"
      /* §7.22 — the PAGE layer. The typeface cascades normally; the text scale uses `zoom` because
         this page is built from px sizes, so a root font-size would move nothing. The spec's own
         words are "scales every size together", which is what zoom does. It stops at 90–115%
         because past that the layout breaks — which is why the slider stops there too. */
      style={{
        fontFamily: pageCfg.typeface ? String(pageCfg.typeface) : undefined,
        zoom: pageCfg.fontScale ? Number(pageCfg.fontScale) / 100 : undefined,
        ...styleOf(styles, PAGE_ID),
      }}
      /* Clicking bare canvas clears the selection — an editor with no way out of a selection
         traps you in whatever you touched last. */
      onClick={() => enabled && select(null)}
    >
      <PortalHeader content={content} cfg={wc("header")} />

      <div className="flex min-h-0 flex-1">
        <PortalRail cfg={wc("rail")} />

        <div className="min-w-0 flex-1 bg-[#F4F6FA]">
          {/* ── Hero ── */}
          {/* Full bleed ignores the page's side inset (§7.20); the 9-point picker places the
              content block, and the heading colour is the one the contrast guard measures. */}
          <Sel id="hero" toolbarBelow className={wc('hero').fullBleed === true ? '-mx-0' : ''}>
            <div
              className="relative overflow-hidden pb-[86px]"
              style={{
                background: `linear-gradient(135deg, ${pageAccent} 0%, #050B18 100%)`,
                minHeight: Number(wc('hero').height ?? 260),
                ...st('hero'),
              }}
            >
              <HeroArtwork />
              <div
                className="relative px-6 pb-6 pt-14"
                style={{
                  textAlign: heroAlignX(String(wc('hero').contentAlign ?? 'center')),
                  maxWidth: `${Number(wc('hero').contentMaxWidth ?? 70)}%`,
                  marginLeft: heroML(String(wc('hero').contentAlign ?? 'center')),
                  marginRight: heroMR(String(wc('hero').contentAlign ?? 'center')),
                }}
              >
                <Sel id="hero-title" className="inline-block px-1">
                  <h2
                    style={{ color: String(wc('hero').headingColor ?? '#4C7BA8'), ...roleStyle(styles, 'hero', 'title'), ...st('hero-title') }}
                    className="text-[30px] font-semibold leading-tight"
                  >
                    {String(wc('hero').heading ?? content.hero.title)}
                  </h2>
                </Sel>
                <Sel id="hero-subtitle" className="mx-auto mt-2 inline-block px-1">
                  <p style={{ ...roleStyle(styles, 'hero', 'subtitle'), ...st('hero-subtitle') }} className="text-[15px] text-white/85">
                    {String(wc('hero').sub ?? content.hero.subtitle)}
                  </p>
                </Sel>
                {wc('hero').showSearch !== false && (
                  <Sel
                    id="hero-search"
                    className="mt-5 w-full"
                    style={{ maxWidth: `${Number(wc('hero').searchWidth ?? 70)}%`, marginLeft: 'auto', marginRight: 'auto' }}
                  >
                    <div
                      style={{ borderRadius: Number(wc('hero').searchRadius ?? 4), ...st('hero-search') }}
                      className="flex h-11 items-center gap-2 bg-white px-4"
                    >
                      <span className="flex-1 text-left text-[14px] text-[#9CA3AF]">
                        {String(wc('hero').searchPlaceholder ?? content.hero.placeholder)}
                      </span>
                      <Search size={18} className="text-[#64748B]" />
                    </div>
                  </Sel>
                )}
              </div>
            </div>
          </Sel>

          {/* No horizontal padding here: a SECTION runs from the page's left edge to its right
              edge, so each one carries its own inset instead of sitting inside a padded column. */}
          <div className="flex flex-col pb-8">
            {after('hero')}

            {/* ── Quick actions ── */}
            <Sel id="quick" className={`relative z-10 px-6 ${blockOrder.indexOf("quick") === 0 ? "-mt-[62px]" : "mt-5"}`} style={{ order: slot("quick") }}>
              <RowDrop rowId="quick" className="flex flex-wrap" style={{ gap: secGap("quick"), ...secBox("quick") }}>
                {quickCards.map((a) => {
                  const c = wc(a.id);
                  /* ⚠️ The SECTION's Card template is the row's shape and wins over the card's own
                     iconPos — that is the whole point of choosing it on the parent, so a row of
                     cards can't disagree. The card keeps iconPos as its fallback for a section that
                     has never had a template picked. */
                  const tpl = String(wc('quick').cardTemplate ?? c.iconPos ?? 'left');
                  const top = tpl === 'top';
                  const iconRight = tpl === 'right';
                  const centre = c.contentAlign === 'center';
                  // P6: the icon's size, colour and container are style; WHICH icon is content.
                  const iconSize = chosen(styles, a.id, 'iconSize') ?? 22;
                  const iconColor = chosen(styles, a.id, 'iconColor');
                  const iconShape = chosen(styles, a.id, 'iconShape');
                  const iconFill = chosen(styles, a.id, 'iconFill');
                  return (
                    <Sel key={a.id} id={a.id} className="min-w-0 rounded-lg" style={share(secCols("quick", content.cols.quick), secGap("quick"))}>
                      <div
                        style={st(a.id)}
                        className={`flex h-full gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.06)] ${
                          top ? 'flex-col' : iconRight ? 'flex-row-reverse items-center' : 'items-center'
                        } ${centre ? 'items-center text-center' : ''}`}
                      >
                        <span
                          style={{
                            color: iconColor as string | undefined,
                            background: iconShape === 'none' ? 'transparent' : (iconFill as string | undefined),
                            borderRadius: iconShape === 'circle' ? 999 : undefined,
                            width: Number(iconSize) + 22, height: Number(iconSize) + 22,
                          }}
                          className="flex flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#475467]"
                        >
                          {/* A picked icon wins; otherwise the card keeps the one it shipped with. */}
                          {iconNode(icons?.[a.id], Number(iconSize))
                            ?? (a.id === 'quick-incident' ? <IconRequest size={Number(iconSize)} />
                              : a.id === 'quick-service' ? <ShoppingCart size={Number(iconSize) - 1} strokeWidth={1.7} />
                              : a.id === 'quick-ad' ? <KeyRound size={Number(iconSize)} strokeWidth={1.7} />
                              : <IconKnowledge size={Number(iconSize)} />)}
                        </span>
                        {/* The words are their own nodes, so clicking the title edits the title —
                            not the card it happens to sit in. */}
                        <span className="min-w-0">
                          <Sel id={`${a.id}-title`}>
                            <span style={roleStyle(styles, `${a.id}-title`, 'title')} className="block truncate text-[16px] font-semibold text-[#364658]">{String(c.title ?? a.title)}</span>
                          </Sel>
                          <Sel id={`${a.id}-sub`}>
                            <span style={roleStyle(styles, `${a.id}-sub`, 'body')} className="block truncate text-[13px] text-[#7B8FA5]">{String(c.sub ?? a.desc)}</span>
                          </Sel>
                        </span>
                      </div>
                    </Sel>
                  );
                })}

                {(rowExtras?.['quick'] ?? []).map((el) => (
                  <Sel key={el.id} id={el.id} style={share(secCols("quick", content.cols.quick), secGap("quick"))}>
                    <PortalPlacedElement item={el} icon={icons?.[el.id]} text={placedText?.[el.id]} cfg={wc(el.id)} />
                  </Sel>
                ))}
              </RowDrop>
            </Sel>

            {after('quick')}

            {/* ── Work row ── */}
            {/* ── Work row ── one section, three cards, full width. */}
            <Sel id="work" className="mt-5 px-6" style={{ order: slot("work") }}>
              <RowDrop rowId="work" className="flex flex-wrap" style={{ gap: secGap("work"), ...secBox("work") }}>
              {card('requests', (
                <CardShell nodeId="requests" titleNodeId="requests-title" title={String(wc('requests').title ?? content.requests.title)} count={visibleRequests.length} cfg={wc('requests')}>
                  <Sel id="requests-list">
                    <ListBody nodeId="requests">
                      {visibleRequests.map((r) => {
                        const c = wc('requests');
                        const tone = REQUEST_STATUS_TONE[r.status] ?? { fg: '#64748B', bg: '#F1F5F9' };
                        /* ⚠️ Statuses is a DISPLAY toggle, not a row filter: unticking one hides
                           that badge from the rows carrying it, and the request stays listed.
                           Filtering rows out would put "Rows to show" and the status list in a
                           fight over how many rows appear. */
                        const statusOn = c.showStatus !== false
                          && ((c.statuses as string[]) ?? content.requests.statuses).includes(r.status);
                        const neutral = c.statusTone === 'neutral';
                        const below = c.idPlacement === 'below';
                        const stacked = c.rowLayout === 'stacked';
                        return (
                          <Row key={r.id} nodeId="requests">
                            <div className={stacked ? '' : 'flex items-center gap-2.5'}>
                              {c.showId !== false && !below && <IdPill>{r.id}</IdPill>}
                              <span style={roleStyle(styles, 'requests', 'body')} className={`min-w-0 ${stacked ? 'block' : 'flex-1 truncate'} text-[13px] text-[#364658]`}>{r.subject}</span>
                              {statusOn && (
                                <span
                                  className={`${stacked ? 'mt-1 inline-block' : 'flex-shrink-0'} whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-medium`}
                                  style={neutral ? { color: '#64748B', background: '#F1F5F9' } : { color: tone.fg, background: tone.bg }}
                                >{r.status}</span>
                              )}
                            </div>
                            {(c.showId !== false && below) && <div className="mt-1"><IdPill>{r.id}</IdPill></div>}
                            {c.showDate !== false && <div style={roleStyle(styles, 'requests', 'meta')} className="mt-1 text-[12px] text-[#7B8FA5]">{r.at}</div>}
                          </Row>
                        );
                      })}
                    </ListBody>
                  </Sel>
                </CardShell>
              ), secCols("work", content.cols.work), secGap("work"))}

              {card('approvals', (
                <CardShell nodeId="approvals" titleNodeId="approvals-title" title={String(wc('approvals').title ?? content.approvals.title)} count={visibleApprovals.length} cfg={wc('approvals')}>
                  <ListBody nodeId="approvals">
                    {visibleApprovals.map((a) => (
                      <Row key={a.id} nodeId="approvals">
                        <div className="flex flex-wrap items-center gap-2">
                          {wc('approvals').showId !== false && <IdPill>{a.id}: {a.subject}</IdPill>}
                          <span className="min-w-0 text-[12px] text-[#64748B]">{a.reason}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            {wc('approvals').showDate !== false && <div style={roleStyle(styles, 'approvals', 'meta')} className="text-[12px] text-[#7B8FA5]">{a.at}</div>}
                            {wc('approvals').showRequester !== false && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: a.color }}>{a.initials}</span>
                                <span style={roleStyle(styles, 'approvals', 'body')} className="truncate text-[13px] text-[#364658]">{a.by}</span>
                              </div>
                            )}
                          </div>
                          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#ECFDF3] text-[#22A06B]"><Check size={15} /></span>
                          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#FEF3F2] text-[#DC2626]"><X size={15} /></span>
                          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#FEF3C7] text-[#B45309]"><RotateCcw size={14} /></span>
                        </div>
                      </Row>
                    ))}
                  </ListBody>
                </CardShell>
              ), secCols("work", content.cols.work), secGap("work"))}

              {card('knowledge', (
                <CardShell nodeId="knowledge" titleNodeId="knowledge-title" title={String(wc('knowledge').title ?? content.knowledge.title)} count={visibleArticles.length} cfg={wc('knowledge')}>
                  <ListBody nodeId="knowledge">
                    {visibleArticles.map((k) => {
                      const c = wc('knowledge');
                      const below = c.idPlacement === 'below';
                      return (
                        <Row key={k.id} nodeId="knowledge">
                          <div className="flex gap-3">
                            <span className="flex size-9 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5]"><IconKnowledge size={18} /></span>
                            <span className="min-w-0 flex-1">
                              <span className={c.rowLayout === 'single' ? 'flex items-center gap-2' : 'block'}>
                                {c.showId !== false && !below && <IdPill>{k.id}</IdPill>}
                                <span style={roleStyle(styles, 'knowledge', 'body')} className="min-w-0 truncate text-[13px] text-[#364658]">{k.title}</span>
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-2">
                                {c.showId !== false && below && <IdPill>{k.id}</IdPill>}
                                {c.showDate !== false && <span style={roleStyle(styles, 'knowledge', 'meta')} className="text-[12px] text-[#7B8FA5]">{k.at}</span>}
                                {c.showCategory !== false && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#64748B]">{k.tag}</span>}
                              </span>
                            </span>
                          </div>
                        </Row>
                      );
                    })}
                  </ListBody>
                </CardShell>
              ), secCols("work", content.cols.work), secGap("work"))}

                {(rowExtras?.['work'] ?? []).map((el) => (
                  <Sel key={el.id} id={el.id} style={share(secCols("work", content.cols.work), secGap("work"))}>
                    <PortalPlacedElement item={el} icon={icons?.[el.id]} text={placedText?.[el.id]} cfg={wc(el.id)} />
                  </Sel>
                ))}
              </RowDrop>
            </Sel>

            {after('work')}

            {/* ── Records row ── Assets and CIs, in a parent section like every other card. */}
            <Sel id="records" className="mt-4 px-6" style={{ order: slot("records") }}>
              <RowDrop rowId="records" className="flex flex-wrap" style={{ gap: secGap("records"), ...secBox("records") }}>
                {card('assets', <RecordsCard nodeId="assets" titleFallback={content.assets.title} cfg={wc('assets')} rows={MY_ASSETS} />, secCols("records", content.cols.records), secGap("records"))}
                {/* ⚠️ My CIs stays EMPTY on purpose (§7.4): it is empty on most real instances, so
                    its empty state is the state most requesters will see. Inventing placeholder CIs
                    would make the widget look like something it usually is not. */}
                {card('cis', <EmptyCard nodeId="cis" title={String(wc('cis').title ?? content.cis.title)} cfg={wc('cis')} />, secCols("records", content.cols.records), secGap("records"))}

                {(rowExtras?.['records'] ?? []).map((el) => (
                  <Sel key={el.id} id={el.id} style={share(secCols("records", content.cols.records), secGap("records"))}>
                    <PortalPlacedElement item={el} icon={icons?.[el.id]} text={placedText?.[el.id]} cfg={wc(el.id)} />
                  </Sel>
                ))}
              </RowDrop>
            </Sel>

            {after('records')}
          </div>
        </div>
      </div>

      <div className="pointer-events-none sticky bottom-4 z-10 flex justify-end pr-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#1E3A5F] text-white shadow-lg">
          <MessageSquare size={22} />
        </span>
      </div>
    </div>
  );
}

/* The requester's own kit. ⚠️ Two assets, not twenty — this is what one person has been issued, so
   a long scrolling list would misrepresent the widget. */
const MY_ASSETS = [
  { id: 'AST-3', name: 'Dell Latitude 5440', type: 'Laptop' },
  { id: 'AST-1', name: 'Dell UltraSharp U2723QE', type: 'Monitor' },
  { id: 'AST-7', name: 'Logitech MX Master 3S', type: 'Mouse' },
  { id: 'AST-12', name: 'Jabra Evolve2 65', type: 'Headset' },
  { id: 'AST-9', name: 'iPhone 14', type: 'Mobile' },
];

/** A records row: blue ID pill · name · the type, right-aligned and muted. */
function RecordsCard({ nodeId, titleFallback, cfg, rows }: {
  nodeId: string; titleFallback: string; cfg: Record<string, unknown>;
  rows: { id: string; name: string; type: string }[];
}) {
  const { styles } = useCanvas();
  const shown = rows.slice(0, Number(cfg.show ?? 5));
  if (!shown.length) return <EmptyCard nodeId={nodeId} title={String(cfg.title ?? titleFallback)} cfg={cfg} />;
  return (
    <CardShell nodeId={nodeId} title={String(cfg.title ?? titleFallback)} count={shown.length} cfg={cfg}>
      <ListBody nodeId={nodeId}>
        {shown.map((r) => (
          <Row key={r.id} nodeId={nodeId}>
            <div className="flex items-center gap-2.5">
              {cfg.showId !== false && (
                <span className="max-w-full flex-shrink truncate whitespace-nowrap rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">{r.id}</span>
              )}
              <span style={roleStyle(styles, nodeId, 'body')} className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{r.name}</span>
              {cfg.showType !== false && (
                <span style={roleStyle(styles, nodeId, 'meta')} className="flex-shrink-0 text-[12px] text-[#7B8FA5]">{r.type}</span>
              )}
            </div>
          </Row>
        ))}
      </ListBody>
    </CardShell>
  );
}

/* P8's empty state, for real. My CIs is commonly empty on live instances, so this IS the state most
   requesters see — the message is editable and "hide the whole widget" is a legitimate answer. */
function EmptyCard({ nodeId, title, cfg = EMPTY_CFG }: { nodeId?: string; title: string; cfg?: Record<string, unknown> }) {
  const { styles, enabled } = useCanvas();
  const mode = nodeId ? chosen(styles, nodeId, 'emptyMode') : undefined;
  const msg = (nodeId ? chosen(styles, nodeId, 'emptyMsg') : undefined) ?? 'No Data Found';
  // Hidden means hidden on the published portal — on the canvas it stays visible but marked, or
  // the block you are composing would vanish from under you.
  if (mode === 'hide' && !enabled) return null;
  return (
    <CardShell nodeId={nodeId} title={title} count={0} cfg={cfg}>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-[#F0F2F5] py-10 text-[14px] text-[#7B8FA5]">
        <span className="flex items-center gap-2"><Info size={16} className="text-[#9CA3AF]" /> {String(msg)}</span>
        {mode === 'hide' && enabled && (
          <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#64748B]">Hidden when empty on the live portal</span>
        )}
      </div>
    </CardShell>
  );
}
