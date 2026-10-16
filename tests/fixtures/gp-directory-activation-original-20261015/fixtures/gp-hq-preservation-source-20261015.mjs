import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const GP_HQ_ORIGINAL_MODULE='release/combined-hq-preservation-20261014.mjs';
export const GP_HQ_ORIGINAL_BLOB='4fde8a318c59c04080ddfd94f4641d0e8ec569da';
export const GP_HQ_SUCCESSOR_MODULE='release/gp-hq-preservation-successor-20261015.mjs';
export const GP_HQ_ACCEPTED_PREDECESSOR=Object.freeze({
 deployment:'fa4f97f1-dfd8-4f61-a02d-025cd3fade3c',
 version:'755cce5e-6308-405f-be59-2e515caa82af',
 sha256:'7cf75b8991c779c124754af17b8300da931aa8ae3731878f4d4629b070b3f397',
 bytes:1832628,
 source:'685ede249cd20c4801d0a25227fed16d46860618',
 sourceProofRun:38617722170
});
export const GP_HQ_CALLER_BLOBS=Object.freeze({
 'hq-management-release-gate.mjs':'0b5e983e057fe467978dd7dfe2ec63e301e4804d',
 'hq-management-deploy.mjs':'ab7f6145a50c85c06fa257ac13dbe4895b3f6773',
 'hq-management-public-preservation.mjs':'cc3866839aae8e10158f255ff557b9714f24641a'
});
const oldImport="from './release/combined-hq-preservation-20261014.mjs';\n";
const newImport="from './release/gp-hq-preservation-successor-20261015.mjs';\n";
export const gpHqGitBlob=value=>{const bytes=Buffer.from(value);return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');};
const once=(text,before,after)=>{assert.equal(text.split(before).length,2,'One exact bounded HQ successor source hook required: '+before.slice(0,100));return text.replace(before,after);};
const gpImport="import {gpMemberCodeHistoricalView} from './gp-member-code-admission-20261014.mjs';\n";
const gpStart='export const HQ_GP_START=Object.freeze('+JSON.stringify(GP_HQ_ACCEPTED_PREDECESSOR)+');\n';
export const GP_HQ_SUCCESSOR_REPLACEMENTS=Object.freeze([
 ["export function proveCombinedHqCurrent(){\n const view=combinedFiniteHistoricalView(),head=view.rawHead,current=JSON.parse(content(head,'release/approved-runtime-composition.json')),c=current.combinedFinite20261014;",
  "export function proveCombinedHqCurrent(){\n const gp=gpMemberCodeHistoricalView();gp.assertCurrent();assert.notEqual(gp.rawHead,gp.head,'An independently admitted finite GP layer is required for the HQ successor');\n try{\n const view=combinedFiniteHistoricalView(),head=gp.head,current=JSON.parse(content(head,'release/approved-runtime-composition.json')),c=current.combinedFinite20261014;"],
 [" assert.equal(git('rev-parse','HEAD'),head,'HQ source HEAD moved during proof');\n return {head,proof};\n}",
  " assert.equal(git('rev-parse','HEAD'),gp.rawHead,'HQ source HEAD moved during proof');\n return {head:gp.rawHead,predecessorHead:head,proof,gpMemberCode:true};\n }finally{gp.assertCurrent();}\n}"],
 [" proveCombinedHqCurrent();const version=await versionRead(accountId,token,HQ_START.version,fetchImpl),bundle=await readBundle(accountId,token,HQ_START.version,fetchImpl);\n const receipt=assertHqProviderSnapshot({deployment:before,version,bundle});\n assertHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle});",
  " proveCombinedHqCurrent();const version=await versionRead(accountId,token,HQ_GP_START.version,fetchImpl),bundle=await readBundle(accountId,token,HQ_GP_START.version,fetchImpl);\n const receipt=assertHqProviderSnapshot({deployment:before,version,bundle},HQ_GP_START);\n assertHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle},HQ_GP_START);"],
 [" const candidate={source:proof.head,sha256:sha(bytes),bytes:bytes.length};",
  " const candidate={source:proof.head,predecessorSource:proof.predecessorHead,gpMemberCode:true,sha256:sha(bytes),bytes:bytes.length};"],
 [" for(const path of ['/v1/hq/management/partners','/v1/hq/management/partner-handovers','/v1/hq/management/gp-directory']){",
  " for(const path of ['/v1/hq/management/partners','/v1/hq/management/partner-handovers','/v1/hq/management/gp-directory','/v1/hq/management/people/1/gp-details']){"]
].map(x=>Object.freeze(x)));
export function buildGpHqSuccessorSource(original){
 assert.equal(gpHqGitBlob(original),GP_HQ_ORIGINAL_BLOB,'Literal original combined-HQ module is required');
 let current=original;for(const[before,after]of GP_HQ_SUCCESSOR_REPLACEMENTS)current=once(current,before,after);
 return gpImport+gpStart+current;
}
export function originalGpHqSuccessorSource(current){
 assert(current.startsWith(gpImport+gpStart),'Exact independent GP import and predecessor pins required');
 let original=current.slice((gpImport+gpStart).length);
 for(const[before,after]of [...GP_HQ_SUCCESSOR_REPLACEMENTS].reverse())original=once(original,after,before);
 assert.equal(gpHqGitBlob(original),GP_HQ_ORIGINAL_BLOB,'All original HQ assertions, baseline and inverse bodies must remain exact');return original;
}
export function buildGpHqCallerSource(path,original){
 assert(Object.hasOwn(GP_HQ_CALLER_BLOBS,path),'Unapproved HQ successor caller');
 assert.equal(gpHqGitBlob(original),GP_HQ_CALLER_BLOBS[path],'Literal original HQ caller required: '+path);
 return once(original,oldImport,newImport);
}
export function originalGpHqCallerSource(path,current){
 assert(Object.hasOwn(GP_HQ_CALLER_BLOBS,path),'Unapproved HQ successor caller');
 const original=once(current,newImport,oldImport);assert.equal(gpHqGitBlob(original),GP_HQ_CALLER_BLOBS[path],'Every original HQ caller assertion must remain exact: '+path);return original;
}
