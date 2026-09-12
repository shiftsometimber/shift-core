# REC-034 — Approved compact header

Matt approved B, the fine underline, and the revised menu: “ok agreed - revised menu also ok”.

Scope: 438 shared-header templates, exact reviewed navigation stylesheet and release tracking metadata. Five primary links then Menu; all 14 menu destinations retained, first five then alphabetical. No non-navigation page content or script changes.

Baseline: REC-032 commit 2aa7aaf7c82be0ede704f657db8db8d550cf0287; fingerprint b442d929e95a45662af1f5b94e985811cf6726aa16b2f18818e5d8f1f172ebdb. Separate core main stays b3b86d41d1283d08e7b1e464f72e7aa72fa5b082.

Candidate: 1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0. Deterministic payload b79662f629b04c93bb2ae6be2e9ce8905101eb181926ffce9b37f39680707389. All 877 source files verified. Existing build, SEO/body integrity and fingerprint gates pass. The initial pre-refresh integrity assertion correctly rejected the stale body manifest; only reviewed metadata was regenerated.

Accepted browser preview: desktop 76px, mobile 64px; all three styles reviewed, selected B. 390px/360px Chromium frames, ordered menu, open/close, Escape focus return, SHIFT for Work navigation checked. No Safari or physical-device claim.

Release first uses existing Pages preview channel, then production mode only after exact fingerprint and browser checks. The unchanged assembly gates reject a moved production baseline or mismatching approved preview. Required Treatments and Timber Mill assertions accept their current-page ARIA attribute. No preview harness or form guard is included.

Excluded: Worker changes, core-main merge, Newsroom publication, account/clinical/pricing/payment/stock changes. Rollback source is the exact REC-032 baseline, not an older archive.

Final hosted preview: https://03c1913c.projectshift.pages.dev. Exact source reproduced by preview upload run 34721772203. Redirect-aware read-only verification run 34721932486 PASS: all 438 routes resolve to exact approved served-template hashes and correct navigation; retained routing unchanged. Hosted browser confirms 76px underline header, exact menu, open, Escape/focus and SHIFT for Work click. Desktop screenshot captured. Candidate CSS and HTML match the earlier accepted 390px/360px browser previews byte-for-byte. Production promotion is authorised by Matt's explicit OK and publishes this exact candidate.
