import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {compiledTreatmentAssets,compiledDescribeRuntime,assertTreatmentAssetBytes,TREATMENT_BUILD_PATHS} from '../release/my-treatment-compiled-runtime.mjs';
import {treatmentRuntime,treatmentStyles} from '../member-experience/treatment-page.mjs';
import {treatmentServiceWorker} from '../member-experience/treatment-service-worker.mjs';
import {describeTreatmentEvent} from '../member-experience/treatment-detail.mjs';
test('full production build is the byte expectation; only the serialised function differs from Node source',async()=>{
 const {assets,proof}=await compiledTreatmentAssets();assert.equal(proof.productionRequests,0);assert.equal(proof.normalisation,false);
 const body=assets[TREATMENT_BUILD_PATHS[0]];new vm.Script(body);
 const before='describeEvent=',after=';const content=';
 const split=s=>{assert.equal(s.split(before).length,2);const start=s.indexOf(before)+before.length,end=s.indexOf(after,start);assert(end>start);return {prefix:s.slice(0,start),fn:s.slice(start,end),suffix:s.slice(end)}};
 const compiled=split(body),source=split(treatmentRuntime);assert.equal(compiled.prefix,source.prefix);assert.equal(compiled.suffix,source.suffix);assert.notEqual(compiled.fn,source.fn);
 const describe=vm.runInNewContext('('+compiled.fn+')');
 for(const event of [{kind:'dose_taken',details:{doseStrength:'test strength',injectionSite:'test'}},{details:{checkin:{weight:0,symptomType:'Nausea',symptomSeverity:0,waterMl:0,proteinGrams:0}}},{details:{checkin:{weight:null}}},{details:{note:'<script>literal member note</script>'}}])assert.equal(describe(event,[]),describeTreatmentEvent(event,[]));
 assert.equal(assets[TREATMENT_BUILD_PATHS[1]],treatmentStyles);assert.equal(assets[TREATMENT_BUILD_PATHS[2]],treatmentServiceWorker);
 for(const path of TREATMENT_BUILD_PATHS){assertTreatmentAssetBytes(assets[path],assets[path],path);assert.throws(()=>assertTreatmentAssetBytes(assets[path]+' ',assets[path],path),/differs/)}
 assert.throws(()=>assertTreatmentAssetBytes('x','x','/unlisted'),/Unlisted/);
});
test('build extraction rejects missing, duplicate, partial and unrelated function boundaries',()=>{
 for(const body of ['', '// member-experience/treatment-detail.mjs\nfunction other(){\n}\n// next', '// member-experience/treatment-detail.mjs\nfunction describeTreatmentEvent(){\n// next', '// member-experience/treatment-detail.mjs\nfunction describeTreatmentEvent(){\n}\nfunction describeTreatmentEvent2(){\n}\n// next', '// member-experience/treatment-detail.mjs\n// member-experience/treatment-detail.mjs\n'])assert.throws(()=>compiledDescribeRuntime(body));
});
