# REC-035 — SHIFT Newsroom release, 13 September 2026

Matt approved the corrected, self-contained preview with “Spot on - crack on”. This authorises the public GitHub source update and deployment. Previous preview and public-source holds are superseded.

## Current runtime

- Source: `48f0900bb9c2ba8e81293f0058950cfc4c9466b7`.
- Source tree: `95f6eb1ce900a07c677f5fce8d7ef6900e5e0d7e`.
- Worker version: `43840d70-c611-4459-a724-4c351587c86b`.
- Release run: https://github.com/shiftsometimber/shift-core/actions/runs/34743964280 — passed, including before/after preservation checks.
- Evidence artifact: `REC-035-newsroom-evidence`, ID `10313208995`.
- First release run `34743845204` passed; a subsequent scoped CSS correction removed inherited cream section backgrounds and excess padding observed on the actual live page.

Public Pages remain at source `c733bf03834d93154a51a0db6ef05dbebb3c7cb3`, deployment `https://0da69833.projectshift.pages.dev`, aggregate fingerprint `1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0`. REC-034 header and authentication controls remain current. REC-032 is rollback history only.

## Shipped behaviour

- https://shiftsometimber.co.uk/shift-newsroom is the canonical newsroom, with UK stories first and combined medicine, topic and UK/US/World filters, counts, clear and empty states.
- The old `/medicine-news` hub redirects permanently. Existing `/medicine-news/<slug>` articles retain their URLs.
- CollectionPage metadata, canonical URL and sitemap entry are present. Filtering uses fragments, preserving the canonical page.
- SHIFT Newsroom appears between SHIFT for Work and Timber Mill in the shared menu. The five primary links remain Start Here, The Programme, SHIFT Health, Treatments and My Timber.
- NHS England and MHRA organisation feeds are included by default. Broader health filtering is restricted to UK authority sources. UK study geography and required-feed coverage are explicit; UK drafts are prioritised. Manual scans suppress draft emails; scheduled notification behaviour is unchanged.

## Publication and verification

Previously published 23 approved updates through HQ with zero failures. The completed newsroom now contains 113 published stories: 8 UK and 105 international. Incomplete and evidence-blocked queue items remain unpublished.

Published event 278 through the normal audited save, approve and publish controls:
https://shiftsometimber.co.uk/medicine-news/pharmacy-first-expansion-england-autumn-2026

The article was checked against NHS England’s 10 September announcement and the government’s May pharmacy agreement. It retains England-only, participating-pharmacy and prescriber eligibility limits. Selected destinations were medicine_news, knowledge_links, search and sitemap; no member or social sends.

The live scan/review queue includes NHS pharmacy expansion, cholesterol-check and flu-service stories. Remaining new stories still require completed editorial review; source detection is not publication approval.

Actual browser checks passed: combined UK/semaglutide/safety filters, zero-results state, clear, all 15 menu links in the required order, menu-to-newsroom navigation, published article read link and article metadata/source links. Static mobile layout evidence was supplied separately; no Safari interaction test is claimed.

The release verifier compared the homepage, Start Here, SHIFT for Work, member sign-in, selected-treatment journey, header CSS and Start Here JavaScript before/after, removing only the exact new menu link for comparison. It confirmed the locked wording “Based on your answers, this could perhaps work for you…” and unchanged Pages fingerprint.

No database migrations, pricing, stock, clinical, payment or employer activation changes were made. The unrelated pre-existing invalid act2b-one-shot workflow remains a separate no-jobs failure.

## Source reconciliation

Synchronise main to the already deployed runtime plus this release record. The reconciliation commit uses `[skip ci]` because the identical runtime has passed its dedicated release and live-preservation gates, and main’s generic deployment would redundantly deploy and run unrelated migrations. This is source reconciliation, not a second release or a replacement of the approved Pages source.
