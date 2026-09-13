// Local, read-only source import. Never publishes structured_content or touches D1.
import fs from 'node:fs';import assert from 'node:assert/strict';import {fingerprint} from './catalogue-data.mjs';
const file=process.argv[2];assert.ok(file,'Pass the locally regenerated grub-v1-publishable.json');
const payload=JSON.parse(fs.readFileSync(file));
assert.equal(payload.proof,'M11_V1_PUBLISHABLE_CONTENT_V1');assert.equal(payload.items.length,798);
assert.ok(payload.items.every(r=>r.status==='published'&&r.review?.status==='approved'));
const meals={breakfast:212,lunch:204,dinner:195,snack:187};
for(const [meal,count] of Object.entries(meals)){
  const rows=payload.items.filter(r=>r.data.meal_type===meal).map(r=>({id:r.id,title:r.title,kind:'food',meal,source:Object.fromEntries(['servings','ingredients','method','equipment','storage','food_safety','allergens'].map(k=>[k,r.data[k]??null]))}));
  assert.equal(rows.length,count);
  fs.writeFileSync(`preview/fit-grub/catalogue/${meal}.json`,JSON.stringify(rows)+'\n');
}
fs.writeFileSync('preview/fit-grub/catalogue/provenance.json',JSON.stringify({scope:'Accepted catalogue snapshot, not a live database export',payloadProof:payload.proof,payloadHash:fingerprint(payload),sourceGenerator:'industrial-catalogue-v14.js',acceptanceFile:'evidence/grub-v1-final-decisions-2026-08-14.json',acceptanceHash:fingerprint(JSON.parse(fs.readFileSync('evidence/grub-v1-final-decisions-2026-08-14.json'))),counts:meals},null,2)+'\n');
