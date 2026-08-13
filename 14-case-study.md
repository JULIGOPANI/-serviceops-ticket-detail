# Global Search for ServiceOps — UX Case Study

**Designer:** Ronak Patel · Product Designer, Motadata
**Product:** Motadata ServiceOps — ITSM + ITAM + endpoint management + PPM
**Duration:** 4–9 August 2026 · 13 phases
**Audience:** design leadership, product management, engineering
**Status:** design complete · pre-launch · validation protocol written, not yet run

---

## At a glance

| | |
|---|---|
| **The problem** | ServiceOps has seventeen modules and seventeen separate searches. None of them federate. To find a record, you must first work out which module owns it — a question about the product's architecture, not about your work. |
| **What I did** | Thirteen phases: research synthesis, a scored audit of ten competitors, a current-state audit, eight personas, four journey maps, an IA and ranking model, an interaction spec, a UI spec, a decision log, a measurement plan, and a working prototype. |
| **The turn** | A current-state audit found that ServiceOps had already shipped an AI assistant answering over both product knowledge *and* tenant data. The planned V2 — an AI answer layer — was already built by someone else. V2 stopped being a thing to build and became a door to open. |
| **What shipped as design** | 24 features · ~150 numbered requirements · 39 recorded decisions · a running React prototype with the real ranking rules and real permission trimming. |
| **What is honestly not done** | No user has been interviewed. No search log has been read. No usability test has run. The protocol for all three is written and costed at under seven hours. |

---

## 1 · The problem

### 1.1 · What the user experiences

A technician takes a call. The caller says: *"I raised a ticket about my laptop — it's twelve-thirty-four something?"*

Before the technician can search for `1234`, they must answer a question the caller never asked: **which of seventeen modules holds it?** Is a laptop problem an Incident or a Service Request? Then they must find that module among seventeen unlabelled icons in the left rail, click it, wait for the list to load, locate *that* module's search input, and only then type.

If the guess was wrong, the result is an empty list — **which looks exactly like "the record does not exist."** So they try another module. Meanwhile the caller is listening to silence.

### 1.2 · The structural version

I framed it as one sentence, and used it in every document afterwards:

> **A ServiceOps user who knows exactly which record they need still cannot reach it without first knowing — and navigating to — the module that contains it.**

The product asks the user to solve the **container** problem before it will help with the **record** problem.

### 1.3 · What I found in the current state

| Finding | Detail |
|---|---|
| **No global search affordance exists** | Not a field, not an icon, not a magnifier. Seventeen module searches, none reachable from global chrome. |
| **Search is not missing — it is partitioned** | Every module has search. They are divided along exactly the boundary the user cannot resolve. |
| **≈1,350 px of empty header** | Between the wordmark and the Ask AI button. The constraint was never space. Nothing had claimed it. |
| **Six of fifteen rail icons were unidentifiable** | I studied a high-resolution screenshot with unlimited time and could not confidently name 40% of the modules. A technician glancing mid-incident is doing strictly worse. |
| **Modelled cost of one lookup** | ≈4 clicks · 2 page loads · 2 recall decisions · 2 visual scans — *before the user is allowed to type.* |

### 1.4 · Why it matters commercially

Ten ITSM competitors were audited against a twelve-dimension rubric. **ServiceOps scored 2 out of 18.**

It does not sit at the bottom of the field — it sits **below** it. Ivanti at least offers workspace-scoped search; ManageEngine offers an explicit "Search Across." ServiceOps offers nowhere to express a cross-module intent at all.

### 1.5 · The evidence I would and would not use

I built an evidence ledger early, because the research brief I inherited quoted findability statistics as settled fact and I did not want a stakeholder repeating a number from my deck that turned out to be unsourced.

| Claim | Verdict |
|---|---|
| Gartner Digital Worker Survey — 47% of digital workers struggle to find information (n=4,861, fielded Sept–Nov 2022) | ✅ **Lead with this.** The only figure with real methodology attached |
| McKinsey — 1.8 hrs/day searching | ⚠️ Usable internally. No date in the source; confirm before any external deck |
| Interact — 19.8% of business time | ⚠️ An intranet vendor's own survey. Always name the vendor |
| *"Enterprise search has a 10% first-attempt success rate vs Google's 95%"* | ❌ **Quarantined.** Widely repeated, no primary study exists. The most quotable and least defensible claim in the brief |
| Zero-result benchmarks (10–15%, target <5%) | ⚠️ From **e-commerce**, not ITSM. Internal target only |
| **Nielsen's response-time limits — 0.1 s / 1 s / 10 s** | ✅ **The strongest evidence in the project.** Peer-reviewed, decades-replicated, and a *design constraint* rather than a claim about waste — much harder to argue with |

**And the honest position I took on the business case:** borrowed statistics justify *looking*, not investing. So I wrote the model instead of the number:

```
Hours recovered = (seconds saved per lookup) × (lookups per tech per day)
                  × (technicians) × (working days) ÷ 3600
```

Three of those four inputs are measurable at Motadata. *"Here is the model, here are the three measurements we need, fund the measurement"* is a stronger position than *"McKinsey says 1.8 hours."*

---

## 2 · My role

**I did this work solo.** Research synthesis, competitive audit, current-state audit, personas, journey maps, IA and ranking model, interaction specification, UI specification, decision log, measurement plan, and the prototype.

**Where others contributed:** PM and engineering answered targeted questions — the module list, whether ⌘K was bound, what Ask AI does, and whether record ID prefixes are tenant-configurable. Four of those answers changed the design materially. Two changed it fundamentally.

**What I deliberately did not do:** I did not run user interviews or usability tests. That is a gap, it is stated as one throughout, and §6 explains both why and what the plan is.

---

## 3 · Process

I ran thirteen phases in sequence, each producing one citable document. The discipline that made it work: **every factual claim carries an evidence tier** — Verified, Vendor-documented, Directional, or Unverified — and every Unverified claim names how it gets validated.

### 3.1 · Competitive audit — and the three undefended dimensions

Ten ITSM/ESM products scored across twelve dimensions, with a critical methodological rule: **undocumented ≠ absent.** Every gap is marked `—` and excluded from scoring, and each vendor's documentation coverage is reported alongside its score so the two are never conflated.

Three findings changed the strategy:

**Nobody documents what a result row contains.** Zero of ten. Yet row metadata is the mechanism by which a user recognises the right record without opening it — and for a technician doing forty lookups a shift, opening the *wrong* record is the dominant cost, not typing the query.

**Only one vendor documents a keyboard model.** Atlassian's Rovo, and even then a single binding. Meanwhile ⌘K-summoned search is at **8/8** across the command-palette class — Linear, Raycast, VS Code, GitHub, Vercel, Slack, Notion, Superhuman. Keyboard-first search is standard in the tools technicians use *outside* work and near-absent in the tools they use *inside* it.

**No vendor documentation mentions accessibility at all.** Not one ARIA reference across ten products. Enterprise and public-sector ITSM procurement increasingly requires conformance documentation. A properly built ARIA combobox is correct, differentiating, **and a procurement asset** — which is the combination that survives a schedule squeeze.

### 3.2 · Personas — and what they actually type

I inherited a five-role bullet list labelled "personas." Those were role sketches: no query fragments, no frequency, no permission scope, no failure modes.

I built eight. Two came from sources the brief did not have:

- **The Approver** — from the domain reference. Rare, interrupt-driven, decides in under a minute, usually on a phone. The only mobile-first persona in the set, and therefore the entire responsive argument.
- **The Security Analyst and Endpoint Admin** — from the confirmed module list, which revealed Vulnerabilities, Patch, Package and Deployments. An entire endpoint-management domain with no persona coverage.

**The most design-critical output was a query-fragment inventory** — what people literally type. It produced seven ranking rules, two of which would otherwise have been discovered in beta:

> **Bare numbers must match ID suffixes.** People type `1234`, not `INC-04412`. It is the single highest-frequency query shape, and it needs to disambiguate when `1234` matches an incident, an asset *and* a purchase order.

> **Fuzzy tolerance must scale with string length.** Serial numbers get transcribed from stickers by someone reading aloud over a phone — so the longest strings are the most error-prone. A fixed edit-distance threshold gets this exactly backwards.

### 3.3 · Journey maps — four insights that outlived their maps

**The cost is not measured in seconds. It is measured in dead air on a phone call.** Under ~3 s of silence goes unnoticed; at 5–10 s the caller starts filling it; past ~15 s they ask *"are you still there?"* and the technician starts apologising for the software. That reframes the ≤1 s latency budget from an engineering target into a **conversational** one — the threshold at which nobody has to apologise. And the real damage is not the technician's lost seconds; it is the customer's perception of the service desk.

**Every "does anyone remember…" message in a support channel is a search failure the product cannot see.** The team chat channel is functioning as an undocumented, unindexed, human-powered shadow search system — and it is *winning*, because it is more reliable than the product's search. This is measurable **this week**, without any instrumentation, by counting those messages over 90 days. It sets the real bar: search does not have to be good, it has to beat asking a colleague.

**A requester who cannot find their ticket does not give up. They raise another one.** That converts a UX problem into an operational cost landing in the same L1 capacity the business case is trying to recover. The requester journey and the technician journey are the same cost counted twice.

**The approver does not have a search problem. They have a scent problem — and it is the same fix.** They never searched; a deep link took them straight to the record. What failed was that the destination did not carry the *decision*. That independently confirmed the row-design requirement from a completely different direction. And note where deferral leads: a deferred approval becomes a rubber-stamped approval, which degrades the control the approval exists to provide. That is a governance argument, and it reaches stakeholders a usability argument does not.

---

## 4 · The turn

### 4.1 · What I found

Phase 3's current-state audit was the phase I nearly skipped. The research brief had no data on ServiceOps itself, and I almost went straight from competitive analysis to personas.

Four questions to PM produced four answers. Two of them broke the plan.

**Answer one: every module already has search.** I had been describing a product with *no* search. It has seventeen. That reframing improved the position considerably — the engineering ask is federation, ranking and permission-consistent merging, not retrieval from scratch. But it also made the failure worse than an absence would be: **an absent feature teaches the user nothing, while seventeen search boxes that each work and each silently return nothing for a record one module over actively teach the user that the record does not exist.**

**Answer two — the plot twist: Ask AI already answers over both product knowledge and tenant data.**

### 4.2 · Why it broke the plan

Phases 1 and 2 had staged a V2: an AI answer layer inside search, with retrieval-augmented generation, a synthesised answer card, citations, streaming, and a confidence gate. Modelled on ServiceNow's Genius Results.

**That entire plan was redundant.** The "Answer" job was already owned, across both corpora, by a shipped feature sitting in the same header. Building it would have meant two AI surfaces, in one header, over the same data, answering the same questions — the exact anti-pattern I had catalogued in three competitors and written up as something to avoid.

### 4.3 · What it turned into

The competitive audit's highest-priority steal was Atlassian's explicit routing: `Enter` does the cheap, fast, predictable thing; `⌘Enter` routes to the expensive AI thing. In Jira, Atlassian had to *build* that ⌘Enter destination.

**In ServiceOps it already existed.**

| | Jira + Rovo | ServiceOps |
|---|---|---|
| `Enter` | Issue navigator (keyword) | **Global search results — V1, I build this** |
| `⌘Enter` | Rovo Search — *they built it* | **Hand the query to Ask AI — already shipped** |

V2 went from *build an answer engine* to *build a handoff*. And the confusion risk resolved itself: the two surfaces stopped being competitors and became **sequential** — search is the front door, Ask AI is a destination you route *to*.

> **The principle it produced:** *ServiceOps does not need a second AI. It needs a retrieval layer, and a door between the two.*

**The lesson I took from it:** the current-state audit was the highest-value phase in the project, and it was the one I nearly skipped because the research brief did not call for it. Secondary research tells you what the market does. It cannot tell you what your own product already shipped last quarter.

---

## 5 · Design

### 5.1 · The reframe that came from a challenge, not from me

My first solution design was a **retrieval** surface — it waited to be asked and answered exactly what it was asked. Correct for the phone-call case; wrong for everything else, because it assumes the user always arrives knowing what they want.

Challenged on it, I reframed. Often a technician arrives knowing *something is wrong* or *something needs doing*. So search returns **four kinds of thing**, and only the first is a search result:

| | Answers | Example |
|---|---|---|
| **Records** | Find this thing | `INC-04412` · a laptop · `CVE-2026-1189` |
| **Places** | Take me there — or search inside there | Go to Vulnerabilities · Search "firmware" in Changes · Settings › SLA Policies |
| **Signals** | You didn't ask, but you need to know | 3 tickets breach SLA in 2h |
| **Ask AI** | Answer this in words | Top right, always |

### 5.2 · The ranking rule everything rests on

**An exact identifier match is an absolute override.** When a query is an ID, asset tag, serial, email or CVE and a permitted record matches, that record is position 1. No text score, recency boost, ownership weight or type weighting may displace it.

This is not theoretical. Zoho Desk documents its relevance as *"the number of times your keywords appear"* — raw term frequency with no IDF and no length normalisation. **That would rank a knowledge article mentioning `INC-01234` five times above the actual ticket `INC-01234`.** A shipping product, documented, today.

### 5.3 · Solving "search everything" without losing the second

A technician can search anything — patches, CVEs, packages, deployments, CIs, projects. But the ≤1 s promise was made for the query that happens forty times a day.

Both hold, because the constraint moves from *what is searchable* to *how results arrive*:

| Tier | Types | Behaviour |
|---|---|---|
| **Hot** | Requests · Assets · Knowledge · People · Changes · Problems | Queried every debounce. Must land inside 1 s. Renders first, always |
| **Warm** | Vulnerabilities · Patches · Packages · Deployments · CMDB · Projects | Queried in parallel, revealed on request |
| **Cold** | Settings & Places | Local or cached. Near-instant |

Nobody types a CVE identifier while someone waits on the phone.

### 5.4 · Solving recents *properly*

The naive answer is two lists — "Recent" and "Frequent." It is wrong twice: it doubles the scan cost, and the same item usually appears in both.

**One list, scored by recency and frequency together.** A view in the last 4 hours is worth 100 points, today 70, this week 50, this month 30. So a ticket opened twelve times last week outranks one opened once an hour ago — correctly, because it is the thing you are actually working on. Context multiplies it (×2 if related to the record you are on), and **the record currently on screen is suppressed entirely** — offering someone the record they are staring at is the clearest possible signal the feature is not paying attention.

### 5.5 · The defect I caught before it shipped

Confirming the module list revealed a collision that would have shipped silently:

| In… | "KB" means | Example |
|---|---|---|
| **Knowledge** | Knowledge Base article | *"KB: How to reset VPN MFA"* |
| **Patch** | A Microsoft update identifier | `KB5034441` |

A security analyst searches `KB5034441`, gets three knowledge articles about VPN, and concludes search is broken. The rule: a query matching a vendor patch-ID pattern classifies as an exact match against **Patch**, never Knowledge — even though the token is literally "KB." And the knowledge group is labelled *"Knowledge"* everywhere, never *"KB."*

Discoverable only because the module list was confirmed. Otherwise, found by a customer.

### 5.6 · Permissions — the part I would defend hardest

The permission model is stronger than any competitor's documented model, **including Zendesk's** — whose own documentation admits that ticket restrictions *"do not affect the visibility of other search results, such as users or organizations."* A documented leak, in a mature product.

I enumerated five leak vectors and closed each:

| Vector | The failure | The rule |
|---|---|---|
| **Result counts** | *"Tickets (7)"* while showing 1 confirms six hidden records exist | Counts computed **after** trimming, always |
| **Autocomplete** | Suggesting another requester's name | Suggestions drawn only from permitted data |
| **"Did you mean"** | Correcting toward a term that exists only in restricted records | Correction dictionary built from permitted content |
| **Error copy** | *"You don't have permission"* ≠ *"No results"* | 🚨 **One string only** |
| **Recents** | A record shown after access was revoked | Re-trimmed at render, never trusted from cache |

> **The fourth is the one that ships by accident.** *"You don't have permission to view this"* feels more helpful and more honest than *"no results."* It is neither — **it is a disclosure.** There is exactly one empty-state string: ***"No results you have access to."***

---

## 6 · Validation

**Honest position: no user has been tested with. What follows is what *was* validated, and what the plan is for the rest.**

### 6.1 · What was validated

**A Six Thinking Hats critique, run twice** — once on the design, once from each persona's seat. It was only worth running if something changed. **Seven decisions changed and V1 got smaller.**

The Black Hat found the risks I had stopped seeing:

- **Signals may be empty on most days.** The criteria are deliberately tight — assigned to you, time-critical, fixable by opening one record. For an ordinary technician on an ordinary day that is often zero. I had heavily designed a feature that would frequently be invisible.
- **Frecency has a cold-start problem.** A new user has no view log — so the zero-state's main content is empty for exactly the person who needs help most.
- **Nobody has ever seen the row.** It is the declared pass/fail component of the design and the business case rests on it.

The persona seats found what the design session missed:

- **P1 will ignore most of what I built.** His path is ⌘K → digits → Enter. Everything else is scenery — which is fine, but it means the scenery must not slow him down, and facets, the warm tier and Places all did.
- **The requester is the persona most likely to press Ask AI, and the one it most likely fails.** A prominent AI button, disabled in V1, is a trap built for the least-expert user.

**What changed as a result:**

| Change | Effect |
|---|---|
| Ship one layout variant, not three | Removes work |
| **Cut Signals from V1** — build it in V1.1 from click data | **Removes work** |
| Warm tier becomes an explicit expand row, not auto-streaming | Reduces work · protects the reading position |
| Frecency cold-start falls back to a role default | Small addition |
| Progressive facets — one row inline | Reduces work |
| Ask AI ships as a pre-filled handoff or not at all — no disabled state | ~1 day |
| The row test runs before any further build | 2 hours |

**Five of seven remove or reduce work. Feature count went 27 → 24.**

### 6.2 · What has not been validated

| Gap | Why it matters |
|---|---|
| No user interviewed | Lookup frequency is unverified — and the ROI model depends on it entirely |
| No search log read | Zero-result rate, ID-shaped query share and reformulation chains are all unknown |
| No usability test run | Recognition-without-opening is untested |
| No permission model confirmed | The one failure that cannot be fixed after launch |
| No latency measured at real volume | The premise of the whole design |

**The prototype does not close these.** It validates the rules against my own mock data — it proves they are implementable, not that they are right. That is circular and I have not presented it as anything else.

### 6.3 · The plan — under seven hours

| # | Action | Cost | Closes |
|---|---|---|---|
| 1 | Row test on paper — 3 technicians, 6 printed rows | 2 hrs | The pass/fail component |
| 2 | Count *"does anyone remember"* messages in support channels | 1 hr | Silent-failure baseline |
| 3 | Three questions to engineering — work notes indexable? BM25 or `LIKE`? facet counts cheap? | 30 min | Whether the L2/L3 journey works at all |
| 4 | One question to PM — can Ask AI accept a pre-filled query? | 15 min | The V2 door |
| 5 | Permission workshop | 90 min | The last hard build blocker |
| 6 | **Baseline click-path study — before anyone sees the prototype** | 90 min | The business case |

> ⏳ **Item 6 has a deadline that has already started.** The prototype is runnable. The moment a technician sees it, the baseline is contaminated permanently and the before/after comparison disappears. **Run the baseline before the demo.**

---

## 7 · The solution

**24 features.** The ones that carry the argument:

**Getting in** — a persistent centre-header bar (large but visually quiet), ⌘K, and `/`. Placed in the centre because the right-hand cluster already holds eight icon targets at ~40 px pitch and is at *discrimination* capacity; a ninth would worsen it and put the product's most-used control at the screen's far edge.

**Finding** — federated retrieval across everything the user can see · exact-ID override · bare-number matching · fixed group order so the layout becomes muscle memory · a zero-result recovery ladder that tells you what to try rather than that nothing was found.

**Recognising** — this is the pass/fail group. Rows carry enough to choose without opening. Matched terms are highlighted, and when the hit is inside a work note rather than the title, the row shows that line. Every row names its module, which inverts the problem statement: **the result tells you the container.**

**Trusting** — permission trimming with a single empty string · honest system states that name what is missing rather than silently returning a partial set · a full ARIA combobox contract, in a field where no competitor documents accessibility at all.

### 7.1 · The prototype

A working React + TypeScript build using **`cmdk`** — the same library behind Linear, Vercel, Raycast and shadcn/ui.

**One implementation detail belongs in a design document**, because it is a design decision wearing an engineering costume:

> **`shouldFilter={false}` is mandatory.** cmdk filters and re-sorts client-side by default using its own fuzzy scorer. Left on, it would take results the server has classified, tiered, boosted and grouped — and re-rank them with an algorithm that knows nothing about exact-ID matching. **The single most important rule in the search model would be silently overridden by the component library.** And it fails quietly: results still appear, just in the wrong order. No functional test asserting "results are returned" would catch it.

**The prototype's best feature is the role switcher.** Flip from technician to requester and re-run any query: results vanish, counts drop, internal knowledge disappears — and nothing anywhere hints that hidden records exist. It makes the security model *demonstrable* rather than asserted, which is a rare thing to be able to do in a stakeholder review.

---

## 8 · Results and impact

**No impact metrics exist. The product has not shipped.** What exists is the measurement plan and the definition of success.

### 8.1 · What success means

V1 has succeeded when all five hold:

1. A technician reaches a known record in under 5 seconds, from anywhere, without deciding which module owns it.
2. Exact-ID queries land at position 1 more than 98% of the time.
3. No requester has ever seen — or been able to infer — a record they cannot access.
4. **The "does anyone remember…" message count has fallen.**
5. Module-scoped search is still there, still working, and used less.

> **Point 4 is the real one.** Adoption measures whether people used the feature. The message count measures whether it beat the thing it was actually competing with — which was never the old search box. **It was a colleague.**

### 8.2 · Counter-metrics

Success metrics alone always look good. These catch collateral damage:

| Watch | Because |
|---|---|
| Module-search usage should fall — **but not to zero** | Total collapse means a workflow was removed, not improved |
| Time-on-record should not fall sharply | A drop means users open wrong records and bounce — a **row-scent failure wearing a win's clothing** |
| Ticket creation should not rise | If search surfaces "create" too readily, duplicates increase |

---

## 9 · Decisions

Thirty-nine decisions are recorded once, each with the alternatives considered, the evidence, the consequences, and **the cost of reversing it**. Five that a reviewer is most likely to challenge:

| # | Decision | Why |
|---|---|---|
| **D-01** | V2 bridges to Ask AI rather than building an answer layer | The Answer job is already owned. Building it would ship the anti-pattern I catalogued in three competitors |
| **D-03** | Fixed group order, not score-ordered groups | Score-ordering moves the layout on every query. For someone doing this 40× a day, the variable worth optimising is not the quality of one result set but the speed of the ten-thousandth — and that comes from muscle memory |
| **D-05** | V1 is retrieval-only | Read-only is what lets one surface serve a repetition-optimised technician without confirmations they would pay forty times a day |
| **D-09** | Exactly one empty-results string | Confusion is a support ticket. Disclosure is a security incident |
| **D-34** | Cut Signals from V1 | It will be empty on most days for most users, and I was guessing at urgency criteria rather than measuring them |

---

## 10 · What I learned

**The current-state audit was the highest-value phase, and I nearly skipped it.** The research brief did not call for it — it had competitor teardowns and a staged recommendation, and it felt ready to design from. Four questions to PM invalidated two phases of planning. Secondary research tells you what the market does; it cannot tell you what your own product shipped last quarter.

**I designed for the wrong scope for ten phases.** I assumed pure ITSM. Confirming the module list revealed ITSM + ITAM + endpoint management + PPM — an entire security and endpoint domain with no persona coverage, new query fragments nobody had anticipated, and a naming collision that would have shipped. *Confirm the object model before designing the information architecture over it.*

**The best reframe in the project was not mine.** My first solution design was a retrieval surface. Challenged that it should *suggest*, not just respond, I reframed it into four result kinds — and that reframe carries most of the design's actual value. **Being challenged early is cheaper than being right late.**

**The honest failure is the ratio.** Thirteen documents, twenty-four features, ~150 requirements, thirty-nine decisions, one prototype — and **zero users spoken to.** The three severe risks flagged in Phase 1 are unchanged in Phase 13. Every phase since has added specification on top of the same untested foundation.

I would run the six-item validation plan in §6.3 **before** Phase 6, not after Phase 13. It costs under seven hours. It would have changed decisions rather than confirmed them — and I would have known by day two whether the assumption the whole business case rests on is even true.

---

## 11 · What I need

| # | Ask | Owner | Blocks |
|---|---|---|---|
| 1 | 90-minute permission workshop | PM + Engineering | **Build** — the last hard blocker |
| 2 | Are work notes and resolution text indexable? | Engineering | The L2/L3 journey fails entirely without it |
| 3 | Can Ask AI accept a pre-filled query? Who owns it? | PM | The V2 door |
| 4 | Is a 16 px icon variant available? | Design system | The row spec |
| 5 | 3–5 technicians and a realistic-data tenant | PM / CS | The baseline — **and it expires** |
| 6 | When do `tokens.json` and the type ramp publish? | Design system | Every unverified value in the UI spec |

---

*Full reasoning, evidence and requirements: documents `01`–`13` in this folder. Every decision is recorded once, in `09`. Every open question is tracked in `OPEN-QUESTIONS.md`.*
