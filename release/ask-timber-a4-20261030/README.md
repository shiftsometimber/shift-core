# Matt’s approved Ask Timber A4

Matt selected A4 on 30 October 2026 after reviewing six concepts. This release implements the question-first cream composer, compact photographic topic selectors and six photographic wider-health prompts. The four photo tiles are the existing topic controls; the duplicate selector row in the concept is omitted.

The current form, question/response IDs, question client, prompts, answer behaviour, privacy and non-clinical wording are preserved. The live module graph, bindings and routes are captured and retained; only an outer presentation wrapper and four image modules are added to the existing Ask owner. Homepage and SHIFT Health main bodies must remain identical. No data writes, account changes or new routes.

New assets were produced with the built-in image-generation tool from the approved A4 reference. Production copies are `assets/food.webp`, `assets/movement.webp`, `assets/weight.webp`, `assets/wellbeing.webp` (900×600). Prompts recreate respectively: hands chopping vegetables; a stocky man walking in a leafy park; a stocky man writing at a kitchen table; a stocky man relaxing in his garden. Natural warm editorial photography, no labels/UI/text. Existing approved Health images illustrate the six smaller wider-health buttons.

`check.mjs` verifies preservation and ordering against the actual delivered page. `deploy.mjs` verifies staged provider bytes, current ownership, bindings, assets, live HTML and protected pages. It promotes only the approved design and restores only its own predecessor if its verification fails. The shared production concurrency group is retained and active operations are never cancelled.

The approval reference is the Library image `Ask Timber question composer mockup.png`, `libfile_982c49f8ed2481919eadd05bfee3776a`.
