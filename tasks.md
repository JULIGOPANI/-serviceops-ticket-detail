# Support Portal — open tasks

Live at **https://zenichakalasiya.github.io/serviceops-ticket-detail/tasks/**

From [zeni_tasks.md](zeni_tasks.md) — the PMG items that were implemented and then removed. This
file is the source of truth; `npm run build` regenerates the live page from it, so the two can never
disagree. One task at a time: build, verify in the browser, tick it here, publish.

An earlier run of six shipped on 24 Aug 2026 — rail hide icon · banner image controls · collapsed
Design accordions · Action Card page destination · KPI feedback count · Section Name field.

Updated: 2026-08-24 21:15

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
- **Status:** todo
- **Where:** `SupportPortalPreview.tsx` (the list's `Sel`) + its panel spec
- **You asked:** no option to select the open-requests list inside the card; remove that selection and its sidebar configuration (Statuses / Scope / Show).
- **How I check it:** click the rows inside My Open Requests — selection lands on the widget, never on a separate Request List layer, and no Statuses/Scope/Show panel exists.

## 13. Action cards cannot be placed on their own
- **Status:** todo
- **Where:** `SupportPortalAddPanel.tsx`, `SupportPortalBuilder.tsx`, `PortalCanvas.tsx`
- **You asked:** an action card belongs only inside the Quick Actions parent section, never as a standalone block. So no duplicate on its floating toolbar, and no way to add one from the widget sidebar.
- **How I check it:** the Actions rows are gone from the library, and an action card's toolbar has no duplicate. ⚠️ The toolbar is shared, so duplicate has to be disabled for this kind rather than removed from the bar — I check it still works everywhere else.

## 14. Action cards — remove the ACTION section from the panel
- **Status:** done
- **Where:** `portalWidgetSpec.ts` → the four fixed action-card specs
- **You asked:** remove the Action section from all four cards' sidebars — New Incident, Request Service, AD Self Service, Knowledge.
- **How I check it:** select each of the four — the panel goes Content → Design with no Action section, so On-click-go-to and Most used services are both gone. Their destinations come from the card's own identity.
- **You settled it:** the destination is backend-side — a specific action card redirects to a specific page, decided there, not by the admin. So the control was offering an authority this screen does not have. The custom Action Card keeps its Action section, because that one exists to point anywhere.
- **Verified:** All four cards read CONTENT → DESIGN with no ACTION section: no On-click-go-to, no Most used services. Checked New Incident, Request Service, AD Self Service and Knowledge individually.

## Parked — needs discussion
- Tour guide
- AI capabilities
- Video / GIF as a widget
- "Set as default" from templates
- Two-stepper for portal details / portal customization
