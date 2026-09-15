import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {grubIntelligencePreviewAssets,grubPreviewRecipes} from './grub-intelligence-preview.mjs';
import {catalogueRecords} from './catalogue-data.mjs';

const assets=grubIntelligencePreviewAssets(),html=assets['/member/grub'].body;
const accepted=new Set(catalogueRecords().filter(x=>x.kind==='food').map(x=>x.id));

test('preview examples remain inside the exact 798 accepted recipe cohort',()=>{
 assert.equal(accepted.size,798);
 for(const recipe of Object.values(grubPreviewRecipes)){
  assert.ok(accepted.has(recipe.id),recipe.id);
  assert.ok(recipe.kcal>0&&recipe.protein>0&&recipe.fibre>0);
 }
});

test('preview visibly explains, adjusts, contextualises and learns',()=>{
 for(const text of ['WHY SHIFT PICKED THIS','Make it lighter','More filling','Higher protein','Make it quicker','Make it cheaper','How today sits','Fit + Grub, together','What Shift remembered','Yay — keep this sort','Nay — not again'])assert.match(html,new RegExp(text.replace(/[+]/g,'\\+')));
 assert.match(html,/Nutrition is calculated per serving from CoFID 2021/);
 assert.match(html,/0 exact repeats through 30, 60 and 90-day/);
 assert.match(html,/does not deduct guessed exercise calories/);
 assert.doesNotMatch(html,/burns? belly fat|calories lost|guaranteed weight loss/i);
});

test('all adjustment buttons change real accepted meals or explain an honest no-change',()=>{
 assert.notEqual(grubPreviewRecipes.base.id,grubPreviewRecipes.lighter.id);
 assert.notEqual(grubPreviewRecipes.base.id,grubPreviewRecipes.protein.id);
 assert.notEqual(grubPreviewRecipes.base.id,grubPreviewRecipes.fuller.id);
 assert.notEqual(grubPreviewRecipes.base.id,grubPreviewRecipes.budget.id);
 assert.ok(grubPreviewRecipes.lighter.kcal<grubPreviewRecipes.base.kcal);
 assert.ok(grubPreviewRecipes.protein.protein>grubPreviewRecipes.base.protein);
 assert.ok(grubPreviewRecipes.fuller.fibre>grubPreviewRecipes.base.fibre);
 assert.match(html,/Already 8 minutes/);
 assert.match(html,/no invented £ claim/);
});

test('preview remains isolated from network and production writes',()=>{
 const worker=fs.readFileSync('preview/fit-grub/worker.js','utf8');
 assert.match(worker,/connect-src 'none'/);
 assert.match(worker,/Preview is read-only/);
 assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/);
 assert.match(assets['/grub-intelligence-preview-data.json'].body,/"productionChanged":false/);
});
