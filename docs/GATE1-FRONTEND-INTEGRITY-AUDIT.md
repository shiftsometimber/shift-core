# Gate 1 Frontend Integrity Audit

Baseline inspected: public-site package `ShiftSomeTimber-V3.3F-AUTH-COMPLETE.zip` from the active project workspace.

## Root cause found

The frontend did not have one authoritative API client.

- 258 HTML pages referenced `api-adapter-v32d.js` while the current My Shift dashboard referenced `api-adapter-v33d.js`.
- `member-shell-v32e.js` also embedded a complete V3.2D API client and reassigned `window.SST_API`.
- Depending on script order, the shell could silently replace a newer adapter with the older API surface.
- Several member pages loaded the old adapter more than once.

This creates exactly the sort of split-brain behaviour where one member surface works and another appears not to save, lacks newer endpoints, or reports stale error behaviour.

## Remediation prepared in V3.3G

A corrected public-site package has been generated as `ShiftSomeTimber-V3.3G-GATE1-FRONTEND-INTEGRITY.zip` with:

- all HTML API-adapter references normalised to `api-adapter-v33d.js`;
- duplicate adapter tags removed;
- `member-shell-v33g.js` containing session/account/profile UI only, with API ownership removed;
- member pages migrated off `member-shell-v32c.js` / `member-shell-v32e.js`;
- no-store caching for the current member shell.

## Static commissioning evidence

- 418 HTML files inspected.
- zero unresolved local href/src references after static route resolution.
- zero HTML references to `api-adapter-v32d.js`, `api-adapter-v33b.js` or `api-adapter-v33c.js` in the remediated package.
- zero member references to `member-shell-v32c.js` or `member-shell-v32e.js`.
- zero duplicate `api-adapter-v33d.js` script tags.
- `node --check api-adapter-v33d.js` PASS.
- `node --check member-shell-v33g.js` PASS.

## Commissioning state

This is not production PASS yet. The corrected public package must be deployed and the critical iPhone/member journeys exercised against production. Visual/component quality remains a separate Gate 3 requirement and is not being hidden inside this Gate 1 result.
