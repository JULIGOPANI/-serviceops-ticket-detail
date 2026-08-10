import { useRef, useState } from 'react';
import { Header } from './Header';
import { AdminSidebar } from './AdminSidebar';
import { AdminOverview } from './AdminOverview';
import { ADMIN_SECTIONS, sectionByTitle } from './adminData';
import { AdminBomModule } from './AdminBomModule';
import type { BomAdminScreen } from './AdminBomModule';

/** Sections that have a real module behind them rather than only a card grid. Selecting one in
 *  the sidebar opens that module; everything else still scrolls the Overview. */
const MODULE_TITLES = ['BOM Management'];

/* Admin hub — the settings surface. Its own shell: the product's left icon rail is replaced by a
 * grouped settings nav, with "Back to app" as the way out.
 *
 * The sidebar and the Overview share one section list, and selecting in the sidebar scrolls the
 * Overview rather than swapping the pane — the whole point of a hub is that it is one surface. */

export function AdminPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  // Only the first section starts open, mirroring the live admin.
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set([ADMIN_SECTIONS[0].key]));
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** Title of the module currently open, or null for the Overview. */
  const [module, setModule] = useState<string | null>(null);
  const [bomScreen, setBomScreen] = useState<BomAdminScreen>('landing');

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const select = (title: string) => {
    setActive(title);
    if (MODULE_TITLES.includes(title)) {
      setModule(title);
      setBomScreen('landing');
      return;
    }
    setModule(null);
    if (title === 'Overview') {
      sectionRefs.current[ADMIN_SECTIONS[0].key]?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('[data-admin-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const s = sectionByTitle(title);
    if (!s) return;
    // Opening it first means the scroll lands on content, not on a collapsed strip.
    setOpenKeys((prev) => new Set(prev).add(s.key));
    requestAnimationFrame(() => {
      sectionRefs.current[s.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="flex h-screen flex-col bg-[#F7F9FC]">
      <Header selectedCount={0} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminSidebar active={active} onSelect={select} onBackToApp={() => onNavigate('request')} />
        <div data-admin-scroll className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {module === 'BOM Management' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC]">
              <AdminBomModule screen={bomScreen} onScreen={setBomScreen} />
            </div>
          ) : (
            <AdminOverview
              openKeys={openKeys}
              onToggle={toggle}
              query={query}
              onQuery={setQuery}
              registerSection={(key, el) => { sectionRefs.current[key] = el; }}
              onOpenCard={(sectionTitle, cardTitle) => {
                // A BOM card on the Overview jumps straight into that screen, rather than
                // making the admin land on the module and click again.
                if (sectionTitle !== 'BOM Management') return false;
                setActive('BOM Management');
                setModule('BOM Management');
                setBomScreen(
                  cardTitle === 'BOM Licensing' ? 'licensing'
                    : cardTitle === 'BOM Scheduler' ? 'scheduler'
                      : cardTitle === 'BOM Retention' ? 'retention' : 'landing',
                );
                return true;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
