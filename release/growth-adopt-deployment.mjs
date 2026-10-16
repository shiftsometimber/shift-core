import {verifyCurrentOwnedRollbackReleaseWindow} from './owned-rollback-release-window-20261016.mjs';
import {OWNED_ROLLBACK_DEPLOYMENT,verifyCurrentOwnedRollback,ownedRollbackStartingPoint,assertSameOwnedRollbackReceipt} from './verified-owned-rollback-current.mjs';
import {createGithubProofReader} from './github-proof-get.mjs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PHOTO_CANCELLED} from './photo-cancelled-stock-completion-20261014.mjs';
import {PHOTO_STARTING_KIND,exactPhotoStartingPoint} from './photo-baseline-starting-point-20261014.mjs';
import {createHash} from 'node:crypto';
import {SUPPORT_RUNTIME,verifySupportRuntime} from './live-support-runtime.mjs';
import {OWNER_RUNTIME,verifyOwnerRuntime} from './owner-captured-runtime.mjs';
import {SITEWIDE_VERSION,verifySitewideRuntime} from './sitewide-seo-scope.mjs';
import {COACH_BASE,COACH_PATHS,WATCH_CURRENT_PATHS,coachingHistoricalRef,withoutCoachEntrypoint,verifyCoachingRelease} from '../shift-coach/release-contract.mjs';
import {reusablePublicIndex,PUBLIC_INDEX_FRESHNESS_SQL} from './app-index-freshness.mjs';
// Use the same exact verified production receipt as cancelled-release recovery.
import {tabletRuntime,TABLET_RUNTIME_RECEIPT,verifyTabletRuntime,catalogueRuntime,verifyCatalogueBaseline,articleRuntime,verifiedStartingPoint} from '../shift-coach/cancelled-release-recovery.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync} from 'node:fs';
import {validateGrowthSource} from './growth-scope.mjs';
validateGrowthSource();
const historicalProof=createGithubProofReader({cacheDirectory:join(process.env.RUNNER_TEMP||tmpdir(),'shift-core-github-proof-v1')});
const wrangler=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4*1024*1024});
const active=JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
const baselineRecord=JSON.parse(readFileSync('b1-runtime-release/cancelled-release-recovery.json'));
let point;
if(active.id===OWNED_ROLLBACK_DEPLOYMENT){
 assert(baselineRecord.verifiedOwnedRollbackProof,'Exact owned rollback recovery receipt required');
 ownedRollbackStartingPoint(baselineRecord.verifiedOwnedRollbackProof,active);
 const refreshedProof=await verifyCurrentOwnedRollbackReleaseWindow({proof:historicalProof,wrangler,stage:'adoption'});
 assertSameOwnedRollbackReceipt(baselineRecord.verifiedOwnedRollbackProof,refreshedProof);
 point=ownedRollbackStartingPoint(refreshedProof,active);
}else if(active.id===PHOTO_CANCELLED.deployment){
 const get=historicalProof.get,getLogs=historicalProof.logs;
 const getArtifact=id=>{assert.equal(id,PHOTO_CANCELLED.artifact,'Unknown original photo archive');return historicalProof.artifact({id,run:PHOTO_CANCELLED.run,source:PHOTO_CANCELLED.source,bytes:PHOTO_CANCELLED.artifactBytes,sha256:PHOTO_CANCELLED.artifactSHA256});};
 const inventory=async()=>[JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0]];
 const freshSnapshot=async()=>{const tables={};for(const table of ['medicine_products','medicine_variants','medicine_inventory']){
  const sql='SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id'),raw=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(raw.length&&raw.every(r=>r.success));const rows=raw.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};
 }return{phase:'after',checkedAt:new Date().toISOString(),release:process.env.GITHUB_SHA,tables,configurationSha256:createHash('sha256').update(readFileSync('wrangler.jsonc')).digest('hex'),customerRecordsRead:false,productionWrites:0};};
 point=await exactPhotoStartingPoint(baselineRecord,active,JSON.parse(wrangler('versions','view',PHOTO_CANCELLED.version,'--json')),get,getLogs,getArtifact,inventory,freshSnapshot);
 mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/photo-baseline-starting-point.json',JSON.stringify(point,null,2));
}else point=verifiedStartingPoint(baselineRecord,active);
const BASE=point.source,VERSION=point.version;
let receipt={id:null};
if(point.kind==='verified_owned_runtime_rollback'){
 assert.equal(point.failedReleaseVerified,false);receipt={id:point.predecessorRun,conclusion:'success',failedRun:point.failedRun,failedReleaseVerified:false,evidenceKind:point.kind};
}else if(point.kind===PHOTO_STARTING_KIND){
 assert.equal(point.source,PHOTO_CANCELLED.source);assert.equal(point.version,PHOTO_CANCELLED.version);assert.equal(point.run,PHOTO_CANCELLED.run);assert.equal(point.originalRunAccepted,false);assert.equal(point.reconstruction.originalRunAccepted,false);assert.equal(point.reconstruction.baselineStockCompleted,true);
 receipt={id:PHOTO_CANCELLED.run,conclusion:'cancelled',originalRunAccepted:false,evidenceKind:PHOTO_STARTING_KIND};
}else if(point.kind!==OWNER_RUNTIME.kind&&point.kind!==SUPPORT_RUNTIME.kind){
receipt=await historicalProof.get('/actions/runs/'+point.run);assert.equal(receipt.id,point.run);assert.equal(receipt.head_sha,BASE);assert.equal(receipt.conclusion,'success');
if(point.run===catalogueRuntime.run){
 assert(await verifyCatalogueBaseline(active,historicalProof.get,historicalProof.logs,JSON.parse(readFileSync('docs/catalogue-benefits-live-receipt-20261006.json','utf8')),JSON.parse(readFileSync('docs/catalogue-runtime-rollback-37462426049.json','utf8'))),'Exact catalogue proof, live receipt and any finite rollback evidence must still agree');
}else if(point.version===tabletRuntime.version){
 const version=JSON.parse(wrangler('versions','view',point.version,'--json'));
 const proof=await verifyTabletRuntime(active,version,readFileSync(TABLET_RUNTIME_RECEIPT,'utf8'),historicalProof.get,historicalProof.logs);
 assert.equal(point.source,proof.source);assert.equal(point.run,proof.run);
}else if(point.version===SITEWIDE_VERSION){
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).sitewideSeoComposition;
 const proof=await verifySitewideRuntime(active,c,readFileSync('docs/seo-sitewide-live-receipt-20261006.json','utf8'),historicalProof.get,historicalProof.logs);
 assert.equal(point.source,proof.source);assert.equal(point.run,proof.run);
}else{assert.equal(receipt.path,point.run===articleRuntime.run?articleRuntime.workflow:'.github/workflows/cloudflare-production-promote.yml');assert.equal(receipt.head_branch,'main');}
}else{
 const version=JSON.parse(wrangler('versions','view',point.version,'--json'));
 const proof=await (point.kind===SUPPORT_RUNTIME.kind?verifySupportRuntime(active,version):verifyOwnerRuntime(active,version));
 assert.deepEqual(JSON.parse(readFileSync('b1-runtime-release/cancelled-release-recovery.json')).ownerCapturedProof,proof);
 const unchanged=JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:active.id,versions:active.versions},'Owner runtime moved during adoption');
}
assert.equal(withoutCoachEntrypoint(execFileSync('git',['show','HEAD:wrangler.jsonc'],{encoding:'utf8'})),execFileSync('git',['show','b23010cfca99b3ab05377062ad5b16984711111c:wrangler.jsonc'],{encoding:'utf8'}),'Configuration changed outside the separately pinned coaching entrypoint');
mkdirSync('b1-runtime-release',{recursive:true});
const sql=PUBLIC_INDEX_FRESHNESS_SQL;
const result=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(result.every(r=>r.success));const index=result.flatMap(r=>r.results||[])[0];assert(index.indexed>=50);assert(index.chunks>=index.indexed);
writeFileSync('b1-runtime-release/shift-ai-public-index.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,...index,method:'Read-only aggregate of existing published-site index',customerRecordsRead:0,databaseWrites:0},null,2));
writeFileSync('b1-runtime-release/existing-growth-deployment.json',JSON.stringify({base:BASE,version:VERSION,sourceRun:receipt.id,retainedSource:BASE,captureKind:point.kind||null,reconstruction:point.reconstruction||null,activeDeployment:active.id,release:process.env.GITHUB_SHA,at:new Date().toISOString(),newDeploymentRequired:true,rollbackSource:'Fresh current deployment captured by workflow before deployment'},null,2));
const reuse=reusablePublicIndex(index);
console.log('PUBLIC_INDEX_FRESHNESS '+JSON.stringify({...index,reuse,refreshScope:'Current published website pages only; no member records'}));
appendFileSync(process.env.GITHUB_OUTPUT,'already_deployed=false\nexisting_index='+reuse+'\nrestore_needed=false\n');
console.log('PASS verified production starting version, unchanged configuration and retained published index; fresh rollback capture required');
