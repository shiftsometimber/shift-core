import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');

test('Grub is an informational programme with a complete next-action loop',async()=>{
  const ui=await read('frontend/member/member-grub-programme-v1.js');
  for(const required of ['Your Taste Profile','Build my 7-day Grub plan','Make my shopping list','Show my prep plan','Recipe and method','Swap meal','Keep this'])assert.match(ui,new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.doesNotMatch(ui,/affiliate|partner shortlist|meal-prep fulfilment|COMING NEXT/i);
  assert.match(ui,/grubFeedback/);
  assert.match(ui,/replaceGrubMeal/);
  assert.match(ui,/window\.print/);
});

test('Grub selection applies tastes, hard exclusions, time and repeat cooling',async()=>{
  const api=await read('member-product-v7.js');
  for(const required of ['recentGrubIds','rankRecipes','preferenceLikes','withinTime','no_safe_recipe_match','exact_repeats_in_plan'])assert.match(api,new RegExp(required));
  assert.match(api,/gluten\[ -\]\?free\|coeliac/);
  assert.match(api,/peanut/);
  assert.match(api,/new Set\(\[\.\.\.nays,\.\.\.recent\]\)/);
  assert.match(api,/catalogue_target:2500,catalogue_target_is_not_live_count:true/);
});

test('new Grub assets are served and mounted through the existing member shell',async()=>{
  const [entry,shell]=await Promise.all([read('worker-entry-v6.js'),read('frontend/member/member-shell-v33g.js')]);
  assert.match(entry,/member-grub-programme-v1\.js/);
  assert.match(entry,/member-grub-programme-v1\.css/);
  assert.match(shell,/ensureGrubProgramme/);
});
