import {verifyGithubOidc} from './commissioning-identity-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {progressStaticPatch} from './progress-static-patch-v1.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export async function commissioningOpsRoutes(request,env){
  const progressAsset=await progressStaticPatch(request);if(progressAsset)return progressAsset;
  const p=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(p!=='/v1/commissioning/radar-scan')return null;
  if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();
  if(!token)return json({ok:false,error:'unauthorised'},401);
  const identity=await verifyGithubOidc(token);if(!identity.ok)return json({ok:false,error:'unauthorised'},401);
  const result=await runRadarScheduledScan(env);
  return json({ok:true,commissioningIdentity:'github_actions_oidc',radar:result});
}
