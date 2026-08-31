import { useState } from 'react';
import { ChevronDown, Info, Search, X } from 'lucide-react';
import { toast } from 'sonner';

/* Support Portal → Settings.
 *
 * What a requester is ALLOWED to do on the portal, as against the Customization tab which decides
 * what the portal looks like. Nine groups of switches, transcribed from the live product screen.
 *
 * ⚠️ Nothing here is a new control. The switch, the accordion and the chip row all already exist in
 * the ticket detail pages — a tenth switch style would be the fault this builder keeps having to
 * undo, so these are the product's own shapes rather than lookalikes.
 */

type Row =
  | { kind: 'toggle'; key: string; label: string; on?: boolean }
  /** A choice that only exists while its parent toggle is on (Grace Period, Registration Type). */
  | { kind: 'radio'; key: string; label: string; options: string[]; value: string; needs?: string }
  | { kind: 'number'; key: string; label: string; value: string; needs?: string; when?: (v: Record<string, string>) => boolean }
  | { kind: 'chips'; key: string; label: string; help: string; value: string[]; needs?: string };

interface Group { id: string; title: string; rows: Row[] }

/* ⚠️ Transcribed in the product's order, not regrouped. An admin who knows this screen should be
   able to find a setting where they left it. */
const GROUPS: Group[] = [
  {
    id: 'request',
    title: 'Request',
    rows: [
      { kind: 'toggle', key: 'createIncident', label: 'Allow Requester to create Incident', on: true },
      { kind: 'toggle', key: 'guestReport', label: 'Allow Guest Requester to Report a Request', on: true },
      { kind: 'toggle', key: 'onBehalf', label: 'Allow Requester to Create Incident On Behalf Of Other Requester', on: true },
      { kind: 'toggle', key: 'viewDueBy', label: 'Allow Requester to View Request Due By', on: true },
      { kind: 'toggle', key: 'accessSolution', label: 'Allow Requester To Access Solution', on: true },
      { kind: 'toggle', key: 'closeRequest', label: 'Allow Requester to Close Request', on: true },
      { kind: 'toggle', key: 'submitFeedback', label: 'Allow Requester To Submit Feedback', on: true },
      { kind: 'toggle', key: 'mandateComment', label: 'Mandate comment to Reopen Request', on: true },
      { kind: 'toggle', key: 'reopenResolved', label: 'Allow Requester to Reopen Resolved Request', on: true },
      /* ⚠️ TWO grace periods, not one. Resolved and Closed are different states with different
         windows — the live screen ships them on different defaults for exactly that reason, and
         collapsing them into one control would silently change what a reopen means. */
      { kind: 'radio', key: 'graceResolved', label: 'Grace Period', options: ['Unlimited', 'Days'], value: 'Days', needs: 'reopenResolved' },
      { kind: 'number', key: 'graceResolvedDays', label: 'Number of Days', value: '5', needs: 'reopenResolved', when: (v) => v.graceResolved === 'Days' },
      { kind: 'toggle', key: 'reopenClosed', label: 'Allow Requester to Reopen Closed Request', on: true },
      { kind: 'radio', key: 'graceClosed', label: 'Grace Period', options: ['Unlimited', 'Days'], value: 'Unlimited', needs: 'reopenClosed' },
      { kind: 'number', key: 'graceClosedDays', label: 'Number of Days', value: '5', needs: 'reopenClosed', when: (v) => v.graceClosed === 'Days' },
      { kind: 'toggle', key: 'auditTrail', label: 'Allow Requester to access Audit Trail', on: true },
      {
        kind: 'chips', key: 'visibility', label: 'Requester Ticket Visibility',
        help: 'Which requests a requester can see beyond their own.',
        value: ['Group Requests', 'Department Requests'], needs: 'auditTrail',
      },
    ],
  },
  {
    id: 'catalog',
    title: 'Service Catalog',
    rows: [
      { kind: 'toggle', key: 'accessCatalog', label: 'Allow Requester To Access Service Catalog', on: true },
      { kind: 'toggle', key: 'guestService', label: 'Allow Guest Requester to Request for Service', on: true },
      { kind: 'toggle', key: 'serviceOnBehalf', label: 'Allow Requester to Request Service On Behalf Of Other Requester', on: true },
    ],
  },
  { id: 'change', title: 'Change', rows: [{ kind: 'toggle', key: 'myChanges', label: 'Allow Requester To Access My Changes', on: true }] },
  {
    id: 'asset',
    title: 'Asset',
    rows: [
      { kind: 'toggle', key: 'myAssets', label: 'Allow Requester to Access My Assets', on: true },
      { kind: 'toggle', key: 'barcode', label: 'Allow Requester To View Barcode / QR Code', on: true },
      { kind: 'toggle', key: 'linkAsset', label: 'Allow Requester to Link Asset', on: true },
      { kind: 'toggle', key: 'linkOtherAsset', label: 'Allow Requester to link Asset of other Requester', on: true },
      { kind: 'toggle', key: 'autoLinkAsset', label: "Auto-Link Requester's Assets", on: true },
    ],
  },
  {
    id: 'cmdb',
    title: 'CMDB',
    rows: [
      { kind: 'toggle', key: 'myCi', label: 'Allow Requester to Access My CI', on: true },
      { kind: 'toggle', key: 'linkCi', label: 'Allow Requester to Link CI', on: true },
      { kind: 'toggle', key: 'linkOtherCi', label: 'Allow Requester to link CI of other Requester', on: true },
      { kind: 'toggle', key: 'autoLinkCi', label: "Auto-Link Requester's CI", on: true },
    ],
  },
  {
    id: 'knowledge',
    title: 'Knowledge',
    rows: [
      { kind: 'toggle', key: 'accessKnowledge', label: 'Allow Requester To Access Knowledge', on: true },
      { kind: 'toggle', key: 'suggestKnowledge', label: 'Show Suggested Knowledge while creating new Request', on: true },
    ],
  },
  {
    id: 'approval',
    title: 'Approval',
    rows: [
      { kind: 'toggle', key: 'myApprovals', label: 'Allow Requester To Access My Approvals', on: true },
      { kind: 'toggle', key: 'approvalsTab', label: "Show 'Approvals' tab (in Request Detailed View) in Support Portal", on: true },
    ],
  },
  {
    id: 'signature',
    title: 'Digital Signature',
    /* The only switch that ships OFF. */
    rows: [{ kind: 'toggle', key: 'signatureTab', label: "Show 'Signature' tab in Support Portal", on: false }],
  },
  {
    id: 'user',
    title: 'User',
    rows: [
      { kind: 'toggle', key: 'selfRegistration', label: 'Allow Self Registration', on: true },
      { kind: 'radio', key: 'registrationType', label: 'Registration Type', options: ['Allow everyone', 'Set of Domains'], value: 'Allow everyone', needs: 'selfRegistration' },
    ],
  },
];

/* ── the product's own switch ─────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-[18px] w-[34px] flex-shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-[#16A34A]' : 'bg-[#CBD5E1]'
      }`}
    >
      <span className={`inline-block size-[14px] rounded-full bg-white transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

function Radio({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-5">
      {options.map((o) => (
        <label key={o} className="inline-flex cursor-pointer items-center gap-2">
          <span className={`flex size-4 items-center justify-center rounded-full border ${value === o ? 'border-[#3D8BD0]' : 'border-[#CBD5E1]'}`}>
            {value === o && <span className="size-2 rounded-full bg-[#3D8BD0]" />}
          </span>
          <span className="text-[13px] text-[#364658]">{o}</span>
          <input type="radio" checked={value === o} onChange={() => onChange(o)} className="sr-only" />
        </label>
      ))}
    </div>
  );
}

export function AdminSupportPortalSettings({ compact = false }: {
  /* ⚠️ Rendered inside the builder's 340px rail panel, not on a full admin page. Only the CHROME
     changes — the padding, and a toolbar that stacks instead of sitting on one line. The settings
     themselves are the same rows in the same order, because they are the same settings; a second
     narrow variant of the list would be two things to keep in step. */
  compact?: boolean;
} = {}) {
  /* ⚠️ Holds what is SHUT, not what is open. Nine sections all open is the resting state, so the
     list that has to be remembered is the exceptions — and a section added later is open without
     anyone remembering to name it here. */
  const [shut, setShut] = useState<string[]>([]);
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const t: Record<string, boolean> = {};
    GROUPS.forEach((g) => g.rows.forEach((r) => { if (r.kind === 'toggle') t[r.key] = r.on ?? true; }));
    return t;
  });
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    GROUPS.forEach((g) => g.rows.forEach((r) => { if (r.kind === 'radio' || r.kind === 'number') v[r.key] = r.value; }));
    return v;
  });
  const [chips, setChips] = useState<Record<string, string[]>>(() => {
    const c: Record<string, string[]> = {};
    GROUPS.forEach((g) => g.rows.forEach((r) => { if (r.kind === 'chips') c[r.key] = r.value; }));
    return c;
  });
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();
  /* ⚠️ Search matches a ROW, not just a section title. Nine collapsed accordions above one search
     box means the first thing anybody types is a setting name — a search that only matched headings
     would look broken on its first use. A group survives if IT matches or any of its rows do, and a
     matching group is force-opened so the hit is visible without a second click. */
  const matches = (r: Row) => !query || r.label.toLowerCase().includes(query);
  const shown = GROUPS
    .map((g) => ({ ...g, rows: g.title.toLowerCase().includes(query) ? g.rows : g.rows.filter(matches) }))
    .filter((g) => g.rows.length);

  /* ⚠️ Open is the RESTING state. Nine collapsed sections made the panel arrive as a list of nine
     words: you had to guess which one held the switch you wanted and open it to find out. A section
     you deliberately close stays closed, and one added later is open without anyone remembering to
     name it here — which is why the state holds what is SHUT rather than what is open. */
  const isOpen = (id: string) => (query ? true : !shut.includes(id));
  const toggleGroup = (id: string) =>
    setShut((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const renderRow = (r: Row) => {
    /* A dependent row is REMOVED when its parent is off, not disabled — the same §2.2 rule the
       widget drawer follows. A greyed control invites you to wonder what it would have done. */
    if (r.kind !== 'toggle' && r.needs && !toggles[r.needs]) return null;
    if (r.kind === 'number' && r.when && !r.when(values)) return null;

    if (r.kind === 'toggle') {
      return (
        <div key={r.key} className="flex items-center gap-3 py-2.5">
          <Toggle on={!!toggles[r.key]} onChange={(v) => setToggles((t) => ({ ...t, [r.key]: v }))} />
          <span className="text-[13px] text-[#364658]">{r.label}</span>
        </div>
      );
    }
    if (r.kind === 'radio') {
      return (
        <div key={r.key} className="py-2.5 pl-[46px]">
          <p className="mb-1.5 text-[12px] text-[#7B8FA5]">{r.label}</p>
          <Radio options={r.options} value={values[r.key]} onChange={(v) => setValues((s) => ({ ...s, [r.key]: v }))} />
        </div>
      );
    }
    if (r.kind === 'number') {
      return (
        <div key={r.key} className="py-2.5 pl-[46px]">
          <p className="mb-1.5 text-[12px] text-[#7B8FA5]">{r.label}</p>
          <input
            value={values[r.key]}
            onChange={(e) => setValues((s) => ({ ...s, [r.key]: e.target.value.replace(/[^0-9]/g, '') }))}
            className="h-9 w-[280px] rounded border border-[#d1d5db] px-2.5 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
          />
        </div>
      );
    }
    return (
      <div key={r.key} className="py-2.5 pl-[46px]">
        <p className="mb-1.5 inline-flex items-center gap-1.5 text-[12px] text-[#7B8FA5]">
          {r.label}
          <span title={r.help}><Info size={12} className="cursor-help text-[#9CA3AF]" /></span>
        </p>
        <div className="flex min-h-9 w-[420px] max-w-full flex-wrap items-center gap-1.5 rounded border border-[#d1d5db] px-2 py-1.5">
          {chips[r.key].map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] text-[#364658]">
              {c}
              <button
                onClick={() => setChips((s) => ({ ...s, [r.key]: s[r.key].filter((x) => x !== c) }))}
                className="text-[#9CA3AF] hover:text-[#364658]"
              ><X size={11} /></button>
            </span>
          ))}
          <ChevronDown size={14} className="ml-auto flex-shrink-0 text-[#9CA3AF]" />
        </div>
      </div>
    );
  };

  return (
    /* ⚠️ A column with its own scroller, so the footer below can stay put. Without the flex column
       the whole panel scrolled as one and a "sticky" footer had nothing to be sticky inside. */
    <div className="flex h-full min-h-0 flex-col">
    {/* ⚠️ `pt-4` on the compact variant. It had `pb-6` and NO top padding, which was survivable
       while this only ever rendered inside the builder's rail — that panel supplied its own space
       above. In a drawer it sits directly under the header's divider, so the search field was
       welded to the rule above it with nothing between them. A container that happens to give a
       component air is not the same as the component asking for it, and the second one is what
       survives being put somewhere else. */}
    <div className={`min-h-0 flex-1 overflow-y-auto ${compact ? 'px-4 pb-6 pt-4' : 'px-4 py-6'}`}>
      <div className={`mb-4 gap-2 ${compact ? 'flex flex-col' : 'flex items-center gap-3'}`}>
        <div className={compact ? 'relative w-full' : 'relative w-[280px]'}>
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="h-9 w-full rounded border border-[#d1d5db] pl-8 pr-2.5 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0]"
          />
        </div>

      </div>

      {shown.map((g) => (
        <div key={g.id} className="border-b border-[#e5e7eb]">
          <button
            onClick={() => toggleGroup(g.id)}
            className="flex w-full items-center justify-between py-3 text-left"
          >
            <span className="text-[14px] font-semibold text-[#364658]">{g.title}</span>
            <ChevronDown size={16} className={`text-[#9CA3AF] transition-transform ${isOpen(g.id) ? 'rotate-180' : ''}`} />
          </button>
          {isOpen(g.id) && <div className="pb-3">{g.rows.map(renderRow)}</div>}
        </div>
      ))}

      {!shown.length && (
        <p className="py-16 text-center text-[13px] text-[#9CA3AF]">No setting matches “{q}”.</p>
      )}
    </div>

    {/* ⚠️ NO footer actions. Every other panel in this builder applies as you change it, so two
        buttons committing "the whole panel" promised a transaction the rest of the surface does not
        have — and left you wondering whether the switch you had just flipped had taken. Branding
        keeps its footer because branding reaches every login screen and every other portal; a
        portal's own settings do not. */}
    </div>
  );
}
