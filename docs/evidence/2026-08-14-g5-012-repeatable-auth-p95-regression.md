# G5-012 — repeatable production auth p95 regression

Date: 2026-08-14

Status: **AMBER — prior PASS invalidated by repeatable fresh production breach pending remediation and fresh proof.**

The declared member API p95 budget remains **800 ms**. Password security, PBKDF2 work factor, verified-email guard, lockout semantics and session-cookie security must not be weakened to recover the number.

Two consecutive fresh main-production commissioning executions breached the unchanged login budget:

- Run `31797697394`, job `94758310882`: registration p95 **504 ms**; login p95 **895 ms**; budget **800 ms**. Retained artifact `9218085017`, digest `sha256:097efbb649146f0aec55cb5247b7c25df52b7a1e7530804b7c799beab2e7aba5`.
- Run `31798221179`, job `94759928178`: registration p95 **581 ms** across 17 successful member-handler samples; login p95 **852 ms** across 8 successful natural production samples; budget **800 ms**. Login samples were 683, 709, 658, 700, 664, 693, 852 and 677 ms. Retained artifact `9218280623`, digest `sha256:78a5a499a85b76f986d9231fe63307d96cc614fe9b4d6584595117fc9cc17ae0`.

The second run also remained green for core production health, G1-010/M05 security and privacy, Radar freshness, longitudinal Grub/Fit learning, B03 Progress Picture + Shift AI, M07 structured Grub/Fit serving, G2-006 Fit duration quality, rendered Shift Today/G4-008 and the Gate 3 premium system. This is therefore a bounded performance regression rather than evidence of a general production outage.

Current source already uses the bounded member-login fast path and keeps successful post-password D1 mutations in one batch. The next remediation must reduce real login-path latency or prove a genuine production-side cause; changing the 800 ms budget or weakening password verification is not an acceptable closure.

Acceptance to restore PASS: fresh unchanged production commissioning must demonstrate the declared 800 ms p95 budget again with retained evidence under the same security contract. Until then, G5-012/M06 is not PASS.
