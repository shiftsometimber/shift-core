# Release takeover — 21 September 2026

Matt authorised takeover and deployment, prioritising the dedicated Ask Timber page and protecting the working bottom-right pop-up. This supersedes earlier preview-only approval wording for these named repairs; all verification gates remain required.

Authority: `shiftsometimber/shift-core`. The inherited launch candidate is `e81fbb5ff6aca070273cb21278b957f91d0b50a4`, whose hosted run 35631187551 completed successfully. Current main is `25ac6410861bb57a15fcac3620b73a76c9e759f1`, including the Ask Timber repair and the independently authorised BabyLove article/image/arrival-email updates. The integration preserves both histories and their changes. Pages stays at deployment `0da69833-83f7-4c70-9c7a-bceab7de1660`; no historical archive becomes source.

Acceptance before further release:

- The complete existing audit preview matrix passes on the combined candidate: real isolated D1 save/reset/login races, payment atomicity/retry, Today/check-in/action/feedback persistence, retained Fit/Progress, consent/deletion boundaries, photo failure/retry and the three bounded treatment-copy corrections.
- Ask Timber's public request and private-history boundaries, relevance, failure/retry and source regressions pass. Its application files must remain byte-identical to current main. Its earlier desktop/phone Chromium/WebKit proof remains attributable to PR779; post-release checks must confirm the dedicated page and unchanged pop-up on production.
- Preserve current article images and arrival-email handling; repeat their regression tests. No actual customer email, payment, stock, provider or pricing activation is part of this work.
- Pin the combined application commit, retain the fail-closed scope guard, check current main immediately before deployment, capture rollback identity and prove protected catalogue/configuration fingerprints unchanged.
- Verify actual production outcomes before closure. An uploaded Worker alone does not close a failed verification step. Real provider commissioning, qualified clinical review, named human coverage, physical-device/assistive-technology evidence and full-service restore retain their existing explicit holds.

The existing operational register and owner/completion criteria remain in force. New findings are separate from already verified repairs. The live pop-up was exercised before release with the exact reported question and returned Knowledge Hub links; its client is unchanged.
