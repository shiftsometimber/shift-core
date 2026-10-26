// Optional forum pilot UI. The server still enforces feature flags, adult eligibility and moderation.
export const timberShedForumPilotMarkup=`<section class="section" id="shedForumPilot">
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
<section id="shedMyPosts" class="shed-form" hidden><h3 tabindex="-1">Your submissions</h3><p>Pending submissions are private. You can appeal a rejection or removal for independent human review. Your post stays hidden during an appeal. You can withdraw your own post; its stored text is cleared and it will no longer appear in the community.</p><div id="shedMyPostItems"></div></section><section id="shedModeratorPanel" class="shed-form" aria-label="Moderator queue" hidden><h3 tabindex="-1">Moderator queue</h3><div class="shed-bouncer-brand"><span aria-hidden="true">⬡</span><div><span class="eyebrow">SHIFT COMMUNITY BOUNCER</span><h3>Everyone’s welcome. Hassle isn’t.</h3></div></div><p>Automated rule-based safety screening prioritises the private queue. It is not clinical assessment or a substitute for trained human moderation. Every post requires human approval. High-risk posts cannot be approved in this pilot.</p><div id="shedQueue"></div><div id="shedReports"></div><div id="shedAppeals"></div><div id="shedRestrictions"></div><div id="shedRestrictionAppeals"></div></section>
<section id="shedSafetyView" aria-label="Community settings" hidden><h3 tabindex="-1">Community settings</h3><p>Blocking hides your posts from each other. Moderators can still review reports. Community restrictions do not change your private My Timber account.</p><div id="shedAccessStatus"></div><div id="shedBlocks"></div><button type="button" id="shedExport" class="shed-subtle-btn">Download my community data</button><details><summary>Leave the community</summary><p>This clears your community name and post text, closes post appeals and removes your alerts. Minimal moderation records and any access restriction remain. Backup erasure and legal retention require a separate privacy request. Your My Timber account stays open.</p><label><input type="checkbox" id="shedLeaveConfirm"> I want to clear my community participation</label><button type="button" id="shedLeave" class="shed-subtle-btn">Leave and clear my posts</button></details></section>
<section id="shedNotificationsView" aria-label="Your notifications" hidden><h3 tabindex="-1">Your notifications</h3><p>Private in-app alerts only. No emails, text messages or push notifications are sent.</p><button type="button" id="shedRefreshNotifications" class="shed-subtle-btn">Refresh notifications</button><div id="shedNotificationItems" aria-live="polite"></div></section>
</div>
<div><form id="shedCompose" class="shed-form" hidden><h3 id="shedComposeHeading">Start a conversation</h3><p>Posting in <strong id="shedComposeRoom">The Main Shed</strong> <button type="button" id="shedChangeRoom" class="shed-subtle-btn">Change room</button></p><p>Keep it respectful and avoid identifying or sensitive details.</p><label for="shedTitle">Discussion title</label><input id="shedTitle" maxlength="100" minlength="8" required><label for="shedBody">What would you like to share?</label><textarea id="shedBody" rows="6" maxlength="1000" minlength="12" required></textarea><button class="btn" type="submit">Submit for moderation</button><button class="btn secondary" type="button" id="shedCancelReply" hidden>Cancel reply</button><p id="shedComposeStatus" role="status"></p></form>
</div></div>
<p id="shedForumStatus" role="status" aria-live="polite">Checking your My Timber session…</p><p class="shed-bouncer-footnote"><strong>Protected by SHIFT Community Bouncer.</strong> Automated safety checks help moderators spot concerns. No automated check can guarantee safety, and the community is not an emergency service.</p>
</section>`;
export const timberShedForumPilotCSS=`
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
export const timberShedForumPilotClient=String.raw`(()=>{'use strict';
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
