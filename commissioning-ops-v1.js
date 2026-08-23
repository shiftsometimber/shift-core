import {verifyGithubOidc} from './commissioning-identity-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {progressStaticPatch} from './progress-static-patch-v1.js';
const COMMISSIONING_OPS_VERSION='final-v1-worker-publication-v1-20260815';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-shift-commissioning-ops':COMMISSIONING_OPS_VERSION}});
export async function commissioningOpsRoutes(request,env){
  const progressAsset=await progressStaticPatch(request);if(progressAsset)return progressAsset;
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  const fitAsset=await fitPremiumAsset(request,env,p);if(fitAsset)return fitAsset;
  const radar=p==='/v1/commissioning/radar-scan'&&request.method==='POST';
  const productEvents=p==='/v1/commissioning/product-events'&&request.method==='GET';
  const finalV1Publication=p==='/v1/commissioning/final-v1-publication'&&request.method==='POST';
  if(!radar&&!productEvents&&!finalV1Publication)return null;
  const identity=await commissioningIdentity(request);if(!identity.ok)return json({ok:false,error:'unauthorised',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},401);
  if(radar){const result=await runRadarScheduledScan(env);return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,radar:result})}
  if(finalV1Publication)return publishFinalV1(request,env,identity);
  const userId=Number(u.searchParams.get('userId')||0),hours=Math.max(1,Math.min(24,Number(u.searchParams.get('hours')||1)));
  if(!Number.isInteger(userId)||userId<=0)return json({ok:false,error:'invalid_user_id',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},400);
  try{
    const {results=[]}=await env.DB.prepare(`SELECT id,event_name,surface,source,properties_json,occurred_at FROM product_events WHERE user_id=? AND occurred_at>=datetime('now',?) ORDER BY id ASC`).bind(userId,`-${hours} hours`).all();
    return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,userId,windowHours:hours,events:results.map(x=>({id:Number(x.id),event_name:x.event_name,surface:x.surface,source:x.source,properties:safe(x.properties_json),occurred_at:x.occurred_at}))});
  }catch(e){console.error('commissioning_product_events_failed',e?.message);return json({ok:false,error:'analytics_evidence_unavailable',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},503)}
}
async function publishFinalV1(request,env,identity){
  try{
    const body=await request.json();
    const sourceSha=String(body?.source_sha||'');
    const proof=String(body?.proof||'');
    const items=Array.isArray(body?.items)?body.items:[];
    if(!/^[0-9a-f]{40}$/.test(sourceSha)||proof!=='FINAL_V1_WORKER_PUBLICATION_PAYLOAD_V1')return json({ok:false,error:'invalid_publication_authority'},400);
    if(items.length!==2124)return json({ok:false,error:'invalid_publication_count',count:items.length},400);
    const ids=new Set(),rows=[];let recipes=0,exercises=0;
    for(const item of items){
      const id=String(item?.id||''),contentType=String(item?.content_type||''),title=String(item?.title||''),status=String(item?.status||''),dataJson=String(item?.data_json||''),reviewJson=String(item?.review_json||'');
      if(!id||ids.has(id)||!title||status!=='published'||!['recipe','exercise'].includes(contentType))return json({ok:false,error:'invalid_publication_row',id},400);ids.add(id);
      let data,review;try{data=JSON.parse(dataJson);review=JSON.parse(reviewJson)}catch{return json({ok:false,error:'invalid_publication_json',id},400)}
      if(data?.provenance?.final_v1_acceptance?.accepted!==true||review?.status!=='approved'||review?.final_v1!==true)return json({ok:false,error:'unaccepted_publication_row',id},400);
      if(contentType==='recipe')recipes++;else exercises++;
      rows.push({id,contentType,title,dataJson,reviewJson});
    }
    if(recipes!==798||exercises!==1326)return json({ok:false,error:'invalid_publication_partition',recipes,exercises},400);
    const statements=[env.DB.prepare(`CREATE TABLE IF NOT EXISTS structured_content (id TEXT PRIMARY KEY,content_type TEXT NOT NULL,title TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'draft',data_json TEXT NOT NULL,review_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_structured_content_type_status ON structured_content(content_type,status)`),...publicationStatements(env.DB,rows)];
    if(typeof env.DB.batch!=='function')return json({ok:false,error:'transactional_batch_unavailable'},503);
    await env.DB.batch(statements);
    const count=await env.DB.prepare(`SELECT COUNT(*) AS c FROM structured_content WHERE status='published' AND json_extract(data_json,'$.provenance.final_v1_acceptance.accepted')=1 AND json_extract(review_json,'$.final_v1')=1`).first();
    const partition=await env.DB.prepare(`SELECT content_type,COUNT(*) AS c FROM structured_content WHERE status='published' AND json_extract(data_json,'$.provenance.final_v1_acceptance.accepted')=1 AND json_extract(review_json,'$.final_v1')=1 GROUP BY content_type ORDER BY content_type`).all();
    if(Number(count?.c)!==2124)return json({ok:false,error:'publication_verification_failed',count:Number(count?.c||0)},503);
    return json({ok:true,proof:'FINAL_V1_WORKER_D1_PUBLICATION_V1',source_sha:sourceSha,commissioningIdentity:'github_actions_oidc',workflow_ref:identity.claims?.workflow_ref||'',published:2124,recipes,exercises,partition:partition.results||[]});
  }catch(e){console.error('final_v1_worker_publication_failed',e?.message);return json({ok:false,error:'final_v1_publication_failed',detail:String(e?.message||e).slice(0,300)},503)}
}
function publicationStatements(DB,rows){const out=[],size=15;for(let i=0;i<rows.length;i+=size){const chunk=rows.slice(i,i+size),values=chunk.map(()=>'(?,?,?,1,\'published\',?,?,CURRENT_TIMESTAMP)').join(','),sql=`INSERT INTO structured_content(id,content_type,title,version,status,data_json,review_json,updated_at) VALUES ${values} ON CONFLICT(id) DO UPDATE SET content_type=excluded.content_type,title=excluded.title,version=structured_content.version+1,status='published',data_json=excluded.data_json,review_json=excluded.review_json,updated_at=CURRENT_TIMESTAMP`,bind=[];for(const r of chunk)bind.push(r.id,r.contentType,r.title,r.dataJson,r.reviewJson);out.push(DB.prepare(sql).bind(...bind))}return out}
async function fitPremiumAsset(request,env,path){
  const acceptedPath=/^(?:\/fit-premium\/|\/assets\/fit\/premium\/)[a-z0-9-]+\.svg$/.test(path);
  if(request.method!=='GET'||!acceptedPath||!env.MEMBER_ASSETS)return null;
  const asset=await env.MEMBER_ASSETS.fetch(new Request(`https://member-assets.local${path}`,{method:'GET'}));
  if(!asset.ok)return new Response('fit premium asset unavailable',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
  const h=new Headers(asset.headers);h.set('content-type','image/svg+xml; charset=utf-8');h.set('cache-control','public, max-age=3600, must-revalidate');h.set('x-content-type-options','nosniff');h.set('x-shift-fit-visual-authority',`git:frontend/member${path}`);
  return new Response(asset.body,{status:200,headers:h});
}
async function commissioningIdentity(request){const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();if(!token)return{ok:false};return verifyGithubOidc(token)}
function safe(v){try{return JSON.parse(String(v||'{}'))}catch{return{}}}
