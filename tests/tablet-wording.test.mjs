import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLET_WORDING,tightenTabletWording,correctOasis4,preserveTabletWording} from '../tablet-wording-v1.mjs';
import {repairPromiseResponse} from '../public-promise-accuracy-v1.mjs';
test('only authorised Start Here wording changes; homepage and unrelated bytes remain protected',()=>{
 const before=TABLET_WORDING.map(([s])=>'<p>'+s+'</p>').join('')+'<p>£129 · No stock available today · assessment required</p>';
 const after=tightenTabletWording('/start-here',before);
 assert.equal(tightenTabletWording('/',before),before);
 assert.equal(tightenTabletWording('/foundayo',before),before);
 assert.equal(tightenTabletWording('/start-here',after),after);
 assert.match(after,/£129 · No stock available today · assessment required/);
 assert.deepEqual(preserveTabletWording('/start-here',Buffer.from(before)),preserveTabletWording('/start-here',Buffer.from(after),{required:true}));
 assert.throws(()=>preserveTabletWording('/start-here',Buffer.from(before),{required:true}));
 assert.throws(()=>preserveTabletWording('/start-here',Buffer.from(after+after),{required:true}));
 assert.notDeepEqual(preserveTabletWording('/start-here',Buffer.from(after.replace('£129','£130')),{required:true}),Buffer.from(after));
});
test('OASIS correction leaves injection doses and other trial groups unchanged',()=>{
 const other="dose:'2.4 mg';trial:[['Wegovy 2.4 mg',14.9],['Placebo',2.4]];trial:[['Tirzepatide 15 mg',22.5],['Placebo',2.4]];";
 const before=other+"trial:[['Oral semaglutide',13.6],['Placebo',2.4]]";
 const after=correctOasis4(before);
 assert.equal(after,other+"trial:[['Oral semaglutide',13.6],['Placebo',2.2]]");
 assert.equal(correctOasis4(after),after);
});
test('response integration repairs HTML and already-repaired script, invalidates stale validators',async()=>{
 for(const [path,before,after] of [['/start-here',TABLET_WORDING[0][0],TABLET_WORDING[0][1]],['/medicine-front-door-integrated-v1.js',"// SHIFT eligibility payload 20261002\ntrial:[['Oral semaglutide',13.6],['Placebo',2.4]]","// SHIFT eligibility payload 20261002\ntrial:[['Oral semaglutide',13.6],['Placebo',2.2]]"]]){
  const response=await repairPromiseResponse(new Response(before,{headers:{ETag:'old','Content-Length':'99','Content-Type':path.endsWith('.js')?'application/javascript':'text/html'}}),new Request('https://example.test'+path));
  assert.equal(await response.text(),after);assert.equal(response.headers.get('ETag'),null);assert.equal(response.headers.get('Content-Length'),null);assert.equal(response.headers.get('Cache-Control'),'no-store');
 }
});
