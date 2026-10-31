# Fourteen-page visual quality correction

The autonomous supporting and utility page batches preserved content but fell below the visual standard of the user-selected pages. This release corrects those fourteen pages only. User-selected SU1, DR3, FD3, CM3 and earlier selected work are protected.

Design: Arial on black, purposeful cream panels, substantial page-specific graphics and individually assigned bespoke editorial photographs. Broader representation and ordinary settings; no repeated family stock imagery. Photographs are illustrative, not portraits of actual contributors or partner organisations. Full source copy, medical limits, links, data keys and scripts remain intact.

Release gates: capture actual current route owners and Workers; preserve actual modules, bindings and assets; stage with zero ordinary traffic; verify original content and protected pages; inspect phone and desktop screenshots against the selected work before promotion; then verify live. Routes remain unchanged.

Status: implementation complete; staged visual review pending.

## Observed regression during comparison

Eight selected-page hero assets were returning 404 on the current consolidated Core version. Their exact original bytes have been recovered from the selected release source commits and are restored at the existing URLs. Their pages and layouts are unchanged.

Core now uses Durable Object migration tag v1-site-content-state. This presentation-only release carries the actual current tag forward with an empty migration step list, alongside all actual modules and bindings.
