// Static-origin cache repair: eight reviewed public stylesheets; all asset hashes retained.
// No Worker deployment, customer writes, HTML edits, member stylesheet or global cache rule.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import path from 'node:path';
const paths=['/assets/shift-recovery-v6.css','/assets/shift-calculator-flow-v1.css','/assets/ask-timber-drawer-v2.css','/seo-wave2-v15.css','/assets/v136-desolation-recovery.css','/assets/v137-estate-closeout.css','/assets/header-navigation-v2.css','/assets/shift-service-bridge-v1.css'];
const protectedPaths=['/index.html','/start-here.html','/tools/bmi.html'];
const memberStyle='/assets/my-timber-pwa.css';
const account='9e5386dcf455be34c582d93f8bfc79e6',project='/accounts/'+account+'/pages/projects/projectshift';
const expectedBaseline='cd784241-1041-4536-8775-409e635f147b';
const directory=path.resolve(process.argv[3]||'release/public-css-cache-20261008');
mkdirSync(directory,{recursive:true});
const save=(name,value)=>writeFileSync(path.join(directory,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
const load=name=>JSON.parse(readFileSync(path.join(directory,name),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const configuration=readFileSync(path.join(homedir(),'Library/Preferences/.wrangler/config/default.toml'),'utf8');
const token=configuration.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
assert(token,'Existing release credential unavailable');
async function api(relative,init={}){
 const response=await fetch('https://api.cloudflare.com/client/v4'+relative,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(30000)});
 const result=await response.json();
 assert(response.ok&&result.success,'Provider operation failed: '+response.status);
 return result.result;
}
async function publicRead(url){
 const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,url);
 const body=await response.text();
 return {sha256:hash(body),status:response.status,type:response.headers.get('content-type'),cache:response.headers.get('cache-control'),security:Object.fromEntries(['content-security-policy','x-content-type-options','x-frame-options','referrer-policy'].map(name=>[name,response.headers.get(name)]))};
}
const cache='public, max-age=300, must-revalidate';
const headers=paths.map(p=>p+'\n  Cache-Control: '+cache+'\n').join('\n');
async function checkPreview(preview,baseline){
 const {files}=await api(project+'/deployments/'+preview.id+'/files');
 assert.deepEqual(files,load('manifest.json'),'Deployment asset manifest changed');
 const checks=[];
 for(const p of [...paths,...protectedPaths]){
  const before=baseline.origin[p],after=await publicRead(preview.url+p);
  assert.equal(after.sha256,before.sha256,'Asset bytes changed: '+p);
  assert.equal(after.type,before.type,'Content type changed: '+p);
  assert.deepEqual(after.security,before.security,'Security headers changed: '+p);
  if(paths.includes(p))assert.equal(after.cache,cache,'Preview cache did not apply: '+p);
  else assert.equal(after.cache,before.cache,'Protected cache changed: '+p);
  checks.push({path:p,...after,assetBytesPreserved:true});
 }
 return checks;
}
async function prepare(){
 assert(!existsSync(path.join(directory,'baseline.json')),'Evidence directory already used');
 const p=await api(project),d=p.canonical_deployment;
 assert.equal(d.id,expectedBaseline,'Static origin changed; capture a fresh authorised baseline');
 assert.equal(d.uses_functions,false,'Functions require an independent preservation proof');
 const {files}=await api(project+'/deployments/'+d.id+'/files');
 assert.equal(Object.keys(files).length,876);
 for(const x of [...paths,...protectedPaths])assert(files[x],'Missing asset: '+x);
 assert(!Object.keys(files).some(x=>/^\/(?:_headers|_redirects|_routes.json|_worker.js)$/.test(x)),'Unexpected routing configuration');
 // This exact baseline was published by the recorded nine-tool manifest-only release.
 // Its publish form contained no header, redirect, function or routing configuration.
 const origin={};
 for(const x of [...paths,...protectedPaths])origin[x]=await publicRead(d.url+x);
 for(const x of paths)assert.match(origin[x].type,/^text\/css(?:;|$)/);
 const memberStyleBefore=await publicRead('https://shiftsometimber.co.uk'+memberStyle);
 assert.equal(memberStyleBefore.cache,'no-store','Member stylesheet cache boundary changed');
 save('baseline.json',{id:d.id,url:d.url,branch:p.production_branch,origin,memberStyleBefore});
 save('manifest.json',files);save('_headers',headers);
 const form=new FormData();
 form.set('manifest',JSON.stringify(files));
 form.set('_headers',new Blob([headers],{type:'text/plain'}),'_headers');
 form.set('branch','public-css-cache-review-20261008');
 form.set('commit_message','Review eight public stylesheet cache headers; retain all 876 assets');
 form.set('commit_dirty','false');
 assert.equal((await api(project)).canonical_deployment.id,d.id,'Production changed before preview');
 const preview=await api(project+'/deployments',{method:'POST',body:form});
 save('preview.json',{id:preview.id,url:preview.url});
 console.log(JSON.stringify({stage:'preview_submitted',id:preview.id,url:preview.url}));
}
async function verify(){
 const baseline=load('baseline.json'),preview=load('preview.json');
 const checks=await checkPreview(preview,baseline);
 const current=(await api(project)).canonical_deployment;
 assert.equal(current.id,baseline.id,'Production changed during preview');
 save('preview-proof.json',{at:new Date().toISOString(),baseline:baseline.id,preview:preview.id,assetHashesPreserved:876,changedCssHeaders:paths.length,protectedPaths,checks});
 console.log(JSON.stringify({stage:'preview_verified',assetHashesPreserved:876,changedCssHeaders:paths.length,protectedPaths}));
}
async function publish(){
 assert(!existsSync(path.join(directory,'production.json')),'Production receipt exists; verify instead');
 const baseline=load('baseline.json'),preview=load('preview.json');
 await checkPreview(preview,baseline);
 assert.equal((await api(project)).canonical_deployment.id,baseline.id,'Production changed; rebase required');
 const form=new FormData();
 form.set('manifest',JSON.stringify(load('manifest.json')));
 form.set('_headers',new Blob([readFileSync(path.join(directory,'_headers'),'utf8')],{type:'text/plain'}),'_headers');
 form.set('branch',baseline.branch);form.set('commit_message','Eight verified public stylesheet cache headers; all assets preserved');form.set('commit_dirty','false');
 const production=await api(project+'/deployments',{method:'POST',body:form});
 save('production.json',{id:production.id,url:production.url});
 console.log(JSON.stringify({stage:'production_submitted',id:production.id,url:production.url}));
}
async function verifyLive(){
 const baseline=load('baseline.json'),production=load('production.json');
 assert.equal((await api(project)).canonical_deployment.id,production.id,'Another origin release followed this repair');
 const checks=await checkPreview(production,baseline),live=[];
 for(const p of paths){
  const result=await publicRead('https://shiftsometimber.co.uk'+p);
  assert.equal(result.sha256,baseline.origin[p].sha256,'Public CSS bytes changed');
  assert.equal(result.cache,cache,'Public cache not repaired: '+p);
  live.push({path:p,...result});
 }
 const memberStyleAfter=await publicRead('https://shiftsometimber.co.uk'+memberStyle);
 assert.deepEqual(memberStyleAfter,baseline.memberStyleBefore,'Member stylesheet changed');
 const {files}=await api(project+'/deployments/'+production.id+'/files');assert.deepEqual(files,load('manifest.json'),'Asset manifest changed');
 save('live-proof.json',{at:new Date().toISOString(),production:production.id,assetHashesPreserved:876,originChecks:checks,liveChecks:live});
 console.log(JSON.stringify({stage:'live_verified',production:production.id,assetHashesPreserved:876,publicStylesheets:live.length}));
}
const modes={prepare,verify,publish,'verify-live':verifyLive};assert(modes[process.argv[2]],'Unknown stage');await modes[process.argv[2]]();
