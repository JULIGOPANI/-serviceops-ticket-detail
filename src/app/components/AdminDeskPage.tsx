import type { ReactNode } from 'react';
import { Check, ChevronRight, CirclePlay, Clock, Globe, Lock, Mail, MoreHorizontal, Pencil, Rocket, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { DefaultTag, DeskIcon, StatusPill, initials, primaryBtn, tint } from './deskUi';
import { STATUS_HELP, STATUS_LABEL, TYPE_LABEL,  technicianById } from './deskData';
import type { Desk, SetupStep } from './deskData';

/* The desk page — #/admin/organization/desk/<id>[/members | /settings]. ESM F01.
 *
 * A SEPARATE page, as Freshservice does it (Manage Workspaces → a workspace opens its own page with
 * Publish / Edit / ⋯ in the header and the people below; seen live on the abc123 trial, 2026-10-14).
 *
 *   Overview  what F01 owns: description, owners, short code, kind, created, lifecycle.
 *   Members   who works in this desk — picked from the GLOBAL technician pool, never created here.
 *             Designed in F02; the tab says so (Juli chose to show the tab now, 2026-10-14).
 *   Settings  what this desk manages on its own vs company-wide. Designed in F04; same rule.
 *
 * ⚠️ No ticket numbers anywhere on this page (Juli, 2026-10-14). */

export type DeskAction = 'live' | 'inactive' | 'reactivate' | 'delete';
export type DeskTab = 'overview' | 'members';

const secondaryBtn = 'inline-flex h-9 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';


/* What each desk MIGHT keep its own copy of. Freshservice keeps all of these per workspace
 * (`/ws/4/admin/…`, seen live 2026-10-14); ServiceOps keeps them global today. F04 decides. */
const SETTING_CANDIDATES: { group: string; items: string[] }[] = [
  { group: 'Assignment', items: ['Technician groups', 'Assignment rules'] },
  { group: 'Requests', items: ['Categories', 'Request form and fields', 'Templates', 'Statuses', 'Closure rules'] },
  { group: 'Service levels', items: ['Business hours', 'SLA policies'] },
  { group: 'Service catalog', items: ['Catalog items'] },
  { group: 'Automation', items: ['Workflows', 'Approvals', 'Scheduled actions'] },
  { group: 'Communication', items: ['Support email', 'Email notifications', 'Canned responses', 'Surveys'] },
];

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white">
      <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-3">
        <h3 className="text-[13px] font-semibold text-[#364658]">{title}</h3>
        {aside}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function DesignedIn({ feature }: { feature: string }) {
  return <span className="rounded-sm bg-[#FEF3C7] px-1.5 py-px font-mono text-[10px] font-semibold text-[#92400E]">{feature}</span>;
}


export function GetStartedRow({ done, icon: Icon, title, summary, action, onClick, last }: {
  done: boolean; icon: typeof Clock; title: string; summary: string; action: string; onClick: () => void; last?: boolean;
}) {
  return (
    <li className={`group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#FAFBFC] ${last ? '' : 'border-b border-[#EEF1F5]'}`}>
      <span className={`flex size-7 flex-shrink-0 items-center justify-center rounded-full transition-colors ${done ? 'bg-[#22C55E] text-white' : 'border-2 border-[#CBD5E1] bg-white text-[#94A3B8]'}`}>
        {done ? <Check size={14} strokeWidth={3} /> : <Icon size={13} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-[14px] font-semibold ${done ? 'text-[#475569]' : 'text-[#1F2D3D]'}`}>{title}</div>
        <div className="truncate text-[12px] text-[#7B8FA5]">{summary}</div>
      </div>
      <button
        onClick={onClick}
        className={done
          ? 'inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]'
          : 'inline-flex h-8 items-center gap-1 rounded-lg bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#2d6ca0]'}
      >{action}{!done && <ChevronRight size={14} />}</button>
    </li>
  );
}

interface AdminDeskPageProps {
  desk: Desk;
  tab: DeskTab;
  onTab: (tab: DeskTab) => void;
  onBack: () => void;
  onEdit: () => void;
  onAction: (kind: DeskAction) => void;
  /** Opens the side drawer for one Get started essential. */
  onStep: (step: SetupStep) => void;
}

export function AdminDeskPage({ desk, tab, onTab, onBack, onEdit, onAction, onStep }: AdminDeskPageProps) {
  const team = desk.setup.memberIds.map(technicianById).filter(Boolean) as { id: number; name: string; email: string }[];
  const requestTypes = desk.setup.requestTypes.filter((r) => r.on);
  const owners = desk.ownerIds.map(technicianById).filter(Boolean) as { id: number; name: string; email: string }[];
  const codeLocked = desk.isDefault || desk.status !== 'setup';
  const canDelete = !desk.isDefault && desk.ticketCount === 0;
  const deleteWhy = desk.isDefault ? 'The IT desk can’t be deleted' : 'Has tickets: make it Inactive instead';
  const created = new Date(desk.createdOn).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  const TABS: { id: DeskTab; label: string; feature?: string }[] = [
    { id: 'overview', label: 'Details' },
    { id: 'members', label: 'Team' },
  ];

  return (
    <div className="min-h-full bg-[#F7F9FB]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 pt-4" style={{ backgroundImage: `linear-gradient(180deg, ${tint(desk.colour, 0.07)} 0%, #ffffff 70%)` }}>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px]">
          <button onClick={onBack} className="text-[#3D8BD0] hover:underline">{desk.name} settings</button>
          <ChevronRight size={14} className="text-[#94A3B8]" />
          <span className="truncate text-[#64748B]">{tab === 'members' ? 'Team' : 'Desk details'}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start gap-4">
          <DeskIcon type={desk.type} colour={desk.colour} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[22px] font-semibold text-[#1F2D3D]">{desk.name}</h1>
              {desk.isDefault && <DefaultTag />}
              <StatusPill status={desk.status} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-[#64748B]">
              <span>{TYPE_LABEL[desk.type]} desk</span><span>·</span><span className="font-mono font-medium text-[#475569]">{desk.code}</span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {desk.status === 'setup' && <button onClick={() => onAction('live')} className={primaryBtn}><Rocket size={15} /> Go Live</button>}
            {desk.status === 'inactive' && <button onClick={() => onAction('reactivate')} className={primaryBtn}><CirclePlay size={15} /> Make Live again</button>}
            <button onClick={onEdit} className={secondaryBtn}><Pencil size={14} /> Edit</button>
            {!desk.isDefault && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="More actions" className="flex size-9 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:bg-[#F5F7FA] data-[state=open]:bg-[#F5F7FA]"><MoreHorizontal size={17} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  {desk.status === 'live' && <DropdownMenuItem className="cursor-pointer text-[13px]" onSelect={() => onAction('inactive')}>Make Inactive</DropdownMenuItem>}
                  {desk.status === 'live' && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    disabled={!canDelete}
                    className="cursor-pointer flex-col items-start gap-0 text-[13px] text-[#DC2626] focus:text-[#DC2626]"
                    onSelect={() => canDelete && onAction('delete')}
                  >
                    Delete desk
                    {!canDelete && <span className="text-[11px] text-[#94A3B8]">{deleteWhy}</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div role="tablist" aria-label="Desk sections" className="mt-5 flex gap-6">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => onTab(t.id)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-[14px] font-medium transition-colors ${
                  on ? 'border-[#3D8BD0] text-[#1F2D3D]' : 'border-transparent text-[#64748B] hover:text-[#364658]'
                }`}
              >
                {t.label}{t.feature && <DesignedIn feature={t.feature} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <Section title="About">
                <p className={`text-[13px] leading-[1.7] ${desk.description ? 'text-[#475569]' : 'text-[#9CA3AF]'}`}>
                  {desk.description || 'No description yet.'}
                </p>
              </Section>
              <Section title="What employees can ask" aside={<button onClick={() => onStep('requests')} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Change</button>}>
                {requestTypes.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {requestTypes.map((r) => <span key={r.name} className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1 text-[12px] text-[#364658]">{r.name}</span>)}
                  </div>
                ) : <p className="text-[13px] text-[#9CA3AF]">No request types yet.</p>}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#EEF1F5] pt-3 text-[13px] text-[#475569]">
                  <span className="inline-flex items-center gap-1.5"><Globe size={14} className={desk.setup.portal ? 'text-[#3D8BD0]' : 'text-[#CBD5E1]'} />{desk.setup.portal ? 'On the Support Portal' : 'Hidden from the portal'}</span>
                  <span className="inline-flex items-center gap-1.5"><Mail size={14} className={desk.setup.email.trim() ? 'text-[#3D8BD0]' : 'text-[#CBD5E1]'} />{desk.setup.email.trim() || 'No support email'}</span>
                </div>
              </Section>
            </div>
            <div className="space-y-5">
              <Section title="Owners" aside={<button onClick={onEdit} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Change</button>}>
                <ul className="space-y-3">
                  {owners.map((o) => (
                    <li key={o.id} className="flex items-center gap-3">
                      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E0ECF8] text-[11px] font-semibold text-[#36577A]">{initials(o.name)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-[#364658]">{o.name}</span>
                        <span className="block truncate text-[12px] text-[#7B8FA5]">{o.email}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Details">
                <dl className="space-y-3 text-[13px]">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[#7B8FA5]">Status</dt>
                    <dd className="text-right text-[#364658]">{STATUS_LABEL[desk.status]}<span className="block text-[11px] text-[#94A3B8]">{STATUS_HELP[desk.status]}</span></dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#7B8FA5]">Short code</dt>
                    <dd className="flex items-center gap-1.5 font-mono text-[#364658]">{codeLocked && <Lock size={12} className="text-[#94A3B8]" />}{desk.code}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#7B8FA5]">Kind</dt>
                    <dd className="flex items-center gap-1.5 text-[#364658]"><Lock size={12} className="text-[#94A3B8]" />{TYPE_LABEL[desk.type]}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#7B8FA5]">Colour</dt>
                    <dd className="flex items-center gap-1.5 text-[#364658]"><span className="size-3 rounded-full" style={{ backgroundColor: desk.colour }} /></dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#7B8FA5]">Created</dt>
                    <dd className="text-[#364658]">{created}</dd>
                  </div>
                </dl>
              </Section>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="mx-auto max-w-[760px]">
            <Section title="Team & groups" aside={<button onClick={() => onStep('team')} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Change</button>}>
              {team.length ? (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {team.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-lg border border-[#EEF1F5] px-3 py-2.5">
                      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E0ECF8] text-[11px] font-semibold text-[#36577A]">{initials(t.name)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-[#364658]">{t.name}</span>
                        <span className="block truncate text-[12px] text-[#7B8FA5]">{t.email}</span>
                      </span>
                      {desk.ownerIds.includes(t.id) && <span className="rounded-sm bg-[#EBF5FF] px-1.5 py-px text-[10px] font-semibold uppercase text-[#3D8BD0]">Owner</span>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[13px] text-[#9CA3AF]">No one works in this desk yet.</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EEF1F5] pt-3">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Groups</span>
                {desk.setup.groups.length ? desk.setup.groups.map((g) => <span key={g} className="rounded-full border border-[#DCEBFA] bg-[#F5FAFF] px-2.5 py-0.5 text-[12px] text-[#364658]">{g}</span>) : <span className="text-[12px] text-[#9CA3AF]">None yet</span>}
              </div>
              <p className="mt-4 flex items-start gap-2 text-[12px] leading-[1.6] text-[#7B8FA5]">
                <Users size={14} className="mt-0.5 flex-shrink-0" />
                Technicians come from Admin › Users and are only picked here. Roles per desk and more groups are designed in F02, F03 and F11.
              </p>
            </Section>
          </div>
        )}

      </div>
    </div>
  );
}
