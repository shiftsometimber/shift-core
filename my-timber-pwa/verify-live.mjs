// Read-only production proof: no account creation, subscriptions or sends.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {manifest,pwaAssets} from './presentation.mjs';
const origin='https://shiftsometimber.co.uk',proof={source:process.env.GITHUB_SHA,at:new Date().toISOString(),checks:[],productionWrites:0,physicalAndroidVerified:false};
const sha=value=>createHash('sha256').update(value).digest('hex');
for(const path of ['/my-timber.webmanifest','/manifest.webmanifest','/assets/my-timber-pwa.js','/assets/my-timber-pwa.css','/shift-push-sw-v1.js']){
 const r=await fetch(origin+path);assert.equal(r.status,200,path);const body=await r.text();assert.equal(body,await pwaAssets(new Request(origin+path)).text(),path+' exact source');proof.checks.push({path,sha256:sha(body)});
 if(path==='/shift-push-sw-v1.js')assert.equal(r.headers.get('Service-Worker-Allowed'),'/');
}
assert.equal(manifest.start_url,'/member/dashboard#today');
for(const path of ['/','/programme','/shift-health','/treatment-centre','/member-login','/member/dashboard','/member/grub','/member/fit','/member/check-in']){
 const r=await fetch(origin+path);assert.equal(r.status,200,path);const body=await r.text();assert(body.includes('data-my-timber-app-footer'),path+' footer');
 if(path.startsWith('/member')){assert(body.includes('id="myTimberApp"'));assert(body.includes('href="/my-timber.webmanifest"'));}
 proof.checks.push({path,footer:true,setup:body.includes('id="myTimberApp"'),sha256:sha(body)});
}
const unauth=await fetch(origin+'/v1/my-timber-pwa/status',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(unauth.status,401);
const foreign=await fetch(origin+'/v1/my-timber-pwa/status',{method:'POST',headers:{Origin:'https://foreign.example.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(foreign.status,403);
proof.checks.push({anonymousStatus:401,foreignOrigin:403});
mkdirSync('b1-runtime-release',{recursive:true});const output=JSON.stringify(proof,null,2);writeFileSync('b1-runtime-release/pwa-live.json',output);writeFileSync('b1-runtime-release/pwa-live.sha256',sha(output)+'  pwa-live.json\n');
console.log('PASS: exact PWA assets, full-account launch, public/member footer and anonymous/origin boundaries. No notification sent.');
