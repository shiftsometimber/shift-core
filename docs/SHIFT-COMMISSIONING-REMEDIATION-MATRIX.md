# Shift Some Timber — Commissioning Remediation Matrix

Authoritative brief: FULL PRODUCT RECOVERY, PREMIUM UX & COMMISSIONING BRIEF.

Status vocabulary: `TODO`, `IN PROGRESS`, `BLOCKED`, `PASS`, `FAIL`.
A feature is not PASS because code exists; PASS requires demonstrated acceptance evidence.

## Gate 1 — Nothing Broken

| ID | Problem / audit requirement | Systems | Severity | Root cause / risk | Proposed resolution | Dependencies | Status | Acceptance / evidence required |
|---|---|---|---|---|---|---|---|---|
| G1-001 | Duplicate/incomplete password recovery paths | Core/Auth | P0 | legacy worker reset handler coexists with recovery module | make recovery module authoritative; remove/bypass duplicate path | none | IN PROGRESS | reset request -> email -> one-time reset -> sessions revoked -> login succeeds |
| G1-002 | Email binding not deployment-persistent | Core/Cloudflare | P0 | dashboard binding existed but wrangler config omitted it | persist `send_email` EMAIL binding and sender/site vars | onboarded Email Service domain | IN PROGRESS | deployed Worker sees EMAIL and sends welcome/reset mail |
| G1-003 | Registration email lifecycle incomplete | Auth/Email | P0 | register worked without transactional lifecycle | welcome + verification/security notifications | G1-002 | IN PROGRESS | new account receives expected email and can sign in |
| G1-004 | Email verification is effectively bypassed | Auth | P1 | AUTO_VERIFY_EMAIL true | define launch verification policy and implement verification flow | owner/clinical launch policy if verification mandatory | TODO | member email state is explicit, tested and not misleading |
| G1-005 | Member persistence confidence damaged | Core/D1/My Shift | P0 | multiple product layers and inconsistent reads/writes | canonical member profile/state contract and persistence tests | none | TODO | save -> refresh -> logout/login -> same data everywhere |
| G1-006 | Broken/dead routes and links not centrally detected | Public/My Shift/Core | P0 | manual discovery | automated route/link/form checker | deploy target access | TODO | zero critical broken journeys; report generated each release |
| G1-007 | Error handling exposes generic failures | All | P1 | inconsistent client/server error contracts | standard error envelope, request ID, member-safe copy | none | TODO | every critical failure traceable in logs with useful UX |
| G1-008 | Loading/empty/success states inconsistent | Public/My Shift | P1 | feature-by-feature UI | shared state components | Gate 3 design tokens | TODO | no blank screens or ambiguous saves in commissioned journeys |
| G1-009 | Mobile/cross-browser regressions found manually | Public/My Shift | P0 | no systematic responsive commissioning | viewport/browser test matrix | test tooling | TODO | iOS Safari + Chrome + desktop critical flows pass |
| G1-010 | Auth rate limits/security controls need formal commissioning | Auth/Core | P0 | partial lockout only | rate limiting, session review, CSRF/CORS strategy, security tests | Cloudflare config as needed | TODO | security checklist PASS |
| G1-011 | Production entry-point wiring can diverge from modules | Core | P0 | layered entrypoint + legacy fallback | source gate asserts all authoritative routes and bindings | none | IN PROGRESS | CI fails if auth/product wiring disappears |
| G1-012 | Synthetic member commissioning is incomplete as release gate | Core/My Shift | P0 | commissioning endpoint tests engines more than whole UX | full end-to-end synthetic journey | website deployment | TODO | register-to-return journey passes automatically |

## Gate 2 — Nothing Half-Finished

| ID | Problem / audit requirement | Systems | Severity | Root cause / risk | Proposed resolution | Dependencies | Status | Acceptance / evidence required |
|---|---|---|---|---|---|---|---|---|
| G2-001 | Shift Today is an engine, not a premium daily command centre | My Shift/Core/AI | P0 | backend/UI split | rebuild around next-useful-action orchestration | Shift Brain | TODO | Dave understands today's priorities in <5 seconds |
| G2-002 | Grub recipes are not real recipes | Grub/Core/My Shift | P0 | hard-coded shallow arrays | structured recipe model with quantities/method/nutrition/allergens/etc | content migration | TODO | every surfaced recipe independently cookable |
| G2-003 | Grub nutrition figures are not tied to exact ingredients | Grub | P0 | static headline macros | calculated/validated nutrition per serving | ingredient nutrition source | TODO | recipe quantities reconcile with displayed nutrition |
| G2-004 | Grub variety/repetition is poor | Grub | P1 | tiny library | scalable structured recipe catalogue + diversity constraints | G2-002 | TODO | 7-day plan has sensible variety and repeat controls |
| G2-005 | Grub Yay/Nay is shallow and not durable learning | Grub/Brain | P1 | swap-only implementation | persist feedback signals with confidence/decay | Shift Brain | TODO | repeated Nay changes future plans, not only current card |
| G2-006 | Fit composes durations incorrectly | Fit | P0 | spare minutes historically padded final exercise | session composer by time/goal/location/equipment | none | TODO | 10/20/40/60 min sessions materially differ and total sensibly |
| G2-007 | Exercise library/instructions are too thin | Fit | P0 | prototype exercise data | structured exercise catalogue, visuals, cues, regressions/progressions | content migration | TODO | member never needs Google to understand movement |
| G2-008 | Fit Yay/Nay is not durable learning | Fit/Brain | P1 | immediate swap only | persist exercise preference/limitation signals | Shift Brain | TODO | future programmes respect feedback |
| G2-009 | Conundrum lacks kitchen intelligence | Conundrum | P1 | literal matching | ingredient graph, pantry assumptions, recipe candidates, preference filters | recipe catalogue | TODO | obvious combinations rank correctly with no invented ingredients |
| G2-010 | Hydration is too water-centric | Hydration | P1 | simplistic model | drink-type logging + contribution/caffeine/calorie context | none | TODO | water/tea/coffee/squash/juice/milk/soft drinks/energy/alcohol log correctly |
| G2-011 | Progress is a data log, not a whole-person story | Progress/My Shift | P1 | disconnected metrics | Since You Started + trends + milestone narrative | canonical profile | TODO | weight/waist/BP/movement/etc show coherent progress |
| G2-012 | Progress units are inconsistent | Progress | P1 | typed/manual fields | shared stone/lb/kg and metric controls | Gate 3 components | TODO | no free-text weight entry in member UX |
| G2-013 | Progress Picture persistence/reliability incomplete | Picture/Core | P0 | storage path failures | durable private storage + save/delete/history | storage decision | TODO | upload/save/reload/delete works on mobile |
| G2-014 | Progress Picture UI feels developer-grade | Picture/My Shift | P1 | prototype controls | premium component treatment + clear illustrative disclaimer | Gate 3 | TODO | same/homepage visual-quality test PASS |
| G2-015 | My Plans surface is not a proper plan manager | My Shift/Core | P1 | stored plan objects not productised | active/upcoming/completed/paused/replaced plan views | canonical plan model | TODO | member can understand current plan state instantly |

## Gate 3 — One Shift

| ID | Problem / audit requirement | Systems | Severity | Root cause / risk | Proposed resolution | Dependencies | Status | Acceptance / evidence required |
|---|---|---|---|---|---|---|---|---|
| G3-001 | Homepage quality is not systemic | Public/My Shift | P0 | one-off styling accumulated | extract homepage design constitution into tokens/components | current site package | TODO | every member/public route passes standalone visual test |
| G3-002 | Header/navigation variants drift | Public/My Shift | P1 | duplicated markup | canonical responsive header/nav | G3-001 | TODO | one source/component behaviour across routes |
| G3-003 | Footer variants drift/are visually heavy | Public | P1 | duplicated footer markup/CSS | canonical premium footer | G3-001 | TODO | footer parity on every public page |
| G3-004 | Forms/selectors expose browser-default/prototype UI | Public/My Shift | P0 | local controls | shared fields, selects, steppers, segmented controls, unit controls | G3-001 | TODO | no cheap/default controls in commissioned routes |
| G3-005 | Cards/spacing/type hierarchy inconsistent | Public/My Shift | P1 | local CSS | design tokens + reusable surfaces/cards | G3-001 | TODO | visual regression review PASS |
| G3-006 | Knowledge Hub editorial experience is inconsistent | Public/Knowledge | P1 | SEO-first pages | premium editorial templates, related content, author/review metadata | G3-001 | TODO | article pages feel authoritative and branded |
| G3-007 | Member navigation reflects architecture rather than intent | My Shift | P1 | feature accumulation | Today -> Grub -> Fit -> Progress -> Ask Shift information architecture | none | TODO | Dave can find key actions without instruction |
| G3-008 | Accessibility is not a design-system gate | All | P0 | retrofit mindset | keyboard/focus/labels/contrast/reduced-motion baked into components | G3-001 | TODO | WCAG-oriented audit PASS for critical journeys |

## Gate 4 — Shift Becomes Intelligent

| ID | Problem / audit requirement | Systems | Severity | Root cause / risk | Proposed resolution | Dependencies | Status | Acceptance / evidence required |
|---|---|---|---|---|---|---|---|---|
| G4-001 | No single formal Shift Brain member model | AI/Core/D1 | P0 | memory/context spread across modules | canonical structured member intelligence model | privacy model | TODO | AI consumes same trusted context across Today/Grub/Fit/chat |
| G4-002 | Memory provenance/confidence/edit/delete controls incomplete | AI/Privacy | P0 | inference stored without product governance | provenance, confidence, source, retention, member controls | G4-001 | TODO | member can inspect/change/delete appropriate learned preferences |
| G4-003 | AI recommendation outcomes are not consistently learned | AI/Products | P1 | feedback stored locally/episodically | central recommendation log + outcome loop | G4-001 | TODO | Yay/Nay and completion measurably affect later choices |
| G4-004 | Site/CMS content ingestion into Knowledge Graph not proven automatic | Knowledge/AI/CMS | P0 | modules exist without guaranteed lifecycle | publish -> classify -> review -> index -> graph -> AI pipeline | CMS integration | TODO | new approved article becomes searchable/grounding automatically |
| G4-005 | Grounding provenance is not consistently visible/inspectable | AI/HQ | P1 | retrieval components vary | provenance contract and HQ trace | G4-004 | TODO | answer can identify member/context/knowledge basis where appropriate |
| G4-006 | Radar is built but end-to-end live status is unproven | Radar/HQ/Public | P0 | architecture != commissioning | run/monitor source scan -> review -> publish -> ticker | external sources/review workflow | TODO | freshness and publication evidence visible in HQ |
| G4-007 | GLP ticker freshness can silently degrade | Radar/Public | P0 | no release-level freshness SLA | stale threshold + fail-safe UI + Watchtower alert | G4-006 | TODO | stale ticker cannot present as current |
| G4-008 | Proactive insights are not yet a coherent daily orchestration system | Today/AI | P1 | multiple intelligence modules | unify into next-useful-action prioritisation | G4-001 | TODO | Today recommendations are consistent and explainable |

## Gate 5 — Trust & Scale

| ID | Problem / audit requirement | Systems | Severity | Root cause / risk | Proposed resolution | Dependencies | Status | Acceptance / evidence required |
|---|---|---|---|---|---|---|---|---|
| G5-001 | Clinical operating boundaries not fully commissioned | Clinical/Public/HQ | P0 | partners/process still developing | explicit provider/pharmacy/prescriber/AI boundaries and workflows | external partners | BLOCKED | signed operating model + accurate public trust surfaces |
| G5-002 | Medication Companion incomplete | Clinical/My Shift | P0 | treatment support not productised | timeline/dose/reminders/check-ins/side effects/escalation | clinical governance | BLOCKED | clinical owner approves pathways; escalation tested |
| G5-003 | Identity/weight evidence verification not commissioned | Clinical/Core | P0 | architecture undecided | verification workflow and human escalation | provider/regulatory requirement | BLOCKED | partner-approved verification journey |
| G5-004 | Health MOT/bloods integration needs partner-ready data model | MOT/Core | P1 | current assessments are generic | unified health-result model + partner adapters | lab/clinical partner | TODO | mocked partner payload flows through Progress/Today safely |
| G5-005 | Public trust architecture is incomplete | Public | P0 | new brand lacks incumbent proof | transparent operator/partner/reviewer/privacy/AI-boundary surfaces | partner names when formal | TODO | customer can answer 'who looks after me?' in <60 sec |
| G5-006 | Outcome measurement not embedded from member one | Analytics/Core | P1 | feature metrics separate from outcomes | cohort/outcome event/data model | governance | TODO | programme engagement can be analysed against legitimate outcomes |
| G5-007 | Watchtower observability is incomplete | All/HQ | P0 | logs exist but no unified health layer | synthetic probes, failure-rate metrics, freshness, HQ alerting | none | TODO | HQ shows website/Core/email/AI/Grub/Fit/Radar status |
| G5-008 | HQ is admin UI rather than operating nerve centre | HQ | P1 | feature accumulation | attention-first operational home + system health | G5-007 | TODO | operator sees what needs action now, not vanity metrics |
| G5-009 | Recipes/exercises are hard-coded scaling traps | Core/Content | P0 | arrays embedded in Worker code | structured D1/content repository with versioning/moderation | migration tooling | TODO | 10k objects without source-code growth |
| G5-010 | Analytics lacks coherent product-event taxonomy | All | P1 | pageview-centric/incomplete | event specification + instrumentation + QA | analytics provider/config | TODO | funnel and feature usefulness answerable from data |
| G5-011 | Security/privacy audit not yet complete | All | P0 | rapid-build debt | threat model, permissions, secrets, uploads, deletion/export, audit trail | none | TODO | documented security/privacy commissioning PASS |
| G5-012 | Performance not a release criterion | Public/My Shift/Core | P1 | feature-first optimisation | Web Vitals/API latency budgets and regression checks | none | TODO | agreed mobile performance budgets PASS |
| G5-013 | Dave end-to-end commissioning not yet run | Entire platform | P0 | no fresh-persona release gate | observe/fix/rerun complete journey | Gates 1-5 | TODO | zero P0/P1 Dave defects; documented evidence |
| G5-014 | Numan/customer trust competitive test not embedded | Product | P0 | internal feature completion bias | final sceptical-customer/partner/investor review | G5-013 | TODO | clear evidence-based answer to why choose Shift |

## Commissioning rule

No row moves to PASS without evidence. Evidence can be automated test output, production probe, screenshots, monitored events, partner sign-off, or a documented blocked external dependency. Strategic items cannot disappear; they remain explicit rows until implemented, blocked, or formally decided.
