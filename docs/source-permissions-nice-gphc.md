# NICE and GPhC source policy — 19 September 2026

## Scope

Source-specific discovery and reuse safeguards only. No member, Passport, login, payment, stock, medicine wording, public design or existing published article changes. Access, factual verification and permission to adapt are independent states. No API activation, paid service or cybersecurity-certification purchase is authorised by this implementation.

## Correspondence and pending decisions

Replies have been sent in the existing NICE and GPhC email threads, using Matt's signature and a BCC to Matt. Private email bodies are not copied into this public repository.

NICE: the licensing contact described assistive editorial use as acceptable when meaning and intent are maintained. The follow-up asks for the specific non-API scope, UK-focused commercial website with overseas accessibility, attribution/disclaimer and separation from commercial services. It asks for the offered meeting availability but does not book a meeting or accept a licence.

GPhC: the supported feed is https://www.pharmacyregulation.org/rss. Supplied text must remain as published, attributed and linked. The follow-up distinguishes the earlier news-index refusal from a new RSS diagnostic and asks explicitly about separate summaries and SHIFT interpretation. It contains a genuine request trace and an appropriately qualified observed runner egress IP.

Until those points are settled, new NICE/GPhC material can be discovered and retained as source evidence, but cannot be automatically adapted, approved, published or socially redistributed by the newsroom pipeline. The hold also covers pending jobs and mixed-source packages. Other eligible sources continue. Existing published articles are retained unchanged; this is not a retrospective licensing clearance.

No environment variable or human-approval button bypasses this hold. Lift it only through a reviewed, tested source-policy change backed by the publisher's written answer and the required attribution/territorial/editorial implementation.

## Source configuration and honest health

- GPhC: migrate only the exact old seeded news-index source to the supported RSS adapter. Preserve paused status, custom settings and all historical observations. Do not retry an access refusal or rotate infrastructure to evade it.
- NICE: add the exact topic URL supplied by the licensing contact: https://www.nice.org.uk/guidance/lifestyle-and-wellbeing/diet-nutrition-and-obesity. Retain the existing broad index and existing individual-source checks.
- Follow only same-origin topic-filtered listing links actually present on the topic page, with at most four listing requests. Never invent an updates API, feed or filter.
- Keep consultations, work in development, terminated appraisals and ambiguous published/terminated listings distinct. A guidance URL alone proves neither current final status nor NHS funding or local availability. Source absence is not proof of withdrawal.
- Reuse labelled previous observations for up to one hour for these two sources; do not advance their timestamps or count cached observations as new discoveries. A cached failed check remains failed. Existing scheduled-request cadence remains in place.

## Retained external diagnostics

Diagnostic run 35447430161, artifact 10586170897 (SHA-256 9d5413d2366eab4685c54ef1060b0c7423b91946149db72ac8558830dc8c3b4a), reproduced an RSS HTTP 403 in an explicitly identified GitHub-hosted diagnostic runner. This is not a historical production egress trace. The old double-hyphen NICE topic URL returned 404 and is not configured by this change.

Run 35448197564, artifact 10585576618 (SHA-256 f54dc23ad347fdf2e385acc6494cfcd099fc13d2ca16848d67203147664d5c04), passed 92 newsroom tests and compiled the Worker without deploying. Its separate live diagnostic found the correct NICE topic HTTP 200 but its first linked published/terminated listing HTTP 403. The adapter correctly retained a failed observation with zero claimed discoveries. A passing regression workflow is not evidence of working external access.

No claim of complete NICE update/withdrawal coverage or functioning GPhC RSS access is justified until real source retrieval succeeds. Public read failures must remain visible. Provider responses and written reuse clarification remain external dependencies.

## Public reference points

- https://www.nice.org.uk/reusing-our-content/nice-syndication-api
- https://www.nice.org.uk/reusing-our-content/nice-uk-open-content-licence
- https://www.pharmacyregulation.org/rss

Final acceptance: exact Git diff, newsroom regression tests, Worker dry-run compilation, current-main check, the existing production release/preservation gates, and an honest record of external failures. No unrelated gate may be disabled to get this release through.
