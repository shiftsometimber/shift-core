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

## Forum foundation — six rooms (private design only)

The Main Shed; Shifting Timber; Grub & Fit; Good to Talk; Small Wins; Life After Treatment. Twelve fictional conversation examples are available for design testing. These are not real user posts or clinical advice. The feature remains behind the existing default-off private gate.

**Publication safety contract for any future live forum:**

1. Joining My Timber or using the private tracker must not create a public profile or a community post. Community participation must be a distinct opt-in, with an appropriate privacy notice.
2. A member chooses a separate display name. No email address, real name, postcode, weight, treatment, check-in, diagnosis or other My Timber data is imported, auto-filled or exposed.
3. Only deliberate member-authored text can enter a proposed post. No auto-sharing from the tracker or Shift AI. Warn against identifying and sensitive disclosures; test for accidental leaks before submission and allow cancellation.
4. Every initial post and reply must enter a **non-public moderation queue**. Nothing becomes member-visible until approved by an authorised trained adult. Provide reject, redact, remove, report, block, appeal and audit controls.
5. No private messages, attachments, images, live location, member directories, searchable member profiles, outbound notifications or anonymous posting in the initial pilot.
6. Enforce age 18+, rate limits, session checks, CSRF controls, anti-abuse controls, moderation capacity and clear operating hours. Do not present the forum as a 24/7 support service.
7. Restrict dangerous content including eating-disorder encouragement, unsafe medication/dose instructions, self-harm or suicide methods, harassment and drug supply. Escalate safety concerns through an approved human-led process; don't promise automated crisis assessment.
8. Give members a way to delete or request removal of their own posts, understand retention and make privacy requests. Define the controller roles and lawful basis before any live posts.
9. No commercial targeting based on health information, no partner access to community data without a separate approved agreement, and no claims of charity endorsement without permission.
10. Test two fictional member accounts plus a separate moderator identity: no cross-account reads, pending invisibility, rejected invisibility, approved visibility only after moderation, deletion and exports, logged moderation actions and safe failure when moderation is unavailable.

**Release rule:** A visually working sample forum is not a live moderated service. The current PR contains only fictional examples and no publishing backend; production forum launch remains blocked pending the above gates and a fresh scoped approval.
