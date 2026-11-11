import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, Lock, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  COLOURS, CREATABLE_TYPES, MAX_DESCRIPTION, MAX_NAME, STATUS_HELP, STATUS_LABEL, TECHNICIANS,
  TYPE_LABEL, adminIdsOf, technicianById,
} from './workspaceData';
import type { Workspace, WorkspaceDraft, WorkspaceType } from './workspaceData';

/* Create / Edit Workspace: ONE right-side drawer, two modes, so a label or a rule can't drift.
 *
 * A drawer, not a full page, because that is how the live product creates its Organization
 * objects (Create Company and Add Department both open a right drawer with Save / Cancel; seen on
 * 172.16.15.185, 2026-10-13). F01 asks only identity questions, so the drawer has room.
 *
 * Edit-mode difference: Type is read-only (it will drive templates and modules). */

export const inputCls = (error?: string) =>
  `h-9 w-full rounded border bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 ${
    error ? 'border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#d1d5db] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]'
  }`;

export function Field({ id, label, required, helper, error, children }: {
  id?: string; label: string; required?: boolean; helper?: ReactNode; error?: string; children: ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[#364658]">
        {label}{required && <span className="ml-0.5 text-[#DC2626]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[12px] text-[#DC2626]">{error}</p>}
      {!error && helper && <p className="mt-1.5 text-[12px] leading-[1.5] text-[#7B8FA5]">{helper}</p>}
    </div>
  );
}

function LockedValue({ value, reason }: { value: ReactNode; reason: string }) {
  return (
    <div>
      <div className="flex h-9 items-center gap-2 rounded border border-[#E5E7EB] bg-[#F8FAFC] px-3 text-[13px] text-[#364658]">
        <Lock size={13} className="text-[#94A3B8]" />{value}
      </div>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-[#7B8FA5]">{reason}</p>
    </div>
  );
}

export function OwnerPicker({ value, onChange, error }: { value: number[]; onChange: (v: number[]) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const hits = TECHNICIANS.filter((t) => !ql || t.name.toLowerCase().includes(ql) || t.email.toLowerCase().includes(ql));
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(''); }}>
      <PopoverTrigger asChild>
        <button
          id="ws-owners"
          type="button"
          className={`relative flex min-h-9 w-full flex-wrap items-center gap-1 rounded border bg-white py-1 pl-2 pr-8 text-left focus:outline-none focus:ring-1 ${
            error ? 'border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#d1d5db] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]'
          }`}
        >
          {value.length === 0 ? (
            <span className="px-1 text-[13px] text-[#9ca3af]">Select technicians</span>
          ) : value.map((id) => {
            const t = TECHNICIANS.find((x) => x.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] text-[#364658]">
                {t?.name}
                <span
                  role="button"
                  aria-label={`Remove ${t?.name}`}
                  onClick={(e) => { e.stopPropagation(); toggle(id); }}
                  className="text-[#64748B] hover:text-[#364658]"
                ><X size={12} /></span>
              </span>
            );
          })}
          <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[10001] w-[var(--radix-popover-trigger-width)] bg-white p-0">
        <div className="border-b border-[#EEF1F5] p-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="h-8 w-full rounded border border-[#d1d5db] bg-white px-2.5 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
        </div>
        <div className="max-h-[260px] overflow-y-auto p-1">
          {hits.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-[#7B8FA5]">No technicians match your search.</div>
          ) : hits.map((t) => {
            const on = value.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => toggle(t.id)}
                className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left transition-colors hover:bg-[#F5F7FA]"
              >
                <span className={`flex size-4 flex-shrink-0 items-center justify-center rounded-sm border ${on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#CBD5E1] bg-white'}`}>
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-[#364658]">{t.name}</span>
                  <span className="block truncate text-[12px] text-[#7B8FA5]">{t.email}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface WorkspaceFormProps {
  mode: 'create' | 'edit';
  workspace?: Workspace;
  workspaces: Workspace[];
  onCancel: () => void;
  onSubmit: (draft: WorkspaceDraft) => void;
}

export function WorkspaceForm({ mode, workspace, workspaces, onCancel, onSubmit }: WorkspaceFormProps) {
  const others = useMemo(() => workspaces.filter((w) => w.id !== workspace?.id), [workspaces, workspace]);
  const [name, setName] = useState(workspace?.name ?? '');
  const [type, setType] = useState<WorkspaceType | ''>(workspace?.type ?? '');
  const [description, setDescription] = useState(workspace?.description ?? '');
  const [colour, setColour] = useState(workspace?.colour ?? COLOURS[1]);
  const [submitted, setSubmitted] = useState(false);

  /* ⚠️ Escape closes the innermost thing only. The Owners dropdown closes itself on the same
     keypress, and its content is still in the DOM while the event bubbles here, so its presence
     means "this Escape was for the dropdown"; without the check one Escape threw away the form. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[data-radix-popper-content-wrapper]')) return;
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // Type follows the brief: editable while in Setup, locked once the workspace has been Live (and always for IT).
  const typeLocked = mode === 'edit' && (workspace!.isDefault || workspace!.status !== 'setup');

  const errors: Record<string, string | undefined> = {
    name: !name.trim() ? 'Workspace name is required.'
      : others.some((w) => w.name.trim().toLowerCase() === name.trim().toLowerCase()) ? 'A workspace with this name already exists.'
        : undefined,
    type: !type ? 'Choose a workspace type.' : undefined,
  };
  const show = (k: string) => (submitted ? errors[k] : undefined);

  const submit = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    onSubmit({ name: name.trim(), type: type as WorkspaceType, description: description.trim(), adminIds: [], colour });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch justify-end bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="ws-form-title" className="flex h-full w-[560px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <h2 id="ws-form-title" className="text-[16px] font-semibold text-[#364658]">
            {mode === 'create' ? 'Create Workspace' : `Edit details · ${workspace!.name}`}
          </h2>
          <button onClick={onCancel} aria-label="Close" className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
            <X size={18} className="text-[#7B8FA5]" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {mode === 'create' ? (
            <div className="mb-5 rounded border border-[#DCEBFA] bg-[#F5FAFF] px-3 py-2.5 text-[12px] leading-[1.6] text-[#36577A]">
              A new workspace starts in <strong className="font-semibold">Setup</strong>. It takes no requests until you make it Live.
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-2 text-[12px] text-[#7B8FA5]">
              <span>Status:</span>
              <span className="font-medium text-[#364658]">{STATUS_LABEL[workspace!.status]}</span>
              <span>· {STATUS_HELP[workspace!.status]}</span>
            </div>
          )}

          <Field id="ws-name" label="Workspace Name" required error={show('name')}>
            <input
              id="ws-name"
              autoFocus
              value={name}
              maxLength={MAX_NAME}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Human Resources"
              className={inputCls(show('name'))}
            />
          </Field>

          <Field label="Workspace Type" required error={show('type')}>
            {typeLocked ? (
              <LockedValue
                value={TYPE_LABEL[workspace!.type]}
                reason={workspace!.isDefault
                  ? 'The IT workspace is created by ServiceOps and holds everything from before workspaces existed.'
                  : 'Locked once the workspace has gone Live.'}
              />
            ) : (
              <>
                <div role="radiogroup" aria-label="Workspace Type" className="grid grid-cols-2 gap-2">
                  {CREATABLE_TYPES.map((t) => {
                    const on = type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setType(t.value)}
                        className={`rounded border px-3 py-2.5 text-left transition-colors ${
                          on ? 'border-[#3D8BD0] bg-[#F5FAFF] ring-1 ring-[#3D8BD0]' : show('type') ? 'border-[#FCA5A5] hover:bg-[#F9FAFB]' : 'border-[#DFE5ED] hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <div className="text-[13px] font-medium text-[#364658]">{TYPE_LABEL[t.value]}</div>
                        <div className="mt-0.5 text-[12px] leading-[1.4] text-[#7B8FA5]">{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
                {!show('type') && (
                  <p className="mt-1.5 text-[12px] leading-[1.5] text-[#7B8FA5]">
                    Changing the template type doesn’t remove anything you have already configured.
                  </p>
                )}
              </>
            )}
          </Field>


          <Field id="ws-desc" label="Description" helper={`${description.length}/${MAX_DESCRIPTION}`}>
            <textarea
              id="ws-desc"
              value={description}
              maxLength={MAX_DESCRIPTION}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this team handles"
              className="w-full resize-none rounded border border-[#d1d5db] bg-white px-3 py-2 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
          </Field>

          <Field label="Workspace Admins" helper="Managed on the Team tab: a Workspace Admin is a member with that role.">
            <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-[13px] text-[#364658]">
              {workspace ? adminIdsOf(workspace).map((id) => <span key={id} className="rounded-sm bg-white px-1.5 py-0.5 text-[12px] ring-1 ring-[#E5E7EB]">{technicianById(id)?.name}</span>) : null}
            </div>
          </Field>

          <Field label="Colour" helper="Tells workspaces apart in lists and the technician app.">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
              {COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={colour === c}
                  aria-label={c}
                  onClick={() => setColour(c)}
                  className={`flex size-7 items-center justify-center rounded-full ring-offset-2 transition-shadow ${colour === c ? 'ring-2 ring-[#364658]' : 'hover:ring-2 hover:ring-[#CBD5E1]'}`}
                  style={{ backgroundColor: c }}
                >{colour === c && <Check size={13} strokeWidth={3} className="text-white" />}</button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button onClick={onCancel} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button onClick={submit} className="inline-flex h-9 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]">
            {mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
