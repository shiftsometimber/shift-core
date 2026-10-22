// Optional forum pilot UI. The server still enforces feature flags, adult eligibility and moderation.
export const timberShedForumPilotMarkup=`<section class="section" id="shedForumPilot">
<div class="eyebrow">THE TIMBER SHED / PRIVATE FORUM PILOT</div><h2>Pull up a chair.</h2>
<p class="lead">Six rooms, one community. Choose a separate display name before joining. Your My Timber account information is never shown here.</p>
<div class="privacy"><strong>Only words you deliberately submit can enter a forum.</strong><p>Nothing is published immediately. Every new discussion and reply waits for a trained moderator. Do not include your real name, contact details, medical records or anything you would not want other members to read.</p></div>
<div class="shed-pilot-grid"><div>
<form id="shedAliasForm" class="shed-form"><h3>Your community name</h3><label for="shedAlias">Choose a display name (not your real name)</label><input id="shedAlias" name="displayName" minlength="3" maxlength="24" autocomplete="off" required placeholder="e.g. Weekend Walker"><button class="btn" type="submit">Use this display name</button><p id="shedAliasStatus" role="status"></p></form>
<div class="shed-forum-picker"><label for="shedRoom">Discussion room</label><select id="shedRoom"></select></div>
<div id="shedTopics" aria-live="polite"></div></div>
<div><form id="shedCompose" class="shed-form" hidden><h3 id="shedComposeHeading">Start a conversation</h3><p>Keep it respectful and avoid identifying or sensitive details.</p><label for="shedTitle">Discussion title</label><input id="shedTitle" maxlength="100" minlength="8" required><label for="shedBody">What would you like to share?</label><textarea id="shedBody" rows="6" maxlength="1000" minlength="12" required></textarea><button class="btn" type="submit">Submit for moderation</button><button class="btn secondary" type="button" id="shedCancelReply" hidden>Cancel reply</button><p id="shedComposeStatus" role="status"></p></form>
<section id="shedMyPosts" class="shed-form" hidden><h3>Your submissions</h3><p>Pending submissions are private. You can withdraw your own post; its stored text is cleared and it will no longer appear in the community.</p><div id="shedMyPostItems"></div></section><section id="shedModeratorPanel" class="shed-form" hidden><div class="shed-bouncer-brand"><span aria-hidden="true">⬡</span><div><span class="eyebrow">SHIFT COMMUNITY BOUNCER</span><h3>Everyone’s welcome. Hassle isn’t.</h3></div></div><p>Automated rule-based safety screening prioritises the private queue. It is not clinical assessment or a substitute for trained human moderation. Every post requires human approval. High-risk posts cannot be approved in this pilot.</p><div id="shedQueue"></div><div id="shedReports"></div></section></div></div>
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
@media(max-width:800px){#shedForumPilot .shed-pilot-grid{grid-template-columns:1fr}}
`;
export const timberShedForumPilotClient=String.raw`(()=>{'use strict';
const by=id=>document.getElementById(id),status=by('shedForumStatus'),aliasForm=by('shedAliasForm'),alias=by('shedAlias'),compose=by('shedCompose'),room=by('shedRoom'),topics=by('shedTopics'),mod=by('shedModeratorPanel');
if(!status)return;
let currentRoom='main-shed',parentId=null,hasAlias=false,rooms=[];
const text=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=String(value??'');if(cls)el.className=cls;return el};
const say=(id,message)=>{by(id).textContent=message};
async function api(path,body){
 const opts={credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
 if(body!==undefined){opts.method='POST';opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}
 const res=await fetch('/v1/timber-shed/forum/'+path,opts);const data=await res.json();
 if(!res.ok)throw Error(data.error==='adult_verified_members_only'?'The pilot requires a verified adult My Timber account.':data.error==='authentication_required'?'Sign in to My Timber first.':data.error==='forum_unavailable'?'The forum is temporarily unavailable.':data.error||'Unable to complete that action.');
 return data;
}
function button(label,callback){const el=text('button',label);el.type='button';el.addEventListener('click',callback);return el}
function postView(post,reply=false){
 const card=document.createElement('article');card.className='shed-topic-live'+(reply?' reply':'');
 if(post.title)card.append(text('h3',post.title));
 card.append(text('div',post.display_name+' · '+new Date(post.created_at).toLocaleDateString('en-GB'),'meta'));
 card.append(text('p',post.body));
 if(!reply)card.append(button('Reply',()=>{parentId=post.id;by('shedTitle').required=false;by('shedTitle').hidden=true;by('shedTitle').previousElementSibling.hidden=true;by('shedComposeHeading').textContent='Reply to '+post.title;by('shedCancelReply').hidden=false;by('shedBody').focus()}));
 const reasonSelect=document.createElement('select');reasonSelect.setAttribute('aria-label','Reason for reporting this post');
 for(const [value,label] of [['','Select a reporting reason'],['privacy','Privacy concern'],['unsafe-health-advice','Unsafe health advice'],['harassment','Harassment'],['self-harm-risk','Safety concern'],['spam','Spam'],['other','Other']]){const option=document.createElement('option');option.value=value;option.textContent=label;reasonSelect.append(option)}
 card.append(reasonSelect,button('Report',async()=>{if(!reasonSelect.value){say('shedForumStatus','Choose a reporting reason first.');return}try{await api('report',{postId:post.id,reason:reasonSelect.value});say('shedForumStatus','Report received for moderator review.')}catch(e){say('shedForumStatus',e.message)}}));
 return card;
}
async function refresh(){
 const data=await api('threads?room='+encodeURIComponent(currentRoom));
 topics.replaceChildren();
 if(!data.posts.length)topics.append(text('p','No approved conversations yet. New posts remain private until reviewed.'));
 const roots=data.posts.filter(p=>!p.parent_id);
 for(const post of roots){topics.append(postView(post));for(const reply of data.posts.filter(p=>p.parent_id===post.id).reverse())topics.append(postView(reply,true))}
}
async function myPosts(){
 const data=await api('mine');const panel=by('shedMyPosts'),items=by('shedMyPostItems');
 panel.hidden=false;items.replaceChildren();
 if(!data.posts.length)items.append(text('p','You have not submitted anything yet.'));
 for(const post of data.posts){
  const card=document.createElement('div');card.className='shed-mod-item';
  card.append(text('strong',(post.title||'Reply')+' · '+post.status));
  if(post.status!=='withdrawn')card.append(text('p',post.body));
  if(['pending','approved','rejected'].includes(post.status))card.append(button('Withdraw my post',async()=>{try{await api('withdraw',{postId:post.id});await myPosts();await refresh();say('shedForumStatus','Your post has been withdrawn and its text cleared.')}catch(e){say('shedForumStatus',e.message)}}));
  items.append(card);
 }
}
function modItem(item,reported=false){
 const card=document.createElement('div');card.className='shed-mod-item';
 card.append(text('strong',reported?'Reported: '+item.reason:item.title||'Reply'));
 if(!reported){const risk=text('div','BOUNCER · '+String(item.severity||'unreviewed').toUpperCase()+' · '+(item.categories||[]).join(', '),'shed-bouncer-risk '+(item.severity||'unreviewed'));card.append(risk)}
 card.append(text('p',item.body));
 if(!reported&&['high','critical','unreviewed'].includes(item.severity))card.append(text('p','Safeguarding hold: ordinary approval is disabled. Specialist-informed review is required.','shed-bouncer-risk high'));
 const actions=reported?['remove','dismiss']:['approve','reject'];
 for(const action of actions){if(!reported&&action==='approve'&&['high','critical','unreviewed'].includes(item.severity))continue;card.append(button(action,async()=>{try{const payload={postId:reported?item.post_id:item.id,action};if(reported&&action==='dismiss')payload.reportId=item.id;await api('moderate',payload);await moderation();await refresh()}catch(e){say('shedForumStatus',e.message)}}))}
 return card;
}
async function moderation(){
 try{const data=await api('moderation');mod.hidden=false;const q=by('shedQueue'),r=by('shedReports');q.replaceChildren(text('h4','Pending review ('+data.pending.length+')'));r.replaceChildren(text('h4','Reports ('+data.reports.length+')'));for(const item of data.pending)q.append(modItem(item));for(const item of data.reports)r.append(modItem(item,true))}
 catch(e){if(e.message==='moderator_only')mod.hidden=true;else say('shedForumStatus',e.message)}
}
function cancelReply(){parentId=null;by('shedTitle').hidden=false;by('shedTitle').required=true;by('shedTitle').previousElementSibling.hidden=false;by('shedComposeHeading').textContent='Start a conversation';by('shedCancelReply').hidden=true}
by('shedCancelReply').addEventListener('click',cancelReply);
room.addEventListener('change',()=>{currentRoom=room.value;cancelReply();refresh().catch(e=>say('shedForumStatus',e.message))});
aliasForm.addEventListener('submit',async event=>{event.preventDefault();try{const data=await api('profile/save',{displayName:alias.value.trim()});hasAlias=true;aliasForm.hidden=true;compose.hidden=false;say('shedForumStatus','Community name saved. Your My Timber personal details remain private.')}catch(e){say('shedAliasStatus',e.message)}});
compose.addEventListener('submit',async event=>{event.preventDefault();if(!hasAlias)return;const payload={roomId:currentRoom,body:by('shedBody').value.trim()};if(parentId)payload.parentId=parentId;else payload.title=by('shedTitle').value.trim();try{const result=await api('submit',payload);say('shedComposeStatus',result.message);compose.reset();cancelReply();await moderation();await myPosts()}catch(e){say('shedComposeStatus',e.message)}});
(async()=>{try{
 const result=await Promise.all([api('rooms'),api('profile')]);rooms=result[0].rooms;
 for(const item of rooms){const opt=document.createElement('option');opt.value=item.id;opt.textContent=item.name;room.append(opt)}
 currentRoom=room.value||currentRoom;
 hasAlias=!!result[1].profile;aliasForm.hidden=hasAlias;compose.hidden=!hasAlias;
 if(hasAlias)say('shedForumStatus','Signed in as '+result[1].profile.displayName+'. Your My Timber records are not shared.');
 else say('shedForumStatus','Choose a separate community name to take part. Nothing is published without moderator approval.');
 await refresh();await myPosts();await moderation();
}catch(e){say('shedForumStatus',e.message)}})();
})();`;
