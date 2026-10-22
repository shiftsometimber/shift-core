// SHIFT Timber Shed notification email drafts. NO delivery or network calls.
// Owner-approved mailbox identity, but no template, recipients or automatic
// sending are approved. Do not wire to the live mail provider until signed off.
export const TIMBER_SHED_EMAIL_ADDRESS='timbershed@shiftsometimber.co.uk';
export const TIMBER_SHED_EMAIL_FROM_NAME='The Timber Shed';
export const TIMBER_SHED_EMAIL_TEMPLATE_VERSION='timber-shed-mail-v1-draft-20261022';
export const TIMBER_SHED_EMAIL_DELIVERY_ENABLED=false;
export const TIMBER_SHED_COMMUNITY_LINK='https://shiftsometimber.co.uk/member/timber-shed';

const MEMBER_EVENTS=Object.freeze({
 approved:{
  subject:'The Timber Shed — your post is approved',
  text:'Your post has been approved and is now visible to eligible members of The Timber Shed.\n\nSign in to view your discussion: '+TIMBER_SHED_COMMUNITY_LINK+'\n\nIf you have a question about this decision, you can reply to this email. Please do not include private medical details.\n\nThe Timber Shed is a peer-support community, not an emergency or clinical service.'
 },
 rejected:{
  subject:'The Timber Shed — update on your post',
  text:'Your post has not been approved for publication. You can review your submission in My Posts after signing in.\n\nSign in: '+TIMBER_SHED_COMMUNITY_LINK+'\n\nIf you think this decision needs reviewing, reply to this email. Please do not include private medical details.\n\nThe Timber Shed is a peer-support community, not an emergency or clinical service.'
 },
 removed:{
  subject:'The Timber Shed — update on your discussion',
  text:'A post you submitted has been removed from The Timber Shed. You can sign in to see the current status in My Posts.\n\nSign in: '+TIMBER_SHED_COMMUNITY_LINK+'\n\nIf you would like this decision reviewed, reply to this email. Please do not include private medical details.\n\nThe Timber Shed is a peer-support community, not an emergency or clinical service.'
 },
 reply:{
  subject:'The Timber Shed — someone replied to your discussion',
  text:'Someone has replied to a discussion you started. The reply has passed community moderation.\n\nSign in to read it: '+TIMBER_SHED_COMMUNITY_LINK+'\n\nPlease do not reply with private medical details. The Timber Shed is not an emergency or clinical service.'
 }
});
const MODERATOR_EVENTS=Object.freeze({
 pending:{
  subject:'The Timber Shed — a post needs moderation',
  text:'A new community submission is awaiting review.\n\nSign in to the restricted moderator queue: '+TIMBER_SHED_COMMUNITY_LINK+'\n\nThe email does not contain the post text or member health information. Review the item in the authenticated queue. This mailbox is not an emergency response service.'
 },
 report:{
  subject:'The Timber Shed — a reported item needs review',
  text:'A member report is awaiting moderator review.\n\nSign in to the restricted moderator queue: '+TIMBER_SHED_COMMUNITY_LINK+'\n\nThe email does not contain the reported post or member health information. Follow the approved safeguarding escalation procedure where appropriate.'
 },
 priority:{
  subject:'The Timber Shed — priority moderator review',
  text:'A community item requires priority review.\n\nSign in to the restricted moderator queue: '+TIMBER_SHED_COMMUNITY_LINK+'\n\nNo sensitive post text or member identity is included in this email. Do not rely on email as a real-time emergency or safeguarding response.'
 }
});
const safeRecipient=s=>typeof s==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)&&s.length<=254;
function draft(to,template,event,kind){
 return Object.freeze({
  state:'DRAFT_ONLY_NOT_APPROVED',
  version:TIMBER_SHED_EMAIL_TEMPLATE_VERSION,
  event,kind,
  from:Object.freeze({email:TIMBER_SHED_EMAIL_ADDRESS,name:TIMBER_SHED_EMAIL_FROM_NAME}),
  to:Object.freeze([to]),
  cc:Object.freeze([]),
  bcc:Object.freeze([]),
  replyTo:TIMBER_SHED_EMAIL_ADDRESS,
  subject:template.subject,
  text:template.text,
  attachments:Object.freeze([])
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
