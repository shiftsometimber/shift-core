import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';
import {grantShedPilotAccess} from './shed-pilot-access.mjs';
import {createTimberShedForumRoutes,validateForumInput} from './timber-shed-forum-routes.mjs';
import {forumParticipation,saveForumParticipation,SHED_MEMBER_SUPPORT_POLICY as SHED_POLICY} from './timber-shed-governance.mjs';
import {screenForumText} from './timber-shed-community-bouncer.mjs';
import {activeForumRestriction,visiblePostSQL} from './timber-shed-forum-protection.mjs';
import {allOffers} from './support-records.mjs';
import {runTimberShedRetention} from './timber-shed-retention.mjs';

const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const fail=(text,status=400)=>{throw Object.assign(Error(text),{status});};
const testEmails=new Set(['my-timber-v6-dan@example.invalid','my-timber-v6-lee@example.invalid','my-timber-v6-moderator@example.invalid','my-timber-v6-review@example.invalid']);
const categories=new Set(['meal','movement','routine']);
const situations=new Set(['late','budget','energy','routine','movement','after-treatment','returning','general']);
// This limits eligibility for a practical tip. Ordinary peer conversations still
// use the existing, broader forum rules and never become treatment advice.
export const unsafeStep=/\b(?:mounjaro|wegovy|ozempic|tirzepatide|semaglutide|dose|dosage|mg|medicine|medication|prescri\w*|symptom\w*|side.effect\w*|constipat\w*|nausea|vomit\w*|supplement\w*|creatine|fasting|calories?|starv\w*|diagnos\w*|blood.pressure)\b/i;
export const shedSupportSchema=`
CREATE TABLE IF NOT EXISTS timber_shed_support_drafts(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),title TEXT NOT NULL,body TEXT NOT NULL,room_id TEXT NOT NULL,source_id TEXT,offer_id TEXT,category TEXT,action_key TEXT,recipe_id TEXT,situation TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,published_at TEXT);
CREATE TABLE IF NOT EXISTS timber_shed_support_tips(post_id TEXT PRIMARY KEY REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,user_id INTEGER NOT NULL REFERENCES users(id),source_id TEXT,offer_id TEXT,category TEXT,action_key TEXT,recipe_id TEXT,situation TEXT NOT NULL,reviewed_by INTEGER,reviewed_at TEXT);
CREATE TABLE IF NOT EXISTS timber_shed_support_marks(post_id TEXT NOT NULL REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,user_id INTEGER NOT NULL REFERENCES users(id),feedback_id TEXT NOT NULL,consented_at TEXT NOT NULL,PRIMARY KEY(post_id,user_id));
CREATE TABLE IF NOT EXISTS timber_shed_support_peers(user_id INTEGER PRIMARY KEY REFERENCES users(id),topic TEXT NOT NULL,opted_in_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS timber_shed_support_trials(post_id TEXT NOT NULL REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,user_id INTEGER NOT NULL REFERENCES users(id),feedback_id TEXT NOT NULL,outcome TEXT NOT NULL,reason TEXT,recorded_at TEXT NOT NULL,PRIMARY KEY(post_id,user_id));
`;
export function shedThreshold(env={}){const n=Number(env.TIMBER_SHED_HELPED_MINIMUM||5);return Number.isInteger(n)&&n>=5&&n<=1000?n:5;}
export function shedDatabase(DB,synthetic){
 if(!synthetic)return DB;
 return {prepare:sql=>DB.prepare(sql.replace(/\btimber_shed_/g,'timber_shed_v6test_')),batch:ops=>DB.batch(ops),exec:sql=>DB.exec(sql.replace(/\btimber_shed_/g,'timber_shed_v6test_'))};
}
export async function shedAccess(DB,userId,env){
 const row=await DB.prepare('SELECT u.email,m.source FROM users u LEFT JOIN member_status m ON m.user_id=u.id WHERE u.id=?').bind(userId).first();
 const synthetic=row?.source==='my_timber_release_test_v6'&&testEmails.has(row?.email);
 return {enabled:synthetic||env.MY_TIMBER_SHED_ENABLED==='true',synthetic,DB:shedDatabase(DB,synthetic)};
}
const forumEnv=(env,DB)=>({...env,DB,MEMBER_EXPERIENCE_V1_ENABLED:'true',TIMBER_SHED_PRIVATE_ENABLED:'true',TIMBER_SHED_FORUM_ENABLED:'true',TIMBER_SHED_FORUM_PILOT_APPROVED:'true',TIMBER_SHED_RETENTION_ENABLED:'true',TIMBER_SHED_GOVERNANCE_APPROVED_VERSION:SHED_POLICY.version,TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED:'false',TIMBER_SHED_AI_MODERATION_ENABLED:'false'});
export const privateProgress=async(DB,uid)=>{if(!await trackingConsent(DB,uid))return {};const row=await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(uid).first();return JSON.parse(row?.preferences||'{}').lifeBack?.progress||{};};
export function privateSituation(progress){
 const s=progress.memberSupport||{};
 if(['changing','stopped'].includes(s.stage))return 'after-treatment';
 if(s.stage==='returning')return 'returning';
 const m=(s.memories||[]).findLast(x=>!x.retiredAt);
 return situations.has(m?.choice)?m.choice:'general';
}
export const starterThreads=Object.freeze({
 late:{title:'A fallback for a late finish',body:'Choose one familiar dinner before work gets busy. Keep the ingredients together and an easier fallback ready.',source:'from SHIFT',room:'grub-fit'},
 budget:{title:'Check once before the food shop',body:'Start with what is already in the cupboard, fridge and freezer. Pick one familiar meal and list only what is missing.',source:'from SHIFT',room:'grub-fit'},
 energy:{title:'Take one decision off tomorrow',body:'Choose one ordinary job to make easier. Set out what you need, then leave the rest for another day.',source:'from SHIFT',room:'main-shed'},
 routine:{title:'A plan that can bend',body:'Keep one normal-day option and one easier fallback. Choose the one that fits the day you actually have.',source:'from SHIFT',room:'main-shed'},
 movement:{title:'Movement that fits real life',body:'Use the time, equipment and limitations saved in Fit. An easier suitable option is there when the full session does not fit.',source:'from SHIFT',room:'grub-fit'},
 'after-treatment':{title:'The other side of a change',body:'Your private history and familiar routines stay in My Timber. Treatment questions belong with your own prescriber or pharmacist.',source:'from SHIFT',room:'after-treatment'},
 returning:{title:'The Shed kept your seat',body:'Good to see you. Pick up something that helped before, or choose what would make today easier. There is nothing to catch up.',source:'from SHIFT',room:'main-shed'},
 general:{title:'One useful thing is enough',body:'You can read without posting. Share an everyday shortcut only if you want to, and keep your personal health record private.',source:'from SHIFT',room:'main-shed'}
});
const realMarks=`SELECT COUNT(DISTINCT hm.user_id) FROM timber_shed_support_marks hm JOIN users hu ON hu.id=hm.user_id JOIN member_state hms ON hms.user_id=hu.id LEFT JOIN member_status hs ON hs.user_id=hu.id LEFT JOIN user_auth ha ON ha.user_id=hu.id WHERE hm.post_id=p.id AND hm.user_id<>p.user_id AND hm.consented_at IS NOT NULL AND ha.email_verified=1 AND hu.email NOT LIKE '%@example.invalid' AND lower(COALESCE(hs.source,'')) NOT LIKE '%test%' AND NOT EXISTS(SELECT 1 FROM timber_shed_forum_moderators fm WHERE fm.user_id=hu.id AND fm.active=1) AND NOT EXISTS(SELECT 1 FROM hq_users hq WHERE lower(hq.email)=lower(hu.email)) AND (EXISTS(SELECT 1 FROM json_tree(hms.preferences,'$.lifeBack.progress') feedback WHERE feedback.key='operationId' AND feedback.value=hm.feedback_id AND json_extract(hms.preferences,feedback.path||'.outcome')='helped') OR EXISTS(SELECT 1 FROM timber_shed_support_trials trial WHERE trial.post_id=hm.post_id AND trial.user_id=hm.user_id AND trial.feedback_id=hm.feedback_id AND trial.outcome='helped'))`;
export function publicTip(row,threshold){
 const {real_marks,source_id,offer_id,user_id,recipe_id,action_key,situation,...publicFields}=row;
 const eligible=!!row.tip_reviewed_at&&row.status==='approved'&&!unsafeStep.test((row.title||'')+' '+row.body)&&Number(real_marks)>=threshold;
 return {...publicFields,...(eligible?{label:'From the Shed',helpedCount:Number(real_marks)}:{})};
}
async function matchingPosts(DB,uid,situation,category,minimum){
 const rows=(await DB.prepare(`SELECT p.id,p.room_id,p.title,p.body,p.created_at,p.status,pr.display_name,t.reviewed_at tip_reviewed_at,t.source_id,t.offer_id,t.user_id,t.recipe_id,t.action_key,t.situation,(${realMarks}) real_marks FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id JOIN timber_shed_support_tips t ON t.post_id=p.id WHERE p.status='approved' AND p.user_id<>${uid} AND ${visiblePostSQL('p',uid)} AND NOT EXISTS(SELECT 1 FROM timber_shed_support_trials tr WHERE tr.user_id=${uid} AND tr.post_id=p.id AND tr.outcome IN ('not-fit','not-helped')) AND (t.situation=? OR t.situation='general') AND (? IS NULL OR t.category=?) ORDER BY p.reviewed_at DESC,p.id DESC LIMIT 3`).bind(situation,category,category).all()).results||[];
 return rows.map(r=>publicTip(r,minimum));
}
export async function attachShedEvidence(DB,preferences,progress,userId,env={}){
 const a=progress.nextShift;if(!a?.practical)return;
 // Community evidence is checked at each fresh read, never trusted as a saved count.
 delete a.practical.shedPostId;delete a.practical.shedLabel;delete a.practical.shedHelpedCount;
 if(a.practical.pending)return;
 const access=await shedAccess(DB,userId,env);if(!access.enabled)return;
 const participation=await forumParticipation(access.DB,userId,new Date().toISOString(),forumEnv(env,access.DB));if(!participation.joined)return;
 const bad=new Set(allOffers(progress).filter(o=>o.reviews?.some(r=>['not-fit','not-helped'].includes(r.outcome))).map(o=>o.practical?.shedPostId).filter(Boolean));
 const posts=(await access.DB.prepare(`SELECT p.id,p.title,p.body,p.status,t.reviewed_at tip_reviewed_at,(${realMarks}) real_marks FROM timber_shed_forum_posts p JOIN timber_shed_support_tips t ON t.post_id=p.id WHERE p.status='approved' AND t.reviewed_at IS NOT NULL AND p.reviewed_by IS NOT NULL AND ${visiblePostSQL('p',userId)} AND t.situation IN (?,'general') AND ((t.recipe_id IS NOT NULL AND t.recipe_id=?) OR (t.recipe_id IS NULL AND t.action_key=?)) LIMIT 10`).bind(privateSituation(progress),a.practical.recipeId||null,a.practical.key||null).all()).results||[];
 const eligible=posts.find(p=>!bad.has(p.id)&&Number(p.real_marks)>=shedThreshold(env)&&!unsafeStep.test(p.title+' '+p.body));
 if(eligible)a.practical={...a.practical,shedPostId:eligible.id,shedLabel:'From the Shed',shedHelpedCount:Number(eligible.real_marks)};
}
export async function shedSupportRoutes(request,env){
 const url=new URL(request.url),prefix='/v1/life-back/shed';
 if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+'/'))return null;
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='POST'&&(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'Use My Timber for this action'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  const access=await shedAccess(env.DB,auth.userId,env);if(!access.enabled)return json({available:false,accountId:auth.userId});
  const DB=access.DB,uid=auth.userId,at=new Date().toISOString(),fenv=forumEnv(env,DB);
  const forum=createTimberShedForumRoutes(async()=>auth);
  const heartbeat=await DB.prepare('SELECT completed_at FROM timber_shed_maintenance WHERE id=1').first();
  if(!heartbeat||Date.now()-Date.parse(heartbeat.completed_at)>3600000)await runTimberShedRetention(fenv);
  await DB.prepare('DELETE FROM timber_shed_support_drafts WHERE id IN(SELECT id FROM timber_shed_support_drafts WHERE expires_at<? LIMIT 100)').bind(at).run();
  if(url.pathname.startsWith(prefix+'/forum/')){
   const action=url.pathname.slice((prefix+'/forum/').length);url.pathname='/v1/timber-shed/forum/'+action;
   const response=await forum(new Request(url,request),fenv);
   if(action==='leave'&&response?.ok)await DB.batch([DB.prepare('DELETE FROM timber_shed_support_drafts WHERE user_id=?').bind(uid),DB.prepare('DELETE FROM timber_shed_support_marks WHERE user_id=?').bind(uid),DB.prepare('DELETE FROM timber_shed_support_trials WHERE user_id=?').bind(uid),DB.prepare('DELETE FROM timber_shed_support_peers WHERE user_id=?').bind(uid),DB.prepare('UPDATE timber_shed_support_tips SET source_id=NULL,offer_id=NULL WHERE user_id=?').bind(uid)]);
   return response;
  }
  const participation=await forumParticipation(DB,uid,at,fenv);
  if(request.method==='GET'){
   if(!participation.joined)return json({available:true,accountId:uid,synthetic:access.synthetic,joined:false,policy:SHED_POLICY,moderation:{owner:'Matt',reply:'Reports checked within one working day',continuous:false}});
   const progress=await privateProgress(env.DB,uid),tab=url.searchParams.get('tab'),topic=url.searchParams.get('topic');
   const careOnly=tab==='ask'&&topic==='care',situation=tab==='ask'&&situations.has(topic)?topic:privateSituation(progress);
   const category=tab==='grub'?'meal':tab==='fit'||tab==='ask'&&topic==='movement'?'movement':null;
   const posts=careOnly?[]:await matchingPosts(DB,uid,situation,category,shedThreshold(env));
   const mine=(await DB.prepare(`SELECT p.id,p.title,p.status,t.source_id,t.offer_id,((${realMarks})>0) helped_another FROM timber_shed_forum_posts p JOIN timber_shed_support_tips t ON t.post_id=p.id WHERE p.user_id=? AND p.status<>'withdrawn' ORDER BY p.created_at DESC LIMIT 100`).bind(uid).all()).results||[];
   const peers=(await DB.prepare('SELECT pr.display_name,pe.topic FROM timber_shed_support_peers pe JOIN timber_shed_forum_profiles pr ON pr.user_id=pe.user_id WHERE pe.user_id<>? AND pe.topic=? AND NOT EXISTS(SELECT 1 FROM timber_shed_forum_blocks b WHERE b.blocker_id=? AND b.blocked_id=pe.user_id OR b.blocker_id=pe.user_id AND b.blocked_id=?) LIMIT 3').bind(uid,situation,uid,uid).all()).results||[];
   const moderator=!!await DB.prepare('SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1').bind(uid).first();
   const helpful=allOffers(progress).filter(a=>a.reviews?.some(r=>r.outcome==='helped')).map(a=>({id:a.id,title:a.practical?.name||a.title,feedbackId:a.reviews.findLast(r=>r.outcome==='helped').operationId,shedPostId:a.practical?.shedPostId||null}));
   return json({available:true,accountId:uid,synthetic:access.synthetic,joined:true,healthConsent:participation.healthConsent,careOnly,title:situation==='returning'?'The Shed kept your seat':situation==='after-treatment'?'Men who have been there':'Men like me',posts,starter:careOnly||posts.length?null:starterThreads[category==='movement'?'movement':situation],mine,peers,helpful,moderator,peerNotice:'Peer experience, not clinical advice. Your situation is matched privately and is not shown to other members.'});
  }
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Use the Shed form'},415);
  const raw=await request.text();if(raw.length>4096)return json({error:'Keep your submission short'},413);
  let input;try{input=JSON.parse(raw)}catch{return json({error:'Invalid request'},400);}
  if(String(input.expectedAccount)!==String(uid))return json({error:'Your account changed. Reload before saving.'},409);
  if(input.action==='join'){
   if(input.rulesAccepted!==true||input.privacyAcknowledged!==true||typeof input.healthConsent!=='boolean'||input.version!==SHED_POLICY.version)fail('Check the current community rules and privacy choices.');
   const eligibility=await env.DB.prepare('SELECT u.date_of_birth,a.email_verified FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?').bind(uid).first();
   const dob=new Date(eligibility?.date_of_birth+'T12:00:00Z'),cut=new Date();cut.setUTCFullYear(cut.getUTCFullYear()-18);
   if(eligibility?.email_verified!==1||!Number.isFinite(dob.getTime())||dob>cut)fail('The Shed is for verified adult members.',403);
   if(participation.disclosureConsentRecorded&&input.healthConsent===false)fail('Use Leave the community to withdraw sharing consent. You can then rejoin without posting.',409);
   if(validateForumInput('profile',{displayName:input.displayName}))fail('Choose a separate community name, 3 to 24 characters.');
   if(!await grantShedPilotAccess(DB,uid,at,new Date(Date.now()+365*86400000).toISOString()))fail('The small Shed pilot is full or your community access needs review. Your private My Timber support stays available.',403);
   await DB.prepare('INSERT OR IGNORE INTO timber_shed_forum_profiles(user_id,display_name,created_at) VALUES(?,?,?)').bind(uid,input.displayName,at).run();
   await saveForumParticipation(DB,uid,{healthConsent:input.healthConsent},at,fenv);return json({ok:true,joined:true},201);
  }
  if(!participation.joined||!participation.adultAccess)fail('Join the Shed before posting or marking a tip.',403);
  if(await activeForumRestriction(DB,uid,at))fail('Your community access is restricted. Open community settings.',403);
  if(input.action==='moderate-tip'){
   const moderator=await DB.prepare('SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1').bind(uid).first();if(!moderator)fail('Moderator access is required.',403);
   const approveURL=new URL(request.url);approveURL.pathname='/v1/timber-shed/forum/moderate';
   const approval=await forum(new Request(approveURL,{method:'POST',headers:{Origin:approveURL.origin,'Content-Type':'application/json'},body:JSON.stringify({postId:input.postId,action:'approve'})}),fenv);
   if(!approval.ok)return approval;
   const post=await DB.prepare('SELECT p.*,t.category FROM timber_shed_forum_posts p JOIN timber_shed_support_tips t ON t.post_id=p.id WHERE p.id=?').bind(input.postId).first();
   if(post&&post.user_id!==uid&&categories.has(post.category)&&!unsafeStep.test(post.title+' '+post.body))await DB.prepare('UPDATE timber_shed_support_tips SET reviewed_by=?,reviewed_at=? WHERE post_id=?').bind(uid,at,post.id).run();
   return json({ok:true,message:'Post reviewed. Only eligible everyday steps can enter practical suggestions.'});
  }
  if(input.action==='tip-feedback'){
   if(!['helped','not-fit','not-helped','not-tried'].includes(input.outcome)||input.reason&&!['timing','effort','idea'].includes(input.reason))fail('Choose what happened.');
   const post=await DB.prepare(`SELECT p.id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND p.user_id<>? AND ${visiblePostSQL('p',uid)}`).bind(input.postId,uid).first();if(!post)fail('This tip is no longer available.',404);
   const feedbackId=crypto.randomUUID();
   const ops=[DB.prepare('INSERT INTO timber_shed_support_trials(post_id,user_id,feedback_id,outcome,reason,recorded_at) VALUES(?,?,?,?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET feedback_id=excluded.feedback_id,outcome=excluded.outcome,reason=excluded.reason,recorded_at=excluded.recorded_at').bind(input.postId,uid,feedbackId,input.outcome,input.reason||null,at),DB.prepare('DELETE FROM timber_shed_support_marks WHERE post_id=? AND user_id=?').bind(input.postId,uid)];
   if(input.outcome==='helped'&&input.consent===true)ops.push(DB.prepare('INSERT INTO timber_shed_support_marks(post_id,user_id,feedback_id,consented_at) VALUES(?,?,?,?)').bind(input.postId,uid,feedbackId,at));
   await DB.batch(ops);return json({ok:true,message:input.outcome==='not-fit'||input.outcome==='not-helped'?'Your answer is saved. This tip is left out of your next matches.':input.outcome==='not-tried'?'No problem. It can stay here for another moment.':'Your own helpful feedback is saved.'});
  }
  if(input.action==='preview'){
   if(!participation.healthConsent)fail('You can read without posting. Review your community sharing choice before preparing a post.',403);
   const progress=await privateProgress(env.DB,uid),offer=allOffers(progress).find(a=>a.id===input.offerId&&a.reviews?.some(r=>r.outcome==='helped'));
   if(!offer)fail('Choose something you actually reported helpful.',409);
   const title=String(input.title||''),body=String(input.body||''),category=input.category;
   if(!categories.has(category)||validateForumInput('submit',{roomId:category==='routine'?'main-shed':'grub-fit',title,body}))fail('Check the title and your own words.');
   const id=crypto.randomUUID(),room=category==='routine'?'main-shed':'grub-fit';
   await DB.prepare('INSERT INTO timber_shed_support_drafts(id,user_id,title,body,room_id,source_id,offer_id,category,action_key,recipe_id,situation,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,uid,title,body,room,offer.practical?.memoryId||offer.checkinId||offer.id,offer.id,category,offer.practical?.key||null,offer.practical?.recipeId||null,privateSituation(progress),at,new Date(Date.now()+20*60000).toISOString()).run();
   return json({preview:{id,title,body,room},notice:'Only these words will be posted. Your private health record is not attached.'});
  }
  if(input.action==='publish'){
   if(input.confirmed!==true)fail('Check the exact preview before posting.');
   const draft=await DB.prepare('SELECT * FROM timber_shed_support_drafts WHERE id=? AND user_id=? AND expires_at>?').bind(input.draftId,uid,at).first();if(!draft)fail('This preview expired. Prepare it again.',409);
   if(draft.published_at)return json({ok:true,id:draft.id,status:'pending',duplicate:true});
   if(!participation.healthConsent)fail('Review the sharing consent first.',403);
   const quota=await DB.prepare('SELECT COUNT(*) n FROM timber_shed_forum_posts WHERE user_id=? AND created_at>=?').bind(uid,new Date(Date.now()-86400000).toISOString()).first();
   if(Number(quota?.n||0)>=5)fail('The daily sharing limit is five posts. Your preview stays private.',429);
   const screening=screenForumText({title:draft.title,body:draft.body});
   await DB.batch([DB.prepare("INSERT INTO timber_shed_forum_posts(id,user_id,room_id,title,body,status,created_at) VALUES(?,?,?,?,?,'pending',?)").bind(draft.id,uid,draft.room_id,draft.title,draft.body,at),DB.prepare('INSERT INTO timber_shed_bouncer_screenings(post_id,policy_version,model_name,severity,priority,categories_json,screened_at) VALUES(?,?,?,?,?,?,?)').bind(draft.id,screening.policyVersion,null,screening.severity,screening.priority,JSON.stringify(screening.categories),at),DB.prepare('INSERT INTO timber_shed_support_tips(post_id,user_id,source_id,offer_id,category,action_key,recipe_id,situation) VALUES(?,?,?,?,?,?,?,?)').bind(draft.id,uid,draft.source_id,draft.offer_id,draft.category,draft.action_key,draft.recipe_id,draft.situation),DB.prepare('UPDATE timber_shed_support_drafts SET published_at=? WHERE id=? AND user_id=? AND published_at IS NULL').bind(at,draft.id,uid)]);
   return json({ok:true,id:draft.id,status:'pending',message:'Saved exactly as previewed. It stays private until moderation.'},201);
  }
  if(input.action==='mark'||input.action==='unmark'){
   if(input.action==='unmark'){await DB.prepare('DELETE FROM timber_shed_support_marks WHERE post_id=? AND user_id=?').bind(input.postId,uid).run();return json({ok:true});}
   if(input.consent!==true)fail('Choose whether your anonymous helpful mark may be used.');
   const progress=await privateProgress(env.DB,uid),source=allOffers(progress).find(a=>a.practical?.shedPostId===input.postId&&a.reviews?.some(r=>r.operationId===input.feedbackId&&r.outcome==='helped'));
   if(!source)fail('Only your own actual helpful feedback can create a mark.',409);
   const post=await DB.prepare(`SELECT p.id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND p.user_id<>? AND ${visiblePostSQL('p',uid)}`).bind(input.postId,uid).first();if(!post)fail('This tip is no longer available.',404);
   await DB.prepare('INSERT INTO timber_shed_support_marks(post_id,user_id,feedback_id,consented_at) VALUES(?,?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET feedback_id=excluded.feedback_id,consented_at=excluded.consented_at').bind(input.postId,uid,input.feedbackId,at).run();return json({ok:true});
  }
  if(input.action==='peer'){
   if(input.visible===false){await DB.prepare('DELETE FROM timber_shed_support_peers WHERE user_id=?').bind(uid).run();return json({ok:true});}
   if(!participation.healthConsent)fail('Review your community sharing choice before making an experience visible.',403);
   if(input.visible!==true||!situations.has(input.topic))fail('Choose the experience you want to be visible for.');
   await DB.prepare('INSERT INTO timber_shed_support_peers(user_id,topic,opted_in_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET topic=excluded.topic,opted_in_at=excluded.opted_in_at').bind(uid,input.topic,at).run();return json({ok:true});
  }
  if(input.action==='review-tip'){
   const moderator=await DB.prepare('SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1').bind(uid).first();if(!moderator)fail('Moderator access is required.',403);
   const row=await DB.prepare("SELECT p.*,t.category FROM timber_shed_forum_posts p JOIN timber_shed_support_tips t ON t.post_id=p.id WHERE p.id=? AND p.status='approved' AND p.reviewed_by IS NOT NULL").bind(input.postId).first();
   if(!row||row.user_id===uid||!categories.has(row.category)||unsafeStep.test(row.title+' '+row.body))fail('This post is not eligible as a practical step.',409);
   await DB.prepare('UPDATE timber_shed_support_tips SET reviewed_by=?,reviewed_at=? WHERE post_id=?').bind(uid,at,row.id).run();return json({ok:true});
  }
  return json({error:'Choose an available action'},400);
 }catch(e){return json({error:e.status?e.message:'The Shed is temporarily unavailable. Your private support remains available.'},e.status||503);}
}
