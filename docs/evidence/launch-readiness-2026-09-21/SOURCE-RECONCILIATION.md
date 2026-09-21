# Source reconciliation during verification

Initial authority was main `2d5931d9250f66c5196cf3629f52687dce6bdbb6`. A fresh check found main advanced to `eb39d3a00480404817a0d52e41965d75d133ffe6` through PR772 (BabyLove automatic publication and the guarded Mounjaro article correction). These are existing concurrent changes, not newly discovered requirements or work implemented by this batch.

The repair branch incorporates all nine changed main files. Eight are retained byte-for-byte; worker-entry-v6.js combines the three exact new route/discovery changes with the existing narrow promise-response repair. The remote integration commit has both the repair head and current main as parents. Forty publication/editorial/promise tests passed locally before integration. The final preview must rerun the combined tree; results from the prior tree cannot close the release gate.

The inherited article closeout workflow runs after a successful production promotion and checks a specific receipt/body before modifying it. This batch has not run it. Its current completion must be reconciled before any production approval, so a later promotion cannot unexpectedly become first publication of the pending article. Preserve its authored guards and content; no blanket replay or workflow bypass. Main identity alone is not proof that its production workflow succeeded.

Production remains approval-gated. Capture the actual current Worker and protected catalogue immediately before any approved release. Retain new recovery stores and successful member/auth/payment effects on code rollback.
