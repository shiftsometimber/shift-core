import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 TIMBER_SHED_EMAIL_ADDRESS,TIMBER_SHED_EMAIL_DELIVERY_ENABLED,
 TIMBER_SHED_EMAIL_TEMPLATE_VERSION,memberNotificationEmailDraft,moderatorNotificationEmailDraft
} from '../member-experience/timber-shed-email-drafts.mjs';

test('Timber Shed mailbox identity is shared by member sender and moderator recipient',()=>{
 assert.equal(TIMBER_SHED_EMAIL_ADDRESS,'timbershed@shiftsometimber.co.uk');
 assert.equal(TIMBER_SHED_EMAIL_DELIVERY_ENABLED,false);
 assert.match(TIMBER_SHED_EMAIL_TEMPLATE_VERSION,/draft/);
 for(const kind of ['approved','rejected','removed','reply']){
  const item=memberNotificationEmailDraft(kind,'fictional@example.test');
  assert.equal(item.from.email,TIMBER_SHED_EMAIL_ADDRESS);
  assert.deepEqual(item.to,['fictional@example.test']);
  assert.equal(item.replyTo,TIMBER_SHED_EMAIL_ADDRESS);
  assert.deepEqual(item.cc,[]);assert.deepEqual(item.bcc,[]);assert.deepEqual(item.attachments,[]);
  assert.equal(item.state,'DRAFT_ONLY_NOT_APPROVED');
 }
 for(const kind of ['pending','report','priority']){
  const item=moderatorNotificationEmailDraft(kind);
  assert.equal(item.from.email,TIMBER_SHED_EMAIL_ADDRESS);
  assert.deepEqual(item.to,[TIMBER_SHED_EMAIL_ADDRESS]);
  assert.deepEqual(item.cc,[]);assert.deepEqual(item.bcc,[]);assert.deepEqual(item.attachments,[]);
  assert.equal(item.state,'DRAFT_ONLY_NOT_APPROVED');
 }
});
test('no sensitive forum text or identity can enter templated mail',()=>{
 const member=memberNotificationEmailDraft('reply','fictional@example.test');
 const mod=moderatorNotificationEmailDraft('priority');
 for(const item of [member,mod]){
  assert(!JSON.stringify(item).includes('member_health_data'));
  assert(!JSON.stringify(item).includes('member_post_text'));
  assert(!JSON.stringify(item).includes('user_id'));
  assert.match(item.text,/https:\/\/shiftsometimber.co.uk\/member\/timber-shed/);
  assert.match(item.text,/emergency/i);
 }
});
test('email draft helpers never call a mail provider, network or mailbox mutation',()=>{
 const source=readFileSync(new URL('../member-experience/timber-shed-email-drafts.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/fetch\(|\.send\(|EMAIL\.send|SMTP|resend\.com|outlook\.send/);
 assert.throws(()=>memberNotificationEmailDraft('approved','not an email'),/invalid_member_email_draft/);
 assert.throws(()=>memberNotificationEmailDraft('not-an-event','fictional@example.test'),/invalid_member_email_draft/);
 assert.throws(()=>moderatorNotificationEmailDraft('not-an-event'),/invalid_moderator_email_draft/);
});
test('reply alerts require an explicit member opt-in; moderation decisions remain service drafts',()=>{
 for(const kind of ['approved','rejected','removed']){
  assert.equal(memberNotificationEmailDraft(kind,'fictional@example.test').deliveryPreference,'service');
 }
 assert.equal(memberNotificationEmailDraft('reply','fictional@example.test').deliveryPreference,'opt-in');
 for(const kind of ['pending','report','priority']){
  assert.equal(moderatorNotificationEmailDraft(kind).deliveryPreference,'on-duty-staff-only');
 }
});
test('every draft has complete plain-text body and no actual customer or clinical content',()=>{
 const all=[
  ...['approved','rejected','removed','reply'].map(k=>memberNotificationEmailDraft(k,'fictional@example.test')),
  ...['pending','report','priority'].map(moderatorNotificationEmailDraft)
 ];
 assert.equal(all.length,7);
 for(const item of all){
  assert.equal(item.state,'DRAFT_ONLY_NOT_APPROVED');
  assert.match(item.version,/v2-draft/);
  assert(item.subject.startsWith('The Timber Shed'));
  assert(item.text.length>150);
  assert.match(item.text,/Everyone’s welcome\. Hassle isn’t\./);
  assert.match(item.text,/not monitored continuously/i);
  assert.deepEqual(item.attachments,[]);
  assert.deepEqual(item.cc,[]);
  assert.deepEqual(item.bcc,[]);
  assert(!item.text.includes('fictional@example.test'));
 }
});
