# Support Portal — open tasks

Live at **https://zenichakalasiya.github.io/serviceops-ticket-detail/tasks/**

From [zeni_tasks.md](zeni_tasks.md), numbered to match that file. This one is the source of truth;
`npm run build` regenerates the live page from it. One task at a time: build, verify in the browser,
tick it here, publish.

Shipped already — **1–14** (Quick Actions card templates · Custom Action Card hidden · Quick Actions
locked · six live-data panels · Contact Us · count badge · inner request list · standalone action
cards · action-card ACTION section), and an earlier six on 24 Aug.

Updated: 2026-08-25 09:25

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
- **Status:** todo
- **Where:** `SupportPortalPreview.tsx`, `supportPortalData.ts`, `portalWidgetSpec.ts`
- **You asked:** two sections of up to four cards, styled like the action cards rather than the old list. ⚠️ You chose **restyle the existing Most Used Services and add Favourite Services** — so the page carries each name once, not twice.
- **How I check it:** both sections render four cards with icon-on-top, name and category (Employee Off-boarding / HR, Microsoft Office 2019 / Software, Payroll Setup / Finance, Flight Booking / Travel), and they match the action cards' shape.

## 23. Row-wise placement, and splitting a row into columns
- **Status:** todo
- **Where:** `portalPageModel.ts` (the section model), `SupportPortalPreview.tsx`, `SupportPortalBuilder.tsx`
- **You asked:** in an added section every element lands as its own row, left-aligned, whatever it is. A row can then be split into columns, and a column holds a vertical STACK of elements — so "image left, title + description right" is made by dropping both text elements into the right column. Columns in a row share height; deleting one reflows the rest left.
- **How I check it:** ⚠️ This changes the section model — today a column holds exactly ONE element. I will come back to you before writing it with the specific questions it raises (the gap control, the split affordance, and whether the Divider comes back, which you asked me to raise when I reach this).

## 24. Table — rebuild it the way Word does
- **Status:** todo
- **Where:** `portalCollectionSpecs.ts`, a new table renderer
- **You asked:** drop the whole current table configuration. Insert by choosing rows × columns from a 10×10 grid; edit cells inline with a floating toolbar; drag rows and columns; insert and delete row / column / table / cell. Keep only Title in Content and Spacing in Style.
- **How I check it:** ⚠️ Your line 24 ends mid-sentence ("other given instructions like table row column selecting will"). I will ask what was cut off, plus the specific interaction questions, before building.

## Parked — needs discussion
- Tour guide
- AI capabilities
- Video / GIF as a widget
- "Set as default" from templates
- Two-stepper for portal details / portal customization
- List widget (task 23 — to be written up for later)
- Media slider, Advanced tabs, Text with image, Spacer (task 23 — later)

## 25. Bring the predefined widgets back to the library, disabled with an "Added" mark
- **Status:** todo
- **Where:** `supportPortalData.ts`, `SupportPortalAddPanel.tsx`
- **You asked:** removing the action cards from the sidebar was not right — bring them back. Every predefined card, in Live data and in Actions, shows a disabled state with an added icon on the right. Nothing is removed from the widget sidebar.
- **How I check it:** the library lists every widget again; the ones already on the page render disabled with the mark; the rest stay addable. ⚠️ This reverses **task 2** (Custom Action Card hidden) and **task 13**'s library half — I will restore those and keep 13's other half (no duplicate on the toolbar) unless you say otherwise. ⚠️ It also reverses an earlier decision that nothing greys out; that is fine, it is your call, but the Divider and the other hidden elements are a separate question I will ask before touching.

## 26. Contact Us — the card is still editable and still shows Hours
- **Status:** todo
- **Where:** `SupportPortalPreview.tsx` (the Contact Us renderer)
- **You asked:** Contact Us still has inline-editable fields on the canvas and the Hours line is still on the card. The empty section was also not removed from the sidebar.
- **How I check it:** clicking any Contact Us line selects the widget rather than an editable text node; the card shows Email and Phone only. ⚠️ Task 10 removed the hours CONTROL but left the rendered line — I read "remove the Show-hours section" as panel-only. This says the line itself goes from the card.
