import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {stripMentalHealthTicker} from './ticker.mjs';

const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const script='shift-mytimber-support-20261023',branch='codex/mental-health-pathway-20261023';
const predecessor='81ef613101a2c86104b3a7f803fc7c03a5e342c0';
const baseline={deployment:'28d78060-a3ea-45f0-b678-b33da6c656ef',version:'240a70f5-f8b3-4d18-8f8d-11140c65d1b2',bytes:324173,sha256:'abcf7601e2003ca6ca290c70d814dbece0d9fa8c1689f34971a1f892213da0fc'};
const root='/accounts/'+account+'/workers/',dir='mental-health-ticker-release';
const digest=value=>createHash('sha256').update(value).digest('hex');
mkdirSync(dir,{recursive:true});
const save=(name,value)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
const load=name=>JSON.parse(readFileSync(dir+'/'+name+'.json'));
async function cf(path,method='GET',body){
  const multipart=body instanceof FormData;
  const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body&&!multipart?{'Content-Type':'application/json'}:{})},body:body?(multipart?body:JSON.stringify(body)):undefined,signal:AbortSignal.timeout(45000)});
  const j=await r.json();assert(r.ok&&j.success,'Provider '+method+' failed: '+JSON.stringify(j.errors));return j.result;
}
const routeList=()=>cf('/zones/'+zone+'/workers/routes');
const schedules=()=>cf(root+'scripts/'+script+'/schedules');
const version=id=>cf(root+'workers/'+script+'/versions/'+id+'?include=modules');
async function active(name=script){const result=await cf(root+'scripts/'+name+'/deployments');const row=result.deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert.equal(row.versions.length,1);assert.equal(row.versions[0].percentage,100);return row;}
async function retained(){const names=['shift-core','shift-blog-publisher','shift-programme-member-20261023','shift-mental-health-pathway-20261023','shift-hq-member-comms-20261023','shift-health-nutrition-20261027','shift-public-presentation-batch-20261022'];return Object.fromEntries(await Promise.all(names.map(async name=>[name,(await active(name)).id])));}
async function sourceCurrent(){
  assert.equal(process.env.GITHUB_REF,'refs/heads/'+branch);
  const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/'+branch,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(30000)});
  assert(r.ok,'Source lease unavailable');assert.equal((await r.json()).object.sha,process.env.GITHUB_SHA,'Source changed during correction');
  const allowed=['mental-health-pathway/member/worker.mjs','mental-health-pathway/ticker.mjs','mental-health-pathway/ticker.test.mjs','mental-health-pathway/ticker-release.mjs','mental-health-pathway/ticker-browser.cjs','.github/workflows/good-to-talk-ticker-20261027.yml'];
  const paths=execFileSync('git',['diff','--name-only',predecessor,'HEAD'],{encoding:'utf8'}).trim().split('\n');
  assert.deepEqual(paths.toSorted(),allowed.toSorted(),'Only the ticker correction and its release may change');
  const memberSource=readFileSync('mental-health-pathway/member/worker.mjs','utf8');
  assert.equal(memberSource.split('html=stripMentalHealthTicker(html);').length,2,'Editable source must retain the same correction');
}
function moduleBytes(record){assert.equal(record.modules.length,1);assert.equal(record.main_module,'worker.js');assert.equal(record.modules[0].name,'worker.js');return Buffer.from(record.modules[0].content_base64,'base64');}
async function publicPage(path){const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);return {html:await r.text(),headers:Object.fromEntries(r.headers)};}
async function stagedVersion(){const state=load('staged'),v=await version(state.versionId);assert.equal(digest(moduleBytes(v)),state.candidateSHA256);return {state,v};}
async function promoteVersion(id,message){return cf(root+'scripts/'+script+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}});}
async function unchanged(state){assert.deepEqual(await routeList(),state.routes,'Route assignments changed');assert.deepEqual(await schedules(),state.schedules,'Reminder schedule changed');assert.deepEqual(await retained(),state.retained,'An independent service changed');}

const action=process.argv[2];
if(action==='prepare'){
  await sourceCurrent();const before=await active();assert.equal(before.id,baseline.deployment,'Serving component moved since inspection');assert.equal(before.versions[0].version_id,baseline.version);
  const v=await version(baseline.version),bytes=moduleBytes(v);assert.equal(bytes.length,baseline.bytes);assert.equal(digest(bytes),baseline.sha256,'Exact serving bytes required');
  const text=bytes.toString('utf8'),hook='function enhanceHub(html) {\n',next=hook+'  html = stripMentalHealthTicker(html);\n';
  assert.equal(text.split(hook).length,2,'One native public-hub function required');assert(!text.includes('stripMentalHealthTicker'));
  const suffix='\n// Good to Talk ticker exclusion, 27 October 2026.\n'+stripMentalHealthTicker.toString()+'\n';
  const candidate=text.replace(hook,next)+suffix;
  assert.equal(candidate.slice(0,-suffix.length).replace(next,hook),text,'Every other deployed byte must remain identical');
  writeFileSync(dir+'/before.mjs',bytes);writeFileSync(dir+'/candidate.mjs',candidate);execFileSync(process.execPath,['--check',dir+'/candidate.mjs']);
  const previous=await import(pathToFileURL(resolve(dir+'/before.mjs'))),updated=await import(pathToFileURL(resolve(dir+'/candidate.mjs')));
  const page=await publicPage('/mens-mental-health');assert.equal((page.html.match(/<section\b[^>]*\bid="shift-public-news"/g)||[]).length,1,'Expected the observed single ticker');
  const previousHtml=previous.enhanceHub(page.html),expected=stripMentalHealthTicker(previousHtml);assert.notEqual(expected,previousHtml);assert.equal(updated.enhanceHub(page.html),expected);assert.equal(updated.enhanceHub(expected),expected);
  assert.equal(previous.enhanceDashboard(page.html),updated.enhanceDashboard(page.html),'Dashboard transform must remain identical');
  for(const path of ['/mens-mental-health','/mens-mental-health/','/mens-mental-health.html']){
    const mock={PATHWAY:{fetch:async()=>new Response(page.html,{headers:{'Content-Type':'text/html; charset=utf-8'}})}};
    const response=await updated.default.fetch(new Request('https://shiftsometimber.co.uk'+path),mock);
    assert.equal(response.status,200);assert.equal(await response.text(),expected,'Complete public response differs beyond ticker removal');
  }
  for(const path of ['/member/support','/member/support/client.js','/member/support/style.css','/member/support/dashboard.js']){
    const request=new Request('https://shiftsometimber.co.uk'+path);const old=await previous.default.fetch(request,{}),next=await updated.default.fetch(request,{});
    assert.equal(old.status,next.status);assert.deepEqual([...old.headers],[...next.headers]);assert.equal(await old.text(),await next.text(),'Private support content changed');
  }
  writeFileSync(dir+'/public-before.html',page.html);writeFileSync(dir+'/public-candidate.html',expected);
  const state={source:process.env.GITHUB_SHA,previousDeployment:before.id,previousVersion:baseline.version,candidateSHA256:digest(candidate),routes:await routeList(),schedules:await schedules(),retained:await retained()};
  const form=new FormData();form.append('metadata',JSON.stringify({main_module:v.main_module,compatibility_date:v.compatibility_date,compatibility_flags:v.compatibility_flags,bindings:v.bindings,usage_model:v.usage_model,annotations:{'workers/message':'Remove inherited news ticker from Good to Talk only','workers/commit_sha':process.env.GITHUB_SHA}}));
  form.append('worker.js',new Blob([candidate],{type:'application/javascript+module'}),'worker.js');
  const uploaded=await cf(root+'scripts/'+script+'/versions?bindings_inherit=strict','POST',form);assert.match(uploaded.id,/^[a-f0-9-]{36}$/);state.versionId=uploaded.id;save('staged',state);
  const staged=await version(state.versionId);assert.equal(digest(moduleBytes(staged)),state.candidateSHA256);assert.deepEqual(staged.bindings,v.bindings,'Bindings changed');assert.equal(staged.compatibility_date,v.compatibility_date);assert.deepEqual(staged.compatibility_flags,v.compatibility_flags);
  assert.equal((await active()).id,before.id,'Staging changed live traffic');await unchanged(state);
  save('pretraffic-verification',{ok:true,source:state.source,beforeSHA256:baseline.sha256,candidateSHA256:state.candidateSHA256,versionId:state.versionId,exactInverse:true,privateSupportResponsesUnchanged:true,hubAliases:3});
  console.log('PASS exact serving-byte inverse, three hub aliases, private support responses and unchanged bindings. Candidate staged without traffic.');
}else if(action==='promote'){
  await sourceCurrent();const {state}=await stagedVersion();assert.equal((await active()).id,state.previousDeployment,'Component moved during staging');await unchanged(state);
  save('promotion-intent',{versionId:state.versionId,previousVersion:state.previousVersion,source:state.source});
  await promoteVersion(state.versionId,'Approved Good to Talk ticker correction');assert.equal((await active()).versions[0].version_id,state.versionId);
  console.log('Promoted the existing Good to Talk component. No routes, data or schedules changed.');
}else if(action==='verify'){
  const {state}=await stagedVersion();assert.equal((await active()).versions[0].version_id,state.versionId);await unchanged(state);
  const expected=readFileSync(dir+'/public-candidate.html','utf8');
  for(const path of ['/mens-mental-health','/mens-mental-health/','/mens-mental-health.html']){
    const {html}=await publicPage(path);assert.equal(html,expected,'Live public response differs beyond the exact ticker removal: '+path);
    assert(!/<section\b[^>]*\bid=["']shift-public-news["']/.test(html));assert(!/src=["'][^"']*public-news-ticker-v1\.js/.test(html));
  }
  save('verified',{ok:true,source:state.source,versionId:state.versionId,candidateSHA256:state.candidateSHA256,hubAliasesVerified:3,exactPublicBodyPreserved:true,routesUnchanged:true,schedulesUnchanged:true,independentServicesUnchanged:true});
  console.log('PASS exact live response for all three Good to Talk aliases, ticker absent, seven independent services retained, routes and schedules unchanged.');
}else if(action==='rollback'){
  if(!existsSync(dir+'/promotion-intent.json')){console.log('No promotion intent; live traffic was not changed.');process.exit(0);}
  const state=load('staged'),current=await active();if(current.versions[0].version_id!==state.versionId){console.log('Current version is not owned by this release; no rollback performed.');process.exit(0);}
  await promoteVersion(state.previousVersion,'Restore captured Good to Talk component after failed correction verification');assert.equal((await active()).versions[0].version_id,state.previousVersion);save('rollback',{restored:true,versionId:state.previousVersion});console.log('Restored the captured component; data and schedules retained.');
}else throw Error('Expected prepare, promote, verify or rollback');
