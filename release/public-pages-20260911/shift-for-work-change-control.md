# SHIFT for Work: employer enquiry release

Authorised scope: Matt's SHIFT for Work launch plan, beginning with the pilot offer, employer page, two-page proposition and enquiry/privacy flow. This is an enquiry-stage preview, not employee enrolment or a commissioned service.

Baseline: public Pages production e48e72eada3234ff6e682ead3e882bea3f43fc8c, fingerprint bea98002e376482eb5111d6d1d9ad5e1708c3e893c777749f740b6ea172b9a59. Preserve the Treatment Centre correction. The separate Programme candidate is not modified.

Public-source additions: shift-for-work.html, one scoped stylesheet, one enquiry module, a two-page PDF. Refresh generated integrity records. No existing public page, navigation, homepage ticker, checkout or Worker change.

Enquiry integration: existing /v1/contact with type=partner; existing mail router sends to partners@shiftsometimber.co.uk and a confirmation copy to the enquirer. Business fields only. No employee lists, health fields, uploads or marketing opt-in. Preview submissions do not send.

Privacy design: employees choose whether to join; employers cannot open individual accounts or access health data. Group reporting is a future controlled release, not a live dashboard. No claims of clinical commissioning, employer results or signed partners.

Validation: exact before/after file manifest, HTML assets and form semantics, syntax, existing SEO and fingerprint checks, enquiry contract/error/privacy tests with simulated mail, two-page PDF render review, public preview browser review. No real enquiries or outreach are sent.

Deployment: existing Cloudflare Pages preview process only. Production stays unchanged. Any release-assembler extension for the downloadable PDF must retain byte verification and all preview/production approval gates.
