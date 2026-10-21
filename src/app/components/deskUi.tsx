import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Building2, LayoutGrid, Monitor, Scale, Users, Wallet, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { STATUS_HELP, STATUS_LABEL, TYPE_LABEL, technicianById } from './deskData';
import type { DeskStatus, DeskType } from './deskData';

/* Pieces the Desks list, the desk page and the create flow share, so a status pill, an icon or a
 * row can't look different in two places. */

export const TYPE_ICON: Record<DeskType, LucideIcon> = {
  it: Monitor, hr: Users, facilities: Building2, finance: Wallet, legal: Scale, general: LayoutGrid,
};

/** The desk colour at low strength, for icon tiles and header washes. `hex` is #RRGGBB. */
export const tint = (hex: string, alpha: number) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

export function DeskIcon({ type, colour, size = 'md' }: { type: DeskType; colour: string; size?: 'md' | 'lg' }) {
  const Icon = TYPE_ICON[type];
  const box = size === 'lg' ? 'size-12 rounded-xl' : 'size-10 rounded-lg';
  return (
    <span className={`flex flex-shrink-0 items-center justify-center ${box}`} style={{ backgroundColor: tint(colour, 0.12), color: colour }}>
      <Icon size={size === 'lg' ? 24 : 20} strokeWidth={1.8} />
    </span>
  );
}

export const initials = (name?: string) => (name ?? '').split(' ').map((p) => p[0]).join('').slice(0, 2);

export interface DeskRowData {
  name: string; code: string; type: DeskType; colour: string; status: DeskStatus; isDefault: boolean;
  ownerIds: number[]; description: string;
}

/** One desk as a list row: used in the Desks list and, unchanged, as the live preview in New desk.
 *  ⚠️ No ticket numbers: neither Freshservice nor ManageEngine shows them on the desk list, and
 *  Juli asked for none (2026-10-14). */
export function DeskRowBody({ d, actions }: { d: DeskRowData; actions?: ReactNode }) {
  const owners = d.ownerIds.map((id) => technicianById(id)?.name).filter(Boolean) as string[];
  return (
    <div className="flex items-center gap-4">
      <DeskIcon type={d.type} colour={d.colour} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-[#1F2D3D]">{d.name || 'Desk name'}</span>
          {d.isDefault && <DefaultTag />}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-[#7B8FA5]">
          <span className="flex-shrink-0 font-mono font-medium text-[#475569]">{d.code || '—'}</span>
          <span className="flex-shrink-0">·</span>
          <span className="flex-shrink-0">{owners.length ? `Owner${owners.length > 1 ? 's' : ''}: ${owners.join(', ')}` : 'No owner yet'}</span>
          {d.description && <><span className="flex-shrink-0">·</span><span className="truncate">{d.description}</span></>}
        </div>
      </div>
      <span className="hidden w-[110px] flex-shrink-0 text-[13px] text-[#475569] md:block">{TYPE_LABEL[d.type]} desk</span>
      <span className="w-[86px] flex-shrink-0"><StatusPill status={d.status} /></span>
      {actions && <div className="flex w-[104px] flex-shrink-0 items-center justify-end gap-1">{actions}</div>}
    </div>
  );
}

export function ProgressRing({ value, size = 44, light }: { value: number; size?: number; light?: boolean }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex flex-shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} stroke={light ? 'rgba(255,255,255,0.35)' : '#E5E7EB'} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} strokeLinecap="round" stroke={light ? '#ffffff' : '#3D8BD0'}
          strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      <span className={`absolute text-[11px] font-semibold ${light ? 'text-white' : 'text-[#364658]'}`}>{value}%</span>
    </span>
  );
}

export const primaryBtn = 'inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-50';

const STATUS_STYLE: Record<DeskStatus, string> = {
  live: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]',
  setup: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
  inactive: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]',
};
const STATUS_DOT: Record<DeskStatus, string> = { live: 'bg-[#22C55E]', setup: 'bg-[#F59E0B]', inactive: 'bg-[#94A3B8]' };

export function DefaultTag() {
  return <span className="inline-flex flex-shrink-0 items-center rounded-sm bg-[#EBF5FF] px-1.5 py-px text-[11px] font-semibold text-[#3D8BD0]">Default</span>;
}

export function StatusPill({ status }: { status: DeskStatus }) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span className={`inline-flex cursor-help items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[12px] font-medium ${STATUS_STYLE[status]}`}>
          <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />{STATUS_LABEL[status]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{STATUS_HELP[status]}</TooltipContent>
    </Tooltip>
  );
}

/** An icon action whose tooltip still shows when it is disabled: the tooltip IS the explanation. */
export function IconAction({ name, tip, disabled, danger, onClick, children }: {
  name: string; tip: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <span className={`inline-flex ${disabled ? 'cursor-not-allowed' : ''}`}>
          <button
            type="button"
            aria-label={name}
            disabled={disabled}
            onClick={onClick}
            className={`flex size-8 items-center justify-center rounded transition-colors ${
              disabled ? 'pointer-events-none text-[#CBD5E1]'
                : danger ? 'text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#364658]'
            }`}
          >{children}</button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-wrap">{tip}</TooltipContent>
    </Tooltip>
  );
}

export function ConfirmDialog({ title, children, confirmLabel, danger, onCancel, onConfirm }: {
  title: string; children: ReactNode; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ws-confirm-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-[460px] max-w-full rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-4">
          <h2 id="ws-confirm-title" className="text-[16px] font-semibold text-[#364658]">{title}</h2>
          <button onClick={onCancel} aria-label="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={18} className="text-[#64748B]" /></button>
        </div>
        <div className="px-5 pb-5 text-[13px] leading-[1.6] text-[#64748B]">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button onClick={onCancel} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button
            onClick={onConfirm}
            className={`inline-flex h-8 items-center rounded px-3.5 text-[13px] font-medium text-white transition-colors ${danger ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#3D8BD0] hover:bg-[#2d6ca0]'}`}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Notice({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#EBF5FF] text-[#3D8BD0]">{icon}</span>
      <h2 className="mt-4 text-[16px] font-semibold text-[#364658]">{title}</h2>
      <div className="mt-1.5 max-w-[520px] text-[13px] leading-[1.6] text-[#7B8FA5]">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Owners({ ids }: { ids: number[] }) {
  const first = technicianById(ids[0]);
  const rest = ids.slice(1).map((id) => technicianById(id)?.name).filter(Boolean) as string[];
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-[#E0ECF8] text-[10px] font-semibold text-[#36577A]">
        {first?.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
      </span>
      <span className="truncate text-[13px] text-[#364658]">{first?.name}</span>
      {rest.length > 0 && (
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild><span className="flex-shrink-0 cursor-help rounded-sm bg-[#F1F5F9] px-1.5 py-px text-[11px] font-medium text-[#475569]">+{rest.length}</span></TooltipTrigger>
          <TooltipContent>{rest.join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

