# REC-034A — Complete the approved header on sign-in

Matt approved B, the fine underline, and the revised menu: “ok agreed - revised menu also ok”. His scope explicitly covers every page.

Pages release c733bf03834d93154a51a0db6ef05dbebb3c7cb3 is live at https://0da69833.projectshift.pages.dev, fingerprint 1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0. Public shared headers, dashboard, Fit and Grub were confirmed in the browser. The final sweep found /member-login serves a separate Worker-owned shell containing the old global navigation.

Before editing this additional surface: use only current core main b3b86d41d1283d08e7b1e464f72e7aa72fa5b082, Worker version 24d239bc-a944-4ec8-986b-b0660faf8ff2. Original auth HTML Git blob 7f475f03ae25a67cedcc196eb54519c66fb88e09.

Change only frontend/member/my-timber-preview.html: replace the old global header, stacked public links and global menu with the approved shared header/drawer/backdrop; include the already deployed navigation stylesheet and existing canonical menu script; add scoped header/drawer base layout because this independent shell lacks the public base CSS. Preserve every byte of authentication, forms, portal tabs, recovery, consent and all existing scripts. Normalisation is checked against the exact base commit.

Routes: /member-login, /member-register, /my-timber-preview and existing aliases. No routing or backend logic changes. Dashboard/Fit/Grub stay on their newer Pages routes.

Update my-timber-navigation-gate.mjs only for approved primary/menu destinations and logo. All account, portal, same-origin, remember-me, duplicate-cookie and route checks remain. Add source preservation and GET-only live verification. Existing security/member/source checks remain required.

Deploy from an isolated current-main branch using unchanged Worker configuration/runtime, after a fresh main SHA and active Worker-version check and rollback capture. No database migrations, account writes, stock activation, Newsroom changes or old recovery-branch merge.

Rollback: current core main and recorded active Worker version. Only one deployed asset changes. Pages fingerprint must remain unchanged.

The interactive execution environment disconnected after the Pages live browser checks. Additional source work is through repository tools and CI; do not claim a new browser-rendered auth-shell check until reconnected.

## Final production lock

- Public Pages source: c733bf03834d93154a51a0db6ef05dbebb3c7cb3; tree 3899700e9b4687704f35a8b53029d6e6901d605d.
- Public Pages deployment: https://0da69833.projectshift.pages.dev.
- Public Pages fingerprint: 1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0.
- Source payload: b79662f629b04c93bb2ae6be2e9ce8905101eb181926ffce9b37f39680707389.
- Public shared templates: 438; existing files changed: 440 including two tracking manifests; added: one CSS file; removed: none. All non-navigation page bytes and scripts preserved.
- Exact hosted preview passed in read-only run 34721932486. Production Pages upload run 34721997106 succeeded; its final sweep caught the separate sign-in shell and is not misreported as an entirely successful run.
- Core auth-shell source: cfedfa3458d4e1540aeef1d2e149238121f46892 rooted in current core main, never the older Pages recovery branch.
- Core Worker version: 9c4ee3e3-b3e2-40e7-b161-097ca929c6fe. Exactly one Worker static asset uploaded; backend/configuration and all authentication logic unchanged.
- Core source/security/member/navigation/clinical contracts passed in run 34722551929. Its immediate after-upload check saw the previous sign-in shell while the release propagated.
- Final read-only verification commit bacc819c5c254b8d66421ef5ab6f3afca3a2a503; run 34722655063; job 103631223951: SUCCESS.
- Final proof: sign-in, registration and their shared shell exactly match committed HTML; approved five primary and 14 menu links; 13 representative public routes plus four menu/journey/security assets preserved byte-for-byte; Pages fingerprint unchanged; live health/Fit/Grub modules match source; unauthenticated member API requests remain 401.
- Public browser checks before the execution environment disconnected: 76px fine-underline header, exact primary/menu order, open/close, Escape returning focus, SHIFT for Work click; dashboard, Fit and Grub show the new header. Accepted 390px/360px previews retain the exact shared CSS. No Safari/physical-device claim. No additional rendered auth-shell claim: final auth verification is exact HTML/source/security and live GET evidence.
- Source reconciliation: fast-forward current core main to the already deployed and verified branch, with this documentation-only closeout. The closeout uses GitHub's normal skip-CI commit marker solely to prevent a redundant production deployment and the unrelated automatic Newsroom/database migration pass. All required source/security tests and the final live verification already passed on the identical deployed code; no branch rule, workflow, approval or permission is disabled or changed. Current main is unprotected and the repository has no rulesets. Use a non-forced fast-forward only; stop if main has moved.
- Existing invalid act2b-one-shot.yml workflow produces a separate no-jobs failure; it remains unchanged and is not reported as passed.
- Next release must start from this current core main plus the recorded current Pages source. Never redeploy the pre-header core or REC-032 Pages baseline as current.
- Preserve the locked quiz-to-full-detail workspace and H1: “Based on your answers, this could perhaps work for you…”. Preserve medication switches, imagery, Choose → Verify → Pay → Review, pricing/clinical/stock controls and no homepage ticker.
- Newsroom publication and UK scanner changes remain outside this header release. No articles, stock, payments or member records changed.
