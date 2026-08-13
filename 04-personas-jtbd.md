# 04 · Personas, JTBD & Search-Intent Model

**Phase:** 4 of 10 · **Status:** Complete — **proto-personas, unvalidated (§1)** · **Date:** 5 August 2026
**Input:** [`01`](01-research-synthesis.md) §5 · [`03`](03-current-state-audit.md) §7, §10 · `domain-itsm-serviceops`
**Feeds:** `05` (journeys) · `06` (object taxonomy, permission matrix, ranking personalisation) · `07` (entry points, states) · `08` (row metadata) · `10` (test recruitment)

> **Purpose.** Establish *who* searches, *what fragments they actually type*, *what they may see*, and *which of
> them V1 optimises for* — with enough specificity that `06` can write ranking rules and `08` can write row
> anatomy without guessing.

---

## 1 · Status: these are proto-personas

**Nobody has interviewed a ServiceOps user for this project.** These are constructed from the research brief's
role sketches, the `domain-itsm-serviceops` reference, and general ITSM practice. They are **hypotheses in
persona form** — useful for aligning a team and structuring a spec, and not evidence of anything.

Handled honestly, that is a normal and defensible position. Handled dishonestly — by presenting them as
research findings — it is the fastest way to lose a design review. So:

| | |
|---|---|
| **What these are for** | Structuring `06`'s object taxonomy and permission matrix; giving `08` a concrete row-design target; recruiting the right people for `10`'s testing |
| **What they must not be used for** | Justifying a scope decision on their own; any claim beginning "our users…" |
| **How they get validated** | `01` §8.3 interview guide (5–7 technicians) · `03` §6.4 baseline study · `10` usability testing |
| **What would change them** | §11 states, per persona, the specific finding that would invalidate it |

**Notation:** every persona carries a `Confidence` rating and an explicit `Would be wrong if…` line. Pronouns
are they/them throughout — these are constructs, and nothing about them implies a gender.

### 1.1 · One persona the research brief missed

The brief lists five roles. The `domain-itsm-serviceops` reference lists six — it adds the **Approver**:
*"Rare, interrupt-driven. Decides in under a minute, often on mobile. Fails when given the record instead of the
decision."*

That is a genuinely distinct search persona with a distinct need, and it is added here as **P6**. It matters
disproportionately because it is the **only persona with a mobile-first assumption**, which makes it the
strongest argument in this document for `07`'s responsive work.

---

## 2 · The six personas

### P1 · Aarav — L1 Service Desk Technician **← V1 PRIMARY**

> *"I've got someone on the phone reading me a number. I need to be looking at that ticket before they finish
> saying it."*

| | |
|---|---|
| **Context** | Front line. Phone, email, chat, walk-ups. Works a queue under SLA pressure, all day, every day |
| **Frequency of search** | **Continuous** — the highest-volume searcher in the product by a wide margin |
| **Expertise** | High in the product, high in the process, moderate in the underlying technology |
| **Device** | Desktop, often dual-monitor. Rarely mobile |
| **Permission scope** | Assigned team's tickets; most assets; internal + public KB; user directory *(unverified — Q17/18)* |
| **Optimises for** | **Speed and keyboard flow.** Minimum time from fragment to record |
| **Fails when** | Forced into mouse-heavy navigation; context lost between screens; a search returns nothing and they can't tell whether the record is missing or they're in the wrong module |
| **Confidence** | **High** — the best-evidenced persona; consistent across the brief, the domain reference, and the competitive field |
| **Would be wrong if…** | Search-log analysis shows lookups are **infrequent** rather than continuous. This is **A-01**, the highest-impact risk in the project |

**Top search jobs**
1. Open a ticket from an ID read aloud, pasted from chat, or forwarded by email
2. Find a requester by partial name, email, or phone extension
3. Find the asset assigned to a person, or the person assigned to an asset
4. Find the KB article that resolves a recurring issue
5. Check whether a similar ticket already exists before creating a duplicate

**What they do today** *(modelled — `03` §6.3)* — resolve the module, scan 15 unlabelled icons, click, wait,
locate that module's search input, type, submit, click the result. **≈4 clicks, 2 page loads, 2 recall
decisions** before the record opens. When the module guess is wrong, the result is an empty list identical to
"no such record."

**Failure workarounds — the invisible ones**
- **Asks a colleague.** The dominant silent failure (`01` A-01). Invisible to every dashboard
- Keeps 6–10 browser tabs open as a manual "recents" substitute — **and `03` §7.1 confirms no recents feature exists to replace this**
- Bookmarks frequently-used module list views
- Re-opens their own email to find the ID again rather than searching for it
- **May be typing lookups into Ask AI as questions** (`03` §7.3 R-2) — paying LLM latency for a keyword job

**What they need from the UI**
Instant results. Exact-ID match at position 1, always. Enough metadata per row to recognise the right record
without opening it. A keyboard path from anywhere to anything. Recents on open, because they re-open the same
records repeatedly.

---

### P2 · Meera — L2/L3 Specialist **← V1 SECONDARY**

> *"I've seen this error before. I just can't remember which ticket it was on, or whether we ever fixed it
> properly."*

| | |
|---|---|
| **Context** | Escalation target. Infrastructure, applications, or network specialism. Fewer tickets, each harder and longer-lived |
| **Frequency of search** | **Moderate but high-value.** Fewer queries; each one is worth more |
| **Expertise** | Deep technical; moderate in the ITSM product itself — they live in tickets, not in modules |
| **Device** | Desktop, often alongside terminals and monitoring tools |
| **Permission scope** | Broad across tickets, problems, changes, CIs; may exceed L1's scope *(unverified)* |
| **Optimises for** | **Correlation.** Connecting this incident to prior ones, to a problem, to a change, to a CI |
| **Fails when** | Search only matches titles and misses the error string buried in a work note; no way to traverse from a person to their asset to their history |
| **Confidence** | **Medium-High** — the correlation need is well-attested; the frequency estimate is soft |
| **Would be wrong if…** | They rely primarily on monitoring/APM tools and treat ServiceOps as a system of record they rarely query |

**Top search jobs**
1. Find prior incidents containing a specific error string or code
2. Trace a CI or hostname to its open tickets, changes, and problem records
3. Find the change that preceded a current incident *(the highest-value correlation in ITSM)*
4. Find a runbook or KB article by remembered fragment, not exact title
5. Find who worked a similar ticket before, to ask them

**Search-specific need that shapes `06`** — **P2 is the persona that makes indexed-field depth matter.** Their
fragments live in **work notes, resolution text, and attachments**, not titles. If `06` indexes titles only,
P2's primary job fails silently. `03` §9 Q2 is the question that decides this, and it is open.

**Failure workarounds** — greps their own notes; asks in a team chat channel; re-solves a problem already
solved. **Every one of these is invisible to product analytics.**

**What they need** — deep-field indexing, exact-phrase matching for error strings, cross-object traversal, and
eventually "similar tickets" *(V3 semantic)*.

---

### P3 · Rajesh — Service Desk Manager **← BENEFICIARY**

> *"I don't need to find one ticket. I need to find the six that are about to breach."*

| | |
|---|---|
| **Context** | Owns queue health, SLA performance, workload balance, and reporting upward |
| **Frequency of search** | **Low as lookup, higher as filtered query** — often the *list*, not the record |
| **Expertise** | High in process, medium-high in product |
| **Device** | Desktop; dashboards on a second screen |
| **Permission scope** | Full visibility across their team, likely their department; reports and dashboards |
| **Optimises for** | **Comparability.** Data that can be lined up against other data |
| **Fails when** | Data is present but not comparable *(domain reference)*; a saved query can't be re-run |
| **Confidence** | **Medium** — the role is clear; whether they use *search* rather than *reports and filters* is genuinely uncertain |
| **Would be wrong if…** | Managers never search at all and live entirely in dashboards and reports — **plausible, and it would move P3 out of V1 scope entirely** |

**Top search jobs** — find a technician's current workload · find tickets near SLA breach · find a specific
report or dashboard by name · find a ticket a stakeholder just asked about by requester name · re-run last
week's question.

> **The honest read on P3:** most of what they want is **filtering, not searching**. `03` T4 ("find all P1
> incidents assigned to you") exists specifically to test whether users can tell the two apart — and whether
> global search should even try to serve this. **Provisional position for `06`:** V1 serves P3 only for
> *navigational* jobs (find a report, find a person's ticket). Saved searches and filtered queries are **V2**.
> Trying to make global search a query builder in V1 is how it becomes slow and confusing for P1.

---

### P4 · Divya — Requester / End User **← SAFETY-CRITICAL, NOT PRIMARY**

> *"I just want to know if anyone's actually looking at my laptop request."*

| | |
|---|---|
| **Context** | Marketing coordinator. Uses ServiceOps a handful of times a year, under mild frustration |
| **Frequency of search** | **Rare** |
| **Expertise** | **None, and none should be assumed.** Does not know what "incident" vs "service request" means, and should not have to |
| **Device** | Desktop and **mobile**, roughly evenly |
| **Permission scope** | **Their own tickets and public KB only. Nothing else, ever** |
| **Optimises for** | **Escape.** Getting help without learning the system *(domain reference)* |
| **Fails when** | Asked to classify their own problem; shown ITSM vocabulary; given results they can't open |
| **Confidence** | **Medium** — the role is universal; whether the portal is even in V1 scope is **unresolved (`03` Q20)** |
| **Would be wrong if…** | The requester portal is a separate application, in which case P4 leaves V1 scope — **but their permission rules stay mandatory** |

**Top search jobs** — check the status of their own request · find how to request something · find an
answer so they don't have to raise a ticket at all · find who to contact.

**Query fragments** — plain-English problem descriptions (*"laptop won't turn on"*, *"need vpn access"*), their
own ticket number copied from an email, and service names in **their** vocabulary, not IT's.

> ### ⚠️ P4 is the persona that makes the permission model non-negotiable
>
> **Even if P4 never sees V1**, their rules must be built into the retrieval layer from day one. Three
> requirements, carried into `06` as hard constraints:
>
> 1. A requester must **never see** another person's ticket
> 2. A requester must **never infer the existence** of one — not via result counts, autocomplete, "did you
>    mean," or error copy
> 3. Internal-only KB must be invisible, not merely unopenable
>
> `02` §9.2 X-1 recorded Zendesk's own admission that ticket restrictions *"do not affect the visibility of
> other search results, such as users or organizations."* That is a documented leak in a mature product. Ours
> must be complete, not partial.
>
> **And it is already live:** `03` §7.3 R-1 established that Ask AI answers over tenant data **today**. Whether
> it is permission-trimmed is `03` Q10c — **a production security question independent of this project.**

---

### P5 · Sanjay — Administrator **← DEFERRED**

> *"I know there's a setting for this. I've configured it before. I just can't remember which of forty screens
> it's on."*

| | |
|---|---|
| **Context** | Configures workflows, SLAs, catalogue, forms, roles, notifications. Rare sessions, high stakes |
| **Frequency of search** | **Low, but painful** — admin IA is typically the deepest and least memorable in the product |
| **Expertise** | High, but **intermittent** — expertise decays between sessions |
| **Device** | Desktop |
| **Permission scope** | **Everything.** Which makes them the wrong persona to validate permission trimming against |
| **Optimises for** | **Confidence that a change is safe and reversible** *(domain reference)* |
| **Fails when** | No preview, no impact scope, no undo |
| **Confidence** | **Medium** |
| **Would be wrong if…** | Admin configuration lives in a genuinely separate surface with its own navigation |

**Why V1 defers them.** Their objects are *settings*, not records — a different index, a different taxonomy,
and a different result-row design. Adding them widens V1's federation scope against the `01` §3.6 latency
budget, for the lowest-frequency persona in the set. **Admin objects are V2 (`06`).**

> **Do not let admins test the permission model.** They see everything, so every trimming bug passes. `10`
> must test with real P1 and P4 accounts.

---

### P6 · Kavita — Approver **← WATCH ITEM · the mobile case**

> *"I got a notification. I've got about forty seconds between meetings. Just tell me what I'm approving and
> whether it's risky."*

> **New in this document.** Absent from the research brief's persona list; present in the domain reference.

| | |
|---|---|
| **Context** | Department head or budget holder. Approves changes, purchases, access requests, high-value catalogue items |
| **Frequency of search** | **Very low** — usually arrives by deep link from a notification |
| **Expertise** | Low in the product; high in their own domain |
| **Device** | **Mobile-first, interrupt-driven.** The only persona here with that profile |
| **Permission scope** | Items awaiting their approval; possibly their department's records |
| **Optimises for** | **Deciding in under a minute** *(domain reference)* |
| **Fails when** | *"Given the record instead of the decision"* — handed a 50-field form when they needed three facts |
| **Confidence** | **Low-Medium** — inherited from the domain reference, not observed |
| **Would be wrong if…** | Approvals happen entirely via email/Teams and approvers never open ServiceOps |

**Why they matter to a search project despite barely searching:**

1. **They are the mobile case.** Everyone else is desktop. If `07` designs responsive behaviour for anyone, it
   is P6 — and `03` Q24 (are there other viewports?) is still open.
2. **Their pending queue is a zero-state candidate.** For P6, the most useful thing an empty search could show
   is *"3 items awaiting your approval"* — a compelling argument that the zero-state should be
   **role-aware**, not one fixed list (`07`).
3. **They are the strongest test of row scent.** If a row carries enough to decide *without opening the
   record*, `08`'s row design is genuinely good. P6 is the pass/fail case for `02` §4.1.

---

---

### 🆕 P7 · Arjun — Security / Vulnerability Analyst **← NEW, added 6 Aug 2026**
### 🆕 P8 · Neha — Endpoint / Patch Administrator **← NEW, added 6 Aug 2026**

> **Why these appeared.** The confirmed module list (`03` Q13b) revealed **Vulnerabilities, Patch, Package and
> Deployments** — an entire unified-endpoint-management domain. Every persona above was built on an ITSM-only
> assumption. These two are the people who live in those four modules, and no prior document accounted for them.

| | **P7 · Security / Vulnerability Analyst** | **P8 · Endpoint / Patch Administrator** |
|---|---|---|
| **Context** | Triages CVEs against the estate; drives remediation; reports exposure | Builds packages, schedules deployments, chases patch compliance |
| **Frequency** | Moderate — bursty around disclosure events | Moderate — cyclical around patch Tuesday and deployment windows |
| **Optimises for** | *"Which of our machines are exposed, and is it fixed yet?"* | *"Did this actually land on every device?"* |
| **Fails when** | Vulnerability → affected assets → remediation status requires three modules | A deployment failed on 12 of 400 devices and finding those 12 means leaving the module |
| **Key query fragments** | `CVE-2026-1234` · severity terms · hostname · vendor patch ID | `KB5034441` · package name + version · deployment/job name · device-group name |
| **Confidence** | **Low** — inferred entirely from the module list. No research, no interviews | **Low** — same |
| **Would be wrong if…** | Security is a separate team on a separate tool and ServiceOps is only their ticketing endpoint | Patching is fully automated and nobody searches it interactively |

**What they add that no other persona does — and it is the strongest argument for cross-object federation in
the whole document:**

> P7's core job is **inherently cross-module**: *CVE → affected assets → open remediation requests → patch
> availability → deployment status.* That is **five modules for one question.** Under today's module-scoped
> search it is five separate searches with manual correlation in between. P1's pain is *one* wrong module
> guess; P7's pain is *four*.

**Why they are V2, not V1** *(`06` §2.1)* — three reasons, and none of them is "they matter less":
1. **Different result shape.** A vulnerability row is *CVE · CVSS · affected-asset count · remediation status*.
   A row spec designed for tickets does not stretch to cover it.
2. **Unmapped permission model.** Vulnerability data is often more tightly restricted than ticket data, and
   `06` §7.2 has no cells for it.
3. **The §2.0.1 "KB" collision must be solved first.** Indexing Patch before that disambiguation exists would
   actively break knowledge search for everyone else.

⚠️ **These are the least-validated personas in the document** — inferred from a list of module names, nothing
more. **Two interviews would either confirm a significant V2 opportunity or remove them.** Added to §11.

---

## 3 · Query-fragment inventory — the design-critical section

**This is what `06` and `08` actually consume.** `02` §4.1 found that **no competitor documents result-row
design**; the reason is that almost nobody documents what users *type* either. This table is the input that
makes both specifiable.

| Fragment type | Who | Example | What it demands of retrieval | Priority |
|---|---|---|---|---|
| **Full record ID** | P1, P2, P4 | `INC-01234` | Exact match, position 1, always. **Prefix is tenant-configurable (`03` C-3)** — never hardcode | **Critical** |
| **Bare number** | P1 | `1234` | ⚠️ **Users type the number, not the ID.** Must match ID *suffixes* across object types, and disambiguate when `1234` matches an incident, an asset, and a PO | **Critical** |
| **Partial / misspelt person name** | P1, P2, P3 | `priya` · `p.sharma` · `Shrama` | Prefix matching plus fuzzy matching **on person names specifically** | **Critical** |
| **Email address** | P1 | `priya.sharma@corp.com` | Must be an indexed lookup key on users; tokenizer must not split on `@` and `.` | High |
| **Asset tag** | P1 | `LAP-4471` | Same treatment as record IDs; also tenant-formatted | **Critical** |
| **Serial number** | P1 | `5CD9271XK2` | ⚠️ **Transcribed from a sticker by a human reading aloud.** The longest strings are the most typo-prone, so fuzzy tolerance must **scale with length** — the opposite of a naive fixed edit-distance threshold | High |
| **Error string / code** | P2 | `0x80070005` · `ERR_CONNECTION_REFUSED` | Exact-phrase matching; tokenizer must preserve punctuation and underscores; **must search work notes, not just titles** | **Critical for P2** |
| **Hostname / CI name** | P2 | `SRV-DB-03` | Exact + prefix; must not be split on hyphens | High |
| **IP address** | P2 | `10.0.14.22` | Exact; tokenizer must not split on dots | Medium |
| **Application / service name** | P1, P2, P4 | `outlook` · `vpn` · `sap` | Synonym expansion (`01` §9). *"VPN"* must reach *"remote access"* | High |
| **Plain-English problem** | P4 | *"laptop won't turn on"* | Stemming, stop-words, KB-weighted — and the natural **⌘Enter → Ask AI** candidate (`03` §7.3) | Medium — **V2** |
| **Technician name** | P3 | `Aarav` | Person matching + a path to their workload | Medium |
| **Setting / config name** | P5 | `business hours` · `SLA policy` | A separate admin index | Low — **V2** |
| **Report / dashboard name** | P3 | `Weekly SLA breach` | Named-object matching | Medium |
| 🆕 **CVE identifier** | P7 | `CVE-2026-1234` | Tier-0 exact. Fixed, well-known format — the easiest identifier in the set | **V2** |
| 🆕 **Vendor patch ID** | P7, P8 | `KB5034441` | 🚨 Tier-0 exact against **Patch**, *not* Knowledge — the `06` §2.0.1 collision | **V2 — blocking** |
| 🆕 **Package name + version** | P8 | `Chrome 121.0.6167.140` | Name prefix + version-aware matching; dots must not be split by the tokenizer | **V2** |
| 🆕 **Deployment / job name** | P8 | `Q3 Chrome rollout — EU` | Named-object matching, time-bounded | **V2** |

### 3.1 · The seven rules this yields for `06`

Each is a design decision, not an engineering preference, and each is carried into `06` as a numbered
requirement.

1. **Bare numbers must match ID suffixes.** Typing `1234` finds `INC-01234`. Anything less fails P1's single
   highest-frequency query shape.
2. **ID matching reads tenant configuration** (`03` C-3). A hardcoded prefix regex is a defect.
3. **Fuzzy tolerance scales with string length.** Serial numbers need more; three-letter queries need none.
4. **Person names get their own matching strategy** — prefix + fuzzy, and tolerant of transliteration.
5. **The tokenizer must not destroy identifiers.** `@`, `.`, `-`, `_`, and `0x` prefixes all carry meaning.
6. **Indexing must reach work notes and resolution text**, or P2's primary job fails silently (`03` Q2 — open).
7. **Exact-ID and exact-tag matches override text relevance entirely** — the direct counter to `02` X-4, where
   Zoho's raw term-frequency ranking would place a KB article *above* the ticket it mentions.

---

## 4 · Jobs To Be Done

| # | JTBD | Persona | Version |
|---|---|---|---|
| **J-1** | When I have a fragment of a record, I want to reach that record in one input, so I can keep the person on the phone talking instead of waiting | P1 | **V1** |
| **J-2** | When I'm looking at a result list, I want to recognise the right record without opening any of them, so I don't lose my place three times before I find it | P1, P2, P6 | **V1** |
| **J-3** | When I re-open the same records all day, I want them offered before I type, so repetition costs nothing | P1 | **V1** |
| **J-4** | When I search and find nothing, I want to know whether it doesn't exist or I asked wrongly, so I stop wasting time on the wrong hypothesis | P1, P2, P4 | **V1** |
| **J-5** | When I recognise an error I've seen before, I want to find every prior occurrence, so I don't re-solve a solved problem | P2 | **V1** *(needs deep-field indexing)* |
| **J-6** | When I'm on an incident, I want to reach the related change, CI, or problem without leaving, so I keep the thread | P2 | **V2** |
| **J-7** | When I've asked a question once, I want to ask it again next week without rebuilding it | P3 | **V2** |
| **J-8** | When I need help, I want to describe my problem in my own words and be understood, so I don't have to learn IT's vocabulary | P4 | **V2** *(⌘Enter → Ask AI)* |
| **J-9** | When I search, I want to see only what I'm allowed to see — **and no trace of what I'm not** | **All** | **V1 — non-negotiable** |
| **J-10** | When I'm approving something on my phone between meetings, I want the decision, not the record | P6 | **V2** |
| **J-11** | When I know a setting exists, I want to reach it without remembering which of forty screens holds it | P5 | **V2** |

---

## 5 · Persona × search-intent matrix

Intents per Broder (`01` §5). **●** primary need · **○** secondary · **·** rare

| | **Teleport** (navigational) | **Answer** (informational) | **Act** (transactional) |
|---|:--:|:--:|:--:|
| **P1 · L1 Technician** | **●●●** | ○ | ○ |
| **P2 · L2/L3 Specialist** | **●●** | **●** | · |
| **P3 · Manager** | ○ | ○ | **●** *(run report)* |
| **P4 · Requester** | ○ *(own tickets)* | **●●** | ○ *(raise ticket)* |
| **P5 · Admin** | **●** *(find setting)* | · | ○ |
| **P6 · Approver** | ○ | · | **●** *(approve/reject)* |
| **V1 covers** | ✅ **Fully** | ⌘Enter → Ask AI *(V2)* | ❌ **V2** |

**What the matrix settles:**

- **Teleport is the only intent V1 owns — and it is the *only* intent P1 has.** V1 is exactly aligned to the
  highest-frequency persona's only need. That is the scope argument, in one cell.
- **Answer is already owned by Ask AI** across both corpora (`03` §7.3). V1 does not compete with it; it
  reserves ⌘Enter to route to it.
- **Act is genuinely V2** — and P3 and P6, the two personas who need it most, are also the two lowest-frequency
  searchers. Deferring costs little.
- **P4's dominant intent is Answer**, which V1 doesn't serve — the honest reason P4 is *safety-critical* rather
  than *primary*. We protect them before we serve them.

---

## 6 · Persona × object permission matrix — the security-trimming brief

> ⚠️ **`Unverified` — this is a template, not a finding.** `03` Q17–Q19 are unanswered and the `01` §8.4
> permission workshop has not run. **This table is that workshop's agenda.** Do not implement from it.

**Legend:** `ALL` everything · `TEAM` their team/department · `OWN` records they created or are assigned ·
`PUB` public-only · `—` none · `?` to be determined

| Object type | P4 Requester | P6 Approver | P1 L1 Tech | P2 L2/L3 | P3 Manager | P5 Admin |
|---|---|---|---|---|---|---|
| Incidents / Tickets | `OWN` | `?` | `TEAM`? | `TEAM`+ ? | `TEAM`/`ALL`? | `ALL` |
| Service Requests | `OWN` | pending theirs | `TEAM`? | `?` | `TEAM`? | `ALL` |
| Problems | `—` | `—` | `?` | `ALL`? | `ALL`? | `ALL` |
| Changes | `—` | pending theirs | `?` | `ALL`? | `ALL`? | `ALL` |
| Releases | `—` | `—` | `?` | `?` | `?` | `ALL` |
| Assets / CIs | `OWN` assigned? | `—` | `ALL`? | `ALL`? | `ALL`? | `ALL` |
| **Knowledge — public** | `PUB` | `PUB` | `ALL` | `ALL` | `ALL` | `ALL` |
| **Knowledge — internal** | **`—` HARD RULE** | `—` | `ALL` | `ALL` | `ALL` | `ALL` |
| Users / Requesters | **self only** | `?` | `ALL`? | `ALL`? | `ALL`? | `ALL` |
| Contracts / POs | `—` | `?` | `?` | `—` | `?` | `ALL` |
| Tasks | `—` | `—` | `TEAM`? | `TEAM`? | `TEAM`? | `ALL` |
| Approvals | `OWN` | **pending theirs** | `?` | `?` | `TEAM`? | `ALL` |
| Reports / Dashboards | `—` | `—` | `?` | `?` | `ALL`? | `ALL` |
| **Admin config** | `—` | `—` | `—` | `—` | `?` | `ALL` |

### 6.1 · Rules that hold regardless of how the cells resolve

Four requirements `06` carries whatever the workshop decides:

| # | Rule | Why |
|---|---|---|
| **PR-1** | **Never reveal existence.** Counts, autocomplete, "did you mean," recents, and error copy must not confirm that a hidden record exists | The **X-1** leak (`02`) — Zendesk documents this failure in their own product |
| **PR-2** | **Trim per object type, not globally.** A rule that governs tickets must not silently leave users or organisations exposed | Zendesk's documented gap, verbatim |
| **PR-3** | **Result counts are per-user by design.** Two users searching the same term legitimately see different totals. `07`'s copy must never imply a canonical total | Early- vs late-binding consequence (`01` §3) |
| **PR-4** | **The same trimming applies to any AI path.** ⌘Enter → Ask AI must inherit it | `03` §7.3 R-1 — and it is **already live in production** |

---

## 7 · Frequency hypotheses — the input the ROI model needs

`01` §4's business case needs `L` (lookups per technician per day). Personas are where that estimate lives, so
it is stated explicitly rather than buried.

| Persona | Hypothesised lookups/day | Confidence | How to verify |
|---|---|---|---|
| **P1 · L1 Technician** | **30–60** | **Low — this is A-01** | Search logs · `01` §8.3 Q3 · `03` §6.4 |
| P2 · L2/L3 | 10–20 | Low | Same |
| P3 · Manager | 3–8 | Low | Same |
| P4 · Requester | <1 (a few per year) | Medium | Portal analytics |
| P5 · Admin | 2–5 per admin session | Low | Interview |
| P6 · Approver | <1 | Medium | Approval flow analytics |

> 🚨 **Every number above is invented.** They are hypotheses shaped to be falsifiable, and they exist so the
> ROI model has a named input rather than a silent assumption. **Do not put them in a deck.** If P1's real
> figure is 5 rather than 40, `01` §4's case shrinks by 8×, and that is worth knowing before we build, not
> after.

---

## 8 · Prioritisation

### 8.1 · The asymmetry that governs every trade-off

From the domain reference, and the most useful single sentence in it:

> **Agents optimise for repetition. Admins optimise for safety. Requesters optimise for escape.**
> **A pattern that serves one often harms another.**

Applied here:

| Serving… | Helps | Harms |
|---|---|---|
| **Repetition** (P1) — dense rows, keyboard-only, recents, no confirmations | P1, P2 | P4 — density reads as clutter; keyboard-only is invisible to them |
| **Safety** (P5, P6) — confirmations, previews, undo | P5, P6 | P1 — every confirmation is a tax paid 40 times a day |
| **Escape** (P4) — plain language, few results, generous spacing, guidance | P4 | P1 — verbose and slow at volume |

**The resolution, and it is a real design position:** V1 is built for **repetition**, because that is the
stated problem and the highest-frequency job. **Safety is satisfied structurally rather than through
interaction** — V1 is read-only, so there is nothing to confirm and nothing to undo. And **escape is satisfied
by protection, not by features** — P4's needs are met by permission correctness in V1 and by ⌘Enter → Ask AI in
V2.

> This is why V1 being **retrieval-only** is more than a scoping convenience. It is what lets one surface serve
> a repetition-optimised persona without the safety machinery that would slow them down. The moment V2 adds
> actions, that reconciliation has to be designed rather than avoided (`07`).

### 8.2 · Ranking

| Rank | Persona | Role in V1 | Justification |
|---|---|---|---|
| **1** | **P1 · L1 Technician** | **Primary — optimise for them** | Highest frequency; their only intent is Teleport, the only intent V1 owns; their pain is the stated problem; their success is directly measurable (MRR, time-to-record) |
| **2** | **P2 · L2/L3** | **Secondary — same surface, no compromise** | Served by the same design plus deep-field indexing. Requires **no interaction changes**, only index depth — an unusually cheap secondary persona |
| **3** | **P4 · Requester** | **Safety-critical — protected, not served** | Their intent is Answer, which V1 doesn't provide. But their permission rules are mandatory from day one and are what protect *every* persona |
| **4** | **P3 · Manager** | **Beneficiary** | Gets navigational search free; filtered queries and saved searches are V2 |
| **5** | **P6 · Approver** | **Watch item** | Drives responsive requirements and the role-aware zero-state idea, at low cost |
| **6** | **P5 · Admin** | **Deferred** | Different objects, different index, lowest frequency. V2 |

---

## 9 · Anti-personas — who V1 explicitly does not serve

Naming these prevents the scope creep that makes search slow.

| Anti-persona | What they want | Why not global search | Correct home |
|---|---|---|---|
| **The report builder** | Multi-condition queries with grouping and export | This is a query builder. Putting it in the palette makes the palette slow and complicated for P1 | Reports module |
| **The bulk operator** | Select 40 tickets and reassign them | Search finds; it does not operate on sets. Multi-select in a palette is a different, heavier interaction | List view + bulk actions |
| **The browser** | No target in mind; wants to see what's there | Search is for known items. Exploration is navigation's job | Module list views, dashboards |
| **The auditor** | Every record matching a condition, exhaustively, for compliance | Search is ranked and capped (`02` X-7). Ranking is the wrong tool when completeness is the requirement | Reports / export |
| **The integrator** | Programmatic retrieval | An API concern | Public API |

> **Use this table in review.** Most requests to widen search's scope are one of these five wearing a
> different hat. Having them written down converts a debate into a lookup.

---

## 10 · Failure map — persona × current gap

Ties `03`'s gap register to who it harms. Columns are the primary sufferers.

| Gap (`03` §10) | P1 | P2 | P3 | P4 | P5 | P6 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| **G-1** No global search affordance | ●●● | ●● | ● | ●● | ● | ● |
| **G-2** Container-before-record | ●●● | ●● | ● | ●● | ● | · |
| **G-2b** 15 inconsistent search inputs | ●● | ●● | ● | · | ● | · |
| **G-3** 15 unlabelled rail icons | ●● *(new hires)* | ● | · | ●●● | ● | ●● |
| **G-4** No cross-object traversal | ● | ●●● | ● | · | · | · |
| **G-5** Wrong-module errors are silent | ●●● | ●● | ● | ●● | ● | · |
| **G-6** No keyboard path | ●●● | ●● | ● | · | ● | · |
| **G-7** No recents store | ●●● | ● | · | · | · | ● |
| **G-8** Two global entry points | ●● | ● | ● | ●● | ● | ● |
| **G-10** No accessibility story | ● | ● | ● | ● | ● | ● |

**What the map shows:** P1 suffers most from the most gaps — which is the quantitative version of §8.2's
ranking. And **G-3 hits P4 hardest of all** (●●●): a requester facing fifteen unlabelled icons has no
accumulated knowledge to fall back on. They are the least-equipped user meeting the least-forgiving surface.

---

## 11 · Validation plan

| Persona | Would be invalidated by | Cheapest test | Cost |
|---|---|---|---|
| **P1** | Lookups being infrequent (**A-01**) | Search-log query-volume-per-user cut (`01` §8.1 cut 7) | Hours, if logs exist |
| **P2** | Fragments living in titles, not work notes | `03` Q2 + 2 specialist interviews | 1 hour |
| **P3** | Managers living entirely in reports | 1 manager interview | 30 min |
| **P4** | Portal being a separate application (`03` Q20) | One question to PM | 5 min |
| **P5** | Admin config being a separate surface | One question to PM | 5 min |
| **P6** | Approvals happening entirely in email/Teams | Approval-flow analytics or 1 interview | 30 min |
| **All** | Permission model differing from §6 | **`01` §8.4 workshop** | 90 min — **blocking `06`** |

**Recruitment for `10`, derived from §8.2:** 3–5 × P1 *(mandatory — include one hired within 6 months and one
with 2+ years, per `03` §6.4)*, 2 × P2, 1 × P3, 2 × P4 *(mandatory for permission testing)*, 1 × P6 if
reachable. **Never validate permissions with a P5 account** — admins see everything, so every trimming bug
passes.

---

## Open questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| 1 | **§6 permission matrix — run the `01` §8.4 workshop** | PM + Engineering | **`06` — hard blocker** |
| 2 | Is the requester portal the same application? (`03` Q20) | PM | Whether P4 is in V1 scope at all |
| 3 | Does module search index work notes and resolution text? (`03` Q2) | Engineering | **P2's primary job (J-5)** |
| 4 | Is Ask AI permission-trimmed? (`03` Q10c) | PM / Engineering | **PR-4 — live production risk** |
| 5 | Real lookups-per-day for P1 (§7) | Analytics | **A-01 → the whole ROI model** |
| 6 | Do approvers use ServiceOps, or only email/Teams? | PM | Whether P6 survives |
| 7 | Confirm the 15 modules (`03` Q13b) | Designer | `06` object taxonomy |
| 8 | Is there a mobile app or mobile web experience? (`03` Q24) | PM | P6 · `07` responsive |

---

## How to defend this in review

**"These personas aren't based on any research."**
Correct, and §1 says so in the first line — before any persona appears. Each carries a confidence rating and an
explicit *"would be wrong if…"*, §7 flags every frequency number as invented and unfit for a deck, and §11
gives the cheapest test for each, most costing under an hour. The alternative is not *better* personas; it is
the same assumptions held silently. What these are genuinely for is stated up front: giving `06` a permission
agenda and `08` a row-design target — both of which need *a* target to critique, and neither of which waits on
interviews.

**"Why is the requester ranked fourth if permission leakage is the biggest risk?"**
Because *serving* and *protecting* are different commitments, and §8.2 separates them deliberately. P4 is ranked
fourth for **feature investment** — their dominant intent is Answer, which V1 doesn't build — but their
permission rules are rank *one* for **correctness**, listed as J-9 "non-negotiable" and expanded as PR-1 to
PR-4. Ranking them first for features would mean building V1 around plain-language answering, which is the job
Ask AI already owns (`03` §7.3).

**"Six personas is too many. Nobody will read them."**
Only two drive V1's design — P1 primary, P2 secondary — and §8.2 says so explicitly with the ranking argument.
The other four exist for specific, bounded reasons: P4 defines the permission model, P6 supplies the mobile and
role-aware-zero-state requirements, P3 and P5 are documented mainly so their needs can be **excluded** from V1
on the record rather than argued about repeatedly. §9's anti-persona table does the same job in the opposite
direction. Between them, most future scope debates become a lookup instead of a discussion.
