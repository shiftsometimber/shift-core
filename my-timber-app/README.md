# My Timber — isolated native app candidate

**Name:** My Timber. **Product specification:** the existing My Timber PWA.
**Entry:** `/member/dashboard#today`. **Source baseline:**
`shiftsometimber/shift-core@f3a98e20dc7e26981f46e1cba7de6ab569234ef1`.

## What this candidate actually contains

An Android Java/WebView project and an iOS Swift/WKWebView project which open the
existing My Timber interface, not a copied dashboard. The website, PWA, backend,
member records, prices, stock and production deployment files are unchanged.
The app uses the same service and member credentials, but has its OWN cookie
session: a browser login does not automatically sign you into the native app.

The exact approved icon is fetched from the existing owned PNG asset; its hash
and original dimensions are recorded. No replacement logo is drawn. The only
web presentation adaptation removes redundant installation guidance in the app
and honestly identifies the NOT-YET-CONNECTED native reminder feature. It does
not change Today, Grub, Fit or member functions. The existing PWA stays available.

**This is a preview foundation, not full feature parity or a store release.**
Native reminders are not wired to APNs/FCM. Store identities, signing, verified
links and physical-device authenticated acceptance remain open. See
`RELEASE-GATES.md`. Release configurations fail deliberately until those gates
are reviewed. Nothing here submits to Apple/Google or deploys Cloudflare.

## Important data boundary

The code branch and application identifier are isolated; the default URL points
to **the LIVE My Timber service**. Existing member accounts/data are not copied.
Automated tests must stay signed out and must not create members, send pushes,
place orders or make payments. Do not treat this as an isolated staging database.
Only consenting testers should manually use their own account. Capture no member
health data, credentials, reset links or payment details in evidence/screenshots.

## Local checks (no network, no external packages)

Requirements: Node 22+, JDK 17+, Swift 5.7+ and Python 3.
From this directory:

```
node --test tests/source.test.mjs
python3 tests/run-policies.py
```

Those checks compile the actual shared navigation policies and test source and
presentation behaviour. They do NOT compile the Android/iOS UI or prove delivery,
login, saved data, device installation or App Store approval.

## Android debug build

Requirements: Gradle 8.13, JDK 17, Android SDK 36/build-tools 35.0.0.

```
python3 scripts/prepare.py --platform android
cd android
gradle --no-daemon :app:assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.
Application ID: `uk.co.shiftsometimber.mytimber.preview` (not a reserved store ID).
The APK is development-signed, not Play-signed. Debug screenshots are allowed
for signed-out proof; release source protects screen capture. No broad storage,
location or unsolicited notification permission is requested. Use the system
file picker; direct camera capture remains a parity test gate.

## iOS simulator build

Requirements: macOS, Xcode with a current iOS simulator SDK, and XcodeGen.

```
python3 scripts/prepare.py --platform ios
cd ios
xcodegen generate
xcodebuild -project MyTimber.xcodeproj -scheme MyTimber \
  -configuration Debug -sdk iphonesimulator -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO build
```

Output: `ios/build/Build/Products/Debug-iphonesimulator/MyTimber.app`.
This is a **simulator app**, not an installable iPhone IPA or a TestFlight build.
Real-device testing requires the owner's signing setup. No Team ID or signing
identity is invented. Resource generation uses macOS sips to size the existing
icon; low-resolution source artwork remains a store-quality gate.

## Safety and failure handling

Top-level native navigation trusts only the exact owned HTTPS origin. Other
secure web/phone/email links require confirmation and open in the system app.
Untrusted URL schemes, credentials in URLs and insecure connections are denied.
There is no remote-content-to-native privileged bridge. Existing same-origin
forms/cookies use the website unchanged, without copying or rewriting auth.
Offline failures never claim a save and never automatically replay a POST.
Returning to Today is an explicit, confirmed GET navigation.

The build workflow has read-only repository permissions and no production or
store credentials. It produces debug/simulator artifacts only. Source, asset
hashes, actual tool versions and build logs form the evidence; green source tests
alone must never be labelled “the app works on both phones”.
