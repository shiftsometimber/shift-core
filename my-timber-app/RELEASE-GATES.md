# My Timber — store release gates (all OPEN unless evidenced)

This candidate is not yet submitted or store-approved. Final v1 store identifiers are prepared and unsigned Release configurations are compiled in CI; store signing/upload remains account-gated.
Only the app client is isolated: its current origin is the EXISTING LIVE SERVICE.
No new database is created. Do not run account-creation, notification, payment or
write tests against real members. A separately authorised fixture environment is
required for automated authenticated journey testing.

| Gate | Required evidence | Current status |
|---|---|---|
| Owner-controlled store accounts | Apple and Google organisation verification, assigned secure roles; app/package name availability | D-U-N-S confirmed; Apple Organisation enrolment submitted and processing authority verification; Google Play Organisation account created and document verification pending, owner-confirmed 23 Sep 2026 |
| Signing and identities | Team ID, bundle ID, Android Play signing; no secrets in repository/chat | Final source ID `uk.co.shiftsometimber.mytimber`; unsigned Release compile enabled; store registration/signing still account-gated |
| Native notifications | v1 scope must be truthful | Deliberately outside store v1: native app hides PWA-only install/reminder controls; PWA reminders remain unchanged. Do not claim native reminders in v1 listing. |
| Login and security challenges | Physical phone login, Turnstile, cookie persistence, expiry, logout, forgot/reset, return destination | Not tested |
| My Timber functional parity | Real signed-in Today, check-in, Next Shift, did-it-help, Grub/Fit, progress, profile, address, orders and consents; cross-client save persistence | Not tested |
| Recovery/links/uploads | Verified Universal/App Links; native back; target=_blank/popups; selected photo upload and capture; keyboard/safe areas; interrupted forms; no duplicate payments | Not tested; email reset remains in browser until verified links are commissioned |
| Privacy/account deletion | Inventory includes remotely loaded code, cookies, analytics and health data; accurate store disclosures; working in-app deletion initiation and external deletion URL; owner/regulatory review as applicable | Existing authenticated Settings deletion flow documented; PR #803 prepares public `/account-deletion` and `/my-timber/privacy`; live 200 + signed-device verification still OPEN |
| Commerce | Audit EVERY reachable paid digital entitlement/subscription and physical-goods path; applicable store billing rules and clinical handoff reviewed | Not cleared; no new checkout/billing workaround |
| App review | Meaningful app functionality and reviewer access; health-app declarations, disclaimers/review; any UGC/AI moderation requirements | Not cleared; matching the PWA is not an acceptance guarantee |
| Icon and listings | Original approved S-in-circle, high-resolution source, launcher masks, genuine device screenshots and accessible copy | Exact approved S mark + official wordmark locked into native startup; listing/reviewer copy prepared; genuine signed-device screenshots remain OPEN |
| Release | Full matrix on exact candidate; resolve regressions in same branch; approve before signing/submission; store decision separate | No main merge, Cloudflare release or store submission authorised here |

# Source references checked 23 September 2026

Owner confirmed an existing D-U-N-S number on 23 September 2026. The number itself is intentionally not stored in source, chat evidence or logs.

- Apple review guidelines: https://developer.apple.com/app-store/review/guidelines/
- Android WebView: https://developer.android.com/develop/ui/views/layout/webapps/webview
- Android security: https://developer.android.com/privacy-and-security/security-tips
- Build tool compatibility: https://developer.android.com/build/releases/agp-8-13-0-release-notes
- Capacitor server config: https://capacitorjs.com/docs/config

The existing app is server-rendered. This preview deliberately uses native
WKWebView/Android WebView clients rather than pretending Capacitor's development
server.url setting is a production-ready frontend migration. No privileged
native JavaScript bridge is attached to remote content. This is an implementation
choice for the candidate, not a claim that App Store review is already satisfied.
