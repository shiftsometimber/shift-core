import {dayGuideRuntime,dayGuideStyles} from './day-guide.mjs';
import {sessionRuntime} from './session-state.mjs';
import {memberClient} from './client.mjs';
import {checkinFollowupRuntime} from './checkin-followup-client.mjs';
import {memberChromeStyles,memberChromeClient,lifeBackChrome} from './chrome.mjs';
import {withPublicTicker} from '../public-navigation-policy.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import {healthRuntime} from './health-runtime.mjs';
import {fitRuntime} from './fit-approved-runtime.mjs';
import {grubRuntime} from './grub-runtime.mjs';
import lifeBackAssets from './life-back-assets.mjs';
import {grubImages} from './grub-image-map.mjs';
import {homeStyles} from './home-styles.mjs';
import homeArt from './home-art.mjs';
const origin='https://shiftsometimber.co.uk';
const evidence={checkedAt:new Date().toISOString(),assets:[],auth:[]};
{
 const r=await fetch(origin+'/member/dashboard',{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);
 const html=await r.text();assert.match(html,/\/member-my-timber-problem-v1\.js\?v=member-walk-20260920/);assert.match(html,/\/assets\/member-experience\/home\.css/);
 assert.match(r.headers.get('Cache-Control')||'',/no-store/);
 evidence.dashboard={status:r.status,versionedToday:true,masterStyles:true};
}
for(const [path,expected] of [['/assets/member-experience/day-guide.css',Buffer.from(dayGuideStyles)],['/assets/member-experience/chrome.css',Buffer.from(memberChromeStyles)],['/assets/member-experience/home.css',Buffer.from(homeStyles)],['/assets/member-experience/home-art.webp',Buffer.from(homeArt.split(',')[1],'base64')]]){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);
 const actual=Buffer.from(await r.arrayBuffer());assert.deepEqual(actual,expected,path+' must match the approved master');
 evidence.assets.push({path,status:r.status,sha256:createHash('sha256').update(actual).digest('hex'),matchesSource:true});
}
for(const [name,expected] of [['day-guide',dayGuideRuntime],['session',sessionRuntime],['v1',memberClient],['checkin-followup',checkinFollowupRuntime],['chrome',memberChromeClient],['health',healthRuntime],['fit',fitRuntime],['grub',grubRuntime]]){
 const path='/assets/member-experience/'+name+'.mjs';
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,path);
 assert.match(r.headers.get('content-type')||'',/javascript/);
 const actual=await r.text();
 assert.equal(actual,expected,path+' must match the deployed source exactly');
 evidence.assets.push({path,status:r.status,sha256:createHash('sha256').update(actual).digest('hex'),matchesSource:true});
}
for(const [name,asset] of Object.entries(lifeBackAssets)){
 const path=name==='index.html'?'/member/life-back':'/assets/member-experience/life-back/'+name;
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);assert.ok((r.headers.get('content-type')||'').includes(asset.type),path+' MIME');
 const actual=Buffer.from(await r.arrayBuffer());
 let expected=asset.base64?Buffer.from(asset.base64,'base64'):Buffer.from(name==='index.html'?lifeBackChrome(asset.body,/"WORK_V1_ENABLED"\s*:\s*"true"/.test(readFileSync('wrangler.jsonc','utf8'))):asset.body);
 if(name==='index.html'){
  // The live Worker applies this exact response wrapper after member rendering.
  // Member tickers stay excluded; the approved contrast style still applies.
  // Generate the complete expected response rather than strip or ignore a diff.
  const rendered=await withPublicTicker(new Request(origin+path),new Response(expected,{headers:{'Content-Type':asset.type}}));
  expected=Buffer.from(await rendered.arrayBuffer());
 }
 assert.deepEqual(actual,expected,path+' must match exact rendered source');
 evidence.assets.push({path,status:r.status,sha256:createHash('sha256').update(actual).digest('hex'),expectedSha256:createHash('sha256').update(expected).digest('hex'),matchesSource:true});
}
{
 const path='/member-my-timber-problem-v1.js?v=member-walk-20260920',r=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);
 const actual=await r.text();assert.equal(actual,readFileSync('frontend/member/member-my-timber-problem-v1.js','utf8'),path+' must match source');
 evidence.assets.push({path,status:r.status,sha256:createHash('sha256').update(actual).digest('hex'),matchesSource:true});
}
{
 const path='/member-my-journey-v2.js',r=await fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);
 assert.match(r.headers.get('content-type')||'',/javascript/);
 assert.equal(r.headers.get('x-shift-frontend-authority'),'git:frontend/member'+path,path+' must use the repaired Git asset');
 const actual=Buffer.from(await r.arrayBuffer()),expected=readFileSync('frontend/member'+path);assert.deepEqual(actual,expected,path+' must match source exactly');
 evidence.assets.push({path,status:r.status,sha256:createHash('sha256').update(actual).digest('hex'),matchesSource:true,authority:r.headers.get('x-shift-frontend-authority')});
}
for(const asset of grubImages){
 const r=await fetch(origin+asset.src,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,asset.src);
 assert.match(r.headers.get('content-type')||'',/image\/webp/);
 const sha256=createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');
 assert.equal(sha256,asset.sha256,asset.src+' must match the approved image');
 evidence.assets.push({path:asset.src,status:r.status,sha256,matchesSource:true});
}
for(const path of ['/v1/check-ins','/v1/fit/activity','/v1/grub/workspace','/v1/life-back']){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000),redirect:'manual'});
 assert.equal(r.status,401,path+' must reject an unauthenticated request');
 evidence.auth.push({path,status:r.status});
}
writeFileSync('member-live-proof.json',JSON.stringify(evidence,null,2));
console.log('PASS: live Life Back, Today, Journey V2, health, Fit and Grub assets exactly match release source; new account routes reject unauthenticated requests.');
