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
