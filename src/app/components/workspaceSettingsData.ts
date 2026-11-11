/* Who owns a setting record: the Organization or one workspace. ESM F04 (`Features/F04-admin-settings-split.md`).
 *
 * Every Workspace-only and Shared + own record carries an owner. ServiceOps already keeps these as lists (many
 * calendars, many SLAs), so F04 adds one field rather than a new screen:
 *   - Business Hours = Shared + own (D3): the organization's calendars can be used in every workspace, read-only
 *     there; a workspace adds its own. Holidays live inside a calendar [VERIFIED 172.16.15.185, 2026-11-02].
 *   - SLA = Organization + own (F04 rev. 2, Juli 2026-11-03, Q2 — replaces D1's workspace-only): a ticket is matched
 *     against its workspace's SLAs first, then the organization's (Freshservice's order: local → global → default,
 *     ESM-serviceops/Freshservice-Analysis/11 §3). An organization SLA can be aimed at some workspaces only. An SLA on
 *     Business Hours picks a calendar from the organization's plus its own workspace's (organization SLAs: the
 *     organization's only).
 * Seeds are the live records on 172.16.15.185 (2026-10-30/11-02). On upgrade, existing calendars become the
 * organization's and existing SLAs go to the Default IT workspace (F04 §5.6), so the IT rows below are today's. */

export type Owner = 'org' | number;
export const ORG: Owner = 'org';

export interface Holiday { name: string; date: string; recurring: boolean }
export interface BusinessHours {
  id: number; owner: Owner; name: string; description: string; timeZone: string;
  mode: '24x7' | 'custom'; days: string[]; from: string; to: string; holidays: Holiday[]; isDefault?: boolean;
}

export type SlaModule = 'Request' | 'Problem' | 'Change' | 'Release';
export type SlaType = 'SLA and OLA' | 'UC';
export interface Sla {
  id: number; owner: Owner;
  /** Organization SLAs only: the workspaces it is matched in. Empty = every workspace. */
  workspaces?: number[]; module: SlaModule; name: string; type: SlaType;
  /** null = Calendar Hours (round the clock); otherwise the Business Hours record it counts in. */
  hoursId: number | null; enabled: boolean; response: string; resolution: string; ola: boolean;
}

export const TIME_ZONES = ['(GMT+05:30) Kolkata', '(GMT+05:30) Calcutta', '(GMT-08:00) Tijuana', '(GMT+00:00) London', '(GMT+04:00) Dubai', '(GMT-05:00) New York'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const SEED_HOURS: BusinessHours[] = [
  { id: 1, owner: ORG, name: 'add1', description: '', timeZone: '(GMT-08:00) Tijuana', mode: '24x7', days: DAYS, from: '00:00', to: '23:59', holidays: [] },
  { id: 2, owner: ORG, name: 'Office Business hours', description: 'Business hours for Laptop Request SLA', timeZone: '(GMT+05:30) Kolkata', mode: 'custom', days: WEEK, from: '09:00', to: '18:00', holidays: [{ name: 'Republic Day', date: '2026-01-26', recurring: true }] },
  { id: 3, owner: ORG, name: 'test', description: '', timeZone: '(GMT+05:30) Calcutta', mode: 'custom', days: WEEK, from: '10:00', to: '19:00', holidays: [] },
  { id: 4, owner: ORG, name: 'Default', description: 'Default Business Calendar', timeZone: '(GMT+05:30) Kolkata', mode: 'custom', days: WEEK, from: '09:00', to: '18:00', isDefault: true,
    holidays: [{ name: 'Republic Day', date: '2026-01-26', recurring: true }, { name: 'Independence Day', date: '2026-08-15', recurring: true }, { name: 'Diwali', date: '2026-11-08', recurring: false }] },
  { id: 5, owner: 2, name: 'HR Office Hours', description: 'HR helpdesk, weekdays', timeZone: '(GMT+05:30) Kolkata', mode: 'custom', days: WEEK, from: '09:30', to: '18:30', holidays: [{ name: 'Annual HR offsite', date: '2026-12-18', recurring: false }] },
  { id: 6, owner: 3, name: 'Facilities Security Desk', description: 'Building security is staffed round the clock', timeZone: '(GMT+05:30) Kolkata', mode: '24x7', days: DAYS, from: '00:00', to: '23:59', holidays: [] },
];

const SEED_SLAS: Sla[] = [
  // IT: today's live list (Request tab).
  { id: 1, owner: 1, module: 'Request', name: 'uc test', type: 'UC', hoursId: null, enabled: true, response: '---', resolution: '5 Minutes', ola: false },
  { id: 2, owner: 1, module: 'Request', name: 'SD', type: 'SLA and OLA', hoursId: null, enabled: true, response: '5 Minutes', resolution: '5 Days', ola: false },
  { id: 3, owner: 1, module: 'Request', name: 'Critical Bug Resolution', type: 'SLA and OLA', hoursId: null, enabled: false, response: '30 Minutes', resolution: '8 Hours', ola: true },
  { id: 4, owner: 1, module: 'Request', name: 'Hardware Repair', type: 'UC', hoursId: null, enabled: false, response: '---', resolution: '1 Hour', ola: false },
  { id: 5, owner: 1, module: 'Request', name: 'Software Installation', type: 'SLA and OLA', hoursId: 4, enabled: false, response: '10 Minutes', resolution: '15 Minutes', ola: true },
  { id: 6, owner: 1, module: 'Request', name: 'Low Impact', type: 'SLA and OLA', hoursId: null, enabled: true, response: '30 Minutes', resolution: '60 Hours', ola: false },
  { id: 7, owner: 1, module: 'Request', name: 'Standard Login Issue', type: 'SLA and OLA', hoursId: 2, enabled: false, response: '4 Hours', resolution: '24 Hours', ola: true },
  { id: 8, owner: 1, module: 'Problem', name: 'Major Problem RCA', type: 'SLA and OLA', hoursId: 4, enabled: true, response: '1 Hour', resolution: '5 Days', ola: false },
  { id: 9, owner: 1, module: 'Change', name: 'Emergency Change', type: 'SLA and OLA', hoursId: null, enabled: true, response: '15 Minutes', resolution: '4 Hours', ola: false },
  // Other workspaces start from their template (F07).
  { id: 10, owner: 2, module: 'Request', name: 'Payroll Query', type: 'SLA and OLA', hoursId: 5, enabled: true, response: '4 Hours', resolution: '2 Days', ola: false },
  { id: 11, owner: 2, module: 'Request', name: 'Onboarding', type: 'SLA and OLA', hoursId: 4, enabled: true, response: '1 Day', resolution: '5 Days', ola: true },
  { id: 12, owner: 3, module: 'Request', name: 'Building Access Card', type: 'SLA and OLA', hoursId: 6, enabled: true, response: '30 Minutes', resolution: '4 Hours', ola: false },
  // Organization: the fallback every workspace's requests meet when none of its own SLAs match.
  { id: 13, owner: ORG, workspaces: [], module: 'Request', name: 'Organization Standard SLA', type: 'SLA and OLA', hoursId: 4, enabled: true, response: '8 Hours', resolution: '3 Days', ola: false },
  { id: 14, owner: ORG, workspaces: [1], module: 'Change', name: 'Change Review Window', type: 'SLA and OLA', hoursId: 4, enabled: true, response: '1 Day', resolution: '5 Days', ola: false },
];

export interface SettingsStore { hours: BusinessHours[]; slas: Sla[] }
const KEY = 'serviceops.esm.settings.v2';

export function loadSettings(): SettingsStore {
  try { const raw = window.localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as SettingsStore; } catch { /* storage unavailable */ }
  return { hours: SEED_HOURS, slas: SEED_SLAS };
}
export function saveSettings(s: SettingsStore) { try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } }

export const workingHoursLabel = (h: BusinessHours) => (h.mode === '24x7' ? '24 hrs X 7 days' : 'Custom');
/** Organization SLAs a workspace meets after its own (Q2): every-workspace ones plus those aimed at it. */
export const orgSlasFor = (all: Sla[], workspaceId: number, module: SlaModule) =>
  all.filter((s) => s.owner === ORG && s.module === module && (!s.workspaces?.length || s.workspaces.includes(workspaceId)));

/** Calendars an SLA in this workspace may count in: the organization's, then the workspace's own. */
export const hoursUsableIn = (all: BusinessHours[], workspaceId: number) =>
  [...all.filter((h) => h.owner === ORG), ...all.filter((h) => h.owner === workspaceId)];
