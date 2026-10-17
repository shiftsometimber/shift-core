import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildUKOwnerWaivedPublication} from '../../grub-uk-owner-waiver-20261017.mjs';
import {UK_CORE_PUBLICATION as publication} from '../../grub-uk-core-publication-20261017.mjs';
import {appendUKCorePublication} from '../../grub-uk-core-authority-20261017.mjs';
import {applyGrubDiscovery} from '../grub-discovery.mjs';
import {enrichGrubRecipes,searchGrubRecipes,memberRecipe,filterRecipe} from '../grub-search.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const pack=read('content/grub/uk-core-drafts-20261017.json'),waiver=read('evidence/grub-expansion-closeout-2026-09-16/uk-owner-review-waiver-20261017.json');
test('exact owner waiver never masquerades as independent human or kitchen review',()=>{
 assert.deepEqual(buildUKOwnerWaivedPublication(pack,waiver),publication);
 assert.equal(publication.acceptance_kind,'owner_review_waiver');
 for(const r of publication.items){assert.equal(r.review.human_review_claimed,false);assert.equal(r.review.physical_kitchen_trial_claimed,false);assert.equal(r.data.nutrition.validation_scope,'ingredient_source_arithmetic_only');assert.match(r.data.nutrition.methodology,/Estimated nutrition/);assert.equal(r.data.timing_is_estimate,true);}
 for(const mutate of [w=>w.answer='Deploy',w=>w.human_editorial_review_claimed=true,w=>w.physical_cooking_trial_claimed=true,w=>w.pack_sha256='0'.repeat(64),w=>w.candidates.pop(),w=>w.owner.id='Someone else']){const bad=structuredClone(waiver);mutate(bad);assert.throws(()=>buildUKOwnerWaivedPublication(pack,bad));}
});
test('actual owner-authorised publication gives four ordered UK pizzas and preserves all old identities',async()=>{
 const authority=read('member-experience/tests/fixtures/uk-grub-public-witnesses-20261017.json').authority;
 const before=JSON.stringify(authority),extended=await appendUKCorePublication(authority);
 const curated=await applyGrubDiscovery(extended);assert.equal(JSON.stringify(authority),before);assert.equal(extended.rows.length,authority.rows.length+14);
 const recipes=enrichGrubRecipes(curated.rows),found=searchGrubRecipes({query:'pizza'},recipes);
 assert.deepEqual(found.top.map(x=>x.name),['Margherita pizza with side salad','Pepperoni pizza with side salad','Ham and pineapple pizza with side salad','Mushroom pizza with side salad']);
 for(const r of found.top){assert.equal(r.servings,2);assert.equal(r.minutes,25);assert.equal(r.image,null);assert.equal(r.timing_is_estimate,true);}
 assert.equal(recipes.filter(r=>r.discovery.eligible).length,46);
 const curry=memberRecipe(recipes.find(r=>r.id==='uk-core-chickpea-spinach-curry'));assert.match(curry.allergen_note,/peanuts/);assert.equal(filterRecipe(curry,'vegetarian'),false);
 const changed=structuredClone(publication);changed.items[0].review.human_review_claimed=true;await assert.rejects(()=>appendUKCorePublication(authority,changed));
 assert.equal(memberRecipe(pack.candidates[0]),null);
});
