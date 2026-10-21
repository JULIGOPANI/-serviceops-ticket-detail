import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronDown, Search, X, House } from 'lucide-react';
import { ADMIN_NAV, sectionByTitle, isTreeSection } from './adminData';
import { adminIcon } from './AdminIcons';
import { DeskSwitcher } from './DeskSwitcher';
import { DESK_ADMIN, actionPath } from './deskAdmin';
import { toast } from 'sonner';

/* Admin left nav — grouped, searchable, and driven by the same ADMIN_SECTIONS the Overview
 * renders, so the two can never list different things.
 *
 * Three levels, each visually distinct so depth is readable without counting indents:
 *   Level 1  section     icon + chevron   — expanding is all it does; the right pane is unchanged
 *   Level 2  module      icon             — selecting one opens that module on the right
 *   Level 3  submodule   no icon, joined by a left rail that lights up under the hovered row
 *
 * A section only expands when it is listed in SIDEBAR_TREE; the rest stay single rows that scroll
 * the Overview, which is what keeps the hub one surface for the areas that have no screens yet. */

interface AdminSidebarProps {
  /** Section title currently in view, or 'Overview'. */
  active: string;
  /** Level-2 module inside `active`, when one is selected. */
  activeCard?: string | null;
  /** `card` is present when a level-2/3 module was chosen rather than the section itself. */
  onSelect: (sectionTitle: string, card?: string) => void;
  onBackToApp: () => void;
  /** ESM: the desk whose page is open, for the desk switcher. */
  currentDeskId?: number;
  onAllSettings?: () => void;
  onDesk?: (path: string | undefined) => void;
  /** ESM: the open desk path ('<id>', '<id>/details', …) — highlights the desk menu. */
  deskPath?: string;
}

export function AdminSidebar({ active, activeCard, onSelect, onBackToApp, currentDeskId, onAllSettings, onDesk, deskPath }: AdminSidebarProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();

  // Landing on a module from elsewhere (an Overview card, say) opens its branch, so the nav
  // always shows where you are.
  useEffect(() => {
    if (activeCard && isTreeSection(active)) setExpanded((p) => new Set(p).add(active));
  }, [active, activeCard]);

  // Searching matches a section by its own name OR by any card inside it, so typing "SLA" or
  // "barcode" finds the section that owns it rather than coming back empty.
  const matches = (title: string) => {
    if (!q) return true;
    if (title.toLowerCase().includes(q)) return true;
    const s = sectionByTitle(title);
    return !!s && s.cards.some((c) => c.title.toLowerCase().includes(q));
  };

  const groups = ADMIN_NAV
    .map((g) => ({ ...g, items: g.items.filter(matches) }))
    .filter((g) => g.items.length > 0);

  const overviewVisible = !q || 'overview'.includes(q);

  return (
    <aside className="flex h-full w-[268px] flex-shrink-0 flex-col border-r border-[#e5e7eb] bg-white">
      {/* Back to app */}
      <button
        onClick={onBackToApp}
        className="flex items-center gap-1.5 px-5 pt-4 text-left text-[13px] font-medium text-[#364658] transition-colors hover:text-[#3D8BD0]"
      >
        <ChevronLeft size={16} className="text-[#7B8FA5]" />
        Back to app
      </button>

      {/* ESM desk switcher: company-wide settings or one desk (F01) */}
      {onDesk && onAllSettings && <DeskSwitcher currentDeskId={currentDeskId} onAllSettings={onAllSettings} onDesk={onDesk} />}

      {/* Search */}
      <div className="px-4 pb-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings..."
            className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#364658]"
            ><X size={15} /></button>
          )}
        </div>
      </div>

      {currentDeskId !== undefined && onDesk ? (
        /* Inside a desk: the menu is THAT desk's settings, like a Freshservice workspace's own admin
           or a ManageEngine instance's Setup. Provisional groups (deskAdmin.ts) until F04. */
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <button
            onClick={() => onDesk(String(currentDeskId))}
            className={`mb-1 flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] transition-colors ${
              deskPath === String(currentDeskId) ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
            }`}
          >
            <House size={16} className={deskPath === String(currentDeskId) ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            Desk home
          </button>
          {DESK_ADMIN.map((g) => {
            const items = g.items.filter((it) => !q || `${g.title} ${it.title}`.toLowerCase().includes(q));
            if (!items.length) return null;
            const GroupIcon = adminIcon(g.icon);
            return (
              <div key={g.title} className="mt-4 first:mt-2">
                <div className="flex items-center gap-1.5 px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                  <GroupIcon size={12} />{g.title}
                </div>
                {items.map((it) => {
                  const path = it.action ? actionPath(currentDeskId, it.action) : undefined;
                  const on = !!path && deskPath === path;
                  return (
                    <button
                      key={it.title}
                      onClick={() => (path ? onDesk(path) : toast(`${it.title}`, { description: `Designed in ${it.feature}. Whether it is per desk is decided in F04.` }))}
                      className={`flex w-full items-center gap-2 rounded px-3 py-1.5 pl-[30px] text-left text-[13px] transition-colors ${
                        on ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      <span className="truncate">{it.title}</span>
                      {!it.action && <span className="ml-auto font-mono text-[10px] text-[#B0BCC9]">{it.feature}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      ) : (
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {overviewVisible && (
          <button
            onClick={() => onSelect('Overview')}
            className={`mb-1 flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] transition-colors ${
              active === 'Overview' ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
            }`}
          >
            <House size={16} className={active === 'Overview' ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            Overview
          </button>
        )}

        {groups.map((g) => (
          <div key={g.group} className="mt-4 first:mt-2">
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
              {g.group}
            </div>
            {g.items.map((title) => {
              const s = sectionByTitle(title);
              const Icon = adminIcon(s?.icon ?? 'Settings2');
              const tree = isTreeSection(title);
              // A search reveals its hits rather than making the user open branches by hand.
              const open = tree && (!!q || expanded.has(title));
              // A tree section is a container: it is highlighted only when nothing inside it is.
              const isActive = active === title && !(tree && activeCard);

              return (
                <div key={title}>
                  {/* ── Level 1 ── */}
                  <button
                    onClick={() => {
                      if (tree) setExpanded((p) => {
                        const n = new Set(p);
                        n.has(title) ? n.delete(title) : n.add(title);
                        return n;
                      });
                      else onSelect(title);
                    }}
                    aria-expanded={tree ? open : undefined}
                    className={`flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] transition-colors ${
                      isActive ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
                    }`}
                  >
                    <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
                    <span className="truncate">{title}</span>
                    {tree ? (
                      <ChevronDown
                        size={15}
                        className={`ml-auto flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? '' : '-rotate-90'}`}
                      />
                    ) : (
                      // Count is the honest signal of how much lives behind a row you can't open.
                      <span className={`ml-auto flex-shrink-0 text-[11px] ${isActive ? 'text-[#3D8BD0]/70' : 'text-[#9CA3AF]'}`}>
                        {s?.cards.length ?? 0}
                      </span>
                    )}
                  </button>

                  {/* ── Level 2 ── icons, and selecting one opens that module on the right. */}
                  {open && s && (
                    <div className="mt-0.5 space-y-0.5">
                      {s.cards
                        .filter((c) => !q || c.title.toLowerCase().includes(q) || title.toLowerCase().includes(q))
                        .map((c) => {
                          const CardIcon = adminIcon(c.icon);
                          const on = active === title && activeCard === c.title;
                          return (
                            <div key={c.title}>
                              <button
                                onClick={() => onSelect(title, c.title)}
                                className={`flex w-full items-center gap-2.5 rounded py-2 pl-9 pr-3 text-left text-[13px] transition-colors ${
                                  on ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
                                }`}
                              >
                                <CardIcon size={15} className={`flex-shrink-0 ${on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
                                <span className="truncate">{c.title}</span>
                              </button>

                              {/* ── Level 3 ── no icons. One rail runs down the group, and the
                                  segment beside the hovered row lights up, so the row reads as
                                  belonging to the branch above it. */}
                              {!!c.children?.length && (
                                <div className="ml-[26px] mt-0.5 space-y-0.5 border-l border-[#E5E7EB]">
                                  {c.children.map((sub) => {
                                    const subOn = active === title && activeCard === sub.title;
                                    return (
                                      <button
                                        key={sub.title}
                                        onClick={() => onSelect(title, sub.title)}
                                        className={`-ml-px flex w-full items-center rounded-r border-l-2 py-1.5 pl-6 pr-3 text-left text-[13px] transition-colors ${
                                          subOn
                                            ? 'border-[#3D8BD0] bg-[#EBF5FF] font-medium text-[#3D8BD0]'
                                            : 'border-transparent text-[#64748B] hover:border-[#3D8BD0] hover:bg-[#F5F7FA] hover:text-[#364658]'
                                        }`}
                                      >
                                        <span className="truncate">{sub.title}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {groups.length === 0 && !overviewVisible && (
          <div className="px-3 py-8 text-center text-[13px] text-[#9CA3AF]">
            No settings match “{query}”.
          </div>
        )}
      </nav>
      )}
    </aside>
  );
}
