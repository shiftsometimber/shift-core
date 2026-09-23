# My Timber — store release gates (all OPEN unless evidenced)

This candidate is not a submitted, approved or production-ready store app.
Android Release and iOS Release builds are intentionally blocked in source.
Only the app client is isolated: its current origin is the EXISTING LIVE SERVICE.
No new database is created. Do not run account-creation, notification, payment or
write tests against real members. A separately authorised fixture environment is
required for automated authenticated journey testing.

| Gate | Required evidence | Current status |
|---|---|---|
| Owner-controlled store accounts | Apple and Google organisation verification, assigned secure roles; app/package name availability | D-U-N-S confirmed; Apple Organisation enrolment submitted and processing authority verification; Google Play Organisation account created and document verification pending, owner-confirmed 23 Sep 2026 |
| Signing and identities | Team ID, bundle ID, Android Play signing; no secrets in repository/chat | Planned final ID `uk.co.shiftsometimber.mytimber`; not registered/signed yet |
| Native notifications | APNs/FCM transport, opt-in/out/time using existing member session; same saved-check-in suppression, revocation and deduplication; closed/locked physical iPhone AND Android receipt/tap/off | NOT implemented; UI explicitly says so; browser PWA unaffected |
| Login and security challenges | Physical phone login, Turnstile, cookie persistence, expiry, logout, forgot/reset, return destination | Not tested |
| My Timber functional parity | Real signed-in Today, check-in, Next Shift, did-it-help, Grub/Fit, progress, profile, address, orders and consents; cross-client save persistence | Not tested |
| Recovery/links/uploads | Verified Universal/App Links; native back; target=_blank/popups; selected photo upload and capture; keyboard/safe areas; interrupted forms; no duplicate payments | Not tested; email reset remains in browser until verified links are commissioned |
| Privacy/account deletion | Inventory includes remotely loaded code, cookies, analytics and health data; accurate store disclosures; working in-app deletion initiation and external deletion URL; owner/regulatory review as applicable | Existing authenticated My Timber deletion-request flow documented in `docs/privacy-account-deletion.md`; store-visible in-app path, external deletion URL and disclosure inventory still require device/store verification |
| Commerce | Audit EVERY reachable paid digital entitlement/subscription and physical-goods path; applicable store billing rules and clinical handoff reviewed | Not cleared; no new checkout/billing workaround |
| App review | Meaningful app functionality and reviewer access; health-app declarations, disclaimers/review; any UGC/AI moderation requirements | Not cleared; matching the PWA is not an acceptance guarantee |
| Icon and listings | Original approved S-in-circle, high-resolution source, launcher masks, genuine device screenshots and accessible copy | Asset fetch records hash; existing PNG may need original high-resolution artwork; never redraw |
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
