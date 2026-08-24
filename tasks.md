# Support Portal — open tasks

Live at **https://zenichakalasiya.github.io/serviceops-ticket-detail/tasks/**

These are the six changes that were interrupted when the bad commit was removed. This file is the
source of truth — `npm run tasks` regenerates the live page from it, so the two can never disagree.
I work them one at a time: build, verify in the browser, mark done here, publish.

Updated: 2026-08-24 18:18

## 1. Left rail — remove the hide (eye) icon
- **Status:** done
- **Where:** `portalStructureSpecs.ts` → `RAIL_SPEC.collection`
- **You asked:** remove the hide icon from the menubar rows (Requests, Changes, My Assets, …).
- **How I check it:** select the left rail, count the per-row action buttons — the eye is gone and
  the drag handle plus the up/down arrows remain. The rail's note must stop promising you can hide
  them.
- **Verified:** Rail rows carry only Move up / Move down — 0 eye icons on the panel.

## 2. Banner — remove Image fit, Focal point, Darken for text
- **Status:** done
- **Where:** `portalStructureSpecs.ts` → the Banner group of `HERO_SPEC`
- **You asked:** remove those three fields from the banner's style section.
- **How I check it:** select the banner, open the Banner group — the three are gone, and the banner
  still renders exactly as it does today. The "Tile the image" toggle goes with them: it only ever
  appeared under Image fit's "Original size", so without that option it could never show again.
- **Verified:** Banner group reads Height → Background → Banner image → whole-page toggle. Image fit / Focal point / Darken for text / Tile all absent; the banner itself renders unchanged.

## 3. Design accordions collapsed by default
- **Status:** todo
- **Where:** `PortalWidgetDrawer.tsx` → the open-groups seed
- **You asked:** in the style section, make all accordions collapsed by default.
- **How I check it:** select several different widgets — every Design accordion arrives shut,
  Content stays open. ⚠️ The two panel models use opposite polarity, so both need seeding or half
  the widgets keep opening expanded.

## 4. Action Card — remove "A page in this portal"
- **Status:** todo
- **Where:** `portalWidgetSpec.ts` → the action-card `destination` options
- **You asked:** remove that option from the On-click-go-to dropdown.
- **How I check it:** open an Action Card's Action section — the dropdown lists Report an incident,
  Request a service, AD self service, Knowledge, External link. The Page picker it used to reveal
  goes too; a field whose parent option no longer exists can never appear.

## 5. KPI — remove "Feedback you owe us"
- **Status:** todo
- **Where:** `portalWidgetSpec.ts` → the KPI `counts` options
- **You asked:** remove that option from the Counts dropdown.
- **How I check it:** select a KPI, open Counts — five options remain, ending at My CIs.

## 6. Section panel — remove the Name field
- **Status:** todo
- **Where:** `portalStructureSpecs.ts` → `SECTION_SPEC.panel.content`
- **You asked:** remove Name from the parent section's sidebar (columns never had one, so nothing
  inner is affected). Lost when we removed the bad commit; you confirmed it should come back.
- **How I check it:** select a section — no Name field. ⚠️ Removing it exposes an empty CONTENT
  heading on a section with no cards, so Content must be dropped entirely when there is nothing to
  author, the same rule Design follows.

