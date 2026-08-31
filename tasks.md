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
- **Status:** done
- **Where:** `portalCollectionSpecs.ts`, a new table renderer
- **You asked:** drop the whole current table configuration. Insert by choosing rows × columns from a 10×10 grid; edit cells inline with a floating toolbar; drag rows and columns; insert and delete row / column / table / cell. Keep only Title in Content and Spacing in Style.
- **How I check it:** insert from the 10×10 popup; click a cell and type; drag a row or column handle to reorder; drag a boundary to resize; drag the bottom edge for cell padding; select a rectangle of cells and align or colour them; every menu item that cannot apply is disabled with the reason on it.
- **Settled 25 Aug:** staged — this pass is the shape and the inline experience, with merge/split, sort and Excel paste to follow. **10×10 is a hard ceiling**, not just the picker: inserts stop there too. ⚠️ You chose to **keep the brief's §6 panel** rather than trimming it to Title + Spacing — so the panel and the canvas now share one source for every value they both touch (see Verified).
- **Verified:** the seeded table reads its old `rows` config and renders 9 cells with rails, a select-all corner and both extend buttons. Insert column right → 4 columns at 25% each with content intact. Click a cell → contentEditable, typed value commits. Add-a-column stops at 10 with "A table holds 10 columns at most" and the menu's three insert items carry the same reason; rows stop at 10 likewise. Dragging column 1's handle onto column 3 moved "Tier" to position 3 with a live drop indicator. Dragging boundary 0 by 80px gave 15%/5% and the widths still total exactly 100. Drag-select rows 1–2 × cols 0–1 → 4 cells `aria-selected`, one continuous stroke round the region, floating toolbar above it; Align centre applied to exactly those 4 and left the other 5 alone. Dragging the bottom edge took cell padding 8px → 18px. Panel switch "First column is a header" → `<th scope="row">`; the handle menu read "Remove header column", and using it flipped the panel switch back — one value, two affordances. Sheet "30 min" → "15 min" landed on the canvas; a canvas edit to "6 hrs" showed up in the sheet.
- **Bug found and fixed on the way:** turning on the header column blanked every cell in it. Switching a cell between `<td>` and `<th>` keeps the same React component instance, so the mirror effect never re-ran — but the element TYPE changed, so React tore down the DOM and built an empty one. The model still held the text; the DOM had thrown it away, silently. `tag` is now a dependency of that effect.
- **Pass 2 (25 Aug) — the handles, the drag and the menus.** You sent seven references and reported the drag not working.
- **⚠️ You were right, and my earlier "verified" was the reason.** I had only ever tested the drag with SYNTHETIC events, which fire the handler without a real pointer — so it passed while a genuine press-and-drag did not. This pass was verified with **Playwright** (real `mouse.down/move/up`), with your permission.
- **Three faults, not one.** (1) **No threshold** — every press started a drag, so a plain click reordered nothing and opened the menu on release; there is now a 4px threshold, which is what lets one control be both a grip and a menu button. (2) **`geo` came from the closure** — a snapshot taken at mousedown, while the table reflows the moment a row is lifted, so the drop indicator drifted a column off partway across. It reads a REF now. (3) **The floating cell toolbar sat over the column rail** — with any top-row cell selected the rail's handles could not be clicked at all, which is how the drag came to look broken even where it worked. Playwright reported it as "subtree intercepts pointer events", which is the clearest evidence of the three.
- **The handles are GRIPS now**, not chevrons: `GripHorizontal` on the columns, `GripVertical` on the rows, in rounded pills, with a `grab`/`grabbing` cursor. A chevron says "this opens something" and says nothing about picking it up — which was exactly the half nobody could find.
- **A drag now looks like carrying something:** a ghost card under the cursor showing the row or column's own text, the source handle lit, and the drop line. ⚠️ The ghost is `position: fixed` in viewport coordinates — anything positioned against the wrapper lags the cursor the moment the canvas scrolls under it. ⚠️ A one-shot capture-phase listener swallows the click a real release always fires, or every drag would end by opening the menu it used as a handle.
- **The menus carry everything your images show:** Insert before/after · Move · **Sort A→Z / Z→A** · **Colour ›** · **Alignment ›** · Duplicate · Header toggle · Clear contents · Delete. Colour opens **Text colour AND Background** as two named lists — a cell has two colours worth setting, and dropping background to match the screenshot exactly would have removed something that worked. Alignment carries horizontal and vertical together.
- **The floating toolbar is REPLACED by a cell menu**, reached from a round grip on the selection's right edge. It duplicated the handle menus — two surfaces offering Colour, Alignment and Clear — and it was physically in the way.
- **Sort:** the header never moves, and blanks go last in BOTH directions. An empty cell is an absence, and an absence has no place in an ordering; putting it at the end is the only answer that reads the same whichever way you sorted. Numbers compare as numbers, so 9 sorts before 10.
- **Verified with real mouse input:** dragging column 1's grip onto column 3 took "Tier, Contact, Response" → "Contact, Response, Tier", with the ghost reading "Tier" and the drop line shown, and **the menu did not open afterwards**. A plain click on the same grip DID open the menu — thirteen items, "Move left" disabled reading "Already the first column". Red text applied `rgb(185,28,28)` to all three cells of column 1. Sort Z→A reordered the two body rows with the header untouched. A real row drag moved them back, ghost reading "L2 · Infrastructure". A 2-cell drag-selection gave a grip whose menu is Colour · Alignment · Toggle header cells · Clear contents.
- **Merge / split (25 Aug) — closed, with one boundary stated out loud.** Merging **across a row** works: the selection becomes one cell with a `colspan`, and its ⚠️ **content is JOINED, not discarded** — merging three cells that each say something and keeping only the leftmost is a silent deletion, and the one thing you cannot do about a silent deletion is notice it. Split puts the content back in the first of the new cells; there is no honest way to decide which words belonged to which column, and guessing at a split point would scatter somebody's sentence.
- **⚠️ Merging DOWN is refused, with the reason on the control** — "Merging down is not supported yet — merge cells across one row". That is a decision, not an omission: a `rowspan` means the rows beneath no longer tile their own width, so `fixTable`, `cellAt`, `cellStarts`, `columnCount`, insert/delete column and both reorders each need a coverage map before any of them stays correct. The brief calls this the hardest requirement in the document and says to decide the outcome deliberately **or refuse with a reason**; this refuses. `rowspan` stays in the model and the renderer still emits it, so the day that map is written nothing else changes.
- **One slot, two states.** Merge and Split share a menu row, showing whichever applies — they are the same intent aimed at two states, and two permanent items would leave one dead whichever cell you had.
- **Verified with real input:** drag-selecting two cells in one row and choosing Merge gave `L1 · Service Desk servicedesk@acme.com[span2]` — both contents kept. Selecting that cell and pressing Escape leaves it selected (the grip appears), the slot then reads **Split cell**, and splitting returned two cells with the text in the first. A vertical selection shows **Merge cells disabled**, titled "Merging down is not supported yet — merge cells across one row".
- ⚠️ Excel/Sheets paste and keyboard-only operation stay **CUT** — you dropped both on 25 Aug; the brief still asks for them (§5.24, §7) and is superseded on those two points.



## 25. Bring the predefined widgets back to the library, disabled with an "Added" mark
- **Where:** `supportPortalData.ts`, `SupportPortalAddPanel.tsx`
- **You asked:** removing the action cards from the sidebar was not right — bring them back. Every predefined card, in Live data and in Actions, shows a disabled state with an added icon on the right. Nothing is removed from the widget sidebar.
- **How I check it:** the library lists every widget again; the ones already on the page render disabled with a tick; the rest stay addable.
- **Status:** done
- **What I built:** the four action cards are back in the palette, and every **predefined** block — the five live-data cards plus the four action cards — shows **greyed with a green tick on the right** while the page is carrying it, with the reason on hover ("… is already on this page. Remove it from the page to add it again."). ⚠️ Only a predefined block can be marked: an element gets a new `node` field naming the fixed page block it IS, and the tick is gated on that. Text, Button, Table and the rest stay repeatable — two request lists filtered to different statuses is a reasonable page, and a tick on those would be reintroducing the single-instance rule that made the palette go dead as a page got built. ⚠️ The mark is **DERIVED per render from live page state**, never from the catalogue's `onPage` flag: `onPage` is a fact about the product and never changes, and a greyed row has to track the page to be truthful. Three homes are counted — `rowOrder` minus `removed`, `content.quick`, and the placed elements in every section — because "add it back" lands a placed instance rather than restoring the fixed block, and counting only the block would let you stack three copies while the row still read addable. A drag is refused by `draggable={!added}`; a drop that reaches `addElement` anyway is refused there with the reason, since that is the one funnel both routes pass through.
- **Verified:** the library went 15 rows → **19** (the Actions group is back). Nine rows disabled with the tick: My Open Requests, Pending Approvals, My Assets, My CIs, Most Read Knowledge, New Incident, Request Service, AD Self Service, Knowledge. **Announcements stays addable** — it is the one live-data widget this page has no fixed block for, which is why the flag is per element rather than per group. Full cycle measured: marked → delete My Assets → row addable → add it back → marked again.
- **⚠️ Bug found and fixed on the way — deleting a live-data card never removed it.** The palette said "addable" while the card was still sitting on the page, which is how I found it. `card()` in the preview searched the LIVE `rowOrder` for the card's row, then tested `!rowOrder[row].includes(id)` — a condition that can never be true, because `row` was found by that very test. Deleting takes the card out of `rowOrder`, so the search found no row, the guard had nothing to test, and the card rendered anyway at order 0. Membership now comes from `rowOf` — the static map of which row a card belongs to — so the guard has something real to compare against. Delete had been reporting "Removed" and leaving the card in place.
- **⚠️ Fixed after you spotted it (25 Aug):** **Announcements was on the page and still addable.** I had gated the mark on `node` — owning a fixed page block — but Announcements is the one Live-data widget with no fixed block; it only ever exists as a placed element, so it could never be marked however many copies the page carried, while its five neighbours in the same group all were. One group, two behaviours, for a reason nobody looking at the panel could see. Your task said "in live data **and** in action cards", which is a GROUP rule: predefined now means **Live data or Actions** (or an explicit `node`, which is what keeps the two Custom service rows marked). The panel also had its own narrower copy of the test, and the narrower one won — that gate is gone; the builder decides, the panel reads.
- **Re-verified:** 12 rows marked — all six Live data including Announcements, all four Actions, both service rows. Nine stay addable: Text, Button, Table, Accordion, Card, Image, Contact Us, FAQ, KPI. Deleting the Announcements element made its row addable again; adding it back re-marked it.
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
- **Status:** done
- **Where:** `AdminSupportPortalModule.tsx` (the page head), `adminData.ts` (the card + nav row)
- **You asked:** change the title from "support portal customization" to "support portal".
- **How I check it:** the admin page head, the sidebar row and the Overview card all read "Support Portal", and nothing anywhere still says "Customization" as a page name.
- **⚠️ My note about keeping the Customization tab was wrong** — there is no tab strip on this page any more. It went when Support Portal became one destination showing the portals you have, so "Customization" was naming a mode the page no longer has, and it disagreed with the sidebar row, the Overview card and the route, all of which already said Support Portal.
- **What changed:** the `<h1>`, the View-Docs toast, the builder's back-arrow tooltip ("Back to Support Portal"), and the internal module key in `AdminPage` — renamed in both of its two places at once, since they only mean anything to each other.
- **Verified:** the listing `<h1>` reads "Support Portal", the back tooltip reads "Back to Support Portal", and the string "Customization" appears nowhere on either screen.



## 28. A widget's first DESIGN accordion opens, the rest stay shut
- **Status:** done
- **Where:** `PortalWidgetDrawer.tsx` (`DEFAULT_OPEN`)
- **You asked:** in every widget sidebar that has a DESIGN section, the first accordion of that section is expanded and the others are collapsed.
- **How I check it:** open any widget with a Design section — the first accordion is open, every one below it is shut. ⚠️ The two panel models have OPPOSITE polarity (`shut:<id>` for panel accordions, the group name for packs), so this rule has to be written twice or it will only take on half the widgets.
- **What I built:** the seed opens the first Design accordion and shuts the rest. Written twice, as predicted: the packs panel gets the first key ADDED to the open list, and `PanelBody`'s accordions get the first key LEFT OUT of the `shut:` list. ⚠️ The render keys three kinds of accordion three different ways — a field group by its NAME, a pack by its ID, Spacing by the literal `__spacing` — so `firstDesignKey` answers in the same currency the open-state list is written in rather than with an index. `DROP_GROUPS` and `EMPTY_STATE_GROUP` moved to module scope so the seed can use them; they were declared 470 lines below it, which in this file is a blank page rather than an error.
- **⚠️ Found dead:** `accordion.open` is declared on `SECTION_SPEC`'s Layout accordion and is read by nothing. The `shut:` list is what actually governs.
- **Verified across both models:** Banner (panel) opens **Banner** with Search and Spacing shut; the Quick Actions section (panel) opens **Layout** with Style and Spacing shut; Contact Us and Announcements (packs) open **Style** with Spacing shut.



## 29. Accordion, Banner and the page-background toggle
- **Status:** done
- **Where:** `portalCollectionSpecs.ts` (Accordion), `portalStructureSpecs.ts` (Banner), `PortalCanvas.tsx` (the toolbar globe)
- **You asked:** three things. (1) **Accordion** — drop the Content section (Display rules), keep only Style and Spacing in Design, and give the item editor an **"Add link" CTA at the bottom left** of the Title + Description box. (2) **Banner** — the Choose-CTA popup shows only the banner IMAGES: no search, no per-banner title or description; and banner height becomes **4 predefined sizes** instead of a px slider. (3) Remove the **"also use this background behind the whole page"** toggle from the sidebar.
- **How I check it:** the Accordion panel has no Content section and exactly two Design accordions; opening an item shows Add link bottom-left. The banner popup is a grid of images only, and Height offers four named sizes. The whole-page background toggle is gone.
- **(1) Accordion:** `fields` is now empty. Out went the two Display-rules toggles and four whole style groups — Text style, Expansion icon, Text style — expanded, Alignment — about twenty controls for a widget whose job is to hold a list of questions. Design is exactly **Style** (the shared P1 pack) + **Spacing**. Every removed value stays in `defaults`, so the accordion is pixel-identical; the keys simply stopped being editable. The **Add link** CTA is a new `CollectionSpec.inlineCta` — a CTA rather than two permanent inputs, because most rows never get a link and an empty URL box under every question is a question asked of every question. Removing a link **clears both values**: a flag left on with blank fields renders an empty link, and a flag off with the values kept brings back a URL nobody remembered writing.
- **(2) Banner:** the Choose-a-banner popup lost its search and its per-tile name and note. You are choosing a PICTURE, and a picture is recognised by looking at it — a search box over a grid you can see all of asks you to name what you are about to point at, and the names had nothing left to match on. The name survives as the tile's tooltip; the artwork grew 58px → 78px to take the whole tile. Height is now **Short · Standard · Tall · Full**: a banner has about four useful heights, and a 120–600px slider invited a precision nobody wants — 347px is not a decision anyone made on purpose. The values are still plain pixels underneath, so the renderer is unchanged.
- **(3) Whole-page background:** removed from the panel AND the canvas toolbar in the same pass, along with the `onWholePage` plumbing and the now-unused `Globe` import. It put one BLOCK in charge of the page's background — a change you make while looking at the banner and then find everywhere else — and the page has its own background in Theme.
- **Verified:** Accordion Content = Items only; Design = "Style | Fill | None | Colour | Border | Corner radius | Spacing". The Add link CTA sits **12px from the left edge and 12px from the bottom** of the inline editor; adding one, typing "Reset it yourself" / "https://acme.com/ad" put a working link on the canvas item. The banner popup: **no input element**, 9 image tiles at 78px, names in tooltips, text content is only the header + group labels + "Upload my own image". Height "Tall" took the banner 260px → 360px. No "Also use behind the whole page" anywhere.



## 30. Favourite Services and Most Used Services rejoin the library
- **Status:** done
- **Where:** `supportPortalData.ts` (the `hidden` flags), `portalWidgetSpec.ts` (the note)
- **You asked:** add both sections to the widget sidebar, and give Favourite Services a note for the admin saying the section only appears once a requester has added favourites.
- **How I check it:** both rows are in the library; selecting Favourite Services shows the note. ⚠️ This reverses **task 22**'s hiding — though task 22's reasoning argued for a NOTE rather than an absence: an admin can reasonably decide whether the page carries a favourites row at all, and hiding it only meant that once deleted there was no way back.
- **What I built:** both are back in the palette, each naming its fixed page block, so task 25's mark applies — they render greyed with a tick while the page carries them. `placedPredefined` had to learn about top-level BANDS as well as row members: these two are their own blocks in `blockOrder`, so counting only `rowOrder` left both addable while the page already had them.
- **The note is a `warn`, and that required a renderer.** `notesFor` existed and was **called by nothing** — dead since the grey ⓘ note cards were removed from every panel. Turning notes back on wholesale would have restored all **thirteen** `info` notes still declared across the specs, so the renderer takes **warn only**: a warn says something the canvas cannot show you — Favourite Services draws four example tiles in the builder and nothing at all for a requester who has pinned none — and there is exactly one in the catalogue, which is the right number for a caution.
- **Verified:** the library is 21 rows (was 19); both service rows appear under Custom and both are greyed with a tick. Selecting Favourite Services shows the amber note at the top of Content; Most Used Services shows nothing, so the thirteen info notes stayed dormant.



## 32. Four corrections from the 25 Aug review
- **Status:** done
- **Where:** `portalWidgetSpec.ts` (`structureSpecId`), `portalStructureSpecs.ts`, `supportPortalData.ts`, `PortalItemList.tsx` + `PortalWidgetDrawer.tsx`
- **You asked:** (1) an empty section shows the OLD Style component; (2) remove Layout ▸ Behaviour from every sidebar in the module; (3) Most Used Services and Favourite Services belong under Live data; (4) task 29's Add item should open the box inline with empty fields and placeholders instead of replacing the sidebar.
- **(1) was a regression I introduced.** Box ids became `sec-3-b7` when the section became a tree (task 23), and `structureSpecId` was left matching the old positional `sec-3-c0` — so every column and every unsplit section stopped resolving to `COLUMN_SPEC` and fell through to the LEGACY `PortalElementPanel`. That is the old block you photographed: a "Background colour" dropdown, a "Per corner" radius and a `solid` border row. ⚠️ **A router that matches on id SHAPE has to change in the same commit as the shape.**
- **(2)** The Row/Column Behaviour control is off both the Section and the Column panels. The tree model behind it stays (`Box.dir`, `splitBox`, the axis-aware adders), so nothing on the canvas moved — it simply is not a panel decision while the section work is parked.
- **(3)** Both rows moved from Custom to **Live data**: both are backend-fed — one from what this requester pinned, the other from what the organisation asks for most — which is the line Live data draws. They kept their `node`, which is what lets the palette see them on the page since both are top-level BANDS rather than row members.
- **(4)** Adding an item no longer calls `onSelect`, which used to swap the whole sidebar for that item's drawer — you asked for one more row and the panel you were working in disappeared. The list opens the new row **in place** (the item is always appended, so its index is the length before the add). A new `blankOnAdd` flag empties every declared field, and `placeholder` on the two inline fields says what belongs there. ⚠️ Both are **opt-in**: the seeds exist so an untouched page shows a realistic accordion, and a gallery slide added blank is a broken slide. A collection with no inline editor still opens its drawer, because it has nowhere else to go.
- **Verified:** a column's Design now reads "Style | Fill | None | Colour | Border | px | Corner radius | px | %" — the current component. No "Behaviour" anywhere in the module. The Live data group lists all eight rows including both service rows. Clicking Add item keeps you on the Accordion panel and opens "Item 4" expanded, both fields empty, showing "How do I reset my password?" and "Answer it in a sentence or two." as placeholders, with the Add link CTA below them.

## 55. A move is a move, and a row can live inside a column
- **Status:** done
- **Where:** `SupportPortalBuilder.tsx` (`dropBeside`)
### The copy bug
- **⚠️ `detachElement` SCHEDULES a state update; `sectionsRef` is only reassigned during the next render.** Reading it on the very next line handed back the tree as it was BEFORE the removal — so the element was written into its new box on a copy that still had it in the old one, and both survived. That is the whole of "it copies instead of moving".
- **A move is one transition, so it is now one write.** The remove and the add happen inside a single `setSections` updater, computed functionally from `prev` rather than from a ref that has not caught up.
- **⚠️ ADD FIRST, THEN clear the source.** Removing first can collapse a branch and take the target id with it — the box you were about to add beside stops existing mid-operation.
- **And the emptied box GOES, so its neighbours reflow** — that is the "other widgets rearrange automatically" half of a move. ⚠️ A root has no parent and cannot be removed: an unsplit section keeps its one empty cell, which is the offer to put something back.
- **A cross-section move keeps the old path**, because `detachElement` owns the built-in-row and other-section stores and the removal lands in a different slice than the add — no ordering hazard there.
### Row inside a column
- **⚠️ A DROP targets the box you aimed at, on both axes — it no longer goes through `rowTargetOf`.** That helper sends a row to the section's top level, which is right for the four `+` adders: they sit on a section's edge and promise a full-width band. A drag promises something else — *put it HERE* — and routing it to the top level is exactly why "row inside a column" did nothing useful: dropping under an element inside a two-column row threw the new row across the whole section instead of stacking it in the column you were pointing at.
- **Two gestures, two meanings, and the line you can see is the one that decides.** The adders still give full-width rows; the drag gives you the box under the pointer. This is also what finally makes the brief's own shape reachable: an image on the left with a title and a description stacked beside it.
- **Verified with real pointer input.** Dropping at a column's right edge → one `row` of two 544px columns. Then dropping in the lower half of the right-hand column → chip reads **"Insert in new row"** and a **`column` box 544px wide** appears nested INSIDE that column, rather than a band across the 1103px section. Dragging the video element by its grip onto another edge: **one video before, one after** — the count is the test — toast reads **"Video moved into a new column"**, and the tree reflows from `row:2, column:2` to `column:2, row:2` as the emptied box is removed.

## 54. The default page becomes two regions — a 2×2 of work cards beside the rail
- **Status:** done
- **Where:** `portalPageModel.ts` (v2 seed) · `SupportPortalPreview.tsx` (work band, `RecordTiles`, `card`) · `PortalCanvas.tsx` (resize)
- **Two regions, not five cards in one wrapping row.** The page reads as a MAIN area beside a tall rail, and a flat row could not say that: the rail is long because three cards are stacked in it, so anything sharing its line stretched to its height — and the two emptiest cards on the page came out the tallest. The main region takes **two shares to the rail's one**, which is what makes its cards half its width and the rail a third of the section. My Assets and My CIs moved up into it, so the layout is Requests | Approvals over Assets | CIs, beside the rail.
- **⚠️ `items-start` + `content-start` is what lets a card fit its CONTENT.** A flex row stretches its children by default, and that is exactly where the acres of empty space under My Assets came from. Measured after: 386 / 304 / 391 / 306 — four different heights, none stretched.
- **⚠️ Membership and PLACEMENT are different questions.** Listing assets and CIs under `work` in the v2 seed made `rowOf('assets')` answer "work" for **v1 too** — and v1 draws them in the records band, where `card()` then found them absent from `rowOrder.work` and returned null. They stay in `records`; only where they are painted changed.
- **⚠️ An order is only meaningful within ONE list.** The main region draws two cards from `work` and two from `records`, and both lists start at 0 — so CSS `order` came out 0, 1, 0, 1 and interleaved them as Requests, Assets, Approvals, CIs. `card()` takes an `orderAt` override for exactly this.
- **Four tiles, and the badge counts them all.** ⚠️ A HARD four, not a fallback: the widget spec carries a stored `show` of 5, and a stored value beats a fallback every time, so the fifth tile went on wrapping to a second line that was three tile-widths of nothing. The list variant on v1 still honours the setting; the tile variant is a 2×2 block by shape.
- **⚠️ The resize bug: a wrapped flex row is one DOM parent but SEVERAL visual rows.** Every member was treated as a sibling to share width with, so dragging My Assets narrower also shrank My CIs on the line below — a card that has nothing to do with how wide its neighbour is. The row is filtered to the members on the same line now (the tops were already captured for this and never consulted). Measured: dragging Assets 142 → 103 leaves **My Open Requests, on another line, at 142**.
- **⚠️ The rail's padding, which is what you flagged and what measurement caught:** Most Read goes through `CardShell` and brings `p-4` with it; Announcements and Contact Us are element renderers dropped straight into `cardInner`, which paints a border and no inset. Their titles sat **1px** from the card edge against Most Read's **17px**. All three read **17** now.
- **Verified in the browser at 1680px.** Requests (105, 90) | Approvals (475, 90) over Assets (105, 492) | CIs (475, 492), rail at x846. Tiles lay out **2 columns**; badges read "My Assets 5" and "My CIs 3"; the records band is gone from this layout and intact on Support Portal - 2.
- **Known, for your next step:** at half-width the asset/CI tiles truncate their names ("Dell Latitud…"). You said the tile UI is the next thing you would spec, so I have left the shape alone rather than guessing at it.

## 53. Task 41 — the blue placement line: drag, aim, split
- **Status:** done (first pass — see the two gaps at the end)
- **Where:** `portalPageModel.ts` (caps, `addNeighbourAt`) · `SupportPortalBuilder.tsx` (`dropBeside`, `columnsFull`) · `PortalCanvas.tsx` (context) · `SupportPortalPreview.tsx` (`DropLine`, `zoneFor`, `ColumnBody`)
- **Decisions taken, to push back on:** **8 columns × 8 rows**, nesting depth stays 4; the row/column question is **click-to-add only** (a drag already answers it by where you aim, and asking twice would undo the gesture); the four `+` adders and the drag **both** stay — the adders are discoverable and precise, the drag is fast.
- **The line is three layers, not one.** A line alone says WHERE and not WHAT IT LANDS INSIDE: with columns side by side a line at a boundary is ambiguous until the box around it is outlined. So: the target box outlined **3px #188DF8**, the line itself **3px, inset to the content box**, and a chip naming the outcome. ⚠️ The inset matters — a line running the full border-box width reads as belonging to the section rather than to the box it is about.
- **⚠️ THREE chip strings, not Duda's one.** Duda says "Insert to column" for every target because its drop only ever makes one thing. Ours makes rows *and* columns from the same gesture, so an admin about to split a row needs to know that before they let go: **Insert in new column** / **Insert in new row**.
- **The hit zones**, with the three corrections that decide whether it feels real rather than cheap: `edge = min(W * 0.25, 56px)` for the vertical zones, otherwise the top or bottom half; edge zones **suppressed at the column cap** (a line promising a column the row cannot take is a lie); **8px hysteresis** on every boundary, without which the line strobes whenever the pointer rests on one — the single most common way this reads as broken; and an **empty box takes no line at all**, because a line is a statement about a neighbour and there is no neighbour.
- **⚠️ CAPTURE phase, and this was the bug that would have shipped.** `Sel` wraps the element INSIDE the box and has its own MOVE_MIME handlers that `stopPropagation` — so on the bubble phase the inner `Sel` answered first and the box never saw a move-drag at all. The line appeared for a palette drag and not for dragging something already on the page, which is half the gesture. Capturing runs the ancestor first. **Consequence, deliberately:** dragging one element onto another now SPLITS at the edge you aimed at rather than swapping the two — a gesture that draws a line and then swaps is lying about what it will do.
- **⚠️ `addNeighbourAt` returns the minted box's id.** A drop that splits has to put the element into the box it just made, and that id was unknowable from outside: the wrap branch mints twice, so `section.next` read beforehand is right in one branch and off by one in the other.
- **⚠️ A TDZ crash, caught in the browser:** `dropBeside` sat 400 lines above `detachElement` and named it in its dependency array — "Cannot access 'detachElement' before initialization", the whole builder blank. esbuild builds that green. Moved below it.
- **⚠️ A tooltip that had become a lie:** the drag grip still said "Drag to reorder — stays inside this group". With edge-drop it can leave its group. Now "Drag to move — drop at an edge to split".
- **Verified with REAL pointer input** (Playwright `mouse.down/move/up` — synthetic events cannot drive HTML5 drag). Dragging **Text** from the palette to the **right edge** of the video box: mid-drag the chip reads **"Insert in new column"** and one element carries `outline-color: rgb(24, 141, 248)`; on release the section is a `row` of **2 children at 226 + 226** — equal share — and the toast says "Text placed in a new column". Dragging to the **bottom half**: chip reads **"Insert in new row"**, and the root becomes a `column` of **2 full-width children (467 + 467)** with the original row nested inside the first.
- **Two gaps to close next:** (1) the **move**-drag branch is built, typechecked and shares `dropBeside` with the proven palette path, but I could not drive its grip end-to-end this pass — the grips were scrolled out of the viewport and elements carry no id in the DOM to target; (2) the brief's **layer 1**, a 1px outline on the whole section under the pointer, is not drawn yet.

## 52. Contact Us joins Live data, and stops being editable
- **Status:** done
- **Where:** `supportPortalData.ts` (palette) · `portalWidgetSpec.ts` (`contact_us` fields, `WIDGET_FOR_NODE`)
- **Live data, not Custom.** Its own spec has said `group: 'Live data'` all along — only the PALETTE entry disagreed, and the palette is the one an admin reads. The group is not decoration: Live data and Actions are the predefined groups, so moving it is what makes Contact Us behave like the card it is — one instance, ticked once it is on the page.
- **The two value fields are gone, so the panel is DESIGN only.** The labels went in an earlier pass because "Email" and "Phone" are the product's words; the values follow for the same reason one step further out — what a portal publishes as its support address is an **organisation record**, not a page layout, and a copy of it editable here is a second answer that goes stale the day the real one changes. ⚠️ Every string stays in `defaults` and the renderer still reads them, so the card looks exactly as it did. With no fields left the CONTENT section is dropped whole, which is the same panel the six other live-data widgets already have.
- **Inline editing was already gone** — `ContactRender` wraps nothing in `Sel`, from the pass that removed the labels.
- **⚠️ A gap from task 50, found while testing this:** the `news` and `contact` nodes I added for the v2 rail were never added to `WIDGET_FOR_NODE`, so they resolved to nothing and the drawer fell through to their PARENT's panel — selecting Contact Us opened the work row's editor, which greets you with "select a card inside it to edit that card" about the card you had just selected. A node in `PORTAL_NODES` is only half of a block; this map is the other half. Both ids already sat in `WIDGET_FOR_TYPE` for the placed versions, and ⚠️ both routes must reach the SAME spec or one widget edits two ways.
- **Verified in the browser.** Contact Us sits in the palette's **LIVE DATA** group with the green already-placed tick. Selecting the card opens a drawer titled "Contact Us" showing **DESIGN only** — Style (Fill · Border · Corner radius) and Spacing. No CONTENT section, no "Email address", no "Phone number", no "Show hours"; the card still renders Email · servicedesk@acme.com · Phone · +91 79 4040 0000, none of it inline editable.

## 51. A row is the width of the SECTION, wherever you asked for it
- **Status:** done
- **Where:** `portalPageModel.ts` (`topLevelBoxOf`, `rowTargetOf`) · `SupportPortalBuilder.tsx` (`addBeside`)
- **The bug you caught:** asking for a row below a column got a row **inside that column** — the width of the column, stacked under its own content, while the column beside it carried on past both. That is a split, not a row, and it is not what an adder on the bottom edge says it will do.
- **⚠️ Rows and columns are NOT symmetric, which is the whole of the fix.** A column divides the row it is in, so it belongs beside the box you clicked. A row spans everything, so it belongs at the **top level however deep the click came from**. The horizontal adders still act on the clicked box; the vertical ones now resolve a target first.
- **`rowTargetOf` is two cases that are one sentence read twice:** if the section root already STACKS its children they are full-width rows already, so the new one joins them beside whichever branch the click came from; if it does not, the ROOT is what gets wrapped — which is the thing that turns the whole section into a stack in the first place.
- **The new row arrives full width and empty**, so dividing it into columns is the same adders one level in — which is the order you asked for: a row first, columns only if you want them.
- **Verified in the browser, reproducing your screenshot exactly.** A section split into two columns (467px row → 226 + 226), then **Add a row below** on the RIGHT column: the root becomes a `column` of two children, **both 467px — full width** — the first holding the original two-column row. Then **Add a row above** from the video column **nested two levels down**: the root goes to three children, all **467px**, stacked at y 492 / 628 / 777. The row lands at section level from any depth.

## 50. Two portals — the live product's page as the default, today's kept as "Support Portal - 2"
- **Status:** done
- **Where:** `supportPortalData.ts` · `portalPageModel.ts` · `SupportPortalBuilder.tsx` · `SupportPortalPreview.tsx` · `AdminSupportPortalModule.tsx`
- **⚠️ The finding that shaped this: a portal's arrangement was GLOBAL CONSTANTS.** `blockOrder`, `rowOrder` and `content` were seeded from one set of defaults, so every record in the listing opened the identical page — two portals could differ by name and address and by nothing you could see. The seed lives on the record now (`PortalPage.layout`), which is the smallest thing that makes two portals genuinely two portals. Edits inside a session behave exactly as they did.
- **The listing has two rows.** **Support Portal** (Default, `v2`) carries the layout from the screenshots; **Support Portal - 2** (`v1`) keeps today's arrangement untouched. ⚠️ The default keeps id **SPP-1** — being the default is tested by id in a dozen places (the badge, the locked Enabled toggle, the undeletable row, the portal's own address), so giving the new layout a new id would have moved every one of those onto the old page.
- **v2 is SEEDS, not a second renderer** — the same bands, cards and widgets in a different order with a different column count. A layout with its own rendering path would be a second page to maintain, and the two would drift the first time a widget changed. The differences are all of: no Most Used Services row; the work band is Requests + Approvals beside a stacked **rail** of Announcements, Most Read and Contact Us; My Assets and My CIs are full-width rows of **tiles**.
- **Announcements and Contact Us became page BLOCKS.** They existed only as placeable elements, so a page could carry them but none shipped with them and nothing could address them by name. They render through the very same renderers the placed elements use — one Announcements in this product, not two that drift.
- **My CIs has real rows on v2 only.** It is deliberately empty on v1 (§7.4 — an instance where nobody has been given a CI is the state most requesters see). The v2 page is a copy of an instance that HAS them, where an empty card would misrepresent that one instead. The rows follow the layout, not the widget.
### ⚠️ Three bugs this turned up
- **A band not in `blockOrder` still rendered.** Bands took only their POSITION from the order, so dropping Most Used Services from the v2 seed drew it at `indexOf === -1` — order −2, i.e. FIRST. `blockOrder` means what it says now.
- **The layout was read twice and could disagree.** `blockOrder`/`rowOrder` are `useState` initialisers, answering once; the rail re-read `page.layout` every render. The bands came out in the v2 order while the rail was undefined, so the rail's two cards silently rendered nowhere. One decision, taken at mount, held in state.
- **`NODE_CFG_SEED.records = { cols: '2' }` beat every fallback.** `secCols` reads the config first, so a column count set in the renderer or in `content.cols` could never win — the records row stayed two columns however the layout was described elsewhere. The count belongs in the seed, and there is now one of it.
- **Verified in the browser, both pages.** **Support Portal**: rail stacked Announcements (y 670) → Most Read (1003) → Contact Us (1341); My Assets **467px, full width** at 1542 with My CIs **467px** below it at 2164; Most Used Services absent as a band; CI-8 / CI-7 / CI-5 rendering as tiles. **Support Portal - 2**: Most Used Services present as a band before the work row, My CIs showing "No Data Found", My Assets 226px side by side with My CIs — the original layout, unchanged.
- **Not touched, deliberately:** the banner keeps the current portal's artwork, as asked; the fourth action card (AD Self Service) was already shipping and needed nothing. The asset and CI tiles are a first pass replicating the screenshot — their UI is the next step.

## 49. Four adders, rows as well as columns — and the selection conflict goes
- **Status:** done
- **Where:** `portalPageModel.ts` (`addNeighbour`, `neighbourBlockedBecause`) · `SupportPortalBuilder.tsx` (`addBeside`, `splitNode`) · `PortalCanvas.tsx` (`ColumnAdders`) · `SupportPortalPreview.tsx` · `PortalPlacedElement.tsx`
### Rows, not just columns
- **Four adders now, and the SIDE decides what you get:** left/right add a **column** beside the box, top/bottom add a **row** above or below it. There were two, chosen by the parent's axis — so the same button added a column here and a row one level down, and on a section laid out as columns there was no way to ask for a row at all.
- **⚠️ The new primitive is `addNeighbour`, not `addSibling`.** A sibling can only ever go in along the parent's existing axis. When the axis you asked for is not the one the box is in — which includes every unsplit section, since a root has no parent — the box is **wrapped** in a new box of that direction and the empty neighbour joins it there. That wrap is what makes one control mean one thing at every level instead of quietly changing meaning with the shape you happen to be standing in.
- **⚠️ The outer box keeps the original id**, so anything selected, styled or configured against it still resolves — the rule `removeBox`'s collapse already follows.
- **A new row arrives full width and empty**, and subdividing it is the same four buttons one level in. You are never asked to choose a layout before you have anything to lay out.
### The conflict
- **A box hides its adders once the selection is that box OR anything inside it.** ⚠️ The PATH, not the id — the same test hover already uses. Selecting an element inside a column leaves `selectedId` on the element, so an id test said the column was not selected and kept its four adders, sitting on exactly the four edges the element's own resize handles were drawn on. Two controls, one point, and the click went to whichever painted last.
- Selection means "I am sizing this", hover means "I am adding beside this". They were sharing a surface.
### Buttons reflow
- **`min-h` and real vertical padding, not a fixed height**, plus `max-w-full`, `break-words` and `text-center`. A fixed `h-9` cannot reflow: narrow the section and the label ran out through the side of its own column. As a floor the button keeps exactly the size it had for one line — 28 / 36 / 44px, unchanged — and grows a line at a time instead of spilling.
### ⚠️ A silent cap, found by testing
- **`addBeside` and `splitNode` were both reading their block-reason from inside the `setSections` updater and checking it on the next line — which runs first.** So `blocked` was always null: the cap worked (nothing was added) and said nothing, the exact silent no-op every limit in this builder is written to avoid. Split has been refusing at the depth and column caps without ever saying why. Both read from `sectionsRef` before the state update now.
- **Verified in the browser, end to end.** Hover a box → 4 adders, **0** handles; select it → **0** adders, **8** handles (4 corners `nwse`/`nesw` + 4 sides). "Add a row below" on the unsplit table section wrapped it into a `column` box of **2 full-width rows** (467px each) with the table intact; "Add a column to the right" on the new row split it into **2 equal columns** (226 + 226). A fifth column is refused with **"A row holds 4 columns at most"** and the row stays at 4. The button measures **max-width 100%, min-height 36px, break-word, centre** and, with its host squeezed 467 → 120px, goes 187×36 → **120×55** — fitting exactly, no overflow, one line taller.

## 48. The Theme panel's light/dark switch loses its words
- **Status:** done
- **Where:** `PortalThemePanel.tsx` (`ThemeModeToggle`)
- **Icons only — a sun and a moon need no caption.** The words were added when this control was two grey glyphs nobody could find on a busy title row; what actually fixed that was the **accent fill** on the active side, the one weight on this panel that reads as "this is on", and it does that job whether or not the word sits beside it.
- **⚠️ The `title` and `aria-label` are now the ONLY things naming the two modes** — the button has no text node left, so dropping either would leave a control a screen reader announces as nothing at all. `aria-pressed` carries the state for the same reason.
- **Verified in the browser.** Two 28×28 buttons, `textContent` empty on both. Active side measures **rgb(61, 139, 208)**, the inactive one transparent; clicking the moon flips `aria-pressed` on both and puts `.portal-dark` on the canvas, so the switch still does what it did.

## 47. Border stops leaking into a widget's own children, and the preset list says what it is
- **Status:** done
- **Where:** `portalStyleResolver.ts` (`containerCss`) · `PortalRecordFilter.tsx` · `portalRecordFilters.ts`
### The border bug
- **Reproduced first.** Setting My Open Requests to a 6px border painted 6px on **two** elements: the white card *and* its "View all" node. That is the box-inside-a-box in your screenshot.
- **The cause is the inheritance model doing exactly what it says.** `resolve()` walks page → section → column → widget → item per key, so a border set on the card was *inherited* by every node inside it that draws a container. **Padding, width and height were already exempt** — each with a comment describing this same bug — and fill, border, shadow and corners had simply been missed.
- **⚠️ The box keys are OWN-ONLY now.** They are statements about ONE box and are meaningless as a statement about somebody else's: a fill would be worse than the border, painting the card and every child the same colour one over the other. The widget itself still paints because the panel writes to the OWNER node, which IS the node whose `Sel` draws the card — so the value is present exactly where it should appear and absent everywhere it should not.
- **This is fixed for EVERY widget, and it is one code path, not thirty.** `containerCss` is the only reader that resolves border through the chain; every other border in the builder (`fillCss`, the placed-element surfaces, the action cards) reads the node's own `cfg`, which has no chain to inherit down.
- **Verified in the browser, twice, on two different render paths.** My Open Requests (a fixed page block, 6px) → **1** element with a thick border, the white card, where it was 2 before. The Record List (a placed element, through `Surface`, 7px) → **1**, the white card. Screenshot confirms no box around "View all" and none around the rows.
### The predefined filter list
- **The pin is gone, and the localStorage behind it.** Reordering a twelve-row list that is already searchable bought very little, and it bought it with an icon that appeared under the pointer on every row — on the surface whose whole job is letting you read the rows. Rows are in catalogue order now, exactly as the product lists them.
- **A "PREDEFINED FILTERS" title**, because a bare list of twelve names does not say what kind of thing they are — an admin should not have to infer from the wording that these came with the product rather than from somebody's earlier session.
- **Hover now says what a preset FILTERS BY.** A name is a promise the list cannot keep on its own; two of these differ by a single condition. ⚠️ It needed a new field: `PresetFilter.scope` — the half of a preset that is about WHO is asking ("Assigned to me", "In my technician group"). It cannot be a Condition, because no field on the record holds it, and it has to be SAID or "My Overdue Requests" and an everybody's-overdue filter would list the identical condition and read as the same filter.
- **⚠️ The card is placed against the POPOVER, not the row.** First version flipped off the row's left edge — a row sits ~13px inside the popover's padding, so the card ended 5px INSIDE the list, covering the first characters of every name, which is the one thing it exists not to do. Measured: it now clears the list by exactly 8px.
- **Verified in the browser.** Title renders, **zero** pin buttons in the popover. "Unassigned Requests in My Group" → *In my technician group · Status Not In Resolved, Closed · Assignee In Unassigned*, card sitting **left of list, 8px gap**, fully on screen. "All Requests" (no conditions, no scope) → "No conditions — every record in this module." "Requests Watched By Me" (scope, no conditions) → "Watched by me" — the three cases that could each have rendered an empty card.

## 46. The Default template shows the real portal — and every tile gets its caption back
- **Status:** done
- **Where:** `CreateSupportPortalModal.tsx` (`PortalThumb` + the tile markup)
- **The first tile is the PORTAL now, not a drawing of it.** Every other tile is a wireframe because every other tile is a template nobody has built yet — there is nothing to photograph. This one is different: the portal it offers EXISTS, so the tile simply shows it, and the one starting point an admin might actually recognise stops being the one they have to take on trust.
- **⚠️ Live, never a screenshot.** A PNG committed today is a picture of the portal *as it was today* — it would go on promising the old layout after the first person edited the page, and nothing would ever tell us it had gone stale. The tile mounts the same `SupportPortalPreview` the builder draws, which IS the page a new portal starts from. The canvas context's default has `enabled: false`, so no outline, hint or handle comes with it.
- **⚠️ Rendered at a full page width and SCALED DOWN**, not rendered narrow. The portal is responsive: at 267px it would reflow to its one-column phone layout and the tile would be a truthful picture of the wrong thing. The scale is measured with a `ResizeObserver`, because the tile's width belongs to the grid and changes with the dialog.
- **⚠️ The accent is read from the THEME** (`swatchesOf(theme)[3]`), exactly as the builder reads it — never left to `SupportPortalPreview`'s own `accent` default, which is a near-black. The tile promising "the portal your requesters see today" was painting its banner a colour the page does not use: a picture wrong in the one way a picture is meant to be right.
- **The Default badge was already written — it was being CLIPPED, along with every other tile's name and description.** The art had no box of its own, so it was `height: 100%` of the tile, took the whole button and pushed the caption out through `overflow-hidden`. That is why the grid read as a wall of unlabelled pictures. Each tile now gets the `h-[150px]` art box the template gallery already uses — one art height across both surfaces rather than a new number — and the wireframes, which were being stretched 1.6× tall by the same fault, draw at their real 160 × 96 proportions again.
- **Verified in the browser.** The tile renders the live portal: motadata bar, hero with search, the four action cards, Favourite Services. Hero gradient starts `rgb(61, 139, 208)` = **#3D8BD0**, the portal's own accent, where it was near-black before. Caption reads "Support Portal" + a blue **Default** badge, measured `badgeVisible: true` inside the tile's bounds; tile 243px tall over a 150px art box. Every other tile now shows its name and description too. Clicking the tile still creates the portal and opens the builder (`#/admin/support-portal/tile-check`).

## 45. Table — the menu stops covering the cells it is about, and h-scroll stops being a setting
- **Status:** done
- **Where:** `PortalTable.tsx` (`HandleMenu` + the three call sites) · `portalCollectionSpecs.ts` (`TABLE_SPEC`)
- **The menu sat on top of its own column.** You picked a column, the menu dropped from the rail straight down it, and the data you needed in order to choose "Sort A → Z" or "Colour" was behind the menu — so you were picking an action for cells you could no longer read. The row menu had the same fault from the row's top edge.
- **The fix is the target's SHAPE, not a nudge.** A column is a vertical strip, so the menu goes to its **side**; a row is a horizontal band, so the menu goes **under** it, or over it when there is no room below. Either way the selection stays fully visible and only its neighbours are covered. ⚠️ Only when NEITHER side fits does it clamp and accept an overlap — a menu pushed off the window is worse than one covering what it is about.
- **⚠️ A call site now hands over an avoid-RECT, not a point.** Where the menu goes is worked out from what is selected, in one place. Three call sites each guessing their own position is how two of them came to guess wrong.
- **⚠️ Measured after mount, in a layout effect.** A flip needs the menu's real height and the row, column and cell menus are three different lengths. It renders hidden-but-laid-out for that one pass — `visibility`, never `display`, or there is nothing to measure.
- **⚠️ Portalled, in viewport coordinates.** The table wrapper scrolls horizontally, and an absolutely-positioned menu inside an `overflow-x-auto` box is clipped at its edge — the trap that has already taken the Colour and Alignment flyouts, the drawer tab strip and the listing kebab. Moving the menu beside a column would have walked straight back into it.
- **"Horizontal scroll on narrow screens" is gone.** It made "does a wide table fit on a phone" a question every table put to its author, and the only answer anyone wants is yes. ⚠️ Unlike the other panel removals this one took its stored value with it: the renderer scrolls unconditionally now, so there is no key left holding a value nothing can set.
- **Verified in the browser.** Column 2 selected: menu at x 426, the column's cells end at x 422 — zero overlap on any of its three cells, `position: fixed`. Row 2 low in the window: the menu flips **above**, its bottom at 487 against a row top of 493. The same row scrolled up: the menu opens **below** with a 4px gap. No overlap on any cell in either orientation. The panel reads CONTENT (Select row / column cells · Title · First row is a header · First column is a header) → DESIGN (Table: Cell padding · Spacing), and both tables on the page compute `overflow-x: auto` with no setting behind it.

## 44. Record List — a white card, a trimmed panel, and the product's own filter
- **Status:** done
- **Where:** `portalRecordFilters.ts` + `PortalRecordFilter.tsx` (new) · `portalWidgetSpec.ts` · `PortalWidgetDrawer.tsx` · `PortalCollectionRender.tsx` · `portalPageModel.ts`
- **The card has a hard white boundary now.** `c-records` was missing from `CARD_TYPES`, so it drew its rows straight onto the page background while My Open Requests — the card it copies header, count, View-all and rows from — sat in a white bordered box. Two cards of the same kind read as two different kinds of thing. Measured: `#FFFFFF`, 1px `#E5E7EB`, 10px radius, 16px padding, identical to every other live card.
- **No one-line help under any field.** "Which records this card lists" under a field labelled Module is the label again in a longer sentence, and a caption under every control turns four rows into a wall of grey text you learn to skip — which is where the one caption that WOULD have earned its place goes unread.
- **"Rows to show" is gone.** How many rows a card carries is its own height on the canvas — you drag the bottom edge and the list grows — so a number field was a second control for a value the page already answers by being looked at. The key stays in `defaults` and the renderer still reads it, so no card on any page moved.
- **Status and Scope are replaced by the product's own filter.** Two things, one field: the **named out-of-the-box presets** (image 3 — All Open Requests, My Overdue Requests, Unassigned Requests in My Group … pinnable, searchable) and a **custom condition builder** (images 4–10 — field picker, operator, and the five value editors: text, multi-select, searchable person list with avatars, date presets, tag chips). Scope went with them: "My requests" is one of the presets, which is where a requester-scope question belongs rather than a second dropdown that can contradict the first.
- **⚠️ The width was the problem to solve.** The technician list page runs its filter across the top of the PAGE, so conditions sit side by side as chips and each opens a popup beneath itself. This panel is 340px: laid out that way you get three chips wrapping onto four lines with their popups clipped by the panel's own scroll. So the **content is identical** — same presets, same fields, same operators, same editors — and only the **layout** adapts: conditions **stack**, one per row, and the editors are **views inside the one popover** rather than popups on top of a popup. Portalled to `document.body`, because an absolutely-positioned popover inside an `overflow-y-auto` panel is clipped the moment it is taller than the space below its field — the trap that has already caught the colour picker, the icon picker and the table's alignment flyout.
- **⚠️ Both halves are ONE setting.** `activeConditions()` resolves whichever is set, so the renderer never has to know which — and writing a condition CLEARS the preset, because a card claiming "All Open Requests" while running three conditions of somebody's own would be the panel lying about what the requester will see. The conditions in force show as chips under the closed field, so a chosen preset is never a name with nothing behind it.
- **⚠️ Presets and fields are PER MODULE**, and changing the module clears the filter and says so — "All Open Requests" is not a thing a Change has, and a Change's statuses are not words a Request knows.
- **⚠️ A condition on a field the SAMPLE rows do not carry passes rather than emptying the card.** The builder's rows are samples with an id, a title and a status; evaluating an absent priority or assignee as "no match" would black the preview out the moment anybody picked a realistic filter, teaching an admin their filter is broken when it is the preview that is thin. The widget's note says so.
- **⚠️ A pin is keyed `module:id`, not `id`** — caught in the browser. Every module's catalogue ends in an "All …" preset and they all carry the id `all`, so pinning "All Changes" silently pinned "All Requests" and seven others: one gesture quietly changing nine lists the admin was not looking at.
- **Verified in the browser.** Panel reads CONTENT (Title · Module · Filter) → DESIGN (Style · Spacing) — no Statuses, no Scope, no Rows to show, no help lines. Preset **All Archived Requests** (Status In Closed) → card count **0** and the My CIs "No Data Found" state; custom **Status In Pending** → count **1**, INC-178 only, and the field relabels to "Custom · 1 condition". Switching the module to Changes swaps the card to CHG-2091/CHG-2088 and clears the filter to "No filter — every record"; the preset list becomes the five Change presets. Pinning "All Requests" floats it to the top and stores `["request:all"]`; switching to Changes leaves "All Changes" unpinned.

## 43. Table — grips follow the hovered CELL, and the panel loses three groups
- **Status:** done
- **Where:** `PortalTable.tsx`, `portalCollectionSpecs.ts` (`TABLE_SPEC`), `PortalWidgetDrawer.tsx`
- **⚠️ I got the first one wrong twice.** You asked for the grips of the **hovered cell's** row and column; I gated them on hovering the **table**, so every row and every column lit at once — which says nothing about where you are and buries the grip you were reaching for in a rail of identical bars. `hoverRow`/`hoverCol` were already the hovered cell's coordinates; the visibility test was simply reading the wrong flag.
- **The rule now:** nothing at rest → hover a cell and exactly its row grip and its column grip appear, in the **secondary grey pill** (#B6C2D5) → click one and it fills **primary blue** (#3D8BD0) with its row or column selected. A selected grip stays visible when the pointer moves away, because otherwise nothing would show what is selected. ⚠️ A hidden grip is also `pointer-events-none` — `opacity-0` still takes the pointer, so an invisible rail sat between the cursor and the cell and swallowed the very mouseenter that would have lit it.
- **The panel lost three groups and two fields.** **Table content** (the sheet editor) — the canvas is where you type now, and two editors for one grid is how the panel and the page start disagreeing. **"Optional."** under Title — every field here is optional, so saying it on one implies the rest are not. **Text style** — fourteen controls for a look you now set per cell from the cell's own menu, where you can see what you are changing. **Alignment** — the cell menu aligns per cell and per selection, the only scale at which a table's alignment is really decided. **Border** — a frame round a grid whose lines the cells already draw.
- **Both headers ship ON.** ⚠️ `firstColumn` was being seeded `true` beside `headerRow` and then set back to `false` further down the same defaults object, so the later one won and the toggle shipped off.
- **⚠️ A bug your 3rd screenshot caught:** the `chips` control hardcoded "No statuses — the list will be empty", so **every** chips field in the builder said it — which is why a Table's *Font format* was talking about statuses. The empty text is derived from the field's own label now, and a field may still name its own.
- **Verified with real pointer movement:** at rest **no grips**; hovering cell (0,0) lights exactly `Column 1 options` + `Row 1 options`; hovering cell (1,1) lights exactly `Column 2 options` + `Row 2 options`; leaving the table clears them. Hover measures **rgb(182, 194, 213)**, selected **rgb(61, 139, 208)**. The panel reads CONTENT (Select row / column cells · Title · First row is a header · First column is a header) → DESIGN (Table: Cell padding, Horizontal scroll · Spacing). A fresh table's first body row is `TH TD TD`.

## 42. Record List — the live card with the question left open
- **Status:** done
- **Your numbering:** line **37** in zeni_tasks.md.
- **Where:** `supportPortalData.ts` (`RECORD_MODULES`), `portalWidgetSpec.ts` (`record_list`), `PortalCollectionRender.tsx` (`RecordListRender`)
- **You asked:** a custom card like the predefined live-data ones — the admin adds it, it lands with dummy data, they pick a module and filters, and it fetches from the backend. Matching records render; nothing matching shows the same empty state My CIs has.
- **Named Record List.** In ITSM *record* already covers a request, an asset, a CI and a change, so the name holds whichever module it points at — and it reads right beside the fixed cards: My Open Requests is a record list whose question is answered, this is one that asks you. "Custom Card" would have read as **Custom ▸ Custom Card**, and "custom" describes where it lives rather than what it does.
- **Modules (your call, all of them):** Requests · Problems · Changes · Releases · Assets · Configuration Items · Patches · Vulnerabilities · Approvals · Tasks. ⚠️ I had proposed limiting it to what a requester owns, because a Change is technician-side and would come back empty for most people — you chose the full set, so a card pointed at one is the admin's decision to make. Adding another module is one row in `RECORD_MODULES`; nothing else knows the set.
- **⚠️ Statuses are per module, and changing the module CLEARS them, out loud.** A request is Open, a change is Draft, a patch is Missing — a status list left holding the previous module's words matches nothing, and the card comes back empty for a reason nobody can see. The toast says "Statuses cleared — they belong to the module you just left".
- **⚠️ An empty status list means EVERY status**, not none. "I have not narrowed this" and "I have narrowed it to nothing" are different intentions, and only one of them should empty the card.
- **⚠️ The filter runs on the canvas too.** Narrow the statuses and rows drop out here exactly as they will on the portal. A card that ignored its own filters while you were configuring it would teach the admin the controls do nothing, which is the one thing a builder must never do.
- **⚠️ It has a Content panel where the six fixed cards have none — not a contradiction.** Those lost theirs because the backend owns the answer: what "My Open Requests" means is the product's decision. Here the admin owns it, so the panel is the only place the widget can learn what it is for. Its title is authored for the same reason.
- **⚠️ It sits in Custom, not Live data, and that placement does work.** Live data and Actions are group-gated as predefined — one instance, greyed with a tick once placed. Custom is repeatable, which is what this needs: two Record Lists filtered differently is a reasonable page.
- **Verified:** the palette went 22 → 23 rows with Record List under Custom. Added, it lands showing three request rows. Switching the module to Configuration Items swapped the rows to CI-104 / CI-121 and fired the clear toast. Filtering to **Down** — a status no CI row carries — gave "My records | 0 | View all | **No Data Found**", the same state My CIs shows. Two of them coexist on the page, which is the repeatability the Custom group buys.

## 41. The light/dark switcher, and colour-picker tabs that follow it
- **Status:** done
- **Your numbering:** line **39** in zeni_tasks.md.
- **Where:** `PortalThemePanel.tsx`, `PortalColorPicker.tsx`
- **You asked:** make the light/dark switcher prominent and primary-coloured; give the colour picker Light/Dark tabs; and have the tab follow the switcher — light selected → every primary/secondary/neutral picker opens on Light, flip to dark → they all open on Dark.
- **The switcher** is labelled and accent-filled now, not two grey icon glyphs. It decides which of two palettes every swatch below it shows AND which tab their pickers open on — the most consequential switch on the panel, and it was the quietest thing on its row.
- **⚠️ This needed a model change, and it fixed a real bug.** An override was ONE value per swatch, so a colour edited for the light portal silently became the dark portal's colour too. Every swatch ships with two values precisely because the two modes want different ones; a single override threw that away the first time anybody touched a dot. Overrides are keyed **per mode** now (`light:primary1`), with the bare key still read as a fallback so a theme carrying older overrides keeps them.
- **⚠️ The tab is seeded from the theme's mode on every open, never remembered.** The rule you asked for is that it follows the switcher — a tab that remembered its last position would start disagreeing with the panel the second time you opened it.
- **⚠️ The spectrum had to be re-seeded on tab change.** `useState` only ever reads its initial argument, so switching tabs left the wheel sitting on the other mode's colour while the hex field showed the right one.
- **Verified in both directions:** the active switcher side measures **rgb(61, 139, 208)** — #3D8BD0. In light mode the Primary picker opens on the **Light** tab showing `3D8BD0`, and clicking Dark shows `5AA7E5`. Flipping the switcher to Dark and reopening the same picker lands on the **Dark** tab with `5AA7E5` already selected.

## 40. Suggested image sizes in the empty upload state
- **Status:** done
- **Your numbering:** this is line **38** in zeni_tasks.md — the board numbers drifted when interim work was added, so each entry names its source line rather than pretending the two lists match.
- **Where:** `PortalControls.tsx` (`ImageUploadZone`, `UploadZone`), `portalWidgetSpec.ts`, `portalStructureSpecs.ts`, `PortalIconPicker.tsx`
- **You asked:** show a suggested size in the empty upload container for banner, logo and icon, so the size is known before choosing a file.
- **The sizes, and why each:** **Banner 1600 × 400** — the band is full-width and about 200px tall, so this is a 2× asset that stays sharp on a retina screen without being a photograph nobody needs. **Logo 240 × 64** — the top bar renders the mark at about 28px tall, and wider than tall because every logo in that bar is. **Icon 128 × 128** — the slot renders at 44px and CROPS to it, so a square is the only shape that survives the crop with nothing lost off its sides.
- **⚠️ Its own line, not appended to the format hint.** "PNG, JPG, SVG or WebP · max 5MB" is a RULE — break it and the file is rejected — while a suggested size is advice you are free to ignore. Running the two together makes the advice read as a fourth condition of upload.
- **⚠️ Suppressed while an error is showing.** The reason a file was rejected is the only thing worth reading at that moment, and advice underneath it competes for the same glance.
- **⚠️ Per SLOT, never a default.** Declared on the field, because the zone has no way to know which of the page's image slots it is being used for — and one number offered to all three would be wrong for at least two.
- **⚠️ The icon slot has TWO doors** — the panel's Icon field and clicking the icon on the canvas — and both now say 128 × 128. An admin who reached it one way would otherwise have been given a different answer from one who reached it the other.
- **Verified:** the banner zone reads "PNG, JPG, SVG or WebP · max 5MB / **Suggested 1600 × 400 px**"; the logo zone "**Suggested 240 × 64 px**"; the action card's Icon ▸ Image tab "**Suggested 128 × 128 px**".

## 39. Table — the picker, the grips and the flyouts
- **Status:** done
- **Where:** `PortalTable.tsx`, `portalTableModel.ts`, `PortalWidgetDrawer.tsx`, `portalCollectionSpecs.ts`
- **You asked:** (1) a proper 10×10 row/column picker like your reference, opened from a **"select row / column cells"** field; (2) the drag grip as **6 dots, on hover only**, filling when selected; (3) Colour and Alignment must open on hover — they were not opening at all.
- **(3) was a real bug, and the cause is worth remembering.** The menu had `overflow-y-auto` with `overflow-x-visible` — ⚠️ **CSS forbids one axis being `visible` while the other scrolls**, so the x axis silently computed to `auto` as well and both flyouts were clipped at the menu's edge. They are portalled to the body now, positioned from the trigger's own rect, flipped left when the right would run off the window and clamped so a long colour list stays on screen. Hover opens them, and the rect is measured in the same handler.
- **(1)** The picker is a **contiguous grid** — cells sharing their borders, the way a table's cells do; spaced squares read as a set of buttons, and the thing you are sizing is a grid. It has a footer that reads the live dimensions while you hover and says "Choose row and column" when you are not. A **"Select row / column cells"** field in the panel shows the current shape and opens it. ⚠️ Picking **RESIZES rather than rebuilds** — choosing a size on a table you have already filled in must not empty it: growing adds blank cells, shrinking drops only what falls outside, and everything inside keeps its text, colour and alignment.
- **(2)** The grips are **six dots** and **hidden until the pointer is over the table** — permanently-visible grips put two grey bars around every table on a canvas whose job is showing what the portal looks like. Hovered they go mid-grey, selected or being dragged they fill with the accent: the same grip in two weights, so "this is the one I have hold of" needs no second control to say it.
- **Verified with real input:** the grip measures **opacity 0 at rest, 1 on table hover**, and its icon is **6 paths**. Hovering Colour opens a 190px flyout fully on screen; Alignment likewise. The panel field reads **3 × 3**, opens a **100-cell** grid with the "Choose row and column" footer, and picking 4 × 5 gave a 4-row × 5-column table with "L1 · Service Desk" still in place.

## 38. The Default tile shows this portal, not a generic wireframe
- **Status:** done
- **Where:** `SupportPortalTemplateGallery.tsx` (`TemplateArt`), `supportPortalData.ts` (`TemplateLayout`), `CreateSupportPortalModal.tsx`
- **You asked:** the Default tile in the templates grid should show the Support Portal default page image.
- **What it was:** the tile borrowed `classic` — a generic three-column wireframe shared with an actual template. So the one tile that promises "the page your requesters see today" was showing a page nobody has, and it looked like every other tile in the grid.
- **What it draws now:** a new `portal` layout, taken from what the page actually renders — the banner with its search bar, the **four action cards riding up into its lower edge**, a Favourite Services label with four tiles, and the three work cards with their rows. Anyone who has seen the portal recognises it, which is the whole job of that one tile.
- **Verified:** the first tile carries **39** rects against **15** for its neighbours, and reads "Support Portal · Default · The standard ServiceOps portal your requesters see today."

## 37. An empty section is one box, not a box inside a box
- **Status:** done
- **Where:** `SupportPortalPreview.tsx` (`ColumnBody`)
- **You asked:** remove the column from an empty section added with the + Add Section CTA.
- **What it was:** a section that has never been SPLIT has a root box whose id IS the section's — same node, same bounds — but `ColumnBody` still drew the empty-column treatment around it: a dashed 120px frame inside the section's own outline. Two borders and two sets of padding describing one place.
- **The test is `dir`**, which is undefined exactly when a box has no parent — the same thing as "this IS the section". A split section's columns keep their dashed frames, because there the frame is telling you where one column ends and the next begins.
- **The "+" stays either way** — it is the offer to put something here, and without it an empty section would be a blank gap on the page. The drag-over tint keeps its dashed edge so a drop target still reads as one.
- **Verified:** a section added from + Add Section contains **0 dashed boxes**, is 112px tall and shows the "+".

## 33. FAQ matches the Accordion, and the per-item arrow goes
- **Status:** done
- **Where:** `portalCollectionSpecs.ts` (`FAQ_SPEC`), `PortalCollectionRender.tsx` (`FaqRender`), `PortalItemList.tsx`, `PortalWidgetDrawer.tsx`
- **You asked:** (1) remove the Behaviour section from FAQ; (2) remove the right arrow that redirects to a new page by swapping the current one; (3) remove the Design fields in the second screenshot, and make the FAQ expand/collapse the way the Accordion does.
- **Settled first:** **Item container** goes too (it was just above your crop) — leaving Design as Style + Spacing, exactly the Accordion's panel. The arrow goes **everywhere a row has an inline editor**, not FAQ only. Both widgets stay in the palette for now.
- **(1) + (3)** FAQ's `fields` is now a Title and nothing else. Out went the Behaviour group (show-first-open, allow-multi-open) and the whole Accordion style group — item container, divider, chevron position, chevron rotation, question padding, answer indent, open-item background, expand animation: thirteen controls for a list of questions. The per-item **"Open by default"** went with the widget toggle it existed to override — a per-item override of a setting nobody can set is a control answering a question that cannot be asked. Every removed value stays in `defaults` and is still read by the renderer, so the card is unchanged: flat, dividers on, chevron right, rotating.
- **(3) Behaviour** now matches the Accordion exactly: nothing open on arrival, one answer at a time. `openByDefault` is still honoured on an item that already carries it, so a question somebody deliberately opened on an existing page does not close itself because the control moved.
- **(2)** `inlineCoversAll` used to mean "the inline editor happens to cover every field"; it now means "the row HAS an inline editor". The arrow opened the item's own drawer, which replaced the panel you were working in — the same swap the Add-item fix removed, reached by a different button. What the inline editor does not cover is reachable another way: the "+ Add link" CTA at its foot, and the item's own text nodes by clicking them on the canvas. ⚠️ A collection with **no** inline editor keeps its arrow — it is the only way into those items.
- **⚠️ Follow-on the arrow's removal forced:** the inline editor hard-coded its two labels as "Title" and "Description". That was tolerable while the chevron could open a drawer that named the fields properly; with the chevron gone this editor is the ONLY way into an item, so a FAQ would have had no surface anywhere using its own words. The labels and the hide-tooltip now come from the collection's own fields.
- **Verified:** FAQ panel = CONTENT (Title, Questions, Add question) → DESIGN (Style, Spacing). Item rows show Move up · Move down · Duplicate · Delete — **no arrow**; the Accordion's show the same plus its hide toggle. On the canvas the new FAQ arrives with **nothing open**; opening Q1 shows only Q1; opening Q2 closes Q1. The FAQ's inline editor is labelled **Question / Answer**, the Accordion's **Title or question / Description**.
- **⚠️ Flagged:** FAQ and Accordion are now the same widget with different seed copy. You chose to keep both for now — worth revisiting, since an earlier pass split them apart precisely because one widget with two palette names was confusing.

## 31. Action Cards — one addable card, the external link
- **Status:** done
- **Where:** `portalStructureSpecs.ts` (the Quick Actions section panel), `portalPageModel.ts` (`LOCKED_ROWS`), `portalWidgetSpec.ts`
- **You asked:** the action-cards row is predefined, but ONE thing can join it — an **external link** card. Selecting the parent section offers a card in the sidebar; it takes a **URL** field and opens that link when clicked. That card alone may have its **title, subtext and icon** edited from the sidebar. The other four may not be edited from the sidebar OR inline.
- **⚠️ This resolves the flag I raised against task 3.** Task 3 was "nobody can add any extra widget or element into the action cards' parent section", which is why `LOCKED_ROWS` exists. This does not reopen that: the row still refuses everything from the palette — it gains ONE card, offered from the section's own panel, which is a different door with a fixed destination.
- **How I check it:** selecting the Quick Actions section shows the add-external-link card; adding one widens the row and the new card takes a URL, title, subtext and icon; the other four have no title editor in the panel and no inline title on the canvas.
- **Settled first:** **one** card per row (the CTA then disables with the reason on it), and its destination is **fixed** — a URL field, no dropdown. A dropdown would have spent four of its five options duplicating cards the row already carries.
- **⚠️ This does not reopen `LOCKED_ROWS`.** The row still refuses everything the palette can offer, by drag and by click. It gains ONE card, from its own panel, with a fixed destination — a locked row and a row with one door are different things.
- **What I built:** an `act_link` spec from the SAME factory as the four fixed cards, so its Style, Alignment and Spacing are theirs — a lookalike would drift the first time either changed. It differs in exactly one way: the destination is fixed, so its ACTION section is a URL and an Open-in-a-new-tab. Adding appends a REAL fifth card to `content.quick`, not a placed element standing in for one — that is the only way it comes out identical to the four beside it — and widens the row to five, because a fifth card in a four-column row wraps to a full-width row of its own, which is a different block that happens to look like a card.
- **The four fixed cards lose Title from the panel.** They are the product's destinations, and renaming "New Incident" is how a card ends up describing something it does not do — the same reason its title is not inline-editable either. ⚠️ **Subtitle and Icon stay on all five**: you asked only for the TITLE to be locked, and the subtitle being editable was a deliberate earlier decision.
- **⚠️ A card that is not a NODE still renders.** `Sel` falls back to a plain div, so the first attempt put a perfectly visible card on the page that could not be selected, could not be named in the breadcrumb and opened a blank panel — "I added a card and nothing happened", with the card sitting there in plain sight. `quick-link` is declared in `PORTAL_NODES` for the same reason `quick-ad` is, even though the page does not ship with one.
- **Verified:** the section panel shows the CTA only on Quick Actions (the work and records rows show no Content section at all). Adding gives five cards at 193px each, the new one carrying a link glyph. Its panel is CONTENT (Title · Subtitle · Icon · Card templates) → ACTION (URL · Open in a new tab) → DESIGN (Style · Spacing). New Incident's panel is CONTENT (**Subtitle · Icon** · Card templates) — no Title. The CTA then reads "Added", disabled, titled "This row already has its external-link card". No `-title` node exists on any of the five, so no title is inline-editable.



## 32. Button — trim the Action and Design sections
- **Status:** done
- **Where:** `portalPanelSpecs.ts` / the Button spec
- **You asked:** remove **Share this page** from the Action section's destination dropdown; remove the **Button text** tab from the Design section's Button group; remove **Size of button** from Button style.
- **How I check it:** the destination dropdown has no Share-this-page option; Design ▸ Button has no Button-text tab and no size control.
- **What went with each removal.** "Share this page" took the **Share via** chips with it — the spec's own note two lines above already states the rule: a dependent field whose parent option no longer exists is a control nothing can ever reveal, so it survives looking like a feature and behaves like a bug. The **Button text** tab took all nine fields only it could show (font, weight, size, colour, format, alignment and the two hover rows) and the `designTab` segmented that switched them — with nothing writing that key, every `(c.designTab ?? 'style') === 'style'` gate was a condition that could only be true, so the gates went too, along with the stored default. **Size** went because a button already has Full width and Corner radius and takes its type scale from the theme; three ways to change how big a button is was two too many.
- ⚠️ Every removed key stays in `defaults` and is still read by the renderer, so every button on every page looks exactly as it did — except `designTab`, which is gone entirely, because a stored value for a control that does not exist is a fact about nothing.
- **Verified:** ACTION ▸ Opens = External link · Download a file · Compose an email. DESIGN ▸ Button = Full width · Corner radius · Fill colour, then Alignment and Spacing.



## 33. Remove the Knowledge tag from the search bar
- **Status:** done
- **Where:** `SupportPortalPreview.tsx` (the hero search), `portalStructureSpecs.ts` (`SEARCH_SPEC`)
- **You asked:** drop the "Knowledge" scope pill from inside the banner's search field.
- **How I check it:** the banner search shows the placeholder and the magnifier only.
- **What it was:** the pill sat INSIDE the field, so the search bar came with a grey chip permanently occupying the space just before its own icon — a label for a setting, on the one control a requester is meant to type into without reading anything.
- ⚠️ **The scope itself is untouched.** It still decides which results come back and is still set in the panel; what went is the badge announcing it on the page.
- **Verified:** the banner reads "Welcome to Support Portal / Search our support center knowledge base / How can we help you?" — no Knowledge pill.



## 34. Remove the Settings item from the builder's right rail
- **Status:** done
- **Where:** `SupportPortalBuilder.tsx` (the rail)
- **You asked:** remove the Settings menu from the right-hand menubar.
- **How I check it:** the rail reads Widgets · Theme · Branding.
- ⚠️ It used to sit below Branding on the reasoning that what a requester may DO on this portal is a property of this portal — the same kind of statement as its theme and its logo. What that missed is that the rail is where you go while you are **arranging a page**, and a nine-accordion permissions screen is not something you reach for mid-layout. The panel, its `PANEL_COPY` entry and the `RailKey` union all stay, so bringing it back is one line.
- **Verified:** the rail reads Widgets · Theme · Branding.



## 35. The two-step create flow, made intuitive
- **Status:** done
- **Where:** `CreateSupportPortalModal.tsx`, `SupportPortalTemplateGallery.tsx`
- **You asked:** step 1's details survive going forward to step 2. Step 2 drops the two clickable cards ("Create from scratch" / "Use template"); instead **Create from scratch is shown by default at the top**, the default template is removed from there, and it becomes the **first square in the templates grid, carrying the Default tag**. You attached a reference for the stepper UI and said to ask if anything.
- **Settled first (25 Aug):** from-scratch is an **immediate action**, like a template tile — no selected state, no Create button, so every starting point on the screen is one click. A second Save **updates the draft** rather than creating another portal, and the button relabels. The Default is the grid's **first tile in every category**. The stepper takes your reference's SHAPE with the product's blue.
- **(1) One screen, not a fork.** Step 2 used to open on two big cards — "Create from scratch" and "Use Template" — which asked you to choose a KIND of start before you could see any of the starts. From-scratch is one row and the templates are six tiles: they fit together, so the question was costing a click to answer something the screen could simply show. The "start from a blank page instead" footer link went with the fork it existed to escape — a second door to a room you are now standing in.
- **(2) The Default is the first tile**, badged, instead of a "Start from your portal" band above the grid. The band existed because a tile eighth in a row of eight cannot say "this is what your requesters see today"; the badge says it, and being pinned first means the one starting point that always applies is always in the same place. ⚠️ It ignores the category chips, because it HAS no category — it is not an IT or an HR layout, it is the portal that already exists.
- **(3) ⚠️ Saving twice used to create TWO portals.** Step 1 stays reachable from step 2 — the details are editable until you leave — and `saveDetails` called `create` every time. Going back to fix a typo and pressing Save left one portal carrying the typo and one carrying the correction, with nothing on screen saying a second had appeared. The first Save creates the draft; every later one edits it, and the button reads **Save changes** so it never says one thing and does another.
- **(4) The stepper is a grey band with a chevron**, not two blue dots on a rule. The rule read as a progress bar that was always half full — it said the same thing on both steps — while two identically-blue circles gave no way to tell where you WERE from where you had BEEN. Now the finished step is greyed with a tick, the current one is dark with its number, and the chevron points the way. ⚠️ The tick is **#3D8BD0, not the reference's green**: green is this product's healthy/success colour and a completed step is neither — it is simply behind you.
- **Verified:** step 1 → Save → step 2 shows "✓ Support portal details › ② Support portal customization", a **Start from scratch** row, then TEMPLATES with **Support Portal / Default** as the first tile. Going back to step 1 kept "HR Portal / support.acme.com/hr / Acme Corporation", the button read **Save changes**, the toast was "Details updated", and the listing behind still held **one** HR Portal row. Under the **HR** chip the tiles are "Support Portal" then "People & HR Desk" — the Default still first.



## 36. Video widget
- **Status:** done
- **Where:** `supportPortalData.ts` (the palette), a new spec + renderer
- **You asked:** a **Video** widget in the Visual group. Design keeps **Spacing and Style** only. Content is an empty container offering **Select video** or **Upload a link**; once one is set it offers **Replace video**.
- **How I check it:** the Visual group lists Video; a placed one is empty with the two choices; after setting one it shows the video and a Replace CTA.
- **What I built:** a `video` spec whose Content is ONE control and whose Design is Style + Spacing. ⚠️ **`VideoSource` is one control, not an upload field beside a URL field** — a video comes from a file or from a link and never from both, so two always-visible inputs would ask a question with a wrong answer permanently on screen and leave the widget to decide which wins when both are filled. Empty it offers **Select video** and **Upload link**; filled it shows what is there and offers **Replace video**, which is the only thing you do to a video already in place.
- **⚠️ A pasted watch URL becomes an EMBED URL.** Rendering `youtube.com/watch?v=…` directly puts the whole site in the frame — chrome, sidebar, cookie banner — which is not what anybody who pasted a video link is asking for. YouTube and Vimeo are converted; everything else is treated as a direct file, which is what a .mp4 on a CDN needs.
- **⚠️ The frame is INERT on the canvas.** An iframe eats every event that reaches it, and a click on this element has to mean "select it" — so while the builder is live the frame is covered by a shield. In Preview and on the real portal it is a real player.
- **⚠️ The empty state is a SIGN, not a dropzone.** A video has two routes in and neither is a drag onto the canvas, so unlike the image slot it must not look like a target it cannot honour.
- **Left out deliberately:** ratio, autoplay, loop, mute and a poster frame. A support portal plays a video when somebody presses play, at the size the column gives it.
- **Verified:** Visual lists Video. Placed empty it reads "Choose a video in the panel"; the panel reads Video → No video yet → Select video · Upload link → "MP4, WebM or MOV · max 50MB, or a YouTube or Vimeo link". Pasting `youtube.com/watch?v=dQw4w9WgXcQ` produced an iframe at `youtube.com/embed/dQw4w9WgXcQ`, 1027×578 (16:9), with the panel showing Video link → the URL → **Replace video**. Clicking the frame still selects the widget.



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
