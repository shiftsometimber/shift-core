# Fourteen-page visual quality correction

The autonomous supporting and utility page batches preserved content but fell below the visual standard of the user-selected pages. This release corrects those fourteen pages only. User-selected SU1, DR3, FD3, CM3 and earlier selected work are protected.

Design: Arial on black, purposeful cream panels, substantial page-specific graphics and individually assigned bespoke editorial photographs. Broader representation and ordinary settings; no repeated family stock imagery. Photographs are illustrative, not portraits of actual contributors or partner organisations. Full source copy, medical limits, links, data keys and scripts remain intact.

Release gates: capture actual current route owners and Workers; preserve actual modules, bindings and assets; stage with zero ordinary traffic; verify original content and protected pages; inspect phone and desktop screenshots against the selected work before promotion; then verify live. Routes remain unchanged.

Status: complete. Visual review passed at source `7134baf5e9ea781523adf7b1cdc00254978914d7`; production verified at 23:29:36 GMT on 31 October 2026.

Final preview: workflow run 41252014439, artifact 13061756149. All 84 browser checks passed, including normal and query URLs at 1440, 768 and 390 pixels. Desktop and phone views, including complete page layouts, were inspected. The exact 22 presentation and photograph module inputs are pinned in reviewed-source.json. Production publication refuses changed module inputs. Image assets are promoted before their consuming presentation pages.

## Observed regression during comparison

Eight selected-page hero assets were returning 404 on the current consolidated Core version. Their exact original bytes have been recovered from the selected release source commits and are restored at the existing URLs. Their pages and layouts are unchanged.

Core now uses Durable Object migration tag v1-site-content-state. This presentation-only release carries the actual current tag forward with an empty migration step list, alongside all actual modules and bindings.

## Preview method

Cloudflare disallows a multi-version traffic split on versions carrying Durable Object migration metadata, including this empty no-op retention. For this current Core, review uses the exact candidate HTML and image bytes in a browser, with original live scripts and styles. Runtime wrapper responses, protected resources and staged module bytes are checked independently. No production deployment is changed for this preview. Once visual review passes, each owner is promoted directly to its single version and the full live edge and browser checks run before completion.

## Verified production release

Production source: `4efff9f30e05dd8a94ac559dd2f530a37c457074`. Workflow run 41252434222 / job 124688543177 succeeded. Artifact 13062485139 contains the complete source-render and live browser evidence (90-day retention). The durable receipt is verified-release-20261031.json.

All fourteen pages passed 84 live browser checks across ordinary/query URLs and desktop/tablet/phone. All original text, original scripts, link attributes and data keys remained intact. The scoped bridge-placement script keeps the existing programme panel after page content. Sixty-three protected resources, 215 existing code assets, 56 bindings and all 915 routes were preserved. Seven dedicated photographs are new; eight original approved image files were restored exactly at their existing URLs.

Public presentation version: `039d26a7-2f00-4588-b411-e219b4fadb0d`. Core version: `5678669f-a865-476f-bda7-0639c4225618`. Core retained its actual predecessor module and Durable Object tag `v1-site-content-state` with no migration operations.

Live spot checks confirmed the revised Health MOT image and restored DR3 Downloads image decode at 1536 pixels wide. Previously selected normal-page layouts and SU1 were protected throughout this correction.

Additional observation outside this correction: the HTML at `/downloads-resources?presentation=1` still has the earlier Core template, while the normal URL retains DR3. Its current response was protected by this release; the new fourteen-page correction covers both forms of its own scoped URLs.
