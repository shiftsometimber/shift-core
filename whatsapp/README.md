# SHIFT WhatsApp connection — implementation checkpoint

Owner: Matt. Direction approved in this conversation: direct Meta WhatsApp API → existing SHIFT AI → HQ. Business number: +44 7932 618313, username shiftsometimber. Personal signature mobile is unchanged. No homepage changes.

## Current state

Implemented in source, with 60 local SQLite/AI regression checks passing and one existing skipped test. Tests use mocked AI; no charges incurred. Not deployed, connected to Meta, or delivery-tested. No paid provider, API sending, or automatic replies enabled. Keep PR #1401 as the single review/change record.

## Implemented connections

- `GET/POST /v1/integrations/whatsapp/webhook`: Meta verification handshake, raw-byte HMAC verification, allowlisted account/phone IDs, bounded payload, duplicate-safe text ingestion and attachment placeholders. No media download and no outbound Graph calls.
- `GET/POST /v1/member/whatsapp` and `/member/whatsapp`: existing member session authentication, ten-minute random linking capability, WhatsApp proof then authenticated member confirmation. Never match a member solely by telephone number. Link codes are hashed and excluded from the inbox and AI context.
- `GET /v1/hq/whatsapp` and `/hq/whatsapp`: existing HQ sessions; owner, admin, operations and support can read. Clinical and readonly roles are excluded. Owner-only draft preparation, with CSRF checks. No send button or send endpoint exists.
- `POST /v1/hq/whatsapp/draft`: existing Workers AI model and published SHIFT knowledge. Disabled unless both explicit AI-draft and approved-budget flags are true. Zero default daily allowance; maximum 20 attempts daily; 350 output-token ceiling. Clinical, urgent, attachment and secret-like messages require human review. Failed attempts consume a slot; no automatic inference retries.
- Existing SHIFT AI conversation memory reads only future messages from the current, member-confirmed link and opt-in. Existing tracking consent, paused state, auto-memory settings and withdrawal boundaries still apply. Messages remain untrusted private context, not verified facts or public training/knowledge.
- Privacy export includes that member's linked records; optional-health erasure deletes linked messages and links. Disconnect removes memory access immediately. Relinking creates a new generation, so previous context cannot return automatically.
- HQ and member Settings have connection links. Homepage and email signatures remain unchanged.

## Retention and review

Text/drafts: 30 days. Expiring link requests: ten minutes. Content-free WhatsApp audit: 90 days. Ingestion/link changes and HQ inbox reads are recorded. Scheduled cleanup runs only when inbound capture is enabled. Failed cleanup is logged without stopping other scheduled jobs. These periods are an implementation proposal requiring inclusion in the privacy/DPIA review before live personal-data ingestion. Existing health/privacy controls also govern AI context.

## Activation prerequisites — still outstanding

1. Deploy the exact reviewed source through the established guarded production workflow; apply `migrations/021_whatsapp_shift_ai.sql` to the intended database first. Do not remove existing release checks or deploy an old checkout.
2. Confirm Meta Business ownership, API eligibility and the supported coexistence onboarding route for the existing Business app number. Do not deregister/migrate the working app number blindly.
3. Configure secrets through authorised secret management: `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (high-entropy random), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`. No secrets in chat, source or logs. Capture and validate actual IDs; the public mobile number is not the API phone-number ID.
4. Set `WHATSAPP_INBOUND_ENABLED=true` only after schema, privacy notice and integration readiness checks. Subscribe the app to the intended WhatsApp account and messages webhook at the production endpoint. No external setup, subscription or customer communications have been performed by this build.
5. Keep `WHATSAPP_AI_DRAFTS_ENABLED=false`, `WHATSAPP_AI_BUDGET_APPROVED=false` and `WHATSAPP_AI_DAILY_LIMIT=0` until the applicable tariff, existing Cloudflare allowances and a budget are explicitly approved by Matt. A local attempt cap is not a provider-level monetary cap.
6. Test a signed genuine incoming message, duplicate retry, My Timber linking and disconnect, owner HQ inbox and privacy export/erasure with an authorised test account. Unit tests are not live delivery evidence. Any test messages sent by SHIFT require Matt's approval of the exact text and recipient.
7. Automatic sending is outside this implementation. Preserve Matt's complete-draft-and-recipient approval rule. No paid billing method, token for sending, external chatbot subscription or commitments are authorised.

## Verification

`node --test tests/whatsapp-connections.test.mjs tests/ai-connected-member.test.mjs tests/ai-stream-reliability.test.mjs`

Checks use an in-memory SQLite database and mocked AI. No WhatsApp sends, real AI inference, or external charges are generated by these tests. Existing historical release-fixture/worktree incompatibilities must be resolved in the release environment before claiming publication.
