import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateTechnicalComposition,verifyTechnicalHistory,TECHNICAL_PATHS} from '../release/seo-technical-scope.mjs';
import {TECHNICAL_SCHEMA_PAIRS} from '../release/seo-technical-preservation-data.mjs';
import {preserveTechnicalSeo} from '../release/seo-technical-preservation.mjs';
test('technical release remains bound to exact source, scope and user request',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition.technicalComposition;
 validateTechnicalComposition(c);verifyTechnicalHistory(c);assert.equal(TECHNICAL_PATHS.length,19);
 for(const patch of [{payloadSource:'a'.repeat(40)},{base:'a'.repeat(40)},{payloadPaths:['unexpected']},{maintenancePaths:['unexpected']},{request:{...c.request,scope:'Arbitrary publication'}}])assert.throws(()=>validateTechnicalComposition({...c,...patch}));
});
test('261 exact schema fixtures reverse without masking any other bytes or unknown JSON changes',()=>{
 assert.equal(Object.keys(TECHNICAL_SCHEMA_PAIRS).length,261);
 for(const [path,pairs] of Object.entries(TECHNICAL_SCHEMA_PAIRS)){
  for(const [before,after] of pairs){
   const wrap=s=>Buffer.from('<main>Original visible content</main><script type="application/ld+json">'+s+'</script>');
   assert.deepEqual(preserveTechnicalSeo(path,wrap(after)),wrap(before));
   const unknown=wrap(after.replace(/"headline":/,'"unexpected":true,"headline":'));
   assert.deepEqual(preserveTechnicalSeo(path,unknown),unknown);
   const changed=Buffer.from(wrap(after).toString().replace('Original visible content','Unreviewed extra words'));
   assert.notDeepEqual(preserveTechnicalSeo(path,changed),wrap(before));
  }
 }
 const privateBody=Buffer.from('Private content');assert.equal(preserveTechnicalSeo('/member/dashboard',privateBody),privateBody);
});
