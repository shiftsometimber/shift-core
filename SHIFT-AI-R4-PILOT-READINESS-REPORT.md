# Shift AI R4 pilot readiness report

## Verdict

**Engineering controls: ready. Pilot activation: not yet ready. No member has been enabled.**

The code, control mechanism, audit evidence and operating documents are prepared and tested. Activation remains blocked until the privacy/consent items below are approved, the exact pilot-readiness commit is securely deployed, and the five named phase-one members have separately evidenced consent.

## Authoritative product candidate

- Product baseline: R4 commit `1785d57b7bb840b491213347b6bebf5d7e218897`.
- Pilot-readiness branch: `agent/controlled-live-shift-ai-pilot-readiness-r1`.
- No other Shift AI version is authorised.

## Required action results

### 1. One-action kill-switch

**PASS.**

- Worker master flag defaults dark unless `SHIFT_AI_R4_PILOT_ENABLED` is exactly `true`.
- D1 control defaults to `enabled=0`.
- One D1 `UPDATE` disables the pilot immediately.
- Evaluation proves the single update blocks bootstrap, new proposals and confirmation of an already-pending proposal.
- The Worker master flag is an independent second kill path.

### 2. Per-member feature flag

**PASS.**

Access requires all of the following:

- exact R4 pilot master flag;
- enabled D1 control row;
- valid phase and exact cohort limit;
- maximum 14-day control window;
- exact consent wording version;
- active authenticated member row;
- participant cohort within the current phase;
- valid participant window;
- consent timestamp and minimised evidence reference; and
- activating operator reference.

Phase 1 fails closed above five active members. Phase 2 fails closed above ten. A phase-two member cannot enter during phase one.

No access rows exist in the candidate itself; test members exist only in disposable in-memory evaluation databases.

### 3. Informed consent wording

**PREPARED; FINAL APPROVAL REQUIRED BEFORE USE.**

Consent version `shift-ai-r4-pilot-consent-v1` is drafted in `SHIFT-AI-R4-PILOT-INFORMED-CONSENT-V1.md`.

The operational sign-off, named-owner record, five-member control, candidate-environment evidence and daily commercial review are consolidated in `SHIFT-AI-R4-PILOT-LAUNCH-CONTROL.md`.

The pilot-specific transparency and risk-assessment candidates are `SHIFT-AI-R4-PILOT-PRIVACY-NOTICE-V1.md` and `SHIFT-AI-R4-PILOT-DPIA-V1.md`. They propose consent under Article 6(1)(a), explicit consent under Article 9(2)(a), and a 90-day post-access retention period. Those are proposed decisions, not self-approving legal conclusions.

It explains the optional nature of the pilot, data used, processing performed, audit recording, model-off state, confirmation requirement, withdrawal and non-clinical boundaries.

Before invitation, Shift Some Timber must:

- confirm the UK GDPR lawful basis and special-category condition;
- approve the privacy notice and retention period;
- name the withdrawal/contact owner;
- approve and issue a pilot-specific privacy notice; and
- confirm that withdrawal is as easy as consent.

### 4. Audit logging

**PASS.**

The existing audit records bootstrap reads, every proposal, safety rejection, incomplete/read failure, explicit-confirmation failure, catalogue/suitability revalidation failure and confirmed write. Pilot-gate failures are also recorded with `written:false`.

The confirmed-write audit includes the exact change, approved IDs, Life Back categories, Amnesty state, No-Guilt result and Today-write result.

Daily review queries and incident procedure are included in `SHIFT-AI-R4-PILOT-OPERATOR-RUNBOOK.md`.

## Evaluation

- Full repository tests: **116/116 pass**.
- Focused Shift AI and pilot tests: **97/97 pass**.
- Fourteen local source, integration, My Timber, Fit, learning and analytics gates: **PASS**.

New evaluation covers:

- master flag off;
- one-action D1 kill;
- pending confirmation after kill;
- missing consent timestamp;
- missing consent evidence;
- wrong wording version;
- revoked access;
- expired access;
- phase-two access during phase one;
- exact five/ten-member limits;
- invalid or excessive pilot window; and
- model flag switched on.

## Locks and untouched surfaces

- Model forced off for pilot access.
- No automatic writes.
- No Learning persistence.
- No new route.
- No Grub/Fit record creation or editing.
- No clinical, prescribing, eligibility, pricing, commercial or HQ change.
- No Worker entry, deployment configuration or production binding changed.
- No production traffic or deployment occurred.

## Outstanding activation blockers

1. Final privacy/legal approval and completed participant information.
2. Named withdrawal, daily-review and incident owners.
3. Secure deployment approval for the exact pilot-readiness commit.
4. Five selected member IDs and separately evidenced consent.
5. Final verification in the candidate environment that both kill paths are off before configuration and work after deployment.

Current environment finding: the checked-in preview configuration retains a placeholder D1 database ID, the workspace has no authenticated Cloudflare deployment capability, and the production configuration must not be substituted. A separate secure candidate D1 identifier and authenticated operator are therefore genuine deployment inputs.

Until all five are closed, keep the Worker master flag off, keep D1 control `enabled=0`, and create no active member access rows.
