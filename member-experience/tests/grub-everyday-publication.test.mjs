import test from 'node:test';
import assert from 'node:assert/strict';
import {EVERYDAY_PUBLICATION,EVERYDAY_PUBLICATION_SHA256} from '../../grub-everyday-publication-v1.mjs';
import {verifyEverydayPublication,appendEverydayPublication} from '../../grub-everyday-authority-v1.mjs';
import {memberRecipe} from '../grub-search.mjs';
import {createHash} from 'node:crypto';
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
test('exact reviewed seven publish from source only after legacy authority; all prior rows stay byte-exact',async()=>{
 assert.equal(sha(EVERYDAY_PUBLICATION),EVERYDAY_PUBLICATION_SHA256);
 const rows=await verifyEverydayPublication();assert.equal(rows.length,7);
 const legacy={incomplete:false,accepted:798,publishedTotal:2876,rows:[{id:'protected-one',data:{original:'unchanged'}}]},before=JSON.stringify(legacy);
 const result=await appendEverydayPublication(legacy,legacy.rows);
 assert.equal(JSON.stringify(legacy),before);assert.equal(result.rows[0],legacy.rows[0]);assert.equal(result.everydayAccepted,7);assert.equal(result.databasePublishedTotal,2876);
 assert.equal(result.rows.length,8);assert(rows.every(r=>memberRecipe(r)?.nutrition.status==='validated'));
 const ham=rows.find(r=>r.id==='everyday-ham-sandwich');assert.equal(memberRecipe(ham).cook_minutes,0);assert(ham.data.method.some(s=>s.includes('cold ham')));
 for(const row of rows){assert.equal(row.review.reviewer.kind,'ai');assert.equal(row.review.human_review_claimed,false);assert.equal(row.review.owner_publication.instruction,'Deploy all');assert(!row.data.provenance.final_v1_acceptance);assert(row.data.nutrition.precision_note)}
 const failed={...legacy,incomplete:true,rows:[],reason:'original_content_changed'};
 assert.equal(await appendEverydayPublication(failed),failed);
});
test('new authority fails closed on content, quantity, nutrition, reviewer, owner, identity and subset drift',async()=>{
 const mutations=[
 p=>p.rows.pop(),p=>p.rows[0].id='a-rogue-id',p=>p.candidates[0].data.method[0]='Invented method',
 p=>{const d=JSON.parse(p.rows[0].data_json);d.ingredients[0].amount='1g';p.rows[0].data_json=JSON.stringify(d)},
 p=>{const d=JSON.parse(p.rows[0].data_json);d.nutrition.kcal=0;p.rows[0].data_json=JSON.stringify(d)},
 p=>p.independent_review.reviewer.id='/root',p=>p.owner_authority.instruction='Other scope',
 p=>p.independent_review.human_review_claimed=true,p=>p.owner_authority.recorded_at='2026-09-16T18:50:04Z',
 p=>{p.rows[0].title='Other meal';p.rows_sha256=sha(p.rows)},p=>p.database_writes=7
 ];
 for(const mutate of mutations){const p=structuredClone(EVERYDAY_PUBLICATION);mutate(p);await assert.rejects(verifyEverydayPublication(p),/everyday_/);const result=await appendEverydayPublication({incomplete:false,publishedTotal:0,rows:[]},[],p);assert.equal(result.incomplete,true);assert.deepEqual(result.rows,[])}
});
test('even an unselected database collision cannot shadow the new source authority',async()=>{
 const result=await appendEverydayPublication({incomplete:false,publishedTotal:1,rows:[]},[{id:'everyday-ham-sandwich'}]);
 assert.equal(result.reason,'everyday_source_id_collision');assert.deepEqual(result.rows,[]);
});
