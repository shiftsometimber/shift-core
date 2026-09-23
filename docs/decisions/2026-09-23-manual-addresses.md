# Manual home and delivery addresses

The owner rejected paid postcode lookup and instructed removal of the feature on 23 September 2026. This supersedes the earlier Photon pilot and the unactivated Ideal Postcodes replacement candidate. No account, trial, payment or subscription was created.

Home and separate delivery addresses use ordinary editable fields, with browser address autofill retained. Remove find/search controls, suggestion lists, provider disclosures and unconnected-provider messages. Existing address validation and deliberate save, reload, concurrency, retry and data-preservation behaviour remain.

Remove both the Photon runtime/client and the unused licensed adapter from the active application. A retired same-origin authenticated address-search endpoint returns HTTP 410 without accessing any provider, regardless of stale provider flags or keys. Remove address-provider configuration; the runtime configuration is otherwise byte-identical to the newer released main.

GP suggestions remain. They use the open-access NHS Organisation Data Service directory for England and Wales and require no paid address-lookup account. Manual GP entry remains available. The NHS source is https://digital.nhs.uk/developer/api-catalogue/organisation-data-service-ord . Do not claim complete UK coverage or verified patient registration.

Verify manual home and separate-delivery save/reload/fresh sign-in, preserved flat/recipient details, no address-search controls or requests, retired-endpoint behaviour and the retained GP matrices in the same isolated preview. Existing production approval and other outstanding register items remain separate. No changes to prices, stock, orders, clinical/payment holds or production data.
