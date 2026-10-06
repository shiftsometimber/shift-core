import {SITEWIDE_VERSION,verifySitewideRuntime} from './sitewide-seo-scope.mjs';
import {COACH_BASE,COACH_PATHS,WATCH_CURRENT_PATHS,coachingHistoricalRef,withoutCoachEntrypoint,verifyCoachingRelease} from '../shift-coach/release-contract.mjs';
import {reusablePublicIndex} from './app-index-freshness.mjs';
// Use the same exact verified production receipt as cancelled-release recovery.
import {catalogueRuntime,verifyCatalogueBaseline,articleRuntime,verifiedStartingPoint} from '../shift-coach/cancelled-release-recovery.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync} from 'node:fs';
import {validateGrowthSource} from './growth-scope.mjs';
validateGrowthSource();
const wrangler=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4*1024*1024});
const active=JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
const point=verifiedStartingPoint(JSON.parse(readFileSync('b1-runtime-release/cancelled-release-recovery.json')),active);
const BASE=point.source,VERSION=point.version;
const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/'+point.run,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});
assert(r.ok);const receipt=await r.json();assert.equal(receipt.id,point.run);assert.equal(receipt.head_sha,BASE);assert.equal(receipt.conclusion,'success');
if(point.run===catalogueRuntime.run){
 const request=async path=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r;};
 assert(await verifyCatalogueBaseline(active,async path=>(await request(path)).json(),async id=>(await request('/actions/jobs/'+id+'/logs')).text(),JSON.parse(readFileSync('docs/catalogue-benefits-live-receipt-20261006.json','utf8')),JSON.parse(readFileSync('docs/catalogue-runtime-rollback-37462426049.json','utf8'))),'Exact catalogue proof, live receipt and any finite rollback evidence must still agree');
}else if(point.version===SITEWIDE_VERSION){
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).sitewideSeoComposition;
 const request=async path=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r;};
 const proof=await verifySitewideRuntime(active,c,readFileSync('docs/seo-sitewide-live-receipt-20261006.json','utf8'),async path=>(await request(path)).json(),async id=>(await request('/actions/jobs/'+id+'/logs')).text());
 assert.equal(point.source,proof.source);assert.equal(point.run,proof.run);
}else{assert.equal(receipt.path,point.run===articleRuntime.run?articleRuntime.workflow:'.github/workflows/cloudflare-production-promote.yml');assert.equal(receipt.head_branch,'main');}
assert.equal(withoutCoachEntrypoint(execFileSync('git',['show','HEAD:wrangler.jsonc'],{encoding:'utf8'})),execFileSync('git',['show','b23010cfca99b3ab05377062ad5b16984711111c:wrangler.jsonc'],{encoding:'utf8'}),'Configuration changed outside the separately pinned coaching entrypoint');
mkdirSync('b1-runtime-release',{recursive:true});
const sql="SELECT COUNT(*) AS [indexed],SUM(CASE WHEN julianday(updated_at)>=julianday('now','-2 days') THEN 0 ELSE 1 END) AS stale,SUM(CASE WHEN source_uri='https://shiftsometimber.co.uk/life-back' AND julianday(updated_at)>=julianday('now','-2 days') THEN 1 ELSE 0 END) AS lifeBackFresh,(SELECT COUNT(*) FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.category='shift_public_site' AND d.status='published_site') chunks FROM ai_knowledge_documents WHERE category='shift_public_site' AND status='published_site'";
const result=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(result.every(r=>r.success));const index=result.flatMap(r=>r.results||[])[0];assert(index.indexed>=50);assert(index.chunks>=index.indexed);
writeFileSync('b1-runtime-release/shift-ai-public-index.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,...index,method:'Read-only aggregate of existing published-site index',customerRecordsRead:0,databaseWrites:0},null,2));
writeFileSync('b1-runtime-release/existing-growth-deployment.json',JSON.stringify({base:BASE,version:VERSION,sourceRun:receipt.id,retainedSource:BASE,activeDeployment:active.id,release:process.env.GITHUB_SHA,at:new Date().toISOString(),newDeploymentRequired:true,rollbackSource:'Fresh current deployment captured by workflow before deployment'},null,2));
const reuse=reusablePublicIndex(index);
console.log('PUBLIC_INDEX_FRESHNESS '+JSON.stringify({...index,reuse,refreshScope:'Current published website pages only; no member records'}));
appendFileSync(process.env.GITHUB_OUTPUT,'already_deployed=false\nexisting_index='+reuse+'\nrestore_needed=false\n');
console.log('PASS verified production starting version, unchanged configuration and retained published index; fresh rollback capture required');
