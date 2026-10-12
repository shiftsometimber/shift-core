import test from 'node:test';
import assert from 'node:assert/strict';
import {RECONCILIATION_MANIFEST,RUNTIME_BASELINE_ROLLBACK_BASE,RUNTIME_BASELINE_ROLLBACK_SOURCE,RUNTIME_BASELINE_ROLLBACK_PATHS,RUNTIME_BASELINE_ROLLBACK_MAINTENANCE,verifyRuntimeBaselineRollbackRetention} from '../release/approved-runtime-composition.mjs';

const fixture=()=>{
 const maintenanceSource='e'.repeat(40),head='f'.repeat(40);
 const c={proof:'EXACT_CURRENT_BASELINE_ROLLBACK_RETENTION_20261012',base:RUNTIME_BASELINE_ROLLBACK_BASE,source:RUNTIME_BASELINE_ROLLBACK_SOURCE,paths:RUNTIME_BASELINE_ROLLBACK_PATHS,maintenancePaths:RUNTIME_BASELINE_ROLLBACK_MAINTENANCE,maintenanceSource,integrationIssue:1065,failedPromotionRun:38306227092,failedPromotionJob:115003854540,failedStep:10,originalSuccessfulRun:38248635395,originalSuccessfulJob:114828666204,failedContactRun:38291781709,failedContactJob:114953466887,activeDeployment:'4a9c25dc-4208-43f1-9e72-12ee11eba7ac',activeVersion:'534545ec-7445-49bf-9333-47b08b7ad631',failedContactDeployment:'5cdcd96c-e280-4282-bbee-150e8f765353',failedContactVersion:'dc0dd65f-6df9-46d1-a6b0-02bbd2232cac',runtimeChanged:false,customerDataChanged:false,publicCopyChanged:false,failedReleasePromoted:false,genericAdoptionAllowed:false,deploymentAuthorityBroadened:false,rollbackAuthorityBroadened:false,existingGatesWeakened:false};
 const prior={proof:'prior',receipt:{immutable:true}},current={...prior,runtimeBaselineRollbackRetention:c};
 const options={head,ancestor:()=>{},read:()=> 'same',diff:(a,b)=>a===c.base&&b===c.source?[...c.paths]:a===c.source&&b===c.maintenanceSource?[...c.maintenancePaths]:[RECONCILIATION_MANIFEST],content:(ref,path)=>{assert.equal(path,RECONCILIATION_MANIFEST);return JSON.stringify(ref===c.base?prior:current);}};
 return {c,options};
};

test('current baseline rollback registration is exact, read-only and preserves every prior receipt',()=>{
 const {c,options}=fixture();assert.equal(verifyRuntimeBaselineRollbackRetention(c,options),c);
 for(const path of [...c.paths,...c.maintenancePaths]){const f=fixture();f.options.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyRuntimeBaselineRollbackRetention(f.c,f.options),/drift/);}
 for(const flag of ['runtimeChanged','customerDataChanged','publicCopyChanged','failedReleasePromoted','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened']){const f=fixture();f.c[flag]=true;assert.throws(()=>verifyRuntimeBaselineRollbackRetention(f.c,f.options));}
 for(const key of ['failedPromotionRun','failedPromotionJob','failedStep','originalSuccessfulRun','originalSuccessfulJob','failedContactRun','failedContactJob']){const f=fixture();f.c[key]=1;assert.throws(()=>verifyRuntimeBaselineRollbackRetention(f.c,f.options));}
 for(const key of ['activeDeployment','activeVersion','failedContactDeployment','failedContactVersion']){const f=fixture();f.c[key]='other';assert.throws(()=>verifyRuntimeBaselineRollbackRetention(f.c,f.options));}
 {const f=fixture();f.options.diff=()=>['worker.js'];assert.throws(()=>verifyRuntimeBaselineRollbackRetention(f.c,f.options),/Unrelated|Unreviewed/);}
 {const f=fixture(),current=JSON.parse(f.options.content(f.options.head,RECONCILIATION_MANIFEST));current.receipt.immutable=false;f.options.content=(ref)=>JSON.stringify(ref===f.c.base?{proof:'prior',receipt:{immutable:true}}:current);assert.throws(()=>verifyRuntimeBaselineRollbackRetention(f.c,f.options),/Prior release receipts changed/);}
});
