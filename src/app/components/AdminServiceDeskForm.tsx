import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, ChevronLeft, Lock, Search, TriangleAlert, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  AUDIENCE_LABEL, DEPARTMENTS, REQUESTER_GROUPS, ROLE_LABEL, TECHNICIANS, TEMPLATE_OPTIONS,
  VISIBILITY_OPTIONS, LICENSE_LABEL, membersOf, slugify, technicianById,
} from './serviceDeskData';
import type {
  AudiencePermission, DeskDraft, DeskTemplate, DeskVisibility, DraftMember, LicenseType,
  MembershipType, ServiceDesk, ServiceDeskMembership,
} from './serviceDeskData';

/* Create / Edit Service Desk — ONE form, two modes, so a label or a validation rule can't drift
 * between them. A full page, not a modal: the Visibility choice and the Technicians table are the
 * point of the screen and need the room.
 *
 * Differences in edit mode: the identifier is read-only text, the primary checkbox is absent
 * (becoming primary is the list's Make Primary action), and the title is the desk's name. */

const MAX_NAME = 64;
const MAX_IDENTIFIER = 30;
const MAX_DESCRIPTION = 255;

// ── Shared bits (the list page uses these tags too) ────────────────────────

export function PrimaryTag() {
  return (
    <span className="inline-flex flex-shrink-0 items-center rounded-sm bg-[#EBF5FF] px-1.5 py-px text-[11px] font-semibold text-[#3D8BD0]">
      Primary
    </span>
  );
}

/* ⚠️ Neither licence is styled as a warning. Desk Technician is a normal, cheaper seat — painting it
   amber would read as "this person should not be here", which is the opposite of the pitch. */
export function LicenceTag({ type }: { type: LicenseType }) {
  const cls = type === 'desk_technician'
    ? 'border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]'
    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]';
  return (
    <span className={`inline-flex flex-shrink-0 whitespace-nowrap rounded-sm border px-1.5 py-px text-[11px] font-medium ${cls}`}>
      {LICENSE_LABEL[type]}
    </span>
  );
}

const inputCls = (error?: string) =>
  `h-9 w-full rounded border bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 ${
    error ? 'border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#d1d5db] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]'
  }`;

function Field({ id, label, required, helper, error, children }: {
  id?: string; label: string; required?: boolean; helper?: ReactNode; error?: string; children: ReactNode;
}) {
  return (
    <div data-field-error={error ? true : undefined}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[#364658]">
        {label}{required && <span className="ml-0.5 text-[#DC2626]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[12px] text-[#DC2626]">{error}</p>}
      {helper && <p className="mt-1.5 text-[12px] leading-[1.5] text-[#7B8FA5]">{helper}</p>}
    </div>
  );
}

function SelectBox({ id, value, onChange, children, error, className = '' }: {
  id?: string; value: string; onChange: (v: string) => void; children: ReactNode; error?: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(error)} cursor-pointer appearance-none pr-8`}
      >{children}</select>
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[#EEF1F5] pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-[15px] font-semibold text-[#364658]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ── Audience multi-select ──────────────────────────────────────────────────

function MultiSelect({ id, options, value, onChange, placeholder, error }: {
  id: string; options: { id: number; name: string }[]; value: number[]; onChange: (v: number[]) => void;
  placeholder: string; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (oid: number) => onChange(value.includes(oid) ? value.filter((v) => v !== oid) : [...value, oid]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={`relative flex min-h-9 w-full flex-wrap items-center gap-1 rounded border bg-white py-1 pl-2 pr-8 text-left focus:outline-none focus:ring-1 ${
            error ? 'border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#d1d5db] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]'
          }`}
        >
          {value.length === 0 ? (
            <span className="px-1 text-[13px] text-[#9ca3af]">{placeholder}</span>
          ) : value.map((v) => {
            const o = options.find((x) => x.id === v);
            return (
              <span key={v} className="inline-flex items-center gap-1 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] text-[#364658]">
                {o?.name}
                <span
                  role="button"
                  aria-label={`Remove ${o?.name}`}
                  onClick={(e) => { e.stopPropagation(); toggle(v); }}
                  className="text-[#64748B] hover:text-[#364658]"
                ><X size={12} /></span>
              </span>
            );
          })}
          <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] bg-white p-1">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => toggle(o.id)}
              className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >
              <span className={`flex size-4 flex-shrink-0 items-center justify-center rounded-sm border ${on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#CBD5E1] bg-white'}`}>
                {on && <Check size={11} strokeWidth={3} />}
              </span>
              {o.name}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ── Add technician picker ──────────────────────────────────────────────────

function TechnicianPicker({ loading, addedIds, onAdd }: { loading: boolean; addedIds: number[]; onAdd: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  // An added technician is never offered again.
  const available = TECHNICIANS.filter((t) => !addedIds.includes(t.id));
  const hits = available.filter((t) => !ql || t.name.toLowerCase().includes(ql) || t.email.toLowerCase().includes(ql));

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(''); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Add technician"
          className="flex h-9 w-full max-w-[440px] items-center gap-2 rounded border border-[#d1d5db] bg-white px-3 text-left text-[13px] text-[#9ca3af] transition-colors hover:border-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
        >
          <Search size={15} className="flex-shrink-0" />
          <span className="flex-1 truncate">{loading ? 'Loading technicians…' : 'Add technician'}</span>
          <ChevronDown size={15} className="flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] bg-white p-0">
        <div className="border-b border-[#EEF1F5] p-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="h-8 w-full rounded border border-[#d1d5db] bg-white px-2.5 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
        </div>
        <div className="max-h-[288px] overflow-y-auto p-1">
          {loading ? (
            <div className="px-3 py-6 text-center text-[13px] text-[#7B8FA5]">Loading technicians…</div>
          ) : hits.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-[#7B8FA5]">
              {available.length === 0 ? 'Every technician has been added.' : 'No technicians match your search.'}
            </div>
          ) : hits.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onAdd(t.id); setOpen(false); setQ(''); }}
              className="flex w-full items-center gap-3 rounded px-2.5 py-2 text-left transition-colors hover:bg-[#F5F7FA]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[#364658]">{t.name}</span>
                <span className="block truncate text-[12px] text-[#7B8FA5]">{t.email}</span>
              </span>
              <LicenceTag type={t.licenseType} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Form ───────────────────────────────────────────────────────────────────

interface ServiceDeskFormProps {
  mode: 'create' | 'edit';
  /** The desk being edited; absent when creating. */
  desk?: ServiceDesk;
  desks: ServiceDesk[];
  memberships: ServiceDeskMembership[];
  onCancel: () => void;
  onSubmit: (draft: DeskDraft, members: DraftMember[]) => void;
}

type ErrorKey = 'name' | 'identifier' | 'audienceIds' | 'members';

export function ServiceDeskForm({ mode, desk, desks, memberships, onCancel, onSubmit }: ServiceDeskFormProps) {
  const editing = mode === 'edit' && !!desk;

  const [name, setName] = useState(desk?.name ?? '');
  const [identifier, setIdentifier] = useState(desk?.identifier ?? '');
  /** Once the identifier is typed by hand, the name stops writing it. */
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState(desk?.description ?? '');
  const [template, setTemplate] = useState<DeskTemplate>(desk?.template ?? 'blank');
  const [isPrimary, setIsPrimary] = useState(false);
  const [visibility, setVisibility] = useState<DeskVisibility>(desk?.visibility ?? 'open');
  const [audiencePermission, setAudiencePermission] = useState<AudiencePermission | null>(desk?.audiencePermission ?? null);
  const [audienceIds, setAudienceIds] = useState<number[]>(desk?.audienceIds ?? []);
  const [members, setMembers] = useState<DraftMember[]>(() =>
    desk ? membersOf(memberships, desk.id).map((x) => ({ userId: x.userId, membershipType: x.membershipType })) : []);
  const [attempted, setAttempted] = useState(false);
  const [techLoading, setTechLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setTechLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  /** The first desk an org creates is its primary desk — there is never zero. */
  const firstDesk = !editing && desks.length === 0;
  const currentPrimary = desks.find((d) => d.isPrimary);
  const others = desks.filter((d) => d.id !== desk?.id);

  // ── validation ──
  const errors: Partial<Record<ErrorKey, string>> = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = 'Enter a name for this Service Desk.';
  else if (others.some((d) => d.name.trim().toLowerCase() === trimmed.toLowerCase())) {
    errors.name = 'A Service Desk with this name already exists.';
  }
  const idBadChars = !!identifier && !/^[a-z0-9-]+$/.test(identifier);
  if (!editing) {
    if (!identifier) errors.identifier = 'Enter an identifier.';
    else if (idBadChars) errors.identifier = 'Use lowercase letters, numbers and hyphens only.';
    else if (identifier.length < 2) errors.identifier = 'Use at least 2 characters.';
    else if (others.some((d) => d.identifier === identifier)) errors.identifier = 'This identifier is already in use.';
  }
  const needsIds = visibility === 'restricted' && (audiencePermission === 'requester_group' || audiencePermission === 'department');
  if (needsIds && audienceIds.length === 0) errors.audienceIds = 'Select at least one.';
  if (!members.some((x) => x.membershipType === 'manager')) errors.members = 'A Service Desk must have at least one Manager.';

  /* Errors appear once a save has been attempted. Edit opens on a valid record, so its errors are
     live from the start — demoting the last Manager says so immediately. A bad character in the
     identifier is reported as you type it, because it is a typo rather than an omission. */
  const show = attempted || editing;
  const err = (k: ErrorKey) => (show ? errors[k] : undefined);
  const idError = err('identifier') ?? (idBadChars ? errors.identifier : undefined);

  const onName = (v: string) => {
    setName(v);
    if (!editing && !idTouched) setIdentifier(slugify(v));
  };

  const chooseVisibility = (v: DeskVisibility) => {
    setVisibility(v);
    if (v === 'restricted') {
      setAudiencePermission((p) => p ?? 'all_requesters');
    } else {
      // Back to Open hides AND clears the audience — a hidden value would still be saved.
      setAudiencePermission(null);
      setAudienceIds([]);
    }
  };

  const chooseAudience = (v: AudiencePermission) => {
    setAudiencePermission(v);
    setAudienceIds([]);
  };

  const addMember = (userId: number) => setMembers((prev) => [...prev, { userId, membershipType: 'agent' }]);
  const setRole = (userId: number, membershipType: MembershipType) =>
    setMembers((prev) => prev.map((x) => (x.userId === userId ? { ...x, membershipType } : x)));
  const removeMember = (userId: number) => setMembers((prev) => prev.filter((x) => x.userId !== userId));

  const submit = () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() =>
        document.querySelector('[data-field-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    onSubmit({
      name: trimmed,
      identifier: editing ? desk!.identifier : identifier,
      description: description.trim(),
      template,
      visibility,
      audiencePermission: visibility === 'restricted' ? audiencePermission : null,
      audienceIds: needsIds ? audienceIds : [],
      isPrimary: editing ? desk!.isPrimary : firstDesk || isPrimary,
    }, members);
  };

  const audienceOptions = audiencePermission === 'department' ? DEPARTMENTS : REQUESTER_GROUPS;
  const audienceIdsLabel = audiencePermission === 'department' ? 'Departments' : 'Requester Groups';

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-4 pb-10 pt-5">
        <div className="max-w-[880px]">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#3D8BD0] hover:underline"
          ><ChevronLeft size={15} /> Service Desks</button>

          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-[20px] font-semibold text-[#364658]">{editing ? desk!.name : 'Create Service Desk'}</h1>
            {editing && desk!.isPrimary && <PrimaryTag />}
          </div>
          {editing && desk!.isPrimary && (
            <p className="mt-1 text-[13px] text-[#7B8FA5]">This is the primary Service Desk. It cannot be deleted.</p>
          )}

          <div className="mt-6 space-y-8">
            {/* ── Details ── */}
            <Section title="Details">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                <Field id="sd-name" label="Name" required error={err('name')}>
                  <input
                    id="sd-name"
                    value={name}
                    maxLength={MAX_NAME}
                    onChange={(e) => onName(e.target.value)}
                    placeholder="e.g. Human Resources"
                    className={inputCls(err('name'))}
                  />
                </Field>

                {editing ? (
                  <Field label="Identifier" helper="The identifier cannot be changed after the Service Desk is created.">
                    <div
                      aria-disabled="true"
                      className="flex h-9 items-center rounded border border-[#E5E7EB] bg-[#F5F7FA] px-3 text-[13px] text-[#64748B]"
                    >{desk!.identifier}</div>
                  </Field>
                ) : (
                  <Field
                    id="sd-identifier"
                    label="Identifier"
                    required
                    error={idError}
                    helper={<>Used in this desk's web address: <code className="rounded bg-[#F1F5F9] px-1 text-[11px] text-[#475569]">/desk/{identifier || '<identifier>'}/</code>. This cannot be changed after the Service Desk is created.</>}
                  >
                    <input
                      id="sd-identifier"
                      value={identifier}
                      maxLength={MAX_IDENTIFIER}
                      onChange={(e) => { setIdTouched(true); setIdentifier(e.target.value); }}
                      placeholder="e.g. human-resources"
                      className={inputCls(idError)}
                    />
                  </Field>
                )}

                <div className="md:col-span-2">
                  <Field id="sd-description" label="Description">
                    <textarea
                      id="sd-description"
                      rows={3}
                      value={description}
                      maxLength={MAX_DESCRIPTION}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full resize-y rounded border border-[#d1d5db] bg-white px-3 py-2 text-[13px] leading-[1.5] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                    />
                    <div className="mt-1 text-right text-[11px] text-[#9CA3AF]">{description.length}/{MAX_DESCRIPTION}</div>
                  </Field>
                </div>

                <Field
                  id="sd-template"
                  label="Template"
                  required
                  helper="A template only pre-fills this desk when it is created. It does not limit what this desk can do later, and it can serve any kind of work."
                >
                  <SelectBox id="sd-template" value={template} onChange={(v) => setTemplate(v as DeskTemplate)}>
                    {TEMPLATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </SelectBox>
                </Field>

                {!editing && (
                  <div className="md:col-span-2">
                    <label className={`inline-flex items-center gap-2.5 ${firstDesk ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={firstDesk || isPrimary}
                        disabled={firstDesk}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="size-4 accent-[#3D8BD0] disabled:opacity-60"
                      />
                      <span className="text-[13px] font-medium text-[#364658]">Make this the primary Service Desk</span>
                    </label>
                    <p className="ml-[26px] mt-1 text-[12px] leading-[1.5] text-[#7B8FA5]">
                      {firstDesk
                        ? 'The first Service Desk is always the primary Service Desk.'
                        : 'The primary Service Desk receives any request that is not routed to another desk. Only one Service Desk can be primary.'}
                    </p>
                    {!firstDesk && isPrimary && currentPrimary && (
                      <p className="ml-[26px] mt-1.5 flex items-center gap-1.5 text-[12px] text-[#B45309]">
                        <TriangleAlert size={13} className="flex-shrink-0" />
                        {currentPrimary.name} will no longer be the primary Service Desk.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Section>

            {/* ── Visibility ── two cards, both descriptions always visible: this choice is the point
                of the screen, so it is not hidden in a dropdown. */}
            <Section title="Visibility">
              <div role="radiogroup" aria-label="Visibility" className="space-y-2.5">
                {VISIBILITY_OPTIONS.map((o) => {
                  const on = visibility === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                        on ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sd-visibility"
                        value={o.value}
                        checked={on}
                        onChange={() => chooseVisibility(o.value)}
                        className="mt-0.5 size-4 flex-shrink-0 accent-[#3D8BD0]"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#364658]">
                          {o.value === 'restricted' && <Lock size={13} className="text-[#B45309]" />}
                          {o.title}
                        </span>
                        <span className="mt-1 block text-[13px] leading-[1.55] text-[#64748B]">{o.desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[12px] text-[#7B8FA5]">
                There are only two settings. Finer control comes from the roles and groups inside the desk.
              </p>

              {visibility === 'restricted' && (
                <div className="mt-4 grid animate-in fade-in-0 slide-in-from-top-1 grid-cols-1 gap-x-5 gap-y-5 border-l-2 border-[#FCD34D] pl-4 duration-200 md:grid-cols-2">
                  <Field
                    id="sd-audience"
                    label="Audience"
                    required
                    helper="Who can see this desk's services and knowledge on the support portal."
                  >
                    <SelectBox
                      id="sd-audience"
                      value={audiencePermission ?? 'all_requesters'}
                      onChange={(v) => chooseAudience(v as AudiencePermission)}
                    >
                      {(Object.keys(AUDIENCE_LABEL) as AudiencePermission[]).map((k) => (
                        <option key={k} value={k}>{AUDIENCE_LABEL[k]}</option>
                      ))}
                    </SelectBox>
                  </Field>
                  {needsIds && (
                    <Field id="sd-audience-ids" label={audienceIdsLabel} required error={err('audienceIds')}>
                      <MultiSelect
                        id="sd-audience-ids"
                        options={audienceOptions}
                        value={audienceIds}
                        onChange={setAudienceIds}
                        placeholder={`Select ${audienceIdsLabel.toLowerCase()}`}
                        error={err('audienceIds')}
                      />
                    </Field>
                  )}
                </div>
              )}
            </Section>

            {/* ── Technicians ── */}
            <Section title="Technicians">
              <div className="rounded-lg border border-[#DBEAFE] bg-[#F5FAFF] px-4 py-3 text-[13px] leading-[1.65] text-[#364658]">
                <p><strong>Role in this desk</strong> decides <em>where</em> a person works and whether they can administer this desk.</p>
                <p><strong>Licence</strong> decides <em>what</em> modules they can use anywhere in ServiceOps.</p>
                <p>A <strong>Desk Technician can be a Manager</strong> — that is the usual shape for a departmental desk.</p>
              </div>
              <p className="mt-2 text-[12px] leading-[1.5] text-[#7B8FA5]">
                Desk Technicians cannot use Asset Management, CMDB, Patch Management, OS Deployment, Endpoints or Vulnerability Management anywhere in ServiceOps.
              </p>

              {err('members') && (
                <div data-field-error className="mt-4 flex items-center gap-2 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#B91C1C]">
                  <TriangleAlert size={14} className="flex-shrink-0" /> {err('members')}
                </div>
              )}

              <div className="mt-4">
                <TechnicianPicker loading={techLoading} addedIds={members.map((x) => x.userId)} onAdd={addMember} />
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead className="border-b border-[#e5e7eb]">
                    <tr>
                      {['Technician', 'Licence', 'Role in this desk', 'Action'].map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb] bg-white">
                    {members.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[#7B8FA5]">
                        No technicians yet. Add at least one Manager to run this Service Desk.
                      </td></tr>
                    ) : members.map((x) => {
                      const t = technicianById(x.userId);
                      if (!t) return null;
                      return (
                        <tr key={x.userId} className="transition-colors hover:bg-[#f9fafb]">
                          <td className="px-4 py-2.5">
                            <div className="text-[13px] font-medium text-[#364658]">{t.name}</div>
                            <div className="text-[12px] text-[#7B8FA5]">{t.email}</div>
                          </td>
                          <td className="px-4 py-2.5"><LicenceTag type={t.licenseType} /></td>
                          <td className="px-4 py-2.5">
                            <SelectBox
                              value={x.membershipType}
                              onChange={(v) => setRole(x.userId, v as MembershipType)}
                              className="w-[150px]"
                            >
                              {(Object.keys(ROLE_LABEL) as MembershipType[]).map((k) => (
                                <option key={k} value={k}>{ROLE_LABEL[k]}</option>
                              ))}
                            </SelectBox>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              aria-label={`Remove ${t.name}`}
                              onClick={() => removeMember(x.userId)}
                              className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                            ><X size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-[#e5e7eb] bg-white px-4 py-3">
        <div className="flex max-w-[880px] justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >Cancel</button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex h-9 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
          >{editing ? 'Save' : 'Create Service Desk'}</button>
        </div>
      </div>
    </div>
  );
}
