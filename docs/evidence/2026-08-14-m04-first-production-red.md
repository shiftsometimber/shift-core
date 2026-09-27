# M04 first merged-production red — deployment-readiness defect

Production Commissioning run `31793732771`, job `94746112968`, executed the merged M04 real-flow product analytics journey against main `575811bbfcb856fb0e6168d41913d52420d37165`.

The journey reached the commissioning evidence lookup and failed honestly because production returned HTTP `404 not_found` for `/v1/commissioning/product-events` after the workflow's fixed 35-second deployment sleep. Retained failure artifact: `9216542638`, SHA-256 `13ab0728eceaaeb53ca0e276e3a5160e68d9d50315fffb4d6af4ee6d767650d8`.

This is not M04 PASS and must not be reconciled as one. It falsifies the assumption that a fixed propagation sleep proves the new Worker route is live.

Remediation: the production proof now waits boundedly for the restricted evidence endpoint itself (accepting only endpoint-present states) before creating the synthetic journey member. The full unchanged funnel assertions remain required after readiness: registration order, verified login, onboarding, Today, Grub, Fit, Progress, Shift AI, real auth error, leave/return, retained state, required event set and chronological ordering.
