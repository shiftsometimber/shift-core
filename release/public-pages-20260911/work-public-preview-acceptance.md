# REC-032 preview acceptance — 12 September 2026

Matt approved the SHIFT for Work preview and instructed “go” after publication, clear navigation and enquiry delivery verification were proposed. The scope is the employer enquiry page, not activation of employee pilots or testing.

Reviewed application candidate: https://34e87069.projectshift.pages.dev/shift-for-work

Commit: 62c0d94cfab37d166784a9bfd1188931ede91dd4

Successful preview run: https://github.com/shiftsometimber/shift-core/actions/runs/34716781373

Fingerprint: b442d929e95a45662af1f5b94e985811cf6726aa16b2f18818e5d8f1f172ebdb

Compressed payload SHA-256: 9dc3abc836998908a6c0e71ac74940f41a34fe8e4837020c73a11fd2c6ffebea

## Source and delivery checks

- All 876 candidate application files reproduced with exact bytes and hashes; 875 fingerprint entries exclude the fingerprint itself. Four approved employer assets added. 429 existing files byte-identical. 440 existing HTML pages have only the declared link edits, verified by normalising those exact edits back to the original bytes. The remaining existing changes are sitemap and two manifests.
- The quiz JavaScript is byte-identical to the locked live source. The Start Here cache reference, direct handoff, exact treatment H1 and no-homepage-ticker rule passed uploaded-source checks.
- Existing 458-page SEO integrity and all ten enquiry contract/error/privacy tests passed. The tested contact and transactional-email modules have Git blob identities 2ada7e0cbf02be7d1c70e34ef6328a44103bb8ec and 374f26216d192ab87799ce165c1e96f0e2486051, equal to current core main.
- First preview run 34716662256 stopped before upload because the fingerprint generator sorted paths as strings instead of the authoritative pathlib ordering. Corrected the generation order; the unchanged fingerprint verifier then passed. No gate was relaxed.
- The candidate uses the approved original photograph, scoped stylesheet, enquiry client and PDF. It does not restore any old full-site payload or the fictional workplace preview assets.

## Browser acceptance

- Desktop page rendered the approved H1, original image, commercial copy and enquiry form. A visible opened menu contains SHIFT for Work; the footer contains a matching link.
- Fictional business details completed the actual preview form. The result was “Preview only: your enquiry has not been sent. No details have been stored.” No email or employee record was created by this preview test.
- Actual candidate documents were framed at 1440, 1024, 768, 390 and 360px using the explicitly additional noindex preview-only review harness. Content widths were 1425, 1009, 753, 375 and 345px because each frame reserves a 15px scrollbar. In each: scrollWidth equals clientWidth, one H1, header top zero, footer below main, and no visible broken completed images. Desktop and the narrowest layout were visually inspected; headings and CTA remain readable.
- The initial top-document read did not expose frame contentDocument and was not counted as evidence. Frame-scoped locators subsequently read each actual document successfully. Occasional scroll/keypress timeouts were followed by inspection of settled state.
- This is Chromium frame-width and desktop evidence. Native Safari/iPhone/Android and a full assistive-technology audit are not claimed. The separate QA harness is omitted entirely from production; approved application bytes are identical.

## Final production check

Publish only this fingerprint after rechecking the locked live fingerprint and approved preview. Verify the live page, drawer/footer route, PDF bytes, sitemap, locked Start Here handoff and exact wording. One clearly labelled internal enquiry will use SHIFT's own verified hello/partners addresses to verify actual mailbox delivery; no employer outreach or staff data is authorised. Core/HQ deployment and employee pilot flags remain outside this release.
