# Ask Timber repair acceptance — 21 September 2026

Status before implementation: OPEN. Production approval required after preview evidence.

Authority: shiftsometimber/shift-core main d7925b7bdea5ab30b02875b6e2b5d9a01ae82618. Isolated repair branch fix/ask-timber-public-auth-20260921. Do not overwrite active launch-readiness PR 771 or its preview.

Pages: projectshift deployment 0da69833-83f7-4c70-9c7a-bceab7de1660, source c733bf03834d93154a51a0db6ef05dbebb3c7cb3. Its /assets/ask-timber-v1.js is byte-identical to production at investigation (SHA256 5a156879ca0f152da226424d84e5992f41b6136eb0a0a8efe04814020d421330). Retain existing public shell. Move only this script into the existing Git asset authority for the repair.

Confirmed source defect: public script omits useJourney; shared adapter defaults it to true. Server correctly refuses private-context requests without a session with authentication_required (401). User screenshot supplies live failure evidence. Our cloud browser returned an unrelated psychiatric-survey extract for the same question, separately captured. Direct terminal probes were blocked (403/1010); do not call them passing live reproductions.

Acceptance:
1. Public Ask Timber sends useJourney:false regardless of absent, expired or present member cookies. Exact reported question “I need to loose weight fast. Help me” returns a relevant, grounded response or an explicit lack of matching evidence; it cannot cite an unrelated mental-health survey as an answer.
2. Shared member callers retain useJourney:true. Anonymous, expired, revoked and cross-account private access protections and consent remain intact. Public requests never read member records.
3. Retrieval cannot promote a source based solely on filler words (need/help) or incidental metadata. Relevant reviewed evidence remains available; current medicine-status protections remain unchanged.
4. Failure responses are plain English, preserve the question, re-enable submission, and allow successful retry. Do not echo server messages, internal codes, stack traces or user-controlled markup.
5. Submit real questions through the rendered preview in desktop/phone Chromium and WebKit; verify request payload, source links, repeat submit, failure/retry and emergency signposting. Distinguish synthetic fault tests from live API and actual physical-device evidence.
6. Existing AI/member privacy, multi-intent, source and preservation gates pass. Capture candidate commit, preview identity, evidence and unresolved limitations.

Scope: public caller, failure presentation, demonstrated relevance bug, associated tests and preview. Protected: OOS wording, stock setup, prices, medicines/services, nav, shell, checkout, saved member data. No production release from this branch without Matt's approval.
