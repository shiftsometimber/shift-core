# The Lounge — legacy compatibility lock

Date: 7 September 2026  
Owner: Matt O'Brien  
Status: MATT LOCK

## Public product rule

**The Lounge** is the only public product name.

`Tap Room` is retired from member-facing copy, navigation, chrome, titles and CTAs. `/tap-room` may remain only as a compatibility redirect to `/lounge` while old bookmarks or historic links age out.

## Internal compatibility rule

Legacy implementation identifiers such as `tap_room_*` database tables, `/v1/tap-room` API aliases and historic asset filenames may remain temporarily where renaming would create avoidable migration or production risk.

They are implementation detail only. They must not leak into member-facing UI, emails, support copy, page titles, navigation or public documentation.

## Acceptance

- `/tap-room` redirects/canonicalises to `/lounge`.
- Member-facing client copy says **The Lounge** only.
- Shared public chrome rewrites retired Tap Room links to `/lounge` and **The Lounge**.
- No release may reintroduce Tap Room as a public product label.
- A future schema/API rename is optional technical debt, not a launch dependency.

This lock intentionally avoids risky renames of live schema, API aliases or assets solely for cosmetic source cleanliness.
