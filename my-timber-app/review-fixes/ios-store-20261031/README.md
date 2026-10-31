# iOS-only store presentation correction

Prepared correction package; not integrated, built, signed, uploaded or submitted.

The installed iOS app does not need the welcome page's app-install cards. This package removes that section and updates only its phone FAQ. Android and shared web resources remain unchanged.

Run `node --test test-store-presentation.mjs` for the eight isolated unit cases. This is not WKWebView or physical-device acceptance.

`apply-to-build7.py /path/to/my-timber-app` refuses to write unless the three matching build-7 resource hashes, native version and widget project are present. It then adds an iOS-only resource copy and document-start script hook. Restore and verify the complete matching sources before applying. Do not build from an older native project. Select the next unused build number only after checking App Store Connect.

After integration, compile/sign/export, verify the generated IPA, and test the actual iOS welcome screen, login/logout, layout and unchanged native features before any submission.
