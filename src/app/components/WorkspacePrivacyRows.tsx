import { useState } from 'react';
import { Check, Lock, Search, ShieldAlert, Users, X } from 'lucide-react';
import { adminIdsOf } from './workspaceData';
import type { PortalAccess, ViewAs, Workspace } from './workspaceData';

/* Two rows on the workspace record page (Details card), ESM F05 + F02a §9:
 *   Confidential   — only members see its tickets and settings (Super Admin and Manage All Workspaces stop at the wall).
 *                    Only a member with Edit Workspace Details there may change it; ≥1 member who can give roles.
 *   Portal Access  — which employees see this workspace on the Support Portal: All logged-in users (default) / Public /
 *                    Selected requester groups (+ Except). Same three words as the ServiceOps catalog item's Access
 *                    Permission. "Visible to N of M employees" + Check a person.
 * Requester groups and employees below are DEMO data (rule-based groups in ServiceOps: Department, Location, Company…). */

export const REQUESTER_GROUPS: { name: string; rule: string; count: number; test: (e: Employee) => boolean }[] = [
  { name: 'Contractors', rule: 'Employee type = Contractor', count: 180, test: (e) => e.type === 'Contractor' },
  { name: 'Directors', rule: 'Designation = Director or above', count: 25, test: (e) => e.director },
  { name: 'India staff', rule: 'Location = India', count: 900, test: (e) => e.location === 'India' },
  { name: 'US staff', rule: 'Location = US', count: 420, test: (e) => e.location === 'US' },
  { name: 'Leavers', rule: 'Status = Notice period', count: 30, test: (e) => e.leaver },
  { name: 'Legal pilot', rule: 'Static list', count: 20, test: (e) => e.name === 'Kiran Shah' },
];
export const TOTAL_EMPLOYEES = 1500;
interface Employee { name: string; type: 'Employee' | 'Contractor'; location: 'India' | 'US'; director: boolean; leaver: boolean }
export const EMPLOYEES: Employee[] = [
  { name: 'Ravi Kumar', type: 'Contractor', location: 'India', director: false, leaver: false },
  { name: 'Anita Rao', type: 'Employee', location: 'US', director: true, leaver: false },
  { name: 'Karan Mehta', type: 'Employee', location: 'India', director: false, leaver: false },
  { name: 'Lisa Brown', type: 'Employee', location: 'US', director: false, leaver: true },
  { name: 'Kiran Shah', type: 'Employee', location: 'India', director: false, leaver: false },
];
const groupsOf = (e: Employee) => REQUESTER_GROUPS.filter((g) => g.test(e)).map((g) => g.name);
const DEFAULT: PortalAccess = { mode: 'logged_in', groups: [], except: [] };

/** Can this employee see the workspace on the portal? (same rule the server applies) */
export function portalVerdict(w: Workspace, e: Employee): { ok: boolean; why: string } {
  if (w.status !== 'live') return { ok: false, why: `${w.name} is ${w.status === 'setup' ? 'in Setup' : 'Inactive'}: hidden from all employees.` };
  const pa = w.portalAccess ?? DEFAULT;
  const mine = groupsOf(e);
  const excluded = pa.except.find((g) => mine.includes(g));
  if (excluded) return { ok: false, why: `${e.name} is in “${excluded}”, which is excluded.` };
  if (pa.mode === 'groups') {
    const hit = pa.groups.find((g) => mine.includes(g));
    return hit ? { ok: true, why: `${e.name} is in “${hit}”.` } : { ok: false, why: `${e.name} is in none of: ${pa.groups.join(', ') || '(no group chosen)'}.` };
  }
  return { ok: true, why: pa.mode === 'public' ? 'Public: everyone, guests too.' : 'All logged-in users.' };
}
/** Rough audience size for the summary line (demo: groups don't overlap). */
export function audienceSize(pa: PortalAccess) {
  const sum = (names: string[]) => names.reduce((n, g) => n + (REQUESTER_GROUPS.find((x) => x.name === g)?.count ?? 0), 0);
  const base = pa.mode === 'groups' ? sum(pa.groups) : TOTAL_EMPLOYEES;
  return Math.max(0, base - sum(pa.except));
}
export const portalSummary = (pa: PortalAccess = DEFAULT) =>
  `${pa.mode === 'public' ? 'Public' : pa.mode === 'groups' ? `Only ${pa.groups.join(', ') || '(no group)'}` : 'All logged-in users'}${pa.except.length ? ` · except ${pa.except.join(', ')}` : ''}`;

const chip = (on: boolean) => `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0]'}`;

export function ConfidentialRow({ w, viewAs, canEdit, onChange }: { w: Workspace; viewAs: ViewAs; canEdit: boolean; onChange: (on: boolean) => void }) {
  const [ask, setAsk] = useState(false);
  const member = w.setup.memberIds.includes(viewAs);
  const allowed = canEdit && member;
  const keepers = adminIdsOf(w).length;
  const on = !!w.confidential;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" role="switch" aria-checked={on} aria-label="Confidential" disabled={!allowed || ask} onClick={() => setAsk(true)}
          className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'bg-[#7C3AED]' : 'bg-[#CBD5E1]'}`}>
          <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#364658]">{on ? <><Lock size={13} className="text-[#7C3AED]" /> On</> : 'Off'}</span>
        {!allowed && <span className="text-[12px] text-[#94A3B8]">{!member ? 'Only members of this workspace can change it.' : 'Needs Edit Workspace Details here.'}</span>}
      </div>
      {ask && (
        <div className="mt-3 rounded-lg border border-[#E9D5FF] bg-[#FAF5FF] p-3 text-[13px] text-[#364658]">
          <div className="flex items-start gap-2"><ShieldAlert size={16} className="mt-0.5 text-[#7C3AED]" />
            <div>{on
              ? <>Turn confidential <b>off</b>? Super Admin and people with Manage All Workspaces will see {w.name}’s tickets and settings again.</>
              : <>Make {w.name} <b>confidential</b>? Only its <b>{w.setup.memberIds.length} members</b> will see its tickets and settings. Super Admin and Organization Admins who aren’t members lose access, and its tickets disappear from their lists, reports, search and links.</>}
              {!on && keepers === 0 && <p className="mt-1 text-[12px] text-[#B91C1C]">First give someone here a role with Assign Roles in Workspace, so the workspace isn’t locked out.</p>}
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setAsk(false)} className="h-8 rounded px-3 text-[13px] text-[#64748B] hover:bg-white">Cancel</button>
            <button disabled={!on && keepers === 0} onClick={() => { onChange(!on); setAsk(false); }} className="h-8 rounded bg-[#7C3AED] px-3.5 text-[13px] font-medium text-white hover:bg-[#6D28D9] disabled:opacity-40">{on ? 'Turn off' : 'Make confidential'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PortalAccessRow({ w, canEdit, onChange }: { w: Workspace; canEdit: boolean; onChange: (pa: PortalAccess) => void }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<PortalAccess>(w.portalAccess ?? DEFAULT);
  const [who, setWho] = useState('');
  const pa = edit ? draft : w.portalAccess ?? DEFAULT;
  const toggle = (k: 'groups' | 'except', g: string) => setDraft((d) => ({ ...d, [k]: d[k].includes(g) ? d[k].filter((x) => x !== g) : [...d[k], g] }));
  const person = EMPLOYEES.find((e) => e.name === who);
  const verdict = person ? portalVerdict({ ...w, portalAccess: pa }, person) : null;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[13px] text-[#364658]">{portalSummary(pa)}</span>
        <span className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#475569]"><Users size={12} /> Visible to {audienceSize(pa).toLocaleString()} of {TOTAL_EMPLOYEES.toLocaleString()} employees</span>
        {canEdit && !edit && <button onClick={() => { setDraft(w.portalAccess ?? DEFAULT); setEdit(true); }} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">Change</button>}
      </div>
      {edit && (
        <div className="mt-3 space-y-3 rounded-lg border border-[#DCEBFA] bg-[#F8FBFF] p-3">
          <div className="flex flex-wrap gap-1.5">
            {([['logged_in', 'All logged-in users'], ['public', 'Public'], ['groups', 'Selected requester groups']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setDraft((d) => ({ ...d, mode: k }))} className={chip(draft.mode === k)}>{draft.mode === k && <Check size={11} strokeWidth={3} />}{l}</button>
            ))}
          </div>
          {draft.mode === 'groups' && (
            <div><div className="mb-1 text-[12px] font-medium text-[#475569]">Only these requester groups</div>
              <div className="flex flex-wrap gap-1.5">{REQUESTER_GROUPS.map((g) => <button key={g.name} type="button" title={g.rule} onClick={() => toggle('groups', g.name)} className={chip(draft.groups.includes(g.name))}>{g.name}<span className="opacity-70">· {g.count}</span></button>)}</div></div>
          )}
          <div><div className="mb-1 text-[12px] font-medium text-[#475569]">Except these requester groups</div>
            <div className="flex flex-wrap gap-1.5">{REQUESTER_GROUPS.map((g) => <button key={g.name} type="button" title={g.rule} onClick={() => toggle('except', g.name)} className={chip(draft.except.includes(g.name))}>{draft.except.includes(g.name) && <X size={11} />}{g.name}</button>)}</div></div>
          <p className="text-[12px] text-[#7B8FA5]">Groups are rule-based (e.g. Contractors = Employee type is Contractor), so people join and leave automatically. Items and knowledge folders can only narrow this further. Outside the audience, the workspace’s card, items, articles and search results are hidden, and a direct link says “not found”. People keep their own old tickets here (read and reply).</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEdit(false)} className="h-8 rounded px-3 text-[13px] text-[#64748B] hover:bg-white">Cancel</button>
            <button disabled={draft.mode === 'groups' && !draft.groups.length} onClick={() => { onChange(draft); setEdit(false); }} className="h-8 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0] disabled:opacity-40">Save</button>
          </div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[12px] text-[#64748B]"><Search size={12} /> Check a person</span>
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Check a person" className="app-select h-8 rounded border border-[#d1d5db] bg-white px-2 text-[12px]">
          <option value="">Choose an employee…</option>
          {EMPLOYEES.map((e) => <option key={e.name}>{e.name}</option>)}
        </select>
        {verdict && <span className={`text-[12px] ${verdict.ok ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>{verdict.ok ? 'Yes' : 'No'} — {verdict.why}</span>}
      </div>
    </div>
  );
}
