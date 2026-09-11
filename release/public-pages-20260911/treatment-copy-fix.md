# Treatment Centre supply-status correction

User instruction: close the live contradiction between the Treatment Centre order promise and Mounjaro supply-status copy.

Scope: replace one sentence in treatment-centre.html, in both the initial HTML and the existing inline script that restores this section. No other content changes.

Baseline: exact production source at 4fb3f2326e41a58ed248c1784425523c60892457. Existing preview e5f892789a495ed2ce7b10952adb4924fdb17717 remains preserved in Git.

Release: existing Pages repair workflow, guarded by the current production fingerprint; verify the exact preview before promotion. Preserve all existing release gates.

Validation: 871 files reproduced byte-for-byte from the production manifest before the change. Only treatment-centre.html and its two generated integrity records differ after the change. Existing SEO integrity check passes across 457 pages. Existing fingerprint verification passes. Production source fingerprint confirmed in the live browser before release.
