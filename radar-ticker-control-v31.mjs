// Lifecycle metadata for already-published Radar snapshots. Existing settings and audit
// remain the only stores. The writer is confined to the marked fictional QA database.
import {snapshotSha} from './radar-source-snapshots-v1.js';
import {pendingSourceChangeMap,sourceReviewGuardSql,sourceReviewGuardBindings} from './radar-source-review-v1.js';
const PREFIX='ticker_control_v31:',ACTION='ticker_control_changed';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});
const parse=value=>{try{return JSON.parse(value)}catch{return null}};
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const destinations=pkg=>['ticker_knowledge','ticker_treatments'].filter(x=>pkg?.destinations?.includes(x));
export const tickerSnapshotHash=row=>snapshotSha(JSON.stringify([row.content_package_json,row.source_evidence_json,row.verification_json,row.medicine_patch_json,row.reviewed_at||null,row.reviewed_by||null]));
export function tickerInstant(value){
 if(value===null||value==='')return null;
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(value)||!Number.isFinite(Date.parse(value)))throw fail('Use an ISO date and time with Z or an explicit UTC offset.');
 const parts=value.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(?:\.\d{1,3})?)?(Z|([+-])(\d\d):(\d\d))$/),n=parts&&parts.slice(1,7).map(Number);if(!parts||n[1]<1||n[1]>12||n[2]<1||n[2]>new Date(Date.UTC(n[0],n[1],0)).getUTCDate()||n[3]>23||n[4]>59||n[5]>59||parts[7]!=='Z'&&(Number(parts[9])>14||Number(parts[10])>59||Number(parts[9])===14&&Number(parts[10])!==0))throw fail('Choose a valid calendar date and UTC offset.');
 return new Date(value).toISOString();
}
function validControl(x,id){return x&&x.event_id===id&&Number.isSafeInteger(x.version)&&x.version>0&&/^[a-f0-9]{64}$/.test(x.source_sha256)&&typeof x.paused==='boolean'&&Number.isInteger(x.order)&&x.order>=0&&x.order<=999&&Array.isArray(x.destinations)&&x.destinations.length>0&&x.destinations.every(d=>['ticker_knowledge','ticker_treatments'].includes(d))&&x.timezone==='Europe/London'&&[x.starts_at,x.expires_at].every(d=>d===null||typeof d==='string'&&Number.isFinite(Date.parse(d)))&&(!x.starts_at||!x.expires_at||Date.parse(x.starts_at)<Date.parse(x.expires_at));}
export async function readTickerControlMap(DB){
 const {results=[]}=await DB.prepare('SELECT setting_key,value_json FROM radar_settings WHERE setting_key LIKE ?').bind(PREFIX+'%').all(),map=new Map();
 for(const r of results){const suffix=r.setting_key.slice(PREFIX.length),id=/^[1-9]\d*$/.test(suffix)?Number(suffix):NaN,x=parse(r.value_json);if(!validControl(x,id))throw fail('Ticker control source unavailable.',503);map.set(id,x);}
 return map;
}
export async function filterTickerItems(items,rows,controls,{now=Date.now(),pending=new Map()}={}){
 const byId=new Map(rows.map(x=>[Number(x.id),x])),accepted=[];
 for(let position=0;position<items.length;position++){
  const item=items[position],c=controls.get(Number(item.id));
  if(!c){accepted.push({item,order:500,position});continue;}
  const row=byId.get(Number(item.id));if(!row||pending.has(Number(item.id))||c.paused||c.starts_at&&now<Date.parse(c.starts_at)||c.expires_at&&now>=Date.parse(c.expires_at)||await tickerSnapshotHash(row)!==c.source_sha256)continue;
  const pkg=parse(row.content_package_json),approved=destinations(pkg);if(c.destinations.some(d=>!approved.includes(d)))continue;
  accepted.push({item:{...item,ticker_control:{version:c.version,starts_at:c.starts_at,expires_at:c.expires_at,timezone:c.timezone,destinations:c.destinations}},order:c.order,position});
 }
 return accepted.sort((a,b)=>a.order-b.order||a.position-b.position).map(x=>x.item);
}
async function isolatedWriter(env,user){
 if(!['owner','admin'].includes(user?.role))return false;
 if(env.SSTRX_ENVIRONMENT!=='synthetic'||env.SSTRX_QA_STACK!=='joined-v31'||env.DEPLOYMENT_ENVIRONMENT!=='test'||env.HQ_V3_TEST_MODE!=='true'||env.SSTRX_QA_DATABASE_ID!=='3a891880-ea14-4a57-a02e-7f6f3de7f785')return false;
 const row=await env.DB.prepare("SELECT database_id,synthetic_only FROM sstrx_qa_environment WHERE environment='joined-v31'").first();return row?.database_id===env.SSTRX_QA_DATABASE_ID&&Number(row.synthetic_only)===1;
}
async function candidates(DB,now){
 const {LATEST_PUBLISHED_EDITION_SQL,latestPublishedEditionItems}=await import('./radar-published-ticker-v1.js');
 const {results:rows=[]}=await DB.prepare(LATEST_PUBLISHED_EDITION_SQL).all(),pending=await pendingSourceChangeMap(DB),items=await latestPublishedEditionItems(rows,pending,now,{limit:200});
 return{rows,pending,items};
}
function defaultState(row){return{event_id:Number(row.id),version:0,source_sha256:null,publication_job_id:Number(row.publication_job_id),destinations:destinations(parse(row.content_package_json)),starts_at:null,expires_at:null,paused:false,order:500,timezone:'Europe/London',reviewed_by:row.reviewed_by||null,reviewed_at:row.reviewed_at||null};}
async function history(DB,id){const {results=[]}=await DB.prepare('SELECT id,event_id,actor,detail_json,created_at FROM radar_audit WHERE event_id=? AND action=? ORDER BY id DESC LIMIT 30').bind(id,ACTION).all();return results.map(x=>({audit_id:x.id,actor:x.actor,at:x.created_at,...parse(x.detail_json)}));}
export async function tickerControlRead(env,user,{now=Date.now()}={}){
 const [{rows,items},controls,writable]=await Promise.all([candidates(env.DB,now),readTickerControlMap(env.DB),isolatedWriter(env,user)]),byId=new Map(rows.map(x=>[Number(x.id),x]));
 const result=[];
 for(const item of items){const row=byId.get(Number(item.id)),source_sha256=await tickerSnapshotHash(row),control=controls.get(Number(item.id))||defaultState(row);result.push({...item,source_sha256,recorded_source_review:Boolean(row.reviewed_by&&row.reviewed_at),source_reviewed_by:row.reviewed_by||null,source_reviewed_at:row.reviewed_at||null,publication_job_id:Number(row.publication_job_id),control,source_matches:control.version===0||control.source_sha256===source_sha256,history:await history(env.DB,Number(item.id))});}
 return{ok:true,scope:writable?'TEST':'READ_ONLY',writable,timezone:'Europe/London',source:'Existing completed Radar publications / radar_settings / radar_audit',items:result,now:new Date(now).toISOString()};
}
export async function tickerControlWrite(env,user,id,body,{now=Date.now()}={}){
 if(!['owner','admin'].includes(user?.role))throw fail('Owner review required.',403);
 if(!await isolatedWriter(env,user))throw fail('Ticker changes are available only in the marked fictional TEST environment.',403);
 const keys=['action','expected_version','source_sha256','request_id','starts_at','expires_at','order','rollback_version'];
 if(!body||Array.isArray(body)||Object.keys(body).some(k=>!keys.includes(k))||!['save','pause','resume','rollback'].includes(body.action)||!Number.isSafeInteger(body.expected_version)||body.expected_version<0||!/^[a-f0-9]{64}$/.test(body.source_sha256||'')||!/^[A-Za-z0-9_-]{8,80}$/.test(body.request_id||''))throw fail('Invalid ticker control request.');
 const intent=await snapshotSha(JSON.stringify(keys.filter(k=>k!=='request_id').map(k=>[k,body[k]??null]))),DB=env.DB;
 const applied=await DB.prepare("SELECT detail_json FROM radar_audit WHERE event_id=? AND action=? AND json_extract(detail_json,'$.request_id')=? LIMIT 1").bind(id,ACTION,body.request_id).first();
 if(applied){const d=parse(applied.detail_json);if(d?.intent_sha256!==intent)throw fail('The request reference belongs to a different change.',409);return{ok:true,already_applied:true,applied_version:d.after.version,current:await tickerControlRead(env,user,{now})};}
 const {rows,items}=await candidates(DB,now),row=rows.find(x=>Number(x.id)===id);if(!row||!row.reviewed_by||!row.reviewed_at||!items.some(x=>Number(x.id)===id))throw fail('An unchanged, completed and reviewed publication is required.',409);
 const source_sha256=await tickerSnapshotHash(row);if(body.source_sha256!==source_sha256)throw fail('The reviewed source changed. Refresh before reviewing again.',409);
 const key=PREFIX+id,stored=await DB.prepare('SELECT value_json FROM radar_settings WHERE setting_key=?').bind(key).first(),before=stored?parse(stored.value_json):defaultState(row);if(stored&&!validControl(before,id))throw fail('Ticker control source unavailable.',503);if(before.version!==body.expected_version)throw fail('The ticker version changed. Refresh before reviewing again.',409);
 if(before.version&&before.source_sha256!==source_sha256&&!['save','pause'].includes(body.action))throw fail('Review and save a schedule against the newly published source first.',409);
 let desired={starts_at:before.starts_at,expires_at:before.expires_at,paused:before.paused,order:before.order};
 if(body.action==='save'){desired={starts_at:tickerInstant(body.starts_at),expires_at:tickerInstant(body.expires_at),paused:before.paused,order:body.order};if(!Number.isInteger(desired.order)||desired.order<0||desired.order>999)throw fail('Order must be a whole number from 0 to 999.');}
 if(body.action==='pause')desired.paused=true;if(body.action==='resume')desired.paused=false;
 if(body.action==='rollback'){
  if(!Number.isSafeInteger(body.rollback_version)||body.rollback_version<1)throw fail('Choose a recorded ticker version.');
  const old=(await history(DB,id)).find(x=>x.after?.version===body.rollback_version)?.after;if(!old||old.source_sha256!==source_sha256)throw fail('That version does not match the currently reviewed source.',409);desired={starts_at:old.starts_at,expires_at:old.expires_at,paused:old.paused,order:old.order};
 }
 if(desired.starts_at&&desired.expires_at&&Date.parse(desired.starts_at)>=Date.parse(desired.expires_at))throw fail('Expiry must be after the scheduled start.');
 const stamp=new Date(now).toISOString(),after={...defaultState(row),...desired,version:before.version+1,source_sha256,request_id:body.request_id,reviewed_by:user.email||user.name||String(user.id),reviewed_at:stamp},serialised=JSON.stringify(after);
 const sourceGuard="EXISTS (SELECT 1 FROM radar_events WHERE id=? AND status='published' AND content_package_json=? AND reviewed_at IS ? AND reviewed_by IS ? AND verification_json IS ? AND medicine_patch_json IS ? AND "+sourceReviewGuardSql('radar_events')+" AND EXISTS(SELECT 1 FROM radar_publication_jobs j WHERE j.id=? AND j.event_id=radar_events.id AND j.status='complete' AND j.id=(SELECT MAX(z.id) FROM radar_publication_jobs z WHERE z.event_id=radar_events.id AND z.status='complete')))",sourceValues=[id,row.content_package_json,row.reviewed_at||null,row.reviewed_by||null,row.verification_json,row.medicine_patch_json,...sourceReviewGuardBindings(row),Number(row.publication_job_id)];
 const change=stored?DB.prepare('UPDATE radar_settings SET value_json=?,updated_by=?,updated_at=? WHERE setting_key=? AND value_json=? AND '+sourceGuard).bind(serialised,user.id||null,stamp,key,stored.value_json,...sourceValues):DB.prepare('INSERT INTO radar_settings(setting_key,value_json,updated_by,updated_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM radar_settings WHERE setting_key=?) AND '+sourceGuard).bind(key,serialised,user.id||null,stamp,key,...sourceValues);
 const detail=JSON.stringify({request_id:body.request_id,intent_sha256:intent,action:body.action,before,after}),audit=DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM radar_settings WHERE setting_key=? AND value_json=?) AND NOT EXISTS(SELECT 1 FROM radar_audit WHERE event_id=? AND action=? AND json_extract(detail_json,'$.request_id')=?)").bind(id,ACTION,after.reviewed_by,detail,stamp,key,serialised,id,ACTION,body.request_id);
 await DB.batch([change,audit]);
 // Confirm the durable version and its exact receipt. D1 mutation metadata may
 // include trigger side effects and is not proof that this statement applied.
 const receipt=await DB.prepare("SELECT detail_json FROM radar_audit WHERE event_id=? AND action=? AND json_extract(detail_json,'$.request_id')=? LIMIT 1").bind(id,ACTION,body.request_id).first();
 if(receipt?.detail_json!==detail){const storedNow=await DB.prepare('SELECT value_json FROM radar_settings WHERE setting_key=?').bind(key).first();if(storedNow?.value_json===serialised)throw fail('The change receipt is uncertain. Reconcile before retrying.',503);throw fail('The source or ticker version changed. Reconcile before retrying.',409);}
 return{ok:true,already_applied:false,applied_version:after.version,audit_recorded:true,control:after};
}
export async function tickerControlRoute(request,env,user,id,options={}){
 try{
  if(request.method==='GET'&&id===null)return json(await tickerControlRead(env,user,options));
  if(request.method==='PATCH'&&id!==null){const raw=await request.text();if(raw.length>4096)throw fail('Ticker request too large.',413);let body;try{body=JSON.parse(raw)}catch{throw fail('Valid JSON required.');}return json(await tickerControlWrite(env,user,id,body,options));}
  return json({ok:false,error:'method_not_allowed'},405);
 }catch(error){return json({ok:false,error:error.message||'Ticker source unavailable.',reconcile_before_retry:request.method==='PATCH'},error.status||503);}
}

export function tickerNextChange(controls,now=Date.now()){
 const next=[...controls.values()].filter(c=>!c.paused).flatMap(c=>[c.starts_at,c.expires_at]).filter(Boolean).map(Date.parse).filter(x=>x>now);return next.length?new Date(Math.min(...next)).toISOString():null;
}
export async function tickerFeedResponse(env,{now=Date.now()}={}){
 try{const controls=await readTickerControlMap(env.DB),{readPublishedTickerEdition}=await import('./radar-published-ticker-v1.js'),edition=await readPublishedTickerEdition(env.DB,{now});if(edition.status==='Unavailable')throw fail('Ticker controls unavailable.',503);return json({ok:true,current:false,status:'TEST published edition',published_edition:edition,items:[],server_now:new Date(now).toISOString(),next_change_at:tickerNextChange(controls,now)});}catch{return json({ok:false,current:false,status:'Unavailable',items:[]},503);}
}
export async function tickerPreviewResponse(){
 const {tickerClient,tickerStyles,tickerMarkup}=await import('./public-navigation-policy.mjs');
 const client=tickerClient.replace("fetch('/v1/radar/ticker', {credentials:'omit'","fetch('/v1/hq/radar/ticker-feed', {credentials:'include'");if(client===tickerClient)throw Error('Retained ticker transport changed.');
 const html='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Published ticker preview</title><style>body{margin:0;background:#050505;color:#E7E3DA;font:16px/1.5 system-ui}p{margin:14px 18px}'+tickerStyles+'</style></head><body><p>Protected preview · Published Radar records · Your reduced-motion setting is respected.</p>'+tickerMarkup+'<script>'+client+'</script></body></html>';
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'"}});
}
