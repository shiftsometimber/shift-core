import test from 'node:test';import assert from 'node:assert/strict';
import {matchesSearch,evidenceQueue,manualEvidence,evidenceDeskMarkup} from './evidence-desk.mjs';
import {sources,medicines} from './data.mjs';import {industry} from './industry.mjs';
import {industryMarkup} from './industry-page.mjs';import {registrySources,registryEvidenceMarkup} from './credibility.mjs';
import {topicQueriesForDate,summariseTopicDiscovery,discoveryTopics} from './discovery.mjs';
import receipt from './reviews/2026-10-03-evidence-desk-zp6590.json' with {type:'json'};
const now=Date.parse('2026-10-03T21:00:00Z');
test('programme search combines developer and mechanism without implying suitability',()=>{
 assert.ok(matchesSearch(industry.find(e=>e.id==='zp6590'),'zealand GIP'));
 const html=industryMarkup({},new URLSearchParams('q=Viking'));
 assert.match(html,/industry-vk3019/);assert.doesNotMatch(html,/id="industry-zp6590"/);
 assert.ok(matchesSearch({name:'A',developer:'B'},'  a B '));assert.equal(matchesSearch({name:'A',clinicalApproval:null},'null'),false);
});
test('review work and retrieval work remain independent and can overlap',()=>{
 const fixture=[{id:'changed',reviewedAt:'2026-10-03',reviewedFingerprint:'f'},{id:'both',reviewedAt:'2026-09-01',reviewedFingerprint:'f'},{id:'pending',reviewedAt:'2026-10-03'}];
 const q=evidenceQueue(fixture,{sources:[{id:'changed',status:'awaiting_review',reasons:['source_changed']},{id:'both',status:'awaiting_review',checkStatus:'check_delayed',reasons:['last_check_failed']}]},now);
 assert.equal(q[0].review,true);assert.equal(q[0].delayed,false);assert.equal(q[1].review,true);assert.equal(q[1].delayed,true);assert.equal(q[2].pending,true);
 const unavailable=evidenceQueue(fixture,{available:false,sources:fixture.map(s=>({id:s.id,status:'current'}))},now);assert.equal(unavailable.length,3);assert.ok(unavailable.every(s=>s.pending));
});
test('coverage directory deduplicates exact configured URLs and escapes evidence',()=>{
 const entries=[{name:'<A>',additionalEvidence:[{title:'<source>',url:'https://example.com/a'}]},{name:'B',evidenceLinks:[{url:'https://example.com/a'}]}];
 assert.equal(manualEvidence(entries,[]).length,1);assert.equal(manualEvidence(entries,[{url:'https://example.com/a'}]).length,0);
 const html=evidenceDeskMarkup([],entries,{},now);assert.match(html,/&lt;source&gt;/);assert.match(html,/not complete/);assert.doesNotMatch(html,/<A>/);
});
test('ZP6590 review preserves conflicts, estimates and absent results',()=>{
 const entry=industry.find(e=>e.id==='zp6590'),s=registrySources.find(s=>s.nctId==='NCT07721597');
 assert.equal(s.lifecycle.status,'RECRUITING');assert.deepEqual(s.lifecycle.start,{date:'2026-07-09',type:'ACTUAL'});assert.equal(s.lifecycle.hasResults,false);assert.equal(entry.clinicalApproval,null);assert.match(entry.limitations,/next step/);assert.match(entry.limitations,/not human combination benefits/);
 assert.match(registryEvidenceMarkup(entry.additionalEvidence[0],{}),/Last reviewed record: Recruiting/);assert.match(registryEvidenceMarkup(entry.additionalEvidence[0],{}),/6 September 2027 \(estimated\)/);
 assert.equal(receipt.monitorObservationsSeeded,false);assert.equal(receipt.industryComplete,false);assert.match(receipt.discovery.rejectedLeads[0].outcome,/eloralintide/);
 assert.equal(medicines.length+industry.length,109);assert.equal(sources.length,194);
});
test('topic discovery requires dated and undated attempts; failure is never completion',()=>{
 const date=new Date(now),plan=topicQueriesForDate(date);assert.equal(plan.length,discoveryTopics.length*2);assert.ok(plan.every(q=>!q.q.includes('site:')));
 const result=summariseTopicDiscovery([{id:plan[0].id,status:'blocked',error:'Access denied'}],date);
 assert.equal(result.scanComplete,false);assert.equal(result.failed[0].error,'Access denied');assert.equal(result.missing.length,plan.length-1);assert.equal(result.industryComplete,false);
 assert.equal(summariseTopicDiscovery(plan.map(q=>({id:q.id,status:'searched'})),date).scanComplete,true);
});
