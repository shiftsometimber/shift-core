# My Timber v1 — exact-candidate acceptance matrix

No row may be marked PASS from a simulator/source test alone when it names a
physical device. Use one disposable authorised fixture member; never real member
data. Record app version/build, OS/device, timestamp and result.

| Area | iPhone signed build | Android signed build | Required result |
|---|---|---|---|
| Cold launch | OPEN | OPEN | Locked startup plays once, then Today/login; no white flash/crash |
| Fresh login | OPEN | OPEN | Turnstile/auth succeeds; no browser loop |
| Session persistence | OPEN | OPEN | Close/reopen retains valid session; expiry is truthful |
| Logout | OPEN | OPEN | Session revoked; protected pages unavailable |
| Forgot/reset password | OPEN | OPEN | One reset link -> one change; safe return destination |
| Today | OPEN | OPEN | Correct current Today spine, no PWA install card |
| Check-in save | OPEN | OPEN | Save persists after refresh/reopen |
| Next Shift | OPEN | OPEN | Correct next step after saved check-in |
| Did-it-help | OPEN | OPEN | Save persists after refresh/reopen |
| Progress | OPEN | OPEN | Existing fixture progress renders; save contract preserved |
| Grub | OPEN | OPEN | Current member Grub experience usable |
| Fit | OPEN | OPEN | Current member Fit experience usable |
| Member details | OPEN | OPEN | Read/save manual address + GP fields correctly |
| Orders | OPEN | OPEN | Fixture order surface renders without leakage |
| Consents | OPEN | OPEN | Existing choices render/save correctly |
| Upload picker | OPEN | OPEN | User-selected supported image/file reaches intended flow |
| Camera path | OPEN | OPEN | If offered, permission/use/failure are truthful |
| External links | OPEN | OPEN | Confirmation then safe handoff; no privileged bridge |
| Back navigation | OPEN | OPEN | No trap, accidental resubmit or duplicate write |
| Offline/timeout | OPEN | OPEN | No false save; recovery does not replay POST/payment |
| Payment route | OPEN | OPEN | Exact reachable route reviewed; no duplicate payment |
| Account deletion | OPEN | OPEN | Settings control discoverable; disposable fixture only |
| Public privacy URL | OPEN | OPEN | /my-timber/privacy returns 200 after PR #803 release |
| Public deletion URL | OPEN | OPEN | /account-deletion returns 200 after PR #803 release |
| Screen privacy | OPEN | OPEN | Sensitive app content not leaked in app switcher/release capture |
| Accessibility basics | OPEN | OPEN | Dynamic text/zoom, focus, labels and tap targets usable |
| Store screenshots | OPEN | OPEN | Captured from this exact signed fixture candidate |

Native check-in push is outside v1 unless separately implemented and evidenced.
The installed PWA remains available with its existing reminder feature.
