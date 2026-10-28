# Approved Journey implementation — 28 October 2026

This implements the Journey design Matt approved in the 27 October conversation. It is source code for the member service, with real authenticated persistence. It has not been deployed, activated or merged.

The starting point is PR1439 at `b11b5d5c7761d6d0bd8085f571194e21c0f11857`. That PR remains a draft pending broader qualification. This change is prepared separately against its branch; it must not be mistaken for qualification or activation of that predecessor.

## Member behaviour

- Journey opens `/member/life-back/journey`. Navigation is Today, Journey, Grub, Fit, More. Support sits in More, with a link to Your snapshot; Journey has the same snapshot entry point.
- The member's own dated win comes first. Weight and waist have genuine date-based readings, unsmoothed fluctuations, gaps and accessible reading lists. Clothes size is a dated table of the member's top/trousers labels, with no numeric size graph.
- Date choices include the initial period/last seven days, four weeks, all records and custom dates. Display choices survive reload in the URL; private words and values are never placed there.
- The optional medicine illustration has actual calendar context, a Today marker, date scrubbing by pointer/keyboard/horizontal wheel, earlier/recent windows and the member's separately recorded feelings. Its repeated teaching line never responds to medicine, dose, injection records or treatment-change markers. It is explicitly not a measurement, personal prediction or a prescription-linked cycle.
- A prominent guide link works even with the main illustration hidden. The compact day-by-day guide uses a cartoon with uniform whole-body tint, with no dots or rising liquid level. It explains absorption/removal and variation without predicting day-specific illness. Information/source links are included. The original selected date survives returning to Journey.
- Members can add/correct/delete their own dated wins, readings, clothes labels, feelings, started/changed/paused/finished treatment events and past injection sites. Optional medicine/dose text is confined to the treatment/injection record form and record detail. No next-site, dose, reminder or scheduling recommendation is made.
- Your snapshot is rebuilt from actual dated records. It is editable in the current session, requires member acceptance before sharing/printing, and relocks when edited. Sharing rechecks account identity and current source records; PDF uses the browser's print/save options. Nothing is automatically sent. Leaving/hiding the account clears drafts.
- Existing setup, weekly check-ins, photos, imports, other measurements and privacy/export controls remain available through Journey tools. The independently saved support notes are not overwritten or erased by this feature.

## Records and privacy

New records use `lifeBack.progress.journey` within the existing member-state JSON. No table, device connection, vendor, clinical feed or new account is added. `/v1/life-back/journey` reads only the authenticated member's records. Legacy weekly notes retain their week-ending basis; setup clothes labels carry their actual save date.

Writes use the existing Life Back operation endpoint and optimistic revision guard, require the expected account and trusted Origin, and update only the owned progress JSON. New health records require current consent and unpaused tracking at the actual database write. Erasure and display-only choices remain possible with tracking off. Retry operation IDs survive a lost response so a retry cannot duplicate the record. History is bounded without silently dropping older entries.

The existing Journey export includes the new namespace. Existing Journey deletion removes it atomically while retaining unrelated preferences. Browser state is cleared on sign-out/account deletion, account transition, page hide and visibility loss. No private records or drafts are stored in browser storage or analytics.

## Evidence

77 focused source/regression checks passed across the approved Journey, Life Back, support, route preservation, existing progress and Journey suites. They cover real authenticated SQLite persistence, account/Origin isolation, stale revisions, consent/pause races at commit, erasure with tracking off, export/deletion, genuine gaps/fluctuations, label-size semantics and illustration independence.

`npm run check` passes. `scripts/check-my-timber-journey-build.mjs` compiles the standalone support wrapper with the existing governed catalogue freeze. Its adjacent JSON receipt records the exact predecessor, compiler and before/after sizes; it does not represent provider-baseline composition.

Interactive Chromium checks used fictional accounts in an internal fixture generated from the production client and view functions. Checks included 360/390/768px frames without horizontal overflow; weight/waist/clothes switching; dated win/clothes saves; treatment/injection form access; keyboard and pointer graph selection; guide day selection and date-preserving return; snapshot acceptance/edit relock; account-switch clearance; and a lost-response retry retaining exactly one record. These are UI fixture checks, distinct from the real SQLite API tests. No real member record was read or changed.

Physical iPhone/Safari, native share sheets, completed PDF files, normal production login and real-member usefulness have not been established by this work.

## Before promotion

Complete the predecessor's broader qualification and compose this exact change against a freshly captured current provider baseline using the existing scoped release workflow. Recheck both owner modules, five-tab navigation/menu/Support routes, retained account/commerce/clinical responses, authenticated member isolation and the actual mobile sharing/print flow. Keep real Shed operation behind its existing separate decision. No live deployment, route, secret, staff allocation, spending or external communication is authorised by this source receipt.

Run the focused suite with `npm run test:journey-approved`. With repository dependencies installed, reproduce source compilation using:

```
node scripts/check-my-timber-journey-build.mjs b11b5d5c7761d6d0bd8085f571194e21c0f11857
```
