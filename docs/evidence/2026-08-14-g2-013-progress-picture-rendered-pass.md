# G2-013 — rendered Progress Picture persistence/reliability PASS

Date: 2026-08-14

## Commissioning boundary

G2-013 is not allowed to pass on API persistence, source code, a successful upload call or a green merge alone. Closure requires the real authenticated member journey through the rendered production product, retained state across a return, private ownership, successful deletion, mobile acceptance and retained evidence.

## Authoritative production proof

- Workflow: `G2-013 Progress Picture Production Acceptance`
- Run: `31768040389`
- Job: `94667884627`
- Main SHA tested: `b4cf1867d57d1af7ea979515c179587b7ba5cbe8`
- Evidence artifact: `9207081894`
- Artifact digest: `sha256:cb1c50b2ca2af99ae3f56c904cebddc1c44194f06b84584e6762d4bd2229db29`
- Artifact contents: `report.json`, `desktop-saved.png`, `mobile390-saved.png`

## Demonstrated journey

The unchanged production run completed GREEN and proved the same private real-photo journey at 1440x900 and 390x844:

1. A fresh authenticated member selected and uploaded a valid real image through the rendered Progress Picture product.
2. Optional weight and waist metadata were saved with the image.
3. The saved image decoded successfully in the rendered history at 256x256; the proof did not infer image availability from metadata or HTTP success.
4. The same saved image and equivalent retained measurement state remained visible after page reload.
5. The member logged out and returned through a fresh authenticated session; the saved image and metadata remained visible.
6. A separate authenticated member saw `No saved progress photos yet.`, proving member-private ownership rather than a shared gallery.
7. The original member deleted the photo through the rendered product.
8. The empty state remained after reload and after another logout/fresh-login return, proving deletion durability rather than optimistic DOM removal.
9. Both viewports recorded zero document-root horizontal overflow, with no browser console or page errors.

The run's retained report finished with `failures: []` and emitted the commissioning result: `PASS G2-013 Progress Picture: member saves a real photo through the rendered product, sees private retained history across reload/logout/login on desktop and 390px, another member sees none, and deletion persists across reload/return.`

## Scope discipline

This evidence closes **G2-013 persistence/reliability only**. It does **not** promote G2-014. The retained screenshots make the next boundary explicit: Progress Picture still needs homepage-standard premium presentation and member-UX refinement. Styling quality, visual hierarchy, member navigation and shared-control polish remain independently commissioned rather than being inferred from functional reliability.
