import { ArrowLeft, Check, CirclePause, CirclePlay, Info, Pencil, Rocket, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SETUP_STEPS, TIER_LABEL, TYPE_LABEL, missingRequired, technicianById } from './deskData';
import type { Desk, SetupStep, SetupStepId, SetupTier } from './deskData';
import { DefaultTag, IconAction, StatusPill, primaryBtn } from './deskUi';

/* The desk page — #/admin/organization/desk/<id>. ESM F01, the flow after Create.
 *
 * Create lands HERE, not back on the list: a new desk is an empty shell, and the useful next
 * thing is to see what it still needs. While the desk is in Setup the page is a checklist whose
 * REQUIRED steps gate Go Live; once Live the same rows read as the desk's configuration, so the
 * page doesn't change shape under the admin. Freshservice (create → in-setup → publish) and
 * ManageEngine (New → Pre-Production → Production) both stage a desk the same way.
 *
 * ⚠️ Each step's own screen belongs to a later feature (shown on the row). Until it is designed,
 * "Set up" only marks the step done, and says so. */

const secondaryBtn = 'inline-flex h-9 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';

export type DeskAction = 'live' | 'inactive' | 'reactivate' | 'delete';

interface AdminDeskPageProps {
  desk: Desk;
  onBack: () => void;
  onEdit: () => void;
  onAction: (kind: DeskAction) => void;
  onStep: (step: SetupStepId) => void;
}

function StepRow({ step, done, live, onEdit, onStep }: {
  step: SetupStep; done: boolean; live: boolean; onEdit: () => void; onStep: (s: SetupStepId) => void;
}) {
  const isDetails = step.id === 'details';
  const placeholderTip = `This screen is designed in ${step.feature}. In this prototype, the button only marks the step done.`;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className={`flex size-6 flex-shrink-0 items-center justify-center rounded-full border ${
        done ? 'border-[#22C55E] bg-[#22C55E] text-white' : 'border-[#CBD5E1] bg-white'
      }`}>{done && <Check size={13} strokeWidth={3} />}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-medium ${done && !live ? 'text-[#64748B]' : 'text-[#364658]'}`}>{step.title}</span>
          <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-px font-mono text-[10px] text-[#64748B]" title={`Designed in feature ${step.feature}`}>{step.feature}</span>
        </div>
        <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">{step.desc}</p>
      </div>
      <div className="flex-shrink-0">
        {isDetails ? (
          <button onClick={onEdit} className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"><Pencil size={13} /> Edit</button>
        ) : done ? (
          <span className="inline-flex h-8 items-center px-2.5 text-[12px] font-medium text-[#15803D]">Done</span>
        ) : (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button onClick={() => onStep(step.id)} className="inline-flex h-8 items-center rounded border border-[#3D8BD0] bg-white px-3 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">Set up</button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[260px] text-wrap">{placeholderTip}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </li>
  );
}

export function AdminDeskPage({ desk, onBack, onEdit, onAction, onStep }: AdminDeskPageProps) {
  const missing = missingRequired(desk);
  const required = SETUP_STEPS.filter((s) => s.tier === 'required');
  const requiredDone = required.length - missing.length;
  const inSetup = desk.status === 'setup';
  const owners = desk.ownerIds.map((id) => technicianById(id)?.name).filter(Boolean).join(', ');
  const deleteTip = desk.isDefault ? 'The IT desk cannot be deleted.'
    : desk.ticketCount > 0 ? `Has ${desk.ticketCount} tickets, so it can't be deleted. Make it Inactive instead.` : 'Delete';

  const goLive = (
    <button disabled={missing.length > 0} onClick={() => onAction('live')} className={`${primaryBtn} ${missing.length ? 'pointer-events-none' : ''}`}>
      <Rocket size={15} /> Go Live
    </button>
  );

  const tiers: SetupTier[] = ['required', 'recommended', 'optional'];

  return (
    <div className="px-4 pb-8 pt-5">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-[#64748B] transition-colors hover:text-[#3D8BD0]">
        <ArrowLeft size={14} /> Desks
      </button>

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="size-3 flex-shrink-0 rounded-full" style={{ backgroundColor: desk.colour }} />
            <h1 className="truncate text-[20px] font-semibold text-[#364658]">{desk.name}</h1>
            {desk.isDefault && <DefaultTag />}
            <StatusPill status={desk.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-[22px] text-[13px] text-[#7B8FA5]">
            <span className="font-mono text-[#364658]">{desk.code}</span><span>·</span>
            <span>{TYPE_LABEL[desk.type]}</span><span>·</span>
            <span>Owners: <span className="text-[#364658]">{owners}</span></span>
          </div>
          {desk.description && <p className="mt-1.5 pl-[22px] text-[13px] leading-[1.6] text-[#7B8FA5]">{desk.description}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button onClick={onEdit} className={secondaryBtn}><Pencil size={14} /> Edit</button>
          {inSetup && (missing.length ? (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild><span className="inline-flex cursor-not-allowed">{goLive}</span></TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-wrap">Finish the required steps first: {missing.map((s) => s.title).join(', ')}.</TooltipContent>
            </Tooltip>
          ) : goLive)}
          {desk.status === 'live' && (
            <IconAction name="Make Inactive" tip={desk.isDefault ? 'The IT desk is always Live.' : 'Make Inactive'} disabled={desk.isDefault} onClick={() => onAction('inactive')}><CirclePause size={16} /></IconAction>
          )}
          {desk.status === 'inactive' && (
            <button onClick={() => onAction('reactivate')} className={primaryBtn}><CirclePlay size={15} /> Make Live again</button>
          )}
          <IconAction name="Delete" tip={deleteTip} disabled={desk.isDefault || desk.ticketCount > 0} danger onClick={() => onAction('delete')}><Trash2 size={16} /></IconAction>
        </div>
      </div>

      {inSetup && (
        <div className="mt-5 rounded border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
          <div className="flex items-start gap-2.5 text-[13px] leading-[1.6] text-[#92400E]">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">{desk.name}</strong> is in Setup. Employees can't raise requests in it yet.
              {missing.length ? ' Finish the required steps, then Go Live.' : ' All required steps are done. You can Go Live now.'}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 pl-[26px]">
            <div className="h-1.5 w-[220px] max-w-full overflow-hidden rounded-full bg-[#FEF3C7]">
              <div className="h-full rounded-full bg-[#F59E0B] transition-all" style={{ width: `${(requiredDone / required.length) * 100}%` }} />
            </div>
            <span className="text-[12px] font-medium text-[#92400E]">{requiredDone} of {required.length} required steps done</span>
          </div>
        </div>
      )}
      {desk.status === 'inactive' && (
        <div className="mt-5 flex items-start gap-2.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[13px] leading-[1.6] text-[#475569]">
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <div><strong className="font-semibold">{desk.name}</strong> is Inactive. It takes no new requests; its {desk.ticketCount.toLocaleString()} existing tickets stay available.</div>
        </div>
      )}

      <h2 className="mb-2 mt-6 text-[15px] font-semibold text-[#364658]">{inSetup ? 'Set up this desk' : 'Desk configuration'}</h2>
      <div className="space-y-4">
        {tiers.map((tier) => {
          const steps = SETUP_STEPS.filter((s) => s.tier === tier);
          const done = steps.filter((s) => desk.setup[s.id]).length;
          return (
            <section key={tier} className="rounded border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between border-b border-[#EEF1F5] px-4 py-2.5">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{tier === 'required' && !inSetup ? 'Required' : TIER_LABEL[tier]}</h3>
                <span className="text-[12px] text-[#7B8FA5]">{done} of {steps.length} done</span>
              </div>
              <ul className="divide-y divide-[#EEF1F5]">
                {steps.map((s) => (
                  <StepRow key={s.id} step={s} done={desk.setup[s.id]} live={!inSetup} onEdit={onEdit} onStep={onStep} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
