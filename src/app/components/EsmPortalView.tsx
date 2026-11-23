import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowRightToLine, Bell, BookOpen, Building2, Check, ChevronDown, ChevronRight, CircleHelp, Columns3, Download, ExternalLink, FileText, FlaskConical, GitPullRequestArrow, Headset, Home,
  Info, Keyboard, Laptop, LayoutGrid, LifeBuoy, Lightbulb, ListChecks, Lock, LogOut, Mail, MessageSquare, MessagesSquare, Monitor, Moon, Newspaper, PanelLeft, Phone, Plus,
  RefreshCw, Repeat, Scale, Search, Server, ShoppingCart, Sparkles, Star, Sun, Ticket, Type, Undo2, User as UserIcon, UserCheck, UserCog, Users, Volume2, Wallet, Workflow, X,
} from 'lucide-react';
import { MotadataLogo } from './Header';
import { toast } from 'sonner';
import { loadStore } from './workspaceData';
import type { Workspace } from './workspaceData';
import { EMPLOYEES, portalVerdict } from './WorkspacePrivacyRows';
import {
  ORG_ARTICLES, ORG_BRANDING, RETURN_KEY, articlesOf, canSignIn, loadEsm, mapsTo, myApprovals, myRequests, orderTeams, portalsOf, saveEsm,
  searchAll, servicesOf, signInLabel, teamsOn, visibleTeams, workspacesLabel, wsPortalOf,
} from './esmPortalData';
import type { AudiencePortal, CardIcon, Employee, EsmPortalConfig, EsmStore, Hit, MyRequest, WsPortal } from './esmPortalData';

/* ESM F18 — what an EMPLOYEE sees (prototype route #/portal[/home | /requests | /<team> | /<team>/new]).
 *   /portal          the address employees open: one visible team → that team's portal; ⭐ → that team; else the ESM Portal
 *   /portal/home     the ESM Portal (landing only, configured in Admin › Global › Support Channels › ESM Portal)
 *   /portal/<team>   the Support Portal mapped to that workspace (IT = today's portal, address /support-portal)
 * Which teams show = Live + Portal Access (F02a §9). Outside it: today's "Page Not Found" static page. */

export const CARD_ICON: Record<CardIcon, typeof Headset> = { Headset, Users, Building2, Wallet, Scale, LifeBuoy };
const VIEWER_KEY = 'serviceops.esm.portalViewer';
const readViewer = () => { try { return window.localStorage.getItem(VIEWER_KEY) ?? 'Karan Mehta'; } catch { return 'Karan Mehta'; } };
const pathOf = (p: WsPortal) => p.slug || 'it';
const go = (sub: string) => { window.location.hash = `#/portal${sub ? `/${sub}` : ''}`; };
const brand = (p: WsPortal) => p.colour || '#0F172A';

const STATUS_TONE: Record<MyRequest['status'], string> = { Open: 'bg-[#FEF6E7] text-[#B54708]', 'In Progress': 'bg-[#EBF5FF] text-[#1F5F99]', Resolved: 'bg-[#ECFDF3] text-[#15803D]' };

export function TeamTag({ w, small }: { w?: Workspace; small?: boolean }) {
  if (!w) return <span className={`inline-flex items-center rounded border border-[#E5E7EB] bg-white px-1.5 ${small ? 'text-[11px]' : 'text-[12px]'} text-[#64748B]`}>Organization</span>;
  return <span className={`inline-flex items-center gap-1 rounded border border-[#E5E7EB] bg-white px-1.5 ${small ? 'text-[11px]' : 'text-[12px]'} text-[#364658]`}><span className="size-1.5 rounded-full" style={{ background: w.colour }} />{w.name}</span>;
}

// ── The ESM Portal (landing). Also rendered by the admin page as its live preview. ─────────────────────────
/** Click-to-edit text for the admin's live preview: looks like the page text, shows a dashed outline on hover. */
function InlineText({ value, onChange, placeholder, className, label }: { value: string; onChange: (v: string) => void; placeholder: string; className: string; label: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} title="Click to edit"
      className={`w-full rounded-md border border-dashed border-transparent bg-transparent px-2 outline-none transition-colors hover:border-current/40 focus:border-current/60 focus:bg-black/5 ${className}`} />
  );
}

export function EsmLanding({ cfg, esm, workspaces, me, preview, onOpenTeam, onRequests, onSearchHit, onEdit, portal }: {
  cfg: EsmPortalConfig; esm: EsmStore; workspaces: Workspace[]; me: Employee; preview?: boolean;
  /** The Support Portal (audience) being shown: only its mapped workspaces appear (F18b). */
  portal?: AudiencePortal;
  onOpenTeam: (w: Workspace, sub?: string) => void; onStar?: (w: Workspace) => void; onRequests?: () => void; onSearchHit?: (h: Hit) => void;
  /** Admin preview only: headings become click-to-edit. */
  onEdit?: (patch: Partial<EsmPortalConfig>) => void;
}) {
  const [q, setQ] = useState('');
  const [ask, setAsk] = useState(false);
  const teams = orderTeams(portal ? teamsOn(portal, workspaces, me) : visibleTeams(workspaces, me), cfg.order);
  const mine = myRequests(esm, me).filter((r) => !portal || mapsTo(portal, r.workspaceId));
  const open = mine.filter((r) => r.status !== 'Resolved');
  const approvals = myApprovals(me).filter((r) => !portal || mapsTo(portal, r.workspaceId));
  const hits = searchAll(q, teams, mine, workspaces);
  return (
    <div className={`bg-[#F7F9FC] ${preview ? '' : 'min-h-full'}`}>
      <div className="relative px-6 pb-12 pt-11 text-center text-white" style={{ background: `linear-gradient(120deg, ${cfg.bannerFrom}, ${cfg.bannerTo})` }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden"><NetworkPattern /></div>
        {onEdit ? (
          <div className="relative mx-auto max-w-[640px]">
            <InlineText value={cfg.heading} onChange={(v) => onEdit({ heading: v })} placeholder="Add a heading" label="Heading" className="h-10 text-center text-[26px] font-semibold tracking-tight text-white placeholder:text-white/50" />
            <InlineText value={cfg.subheading} onChange={(v) => onEdit({ subheading: v })} placeholder="Add a sub heading (optional)" label="Sub heading" className="mt-0.5 h-7 text-center text-[14px] text-white/80 placeholder:text-white/40" />
          </div>
        ) : (<>
          <h1 className="relative text-[26px] font-semibold tracking-tight">{cfg.heading}</h1>
          {cfg.subheading && <p className="relative mt-1.5 text-[14px] text-white/80">{cfg.subheading}</p>}
        </>)}
        <div className="relative mx-auto mt-5 max-w-[600px] text-left">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={cfg.searchPlaceholder} aria-label="Search all workspaces"
            className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-10 text-[14px] text-[#1F2D3D] shadow-lg outline-none placeholder:text-[#94A3B8] focus:ring-2 focus:ring-white/60" />
          {q && <button onClick={() => setQ('')} aria-label="Clear" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"><X size={16} /></button>}
          {q && (
            <div className="absolute left-0 right-0 top-[54px] z-20 max-h-[320px] overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-2 text-[#364658] shadow-xl">
              {hits.length === 0 ? <div className="px-3 py-4 text-center text-[13px] text-[#94A3B8]">Nothing found in the workspaces {me.name} can see.</div> : hits.slice(0, 12).map((h, i) => (
                <button key={i} onClick={() => onSearchHit?.(h)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[#F5F7FA]">
                  {h.kind === 'Service' ? <ShoppingCart size={15} className="text-[#64748B]" /> : h.kind === 'Article' ? <BookOpen size={15} className="text-[#64748B]" /> : <Ticket size={15} className="text-[#64748B]" />}
                  <span className="min-w-0 flex-1 truncate text-[13px]">{h.ref && <b className="mr-1.5 font-medium text-[#3D8BD0]">{h.ref}</b>}{h.title}</span>
                  <span className="text-[11px] text-[#94A3B8]">{h.kind}</span>
                  <TeamTag w={h.team} small />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-6 pb-12 pt-8">
        {/* 1 · Pick a team — the one job of this page */}
        {onEdit
          ? <div className="-mx-2 max-w-[520px]"><InlineText value={cfg.cardsHeading} onChange={(v) => onEdit({ cardsHeading: v })} placeholder="Add a heading" label="Heading above the workspace cards" className="h-8 text-[17px] font-semibold text-[#1F2D3D] placeholder:text-[#94A3B8]" /></div>
          : <h2 className="text-[17px] font-semibold text-[#1F2D3D]">{cfg.cardsHeading}</h2>}
        {teams.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#DFE5ED] bg-white px-4 py-8 text-center text-[13px] text-[#64748B]">No workspace on this portal is open to {me.name} right now. Your own requests are still under Requests.</p>
        ) : (
          <div className={`mt-4 grid gap-3 ${cfg.cardStyle === 'tiles' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {teams.map((w) => {
              const p = wsPortalOf(esm, w);
              const Icon = CARD_ICON[p.cardIcon];
              const star = null; // ⭐ default team removed (Juli, 2026-11-17: minimum configuration)
              const chip = (size: number, box: string) => <span className={`flex ${box} flex-shrink-0 items-center justify-center rounded-xl`} style={{ background: `${w.colour}1A`, color: w.colour }}><Icon size={size} /></span>;
              return cfg.cardStyle === 'tiles' ? (
                <div key={w.id} role="button" tabIndex={0} onClick={() => onOpenTeam(w)} onKeyDown={(e) => e.key === 'Enter' && onOpenTeam(w)}
                  className="group relative flex cursor-pointer flex-col rounded-2xl border border-[#E8ECF1] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  {star}
                  {chip(22, 'size-11')}
                  <span className="mt-4 text-[15px] font-semibold text-[#1F2D3D]">{w.name}</span>
                  {cfg.showDescriptions && <span className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-[#64748B]">{p.cardDesc}</span>}
                  <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium opacity-0 transition-opacity group-hover:opacity-100" style={{ color: w.colour }}>Open <ArrowRight size={13} /></span>
                </div>
              ) : (
                <div key={w.id} role="button" tabIndex={0} onClick={() => onOpenTeam(w)} onKeyDown={(e) => e.key === 'Enter' && onOpenTeam(w)}
                  className="group relative flex cursor-pointer items-center gap-3.5 rounded-2xl border border-[#E8ECF1] bg-white p-4 pr-10 transition-all hover:border-transparent hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  {star}
                  {chip(20, 'size-10')}
                  <span className="min-w-0"><span className="block text-[14px] font-semibold text-[#1F2D3D]">{w.name}</span>{cfg.showDescriptions && <span className="block truncate text-[12px] text-[#64748B]">{p.cardDesc}</span>}</span>
                </div>
              );
            })}
          </div>
        )}
        {teams.length > 1 && (
          <button onClick={() => setAsk(true)} className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#3D8BD0]">
            <CircleHelp size={14} /> Not sure which workspace? <span className="font-medium text-[#3D8BD0]">Tell us what you need</span>
          </button>
        )}

        {/* 2 · Your stuff — only what has something in it */}
        {cfg.showMyWork && (
          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#1F2D3D]">Your requests</h2>
              <button onClick={onRequests} className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#3D8BD0] hover:underline">View all <ChevronRight size={14} /></button>
            </div>
            {approvals.length > 0 && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#FDE7C2] bg-[#FFFAF0] px-4 py-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]"><UserCheck size={16} /></span>
                <span className="min-w-0 flex-1 text-[13px] text-[#364658]"><b className="font-semibold">{approvals.length} approval{approvals.length > 1 ? 's' : ''}</b> waiting for you <span className="text-[#94A3B8]">· {approvals[0].subject}{approvals.length > 1 ? ` and ${approvals.length - 1} more` : ''}</span></span>
                <button onClick={onRequests} className="text-[13px] font-medium text-[#B45309] hover:underline">Review</button>
              </div>
            )}
            <div className="overflow-hidden rounded-xl border border-[#E8ECF1] bg-white">
              {open.length === 0 ? (
                <p className="flex items-center justify-center gap-2 px-4 py-6 text-[13px] text-[#94A3B8]"><Check size={15} className="text-[#22C55E]" /> You have no open requests.</p>
              ) : open.slice(0, 4).map((r) => { const w = workspaces.find((x) => x.id === r.workspaceId); return (
                <div key={r.id} className="flex items-center gap-3 border-b border-[#F3F5F8] px-4 py-3 last:border-0 hover:bg-[#FAFBFC]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ background: w?.colour ?? '#94A3B8' }} title={w?.name ?? 'Organization'} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[#1F2D3D]">{r.subject}</span>
                    <span className="block text-[12px] text-[#94A3B8]">{r.id} · {w?.name ?? 'Organization'}</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status]}`}>{r.status}</span>
                </div>
              ); })}
            </div>
          </div>
        )}

        {/* 3 · Quick links — a quiet row, not another card */}
        {cfg.links.filter((l) => l.label).length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-medium uppercase tracking-wide text-[#94A3B8]">Quick links</span>
            {cfg.links.filter((l) => l.label).map((l) => (
              <a key={l.label + l.url} onClick={(e) => { e.preventDefault(); toast.success(`Opens ${l.url || l.label}`); }} href="#"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E8ECF1] bg-white px-3 py-1 text-[12px] text-[#364658] hover:border-[#3D8BD0] hover:text-[#3D8BD0]"><ExternalLink size={11} />{l.label}</a>
            ))}
          </div>
        )}
      </div>

      {ask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => setAsk(false)}>
          <div className="w-full max-w-[560px] rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-[16px] font-semibold text-[#1F2D3D]">Which workspace can help?</h3><button onClick={() => setAsk(false)} aria-label="Close"><X size={18} className="text-[#94A3B8]" /></button></div>
            <p className="mt-1 text-[13px] text-[#64748B]">Pick the workspace; you’ll get its own form.</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {teams.map((w) => { const Icon = CARD_ICON[wsPortalOf(esm, w).cardIcon]; return (
                <button key={w.id} onClick={() => { setAsk(false); onOpenTeam(w, 'new'); }} className="flex items-center gap-2.5 rounded-lg border border-[#E5E7EB] p-3 text-left hover:border-[#3D8BD0]">
                  <span className="flex size-8 items-center justify-center rounded-lg text-white" style={{ background: w.colour }}><Icon size={16} /></span><span className="text-[13px] font-medium text-[#1F2D3D]">{w.name}</span>
                </button>
              ); })}
              {(() => { const it = teams.find((w) => w.isDefault); return it && (
                <button onClick={() => { setAsk(false); onOpenTeam(it, 'new'); }} className="col-span-2 rounded-lg border border-dashed border-[#CBD5E1] p-3 text-left text-[13px] text-[#64748B] hover:border-[#3D8BD0]">
                  <b className="font-medium text-[#364658]">Not sure</b> — send it to {it.name}; they’ll pass it to the right team.
                </button>
              ); })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── The default Support Portal look (copied from 185 /support-portal, 2026-11-06) ───────────────────────────
/** The dark "network of people" banner the live portal uses when nothing is customised. */
export function NetworkPattern() {
  const n: [number, number, number][] = [[90, 140, 28], [238, 222, 30], [424, 115, 30], [705, 170, 42], [878, 105, 18], [1000, 152, 30], [1131, 228, 30], [1326, 130, 24], [347, 308, 18], [1202, 322, 18], [560, 60, 14], [800, 290, 16]];
  const links = [[0, 1], [1, 2], [2, 10], [10, 3], [3, 4], [4, 5], [5, 6], [6, 7], [1, 8], [6, 9], [3, 11], [11, 8], [3, 5], [2, 3]];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1366 330" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><radialGradient id="np-glow" cx="50%" cy="45%" r="35%"><stop offset="0" stopColor="#ffffff" stopOpacity="0.10" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient></defs>
      <rect width="1366" height="330" fill="url(#np-glow)" />
      {links.map(([a, b], i) => <line key={i} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} stroke="#ffffff" strokeOpacity="0.10" />)}
      {n.map(([x, y, r], i) => (
        <g key={i} opacity={r > 20 ? 0.35 : 0.22}>
          <circle cx={x} cy={y} r={r} fill="#ffffff" fillOpacity="0.05" stroke="#ffffff" strokeOpacity="0.35" />
          {r > 20 && <><circle cx={x} cy={y - r * 0.22} r={r * 0.2} fill="#ffffff" fillOpacity="0.6" /><path d={`M ${x - r * 0.38} ${y + r * 0.42} a ${r * 0.38} ${r * 0.32} 0 0 1 ${r * 0.76} 0 z`} fill="#ffffff" fillOpacity="0.6" /></>}
        </g>
      ))}
    </svg>
  );
}

const isIt = (w: Workspace) => w.type === 'it';
/** The live left navigation of /support-portal, in its order. IT-only modules show in IT workspaces only (F04). */
const PORTAL_NAV: { seg: string; label: string; icon: typeof Ticket; itOnly?: boolean; on: (s: Record<string, boolean>) => boolean }[] = [
  { seg: 'request', label: 'Requests', icon: Ticket, on: () => true },
  { seg: 'request-service', label: 'Services', icon: ShoppingCart, on: (s) => s.accessCatalog },
  { seg: 'change', label: 'Changes', icon: Repeat, itOnly: true, on: (s) => s.myChanges },
  { seg: 'asset', label: 'My Assets', icon: Laptop, itOnly: true, on: (s) => s.myAssets },
  { seg: 'ci', label: 'My CIs', icon: Server, itOnly: true, on: (s) => s.myCi },
  { seg: 'project', label: 'Projects', icon: Workflow, itOnly: true, on: () => true },
  { seg: 'knowledge', label: 'Knowledge', icon: Lightbulb, on: (s) => s.accessKnowledge },
  { seg: 'my-approval', label: 'My Approvals', icon: UserCheck, on: (s) => s.myApprovals },
  { seg: 'my-tasks', label: 'My Tasks', icon: ListChecks, on: () => true },
];
const navFor = (w: Workspace, s: Record<string, boolean>) => PORTAL_NAV.filter((n) => (!n.itOnly || isIt(w)) && n.on(s));

const ANNOUNCE: Record<Workspace['type'], { m: string; d: string; t: string; by: string }[]> = {
  it: [{ m: 'Nov', d: '05', t: 'VPN maintenance on Saturday', by: 'Keya' }],
  hr: [{ m: 'Nov', d: '03', t: 'Benefits enrolment closes Nov 30', by: 'Priya' }],
  facilities: [{ m: 'Nov', d: '04', t: 'Floor 3 painting this weekend', by: 'Arjun' }],
  finance: [{ m: 'Nov', d: '01', t: 'Expense claims cut-off is the 25th', by: 'Meera' }],
  legal: [], general: [],
};
const ORG_ANNOUNCE = { m: 'Nov', d: '02', t: 'Holiday calendar 2026 published', by: 'Admin' };
const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
const OPEN_TONE: Record<MyRequest['status'], string> = { Open: 'border-[#FDE68A] bg-[#FEF9C3] text-[#CA8A04]', 'In Progress': 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]', Resolved: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]' };

function Widget({ title, count, onOpen, icon, children, className = '' }: { title: string; count?: number; onOpen?: () => void; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-[#E5E7EB] bg-white px-4 pb-3 pt-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
        <span className="flex items-center gap-2 text-[15px] font-medium text-[#1F2937]">{title}{count !== undefined && <span className="rounded bg-[#E5E7EB] px-1.5 text-[12px] text-[#374151]">{count}</span>}</span>
        {icon ?? (onOpen && <button onClick={onOpen} aria-label={`Open ${title}`} className="text-[#64748B] hover:text-[#1F2937]"><ArrowRightToLine size={15} /></button>)}
      </div>
      {children}
    </div>
  );
}
const IdChip = ({ children }: { children: ReactNode }) => <span className="whitespace-nowrap rounded bg-[#E5E7EB] px-2 py-0.5 text-[12px] font-medium text-[#374151]">{children}</span>;
const NoData = () => <div className="flex items-center justify-center gap-1.5 py-8 text-[13px] text-[#64748B]"><Info size={13} /> No Data Found</div>;

/** A team's Support Portal home — today's default /support-portal page, filled with that workspace's data. */
function TeamHome({ w, p, esm, workspaces, me, teams }: { w: Workspace; p: WsPortal; esm: EsmStore; workspaces: Workspace[]; me: Employee; teams: Workspace[] }) {
  const s = p.settings;
  const base = pathOf(p);
  const [q, setQ] = useState('');
  const [done, setDone] = useState<string[]>([]);
  const mine = myRequests(esm, me);
  const own = mine.filter((r) => r.workspaceId === w.id);
  const open = own.filter((r) => r.status !== 'Resolved');
  const approvals = myApprovals(me).filter((r) => r.workspaceId === w.id && !done.includes(r.id));
  const articles = [...articlesOf(w), ...ORG_ARTICLES];
  const hitsHere = searchAll(q, [w], own, workspaces);
  const hitsElse = searchAll(q, teams.filter((x) => x.id !== w.id), mine.filter((r) => r.workspaceId !== w.id), workspaces);
  const announce = [...ANNOUNCE[w.type], ORG_ANNOUNCE];
  const it = isIt(w);
  const cards = [
    { on: s.createIncident, icon: <Ticket size={26} strokeWidth={1.6} />, t: 'New Incident', d: 'Report an incident', to: `${base}/new` },
    { on: s.accessCatalog, icon: <ShoppingCart size={26} strokeWidth={1.6} />, t: 'Request Service', d: 'Browse the services offered', to: `${base}/request-service` },
    { on: s.accessKnowledge, icon: <Lightbulb size={26} strokeWidth={1.6} />, t: 'Knowledge', d: 'Browse knowledge', to: `${base}/knowledge` },
  ].filter((c) => c.on);
  const act = (id: string, what: string) => { setDone((d) => [...d, id]); toast.success(`${id} ${what}`); };
  return (
    <div className="min-h-full bg-[#EEF2F7] pb-6">
      <div className="relative bg-[#0B0B0C] px-6 pb-[86px] pt-[120px] text-center text-white" style={p.colour ? { background: `linear-gradient(135deg, ${p.colour}, #0B0B0C)` } : undefined}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden"><NetworkPattern /></div>
        <h1 className="relative text-[30px] font-bold">{p.greeting || ORG_BRANDING.greeting}</h1>
        <p className="relative mt-3 text-[17px] font-medium text-white/90">Search our support center knowledge base</p>
        <div className="relative mx-auto mt-3 max-w-[386px] text-left">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="How can we help you?" aria-label={`Search ${w.name}`}
            className="h-10 w-full rounded-md border-0 bg-white pl-3 pr-9 text-[14px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF]" />
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#374151]" />
          {q && (
            <div className="absolute left-0 right-0 top-[46px] z-30 max-h-[320px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white p-2 text-[#364658] shadow-xl">
              {hitsHere.length + hitsElse.length === 0 && <div className="px-3 py-4 text-center text-[13px] text-[#94A3B8]">No results.</div>}
              {hitsHere.map((h, i) => <SearchRow key={`h${i}`} h={h} />)}
              {hitsElse.length > 0 && <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Results from other workspaces <span className="ml-1 rounded bg-[#E0F2FE] px-1 normal-case tracking-normal text-[#0369A1]">ESM</span></div>}
              {hitsElse.map((h, i) => <SearchRow key={`e${i}`} h={h} />)}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-10 grid max-w-[920px] gap-4 px-4" style={{ gridTemplateColumns: `repeat(${Math.max(cards.length, 1)}, minmax(0, 1fr))` }}>
        {cards.map((c) => (
          <button key={c.t} onClick={() => go(c.to)} className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-white p-3 text-left transition-shadow hover:shadow-md">
            <span className="flex size-[56px] flex-shrink-0 items-center justify-center rounded-md bg-[#E5E7EB] text-[#1F2937]">{c.icon}</span>
            <span><span className="block text-[17px] font-medium text-[#1F2937]">{c.t}</span><span className="block text-[13px] text-[#4B5563]">{c.d}</span></span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 px-2 lg:grid-cols-[1fr_300px]">
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <Widget title="My Open Requests" count={open.length} onOpen={() => go(`${base}/request`)}>
              {open.length === 0 ? <NoData /> : open.map((r) => (
                <button key={r.id} onClick={() => go(`${base}/request`)} className="flex w-full items-start justify-between gap-2 border-b border-[#E5E7EB] py-3 text-left last:border-0">
                  <span className="min-w-0"><span className="flex items-center gap-2"><IdChip>{r.id}</IdChip><span className="truncate text-[13px] text-[#1F2937]">{r.subject}</span></span><span className="mt-1.5 block text-[12px] text-[#64748B]">{r.at}</span></span>
                  <span className={`mt-1 rounded border px-1.5 py-0.5 text-[12px] ${OPEN_TONE[r.status]}`}>{r.status}</span>
                </button>
              ))}
            </Widget>
            {s.myApprovals && (
              <Widget title="Pending Approvals" count={approvals.length} onOpen={() => go(`${base}/my-approval`)}>
                {approvals.length === 0 ? <NoData /> : approvals.map((r) => (
                  <div key={r.id} className="border-b border-[#E5E7EB] py-3 last:border-0">
                    <div className="flex items-center gap-2"><IdChip>{r.id}: {r.subject.split(':')[0]}</IdChip><span className="truncate text-[13px] text-[#374151]">Approval Required for - {r.id}</span></div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span><span className="block text-[12px] text-[#64748B]">{r.at}</span><span className="mt-1 flex items-center gap-1.5 text-[13px] text-[#1F2937]"><span className="flex size-4 items-center justify-center rounded bg-[#3D8BD0] text-[8px] font-semibold text-white">{initials(r.by)}</span>{r.by}</span></span>
                      <span className="flex gap-1.5">
                        <button onClick={() => act(r.id, 'approved')} aria-label="Approve" className="flex size-6 items-center justify-center rounded bg-[#DCFCE7] text-[#16A34A]"><Check size={13} /></button>
                        <button onClick={() => act(r.id, 'rejected')} aria-label="Reject" className="flex size-6 items-center justify-center rounded bg-[#FEE2E2] text-[#DC2626]"><X size={13} /></button>
                        <button onClick={() => act(r.id, 'referred back')} aria-label="Refer back" className="flex size-6 items-center justify-center rounded bg-[#FEF3C7] text-[#D97706]"><Undo2 size={13} /></button>
                      </span>
                    </div>
                  </div>
                ))}
              </Widget>
            )}
          </div>
          {it && s.myAssets && (
            <Widget title="My Assets" count={4} onOpen={() => go(`${base}/asset`)}>
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {MY_ASSETS.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded border border-[#E5E7EB] bg-gradient-to-br from-[#F3F4F6] to-white p-3">
                    <span className="flex size-10 items-center justify-center rounded bg-white text-[#374151]">{a.type === 'Linux Desktop' ? <Monitor size={20} /> : <RefreshCw size={20} />}</span>
                    <span className="min-w-0"><IdChip>{a.id}</IdChip><span className="mt-1 block truncate text-[13px] text-[#64748B]">{a.type}</span><span className="mt-2 block truncate text-[13px] text-[#1F2937]">{a.name}</span></span>
                  </div>
                ))}
              </div>
            </Widget>
          )}
          {it && s.myCi && (
            <Widget title="My CIs" count={1} onOpen={() => go(`${base}/ci`)}>
              <div className="mt-3 flex items-start gap-3 rounded border border-[#E5E7EB] bg-gradient-to-br from-[#F3F4F6] to-white p-3">
                <span className="flex size-10 items-center justify-center rounded bg-white text-[#374151]"><Monitor size={20} /></span>
                <span><IdChip>CI-215</IdChip><span className="mt-1 block text-[13px] text-[#64748B]">Linux Desktop</span><span className="mt-2 block text-[13px] text-[#1F2937]">motadata</span></span>
              </div>
            </Widget>
          )}
        </div>
        <div className="space-y-2">
          <Widget title="Announcements" icon={<Volume2 size={15} className="text-[#64748B]" />}>
            {announce.map((a) => (
              <div key={a.t} className="flex items-center gap-3 border-b border-[#E5E7EB] py-3 last:border-0">
                <span className="flex w-10 flex-col items-center rounded border border-[#1F2937] py-0.5 leading-tight"><span className="text-[11px] text-[#374151]">{a.m}</span><span className="text-[15px] text-[#1F2937]">{a.d}</span></span>
                <span className="min-w-0"><span className="block truncate text-[13px] text-[#1F2937]">{a.t}</span><span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#374151]"><span className="flex size-4 items-center justify-center rounded bg-[#3D8BD0] text-[8px] font-semibold text-white">{initials(a.by)}</span>{a.by}{a === ORG_ANNOUNCE && <TeamTag small />}</span></span>
              </div>
            ))}
          </Widget>
          {s.accessKnowledge && (
            <Widget title="Most Read" onOpen={() => go(`${base}/knowledge`)}>
              {articles.slice(0, 4).map((a, i) => (
                <button key={a} onClick={() => go(`${base}/knowledge`)} className="flex w-full items-start gap-3 border-b border-[#E5E7EB] py-3 text-left last:border-0">
                  <span className="flex size-10 flex-shrink-0 items-center justify-center rounded bg-[#F3F4F6] text-[#374151]"><Newspaper size={20} /></span>
                  <span className="min-w-0"><span className="flex items-center gap-2"><IdChip>KB-{w.id * 10 + i}</IdChip><span className="truncate text-[13px] text-[#1F2937]">{a}</span></span>
                    <span className="mt-1 flex items-center gap-2 text-[12px] text-[#64748B]">{i >= articlesOf(w).length ? <TeamTag small /> : <span className="rounded bg-[#E5E7EB] px-1.5 text-[#374151]">FAQs</span>}</span></span>
                </button>
              ))}
            </Widget>
          )}
          <Widget title="Contact Us">
            <div className="mt-3 flex items-center gap-2.5 text-[13px] text-[#1F2937]"><Phone size={15} className="text-[#374151]" />{p.contactNo || ORG_BRANDING.contactNo}</div>
            <div className="mt-2.5 flex items-center gap-2.5 text-[13px] text-[#1F2937]"><Mail size={15} className="text-[#374151]" />{p.supportEmail || w.setup.email || ORG_BRANDING.supportEmail}</div>
          </Widget>
        </div>
      </div>
    </div>
  );
}

const MY_ASSETS = [
  { id: 'AST-53', type: 'Linux Desktop', name: 'motadata' },
  { id: 'AST-8', type: 'Consumable Assets', name: 'Headset' },
  { id: 'AST-7', type: 'Consumable Assets', name: 'Keyboard' },
  { id: 'AST-5', type: 'Consumable Assets', name: 'Mouse' },
];

/** The list pages behind the left navigation, in the live list style (title + view ▾, search bar, table). */
function TeamList({ w, p, page, esm, me }: { w: Workspace; p: WsPortal; page: string; esm: EsmStore; me: Employee }) {
  const base = pathOf(p);
  const nav = PORTAL_NAV.find((n) => n.seg === page);
  const own = myRequests(esm, me).filter((r) => r.workspaceId === w.id);
  type Row = { id: string; title: string; c2: string; c3?: ReactNode; go?: () => void };
  let view = 'All', cols = ['Subject', 'Requester', 'Status'], rows: Row[] = [];
  if (page === 'request') { view = 'All Requests'; rows = own.map((r) => ({ id: r.id, title: r.subject, c2: me.name, c3: <span className={`rounded border px-1.5 py-0.5 text-[12px] ${OPEN_TONE[r.status]}`}>{r.status}</span> })); }
  else if (page === 'request-service') { view = 'All Services'; cols = ['Service', 'Category', '']; rows = servicesOf(w).map((x, i) => ({ id: `SRV-${w.id}${i + 1}`, title: x, c2: w.name, c3: <span className="text-[12px] font-medium text-[#3D8BD0]">Request ›</span>, go: () => { window.location.hash = `#/portal/${base}/new?service=${encodeURIComponent(x)}`; } })); }
  else if (page === 'knowledge') { view = 'All Articles'; cols = ['Article', 'Owner', '']; rows = [...articlesOf(w).map((a, i) => ({ id: `KB-${w.id * 10 + i}`, title: a, c2: w.name })), ...ORG_ARTICLES.map((a, i) => ({ id: `KB-${i + 1}`, title: a, c2: 'Organization', c3: <TeamTag small /> }))]; }
  else if (page === 'my-approval') { view = 'Pending Approvals'; cols = ['Subject', 'Requester', '']; rows = myApprovals(me).filter((r) => r.workspaceId === w.id).map((r) => ({ id: r.id, title: `Approval Required for - ${r.id}`, c2: r.by })); }
  else if (page === 'asset') { view = 'My Assets'; cols = ['Asset', 'Asset Type', '']; rows = MY_ASSETS.map((a) => ({ id: a.id, title: a.name, c2: a.type })); }
  else if (page === 'ci') { view = 'My CIs'; cols = ['CI', 'CI Type', '']; rows = [{ id: 'CI-215', title: 'motadata', c2: 'Linux Desktop' }]; }
  else if (page === 'change') { view = 'My Changes'; }
  else if (page === 'project') { view = 'All Projects'; }
  else if (page === 'my-tasks') { view = 'My Open Tasks'; }
  return (
    <div className="min-h-full bg-white px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-4"><span className="text-[17px] font-medium text-[#1F2937]">{nav?.label}</span><span className="inline-flex items-center gap-1.5 text-[17px] text-[#1F2937]">{view}<ChevronDown size={16} /></span></span>
        <span className="flex gap-2 text-[#374151]">{[Download, FileText, RefreshCw, Columns3].map((I, i) => <span key={i} className="flex size-8 items-center justify-center rounded border border-[#E5E7EB]"><I size={15} /></span>)}</span>
      </div>
      <input placeholder="Select field or enter a keyword to search..." className="mt-3 h-8 w-full rounded border border-[#D1D5DB] px-3 text-[13px] outline-none focus:border-[#3D8BD0]" />
      <table className="mt-2 w-full">
        <thead><tr>{cols.map((c) => <th key={c} className="py-2.5 text-left text-[13px] font-normal text-[#64748B]">{c}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={3}><NoData /></td></tr> : rows.map((r) => (
            <tr key={r.id} onClick={r.go} className={`border-t border-[#F0F2F5] ${r.go ? 'cursor-pointer hover:bg-[#F9FAFB]' : ''}`}>
              <td className="py-2.5"><span className="flex items-center gap-2"><IdChip>{r.id}</IdChip><span className="text-[13px] text-[#1F2937]">{r.title}</span></span></td>
              <td className="py-2.5 text-[13px] text-[#374151]">{r.c2}</td>
              <td className="py-2.5">{r.c3}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Create Incident — the live form has no team field: the portal you are on decides the workspace. */
function CreateIncident({ w, p, esm, workspaces, me, onRaise }: { w: Workspace; p: WsPortal; esm: EsmStore; workspaces: Workspace[]; me: Employee; onRaise: (r: MyRequest) => void }) {
  const s = p.settings;
  const [subject, setSubject] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('service') ?? '');
  const [desc, setDesc] = useState('');
  const articles = [...articlesOf(w), ...ORG_ARTICLES];
  void workspaces;
  return (
    <div className="min-h-full bg-white px-4 py-4">
      <div className="flex items-center gap-3"><button onClick={() => go(pathOf(p))} aria-label="Back" className="text-[#374151]"><ArrowLeft size={18} /></button><h1 className="text-[17px] font-medium text-[#1F2937]">Create Incident</h1></div>
      {!s.createIncident ? <p className="mt-4 text-[13px] text-[#B91C1C]">{w.name} doesn’t let requesters create incidents here (Support Portal Setting). Use Request Service instead.</p> : (
        <div className="mt-4 max-w-[760px] space-y-3">
          <label className="block"><span className="mb-1 block text-[13px] text-[#374151]">Requester</span><input readOnly value={me.name} className="h-9 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[13px]" /></label>
          <label className="block"><span className="mb-1 block text-[13px] text-[#374151]">Subject <span className="text-[#DC2626]">*</span></span><input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 w-full rounded border border-[#d1d5db] px-3 text-[13px] focus:border-[#3D8BD0] focus:outline-none" /></label>
          <label className="block"><span className="mb-1 block text-[13px] text-[#374151]">Description</span><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} className="w-full rounded border border-[#d1d5db] px-3 py-2 text-[13px] focus:border-[#3D8BD0] focus:outline-none" /></label>
          {s.suggestKnowledge && subject.length > 2 && (() => { const k = articles.filter((a) => subject.toLowerCase().split(' ').some((t) => t.length > 3 && a.toLowerCase().includes(t))); return k.length > 0 && <div className="rounded bg-[#F5FAFF] px-3 py-2 text-[12px] text-[#364658]">Suggested knowledge: {k.join(' · ')}</div>; })()}
          <p className="text-[12px] text-[#64748B]">Goes to <TeamTag w={w} small /> — you are in this workspace’s section of the portal, so its form and its Support Portal Settings apply.</p>
          <div className="flex gap-2 pt-1">
            <button disabled={!subject.trim()} onClick={() => { const r: MyRequest = { id: `INC-${1100 + esm.raised.length}`, subject: subject.trim(), workspaceId: w.id, status: 'Open', by: me.name, at: '06 November 2026' }; onRaise(r); toast.success(`${r.id} created in ${w.name}`, { description: 'It shows in your one Requests list, tagged with the workspace.' }); go(pathOf(p)); }}
              className="h-8 rounded bg-[#111827] px-4 text-[13px] font-medium text-white disabled:opacity-40" style={p.colour ? { background: p.colour } : undefined}>Create</button>
            <button onClick={() => go(pathOf(p))} className="h-8 rounded border border-[#D1D5DB] px-3 text-[13px] text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchRow({ h }: { h: Hit }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-[#F5F7FA]">
      {h.kind === 'Service' ? <ShoppingCart size={15} className="text-[#64748B]" /> : h.kind === 'Article' ? <BookOpen size={15} className="text-[#64748B]" /> : <Ticket size={15} className="text-[#64748B]" />}
      <span className="min-w-0 flex-1 truncate text-[13px]">{h.ref && <b className="mr-1.5 font-medium text-[#3D8BD0]">{h.ref}</b>}{h.title}</span>
      <TeamTag w={h.team} small />
    </div>
  );
}

// ── ONE list across the portal's workspaces (Requests / My Approvals), Team column + Team filter (F18b) ────────
function AllRequests({ esm, workspaces, me, portal, initialTeam, kind = 'requests' }: { esm: EsmStore; workspaces: Workspace[]; me: Employee; portal: AudiencePortal; initialTeam?: number; kind?: 'requests' | 'approvals' }) {
  const [team, setTeam] = useState<number | 'all'>(initialTeam ?? 'all');
  /* On a portal mapped to specific workspaces the list shows those workspaces' items (Freshservice rule). The Default
     portal maps All, so there the list is complete — including teams the person can no longer open (F02a §9). */
  const mine = (kind === 'approvals' ? myApprovals(me) : myRequests(esm, me)).filter((r) => mapsTo(portal, r.workspaceId));
  const ids = [...new Set(mine.map((r) => r.workspaceId))];
  const rows = team === 'all' ? mine : mine.filter((r) => r.workspaceId === team);
  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">
      <h1 className="text-[20px] font-semibold text-[#1F2D3D]">{kind === 'approvals' ? 'My Approvals' : 'Requests'}</h1>
      <p className="mt-1 text-[13px] text-[#64748B]">{kind === 'approvals' ? `Approvals waiting for ${me.name}` : `Every request ${me.name} raised`}, from every workspace on this portal — one list. Filter by workspace when you need to.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['all', ...ids] as (number | 'all')[]).map((id) => { const w = workspaces.find((x) => x.id === id); return (
          <button key={String(id)} onClick={() => setTeam(id)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] ${team === id ? 'border-[#3D8BD0] bg-[#EBF5FF] font-medium text-[#1F5F99]' : 'border-[#DFE5ED] bg-white text-[#475569]'}`}>
            {w && <span className="size-2 rounded-full" style={{ background: w.colour }} />}{id === 'all' ? `All workspaces (${mine.length})` : `${w?.name} (${mine.filter((r) => r.workspaceId === id).length})`}
          </button>
        ); })}
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <table className="w-full">
          <thead className="border-b border-[#E5E7EB]"><tr>{['ID', 'Subject', 'Workspace', 'Status', 'Raised'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658]">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {rows.map((r) => { const w = workspaces.find((x) => x.id === r.workspaceId); const closed = w && !portalVerdict(w, me).ok; return (
              <tr key={r.id}>
                <td className="px-4 py-3 text-[13px] font-medium text-[#3D8BD0]">{r.id}</td>
                <td className="px-4 py-3 text-[13px] text-[#364658]">{r.subject}{closed && <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-[#94A3B8]" title={`${w!.name}'s portal isn't open to ${me.name} now; they can still read and reply to their own request.`}><Lock size={11} /> read & reply only</span>}</td>
                <td className="px-4 py-3"><TeamTag w={w} small /></td>
                <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-[13px] text-[#64748B]">{r.at}</td>
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Services / Knowledge at portal level: every team on this portal, grouped by team. The ITEM's workspace decides where
   the request goes (verified in Freshservice); a team whose Support Portal Setting switches the module off is left out. */
function GroupedPage({ esm, teams, page }: { esm: EsmStore; teams: Workspace[]; page: 'request-service' | 'knowledge' }) {
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const key = page === 'request-service' ? 'accessCatalog' : 'accessKnowledge';
  const shown = teams.filter((w) => wsPortalOf(esm, w).settings[key]);
  const off = teams.filter((w) => !wsPortalOf(esm, w).settings[key]);
  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">
      <h1 className="text-[20px] font-semibold text-[#1F2D3D]">{page === 'request-service' ? 'Services' : 'Knowledge'}</h1>
      <p className="mt-1 text-[13px] text-[#64748B]">{page === 'request-service' ? 'Every workspace’s services in one catalog. Pick one — it goes to the workspace that owns it.' : 'Articles from every workspace, plus Organization articles.'}</p>
      <div className="relative mt-4 max-w-[420px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-full rounded border border-[#D1D5DB] pl-8 pr-3 text-[13px] outline-none focus:border-[#3D8BD0]" /></div>
      {shown.map((w) => {
        const items = (page === 'request-service' ? servicesOf(w) : articlesOf(w)).filter((x) => !t || x.toLowerCase().includes(t));
        if (!items.length) return null;
        return (
          <section key={w.id} className="mt-6">
            <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#1F2D3D]"><span className="size-2.5 rounded-full" style={{ background: w.colour }} />{w.name}<span className="text-[12px] font-normal text-[#94A3B8]">{items.length}</span></h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((x) => (
                <button key={x} onClick={() => { if (page === 'request-service') window.location.hash = `#/portal/${pathOf(wsPortalOf(esm, w))}/new?service=${encodeURIComponent(x)}`; else toast.success(`Opens “${x}”`); }}
                  className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-white p-3 text-left hover:shadow-md">
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded bg-[#F3F4F6] text-[#374151]">{page === 'request-service' ? <ShoppingCart size={17} /> : <Newspaper size={17} />}</span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-[#1F2937]">{x}</span><span className="block text-[12px] text-[#64748B]">{w.name}</span></span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
      {page === 'knowledge' && ORG_ARTICLES.some((x) => !t || x.toLowerCase().includes(t)) && (
        <section className="mt-6"><h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#1F2D3D]">Organization</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{ORG_ARTICLES.filter((x) => !t || x.toLowerCase().includes(t)).map((x) => <div key={x} className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-white p-3 text-[13px] text-[#1F2937]"><Newspaper size={17} className="text-[#374151]" />{x}</div>)}</div></section>
      )}
      {off.length > 0 && <p className="mt-6 text-[12px] text-[#94A3B8]">Not offered here by {off.map((w) => w.name).join(', ')} (that workspace’s Support Portal Setting).</p>}
    </div>
  );
}

// ── Switching between the Technician Portal and the Support Portal (live: avatar menu) ─────────────────────
function backToTechnician(fallback: () => void) {
  let to: string | null = null;
  try { to = window.sessionStorage.getItem(RETURN_KEY); } catch { /* */ }
  if (to && !to.startsWith('#/portal')) window.location.hash = to; else fallback();
}

function HeaderIcon({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return <button onClick={onClick ?? (() => toast(label))} title={label} aria-label={label} className="flex size-8 items-center justify-center rounded text-[#374151] hover:bg-[#F3F4F6]">{children}</button>;
}


// ── Page shell: the live Support Portal header + left navigation, plus the team switcher (F18b) ─────────────
/* F18b (Juli, 2026-11-18). A SUPPORT PORTAL is an audience (its URL, who can sign in, which workspaces it maps).
 * Inside it, each mapped workspace is a SECTION reached from its team card (/portal/<team>): that team's home, form
 * and Support Portal Settings (what requesters may do there). Requests / My Approvals are ONE list across the
 * portal's teams with a Team filter. One team on the portal → no cards, today's portal exactly. */
const PORTAL_KEY = 'serviceops.esm.portalId';
const readPortal = () => { try { return window.localStorage.getItem(PORTAL_KEY) ?? 'SPP-1'; } catch { return 'SPP-1'; } };
const LEVEL = ['request', 'request-service', 'knowledge', 'my-approval', 'my-tasks', 'change', 'asset', 'ci', 'project'];

export function EsmPortalPage({ sub, onExit }: { sub?: string; onExit: () => void }) {
  const [viewer, setViewer] = useState(readViewer);
  const [portalId, setPortalId] = useState(readPortal);
  const [esm, setEsm] = useState<EsmStore>(loadEsm);
  const [menu, setMenu] = useState<'team' | 'plus' | 'me' | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [why, setWhy] = useState<{ seg: string; text: string } | null>(null);
  const workspaces = useMemo(() => loadStore().workspaces, []);
  const me = EMPLOYEES.find((e) => e.name === viewer) ?? EMPLOYEES[0];
  const portals = portalsOf(esm);
  const portal = portals.find((p) => p.id === portalId) ?? portals[0];
  const cfg = esm.published;
  const signedIn = canSignIn(portal, me);
  const teams = orderTeams(teamsOn(portal, workspaces, me), cfg.order);
  const [seg, mode] = (sub ?? '').split('?')[0].split('/');
  const portalFor = (s: string) => workspaces.find((w) => pathOf(wsPortalOf(esm, w)) === s);
  const movedFrom = seg ? workspaces.find((w) => !portalFor(seg) && (wsPortalOf(esm, w).oldSlugs ?? []).includes(seg)) : undefined;
  useEffect(() => {
    if (!movedFrom) return;
    const t = window.setTimeout(() => go(`${pathOf(wsPortalOf(esm, movedFrom))}${mode ? `/${mode}` : ''}`), 0);
    return () => window.clearTimeout(t);
  }, [movedFrom?.id, seg]); // eslint-disable-line react-hooks/exhaustive-deps
  const isLevel = LEVEL.includes(seg);
  const team = seg && seg !== 'home' && !isLevel ? portalFor(seg) : undefined;
  const update = (fn: (s: EsmStore) => EsmStore) => setEsm((s) => { const n = fn(s); saveEsm(n); return n; });
  const prev = useRef(`${viewer}|${portalId}`);

  // The portal address: one team on it → that team's section; otherwise the portal home with the team cards.
  useEffect(() => {
    if (seg) return;
    const t = window.setTimeout(() => {
      if (teams.length === 1) { const p = wsPortalOf(esm, teams[0]); setWhy({ seg: pathOf(p), text: `${me.name} sees only ${teams[0].name} on ${portal.name}, so there are no workspace cards — today’s portal.` }); go(pathOf(p)); }
      else { setWhy(null); go('home'); }
    }, 0);
    return () => window.clearTimeout(t);
  }, [seg, viewer, portalId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = `${viewer}|${portalId}`; if (prev.current !== k) { prev.current = k; window.setTimeout(() => go(''), 0); } }, [viewer, portalId]);
  useEffect(() => { setMenu(null); }, [sub]);

  const blocked = signedIn && seg && seg !== 'home' && !isLevel && !movedFrom && (!team || !portalVerdict(team, me).ok || !mapsTo(portal, team.id));
  const cur = team && !blocked ? wsPortalOf(esm, team) : undefined;
  const showHome = teams.length > 1;
  const it = teams.find(isIt);
  const itSet = it ? wsPortalOf(esm, it).settings : undefined;
  /* Left nav. In a team's section: that team's Support Portal Settings. At portal level: a module shows when at least
     one team on the portal offers it (Changes / Assets / CIs / Projects come from the IT workspace). */
  const nav = cur && team ? navFor(team, cur.settings)
    : PORTAL_NAV.filter((n) => (n.itOnly ? !!itSet && n.on(itSet) : teams.some((w) => n.on(wsPortalOf(esm, w).settings))));
  const navTo = (s: string) => go(team && cur ? `${pathOf(cur)}/${s}` : s);
  const toTech = () => backToTechnician(onExit);
  const onRaise = (r: MyRequest) => update((s) => ({ ...s, raised: [r, ...s.raised] }));
  const incidentTeams = teams.filter((w) => wsPortalOf(esm, w).settings.createIncident);

  let body: ReactNode;
  if (!signedIn) {
    body = (
      <div className="flex min-h-full flex-col items-center justify-center bg-white px-6 py-16 text-center">
        <MotadataLogo />
        <Lock size={28} className="mt-8 text-[#94A3B8]" />
        <h1 className="mt-3 text-[20px] font-semibold text-[#1F2937]">You can’t sign in to {portal.name}</h1>
        <p className="mt-2 max-w-[440px] text-[13px] text-[#64748B]">This portal is for {signInLabel(portal).replace('Only ', '')}. Use your organisation’s Support Portal instead.</p>
        <p className="mt-6 text-[12px] text-[#94A3B8]">Prototype: {portal.url} · Who can sign in = {signInLabel(portal)}</p>
      </div>
    );
  } else if (blocked) {
    body = (
      <div className="flex min-h-full flex-col items-center justify-center bg-white px-6 py-16 text-center" style={{ backgroundImage: 'linear-gradient(#F3F4F6 1px, transparent 1px), linear-gradient(90deg, #F3F4F6 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
        <MotadataLogo />
        <div className="mt-8 text-[88px] font-black leading-none tracking-tight text-[#111827]">404</div>
        <span className="mt-5 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 text-[10px] font-semibold tracking-[0.15em] text-[#6B7280]">PAGE NOT FOUND</span>
        <h1 className="mt-4 text-[22px] font-semibold text-[#1F2937]">You've reached the edge</h1>
        <p className="mt-3 max-w-[420px] text-[13px] text-[#374151]">This route doesn't exist in our system. The page may have been removed or the link is incorrect.</p>
        <button onClick={() => go('')} className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-md bg-[#111827] px-4 text-[13px] font-medium text-white"><Home size={14} /> Return to Home</button>
        <p className="mt-6 text-[12px] text-[#94A3B8]">Prototype: {team ? (!mapsTo(portal, team.id) ? `${team.name} is not mapped to ${portal.name}.` : portalVerdict(team, me).why) : 'no workspace has this address.'}</p>
      </div>
    );
  } else if (seg === 'request' || seg === 'my-approval') body = <AllRequests key={seg} esm={esm} workspaces={workspaces} me={me} portal={portal} kind={seg === 'my-approval' ? 'approvals' : 'requests'} />;
  else if (seg === 'request-service' || seg === 'knowledge') body = <GroupedPage key={seg} esm={esm} teams={teams} page={seg} />;
  else if (isLevel && it) body = <TeamList key={seg} w={it} p={wsPortalOf(esm, it)} page={seg} esm={esm} me={me} />;
  else if (team && cur) {
    body = mode === 'new' ? <CreateIncident key={team.id + sub} w={team} p={cur} esm={esm} workspaces={workspaces} me={me} onRaise={onRaise} />
      : mode === 'request' || mode === 'my-approval' ? <AllRequests key={team.id + mode} esm={esm} workspaces={workspaces} me={me} portal={portal} initialTeam={team.id} kind={mode === 'my-approval' ? 'approvals' : 'requests'} />
        : mode && PORTAL_NAV.some((n) => n.seg === mode) ? <TeamList key={team.id + mode} w={team} p={cur} page={mode} esm={esm} me={me} />
          : <TeamHome key={team.id} w={team} p={cur} esm={esm} workspaces={workspaces} me={me} teams={teams} />;
  } else if (seg === 'home') body = (
    <EsmLanding cfg={cfg} esm={esm} workspaces={workspaces} me={me} portal={portal}
      onOpenTeam={(w, x) => go(`${pathOf(wsPortalOf(esm, w))}${x ? `/${x}` : ''}`)}
      onRequests={() => go('request')}
      onSearchHit={(h) => { if (h.kind === 'My request') go('request'); else if (h.team && h.kind === 'Service') window.location.hash = `#/portal/${pathOf(wsPortalOf(esm, h.team))}/new?service=${encodeURIComponent(h.title)}`; else if (h.team) go(pathOf(wsPortalOf(esm, h.team))); else toast.success(`Opens “${h.title}”`); }} />
  );
  else body = null;

  const dd = 'absolute top-10 z-40 rounded-md border border-[#E5E7EB] bg-white p-1.5 shadow-xl';
  const ddItem = 'flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-[13px] text-[#1F2937] hover:bg-[#F3F4F6]';
  const showNav = signedIn && !blocked;
  return (
    <div className="flex h-screen flex-col bg-[#EEF2F7]" onClick={() => menu && setMenu(null)}>
      <div className="flex h-10 flex-shrink-0 items-center gap-3 border-b border-[#FDE68A] bg-[#FFFBEB] px-4 text-[12px] text-[#92400E]">
        <FlaskConical size={14} /> <span className="font-medium">Prototype</span>
        <span className="text-[#B45309]">Portal</span>
        <select value={portal.id} onChange={(e) => { setPortalId(e.target.value); try { window.localStorage.setItem(PORTAL_KEY, e.target.value); } catch { /* */ } }} aria-label="Support Portal" className="h-7 max-w-[260px] rounded border border-[#FCD34D] bg-white px-2 text-[12px] text-[#364658]">
          {portals.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.url} · {workspacesLabel(p, workspaces)}</option>)}
        </select>
        <span className="text-[#B45309]">View as</span>
        <select value={viewer} onChange={(e) => { setViewer(e.target.value); try { window.localStorage.setItem(VIEWER_KEY, e.target.value); } catch { /* */ } }} aria-label="View as employee" className="h-7 rounded border border-[#FCD34D] bg-white px-2 text-[12px] text-[#364658]">
          {EMPLOYEES.map((e) => <option key={e.name} value={e.name}>{e.name} · {e.type}, {e.location}{e.director ? ', Director' : ''}{e.leaver ? ', Leaver' : ''}</option>)}
        </select>
        <span className="text-[#B45309]">{signedIn ? `sees ${teams.length} workspace${teams.length === 1 ? '' : 's'}` : 'can’t sign in here'}</span>
        {why && why.seg === seg && !mode && <span className="truncate rounded bg-white/70 px-2 py-0.5 text-[#92400E]">↪ {why.text}</span>}
        <span className="ml-auto truncate text-[#B45309]">{portal.url}{cur && cur.slug ? `/${cur.slug}` : ''}</span>
      </div>

      {/* Live header: collapse · logo · [ESM: team switcher] … Ask AI · + · A · My Chats · Notifications · Shortcuts · Go To Home · Help · avatar */}
      <header className="relative z-30 flex h-[50px] flex-shrink-0 items-center gap-3 border-b border-[#E5E7EB] bg-white pl-3 pr-3">
        {showNav && <button onClick={() => setNavOpen((o) => !o)} title={navOpen ? 'Collapse' : 'Expand'} aria-label={navOpen ? 'Collapse' : 'Expand'} className="text-[#374151]"><PanelLeft size={17} /></button>}
        <button onClick={() => go('')} aria-label="Logo" className="scale-[1.12] origin-left"><MotadataLogo /></button>
        {showHome && showNav && (
          <div className="relative ml-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMenu(menu === 'team' ? null : 'team')} className="inline-flex h-8 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[13px] text-[#1F2937] hover:bg-[#F9FAFB]">
              {team ? <><span className="size-2 rounded-full" style={{ background: team.colour }} />{team.name}</> : <><LayoutGrid size={14} /> All workspaces</>}
              <ChevronDown size={14} className="text-[#6B7280]" />
            </button>
            {menu === 'team' && (
              <div className={`${dd} left-0 w-[250px]`}>
                <button onClick={() => go('home')} className={ddItem}><LayoutGrid size={14} className="text-[#6B7280]" /><span className="flex-1">All workspaces</span>{!team && <Check size={13} className="text-[#3D8BD0]" />}</button>
                <div className="my-1 border-t border-[#F0F2F5]" />
                <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Workspaces on this portal</div>
                {teams.map((w) => (
                  <button key={w.id} onClick={() => go(pathOf(wsPortalOf(esm, w)))} className={ddItem}>
                    <span className="size-2 rounded-full" style={{ background: w.colour }} /><span className="flex-1">{w.name}</span>{team?.id === w.id && <Check size={13} className="text-[#3D8BD0]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => toast('Ask AI')} className="mr-1 inline-flex h-8 items-center gap-1.5 rounded-md border border-[#C084FC] px-3 text-[13px] text-[#1F2937]"><Sparkles size={14} className="text-[#9333EA]" /> Ask AI</button>
          {showNav && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setMenu(menu === 'plus' ? null : 'plus')} aria-label="Create" className="mr-1 flex size-8 items-center justify-center rounded-md bg-[#111827] text-white"><Plus size={17} /></button>
              {menu === 'plus' && (
                <div className={`${dd} right-0 w-[240px]`}>
                  {team && cur ? <>
                    {cur.settings.createIncident && <button onClick={() => go(`${pathOf(cur)}/new`)} className={ddItem}><Ticket size={14} /> Create Incident</button>}
                    {cur.settings.accessCatalog && <button onClick={() => go(`${pathOf(cur)}/request-service`)} className={ddItem}><GitPullRequestArrow size={14} /> Request Service</button>}
                    {isIt(team) && <button onClick={() => toast('Create Project')} className={ddItem}><Workflow size={14} /> Create Project</button>}
                    {!cur.settings.createIncident && !cur.settings.accessCatalog && <p className="px-2.5 py-1.5 text-[12px] text-[#94A3B8]">{team.name} offers nothing to create here.</p>}
                  </> : <>
                    {incidentTeams.length > 0 && <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Create Incident in</div>}
                    {incidentTeams.map((w) => <button key={w.id} onClick={() => go(`${pathOf(wsPortalOf(esm, w))}/new`)} className={ddItem}><span className="size-2 rounded-full" style={{ background: w.colour }} />{w.name}</button>)}
                    {teams.some((w) => wsPortalOf(esm, w).settings.accessCatalog) && <><div className="my-1 border-t border-[#F0F2F5]" /><button onClick={() => go('request-service')} className={ddItem}><GitPullRequestArrow size={14} /> Request Service</button></>}
                    {it && <button onClick={() => toast('Create Project')} className={ddItem}><Workflow size={14} /> Create Project</button>}
                  </>}
                </div>
              )}
            </div>
          )}
          <HeaderIcon label="Font size"><Type size={16} /></HeaderIcon>
          <HeaderIcon label="My Chats"><MessagesSquare size={16} /></HeaderIcon>
          <HeaderIcon label="Notifications"><Bell size={16} /></HeaderIcon>
          <HeaderIcon label="View Available Keyboard Shortcuts"><Keyboard size={16} /></HeaderIcon>
          <HeaderIcon label="Go To Home" onClick={() => go(cur ? pathOf(cur) : '')}><Home size={16} /></HeaderIcon>
          <HeaderIcon label="Help"><Info size={16} /></HeaderIcon>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMenu(menu === 'me' ? null : 'me')} aria-label="User menu" className="ml-1 flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-[12px] font-semibold text-white">{initials(me.name)}</button>
            {menu === 'me' && (
              <div className={`${dd} right-0 w-[236px] bg-[#F8FAFC] p-2`}>
                <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] px-1.5 pb-2.5 pt-1"><span className="flex size-9 items-center justify-center rounded bg-[#3D8BD0] text-[13px] font-semibold text-white">{initials(me.name)}</span><span><span className="block text-[14px] font-medium text-[#1F2937]">{me.name}</span><span className="block text-[12px] text-[#64748B]">{me.name.split(' ')[0].toLowerCase()}</span></span></div>
                <button onClick={() => toast('My Profile')} className={`${ddItem} mt-1.5`}><UserIcon size={14} /> My Profile</button>
                <div className="my-1.5 border-t border-[#E5E7EB]" />
                <button onClick={toTech} className={ddItem}><UserCog size={14} /> View Technician Portal</button>
                <div className="my-1.5 border-t border-[#E5E7EB]" />
                <div className="mx-auto flex w-fit gap-1 rounded-md bg-[#E5E7EB] p-1 text-[13px]"><span className="inline-flex items-center gap-1 rounded bg-[#111827] px-2.5 py-0.5 text-white"><Sun size={13} /> Light</span><span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[#6B7280]"><Moon size={13} /> Dark</span></div>
                <div className="my-1.5 border-t border-[#E5E7EB]" />
                <button onClick={() => toast('Prototype: sign-out is not wired')} className={`${ddItem} text-[#DC2626]`}><LogOut size={14} /> Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {showNav && (
          <nav className={`flex flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-white py-1.5 ${navOpen ? 'w-[170px]' : 'w-[54px]'}`} aria-label="Support Portal">
            {nav.map((n) => { const on = (team ? mode : seg) === n.seg; const I = n.icon; return (
              <button key={n.seg} onClick={() => navTo(n.seg)} title={n.label} className={`mx-1.5 my-0.5 flex h-[38px] items-center gap-3 rounded-md px-[11px] text-[14px] ${on ? 'bg-[#111827] text-white' : 'text-[#1F2937] hover:bg-[#F3F4F6]'}`}>
                <I size={17} className="flex-shrink-0" />{navOpen && <span className="truncate">{n.label}</span>}
              </button>
            ); })}
            <div className="mt-auto flex items-center gap-2 px-3.5 pb-2 text-[17px] font-semibold text-[#111827]"><span className="size-6 flex-shrink-0 rounded-full border-[5px] border-[#111827] border-r-[#F97316]" />{navOpen && 'ServiceOps'}</div>
          </nav>
        )}
        <div className="relative min-h-0 flex-1 overflow-y-auto">{body}</div>
      </div>
      {showNav && <button onClick={() => toast('Virtual agent')} aria-label="Chat" className="fixed bottom-5 right-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#111827] text-white shadow-lg"><MessageSquare size={20} /></button>}
    </div>
  );
}
