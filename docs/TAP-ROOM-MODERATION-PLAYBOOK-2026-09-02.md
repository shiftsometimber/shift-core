# Tap Room moderation and safeguarding playbook

Authority date: 2 September 2026  
Primary owner: Matt O'Brien  
Out-of-hours backup: Linda O'Brien  
P0 destination: `hello@shiftsometimber.co.uk`

## Priority and response

| Priority | Examples | Target response | Immediate action |
|---|---|---:|---|
| P0 | credible imminent self-harm, suicide, threat to another person, child safeguarding concern | Immediate human review | Preserve audit record; hide unsafe public content where necessary; use emergency/safeguarding routes; do not attempt counselling or diagnosis |
| P1 | medicine selling, dose instruction, harassment, hate, doxxing, repeated targeting | Within 4 hours | Hide/restrict as appropriate; review account history; record reason and outcome |
| P2 | spam, off-topic promotion, duplicate reports, ordinary conduct issue | Within 1 working day | Warn, hide or close report; record outcome |

## Operating rules

1. Moderators use the authenticated moderation queue; never moderate through direct database edits.
2. Every action needs a plain reason. The audit record is retained for 24 months unless the approved retention schedule changes it.
3. Treatment Experiences permits personal experience, not prescribing, dose direction, medicine selling or claims that replace a clinician.
4. A block is two-way. Removed or suspended profiles cannot post or reply.
5. Reporters do not receive another member's private information or detailed clinical reasoning.
6. P0 information is shared only with the people or services necessary to address the risk.

## P0 drill

Quarterly, use a synthetic account and non-real text clearly labelled `TEST INCIDENT`. Confirm: detection, held/hidden state, email delivery, queue appearance, named owner acknowledgement, audit entry and closure note. Do not use a real member or real health information.

## Failure mode

If the owner, backup, destination or email delivery is missing, the Tap Room must fail closed for new posting until the route is restored. Reading may remain available only when it does not expose held or removed content.

## Review cadence

- Queue: every operating day and after any alert.
- P0 route: monthly delivery check.
- Full synthetic incident: quarterly.
- Playbook and owners: every six months or immediately after a material incident.
