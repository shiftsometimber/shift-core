REC-031 — Matt's 12 September correction

Restore the already prepared direct quiz handoff to the full five-medicine workspace. Use the exact requested heading: Based on your answers, this could perhaps work for you…

Current live Pages fingerprint: 0111ddc13262846355df76dd5f2b3067b02dca9d92716105bf4bf24f9394e665. Source pinned at d6813b403f7fbca648e089c1e1332a2fed61edac, including the latest login repair. This branch publishes Pages only; no main merge or core/HQ deployment is authorised by this workflow.

The preparation script validates the existing compressed source and changes three application files plus two manifests. All other 867 files are preserved. Current core main b3b86d41d1283d08e7b1e464f72e7aa72fa5b082 and Worker 24d239bc-a944-4ec8-986b-b0660faf8ff2 remain untouched. Keep the no-medication branch, preference algorithm, existing images, five-medicine comparison, dose behaviour, clinical/stock/payment guards, chrome and homepage ticker exclusion.

Exact before/after hashes are in start-here-source-proof.json and application diff in REC-031.patch. Local verification reproduces all 872 candidate contents. Preview browser acceptance must pass before changing control.json to production. The full recovery ledger was updated to version 23 before application edits.
