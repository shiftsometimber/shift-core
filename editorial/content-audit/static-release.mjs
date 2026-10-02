import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');
assert.equal(process.env.GITHUB_REF,'refs/heads/codex/full-website-content-20261002');
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const cf=async(path,method='GET')=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000)});const j=await r.json();assert(r.ok&&j.success,'Pages operation failed');return j.result;};
const git=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/git/refs/heads/main',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(20000)});assert(git.ok);assert.equal((await git.json()).object.sha,'c71060ac9129d3aea16dc824f9d6c79bb76cdcdd','Main runtime source moved');
const project=await cf('/pages/projects/projectshift');assert.equal(project.name,'projectshift');assert.equal(project.production_branch,'main');
const before=project.canonical_deployment;assert.equal(before.id,'546db9e5-9652-4e7c-a757-9d5c4eea2f86','Another public release superseded the reviewed baseline');
assert.equal(before.deployment_trigger.metadata.commit_hash,'9bdcc2f7f69dc7950b90011f47e83a34fd5a64a1');
const control=JSON.parse(readFileSync('static-release/control.json')),browser=JSON.parse(readFileSync('static-browser-proof/receipt.json'));assert.equal(browser.sha,process.env.GITHUB_SHA);assert.equal(browser.reports.length,42);
const fp=await fetch(browser.origin+'/DEPLOYMENT-FINGERPRINT.json');assert(fp.ok);assert.equal((await fp.json()).aggregate_sha256,control.source_fingerprint);
mkdirSync('static-live-proof',{recursive:true});writeFileSync('static-live-proof/before.json',JSON.stringify({id:before.id,url:before.url,commit:before.deployment_trigger.metadata.commit_hash},null,2));
const root=process.cwd(),commandDir=process.env.RUNNER_TEMP+'/static-pages-command';mkdirSync(commandDir,{recursive:true});
const output=execFileSync(process.execPath,[root+'/node_modules/wrangler/bin/wrangler.js','pages','deploy',root+'/static-release/site','--project-name','projectshift','--branch','main','--commit-hash',process.env.GITHUB_SHA],{encoding:'utf8',maxBuffer:2e6,timeout:240000,cwd:commandDir});
writeFileSync('static-live-proof/deploy.log',output);
let deployed=await cf('/pages/projects/projectshift');const after=deployed.canonical_deployment;
assert.equal(after.deployment_trigger.metadata.commit_hash,process.env.GITHUB_SHA,'Deployment identity did not match this release');
const errors=[],specs=JSON.parse(readFileSync('editorial/content-audit/static-articles.json')).articles,checks=[];
for(const spec of specs){try{const url='https://shiftsometimber.co.uk/articles/'+spec.slug,r=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert(r.ok,'Article not available');const html=await r.text();const plain=html.replaceAll('&amp;','&').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&quot;','"');assert(plain.includes(spec.intro),'Reviewed intro missing');assert(!html.includes('That sounds straightforward'));assert(!html.includes('wet Wednesday'));assert(html.includes('2 October 2026'));checks.push({url,status:r.status,reviewedCopyVisible:true});}catch(e){errors.push({slug:spec.slug,error:e.message});}}
const afterfp=await fetch(after.url+'/DEPLOYMENT-FINGERPRINT.json');assert(afterfp.ok);assert.equal((await afterfp.json()).aggregate_sha256,control.source_fingerprint);
if(errors.length){
 // A concurrent later release must never be overwritten by recovery.
 const latest=(await cf('/pages/projects/projectshift')).canonical_deployment;assert.equal(latest.id,after.id,'Newer public release exists; do not roll it back');
 await cf('/pages/projects/projectshift/deployments/'+before.id+'/rollback','POST');writeFileSync('static-live-proof/errors.json',JSON.stringify(errors,null,2));throw Error('Post-publication copy check failed; previous Pages release restored');
}
writeFileSync('static-live-proof/receipt.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,from:before.id,to:after.id,url:after.url,fingerprint:control.source_fingerprint,checks,preservedOtherFiles:854,workerDeployed:false,customerDataChanged:false,stockOrPricesChanged:false},null,2));console.log('PASS: 21 reviewed articles published, all live-copy checks passed');
