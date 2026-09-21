# Launch-readiness work register — in progress

Inherited IDs and acceptance criteria retained. No proposed item is marked complete from code changes alone. See REGISTER.json for complete evidence, smallest changes, journeys, acceptance/regression checks and protection per item.

| Item | Current disposition | Evidence / next gate |
|---|---|---|
| WR01 Prevent lost legacy member-state updates | Completed in production B1; regression required | B1 live release 2d5931d; unchanged atomic member-state module. |
| WR02 Make reset-token use atomic | Completed in production B1; regression required | B1 actual Inbox/reset/login proof retained; auth modules unchanged. |
| WR03 Assign and prove deletion-request fulfilment | Operational commissioning gate | Existing privacy-account-deletion.md requires human review and completion; no named privacy backup or completed drill located. |
| WR04 Make shop settlement and receipt recovery durable | Implemented locally; hosted/provider/operator verification pending | commerce-stripe-v1.js; tests/shop-recovery.test.mjs; 31 commerce/settlement regressions pass locally. |
| WR05 Resolve uncertain checkout creation before starting again | Implemented locally; hosted/provider verification pending | checkout-attempt-v1.mjs and both handlers; 8 local checkout failure/retry tests pass; LR-N02 included. |
| WR06 Resume and reconcile the existing partner journey | Partner-dependent; cannot commission without adapter contract | Issues #645/#647 remain open; contract/status/sandbox scope unverified. Existing holds preserved. |
| WR07 Align Orlistat pack, price unit and receipt | Implemented locally; hosted verification pending | Current rendered 42-pack mismatch and actual served controller inspected; bounded response transform. |
| WR08 Correct the free Health MOT call to action | Implemented locally; hosted verification pending | Current Centre CTA describes free assessment but points to home blood test; exact wording/link correction only. |
| WR09 Reconcile Foundayo status across existing pages | Implemented locally; hosted verification pending | MHRA source rechecked 21 September; remove Orforglipron from research-only list; preserve Foundayo route and OOS. |
| WR10 Close supported source access and exact changed-source review | External access/exact review gate remains open | Fresh issue reads #741/#743 retain exact-source review and NICE/GPhC supported-access dependencies. No holds bypassed. |
| WR11 Prove detection, alert receipt and recovery ownership | Missing payment signals implemented; human alert receipt unverified | commerce-recovery-health.mjs wired into existing Watchtower; query failure is unknown, not zero. No external alert drill sent. |
| WR12 Prove full-service data recovery | Isolated recovery proof prepared; full-service recovery unverified | preview/launch-readiness/restore-proof.mjs exports only fictional preview D1 and restores into local SQLite; managed restoration and other stores remain uncovered. |
| WR13 Verify real mail routing and human support promises | Human support routing/coverage unverified | B1 reset delivery proven previously; it does not prove orders/support/phone staffing or response times. |
| WR14 Substantiate clinical review, responsibility and public claims | Clinical/claim substantiation gate | Current commissioning source and partner issues do not substantiate operating agreements/reviewer coverage. No service activation or broad copy rewrite. |
| WR15 Test unproved device and assistive-technology states | Hosted browser/keyboard coverage queued; physical AT unverified | Photo readiness repair and retained B1 width/keyboard tests; no physical device or screen-reader access established. |
| WR16 Establish current indexing and route health evidence | Public discoverability confirmed; LR-N01 escalated | Search returned at least ten public URLs on 21 September. No deindexing, new sitemap or visibility change authorised. |
| WR17 Verify remaining data lifecycle and consent traffic boundaries | Existing privacy regressions queued; policy completion unverified | Local 277-case member/Passport/payment set passed; dedicated legacy My Why boundary and cross-store retention remain separate questions. |
| WR18 Measure capacity and knowledge retrieval completeness | Capacity unverified; bounded queue diagnostics added | Recovery counts inspect complete queues while detail lists expose oldest 100 explicitly. No throughput/load/SLA claim; representative load test remains required before growth. |
| WR19 Check budget matching with clean state | Investigate clean preference-budget journey | No new ranking defect asserted from the earlier contaminated-state observation; authoritative client and clean browser path to be checked. |
| WR20 Agree missing Continuity inputs and decision thresholds | Owner measurement decision; not a code defect | Mature cohort, exclusions and pre-agreed thresholds still required; no clinical efficacy or fabricated zero metrics. |
| WR21 Reconcile return-feedback issue #760 without rebuilding it | Existing implementation; browser regression queued | Fresh #760 confirms PR761 deployed and awaits owner live walk; do not rebuild. Existing five-points matrix repeats saved action/return feedback. |
| WR22 Determine the intended Lounge destination | Destination decision remains unverified | Existing Lounge naming/access/moderation sources inspected; do not change routes merely from historical conflicting labels. |
| WR23 Refresh source identity and expose preview/production differences | Current source confirmed; candidate release gates pending | Remote main 2d5931d/tree6fb57d7 matches local baseline; same pinned Pages source; preview config, build and source preservation recorded separately. |
| WR24 Reduce generic promotion on urgent-help reading paths | Optional; deliberately outside repair scope | No urgent-help promotion redesign made. |
| WR25 Richer operational dashboards or central tracing | Optional; no dashboard programme | Only demonstrated payment recovery signals added to existing monitor. |
| WR26 Activate clinical, medicine and home-testing supply | Deliberately held for commissioning | No partner/stock/payment flags changed. Agreements and complete sandbox journey required before activation. |
| WR27 Work expansion, deeper TRT, campaigns, new shelves and price-war work | Deliberately deferred | No new programme/workplace/TRT/campaign features. |
| WR28 Broad availability/price rewrites or removal of intended journeys | Protected; not an outstanding repair | No broad prices/availability/navigation rewrite; only WR07–09 corrections. |

Owners: Codex owns implementation/technical evidence; Matt owns business decisions, appointment of accountable operators/partners and acceptance. Specific human delegates remain unverified where stated. Optional/deferred items do not become implementation scope by appearing in this register.
