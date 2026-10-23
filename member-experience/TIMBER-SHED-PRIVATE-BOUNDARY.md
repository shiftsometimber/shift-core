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

## 22 October 2026 — Member journey, conversations and in-app notifications (private build)

**Member journey:** An authenticated, verified adult My Timber member deliberately chooses a separate community display name. The private forum presents Latest conversations, Discussion rooms, My posts and Notifications. An authorised moderator additionally sees a private Moderator queue. New submissions enter My posts immediately as **Awaiting moderator review**; they do not appear in any public/community feed until approved. After approval, a top-level discussion appears in its selected room and in Latest conversations, with the room name, chosen community name, date, short excerpt and approved reply count. Members open the discussion to read approved replies beneath the parent post. The room index supports 20 approved topics per page with an Older discussions control; the specific discussion view is scoped to its approved root and replies. Removed or withdrawn parent posts and their replies are hidden.

**Notifications:** An in-app bell/Notifications tab, not email, SMS, push or WhatsApp. Only the authenticated recipient can list or mark notifications read. A member receives generic, content-free notices when their own post is approved, rejected or removed; the parent author receives an additional notice only after a different member's reply has been approved. No notice is sent for a pending submission, which remains visible only in My posts and the moderator queue. The moderator sees pending posts and reports in a separate restricted queue with counts; there are no external alerts or continuous monitoring claims. The unread count updates when members open/refresh the community, and older notifications can be paged in groups of 20. Removal or withdrawal clears stale notification links for the affected discussion. The system does not proactively send communications or request notification permissions.

**Data and integrity:** `timber_shed_forum_notifications` stores only recipient account ID, post/thread/room references, generic event type, creation/read timestamps and a unique deduplication key; no post body, real name, email, health record or device token. Notification creation is atomic with the human moderation decision and audit record; failures roll back the decision. Withdrawal clears related in-app notices so removed discussions cannot be opened through stale alerts. Read operations are account-scoped and idempotent. Database schema changes remain unapplied to production.

**Safety correction:** Bouncer `bouncer-rules-2026-10-22-v3` additionally flags proposed sharing of personal addresses and similar information as high-risk, closing the specific gap found during the fictional live-model smoke test. Existing pending posts screened under older policy versions cannot pass ordinary approval without rescreening. A classifier cannot guarantee that every sensitive disclosure is caught; trained human review remains mandatory.

**Verification:** 81 focused automated tests passed, including in-memory SQLite tests for notification privacy, account isolation, atomic rollback, read state, approved-only latest feed, paginated rooms, thread scoping and withdrawal. Desktop and mobile synthetic browser acceptance passed for display-name creation, pending invisibility, approved feed, nested replies, in-app unread/read controls and a moderator queue with high-risk approval blocked. No real-member data, email, push, SMS or external message was used.

**Release boundary:** This is committed development work only, behind the existing default-off feature gates. Real forum activation remains blocked by safeguarding staffing, appropriate age assurance, DPIA/provider and online-safety assessment, account/session and data-retention acceptance, and source/CI release checks. The password-protected static design preview is not the real authenticated member service. No public route, production migration, app-store release or member notification was activated.

## 22 October 2026 — Timber Shed email identity and notification drafts

Matt confirmed that `timbershed@shiftsometimber.co.uk` is the intended **incoming** mailbox for moderation reports, safeguarding review notices and community administration **and** the intended **outgoing From/Reply-To** address for member community notifications. This is mailbox-identity approval only, **not approval of any email wording, recipients or sending**.

Registered the identity in `transactional-email-v1.js` and prepared pure, non-sending templates in `member-experience/timber-shed-email-drafts.mjs` (`timber-shed-mail-v1-draft-20261022`): four member events (approved, rejected, removed, approved reply) and three moderator events (pending post, reported item, priority review). Each template has explicit From, To, Reply-To, subject, full text, no CC/BCC and no attachments. Member drafts use an individually supplied intended recipient address; moderator drafts address the dedicated Timber Shed mailbox. No post bodies, member identities, health disclosures or clinical records are included in the message body. Links go only to the authenticated My Timber Timber Shed route. Templates include a no-emergency-monitoring warning.

**Delivery remains disabled:** `TIMBER_SHED_EMAIL_DELIVERY_ENABLED=false`; no mail-provider call, mail queue, scheduled dispatch, outbound messages or inbox test has been added. The existing in-app notification system remains the only implemented delivery channel. Do not send any template or test email without showing Matt the exact full draft and recipients/attachments and receiving his fresh explicit approval to send. Confirm mailbox existence and actual send/receive, sender authorisation, SPF/DKIM/DMARC alignment, delivery and bounce handling, moderation recipient staffing and incident escalation before enabling. DNS currently indicates Microsoft 365 MX, SPF, DKIM selector CNAMEs and a strict DMARC policy, but this does not verify mailbox-specific delivery. No spending or external commitments authorised.

## 22 October 2026 — Shared mailbox configuration verified

Microsoft Exchange Admin Centre on SST Mac confirms a distinct **SharedMailbox** named **The Timber Shed**, with primary address `timbershed@shiftsometimber.co.uk`, separate from Matt's `UserMailbox`. It reports approximately 0.02 MB used of 49.5 GB. The existing licensed account `matt@shiftsometimber.co.uk` was granted and independently verified as the sole delegate for **Read and manage (Full Access) (1)** and **Send as (1)**. **Send on behalf** was not granted. Both permissions were saved successfully; Microsoft indicated changes could take five minutes to propagate. No new licence was purchased, no costs were agreed, and no aliases, mailbox messages or forwarding rules were deleted or changed by this configuration.

Read-only Microsoft Outlook access to the new shared mailbox's Inbox and Sent Items was verified after permission propagation; both were empty when checked. **Actual incoming delivery and the visible From identity on an outgoing message after conversion remain untested**. Earlier alias-delivery tests predate this shared-mailbox setup and are not acceptance evidence for the new mailbox. Do not send a test or enable automated community email without Matt's exact draft/recipient approval. Existing `TIMBER_SHED_EMAIL_DELIVERY_ENABLED=false` and private-member launch gates remain unchanged. Standard unlicensed shared-mailbox eligibility depends on staying within Microsoft 365's 50 GB limit and not using licence-requiring advanced features.

## 23 October 2026 — Recovery checkpoint and private moderation appeals

**Controlling state:** Matt requested takeover of the Timber Shed private build on 23 October. Recovered the existing draft PR #1393 and its exact branch `feat/timber-shed-private-identity-20261022` at `e7dbcd84ee9ae4ba8c12e023347445275b395edb`. Continued the already authorised private functional build in an isolated checkout; no changes to shared main, unrelated public navigation releases, launch authority, production flags, secrets or email delivery. The August/early-22-October guided-only proposals are historical design records; subsequent private forum development is recorded above. They do not grant real-member launch authority.

**Implemented:** A member can request independent review of their own rejected or removed post from My posts. They deliberately select one of three controlled reasons; no appeal free text, attachments, additional profile data or duplicate post body is collected. Other accounts cannot read or appeal the post. Repeated submission for the same recorded decision returns the existing appeal. Private appeal history contains generic state and dates, without moderator identities. A later moderation decision can receive a separate appeal.

An active moderator sees open appeals in the restricted queue. Neither the original decision-maker nor the post author can decide the appeal, even if the author is also a moderator. The reviewer may uphold the original decision or return the post to pending for fresh moderation. **An appeal never publishes a post.** Existing high/critical risk, outdated screening, parent availability and human-approval checks still govern any subsequent approval. Changed decisions or withdrawn content cannot be restored through a stale appeal. Members can now withdraw removed posts too; stored text is cleared, an open appeal closes, and stale notices are removed.

**Integrity:** New `timber_shed_forum_appeals` and `timber_shed_forum_appeal_audit` tables are part of the unapplied private test schema. Submission and review are transactional and audited. A failed audit, changed decision or failed post update aborts the whole appeal transition. Account deletion cascades the author's appeals and their audit. This does not implement legal retention or backup erasure policy. Original moderation audit entries remain intact.

**Verified on SST Mac (23 October 2026, Europe/London):** 106 automated tests passed with zero failures across `tests/timber-shed-*.test.mjs` and `tests/transactional-mail-reliability.test.mjs`, including 13 new appeal tests using in-memory SQLite. `tests/timber-shed-forum-appeals-browser.mjs` passed at 1440×900 and 390×844 with intercepted synthetic APIs, zero page errors, no horizontal overflow, literal rendering of user text, deliberate appeal submission and return to pending. Browser fixtures are not real account/session or remote D1 acceptance. No live model request, email, SMS, push, member message or production migration occurred.

**Current scope/version:** Recovery increment is recorded by the Git commit containing this checkpoint. Hosted password-protected design preview was not updated by this increment; it remains the previous synthetic demonstration. PR stays draft and unmerged. Public/member launch remains off.

**Remaining actual dependencies:** named trained adult moderation/safeguarding coverage; appropriate age assurance; qualified clinical/safeguarding review; approved privacy/DPIA/provider and online-safety assessment; retention/export acceptance for forum and appeal records; blocking/ban controls; real authenticated account/session and D1 transaction acceptance; security/accessibility acceptance; source integration/CI and a separately approved pilot release. This increment closes the missing appeal workflow in source, not those operational gates. Shared-mailbox outbound identity remains untested after conversion; automatic email delivery remains disabled and requires exact draft/recipient sign-off.

**Next finite private step:** implement and synthetically verify member blocking and human-controlled suspension/ban/appeal boundaries without activating real accounts. Do not infer automatic bans, appoint staff, contact anyone, send a mailbox test, point the public domain, enable provider/member-data processing or release the community from this checkpoint. No background build or deployment is claimed to be running.

## 23 October 2026 — Blocking, access controls, privacy and actual-runtime acceptance

**Authority and holds:** Matt instructed this takeover worker to “Sort all”. Continued the private functional build. The separate original worker was stopped from further deployment on 23 October; no production or hosted-preview deployment is performed by this increment. No real members, invitations, emails, spending, clinical activation or public domain changes are authorised. The original no-real-member gate still controls release.

**Completed development controls:**
- Member-controlled block/unblock hides each other's approved posts, nested replies, reply counts and related in-app notifications in both directions. Direct thread requests, reply submission and reporting of hidden posts are restricted server-side. Moderators retain access to evidence through the separate restricted queue. The server derives account identities from the session, not a client-supplied member ID.
- Active moderators can deliberately impose a 1-, 7- or 30-day suspension, an indefinite community ban, or human reinstatement, using a controlled reason. The interface requires a separate evidence-review confirmation. No AI classification or report automatically bans anybody. Self-sanctions and sanctions against active moderators require a separate administrator pathway, which is not supplied here.
- A restricted member cannot browse or post in the community or use moderator controls. They retain their own submissions, withdrawal, community export, departure and independent appeal routes. Private My Timber records, treatment access and account membership are unaffected. Suspensions stop blocking access at their expiry time.
- An access appeal must be decided by a different active moderator from the original decision-maker. Review can uphold or reinstate access, with transactional audit. Reinstatement does not restore removed posts or publish pending ones. Pending posts from a currently restricted author cannot pass ordinary approval. Changed/failed access-audit writes roll back the full access decision.
- Owner-only community export includes the member's chosen name, authored posts, own reports, appeals, generic notification history, restrictions and their own block controls. Staff identities, session tokens, contact details and another member's post body are excluded. The existing authenticated whole-account export now includes this community section only when all existing community feature gates are enabled.
- “Leave the community” requires an explicit confirmation. It clears the member's chosen name and post text, removes stale notifications and their own block/report data, and closes/removes own post appeals atomically. It leaves other members' authored records and the My Timber account intact. Minimal moderation/access records and any restriction remain to prevent evasion; backup erasure, lawful retention periods and regulatory privacy requests still require an approved operating policy.

**Verified:** 122 focused automated tests passed, zero failures, covering the Timber Shed suites plus transactional-mail regressions. The appeal browser suite passed desktop and mobile. A new reproducible `tests/timber-shed-private-runtime-acceptance.mjs` ran 45 checks successfully using local workerd, an actual Miniflare D1 binding and the existing `authenticateMember` cookie/hash/session implementation. This was not an authentication stub or an intercepted-API browser demo. Fictional member and moderator accounts exercised server-side isolation, actual D1 atomic moderation/appeal/restriction writes and trigger-induced rollback, cross-origin denial, revocation, expiry, integrated account export, blocked direct links and leaving. Desktop/mobile Chrome drove block/unblock against that runtime; mobile moderator controls required deliberate confirmation, applied suspension and restored access; restricted members retained a visible appeal route. No overflow or page errors were found in those scoped checks. The earlier intercepted appeal demo remains separately labelled synthetic UI acceptance.

**Testing boundary:** These are fictional seeded accounts and locally emulated D1, not production registration, deployed account acceptance, an actual elapsed 12-hour session test, a live external-model safety evaluation, independent accessibility/security certification or operational safeguarding acceptance. No production schema was touched. The public/hosted preview remains unchanged.

**Prepared launch decision — genuinely outstanding dependencies:**
1. At least two distinct trained adult moderator identities for independent appeals, with a named safeguarding lead/deputy, accepted coverage, response expectations and incident drill. Nobody has been appointed or committed by this build.
2. Named qualified reviewer acceptance of the treatment/safeguarding boundaries and draft content. No charity or clinical partnership is implied.
3. Privacy/controller acceptance of the community DPIA, lawful processing conditions, provider/retention arrangements, special-category disclosures, member notices, deletion/backups and approved age-assurance method. The present DOB/email check is not independent age assurance.
4. Controlled deployed test acceptance, full integration/CI, production migration/rollback approval and a specific member-pilot release instruction. Real-model/member-text processing and external notifications retain their additional gates. The untested post-conversion shared-mailbox delivery remains a separate communication-approval dependency.

The source now contains member blocking, human access sanctions, independent post/access appeals and owner privacy controls. The remaining operational signatures cannot be inferred from passing software tests or from “Sort all”. No recurring job, background deployment or real-member service is claimed.

### Final source integration receipt — 23 October 2026
Integrated existing main `4e3fcf85c9396260981b495cb2cc5861a76b2734` into the private branch without conflict, retaining its canonical footer/navigation changes and historical release gates. No change is made to the main branch or its release state. The post-integration scoped suite passes **146 tests, zero failures**, including the canonical footer and public-shell regressions. The actual-cookie/local-D1 acceptance passes **45 checks** after integration, with desktop/mobile member controls and the mobile moderator path.

The broader footer run initially could not load the PWA service-worker module because it was excluded from this sparse checkout; materialising the existing tracked PWA directory resolved that environment failure without editing the pinned test. A browser rerun exposed an old queue remaining visible during refresh; the UI now clears it with a loading state before fetching replacement evidence, and the browser check waits for network completion. The corrected actual-runtime rerun passed. No failed run is counted as acceptance.

Private source remains on draft PR #1393. All real-member flags and delivery gates remain off; no hosted-preview or production deployment has occurred. Local test success does not assert full GitHub CI, deployed acceptance, production registration or clinical/privacy/safeguarding approval. The named-owner/signature dependencies immediately above are the next release requirement. Historical “blocking/ban controls not implemented” notes are superseded by this increment, while their operational review requirements remain.

## 23 October 2026 — Named owner, operating pack and source-preservation repair

Matt confirmed that he is the accountable community owner (“my name above the door”). This supersedes the earlier missing-owner item only. It does not nominate a second reviewer, confer clinical qualifications, promise 24-hour coverage or approve release. Matt also confirmed that no clinician is available. The private work therefore retains high-risk holds and prepares a nonclinical remit; it does not substitute AI or Matt for qualified clinical review.

Prepared `TIMBER-SHED-OPERATING-PACK.md`: a concrete checklist, proposed member rules, human moderation/appeal procedure, draft responses, incident/handover and training exercises, data inventory/DPIA worksheet, retention decisions, age/online-safety assessments and controlled release/rollback steps. Proposed wording and policies require adoption before publication. Named cover, accepted duties, sufficient age assurance, lawful processing conditions, retention implementation and completed service-specific assessments remain actual work. The operating pack is part of the same private recovery, not a second queue or background project.

**Source-preservation repair:** the first GitHub Medicines Watch run rejected changes to the historically pinned `member-experience/entry.mjs`. Restored that file byte-for-byte to integrated main `4e3fcf85c9396260981b495cb2cc5861a76b2734`. Moved the already implemented Shed presentation into additive `timber-shed-presentation.mjs`, dispatched before the existing member handler. Authentication, private no-store/noindex headers, route methods, HEAD responses, forum/pilot/model gates and existing public routes remain covered. The runtime acceptance now uses that actual presentation handler rather than reconstructed test HTML.

**Verified at source commit `462a612b`:** 151 scoped automated tests passed with zero failures, including five new route/preservation tests; 45 actual-cookie/local-D1 fictional runtime checks passed, including desktop/mobile browser flows. The wider historical-composition verifier additionally requires a complete ordinary Git checkout: sparse index flags, worktree `.git` indirection and shared-object alternates each fail its environment requirements. These environmental failures are not passes; a complete independent local clone was prepared without weakening the verifier.

**Whole-estate crawl:** the prior GitHub run reached its 1,000 URL limit with zero failed URLs and correctly failed for truncated evidence. The workflow now supplies `SHIFT_SWEEP_MAX=10000` to the same read-only crawler. No failure/truncation check was removed. A new complete CI result is still required; increasing the cap alone is not acceptance.

PR #1393 remains draft and unmerged. No production or hosted-preview deployment, schema migration, flags, real-member processing, live model call, email or external appointment is authorised or performed by this increment. The remaining clinical-review dependency applies to clinical content/capabilities; the prepared nonclinical operating model still needs its own safeguarding and residual-risk acceptance. No original real-member hold is lifted.

## 23 October 2026 — Rules approved; Linda nominated; Bouncer role confirmed

Matt explicitly confirmed “Rules are fine. Cover is Linda O’Brien but Bouncer is key moderator”. Recorded the member rules in TIMBER-SHED-OPERATING-PACK.md as approved wording, Linda O'Brien as nominated cover/second human reviewer, and SHIFT Community Bouncer as the primary automated moderator for initial screening, flags and unpublished holds. This supersedes earlier missing-rule-approval and missing-cover-name items.

The accepted rules still require human review before every post/reply is published. Matt/Linda retain human decisions, incidents and independent appeals; neither may review their own decision. No automatic publication, clinical judgement, automated ban or AI appeal decision is introduced. Linda's acceptance, availability, training, individual authorisation and fictional rehearsal remain unverified; naming her does not fabricate those receipts. No external communication or invitation has been sent. No email, provider processing, publication, deployed configuration or real-member release gate has been changed. Other operating/privacy/age/retention and release dependencies retain their separately marked status. This is a documentation-only update; it makes no new software acceptance claim.
