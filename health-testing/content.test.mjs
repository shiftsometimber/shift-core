import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rangeProducts,rangeById} from './catalogue.mjs';
import {testingContent} from './public.mjs';

test('fertility preparation and cholesterol reading window remain explicit on the product pages',()=>{
 const fertility=testingContent('/shift-health/testing/male-fertility').content;
 assert(fertility.includes('one hour'));
 assert(fertility.includes('1-hour preparation + 5-minute test'));
 assert(fertility.includes('0.1 mL'));
 const cholesterol=testingContent('/shift-health/testing/cholesterol').content;
 assert(cholesterol.includes('wait two minutes'));
 assert(cholesterol.includes('Within the next 30 seconds'));
 assert(!cholesterol.includes('drops of buffer'));
});

test('urine, stool and blood methods retain their distinct verified collection steps',()=>{
 const kidney=testingContent('/shift-health/testing/kidney-health').content;
 assert(kidney.includes('10–15 seconds'));
 assert(kidney.includes('Replace the cap and lay the device on a flat surface'));
 assert(!/lancet|blood sample|buffer/i.test(kidney));
 assert(rangeById['bowel-health'].collect.includes('three areas'));
 assert(rangeById.iron.run.includes('one drop of buffer'));
 assert(rangeById['prostate-health'].run.includes('two drops of buffer'));
 assert(rangeById['vitamin-d'].run.includes('two drops of buffer'));
 assert(rangeById.thyroid.run.includes('two drops of blood'));
 assert(rangeById.thyroid.run.includes('two drops of buffer'));
});

test('verified supplement facts and unresolved labels are shown without invented ingredients',()=>{
 for(const id of ['multivitamin','vitamin-d-supplement','iron-supplement']){
  const p=rangeById[id],html=testingContent('/shift-health/testing/'+id).content;
  assert.equal(p.sample,'Capsules');assert(p.pack.includes('60 capsules'));
  assert(p.pack.includes('vegans'));assert(html.includes('one capsule daily'));
  assert(html.includes('Full ingredients, allergens and warnings will be shown before ordering opens.'));
 }
 assert(rangeById['vitamin-d-supplement'].strength.includes('1,000 IU'));
 assert(rangeById['iron-supplement'].strength.includes('20 mg elemental iron'));
 assert(!rangeById['general-health-combo'].description.includes('optional multivitamin'));
 const general=testingContent('/shift-health/testing/general-health-bundle').content;
 assert(!general.includes('Do I need a supplement?'));
 assert(!general.includes('id="how-it-works"'));
});

test('all twenty products have current source evidence and unsupported lab promises stay out of the public pages',()=>{
 const audit=JSON.parse(readFileSync(new URL('./content-audit.json',import.meta.url),'utf8'));
 assert.equal(audit.products.length,20);
 assert.deepEqual(audit.products.map(p=>p.id),rangeProducts.map(p=>p.id));
 for(const p of audit.products){assert.match(p.sourceSha256,/^[a-f0-9]{64}$/);assert.equal(p.checkedOn,'2026-10-28');assert(p.openItems.length>0);}
 for(const id of ['psa-lab','male-hormone','heart-health']){
  const html=testingContent('/shift-health/testing/'+id).content;
  assert(html.includes('Coming soon'));assert(html.includes('Timing to be confirmed at launch'));
  assert(!/48.hour|within 48|GP.reviewed|CLIA.certified|NHS.approved|99% accurate/i.test(html));
 }
});
