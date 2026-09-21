// Request-level hosted regression, not a claim of physical-iPhone acceptance.
// Creates one fictional session; no push subscription, permission or send.
import assert from 'node:assert/strict';
const origin=process.env.PREVIEW_URL;
assert.equal(origin,'https://shift-my-timber-pwa-preview.matobrien.workers.dev');
const landing=await fetch(origin+'/');assert.equal(landing.status,200);
assert.equal(landing.headers.get('Referrer-Policy'),'same-origin');
let cookie;
try{
 for(const value of [undefined,'null','https://foreign.example.invalid']){
  const r=await fetch(origin+'/__preview/start',{method:'POST',headers:value?{Origin:value}:{},redirect:'manual'});
  assert.equal(r.status,403);assert.equal(r.headers.get('Set-Cookie'),null);
 }
 const start=await fetch(origin+'/__preview/start',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:'',redirect:'manual'});
 assert.equal(start.status,303);cookie=start.headers.get('Set-Cookie')?.split(';')[0];assert(cookie?.startsWith('sst_session='));
 const dashboard=await fetch(origin+'/member/dashboard',{headers:{Cookie:cookie}});assert.equal(dashboard.status,200);assert((await dashboard.text()).includes('Send test notification'));
 const status=await fetch(origin+'/v1/my-timber-pwa/status',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(status.status,200);assert.equal((await status.json()).enabled,false);
 const repeat=await fetch(origin+'/__preview/start',{method:'POST',headers:{Origin:origin,Cookie:cookie},redirect:'manual'});assert.equal(repeat.status,303);
 console.log('PASS: deployed entry policy, rejected foreign/null/missing origins, fixture session, dashboard and default-off settings. No push sent.');
}finally{
 if(cookie){const finish=await fetch(origin+'/__preview/finish',{method:'POST',headers:{Origin:origin,Cookie:cookie},redirect:'manual'});assert.equal(finish.status,303);assert(finish.headers.get('Set-Cookie')?.includes('Max-Age=0'));console.log('PASS: this verification fixture was removed; no other reviewer records targeted.');}
}
