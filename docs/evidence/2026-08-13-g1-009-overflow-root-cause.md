# G1-009 authenticated overflow root cause

Date: 2026-08-13

Status: AMBER. Root cause is isolated; production repair and unchanged RC proof remain required.

Production evidence run `31680649245` retained authenticated-rendered, public-rendered, overflow-diagnostic and live-static-source artifacts.

The direct authenticated trace shows the same shared surplus across representative member routes: 1440px viewport -> 1460px scroll width (20px overflow), and 390px viewport -> 478px scroll width (88px overflow).

The top right-edge contributor on every affected route is the closed Ask Timber drawer `#askTimberDrawer.ask-drawer` and its descendants. The captured production `styles.css` positions the closed drawer with `right:0` and `transform:translateX(105%)`. That places the drawer beyond the viewport while it still contributes to scrollable document geometry.

This evidence narrows the defect from the member product grid to a shared global closed-drawer rule.

Do not hide the defect with a global overflow mask. The authoritative frontend fix must keep the closed drawer from extending scrollable geometry while preserving the intended premium open/close interaction. After the source fix, rerun the unchanged Chromium/Firefox/WebKit desktop + 390px authenticated RC and retain evidence before any PASS promotion.

Two related rendered observations remain in the same lane: `#sstMemberNotice` has reproduced pointer interception, and the authenticated member top-navigation My Shift destination has resolved to the sign-in path. These require source repair and unchanged rendered proof as well.

The current `shift-core` and `shift-hq` source trees do not contain the deployed `projectshift` public/member static source, so diagnosis alone cannot close G1-009. Historic release evidence confirms the public site is a separate Cloudflare Pages direct-upload estate rather than the Shift Core API Worker.

Commissioning decision: authentication/session stays GREEN; root-cause diagnosis is PROVEN; G1-009 remains AMBER; RC remains NOT READY.
