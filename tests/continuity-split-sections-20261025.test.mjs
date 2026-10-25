import test from 'node:test';
import assert from 'node:assert/strict';
import {additions,preserveContinuityUpgrade} from '../release/continuity-content-20261009.mjs';
for(const path of Object.keys(additions)){
 const addition=additions[path],sections=addition.match(/<section(?: [^>]*)?>[\s\S]*?<\/section>/g);
 const b=s=>Buffer.from(s),run=(s,required=true)=>preserveContinuityUpgrade(path,b(s),{required}).toString();
 test(path+' original contiguous content preserves every surrounding byte',()=>assert.equal(run('before'+addition+'after'),'beforeafter'));
 test(path+' three exact sections can surround independently retained layout and growth bytes',()=>{
  const middle=['</div></div><div class="qpp-reading"><section data-growth-continuity>approved growth remains</section>','</div><div class="qpp-reading">'];
  assert.equal(run('before'+sections[0]+middle[0]+sections[1]+middle[1]+sections[2]+'after'),'before'+middle[0]+middle[1]+'after');
 });
 test(path+' no approved section may be missing or duplicated',()=>{
  for(let i=0;i<3;i++){
   assert.throws(()=>run(sections.filter((_,j)=>i!==j).join('')),/missing exact registered content|unrecognised content amendment/);
   assert.throws(()=>run(addition+sections[i]),/duplicate approved content/);
  }
 });
 test(path+' changed content, reversed order and foreign review markers fail closed',()=>{
  assert.throws(()=>run(addition.replace('<h2>','<h2>ALTERED ' )),/missing exact registered content/);
  assert.throws(()=>run([...sections].reverse().join('')),/approved content order changed/);
  assert.throws(()=>run(addition+'<p data-content-review="2026-10-09">foreign</p>'),/unrecognised content amendment/);
 });
 test(path+' optional absence is distinct from required delivery and unrelated bytes stay visible',()=>{
  assert.equal(run('unchanged',false),'unchanged');assert.throws(()=>run('unchanged'),/missing exact registered content/);
  const original=run('A'+addition+'B'),changed=run('A'+addition+'B changed');assert.notEqual(changed,original);
 });
}
test('unrelated paths remain byte-identical',()=>{const input=Buffer.from('arbitrary content');assert.equal(preserveContinuityUpgrade('/unrelated',input,{required:true}),input);});

import {createHash} from 'node:crypto';
import {validateIndependentPresentation,assertIndependentPresentationsPreserved} from '../release/independent-presentation-preservation-20261025.mjs';
import {removeReviewedHomeBanner} from '../release/member-details-preservation.mjs';
import {banner,css} from '../home-route-banner.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const testPolicy={source:'a'.repeat(40),versionHeader:'x-approved-version',version:'approved-v1',mainSHA256:sha('exact approved content'),mainBytes:22,styleOpen:'<style data-exact>',styleSHA256:sha('exact stylesheet'),styleBytes:16};
const presentation='<html><head><style data-exact>exact stylesheet</style></head><body><main>exact approved content</main></body></html>';
const headers=new Headers({'x-approved-version':'approved-v1'});
test('independent presentation authenticates every exact approved main/style byte and version',()=>{const r=validateIndependentPresentation(presentation,headers,testPolicy);assert.equal(r.source,testPolicy.source);assert.equal(r.comparison,'entire_raw_response_must_remain_byte_identical');});
test('independent presentation refuses changed content, styles, version and duplicate mains/styles',()=>{
 for(const html of [presentation.replace('exact approved content','changed'),presentation.replace('exact stylesheet','changed'),presentation.replace('</body>','<main>extra</main></body>'),presentation.replace('</head>','<style data-exact>exact stylesheet</style></head>')])assert.throws(()=>validateIndependentPresentation(html,headers,testPolicy));
 assert.throws(()=>validateIndependentPresentation(presentation,new Headers({'x-approved-version':'wrong'}),testPolicy));
});
test('independent boundary cannot hide foreign presentation exceptions or path/order changes',()=>{
 const raw={path:'/other',status:200,sha256:'abc',bytes:3};assert.deepEqual(assertIndependentPresentationsPreserved([raw],[raw]),[raw]);
 assert.throws(()=>assertIndependentPresentationsPreserved([{...raw,independentPresentation:{}}],[raw]),/Foreign/);
 assert.throws(()=>assertIndependentPresentationsPreserved([raw],[{...raw,path:'/changed'}]),/paths\/order/);
});
const titleRule='html body #main-content.template-home #sst-home-route-title{font-size:clamp(24.3px,2.88vw,46.8px)!important}';
const anchor='<section aria-labelledby="struggle-artwork-title" class="struggle-artwork-section">';
const approvedBanner='<head>'+css+'</head>'+banner+anchor;
test('exact approved responsive title selector survives legacy banner removal byte-for-byte',()=>{assert.equal(removeReviewedHomeBanner(approvedBanner+titleRule),'<head></head>'+anchor+titleRule);});
test('homepage selector repair still denies duplicate banners, altered/duplicate rules and marker collisions',()=>{
 for(const html of [approvedBanner+banner+titleRule,approvedBanner+titleRule.replace('24.3px','24.4px'),approvedBanner+titleRule+titleRule,approvedBanner+'/*SHIFT_REVIEWED_HOME_TITLE_RULE_20261025*/'])assert.throws(()=>removeReviewedHomeBanner(html));
});

import actualPresentationPins from '../release/independent-presentation-pins-20261025.json' with {type:'json'};
test('independent approved pages still reject any full raw response, size, policy or boundary drift',()=>{
 const path='/help',policy=actualPresentationPins[path];const evidence={source:policy.source,version:policy.version,mainSHA256:policy.mainSHA256,styleSHA256:policy.styleSHA256,sourcePolicySHA256:sha(JSON.stringify(policy)),comparison:'entire_raw_response_must_remain_byte_identical'};
 const baseline={path,status:200,sha256:'actual-full-response',bytes:100,independentPresentation:evidence};
 assert.deepEqual(assertIndependentPresentationsPreserved([baseline],[baseline]),[]);
 for(const changed of [{...baseline,sha256:'changed'},{...baseline,bytes:101},{...baseline,status:500},{...baseline,independentPresentation:{...evidence,sourcePolicySHA256:'changed'}},{...baseline,independentPresentation:null}])assert.throws(()=>assertIndependentPresentationsPreserved([changed],[baseline]));
});
