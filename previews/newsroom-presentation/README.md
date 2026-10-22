# Newsroom presentation — live, 22 October 2026

The reviewed design is deployed and verified at https://shiftsometimber.co.uk/shift-newsroom. Matt explicitly approved publication with “Mega, go live - then go to next now !”. Release source 0435b8445ec7239a3ab897bee0dae7bd9f94aa64, version 20261022-newsroom-live-v1; approved design remains 20261022-newsroom-preview-v2-refined. See live-receipt.json for the exact source, approval, activation, acceptance, artifact digest and rollback evidence.

Successful run 39744870354/job 119711207028 passed nine contracts, four hosted staging and four actual public Chromium/WebKit mobile/desktop passes, native GET browsing without JavaScript, eight canonical destinations and twelve host/protocol/path variants. All 176 published headlines, links, classifications and first-publication dates remain intact. The worker reads the current published index through Core on every render; source-fixture.html is never deployed. Two scoped Newsroom route families are owned; all 192 previous routes and shared header/full footer are preserved.

Search, quick topics, detailed filters, sorting, back navigation, progressive batches and native forms work. No stories, private APIs, account data, authentication, consent or clinical decisions were changed. Source-date distinctions and genuine first-publication dates remain visible.

Earlier attempts stopped safely or restored only their own routes after read timeouts. The superseded verifier's unbounded font wait was removed; checks now have explicit deadlines, progress evidence and one bounded retry for transient route reads. The successful final run needed no rollback. Do not repeat production activation on the active worker. Keep subject evidence on this proof branch; publication workflows are restricted to the release branch.

The isolated reviewed preview remains available. About and the My Timber Menu addition are the next previews and have no production approval. Master, Core/TRT, Medicines Watch and broader reconciliation/performance work stay paused.
