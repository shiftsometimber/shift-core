# Production acceptance — shared homepage header and footer

Runtime source 0c9e50db082f706c27115a0e9d056c0277d7b11b is deployed through native Pages b505454e-89f1-4750-9c1d-d21014085504 and the existing Shed Worker. Source is committed and pushed on the approved release branch; this route did not merge to main or deploy Core.

CLOSEOUT.json combines 907 original strict passes with all 119 focused rechecks, covering 513 distinct live URLs at 390px and 1440px. The original failed receipt is intentionally retained. All visible text, geometry, fonts, spacing and relevant image properties remain asserted. Unused image-only logo color and mathematically equivalent square image-fit values are normalized only with the separate pixel proofs. Cross-page screenshot hashes can differ because footer positions fall on different fractional pixels; the same-position contain/fill proof isolates the actual rendering effect.

QA scripts are exact historical executable inputs and expect the existing correction-1 evidence directory; they are retained for audit, not presented as standalone tests. Earlier receipts and native rollback deployments remain preserved. No further runtime deployment was needed for verifier corrections.
