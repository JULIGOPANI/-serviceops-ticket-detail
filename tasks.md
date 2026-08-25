# Support Portal — open tasks

Live at **https://zenichakalasiya.github.io/serviceops-ticket-detail/tasks/**

Every task from [zeni_tasks.md](zeni_tasks.md), numbered to match that file — the finished ones kept
rather than cleared, so the page shows the whole run instead of only what is left. This file is the
source of truth; `npm run build` regenerates the live page from it.

⚠️ A separate run of six shipped on 24 Aug 2026 before this numbering began — rail hide icon ·
banner image controls · collapsed Design accordions · Action Card page destination · KPI feedback
count · Section Name field. They are not in zeni_tasks.md, so they have no number here.

Updated: 2026-08-25 12:11

## 1. Quick Actions — Card templates moves to the individual card
- **Status:** done
- **Where:** `portalStructureSpecs.ts` → `SECTION_SPEC.panel.content`
- **You asked:** remove Card templates from the Quick Action parent section; keep it on each action card.
- **How I check it:** select the Quick Actions section — no Card templates. Select one card — it has its own. ⚠️ Worth knowing: it lives on the parent today precisely so every card in a row shares a shape. Per-card means a row can hold four different shapes — the point of the change, and its cost.
- **Verified:** Quick Actions section panel has no Card templates (its Content section drops entirely). Each action card has all four tiles and they WORK per card — setting New Incident to Icon top left its three siblings icon-left.

## 2. Remove the Custom "Action Card" widget from the library
- **Status:** done
- **Where:** `supportPortalData.ts` → `PORTAL_ELEMENTS`
- **You asked:** remove the Custom Action Card widget from the widget side drawer.
- **How I check it:** Widgets → Custom has no "Action Card" row, and typing "action" into the search does not surface it either.
- **Verified:** Library is 20 rows (was 21); Custom group reads Contact Us / Most Used Services / FAQ / KPI. Searching "action" returns only the four fixed action cards and Button.

## 3. Quick Actions takes nothing but its four cards
- **Status:** done
- **Where:** `SupportPortalPreview.tsx` (the row's drop target) + `SupportPortalBuilder.tsx` (`addElement`)
- **You asked:** ⚠️ CHANGED — the external-link button is off ("leave it as it is for now"; the four cards already redirect anywhere). What you asked for instead: nobody can add any extra widget or element into the action cards' parent section beyond those four.
- **How I check it:** drag a Text, a Button and an Image onto the Quick Actions row — each is refused and says why, and the same element still drops fine into any other section. Clicking a library row while Quick Actions is selected places it elsewhere rather than inside.
- **Verified:** Quick Actions row does not accept the dragover (cursor reads no-drop) and a simulated drop leaves it holding exactly its four cards; the My Open Requests and My Assets rows still accept. Clicking Text in the library with Quick Actions selected placed it in a new section instead.

## 4. My Open Requests — remove the whole config panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the My Open Requests spec
- **You asked:** remove that data from the predefined section — Title, Statuses, Rows to show, both toggles, the Header group and the Empty state.
- **How I check it:** select the widget — no Content section, only styling left. The card on the canvas renders exactly as it does now.
- **Verified:** Panel is DESIGN → Style, Spacing only — no CONTENT heading, no Header group, no Empty state. Canvas card unchanged: title, 5 badge, View all, 5 rows. Pending Approvals still shows its full panel, so the change is scoped to this widget.

## 5. Pending Approvals — remove the whole config panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the Pending Approvals spec
- **You asked:** remove those section fields — Title, Rows to show, Show requester, Show raised date, the Header group and the Empty state.
- **How I check it:** select the widget — no Content section; the canvas card is unchanged.
- **Verified:** Panel is DESIGN → Style, Spacing only. Canvas card unchanged: 2 badge, View all, both approval rows with requester names and dates.

## 6. Most Read — remove the whole config panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the Most Read Knowledge spec
- **You asked:** remove those section fields. ⚠️ Your line 6 carries a stray ", AD Self Service" — I am reading this as Most Read only; say if it meant something else.
- **How I check it:** select the widget — no Content section; the canvas card is unchanged.
- **Verified:** Panel is DESIGN → Style, Spacing only. Canvas card unchanged: View all, 3 KB rows, 3 category chips, dates intact.

## 7. My Assets — remove the whole config panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the My Assets spec
- **You asked:** remove those section fields.
- **How I check it:** select the widget — no Content section; the canvas card is unchanged.
- **Verified:** Panel is DESIGN → Style, Spacing only. Canvas card unchanged: 5 asset rows with their type labels.

## 8. My CIs — remove the whole config panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the My CIs spec
- **You asked:** remove those section fields — Title, Rows to show, Show CI type, the Header group and the Empty state.
- **How I check it:** select the widget — no Content section. ⚠️ My CIs is the one widget that actually renders an empty state on this page, so I check "No Data Found" still shows once its control is gone.
- **Verified:** Panel is DESIGN → Style, Spacing only. ⚠️ The empty state still RENDERS — the canvas card shows No Data Found and its View all link, because the mode and message live in the defaults. The stale note telling admins to set the empty state deliberately was removed with the control it referred to.

## 9. Announcements — remove the whole config panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the Announcements spec
- **You asked:** remove those section fields — Title, Rows to show and the Empty state.
- **How I check it:** select the widget — no Content section; the canvas card is unchanged.
- **Verified:** Panel is DESIGN → Style, Spacing only. Scoped to the widget's own node, the canvas card is unchanged: heading plus three announcements with their dates, and still no count badge or View all — which this feed never had.

## 10. Contact Us — only the email and phone values stay editable
- **Status:** done
- **Where:** `portalCollectionSpecs.ts` → the Contact Us spec
- **You asked:** remove Title, the whole Show-hours section, the Show-email and Show-phone toggles, and the Email label / Phone label fields — those are not ours to edit. Leave only the email value and the phone value as editable inputs.
- **How I check it:** select Contact Us — the panel is two inputs, Email address and Phone number. The canvas card still shows its labels; they come from the product now.
- **Verified:** Panel is CONTENT → Email address, Phone number (holding the real values), then DESIGN. Title, Show email, Show phone, Show hours, Email label and Phone label are all gone. The canvas card is unchanged and still reads Contact Us / Email / Phone / Hours with all three values.

## 11. The count badge moves beside the card title
- **Status:** done
- **Where:** `SupportPortalPreview.tsx` → the live-data card header
- **You asked:** the badge sits far right beside the View-all link on all five live-data widgets; it should sit beside the Title instead.
- **How I check it:** measure each badge's left edge against its title's right edge — every badge sits immediately after its own title, and View all is alone on the right.
- **Verified:** All five measured: every badge sits exactly 10px after its own title, while the badge-to-View-all gap varies 51/51/116/290/318px — so the link is pushed to the right edge and the badge tracks the title.

## 12. My Open Requests — the inner list is not separately configurable
- **Status:** done
- **Where:** `SupportPortalPreview.tsx` (the list's `Sel`) + its panel spec
- **You asked:** no option to select the open-requests list inside the card; remove that selection and its sidebar configuration (Statuses / Scope / Show).
- **How I check it:** click the rows inside My Open Requests — selection lands on the widget, never on a separate Request List layer, and no Statuses/Scope/Show panel exists.
- **Verified:** Clicking a row inside the card selects My Requests, not a Request List layer. No Statuses/Scope/Show panel exists anywhere on the page. All five rows still render.

## 13. Action cards cannot be placed on their own
- **Status:** done
- **Where:** `SupportPortalAddPanel.tsx`, `SupportPortalBuilder.tsx`, `PortalCanvas.tsx`
- **You asked:** an action card belongs only inside the Quick Actions parent section, never as a standalone block. So no duplicate on its floating toolbar, and no way to add one from the widget sidebar.
- **How I check it:** the Actions rows are gone from the library, and an action card's toolbar has no duplicate. ⚠️ The toolbar is shared, so duplicate has to be disabled for this kind rather than removed from the bar — I check it still works everywhere else.
- **Verified:** Library is 16 rows with the Actions group gone entirely; searching 'incident' returns only My Open Requests. On an action card the toolbar's copy button is greyed (#CBD5E1, cursor-not-allowed) with the tooltip 'This block is part of the page layout and can't be copied'; on Announcements it is live (#64748B, 'Copy'), so duplicate still works everywhere else.

## 14. Action cards — remove the ACTION section from the panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the four fixed action-card specs
- **You asked:** remove the Action section from all four cards' sidebars — New Incident, Request Service, AD Self Service, Knowledge.
- **How I check it:** select each of the four — the panel goes Content → Design with no Action section, so On-click-go-to and Most used services are both gone. Their destinations come from the card's own identity.
- **You settled it:** the destination is backend-side — a specific action card redirects to a specific page, decided there, not by the admin. So the control was offering an authority this screen does not have. The custom Action Card keeps its Action section, because that one exists to point anywhere.
- **Verified:** All four cards read CONTENT → DESIGN with no ACTION section: no On-click-go-to, no Most used services. Checked New Incident, Request Service, AD Self Service and Knowledge individually.

## 15. Most Used Services — keep only "Show description"
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the Most Used Services spec
- **You asked:** remove every field except the Show-description toggle — Title, Services to show, Columns, Show "Browse catalog" link, Link label and the Empty state.
- **How I check it:** select the widget — CONTENT holds one switch and nothing else, and the card on the canvas is unchanged.
- **Verified:** Panel is CONTENT → Show description, then DESIGN → Style, Spacing. Title, Services to show, Columns, Browse link, Link label and Empty state all gone; the canvas grid is unchanged.

## 16. Logo — remove the DESIGN section
- **Status:** done
- **Where:** `portalStructureSpecs.ts` → `LOGO_SPEC`
- **You asked:** remove the Design section (Style, Spacing) from the logo's sidebar.
- **How I check it:** select the logo — CONTENT holds the upload and nothing follows it.
- **Verified:** Panel is CONTENT → Logo image and nothing after it. ⚠️ Removing the accordions exposed a bare DESIGN heading, so PanelBody now drops that section entirely when it has nothing to draw — the same rule the packs model already had. Top bar and Hero still show their Design sections.

## 17. Top bar — remove the Shadow field
- **Status:** done
- **Where:** `portalStructureSpecs.ts` → the navbar spec
- **You asked:** remove the Shadow toggle from the navbar's sidebar.
- **How I check it:** select the top bar — no Shadow row, and the bar renders as it does now.
- **Verified:** Top bar → DESIGN → Style expanded reads Background colour, Bar height, Divider under the bar. No Shadow row.

## 18. Text toolbar — an inline font-style editor
- **Status:** done
- **Where:** `PortalCanvas.tsx` → `TextToolbar`
- **You asked:** an inline font-style editor on every text element's floating toolbar. ⚠️ REVISED — first built against the theme's two faces; you changed it to a plain font-family picker over 6–7 families, with the theme section to be reworked separately.
- **How I check it:** select a text element — the toolbar offers Heading face / Body face, picking one changes the rendered font, and changing the theme moves it with the theme.
- **Verified:** Toolbar gains a Font select: Default plus the six families, each option rendered in its own face. Selecting Merriweather / Poppins / IBM Plex changed the rendered font-family each time and Default restored it. ⚠️ Only Inter was actually loaded, so the other five would have fallen back to the generic sans and the picker would have offered six identical-looking options — all six are now requested in fonts.css and measure at six distinct widths.

## 19. Button — trim the Action section
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the Button spec
- **You asked:** remove "Open in a new tab", and remove "A page in this portal" and "Call a number" from the Opens dropdown.
- **How I check it:** select a Button — Opens lists External link, Download a file, Compose an email, Share this page. No new-tab toggle. ⚠️ Whatever the removed options revealed (URL fields, phone field) has to go with them or it becomes a control nothing can reveal.
- **Verified:** Button panel ACTION reads Opens → External link / Download a file / Compose an email / Share this page, then URL. No Open-in-a-new-tab, no Page picker, no Number field. The canvas button is unchanged.

## 20. Predefined widgets stop being inline-editable
- **Status:** done
- **Where:** `SupportPortalPreview.tsx` (the `-title` `Sel` wrappers) + `portalPageModel.ts`
- **You asked:** headings on the four action cards, My Open Requests, Pending Approvals, My Assets, My CIs, Favourite Services, Most Used Services, Announcements and Most Read stop being inline-editable. Only the action card's **description** stays editable.
- **How I check it:** ⚠️ You chose **headings only** — the title node disappears entirely, so clicking the words selects the CARD rather than a layer you can select but not change. Click every heading listed: each selects its widget. Click an action card's description: it still types.
- **Verified:** Clicked all nine headings — My Open Requests, Pending Approvals, Most Read, My Assets, My CIs, Announcements, Contact Us, Most Used Services and New Incident each select their WIDGET, not a text layer. The action card's description still selects Subtext (editable) and the hero heading still selects Heading, both correctly out of scope.

## 21. Search — keep only the placeholder
- **Status:** done
- **Where:** `portalStructureSpecs.ts` → `HERO_SEARCH_FIELDS`
- **You asked:** remove everything except Placeholder — Scope, Show suggestions as they type, Show the search bar.
- **How I check it:** select the search bar — one field. ⚠️ The Hero's own panel keeps its Show-the-search-bar toggle, so the bar can still be hidden; I check that still works.
- **Verified:** Search panel is CONTENT → Placeholder only. ⚠️ It was HERO_SEARCH_FIELDS that looked like the spec but had no readers anywhere — the real one is SEARCH_SPEC.panel.content. The dead const is deleted rather than left as a second definition of one screen.

## 22. Favourite Services + Most Used Services as card sections
- **Status:** done
- **Where:** `SupportPortalPreview.tsx`, `supportPortalData.ts`, `portalWidgetSpec.ts`
- **You asked:** two sections of up to four cards, styled like the action cards rather than the old list. ⚠️ You chose **restyle the existing Most Used Services and add Favourite Services** — so the page carries each name once, not twice.
- **How I check it:** both sections render four cards with icon-on-top, name and category (Employee Off-boarding / HR, Microsoft Office 2019 / Software, Payroll Setup / Finance, Flight Booking / Travel), and they match the action cards' shape.
- **Verified:** ⚠️ REVISED — neither section is in the library (15 rows, both absent); they are fixed page blocks sitting directly under Quick Actions (measured: quick 408 → favourites 497 → services 678 → work 830). Both render four tiles, icon-top, name over category, identical 117px height and column direction on load. Card templates is its own group under Content and is SHARED: picking Icon left turned both grids to row, Icon top turned both back to column.

## 23. Row-wise placement, and splitting a row into columns
- **Status:** todo
- **Where:** `portalPageModel.ts` (the section model), `SupportPortalPreview.tsx`, `SupportPortalBuilder.tsx`
- **You asked:** in an added section every element lands as its own row, left-aligned, whatever it is. A row can then be split into columns, and a column holds a vertical STACK of elements — so "image left, title + description right" is made by dropping both text elements into the right column. Columns in a row share height; deleting one reflows the rest left.
- **How I check it:** ⚠️ This changes the section model — today a column holds exactly ONE element. I will come back to you before writing it with the specific questions it raises (the gap control, the split affordance, and whether the Divider comes back, which you asked me to raise when I reach this).
- **Progress:** the STRUCTURE is built and verified — see [SECTION-TREE-SPEC.md](SECTION-TREE-SPEC.md). Your handwritten note replaced the two-level plan with containers all the way down: one BOX type, a Row/Column behaviour on every one, and a Split that divides along whatever that behaviour is. Settled with you 25 Aug: depth capped at 4 below the section, Split on the floating toolbar, 4 columns to a row, no mobile breakpoints.
- **Verified:** split sec-3 → two equal 506px columns side by side, the Text preserved in the first; Behaviour → Column restacked the same two boxes full-width with nothing lost; the Split label follows it ("Split into columns" / "Split into rows"); nesting alternates axis on its own (rows → columns → rows) and stops at depth 5 with the button visible and disabled reading "Nested as deep as a section goes (4 levels)"; a 5th column refuses with "A row holds 4 columns at most"; the "+" adders read "Add a row above/below" inside a column and "Add a column to the left/right" inside a row; deleting one of two children collapses the branch back to a single cell with its element intact; a Button added into a 3-deep box lands and opens its own panel; Ctrl+Z / Ctrl+Shift+Z restore and re-apply a split.
- **Still to do:** the drag mechanic from [SECTION-ROW-COLUMN-DRAG-PROMPT.md](SECTION-ROW-COLUMN-DRAG-PROMPT.md) — the blue placement line, its orientation rule and the label chip — plus a column holding a STACK of elements rather than one, and the Divider's return (still yours to confirm).

## 24. Table — rebuild it the way Word does
- **Status:** todo
- **Where:** `portalCollectionSpecs.ts`, a new table renderer
- **You asked:** drop the whole current table configuration. Insert by choosing rows × columns from a 10×10 grid; edit cells inline with a floating toolbar; drag rows and columns; insert and delete row / column / table / cell. Keep only Title in Content and Spacing in Style.
- **How I check it:** insert from the 10×10 popup; click a cell and type; drag a row or column handle to reorder; drag a boundary to resize; drag the bottom edge for cell padding; select a rectangle of cells and align or colour them; every menu item that cannot apply is disabled with the reason on it.
- **Settled 25 Aug:** staged — this pass is the shape and the inline experience, with merge/split, sort and Excel paste to follow. **10×10 is a hard ceiling**, not just the picker: inserts stop there too. ⚠️ You chose to **keep the brief's §6 panel** rather than trimming it to Title + Spacing — so the panel and the canvas now share one source for every value they both touch (see Verified).
- **Verified:** the seeded table reads its old `rows` config and renders 9 cells with rails, a select-all corner and both extend buttons. Insert column right → 4 columns at 25% each with content intact. Click a cell → contentEditable, typed value commits. Add-a-column stops at 10 with "A table holds 10 columns at most" and the menu's three insert items carry the same reason; rows stop at 10 likewise. Dragging column 1's handle onto column 3 moved "Tier" to position 3 with a live drop indicator. Dragging boundary 0 by 80px gave 15%/5% and the widths still total exactly 100. Drag-select rows 1–2 × cols 0–1 → 4 cells `aria-selected`, one continuous stroke round the region, floating toolbar above it; Align centre applied to exactly those 4 and left the other 5 alone. Dragging the bottom edge took cell padding 8px → 18px. Panel switch "First column is a header" → `<th scope="row">`; the handle menu read "Remove header column", and using it flipped the panel switch back — one value, two affordances. Sheet "30 min" → "15 min" landed on the canvas; a canvas edit to "6 hrs" showed up in the sheet.
- **Bug found and fixed on the way:** turning on the header column blanked every cell in it. Switching a cell between `<td>` and `<th>` keeps the same React component instance, so the mirror effect never re-ran — but the element TYPE changed, so React tore down the DOM and built an empty one. The model still held the text; the DOM had thrown it away, silently. `tag` is now a dependency of that effect.
- **Still to do (pass 2):** merge / split cells (`colspan`/`rowspan` are already in the model and every operation is written span-aware) and sort by column. ⚠️ **Excel/Sheets paste and keyboard-only operation are CUT** — you dropped both on 25 Aug. The brief still asks for them (§5.24, §7); the brief is superseded on those two points.

## 25. Bring the predefined widgets back to the library, disabled with an "Added" mark
- **Where:** `supportPortalData.ts`, `SupportPortalAddPanel.tsx`
- **You asked:** removing the action cards from the sidebar was not right — bring them back. Every predefined card, in Live data and in Actions, shows a disabled state with an added icon on the right. Nothing is removed from the widget sidebar.
- **How I check it:** the library lists every widget again; the ones already on the page render disabled with a tick; the rest stay addable.
- **Status:** done
- **What I built:** the four action cards are back in the palette, and every **predefined** block — the five live-data cards plus the four action cards — shows **greyed with a green tick on the right** while the page is carrying it, with the reason on hover ("… is already on this page. Remove it from the page to add it again."). ⚠️ Only a predefined block can be marked: an element gets a new `node` field naming the fixed page block it IS, and the tick is gated on that. Text, Button, Table and the rest stay repeatable — two request lists filtered to different statuses is a reasonable page, and a tick on those would be reintroducing the single-instance rule that made the palette go dead as a page got built. ⚠️ The mark is **DERIVED per render from live page state**, never from the catalogue's `onPage` flag: `onPage` is a fact about the product and never changes, and a greyed row has to track the page to be truthful. Three homes are counted — `rowOrder` minus `removed`, `content.quick`, and the placed elements in every section — because "add it back" lands a placed instance rather than restoring the fixed block, and counting only the block would let you stack three copies while the row still read addable. A drag is refused by `draggable={!added}`; a drop that reaches `addElement` anyway is refused there with the reason, since that is the one funnel both routes pass through.
- **Verified:** the library went 15 rows → **19** (the Actions group is back). Nine rows disabled with the tick: My Open Requests, Pending Approvals, My Assets, My CIs, Most Read Knowledge, New Incident, Request Service, AD Self Service, Knowledge. **Announcements stays addable** — it is the one live-data widget this page has no fixed block for, which is why the flag is per element rather than per group. Full cycle measured: marked → delete My Assets → row addable → add it back → marked again.
- **⚠️ Bug found and fixed on the way — deleting a live-data card never removed it.** The palette said "addable" while the card was still sitting on the page, which is how I found it. `card()` in the preview searched the LIVE `rowOrder` for the card's row, then tested `!rowOrder[row].includes(id)` — a condition that can never be true, because `row` was found by that very test. Deleting takes the card out of `rowOrder`, so the search found no row, the guard had nothing to test, and the card rendered anyway at order 0. Membership now comes from `rowOf` — the static map of which row a card belongs to — so the guard has something real to compare against. Delete had been reporting "Removed" and leaving the card in place.
- **⚠️ Note on scope:** this reverses **task 2** (Custom Action Card hidden) and **task 13**'s library half for the four action cards. It does NOT bring back the general "nothing greys out" reversal — Divider, Spacer, Advanced Tabs, Media Slider and Text-with-Image stay hidden behind their flags, which is a separate decision.

## 26. Contact Us — the card is still editable and still shows Hours
- **Status:** done
- **Where:** `SupportPortalPreview.tsx` (the Contact Us renderer)
- **You asked:** Contact Us still has inline-editable fields on the canvas and the Hours line is still on the card. The empty section was also not removed from the sidebar.
- **How I check it:** clicking any Contact Us line selects the widget rather than an editable text node; the card shows Email and Phone only. ⚠️ Task 10 removed the hours CONTROL but left the rendered line — I read "remove the Show-hours section" as panel-only. This says the line itself goes from the card.
- **What I fixed:** three things. (1) **Hours is gone from the card** — removed, not hidden behind a switch. Its toggle went in task 10, which left a line you could neither edit nor hide: the worst of the three states. (2) **Nothing on the card is inline-editable any more** — both halves of every line used to be their own `<Sel>` text node, so clicking the word "Email" opened an inline editor for a label that is the PRODUCT's word. Every portal calls that line Email; letting one page rename it is how two portals stop describing the same thing the same way. The two VALUES stay editable, in the panel, because a portal may legitimately publish its own address. (3) **The empty section is gone from the sidebar** — that was the **Empty state** group (pack P8), which asks what to show when there is nothing to show. Contact Us is two fixed lines now, so there is no state in which it is empty; it kept P8 while the three Show switches existed, because turning all three off did empty it.
- **Also removed, both halves at once:** the `showEmail`/`showPhone`/`showHours` defaults and the renderer's filter that read them, plus the `cl0`/`cl1`/`cl2`/`cv2` seeds and the "every line is switched off" empty branch — config kept alive only by the code that read it, and code kept alive only by the config it read.
- **Verified:** the card reads exactly "Contact Us / Email / servicedesk@acme.com / Phone / +91 79 4040 0000" with **no Hours**, and it contains **0 selectable child nodes**. The panel reads CONTENT (Email address, Phone number) → DESIGN (Style, Spacing) with **no Empty state**. Typing "help@acme.com" into the Email address field changed the card immediately.

## 27. "Support Portal Customization" becomes "Support Portal"
- **Status:** todo
- **Where:** `AdminSupportPortalModule.tsx` (the page head), `adminData.ts` (the card + nav row)
- **You asked:** change the title from "support portal customization" to "support portal".
- **How I check it:** the admin page head, the sidebar row and the Overview card all read "Support Portal", and nothing anywhere still says "Customization" as a page name. ⚠️ The Customization **tab** keeps its name — it is one of two tabs, and the head above them is what is being renamed.

## 28. A widget's first DESIGN accordion opens, the rest stay shut
- **Status:** todo
- **Where:** `PortalWidgetDrawer.tsx` (`DEFAULT_OPEN`)
- **You asked:** in every widget sidebar that has a DESIGN section, the first accordion of that section is expanded and the others are collapsed.
- **How I check it:** open any widget with a Design section — the first accordion is open, every one below it is shut. ⚠️ The two panel models have OPPOSITE polarity (`shut:<id>` for panel accordions, the group name for packs), so this rule has to be written twice or it will only take on half the widgets.

## 29. Accordion, Banner and the page-background toggle
- **Status:** todo
- **Where:** `portalCollectionSpecs.ts` (Accordion), `portalStructureSpecs.ts` (Banner), `PortalCanvas.tsx` (the toolbar globe)
- **You asked:** three things. (1) **Accordion** — drop the Content section (Display rules), keep only Style and Spacing in Design, and give the item editor an **"Add link" CTA at the bottom left** of the Title + Description box. (2) **Banner** — the Choose-CTA popup shows only the banner IMAGES: no search, no per-banner title or description; and banner height becomes **4 predefined sizes** instead of a px slider. (3) Remove the **"also use this background behind the whole page"** toggle from the sidebar.
- **How I check it:** the Accordion panel has no Content section and exactly two Design accordions; opening an item shows Add link bottom-left. The banner popup is a grid of images only, and Height offers four named sizes. The whole-page background toggle is gone.

## 30. Favourite Services and Most Used Services rejoin the library
- **Status:** todo
- **Where:** `supportPortalData.ts` (the `hidden` flags), `portalWidgetSpec.ts` (the note)
- **You asked:** add both sections to the widget sidebar, and give Favourite Services a note for the admin saying the section only appears once a requester has added favourites.
- **How I check it:** both rows are in the library and addable; selecting Favourite Services shows the note. ⚠️ This **reverses task 22**, where they were made fixed page blocks and hidden from the palette precisely because a requester fills them, not an admin. Your call — the note is what makes it honest, since an admin can now place a section whose contents they do not control.

## 90. Image-upload empty state — one component everywhere
- **Status:** done
- **Where:** `PortalControls.tsx` (`ImageUploadZone`), + PortalIconPicker, PortalPlacedElement, PortalCanvas, SupportPortalBuilder
- **You asked:** from [IMAGE-UPLOAD-ZONE-PROMPT.md](IMAGE-UPLOAD-ZONE-PROMPT.md) — replace every image-upload empty state with ONE shared component. Plus: a filled slot shows only a **Replace** CTA (no Remove link, no second dashed box), and no divider between the tab row and the upload container.
- **How I check it:** the same lockup at both sizes, drag-over responds, an oversized file errors and stays usable, and no hand-rolled image dropzone survives the §7.7 grep.
- **Verified:** sm (panel) = 132px min / 24×16 pad / 32px file glyph; md (canvas) = 180px / 40×24 / 40px — same lockup, same copy. Drag-over paints #EBF5FF on #3D8BD0. A 9MB drop gives "That file is 9.0MB — the limit is 5MB" in red with the zone still enabled; a .txt gives the type message. A real PNG dropped on the canvas image element lands and replaces the zone. Filled = 92px chequerboard preview + a single Replace. §7.7 grep leaves only the one component plus the out-of-scope placeholders.

## Parked — needs discussion
- Tour guide
- AI capabilities
- Video / GIF as a widget
- "Set as default" from templates
- Two-stepper for portal details / portal customization
- Theme, Settings, Branding (added to the discuss list 25 Aug)
- KB for FAQs — to discuss with Sahilbhai
- List widget (task 23 — to be written up for later)
- Media slider, Advanced tabs, Text with image, Spacer (task 23 — later)
