# SHIFT AI backend candidate — not released

Base production/main commit: `b7684acb867e85386cea87ecbfb055847d0fa55d`.
Draft PR: https://github.com/shiftsometimber/shift-core/pull/817

## What this changes

Ask Timber can combine reviewed SHIFT knowledge with the signed-in member's consented journey, existing private preferences and recent saved conversations. It retrieves the selected recipe through the same governed publication checks as Grub, including real ingredients, quantities, method and safety details. Practical questions request actionable explanation and a fallback; simple saved facts can be brief.

No frontend files or production configuration are changed. `SHIFT_AI_PRACTICAL_CONTEXT` must equal `"true"` to enable the new context and answer behaviour. `SHIFT_AI_CONVERSATION_MEMORY` must also equal `"true"` to enable the conversation/recipe extension. Both remain off by default. With the practical flag off, the original model instructions and request/response contract are preserved.

The unchanged widget sends `useJourney:false`; in this server-controlled pilot, a valid session plus existing tracking consent permits personalisation. `personalisation:false`, withdrawn consent, memory-off and paused tracking remain authoritative. Request-supplied member IDs cannot select an account.

## Memory lifecycle

The bridge reuses `shift_ai_conversations`, `shift_ai_memory_v2` and `shift_ai_privacy_settings`. It saves user and assistant turns privately and supplies at most six recent messages from a 30-day window plus up to twelve existing high-confidence preferences. This is bounded conversation retrieval, not model retraining, permanent recall of every conversation, or autonomous background research. The new bridge does not extract new structured preferences or alter saved goals/plans.

New conversation records are tied to the current consent event. Withdrawal/re-consent cannot resurrect an old conversation epoch. Writes check current consent, memory permission and pause status; a privacy change during inference suppresses the personalised reply. Existing memory correction/deletion advances the conversation boundary atomically with the edit. Existing health-data erasure now clears both AI stores for that member. Account exports include private AI records even after memory has been switched off. Memory-off stops use/saving; it is not erasure. The retrieval window is not an automatic storage-deletion policy.

Prior AI answers are untrusted context, never approved medical evidence. No private conversation becomes public or joins shared knowledge automatically. Existing consent wording covers optional information for My Timber progress tracking and personalisation; shared training or broader data use is outside this candidate.

## Verification and release boundary

See RESULTS.md and raw reports for the tested commit, answers, timings, privacy tests and browser evidence. Evaluation uses authenticated fictional accounts, synthetic SQL and a temporary real Workers AI binding. Browser tests load current public HTML with unchanged chat assets and block production API writes. Service workers are blocked in the isolated fixture; offline behaviour is not tested. This does not measure live D1 latency or establish a production p95/SLA. Phone-sized WebKit is not a physical iPhone test.

The temporary inference Worker has no D1, assets or production routes, requires an expiring random key, and is removed after the run. A test-only CI dependency installation fixes the pre-existing BabyLoveGrowth gate's missing-package failure.

Production activation remains subject to review. Rollback is to disable the two flags; this stops new behaviour, not deletion of previously stored conversations. Export and erasure support remain available.
