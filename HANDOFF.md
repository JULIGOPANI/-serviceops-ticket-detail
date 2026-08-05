# Handoff — 2026-08-06

## Read first
CLAUDE.md `## Key context` → the three **BOM** bullets (BOM tab on the Endpoint detail page, BOM sub-screens, BOM data), plus the **BOM** entry under `## Structure`. The V2 rule still stands ("version 2" feature asks → `TicketDrawerV2.tsx` only).

## What we worked on this session
Two things: (1) the project was set up to run locally and published to a new GitHub repo; (2) the **BOM module** was designed and built — listing + detail, modelled on the reference implementation at <https://zenichakalasiya.github.io/serviceops-bom/>.

## Completed
- **Repo + deploy**: `pnpm` activated via corepack, `pnpm install` / `pnpm dev` / `pnpm build` all clean. Published to **<https://github.com/zenichakalasiya/serviceops-ticket-detail>** (public), live at **<https://zenichakalasiya.github.io/serviceops-ticket-detail/>** via the existing Actions workflow. `vite.config.ts` `base` was repointed from `/ServiceOps-Ticket-Detail-/` to `/serviceops-ticket-detail/`.
  - ⚠️ The repo `serviceops-bom` already existed on that account holding a DIFFERENT project ("ServiceOps module replicas"); it was left untouched and a new repo name was used instead.
- **BOM module — listing**: `BomInventoryListPage` + `BomInventoryTable`, route `'bom'`, sidebar icon (`IconBom`, lucide `Layers`) directly below Vulnerability. Agent CIs / Managed CIs pills, Ingest BOM CTA, BOM-specific columns.
- **BOM module — detail**: `EndpointBomTab` added to the existing `EndpointDrawer` as tab `bom`. Opened from the BOM listing the drawer LANDS on that tab (`bomMode` flag on the adapted record); opened from Patch/Vulnerability it still lands on Overview.
- **Sub-screens**: components grid (`BomComponentsPage`, three column sets), `BomCompareVersionsModal`, `BomScanPathsPanel`, `BomScanRunsPanel`, inline download-format popover.
- **CBOM + AI BOM component tables were designed** (the reference left both as placeholders). **Managed CIs is a deliberate empty state**, per the same decision.
- **`bomData.ts`**: deterministic per-endpoint BOM data with every count derived from one source (see the CLAUDE.md bullet).

## In progress
Nothing mid-flight.

## Next steps
- The BOM work is **committed locally but NOT pushed** — it has not been deployed to the live URL yet.
- Optional: a BOM Info group in the endpoint's right-hand properties rail. `BomInfoPanel` is written and exported from `EndpointBomTab.tsx` but is **not yet mounted** anywhere — `TicketPropertiesPanel` would need a `bomMode`-style prop threaded through, the same pattern the patch/endpoint modes use.
- Optional: wire the listing's Findings count through to the Vulnerabilities tab so a finding opens its CVE.
- Optional: the "Ingest BOM" CTA and the components-page Export are toast-only.

## Decisions made
- The BOM listing gets **BOM-specific columns** rather than reusing the Endpoints columns — the module's whole point is what the BOM contains.
- BOM is **a tab on the existing endpoint drawer**, not a second 8k-line drawer clone; the landing tab is what differs by entry point.
- The CBOM table is genuinely NOT an SBOM table with different labels — an algorithm has a primitive, key length, protocol and post-quantum posture, and no ecosystem or PURL.
- Component counts are cycled from a 40-entry catalog with version bumps rather than being faked, so "View components · 183" really lists 183 rows.

## Gotchas & notes
- Adding a tab to `EndpointDrawer` needs **four** edits, not three: `allTabs`, `tabWidths`, `tabLabels`, and the `tabConfig` array inside the tab-strip IIFE (`allowedTabIds` filters the strip — miss it and the tab silently never renders).
- The landing-tab effect must read `activePatchRecord`, not `activeAsset` — `patchToAssetShape()` drops fields it does not know about.
- A `<button>` inside a `text-[12px]` `<td>` does NOT inherit that size here; put the size on the button. `EndpointsTable.tsx` still has this (host names render at 16px) — left alone as it is outside this task's scope.
- `vite build` does NOT typecheck (the build script is bare `vite build`), so type errors compile through silently. Verify behaviour in the browser, not just by building.
- `pnpm` is not on PATH by default on this machine; `corepack prepare pnpm@10 --activate` fixes it. `npm install` still crashes on this pnpm-managed tree.
