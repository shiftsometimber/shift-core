import assert from 'node:assert/strict';
import {nutritionSignposting} from '../../public-nutrition-mytimber.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');
assert.equal(process.env.GITHUB_REF,'refs/heads/codex/nondevice-completion-20261003');
const control=JSON.parse(readFileSync('everyday-release/control.json')),proof=JSON.parse(readFileSync('everyday-release/proof.json')),browser=JSON.parse(readFileSync('everyday-browser-proof/receipt.json'));
assert.equal(browser.sha,process.env.GITHUB_SHA);assert.equal(browser.reports.length,14);
const manifest=JSON.parse(readFileSync('everyday-release/site/DEPLOYMENT-FINGERPRINT.json'));
assert.equal(manifest.aggregate_sha256,control.source_fingerprint);
for(const file of manifest.files){const bytes=readFileSync('everyday-release/site/'+file.path);assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,'Candidate file differs: '+file.path);}
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const cf=async(path,method='GET')=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000)}),j=await r.json();assert(r.ok&&j.success);return j.result;};
const project=await cf('/pages/projects/projectshift');assert.equal(project.production_branch,'main');
const before=project.canonical_deployment;assert.equal(before.id,'e9908e6b-5afb-427f-a8c1-f8389509aa7e','Public source changed; review the new baseline');
async function fingerprint(origin){const r=await fetch(origin+'/DEPLOYMENT-FINGERPRINT.json',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert(r.ok);return(await r.json()).aggregate_sha256;}
assert.equal(await fingerprint(before.url),control.expected_live_fingerprint);assert.equal(await fingerprint(browser.origin),control.source_fingerprint);
mkdirSync('everyday-live-proof',{recursive:true});writeFileSync('everyday-live-proof/before.json',JSON.stringify({id:before.id,url:before.url,fingerprint:control.expected_live_fingerprint}));
const root=process.cwd(),cwd=process.env.RUNNER_TEMP+'/remaining-publish';mkdirSync(cwd,{recursive:true});
const output=execFileSync(process.execPath,[root+'/node_modules/wrangler/bin/wrangler.js','pages','deploy',root+'/everyday-release/site','--project-name','projectshift','--branch','main','--commit-hash',process.env.GITHUB_SHA],{cwd,encoding:'utf8',timeout:240000,maxBuffer:2e6});
writeFileSync('everyday-live-proof/deploy.log',output);
const after=(await cf('/pages/projects/projectshift')).canonical_deployment;assert.equal(after.deployment_trigger.metadata.commit_hash,process.env.GITHUB_SHA);
try{
 let propagated=false;
 for(let attempt=0;attempt<12;attempt++){
  const values=await Promise.all(['https://projectshift.pages.dev','https://shiftsometimber.co.uk'].map(fingerprint));
  if(values.every(v=>v===control.source_fingerprint)){propagated=true;break;}
  await new Promise(r=>setTimeout(r,10000));
 }
 assert(propagated,'Serving aliases did not acquire the candidate');
 const checks=[];
 for(const {path}of proof.reports){
  const route='/'+path.replace(/\.html$/,''),r=await fetch('https://shiftsometimber.co.uk'+route,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert(r.ok);
  const actual=await r.text(),expected=readFileSync('everyday-release/after/'+path,'utf8');
  const main=s=>s.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];assert(main(expected));assert.equal(main(actual),main(nutritionSignposting(expected,route)),'Serving reading copy differs: '+route);
  checks.push({route,status:r.status,exactMain:true});
 }
 writeFileSync('everyday-live-proof/receipt.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,before:before.id,after:after.id,fingerprint:control.source_fingerprint,checks,preservedFiles:proof.preservedFiles,workerDeployed:false,customerDataChanged:false,clinicalSignoffClaimed:false},null,2));
}catch(error){
 assert.equal((await cf('/pages/projects/projectshift')).canonical_deployment.id,after.id,'Newer release exists; do not roll it back');
 await cf('/pages/projects/projectshift/deployments/'+before.id+'/rollback','POST');throw error;
}
