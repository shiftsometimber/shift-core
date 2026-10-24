var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));

// member-state-fast-v1.js
var json = /* @__PURE__ */ __name((data, status = 200, headers3 = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers3 } }), "json");
var now = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "now");
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
function tokens(request) {
  const values = [];
  for (const match of (request.headers.get("Cookie") || "").matchAll(/(?:^|;\s*)sst_session=([^;]+)/g)) {
    try {
      const value = decodeURIComponent(match[1]);
      if (value && !values.includes(value)) values.push(value);
    } catch {
    }
  }
  return values.slice(0, 4);
}
__name(tokens, "tokens");
async function authenticateMember(request, env) {
  const candidates = tokens(request);
  if (!candidates.length) return { response: json({ ok: false, error: "authentication_required" }, 401) };
  for (const raw of candidates) {
    const hash = await sha256(raw), row = await env.DB.prepare(`SELECT u.*,s.id session_id,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).bind(hash).first();
    if (row && !row.revoked_at && new Date(row.expires_at).getTime() > Date.now()) {
      await env.DB.prepare("UPDATE user_sessions SET last_used_at=? WHERE id=?").bind(now(), row.session_id).run();
      return { user: row, userId: Number(row.id) };
    }
  }
  return { response: json({ ok: false, error: "session_expired" }, 401) };
}
__name(authenticateMember, "authenticateMember");

// member-experience/timber-shed-governance.mjs
var SHED_POLICY_VERSION = "shed-pilot-governance-2026-10-23-v1";
var SHED_POLICY = Object.freeze({
  version: SHED_POLICY_VERSION,
  controller: "Shift Some Timber Ltd",
  rules: [
    "An adult peer community, without diagnosis, prescriptions, personalised treatment or emergency care.",
    "Use a separate community name. Do not share identifying details or another person\u2019s personal or health information.",
    "No medication trading, unsafe treatment instructions, harassment, hate, threats, exploitation or scams.",
    "Every post and reply waits for human review. Bouncer screens and flags concerns; it does not publish or ban.",
    "Reports, blocking and independent human appeals are available. The community is not monitored continuously."
  ],
  privacy: [
    "Joining the Shed is optional and does not affect your My Timber account or treatment access.",
    "We link your account ID to your community name, chosen posts, reports, moderation decisions, appeals and in-app notices. My Timber health records are not imported.",
    "Only approved posts are shown to authorised community members. Moderators can review withheld posts and reports. Do not post information about another person.",
    "There are no direct messages or automatic emails. Bouncer uses automated rules and human review; this pilot does not send posts to an external AI provider.",
    "You can export your information and withdraw your participation using Leave the community. Your active community name, consent and post text are cleared; limited moderation/access records remain under the retention policy. Screenshots cannot be recalled.",
    "Pending posts expire after 7 days; rejected/removed content after 30 days, or up to 90 days while an appeal is open. Approved content is retained for at most 365 days. Notifications expire after 30 days. Closed moderation/appeal records expire after 365 days. Active bans remain while necessary, with review at least every 90 days.",
    "Expired content is cleared from the active community under these periods. Database recovery backups may retain previous versions for up to 30 days. Deleted information must remain unavailable after any restoration, and recovery must reapply recorded erasures before member access resumes.",
    "Contact timbershed@shiftsometimber.co.uk to exercise privacy rights or complain. You can also raise a data-protection concern with the Information Commissioner\u2019s Office."
  ],
  healthConsent: "I explicitly consent to SHIFT processing the health information I choose to share in my Shed submissions for private moderation and, only if approved, sharing with authorised community members. I can withdraw by leaving the community. This does not consent to external AI processing, marketing or use of my My Timber health records."
});
var SHED_ROUTINE_POLICY_VERSION = "shed-pilot-governance-2026-10-23-v2";
var ROUTINE_POLICY = Object.freeze({
  ...SHED_POLICY,
  version: SHED_ROUTINE_POLICY_VERSION,
  rules: SHED_POLICY.rules.map((s) => s.startsWith("Every post and reply") ? "Bouncer can publish narrowly recognised everyday messages automatically. Unrecognised, uncertain or sensitive submissions wait for a human. Reports, removals, bans and appeals remain human decisions." : s),
  privacy: SHED_POLICY.privacy.map((s) => s.startsWith("Only approved posts") ? "Published posts are shown to authorised community members. Recognised everyday messages may be approved automatically using local rules. Unrecognised or flagged text stays private for human review; moderators can review it and reports. Do not post information about another person." : s),
  healthConsent: SHED_POLICY.healthConsent.replace("private moderation and, only if approved, sharing", "automated screening and human moderation where needed and, only if approved, sharing")
});
function forumPolicy(env = {}) {
  return env.TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED === "true" || env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION === SHED_ROUTINE_POLICY_VERSION ? ROUTINE_POLICY : SHED_POLICY;
}
__name(forumPolicy, "forumPolicy");
function governanceApproved(env) {
  return env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION === forumPolicy(env).version;
}
__name(governanceApproved, "governanceApproved");
function routinePublicationEnabled(env) {
  return env.TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED === "true" && governanceApproved(env);
}
__name(routinePublicationEnabled, "routinePublicationEnabled");
async function forumParticipation(db, uid, timestamp, env = {}) {
  const policy = forumPolicy(env);
  const adult2 = await db.prepare("SELECT verified_at,expires_at FROM timber_shed_adult_access WHERE user_id=? AND revoked_at IS NULL AND verified_at<=? AND expires_at>? AND (SELECT count(*) FROM timber_shed_adult_access a WHERE a.revoked_at IS NULL AND a.verified_at<=? AND a.expires_at>?)<=10").bind(uid, timestamp, timestamp, timestamp, timestamp).first();
  const heartbeat = await db.prepare("SELECT completed_at FROM timber_shed_maintenance WHERE id=1").bind().first();
  const age = Date.parse(timestamp) - Date.parse(heartbeat?.completed_at || "");
  const maintenanceReady = Number.isFinite(age) && age >= 0 && age <= 2 * 36e5;
  const consent = await db.prepare("SELECT rules_version,privacy_version,disclosure_consent_at,accepted_at FROM timber_shed_participation WHERE user_id=?").bind(uid).first();
  const joined = !!(consent && consent.rules_version === policy.version && consent.privacy_version === policy.version);
  return { maintenanceReady, adultAccess: !!adult2, joined, healthConsent: joined && !!consent?.disclosure_consent_at, disclosureConsentRecorded: !!consent?.disclosure_consent_at, acceptedAt: consent?.accepted_at || null, policy, routineAutoPublish: routinePublicationEnabled(env) };
}
__name(forumParticipation, "forumParticipation");
function validParticipation(input, env = {}) {
  return input && typeof input === "object" && !Array.isArray(input) && Object.keys(input).length === 4 && Object.keys(input).every((k) => ["version", "rulesAccepted", "privacyAcknowledged", "healthConsent"].includes(k)) && input.version === forumPolicy(env).version && input.rulesAccepted === true && input.privacyAcknowledged === true && typeof input.healthConsent === "boolean";
}
__name(validParticipation, "validParticipation");
async function saveForumParticipation(db, uid, input, timestamp, env = {}) {
  const version = forumPolicy(env).version;
  await db.prepare("INSERT INTO timber_shed_participation(user_id,rules_version,privacy_version,disclosure_consent_at,accepted_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET rules_version=excluded.rules_version,privacy_version=excluded.privacy_version,disclosure_consent_at=excluded.disclosure_consent_at,accepted_at=excluded.accepted_at").bind(uid, version, version, input.healthConsent ? timestamp : null, timestamp).run();
}
__name(saveForumParticipation, "saveForumParticipation");

// member-experience/timber-shed-forums.mjs
var timberShedForumRooms = Object.freeze([
  { id: "main-shed", name: "The Main Shed", kicker: "EVERYDAY LIFE", description: "Introductions, ordinary life and good company.", topics: [["What makes a difficult Monday a bit easier?", "Small routines, a decent brew, a walk, or just knowing someone gets it."], ["What are you looking forward to this weekend?", "The little things count too."]] },
  { id: "shifting-timber", name: "Shifting Timber", kicker: "WEIGHT & HABITS", description: "Experiences, motivation and setbacks \u2014 without competition.", topics: [["What helped you stick with one small change?", "Share the practical bit, not numbers or treatment instructions."], ["When progress feels slower than expected", "A conversation about patience and everyday wins."]] },
  { id: "grub-fit", name: "Grub & Fit", kicker: "FOOD & MOVEMENT", description: "Everyday meals, movement and realistic routines.", topics: [["Your favourite easy midweek meal?", "Simple food ideas, without calories or restriction targets."], ["Movement that does not feel like a chore", "Walking, gardening, football, dancing \u2014 it all counts."]] },
  { id: "good-to-talk", name: "Good to Talk", kicker: "WELLBEING", description: "Confidence, relationships and how life feels.", topics: [["What helps when your head is busy?", "Everyday coping and support, not diagnosis or treatment."], ["Making time to check in with someone", "Small ways to stay connected."]] },
  { id: "small-wins", name: "Small Wins", kicker: "LIFE BACK", description: "Recognise progress beyond the scales.", topics: [["What went a little better this week?", "No comparison. No rankings. Your win is enough."], ["A habit you are quietly proud of", "Something useful you have kept doing."]] },
  { id: "after-treatment", name: "Life After Treatment", kicker: "LONG-TERM SUPPORT", description: "Keeping helpful habits through change and transition.", topics: [["What helps a routine survive a busy week?", "Realistic habits that do not depend on perfection."], ["Keeping support when circumstances change", "Who and what helps you stay connected?"]] }
]);
var timberShedForumRules = Object.freeze([
  "Only your own words, deliberately submitted for community review, could ever be published.",
  "My Timber measurements, treatment records, check-ins, mood and contact details are never used to prefill posts.",
  "No selling, supplying, swapping, sourcing, advertising or facilitating any medicines, investigational treatments, trial-stage drugs, research-use peptides or unapproved injections; no dose advice, unsafe weight-loss challenges, personal attacks or pressure to disclose private information.",
  "Report and moderation processes, trained adult cover, crisis escalation and age controls are required before real discussions open.",
  "No private messaging, member directory, public profiles or direct member contact at launch."
]);
function timberShedForumPreview() {
  const escape = /* @__PURE__ */ __name((s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), "escape");
  const rooms = timberShedForumRooms.map((room) => '<article class="forum-room"><p class="eyebrow">' + escape(room.kicker) + "</p><h3>" + escape(room.name) + "</h3><p>" + escape(room.description) + '</p><div class="forum-topics">' + room.topics.map(([title, summary]) => '<details class="forum-topic"><summary>' + escape(title) + "</summary><p>" + escape(summary) + '</p><p class="forum-sample">Fictional discussion example \xB7 no real posts or member replies</p></details>').join("") + "</div></article>").join("");
  return '<section class="section" id="forum-preview"><div class="eyebrow">THE SHED / FORUMS</div><h2>Pull up a chair.</h2><p class="lead">Six proposed discussion rooms. These are fictional examples to review the design, not real conversations. Posting, replies and member profiles are disabled.</p><div class="forum-grid">' + rooms + '</div><aside class="privacy"><strong>Nothing from My Timber is published here.</strong><p>Private tracking data cannot populate discussions. Future posting would require a deliberate, separate publishing action and moderation before any member could see it.</p></aside></section>';
}
__name(timberShedForumPreview, "timberShedForumPreview");

// member-experience/timber-shed-page.mjs
var _a;
var timberShedBasePage = String.raw(_a || (_a = __template([`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><title>The Timber Shed | My Timber</title>
<style>
:root{color-scheme:dark;--black:#050505;--cream:#E7E3DA;--ash:#707762;--card:#181b17;--line:#434b3d}
*{box-sizing:border-box}body{margin:0;background:var(--black);color:var(--cream);font:16px/1.55 Arial,Helvetica,sans-serif}
a{color:inherit}button{font:inherit;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}button:focus-visible,a:focus-visible{outline:3px solid #c1d0b6;outline-offset:3px}
.shell{width:min(1180px,calc(100% - 36px));margin:auto}.top{padding:18px 0;display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:1px solid var(--line)}
.brand{font-weight:900;font-size:20px;letter-spacing:-.04em;text-decoration:none}.brand em{font-style:normal;color:#9cab8f}.back{font-size:13px;text-decoration:none;border:1px solid var(--line);padding:9px 13px;border-radius:6px}
.eyebrow{color:#b1bca9;font-weight:800;letter-spacing:.19em;font-size:12px}.hero{padding:65px 0 48px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}
h1{font:900 clamp(70px,9vw,130px)/.86 Impact,'Arial Narrow',Arial,sans-serif;letter-spacing:-.035em;margin:22px 0 27px}h1 span{color:#a2b197}.hero p{max-width:540px;font-size:20px;color:#d2d8ce}.hero aside{padding:28px;background:#1d261c;border:1px solid #52634e;border-radius:14px;font-size:24px;font-weight:800;line-height:1.25}
.hero aside small{display:block;font:400 14px/1.5 Arial,sans-serif;margin-top:15px;color:#c9d4c3}
.section{padding:36px 0;border-bottom:1px solid var(--line)}h2{font:900 clamp(32px,4vw,54px)/1 Impact,'Arial Narrow',Arial,sans-serif;margin:5px 0 12px}.lead{max-width:700px;color:#cbd1c8}
.privacy{padding:20px;border:1px solid #70826a;background:#1d281b;border-radius:12px}.privacy strong{color:#d9ead1}
.controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:20px 0}.btn{background:#a7b59c;color:#050505;border:1px solid #a7b59c;border-radius:6px;padding:12px 17px;font-weight:800}.btn.secondary{background:transparent;color:var(--cream);border-color:#8e9d85}
#status{font-size:14px;color:#d2ddca;min-height:20px}#progress{font-weight:800}
.week-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin-top:26px}
.week{border:1px solid var(--line);background:var(--card);border-radius:13px;padding:22px}.week h3{font-size:25px;margin:8px 0}.week p{color:#cbd1c8;font-size:14px}
.activity{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #374032}.activity span{font-size:14px}.activity button{border:1px solid #7d8a74;background:transparent;color:var(--cream);border-radius:5px;padding:7px 10px;font-size:12px;min-width:80px}
.activity button[data-done=true]{background:#a7b59c;color:#050505}
.footer{padding:28px 0;color:#a8b5a4;font-size:13px}
@media(max-width:750px){.hero{grid-template-columns:1fr;padding:42px 0;gap:10px}.hero aside{font-size:21px}.week-grid{grid-template-columns:1fr}.top .brand{font-size:16px}}
</style></head><body>
<div class="shell"><header class="top"><a class="brand" href="/member/dashboard">SHIFT <em>SOME</em> TIMBER</a><a class="back" href="/member/dashboard">\u2190 Back to My Timber</a></header>
<section class="hero"><div><div class="eyebrow">MY TIMBER / PRIVATE SUPPORT</div><h1>THE<br><span>TIMBER</span><br>SHED.</h1><p>Good company. Practical support. No judgement. Small steps that fit real life, whether or not you're receiving treatment.</p></div><aside>YOUR PROGRESS IS YOURS.<small>There is no public profile, member feed or posting. Your weight, treatment, mood and health records are never copied into The Timber Shed.</small></aside></section>
<section class="section"><div class="eyebrow">YOUR CHOICE</div><h2>Private by design.</h2><p class="lead">You can follow the six-week programme without saving anything. If you choose to save activity ticks, they're linked to your My Timber login and visible only in your private account. You can clear them at any time.</p>
<div class="privacy"><strong>No health records are read, shared or published.</strong><p>We only save a programme activity ID, whether you completed it and optional simple feedback if you opt in. No names, measurements, medical notes or community posts.</p></div>
<div class="controls"><button class="btn" id="enable" disabled>Save my private progress</button><button class="btn secondary" id="clear" disabled>Clear my saved progress</button><span id="progress">Not saving</span></div><p id="status" role="status" aria-live="polite">Checking your My Timber session\u2026</p></section>
<section class="section"><div class="eyebrow">FOUNDING PROGRAMME</div><h2>Six weeks. One step at a time.</h2><p class="lead">The programme is non-clinical and optional. No weight-loss competitions, no dose instructions and no pressure to buy. Medical concerns should go to your treating clinician.</p><div class="week-grid" id="weeks"></div></section>
<footer class="footer">THE TIMBER SHED \xB7 MY TIMBER \xB7 PRIVATE ACCOUNT EXPERIENCE \xB7 NOT A CLINIC OR EMERGENCY SERVICE. If you're in immediate danger call 999. For urgent NHS advice call 111.</footer></div>
<script src="/assets/member-experience/timber-shed.mjs" defer><\/script></body></html>`])));
var timberShedPage = timberShedBasePage.replace("</style></head>", "</style><style>.forum-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:24px 0}.forum-room{background:#181d17;border:1px solid #465142;border-radius:13px;padding:24px}.forum-room h3{font-size:26px;letter-spacing:-.035em;line-height:1.12;margin:8px 0}.forum-room>p:not(.eyebrow){color:#cdd5ca;font-size:14px}.forum-topics{margin-top:18px;border-top:1px solid #394338}.forum-topic{border-bottom:1px solid #394338;padding:11px 0}.forum-topic summary{cursor:pointer;font-weight:700;font-size:14px;line-height:1.5}.forum-topic p{font-size:13px;color:#cbd3c7}.forum-sample{font-weight:800;letter-spacing:.05em;font-size:10px!important;color:#b7c6aa!important}@media(max-width:750px){.forum-grid{grid-template-columns:1fr}}</style></head>").replace('<footer class="footer">', timberShedForumPreview() + '<footer class="footer">');
var timberShedClient = String.raw`(()=>{'use strict';
const weeks=[
 ['Finding your feet',['Choose one small thing','Check how your week feels','A conversation worth having','What worked this week?']],
 ['Food without the noise',['Make a simple meal plan','Notice what fits your day','Eat without a competition','Keep one useful habit']],
 ['Moving in your own way',['Choose movement you enjoy','Make a ten-minute window','Find what gets in the way','Notice your own progress']],
 ['Sleep and energy',['Choose a realistic bedtime step','Take a proper break','Look after your routine','Reflect without judging']],
 ['Confidence and connection',['Do something for yourself','Check in with someone','Ask for help if you need it','Celebrate a small win']],
 ['Keeping it going',['Choose what you will keep','Make a difficult-day plan','Find ongoing support','Your next small step']]
];
const root=document.getElementById('weeks'),status=document.getElementById('status'),enable=document.getElementById('enable'),clear=document.getElementById('clear'),progress=document.getElementById('progress');
let state={enabled:false,revision:0,activities:{}},ready=false;
const say=msg=>{status.textContent=msg};
const id=(w,d)=>'w'+(w+1)+'-'+['start','midweek','talk','reflect'][d];
function render(){root.replaceChildren();let count=0;weeks.forEach(([name,items],w)=>{const box=document.createElement('article');box.className='week';const kicker=document.createElement('div');kicker.className='eyebrow';kicker.textContent='WEEK '+(w+1);const title=document.createElement('h3');title.textContent=name;box.append(kicker,title);items.forEach((label,d)=>{const key=id(w,d),done=state.activities[key]?.status==='done';if(done)count++;const row=document.createElement('div');row.className='activity';const span=document.createElement('span');span.textContent=label;const button=document.createElement('button');button.type='button';button.textContent=done?'Completed ✓':'Mark done';button.dataset.done=String(done);button.disabled=!ready||!state.enabled;button.addEventListener('click',()=>save({action:'activity',revision:state.revision,activityId:key,status:done?'not-done':'done'}));row.append(span,button);box.append(row)});root.append(box)});progress.textContent=state.enabled?count+' of 24 steps saved privately':'Not saving';enable.disabled=!ready||state.enabled;clear.disabled=!ready||!state.enabled}
async function request(body){const options={credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'}};if(body){options.method='POST';options.body=JSON.stringify(body)}const response=await fetch('/v1/timber-shed/private-progress',options);const data=await response.json();if(!response.ok)throw Error(data.error==='authentication_required'||data.error==='session_expired'?'Please sign in to My Timber first.':data.error==='revision_conflict'?'Your progress changed. Refresh this page.':'Progress is unavailable. Please try again.');return data}
async function save(body){enable.disabled=true;clear.disabled=true;try{state=await request(body);say(body.action==='disable'?'Your saved Timber Shed progress has been cleared.':'Saved privately to your My Timber account.')}catch(e){say(e.message)}finally{render()}}
enable.addEventListener('click',()=>save({action:'enable',revision:state.revision}));clear.addEventListener('click',()=>save({action:'disable',revision:state.revision}));
render();request().then(data=>{state=data;ready=true;say('Connected to your private My Timber account. Nothing is shared with other members.');render()}).catch(e=>{say(e.message);render()});
})();`;

// member-experience/timber-shed-forum-ui.mjs
var timberShedForumPilotMarkup = `<section class="section" id="shedForumPilot">
<div class="eyebrow">THE TIMBER SHED / PRIVATE FORUM PILOT</div><h2>Pull up a chair.</h2>
<p class="lead">Six rooms, one community. Choose a separate display name before joining. Your My Timber account information is never shown here.</p>
<div class="privacy"><strong>Only words you deliberately submit can enter a forum.</strong><p>Nothing is published immediately. Every new discussion and reply waits for a trained moderator. Do not include your real name, contact details, medical records or anything you would not want other members to read.</p></div>
<section id="shedParticipation" class="shed-form" hidden><h3 tabindex="-1">Before you join</h3><div id="shedPolicyText"></div><form id="shedParticipationForm"><label><input type="checkbox" id="shedRulesAccepted" required> I agree to the community rules</label><label><input type="checkbox" id="shedPrivacyAcknowledged" required> I have read the community privacy information</label><label><input type="checkbox" id="shedHealthConsent"> <span id="shedHealthConsentText"></span></label><p>You can leave health consent unticked and read without posting. Joining the Shed is optional; your My Timber account and treatment access are unaffected.</p><button type="submit" class="btn" id="shedJoin">Save my community choices</button><p id="shedParticipationStatus" role="status"></p></form></section>
<button type="button" id="shedViewPolicy" class="shed-subtle-btn">Community rules and privacy</button>
<nav class="shed-community-nav" aria-label="Community sections">
<button type="button" data-shed-view="latest" aria-pressed="true">Latest conversations</button>
<button type="button" data-shed-view="rooms" aria-pressed="false">Discussion rooms</button>
<button type="button" data-shed-view="mine" aria-pressed="false">My posts</button>
<button type="button" data-shed-view="notifications" aria-pressed="false">Notifications <span id="shedUnreadBadge" aria-label="Unread notifications">0</span></button>
<button type="button" data-shed-view="safety" aria-pressed="false">Community settings</button>
<button type="button" data-shed-view="moderation" id="shedModNav" aria-pressed="false" hidden>Moderator queue <span id="shedPendingBadge">0</span></button>
</nav>
<div class="shed-pilot-grid"><div>
<section id="shedLatestView" aria-label="Latest conversations"><h3 tabindex="-1">Latest conversations</h3><p>Approved discussions from across The Timber Shed. Posts waiting for review stay private.</p><button type="button" id="shedRefreshLatest" class="shed-subtle-btn">Refresh conversations</button><div id="shedLatestItems" aria-live="polite"></div></section>
<section id="shedRoomsView" aria-label="Discussion rooms" hidden><h3 tabindex="-1">Discussion rooms</h3>
<form id="shedAliasForm" class="shed-form"><h3>Your community name</h3><label for="shedAlias">Choose a display name (not your real name)</label><input id="shedAlias" name="displayName" minlength="3" maxlength="24" autocomplete="off" required placeholder="e.g. Weekend Walker"><button class="btn" type="submit">Use this display name</button><p id="shedAliasStatus" role="status"></p></form>
<div class="shed-forum-picker"><label for="shedRoom">Discussion room</label><select id="shedRoom"></select></div>
<div id="shedTopics" aria-live="polite"></div></section>
<section id="shedMyPosts" class="shed-form" hidden><h3 tabindex="-1">Your submissions</h3><p>Pending submissions are private. You can appeal a rejection or removal for independent human review. Your post stays hidden during an appeal. You can withdraw your own post; its stored text is cleared and it will no longer appear in the community.</p><div id="shedMyPostItems"></div></section><section id="shedModeratorPanel" class="shed-form" aria-label="Moderator queue" hidden><h3 tabindex="-1">Moderator queue</h3><div class="shed-bouncer-brand"><span aria-hidden="true">\u2B21</span><div><span class="eyebrow">SHIFT COMMUNITY BOUNCER</span><h3>Everyone\u2019s welcome. Hassle isn\u2019t.</h3></div></div><p>Automated rule-based safety screening prioritises the private queue. It is not clinical assessment or a substitute for trained human moderation. Every post requires human approval. High-risk posts cannot be approved in this pilot.</p><div id="shedQueue"></div><div id="shedReports"></div><div id="shedAppeals"></div><div id="shedRestrictions"></div><div id="shedRestrictionAppeals"></div></section>
<section id="shedSafetyView" aria-label="Community settings" hidden><h3 tabindex="-1">Community settings</h3><p>Blocking hides your posts from each other. Moderators can still review reports. Community restrictions do not change your private My Timber account.</p><div id="shedAccessStatus"></div><div id="shedBlocks"></div><button type="button" id="shedExport" class="shed-subtle-btn">Download my community data</button><details><summary>Leave the community</summary><p>This clears your community name and post text, closes post appeals and removes your alerts. Minimal moderation records and any access restriction remain. Backup erasure and legal retention require a separate privacy request. Your My Timber account stays open.</p><label><input type="checkbox" id="shedLeaveConfirm"> I want to clear my community participation</label><button type="button" id="shedLeave" class="shed-subtle-btn">Leave and clear my posts</button></details></section>
<section id="shedNotificationsView" aria-label="Your notifications" hidden><h3 tabindex="-1">Your notifications</h3><p>Private in-app alerts only. No emails, text messages or push notifications are sent.</p><button type="button" id="shedRefreshNotifications" class="shed-subtle-btn">Refresh notifications</button><div id="shedNotificationItems" aria-live="polite"></div></section>
</div>
<div><form id="shedCompose" class="shed-form" hidden><h3 id="shedComposeHeading">Start a conversation</h3><p>Posting in <strong id="shedComposeRoom">The Main Shed</strong> <button type="button" id="shedChangeRoom" class="shed-subtle-btn">Change room</button></p><p>Keep it respectful and avoid identifying or sensitive details.</p><label for="shedTitle">Discussion title</label><input id="shedTitle" maxlength="100" minlength="8" required><label for="shedBody">What would you like to share?</label><textarea id="shedBody" rows="6" maxlength="1000" minlength="12" required></textarea><button class="btn" type="submit">Submit for moderation</button><button class="btn secondary" type="button" id="shedCancelReply" hidden>Cancel reply</button><p id="shedComposeStatus" role="status"></p></form>
</div></div>
<p id="shedForumStatus" role="status" aria-live="polite">Checking your My Timber session\u2026</p><p class="shed-bouncer-footnote"><strong>Protected by SHIFT Community Bouncer.</strong> Automated safety checks help moderators spot concerns. No automated check can guarantee safety, and the community is not an emergency service.</p>
</section>`;
var timberShedForumPilotCSS = `
#shedForumPilot .shed-pilot-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:24px;margin-top:28px}
#shedForumPilot .shed-form{border:1px solid #465441;background:#1a2119;border-radius:13px;padding:24px;margin:0 0 18px}
#shedForumPilot .shed-form h3{font-size:25px;margin:0 0 12px}
#shedForumPilot label{display:block;font-size:13px;font-weight:800;margin:14px 0 6px}
#shedForumPilot input,#shedForumPilot textarea,#shedForumPilot select{display:block;width:100%;padding:12px;background:#090b09;border:1px solid #708269;border-radius:6px;color:#e7e3da;font:inherit}
#shedForumPilot .shed-form .btn{margin:16px 8px 0 0}
#shedForumPilot .shed-forum-picker{margin:20px 0}
#shedForumPilot .shed-topic-live{background:#191e18;border:1px solid #465441;border-radius:12px;margin:12px 0;padding:19px}
#shedForumPilot .shed-topic-live h3{margin:0 0 7px;font-size:20px}
#shedForumPilot .shed-topic-live p{color:#d3d9d0;overflow-wrap:anywhere;white-space:pre-wrap}
#shedForumPilot .shed-topic-live .meta{font-size:12px;color:#b2c4aa}
#shedForumPilot .shed-topic-live.reply{margin-left:26px;background:#222b20}
#shedForumPilot .shed-topic-live button{background:transparent;border:1px solid #7b8e73;border-radius:5px;color:#e7e3da;padding:7px 10px;margin:6px 8px 0 0}
#shedForumPilot .shed-topic-live button:focus-visible{outline:2px solid #c4d4bb}
#shedForumPilot .shed-bouncer-brand{display:flex;align-items:center;gap:13px;border-bottom:1px solid #50634c;padding-bottom:14px;margin-bottom:16px}#shedForumPilot .shed-bouncer-brand>span{font-size:37px;color:#b2c4a8}#shedForumPilot .shed-bouncer-brand h3{font-size:21px;margin:3px 0 0}#shedForumPilot .shed-bouncer-footnote{font-size:12px;color:#b5c7ad;margin-top:20px}#shedForumPilot .shed-bouncer-risk{font-size:11px;font-weight:900;letter-spacing:.08em;color:#d7e2cf;margin:8px 0}#shedForumPilot .shed-bouncer-risk.high,#shedForumPilot .shed-bouncer-risk.critical{color:#f2c3a8}#shedForumPilot .shed-mod-item{border-top:1px solid #4d5c47;padding:14px 0}
#shedForumPilot .shed-mod-item p{white-space:pre-wrap;overflow-wrap:anywhere}
#shedForumPilot .shed-mod-item button{margin:6px 8px 0 0}
#shedForumPilot .shed-community-nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0 12px;border-bottom:1px solid #54664f;padding-bottom:13px}
#shedForumPilot .shed-community-nav button,#shedForumPilot .shed-subtle-btn{border:1px solid #62735c;border-radius:7px;padding:11px 14px;background:#151d14;color:#e7e3da;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
#shedForumPilot .shed-community-nav button[aria-pressed="true"]{background:#d7dfcf;color:#10150f;border-color:#d7dfcf}
#shedForumPilot .shed-community-nav button:focus-visible,#shedForumPilot .shed-subtle-btn:focus-visible{outline:2px solid #d7dfcf;outline-offset:3px}
#shedForumPilot #shedUnreadBadge{display:inline-block;min-width:20px;border-radius:20px;background:#60765b;color:#fff;text-align:center;padding:1px 5px;font-size:11px}
#shedForumPilot .shed-latest-card,#shedForumPilot .shed-notification{border:1px solid #52614c;border-radius:10px;background:#192119;padding:18px;margin:12px 0}
#shedForumPilot .shed-latest-card h4{font-size:20px;line-height:1.2;margin:6px 0}
#shedForumPilot .shed-latest-card p{color:#d3dfce;overflow-wrap:anywhere}
#shedForumPilot .shed-latest-card .meta,#shedForumPilot .shed-notification .meta{font-size:12px;color:#b9cbb2}
#shedForumPilot .shed-latest-card button,#shedForumPilot .shed-notification button{margin-top:9px;padding:9px 12px;background:#d7dfcf;border:0;border-radius:5px;color:#0e140e;font-weight:800;cursor:pointer}
#shedForumPilot .shed-notification.unread{border-left:4px solid #b6d0a9}
#shedForumPilot .shed-notification p{font-size:14px;margin:7px 0}
#shedForumPilot .shed-notification button:focus-visible,#shedForumPilot .shed-latest-card button:focus-visible{outline:2px solid #fff;outline-offset:3px}
#shedForumPilot input[type=checkbox]{display:inline-block;width:auto;margin-right:10px}#shedForumPilot #shedSafetyView button,#shedForumPilot .shed-mod-item button{min-height:44px;padding:9px 12px}#shedForumPilot button:focus-visible,#shedForumPilot summary:focus-visible{outline:2px solid #e7e3da;outline-offset:3px}#shedForumPilot #shedSafetyView details{margin-top:24px}#shedForumPilot .shed-empty{padding:20px;border:1px dashed #62735c;border-radius:9px;color:#c9d4c3}
@media(max-width:560px){#shedForumPilot .shed-community-nav button{flex:1 1 44%;padding:11px 8px}#shedForumPilot .shed-latest-card{padding:14px}}
@media(max-width:800px){#shedForumPilot .shed-pilot-grid{grid-template-columns:1fr}}
`;
var timberShedForumPilotClient = String.raw`(()=>{'use strict';
const by=id=>document.getElementById(id);
const status=by('shedForumStatus'),aliasForm=by('shedAliasForm'),alias=by('shedAlias'),compose=by('shedCompose'),room=by('shedRoom'),topics=by('shedTopics'),mod=by('shedModeratorPanel');
if(!status)return;
let currentRoom='main-shed',currentThread=null,parentId=null,hasAlias=false,rooms=[],healthConsent=false,participationVersion=null;
const text=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=String(value??'');if(cls)el.className=cls;return el};
const say=(id,message)=>{const el=by(id);if(el)el.textContent=message};
const roomName=id=>rooms.find(r=>r.id===id)?.name||'Discussion room';
const formatDate=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleDateString('en-GB'):'Date unavailable'};
async function api(path,body){
 const opts={credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
 if(body!==undefined){opts.method='POST';opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}
 const res=await fetch('/v1/timber-shed/forum/'+path,opts);
 let data;try{data=await res.json()}catch{throw Error('The forum is temporarily unavailable.')}
 if(!res.ok)throw Error(data.error==='adult_verified_members_only'?'The pilot requires a verified adult My Timber account.':data.error==='authentication_required'?'Sign in to My Timber first.':data.error==='community_access_restricted'?'Community access is restricted. Open Community settings to see the reason and appeal.':data.error==='author_access_restricted'?'This author is restricted. The post cannot be approved.':data.error==='independent_admin_required'?'A separate authorised administrator must handle that account.':data.error==='independent_reviewer_required'?'A different moderator must review this appeal.':data.error==='appeal_already_reviewed'?'This appeal has already been reviewed. Refresh the queue.':data.error==='decision_changed'?'The post has changed. Refresh the queue before reviewing.':data.error==='forum_unavailable'?'The forum is temporarily unavailable.':data.error||'Unable to complete that action.');
 return data;
}
function button(label,callback){const el=text('button',label);el.type='button';el.addEventListener('click',callback);return el}
let accessRestricted=false;
const views={latest:by('shedLatestView'),rooms:by('shedRoomsView'),mine:by('shedMyPosts'),notifications:by('shedNotificationsView'),moderation:by('shedModeratorPanel'),safety:by('shedSafetyView')};
function switchView(name,focus=true){
 if(!views[name])return;
 for(const [id,el] of Object.entries(views))el.hidden=id!==name;
 for(const control of document.querySelectorAll('[data-shed-view]'))control.setAttribute('aria-pressed',String(control.dataset.shedView===name));
 if(focus){const heading=views[name].querySelector('h3[tabindex]');if(heading)heading.focus()}
}
function cancelReply(){
 parentId=null;
 by('shedTitle').hidden=false;by('shedTitle').required=true;by('shedTitle').previousElementSibling.hidden=false;
 by('shedComposeHeading').textContent='Start a conversation';by('shedCancelReply').hidden=true;
}
function updateRoom(){say('shedComposeRoom',roomName(currentRoom))}
async function openThread(roomId,threadId){
 if(!rooms.some(r=>r.id===roomId))return;
 currentRoom=roomId;room.value=roomId;currentThread=threadId;
 cancelReply();updateRoom();switchView('rooms');
 await refresh();
}
function postView(post,reply=false){
 const card=document.createElement('article');card.className='shed-topic-live'+(reply?' reply':'');
 card.id='shed-post-'+post.id;
 if(post.title)card.append(text('h4',post.title));
 card.append(text('div',post.display_name+' · '+formatDate(post.created_at),'meta'));
 card.append(text('p',post.body));
 if(!reply)card.append(button('Reply',()=>{
  if(!hasAlias){switchView('rooms');say('shedForumStatus','Choose a community display name before replying.');alias.focus();return}
  parentId=post.id;by('shedTitle').required=false;by('shedTitle').hidden=true;by('shedTitle').previousElementSibling.hidden=true;
  by('shedComposeHeading').textContent='Reply to '+post.title;by('shedCancelReply').hidden=false;by('shedBody').focus();
 }));
 const reasonSelect=document.createElement('select');reasonSelect.setAttribute('aria-label','Reason for reporting this post');
 for(const [value,label] of [['','Select a reporting reason'],['privacy','Privacy concern'],['unsafe-health-advice','Unsafe health advice'],['harassment','Harassment'],['self-harm-risk','Safety concern'],['spam','Spam'],['other','Other']]){
  const option=document.createElement('option');option.value=value;option.textContent=label;reasonSelect.append(option)
 }
 card.append(button('Block this member',async()=>{
  try{await api('block',{postId:post.id});await refresh();await latest();await notifications();say('shedForumStatus','Your posts are now hidden from each other. Manage blocks in Community settings.')}catch(e){say('shedForumStatus',e.message)}
 }));
 card.append(reasonSelect,button('Report',async()=>{
  if(!reasonSelect.value){say('shedForumStatus','Choose a reporting reason first.');return}
  try{await api('report',{postId:post.id,reason:reasonSelect.value});say('shedForumStatus','Report received for moderator review.')}catch(e){say('shedForumStatus',e.message)}
 }));
 return card;
}
async function refresh(){
 topics.replaceChildren();
 if(!currentThread){
  await roomTopics(0);
  return;
 }
 const data=await api('threads?room='+encodeURIComponent(currentRoom)+'&threadId='+encodeURIComponent(currentThread));
 topics.append(button('← Back to all discussions in '+roomName(currentRoom),()=>{
  currentThread=null;refresh().catch(e=>say('shedForumStatus',e.message));
 }));
 if(!data.posts.length){topics.append(text('p','This discussion is unavailable. It may have been removed.','shed-empty'));return}
 const roots=data.posts.filter(p=>!p.parent_id);
 for(const post of roots){
  topics.append(postView(post));
  for(const reply of data.posts.filter(p=>p.parent_id===post.id))topics.append(postView(reply,true));
 }
 if(!roots.length)topics.append(text('p','This discussion is no longer available.','shed-empty'));
}
async function roomTopics(offset){
 const data=await api('room-topics?room='+encodeURIComponent(currentRoom)+'&offset='+offset);
 if(offset===0)topics.replaceChildren();
 else{const older=topics.querySelector('[data-shed-load-more]');if(older)older.remove()}
 if(offset===0&&!data.posts.length)topics.append(text('p','No approved conversations in this room yet. New posts remain private until reviewed.','shed-empty'));
 for(const post of data.posts){
  const card=document.createElement('article');card.className='shed-latest-card';
  card.append(text('div',post.display_name+' · '+formatDate(post.reviewed_at||post.created_at),'meta'));
  card.append(text('h4',post.title));
  card.append(text('p',post.excerpt));
  card.append(text('div',String(post.reply_count)+' approved '+(Number(post.reply_count)===1?'reply':'replies'),'meta'));
  card.append(button('Open discussion',()=>openThread(post.room_id,post.id).catch(e=>say('shedForumStatus',e.message))));
  topics.append(card);
 }
 if(data.hasMore){
  const older=button('Older discussions',()=>roomTopics(data.nextOffset).catch(e=>say('shedForumStatus',e.message)));
  older.dataset.shedLoadMore='true';older.className='shed-subtle-btn';topics.append(older);
 }
}
async function latest(){
 const data=await api('latest'),container=by('shedLatestItems');container.replaceChildren();
 if(!data.posts.length){container.append(text('p','No approved conversations yet. Once a moderator approves a discussion, it will appear here.','shed-empty'));return}
 for(const post of data.posts){
  const card=document.createElement('article');card.className='shed-latest-card';
  card.append(text('div',roomName(post.room_id)+' · '+post.display_name+' · '+formatDate(post.reviewed_at||post.created_at),'meta'));
  card.append(text('h4',post.title));
  card.append(text('p',post.excerpt));
  card.append(text('div',String(post.reply_count)+' approved '+(Number(post.reply_count)===1?'reply':'replies'),'meta'));
  card.append(button('Open discussion',()=>openThread(post.room_id,post.id).catch(e=>say('shedForumStatus',e.message))));
  container.append(card);
 }
}
async function myPosts(){
 const [data,appealData]=await Promise.all([api('mine'),api('appeals')]);const items=by('shedMyPostItems');items.replaceChildren();
 if(!data.posts.length){items.append(text('p','You have not submitted anything yet.','shed-empty'));return}
 for(const post of data.posts){
  const card=document.createElement('article');card.className='shed-mod-item';
  const state={pending:'Awaiting moderator review',approved:'Approved',rejected:'Not approved',removed:'Removed',withdrawn:'Withdrawn'}[post.status]||post.status;
  card.append(text('strong',(post.title||'Reply')+' · '+state));
  if(post.status!=='withdrawn')card.append(text('p',post.body));
  if(post.status==='pending')card.append(text('p','Only you and authorised moderators can see this submission.','meta'));
  if(post.status==='approved')card.append(button('View in discussion',()=>openThread(post.room_id,post.parent_id||post.id).catch(e=>say('shedForumStatus',e.message))));
  if(['pending','approved','rejected','removed'].includes(post.status))card.append(button('Withdraw my post',async()=>{
   try{await api('withdraw',{postId:post.id});await myPosts();await refresh();await latest();await notifications();say('shedForumStatus','Your post has been withdrawn and its text cleared.')}
   catch(e){say('shedForumStatus',e.message)}
  }));
  const appeal=appealData.appeals.find(a=>a.post_id===post.id&&(['pending','approved','withdrawn'].includes(post.status)||a.decision_at===post.reviewed_at));
  if(appeal)card.append(text('p',{open:'Your appeal is waiting for a different moderator.',upheld:'Appeal reviewed: the original decision stands.',reconsider:'Appeal reviewed: returned for fresh moderation.',withdrawn:'Appeal closed after withdrawal.'}[appeal.status]||'Appeal update available.','meta'));
  if(['rejected','removed'].includes(post.status)&&!appeal){
   const reasons=document.createElement('select');reasons.setAttribute('aria-label','Reason for appealing this decision');
   for(const [value,label] of [['','Choose an appeal reason'],['missed-context','The context was missed'],['incorrect-rule','The rule was applied incorrectly'],['other','Another reason for review']]){
    const option=text('option',label);option.value=value;reasons.append(option);
   }
   const send=button('Request independent review',async()=>{
    if(!reasons.value){say('shedForumStatus','Choose an appeal reason first.');reasons.focus();return}
    send.disabled=true;
    try{await api('appeal',{postId:post.id,reason:reasons.value});await myPosts();say('shedForumStatus','Appeal received. Your post remains hidden while a different moderator reviews it.')}
    catch(e){send.disabled=false;say('shedForumStatus',e.message)}
   });
   card.append(reasons,send);
  }
  items.append(card);
 }
}
const notificationText={approved:'Your post has been approved.',rejected:'Your post was not approved.',removed:'Your post was removed.',reply:'Someone replied to your discussion.'};
async function notifications(offset=0){
 const data=await api('notifications?offset='+offset),items=by('shedNotificationItems'),badge=by('shedUnreadBadge');
 badge.textContent=String(data.unreadCount||0);
 badge.setAttribute('aria-label',String(data.unreadCount||0)+' unread notifications');
 if(offset===0)items.replaceChildren();
 else{const older=items.querySelector('[data-shed-load-notifications]');if(older)older.remove()}
 if(!data.notifications.length&&offset===0){items.append(text('p','No notifications yet. You will see updates here after moderator decisions or approved replies.','shed-empty'));return}
 for(const note of data.notifications){
  const card=document.createElement('article');card.className='shed-notification'+(note.read_at?'':' unread');
  card.append(text('div',formatDate(note.created_at)+' · '+roomName(note.room_id),'meta'));
  card.append(text('p',notificationText[note.kind]||'Your community activity has an update.'));
  card.append(button(note.kind==='approved'||note.kind==='reply'?'Open discussion':'View my posts',async()=>{
   try{
    await api('notifications/read',{notificationId:note.id});
    await notifications();
    if(note.kind==='approved'||note.kind==='reply')await openThread(note.room_id,note.thread_id);
    else{switchView('mine');await myPosts()}
   }catch(e){say('shedForumStatus',e.message)}
  }));
  if(!note.read_at)card.append(button('Mark as read',async()=>{
   try{await api('notifications/read',{notificationId:note.id});await notifications()}catch(e){say('shedForumStatus',e.message)}
  }));
  items.append(card);
 }
 if(data.hasMore){
  const older=button('Older notifications',()=>notifications(data.nextOffset).catch(e=>say('shedForumStatus',e.message)));
  older.dataset.shedLoadNotifications='true';older.className='shed-subtle-btn';items.append(older);
 }
}
function modItem(item,reported=false){
 const card=document.createElement('article');card.className='shed-mod-item';
 card.append(text('strong',reported?'Reported: '+item.reason:item.title||'Reply'));
 if(!reported)card.append(text('div','BOUNCER · '+String(item.severity||'unreviewed').toUpperCase()+' · '+(item.categories||[]).join(', '),'shed-bouncer-risk '+(item.severity||'unreviewed')));
 card.append(text('p',item.body));
 if(!reported&&['high','critical','unreviewed'].includes(item.severity))card.append(text('p','Safeguarding hold: ordinary approval is disabled. Specialist-informed review is required.','shed-bouncer-risk high'));
 const actions=reported?['remove','dismiss']:['approve','reject'];
 for(const action of actions){
  if(!reported&&action==='approve'&&['high','critical','unreviewed'].includes(item.severity))continue;
  card.append(button(action,async()=>{
   try{
    const payload={postId:reported?item.post_id:item.id,action};
    if(reported&&action==='dismiss')payload.reportId=item.id;
    await api('moderate',payload);await moderation();await refresh();await latest();await notifications();await myPosts();
   }catch(e){say('shedForumStatus',e.message)}
  }));
 }
 card.append(restrictionControls(reported?item.post_id:item.id));
 return card;
}
function restrictionControls(postId){
 const details=document.createElement('details');details.append(text('summary','Restrict community access'));
 const kind=document.createElement('select'),reason=document.createElement('select');
 kind.setAttribute('aria-label','Restriction duration');reason.setAttribute('aria-label','Reason for restricting community access');
 for(const [value,label] of [['1','Suspend for 1 day'],['7','Suspend for 7 days'],['30','Suspend for 30 days'],['ban','Ban until human reinstatement']]){const option=text('option',label);option.value=value;kind.append(option)}
 for(const [value,label] of [['medication-trading','Medication trading'],['harassment','Harassment'],['privacy','Privacy breach'],['unsafe-content','Unsafe content'],['spam','Spam'],['other','Other rule breach']]){const option=text('option',label);option.value=value;reason.append(option)}
 const confirm=document.createElement('input');confirm.type='checkbox';const label=text('label','I have reviewed the evidence and selected this restriction.');label.prepend(confirm);
 details.append(kind,reason,label,button('Apply selected restriction',async()=>{
  if(!confirm.checked){say('shedForumStatus','Confirm you have reviewed the evidence first.');confirm.focus();return}
  const payload={postId,kind:kind.value==='ban'?'banned':'suspended',reason:reason.value};
  if(kind.value!=='ban')payload.days=Number(kind.value);
  try{await api('restrict',payload);await moderation();say('shedForumStatus','Community restriction applied. My Timber access is unchanged.')}catch(e){say('shedForumStatus',e.message)}
 }));
 return details;
}
async function safety(){
 const data=await api('access'),container=by('shedAccessStatus');container.replaceChildren();
 if(data.restriction){
  container.append(text('strong',data.restriction.kind==='banned'?'Community access is paused until human review.':'Community access is temporarily suspended.'));
  container.append(text('p','Reason: '+data.restriction.reason+(data.restriction.expires_at?' · Ends '+new Date(data.restriction.expires_at).toLocaleString('en-GB'):'')));
  const appeal=data.appeals.find(a=>a.restriction_id===data.restriction.id);
  if(appeal)container.append(text('p',appeal.status==='open'?'Your access appeal is waiting for a different moderator.':'Access appeal outcome: '+appeal.status));
  else{
   const reason=document.createElement('select');reason.setAttribute('aria-label','Reason for appealing community restriction');
   for(const [value,label] of [['missed-context','The context was missed'],['incorrect-rule','The rule was applied incorrectly'],['other','Another reason for review']]){const option=text('option',label);option.value=value;reason.append(option)}
   container.append(reason,button('Appeal community restriction',async()=>{try{await api('restriction/appeal',{restrictionId:data.restriction.id,reason:reason.value});await safety();say('shedForumStatus','Appeal received for independent review.')}catch(e){say('shedForumStatus',e.message)}}));
  }
 }else container.append(text('p','No active community access restriction.'));
 const blocks=by('shedBlocks');blocks.replaceChildren(text('h4','Members you have blocked'));
 if(data.restriction){blocks.append(text('p','Block controls are unavailable while community access is restricted.'));return}
 const blockData=await api('blocks');
 if(!blockData.blocks.length)blocks.append(text('p','You have not blocked anyone.'));
 for(const item of blockData.blocks){const card=document.createElement('div');card.append(text('span',item.display_name),button('Unblock',async()=>{try{await api('unblock',{blockId:item.id});await safety();await latest();say('shedForumStatus','Your block has been removed. The other member may still have a block in place.')}catch(e){say('shedForumStatus',e.message)}}));blocks.append(card)}
}
async function moderation(){
 for(const id of ['shedQueue','shedReports','shedAppeals','shedRestrictions','shedRestrictionAppeals'])by(id).replaceChildren(text('p','Loading moderator queue…'));
 try{
  const data=await api('moderation');by('shedModNav').hidden=false;by('shedPendingBadge').textContent=String(data.pending.length+data.reports.length+(data.appeals||[]).length+(data.restrictionAppeals||[]).length);
  const q=by('shedQueue'),r=by('shedReports');q.replaceChildren(text('h4','Pending review ('+data.pending.length+')'));r.replaceChildren(text('h4','Reports ('+data.reports.length+')'));
  for(const item of data.pending)q.append(modItem(item));
  for(const item of data.reports)r.append(modItem(item,true));
  const restrictions=by('shedRestrictions');restrictions.replaceChildren(text('h4','Community access restrictions'));
  for(const item of data.restrictions||[]){
   const card=document.createElement('article');card.className='shed-mod-item';card.append(text('strong',(item.display_name||'Former community member')+' · '+item.kind),text('p','Reason: '+item.reason));
   card.append(button('Restore community access',async()=>{try{await api('restriction/lift',{restrictionId:item.id});await moderation();say('shedForumStatus','Community access restored. No posts have been published.')}catch(e){say('shedForumStatus',e.message)}}));restrictions.append(card);
  }
  const accessAppeals=by('shedRestrictionAppeals');accessAppeals.replaceChildren(text('h4','Community access appeals'));
  for(const item of data.restrictionAppeals||[]){
   const card=document.createElement('article');card.className='shed-mod-item';card.append(text('strong',item.display_name||'Former community member'),text('p',item.kind+' · '+item.restriction_reason+' · Appeal: '+item.reason),text('p','A different moderator must decide the appeal.'));
   for(const [outcome,label] of [['upheld','Uphold access restriction'],['reinstated','Reinstate community access']])card.append(button(label,async()=>{try{await api('restriction/review',{appealId:item.id,outcome});await moderation();say('shedForumStatus','Access appeal reviewed. Posts are unchanged.')}catch(e){say('shedForumStatus',e.message)}}));
   accessAppeals.append(card);
  }
  const appeals=by('shedAppeals');appeals.replaceChildren(text('h4','Appeals ('+(data.appeals||[]).length+')'));
  for(const item of data.appeals||[]){
   const card=document.createElement('article');card.className='shed-mod-item';
   const reason={'missed-context':'Context may have been missed','incorrect-rule':'Rule may have been applied incorrectly',other:'Another reason for review'}[item.reason]||'Review requested';
   card.append(text('strong','Appeal: '+(item.title||'Reply')),text('p',reason),text('p',item.body),text('p','A different moderator must review this. Returning a post for review does not publish it.','meta'));
   for(const [outcome,label] of [['upheld','Uphold decision'],['reconsider','Return for fresh moderation']]){
    const review=button(label,async()=>{
     review.disabled=true;
     try{await api('appeal/review',{appealId:item.id,outcome});await moderation();await myPosts();say('shedForumStatus','Appeal reviewed. No content has been published.')}
     catch(e){review.disabled=false;say('shedForumStatus',e.message)}
    });card.append(review);
   }appeals.append(card);
  }
 }catch(e){if(e.message==='moderator_only'){by('shedModNav').hidden=true;mod.hidden=true}else say('shedForumStatus',e.message)}
}
function showParticipation(data){
 healthConsent=data.healthConsent;participationVersion=data.policy.version;
 const panel=by('shedParticipation');panel.hidden=data.joined&&data.adultAccess&&healthConsent;
 const info=by('shedPolicyText');info.replaceChildren(text('h4','Community rules'));
 for(const value of data.policy.rules)info.append(text('p',value));
 info.append(text('h4','Your community information'));
 for(const value of data.policy.privacy)info.append(text('p',value));
 by('shedRulesAccepted').checked=data.joined;by('shedPrivacyAcknowledged').checked=data.joined;
 by('shedHealthConsent').checked=healthConsent;by('shedHealthConsentText').textContent=data.policy.healthConsent;
 by('shedJoin').disabled=!data.adultAccess;
 if(!data.adultAccess)say('shedParticipationStatus','Community access needs an adult-access review before you can join. You can still export or clear your own previous community information.');
}
by('shedViewPolicy').addEventListener('click',()=>{by('shedParticipation').hidden=false;by('shedParticipation').querySelector('h3').focus()});
by('shedParticipationForm').addEventListener('submit',async event=>{
 event.preventDefault();const submit=by('shedJoin');submit.disabled=true;
 try{
  await api('participation/consent',{version:participationVersion,rulesAccepted:by('shedRulesAccepted').checked,privacyAcknowledged:by('shedPrivacyAcknowledged').checked,healthConsent:by('shedHealthConsent').checked});
  location.reload();
 }catch(e){submit.disabled=false;say('shedParticipationStatus',e.message)}
});
by('shedExport').addEventListener('click',async()=>{
 try{
  const data=await api('export'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='my-timber-shed-data.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  say('shedForumStatus','Your community data download is ready.');
 }catch(e){say('shedForumStatus',e.message)}
});
by('shedLeave').addEventListener('click',async()=>{
 if(!by('shedLeaveConfirm').checked){say('shedForumStatus','Confirm you want to clear your community participation first.');return}
 try{
  await api('leave',{confirm:'leave-community'});
  location.reload();
 }catch(e){say('shedForumStatus',e.message)}
});
by('shedCancelReply').addEventListener('click',cancelReply);
by('shedChangeRoom').addEventListener('click',()=>{switchView('rooms');room.focus()});
room.addEventListener('change',()=>{currentRoom=room.value;currentThread=null;cancelReply();updateRoom();refresh().catch(e=>say('shedForumStatus',e.message))});
for(const control of document.querySelectorAll('[data-shed-view]'))control.addEventListener('click',()=>{
 const name=control.dataset.shedView;switchView(name);
 const job={latest,rooms:refresh,mine:myPosts,notifications,moderation,safety}[name];
 job().catch(e=>say('shedForumStatus',e.message));
});
by('shedRefreshLatest').addEventListener('click',()=>latest().catch(e=>say('shedForumStatus',e.message)));
by('shedRefreshNotifications').addEventListener('click',()=>notifications().catch(e=>say('shedForumStatus',e.message)));
aliasForm.addEventListener('submit',async event=>{
 event.preventDefault();
 try{
  const data=await api('profile/save',{displayName:alias.value.trim()});hasAlias=true;aliasForm.hidden=true;compose.hidden=!healthConsent;
  say('shedForumStatus','Community name saved. Your My Timber personal details remain private.');
  switchView('latest');await latest();
 }catch(e){say('shedAliasStatus',e.message)}
});
compose.addEventListener('submit',async event=>{
 event.preventDefault();if(!hasAlias)return;
 const payload={roomId:currentRoom,body:by('shedBody').value.trim()};
 if(parentId)payload.parentId=parentId;else payload.title=by('shedTitle').value.trim();
 try{
  const result=await api('submit',payload);say('shedComposeStatus',result.message);
  compose.reset();cancelReply();
  if(result.status==='approved'){switchView('latest');await latest();say('shedForumStatus',result.message)}
  else{switchView('mine');await myPosts();say('shedForumStatus',result.message)}
  await notifications();await moderation();
 }catch(e){say('shedComposeStatus',e.message)}
});
(async()=>{try{
 const participation=await api('participation');showParticipation(participation);
 if(!participation.adultAccess||!participation.joined||!participation.maintenanceReady){
  aliasForm.hidden=true;compose.hidden=true;
  for(const control of document.querySelectorAll('[data-shed-view]'))control.hidden=!['mine','safety'].includes(control.dataset.shedView);
  switchView('safety',false);await safety();say('shedForumStatus',!participation.adultAccess?'Adult-access review is required.':!participation.maintenanceReady?'Community access is temporarily paused while maintenance is checked. Your export and departure controls remain available.':'Read the rules and privacy information to join.');return;
 }
 const access=await api('access');accessRestricted=!!access.restriction;
 if(accessRestricted){
  aliasForm.hidden=true;compose.hidden=true;
  for(const control of document.querySelectorAll('[data-shed-view]'))control.hidden=!['mine','safety'].includes(control.dataset.shedView);
  switchView('safety',false);await safety();await myPosts();say('shedForumStatus','Community access is restricted. You can review your own posts, export your data or appeal.');return;
 }
 const result=await Promise.all([api('rooms'),api('profile')]);rooms=result[0].rooms;
 for(const item of rooms){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;room.append(option)}
 currentRoom=room.value||currentRoom;updateRoom();
 hasAlias=!!result[1].profile;aliasForm.hidden=hasAlias;compose.hidden=!hasAlias||!healthConsent;
 if(hasAlias)say('shedForumStatus','Signed in as '+result[1].profile.displayName+'. Your My Timber records are not shared.');
 else say('shedForumStatus','Choose a separate community name to take part. Nothing is published without moderator approval.');
 switchView(hasAlias?'latest':'rooms',false);
 const jobs=await Promise.allSettled([refresh(),latest(),myPosts(),notifications(),moderation()]);
 if(jobs.some(x=>x.status==='rejected'))say('shedForumStatus','Some community information could not be loaded. Please try refreshing.');
}catch(e){say('shedForumStatus',e.message)}})();
})();`;

// member-experience/timber-shed-presentation.mjs
var headers = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", "Vary": "Cookie" };
function createTimberShedPresentationRoutes(authenticate = authenticateMember) {
  return async (request, env) => {
    const path = new URL(request.url).pathname.replace(/\/+$/, "");
    const page = ["/member/timber-shed", "/member/timber-shed.html"].includes(path);
    const asset = ["/assets/member-experience/timber-shed.mjs", "/assets/member-experience/timber-shed-forum.mjs"].includes(path);
    if (!page && !asset) return null;
    if (env.MEMBER_EXPERIENCE_V1_ENABLED !== "true" || env.TIMBER_SHED_PRIVATE_ENABLED !== "true") return new Response("Not found", { status: 404, headers });
    if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
    const forum = env.TIMBER_SHED_FORUM_ENABLED === "true" && env.TIMBER_SHED_FORUM_PILOT_APPROVED === "true";
    if (path.endsWith("timber-shed-forum.mjs") && !forum) return new Response("Not found", { status: 404, headers });
    if (page) {
      const auth = await authenticate(request, env);
      if (auth.response || !Number.isSafeInteger(auth.userId) || auth.userId <= 0) return new Response("Sign in to My Timber to continue.", { status: 401, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
      const baseMarkup = env.TIMBER_SHED_AI_MODERATION_ENABLED === "true" && env.TIMBER_SHED_AI_PROVIDER_APPROVED === "true" ? timberShedForumPilotMarkup.replace("Automated rule-based safety screening", "AI-model and rule-based safety screening") : timberShedForumPilotMarkup;
      const markup = routinePublicationEnabled(env) ? baseMarkup.replace("Nothing is published immediately. Every new discussion and reply waits for a trained moderator.", "Recognised everyday posts can appear immediately after Bouncer checks. Unrecognised, grey or sensitive posts stay private until a human reviews them.").replace("Submit for moderation", "Post to the Shed").replace("Every post requires human approval.", "Recognised routine posts may publish automatically. Uncertain posts require human review.") : baseMarkup;
      const source = forum ? timberShedPage.replace("There is no public profile, member feed or posting. Your weight, treatment, mood and health records are never copied into The Timber Shed.", routinePublicationEnabled(env) ? "Your My Timber health records stay private. Only posts you deliberately submit can enter the community. Bouncer publishes recognised routine messages; uncertain posts wait for human review. There are no public member profiles." : "Your My Timber health records stay private. Only posts you deliberately submit can enter the member community, after human review. There are no public member profiles.").replace("No health records are read, shared or published.", "Your private My Timber health records are not read or shared here.").replace("We only save a programme activity ID, whether you completed it and optional simple feedback if you opt in. No names, measurements, medical notes or community posts.", "For these optional private progress ticks, we save the activity ID, completion and simple feedback. Community posts are separate and require deliberate submission and screening.") : timberShedPage;
      const html = forum ? source.replace(timberShedForumPreview(), "").replace('<section class="section"><div class="eyebrow">YOUR CHOICE</div>', markup + '<section class="section"><div class="eyebrow">YOUR CHOICE</div>').replace("</head>", "<style>" + timberShedForumPilotCSS + "</style></head>").replace("</body>", '<script src="/assets/member-experience/timber-shed-forum.mjs" defer><\/script></body>') : source;
      return new Response(request.method === "HEAD" ? null : html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
    }
    const body = path.endsWith("timber-shed-forum.mjs") ? timberShedForumPilotClient : timberShedClient;
    return new Response(request.method === "HEAD" ? null : body, { headers: { ...headers, "Content-Type": "text/javascript; charset=utf-8" } });
  };
}
__name(createTimberShedPresentationRoutes, "createTimberShedPresentationRoutes");
var timberShedPresentationRoutes = createTimberShedPresentationRoutes();

// member-experience/timber-shed-privacy-signals.mjs
function suggestsPrivateDetails(text) {
  if (typeof text !== "string") return false;
  return /\b(?:share|sharing|post|posting|publish|publishing|give out|send|sending)\b.{0,60}\b(?:my|our|their|his|her)\s+(?:(?:home|full|street|personal)\s+)?(?:address|postcode|phone(?: number)?|mobile(?: number)?|nhs number|medical record number)\b/i.test(text) || /\b(?:my|our|their|his|her)\s+(?:home|full|street)\s+(?:address|postcode)\b.{0,60}\b(?:online|public|post|share)\b/i.test(text);
}
__name(suggestsPrivateDetails, "suggestsPrivateDetails");

// member-experience/timber-shed-community-bouncer.mjs
var BOUNCER_VERSION = "bouncer-rules-2026-10-22-v3";
var RULES = [
  { category: "immediate-safety", severity: "critical", patterns: [
    /\b(?:i am|i'm|im|i feel like)\s+(?:going to|about to|planning to)\s+(?:kill myself|end my life|hurt myself|take my own life)\b/i,
    /\b(?:suicide|kill myself|end my life)\s+(?:tonight|today|right now|soon)\b/i,
    /\b(?:i have|i've)\s+(?:taken an overdose|overdosed|hurt myself)\b/i
  ] },
  { category: "self-harm", severity: "high", patterns: [
    /\b(?:suicid(?:e|al)|self[ -]?harm|kill myself|end my life|want to die|overdose)\b/i,
    /\b(?:cutting myself|hurting myself)\b/i
  ] },
  { category: "eating-disorder", severity: "high", patterns: [
    /\b(?:anorexi(?:a|c)|bulimi(?:a|c)|binge[ -]?purge|purging|starv(?:e|ing|ation))\b/i,
    /\b(?:make myself sick|stop eating altogether|how to purge)\b/i
  ] },
  { category: "medication-trading", severity: "high", patterns: [
    /\b(?:sell(?:ing)?|buy(?:ing)?|swap(?:ping)?|trade|trading|supply|supplying|give\s+away|for\s+sale|available\s+for\s+purchase|dm\s+me|message\s+me|contact\s+me)\b.{0,100}\b(?:mounjaro|wegovy|ozempic|testosterone|steroid(?:s)?|peptide(?:s)?|pen(?:s)?|jab(?:s)?|injection(?:s)?|medicine(?:s)?|medication|prescription(?:s)?)\b/i,
    /\b(?:mounjaro|wegovy|ozempic|testosterone|peptide(?:s)?|pen(?:s)?|jab(?:s)?|injection(?:s)?|medicine(?:s)?|medication|prescription(?:s)?)\b.{0,100}\b(?:for\s+sale|selling|buy\s+now|swap|trade|spare|leftover|supplier|vendor|dm\s+me|message\s+me|contact\s+me)\b/i,
    /\b(?:spare|leftover)\s+(?:(?:mounjaro|wegovy|ozempic|prescription)\s+)?(?:pen|pens|injection|injections|jab|jabs)\b.{0,65}(?:£\s*\d+|\b(?:dm|message|buy|sale|offer|available)\b)/i,
    /\b(?:peptide|peptides|research\s+peptide|research\s+peptides)\b.{0,90}(?:£\s*\d+|\b(?:order|vendor|supplier|ship|purchase|discount|dm\s+me|message\s+me)\b)/i,
    /\b(?:research\s+use\s+only|not\s+for\s+human\s+consumption|unlicensed|unapproved|investigational|clinical\s+trial|trial[- ]stage)\b.{0,100}\b(?:for\s+sale|buy|sell|supplier|vendor|order|ship|purchase|discount|dm\s+me)\b/i,
    /\b(?:for\s+sale|buy|sell|supplier|vendor|order|ship|purchase|discount|dm\s+me)\b.{0,100}\b(?:research\s+use\s+only|not\s+for\s+human\s+consumption|unlicensed|unapproved|investigational|clinical\s+trial|trial[- ]stage)\b/i
  ] },
  { category: "investigational-treatment", severity: "review", patterns: [
    /\b(?:investigational|clinical\s+trial|trial[- ]stage|research\s+use\s+only|not\s+for\s+human\s+consumption|unlicensed\s+peptide(?:s)?)\b/i
  ] },
  { category: "medication", severity: "high", patterns: [
    /\b(?:double|triple|increase|change|skip)\s+(?:my|your|the)?\s*(?:dose|dosage|injection|jab)\b/i,
    /\b(?:take|inject|use)\s+\d+(?:\.\d+)?\s*(?:mg|ml)\b/i,
    /\b(?:buy|sell|share)\s+(?:prescription|mounjaro|wegovy|medication|medicine)\b/i
  ] },
  { category: "substance-use", severity: "high", patterns: [
    /\b(?:withdrawal|detox|relapse|overdose|heroin|cocaine|opioid|addiction)\b/i
  ] },
  { category: "harassment", severity: "high", patterns: [
    /\b(?:i will|i'll|im going to|i'm going to)\s+(?:hurt|attack|kill|find)\s+(?:you|them|him|her)\b/i,
    /\b(?:you should die|kill yourself|go kill yourself)\b/i
  ] },
  { category: "personal-information", severity: "high", patterns: [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(?:\+44\s?|0)7\d{3}[\s-]?\d{6}\b/,
    /\b(?:my|our)\s+(?:address|postcode|nhs number|medical record number)\s*(?:is|:)\b/i,
    /\b(?:https?:\/\/|www\.)\S+/i
  ] },
  { category: "unsafe-weight-advice", severity: "high", patterns: [
    /\b(?:lose|drop)\s+\d+\s*(?:kg|lbs|pounds|stone)\s+(?:in|per)\s+(?:a|one|1|two|2)\s+(?:day|week)\b/i,
    /\b(?:fast|starve|purge)\s+(?:for|to)\s+(?:days|lose weight)\b/i
  ] },
  { category: "mental-wellbeing", severity: "review", patterns: [
    /\b(?:depress(?:ed|ion)|panic attack|anxiet(?:y|ies)|therapy|counsell(?:or|ing)|mental health)\b/i
  ] }
];
var severityRank = { routine: 0, review: 1, high: 2, critical: 3 };
var PRIORITY = { routine: 3, review: 2, high: 1, critical: 0 };
var GUIDANCE = {
  "immediate-safety": "Possible immediate safety concern: keep private, prioritise trained safeguarding review. Automated screening cannot assess urgency.",
  "self-harm": "Possible self-harm concern: hold privately for trained safeguarding review.",
  "eating-disorder": "Possible eating-disorder content: specialist-informed human review required.",
  "medication-trading": "Possible medication or investigational-product trading, sourcing or promotion. Hold privately; do not publish. Deliberate trading is grounds for a ban after human review.",
  "investigational-treatment": "Discussion of an investigational or unlicensed product. Review context; neutral factual research discussion is not automatically a breach.",
  "medication": "Possible treatment or dosage discussion: do not treat as clinical advice; refer clinical questions to the treating provider.",
  "substance-use": "Possible substance-use concern: specialist-informed human review required.",
  "harassment": "Potential threatening or abusive language: review before any publication.",
  "personal-information": "Potential identifying or contact information: hold and request safer wording.",
  "unsafe-weight-advice": "Potential unsafe weight-loss guidance: hold for review.",
  "mental-wellbeing": "Sensitive wellbeing subject: consider context and avoid clinical advice."
};
function screenForumText({ title = "", body = "" } = {}) {
  if (typeof title !== "string" || typeof body !== "string") throw Error("invalid_content");
  const content = [title, body].join("\n").slice(0, 1600);
  const categories = [], reasons = [];
  let severity = "routine";
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(content))) {
      categories.push(rule.category);
      reasons.push(GUIDANCE[rule.category]);
      if (severityRank[rule.severity] > severityRank[severity]) severity = rule.severity;
    }
  }
  if (suggestsPrivateDetails(content) && !categories.includes("personal-information")) {
    categories.push("personal-information");
    reasons.push(GUIDANCE["personal-information"]);
    if (severityRank.high > severityRank[severity]) severity = "high";
  }
  return Object.freeze({
    policyVersion: BOUNCER_VERSION,
    severity,
    priority: PRIORITY[severity],
    categories: Object.freeze(categories),
    reasons: Object.freeze(reasons),
    recommendation: severity === "routine" ? "human-review" : severity === "review" ? "sensitive-human-review" : "hold-for-specialist-review",
    mayAutoPublish: false,
    requiresHumanApproval: true,
    requiresSafeguardingSignoff: severity === "high" || severity === "critical"
  });
}
__name(screenForumText, "screenForumText");
function bouncerSubmissionNotice(result) {
  if (result?.severity === "critical") return "Your message is held privately for review. This is not an emergency service and nobody may see it immediately. If you or someone else is in immediate danger, call 999. For urgent NHS help, use NHS 111. Samaritans: 116 123.";
  if (result?.severity === "high") return "Your message is held privately for specialist-informed human review. This community cannot provide medical or crisis support. For immediate danger call 999; for urgent NHS advice use 111.";
  return "Submitted privately for moderation. Not visible to other members.";
}
__name(bouncerSubmissionNotice, "bouncerSubmissionNotice");

// member-experience/timber-shed-routine-publication.mjs
var ROUTINE_PUBLICATION_VERSION = "shed-routine-publication-2026-10-23-v1";
var titles = [/^(?:hello|hi)(?: everyone| all)?$/, /^(?:a )?small win(?: today| this week)?$/, /^weekend plans$/, /^how was your weekend$/, /^what are you looking forward to this weekend$/, /^(?:a )?walk(?: today| this week)?$/, /^getting outside$/, /^(?:thank you|thanks everyone)$/];
var sentences = [
  /^(?:hello|hi)(?: everyone| all)?$/,
  /^(?:i|we) (?:went|am going|are going|got out) for a(?: short| lunchtime| morning| evening)? walk(?: today| yesterday| this morning| this afternoon| this evening| this weekend)?$/,
  /^(?:i|we) (?:enjoyed|enjoy) (?:a|the) (?:walk|fresh air|weekend)$/,
  /^it (?:felt|feels) good to get outside$/,
  /^made time for a(?: lunchtime| short)? walk(?: today| this week)?$/,
  /^(?:a walk|a decent brew|a walk and a decent brew)(?: and a bit of time with the family)?$/,
  /^what have you got planned$/,
  /^what are you looking forward to this weekend$/,
  /^(?:well done|thank you|thanks)(?: everyone| for sharing| for the support)?$/,
  /^(?:that|this|it) sounds like a (?:good|great|lovely) plan$/,
  /^sounds like a (?:good|great|lovely) plan$/,
  /^hope you (?:all )?have a (?:good|great|lovely) weekend$/,
  /^looking forward to the weekend$/,
  /^keeping it simple this weekend$/,
  /^one small step at a time$/
];
function routinePublicationDecision(input, screening) {
  const hold = { publish: false, policyVersion: ROUTINE_PUBLICATION_VERSION, reason: "unrecognised_or_sensitive" };
  if (!screening || screening.policyVersion !== BOUNCER_VERSION || screening.severity !== "routine" || screening.categories?.length !== 0) return hold;
  if (typeof input?.body !== "string" || input.title !== void 0 && typeof input.title !== "string") return hold;
  const raw = [input.title || "", input.body].join("\n");
  if (!/^[A-Za-z ,.!?\n]+$/.test(raw) || input.body.length > 1e3) return hold;
  const normal = /* @__PURE__ */ __name((s) => s.toLowerCase().trim().replace(/\s+/g, " "), "normal");
  if (input.title !== void 0 && !titles.some((p) => p.test(normal(input.title)))) return hold;
  const parts = input.body.split(/[.!?]+/).map(normal).filter(Boolean);
  if (parts.length < 1 || parts.length > 5 || !parts.every((s) => sentences.some((p) => p.test(s)))) return hold;
  return { publish: true, policyVersion: ROUTINE_PUBLICATION_VERSION, reason: "recognised_everyday_message" };
}
__name(routinePublicationDecision, "routinePublicationDecision");

// member-experience/timber-shed-ai-moderation.mjs
var AI_MODERATION_POLICY = "bouncer-omni-2026-10-22-v1";

// member-experience/timber-shed-forum-appeals.mjs
var REASONS = /* @__PURE__ */ new Set(["missed-context", "incorrect-rule", "other"]);
var only = /* @__PURE__ */ __name((v, keys) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every((k) => keys.includes(k)), "only");
var id = /* @__PURE__ */ __name((v) => typeof v === "string" && /^[A-Za-z0-9_-]{10,80}$/.test(v), "id");
function validateForumAppeal(kind, input) {
  if (kind === "appeal") return only(input, ["postId", "reason"]) && id(input.postId) && REASONS.has(input.reason) ? null : "invalid_appeal";
  if (kind === "appeal/review") return only(input, ["appealId", "outcome"]) && id(input.appealId) && ["upheld", "reconsider"].includes(input.outcome) ? null : "invalid_appeal_review";
  return "invalid_action";
}
__name(validateForumAppeal, "validateForumAppeal");
async function listOpenAppeals(db) {
  const result = await db.prepare("SELECT a.id,a.post_id,a.reason,a.created_at,p.room_id,p.title,p.body,p.status AS post_status FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE a.status='open' AND p.status IN ('rejected','removed') ORDER BY a.created_at ASC,a.id ASC LIMIT 100").all();
  return result.results || [];
}
__name(listOpenAppeals, "listOpenAppeals");
async function forumAppealAction({ route, input, db, uid, timestamp, json: json3 }) {
  if (route === "appeals") {
    const rows = await db.prepare("SELECT a.id,a.post_id,a.reason,a.status,a.created_at,a.resolved_at,a.decision_at FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE p.user_id=? ORDER BY a.created_at DESC,a.id DESC LIMIT 100").bind(uid).all();
    return json3({ appeals: rows.results || [] });
  }
  if (route === "appeal") {
    const post = await db.prepare("SELECT id,status,reviewed_by,reviewed_at FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status IN ('rejected','removed')").bind(input.postId, uid).first();
    if (!post || !post.reviewed_by || !post.reviewed_at) return json3({ error: "post_unavailable" }, 404);
    const existing = await db.prepare("SELECT id,status FROM timber_shed_forum_appeals WHERE post_id=? AND decision_at=?").bind(post.id, post.reviewed_at).first();
    if (existing) return json3({ ok: true, id: existing.id, status: existing.status });
    const appealId = crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO timber_shed_forum_appeals(id,post_id,reason,status,decision_status,decision_by,decision_at,created_at) SELECT ?,?,?,'open',status,reviewed_by,reviewed_at,? FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status=? AND reviewed_by=? AND reviewed_at=?").bind(appealId, post.id, input.reason, timestamp, post.id, uid, post.status, post.reviewed_by, post.reviewed_at),
      // A lost race is an abort, not an unaudited partial change.
      db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN 'submitted' ELSE 'conflict' END,?)").bind(crypto.randomUUID(), appealId, uid, timestamp)
    ]);
    return json3({ ok: true, id: appealId, status: "open", message: "Your appeal is waiting for a different moderator. The post remains hidden." }, 202);
  }
  const moderator = await db.prepare("SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1").bind(uid).first();
  if (!moderator) return json3({ error: "moderator_only" }, 403);
  const appeal = await db.prepare("SELECT a.*,p.user_id,p.status AS current_status,p.reviewed_by AS current_reviewer,p.reviewed_at AS current_decision_at FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE a.id=?").bind(input.appealId).first();
  if (!appeal) return json3({ error: "appeal_unavailable" }, 404);
  if (appeal.user_id === uid || appeal.decision_by === uid) return json3({ error: "independent_reviewer_required" }, 403);
  if (appeal.status !== "open") return json3({ error: "appeal_already_reviewed" }, 409);
  if (appeal.current_status !== appeal.decision_status || appeal.current_reviewer !== appeal.decision_by || appeal.current_decision_at !== appeal.decision_at) return json3({ error: "decision_changed" }, 409);
  const operations = [
    db.prepare("UPDATE timber_shed_forum_appeals SET status=?,resolved_by=?,resolved_at=? WHERE id=? AND status='open' AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=post_id AND p.status=decision_status AND p.reviewed_by=decision_by AND p.reviewed_at=decision_at)").bind(input.outcome, uid, timestamp, appeal.id),
    db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN ? ELSE 'conflict' END,?)").bind(crypto.randomUUID(), appeal.id, uid, input.outcome, timestamp)
  ];
  if (input.outcome === "reconsider") {
    operations.push(db.prepare("UPDATE timber_shed_forum_posts SET status='pending',reviewed_by=NULL,reviewed_at=NULL WHERE id=? AND status=? AND reviewed_by=? AND reviewed_at=?").bind(appeal.post_id, appeal.decision_status, appeal.decision_by, appeal.decision_at));
    operations.push(db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN 'returned' ELSE 'conflict' END,?)").bind(crypto.randomUUID(), appeal.id, uid, timestamp));
  }
  await db.batch(operations);
  return json3({ ok: true, status: input.outcome, message: input.outcome === "reconsider" ? "Returned for fresh moderation. Nothing has been published." : "The original decision has been upheld." });
}
__name(forumAppealAction, "forumAppealAction");

// member-experience/timber-shed-forum-protection.mjs
var only2 = /* @__PURE__ */ __name((v, keys) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every((k) => keys.includes(k)), "only");
var id2 = /* @__PURE__ */ __name((v) => typeof v === "string" && /^[A-Za-z0-9_-]{10,80}$/.test(v), "id");
var REASONS2 = /* @__PURE__ */ new Set(["medication-trading", "harassment", "privacy", "unsafe-content", "spam", "other"]);
var isModerator = /* @__PURE__ */ __name(async (db, uid) => !!await db.prepare("SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1").bind(uid).first(), "isModerator");
function visibleAuthorSQL(alias, uid) {
  if (!["p", "r", "parent", "reply"].includes(alias) || !Number.isSafeInteger(uid) || uid <= 0) throw Error("invalid_visibility_scope");
  return "NOT EXISTS(SELECT 1 FROM timber_shed_forum_blocks bl WHERE (bl.blocker_id=" + uid + " AND bl.blocked_id=" + alias + ".user_id) OR (bl.blocked_id=" + uid + " AND bl.blocker_id=" + alias + ".user_id))";
}
__name(visibleAuthorSQL, "visibleAuthorSQL");
function visiblePostSQL(alias, uid) {
  return visibleAuthorSQL(alias, uid) + " AND (" + alias + ".parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=" + alias + ".parent_id AND parent.status='approved' AND " + visibleAuthorSQL("parent", uid) + "))";
}
__name(visiblePostSQL, "visiblePostSQL");
function validateProtectionInput(route, v) {
  if (route === "block") return only2(v, ["postId"]) && id2(v.postId) ? null : "invalid_block";
  if (route === "unblock") return only2(v, ["blockId"]) && id2(v.blockId) ? null : "invalid_block";
  if (route === "restrict") {
    return only2(v, ["postId", "kind", "reason", "days"]) && id2(v.postId) && REASONS2.has(v.reason) && (v.kind === "banned" && !Object.hasOwn(v, "days") || v.kind === "suspended" && [1, 7, 30].includes(v.days)) ? null : "invalid_restriction";
  }
  if (route === "restriction/lift") return only2(v, ["restrictionId"]) && id2(v.restrictionId) ? null : "invalid_restriction";
  if (route === "restriction/appeal") return only2(v, ["restrictionId", "reason"]) && id2(v.restrictionId) && ["missed-context", "incorrect-rule", "other"].includes(v.reason) ? null : "invalid_restriction_appeal";
  if (route === "restriction/review") return only2(v, ["appealId", "outcome"]) && id2(v.appealId) && ["upheld", "reinstated"].includes(v.outcome) ? null : "invalid_restriction_review";
  return "invalid_action";
}
__name(validateProtectionInput, "validateProtectionInput");
async function activeForumRestriction(db, uid, timestamp) {
  return await db.prepare("SELECT id,kind,reason,expires_at FROM timber_shed_forum_restrictions WHERE user_id=? AND lifted_at IS NULL AND (expires_at IS NULL OR expires_at>?)").bind(uid, timestamp).first();
}
__name(activeForumRestriction, "activeForumRestriction");
async function listForumRestrictions(db) {
  const restrictions = await db.prepare("SELECT r.id,r.kind,r.reason,r.created_at,r.expires_at,pr.display_name FROM timber_shed_forum_restrictions r LEFT JOIN timber_shed_forum_profiles pr ON pr.user_id=r.user_id WHERE r.lifted_at IS NULL ORDER BY r.created_at DESC LIMIT 100").all();
  const appeals = await db.prepare("SELECT a.id,a.reason,a.created_at,r.id AS restriction_id,r.kind,r.reason AS restriction_reason,pr.display_name FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id LEFT JOIN timber_shed_forum_profiles pr ON pr.user_id=r.user_id WHERE a.status='open' AND r.lifted_at IS NULL ORDER BY a.created_at ASC LIMIT 100").all();
  return { restrictions: restrictions.results || [], restrictionAppeals: appeals.results || [] };
}
__name(listForumRestrictions, "listForumRestrictions");
var audit = /* @__PURE__ */ __name((db, rid, uid, action, ts) => db.prepare("INSERT INTO timber_shed_access_audit(id,restriction_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN ? ELSE 'conflict' END,?)").bind(crypto.randomUUID(), rid, uid, action, ts), "audit");
async function forumProtectionAction({ route, input, db, uid, timestamp, json: json3 }) {
  if (route === "access") {
    const restriction = await activeForumRestriction(db, uid, timestamp);
    const rows = await db.prepare("SELECT a.id,a.restriction_id,a.reason,a.status,a.created_at,a.resolved_at FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id WHERE r.user_id=? ORDER BY a.created_at DESC LIMIT 100").bind(uid).all();
    return json3({ restriction, appeals: rows.results || [] });
  }
  if (route === "blocks") {
    const rows = await db.prepare("SELECT b.id,pr.display_name,b.created_at FROM timber_shed_forum_blocks b JOIN timber_shed_forum_profiles pr ON pr.user_id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created_at DESC LIMIT 100").bind(uid).all();
    return json3({ blocks: rows.results || [] });
  }
  if (route === "block") {
    const post = await db.prepare("SELECT p.user_id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND (p.parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=p.parent_id AND parent.status='approved'))").bind(input.postId).first();
    if (!post || post.user_id === uid) return json3({ error: "post_unavailable" }, 404);
    await db.prepare("INSERT OR IGNORE INTO timber_shed_forum_blocks(id,blocker_id,blocked_id,created_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(), uid, post.user_id, timestamp).run();
    return json3({ ok: true, message: "Your posts are now hidden from each other. Moderators can still review reports." });
  }
  if (route === "unblock") {
    await db.prepare("DELETE FROM timber_shed_forum_blocks WHERE id=? AND blocker_id=?").bind(input.blockId, uid).run();
    return json3({ ok: true });
  }
  if (route === "restriction/appeal") {
    const restriction = await db.prepare("SELECT id FROM timber_shed_forum_restrictions WHERE id=? AND user_id=? AND lifted_at IS NULL AND (expires_at IS NULL OR expires_at>?)").bind(input.restrictionId, uid, timestamp).first();
    if (!restriction) return json3({ error: "restriction_unavailable" }, 404);
    const existing = await db.prepare("SELECT id,status FROM timber_shed_restriction_appeals WHERE restriction_id=?").bind(restriction.id).first();
    if (existing) return json3({ ok: true, ...existing });
    const appealId = crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO timber_shed_restriction_appeals(id,restriction_id,reason,status,created_at) SELECT ?,id,?,'open',? FROM timber_shed_forum_restrictions WHERE id=? AND user_id=? AND lifted_at IS NULL").bind(appealId, input.reason, timestamp, restriction.id, uid),
      audit(db, restriction.id, uid, "appealed", timestamp)
    ]);
    return json3({ ok: true, id: appealId, status: "open" }, 202);
  }
  if (!await isModerator(db, uid)) return json3({ error: "moderator_only" }, 403);
  if (route === "restrict") {
    const post = await db.prepare("SELECT user_id FROM timber_shed_forum_posts WHERE id=? AND status<>'withdrawn'").bind(input.postId).first();
    if (!post) return json3({ error: "post_unavailable" }, 404);
    if (post.user_id === uid || await isModerator(db, post.user_id)) return json3({ error: "independent_admin_required" }, 403);
    if (await activeForumRestriction(db, post.user_id, timestamp)) return json3({ error: "already_restricted" }, 409);
    const rid = crypto.randomUUID(), expires = input.kind === "suspended" ? new Date(new Date(timestamp).getTime() + input.days * 864e5).toISOString() : null;
    await db.batch([
      db.prepare("UPDATE timber_shed_forum_restrictions SET lifted_at=? WHERE user_id=? AND lifted_at IS NULL AND expires_at IS NOT NULL AND expires_at<=?").bind(timestamp, post.user_id, timestamp),
      // Record any expired restriction closed by this request before a new restriction.
      db.prepare("INSERT INTO timber_shed_access_audit(id,restriction_id,actor_id,action,created_at) SELECT ?,id,?,'expired',? FROM timber_shed_forum_restrictions WHERE user_id=? AND lifted_at=? AND expires_at<=? AND NOT EXISTS(SELECT 1 FROM timber_shed_access_audit a WHERE a.restriction_id=timber_shed_forum_restrictions.id AND a.action='expired')").bind(crypto.randomUUID(), uid, timestamp, post.user_id, timestamp, timestamp),
      db.prepare("INSERT INTO timber_shed_forum_restrictions(id,user_id,source_post_id,kind,reason,created_by,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)").bind(rid, post.user_id, input.postId, input.kind, input.reason, uid, timestamp, expires),
      audit(db, rid, uid, input.kind, timestamp)
    ]);
    return json3({ ok: true, id: rid, kind: input.kind, expiresAt: expires }, 201);
  }
  if (route === "restriction/lift") {
    const restriction = await db.prepare("SELECT id,user_id FROM timber_shed_forum_restrictions WHERE id=? AND lifted_at IS NULL").bind(input.restrictionId).first();
    if (!restriction) return json3({ error: "restriction_unavailable" }, 404);
    if (restriction.user_id === uid) return json3({ error: "independent_admin_required" }, 403);
    await db.batch([
      db.prepare("UPDATE timber_shed_forum_restrictions SET lifted_by=?,lifted_at=? WHERE id=? AND lifted_at IS NULL").bind(uid, timestamp, restriction.id),
      audit(db, restriction.id, uid, "lifted", timestamp),
      db.prepare("UPDATE timber_shed_restriction_appeals SET status='reinstated',resolved_by=?,resolved_at=? WHERE restriction_id=? AND status='open'").bind(uid, timestamp, restriction.id)
    ]);
    return json3({ ok: true });
  }
  const appeal = await db.prepare("SELECT a.id,a.status,r.id AS restriction_id,r.user_id,r.created_by,r.lifted_at FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id WHERE a.id=?").bind(input.appealId).first();
  if (!appeal) return json3({ error: "appeal_unavailable" }, 404);
  if (appeal.user_id === uid || appeal.created_by === uid) return json3({ error: "independent_reviewer_required" }, 403);
  if (appeal.status !== "open" || appeal.lifted_at) return json3({ error: "appeal_already_reviewed" }, 409);
  const ops = [
    db.prepare("UPDATE timber_shed_restriction_appeals SET status=?,resolved_by=?,resolved_at=? WHERE id=? AND status='open' AND EXISTS(SELECT 1 FROM timber_shed_forum_restrictions r WHERE r.id=restriction_id AND r.lifted_at IS NULL)").bind(input.outcome, uid, timestamp, appeal.id),
    audit(db, appeal.restriction_id, uid, input.outcome, timestamp)
  ];
  if (input.outcome === "reinstated") {
    ops.push(db.prepare("UPDATE timber_shed_forum_restrictions SET lifted_by=?,lifted_at=? WHERE id=? AND lifted_at IS NULL").bind(uid, timestamp, appeal.restriction_id));
    ops.push(audit(db, appeal.restriction_id, uid, "lifted", timestamp));
  }
  await db.batch(ops);
  return json3({ ok: true, status: input.outcome });
}
__name(forumProtectionAction, "forumProtectionAction");

// member-experience/timber-shed-forum-privacy.mjs
async function exportOwnForum(db, uid) {
  const all = /* @__PURE__ */ __name(async (sql) => (await db.prepare(sql).bind(uid).all()).results || [], "all");
  const profile = await db.prepare("SELECT display_name,created_at FROM timber_shed_forum_profiles WHERE user_id=?").bind(uid).first();
  return {
    profile: profile || null,
    participation: await all("SELECT rules_version,privacy_version,disclosure_consent_at,accepted_at FROM timber_shed_participation WHERE user_id=?"),
    adultAccess: await all("SELECT evidence_method,verified_at,expires_at,revoked_at FROM timber_shed_adult_access WHERE user_id=?"),
    posts: await all("SELECT id,room_id,parent_id,title,body,status,created_at,reviewed_at FROM timber_shed_forum_posts WHERE user_id=? ORDER BY created_at,id"),
    publications: await all("SELECT a.post_id,a.decision_policy,a.governance_version,a.created_at FROM timber_shed_auto_publications a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE p.user_id=?"),
    reports: await all("SELECT id,post_id,reason,status,created_at FROM timber_shed_forum_reports WHERE reporter_id=? ORDER BY created_at,id"),
    appeals: await all("SELECT a.id,a.post_id,a.reason,a.status,a.created_at,a.resolved_at FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE p.user_id=? ORDER BY a.created_at,a.id"),
    restrictions: await all("SELECT id,kind,reason,created_at,expires_at,lifted_at FROM timber_shed_forum_restrictions WHERE user_id=? ORDER BY created_at,id"),
    restrictionAppeals: await all("SELECT a.id,a.restriction_id,a.reason,a.status,a.created_at,a.resolved_at FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id WHERE r.user_id=? ORDER BY a.created_at,a.id"),
    notifications: await all("SELECT id,post_id,thread_id,room_id,kind,created_at,read_at FROM timber_shed_forum_notifications WHERE recipient_id=? ORDER BY created_at,id"),
    blocks: await all("SELECT b.id,pr.display_name,b.created_at FROM timber_shed_forum_blocks b JOIN timber_shed_forum_profiles pr ON pr.user_id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created_at,b.id")
  };
}
__name(exportOwnForum, "exportOwnForum");
async function leaveForum(db, uid, timestamp) {
  await db.batch([
    db.prepare("DELETE FROM timber_shed_participation WHERE user_id=?").bind(uid),
    db.prepare("DELETE FROM timber_shed_bouncer_screenings WHERE post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)").bind(uid),
    db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT lower(hex(randomblob(16))),id,NULL,'withdraw',? FROM timber_shed_forum_posts WHERE user_id=? AND status<>'withdrawn'").bind(timestamp, uid),
    db.prepare("DELETE FROM timber_shed_forum_notifications WHERE recipient_id=? OR post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?) OR thread_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)").bind(uid, uid, uid),
    db.prepare("DELETE FROM timber_shed_forum_reports WHERE post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)").bind(uid),
    db.prepare("DELETE FROM timber_shed_forum_appeals WHERE post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)").bind(uid),
    db.prepare("UPDATE timber_shed_forum_posts SET status='withdrawn',title=NULL,body='[withdrawn by member]',reviewed_at=? WHERE user_id=?").bind(timestamp, uid),
    db.prepare("DELETE FROM timber_shed_forum_reports WHERE reporter_id=?").bind(uid),
    db.prepare("DELETE FROM timber_shed_forum_blocks WHERE blocker_id=?").bind(uid),
    db.prepare("DELETE FROM timber_shed_forum_profiles WHERE user_id=?").bind(uid)
  ]);
}
__name(leaveForum, "leaveForum");

// member-experience/timber-shed-forum-notifications.mjs
var NOTIFICATION_KINDS = Object.freeze(["approved", "rejected", "removed", "reply"]);
function notificationWrites(db, { postId, action, moderatorId, timestamp }) {
  if (!["approve", "reject", "remove"].includes(action)) return [];
  const kind = { approve: "approved", reject: "rejected", remove: "removed" }[action];
  const status = kind;
  const writes = [
    db.prepare(`INSERT OR IGNORE INTO timber_shed_forum_notifications
    (id,recipient_id,post_id,thread_id,room_id,kind,created_at)
    SELECT ?,p.user_id,p.id,COALESCE(p.parent_id,p.id),p.room_id,?,?
    FROM timber_shed_forum_posts p
    WHERE p.id=? AND p.status=? AND p.reviewed_by IS ? AND p.reviewed_at=?`).bind(crypto.randomUUID(), kind, timestamp, postId, status, moderatorId, timestamp)
  ];
  if (action === "approve") {
    writes.push(db.prepare(`INSERT OR IGNORE INTO timber_shed_forum_notifications
    (id,recipient_id,post_id,thread_id,room_id,kind,created_at)
    SELECT ?,parent.user_id,reply.id,parent.id,reply.room_id,'reply',?
    FROM timber_shed_forum_posts reply
    JOIN timber_shed_forum_posts parent ON parent.id=reply.parent_id
    WHERE reply.id=? AND reply.status='approved' AND parent.status='approved'
      AND reply.reviewed_by IS ? AND reply.reviewed_at=? AND parent.user_id<>reply.user_id`).bind(crypto.randomUUID(), timestamp, postId, moderatorId, timestamp));
  }
  return writes;
}
__name(notificationWrites, "notificationWrites");

// member-experience/timber-shed-forum-routes.mjs
var HEADERS = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Robots-Tag": "noindex, nofollow, noarchive", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
var json2 = /* @__PURE__ */ __name((value, status = 200) => Response.json(value, { status, headers: HEADERS }), "json");
var ROOMS = new Set(timberShedForumRooms.map((room) => room.id));
var ACTIONS = /* @__PURE__ */ new Set(["approve", "reject", "remove", "dismiss"]);
var REASONS3 = /* @__PURE__ */ new Set(["privacy", "unsafe-health-advice", "harassment", "self-harm-risk", "spam", "other"]);
var own = /* @__PURE__ */ __name((o, k) => Object.prototype.hasOwnProperty.call(o, k), "own");
var only3 = /* @__PURE__ */ __name((o, keys) => o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).every((k) => keys.includes(k)), "only");
var clean = /* @__PURE__ */ __name((s, min, max) => typeof s === "string" && s === s.trim() && s.length >= min && s.length <= max && !/[\u0000-\u001f\u007f]/.test(s), "clean");
var privateInfo = /* @__PURE__ */ __name((s) => /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(s) || /https?:\/\/|www\./i.test(s) || /(?:\+44\s?|0)7\d{3}[\s-]?\d{6}\b/.test(s), "privateInfo");
function adult(dob, now2 = /* @__PURE__ */ new Date()) {
  if (typeof dob !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const date = /* @__PURE__ */ new Date(dob + "T00:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dob) return false;
  const cut = new Date(Date.UTC(now2.getUTCFullYear() - 18, now2.getUTCMonth(), now2.getUTCDate()));
  return date <= cut;
}
__name(adult, "adult");
function validateForumInput(kind, input) {
  if (kind === "leave") return only3(input, ["confirm"]) && input.confirm === "leave-community" ? null : "confirmation_required";
  if (["block", "unblock", "restrict", "restriction/lift", "restriction/appeal", "restriction/review"].includes(kind)) return validateProtectionInput(kind, input);
  if (kind === "appeal" || kind === "appeal/review") return validateForumAppeal(kind, input);
  if (kind === "profile") {
    if (!only3(input, ["displayName"]) || !own(input, "displayName")) return "invalid_profile";
    const name = input.displayName;
    if (!clean(name, 3, 24) || !/^[A-Za-z][A-Za-z0-9 _-]*$/.test(name) || privateInfo(name)) return "invalid_display_name";
    return null;
  }
  if (kind === "submit") {
    if (!only3(input, ["roomId", "parentId", "title", "body"]) || !own(input, "roomId") || !own(input, "body") || !ROOMS.has(input.roomId)) return "invalid_submission";
    if (!clean(input.body, 12, 1e3) || privateInfo(input.body)) return "unsafe_or_invalid_content";
    const reply2 = own(input, "parentId");
    if (reply2 && (!clean(input.parentId, 10, 80) || own(input, "title"))) return "invalid_reply";
    if (!reply2 && (!clean(input.title, 8, 100) || privateInfo(input.title))) return "invalid_title";
    return null;
  }
  if (kind === "notificationRead") {
    if (!only3(input, ["notificationId"]) || !clean(input.notificationId, 10, 80)) return "invalid_notification";
    return null;
  }
  if (kind === "withdraw") {
    if (!only3(input, ["postId"]) || !clean(input.postId, 10, 80)) return "invalid_withdrawal";
    return null;
  }
  if (kind === "report") {
    if (!only3(input, ["postId", "reason"]) || !clean(input.postId, 10, 80) || !REASONS3.has(input.reason)) return "invalid_report";
    return null;
  }
  if (kind === "moderate") {
    if (!only3(input, ["postId", "action", "reportId"]) || !clean(input.postId, 10, 80) || !ACTIONS.has(input.action) || input.action === "dismiss" && !clean(input.reportId, 10, 80) || input.action !== "dismiss" && own(input, "reportId")) return "invalid_moderation";
    return null;
  }
  return "invalid_action";
}
__name(validateForumInput, "validateForumInput");
async function parse(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("Content-Type") || "")) return { error: "json_required", status: 415 };
  const raw = await request.text();
  if (raw.length > 1600) return { error: "too_large", status: 413 };
  try {
    return { value: JSON.parse(raw) };
  } catch {
    return { error: "invalid_json", status: 400 };
  }
}
__name(parse, "parse");
var isModerator2 = /* @__PURE__ */ __name(async (db, id3) => !!await db.prepare("SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1").bind(id3).first(), "isModerator");
function createTimberShedForumRoutes(authenticate = authenticateMember, now2 = () => /* @__PURE__ */ new Date()) {
  return /* @__PURE__ */ __name(async function forumRoutes(request, env) {
    const path = new URL(request.url).pathname;
    if (!path.startsWith("/v1/timber-shed/forum/")) return null;
    if (env.TIMBER_SHED_FORUM_ENABLED !== "true" || env.TIMBER_SHED_PRIVATE_ENABLED !== "true" || env.MEMBER_EXPERIENCE_V1_ENABLED !== "true" || env.TIMBER_SHED_FORUM_PILOT_APPROVED !== "true") return json2({ error: "not_available" }, 404);
    if (env.TIMBER_SHED_RETENTION_ENABLED !== "true") return json2({ error: "community_maintenance_not_enabled" }, 404);
    if (!governanceApproved(env)) return json2({ error: "governance_not_approved" }, 404);
    const route = path.slice("/v1/timber-shed/forum/".length);
    if (!(/* @__PURE__ */ new Set(["participation", "participation/consent", "rooms", "threads", "room-topics", "latest", "mine", "notifications", "notifications/read", "moderation", "profile", "profile/save", "submit", "report", "moderate", "withdraw", "appeals", "appeal", "appeal/review", "access", "blocks", "block", "unblock", "restrict", "restriction/lift", "restriction/appeal", "restriction/review", "export", "leave"])).has(route)) return json2({ error: "not_found" }, 404);
    const method = route === "participation" || route === "export" || route === "access" || route === "blocks" || route === "appeals" || route === "rooms" || route === "threads" || route === "room-topics" || route === "latest" || route === "mine" || route === "notifications" || route === "moderation" || route === "profile" ? "GET" : "POST";
    if (request.method !== method) return json2({ error: "method_not_allowed" }, 405);
    if (method === "POST" && request.headers.get("Origin") !== new URL(request.url).origin) return json2({ error: "same_origin_required" }, 403);
    const auth = await authenticate(request, env);
    if (auth.response) return auth.response;
    if (!Number.isSafeInteger(auth.userId) || auth.userId <= 0) return json2({ error: "authentication_required" }, 401);
    const db = env.DB, uid = auth.userId;
    try {
      const eligibility = await db.prepare("SELECT a.email_verified,u.date_of_birth FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?").bind(uid).first();
      if (!["export", "leave"].includes(route) && (!eligibility || Number(eligibility.email_verified) !== 1 || !adult(eligibility.date_of_birth, now2()))) return json2({ error: "adult_verified_members_only" }, 403);
      const timestampNow = now2().toISOString();
      const participation = await forumParticipation(db, uid, timestampNow, env);
      if (route === "participation") return json2(participation);
      if (route === "participation/consent") {
        const parsed2 = await parse(request);
        if (parsed2.error) return json2({ error: parsed2.error }, parsed2.status);
        if (!validParticipation(parsed2.value, env)) return json2({ error: "explicit_current_agreement_required" }, 400);
        if (!participation.adultAccess) return json2({ error: "adult_access_review_required" }, 403);
        if (participation.disclosureConsentRecorded && !parsed2.value.healthConsent) return json2({ error: "withdraw_consent_using_leave_community" }, 409);
        await saveForumParticipation(db, uid, parsed2.value, timestampNow, env);
        return json2({ ok: true, participation: await forumParticipation(db, uid, timestampNow, env) });
      }
      const ownOnly = /* @__PURE__ */ new Set(["export", "leave", "mine", "withdraw", "appeals", "appeal", "access", "restriction/appeal"]);
      if (!ownOnly.has(route) && !participation.adultAccess) return json2({ error: "adult_access_review_required" }, 403);
      if (!ownOnly.has(route) && !participation.maintenanceReady) return json2({ error: "community_maintenance_unavailable" }, 503);
      if (!ownOnly.has(route) && !participation.joined) return json2({ error: "community_agreement_required" }, 403);
      if (route === "submit" && !participation.healthConsent) return json2({ error: "explicit_health_consent_required" }, 403);
      const restriction = await activeForumRestriction(db, uid, now2().toISOString());
      if (restriction && !["access", "appeals", "appeal", "mine", "withdraw", "restriction/appeal", "export", "leave"].includes(route)) return json2({ error: "community_access_restricted" }, 403);
      if (route === "export") return json2({ forum: await exportOwnForum(db, uid) });
      if (route === "access" || route === "blocks") return await forumProtectionAction({ route, db, uid, timestamp: now2().toISOString(), json: json2 });
      if (route === "appeals") return await forumAppealAction({ route, db, uid, json: json2 });
      if (route === "rooms") return json2({ rooms: timberShedForumRooms.map(({ id: id3, name, kicker, description }) => ({ id: id3, name, kicker, description })) });
      if (route === "threads") {
        const room = new URL(request.url).searchParams.get("room");
        if (!ROOMS.has(room)) return json2({ error: "invalid_room" }, 400);
        const threadId = new URL(request.url).searchParams.get("threadId");
        if (threadId !== null && !clean(threadId, 10, 80)) return json2({ error: "invalid_thread" }, 400);
        if (threadId) {
          const posts2 = await db.prepare(`SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.created_at,pr.display_name FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL("p", uid)} AND p.room_id=? AND p.status='approved' AND (p.id=? AND p.parent_id IS NULL OR p.parent_id=? AND EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=p.parent_id AND parent.status='approved')) ORDER BY p.created_at ASC LIMIT 100`).bind(room, threadId, threadId).all();
          return json2({ room, threadId, posts: posts2.results || [] });
        }
        const posts = await db.prepare(`SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.created_at,pr.display_name FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL("p", uid)} AND p.room_id=? AND p.status='approved' AND (p.parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=p.parent_id AND parent.status='approved')) ORDER BY p.created_at DESC LIMIT 100`).bind(room).all();
        return json2({ room, posts: posts.results || [] });
      }
      if (route === "room-topics") {
        const params = new URL(request.url).searchParams, room = params.get("room"), raw = params.get("offset") || "0";
        if (!ROOMS.has(room) || !/^(0|[1-9][0-9]{0,3})$/.test(raw) || Number(raw) > 2e3) return json2({ error: "invalid_room_page" }, 400);
        const offset = Number(raw);
        const rows = await db.prepare(`SELECT p.id,p.room_id,p.title,substr(p.body,1,220) AS excerpt,p.created_at,p.reviewed_at,pr.display_name,(SELECT COUNT(*) FROM timber_shed_forum_posts r WHERE r.parent_id=p.id AND r.status='approved' AND ${visibleAuthorSQL("r", uid)}) AS reply_count FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL("p", uid)} AND p.room_id=? AND p.status='approved' AND p.parent_id IS NULL ORDER BY p.reviewed_at DESC,p.id DESC LIMIT 21 OFFSET ?`).bind(room, offset).all();
        return json2({ room, posts: (rows.results || []).slice(0, 20), hasMore: (rows.results || []).length > 20, nextOffset: offset + 20 });
      }
      if (route === "latest") {
        const rows = await db.prepare(`SELECT p.id,p.room_id,p.title,substr(p.body,1,220) AS excerpt,p.created_at,p.reviewed_at,pr.display_name,(SELECT COUNT(*) FROM timber_shed_forum_posts r WHERE r.parent_id=p.id AND r.status='approved' AND ${visibleAuthorSQL("r", uid)}) AS reply_count FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL("p", uid)} AND p.status='approved' AND p.parent_id IS NULL ORDER BY p.reviewed_at DESC,p.id DESC LIMIT 30`).all();
        return json2({ posts: rows.results || [] });
      }
      if (route === "notifications") {
        const raw = new URL(request.url).searchParams.get("offset") || "0";
        if (!/^(0|[1-9][0-9]{0,3})$/.test(raw) || Number(raw) > 2e3) return json2({ error: "invalid_notification_page" }, 400);
        const offset = Number(raw);
        const entries = await db.prepare(`SELECT n.id,n.kind,n.room_id,n.thread_id,n.created_at,n.read_at FROM timber_shed_forum_notifications n WHERE n.recipient_id=? AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=n.post_id AND ${visiblePostSQL("p", uid)}) ORDER BY n.created_at DESC,n.id DESC LIMIT 21 OFFSET ?`).bind(uid, offset).all();
        const count = await db.prepare(`SELECT COUNT(*) AS n FROM timber_shed_forum_notifications n WHERE n.recipient_id=? AND n.read_at IS NULL AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=n.post_id AND ${visiblePostSQL("p", uid)})`).bind(uid).first();
        return json2({ notifications: (entries.results || []).slice(0, 20), unreadCount: Number(count?.n || 0), hasMore: (entries.results || []).length > 20, nextOffset: offset + 20 });
      }
      if (route === "mine") {
        const rows = await db.prepare("SELECT id,room_id,parent_id,title,body,status,created_at,reviewed_at FROM timber_shed_forum_posts WHERE user_id=? ORDER BY created_at DESC LIMIT 100").bind(uid).all();
        return json2({ posts: rows.results || [] });
      }
      if (route === "profile") {
        const profile = await db.prepare("SELECT display_name FROM timber_shed_forum_profiles WHERE user_id=?").bind(uid).first();
        return json2({ profile: profile ? { displayName: profile.display_name } : null });
      }
      if (route === "moderation") {
        if (!await isModerator2(db, uid)) return json2({ error: "moderator_only" }, 403);
        const queue = await db.prepare("SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.status,p.created_at,pr.display_name,b.severity,b.priority,b.policy_version,b.categories_json FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id LEFT JOIN timber_shed_bouncer_screenings b ON b.post_id=p.id WHERE p.status='pending' ORDER BY COALESCE(b.priority,0) ASC,p.created_at ASC LIMIT 100").all();
        const reports = await db.prepare("SELECT r.id,r.post_id,r.reason,r.created_at,p.room_id,p.title,p.body FROM timber_shed_forum_reports r JOIN timber_shed_forum_posts p ON p.id=r.post_id WHERE r.status='open' ORDER BY CASE r.reason WHEN 'self-harm-risk' THEN 0 WHEN 'unsafe-health-advice' THEN 1 WHEN 'privacy' THEN 1 WHEN 'harassment' THEN 1 ELSE 2 END ASC,r.created_at ASC LIMIT 100").all();
        const pending = (queue.results || []).map(({ categories_json, ...post2 }) => ({ ...post2, categories: post2.policy_version && categories_json ? JSON.parse(categories_json) : [], priority: post2.priority ?? 0, severity: post2.severity || "unreviewed" }));
        return json2({ pending, reports: reports.results || [], appeals: await listOpenAppeals(db), ...await listForumRestrictions(db) });
      }
      if (!["profile/save", "submit", "report", "moderate", "withdraw", "notifications/read", "appeal", "appeal/review", "block", "unblock", "restrict", "restriction/lift", "restriction/appeal", "restriction/review", "leave"].includes(route)) return json2({ error: "not_found" }, 404);
      const parsed = await parse(request);
      if (parsed.error) return json2({ error: parsed.error }, parsed.status);
      const input = parsed.value, kind = route === "profile/save" ? "profile" : route === "notifications/read" ? "notificationRead" : route;
      const problem = validateForumInput(kind, input);
      if (problem) return json2({ error: problem }, 400);
      const timestamp = now2().toISOString();
      if (route === "leave") {
        await leaveForum(db, uid, timestamp);
        return json2({ ok: true, message: "Your community name and post text have been cleared. Your My Timber account is unchanged." });
      }
      if (["block", "unblock", "restrict", "restriction/lift", "restriction/appeal", "restriction/review"].includes(route)) return await forumProtectionAction({ route, input, db, uid, timestamp, json: json2 });
      if (route === "appeal" || route === "appeal/review") return await forumAppealAction({ route, input, db, uid, timestamp, json: json2 });
      if (route === "notifications/read") {
        const record = await db.prepare("SELECT id FROM timber_shed_forum_notifications WHERE id=? AND recipient_id=?").bind(input.notificationId, uid).first();
        if (!record) return json2({ error: "notification_unavailable" }, 404);
        await db.prepare("UPDATE timber_shed_forum_notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND recipient_id=?").bind(timestamp, input.notificationId, uid).run();
        return json2({ ok: true });
      }
      if (route === "profile/save") {
        const existing = await db.prepare("SELECT display_name FROM timber_shed_forum_profiles WHERE user_id=?").bind(uid).first();
        if (existing) return json2({ error: "display_name_locked_for_pilot" }, 409);
        const result = await db.prepare("INSERT OR IGNORE INTO timber_shed_forum_profiles(user_id,display_name,created_at) VALUES(?,?,?)").bind(uid, input.displayName, timestamp).run();
        if (Number(result.meta?.changes) !== 1) return json2({ error: "display_name_unavailable" }, 409);
        return json2({ ok: true, profile: { displayName: input.displayName } }, 201);
      }
      if (route === "submit") {
        const profile = await db.prepare("SELECT user_id FROM timber_shed_forum_profiles WHERE user_id=?").bind(uid).first();
        if (!profile) return json2({ error: "choose_display_name_first" }, 409);
        if (own(input, "parentId")) {
          const parent = await db.prepare(`SELECT p.room_id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND p.parent_id IS NULL AND ${visibleAuthorSQL("p", uid)}`).bind(input.parentId).first();
          if (!parent || parent.room_id !== input.roomId) return json2({ error: "parent_unavailable" }, 404);
        }
        const quota = await db.prepare("SELECT COUNT(*) AS n FROM timber_shed_forum_posts WHERE user_id=? AND created_at>=?").bind(uid, new Date(now2().getTime() - 864e5).toISOString()).first();
        if (Number(quota?.n || 0) >= 5) return json2({ error: "daily_submission_limit" }, 429);
        const local = screenForumText({ title: input.title || "", body: input.body });
        const modelRequired = env.TIMBER_SHED_AI_MODERATION_ENABLED === "true";
        if (modelRequired && env.TIMBER_SHED_AI_PROVIDER_APPROVED !== "true") return json2({ error: "model_not_authorised" }, 503);
        if (modelRequired) return json2({ error: "external_ai_not_in_pilot_policy" }, 503);
        const screening = local;
        const id3 = crypto.randomUUID();
        const decision = routinePublicationEnabled(env) ? routinePublicationDecision(input, screening) : { publish: false };
        const operations2 = [
          db.prepare(`INSERT INTO timber_shed_forum_posts(id,user_id,room_id,parent_id,title,body,status,created_at) SELECT ?,?,?,?,?,?,'pending',? WHERE NOT EXISTS(SELECT 1 FROM timber_shed_forum_restrictions ar WHERE ar.user_id=? AND ar.lifted_at IS NULL AND (ar.expires_at IS NULL OR ar.expires_at>?)) AND (? IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND p.parent_id IS NULL AND ${visibleAuthorSQL("p", uid)}))`).bind(id3, uid, input.roomId, input.parentId || null, input.title || null, input.body, timestamp, uid, timestamp, input.parentId || null, input.parentId || null),
          db.prepare("INSERT INTO timber_shed_bouncer_screenings(post_id,policy_version,model_name,severity,priority,categories_json,screened_at) VALUES(?,?,?,?,?,?,?)").bind(id3, screening.policyVersion, screening.model || null, screening.severity, screening.priority, JSON.stringify(screening.categories), timestamp)
        ];
        if (decision.publish) {
          operations2.push(db.prepare("UPDATE timber_shed_forum_posts SET status='approved',reviewed_at=?,reviewed_by=NULL WHERE id=? AND status='pending'").bind(timestamp, id3));
          operations2.push(db.prepare("INSERT INTO timber_shed_auto_publications(post_id,decision_policy,governance_version,created_at) VALUES(?,(SELECT ? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_posts WHERE id=? AND status='approved' AND reviewed_by IS NULL AND reviewed_at=?)),?,?)").bind(id3, decision.policyVersion, id3, timestamp, forumPolicy(env).version, timestamp));
          operations2.push(db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) VALUES(?,?,NULL,'approve',?)").bind(crypto.randomUUID(), id3, timestamp));
          operations2.push(...notificationWrites(db, { postId: id3, action: "approve", moderatorId: null, timestamp }));
        }
        const results2 = await db.batch(operations2);
        if (Number(results2[0]?.meta?.changes) !== 1 || Number(results2[1]?.meta?.changes) !== 1) return json2({ error: "screening_unavailable" }, 503);
        if (decision.publish) return json2({ ok: true, id: id3, status: "approved", publication: "automated-routine", message: "Published by Bouncer after routine checks. You can withdraw your post in My posts." }, 201);
        return json2({ ok: true, id: id3, status: "pending", message: routinePublicationEnabled(env) && screening.severity === "routine" ? "Bouncer could not clearly recognise this as routine. It is private and waiting for human review." : bouncerSubmissionNotice(screening) }, 202);
      }
      if (route === "withdraw") {
        const existing = await db.prepare("SELECT id FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status IN ('pending','approved','rejected','removed')").bind(input.postId, uid).first();
        if (!existing) return json2({ error: "post_unavailable" }, 404);
        const operations2 = [
          db.prepare("UPDATE timber_shed_forum_posts SET status='withdrawn',title=NULL,body='[withdrawn by member]',reviewed_at=? WHERE id=? AND user_id=? AND status IN ('pending','approved','rejected','removed')").bind(timestamp, input.postId, uid),
          db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT ?,?,NULL,'withdraw',? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status='withdrawn')").bind(crypto.randomUUID(), input.postId, timestamp, input.postId, uid),
          db.prepare("UPDATE timber_shed_forum_reports SET status='closed' WHERE post_id=? AND status='open'").bind(input.postId),
          db.prepare("DELETE FROM timber_shed_forum_notifications WHERE post_id=? OR thread_id=?").bind(input.postId, input.postId),
          db.prepare("UPDATE timber_shed_forum_appeals SET status='withdrawn',resolved_at=? WHERE post_id=? AND status='open'").bind(timestamp, input.postId),
          db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) SELECT ?,id,?,'withdrawn',? FROM timber_shed_forum_appeals WHERE post_id=? AND status='withdrawn' AND resolved_at=?").bind(crypto.randomUUID(), uid, timestamp, input.postId, timestamp)
        ];
        const results2 = await db.batch(operations2);
        if (Number(results2[0]?.meta?.changes) !== 1 || Number(results2[1]?.meta?.changes) !== 1) return json2({ error: "withdrawal_conflict" }, 409);
        return json2({ ok: true, status: "withdrawn", message: "Your post is no longer visible and its text has been cleared." });
      }
      if (route === "report") {
        const post2 = await db.prepare(`SELECT p.id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND ${visiblePostSQL("p", uid)}`).bind(input.postId).first();
        if (!post2) return json2({ error: "post_unavailable" }, 404);
        const existing = await db.prepare("SELECT id FROM timber_shed_forum_reports WHERE post_id=? AND reporter_id=? AND status='open'").bind(input.postId, uid).first();
        if (existing) return json2({ ok: true, status: "reported" });
        await db.prepare("INSERT INTO timber_shed_forum_reports(id,post_id,reporter_id,reason,status,created_at) VALUES(?,?,?,?,'open',?)").bind(crypto.randomUUID(), input.postId, uid, input.reason, timestamp).run();
        return json2({ ok: true, status: "reported" });
      }
      if (!await isModerator2(db, uid)) return json2({ error: "moderator_only" }, 403);
      if (input.action === "dismiss") {
        const report = await db.prepare("SELECT id FROM timber_shed_forum_reports WHERE id=? AND post_id=? AND status='open'").bind(input.reportId, input.postId).first();
        if (!report) return json2({ error: "report_unavailable" }, 404);
        const operations2 = [
          db.prepare("UPDATE timber_shed_forum_reports SET status='closed' WHERE id=? AND post_id=? AND status='open'").bind(input.reportId, input.postId),
          db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_reports WHERE id=? AND status='closed')").bind(crypto.randomUUID(), input.postId, uid, "dismiss", timestamp, input.reportId)
        ];
        const results2 = await db.batch(operations2);
        if (Number(results2[0]?.meta?.changes) !== 1 || Number(results2[1]?.meta?.changes) !== 1) return json2({ error: "moderation_conflict" }, 409);
        return json2({ ok: true, status: "dismissed" });
      }
      const post = await db.prepare("SELECT p.user_id,p.status,p.parent_id,b.severity,b.policy_version FROM timber_shed_forum_posts p LEFT JOIN timber_shed_bouncer_screenings b ON b.post_id=p.id WHERE p.id=?").bind(input.postId).first();
      if (!post) return json2({ error: "post_unavailable" }, 404);
      if (input.action === "approve" && await activeForumRestriction(db, post.user_id, timestamp)) return json2({ error: "author_access_restricted" }, 409);
      if (post.user_id === uid) return json2({ error: "cannot_moderate_own_post" }, 403);
      if (input.action === "approve" && (post.policy_version !== (env.TIMBER_SHED_AI_MODERATION_ENABLED === "true" ? BOUNCER_VERSION + "+" + AI_MODERATION_POLICY : BOUNCER_VERSION) || post.severity === "high" || post.severity === "critical")) return json2({ error: "safeguarding_review_required" }, 409);
      if (input.action === "approve" && post.parent_id) {
        const parent = await db.prepare("SELECT id FROM timber_shed_forum_posts WHERE id=? AND status='approved'").bind(post.parent_id).first();
        if (!parent) return json2({ error: "parent_unavailable" }, 409);
      }
      if (input.action === "approve" && post.status !== "pending") return json2({ error: "not_pending" }, 409);
      if (input.action === "reject" && post.status !== "pending") return json2({ error: "not_pending" }, 409);
      if (input.action === "remove" && post.status !== "approved") return json2({ error: "not_approved" }, 409);
      const next = input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "removed";
      const operations = [
        db.prepare("UPDATE timber_shed_forum_posts SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status=? AND (?<>'approved' OR parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=timber_shed_forum_posts.parent_id AND parent.status='approved'))").bind(next, uid, timestamp, input.postId, post.status, next),
        db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_posts WHERE id=? AND status=? AND reviewed_by=? AND reviewed_at=?)").bind(crypto.randomUUID(), input.postId, uid, input.action, timestamp, input.postId, next, uid, timestamp)
      ];
      if (input.action === "remove") {
        operations.push(db.prepare("UPDATE timber_shed_forum_reports SET status='closed' WHERE post_id=? AND status='open'").bind(input.postId));
        operations.push(db.prepare("DELETE FROM timber_shed_forum_notifications WHERE post_id=? OR (thread_id=? AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=? AND p.parent_id IS NULL))").bind(input.postId, input.postId, input.postId));
      }
      operations.push(...notificationWrites(db, { postId: input.postId, action: input.action, moderatorId: uid, timestamp }));
      const results = await db.batch(operations);
      if (Number(results[0]?.meta?.changes) !== 1 || Number(results[1]?.meta?.changes) !== 1) return json2({ error: "moderation_conflict" }, 409);
      return json2({ ok: true, status: next });
    } catch {
      return json2({ error: "forum_unavailable" }, 503);
    }
  }, "forumRoutes");
}
__name(createTimberShedForumRoutes, "createTimberShedForumRoutes");
var timberShedForumRoutes = createTimberShedForumRoutes();

// member-experience/timber-shed-private.mjs
var HEADERS2 = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Robots-Tag": "noindex, nofollow, noarchive", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
var reply = /* @__PURE__ */ __name((body, status = 200) => Response.json(body, { status, headers: HEADERS2 }), "reply");
var ACTIVITY_IDS = new Set(Array.from({ length: 6 }, (_, week) => ["start", "midweek", "talk", "reflect"].map((day) => `w${week + 1}-${day}`)).flat());
var CHOICES = /* @__PURE__ */ new Set(["helped", "not-helped", "did-not-fit"]);
var blank = /* @__PURE__ */ __name(() => ({ enabled: false, revision: 0, activities: {} }), "blank");
function state(row) {
  if (!row) return blank();
  let parsed = {};
  try {
    parsed = JSON.parse(row.activities_json || "{}");
  } catch {
  }
  ;
  const activities = {};
  for (const [id3, entry] of Object.entries(parsed)) {
    if (ACTIVITY_IDS.has(id3) && entry && typeof entry === "object" && ["done", "not-done"].includes(entry.status)) {
      activities[id3] = { status: entry.status, ...CHOICES.has(entry.feedback) ? { feedback: entry.feedback } : {} };
    }
  }
  return { enabled: row.enabled === 1, revision: row.revision, activities: row.enabled === 1 ? activities : {} };
}
__name(state, "state");
function validate(input, current) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "invalid_request" };
  if (!Number.isSafeInteger(input.revision) || input.revision !== current.revision) return { error: "revision_conflict", status: 409 };
  const action = input.action;
  if (action === "enable" && Object.keys(input).every((k) => ["action", "revision"].includes(k))) return { next: { enabled: true, revision: current.revision + 1, activities: current.activities } };
  if (action === "disable" && Object.keys(input).every((k) => ["action", "revision"].includes(k))) return { next: { enabled: false, revision: current.revision + 1, activities: {} } };
  if (action === "activity" && current.enabled && Object.keys(input).every((k) => ["action", "revision", "activityId", "status", "feedback"].includes(k)) && ACTIVITY_IDS.has(input.activityId) && ["done", "not-done"].includes(input.status) && (input.feedback === void 0 || CHOICES.has(input.feedback))) {
    return { next: { enabled: true, revision: current.revision + 1, activities: { ...current.activities, [input.activityId]: { status: input.status, ...input.feedback ? { feedback: input.feedback } : {} } } } };
  }
  return { error: "invalid_action" };
}
__name(validate, "validate");
function createTimberShedPrivateRoutes(authenticate = authenticateMember) {
  return /* @__PURE__ */ __name(async function timberShedPrivateRoutes2(request, env) {
    if (new URL(request.url).pathname !== "/v1/timber-shed/private-progress") return null;
    if (env.TIMBER_SHED_PRIVATE_ENABLED !== "true") return reply({ error: "not_available" }, 404);
    if (!["GET", "POST"].includes(request.method)) return reply({ error: "method_not_allowed" }, 405);
    if (request.method === "POST") {
      const origin = request.headers.get("Origin");
      if (origin !== new URL(request.url).origin) return reply({ error: "same_origin_required" }, 403);
      if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return reply({ error: "json_required" }, 415);
    }
    const auth = await authenticate(request, env);
    if (auth.response) return auth.response;
    if (!Number.isSafeInteger(auth.userId) || auth.userId <= 0) return reply({ error: "authentication_required" }, 401);
    try {
      const db = env.DB;
      const row = await db.prepare("SELECT enabled, revision, activities_json FROM timber_shed_private_progress WHERE user_id=?").bind(auth.userId).first();
      const current = state(row);
      if (request.method === "GET") return reply({ ok: true, private: true, ...current });
      const raw = await request.text();
      if (raw.length > 512) return reply({ error: "request_too_large" }, 413);
      let input;
      try {
        input = JSON.parse(raw);
      } catch {
        return reply({ error: "invalid_json" }, 400);
      }
      const result = validate(input, current);
      if (result.error) return reply({ error: result.error }, result.status || 400);
      const next = result.next, now2 = (/* @__PURE__ */ new Date()).toISOString();
      if (row) {
        const update = await db.prepare("UPDATE timber_shed_private_progress SET enabled=?, revision=?, activities_json=?, updated_at=? WHERE user_id=? AND revision=?").bind(next.enabled ? 1 : 0, next.revision, JSON.stringify(next.activities), now2, auth.userId, current.revision).run();
        if (Number(update.meta?.changes) !== 1) return reply({ error: "revision_conflict" }, 409);
      } else {
        const insert = await db.prepare("INSERT OR IGNORE INTO timber_shed_private_progress(user_id,enabled,revision,activities_json,updated_at) VALUES(?,?,?,?,?)").bind(auth.userId, next.enabled ? 1 : 0, next.revision, JSON.stringify(next.activities), now2).run();
        if (Number(insert.meta?.changes) !== 1) return reply({ error: "revision_conflict" }, 409);
      }
      return reply({ ok: true, private: true, ...next });
    } catch (error) {
      return reply({ error: "temporarily_unavailable" }, 503);
    }
  }, "timberShedPrivateRoutes");
}
__name(createTimberShedPrivateRoutes, "createTimberShedPrivateRoutes");
var timberShedPrivateRoutes = createTimberShedPrivateRoutes();

// member-experience/timber-shed-member-test-entry.mjs
var headers2 = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Robots-Tag": "noindex, nofollow, noarchive", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
var assets = /* @__PURE__ */ new Set(["/assets/member-experience/timber-shed.mjs", "/assets/member-experience/timber-shed-forum.mjs"]);
var pages = /* @__PURE__ */ new Set(["/member/timber-shed", "/member/timber-shed/", "/member/timber-shed.html"]);
var closed = /* @__PURE__ */ __name((status = 404) => status === 401 ? Response.json({ error: "authentication_required" }, { status, headers: headers2 }) : new Response("Not available.", { status, headers: headers2 }), "closed");
var notice = '<aside role="note" style="background:#e7e3da;color:#050505;padding:16px;text-align:center;font:16px/1.5 sans-serif"><strong>PRIVATE TEST \xB7 TEST ACCOUNT ONLY</strong><br>Posts here are fictional test data, separate from My Timber. The community is not open to members.</aside>';
function createMemberTestWorker(authenticate = authenticateMember) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      let path = url.pathname;
      const publicHome = ["/timber-shed", "/timber-shed/"].includes(path);
      if (["/timber-shed", "/timber-shed/"].includes(path)) {
        url.pathname = "/member/timber-shed";
        request = new Request(url, request);
        path = url.pathname;
      }
      if (url.protocol !== "https:" || !["shiftsometimber.co.uk", "www.shiftsometimber.co.uk"].includes(url.hostname)) return closed();
      if (!pages.has(path) && !assets.has(path) && !path.startsWith("/v1/timber-shed/")) return closed();
      if (env.TIMBER_SHED_MEMBER_TEST_RELEASE !== "true" || !env.MEMBER_AUTH_DB || !env.SYNTHETIC_DB || env.MEMBER_AUTH_DB === env.SYNTHETIC_DB || env.TIMBER_SHED_TEST_MEMBER_ID !== "11245") return closed();
      if (publicHome || assets.has(path)) {
        const publicEnv = { ...env, TIMBER_SHED_PRIVATE_ENABLED: "true", MEMBER_EXPERIENCE_V1_ENABLED: "true", TIMBER_SHED_FORUM_ENABLED: "true", TIMBER_SHED_FORUM_PILOT_APPROVED: "true", TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED: "true", TIMBER_SHED_GOVERNANCE_APPROVED_VERSION: "shed-pilot-governance-2026-10-23-v2" };
        const response = await createTimberShedPresentationRoutes(async () => ({ userId: 1 }))(request, publicEnv);
        if (!response) return closed();
        if (publicHome && response.ok && request.method !== "HEAD") {
          const signIn = '<aside role="note" style="background:#e7e3da;color:#050505;padding:16px;text-align:center;font:16px/1.5 sans-serif">Private community \xB7 <a href="/member/dashboard" style="font-weight:700;color:#050505">Sign in to My Timber</a> to access conversations and posting.</aside>';
          const html = (await response.text()).replace(/<body([^>]*)>/i, "<body$1>" + signIn);
          const h = new Headers(response.headers);
          h.delete("Content-Length");
          return new Response(html, { status: response.status, headers: h });
        }
        return response;
      }
      let auth;
      try {
        auth = await authenticate(request, { DB: env.MEMBER_AUTH_DB });
      } catch {
        return closed(503);
      }
      if (auth.response) return closed(401);
      if (auth.userId !== 11245 || String(auth.user?.email || "").toLowerCase() !== "shiftsometimber@gmail.com") return closed();
      const fictionalAuth = /* @__PURE__ */ __name(async () => ({ userId: 1 }), "fictionalAuth");
      const testEnv = {
        ...env,
        DB: env.SYNTHETIC_DB,
        TIMBER_SHED_PRIVATE_ENABLED: "true",
        MEMBER_EXPERIENCE_V1_ENABLED: "true",
        TIMBER_SHED_FORUM_ENABLED: "true",
        TIMBER_SHED_FORUM_PILOT_APPROVED: "true",
        TIMBER_SHED_RETENTION_ENABLED: "true",
        TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED: "true",
        TIMBER_SHED_GOVERNANCE_APPROVED_VERSION: "shed-pilot-governance-2026-10-23-v2",
        TIMBER_SHED_AI_MODERATION_ENABLED: "false",
        TIMBER_SHED_AI_PROVIDER_APPROVED: "false",
        TIMBER_SHED_EMAIL_DELIVERY_ENABLED: "false"
      };
      try {
        let response = await createTimberShedPresentationRoutes(fictionalAuth)(request, testEnv) || await createTimberShedForumRoutes(fictionalAuth)(request, testEnv) || await createTimberShedPrivateRoutes(fictionalAuth)(request, testEnv) || closed();
        if (pages.has(path) && response.ok && request.method !== "HEAD") {
          const body = (await response.text()).replace(/<body([^>]*)>/i, "<body$1>" + notice);
          const nextHeaders = new Headers(response.headers);
          nextHeaders.delete("Content-Length");
          response = new Response(body, { status: response.status, headers: nextHeaders });
        }
        const finalHeaders = new Headers(response.headers);
        for (const [k, v] of Object.entries(headers2)) finalHeaders.set(k, v);
        return new Response(response.body, { status: response.status, headers: finalHeaders });
      } catch {
        return closed(503);
      }
    }
  };
}
__name(createMemberTestWorker, "createMemberTestWorker");
var timber_shed_member_test_entry_default = createMemberTestWorker();
export {
  createMemberTestWorker,
  timber_shed_member_test_entry_default as default
};
//# sourceMappingURL=timber-shed-member-test-entry.js.map
