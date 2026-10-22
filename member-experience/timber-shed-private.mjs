import {authenticateMember} from '../member-state-fast-v1.js';

// No community feed, no public profile, no member-to-member reads, and no clinical data.
const HEADERS={'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const reply=(body,status=200)=>Response.json(body,{status,headers:HEADERS});
const ACTIVITY_IDS=new Set(Array.from({length:6},(_,week)=>['start','midweek','talk','reflect'].map(day=>`w${week+1}-${day}`)).flat());
const CHOICES=new Set(['helped','not-helped','did-not-fit']);
export const timberShedPrivateSchema=`CREATE TABLE IF NOT EXISTS timber_shed_private_progress (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 0,
 activities_json TEXT NOT NULL DEFAULT '{}',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;
const blank=()=>({enabled:false,revision:0,activities:{}});
function state(row){if(!row)return blank();let parsed={};try{parsed=JSON.parse(row.activities_json||'{}')}catch{};const activities={};for(const [id,entry] of Object.entries(parsed)){if(ACTIVITY_IDS.has(id)&&entry&&typeof entry==='object'&&['done','not-done'].includes(entry.status)){activities[id]={status:entry.status,...(CHOICES.has(entry.feedback)?{feedback:entry.feedback}:{})}}}return{enabled:row.enabled===1,revision:row.revision,activities:row.enabled===1?activities:{}}}
function validate(input,current){
 if(!input||typeof input!=='object'||Array.isArray(input))return{error:'invalid_request'};
 if(!Number.isSafeInteger(input.revision)||input.revision!==current.revision)return{error:'revision_conflict',status:409};
 const action=input.action;
 if(action==='enable'&&Object.keys(input).every(k=>['action','revision'].includes(k)))return{next:{enabled:true,revision:current.revision+1,activities:current.activities}};
 if(action==='disable'&&Object.keys(input).every(k=>['action','revision'].includes(k)))return{next:{enabled:false,revision:current.revision+1,activities:{}}};
 if(action==='activity'&&current.enabled&&Object.keys(input).every(k=>['action','revision','activityId','status','feedback'].includes(k))&&ACTIVITY_IDS.has(input.activityId)&&['done','not-done'].includes(input.status)&& (input.feedback===undefined||CHOICES.has(input.feedback))){
  return{next:{enabled:true,revision:current.revision+1,activities:{...current.activities,[input.activityId]:{status:input.status,...(input.feedback?{feedback:input.feedback}:{})}}}};
 }
 return{error:'invalid_action'};
}
export function createTimberShedPrivateRoutes(authenticate=authenticateMember){
 return async function timberShedPrivateRoutes(request,env){
  if(new URL(request.url).pathname!=='/v1/timber-shed/private-progress')return null;
  // Default-off feature. Never fall through to a public endpoint when disabled.
  if(env.TIMBER_SHED_PRIVATE_ENABLED!=='true')return reply({error:'not_available'},404);
  if(!['GET','POST'].includes(request.method))return reply({error:'method_not_allowed'},405);
  if(request.method==='POST'){
   const origin=request.headers.get('Origin');
   if(origin!==new URL(request.url).origin)return reply({error:'same_origin_required'},403);
   if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return reply({error:'json_required'},415);
  }
  const auth=await authenticate(request,env);if(auth.response)return auth.response;
  if(!Number.isSafeInteger(auth.userId)||auth.userId<=0)return reply({error:'authentication_required'},401);
  try{
   const db=env.DB;
   const row=await db.prepare('SELECT enabled, revision, activities_json FROM timber_shed_private_progress WHERE user_id=?').bind(auth.userId).first();
   const current=state(row);
   if(request.method==='GET')return reply({ok:true,private:true,...current});
   const raw=await request.text();if(raw.length>512)return reply({error:'request_too_large'},413);
   let input;try{input=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
   const result=validate(input,current);
   if(result.error)return reply({error:result.error},result.status||400);
   const next=result.next,now=new Date().toISOString();
   if(row){
    const update=await db.prepare('UPDATE timber_shed_private_progress SET enabled=?, revision=?, activities_json=?, updated_at=? WHERE user_id=? AND revision=?').bind(next.enabled?1:0,next.revision,JSON.stringify(next.activities),now,auth.userId,current.revision).run();
    if(Number(update.meta?.changes)!==1)return reply({error:'revision_conflict'},409);
   }else{
    const insert=await db.prepare('INSERT OR IGNORE INTO timber_shed_private_progress(user_id,enabled,revision,activities_json,updated_at) VALUES(?,?,?,?,?)').bind(auth.userId,next.enabled?1:0,next.revision,JSON.stringify(next.activities),now).run();
    if(Number(insert.meta?.changes)!==1)return reply({error:'revision_conflict'},409);
   }
   return reply({ok:true,private:true,...next});
  }catch(error){
   // Never expose SQL, user details or internal record identifiers.
   return reply({error:'temporarily_unavailable'},503);
  }
 };
}
export const timberShedPrivateRoutes=createTimberShedPrivateRoutes();

// Export is the owning member's own private progress only. Never a community feed.
export async function appendTimberShedPrivateExport(request,env,response,authenticate=authenticateMember){
 if(env.TIMBER_SHED_PRIVATE_ENABLED!=='true'||new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 try{
  const auth=await authenticate(request,env);if(auth.response)return auth.response;
  const data=await response.clone().json();
  const row=await env.DB.prepare('SELECT enabled,revision,activities_json FROM timber_shed_private_progress WHERE user_id=?').bind(auth.userId).first();
  data.timberShedPrivateProgress=state(row);
  const headers=new Headers(response.headers);for(const[k,v]of Object.entries(HEADERS))headers.set(k,v);headers.delete('Content-Length');
  return new Response(JSON.stringify(data),{status:response.status,headers});
 }catch{return reply({error:'private_export_unavailable'},503)}
}
