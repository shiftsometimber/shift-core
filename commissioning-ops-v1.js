import {verifyGithubOidc} from './commissioning-identity-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {progressStaticPatch} from './progress-static-patch-v1.js';
const COMMISSIONING_OPS_VERSION='m04-product-events-v2-20260814';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-shift-commissioning-ops':COMMISSIONING_OPS_VERSION}});
export async function commissioningOpsRoutes(request,env){
  const progressAsset=await progressStaticPatch(request);if(progressAsset)return progressAsset;
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  const fitAsset=await fitPremiumAsset(request,env,p);if(fitAsset)return fitAsset;
  const radar=p==='/v1/commissioning/radar-scan'&&request.method==='POST';
  const productEvents=p==='/v1/commissioning/product-events'&&request.method==='GET';
  if(!radar&&!productEvents)return null;
  const identity=await commissioningIdentity(request);if(!identity.ok)return json({ok:false,error:'unauthorised',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},401);
  if(radar){const result=await runRadarScheduledScan(env);return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,radar:result})}
  const userId=Number(u.searchParams.get('userId')||0),hours=Math.max(1,Math.min(24,Number(u.searchParams.get('hours')||1)));
  if(!Number.isInteger(userId)||userId<=0)return json({ok:false,error:'invalid_user_id',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},400);
  try{
    const {results=[]}=await env.DB.prepare(`SELECT id,event_name,surface,source,properties_json,occurred_at FROM product_events WHERE user_id=? AND occurred_at>=datetime('now',?) ORDER BY id ASC`).bind(userId,`-${hours} hours`).all();
    return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,userId,windowHours:hours,events:results.map(x=>({id:Number(x.id),event_name:x.event_name,surface:x.surface,source:x.source,properties:safe(x.properties_json),occurred_at:x.occurred_at}))});
  }catch(e){console.error('commissioning_product_events_failed',e?.message);return json({ok:false,error:'analytics_evidence_unavailable',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},503)}
}
async function fitPremiumAsset(request,env,path){
  if(request.method!=='GET'||!/^\/fit-premium\/[a-z0-9-]+\.svg$/.test(path)||!env.MEMBER_ASSETS)return null;
  const asset=await env.MEMBER_ASSETS.fetch(new Request(`https://member-assets.local${path}`,{method:'GET'}));
  if(!asset.ok)return new Response('fit premium asset unavailable',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
  const h=new Headers(asset.headers);h.set('content-type','image/svg+xml; charset=utf-8');h.set('cache-control','public, max-age=3600, must-revalidate');h.set('x-content-type-options','nosniff');h.set('x-shift-fit-visual-authority',`git:frontend/member${path}`);
  return new Response(asset.body,{status:200,headers:h});
}
async function commissioningIdentity(request){const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();if(!token)return{ok:false};return verifyGithubOidc(token)}
function safe(v){try{return JSON.parse(String(v||'{}'))}catch{return{}}}
