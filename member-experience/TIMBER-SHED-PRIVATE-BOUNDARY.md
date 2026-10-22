# The Timber Shed — private My Timber data boundary

Status: implementation candidate only; feature disabled by default. Not a clinical approval or public launch.

## Non-negotiable member-data contract

- One existing My Timber login. The server derives member identity exclusively from the existing authenticated session.
- No member profile, weight, treatment, mood, mental-health, device reading, clinical note, personal message or contact detail is copied into the Shed.
- The private progress tracker has no member feed, posts, messaging, rankings, leaderboards or member-to-member data APIs. The separate, disabled-by-default forum pilot has its own explicit posting and moderation contract below.
- In the private progress tracker, the only optional persisted information is one member's activity identifier, completion state and one of three feedback choices. Free text is prohibited there. The separate forum pilot stores only deliberately submitted forum content after separate opt-in.
- Saving is opt-in, initially disabled, and can be switched off and cleared by the member.
- Only the authenticated member can retrieve their own activity ticks. Every database query is scoped to the authenticated user ID; the client cannot supply another ID.
- Same-origin writes, private no-store headers, no CORS permissions and a default-off feature flag. Never place private data in URLs, HTML source, analytics or server logs.
- Export adds the member's own activity ticks to the existing authenticated account export when enabled. Hard deletion of the owning user cascades the records. Manual account deletion and retention policy must be reviewed before a real pilot.
- The standalone design preview uses synthetic examples and remains entirely separate from My Timber data.

## Implementation locations

- `member-experience/timber-shed-private.mjs`: authenticated, owner-scoped progress endpoint and account export.
- `member-experience/timber-shed-page.mjs`: My Timber companion page, with no public member content.
- `member-experience/timber-shed-private.sql`: explicit D1 migration, **not applied to production**.
- `TIMBER_SHED_PRIVATE_ENABLED`: absent/false in production; must never be enabled without approved safeguards and separate release authority.
- Tests: `tests/timber-shed-private.test.mjs`, `tests/timber-shed-page.test.mjs`.

## Not yet approved or enabled

Clinical reviewer and content boundaries; adult-only eligibility; safeguarding and moderation cover; urgent-risk escalation; specialist charity arrangements; DPIA and controller/processor roles; consent language and withdrawal behaviour; account deletion/export end-to-end acceptance; accessibility; real session/account-isolation browser tests; integration with existing My Timber navigation; production migration; release/rollback; public domain routing.

No clinical advice, automated crisis detection or real community conversations are delivered to users while the feature remains disabled. The six-week activities are non-clinical drafts requiring editorial review before real use.

## Forum foundation — six rooms (private design only)

The Main Shed; Shifting Timber; Grub & Fit; Good to Talk; Small Wins; Life After Treatment. Twelve fictional conversation examples are available for design testing. These are not real user posts or clinical advice. The feature remains behind the existing default-off private gate.

**Publication safety contract for any future live forum:**

1. Joining My Timber or using the private tracker must not create a public profile or a community post. Community participation must be a distinct opt-in, with an appropriate privacy notice.
2. A member chooses a separate display name. No email address, real name, postcode, weight, treatment, check-in, diagnosis or other My Timber data is imported, auto-filled or exposed.
3. Only deliberate member-authored text can enter a proposed post. No auto-sharing from the tracker or Shift AI. Warn against identifying and sensitive disclosures; test for accidental leaks before submission and allow cancellation.
4. Every initial post and reply must enter a **non-public moderation queue**. Nothing becomes member-visible until approved by an authorised trained adult. Provide reject, redact, remove, report, block, appeal and audit controls.
5. No private messages, attachments, images, live location, member directories, searchable member profiles, outbound notifications or anonymous posting in the initial pilot.
6. Enforce age 18+, rate limits, session checks, CSRF controls, anti-abuse controls, moderation capacity and clear operating hours. Do not present the forum as a 24/7 support service.
7. Restrict dangerous content including eating-disorder encouragement, unsafe medication/dose instructions, self-harm or suicide methods, harassment and drug supply. Escalate safety concerns through an approved human-led process; don't promise automated crisis assessment.
8. Give members a way to delete or request removal of their own posts, understand retention and make privacy requests. Define the controller roles and lawful basis before any live posts.
9. No commercial targeting based on health information, no partner access to community data without a separate approved agreement, and no claims of charity endorsement without permission.
10. Test two fictional member accounts plus a separate moderator identity: no cross-account reads, pending invisibility, rejected invisibility, approved visibility only after moderation, deletion and exports, logged moderation actions and safe failure when moderation is unavailable.

## Forum pilot code — implemented but disabled

- `member-experience/timber-shed-forum-routes.mjs`: session-bound, verified-email, adult-DOB gated forum API; separate opt-in pseudonym; six rooms; private pending submissions; approved-only read; report; staff-only approve/reject/remove/dismiss and atomic moderation audit.
- `member-experience/timber-shed-forum-ui.mjs`: responsive branded forum, post/reply form, report reason selection and moderator queue. All user text is rendered with `textContent`, not injected as HTML.
- `member-experience/timber-shed-forums.sql`: isolated D1 schema, not applied to production.
- `TIMBER_SHED_FORUM_ENABLED` and `TIMBER_SHED_FORUM_PILOT_APPROVED` are additional independent default-off switches. No production setting has been enabled. Staff access is controlled by a separate `timber_shed_forum_moderators` table with inactive default.
- Tests use synthetic adults, a synthetic under-18, a separate moderator, actual in-memory SQLite and browser simulations. Failed audit insertion rolls back approval. No automatic member posting, no direct messages and no My Timber health-data reads.
- The password-protected design preview contains a **fictional, client-only** moderation walkthrough. It is not connected to the database or My Timber.

**Outstanding pilot blockers:** independent age assurance beyond a self-declared date of birth; named adult moderator coverage and training; formal clinical-content and safeguarding boundaries; emergency escalation; Ofcom online-safety assessment and reporting/complaints obligations; DPIA and privacy notice for voluntary member posts; separate community participation consent/choice; safe removal and appeal mechanisms; user post export and deletion requests; stronger PII and harmful-content detection; moderation staffing and response-time testing; external security and accessibility acceptance; operational recovery and rollback. The current prototype rejects some obvious contact details but does not guarantee sensitive information cannot be written into a post. Human review remains essential.

**Release rule:** Source code and a working synthetic UI are not a live moderated service. No real posting or member access may be activated without the outstanding gates, explicit release authority and verified acceptance. No public SHIFT page or thetimbershed.co.uk routing is changed.

## SHIFT Community Bouncer — private moderation foundation (22 October 2026)

**Approved public identity:** SHIFT Community Bouncer. **Tagline:** “Everyone’s welcome. Hassle isn’t.”

**Current implementation:** version `bouncer-rules-2026-10-22-v1`, a deterministic rule-based pre-publication screener. It is **not yet a language-model-powered service**, clinical assessment, crisis detector, safeguarding officer or autonomous moderator. It makes **no external AI API calls** and accesses **no My Timber health, mood, weight, treatment or device records**. Only the member's deliberately submitted forum title and body are screened. No automated publishing is permitted.

**What happens to each submission:**
- A separate community display name is required; the member deliberately writes the post or reply.
- The post and Bouncer's minimal rule IDs/severity/priority are written atomically to the private forum tables. No duplicate copy of the post is stored in the screening table.
- Bouncer labels possible categories: immediate safety, self-harm, eating disorder, medication, substance use, harassment, personal information, unsafe weight advice and sensitive mental wellbeing.
- **Routine** content is held for ordinary human approval; **review** content is held for careful human approval; **high/critical** content is held and cannot be approved through the ordinary moderator controls. An absent or superseded screening result also blocks approval.
- The private moderator queue is sorted by priority. The moderator sees categories and severity with the submitted words; no private My Timber records are supplied.
- The member receives a private confirmation. Potential immediate-danger language also receives clear 999/NHS 111/Samaritans signposting and an explicit warning that nobody may see the post immediately.
- Every approval, rejection, removal and report dismissal is human-controlled and audited. Audit failures roll back moderation changes. No direct messages or notifications are sent.

**Important limitations:** Pattern matching can miss urgent risks, misunderstand context and flag benign text. A routine classification is **not** a guarantee of safety. A high/critical classification is **not** a diagnosis. Bouncer cannot provide emergency monitoring or clinical advice, and the community must never promise continuous cover. The private preview shows **fictional scenarios**, not real moderation outcomes.

**Future AI-assisted capability:** Before any model receives member-written forum content, establish an approved provider and contractual data roles, UK GDPR lawful basis and special-category condition where applicable, DPIA, data minimisation and retention, access/audit controls, safety evaluation across representative and adversarial content, cost limits, human review, incident response and opt-out/appeal arrangements. No provider integration or transmission is authorised by this build.

**Operational launch gates:** named trained adult moderators, approved safeguarding lead and escalation pathway, professional review of high-risk content policies, Online Safety Act/Ofcom risk and children's-access assessments, robust age assurance, privacy and retention/deletion/appeal controls, test coverage and security review. High-risk content has no ordinary approval path until a separately accepted specialist-informed process exists. All real-member feature flags remain off; no production migration or public release has occurred.

## Member-controlled forum withdrawal

A signed-in member can review only their own submitted posts and withdraw a pending, approved or rejected post. The withdrawal is atomic with its audit record, changes status to `withdrawn`, clears the post title and replaces its stored body with a withdrawal marker. An approved parent withdrawal also hides its replies from the member-visible thread. The author cannot withdraw another member's content. This does **not** yet implement full erasure of backups, quotations, appeals, retention policies or regulatory data-subject requests; those remain release gates. No real-member feature has been enabled.

## AI-model moderation integration candidate (22 October 2026)

The server-side adapter `member-experience/timber-shed-ai-moderation.mjs` implements a separately gated **real model moderation API** integration candidate, using OpenAI's `omni-moderation-latest` endpoint for text classification. It does **not** run in production or transmit real member content while the gate is off.

**Activation contract (requires fresh approvals):**
- `TIMBER_SHED_AI_MODERATION_ENABLED=true` — enables model classification only within the already disabled forum pilot.
- `TIMBER_SHED_AI_PROVIDER_APPROVED=true` — explicit separate legal/privacy/data-processing approval. Without this, no third-party call occurs, even if the model feature flag is accidentally enabled.
- `TIMBER_SHED_AI_MODERATION_KEY` — server-only provider secret. Never expose it to browsers, repository, logs or public preview.
- The existing four forum gates remain required. No key has been created or configured as part of this build, and no live model call has been made.

**Behaviour:** The member deliberately submits a title/body. The existing local rules screen the same text. If and only if all gates are enabled and a provider key is available, the server calls the allowlisted model moderation endpoint with only the submitted title and body. The provider returns flagged categories; no generated answer or model-written forum content is produced. The server merges local and model categories conservatively, using the higher severity. Posts and screening metadata are inserted atomically and remain pending until independent human approval. High/critical or missing/outdated screening cannot pass ordinary approval. On a timeout, malformed response, rate limit or provider failure, submission returns an explicit error and no post is saved. The member's editor retains the unsent draft. Model identity, policy version, severity and category IDs are recorded; raw text is not duplicated in the screening table.

**Privacy:** Model processing would transfer voluntarily authored forum text to a third party. It is not equivalent to publishing it publicly, but it is a distinct data-processing activity. Forum text may contain health or mental-health disclosures. Before enabling, complete the DPIA, lawful basis and special-category condition where applicable, provider agreement and retention/region checks, transparency wording, appropriate age assurance and moderation/safeguarding acceptance. No My Timber health records, contact details, profile fields, identifiers, IP address or cookies are intentionally sent to the provider. The external model cannot be considered a safeguarding officer or medical professional.

**Coverage limits:** The model's categories include self-harm, harassment, hate, sexual content, illicit activity and violence. It is not a complete classifier for eating disorders, medication dosing, subtle privacy leaks or suicide risk. SHIFT's additional local rules and human specialist review remain mandatory. The model must not automatically approve or publish posts, and no model outcome is an emergency alert or promise of live monitoring.

**Testing:** Synthetic model responses and injected fetch mocks exercise the authorisation gate, minimum text-only request, category parsing, unknown-category handling, provider errors, no-publish invariant, risk merging, model-policy drift and no-write-on-failure. A real API connectivity check with **fictional text only** is still required after the service account and cost/data terms have been approved. No real member content should be used for initial tests.

## House Rule 1 — medicines, trial-stage treatments and peptides (22 October 2026)

**No member trading or promotion of medication — zero tolerance for deliberate breaches.** Members must not sell, offer, buy, swap, supply, give away, solicit, advertise, source, refer others to sellers or facilitate the transfer of any medicine, whether prescription-only, pharmacy, over-the-counter, licensed or unlicensed. The same prohibition covers trial-stage or investigational treatments, unlicensed injections, research-use peptides, products described as “not for human consumption”, spare pens and unofficial imports. No WhatsApp/Telegram/DM arrangements, affiliate promotions, supplier introductions or off-platform circumvention.

**SHIFT commercial boundary:** No experimental, investigational or unlicensed peptide product is offered for sale through SHIFT or The Timber Shed. Any future treatment offering must follow lawful UK marketing, clinical eligibility, independent prescriber and regulated dispensing/supply requirements, and separate clinical/commercial approval. Supplier assertions and “research use only” labels do not establish suitability or legality.

**Permitted discussion:** neutral discussion of legitimate published trials, regulatory developments and members' own treatment experiences, without sourcing, sales, unsafe dose instructions or promotion of unapproved use. A mere mention of a medicine, peptide or trial is not grounds for automatic punishment.

**Enforcement:** suspected trading is classified as high-risk and remains unpublished. Human moderators assess intent and context. Deliberate trading results in content removal and a permanent community ban under the approved appeals process; where necessary, escalate appropriately. Automated flags never themselves establish wrongdoing or execute a ban.

**Implementation:** Bouncer rules version `bouncer-rules-2026-10-22-v2` adds `medication-trading` and `investigational-treatment` signals. The first is high-risk; neutral trial discussion receives a review classification. Because screening policy versions must match at approval time, older pending posts are held until reassessed. No real-member forum activation.

## 22 October 2026 — OpenAI moderation connection readiness

Read-only Cloudflare verification confirmed that SST Mac is authenticated to the expected Cloudflare account, but the `shift-core` Worker has **no dedicated OpenAI moderation secret** named `TIMBER_SHED_AI_MODERATION_KEY`. No provider key was discovered in the current shell environment. Do not assume a ChatGPT subscription provides an API key. No key, billing arrangement, provider agreement or live API call was created by this check.

A **fictional-data-only connectivity smoke script** now exists at `tests/timber-shed-ai-synthetic-smoke.mjs`. It requires the explicit `--synthetic-only` argument and a dedicated secret supplied through the process environment. It sends three fixed fictional posts to the existing moderation adapter, outputs only model/classification outcomes, and never prints the secret or provider response. If no key is available, it exits non-zero without making any request. Its three dedicated unit tests passed, as did the full focused Timber Shed suite.

**Next dependency:** the SHIFT owner must create or authorise a dedicated OpenAI API project/key and its account/billing controls. Add the key only through a secure local test environment or Cloudflare secret configuration, never in chat, source code or public browser. Perform the synthetic smoke test first. This does **not** approve sending real member-authored text to the provider. That requires separate data-protection and clinical/safeguarding review plus explicit feature activation. Keep `TIMBER_SHED_AI_MODERATION_ENABLED` and `TIMBER_SHED_AI_PROVIDER_APPROVED` off for real members.

## 22 October 2026 — Private synthetic model endpoint deployed

The existing password-protected **design-preview Worker only**, `shift-timber-shed-private-20261022`, was updated to version `36da1168-5f84-44d7-a0dc-621f271a501c`. Its new same-origin, Basic-auth-protected `POST /__bouncer/smoke` endpoint uses **only three fixed fictional examples** and the existing Community Bouncer moderation adapter. A new private preview button triggers this synthetic test. No arbitrary visitor text or real member records are accepted by the endpoint. No API key is embedded in source or client HTML.

Verified: desktop/mobile fictional forum interactions passed; unauthorised preview and test endpoint both returned 401; the public `/timber-shed` route returned 404. The encrypted Worker secret `TIMBER_SHED_AI_MODERATION_KEY` is **not configured**. The user has created and copied a dedicated OpenAI key, but secure clipboard extraction was blocked by the remote tool's safety controls; no attempt was made to bypass them. The user must paste the key directly into **Cloudflare > Workers & Pages > shift-timber-shed-private-20261022 > Settings > Variables and Secrets**, as an encrypted Secret, then confirm saving. Only after that can the real model be tested with fictional data. This does not authorise production forum access or real member-data transmission.
