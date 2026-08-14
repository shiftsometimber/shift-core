# G4-008 — proactive Today orchestration production PASS

Date: 2026-08-14

## Authority

This evidence records the unchanged merged-production journey after the bounded durable-memory fallback and credentialed member-origin CORS repairs were merged. It does not infer PASS from code or CI alone.

- Main SHA under test: `a18b7d09ca04034b8385a8f3dcea02024dc34334`
- Shift Production Commissioning run: `31781806555`
- Rendered Today / G4-008 job: `94708984307`
- Retained Today evidence artifact: `9212021040`
- Artifact SHA256: `cd81613ebd745bd626cd3a27e5a1af57524ce0e9f5120660c8db11087e467136`

## Demonstrated member journey

A fresh authenticated commissioning member enabled proactive insights with a 12-hour cooldown and explicitly asked Shift to remember an ordinary-life strategy. Production retained that user-asserted strategy as `effective_strategy` with confidence `0.92`.

The real premium Today surface then rendered exactly one proactive card labelled `SHIFT NOTICED` with the retained strategy reflected back as a useful daily insight. The rendered member surface had zero document-root overflow.

A subsequent `/v1/shift-ai/proactive/feed` call returned no insight inside the 12-hour cooldown, proving repeat delivery was suppressed rather than stacked.

The member then disabled proactive insights. Production returned `reason: proactive_disabled` with an empty insight list, and after a real Today reload the rendered proactive-card count was `0` and no proactive card remained.

The same job also reran the canonical premium Today desktop + 390px acceptance successfully, preserving the homepage-grade hierarchy, real CTAs, retained canonical state, touch sizing, zero root overflow and zero browser page/console errors.

## Acceptance result

`PASS G4-008 production: learned durable signal surfaced once in premium Today, cooldown suppressed repeat delivery, privacy-off suppressed proactive delivery and reload.`

This closes only G4-008. Current-message safety, clinical boundaries, privacy controls and the existing One Shift Brain contract remain authoritative; no new parallel intelligence system was introduced.
