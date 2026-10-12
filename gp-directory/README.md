# UK GP directory — private candidate, 12 October 2026

Requested by Matt: all four UK nations, typing a surgery name to see suggestions,
nearer matching practices first, full address fill, manual entry and HQ access.

This prepares the existing SHIFT member/assessment lookup and HQ. It does not
open treatment, verify GP registration, notify any GP or change clinical consent.
No production database import, feature flag or deployment is performed here.

## Verified source coverage

The frozen downloaded files contain 6,163 active England practices, 398 Wales,
879 Scotland and 305 Northern Ireland: 7,745 practices. The linked ODS branch
file contributes 2,488 open branches with an active GP parent. Closed practice
history remains in the prepared directory, excluded from selectable suggestions.
These are counts of the official source files, not an assertion that every UK
private/new/unlisted practice is present. Manual entry remains available.

Sources:

- [ODS GP practice exports and specifications](https://digital.nhs.uk/services/organisation-data-service/data-search-and-export/csv-downloads/gp-and-gp-practice-related-data): `epraccur.csv`, `ebranchs.csv`. Select RO76 GP practices, excluding other prescribing settings; branch codes retain their parent practice code.
- [ODS home-country exports](https://digital.nhs.uk/services/organisation-data-service/data-search-and-export/csv-downloads/home-countries): `npraccur.csv` for Northern Ireland.
- [Public Health Scotland](https://www.opendata.nhs.scot/dataset/gp-practice-contact-details-and-list-sizes): practice contact snapshot dated 1 July 2026; 879 rows, official code normalised to `S` plus five digits. Snapshot age remains visible.
- [NHS Postcode Directory](https://digital.nhs.uk/services/organisation-data-service/data-search-and-export/csv-downloads/office-for-national-statistics-data): August 2026 `gridall.zip`, 1,748,230 live GB postcode points after country, termination and coordinate checks.
- [ONS licensing](https://www.ons.gov.uk/methodology/geography/licences/): Northern Ireland postcode coordinates require a separate commercial licence. No BT coordinate rows are retained in the prepared database; NI name/town/postcode/address search remains available. Resolve permitted NI geolocation separately, without approving costs or communications by inference.

## Behaviour and storage

`schema.sql` defines versioned directory/practice/postcode tables. The active
version must be complete and contain all four nations before serving suggestions.
`import.py` prepares an isolated local SQLite database, manifest, practice JSON and
SQLite restoration dump from frozen downloaded inputs. It never fetches patient
information or writes a remote database. Inputs and generated bulk files are held
under `work/gp-directory-inputs` and `work/gp-directory-prepared` on the source Mac.

The generated `directory.sql` is a **SQLite restoration dump**, not an approved
production D1 import script. A serving release still requires supported chunked
staging/import and verification, usage/cost confirmation, followed by atomic active
version selection. Do not execute this full dump against the production database.
Retain the current active version if any nation/import stage fails. No new refresh
automation is created; any ongoing refresh belongs to the existing operations owner.

The feature remains behind `MEMBER_GP_DIRECTORY_V2_ENABLED=true`; no production
configuration changes are made. Existing `MEMBER_GP_LOOKUP_ENABLED` remains.
Until the new flag and imports are released, the existing legacy lookup remains.

Search accepts name, town, practice postcode or code. All matching active records
are ranked before the returned list is limited. Optional `near` uses the entered
full postcode and local GB postcode table, with no external disclosure of a member's
postcode. Distances are approximate straight-line postcode-point distances, not
travel distances. Unknown or NI postcodes use clear name-order fallback. No practice
is automatically selected. Each selected branch retains its parent practice code.

The existing profile contact record gains optional `gpAddress` and `gpSelectionMode`
(`directory`, `manual`, `no_gp`). Older tabs preserve new fields when their existing GP
selection is unchanged and clear stale new fields if they change the selection.
Address corrections clear the directory reference. Existing account revision,
idempotency, export and erasure boundaries remain. No-GP status is member information,
not a clinical eligibility decision. The assessment script fills its existing full
practice-address field; clinical criteria, consent checkbox and submission stay intact.

HQ uses the existing authenticated `/v1/hq/management/gp-directory` route and CRM-read
permission. It shows source counts/date, name/address search and nation filter.
The companion `shiftsometimber/shift-hq` candidate adds `gp-directory.js` and one script
reference in `index.html`. The directory view is read-only, with retained results cleared
on logout/expiry. Member corrections do not rewrite the public reference directory.

## Validation and release limits

- 28 retained member-details/manual-address/lookup regression tests pass.
- 10 new tests pass: four-nation coverage, nearest ranking before truncation, NI and
  unknown-postcode fallback, branch parent identity, hostile/literal queries, incomplete
  imports, HQ role/flag boundaries, persisted full address/no GP, legacy tab preservation,
  member isolation and private route denial.
- 34 checks across six real-Chrome groups at 390 and 1440 px pass, with zero page errors.
  The member page uses the actual Settings card; assessment uses its actual template
  with submission disabled. HQ browser checks use the actual new component in a minimal
  HQ harness, not the full deployed dashboard. Fixtures and public directory data only;
  no external requests or notifications. Not a physical-device or production receipt.

Release owner: existing master/#1065 core lane and existing HQ source owner. Integrate
only the finite tested source against actual serving/current source; add required exact
composition/maintenance registration without weakening prior assertions. Confirm database
import/size/usage and NI data permission separately. Obtain scoped production approval,
required hosted gates, actual authenticated member/HQ acceptance and serving receipts.
All homepage, clinical, privacy, communications, spending and release controls remain.
