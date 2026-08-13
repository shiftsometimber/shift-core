# G5-012 registration fast-path — ready for gated deployment

## Current production defect

Authoritative post-#206 production evidence: run `31752681300`, job `94621658356`.

- member registration p95: **997 ms** across 17 samples;
- member registration median: **810 ms**;
- member login p95: **495 ms** across 11 samples;
- unchanged release budget: **800 ms API p95**.

G5-012 remains AMBER until a fresh main production run proves both registration and login <=800 ms.

## Bounded repair on this branch

`member-register-fastpath-v1.js` plus `worker-entry-v6.js` now route genuine member registration and commissioning registration through the same optimized core, while preserving the existing outer verification and commissioning-identity wrappers.

The repair:

- keeps PBKDF2 SHA-256 at **100,000 iterations** with random salt;
- starts independent password/session/IP hashing alongside the duplicate-account D1 lookup;
- uses D1 insert metadata to avoid the redundant post-insert user re-read;
- batches auth/member-state/consent/audit/session writes;
- preserves `AUTO_VERIFY_EMAIL` semantics;
- preserves the verification-first wrapper for genuine members;
- preserves restricted GitHub OIDC verification for commissioning identities;
- falls back to the authoritative legacy registration core on infrastructure/schema failure;
- does not change the 800 ms acceptance threshold.

## Required acceptance before PASS

1. Run existing master integration/security and whole-estate gates on the branch/PR.
2. Merge only if those gates remain GREEN.
3. Observe a fresh main `Shift Production Commissioning` run.
4. G5-012 earns PASS only when the retained report has sufficient samples and both `memberApi.registration.p95Ms <= 800` and `memberApi.login.p95Ms <= 800`.
5. Retain artifact/run/job references and atomically reconcile matrix/blocker accounting.

Do not substitute commissioning wrapper latency for the member handler and do not lower PBKDF2 or the SLO to manufacture PASS.
