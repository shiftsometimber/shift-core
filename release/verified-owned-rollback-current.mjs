import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {verifyOwnedRollback,verifyOwnedRollbackChain,assertOwnedRollbackStartingPoint} from './verified-owned-rollback.mjs';
export const OWNED_ROLLBACK_POLICY=Object.freeze(JSON.parse(readFileSync(new URL('./verified-owned-rollback-policy-20261014.json',import.meta.url),'utf8')));
export const OWNED_ROLLBACK_DEPLOYMENT='566b838d-3033-45c3-9201-b49335383e24';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const active=wrangler=>JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
function extracted(archive,names){const directory=mkdtempSync(join(tmpdir(),'shift-owned-rollback-proof-'));try{const path=join(directory,'accepted.zip');writeFileSync(path,archive,{mode:0o600,flag:'wx'});return Object.fromEntries(names.map(name=>[name,execFileSync('unzip',['-p',path,name],{maxBuffer:8*1024*1024})]));}finally{rmSync(directory,{recursive:true,force:true});}}
export function captureOwnedRollbackCurrent(wrangler,before,{configuration=readFileSync('wrangler.jsonc'),now=Date.now}={}){
 const initial=active(wrangler),tables={};
 for(const table of ['medicine_products','medicine_variants','medicine_inventory']){
  const sql='SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id');
  const result=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(result.length&&result.every(row=>row.success),'Original public stock SELECT required');
  const rows=result.flatMap(row=>row.results||[]);tables[table]={rows:rows.length,sha256:digest(JSON.stringify(rows))};
 }
 assert.deepEqual(tables,before.tables,'Original protected stock changed');const configurationSha256=digest(configuration);assert.equal(configurationSha256,before.configurationSha256,'Original protected configuration changed');
 const deployment=active(wrangler);assert.deepEqual({id:deployment.id,versions:deployment.versions},{id:initial.id,versions:initial.versions},'Runtime moved during owned rollback stock comparison');
 const checkedAt=new Date(typeof now==='function'?now():now).toISOString();
 return{observedAt:checkedAt,deployment,stock:{checkedAt,kind:'independent-original-protected-stock-comparison-after-owned-rollback',beforeAt:before.checkedAt,run:(OWNED_ROLLBACK_POLICY.followingFailed??OWNED_ROLLBACK_POLICY.failed).run,attempt:(OWNED_ROLLBACK_POLICY.followingFailed??OWNED_ROLLBACK_POLICY.failed).attempt,failedCandidate:(OWNED_ROLLBACK_POLICY.followingFailed??OWNED_ROLLBACK_POLICY.failed).source,servingSource:OWNED_ROLLBACK_POLICY.prior.source,servingDeployment:deployment.id,servingVersions:deployment.versions,tables,configurationSha256,identical:true,customerRecordsRead:false,productionWrites:0,originalFailedReleaseRemainsFailed:true}};
}
export async function verifyCurrentOwnedRollback({proof,wrangler}){
 const load=async pin=>{const[run,job,artifact,archive,logs]=await Promise.all([proof.get('/actions/runs/'+pin.run+'/attempts/'+pin.attempt),proof.get('/actions/jobs/'+pin.job),proof.get('/actions/artifacts/'+pin.artifact.id),proof.artifact(pin.artifact),proof.logBytes(pin.job)]);return{run,job,artifact,archive,logs:Buffer.from(logs)};};
 const[previousFailed,prior,failed]=await Promise.all([load(OWNED_ROLLBACK_POLICY.failed),load(OWNED_ROLLBACK_POLICY.prior),load(OWNED_ROLLBACK_POLICY.followingFailed)]);
 for(const evidence of [previousFailed,failed]){
  const entries=extracted(evidence.archive,['rollback.json','before.json']);
  evidence.rollback=entries['rollback.json'];evidence.stockBefore=entries['before.json'];
 }
 const current=captureOwnedRollbackCurrent(wrangler,JSON.parse(failed.stockBefore));
 const receipt=verifyOwnedRollbackChain({policy:OWNED_ROLLBACK_POLICY,previousFailed,failed,prior,current,now:new Date().toISOString()});
 assertOwnedRollbackStartingPoint(receipt,active(wrangler));
 return receipt;
}
export function ownedRollbackStartingPoint(receipt,current){assertOwnedRollbackStartingPoint(receipt,current);return{...receipt,run:receipt.predecessorRun};}

export function assertSameOwnedRollbackReceipt(previous,current){
 assert.equal(typeof previous?.checkedAt,'string');assert.equal(typeof current?.checkedAt,'string');
 assert(Number.isFinite(Date.parse(previous.checkedAt))&&Date.parse(previous.checkedAt)<=Date.parse(current.checkedAt),'Owned rollback receipt capture time is invalid');
 const {checkedAt:oldTime,...oldFacts}=previous,{checkedAt:newTime,...newFacts}=current;assert.deepEqual(oldFacts,newFacts,'Owned rollback evidence changed between recovery and adoption');
}

export async function readLegacyRecoveryProof(before,recovery,get){
 if(![recovery.verified,recovery.unverified].includes(before?.versions?.[0]?.version_id))return null;
 const[verified,failed]=await Promise.all([get('/actions/runs/'+recovery.verifiedRun),get('/actions/runs/'+recovery.run)]);return{verified,failed};
}
