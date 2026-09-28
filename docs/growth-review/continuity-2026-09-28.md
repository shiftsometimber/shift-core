# Continuity entry and retained-support review

Owner: Matt (business/release); Codex (implementation and checks). Preview only.

## Demonstrated gap and smallest change

The current clinic-gone-quiet and provider-switch primary buttons both point to Start Here. The underlying member tools already exist. Reuse them: direct both buttons to `/member/dashboard?entry=continuity#today`, explain free support and add a contextual arrival inside the existing Today panel. Do not infer that a person changed provider, save a new health state, reset onboarding or modify recommendations from this query parameter.

The entry flag is a navigation hint, not a medical fact. It is not persisted or sent as a new analytics event. Normal My Timber visits are unchanged. Existing clinical guidance, header, drawer, footer, SEO metadata and support links are retained byte for byte outside the primary CTA and added explanation.

## Capability inventory

| Capability | Evidence and boundary | Current position |
| --- | --- | --- |
| Same account | Existing session-state and account-backed APIs; no provider prerequisite is added | Reused, not replaced |
| Journey and Life Back goals/check-ins | Existing member-state and Life Back API; regression tests cover account separation, consent and persistence | Source verified; hosted returning-member check included |
| Next Shift and feedback | Existing linked daily action and Life Back loop; negative feedback and logout/login tests retained | Source verified; same-preview browser/API checks included |
| Grub and Fit | Existing signed-in routes, saved plans and activity; no treatment purchase gate introduced | Reused; full nutrition/movement regression suites retained |
| Data choices | Settings health-consent manager supports consent review/withdrawal, optional-history erasure and export | Existing controls; no change to privacy handling |
| Data export | `healthExportAction` downloads `shift-my-data.json`; linked-feedback export unit test checks own-member restriction | Technical JSON export, not a clinician-ready handover or plain-language report |
| Clinical record transfer | No receiving-provider agreement or supported transfer verified here | Not promised or implemented |
| Prescription continuation | Remains the responsible clinician's decision | No automated recommendation or promise |

## Acceptance and evidence

The preview build must run all existing member/public-shell tests plus the new preview-preservation tests. Browser checks cover Chrome/WebKit at 390/1440 widths, both public pages, one visible primary route, no overflow, signed-out returnTo preservation, restored-session arrival, reload without writes, and return with unchanged saved Life Back progress and existing Next Shift. The screenshot/JSON evidence is stored by the existing workflow with checksums.

Restoring a fixture session is not proof of real email delivery or the complete public registration journey. Physical devices, store-wrapper parity and the full production release matrix remain separate gates. No production deployment is authorised.

## Separate backlog; no implementation authorised by this change

- Member-readable export: define exact fields against the existing JSON schema, include dates and member-reported labels, exclude clinical interpretations, then test account separation and escaping. Initial engineering estimate 1–2 days plus review, not a quote or spending approval.
- Consent-based handover: blocked on a named receiving service, agreed minimum data, secure destination, consent/revocation rules and failure ownership. No credible delivery estimate until those are known.
- Full new-account route: verify real onboarding and consent in the production-equivalent isolated flow before release; do not count the fictional review shortcut as public registration evidence.

## Company decision

This removes a detour for elsewhere-treated members and sets expectations using existing delivery capability. It strengthens a connected support experience; it does not prove superiority over competitors or prevent imitation. Acquisition, economics, employer and founding-group workstreams are not completed by this page change.

Rollback is the previous preview branch revision. There are no schema migrations or member-data writes introduced by this change. Production still requires exact-candidate approval and the full release gates.
