import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {sources} from '../medicines-watch/data.mjs';
import {verifyLiveSourceReviews} from '../medicines-watch/verify-live-sources.mjs';

const displayOnly=process.env.WATCH_ACCESS_ORDERS_DISPLAY_ONLY==='true';
if(displayOnly){
  const manifest=JSON.parse(readFileSync('release/b1-runtime-only.json'));
  assert.equal(manifest.approvedScope,'my-timber-orders-display');
  assert.equal(manifest.applicationCommit,'6053dac56653303ee1617d181b3005da577a1cae');
}
const response=await fetch('https://shiftsometimber.co.uk/v1/medicines-watch/health',{
  headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)
});
assert.equal(response.status,200);
const health=await response.json();
assert.equal(health.available,true);
verifyLiveSourceReviews(health.sources,sources);
const repaired=health.sources.filter(s=>['mounjaro-nhs','wegovy-tablet-private'].includes(s.id));
assert.equal(repaired.length,2);
for(const source of repaired){
  assert.equal(source.checkStatus,'current');
  assert.equal(source.httpStatus,200);
  if(displayOnly&&source.status==='awaiting_review'){
    assert.equal(source.reviewStatus,'awaiting_review');
    assert.ok(source.reasons.length&&source.reasons.every(reason=>['review_due','source_changed'].includes(reason)),source.id+' has an unexpected review reason');
  }else{
    assert.equal(source.status,'current',`${source.id}: ${source.reasons.join(', ')}`);
    assert.equal(source.reviewStatus,'reviewed');
    assert.deepEqual(source.reasons,[]);
  }
}
const report={proof:'WATCH_ACCESS_SOURCE_CLOSEOUT_V1',mode:displayOnly?'orders-display-with-clinical-review-pending':'full-clinical-closeout',pendingClinicalReview:repaired.filter(s=>s.status==='awaiting_review').map(s=>({id:s.id,reasons:s.reasons})),checkedAt:new Date().toISOString(),
  totalSources:health.sources.length,currentSources:health.sources.filter(s=>s.status==='current').length,repaired};
writeFileSync('watch-access-closeout.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
