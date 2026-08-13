import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bell, Check, Info, Keyboard, House, MessageSquare, MessagesSquare, Plus, PanelLeft,
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
import { PortalPlacedElement } from './PortalPlacedElement';
import { DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER, colId } from './portalPageModel';
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
}

/* An added section: rows of equal-height columns, each empty until something is dropped in. The
   grey `+` is the resting affordance; selecting or hovering the column reveals the blue ones that
   split it left/right. */
/* A column: empty and dashed until something is dropped in, then just the element on the section's
   own surface. No wrapper card — the element brings whatever chrome it actually needs. */
function ColumnBody({ id, item, live, icons, placedText }: { id: string; item?: PlacedElement; live: boolean; icons?: Record<string, IconChoice | undefined>; placedText?: Record<string, { title?: string; desc?: string }> }) {
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
      {item ? <PortalPlacedElement item={item} icon={icons?.[item.id]} text={placedText?.[item.id]} /> : (
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

function AddedSection({ section, icons, placedText }: { section: CustomSection; icons?: Record<string, IconChoice | undefined>; placedText?: Record<string, { title?: string; desc?: string }> }) {
  const { styles, selectedId } = useCanvas();
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
                /* Blue adders belong to the SELECTED column only. Lighting up every column at once
                   put two `+` buttons either side of each shared edge and made the row noisy. */
                const live = selectedId === id;
                const item = section.items[id];
                return (
                  <Sel key={c} id={id} className="min-h-[120px] flex-1" style={{ flex: weight }}>
                    <ColumnBody id={id} item={item} live={live} icons={icons} placedText={placedText} />
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
  { key: 'requests', label: 'Requests', Icon: () => <IconRequest size={19} /> },
  { key: 'catalog', label: 'Service Catalog', Icon: () => <ShoppingCart size={19} strokeWidth={1.7} /> },
  { key: 'changes', label: 'Changes', Icon: () => <IconChange size={19} /> },
  { key: 'assets', label: 'My Assets', Icon: () => <IconAssets size={19} /> },
  { key: 'cis', label: 'My CIs', Icon: () => <IconCMDB size={19} /> },
  { key: 'knowledge', label: 'Knowledge', Icon: () => <IconKnowledge size={19} /> },
  { key: 'approvals', label: 'My Approvals', Icon: () => <IconMyApproval size={19} /> },
  { key: 'team', label: 'My Team', Icon: () => <IconMyTeam size={19} /> },
  { key: 'tasks', label: 'Tasks', Icon: () => <IconTask size={19} /> },
];

function PortalRail() {
  return (
    <Sel id="rail" className="flex w-[60px] flex-shrink-0 flex-col items-center border-r border-[#e5e7eb] bg-white py-3">
      <div className="flex flex-1 flex-col items-center gap-1">
        {RAIL_ITEMS.map(({ key, label, Icon }) => (
          <span key={key} title={label} className="flex size-9 items-center justify-center rounded text-[#6b7280]">
            <Icon />
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

function PortalHeader({ content }: { content: PortalPageContent }) {
  const { styles } = useCanvas();
  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#6b7280]';
  return (
    <Sel id="header" toolbarBelow className="flex h-[56px] flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded text-[#6b7280]"><PanelLeft size={18} /></span>
        <MotadataLogo />
      </div>

      <Sel id="header-nav" className="flex items-center gap-4 px-2 py-1">
        {content.nav.items.map((item) => (
          <span key={item} style={styleOf(styles, 'header-nav')} className="whitespace-nowrap text-[13px] font-medium text-[#364658]">{item}</span>
        ))}
      </Sel>

      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-8 items-center gap-1.5 rounded border border-[#3D8BD0] px-2.5 text-[13px] font-medium text-[#364658]">
          <AiSparkle size={14} /> Ask AI
        </span>
        <span className="flex size-8 items-center justify-center rounded bg-[#1E293B] text-white"><Plus size={17} /></span>
        <span className={iconBtn}><Type size={17} /></span>
        <span className={iconBtn}><MessagesSquare size={17} /></span>
        <span className={iconBtn}><Bell size={17} /></span>
        <span className={iconBtn}><Keyboard size={17} /></span>
        <span className={iconBtn}><House size={17} /></span>
        <span className={iconBtn}><Info size={17} /></span>
        <span className="flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-[11px] font-semibold text-white">YG</span>
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

function CardShell({ titleNodeId, title, count, children }: {
  titleNodeId?: string; title: string; count: number; children: ReactNode;
}) {
  const { styles } = useCanvas();
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-4 pb-2.5 pt-3.5">
        {titleNodeId ? (
          <Sel id={titleNodeId} className="px-0.5">
            <span style={styleOf(styles, titleNodeId)} className="text-[15px] font-semibold text-[#364658]">{title}</span>
          </Sel>
        ) : (
          <span className="text-[15px] font-semibold text-[#364658]">{title}</span>
        )}
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
          {count}
        </span>
        <span className="ml-auto text-[#7B8FA5]"><ChevronsRight size={16} /></span>
      </div>
      <div className="min-h-0 flex-1 px-4 pb-3">{children}</div>
    </div>
  );
}

/* ── The page ────────────────────────────────────────────────────────────── */

export function SupportPortalPreview({ accent = '#0F172A', content = DEFAULT_CONTENT, sections = [], icons, placedText, blockOrder = DEFAULT_BLOCK_ORDER, rowOrder = DEFAULT_ROW_ORDER, removed = [] }: SupportPortalPreviewProps) {
  const { styles, enabled, select } = useCanvas();
  const st = (id: string) => styleOf(styles, id);

  /* A row member's DEFAULT share, before anyone drags it. Rows are flex rather than grid so a
     resize can hand shares around between siblings; grid tracks would ignore them. */
  const share = (cols: number): React.CSSProperties => ({ flex: `1 1 calc((100% - ${(cols - 1) * 16}px) / ${cols})` });

  /* Statuses is a DISPLAY toggle, not a row filter: unticking one hides that status badge from the
     rows that carry it, and the request itself stays listed. Filtering rows out instead would make
     "Show 5" and the status list fight over how many rows appear. */
  const visibleRequests = PORTAL_OPEN_REQUESTS.slice(0, content.requests.show);
  const visibleApprovals = PORTAL_APPROVALS.slice(0, content.approvals.show);
  const visibleArticles = PORTAL_ARTICLES.slice(0, content.knowledge.show);

  /* The seam under a block, plus any sections added there.
     ⚠️ It MUST carry its own `order`. The bands are sequenced with CSS order inside a flex column,
     and a child without one defaults to 0 — which silently collapsed every seam to the top of the
     page and made the lower ones disappear. Bands take even slots, seams the odd slot after them. */
  const slot = (id: string) => blockOrder.indexOf(id) * 2;
  const after = (id: string) => (
    <div className="px-6" style={{ order: slot(id) + 1 }}>
      <AddSectionSeam afterId={id} />
      {sections.filter((s) => s.afterId === id).map((s) => (
        <AddedSection key={s.section.id} section={s.section} icons={icons} placedText={placedText} />
      ))}
    </div>
  );

  /* Order and removal are handled HERE, once, for every card on the page.
     CSS `order` reorders flex siblings without moving the JSX, which keeps a move action to one
     number instead of a structural rewrite of the page body. */
  const card = (id: string, body: ReactNode, cols?: number) => {
    if (removed.includes(id)) return null;
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row && !rowOrder[row].includes(id)) return null;
    const order = row ? rowOrder[row].indexOf(id) : 0;
    return cardInner(id, body, cols, order);
  };

  const cardInner = (id: string, body: ReactNode, cols: number | undefined, order: number) => (
    /* ⚠️ No overflow-hidden here. The chip sits at -top-4 and the toolbar at -top-11, both OUTSIDE
       the wrapper — clipping it silently removes the card's hover outline and quick actions. */
    <Sel id={id} className="rounded-lg border border-[#E5E7EB] bg-white" style={{ ...(cols ? share(cols) : {}), order }}>
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
      /* Clicking bare canvas clears the selection — an editor with no way out of a selection
         traps you in whatever you touched last. */
      onClick={() => enabled && select(null)}
    >
      <PortalHeader content={content} />

      <div className="flex min-h-0 flex-1">
        <PortalRail />

        <div className="min-w-0 flex-1 bg-[#F4F6FA]">
          {/* ── Hero ── */}
          <Sel id="hero" toolbarBelow>
            <div className="relative overflow-hidden pb-[86px]" style={{ background: `linear-gradient(135deg, ${accent} 0%, #050B18 100%)`, ...st('hero') }}>
              <HeroArtwork />
              <div className="relative px-6 pb-6 pt-14 text-center">
                <Sel id="hero-title" className="mx-auto inline-block px-1">
                  <h2 style={{ color: '#4C7BA8', ...st('hero-title') }} className="text-[30px] font-semibold leading-tight">
                    {content.hero.title}
                  </h2>
                </Sel>
                <Sel id="hero-subtitle" className="mx-auto mt-2 inline-block px-1">
                  <p style={st('hero-subtitle')} className="text-[15px] text-white/85">{content.hero.subtitle}</p>
                </Sel>
                {content.hero.showSearch && (
                  <Sel id="hero-search" className="mx-auto mt-5 w-full max-w-[580px]">
                    <div style={st('hero-search')} className="flex h-11 items-center gap-2 rounded bg-white px-4">
                      <span className="flex-1 text-left text-[14px] text-[#9CA3AF]">{content.hero.placeholder}</span>
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
            {/* ── Quick actions ── */}
            <Sel id="quick" className={`relative z-10 px-6 ${blockOrder.indexOf("quick") === 0 ? "-mt-[62px]" : "mt-5"}`} style={{ order: slot("quick") }}>
              <div className="flex flex-wrap gap-4">
                {quickCards.map((a) => (
                  <Sel key={a.id} id={a.id} className="rounded-lg" style={share(content.cols.quick)}>
                    <div
                      style={st(a.id)}
                      className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.06)]"
                    >
                      <span className="flex size-11 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#475467] [&>span>svg]:size-[22px]">
                        {/* A picked icon wins; otherwise the card keeps the one it shipped with. */}
                        {iconNode(icons?.[a.id], 22)
                          ?? (a.id === 'quick-incident' ? <IconRequest size={22} />
                            : a.id === 'quick-service' ? <ShoppingCart size={21} strokeWidth={1.7} />
                            : <IconKnowledge size={22} />)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[16px] font-semibold text-[#364658]">{a.title}</span>
                        <span className="block truncate text-[13px] text-[#7B8FA5]">{a.desc}</span>
                      </span>
                    </div>
                  </Sel>
                ))}
              </div>
            </Sel>

            {/* ── Work row ── */}
            {/* ── Work row ── one section, three cards, full width. */}
            <Sel id="work" className="mt-5 px-6" style={{ order: slot("work") }}>
              <div className="flex flex-wrap gap-4">
              {card('requests', (
                <CardShell titleNodeId="requests-title" title={content.requests.title} count={visibleRequests.length}>
                  <Sel id="requests-list">
                    <div className="divide-y divide-[#F0F2F5] border-t border-[#F0F2F5]">
                      {visibleRequests.map((r) => {
                        const tone = REQUEST_STATUS_TONE[r.status] ?? { fg: '#64748B', bg: '#F1F5F9' };
                        const showStatus = content.requests.statuses.includes(r.status);
                        return (
                          <div key={r.id} className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex-shrink-0 whitespace-nowrap rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#475467]">{r.id}</span>
                              <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{r.subject}</span>
                              {showStatus && (
                                <span className="flex-shrink-0 whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ color: tone.fg, background: tone.bg }}>
                                  {r.status}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[12px] text-[#7B8FA5]">{r.at}</div>
                          </div>
                        );
                      })}
                    </div>
                  </Sel>
                </CardShell>
              ), content.cols.work)}

              {card('approvals', (
                <CardShell titleNodeId="approvals-title" title={content.approvals.title} count={visibleApprovals.length}>
                  <div className="divide-y divide-[#F0F2F5] border-t border-[#F0F2F5]">
                    {visibleApprovals.map((a) => (
                      <div key={a.id} className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#475467]">{a.id}: {a.subject}</span>
                          <span className="text-[12px] text-[#64748B]">{a.reason}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] text-[#7B8FA5]">{a.at}</div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: a.color }}>{a.initials}</span>
                              <span className="text-[13px] text-[#364658]">{a.by}</span>
                            </div>
                          </div>
                          <span className="flex size-7 items-center justify-center rounded bg-[#ECFDF3] text-[#22A06B]"><Check size={15} /></span>
                          <span className="flex size-7 items-center justify-center rounded bg-[#FEF3F2] text-[#DC2626]"><X size={15} /></span>
                          <span className="flex size-7 items-center justify-center rounded bg-[#FEF3C7] text-[#B45309]"><RotateCcw size={14} /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardShell>
              ), content.cols.work)}

              {card('knowledge', (
                <CardShell titleNodeId="knowledge-title" title={content.knowledge.title} count={visibleArticles.length}>
                  <div className="divide-y divide-[#F0F2F5] border-t border-[#F0F2F5]">
                    {visibleArticles.map((k) => (
                      <div key={k.id} className="flex gap-3 py-3">
                        <span className="flex size-9 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5]"><IconKnowledge size={18} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="flex-shrink-0 whitespace-nowrap rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#475467]">{k.id}</span>
                            <span className="min-w-0 truncate text-[13px] text-[#364658]">{k.title}</span>
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[12px] text-[#7B8FA5]">{k.at}</span>
                            <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#64748B]">{k.tag}</span>
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardShell>
              ), content.cols.work)}
              </div>
            </Sel>

            {after('work')}

            {/* ── Records row ── Assets and CIs, in a parent section like every other card. */}
            <Sel id="records" className="mt-4 px-6" style={{ order: slot("records") }}>
              <div className="flex flex-wrap gap-4">
                {card('assets', <EmptyCard title={content.assets.title} />, content.cols.records)}
                {card('cis', <EmptyCard title={content.cis.title} />, content.cols.records)}
              </div>
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

function EmptyCard({ title }: { title: string }) {
  return (
    <CardShell title={title} count={0}>
      <div className="flex items-center justify-center gap-2 border-t border-[#F0F2F5] py-10 text-[14px] text-[#7B8FA5]">
        <Info size={16} className="text-[#9CA3AF]" /> No Data Found
      </div>
    </CardShell>
  );
}
