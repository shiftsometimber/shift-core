# Growth release checkpoint — 28 September 2026

Matt approved deployment at 11:11 BST. Approved preview: 44c5ebcef492ee9b6476f0343737afb085f579f3. Integrated release candidate: b5651c88dde94d9d7b4f787ace2f0b0b51e631bd. All applicable PR checks and preview run 36409380964 passed before PR835 was merged as 2ac10333105ae3836d135ce188d6b82f3f463ac2.

The existing My Timber PWA Production Release workflow also watches worker-entry-v6.js. Its run 36409933320 deployed that exact current main after its existing PWA/preservation checks. The parallel Cloudflare Production Promote run 36409933495 is therefore a duplicate deployment path, not the sole release path previously assumed.

This documentation-only checkpoint advances main so the existing current-main guards must stop the superseded duplicate promotion before its deployment. No application or configuration bytes change. Do not redeploy the same candidate to manufacture a second receipt. Complete read-only full release verification and synthetic-account persistence on the deployed candidate, and reconcile the overlapping workflow triggers before the next runtime release.

Status: deployment observed; full post-release acceptance pending. This checkpoint is not an all-clear. Preserve the original PWA deployment-before artifact for rollback authority.
