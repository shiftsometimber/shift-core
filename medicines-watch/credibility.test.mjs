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
 assert.equal(urls.size,69);assert.deepEqual(new Set(registrySources.map(s=>s.url)),urls);
 assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);assert.equal(sources.length,125);
 for(const s of registrySources){assert.match(s.reviewedFingerprint,/^[a-f0-9]{64}$/);assert.equal(s.nctId,s.lifecycle.nctId);assert.ok(s.reviewedAt);}
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
 const entry=industry.find(e=>s.entryIds.includes(e.id));assert.match(industryReviewFlag(entry,{},Date.parse('2026-10-12')),/due for factual review/);
 const html=credibilityMarkup({});for(const id of ['watch-changes','watch-safety','watch-uk-access'])assert.match(html,new RegExp(id));assert.match(html,/Current operational access remains unverified/);assert.match(html,/Reporting does not replace urgent medical care/);assert.match(html,/Added ART27\.13 as a non-clinical GLP-1 companion exploration/);assert.match(html,/catalogue now contains 90 programmes/);assert.match(html,/industry-art2713/);
});
