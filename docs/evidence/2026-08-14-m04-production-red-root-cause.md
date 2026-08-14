# M04 production red root cause

Root cause: the production gate assumed Worker deployment readiness after a fixed sleep. The first merged-production run disproved that assumption with a restricted evidence-route 404. The remediation replaces elapsed-time inference with bounded route readiness and preserves the full member-journey evidence standard.
