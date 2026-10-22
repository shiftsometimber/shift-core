// SHIFT Timber Shed notification email templates — PRIVATE DRAFTS ONLY.
// No delivery, scheduling, provider integration or permission to send.
export const TIMBER_SHED_EMAIL_ADDRESS='timbershed@shiftsometimber.co.uk';
export const TIMBER_SHED_EMAIL_FROM_NAME='The Timber Shed';
export const TIMBER_SHED_EMAIL_TEMPLATE_VERSION='timber-shed-mail-v2-draft-20261022';
export const TIMBER_SHED_EMAIL_DELIVERY_ENABLED=false;
export const TIMBER_SHED_COMMUNITY_LINK='https://shiftsometimber.co.uk/member/timber-shed';

const signoff='\n\nThe Timber Shed\nEveryone’s welcome. Hassle isn’t.\n\nThe Timber Shed is a peer-support community, not a medical, clinical or emergency service. This mailbox is not monitored continuously. If someone is in immediate danger, call 999.';
const signIn='\n\nSign in to The Timber Shed: '+TIMBER_SHED_COMMUNITY_LINK;
const replyNote='\n\nQuestions about this decision? You can reply to this email. Please do not include medical records or other sensitive personal information.';

const MEMBER_EVENTS=Object.freeze({
 approved:{
  subject:'The Timber Shed — your post has been approved',
  text:'Your post has been approved and is now visible to members in its discussion room.'+signIn+replyNote+signoff,
  deliveryPreference:'service'
 },
 rejected:{
  subject:'The Timber Shed — an update on your post',
  text:'Your post has not been approved for publication. It remains private. You can see its status in My Posts after signing in.'+signIn+replyNote+signoff,
  deliveryPreference:'service'
 },
 removed:{
  subject:'The Timber Shed — an update on your discussion',
  text:'A post you submitted has been removed from the community. You can review its status in My Posts after signing in.'+signIn+replyNote+signoff,
  deliveryPreference:'service'
 },
 reply:{
  subject:'The Timber Shed — someone has replied',
  text:'Someone has replied to a discussion you started. Their reply has been approved by a community moderator.'+signIn+'\n\nYou can manage community email preferences in your account once this feature is available. Please do not reply with private medical information.'+signoff,
  deliveryPreference:'opt-in'
 }
});
const MODERATOR_EVENTS=Object.freeze({
 pending:{
  subject:'The Timber Shed — new post awaiting review',
  text:'A community post is waiting in the private moderator queue.'+signIn+'\n\nOpen the restricted queue to review it. No member identity, post text or health details are included in this email. This alert is not an emergency response.'+signoff,
  deliveryPreference:'on-duty-staff-only'
 },
 report:{
  subject:'The Timber Shed — member report awaiting review',
  text:'A community report is waiting in the private moderator queue.'+signIn+'\n\nOpen the restricted queue to review it and follow the agreed escalation procedure if necessary. No member identity, post text or health details are included in this email.'+signoff,
  deliveryPreference:'on-duty-staff-only'
 },
 priority:{
  subject:'The Timber Shed — priority moderation review',
  text:'An item in The Timber Shed has been placed in the priority moderation queue.'+signIn+'\n\nAn authorised, trained moderator must assess it using the agreed safeguarding procedure. No member identity, post text or health details are included in this email. Email is not a reliable emergency-alert channel.'+signoff,
  deliveryPreference:'on-duty-staff-only'
 }
});
const safeRecipient=s=>typeof s==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)&&s.length<=254;
function draft(to,template,event,kind){
 return Object.freeze({
  state:'DRAFT_ONLY_NOT_APPROVED',
  version:TIMBER_SHED_EMAIL_TEMPLATE_VERSION,
  event,kind,deliveryPreference:template.deliveryPreference,
  from:Object.freeze({email:TIMBER_SHED_EMAIL_ADDRESS,name:TIMBER_SHED_EMAIL_FROM_NAME}),
  to:Object.freeze([to]),cc:Object.freeze([]),bcc:Object.freeze([]),
  replyTo:TIMBER_SHED_EMAIL_ADDRESS,
  subject:template.subject,text:template.text,attachments:Object.freeze([])
 });
}
export function memberNotificationEmailDraft(kind,recipientEmail){
 if(!Object.hasOwn(MEMBER_EVENTS,kind)||!safeRecipient(recipientEmail))throw Error('invalid_member_email_draft');
 return draft(recipientEmail,MEMBER_EVENTS[kind],kind,'member');
}
export function moderatorNotificationEmailDraft(kind){
 if(!Object.hasOwn(MODERATOR_EVENTS,kind))throw Error('invalid_moderator_email_draft');
 return draft(TIMBER_SHED_EMAIL_ADDRESS,MODERATOR_EVENTS[kind],kind,'moderator');
}
