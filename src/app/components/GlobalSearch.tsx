import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Search, X, CornerDownLeft, ArrowUp, ArrowDown, Sparkles, Clock, Compass,
  AlertTriangle, RotateCw, WifiOff, ChevronRight, Trash2, Info, Plus, BookOpen, FlaskConical,
  AppWindow, Boxes, Recycle, KeyRound, FileText, ShoppingCart, Monitor, Settings2, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDrawerStack } from './DrawerStack';
import {
  IconRequest, IconProblem, IconChange, IconRelease, IconAssets, IconCMDB, IconPatch,
  IconVulnerability, IconKnowledge, IconProject, IconReport, IconTask, IconBom, IconDashboard,
} from './SidebarIcons';
import {
  runSearch, runLocalSearch, recentRecords, recentQueries, pushRecentRecord, pushRecentQuery,
  clearSearchHistory, frequentRecords, defaultDestinations, operatorSuggestions,
  getSearchRole, setSearchRole, subscribeSearchRole, GROUP_PAGE,
  OPERATOR_HELP, EXAMPLE_QUERIES,
} from './globalSearchData';
import type { SearchHit, SearchResult, SearchRole, IconKey, SearchGroup } from './globalSearchData';

/* Global Search — "One input. Find anything. Go anywhere."
 *
 * Deterministic known-item retrieval and navigation, deliberately NOT a second Ask AI: search
 * answers "I know it exists, take me to it", and hands the query to Ask AI when it can't.
 *
 * Mounted once by App inside the drawer host, so it works on every page and can open any
 * module's real detail drawer as a tab. The header pill opens it by CustomEvent rather than a
 * prop, because the header is rendered separately by 19 list pages.
 */

// ── Demo scenarios ─────────────────────────────────────────────────────────
// This prototype has no backend, so a failed group or an unreachable service can never happen on
// its own. These force the states the spec asks for; everything else below is the real behaviour.

export type DemoScenario = 'normal' | 'first-time' | 'slow' | 'group-failure' | 'total-failure' | 'no-access-results';

const SCENARIOS: { id: DemoScenario; label: string; desc: string }[] = [
  { id: 'normal', label: 'Normal', desc: 'Real search over the prototype data' },
  { id: 'first-time', label: 'First-time user', desc: 'No recents or history yet' },
  { id: 'slow', label: 'Slow / progressive', desc: 'Groups arrive one at a time' },
  { id: 'group-failure', label: 'Assets group fails', desc: 'One group errors, the rest hold' },
  { id: 'total-failure', label: 'Search unavailable', desc: 'Service down, panel still navigates' },
  { id: 'no-access-results', label: 'Matches exist, no access', desc: 'Privacy-safe empty state' },
];

const ROLES: { id: SearchRole; label: string; desc: string }[] = [
  { id: 'technician', label: 'Technician', desc: 'Rohan Mehta — full authorized estate' },
  { id: 'requester', label: 'Requester', desc: 'Own requests, knowledge, a few destinations' },
  { id: 'none', label: 'No search permission', desc: 'Affordance hidden from the top bar' },
];

// ── Icons ──────────────────────────────────────────────────────────────────
// The product's own module glyphs, so a search result is visually the same object as its
// sidebar entry — recognition, not recall.

const ICONS: Record<IconKey, (p: { size?: number }) => JSX.Element> = {
  request: IconRequest, problem: IconProblem, change: IconChange, release: IconRelease,
  assets: IconAssets, cmdb: IconCMDB, patch: IconPatch, vulnerability: IconVulnerability,
  knowledge: IconKnowledge, project: IconProject, report: IconReport, task: IconTask,
  bom: IconBom, dashboard: IconDashboard,
  software: ({ size = 16 }) => <AppWindow size={size} />,
  nonit: ({ size = 16 }) => <Boxes size={size} />,
  consumable: ({ size = 16 }) => <Recycle size={size} />,
  license: ({ size = 16 }) => <KeyRound size={size} />,
  contract: ({ size = 16 }) => <FileText size={size} />,
  purchase: ({ size = 16 }) => <ShoppingCart size={size} />,
  endpoint: ({ size = 16 }) => <Monitor size={size} />,
  admin: ({ size = 16 }) => <Settings2 size={size} />,
  user: ({ size = 16 }) => <User size={size} />,
  destination: ({ size = 16 }) => <Compass size={size} />,
};

function HitIcon({ icon, size = 16 }: { icon: IconKey; size?: number }) {
  const C = ICONS[icon] ?? ICONS.destination;
  return <C size={size} />;
}

/** A key cap. Used in the pill, the footer legend and the shortcut hints. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1 font-sans text-[10px] font-medium text-[#7B8FA5]">
      {children}
    </kbd>
  );
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

// ══ Header affordance ══════════════════════════════════════════════════════

/** The dormant state: discoverable, not dominant. Hidden entirely for a role with nothing to
 *  search — never open a search box that can only fail. */
export function GlobalSearchButton() {
  const role = useSyncExternalStore(subscribeSearchRole, getSearchRole, getSearchRole);
  if (role === 'none') return null;
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
      aria-keyshortcuts="Control+K /"
      className="group mr-1 flex h-8 w-[260px] items-center gap-2 rounded border border-[#DFE5ED] bg-white px-2.5 text-left transition-colors hover:border-[#3D8BD0] hover:bg-[#F8FAFC]"
    >
      <Search size={15} className="flex-shrink-0 text-[#9CA3AF] transition-colors group-hover:text-[#3D8BD0]" />
      <span className="flex-1 truncate text-[13px] text-[#9CA3AF]">Search ServiceOps</span>
      <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
    </button>
  );
}

// ══ Rows ═══════════════════════════════════════════════════════════════════

interface RowProps {
  hit: SearchHit;
  active: boolean;
  onHover: () => void;
  onOpen: (newTab: boolean) => void;
  /** Search terms to mark in the title. */
  terms: string[];
}

/** Marks matched terms so the eye lands on WHY a row matched. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const safe = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
  if (!safe.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${safe.join('|')})`, 'ig'));
  return (
    <>
      {parts.map((p, i) =>
        safe.some((s) => new RegExp(`^${s}$`, 'i').test(p))
          ? <mark key={i} className="rounded-[2px] bg-[#FEF3C7] px-0 text-inherit">{p}</mark>
          : <span key={i}>{p}</span>,
      )}
    </>
  );
}

function ResultRow({ hit, active, onHover, onOpen, terms }: RowProps) {
  return (
    <button
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onClick={(e) => onOpen(e.metaKey || e.ctrlKey)}
      className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left transition-colors ${
        active ? 'bg-[#EBF5FF]' : 'hover:bg-[#F8FAFC]'
      }`}
    >
      <span className={`flex size-8 flex-shrink-0 items-center justify-center rounded ${
        active ? 'bg-white text-[#3D8BD0]' : 'bg-[#F1F5F9] text-[#7B8FA5]'
      }`}>
        <HitIcon icon={hit.icon} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          {hit.id && (
            <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-px font-mono text-[11px] text-[#3D8BD0]">{hit.id}</span>
          )}
          <span className="truncate text-[13px] font-medium text-[#364658]">
            <Highlight text={hit.title} terms={terms} />
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#7B8FA5]">
          {/* Under a "Destinations" header the type would just repeat the header. */}
          {hit.group !== 'Destinations' && <span className="flex-shrink-0">{hit.type}</span>}
          {hit.fields.filter((f) => f.value && f.value !== '—').slice(0, 3).map((f, i) => (
            <span key={f.label || i} className="flex min-w-0 items-center gap-1.5">
              {(i > 0 || hit.group !== 'Destinations') && <span className="text-[#CBD5E1]">·</span>}
              {f.dot && <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: f.dot }} />}
              <span className="truncate">{f.value}</span>
            </span>
          ))}
        </span>
      </span>

      {active && (
        <span className="flex flex-shrink-0 items-center gap-1 text-[11px] text-[#7B8FA5]">
          <Kbd><CornerDownLeft size={10} /></Kbd>
        </span>
      )}
    </button>
  );
}

/** The promoted result. Bigger target, its own affordance, Enter opens it — the single fastest
 *  interaction in the product. */
function DominantRow({ hit, reason, active, onHover, onOpen }: Omit<RowProps, 'terms'> & { reason: 'id' | 'relevance' }) {
  return (
    <button
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onClick={(e) => onOpen(e.metaKey || e.ctrlKey)}
      className={`mb-1 flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left transition-colors ${
        active ? 'border-[#3D8BD0] bg-[#EBF5FF]' : 'border-[#DFE5ED] bg-white hover:bg-[#F8FAFC]'
      }`}
    >
      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-white">
        <HitIcon icon={hit.icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#364658]">
            {reason === 'id' ? `Go to ${hit.id}` : hit.title}
          </span>
          <span className="rounded-sm bg-[#EBF5FF] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[#3D8BD0]">
            {reason === 'id' ? 'Exact match' : 'Top result'}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-[#64748B]">
          {reason === 'id' ? hit.title : hit.id ? `${hit.type} · ${hit.id}` : hit.type}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[#7B8FA5]">
          <span>{hit.type}</span>
          {hit.fields.filter((f) => f.value && f.value !== '—').slice(0, 3).map((f) => (
            <span key={f.label} className="flex items-center gap-1.5">
              <span className="text-[#CBD5E1]">·</span>
              {f.dot && <span className="size-1.5 rounded-full" style={{ backgroundColor: f.dot }} />}
              <span>{f.value}</span>
            </span>
          ))}
        </span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] text-[#7B8FA5]">
        Enter <Kbd><CornerDownLeft size={10} /></Kbd>
      </span>
    </button>
  );
}

function GroupHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 pb-1 pt-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{label}</span>
      {right}
    </div>
  );
}

/** Skeleton rows, per group, so the panel keeps its shape while results land. */
function SkeletonGroup({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div>
      <GroupHeader label={label} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="size-8 flex-shrink-0 animate-pulse rounded bg-[#F1F5F9]" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-[52%] animate-pulse rounded bg-[#F1F5F9]" />
            <div className="mt-1.5 h-2.5 w-[34%] animate-pulse rounded bg-[#F5F7FA]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ══ Overlay ════════════════════════════════════════════════════════════════

interface GlobalSearchProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const THRESHOLD = 3;
const DEBOUNCE = 200;

export function GlobalSearch({ activePage, onNavigate }: GlobalSearchProps) {
  const { open: openInStack } = useDrawerStack();
  const role = useSyncExternalStore(subscribeSearchRole, getSearchRole, getSearchRole);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  /** Groups that have arrived, for the progressive/slow path. null = all of them. */
  const [arrived, setArrived] = useState<SearchGroup[] | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [scenario, setScenario] = useState<DemoScenario>('normal');
  const [showDemo, setShowDemo] = useState(false);
  const [failedGroups, setFailedGroups] = useState<SearchGroup[]>([]);
  const [scopeLocked, setScopeLocked] = useState(false);
  const [restored, setRestored] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** The element search was invoked from, so focus goes back where it came from. */
  const invokerRef = useRef<HTMLElement | null>(null);
  /** Guards against a slow response for an old query overwriting a newer one. */
  const requestRef = useRef(0);
  /** The last query + results, so returning to search doesn't mean starting again. */
  const lastSessionRef = useRef<{ query: string; result: SearchResult | null } | null>(null);

  // ── Open / close ─────────────────────────────────────────────────────────

  const openSearch = useCallback(() => {
    invokerRef.current = (document.activeElement as HTMLElement) ?? null;
    setOpen(true);
    // Returning to search restores the previous query and results rather than making the user
    // type it again after opening the wrong record.
    const last = lastSessionRef.current;
    if (last?.query) {
      setQuery(last.query);
      setResult(last.result);
      setRestored(true);
    }
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setShowDemo(false);
    setRestored(false);
    // Hand focus back to whatever opened search.
    requestAnimationFrame(() => invokerRef.current?.focus?.());
  }, []);

  useEffect(() => {
    const onOpen = () => openSearch();
    window.addEventListener('open-global-search', onOpen);
    return () => window.removeEventListener('open-global-search', onOpen);
  }, [openSearch]);

  // `/` and Ctrl/Cmd+K. Both stay clear of the existing chords: the drawer shortcuts are all
  // Alt-based, and `/` is ignored while any field has focus so typing a path never opens search.
  useEffect(() => {
    if (role === 'none') return;
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openSearch(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, openSearch, role]);

  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); }, [open]);

  // ── Local data ───────────────────────────────────────────────────────────
  // `first-time` forces the empty-history variant without wiping the user's real recents.

  const forcedFirstTime = scenario === 'first-time';
  const recents = useMemo(() => (open && !forcedFirstTime ? recentRecords(role) : []), [open, role, forcedFirstTime, query]);
  const queries = useMemo(() => (open && !forcedFirstTime ? recentQueries() : []), [open, role, forcedFirstTime, query]);
  const frequents = useMemo(() => (open && !forcedFirstTime ? frequentRecords(role) : []), [open, role, forcedFirstTime, query]);
  const destinations = useMemo(() => (open ? defaultDestinations(role) : []), [open, role]);
  // A genuinely empty history gets the same treatment as the forced state — showing an empty
  // "Recent records" heading would be worse than showing someone how to search.
  const firstTime = forcedFirstTime || (!recents.length && !queries.length);

  const trimmed = query.trim();
  const belowThreshold = trimmed.length > 0 && trimmed.length < THRESHOLD && !/[:@#]/.test(trimmed);
  const localHits = useMemo(
    () => (belowThreshold ? runLocalSearch(trimmed, { role }) : []),
    [belowThreshold, trimmed, role],
  );
  const suggestions = useMemo(() => (open && trimmed ? operatorSuggestions(query) : []), [open, query, trimmed]);

  // ── Search ───────────────────────────────────────────────────────────────
  // Debounced, race-guarded, and never blanks the panel: previous results stay on screen dimmed
  // while the next set loads.

  useEffect(() => {
    if (!open) return;
    if (belowThreshold || !trimmed) { setResult(null); setLoading(false); setArrived(null); setFailedGroups([]); return; }
    if (scenario === 'total-failure') { setResult(null); setLoading(false); return; }

    const id = ++requestRef.current;
    setLoading(true);

    const slow = scenario === 'slow';
    const t = setTimeout(() => {
      const res = runSearch(query, { role });
      // A response for a query the user has already moved on from must never render.
      if (id !== requestRef.current) return;

      // The scope chip narrows what was found; it is opt-in, so an unscoped search is unaffected.
      const scopedGroup = scopeLocked ? PAGE_GROUP[activePage] : undefined;
      const scoped = scopedGroup
        ? { ...res, groups: res.groups.filter((g) => g.group === scopedGroup), dominant: res.dominant?.group === scopedGroup ? res.dominant : null }
        : res;

      if (scenario === 'group-failure') {
        setFailedGroups(['Assets']);
        setResult({ ...scoped, groups: scoped.groups.filter((g) => g.group !== 'Assets') });
      } else {
        setFailedGroups([]);
        setResult(scoped);
      }

      if (slow) {
        // Progressive rendering: each group appears as it becomes available rather than the
        // panel waiting on the slowest module.
        setArrived([]);
        const order = res.groups.map((g) => g.group);
        order.forEach((g, i) => setTimeout(() => {
          if (id !== requestRef.current) return;
          setArrived((prev) => [...(prev ?? []), g]);
          if (i === order.length - 1) setLoading(false);
        }, 350 * (i + 1)));
        if (!order.length) setLoading(false);
      } else {
        setArrived(null);
        setLoading(false);
      }
      setActiveIdx(0);
    }, slow ? 600 : DEBOUNCE);

    return () => clearTimeout(t);
  }, [query, open, role, scenario, belowThreshold, trimmed, scopeLocked, activePage]);

  // ── Flat navigable list ──────────────────────────────────────────────────
  // One array of everything Up/Down can land on, so keyboard order always matches visual order.

  interface NavItem { kind: 'hit' | 'seeAll' | 'action'; hit?: SearchHit; group?: SearchGroup; total?: number; action?: () => void; label?: string }

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];
    if (scenario === 'total-failure') {
      recents.forEach((h) => items.push({ kind: 'hit', hit: h }));
      destinations.forEach((h) => items.push({ kind: 'hit', hit: h }));
      return items;
    }
    if (!trimmed) {
      recents.forEach((h) => items.push({ kind: 'hit', hit: h }));
      frequents.forEach((h) => items.push({ kind: 'hit', hit: h }));
      destinations.forEach((h) => items.push({ kind: 'hit', hit: h }));
      return items;
    }
    if (belowThreshold) {
      localHits.forEach((h) => items.push({ kind: 'hit', hit: h }));
      return items;
    }
    if (!result) return items;
    if (result.dominant) items.push({ kind: 'hit', hit: result.dominant });
    const shown = arrived ? result.groups.filter((g) => arrived.includes(g.group)) : result.groups;
    shown.forEach((g) => {
      g.hits.forEach((h) => items.push({ kind: 'hit', hit: h }));
      if (g.total > g.hits.length) items.push({ kind: 'seeAll', group: g.group, total: g.total });
    });
    return items;
  }, [trimmed, belowThreshold, localHits, result, recents, frequents, destinations, arrived, scenario]);

  useEffect(() => { setActiveIdx((i) => Math.min(i, Math.max(0, navItems.length - 1))); }, [navItems.length]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-nav-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const openHit = useCallback((hit: SearchHit, newTab = false) => {
    pushRecentRecord(hit.key);
    if (trimmed) pushRecentQuery(query);
    lastSessionRef.current = { query, result };

    if (newTab) {
      // Ctrl/Cmd+Enter keeps search open so several results can be opened in a row.
      toast.success(`${hit.id ?? hit.title} opened in a new tab`);
      return;
    }
    closeSearch();
    if (hit.module) { openInStack(hit.module, hit.id ?? hit.title, hit.title, hit.data); return; }
    if (hit.page) { onNavigate(hit.page); return; }
    // Knowledge, Projects, Users and Reports have no detail page in this prototype; report the
    // route rather than pretending to navigate.
    toast.success(`${hit.title}${hit.href ? ` — ${hit.href}` : ''}`);
  }, [openInStack, onNavigate, closeSearch, query, result, trimmed]);

  /** "See all 47 in Requests" — the module list refines what search found, so carry the query. */
  const seeAll = useCallback((group: SearchGroup) => {
    const page = GROUP_PAGE[group];
    pushRecentQuery(query);
    lastSessionRef.current = { query, result };
    closeSearch();
    if (page) { onNavigate(page); toast.success(`${group} filtered by “${trimmed}”`); }
    else toast.success(`${group} — “${trimmed}”`);
  }, [onNavigate, closeSearch, query, result, trimmed]);

  const askAi = useCallback(() => {
    closeSearch();
    toast.success(`Ask AI — “${trimmed}”`);
  }, [closeSearch, trimmed]);

  const runNav = useCallback((item: NavItem, newTab = false) => {
    if (item.kind === 'hit' && item.hit) openHit(item.hit, newTab);
    else if (item.kind === 'seeAll' && item.group) seeAll(item.group);
    else item.action?.();
  }, [openHit, seeAll]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); closeSearch(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (navItems.length ? (i + 1) % navItems.length : 0)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => (navItems.length ? (i - 1 + navItems.length) % navItems.length : 0)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = navItems[activeIdx];
      if (item) runNav(item, e.metaKey || e.ctrlKey);
      return;
    }
    if (e.key === 'Tab' && suggestions.length) {
      // Tab completes the operator being typed — discoverability without memorising syntax.
      e.preventDefault();
      const parts = query.split(/\s+/);
      parts[parts.length - 1] = suggestions[0].insert;
      setQuery(parts.join(' '));
    }
  };

  if (!open || role === 'none') return null;

  // ── Rendering helpers ────────────────────────────────────────────────────

  let navCursor = -1;
  const nextIdx = () => ++navCursor;

  const row = (hit: SearchHit) => {
    const i = nextIdx();
    return (
      <div key={hit.key} data-nav-active={i === activeIdx}>
        <ResultRow
          hit={hit}
          active={i === activeIdx}
          onHover={() => setActiveIdx(i)}
          onOpen={(newTab) => openHit(hit, newTab)}
          terms={result?.parsed.terms ?? []}
        />
      </div>
    );
  };

  const seeAllRow = (group: SearchGroup, total: number) => {
    const i = nextIdx();
    return (
      <div key={`see:${group}`} data-nav-active={i === activeIdx}>
        <button
          onMouseMove={() => setActiveIdx(i)}
          onClick={() => seeAll(group)}
          className={`flex w-full items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium text-[#3D8BD0] transition-colors ${
            i === activeIdx ? 'bg-[#EBF5FF]' : 'hover:bg-[#F8FAFC]'
          }`}
        >
          See all {total} in {group} <ChevronRight size={13} />
        </button>
      </div>
    );
  };

  const scopeLabel = PAGE_SCOPE[activePage] ?? null;
  const totalShown = result ? result.groups.reduce((n, g) => n + g.hits.length, 0) + (result.dominant ? 1 : 0) : 0;

  // ── Body ─────────────────────────────────────────────────────────────────

  const body = (() => {
    // §27 — the service is down, but the overlay is still a navigator.
    if (scenario === 'total-failure') {
      return (
        <>
          <div className="mx-3 mt-3 flex items-start gap-2.5 rounded border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2.5">
            <WifiOff size={16} className="mt-px flex-shrink-0 text-[#EA580C]" />
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[#9A3412]">Search is unavailable</div>
              <div className="mt-0.5 text-[12px] text-[#C2410C]">
                We can’t reach the search service right now. Your recent records and destinations are still here.
              </div>
            </div>
            <button onClick={() => setScenario('normal')} className="ml-auto flex flex-shrink-0 items-center gap-1 rounded border border-[#FED7AA] bg-white px-2 py-1 text-[12px] font-medium text-[#9A3412] transition-colors hover:bg-[#FFF7ED]">
              <RotateCw size={12} /> Retry
            </button>
          </div>
          {!!recents.length && <><GroupHeader label="Recent records" />{recents.map(row)}</>}
          <GroupHeader label="Destinations" />
          {destinations.map(row)}
        </>
      );
    }

    // §5 / §6 — zero query. Never a blank panel: a user who types nothing still gets navigation.
    if (!trimmed) {
      return (
        <>
          {firstTime ? (
            <>
              <div className="mx-3 mt-3 rounded border border-[#DFE5ED] bg-[#F8FAFC] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#364658]">
                  <Sparkles size={14} className="text-[#3D8BD0]" /> Search anything in ServiceOps
                </div>
                <div className="mt-1 text-[12px] leading-[1.6] text-[#64748B]">
                  Type an ID like <code className="rounded bg-white px-1 font-mono text-[11px] text-[#3D8BD0]">INC-32</code> to jump
                  straight to it, or a few words from a subject, host name or person.
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {EXAMPLE_QUERIES.map((q) => (
                    <button key={q} onClick={() => setQuery(q)} className="rounded border border-[#DFE5ED] bg-white px-2 py-1 font-mono text-[11px] text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <GroupHeader label="Filters you can type" />
              <div className="px-3 pb-1">
                {OPERATOR_HELP.map((o) => (
                  <div key={o.token} className="flex items-baseline gap-2.5 py-1">
                    <code className="w-[112px] flex-shrink-0 font-mono text-[11px] text-[#3D8BD0]">{o.token}</code>
                    <span className="text-[12px] text-[#7B8FA5]">{o.desc}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {!!queries.length && (
                <>
                  <GroupHeader
                    label="Recent searches"
                    right={
                      <button onClick={() => { clearSearchHistory(); setQuery(' '); setQuery(''); }} className="flex items-center gap-1 text-[11px] text-[#7B8FA5] transition-colors hover:text-[#DC2626]">
                        <Trash2 size={11} /> Clear
                      </button>
                    }
                  />
                  <div className="flex flex-wrap gap-1.5 px-3 pb-1">
                    {queries.map((q) => (
                      <button key={q} onClick={() => setQuery(q)} className="flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2 py-1 text-[12px] text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
                        <Clock size={11} className="text-[#9CA3AF]" /> {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {!!recents.length && <><GroupHeader label="Recent records" />{recents.map(row)}</>}
              {!!frequents.length && (
                <>
                  <GroupHeader label="Frequently opened" right={<span className="text-[11px] text-[#9CA3AF]">Based on how often you open them</span>} />
                  {frequents.map(row)}
                </>
              )}
            </>
          )}
          <GroupHeader label="Destinations" />
          {destinations.map(row)}
        </>
      );
    }

    // §7 — one or two characters search local data only. No cross-module fan-out.
    if (belowThreshold) {
      return (
        <>
          <div className="mx-3 mt-3 flex items-center gap-2 rounded bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#64748B]">
            <Info size={13} className="flex-shrink-0 text-[#9CA3AF]" />
            Searching your recents and destinations — keep typing to search all of ServiceOps.
          </div>
          {localHits.length ? (
            <>
              <GroupHeader label="Recents & destinations" />
              {localHits.map(row)}
            </>
          ) : (
            <div className="px-3 py-6 text-center text-[13px] text-[#7B8FA5]">
              Nothing local matches “{trimmed}”. Keep typing to search everything.
            </div>
          )}
        </>
      );
    }

    // §18 — matches exist that this user cannot see. Say nothing about them.
    if (scenario === 'no-access-results') {
      return (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#F5F7FA]">
            <Search size={20} className="text-[#9CA3AF]" />
          </div>
          <div className="text-[14px] font-medium text-[#364658]">No results you have access to.</div>
          <div className="mt-1 max-w-[420px] text-[13px] leading-[1.6] text-[#7B8FA5]">
            Try a different search, or ask the owner of the record to share it with you.
          </div>
          <button onClick={askAi} className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
            <Sparkles size={13} className="text-[#8B5CF6]" /> Ask AI about this
          </button>
        </div>
      );
    }

    // Loading with nothing to keep on screen yet.
    if (loading && !result) {
      return (
        <>
          <SkeletonGroup label="Requests" />
          <SkeletonGroup label="Assets" rows={2} />
        </>
      );
    }

    // §17 — no results. Never a dead end.
    if (result && result.total === 0) {
      return (
        <div className="px-3 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#F5F7FA]">
              <Search size={20} className="text-[#9CA3AF]" />
            </div>
            <div className="text-[14px] font-medium text-[#364658]">No results for “{trimmed}”</div>
            <div className="mt-1 max-w-[440px] text-[13px] leading-[1.6] text-[#7B8FA5]">
              Check the spelling, use fewer words, or drop a filter. Global Search looks across every
              module you have access to.
            </div>
          </div>
          <div className="mx-auto mt-5 grid max-w-[520px] grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={askAi} className="flex items-center gap-2.5 rounded border border-[#DFE5ED] bg-white p-2.5 text-left transition-colors hover:border-[#3D8BD0]">
              <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#F3E8FF] text-[#8B5CF6]"><Sparkles size={14} /></span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#364658]">Ask AI about this</span>
                <span className="block truncate text-[12px] text-[#7B8FA5]">Hand “{trimmed}” to ServiceOps AI</span>
              </span>
            </button>
            <button onClick={() => setQuery(`type:knowledge ${trimmed}`)} className="flex items-center gap-2.5 rounded border border-[#DFE5ED] bg-white p-2.5 text-left transition-colors hover:border-[#3D8BD0]">
              <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5]"><BookOpen size={14} /></span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#364658]">Search Knowledge</span>
                <span className="block truncate text-[12px] text-[#7B8FA5]">Look for an article instead</span>
              </span>
            </button>
            {!result.parsed.includeArchived && (
              <button onClick={() => setQuery(`${query} include:archived`)} className="flex items-center gap-2.5 rounded border border-[#DFE5ED] bg-white p-2.5 text-left transition-colors hover:border-[#3D8BD0]">
                <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5]"><Clock size={14} /></span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-[#364658]">Include archived</span>
                  <span className="block truncate text-[12px] text-[#7B8FA5]">Also search closed and cancelled</span>
                </span>
              </button>
            )}
            <button onClick={() => { closeSearch(); toast.success(`New request — “${trimmed}”`); }} className="flex items-center gap-2.5 rounded border border-[#DFE5ED] bg-white p-2.5 text-left transition-colors hover:border-[#3D8BD0]">
              <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]"><Plus size={14} /></span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#364658]">Create a request</span>
                <span className="block truncate text-[12px] text-[#7B8FA5]">Start a new record with this subject</span>
              </span>
            </button>
          </div>
        </div>
      );
    }

    if (!result) return null;

    const shownGroups = arrived ? result.groups.filter((g) => arrived.includes(g.group)) : result.groups;
    const pendingGroups = arrived ? result.groups.filter((g) => !arrived.includes(g.group)) : [];

    return (
      <>
        {/* §15 — a very broad query says so out loud rather than truncating in silence. */}
        {result.capped && (
          <div className="mx-3 mt-3 flex flex-wrap items-center gap-2 rounded border border-[#DFE5ED] bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#64748B]">
            <Info size={13} className="flex-shrink-0 text-[#9CA3AF]" />
            <span>Showing the top {totalShown} of <span className="font-semibold text-[#364658]">{result.total}</span> results — add a filter to narrow it down.</span>
            <span className="ml-auto flex gap-1.5">
              {!result.parsed.types.length && <button onClick={() => setQuery(`type:incident ${query}`)} className="rounded border border-[#DFE5ED] bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#3D8BD0] transition-colors hover:border-[#3D8BD0]">type:incident</button>}
              {!result.parsed.assignees.length && <button onClick={() => setQuery(`${query} assignee:me`)} className="rounded border border-[#DFE5ED] bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#3D8BD0] transition-colors hover:border-[#3D8BD0]">assignee:me</button>}
            </span>
          </div>
        )}

        {/* §26 — one group failing degrades that group only. */}
        {failedGroups.map((g) => (
          <div key={g} className="mx-3 mt-3 flex items-center gap-2.5 rounded border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2 text-[12px]">
            <AlertTriangle size={14} className="flex-shrink-0 text-[#EA580C]" />
            <span className="text-[#9A3412]"><span className="font-medium">{g}</span> couldn’t be searched.</span>
            <button onClick={() => { setFailedGroups([]); setScenario('normal'); }} className="ml-auto flex items-center gap-1 rounded border border-[#FED7AA] bg-white px-2 py-0.5 font-medium text-[#9A3412] transition-colors hover:bg-[#FFF7ED]">
              <RotateCw size={11} /> Retry
            </button>
          </div>
        ))}

        {result.dominant && (() => {
          const i = nextIdx();
          return (
            <div key="dominant" className="px-3 pt-3" data-nav-active={i === activeIdx}>
              <DominantRow
                hit={result.dominant}
                reason={result.dominantReason ?? 'relevance'}
                active={i === activeIdx}
                onHover={() => setActiveIdx(i)}
                onOpen={(newTab) => openHit(result.dominant!, newTab)}
              />
            </div>
          );
        })()}

        {shownGroups.map((g) => (
          <div key={g.group}>
            <GroupHeader label={g.group} right={<span className="text-[11px] text-[#9CA3AF]">{g.total}</span>} />
            {g.hits.map(row)}
            {g.total > g.hits.length && seeAllRow(g.group, g.total)}
          </div>
        ))}

        {/* §28 — groups render as they arrive; the slowest module never holds up the rest. */}
        {pendingGroups.map((g) => <SkeletonGroup key={g.group} label={g.group} rows={Math.min(g.hits.length || 2, 3)} />)}
      </>
    );
  })();

  return (
    <div
      className="fixed inset-0 z-[11000] flex items-start justify-center bg-[#0F172A]/40 px-4 pt-[10vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeSearch(); }}
    >
      <div
        role="combobox"
        aria-expanded
        aria-haspopup="listbox"
        aria-label="Search ServiceOps"
        className="flex max-h-[76vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-[#DFE5ED] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)]"
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 border-b border-[#EEF2F6] px-4 py-3">
          <Search size={17} className="flex-shrink-0 text-[#9CA3AF]" />
          <input
            ref={inputRef}
            value={query}
            // The restore notice stands until the user edits the query — it explains why the box
            // is not empty, so clearing it on the first render would defeat the point.
            onChange={(e) => { setQuery(e.target.value); setRestored(false); }}
            onKeyDown={onInputKey}
            placeholder="Search requests, assets, people, settings…"
            aria-autocomplete="list"
            aria-controls="global-search-results"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#364658] placeholder:text-[#9CA3AF] focus:outline-none"
          />
          {loading && <span className="size-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-[#DFE5ED] border-t-[#3D8BD0]" />}
          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
              <X size={14} />
            </button>
          )}
          <button onClick={closeSearch} className="flex flex-shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[11px] text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6]">
            <Kbd>Esc</Kbd>
          </button>
        </div>

        {/* Scope + operator chips. Global is always the default — search never silently narrows
            itself to the module you happen to be standing in. */}
        {(scopeLabel || result?.parsed.chips.length || restored) && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-[#EEF2F6] px-4 py-2">
            {scopeLabel && (
              <>
                <button
                  onClick={() => setScopeLocked(false)}
                  className={`rounded px-2 py-0.5 text-[12px] font-medium transition-colors ${
                    !scopeLocked ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#7B8FA5] hover:bg-[#F3F4F6]'
                  }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setScopeLocked(true)}
                  className={`flex items-center gap-1 rounded px-2 py-0.5 text-[12px] font-medium transition-colors ${
                    scopeLocked ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#7B8FA5] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {scopeLabel}
                  {scopeLocked && <X size={11} onClick={(e) => { e.stopPropagation(); setScopeLocked(false); }} />}
                </button>
                {(result?.parsed.chips.length || restored) ? <span className="h-3 w-px bg-[#E5E7EB]" /> : null}
              </>
            )}
            {result?.parsed.chips.map((c) => (
              <button
                key={c.raw}
                onClick={() => setQuery(query.replace(c.raw, '').replace(/\s+/g, ' ').trim())}
                className="flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658] transition-colors hover:bg-[#E2E8F0]"
              >
                {c.label} <X size={11} className="text-[#7B8FA5]" />
              </button>
            ))}
            {restored && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-[#7B8FA5]">
                <Clock size={11} /> Restored your last search
              </span>
            )}
          </div>
        )}

        {/* Operator autocomplete */}
        {!!suggestions.length && (
          <div className="border-b border-[#EEF2F6] bg-[#F8FAFC] px-4 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#9CA3AF]">Filters</span>
              {suggestions.map((s, i) => (
                <button
                  key={s.insert}
                  onClick={() => {
                    const parts = query.split(/\s+/);
                    parts[parts.length - 1] = s.insert;
                    setQuery(parts.join(' '));
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2 py-0.5 font-mono text-[11px] text-[#3D8BD0] transition-colors hover:border-[#3D8BD0]"
                >
                  {s.label}
                  {i === 0 && <Kbd>Tab</Kbd>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div
          ref={listRef}
          id="global-search-results"
          role="listbox"
          aria-label="Search results"
          className={`min-h-0 flex-1 overflow-y-auto pb-2 transition-opacity ${loading && result ? 'opacity-50' : 'opacity-100'}`}
        >
          {body}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-[#EEF2F6] bg-[#FCFDFE] px-4 py-2 text-[11px] text-[#7B8FA5]">
          <span className="flex items-center gap-1"><Kbd><ArrowUp size={9} /></Kbd><Kbd><ArrowDown size={9} /></Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd><CornerDownLeft size={9} /></Kbd> open</span>
          <span className="hidden items-center gap-1 sm:flex"><Kbd>{MOD}</Kbd><Kbd><CornerDownLeft size={9} /></Kbd> new tab</span>
          <span className="flex items-center gap-1"><Kbd>Esc</Kbd> close</span>

          {trimmed && !belowThreshold && (
            <button onClick={askAi} className="ml-auto flex items-center gap-1.5 rounded px-2 py-1 font-medium text-[#8B5CF6] transition-colors hover:bg-[#F3E8FF]">
              <Sparkles size={12} /> Ask AI about this
            </button>
          )}

          {/* Prototype-only: forces the states a mock build cannot reach on its own. */}
          <div className={`relative ${trimmed && !belowThreshold ? '' : 'ml-auto'}`}>
            <button
              onClick={() => setShowDemo((v) => !v)}
              title="Prototype state switcher"
              className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
                scenario !== 'normal' || role !== 'technician' ? 'bg-[#FEF3C7] text-[#92400E]' : 'text-[#9CA3AF] hover:bg-[#F3F4F6]'
              }`}
            >
              <FlaskConical size={12} />
              {scenario !== 'normal' || role !== 'technician' ? 'Demo state' : 'Demo'}
            </button>
            {showDemo && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDemo(false)} />
                <div className="absolute bottom-full right-0 z-50 mb-2 w-[300px] rounded-lg border border-[#DFE5ED] bg-white py-1.5 shadow-lg">
                  <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Role</div>
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setSearchRole(r.id); setShowDemo(false); if (r.id === 'none') closeSearch(); }}
                      className={`block w-full px-3 py-1.5 text-left transition-colors ${role === r.id ? 'bg-[#F5FAFF]' : 'hover:bg-[#F9FAFB]'}`}
                    >
                      <span className={`block text-[12px] font-medium ${role === r.id ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{r.label}</span>
                      <span className="block text-[11px] text-[#7B8FA5]">{r.desc}</span>
                    </button>
                  ))}
                  <div className="mt-1 border-t border-[#F0F2F5] px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Scenario</div>
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setScenario(s.id); setShowDemo(false); }}
                      className={`block w-full px-3 py-1.5 text-left transition-colors ${scenario === s.id ? 'bg-[#F5FAFF]' : 'hover:bg-[#F9FAFB]'}`}
                    >
                      <span className={`block text-[12px] font-medium ${scenario === s.id ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{s.label}</span>
                      <span className="block text-[11px] text-[#7B8FA5]">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Context-aware invocation: the current module is OFFERED as a scope chip, never applied by
 *  default — accidental scope locking is the fastest way to make a search feel broken. */
const PAGE_SCOPE: Record<string, string> = {
  request: 'Requests', problem: 'Problems', change: 'Changes', release: 'Releases',
  'hardware-assets': 'Hardware Assets', 'software-assets': 'Software Assets',
  'non-it-assets': 'Non-IT Assets', 'consumable-assets': 'Consumable Assets',
  'software-licenses': 'Software Licenses', contracts: 'Contracts', purchases: 'Purchases',
  cmdb: 'CMDB', patches: 'Patches', 'patch-deployments': 'Patch Deployment',
  endpoints: 'Endpoint', vulnerabilities: 'Vulnerabilities', 'detected-cves': 'Detected CVEs',
  bom: 'BOM Inventory', admin: 'Admin',
};

/** Which result group the scope chip narrows to when the user opts into it. */
const PAGE_GROUP: Record<string, SearchGroup> = {
  request: 'Requests', problem: 'Problems', change: 'Changes', release: 'Releases',
  'hardware-assets': 'Assets', 'software-assets': 'Assets', 'non-it-assets': 'Assets',
  'consumable-assets': 'Assets', 'software-licenses': 'Assets', contracts: 'Assets',
  purchases: 'Assets', cmdb: 'Configuration Items', endpoints: 'Configuration Items',
  bom: 'Configuration Items', patches: 'Patches', 'patch-deployments': 'Patches',
  vulnerabilities: 'Vulnerabilities', 'detected-cves': 'Vulnerabilities',
  admin: 'Admin Settings',
};
