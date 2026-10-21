# Start Here welcome — published and verified

Live URL: https://shiftsometimber.co.uk/start-here

Matt approved the revised welcome mock-up with the fuller bald/bearded hero, fuller kitchen subject and Black health-card subject, then explicitly instructed “Brilliant - get it live please” on 21 October 2026. He clarified that the standard shared header and full footer apply. Both are retained byte for byte from the upstream Start Here response.

Deployed source: 35f543b144d015054462f43703e5ca1b05516b1d, branch release/start-here-welcome-20261021. Worker: shift-start-welcome-presentation-20261021. Later evidence-only commits do not alter the deployed worker/content.

Arrival is an unpersonalised welcome: free My Timber, weight-loss route directly beneath, SHIFT Health and blood tests. No goal, budget or ticker is shown on arrival. The weight-loss CTA opens the questions; NHS, no-medication and private-information results explain the recorded choices. No medicine is selected or clinically recommended by price or goal. The current /join-my-timber registration destination and existing optional Health Passport tab-consent handoff are retained.

Validation: seven native boundary tests; four Chrome/WebKit390/1440 staged full functional passes; four final layout passes after a CSS-only lower-card spacing correction (identical client/main/worker proof retained); four live functional passes; seven destinations200; seven URL variants; five decoded photographs; menu, focus, selected preferences and no horizontal overflow. No account mutation or communications sent. Every unrelated Cloudflare route is preserved. Help, Health, Treatments and Ask Timber verified unchanged.

Six owned exact/wildcard routes cover canonical, www, slash, query and .html variants. Only successful GET/HEAD HTML Start Here is transformed; client/images are served inside its namespace. Other paths/methods delegate to Core. No homepage, header/footer, authentication, clinical assessment or payment change.

Exact rollback from the clean release worktree: node release/start-here-welcome-20261021/deploy.cjs rollback. Validates current ownership and removes only the six newly created routes. Full route IDs and original snapshot are retained here.

Next requested page: Good to Talk (/mens-mental-health), currently preparing a visual proposal for approval. Public content fetched21October into the existing programme-vision evidence directory. Do not publish that next proposal without its own approval. Full Core/TRT and verifier performance work remain separate; this presentation release does not claim them complete.
