import { scopeLabel } from './workspaceData';
import type { MemberAccess } from './workspaceData';

/* One plain sentence for a technician's access in one workspace — used in previews, toasts and the audit log.
 * Roles are not part of it: they belong to the person, not to a workspace (F03 rethink, 2026-11-03). */
export const accessSentence = (a: MemberAccess) =>
  `${scopeLabel(a)}${a.groups.length ? ` · ${a.groups.join(', ')}` : ' · no group'}${(a.roles ?? []).length ? ` · ${(a.roles ?? []).join(', ')}` : ''}`;
