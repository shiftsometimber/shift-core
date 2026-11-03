import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {UPDATED_PATHS,MEDICATION_RELEASE} from './transform.mjs';
export const PREFIX='medicine-evidence-20261103/';
export const MODULES=['transform.mjs','recipes.mjs','registry.mjs','styles.mjs','critical.mjs','images.mjs'];
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reviewDigest(){return hash(JSON.stringify(MODULES.map(name=>({name,sha256:hash(readFileSync(new URL('./'+name,import.meta.url)))}))));}
export function requirePublicationApproval(approval){
 assert.equal(approval?.state,'approved','Complete page review and explicit publication approval are required');
 assert.equal(approval.owner,'Matt O’Brien');assert.equal(approval.release,MEDICATION_RELEASE);
 assert.equal(approval.reviewDigest,reviewDigest(),'Approval must match the exact reviewed implementation');
 assert.deepEqual([...approval.paths].sort(),[...UPDATED_PATHS].sort(),'Approve the complete 29-page destination set');
 assert(approval.completeDraftShown===true&&approval.explicitPublicationSignOff===true);
 assert(approval.approvedAt&&approval.approvalMessage,'Retain the actual approval evidence');
 return true;
}
export function prepareMedicationPackage(before){
 const main=before.main_module;assert.match(main||'',/^[a-zA-Z0-9_./-]+\.m?js$/);assert(!main.split('/').includes('..'));
 assert(before.modules.some(m=>m.name===main));assert(!before.modules.some(m=>m.name.startsWith(PREFIX)),'Do not stack an existing medication wrapper');
 const entry='import original from '+JSON.stringify('../'+main)+';\nexport * from '+JSON.stringify('../'+main)+';\nimport {withMedicationEvidence} from "./transform.mjs";\nexport default withMedicationEvidence(original);\n';
 const additions=[['entry.mjs',Buffer.from(entry)],...MODULES.map(name=>[name,readFileSync(new URL('./'+name,import.meta.url))])].map(([name,bytes])=>({name:PREFIX+name,content_type:'application/javascript+module',content_base64:bytes.toString('base64')}));
 return {...before,main_module:PREFIX+'entry.mjs',modules:[...before.modules,...additions]};
}
export function verifyMedicationPackage(before,staged,planned){
 assert.equal(staged.main_module,PREFIX+'entry.mjs');assert.equal(planned.main_module,staged.main_module);
 for(const field of ['bindings','compatibility_date','compatibility_flags','assets','usage_model','migration_tag'])assert.deepEqual(staged[field],before[field],'Preserve existing configuration: '+field);
 assert.deepEqual(staged.modules.map(m=>m.name).sort(),planned.modules.map(m=>m.name).sort());
 for(const original of before.modules){const p=planned.modules.find(m=>m.name===original.name),a=staged.modules.find(m=>m.name===original.name);assert.deepEqual(p,original);assert.equal(a.content_type,original.content_type);assert.equal(a.content_base64,original.content_base64,'Original source must be unchanged: '+original.name);}
 for(const p of planned.modules){const a=staged.modules.find(m=>m.name===p.name);assert.equal(a.content_type,p.content_type);assert.equal(hash(Buffer.from(a.content_base64,'base64')),hash(Buffer.from(p.content_base64,'base64')));}
 return {existingModulesUnchanged:before.modules.length,addedModules:7,reviewDigest:reviewDigest()};
}
