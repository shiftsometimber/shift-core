# Production-good rollback point — 22 September 2026

Owner instruction: preserve the current website before any further action-register work.

## Immutable source identity
- Production/main commit at capture: `a14f759ab8653868c5ef210eff431bdf29bfa106`
- Parent application commit: `fe59a3fdc22afa951c10932cb2ba7056ba5d0913`
- Successful production workflow: `35699093581`
- Backup branch was created directly from the production/main commit before this evidence note was added.
- Branch: `backup/production-good-20260922-1032`

## Existing retained rollback/release evidence
Production run 35699093581 already retained:
- `worker-deployment-before-35699093581` artifact 10681569866
- `member-public-preservation-35699093581` artifact 10681539318
- `b1-runtime-release-35699093581` artifact 10681940082
- protected catalogue/inventory/configuration fingerprints and public preservation checks

These are evidence/rollback references; they are not permission to roll databases or member records backwards.

## Rollback rule
If a later release regresses the website, restore runtime/source to the captured good application only after identifying what data was written after this point. Never roll back accepted payments, orders, member saves, password/session changes, consent changes, receipt state, or other post-capture customer data. Prefer code/runtime rollback while preserving current data.

## Release discipline from this point
No action-register item may be promoted merely because code changed. Work from current main only, use one bounded preview, compare protected surfaces against this baseline, and require owner approval before production. Do not resurrect older ZIPs or branches as a source of truth.
