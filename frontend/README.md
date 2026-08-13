# Shift frontend source authority

This directory is the authoritative Git source for release-critical My Shift/member-shell frontend changes from V1 onward.

## Recovery provenance

Baseline recovery candidate: `ShiftSomeTimber-V3.4B-ONE-SHIFT-RC2(2).zip` supplied by Matt on 2026-08-13.

It was reconciled against the retained production capture from Gate 1 Rendered Browser Acceptance run `31680649245`, captured at `2026-08-13T08:07:13Z`.

Production comparison:

- `styles.css`: byte-identical to RC2; SHA-256 `82fd211e9031ca72793980d7e62ce001a4855ea14bcd8054d4dde82872a796f3`.
- `member-product-v33d.css`: byte-identical; SHA-256 `82ba0f98794aef07de4add8345c8897adbe0048f5b9b5485581ad678f1ae883e`.
- `one-shift-v34.css`: byte-identical; SHA-256 `c70dd3ae89f268a909e92fc115f20377bdf652c31a6963ac5a6f336747425c8a`.
- `member/dashboard.html`: the only captured-production difference from RC2 was Cloudflare runtime email-obfuscation markup/script injection. No later Shift product/source change was present in that diff.

The retained source-capture artifact is `gate1-live-static-source-evidence`, artifact ID `9173318023`, digest `sha256:199340cdcb94f8f7922fcbc8121963c24732ca35641531a49f46df06678b5bd7`.

## P0 source repair

`member/member-shell-v33g.js` is the recovered shell with three source-level fixes:

1. injects the versioned member P0 stylesheet on every `/member/*` page;
2. makes `#sstMemberNotice` non-blocking, accessibility-announced and removes it after successful session verification;
3. rewrites authenticated `My Shift` links that still point at the sign-in front door to `/member/dashboard.html`.

`member/member-p0-v1.css` fixes the real horizontal-overflow root cause: the closed Ask Timber drawer's static children remained scroll-overflow contributors after their fixed parent was translated off-screen. The repair contains/clips the drawer while closed, gives its children an explicit shrinkable 100% width, and enables pointer events only when the drawer is open. It deliberately does **not** apply a global `overflow-x:hidden` mask.

## Build / deploy / rollback rule

The Git commit is the release identity. Production deployment must publish these files unchanged at their root production paths:

- `frontend/member/member-shell-v33g.js` -> `/member-shell-v33g.js`
- `frontend/member/member-p0-v1.css` -> `/member-p0-v1.css`

A deployment is accepted only when live SHA/content checks match the Git commit and the unchanged authenticated six-case rendered RC passes Chromium, Firefox and WebKit at desktop and 390px.

Rollback target for this P0 is the retained pre-change production source capture above. Never reconstruct a rollback from memory or an unversioned local copy.

The public estate must not be bulk-overwritten from RC2: this recovery establishes authority for the member frontend while retaining any independent later public-site changes.
