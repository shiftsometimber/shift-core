# The Timber Shed — private My Timber data boundary

Status: implementation candidate only; feature disabled by default. Not a clinical approval or public launch.

## Non-negotiable member-data contract

- One existing My Timber login. The server derives member identity exclusively from the existing authenticated session.
- No member profile, weight, treatment, mood, mental-health, device reading, clinical note, personal message or contact detail is copied into the Shed.
- No public profiles, member feed, search, posting, messaging, ranking, leaderboards or member-to-member data APIs.
- The only optional persisted information is one member's own activity identifier (from a fixed six-week catalogue), completion state and one of three feedback choices. Free text is prohibited.
- Saving is opt-in, initially disabled, and can be switched off and cleared by the member.
- Only the authenticated member can retrieve their own activity ticks. Every database query is scoped to the authenticated user ID; the client cannot supply another ID.
- Same-origin writes, private no-store headers, no CORS permissions and a default-off feature flag. Never place private data in URLs, HTML source, analytics or server logs.
- Export adds the member's own activity ticks to the existing authenticated account export when enabled. Hard deletion of the owning user cascades the records. Manual account deletion and retention policy must be reviewed before a real pilot.
- The standalone design preview uses synthetic examples and remains entirely separate from My Timber data.

## Implementation locations

- `member-experience/timber-shed-private.mjs`: authenticated, owner-scoped progress endpoint and account export.
- `member-experience/timber-shed-page.mjs`: My Timber companion page, with no public member content.
- `member-experience/timber-shed-private.sql`: explicit D1 migration, **not applied to production**.
- `TIMBER_SHED_PRIVATE_ENABLED`: absent/false in production; must never be enabled without approved safeguards and separate release authority.
- Tests: `tests/timber-shed-private.test.mjs`, `tests/timber-shed-page.test.mjs`.

## Not yet approved or enabled

Clinical reviewer and content boundaries; adult-only eligibility; safeguarding and moderation cover; urgent-risk escalation; specialist charity arrangements; DPIA and controller/processor roles; consent language and withdrawal behaviour; account deletion/export end-to-end acceptance; accessibility; real session/account-isolation browser tests; integration with existing My Timber navigation; production migration; release/rollback; public domain routing.

No clinical advice, automated crisis detection or community conversations are delivered by this implementation. The six-week activities are non-clinical drafts requiring editorial review before real use.
