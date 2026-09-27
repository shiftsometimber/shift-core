import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildGrubOwnerPublication,reconstructOriginalGrubSourceRows,buildProtectedGrubPublication} from '../scripts/build-grub-owner-publication.mjs';
import {selectGovernedGrubRows,reviewedRecipeMinutes} from '../grub-expansion-authority-v1.mjs';
const read=file=>JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const originalRows=reconstructOriginalGrubSourceRows();
const release=buildGrubOwnerPublication({existingRows:originalRows});
const parse=row=>({...row,data:JSON.parse(row.data_json),review:JSON.parse(row.review_json)});
const all=[...originalRows,...release.additions].map(parse);

test('complete owner release serves 2671 recipes and resolves saved IDs to twelve exact revisions',async()=>{
  assert.equal(release.additions.length,1885);
  const authority=await selectGovernedGrubRows(all,release.serving_manifest);
  assert.equal(authority.incomplete,false,authority.reason);assert.equal(authority.accepted,798);assert.equal(authority.expansionAccepted,1873);assert.equal(authority.revisionAccepted,12);assert.equal(authority.rows.length,2671);
  assert.equal(new Set(authority.rows.map(row=>row.id)).size,2671);
  for(const binding of release.serving_manifest.revisions){
    const row=authority.rows.find(row=>row.id===binding.original_id);
    assert.equal(row.publication_id,binding.id);assert.equal(row.version,2);assert.equal(reviewedRecipeMinutes(row.data),60);
    assert.equal(row.data.provenance.final_v1_acceptance,undefined);
    assert.equal(all.find(row=>row.id===binding.original_id).data.provenance.final_v1_acceptance.accepted,true);
  }
});

test('missing, changed or unapproved revisions cannot silently substitute for accepted saved meals',async()=>{
  const first=release.serving_manifest.revisions[0];
  for(const mutate of [
    rows=>rows.splice(rows.findIndex(row=>row.id===first.id),1),
    rows=>rows.find(row=>row.id===first.id).version=1,
    rows=>rows.find(row=>row.id===first.id).review.status='pending',
    rows=>rows.find(row=>row.id===first.id).data_json+=' ',
    rows=>rows.find(row=>row.id===first.id).review.human_review_claimed=true,
  ]){const rows=structuredClone(all);mutate(rows);assert.equal((await selectGovernedGrubRows(rows,release.serving_manifest)).incomplete,true)}
});

test('protected corrections require exact independent review and separate owner authority',()=>{
  const input={pack:read('evidence/grub-expansion-closeout-2026-09-16/protected-revisions-v2.json'),review:read('evidence/grub-expansion-closeout-2026-09-16/protected-revisions-v2-independent-review.json'),instruction:read('evidence/owner-publication-instruction-2026-09-16.json'),protectedOriginals:release.protected_originals};
  for(const mutate of [
    x=>x.pack.candidates[0].structured_item_draft.data.method.push('Unreviewed change'),
    x=>x.review.decisions[0].decision='FIX',
    x=>x.review.decisions[0].reviewer.id='/root/grub_closeout',
    x=>x.review.decisions[0].scopes=['nutrition'],
    x=>x.instruction.status='pending',
    x=>x.pack.candidates[0].expected_source_content_hash='stale',
  ]){const changed=structuredClone(input);mutate(changed);assert.throws(()=>buildProtectedGrubPublication(changed))}
});
