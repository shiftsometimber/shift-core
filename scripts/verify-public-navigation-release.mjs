import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tickerAllowed,tickerVersion,tickerAsset} from '../public-navigation-policy.mjs';
const base='58280310a4780ba59f69413ebba40fdf34fa3551',release='1051225086ba078b41975c92f99ad03a4628dc5d';
const before=JSON.parse(readFileSync('proof/public-before.json')),after=JSON.parse(readFileSync('proof/public-after.json'));
const expectedChanges=new Set(['/programme','/shift-health','/treatment-centre','/explore-knowledge','/shop','/work-with-us']);
const expectedLegacyRemoval=new Set(['/about']);
assert.deepEqual(before.pages.map(p=>p.path),after.pages.map(p=>p.path));
console.log('Retained snapshot changes:',JSON.stringify(before.pages.map((b,i)=>({path:b.path,changed:after.pages[i].sha256!==b.sha256}))));
const rows=before.pages.map((b,i)=>{const a=after.pages[i];assert.equal(a.status,b.status,b.path);const changed=a.sha256!==b.sha256;assert.equal(changed,expectedChanges.has(b.path)||expectedLegacyRemoval.has(b.path),b.path+' unexpected change classification');return {path:b.path,changed,reason:expectedChanges.has(b.path)?'shared public ticker':expectedLegacyRemoval.has(b.path)?'remove excluded legacy ticker':'unchanged',before:b.sha256,after:a.sha256};});
const origin='https://shiftsometimber.co.uk',hash=s=>createHash('sha256').update(s).digest('hex');
for(const a of after.pages){
 const r=await fetch(origin+a.path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,a.path);const body=await r.text();assert.equal(hash(Buffer.from(body)),a.sha256,a.path+' changed since retained after-snapshot');
 if(expectedChanges.has(a.path)){
  assert.equal((body.match(/id="shift-public-news"/g)||[]).length,1,a.path);
  assert.ok(body.includes('data-shift-news-ticker="'+tickerVersion+'"'),a.path);
  assert.ok(body.includes(tickerAsset+'?v='+tickerVersion),a.path);
 }
 if(expectedLegacyRemoval.has(a.path)){
  assert.equal(tickerAllowed(a.path),false);
  assert.ok(body.includes('<style data-shift-public-news>.medicine-ticker-v138{display:none!important}</style>'),a.path+' must have the legacy-removal marker');
  assert.ok(!body.includes('id="shift-public-news"')&&!body.includes('/assets/newsroom-ticker-v2.js'),a.path+' must not retain a ticker');
 }
}
const original=execFileSync('git',['show',base+':worker-entry-v6.js'],{encoding:'utf8'});
const released=execFileSync('git',['show',release+':worker-entry-v6.js'],{encoding:'utf8'});
const first="import {withEditorialResources,STATS_PATH,RESOURCE_UPDATED} from './editorial-resources-v1.js';";
const line='    const path = requestUrl.pathname.replace(/\\/+$/, "") || "/";';
const expected=original.replace(first,first+"\nimport {myTimberRedirect,publicTickerAsset,withPublicTicker} from './public-navigation-policy.mjs';").replace('export default {','const worker = {').replace(line,line+'\n    const publicNavigation = myTimberRedirect(request) || publicTickerAsset(request);\n    if (publicNavigation) return publicNavigation;').trimEnd()+'\n\nexport default {\n  ...worker,\n  async fetch(request, env, ctx) {\n    return withPublicTicker(request, await worker.fetch(request, env, ctx));\n  },\n};';
assert.equal(released.trimEnd(),expected,'Worker changed beyond the scoped route/policy wrapper');
const redirectChecks=[];
for(const path of ['/my-timber','/my-timber/','/my-timber.html'])for(const method of ['GET','HEAD']){
 const r=await fetch(origin+path,{method,redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,301);assert.equal(r.headers.get('location'),origin+'/member/dashboard');redirectChecks.push({path,method,status:r.status,location:r.headers.get('location')});
}
const asset=await fetch(origin+tickerAsset+'?v='+tickerVersion);const js=await asset.text();assert.equal(asset.status,200);assert.ok(!js.includes('__name('),'browser script must not depend on bundler helpers');
const feed=await (await fetch(origin+'/v1/radar/ticker')).json();
const result={checkedAt:new Date().toISOString(),release,policy:tickerVersion,retainedSnapshots:{unchanged:rows.filter(r=>!r.changed).length,authorizedChanged:rows.filter(r=>r.changed).length,unexpectedChanged:0,rows},sourceChange:'exact route/policy wrapper only; existing worker source retained',redirectChecks,feed:{current:feed.current,status:feed.status,reasons:feed.freshness?.reasons},limits:'Changed-page hash classification alone does not establish whole-body equivalence. Exact Worker source-diff verification, transformer tests and rendered browser checks support the scope. Original checksum job remains failed because it disallowed the requested ticker changes.'};
writeFileSync('public-navigation-release-proof.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
