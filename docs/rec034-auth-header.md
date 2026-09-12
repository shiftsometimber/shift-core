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

Release update: all source, navigation, account, recovery, security, journey and treatment gates PASS. Fresh baseline/version gate PASS. One auth-shell asset uploaded; Worker version 9c4ee3e3-b3e2-40e7-b161-097ca929c6fe, source cfedfa3458d4e1540aeef1d2e149238121f46892, run 34722551929. The immediate two-second public check still saw the old sign-in header. A read-only verification workflow now downloads the original before evidence and rechecks the existing deployment after propagation; no second upload or database action.
