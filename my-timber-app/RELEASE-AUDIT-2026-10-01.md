# My Timber native release audit — 1 October 2026

Status: **BLOCKED from Apple response/replacement submission until build 2 physical-device acceptance is complete.**

This audit was opened after the first real TestFlight registration attempt on a physical iPhone exposed a native WKWebView / Cloudflare Turnstile incompatibility. A green website or Chromium journey is not evidence that the native shell works on iPhone.

## Evidence classes

- **PHYSICAL PASS** — observed on the exact signed TestFlight/store candidate on a real device.
- **NATIVE CI PASS** — native source/policy tests and platform compile/build passed for the exact commit, but no real-device claim.
- **WEB PASS** — production browser/service journey passed, but not proof of WKWebView/Android WebView behaviour.
- **OPEN** — requires exact signed-device evidence.
- **FAIL** — directly observed failure.

## Physical evidence from build 1

| Area | iPhone build 1 | Evidence |
|---|---|---|
| Install / cold launch | PHYSICAL PASS | TestFlight build installed and My Timber opened to the branded auth screen. |
| Auth layout / keyboard / safe area | PHYSICAL PASS | Recording shows usable form, keyboard and controls without obvious clipping. |
| Registration / Turnstile | **FAIL** | Create account remains on Cloudflare “Verifying…” / “Creating your account…”. |
| Everything after registration | OPEN | Could not honestly test beyond the failed security challenge. |

## Root cause and build 2 correction

PR #884, branch `fix/my-timber-turnstile-webview-20261001`.

- iOS subframes permit only the Turnstile-required `about:blank` and `about:srcdoc` exceptions in addition to HTTPS. Top-level navigation policy remains restricted.
- Android applies the same bounded subframe exception.
- Android third-party WebView cookies are enabled for Turnstile challenge state.
- App candidate advanced to iOS build 2 / Android versionCode 2.
- Dedicated My Timber native readiness workflow now runs on pull requests.
- Master integration PR adds a macOS/Xcode native iOS compile job.
- iOS v1 candidate narrowed to **iPhone portrait only**; untested iPad/landscape support is not advertised in build 2.
- No production/App Store deployment is performed by these changes.

## What the existing production browser evidence does prove

The production website/browser commissioning already exercises a synthetic member at phone dimensions and has direct evidence for:

- member details and address persistence;
- logout and fresh login;
- Today rendering and zero horizontal overflow;
- explicit Grub choice feeding Today;
- Fit plan generation and Today → Fit handoff;
- Journey/Progress/Check-in/Grub/Fit/Settings page rendering;
- wider auth, persistence, security and privacy service contracts.

These are **WEB PASS**, not native-device PASS.

## Native compatibility review

| Area | Current audit status | Notes / required proof |
|---|---|---|
| Turnstile registration | FIXED IN PR / OPEN PHYSICAL | Re-run on build 2 iPhone. |
| Sign in | OPEN PHYSICAL | Includes Turnstile and session-cookie persistence. |
| Email verification | WEB/SOURCE PASS / OPEN PHYSICAL | Production has AUTO_VERIFY_EMAIL=false. Verification link opens outside the app, then redirects to web login; reopen app and sign in must be proven. |
| Keep me signed in | OPEN PHYSICAL | Close/reopen exact signed app and verify session. |
| Logout | WEB PASS / OPEN PHYSICAL | Verify protected native view is unavailable after sign-out. |
| Forgot/reset password | WEB/SOURCE PASS / OPEN PHYSICAL | Reset email/browser handoff and return to app must be exercised. |
| Today | WEB PASS / OPEN PHYSICAL | Exact WKWebView rendering/taps required. |
| Check-in / Next Shift / did-it-help | WEB/SERVICE PASS / OPEN PHYSICAL | Save, close/reopen and read-back required. |
| My Journey | WEB PASS / OPEN PHYSICAL | Edit/save/pause/reset/delete Journey on fixture account. |
| Journey export / print | **NATIVE RISK / OPEN** | Web UI uses blob downloads and print. Native shells do not yet have evidenced export/download/print handling. Do not call this passed. |
| Grub | WEB PASS / OPEN PHYSICAL | Build/rebuild/select meal and return to Today. |
| Fit | WEB PASS / OPEN PHYSICAL | Build session, image load and return path. |
| Progress photo picker | WEB/SOURCE PASS / OPEN PHYSICAL | iOS file/camera chooser, preview, resize, upload, display and delete must be run on-device. |
| Android live camera capture | **NATIVE GAP / OPEN** | Current Android file chooser uses ACTION_OPEN_DOCUMENT and does not honour capture intent as a live-camera flow. Must be fixed or explicitly removed from native v1 before Play release. |
| Member details / GP / address | WEB PASS / OPEN PHYSICAL | Save then reload and fresh login. |
| Orders | WEB PASS / OPEN PHYSICAL | Empty and fixture order states; external tracking handoff. |
| Consents | WEB/SERVICE PASS / OPEN PHYSICAL | Toggle/save/read-back. |
| External HTTPS / mail / tel | SOURCE PASS / OPEN PHYSICAL | Confirmation and system handoff on iPhone. |
| Stripe / commerce handoff | OPEN | Core My Timber does not require purchase, but every reachable checkout/return path must be reviewed separately before store claim. |
| Account deletion | WEB/SOURCE PASS / OPEN PHYSICAL | Use disposable account; request must confirm received and revoke current sessions. |
| Offline/timeout | SOURCE PASS / OPEN PHYSICAL | Must not claim save or replay POST/payment. |
| App-switcher privacy | SOURCE PASS / OPEN PHYSICAL | iOS privacy cover exists; verify visually on signed build. |
| Accessibility / Dynamic Type / zoom | OPEN PHYSICAL | Basic real-device check required. |
| Store screenshots / Apple recording | BLOCKED | Capture only after exact build 2 physical matrix is green. |

## Release rule from this point

No Apple “information supplied”, replacement build, review reply or release claim until:

1. exact build 2 passes native CI;
2. exact signed build 2 is installed through TestFlight;
3. the complete iPhone acceptance journey is physically run;
4. every failure found is fixed in the same candidate and affected tests repeated;
5. Apple evidence is captured only from that accepted candidate.

A green source/CI test may be described only as source/compile evidence. It must never again be described as proof that the physical app works.
