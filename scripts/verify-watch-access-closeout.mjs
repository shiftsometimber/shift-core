import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {sources} from '../medicines-watch/data.mjs';
import {verifyLiveSourceReviews} from '../medicines-watch/verify-live-sources.mjs';

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
  assert.equal(source.status,'current',`${source.id}: ${source.reasons.join(', ')}`);
  assert.equal(source.checkStatus,'current');
  assert.equal(source.reviewStatus,'reviewed');
  assert.equal(source.httpStatus,200);
  assert.deepEqual(source.reasons,[]);
}
const report={proof:'WATCH_ACCESS_SOURCE_CLOSEOUT_V1',checkedAt:new Date().toISOString(),
  totalSources:health.sources.length,currentSources:health.sources.filter(s=>s.status==='current').length,repaired};
writeFileSync('watch-access-closeout.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
