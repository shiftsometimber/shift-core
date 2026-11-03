import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareMedicationPackage,verifyMedicationPackage,requirePublicationApproval,reviewDigest} from './package.mjs';
import {UPDATED_PATHS,MEDICATION_RELEASE} from './transform.mjs';
const inventory=JSON.parse(readFileSync(new URL('./serving-baseline.json',import.meta.url)));
for(const owner of inventory.workers)test(owner.script+' retains every captured original module and binding',()=>{
 const before={main_module:owner.main,bindings:owner.bindingNames,compatibility_date:owner.compatibilityDate,compatibility_flags:['nodejs_compat'],assets:{jwt:'fixture'},migration_tag:'original',modules:owner.modules.map(m=>({name:m.name,content_type:m.contentType||'application/javascript+module',content_base64:Buffer.from(m.sha256).toString('base64')}))};
 const planned=prepareMedicationPackage(before);assert.equal(planned.modules.length,before.modules.length+7);const result=verifyMedicationPackage(before,structuredClone(planned),planned);assert.equal(result.existingModulesUnchanged,owner.moduleCount);
 const broken=structuredClone(planned);broken.modules[0].content_base64=Buffer.from('changed').toString('base64');assert.throws(()=>verifyMedicationPackage(before,broken,planned));
 const bindingChange=structuredClone(planned);bindingChange.bindings=[];assert.throws(()=>verifyMedicationPackage(before,bindingChange,planned));assert.throws(()=>prepareMedicationPackage(planned));
});
test('preparation requests cannot become publication approval; approval is bound to exact copy and destinations',()=>{
 assert.throws(()=>requirePublicationApproval({state:'review_required',approvalMessage:'Rectify all to same level and standard please'}));
 const a={state:'approved',owner:'Matt O’Brien',release:MEDICATION_RELEASE,reviewDigest:reviewDigest(),paths:UPDATED_PATHS,completeDraftShown:true,explicitPublicationSignOff:true,approvedAt:'test-only',approvalMessage:'fixture only, never retained as actual approval'};
 assert(requirePublicationApproval(a));assert.throws(()=>requirePublicationApproval({...a,reviewDigest:'old'}));assert.throws(()=>requirePublicationApproval({...a,paths:UPDATED_PATHS.slice(1)}));assert.throws(()=>requirePublicationApproval({...a,completeDraftShown:false}));
});
