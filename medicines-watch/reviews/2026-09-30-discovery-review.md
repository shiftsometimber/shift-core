# Medicines Watch — 30 September 2026 evidence review

Status: **proposed, not live**. This receipt is deliberately not imported by `data.mjs` or `industry.mjs`. It records factual source reading, not clinical approval or a successful monitoring baseline.

The accompanying JSON contains exact proposed catalogue wording for eight additional formulation/programme entries and two existing-entry updates, with source IDs, URLs, publication dates, factual review times and explicit uncertainties. Unknown document update dates remain null.

## Material findings

- Retatrutide: [Lilly's 29 September 2026 TRIUMPH-2 announcement](https://investor.lilly.com/node/54981) supports a dated trial-results update. Keep the existing UK and access distinctions.
- Enicepatide: [Roche's 22 September 2026 announcement](https://www.roche.com/media/releases/med-cor-2026-09-22) supplies newer evidence than the currently configured June announcement and April presentation.
- Eight candidate entries cover elecoglipron; injectable and oral ribupatide separately; KAI-7535; KAI-4729; olatorepatide; apitegromab with tirzepatide; and the COURAGE combinations. These are selected coverage additions, not eight new approvals. Original evidence and the proposed copy are in the JSON.
- Apitegromab and COURAGE are historical body-composition research additions. Their current obesity-development status is unresolved; the proposed limitations preserve this. COURAGE safety information must accompany any eventual summary.

## Existing work and publication boundary

PRs [851](https://github.com/shiftsometimber/shift-core/pull/851) and [854](https://github.com/shiftsometimber/shift-core/pull/854) already cover the initial expansion. Main contains 24 entries and 38 configured documents, which are different denominators. This run could not verify the current public serving count. A source-availability ratio cannot establish industry completeness.

Open [PR 815](https://github.com/shiftsometimber/shift-core/pull/815) covers a separate retatrutide access-context question. This proposal neither duplicates nor resolves that review.

No runtime catalogue, source review date, fingerprint, release pin or monitoring state changes in this PR.

## Incomplete verification

The public page and SELECT-only health endpoint could not be read from this environment. Direct retrieval returned HTTP 403; the health browser attempt returned ERR_BLOCKED_BY_CLIENT. These observations do not establish a production outage. Current source totals, changed hashes and withdrawals remain unverified.

ClinicalTrials.gov returned pages without usable study fields for EMBRAZE and COURAGE. NHS England returned a robot wall; the exact NICE page failed retrieval; fresh SmPC review remains incomplete. The JSON preserves these gaps and deferred candidates rather than treating search snippets or successful response codes as review.

Both current-month and undated topic discovery were performed. The recorded domains describe search activity, not comprehensive reviews; discovery remains incomplete and has no catalogue-size ceiling.

## Next action

Review the exact proposed fields and resolve the recorded trial-status and regulatory gaps. Retrieve complete source responses and use the existing fingerprinting workflow where supported; retain genuine unavailable/manual-only states. Apply accepted wording to the runtime catalogue, run Medicines Watch tests and affected release gates, and use guarded publication plus live verification. Do not advance unrelated review dates or assert clinical approval.

Validation for this review-only change: JSON parses, candidate IDs are unique, every proposed source reference resolves, all clinical approvals remain null and all monitor baselines remain unapproved. Runtime tests were not run because runtime files are unchanged.
