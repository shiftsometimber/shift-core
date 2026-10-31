# Fourteen-page visual quality correction

The autonomous supporting and utility page batches preserved content but fell below the visual standard of the user-selected pages. This release corrects those fourteen pages only. User-selected SU1, DR3, FD3, CM3 and earlier selected work are protected.

Design: Arial on black, purposeful cream panels, substantial page-specific graphics and individually assigned bespoke editorial photographs. Broader representation and ordinary settings; no repeated family stock imagery. Photographs are illustrative, not portraits of actual contributors or partner organisations. Full source copy, medical limits, links, data keys and scripts remain intact.

Release gates: capture actual current route owners and Workers; preserve actual modules, bindings and assets; stage with zero ordinary traffic; verify original content and protected pages; inspect phone and desktop screenshots against the selected work before promotion; then verify live. Routes remain unchanged.

Status: visual review passed at source `7134baf5e9ea781523adf7b1cdc00254978914d7`; production verification pending.

Final preview: workflow run 41252014439, artifact 13061756149. All 84 browser checks passed, including normal and query URLs at 1440, 768 and 390 pixels. Desktop and phone views, including complete page layouts, were inspected. The exact 22 presentation and photograph module inputs are pinned in reviewed-source.json. Production publication refuses changed module inputs. Image assets are promoted before their consuming presentation pages.

## Observed regression during comparison

Eight selected-page hero assets were returning 404 on the current consolidated Core version. Their exact original bytes have been recovered from the selected release source commits and are restored at the existing URLs. Their pages and layouts are unchanged.

Core now uses Durable Object migration tag v1-site-content-state. This presentation-only release carries the actual current tag forward with an empty migration step list, alongside all actual modules and bindings.

## Preview method

Cloudflare disallows a multi-version traffic split on versions carrying Durable Object migration metadata, including this empty no-op retention. For this current Core, review uses the exact candidate HTML and image bytes in a browser, with original live scripts and styles. Runtime wrapper responses, protected resources and staged module bytes are checked independently. No production deployment is changed for this preview. Once visual review passes, each owner is promoted directly to its single version and the full live edge and browser checks run before completion.
