# Start Here welcome — published and verified

Live URL: https://shiftsometimber.co.uk/start-here

Matt approved the revised welcome mock-up with the fuller bald/bearded hero, fuller kitchen subject and Black health-card subject, then explicitly instructed “Brilliant - get it live please” on 21 October 2026. He clarified that the standard shared header and full footer apply. Both are retained byte for byte from the upstream Start Here response.

Deployed source: 35f543b144d015054462f43703e5ca1b05516b1d, branch release/start-here-welcome-20261021. Worker: shift-start-welcome-presentation-20261021. Later evidence-only commits do not alter the deployed worker/content.

Arrival is an unpersonalised welcome: free My Timber, weight-loss route directly beneath, SHIFT Health and blood tests. No goal, budget or ticker is shown on arrival. The weight-loss CTA opens the questions; NHS, no-medication and private-information results explain the recorded choices. No medicine is selected or clinically recommended by price or goal. The current /join-my-timber registration destination and existing optional Health Passport tab-consent handoff are retained.

Validation: seven native boundary tests; four Chrome/WebKit390/1440 staged full functional passes; four final layout passes after a CSS-only lower-card spacing correction (identical client/main/worker proof retained); four live functional passes; seven destinations200; seven URL variants; five decoded photographs; menu, focus, selected preferences and no horizontal overflow. No account mutation or communications sent. Every unrelated Cloudflare route is preserved. Help, Health, Treatments and Ask Timber verified unchanged.

Six owned exact/wildcard routes cover canonical, www, slash, query and .html variants. Only successful GET/HEAD HTML Start Here is transformed; client/images are served inside its namespace. Other paths/methods delegate to Core. No homepage, header/footer, authentication, clinical assessment or payment change.

Exact rollback from the clean release worktree: node release/start-here-welcome-20261021/deploy.cjs rollback. Validates current ownership and removes only the six newly created routes. Full route IDs and original snapshot are retained here.

Next requested page: Good to Talk (/mens-mental-health), currently preparing a visual proposal for approval. Public content fetched21October into the existing programme-vision evidence directory. Do not publish that next proposal without its own approval. Full Core/TRT and verifier performance work remain separate; this presentation release does not claim them complete.

## 22 October feedback correction — live and verified

Supersedes the presentation deployment above for Start Here only. Worker `shift-start-welcome-spacing-20261022`, source `dc91c3b525110a57680a5a6b3be052b09b4642ef`, branch `fix/start-here-spacing-20261022`. The Explore your routes link explicitly scrolls and focuses the routes section without triggering the welcome view reset. Desktop hero is about 422px with a 32px positive gap; mobile photo is 190px with a 20px gap. Chrome/WebKit at 390px and 1440px passed staged and live first/repeated clicks, focus, quiz entry/back and overflow checks. Seven existing boundary tests passed. All unrelated Cloudflare routes were verified unchanged. Evidence in `spacing-20261022/`.

Rollback from this clean branch: `node release/start-here-welcome-20261021/deploy.cjs rollback` restores the six previous Start Here route bindings to the 21 October worker.

## 22 October destination clarification — verified live
Matt requested Explore your routes skip My Timber and land at weight loss, with health/bloods below. Moved the anchor to the weight-loss section with 90px header clearance. Source `6205c838c17ee595a0877d953ea835a751a2205b`; active worker `shift-start-welcome-routes-20261022`. Four staged and four live Chrome/WebKit mobile/desktop passes confirm My Timber is above the landing position, first/repeated clicks, focus and quiz navigation. Evidence: `route-target-20261022/`. Current deploy script rollback restores the preceding spacing worker.

## 22 October treatment comparison and BMI correction — live

Source 1804c1be7a6694e8d562afd04c325df3e277bb2d; active worker shift-start-comparison-20261022. Matt explicitly removed the budget question in favour of BMI screening. Three-step flow now includes treatment stage, BMI ranges, a local calculator and conditional diagnosed-condition question. No-medication skips the medicine screen. All six treatment information cards remain available; eligible initial BMI/format comparisons have direct medicine/strength links, outside-criteria cards explain the boundary without an order CTA, and continuing/unknown cases require review without assuming suitability. NHS funding is kept distinct. Inline details and switching information stay on the result page. Live prices are read without credentials from the existing public catalogue. No BMI answers are stored or submitted here.

The legacy optional Passport draft required a budget answer and could no longer work. Its injection is excluded on Start Here only; Passport/account pages are unchanged. Main and client blobs are unchanged between the full four-browser functional checks and the final layout/handoff-only revision. Seven native tests passed; Chrome/WebKit at 390/1440 passed full BMI branches and all six medicine links (all six destinations checked in Chrome desktop), plus final staged and live click-through/dose/calculator checks. No page errors; no horizontal overflow. Unrelated Cloudflare routes verified unchanged. Evidence in comparison-20261022. Staging uses candidate HTML/assets on the canonical browser origin with the real live API and order pages, because the API does not authorise workers.dev browser origins.

Clinical criteria align with existing medicine-commerce-v1.js bmiEligibility: standard 30, conditional 27 with a qualifying condition, orlistat conditional 28. References checked 22 October: https://www.medicines.org.uk/emc/product/2592/smpc ; https://www.gov.uk/government/news/mhra-authorises-diabetes-drug-mounjaro-tirzepatide-for-weight-management-and-weight-loss ; https://www.gov.uk/government/news/first-glp-1-tablet-for-weight-loss-approved-in-the-uk ; https://www.gov.uk/government/news/uk-first-in-europe-to-authorise-orforglipron-for-weight-management-and-type-2-diabetes . Continuing patients are told that starting BMI and treatment history need prescriber review, not given automatic approval.

PURCHASE LIMITATION: existing treatment-order prototype and integrated script both set orderingOpen=false. The selection controls work and new patients are restricted to starting doses; continuing users can select a dose for review. Payment remains disabled. Stock alone cannot open ordering. The backend prepay route also requires PHARMACY_PREPAY_VERIFICATION_URL and PHARMACY_INTEGRATION_SECRET; their production configuration has not been asserted. The legacy unreachable payment branch uses option.value where catalogue variant ID is stored in option.dataset.variantId, so merely flipping orderingOpen is not a valid completion. No clinical intake, payment, stock or paused Core deployment was changed or submitted. This release is not purchase-ready.

Current rollback command restores the six Start Here bindings to shift-start-welcome-routes-20261022.

## 22 October approved cream-card design — deployed and verified

Matt approved the compact cream-card mock-up and private interactive preview, then instructed “Let’s sort it” after confirming it was not on the public site. Public integration now complete. Source ffd557414a812f23fbf3b681384eaa1682b510e3; worker shift-start-cream-20261022; HTML header X-Shift-Treatment-Cards-Version: 20261022-cream-v1. This supersedes the comparison worker for the six Start Here routes only. The approved layout is inside the existing main; shared header/footer and the welcome/questionnaire remain upstream/scoped as before.

Result heading and answers are compact. All six cream treatment cards appear before the supporting explanation, with All/Jabs/Tablets controls and preferred format first. Images are the approved generic concept illustrations, explicitly labelled illustrative; they are not verified branded pack photographs. View doses & prices opens in the card. New patients use the starting strength; continuing patients can explore strengths and their live catalogue prices for prescriber review. Orlistat selects pack quantity at fixed 120 mg. Treatment information, switching and the next-step explanation open inline; NHS/no-medication routes and BMI boundaries remain. No budget question. No order, payment or health-answer storage was added.

Seven native boundary tests pass. Four staged Chrome/WebKit 390/1440 runs pass compact cream layout, option-before-explanation placement, images, no overflow, filters, independent card expansion, inline info/switching, new starting-dose lock, continuing price updates, BMI exclusion/orlistat distinction and unavailable ordering. Chrome mobile also checks NHS/no-medication and failed-catalogue fallback. Four targeted live runs pass the deployed layout, real catalogue, filters, images, dose lock, inline info and closed purchase controls. No page errors. Unrelated Cloudflare routes unchanged; canonical, slash, .html and www verified. Evidence: cream-cards-20261022/.

Ordering remains unavailable. The existing clinical-verification integration and stock/supply requirements are still outstanding; this presentation release does not open checkout, simulate purchases or claim the purchase path is complete. Prior checkout limitations above remain applicable.

Rollback from this clean branch: node release/start-here-welcome-20261021/deploy.cjs rollback restores the six prior bindings to shift-start-comparison-20261022.

## 22 October approved branded question flow — live, verified and closed

Matt approved the corrected SHIFT design and instructed “sort it formally and move on”. The approved private design source was 5f16f35a8438ec8f41788e5e2418042551171f30. Public source f662d14dfa98776bdc111bd4666b9f93ef0a29ec is now served by shift-start-questions-20261022 on the six Start Here bindings. X-Shift-Questions-Version is 20261022-brand-v1. Public verification completed 22/10/2026, 15:22:19 Europe/London.

The questions use SHIFT black, cream and ash green, stronger headings, cream selected answers, a visible three-step progress strip, retained choices, direct back/edit navigation and the mobile Continue control. They lead into the existing treatment results. Shared callout decorations are suppressed inside these answer tiles only. The public header/footer remain provided by the existing upstream shell. Welcome markup, result markup, medicine code and preceding styles are preserved; hashes are recorded in preservation.json. No health-answer storage, submission or clinical/payment changes were introduced.

Seven native boundary tests passed. Four staged and four live Chrome/WebKit checks at 390/1440 passed the question colours/layout, selected goals, required-choice feedback, progress/back/edit, conditional BMI, all six cream treatment options, filters, inline information, starting-dose lock and unavailable ordering. The staged checks also cover continuing dose/price changes, BMI branches, NHS/no-medication and failed-catalogue fallback. The live mobile check includes the local BMI calculator. No page errors or horizontal overflow. Canonical, slash, .html and www requests return the new release.

All original unrelated route bindings remained unchanged. A separate concurrent clinic-gone-quiet presentation release added six unrelated bindings during verification; these were preserved and recorded rather than mistaken for a Start Here change. The new question worker is bound only to the six approved Start Here patterns.

Evidence and acceptance sources: questionnaire-20261022/. The first fresh staging-URL probe briefly returned 404 after service creation; a read-only check confirmed 200 with the correct version before acceptance. Final staged/live acceptance concerns the exact source above.

Question-flow change: complete. Existing ordering/stock/clinical-verification boundaries documented above remain in force. The paused Core/editorial PR work was not changed or resumed.

Rollback from this clean branch: node release/start-here-welcome-20261021/deploy.cjs rollback restores the six previous Start Here bindings to shift-start-cream-20261022.
