# SHIFT AI context pilot — not released

Base: b7684acb867e85386cea87ecbfb055847d0fa55d

Backend-only candidate. No frontend, production configuration, deployment workflow or database schema changes. The server flag SHIFT_AI_PRACTICAL_CONTEXT must be exactly "true"; absent/false retains the original behaviour.

The existing public widget sends useJourney:false. In this pilot an authenticated session can combine reviewed knowledge with that member's existing consented journey data, without a UI change. personalisation:false is a per-request opt-out. Existing tracking consent and paused-journey controls remain authoritative. Visitors and invalid automatic sessions receive public answers; explicit authenticated-member requests retain their authentication requirement. Request-supplied member IDs never select an account.

Adds practical judgement instructions and bounds repeated historic rows in the model briefing. Retains exclusions, dislikes, timestamps, existing next-step feedback and evidence citation rules. No new persistent conversation memory, feedback writes, autonomous learning, background knowledge ingestion, cross-member sharing or private response cache.

Validation: local-tests.txt contains 110 passing tests covering the candidate, existing food regression, auth, member separation, consent withdrawal, model failure, public shell and continuity. Model replies in these tests are stubs: this proves integration contracts, NOT real answer quality or response latency.

Still required before release:
- Isolated authenticated preview with synthetic accounts and real model binding.
- Human review of late-shift/budget/correction/topic-change and medical-boundary answers.
- Measure full response latency at p50/p95; existing UI waits for complete JSON, so first-token streaming is out of scope.
- Browser/device compatibility checks on unchanged interface.
- Verify consent wording covers this expanded automatic context use before activation.
- Confirm feedback capture coverage and design any additional durable memory with correction/deletion; do not equate old AI output with approved evidence.
- User review of evidence before production release.

Rollback: disable the flag. The current production flag is unchanged/off. No migration or data rollback is necessary.

## Follow-up evaluation, 26 September

Real-model workflow: https://github.com/shiftsometimber/shift-core/actions/runs/36271828193
Evaluated source: ae8965a7faafa958ff761b6e6954e7eabc534a6b

The configured preview credential received HTTP 401 from Workers AI REST. All seven scenarios returned explicit fallback answers; ZERO actual generations passed. These timings are fallback timings, not AI latency. Raw synthetic outcomes are in real-model-blocked.json. No alternate privileged credential was substituted. Required access: a preview-authorised credential with Workers AI invocation permission, or an explicitly authorised existing preview inference facility. Never paste credentials into a chat or commit them.

Current consent UI source (member-experience/health-runtime.mjs) explicitly covers optional health information for My Timber progress tracking and personalisation. This is an implementation observation, not legal sign-off for training, pooled member data or indefinite transcript storage.

Architecture finding: /v1/ai/chat is the Ask Timber route changed by this draft. shift-ai-v6.js implements a separate /v1/shift-ai/chat route with conversation history, intelligent-memory.js and memory-privacy.js. Its existence does not prove live use by the public widget. Reuse and reconcile those controls before adding new persistent memory. Its default-on memory settings and write path require a focused consent/erasure review before connecting it to this pilot; they have NOT been activated or modified here.

Remote initial candidate checks passed: integration run 36270326731, preservation run 36270327273, route sweep run 36270326696. No hosted/browser acceptance or answer-quality pass is claimed. No production or frontend changes.
