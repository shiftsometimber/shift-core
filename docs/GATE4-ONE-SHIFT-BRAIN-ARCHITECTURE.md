# Gate 4 — ONE SHIFT BRAIN architecture

## Objective

Shift must not have separate intelligence worlds for chat, Today, Grub, Fit, proactive insight, member memory and reviewed Knowledge. The canonical contract is `one-shift-brain/v1` in `shift-brain-v1.js`.

## Current-flow diagnosis

Before this programme:

- Shift AI chat assembled profile, member state, progress, assessments/check-ins, plans, legacy notes, intelligent memory and the legacy `ai_knowledge_documents` / `ai_knowledge_chunks` store inside `shift-ai-v3.js`.
- Knowledge Graph separately stored `shift_knowledge_nodes`, edges and provenance-bearing sources.
- Grub/Fit V5 read durable product feedback independently.
- Shift Today V2 independently queried progress, plans and member state.
- proactive/bootstrap independently queried memory and proactive insight tables.

The result was technically capable but split-brain: consumers could disagree about what Shift knew and newly reviewed Knowledge Graph material was not guaranteed to ground chat.

## Canonical context contract

`buildShiftBrainContext(env,userId,question)` now assembles, in one place:

- member identity/profile and lifecycle state;
- goals/preferences/roadmap/decision state;
- progress history and latest progress;
- active/recent plans;
- durable Yay/Nay behaviour;
- intelligent memory with confidence/source plus legacy explicit notes;
- memory/privacy controls;
- unified reviewed knowledge retrieval;
- provenance describing every source family;
- precedence and clinical-boundary rules.

Current member statements override older memory. Unverified health Knowledge Graph nodes are excluded from grounding. Shift AI remains outside prescribing/clinical decision responsibility.

## Knowledge rationalisation

During migration, reviewed knowledge is retrieved through one service from both:

1. legacy approved `ai_knowledge_documents` / `ai_knowledge_chunks`;
2. `shift_knowledge_nodes` / `shift_knowledge_sources` with provenance and health verification.

This is an intentional compatibility bridge, not permission to maintain two knowledge products forever. The target lifecycle remains CMS/review -> canonical graph/index -> Shift Brain retrieval. Legacy chunks can be isolated/retired only after approved content parity and ingestion evidence are proven.

## Consumer migration in this programme

- Shift AI V6: authoritative chat prompt uses One Shift Brain for member context, plans, feedback, memory and reviewed Knowledge.
- Shift Today V3: consumes canonical Brain context and exposes the contract used.
- Grub/Fit V6: applies canonical preferences and historical Nays before delegating to the proven V5 composers.
- member experience V2: bootstrap/proactive surfaces consume canonical plans, progress, feedback and memory state.
- production entrypoint: routes Brain, Today V3 and Product V6 as the authoritative layers.

## Deliberately isolated legacy paths

`shift-ai-v3.js`, `member-daily-v2.js` and `member-product-v5.js` remain implementation fallbacks/composers behind the new authoritative wrappers during commissioning. They are not independent context authorities. Removal is deferred until regression evidence proves functional parity.

## Commissioning strategy

One integrated source gate (`gate4-one-shift-brain-gate.mjs`) verifies the complete architecture in one run rather than proving each consumer separately. It fails if:

- a canonical context family disappears;
- unified knowledge/provenance disappears;
- unverified health graph knowledge can ground answers;
- chat/Today/Grub/Fit/proactive stop consuming the canonical Brain;
- production routing silently falls back to pre-Brain consumers;
- clinical/current-statement precedence rules disappear.

## PASS boundary

This architecture is not itself Gate 4 PASS. Remaining evidence includes authenticated production proof that:

- a preference/memory signal changes later chat/product behaviour;
- Yay/Nay affects a later plan rather than only the current response;
- newly reviewed/published Knowledge becomes retrievable by the canonical Brain automatically;
- answer provenance can be inspected;
- Radar/ticker freshness and publication operate end to end;
- Today/proactive recommendations remain coherent across repeated sessions.
