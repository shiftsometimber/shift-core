# My Timber widget compatibility — 15 October 2026

Existing A024 follow-up, not a new workstream or release lane. This reconciles original543a5610 widget source with native owner3bbda423 build5/iOS27 scene repair. The original source/record and all failed-attempt evidence remain.

## Implemented

Data-free Today, Progress and Grub home-screen access. iOS cold and warm widget URLs now enter SceneDelegate rather than the obsolete AppDelegate lifecycle. Closed exact route allowlist rejects query/fragment/userinfo/port/path variants. A foreground switch asks Open/Stay here before discarding a form. Existing scene privacy cover and notification handling, HealthKit, reminders, PDF and source account/transport policies stay intact. Android retains its existing treatment-reminder fallback while adding the bounded shortcut route. No health values, medicine, account, shared record storage, network refresh or AI is introduced into widgets. The widget is a shortcut surface; it is not a personalised health dashboard.

## Actual checks

23 source/privacy/scene tests pass; compiled actual Swift policies pass34 original navigation cases,3 widget destinations and17 rejected variants. Four actual Android XML documents parse. Xcode27 compilation of the unsigned Simulator app and embedded WidgetKit extension succeeded; generated bundles retain version5, separate dev app/widget IDs, scene configuration, usage text and the exact URL scheme. The original HealthBridge, TreatmentBridge, AppDelegate, health entitlement and injected health/treatment scripts remain byte-identical to3bb. Companion JSON contains exact timestamps, commands and log hash. Initial rejected patch and missing-scene test are preserved in that receipt. Whitespace-only cleanup and generated-plist ignore were added after the successful build; runtime source bytes are the compiled bytes.

## Reproduce

node --test my-timber-app/tests/source.test.mjs my-timber-app/tests/health-bridge.test.mjs my-timber-app/tests/treatment.test.mjs my-timber-app/tests/widget-source.test.mjs my-timber-app/tests/widget-scene-source.test.mjs
python3 my-timber-app/tests/widget-policy.py

Use the existing approved icon with prepare.py, the pinned existing XcodeGen2.46.0 and the exact xcodebuild command in the JSON. No online account, payment, health record or signed-in page is needed for these checks.

## Still open

This is an unsigned Simulator compile, not an installed Simulator run, physical device result, signed archive or store build. simctl reports no available Simulator devices/runtimes. The existing Mac has no Java Runtime, Android SDK or adb; Android build/installed behaviour is unperformed. Keep the native owner's repaired build5/archive/recording untouched. Native owner must admit this finite source against its actual current binary, resolve extension provisioning in its existing signing lane and run the original cold/warm tap, session, unsaved-form and privacy/account-isolation device cases before any approved upload. Build metadata remains5 only as a source baseline; a new distributed binary needs its owner's next build number and exact review. No branch/ref, installed app, tester, signing/profile, provider, release setting, website, stock, consent, account or external communication changed.
