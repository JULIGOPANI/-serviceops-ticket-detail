# Support Portal — new entry point and Settings tab

Agreed 20 Aug 2026. Not yet built. This is the whole brief; nothing here needs re-deciding.

---

## 1. Where it lives

**Support Channels → Support Portal** becomes the single destination, and it grows two horizontal
tabs. The Organization → *Support Portal Customization* card is retired.

```
Support Channels
  Emails
  Support Portal        ← Customization | Settings
  Chat
  Virtual Agent
```

⚠️ One destination called Support Portal with two things you can do there — not two nav rows both
about the support portal, and not a second card left behind under Organization that opens the same
builder by a different route.

**Files:** `adminData.ts` line ~103 (remove the Organization card), line ~142 (the Support Channels
entry stays and becomes the host); `AdminPage.tsx` `CARD_MODULES` — the `"Organization/Support Portal
Customization"` key moves to the Support Channels card.

---

## 2. Tab 1 — Customization

**Unchanged.** The existing `AdminSupportPortalModule` listing, verbatim: empty state → CTA → the
`SPP-#` table, and clicking a row's id opens `SupportPortalBuilder` exactly as it does today. Same
UI, same behaviour. It is being *moved*, not rebuilt.

---

## 3. Tab 2 — Settings (NEW page)

Built from the live product screen (`screencapture-…support-portal…pdf`). Nine sections, each an
**accordion**. **`Request` is expanded on arrival; the other eight start collapsed.**

| # | Accordion | Rows |
|---|---|---|
| 1 | **Request** | 9 toggles, then two conditional blocks — see below |
| 2 | Service Catalog | 3 toggles |
| 3 | Change | 1 toggle |
| 4 | Asset | 5 toggles |
| 5 | CMDB | 4 toggles |
| 6 | Knowledge | 2 toggles |
| 7 | Approval | 2 toggles |
| 8 | Digital Signature | 1 toggle (**off** by default — the only one that ships off) |
| 9 | User | 1 toggle + Registration Type |

### Request, in order
Allow Requester to create Incident · Allow Guest Requester to Report a Request · …Create Incident On
Behalf Of Other Requester · …View Request Due By · …Access Solution · …Close Request · …Submit
Feedback · Mandate comment to Reopen Request · Allow Requester to Reopen **Resolved** Request

→ **Grace Period** (radio: Unlimited | Days) → **Number of Days** (text, `5`)

Allow Requester to Reopen **Closed** Request
→ **Grace Period** (radio: Unlimited | Days) — defaults to *Unlimited*

Allow Requester to access Audit Trail
→ **Requester Ticket Visibility** — multi-select chips, seeded `Group Requests` + 1, with an ⓘ

### User
Allow Self Registration → **Registration Type** (radio: Allow everyone | Set of Domains)

### Chrome
Page head (title + one-line subtitle + `View Docs ↗`) · a `w-[280px]` **Search** that filters rows
across every section · **Update** / **Cancel** on the right.

⚠️ Search must match a ROW, not just a section title — the live screen's search sits above nine
collapsed sections, and a search that only matched headings would look broken the first time
somebody typed a setting name.

---

## 4. Components — reuse, do not invent

The instruction was explicit: use the ServiceOps detail-page components. Before writing any control,
find the existing one.

- **Toggle** — the same switch the detail pages use (`ToggleRow` / the Notifications and Compliance
  toggles in `TicketPropertiesPanel`, the green pill in the Audit-Trail download popup).
- **Accordion** — `TicketFieldsAccordion` / `AdditionalFieldsAccordion` are the reference for header
  + chevron + collapse.
- **Radio rows, text input, multi-select chips** — the chip input already exists in `SendEmailModal`
  and the Contract Expiry Reminder; the `app-select` class covers native selects.
- **Page shell** — the admin listing standard in `CLAUDE.md`: `bg-white`, `px-4`, page head, no card
  around the content.

⚠️ A new bespoke toggle here would be the tenth switch style in this product. If nothing fits, say
so rather than inventing one.

---

## 5. Open

Nothing. Both flow questions were answered 20 Aug 2026:
- the existing Support Channels → Support Portal item **becomes** the two-tab page;
- **Request** is the expanded accordion.
