import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProtectedRevisionCandidates,protectedRevisionContentHash} from '../grub-protected-revisions-v2.mjs';
import {DEFAULT_COFID_INDEX} from '../grub-expansion-review-pack.mjs';
import {digest} from '../grub-expansion-repairs-v1.mjs';
process.env.COFID_INDEX ||= DEFAULT_COFID_INDEX;
const {APPROVED,grams} = await import('../industrial-grub-systemic-v3.mjs');
const proposalPack=JSON.parse(fs.readFileSync(new URL('../evidence/grub-expansion-closeout-2026-09-16/protected-quantity-revisions.json',import.meta.url)));
const options={proposalPack,foods:new Map(JSON.parse(fs.readFileSync(DEFAULT_COFID_INDEX)).foods.map(row=>[String(row.code),row])),mappings:APPROVED,retainedGrams:grams};
const before=JSON.stringify(proposalPack),result=buildProtectedRevisionCandidates(options);

test('twelve successors are separate exact-hash rows and never alter accepted source proposals',()=>{
 assert.equal(JSON.stringify(proposalPack),before);
 assert.equal(result.revision_count,12);
 assert.equal(new Set(result.candidates.map(row=>row.id)).size,12);
 for(const row of result.candidates){
  const original=proposalPack.revisions.find(source=>source.source_id===row.original_id);
  assert.ok(original);
  assert.notEqual(row.id,row.original_id);
  assert.equal(row.expected_source_content_hash,original.expected_current_content_hash);
  assert.equal(row.structured_item_draft.title,original.proposed_content.title);
  assert.equal(row.structured_item_draft.status,'draft');
  assert.equal(row.structured_item_draft.review.status,'pending');
  assert.equal(row.structured_item_draft.review.human_review_claimed,false);
  assert.equal(row.content_hash,protectedRevisionContentHash(row));
  const changed=structuredClone(row);changed.structured_item_draft.data.method.push('different');
  assert.notEqual(protectedRevisionContentHash(changed),row.content_hash);
 }
});

test('tampered, duplicated and invented original authorities fail closed',()=>{
 const changed=structuredClone(proposalPack);changed.revisions[0].proposed_content.ingredients[0].amount='999g';
 assert.throws(()=>buildProtectedRevisionCandidates({...options,proposalPack:changed}),/proposal digest/);
 const invented=structuredClone(proposalPack);invented.revisions[0].expected_current_content_hash='0'.repeat(64);
 const {correction_digest,...body}=invented.revisions[0];invented.revisions[0].correction_digest=digest(body);
 assert.throws(()=>buildProtectedRevisionCandidates({...options,proposalPack:invented}),/accepted original content hash/);
 const duplicate=structuredClone(proposalPack);duplicate.revisions[1]=duplicate.revisions[0];
 assert.throws(()=>buildProtectedRevisionCandidates({...options,proposalPack:duplicate}),/identity mismatch/);
});

test('all twelve really cook the listed potatoes and use the complete measured portion',()=>{
 for(const row of result.candidates){const d=row.structured_item_draft.data,m=d.method.join(' ');
  assert.equal(d.ingredients.find(i=>i.item==='olive oil').amount,'10ml');
  assert.match(m,/8–10 minutes until a fork passes easily/);
  assert.match(m,/two small, thin potato patties/);
  assert.match(m,/6ml/);assert.match(m,/2ml/);
  assert.match(m,/remaining/);
  assert.ok(d.equipment.includes('saucepan')&&d.equipment.includes('colander')&&d.equipment.includes('two-frying-pans'));
  assert.equal(d.total_minutes,d.prep_minutes+d.cook_minutes+d.rest_minutes);
  assert.ok(!/measured sauce or seasoning/.test(m));
 }
});

test('protein state corrections prevent raw-bacon nutrition and double-reheat regressions',()=>{
 const bacon=result.candidates.filter(row=>row.original_id.endsWith('-bacon'));
 assert.equal(bacon.length,2);
 for(const row of bacon)assert.equal(row.structured_item_draft.data.ingredient_evidence[0].cofid_code,'19-646');
 assert.equal(bacon[0].structured_item_draft.data.nutrition.kcal,515.9);
 assert.equal(bacon[1].structured_item_draft.data.nutrition.kcal,512.3);
 for(const row of result.candidates.filter(row=>row.original_id.endsWith('-turkey')))assert.match(row.structured_item_draft.data.storage.reheat,/Do not cool and reheat/);
 for(const row of result.candidates.filter(row=>row.original_id.endsWith('-beans')))assert.match(row.structured_item_draft.data.method.join(' '),/do not brown or dry out/);
 for(const row of result.candidates.filter(row=>row.original_id.endsWith('-egg')))assert.match(row.structured_item_draft.data.method.join(' '),/both white and yolk are fully set/);
});
