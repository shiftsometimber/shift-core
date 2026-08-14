import {verifyGithubOidc} from './commissioning-identity-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {progressStaticPatch} from './progress-static-patch-v1.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function commissioningOpsRoutes(request,env){
  const progressAsset=await progressStaticPatch(request);if(progressAsset)return progressAsset;
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  const radar=p==='/v1/commissioning/radar-scan'&&request.method==='POST';
  const productEvents=p==='/v1/commissioning/product-events'&&request.method==='GET';
  if(!radar&&!productEvents)return null;
  const identity=await commissioningIdentity(request);if(!identity.ok)return json({ok:false,error:'unauthorised'},401);
  if(radar){const result=await runRadarScheduledScan(env);return json({ok:true,commissioningIdentity:'github_actions_oidc',radar:result})}
  const userId=Number(u.searchParams.get('userId')||0),hours=Math.max(1,Math.min(24,Number(u.searchParams.get('hours')||1)));
  if(!Number.isInteger(userId)||userId<=0)return json({ok:false,error:'invalid_user_id'},400);
  try{
    const {results=[]}=await env.DB.prepare(`SELECT id,event_name,surface,source,properties_json,occurred_at FROM product_events WHERE user_id=? AND occurred_at>=datetime('now',?) ORDER BY id ASC`).bind(userId,`-${hours} hours`).all();
    return json({ok:true,commissioningIdentity:'github_actions_oidc',userId,windowHours:hours,events:results.map(x=>({id:Number(x.id),event_name:x.event_name,surface:x.surface,source:x.source,properties:safe(x.properties_json),occurred_at:x.occurred_at}))});
  }catch(e){console.error('commissioning_product_events_failed',e?.message);return json({ok:false,error:'analytics_evidence_unavailable'},503)}
}
async function commissioningIdentity(request){const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();if(!token)return{ok:false};return verifyGithubOidc(token)}
function safe(v){try{return JSON.parse(String(v||'{}'))}catch{return{}}}