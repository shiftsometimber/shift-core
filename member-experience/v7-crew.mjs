import {authenticateMember} from '../member-state-fast-v1.js';
import {v7State,v7Week} from './v7-model.mjs';
import {journeyDay} from './journey-records.mjs';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const alias=input=>{const value=String(input||'').trim();if(!/^[a-zA-Z0-9 ’'-]{1,20}$/.test(value))fail('Choose a short crew name for yourself, using letters and numbers.');return value;};
export async function publishV7Effort(DB,userId,progress,at=new Date().toISOString()){
 const state=v7State(progress,at);
 try{await DB.prepare("INSERT INTO mt_v7_effort(user_id,week,logs,updated_at) SELECT ?,?,?,? WHERE (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=?),0)<>1 ON CONFLICT(user_id,week) DO UPDATE SET logs=MAX(logs,excluded.logs),updated_at=excluded.updated_at").bind(userId,state.week,state.weeklyCount,at,userId,userId).run();return true;}catch{return false;}
}
export async function v7CrewSnapshot(DB,userId,at=new Date().toISOString(),prepared=null){
 try{
  const own=prepared?prepared.membership:await DB.prepare('SELECT crew_id FROM mt_v7_crew_members WHERE user_id=?').bind(userId).first();
  const week=v7Week(journeyDay(at));if(!own)return {available:true,joined:false,week,members:[]};
  // Membership is established from the authenticated account, never a supplied
  // crew ID. The response contains no account IDs or underlying health records.
  const members=(await DB.prepare("SELECT m.user_id,m.alias,COALESCE(e.logs,0) AS logs FROM mt_v7_crew_members m LEFT JOIN mt_v7_effort e ON e.user_id=m.user_id AND e.week=? WHERE m.crew_id=? AND (SELECT granted FROM consents WHERE user_id=m.user_id AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=m.user_id),0)<>1 ORDER BY logs DESC,m.joined_at,m.user_id").bind(week,own.crew_id).all()).results||[];
  return {available:true,joined:true,week,members:members.map(m=>({alias:m.alias,logs:m.logs,you:m.user_id===userId}))};
 }catch{return {available:false,joined:false,members:[]};}
}
export async function v7CrewRoutes(request,env){
 const url=new URL(request.url);if(url.pathname!=='/v1/my-timber/crew')return null;
 if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405,headers});
 if(request.headers.get('Origin')!==url.origin)return Response.json({error:'Use My Timber to change your crew.'},{status:403,headers});
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  const raw=await request.text();if(raw.length>2000)fail('Request is too large',413);const input=JSON.parse(raw);
  if(String(input.expectedAccount)!==String(auth.userId))fail('Your account changed. Reopen My Timber.',409);
  const own=await env.DB.prepare('SELECT crew_id FROM mt_v7_crew_members WHERE user_id=?').bind(auth.userId).first(),at=new Date().toISOString();
  if(input.action==='leave'){
   await env.DB.batch([env.DB.prepare('DELETE FROM mt_v7_crew_invites WHERE creator_id=?').bind(auth.userId),env.DB.prepare('DELETE FROM mt_v7_crew_members WHERE user_id=?').bind(auth.userId)]);
   return Response.json({accountId:auth.userId,league:await v7CrewSnapshot(env.DB,auth.userId,at)},{headers});
  }
  const consent=await env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(auth.userId).first();
  const row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first(),prefs=JSON.parse(row?.preferences||'{}');
  if(Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)fail('Optional tracking is off or paused. Your crew has not changed.',409);
  let inviteUrl=null;
  if(input.action==='create'||input.action==='join'){
   if(own)fail('You already have a crew. Leave it before joining another.',409);
   if(input.consented!==true)fail('Confirm that this private crew may see your daily-action count.');
   const name=alias(input.alias);
   if(input.action==='create'){
    const id=crypto.randomUUID();
    await env.DB.batch([env.DB.prepare("INSERT INTO mt_v7_crews(id,created_by,created_at) SELECT ?,?,? WHERE (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=?),0)<>1").bind(id,auth.userId,at,auth.userId,auth.userId),env.DB.prepare("INSERT INTO mt_v7_crew_members(crew_id,user_id,alias,joined_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM mt_v7_crews WHERE id=?) AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1").bind(id,auth.userId,name,at,id,auth.userId)]);
   }else{
    const code=String(input.code||'');if(!/^[a-f0-9]{48}$/.test(code))fail('Use the full invitation code.');
    const invite=await env.DB.prepare('SELECT crew_id FROM mt_v7_crew_invites WHERE digest=? AND expires_at>?').bind(await digest(code),at).first();
    if(!invite)fail('This invitation is unavailable or has expired.',404);
    const result=await env.DB.prepare("INSERT INTO mt_v7_crew_members(crew_id,user_id,alias,joined_at) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM mt_v7_crew_members WHERE crew_id=?)<8 AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=?),0)<>1").bind(invite.crew_id,auth.userId,name,at,invite.crew_id,auth.userId,auth.userId).run();
    if(result.meta.changes!==1)fail('This private crew is full.',409);
   }
   await publishV7Effort(env.DB,auth.userId,prefs.lifeBack?.progress,at);
  }else if(input.action==='invite'){
   if(!own)fail('Join or create a private crew first.',409);
   const code=Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
   await env.DB.prepare('INSERT INTO mt_v7_crew_invites(digest,crew_id,creator_id,expires_at) VALUES(?,?,?,?)').bind(await digest(code),own.crew_id,auth.userId,new Date(Date.now()+7*86400000).toISOString()).run();
   inviteUrl=url.origin+'/member/life-back/support/league?crew='+code;
  }else fail('Choose an available crew action.');
  return Response.json({accountId:auth.userId,league:await v7CrewSnapshot(env.DB,auth.userId,at),...(inviteUrl?{inviteUrl}:{})},{headers});
 }catch(e){return Response.json({error:e.status?e.message:'Your crew change could not be confirmed. Reopen My Timber before retrying.'},{status:e.status||503,headers});}
}
