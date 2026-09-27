import test from 'node:test';
import assert from 'node:assert/strict';
import {AUTO_NEWS_POLICY,AUTO_NEWS_ACTOR,AUTO_NEWS_DESTINATIONS,autoNewsEligibility,autoNewsReviewPass,checkAndPublishAutoNews} from '../radar-auto-news-v1.js';
const now=Date.parse('2026-09-17T12:00:00Z');
const source={source_tier:1,authority:'UK authority',url:'https://www.gov.uk/example',source_date:'2026-09-16',retrieved_at:'2026-09-17T11:00:00Z',summary:'The authority has published a new update explaining the status of a public consultation. The consultation invites responses from stakeholders. It does not announce a change to treatment eligibility or prescribing rules. Final decisions have not yet been made.'};
const row=()=>({id:1,status:'ready_for_review',verification_json:'{"verified":true}',source_evidence_json:JSON.stringify([source]),source_review_generation:0,medicine_patch_json:'{}'});
const pkg=()=>({editorial_policy:AUTO_NEWS_POLICY,headline:'Authority opens a public consultation',standfirst:'A new consultation invites stakeholder responses.',article_markdown:'## Source findings\n\nThe authority has opened a consultation and invites responses. It has not announced a final decision.',shift_take:'Members can follow the consultation without assuming that treatment access has changed.',known_facts:[{claim:'The consultation is open.',source_url:source.url}],unknowns:['Final outcome'],review_flags:[],seo:{title:'Authority opens a public consultation'}});
const pass=()=>({decision:'PASS',claims_supported:true,attribution_correct:true,uncertainty_preserved:true,interpretation_separated:true,no_treatment_advice:true,no_promotion:true,no_substantial_copying:true,issues:[]});
test('routine attributed news qualifies; discovery, stale sources and existing decisions do not',()=>{
 assert.equal(autoNewsEligibility(row(),pkg(),{review_flags:[]},now).ok,true);
 for(const changes of [{source_tier:4},{discovery_only:true},{conflict:true},{summary:'Headline only'},{source_date:'2099-01-01'},{retrieved_at:'2026-08-01'},{url:'javascript:alert(1)'}])assert.equal(autoNewsEligibility({...row(),source_evidence_json:JSON.stringify([{...source,...changes}])},pkg(),{review_flags:[]},now).ok,false);
 for(const changes of [{status:'hold'},{status:'rejected'},{reviewed_by:'owner'},{reviewed_at:'2026-09-16'},{source_review_generation:1}])assert.equal(autoNewsEligibility({...row(),...changes},pkg(),{review_flags:[]},now).ok,false);
});
test('unsupported citations, legacy copy, advice, flags and excessive reproduction require review',()=>{
 for(const changes of [{editorial_policy:'old'},{shift_take:''},{review_flags:['risk']},{known_facts:[{claim:'Unsupported',source_url:'https://other.test'}]},{article_markdown:'You should stop your medication.'},{article_markdown:'word '.repeat(181)},{known_facts:'malformed'}])assert.equal(autoNewsEligibility(row(),{...pkg(),...changes},{review_flags:[]},now).ok,false);
 assert.equal(autoNewsEligibility(row(),pkg(),{review_flags:['registry uncertainty']},now).ok,false);
 assert.equal(autoNewsEligibility({...row(),source_evidence_json:'{}'},pkg(),{review_flags:[]},now).ok,false);
});
test('review fails closed on missing, string or conflicting decisions',()=>{
 assert.equal(autoNewsReviewPass(pass()),true);
 for(const change of [{decision:'HOLD'},{no_treatment_advice:'true'},{claims_supported:false},{issues:['unsupported number']},{issues:null}])assert.equal(autoNewsReviewPass({...pass(),...change}),false);
 assert.equal(autoNewsReviewPass(null),false);
});
async function exercise({review=pass(),race=false,approveOK=true}={}){
 const calls=[];let approved;
 const result=await checkAndPublishAutoNews({row:row(),pkg:pkg(),patch:{review_flags:[]},now,hash:async()=> 'bound-content-hash',review:async()=>{calls.push('review');return review},audit:async(action,detail)=>{calls.push('audit');assert.equal(detail.human_review,false)},approve:async(snapshot,body)=>{calls.push('approve');assert.equal(snapshot.source_evidence_json,row().source_evidence_json);assert.deepEqual(body.destinations,AUTO_NEWS_DESTINATIONS);assert.deepEqual(body.medicinePatch,{});approved=body.contentPackage;return{ok:approveOK,contentPackage:approved}},readCurrent:async()=>({...row(),status:'approved',reviewed_by:race?'owner':AUTO_NEWS_ACTOR,content_package_json:JSON.stringify(approved)}),publish:async snapshot=>{calls.push('publish');assert.equal(snapshot.reviewed_by,AUTO_NEWS_ACTOR);return{ok:true,status:'published'}}});
 return{result,calls,approved};
}
test('passing separate accuracy review invokes existing guarded publication with website-only destinations',async()=>{
 const {result,calls,approved}=await exercise();assert.equal(result.status,'published');assert.deepEqual(calls,['review','audit','approve','publish']);assert.equal(approved.automatic_review.clinical_review,false);assert.equal(approved.seo.reviewer,'SHIFT AI automated accuracy check');assert.deepEqual(approved.existing_page_updates,[]);assert.equal(approved.destinations.some(x=>/email|push|social|dossier/.test(x)),false);
});
test('failed review, failed approval and intervening owner changes never publish',async()=>{
 for(const options of [{review:{...pass(),decision:'HOLD'}},{approveOK:false},{race:true}]){const x=await exercise(options);assert.equal(x.result.ok,false);assert.ok(!x.calls.includes('publish'))}
});
