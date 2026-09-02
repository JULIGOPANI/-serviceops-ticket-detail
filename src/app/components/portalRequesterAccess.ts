/* Support Portal — what this portal actually exposes to a requester.
 *
 * One source of truth for the Settings screen's toggles, so the Custom Data Widget's module list
 * can be a FACT about this portal rather than a hopeful copy of one.
 *
 * ⚠️ Why this exists at all: a Custom Data Widget pointed at a module the portal does not expose
 * renders an empty card to every visitor, and nothing on the canvas says why — the admin sees a
 * widget that looks broken and goes looking for the bug in the widget. Reading the same switches
 * the portal reads makes that state unreachable instead of merely discouraged.
 *
 * ⚠️ Module-scope, not React state. The Settings panel and the widget drawer are never mounted
 * together (one is a rail panel, the other a drawer over the canvas), so lifting this into a shared
 * parent would mean threading it through the whole builder to join two screens that never meet.
 * A store both can read is smaller and does not put layout in charge of data.
 */

import { useSyncExternalStore } from 'react';

/* The toggle keys the Settings screen owns. Named here rather than imported so the settings list
   can grow without every new switch becoming a module gate by accident. */
export type AccessKey =
  | 'myChanges' | 'myAssets' | 'myCi' | 'myApprovals' | 'accessKnowledge';

/* ⚠️ Everything ON is the resting state, matching the Settings screen's own defaults — a portal
   that has never been configured shows every module, which is what a new admin expects to find. */
const state: Record<string, boolean> = {
  myChanges: true,
  myAssets: true,
  myCi: true,
  myApprovals: true,
  accessKnowledge: true,
};

const listeners = new Set<() => void>();

/* A new object each write, because `useSyncExternalStore` compares snapshots by identity: mutating
   in place would leave every subscriber convinced nothing had changed. */
let snapshot: Record<string, boolean> = { ...state };

const emit = () => {
  snapshot = { ...state };
  listeners.forEach((l) => l());
};

export const portalAccess = {
  get: (key: string) => state[key] ?? true,
  set: (key: string, on: boolean) => { state[key] = on; emit(); },
  /** Replace many at once — the Settings screen's own setter shape. */
  merge: (next: Record<string, boolean>) => { Object.assign(state, next); emit(); },
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  snapshot: () => snapshot,
};

/** Re-renders the caller whenever any toggle changes. */
export const usePortalAccess = () =>
  useSyncExternalStore(portalAccess.subscribe, portalAccess.snapshot, portalAccess.snapshot);

/* ⚠️ Returns WHY, not just whether. A module missing from a dropdown with no explanation is the
   same dead end as an empty card — the admin still cannot tell whether they mis-clicked, whether
   the feature exists, or where to go and change it. */
export type ModuleAvailability =
  | { available: true }
  | { available: false; reason: string; fixable: boolean };

export function moduleAvailability(m: { label: string; requires?: string }): ModuleAvailability {
  if (m.requires && !portalAccess.get(m.requires)) {
    return {
      available: false,
      reason: `This portal does not give requesters access to ${m.label}.`,
      fixable: true,
    };
  }
  return { available: true };
}
