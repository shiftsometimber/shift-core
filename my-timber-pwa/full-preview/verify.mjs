// API and rendered-source acceptance. Never substitutes for physical-device proof.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createECDH,randomBytes} from 'node:crypto';
const origin=process.env.PREVIEW_URL;assert.equal(origin,'https://shift-stabilisation-preview.matobrien.workers.dev');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json'));
const email='probe'+fixture.ids[0]+'@example.invalid';let cookies=[];
const checks=[];
async function api(path,body,method=body?'POST':'GET'){
 const r=await fetch(origin+path,{method,headers:{Origin:origin,Cookie:cookies.join('; '),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual'});
 const fresh=r.headers.getSetCookie();if(fresh.length)cookies=fresh.map(c=>c.split(';')[0]);
 return r;
}
try{
 let meta;for(let i=0;i<15;i++){meta=await(await api('/__preview/meta')).json();if(meta.source===process.env.GITHUB_SHA)break;await new Promise(resolve=>setTimeout(resolve,3000));}assert.equal(meta.source,process.env.GITHUB_SHA);assert.equal(meta.productionBindings,false);
 assert.equal((await api('/v1/my-timber-pwa/status',{})).status,401);
 assert.equal((await api('/v1/auth/login',{email,password:fixture.password})).status,200);
 const profile=await(await api('/v1/profile')).json();assert.equal(profile.profile.email,email);checks.push('real login and same-account profile');
 for(const path of ['/member/dashboard','/member/grub','/member/fit','/member/check-in','/member/settings','/member-login','/programme']){
  const r=await api(path);assert.equal(r.status,200,path);const html=await r.text();assert(html.includes('data-my-timber-app-footer'),path+' footer');
  if(path!=='/programme'){assert(html.includes('id="myTimberApp"'));assert(html.includes('href="/my-timber.webmanifest"'));}
 }
 checks.push('full account pages, public footer and same-origin manifest');
 assert.equal((await api('/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true})).status,201);
 assert((await api('/v1/check-ins',{mood:'Good',note:'Fictional PWA acceptance check-in'})).ok,'check-in creation succeeds');
 const saved=await(await api('/v1/check-ins')).json();assert(JSON.stringify(saved).includes('Fictional PWA acceptance check-in'));checks.push('check-in saved and read back');
 const initial=await(await api('/v1/my-timber-pwa/status',{})).json();assert.equal(initial.enabled,false);
 const key=createECDH('prime256v1');key.generateKeys();const endpoint='https://web.push.apple.com/nonexistent-full-preview-'+randomBytes(12).toString('hex');
 const subscription={endpoint,keys:{p256dh:key.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}};
 assert.equal((await api('/v1/my-timber-pwa/subscription',{subscription,hour:19},'PUT')).status,200);
 assert.equal((await(await api('/v1/my-timber-pwa/status',{endpoint})).json()).enabled,true);
 assert.equal((await api('/v1/auth/logout',{})).status,200);
 assert.equal((await api('/v1/my-timber-pwa/status',{endpoint})).status,401);
 assert.equal((await api('/v1/auth/login',{email,password:fixture.password})).status,200);
 assert.equal((await(await api('/v1/my-timber-pwa/status',{endpoint})).json()).enabled,false);
 assert(JSON.stringify(await(await api('/v1/check-ins')).json()).includes('Fictional PWA acceptance check-in'));
 assert.equal((await api('/v1/my-timber-pwa/subscription',{endpoint},'DELETE')).status,200);
 checks.push('device opt-in, logout blocks access, new session requires opt-in, saved check-in survives');
 const reset=await api('/reset-password');assert.equal(reset.status,200);assert((await reset.text()).includes('password'));checks.push('account recovery page available');
 const manifest=await(await api('/my-timber.webmanifest')).json();assert.equal(manifest.start_url,'/member/dashboard#today');assert.equal(manifest.display,'standalone');
 const dir='work/staging/generated/five-points-evidence/pwa';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/full-account.json',JSON.stringify({source:process.env.GITHUB_SHA,checks,productionWrites:0,notificationSends:0,physicalDeviceProof:false},null,2));console.log('PASS: '+checks.join('; '));
}finally{if(cookies.length)await api('/v1/auth/logout',{});}
