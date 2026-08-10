# Handoff — 2026-08-11

## Read first
CLAUDE.md `## Key context` → the **Global Search** bullet, then the **BOM Management (Admin)** bullet. The brief this feature implements is [ServiceOps_Global_Search_Claude_Prompt.md](ServiceOps_Global_Search_Claude_Prompt.md). The V2 rule still stands ("version 2" feature asks → `TicketDrawerV2.tsx` only).

## What we worked on this session
Two features: the **BOM Management admin module**, then **Global Search**.

## Completed — Global Search
- `globalSearchData.ts` — the index, the query language, the ranking, the permission gate, and the history store.
- `GlobalSearch.tsx` — the header pill and the overlay, covering all 20 states the brief asks for.
- Wired into `Header` (pill before Calendar) and `App` (overlay mounted inside the drawer host).

All 20 states verified in the browser, including: exact-ID promotion opening the real Problem drawer, the below-threshold local-only path, the 50-result cap message, operator chips and Tab completion, per-group failure, total failure, progressive loading, the requester universe, the no-permission role hiding the affordance, `See all N` carrying the query into the module list, and the stale-response race guard (type `VPN`, switch to `printer` — the VPN response never renders).

## Completed — BOM Management (Admin)
See the previous handoff section in git history for detail; `bomAdminData.ts`, `AdminBomTargeting.tsx`, `AdminBomModule.tsx`, wired into the Admin sidebar under IT Operations.

## Deliberate deviations from the brief
- **14 groups, not 12.** Patches and Vulnerabilities are inserted after Configuration Items because this product genuinely has those modules and a service-desk technician searches them daily. Endpoints go under Configuration Items (the BOM listing already calls them "Agent CIs"); Licenses, Contracts and Purchases go under Assets, each keeping its own row-level type label. Inventing a group per record type would have broken the stable ordering the brief cares about, for no gain — the row already says what it is.
- **§33 preview panel is not built.** The brief calls it a later phase; agreed with the user to keep V1 focused.
- **Permissions are enforced in the UI layer.** §19-§21 require server-side filtering, which a mock prototype cannot have. `visibleTo()` is the single gate, applied before ranking, so the shape is right and there is one place to move server-side.

## In progress
Nothing mid-flight.

## Next steps
- Not yet pushed or deployed at the time of writing.
- `Ctrl/⌘+Enter` (open in new tab) reports a toast rather than opening a second window — the prototype has no routing.
- Knowledge, Projects, Users and Reports are indexed but have no detail pages here, so opening one reports its route.
- Learned ranking (§35) is only the "frequently opened" list; results are not yet re-ordered by open count.

## Gotchas & notes
- ⚠️ `globalSearchData.ts` must build its index **lazily**. It imports every list page, and those import the drawer host, which imports them back — a module-level build would run inside that cycle and see `undefined` pools. Static imports are fine; the lazy build is what matters.
- ⚠️ The **race guard is load-bearing**. `requestRef` increments per keystroke and a resolved search whose id no longer matches is dropped. Without it a slow response for an abandoned query overwrites newer results.
- ⚠️ `visibleTo()` must stay the only permission gate, and must run **before** ranking and counting. Filtering in the render layer would still leak counts and "see all N".
- Chrome vertically centres `<button>` content, so a card with a one-line description floats against a taller neighbour. `flex flex-col items-start` fixes it.
- ⚠️ `StatusDot`'s on-test is anchored (`/^(active|enabled)$/i`) — an unanchored `/active/` matches "Inactive" and paints it green.
- `vite build` does NOT typecheck (the script is bare `vite build`), so type errors and missing imports compile through silently. Verify in the browser, not just by building.
- Vite's file watcher crashed once with `EBUSY` on `ServiceOps_Global_Search_Claude_Prompt.md` while another process held it open. Not a code fault; restart `pnpm dev` once the lock clears.
- `pnpm` is not on PATH by default here; `corepack prepare pnpm@10 --activate` fixes it. `npm install` still crashes on this pnpm-managed tree.
- Run `git status --short` before staging; do not blind-`git add -A` (a `credentials.txt` was committed to a public repo that way earlier in this project).
