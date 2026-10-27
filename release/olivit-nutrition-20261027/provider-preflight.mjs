// Read-only inventory for the authorised Health / Nutrition release.
import assert from 'node:assert/strict';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
async function get(path){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN}});const j=await r.json();assert(r.ok&&j.success,'Cloudflare read failed: '+r.status+' '+JSON.stringify(j.errors?.map(x=>({code:x.code,message:x.message}))));return j.result;}
const routes=await get('/zones/'+zone+'/workers/routes');
console.log('ROUTE_COUNT',routes.length);
console.log('RELEVANT_ROUTES',JSON.stringify(routes.filter(x=>/shift-health|hq\.|\/v1\/hq|\/hq\//.test(x.pattern))));
for(const script of ['shift-core','shift-hq','shift-hq-member-comms-20261023']){
 try{const s=await get('/accounts/'+account+'/workers/scripts/'+script+'/settings');console.log('BINDINGS',script,JSON.stringify((s.bindings||[]).filter(x=>['service','d1','assets'].includes(x.type))));}
 catch(e){console.log('READ_FAILED',script,e.message);}
}
