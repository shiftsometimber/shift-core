# Shift Product Opportunity Register

Separate from the V1 Release Blocker Board. This register captures agreed product direction; it must not create new V1 release blockers unless an exposed V1 surface genuinely depends on it.

Classification: A production-proven; B incomplete; C siloed; D technically exists / unfinished UX; E missing; F future/dependency-bound.

| ID | Concept | Why it matters | Area | Tier | Current | Dependencies / regulatory | Trigger / next action |
|---|---|---|---|---|---|---|---|
| O-001 | Shift Conversation | ASK → UNDERSTAND → RESPOND → REMEMBER; premium adaptive onboarding rather than another questionnaire | Onboarding/Brain | P1 | D | Reuse profile/goals/preferences/MOT/member context | Post-RC: map existing fields, remove duplicate questioning, prove downstream behaviour |
| O-002 | Life Back | Structured goals for what the bloke wants back, not merely weight | Progress/Today/Fit/Brain | P1 | B | Reuse Goals/Progress; provenance/member correction | Add baseline/destination/milestones and prove Today/Fit/Progress personalisation |
| O-003 | One Member Context | One authoritative whole-bloke context with current explicit intent outranking historical inference | Brain | P0 architecture | A/B | Existing One Shift Brain; strict domain separation | Extend schema only where missing; never create competing context store |
| O-004 | Oral Weight-Loss Medicines UK Hub | Own high-intent UK tablet/oral weight-loss category | Knowledge/Radar/Acquisition | P1 urgent | B | MHRA/NICE/NHS/EMA evidence; no suitability inference | Audit existing semaglutide/GLP-1/oral content and build governed category hub |
| O-005 | Shift Evidence | Governed evidence objects separating evidence strength from regulatory status | Knowledge | P1 | B | Existing reviewed Knowledge provenance lifecycle | Extend object model for medicines, peptides, supplements, interventions and claims |
| O-006 | Whole-Bloke Health | Expand from weight wedge into cardiovascular, metabolic, sleep, head, alcohol, mobility, sexual health, ageing/prevention | Knowledge/Brain | P1 | B | Medical review boundaries | Add pillars progressively without diagnosing |
| O-007 | Men's Sexual Health | Normal bloke language + serious reviewed ED/libido/testosterone/PE/fertility content | Knowledge | P1 | E/B | Medical review, legitimate UK routes | Establish governed Knowledge pillar post-RC |
| O-008 | Connected Knowledge | Topic graph showing how health domains relate without diagnosing | Knowledge/Brain | P1 | B | Canonical Knowledge relationships | Add governed relationships and relevance retrieval |
| O-009 | Shift Radar / Shift Now expansion | Translate current regulatory/industry intelligence into what it means for an ordinary bloke | Radar/Today | P1 | A/B | Source licensing/provenance/freshness | Expand governed sources after V1 reliability remains locked |
| O-010 | Shift Sports | Engagement reason to open Shift without pretending to be Sky Sports | Engagement | P2 discovery | E | Sports data/API licensing and commercial terms | Research providers; prove narrow engagement loop before scale |
| O-011 | Blokes Hub | Longer-term sport/food/fitness/health/head/sexual-health/useful-news/gear/community layer | Engagement | P2 | E | Depends on O-010 and governed content | Prototype only after engagement evidence |
| O-012 | Timber Mill evolution | Curated evidence-first commerce rather than supplement warehouse | Commerce | P2 | C/D | Supplier/API/stock/fulfilment/returns/brand restrictions | Audit current commerce; research suitable wholesale/fulfilment partners |
| O-013 | Community evolution | Challenges, milestones, clubs, teams, Life Back stories, useful banter | Community | P2 | C/D | Safeguarding/moderation | Audit Tap Room; test narrow belonging loops |
| O-014 | State of the British Bloke | Governed first-party research and proprietary insight | Research | P2 | E | Consent, methodology, governance | Design research governance before collection; never fabricate findings |
| O-015 | Maintenance | GET IT OFF → KEEP IT OFF → GET MORE LIFE BACK; retain value after active loss | Retention | P1 | B | Today/Grub/Fit/Progress/Brain | Add maintenance-mode behaviours after RC |
| O-016 | Unified Search | Search across Knowledge, Grub, Fit and later Blokes Hub with governed ranking | Platform | P1 | B/C | Shared taxonomy and permissions | Inventory existing search and converge after RC |
| O-017 | Deeper Today personalisation | Daily front page distilling food, movement, hydration, progress, one thing, Ask Shift and selective Around Your World | Today/Brain | P1 | B | One Member Context, Radar/Knowledge | Keep UI simple; prove relevance behaviour longitudinally |
| O-018 | Canonical test blokes | Lorry Driver, Office Dad, Night Worker, Physical Worker, Existing GLP-1, Medication-Unsure | Commissioning | P0 continuous | B | Synthetic persona governance | Reuse across systems and prove learned context changes downstream output |
| O-019 | Domain separation hardening | Whole-bloke understanding without unrelated-domain contamination | Brain/Safety | P0 continuous | A/B | Existing longitudinal/adversarial gates | Extend regression suite with new domains |
| O-020 | Visible personalisation | Member can observe meaningful adaptation from work pattern, limitations, Friday takeaway, football goal, dislikes | Product | P1 | B | Brain + Grub/Fit/Today | Commission behaviour, not saved fields |
| O-021 | Grub industrial universe | 2,500 commissioned short-term; 10,000+ quality long-term | Grub | P0 continuous | B | Editorial/visual/runtime factory | V1 uses serious simulation-selected cohort; factory continues post-RC |
| O-022 | Fit industrial universe | 2,500 commissioned short-term; 10,000+ structured movement/protocol objects long-term | Fit | P0 continuous | B | Canonical visual/domain QA | V1 uses serious illustrated 12-week cohort; continue post-RC |
| O-023 | Original Shift outcome/behaviour research | Consented longitudinal insight from Progress, content response and member outcomes | Research/Analytics | P2 | B | Privacy/consent/governance; no causal overclaim | Extend existing outcomes architecture after sufficient data |
| O-024 | Competitor/market/Shift tests | For significant capabilities ask: who does it, who does it best, why uniquely useful to ordinary bloke? | Product strategy | Continuous | B | Research | Apply before commodity feature expansion |
| O-025 | Post-launch factory demand intelligence | Use search/Nay/simulation gaps to drive content production | Grub/Fit/Knowledge | P1 | B | Analytics/simulation | Feed demand gaps into continuous factories |

## Product principles
- Weight management is the wedge; whole-bloke health is the destination.
- ACQUIRE → UNDERSTAND → PERSONALISE → SUPPORT → PROVE → RETAIN.
- Current explicit member intent outranks historical inference.
- Domain context must not contaminate unrelated domains.
- Evidence strength and regulatory status are separate.
- Evidence first, commerce second.
- New verticals prove usefulness before industrial scale.
- BUILT IS WORK. DEMONSTRATED USEFUL BEHAVIOUR IS DONE.
- GitHub is code truth; 57-row audit is evidence truth; V1 Release Blocker Board is current release critical path; this register is future product-direction truth.
