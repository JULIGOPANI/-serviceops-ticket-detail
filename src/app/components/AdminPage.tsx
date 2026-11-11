import { AdminEsmPortalModule } from './AdminEsmPortalModule';
import { useEffect, useRef, useState } from 'react';
import { adminRouteBySlug, adminSlugFor } from '../routes';
import { Header } from './Header';
import { AdminSidebar } from './AdminSidebar';
import { AdminOverview } from './AdminOverview';
import { ADMIN_SECTIONS, sectionByTitle } from './adminData';
import { permissionFor } from './rolesData';
import { AdminBomModule } from './AdminBomModule';
import type { BomAdminScreen } from './AdminBomModule';
import { AdminOsUpgradeModule } from './AdminOsUpgradeModule';
import { AdminSupportPortalModule } from './AdminSupportPortalModule';
import { AdminWorkspaceModule } from './AdminWorkspaceModule';
import { AdminTechniciansModule } from './AdminTechniciansModule';
import { AdminRolesModule } from './AdminRolesModule';
import { BusinessHoursScreen, SlaScreen } from './AdminScopedSettings';
import { ScopedPage } from './AdminScopedPages';
import { scopedCardFor, scopedCardBySlug } from './scopedCards';
import { accessOf, canAdminister, isWorkspaceAdmin, loadStore, membershipsOf, orgCan, orgView, personaInfo, saveStore, scopeLabel, sortWorkspaces } from './workspaceData';
import type { ViewAs } from './workspaceData';
import { Building2, Lock, Settings2 } from 'lucide-react';
import { settingsPath } from './workspaceAdmin';
import { actionPath } from './workspaceAdmin';

/** Sections that have a real module behind them rather than only a card grid. Selecting one in
 *  the sidebar opens that module; everything else still scrolls the Overview. */
const MODULE_TITLES = ['BOM Management'];

/** Which screen each level-2 nav item opens. The nav, the Overview cards and the module's own
 *  landing all route through this one map, so they can never disagree about where a card goes. */
const BOM_SCREEN_FOR: Record<string, BomAdminScreen> = {
  'BOM Licensing': 'licensing',
  'BOM Scheduler': 'scheduler',
  'BOM Retention': 'retention',
};

/** Level-2 cards that own a module even though their SECTION doesn't, keyed "<section>/<card>".
 *  Patch Management is still a card grid — OS Upgrade is the one entry with a real screen behind
 *  it, so only that row swaps the pane. */
const CARD_MODULES: Record<string, string> = {
  'Patch Management/OS Upgrade': 'OS Upgrade',
  /* ⚠️ Support Channels, not Organization. The portal's settings already lived here, so putting its
     customization anywhere else meant two homes for one subject. The card that used to open this
     from Organization is gone rather than left as a second door. */
  'Support Channels/Support Portal': 'Support Portal',
  // ESM F18 — the ESM Portal (landing page with a card per team).
  'Support Channels/ESM Portal': 'ESM Portal',
  // ESM F01 — the one Organization card with a real screen behind it.
  'Organization/Workspaces': 'Workspaces',
  // ESM F02/F03 — technician accounts and their access in every workspace.
  'Users/Technicians': 'Technicians',
  // ESM F03 — roles defined once, given per workspace or at Organization level.
  'Users/Roles': 'Roles',
  // ESM F04 — Business Hours and SLA: the organization's records here, a workspace's in its settings (rev. 2).
  'Organization/Business Hours': 'Business Hours',
  'Automation/SLA': 'SLA',
};

/* Admin hub — the settings surface. Its own shell: the product's left icon rail is replaced by a
 * grouped settings nav, with "Back to app" as the way out.
 *
 * The sidebar and the Overview share one section list, and selecting in the sidebar scrolls the
 * Overview rather than swapping the pane — the whole point of a hub is that it is one surface. */

interface AdminPageProps {
  onNavigate: (page: string) => void;
  /** Module slug from the URL (#/admin/<slug>), or undefined for the Overview. */
  moduleSlug?: string;
  /** Reports where the admin navigated itself, so the address bar follows the pane. */
  onModuleChange?: (slug: string | undefined) => void;
  /** Which portal is open inside the Support Portal module, and a way to report a change back. */
  portalSlug?: string;
  onPortalChange?: (slug: string | undefined) => void;
  /** Which Workspaces screen is open ('create', '<id>', '<id>/edit', or undefined for the list). */
  workspacePath?: string;
  onWorkspaceChange?: (path: string | undefined) => void;
  /** Which Technicians screen is open ('create', '<id>', or undefined for the list). */
  technicianPath?: string;
  onTechnicianChange?: (path: string | undefined) => void;
  /** Which Roles screen is open ('create', '<id>', 'clone-<id>', or undefined for the list). */
  rolePath?: string;
  onRoleChange?: (path: string | undefined) => void;
}

export function AdminPage({ onNavigate, moduleSlug, onModuleChange, portalSlug, onPortalChange, workspacePath, onWorkspaceChange, technicianPath, onTechnicianChange, rolePath, onRoleChange }: AdminPageProps) {
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  // Only the first section starts open, mirroring the live admin.
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set([ADMIN_SECTIONS[0].key]));
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** Title of the module currently open, or null for the Overview. */
  const [module, setModule] = useState<string | null>(null);
  const [bomScreen, setBomScreen] = useState<BomAdminScreen>('landing');
  /** The portal builder is a canvas — it takes the whole screen, so the admin shell stands down. */
  const [builderOpen, setBuilderOpen] = useState(false);

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  /** Level-2 module inside the active section, when one is selected. Drives the nav highlight. */
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const applySelect = (title: string, card?: string) => {
    // F04: every per-workspace card opens its ServiceOps page (organization records with two or more workspaces).
    const scoped = card ? scopedCardFor(title, card) : undefined;
    const cardModule = card ? CARD_MODULES[`${title}/${card}`] ?? (scoped ? `scoped:${scoped.slug}` : undefined) : undefined;
    // A nav row that opens nothing must not stay highlighted while the Overview shows behind it.
    const opensSomething = !!cardModule || (!!card && MODULE_TITLES.includes(title));
    setActive(title);
    setActiveCard(opensSomething ? card! : null);

    if (cardModule) {
      setModule(cardModule);
      return;
    }

    // A level-2 module opens its listing on the right. Level 1 only expands the branch, which
    // the sidebar handles on its own — it never reaches here for a tree section.
    if (card && MODULE_TITLES.includes(title)) {
      setModule(title);
      setBomScreen(BOM_SCREEN_FOR[card] ?? 'landing');
      return;
    }
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

  /* The slug this shell last put in the URL. Without it the address bar's answer comes straight
     back down as `moduleSlug` and re-runs the selection on every render. */
  const pushedRef = useRef<string | undefined>(undefined);

  /** Everything the user clicks goes through here, so the URL can never lag behind the pane. */
  const select = (title: string, card?: string) => {
    applySelect(title, card);
    const slug = adminSlugFor(title, card);
    pushedRef.current = slug;
    onModuleChange?.(slug);
  };

  /* Deep link → open that module on arrival, and follow browser back/forward within admin.
     A slug with no screen behind it is already filtered out by routes.ts, so this only ever
     resolves to something real. */
  useEffect(() => {
    if (moduleSlug === pushedRef.current) return;
    pushedRef.current = moduleSlug;
    const r = moduleSlug ? adminRouteBySlug(moduleSlug) : undefined;
    if (r) { applySelect(r.section, r.card); return; }
    setModule(null);
    setActive('Overview');
    setActiveCard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSlug]);

  /* Prototype "View as" (sidebar). Switching remounts the pane so every module re-reads who is signed in, then lands
     where that person can work: Organization settings for an Organization Admin, else their first workspace. */
  const [personaRev, setPersonaRev] = useState(0);
  const viewAs = loadStore().viewAs;
  const orgViewer = orgView(viewAs);
  const switchPersona = (v: ViewAs) => {
    const s = loadStore();
    saveStore({ ...s, viewAs: v });
    setPersonaRev((n) => n + 1);
    const first = sortWorkspaces(s.workspaces).find((w) => orgView(v) ? false : canAdminister(v, w));
    if (first) { setModule('Workspaces'); onWorkspaceChange?.(settingsPath(first.id)); } else select('Overview');
  };
  // Organization settings are for Organization Admins. Others reach only their workspaces (Workspaces module gates itself).
  // F03e: a section opens only if one of its cards' tick boxes counts at Organization level for this person.
  const sectionAllowed = (title: string) => { const sec = ADMIN_SECTIONS.find((x) => x.title === title); return !sec || sec.cards.some((c) => orgCan(viewAs, title, c.title)); };
  const blocked = (!orgViewer && module !== 'Workspaces') || (module !== 'Workspaces' && module !== 'Overview' && !sectionAllowed(module) && !sectionAllowed(active)) || (module !== 'Workspaces' && !!activeCard && !orgCan(viewAs, active, activeCard));

  return (
    <div className="flex h-screen flex-col bg-[#F7F9FC]">
      {/* The product header STAYS while the builder is open — the logo, global search and the
          account menu are the app, not the admin section, and losing them made the builder feel
          like a different product. Only the admin sidebar gives way: a canvas competing with a
          second navigation has nowhere to be. */}
      <Header selectedCount={0} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!builderOpen && (
          <AdminSidebar
            active={active}
            activeCard={activeCard}
            onSelect={select}
            onBackToApp={() => onNavigate('request')}
            /* Only `<id>/settings…` is INSIDE a workspace. `<id>` is its record page, which belongs to
               Organization › Workspaces and keeps the global menu (Juli, 2026-10-27). */
            currentWorkspaceId={module === 'Workspaces' && workspacePath && /^\d+\/settings(\/|$)/.test(workspacePath) ? Number(workspacePath.split('/')[0]) : undefined}
            onAllSettings={() => select('Overview')}
            onWorkspace={(p) => onWorkspaceChange?.(p)}
            workspacePath={module === 'Workspaces' ? workspacePath : undefined}
            onPersona={switchPersona}
          />
        )}
        <div key={personaRev} data-admin-scroll className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {blocked ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              {orgViewer ? (
                /* Has some Organization settings, just not this page (F03e). */
                <div className="mx-auto max-w-[640px] px-6 py-12 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]"><Lock size={22} /></span>
                  <h1 className="mt-3 text-[18px] font-semibold text-[#1F2D3D]">You don’t have permission to view this page</h1>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#64748B]">It needs <b className="font-medium text-[#364658]">Admin › Global › {permissionFor(active, activeCard ?? undefined) ?? 'Super Admin'}</b> in one of their roles. Ask someone who manages roles.</p>
                  <button onClick={() => select('Overview')} className="mt-4 inline-flex h-9 items-center rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">Go to what I can manage</button>
                </div>
              ) : <NoOrganizationAccess viewAs={viewAs} onOpen={(id) => { setModule('Workspaces'); onWorkspaceChange?.(settingsPath(id)); }} />}
            </div>
          ) : module === 'BOM Management' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC]">
              {/* The module's own navigation (its landing cards, its breadcrumb) reports back so
                  the nav highlight follows — the sidebar must never say you are somewhere you
                  have already navigated away from. */}
              <AdminBomModule
                screen={bomScreen}
                onScreen={(s) => {
                  setBomScreen(s);
                  const card = Object.keys(BOM_SCREEN_FOR).find((k) => BOM_SCREEN_FOR[k] === s);
                  setActiveCard(card ?? null);
                  const slug = adminSlugFor('BOM Management', card);
                  pushedRef.current = slug;
                  onModuleChange?.(slug);
                }}
              />
            </div>
          ) : module === 'OS Upgrade' ? (
            /* White, not the hub's grey: an admin LISTING is the same surface as a technician
               portal list page — head, search, then a full-bleed table with no card around it. */
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminOsUpgradeModule />
            </div>
          ) : module === 'Workspaces' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminWorkspaceModule
                path={workspacePath}
                onPath={(p) => onWorkspaceChange?.(p)}
                onBackToApp={() => onNavigate('request')}
              />
            </div>
          ) : module === 'Technicians' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminTechniciansModule path={technicianPath} onPath={(p) => onTechnicianChange?.(p)} onBackToApp={() => onNavigate('request')} />
            </div>
          ) : module === 'Roles' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminRolesModule path={rolePath} onPath={(p) => onRoleChange?.(p)} onBackToApp={() => onNavigate('request')} />
            </div>
          ) : module?.startsWith('scoped:') && scopedCardBySlug(module.slice(7)) ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <ScopedPage key={module} card={scopedCardBySlug(module.slice(7))!} workspaces={sortWorkspaces(loadStore().workspaces)}
                /* Organization admin → switch into the workspace on the same page (F04 rev. 2, Q1). */
                onOpenInWorkspace={(id, slug) => onWorkspaceChange?.(actionPath(id, `p:${slug}`))} />
            </div>
          ) : module === 'Business Hours' || module === 'SLA' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              {module === 'SLA'
                ? <SlaScreen workspaces={sortWorkspaces(loadStore().workspaces)} />
                : <BusinessHoursScreen workspaces={sortWorkspaces(loadStore().workspaces)} />}
            </div>
          ) : module === 'ESM Portal' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminEsmPortalModule viewAs={loadStore().viewAs} onOpenWorkspace={(path) => onWorkspaceChange?.(path)} />
            </div>
          ) : module === 'Support Portal' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminSupportPortalModule
                onBuilder={setBuilderOpen}
                openPortal={portalSlug}
                onOpenPortalChange={onPortalChange}
              />
            </div>
          ) : (
            <AdminOverview
              openKeys={openKeys}
              onToggle={toggle}
              query={query}
              onQuery={setQuery}
              registerSection={(key, el) => { sectionRefs.current[key] = el; }}
              onOpenCard={(sectionTitle, cardTitle) => {
                // A card that owns a module opens it, so the Overview and the nav agree.
                if (CARD_MODULES[`${sectionTitle}/${cardTitle}`] || scopedCardFor(sectionTitle, cardTitle)) {
                  select(sectionTitle, cardTitle);
                  return true;
                }
                // A BOM card on the Overview jumps straight into that screen, rather than
                // making the admin land on the module and click again.
                if (sectionTitle !== 'BOM Management') return false;
                select('BOM Management', cardTitle);
                return true;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* What a non–Organization Admin sees instead of Organization settings: who they are, where they administer, where they
 * work and how much they see there — the F03 rules read back in plain words. */
function NoOrganizationAccess({ viewAs, onOpen }: { viewAs: ViewAs; onOpen: (id: number) => void }) {
  const s = loadStore();
  const me = personaInfo(viewAs);
  const name = me.name;
  const ms = membershipsOf(sortWorkspaces(s.workspaces), me.id);
  const admin = ms.filter((m) => isWorkspaceAdmin(m.w, me.id));
  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <div className="flex items-start gap-3">
        <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B]"><Lock size={20} /></span>
        <div>
          <h1 className="text-[18px] font-semibold text-[#1F2D3D]">Organization settings are for Organization Admins</h1>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#64748B]">None of {name}’s roles has an Admin › Global permission, so users, roles, assets and other organization settings aren’t shown. {admin.length ? 'Open a workspace you administer:' : 'They have no admin role in any workspace either.'}</p>
        </div>
      </div>
      {admin.length > 0 && (
        <div className="mt-5 space-y-2">
          {admin.map(({ w }) => (
            <button key={w.id} onClick={() => onOpen(w.id)} className="flex w-full items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-left transition-shadow hover:shadow-sm">
              <span className="size-2.5 rounded-full" style={{ background: w.colour }} />
              <span className="min-w-0 flex-1"><span className="block text-[14px] font-medium text-[#1F2D3D]">{w.name} settings</span><span className="block text-[12px] text-[#7B8FA5]">{(accessOf(w, me.id).roles ?? []).join(", ")} here</span></span>
              <Settings2 size={16} className="text-[#3D8BD0]" />
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#364658]"><Building2 size={14} className="text-[#64748B]" /> {name}’s access</div>
        <p className="mt-1 text-[12px] text-[#7B8FA5]">Roles are given per workspace (below).</p>
        <ul className="mt-2 space-y-1 text-[13px] text-[#364658]">
          {ms.map(({ w }) => { const a = accessOf(w, me.id); return <li key={w.id}>· <b className="font-medium">{w.name}</b>: {scopeLabel(a)}{a.groups.length ? `, in ${a.groups.join(', ')}` : ''}{(a.roles ?? []).length ? ` · ${(a.roles ?? []).join(', ')}` : ''}</li>; })}
          {ms.length === 0 && <li className="text-[#94A3B8]">Not in any workspace.</li>}
        </ul>
      </div>
    </div>
  );
}
