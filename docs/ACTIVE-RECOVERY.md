# Active recovery checkpoint — 2026-08-13

## Current implementation authority
`main` authority = `afddbf502c48ead07f3ffab1be0aa95da9c222e8`, merge of PR #130. This commit is 13 commits ahead of retained Grub review checkpoint `ee8c96dbfb3116a9b4e5119d56b537dfdb713252`; no later commit invalidates that nutrition evidence.

Authoritative original audit = **57 total / 23 PASS / 31 AMBER / 3 BLOCKED / 0 unmapped**. B03 behavioural remains **9/9 PASS and locked**.

## Monotonic recovery rule
Recovery state is monotonic unless a later commit contains explicit regression evidence. Before accepting any checkpoint as authority:
1. resolve current `main` SHA;
2. verify the proposed evidence commit is an ancestor of current main;
3. read the current remediation matrix and evidence ledger rather than a stale recovery file;
4. never reduce PASS or demonstrated content evidence merely because an older branch/checkpoint is encountered;
5. any deliberate downgrade must name the exact regression, failing unchanged proof and fixing PR.

Direct connector/tooling probe writes to `main` are forbidden. All exploratory writes must use a disposable/non-main branch. Main source changes require an intentional PR/merge or an explicitly constructed commit whose complete diff is understood and regression-gated.

## Current earned closures
Latest original row closure is **G1-007** through merged PR #129 and retained rendered production evidence. Locked PASS rows include G1-005/006/007/010/011, G2-005/006/008/010, G4-001/002/003/004/005/006/007, G5-004/006/007/008/009/010/011 as represented by the current 57-row matrix.

## Grub factory — current retained evidence
Structured universe: **2,908 authored = 2,876 industrial + 32 existing structured**.
- Industrial schema-valid: **2,876 / 2,876**.
- Merged PR #123 and retained review artifact prove **2,876 / 2,876 nutrition-valid LOW-risk**, **0 nutrition quarantine**.
- Ingredient-level evidence retains CoFID identity, converted grams, mapping state, methodology/provenance and precision/limitations.
- Independent editorial review remains a real publication barrier.
- Review workload is compressed into **101 immutable canonical review templates** with per-recipe content hashes; any descendant edit changes the digest and requires re-review.
- Merged PR #128 adds full-catalogue semantic/quality validation and repairs duplicate ingredient/title/family defects rather than weakening gates.
- Authoritative independently reviewed / published / production-served remains **1 / 1 / 1** until second-person decisions are recorded and propagated.
- M11 remains AMBER for review/publication/production-serving breadth, not nutrition coverage.

## Fit factory
Structured universe: **2,500 authored = 2,468 industrial + 32 existing structured**.
- 44 canonical movement families/specifications.
- 2,244 / 2,468 industrial objects have stable canonical visual metadata bindings and deterministic protocol checks.
- Critical blocker: descendants reference `assets/fit/shift-fit-industrial-v3.svg#<canonical>` but that consolidated 44-family rendered asset is absent from current main. Metadata readiness is not anatomical/member visual QA.
- Existing genuine member/domain-QA / reviewed / published / production-served remains **3 / 3 / 3 / 3**.
- Next Fit action is to create the real 44-family visual set plus a single review surface ordered by descendant unlock, then propagate approved families to eligible descendants.

## Dave / B08
Authoritative coverage remains **15 / 20 = 75%**. Public registration/recovery affordances and rendered failure handling are now proven, but real-inbox registration/verification/recovery, authenticated rendered/mobile acceptance and external treatment support remain distinct unresolved legs.

## Current defects exposed by rendered acceptance
Authenticated/session-state journey failure; Progress horizontal overflow (~20px); mobile pointer interception involving navigation/cookie UI. These remain in G1-009/M01/M06/M10/B08 and must be fixed/re-run rather than hidden by public-browser success.

## Human/external boundary
Human/device: B01 real reset inbox-token chain; M09 real verification inbox click/login; final authenticated/mobile release acceptance; eventual movement/domain judgement of the real 44-family Fit visual pack.
External BLOCKED: exactly G5-001, G5-002, G5-003.

## Active swarm
M11 independent Grub review/publication/serving conversion; M12 real Fit visuals/domain QA/publication; G1-009 authenticated rendered defects; B05; B08; M01; M04; M06; M08-M13; M17. Human/device/external waits never queue independent work.

## Exact next actions
1. Protect recovery/source integrity with a CI gate that fails stale recovery heads, scoreboard regressions and known-good source hash drift.
2. Convert the 101 Grub canonical review templates into the smallest legitimate second-person decision pack and propagate decisions without row-by-row review.
3. Build the actual 44-family Fit rendered review pack; do not call metadata visual approval.
4. Fix authenticated rendered session/overflow/mobile interception defects and rerun Chromium/Firefox/WebKit desktop + 390px acceptance.
5. Run accessibility/performance and M17/B05 quick-kill lanes concurrently.

Operating rule: **RECOVER LATEST -> PROTECT STATE -> CONVERT -> PROVE -> CLOSE -> CONTINUE.**
