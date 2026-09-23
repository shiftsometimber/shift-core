# Postcode replacement candidate — not activated

The owner-reported residential postcode produced no complete house addresses in Photon. This is a provider-coverage failure, not postcode case or spacing. The production release stays held.

## Evidence

On 23 September 2026 the public Ideal Postcodes demonstration at https://ideal-postcodes.co.uk/postcode-lookup returned 68 selectable addresses for the reported postcode. The postcode is omitted from this public repository because the owner identified it as personal. This is provider-demo evidence, not SHIFT hosted integration evidence.

The documented shared `ak_test` key was tried once through the existing bounded adapter and timed out. It is not embedded in source or deployed and is not a substitute for a business-owned key. Homedata's documented unauthenticated endpoint returned HTTP 403; its marketing and API reference also disagree on authentication. It is not selected for this repair.

## Prepared implementation

- `MEMBER_ADDRESS_PROVIDER=ideal-postcodes` and a valid server-only `MEMBER_ADDRESS_API_KEY` are both required. Existing Photon configuration remains unchanged. No automatic paid fallback or activation from a stale secret.
- Authenticated same-origin POST retains strict input and response size limits. Only the normalized postcode and requested address-field names go to the fixed HTTPS provider endpoint; no member identifier, cookie, name or clinical data is sent.
- Complete exact-postcode results map up to 100 returned addresses without a 12-address cap or truncating address fields. The UI discloses when the first 100 may be incomplete. No invented houses or centroid fallback.
- Explicit selection populates both home/delivery forms. Existing conflicting flat/address-line-2 information blocks partial replacement and asks for review; recipient data is untouched. Save remains deliberate.
- No persistent query/result cache, retries or extra-page calls. Conservative per-isolate limits are not a fleet-wide financial quota; configure the provider's own daily limit before using a trial key.
- The provider and data-transmission disclosure follows the actual configured provider.

## Remaining activation step

Ideal Postcodes advertises a one-month trial with 50 credits and no credit card: https://ideal-postcodes.co.uk/postcode-lookup . That trial is not an ongoing free production service. The owner previously authorized open-source/no-signup testing, so a new provider account/trial needs approval. No account has been created, terms accepted, payment method entered, or paid balance purchased.

After approval, install the key as an isolated-preview secret, explicitly select this provider in the preview preparation/deploy guards, and replace Photon-specific hosted checks with real postcode-only address selection, save, refresh and fresh-login coverage for home and separate delivery. Keep quota low and automatic top-up off. Never place the key in source, generated config vars, browser scripts, logs or chat.

Re-run the relevant hosted matrix on the same isolated preview, retain the evidence, and seek the existing final production acceptance only after the reported postcode works there. Production pricing, stock, catalogue, orders and clinical/payment holds remain unchanged. Other outstanding register items remain open.
