import test from 'node:test';
import assert from 'node:assert/strict';
import {continuityPages} from '../../public-continuity.mjs';
import {improveContinuityEntry,improveContinuityArrival,continuityToday,continuityReviewPaths} from '../../preview/growth-member/continuity-journey.mjs';
test('Continuity preview changes only its primary CTA and adds the documented support explanation',()=>{
 for(const path of continuityReviewPaths){
  const before='<html><head></head><body><header>locked</header><main>'+continuityPages[path].body+'</main><footer>locked</footer></body></html>',after=improveContinuityEntry(before,path);
  assert.match(after,/My Timber is free/);assert.match(after,/not a transfer of clinical records/);assert(after.includes(continuityToday));
  const restored=after.replace(/<section data-growth-continuity[\s\S]*?<\/section>/,'').replace(/<a class="continuity-button" data-continuity-primary[^>]*>[\s\S]*?<\/a>/,path==='/clinic-gone-quiet'?'<a class="continuity-button" href="/start-here">Start with where you are →</a>':'<a class="continuity-button" href="/start-here">Tell SHIFT where you are now →</a>');
  assert.equal(restored,before);assert.equal(improveContinuityEntry(after,path),after);
 }
 assert.equal(improveContinuityEntry('untouched','/help'),'untouched');
 assert.throws(()=>improveContinuityEntry('<main>changed</main>',continuityReviewPaths[0]),/baseline changed/);
});
test('Continuity arrival is presentation-only, idempotent and restricted to the chosen Today route',()=>{
 const html='<html><head></head><body><main><section id="memberDayGuide">Existing guide</section><section id="dailyCheckinFollowup">Existing feedback</section></main></body></html>';
 const out=improveContinuityArrival(html,'https://example.invalid'+continuityToday);
 assert.match(out,/Same you\. Same My Timber/);assert.match(out,/Existing feedback/);assert.doesNotMatch(out,/<script|fetch\(|localStorage|sessionStorage/);
 assert.match(out,/<details><summary>New here, or looking for your records\?/);assert.doesNotMatch(out,/<details[^>]*open/);
 assert.equal(out.replace(/<section id="continuityWelcome"[\s\S]*?<\/section>/,'').replace(/<style data-continuity-welcome-style>[\s\S]*?<\/style>/,''),html);
 for(const path of ['/member/dashboard','/member/dashboard?entry=other','/member/settings?entry=continuity'])assert.equal(improveContinuityArrival(html,'https://example.invalid'+path),html);
 assert.equal(improveContinuityArrival(out,'https://example.invalid'+continuityToday),out);
});
