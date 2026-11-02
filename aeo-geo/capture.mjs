import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
const root='https://api.cloudflare.com/client/v4',token=process.env.CLOUDFLARE_API_TOKEN;
const api=async path=>{const r=await fetch(root+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});const j=await r.json();assert(r.ok&&j.success,'Read-only route inventory failed');return j.result};
const zones=await api('/zones?name=shiftsometimber.co.uk');assert.equal(zones.length,1);
const routes=await api('/zones/'+zones[0].id+'/workers/routes');
const owners={};
for(const route of routes){
 if(!/^(?:www\.)?shiftsometimber\.co\.uk\//.test(route.pattern)||!route.script)continue;
 const path=route.pattern.replace(/^(?:www\.)?shiftsometimber\.co\.uk/,'');
 if(/^\/(?:member|v1|api|hq|admin|auth|checkout|treatment-order|assets|fit-v3-images|images|email-templates|reset-password)/.test(path))continue;
 (owners[route.script]??=[]).push(route.pattern);
}
mkdirSync('aeo-geo-proof',{recursive:true});
const report={at:new Date().toISOString(),routeCount:routes.length,ownerCount:Object.keys(owners).length,publicOwners:owners,routeWrites:0};
writeFileSync('aeo-geo-proof/route-owners.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
