import {verifyGithubOidc} from './commissioning-identity-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {progressStaticPatch} from './progress-static-patch-v1.js';
import {ensureStructuredContent,upsertStructuredContent} from './structured-content-v1.js';
const COMMISSIONING_OPS_VERSION='final-v1-publication-v1-20260814';
const FINAL_V1_AUTHORITY='matt-final-v1-2026-08-14';
const MAX_STRUCTURED_BATCH=25;
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-shift-commissioning-ops':COMMISSIONING_OPS_VERSION}});
export async function commissioningOpsRoutes(request,env){
  const progressAsset=await progressStaticPatch(request);if(progressAsset)return progressAsset;
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  const radar=p==='/v1/commissioning/radar-scan'&&request.method==='POST';
  const productEvents=p==='/v1/commissioning/product-events'&&request.method==='GET';
  const structuredBatch=p==='/v1/commissioning/structured-content/batch'&&request.method==='POST';
  const structuredStatus=p==='/v1/commissioning/structured-content/status'&&request.method==='GET';
  if(!radar&&!productEvents&&!structuredBatch&&!structuredStatus)return null;
  const identity=await commissioningIdentity(request);if(!identity.ok)return json({ok:false,error:'unauthorised',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},401);
  if(radar){const result=await runRadarScheduledScan(env);return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,radar:result})}
  if(structuredBatch)return publishStructuredBatch(request,env);
  if(structuredStatus)return structuredPublicationStatus(env);
  const userId=Number(u.searchParams.get('userId')||0),hours=Math.max(1,Math.min(24,Number(u.searchParams.get('hours')||1)));
  if(!Number.isInteger(userId)||userId<=0)return json({ok:false,error:'invalid_user_id',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},400);
  try{
    const {results=[]}=await env.DB.prepare(`SELECT id,event_name,surface,source,properties_json,occurred_at FROM product_events WHERE user_id=? AND occurred_at>=datetime('now',?) ORDER BY id ASC`).bind(userId,`-${hours} hours`).all();
    return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,userId,windowHours:hours,events:results.map(x=>({id:Number(x.id),event_name:x.event_name,surface:x.surface,source:x.source,properties:safe(x.properties_json),occurred_at:x.occurred_at}))});
  }catch(e){console.error('commissioning_product_events_failed',e?.message);return json({ok:false,error:'analytics_evidence_unavailable',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},503)}
}
async function publishStructuredBatch(request,env){
  let body;try{body=await request.json()}catch{return json({ok:false,error:'invalid_json'},400)}
  if(body?.authority!==FINAL_V1_AUTHORITY)return json({ok:false,error:'final_v1_authority_required'},403);
  const items=Array.isArray(body?.items)?body.items:[];
  if(!items.length||items.length>MAX_STRUCTURED_BATCH)return json({ok:false,error:'invalid_batch_size',max:MAX_STRUCTURED_BATCH},400);
  const ids=[];
  try{
    for(const item of items){
      if(String(item?.status)!=='published'||String(item?.review?.status)!=='approved'||String(item?.review?.authority)!==FINAL_V1_AUTHORITY)throw new Error(`accepted_authority_missing:${item?.id||'unknown'}`);
      await upsertStructuredContent(env.DB,item);ids.push(String(item.id));
    }
    return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,authority:FINAL_V1_AUTHORITY,published:ids.length,ids});
  }catch(e){console.error('final_v1_structured_publish_failed',e?.message);return json({ok:false,error:'structured_publication_rejected',detail:String(e?.message||'unknown')},422)}
}
async function structuredPublicationStatus(env){
  try{
    await ensureStructuredContent(env.DB);
    const {results=[]}=await env.DB.prepare(`SELECT content_type,status,COUNT(*) count FROM structured_content GROUP BY content_type,status ORDER BY content_type,status`).all();
    const accepted=await env.DB.prepare(`SELECT COUNT(*) count FROM structured_content WHERE status='published' AND json_extract(review_json,'$.authority')=?`).bind(FINAL_V1_AUTHORITY).first();
    const acceptedRecipes=await env.DB.prepare(`SELECT COUNT(*) count FROM structured_content WHERE content_type='recipe' AND status='published' AND json_extract(review_json,'$.authority')=?`).bind(FINAL_V1_AUTHORITY).first();
    const acceptedExercises=await env.DB.prepare(`SELECT COUNT(*) count FROM structured_content WHERE content_type='exercise' AND status='published' AND json_extract(review_json,'$.authority')=?`).bind(FINAL_V1_AUTHORITY).first();
    return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,authority:FINAL_V1_AUTHORITY,acceptedPublished:Number(accepted?.count||0),acceptedRecipes:Number(acceptedRecipes?.count||0),acceptedExercises:Number(acceptedExercises?.count||0),counts:results.map(x=>({content_type:x.content_type,status:x.status,count:Number(x.count||0)}))});
  }catch(e){console.error('structured_publication_status_failed',e?.message);return json({ok:false,error:'structured_publication_status_unavailable'},503)}
}
async function commissioningIdentity(request){const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();if(!token)return{ok:false};return verifyGithubOidc(token)}
function safe(v){try{return JSON.parse(String(v||'{}'))}catch{return{}}}
