import test from 'node:test';
import assert from 'node:assert/strict';
import {sources,medicines} from './data.mjs';
import {industry} from './industry.mjs';
import {registrySources,supportSources,credibilityMarkup,registryEvidenceMarkup,industryReviewFlag} from './credibility.mjs';
import {fingerprintSource} from './monitor.mjs';
const fixture=()=>({hasResults:false,protocolSection:{identificationModule:{nctId:'NCT12345678',briefTitle:'Test research study'},sponsorCollaboratorsModule:{leadSponsor:{name:'Test sponsor'}},statusModule:{overallStatus:'RECRUITING',studyFirstPostDateStruct:{date:'2026-01-01',type:'ACTUAL'},lastUpdatePostDateStruct:{date:'2026-10-02',type:'ACTUAL'},completionDateStruct:{date:'2027-05',type:'ESTIMATED'}},designModule:{studyType:'INTERVENTIONAL',phases:['PHASE1'],enrollmentInfo:{count:20,type:'ESTIMATED'}}}});
const source={id:'registry-test',format:'ctgov-lifecycle',nctId:'NCT12345678',requiredTerms:['NCT12345678']};
const fingerprint=data=>fingerprintSource(source,JSON.stringify(data),'application/json').then(r=>r.fingerprint);
test('registry monitoring covers all exact linked records, with bounded reviewed identities',()=>{
 const links=[...medicines.flatMap(e=>e.evidenceLinks||[]),...industry.flatMap(e=>e.additionalEvidence||[])];
 const urls=new Set(links.filter(l=>/^https:\/\/clinicaltrials.gov\/study\/NCT\d{8}$/.test(l.url)).map(l=>l.url));
 assert.equal(urls.size,134);assert.deepEqual(new Set(registrySources.map(s=>s.url)),urls);
 assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);assert.equal(sources.length,199);
 for(const s of registrySources){assert.match(s.reviewedFingerprint,/^[a-f0-9]{64}$/);assert.equal(s.nctId,s.lifecycle.nctId);assert.ok(s.reviewedAt);}
 const taldefgrobep=registrySources.find(s=>s.id==='registry-nct07281495');assert.ok(taldefgrobep);assert.equal(taldefgrobep.lifecycle.status,'ACTIVE_NOT_RECRUITING');assert.equal(taldefgrobep.lifecycle.completion.type,'ESTIMATED');assert.equal(taldefgrobep.lifecycle.hasResults,false);
 const attainMaintain=registrySources.find(s=>s.id==='registry-nct06584916');assert.ok(attainMaintain);assert.equal(attainMaintain.lifecycle.status,'COMPLETED');assert.equal(attainMaintain.lifecycle.completion.type,'ACTUAL');assert.equal(attainMaintain.lifecycle.hasResults,false);
 const ascend=registrySources.find(s=>s.id==='registry-nct07517042');assert.ok(ascend);assert.equal(ascend.lifecycle.status,'RECRUITING');assert.equal(ascend.lifecycle.start.type,'ACTUAL');assert.equal(ascend.lifecycle.hasResults,false);
 const accomplish=registrySources.find(s=>s.id==='registry-nct07654374');assert.ok(accomplish);assert.equal(accomplish.lifecycle.status,'RECRUITING');assert.equal(accomplish.lifecycle.start.type,'ACTUAL');assert.equal(accomplish.lifecycle.hasResults,false);
 const zynergy=registrySources.find(s=>s.id==='registry-nct07589686');assert.ok(zynergy);assert.equal(zynergy.lifecycle.status,'NOT_YET_RECRUITING');assert.equal(zynergy.lifecycle.start.type,'ESTIMATED');assert.equal(zynergy.lifecycle.hasResults,false);
 const nnc0721=registrySources.find(s=>s.id==='registry-nct07767175');assert.ok(nnc0721);assert.equal(nnc0721.lifecycle.status,'RECRUITING');assert.equal(nnc0721.lifecycle.start.type,'ACTUAL');assert.equal(nnc0721.lifecycle.hasResults,false);
 const nnc0662Obesity=registrySources.find(s=>s.id==='registry-nct07184632');assert.ok(nnc0662Obesity);assert.equal(nnc0662Obesity.lifecycle.status,'ACTIVE_NOT_RECRUITING');assert.equal(nnc0662Obesity.lifecycle.enrollment.type,'ACTUAL');assert.equal(nnc0662Obesity.lifecycle.hasResults,false);
 const nnc0662Diabetes=registrySources.find(s=>s.id==='registry-nct07415954');assert.ok(nnc0662Diabetes);assert.equal(nnc0662Diabetes.lifecycle.status,'RECRUITING');assert.equal(nnc0662Diabetes.lifecycle.enrollment.type,'ESTIMATED');assert.equal(nnc0662Diabetes.lifecycle.hasResults,false);
 const survodutideDiabetes=registrySources.find(s=>s.id==='registry-nct07754461');assert.ok(survodutideDiabetes);assert.equal(survodutideDiabetes.lifecycle.status,'RECRUITING');assert.equal(survodutideDiabetes.lifecycle.completion.type,'ESTIMATED');assert.equal(survodutideDiabetes.lifecycle.hasResults,false);
 const survodutideJapan=registrySources.find(s=>s.id==='registry-nct06176365');assert.ok(survodutideJapan);assert.equal(survodutideJapan.lifecycle.status,'COMPLETED');assert.equal(survodutideJapan.lifecycle.enrollment.count,274);assert.equal(survodutideJapan.lifecycle.completion.type,'ACTUAL');assert.equal(survodutideJapan.lifecycle.hasResults,false);
 for(const id of ['NCT07684235','NCT07684144','NCT07037433']){const maritide=registrySources.find(s=>s.nctId===id);assert.ok(maritide);assert.equal(maritide.lifecycle.status,'RECRUITING');assert.equal(maritide.lifecycle.start.type,'ACTUAL');assert.equal(maritide.lifecycle.enrollment.type,'ESTIMATED');assert.equal(maritide.lifecycle.hasResults,false);}
 const enicepatide=registrySources.find(s=>s.nctId==='NCT06525935');assert.ok(enicepatide);assert.equal(enicepatide.lifecycle.status,'COMPLETED');assert.deepEqual(enicepatide.lifecycle.enrollment,{count:469,type:'ACTUAL'});assert.equal(enicepatide.lifecycle.completion.type,'ACTUAL');assert.equal(enicepatide.lifecycle.hasResults,false);
 for(const id of ['NCT07351045','NCT07351058']){const enith=registrySources.find(s=>s.nctId===id);assert.ok(enith);assert.equal(enith.lifecycle.status,'RECRUITING');assert.equal(enith.lifecycle.start.type,'ACTUAL');assert.equal(enith.lifecycle.enrollment.type,'ESTIMATED');assert.equal(enith.lifecycle.completion.type,'ESTIMATED');assert.equal(enith.lifecycle.hasResults,false);}
 const emugrobart=registrySources.find(s=>s.nctId==='NCT07137585');assert.ok(emugrobart);assert.equal(emugrobart.lifecycle.status,'ACTIVE_NOT_RECRUITING');assert.equal(emugrobart.lifecycle.start.type,'ACTUAL');assert.equal(emugrobart.lifecycle.primaryCompletion.type,'ACTUAL');assert.equal(emugrobart.lifecycle.completion.type,'ESTIMATED');assert.equal(emugrobart.lifecycle.hasResults,false);
 const believe=registrySources.find(s=>s.nctId==='NCT05616013');assert.ok(believe);assert.equal(believe.lifecycle.status,'COMPLETED');assert.deepEqual(believe.lifecycle.enrollment,{count:507,type:'ACTUAL'});assert.equal(believe.lifecycle.completion.type,'ACTUAL');assert.equal(believe.lifecycle.hasResults,true);assert.equal(believe.lifecycle.resultsFirstPosted.date,'2025-07-18');
 const ambience=registrySources.find(s=>s.nctId==='NCT07861100');assert.ok(ambience);assert.equal(ambience.lifecycle.status,'NOT_YET_RECRUITING');assert.deepEqual(ambience.lifecycle.enrollment,{count:8500,type:'ESTIMATED'});assert.equal(ambience.lifecycle.start.type,'ESTIMATED');assert.equal(ambience.lifecycle.hasResults,false);
 for(const id of ['NCT07843498','NCT07843485','NCT07843472']){const zupreme=registrySources.find(s=>s.nctId===id);assert.ok(zupreme);assert.equal(zupreme.lifecycle.status,'RECRUITING');assert.equal(zupreme.lifecycle.start.type,id==='NCT07843485'?'ESTIMATED':'ACTUAL');assert.equal(zupreme.lifecycle.hasResults,false);}
 for(const id of ['NCT06974851','NCT06994650','NCT07551492','NCT07670884','NCT07660848']){const ribupatide=registrySources.find(s=>s.nctId===id);assert.ok(ribupatide);assert.equal(ribupatide.lifecycle.status,'RECRUITING');assert.equal(ribupatide.lifecycle.start.type,'ACTUAL');assert.equal(ribupatide.lifecycle.hasResults,false);}
 const adolescent=registrySources.find(s=>s.nctId==='NCT07559136');assert.equal(adolescent.lifecycle.status,'ACTIVE_NOT_RECRUITING');assert.equal(adolescent.lifecycle.enrollment.type,'ACTUAL');
 const pcos=registrySources.find(s=>s.nctId==='NCT06595797');assert.equal(pcos.lifecycle.status,'UNKNOWN');assert.equal(pcos.lifecycle.enrollment.type,'ESTIMATED');assert.equal(pcos.lifecycle.hasResults,false);
 const gzc8072=registrySources.find(s=>s.nctId==='NCT07784699');assert.ok(gzc8072);assert.equal(gzc8072.lifecycle.status,'RECRUITING');assert.equal(gzc8072.lifecycle.start.type,'ACTUAL');assert.equal(gzc8072.lifecycle.enrollment.count,126);assert.equal(gzc8072.lifecycle.hasResults,false);
 for(const id of ['NCT07743463','NCT07743450']){const aurora=registrySources.find(s=>s.nctId===id);assert.ok(aurora);assert.equal(aurora.lifecycle.status,'RECRUITING');assert.equal(aurora.lifecycle.start.type,'ACTUAL');assert.equal(aurora.lifecycle.completion.type,'ESTIMATED');assert.equal(aurora.lifecycle.hasResults,false);}
 const te8105=registrySources.find(s=>s.nctId==='NCT07857473');assert.ok(te8105);assert.equal(te8105.lifecycle.status,'NOT_YET_RECRUITING');assert.equal(te8105.lifecycle.start.type,'ESTIMATED');assert.equal(te8105.lifecycle.enrollment.count,204);assert.equal(te8105.lifecycle.hasResults,false);
 const sarcopenia=registrySources.find(s=>s.nctId==='NCT07858864');assert.ok(sarcopenia);assert.equal(sarcopenia.lifecycle.status,'RECRUITING');assert.equal(sarcopenia.lifecycle.start.type,'ACTUAL');assert.equal(sarcopenia.lifecycle.hasResults,false);
 for(const id of ['NCT07858331','NCT07859137','NCT07859150','NCT07859163','NCT07859176','NCT07859189']){const specialist=registrySources.find(s=>s.nctId===id);assert.ok(specialist);assert.equal(specialist.lifecycle.status,'NOT_YET_RECRUITING');assert.equal(specialist.lifecycle.start.type,'ESTIMATED');assert.equal(specialist.lifecycle.hasResults,false);}
 assert.equal(supportSources.length,4);
});
test('registry lifecycle preserves actual/estimated dates and flags meaningful changes',async()=>{
 const initial=fixture(),before=await fingerprint(initial);
 for(const edit of [d=>d.protocolSection.statusModule.overallStatus='COMPLETED',d=>d.protocolSection.designModule.enrollmentInfo.count=30,d=>d.protocolSection.statusModule.completionDateStruct.type='ACTUAL',d=>{d.hasResults=true;d.resultsSection={};}]){const d=structuredClone(initial);edit(d);assert.notEqual(await fingerprint(d),before);}
 const reordered=JSON.parse(JSON.stringify(initial,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).reverse()):v));assert.equal(await fingerprint(reordered),before);
 const irrelevant=structuredClone(initial);irrelevant.unrelated={navigation:'change'};assert.equal(await fingerprint(irrelevant),before);
});
test('partial/error/incorrect registry documents never become green',async()=>{
 await assert.rejects(fingerprint({}),/source_identity_not_verified/);
 const wrong=fixture();wrong.protocolSection.identificationModule.nctId='NCT87654321';await assert.rejects(fingerprint(wrong),/source_identity_not_verified/);
 const partial=fixture();delete partial.hasResults;await assert.rejects(fingerprint(partial),/invalid_json/);
 const results=fixture();results.hasResults=true;await assert.rejects(fingerprint(results),/invalid_json/);
 await assert.rejects(fingerprintSource(source,'<html>Error</html>','text/html'),/unexpected_content_type/);
});
test('HTML comparator text cannot hide a later required indication; fingerprint stays stable',async()=>{
 const html='<html><title>Medicine</title><main><p>'+('Reviewed product information. '.repeat(5))+'BMI &lt;30 with conditions. MASH indication. Dose &gt;5 mg.</p></main></html>';
 const s={format:'html',requiredTerms:['Medicine','MASH indication']};
 const result=await fingerprintSource(s,html,'text/html');
 assert.equal(result.fingerprint,(await fingerprintSource({...s,requiredTerms:['Medicine']},html,'text/html')).fingerprint);
 await assert.rejects(fingerprintSource(s,html.replace('MASH indication','other text'),'text/html'),/source_identity_not_verified/);
});
test('public status distinguishes record review, summary review, results and uncertain access',()=>{
 const s=registrySources[0];const markup=registryEvidenceMarkup({url:s.url,title:'A <record>',reviewedAt:'2026-09-01'},{});
 assert.match(markup,/A &lt;record&gt;/);assert.match(markup,/Medical evidence summary reviewed 1 September 2026/);assert.match(markup,/Record status reviewed 3 October 2026/);assert.match(markup,/Verification pending/);
 const overdueSource=registrySources.find(source=>source.nctId==='NCT07721597');
 const entry=industry.find(e=>overdueSource.entryIds.includes(e.id));assert.match(industryReviewFlag(entry,{},Date.parse(entry.reviewedAt)+8*24*60*60*1000),/due for factual review/);
 const html=credibilityMarkup({});for(const id of ['watch-changes','watch-safety','watch-uk-access'])assert.match(html,new RegExp(id));assert.match(html,/Current operational access remains unverified/);assert.match(html,/Reporting does not replace urgent medical care/);assert.match(html,/International maintenance and combination evidence/);assert.match(html,/catalogue now contains 96 programmes/);assert.match(html,/industry-zynergy-petrelintide-enicepatide/);assert.match(html,/VK2735 maintenance study/);assert.match(html,/industry-vk2735/);
});
