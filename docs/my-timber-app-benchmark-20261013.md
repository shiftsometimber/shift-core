# My Timber: one useful member experience

Primary-source review and implementation scope, 13 October 2026. Matt asked to research the wider app market and build the useful capabilities onto My Timber's existing foundation. This supersedes a plan-only treatment of the gap. It does not approve costs, external communications, unreviewed clinical estimates, production activation or a competing release lane.

The survey covers eight direct or partly overlapping treatment trackers and five adjacent tools. It is a representative capability review, not an exhaustive app census, hands-on paid-app acceptance or an independent ranking. Marketing claims about competitors were checked against each product's own material where relevant; self-awarded “best” labels and claimed causal explanations are not evidence.

## Primary product records

| Product | Source checked | Relevant advertised capability | Translation for My Timber |
| --- | --- | --- | --- |
| Shotsy | https://shotsyapp.com/glp-1-tracker/ and https://shotsyapp.com/science/ | Medication estimates, dose/site history, symptoms, progress by dose/site, PDF | Clear treatment context beside recorded facts and usable prescriber reports |
| MeAgain | https://meagain.com/glp-1-tracker-app | Connected dose, food, symptom, photo and medication timeline; multiple food capture methods | One routine, low effort logging and personal journey |
| Glapp | https://glapp.io/science and https://glapp.io/glp-1-tracker | Estimated curves, educational phases, symptom context, supply and research references | Explain assumptions and separate population models from personal records; its own phase boundaries are expressly not individually validated |
| Pep | https://pepglp1.com/ | Medication indicator, reminders, measurements, photos, food search/barcode/photo capture | Fast repeat actions and an understandable week |
| Regimen | https://helloregimen.com/uk/blog/best-glp1-tracker-apps-uk-2026 | Supply, selected daily markers, health metrics, labs and reports | Learn from record organisation; automatic dose progression, reconstitution and research-compound functions are outside SHIFT's scope |
| Slimly | https://slimly.app/en/ | Dose/symptom/meal timeline, appointment questions, reports and offline records | Bring appointment preparation into the saved history; do not enable offline private caching without isolation design |
| Jabbit | https://www.jabbitapp.com/features and https://www.jabbitapp.com/ | Injection logs, inventory, site notes, visual progress and privacy | Relevant tracking/privacy ideas only. Direct features-page retrieval failed; official indexed feature/home text supplied limited evidence. Other injection protocols are excluded |
| Veya | https://tryveya.app/ | Medicine schedule and private record keeping, iOS controls and app lock | Private, quick access. A same-name nutrition/dating app is not this product; medication-curve/widget support was not established |
| Bearable | https://bearable.app/support/howto/the-factor-effect-report/ | Delayed symptom/factor comparisons and recorded-data graphs | Expose supporting records and missingness; avoid presenting co-recording as cause |
| Happy Scale | https://happyscale.com/ | Weight smoothing, conditional projections, milestones and Health import | Keep recorded weight distinct from uncertain trend context; do not promise loss or target dates |
| Cronometer | https://cronometer.com/ and https://cronometer.com/features/ | Food database, barcode/photo/voice capture, nutrients and biometrics | Easy capture with reviewed sources and editable estimates. No external nutrition service is activated by this increment |
| MacroFactor | https://help.macrofactorapp.com/dashboard/expenditure and https://help.macrofactorapp.com/en/collections/18-macrofactor-nutrition | Quick logs, data quality checks, trend/expenditure context and device tools | Reduce friction and distinguish complete from partial intake; adaptive calorie prescriptions are not copied |
| Medisafe | https://help-center.medisafe.com/en/articles/8103174-how-can-i-share-a-report-of-my-medication-history and https://medisafe.com/download-the-app | Scheduling, reminder management and selected medication reports | Make records portable and reminders dependable. Reports are generated locally/privately; nothing is automatically sent |

No subscriptions, paid inference, external partner contact, app-store install or user health-data disclosure was made for this survey. Directory CLI was absent and its setup page could not be retrieved by the available search service; research used primary public product material. Product claims do not establish medical accuracy or successful outcomes.

## One product architecture

Today remains the front door: a useful next action and an optional quick check-in. Progress explains the saved history. My Treatment owns doses, prescription details and supply. Grub/Fit own actual intake and movement. The treatment-week view connects selected owned sources without copying them into another database or sending them to an AI provider. PWA and native wrappers reuse the same member assets.

| Capability | Recovered foundation | This build / next increment |
| --- | --- | --- |
| Dose/site/strength history and quick logs | Existing treatment events and member-entered strengths | Reused; historic prescription wording never backfills doses |
| Whole-week symptoms, appetite and energy | Existing severity, impact/onset and logs; old 48-hour pattern rule | New seven-day diary and same-strength repeated timing, preserving the old rule separately |
| Medication exposure estimate | No complete validated patient model established | Draft first-order absorption/elimination and accumulation engine built for fictional review; no real-user curve emitted |
| Food, exercise and measurements beside the week | Existing eaten-food, Fit and Progress storage | Explicit-source, account-owned context joined on demand; food plans never become intake |
| Notes and clinician summary | Existing note events and treatment PDF | New consent/pause-bound note save, recorded-week text export and existing treatment-PDF link |
| Weight projections, supply check dates and photo journey | Existing deployed upgrade and separate repair/acceptance | Retained; current serving acceptance belongs to its source owner |
| Health imports, closed-app reminders and native PDF | Existing native work and physical acceptance sheet | Actual holders/device acceptance remain required |
| Home-screen tools and weight CSV mapping | Prepared follow-up source 543a56108d5e5c45bf56a6e1226b696be027a8d2 | Existing native/portability owner reconciles it; shortcuts are not widgets |
| Photo/barcode/voice food capture | Manual eaten-food and recent-food reuse exist | Exact data handling, input accuracy/correction and cost design remain required; no unapproved upload or paid service |
| Maintenance, stopped-treatment support and broader Life Back | Existing wider product/Shift AI scope | Reconcile into the existing operating/safety work; no substitute for missing selected-source or genuine-user evidence |
| Proactive preparation and did-it-help learning | Existing Today/Shift AI direction and gates | Reviewed next increment using supported observations; no new autonomous monitoring or messaging in this source |
| Offline private records and app lock | Privacy/isolation requirements retained | Separate native threat/access design; do not cache health records blindly |

## New source contract

The optional `/v1/member/treatment/week` route requires a valid member session, explicit selected sources including treatment, current health-tracking consent and an unpaused Journey. Reads are bounded and check withdrawal/pause again before returning. The new `MY_TIMBER_WEEK_VIEW_ENABLED` switch is absent from production configuration and is not activated by this work.

Seven-day cycles use elapsed 24-hour periods after actual logged injections. Incomplete, shortened and pause/finish-interrupted cycles remain visible but do not count as complete comparison weeks. Repeated starts require at least three completed same-treatment/same-confirmed-strength cycles with at least two matching typed symptom-onset entries. These are conservative product heuristics for review, not clinical risk thresholds. Unknown onset remains explicitly log-time-only and never becomes a precise day-three start claim. Missing entries remain unknown; a no-symptoms entry describes a moment.

New notes reuse `member_treatment_events` and have an atomic SQL consent/pause/ownership guard, bounded inputs, same-origin checks and operation replay protection. No new health-data store or retention policy is introduced. Existing export and erasure paths already cover the event table. Selected-week text excludes model estimates and other treatments; the existing treatment PDF is clearly labelled last 12 weeks rather than a single-week report.

## Model and release boundary

`CYCLE_REVIEW.status` is `pending`. The real route never returns curve points. The pure draft engine is executable for fictional review and tests, with medicine-specific half-lives, illustrative absorption-peak assumptions and prior-dose accumulation. It produces a relative index, not mg in the bloodstream or a measured concentration. Future points show decay of logged doses only; scheduled injections are not silently treated as taken. Switching medicines never creates a combined concentration curve. Unknown strengths/history suppress modelling.

Sources: UK Mounjaro SmPC https://www.medicines.org.uk/emc/product/15481/smpc and UK Wegovy SmPC https://www.medicines.org.uk/emc/product/13800/smpc. The selected 36-hour and 48-hour absorption peaks are explicit illustrative assumptions, not fitted or clinically validated parameters. Qualified clinical/model review must supply the final model, scope and limitations. No oral medicine, Orlistat, daily liraglutide or investigational product inherits this weekly injection model.

The existing #1065 owner must adopt the finite candidate, register its exact source and run all unchanged exact-head/compiled/live gates. No old verifier, source authority, homepage, stock, prescribing, checkout, global navigation, native package, production configuration, approval or performance threshold is weakened. Existing dated releases and ordinary/physical acceptance remain separate. New release authority must concern the final reviewed version; source preparation is not deployment.

The next model/Today and native/capture increments are owned dependencies in the existing upgrade record, not extra schedules or parallel release queues. Review access can be arranged only through Matt-approved communications. Actual costs, named review evidence and physical holders are not invented.
