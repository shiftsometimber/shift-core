// Private-pilot governance. Exact policy adoption is required before member access.
export const SHED_POLICY_VERSION='shed-pilot-governance-2026-10-23-v1';
export const SHED_POLICY=Object.freeze({
 version:SHED_POLICY_VERSION,
 controller:'Shift Some Timber Ltd',
 rules:[
 'An adult peer community, without diagnosis, prescriptions, personalised treatment or emergency care.',
 'Use a separate community name. Do not share identifying details or another person’s personal or health information.',
 'No medication trading, unsafe treatment instructions, harassment, hate, threats, exploitation or scams.',
 'Every post and reply waits for human review. Bouncer screens and flags concerns; it does not publish or ban.',
 'Reports, blocking and independent human appeals are available. The community is not monitored continuously.'
 ],
 privacy:[
 'Joining the Shed is optional and does not affect your My Timber account or treatment access.',
 'We link your account ID to your community name, chosen posts, reports, moderation decisions, appeals and in-app notices. My Timber health records are not imported.',
 'Only approved posts are shown to authorised community members. Moderators can review withheld posts and reports. Do not post information about another person.',
 'There are no direct messages or automatic emails. Bouncer uses automated rules and human review; this pilot does not send posts to an external AI provider.',
 'You can export your information and withdraw your participation using Leave the community. Your active community name, consent and post text are cleared; limited moderation/access records remain under the retention policy. Screenshots cannot be recalled.',
 'Pending posts expire after 7 days; rejected/removed content after 30 days, or up to 90 days while an appeal is open. Approved content is retained for at most 365 days. Notifications expire after 30 days. Closed moderation/appeal records expire after 365 days. Active bans remain while necessary, with review at least every 90 days.',
 'Expired content is cleared from the active community under these periods. Database recovery backups may retain previous versions for up to 30 days. Deleted information must remain unavailable after any restoration, and recovery must reapply recorded erasures before member access resumes.',
 'Contact timbershed@shiftsometimber.co.uk to exercise privacy rights or complain. You can also raise a data-protection concern with the Information Commissioner’s Office.'
 ],
 healthConsent:'I explicitly consent to SHIFT processing the health information I choose to share in my Shed submissions for private moderation and, only if approved, sharing with authorised community members. I can withdraw by leaving the community. This does not consent to external AI processing, marketing or use of my My Timber health records.'
});
export const SHED_ROUTINE_POLICY_VERSION='shed-pilot-governance-2026-10-23-v2';
const ROUTINE_POLICY=Object.freeze({...SHED_POLICY,version:SHED_ROUTINE_POLICY_VERSION,
 rules:SHED_POLICY.rules.map(s=>s.startsWith('Every post and reply')?'Bouncer can publish narrowly recognised everyday messages automatically. Unrecognised, uncertain or sensitive submissions wait for a human. Reports, removals, bans and appeals remain human decisions.':s),
 privacy:SHED_POLICY.privacy.map(s=>s.startsWith('Only approved posts')?'Published posts are shown to authorised community members. Recognised everyday messages may be approved automatically using local rules. Unrecognised or flagged text stays private for human review; moderators can review it and reports. Do not post information about another person.':s),
 healthConsent:SHED_POLICY.healthConsent.replace('private moderation and, only if approved, sharing','automated screening and human moderation where needed and, only if approved, sharing')
});
export function forumPolicy(env={}){return env.TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED==='true'||env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION===SHED_ROUTINE_POLICY_VERSION?ROUTINE_POLICY:SHED_POLICY}
export function governanceApproved(env){return env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION===forumPolicy(env).version}
export function routinePublicationEnabled(env){return env.TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED==='true'&&governanceApproved(env)}
export async function forumParticipation(db,uid,timestamp,env={}){
 const policy=forumPolicy(env);
 const adult=await db.prepare('SELECT verified_at,expires_at FROM timber_shed_adult_access WHERE user_id=? AND revoked_at IS NULL AND verified_at<=? AND expires_at>? AND (SELECT count(*) FROM timber_shed_adult_access a WHERE a.revoked_at IS NULL AND a.verified_at<=? AND a.expires_at>?)<=10').bind(uid,timestamp,timestamp,timestamp,timestamp).first();
 const heartbeat=await db.prepare('SELECT completed_at FROM timber_shed_maintenance WHERE id=1').bind().first();
 const age=Date.parse(timestamp)-Date.parse(heartbeat?.completed_at||'');
 const maintenanceReady=Number.isFinite(age)&&age>=0&&age<=2*3600000;
 const consent=await db.prepare('SELECT rules_version,privacy_version,disclosure_consent_at,accepted_at FROM timber_shed_participation WHERE user_id=?').bind(uid).first();
 const joined=!!(consent&&consent.rules_version===policy.version&&consent.privacy_version===policy.version);
 return {maintenanceReady,adultAccess:!!adult,joined,healthConsent:joined&&!!consent?.disclosure_consent_at,disclosureConsentRecorded:!!consent?.disclosure_consent_at,acceptedAt:consent?.accepted_at||null,policy,routineAutoPublish:routinePublicationEnabled(env)};
}
export function validParticipation(input,env={}){
 return input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).length===4&&
 Object.keys(input).every(k=>['version','rulesAccepted','privacyAcknowledged','healthConsent'].includes(k))&&
 input.version===forumPolicy(env).version&&input.rulesAccepted===true&&input.privacyAcknowledged===true&&typeof input.healthConsent==='boolean';
}
export async function saveForumParticipation(db,uid,input,timestamp,env={}){
 const version=forumPolicy(env).version;
 await db.prepare('INSERT INTO timber_shed_participation(user_id,rules_version,privacy_version,disclosure_consent_at,accepted_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET rules_version=excluded.rules_version,privacy_version=excluded.privacy_version,disclosure_consent_at=excluded.disclosure_consent_at,accepted_at=excluded.accepted_at').bind(uid,version,version,input.healthConsent?timestamp:null,timestamp).run();
}
