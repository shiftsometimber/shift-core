# SHIFT: open-source first; no paid address provider during initial testing

Owner decision, 23 September 2026: Matt chose Photon + OpenStreetMap for initial testing and asked to use open source wherever practical. This replaces the earlier assumption that an Ideal Postcodes key/credit purchase is required for this stage. No signup, trial, paid key, new hosting service or recurring spend is authorised.

## Bounded implementation

Continue the current account-completion candidate, PR #792, from `a09a339c0cb312cca78dea9063eace8688843eda`, preserving the live `4c014edce24bd9a37645dfbd6bad204ed3270091` release. Enable `MEMBER_ADDRESS_PROVIDER=photon` in the existing isolated preview only. The account details and separate delivery forms share optional address suggestions. No clinical, pricing, stock, theme, navigation, password/email-change or checkout behavior is redesigned in this change.

A postcode alone does not reliably return all houses from Photon. Members can add a building/street search term, explicitly request suggestions, select a match and check it. Only complete mapped UK addresses with a returned postcode exactly matching the requested postcode are selectable. No postcode centroid, county-as-town substitution, invented house number or nearby-postcode guessing. Manual entry, browser autofill and existing save/retry flows remain first-class. Missing OSM results are not an invalid-address verdict. This is not Royal Mail/PAF postal verification or a complete UK address directory.

## Service use, privacy and licences

Photon's public demo allows reasonable usage, may throttle/ban excessive use and has no availability guarantee. This pilot therefore makes no per-keystroke request, performs no bulk scraping, uses a fixed server-side endpoint, sends only the explicit postcode/building/street query, does not forward member cookies/name/email/health fields, retains no persistent search log, and uses bounded short-lived public-result caches, conservative per-isolate request caps and a circuit-breaker. The per-isolate guard is not an aggregate/fleet-wide quota. Review aggregate use before broader promotion or growth. Standard existing Cloudflare/CI resource usage still applies; zero provider fee does not mean hosting is intrinsically free.

Visible attribution links to OpenStreetMap's ODbL terms. Photon is Apache-2.0; OpenStreetMap data is ODbL. Calling an open-data geocoder does not authorise publishing private member addresses or health data. No Nominatim public autocomplete and no paid-provider automatic fallback. The retired Ideal adapter's isolated historical contract tests may remain; the active route cannot invoke it, even if a stale key exists.

Sources checked 23 September 2026:
- https://github.com/komoot/photon/blob/master/README.md
- https://github.com/komoot/photon/blob/master/docs/api-v1.md
- https://www.openstreetmap.org/copyright

## Open-source-first rule for future work

Prefer maintained open-source software, open standards, portable/exportable data and existing platform capabilities when they meet the requirement safely. Check software AND data licences, privacy, security maintenance, service limits and total running costs separately. Reuse shared components; do not invent another service for every form. Do not replace working systems just for ideology. Existing approved systems and the one-source/no-regression release discipline remain protected. Any new subscription or paid upgrade needs Matt's approval. Self-hosting Photon or replacing its endpoint is a later explicit infrastructure decision, not free magic.

## Acceptance and release

Keep source/database and hosted browser evidence separate from live delivery. Prove real public-address selection through the hosted Worker (bounded samples), empty/missing provider, outage, stale responses, deliberate selection, home/delivery independence, attribution, safe minimal requests and save/reload. Rerun the existing account, GP, delivery and email preview matrices. Do not count mocked UI cases as real provider coverage or browser emulation as physical-device certification. Retain failures and limitations. No production merge/deploy until the bounded candidate and retained release gates pass.
