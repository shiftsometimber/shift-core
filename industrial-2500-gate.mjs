import fs from 'node:fs';
import path from 'node:path';
import {buildIndustrialCatalogue} from './industrial-catalogue-v3.js';

const fail=m=>{throw new Error(m)};
const readJson=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const baseGrub=fs.readdirSync('content/grub').filter(x=>/^batch-\d+\.json$/.test(x)).sort().flatMap(x=>readJson(path.join('content/grub',x)));
const baseFit=fs.readdirSync('content/fit').filter(x=>/^batch-\d+\.json$/.test(x)).sort().flatMap(x=>readJson(path.join('content/fit',x)));
const c=buildIndustrialCatalogue(),recipes=c.recipes||[],exercises=c.exercises||[];

if(baseGrub.length!==32)fail(`base Grub expected 32, got ${baseGrub.length}`);
if(baseFit.length!==32)fail(`base Fit expected 32, got ${baseFit.length}`);
if(recipes.length!==2468)fail(`industrial Grub expected 2468 so total authored is 2500, got ${recipes.length}`);
if(exercises.length!==2468)fail(`industrial Fit expected 2468 so total authored is 2500, got ${exercises.length}`);
if(baseGrub.length+recipes.length!==2500)fail('Grub authored universe is not 2500');
if(baseFit.length+exercises.length!==2500)fail('Fit authored universe is not 2500');

const allIds=[...baseGrub,...recipes,...baseFit,...exercises].map(x=>x.id);if(new Set(allIds).size!==allIds.length)fail('duplicate ID across the 2,500+2,500 authored universes');
const recipeTitles=recipes.map(x=>x.title.toLowerCase());if(new Set(recipeTitles).size!==recipeTitles.length)fail('duplicate industrial Grub titles');
for(const r of recipes){if(r.schema_version!==1||!r.id||!r.title||!['breakfast','lunch','dinner','snack'].includes(r.meal_type))fail(`${r.id}: identity/type`);if(!Array.isArray(r.ingredients)||r.ingredients.length<4||!r.ingredients.every(x=>x.amount&&x.item))fail(`${r.id}: ingredients`);if(!Array.isArray(r.method)||r.method.length<4||!r.method.every(Boolean))fail(`${r.id}: method`);if(!Array.isArray(r.substitutions)||!r.substitutions.length||!r.storage||!Array.isArray(r.food_safety))fail(`${r.id}: safety/substitution/storage`);if(r.nutrition?.status!=='pending_validation'||r.review?.status!=='draft')fail(`${r.id}: volume must not bypass nutrition/review quarantine`);}
for(const x of exercises){if(x.schema_version!==1||!x.id||!x.title||!x.canonical_movement||!x.variation_identity)fail(`${x.id}: Fit identity`);if(!Array.isArray(x.instructions)||x.instructions.length<5)fail(`${x.id}: instructions`);if(!Array.isArray(x.form_cues)||x.form_cues.length<2||!Array.isArray(x.safety_cues)||x.safety_cues.length<2)fail(`${x.id}: cues`);if(!Array.isArray(x.regressions)||!x.regressions.length||!Array.isArray(x.progressions)||!x.progressions.length||!Array.isArray(x.substitutions)||!x.substitutions.length)fail(`${x.id}: links`);if(!x.limitations||!Array.isArray(x.limitations.avoid)||!Array.isArray(x.limitations.caution))fail(`${x.id}: limitations`);if(x.visual?.status!=='pending'||x.review?.status!=='draft')fail(`${x.id}: volume must not bypass visual/review quarantine`);}

const recipeFingerprints=recipes.map(r=>JSON.stringify([r.meal_type,r.ingredients.map(i=>[i.amount,i.item]),r.method]));if(new Set(recipeFingerprints).size!==recipeFingerprints.length)fail('exact duplicate Grub fingerprints in scale-2500 universe');
const fitFingerprints=exercises.map(x=>JSON.stringify([x.canonical_movement,x.variation_identity,x.dosage,x.instructions,x.equipment]));if(new Set(fitFingerprints).size!==fitFingerprints.length)fail('exact duplicate Fit fingerprints in scale-2500 universe');

const meals=Object.fromEntries(['breakfast','lunch','dinner','snack'].map(k=>[k,recipes.filter(x=>x.meal_type===k).length]));for(const [k,n] of Object.entries(meals))if(n<600)fail(`Grub ${k} industrial coverage too thin at ${n}`);
const treat=recipes.filter(r=>r.tags?.some(t=>['fakeaway-treat','treat-cheat-friendly','treat-meal','treat-snack'].includes(t))).length;if(treat<250)fail(`proper treat/fakeaway coverage too thin: ${treat}`);
const bloke=recipes.filter(r=>r.tags?.includes('bloke-friendly')).length;if(bloke<2200)fail(`new Shift bloke-friendly authored coverage too thin: ${bloke}`);

const newFit=exercises.filter(x=>x.provenance?.version==='industrial-v3');const newCanonical=new Map();for(const x of newFit){const v=newCanonical.get(x.canonical_movement)||[];v.push(x.variation_identity);newCanonical.set(x.canonical_movement,v)}if(newCanonical.size!==102)fail(`expected 102 new canonical Fit mode/movements, got ${newCanonical.size}`);for(const [k,v] of newCanonical)if(new Set(v).size!==22)fail(`${k}: expected 22 meaningful prescription variations, got ${new Set(v).size}`);
const categories=new Set(newFit.map(x=>x.category));for(const k of ['strength','cardio','mobility'])if(!categories.has(k))fail(`Fit category missing ${k}`);

console.log(JSON.stringify({scale2500:{grub:{baseAuthored:baseGrub.length,industrialAuthored:recipes.length,totalAuthored:baseGrub.length+recipes.length,mealDistribution:meals,fakeawayTreatDrafts:treat,blokeFriendlyDrafts:bloke,nutritionPromotion:'blocked until ingredient-level validation'},fit:{baseAuthored:baseFit.length,industrialAuthored:exercises.length,totalAuthored:baseFit.length+exercises.length,newCanonicalMovements:newCanonical.size,variationsPerNewCanonical:22,visualPromotion:'blocked until member-QA'},shortTermTarget:2500,longTermMinimum:10000,quality:{exactDuplicateGate:true,quarantineBeforePromotion:true}}},null,2));
console.log('PASS M11/M12 authored scale wave: 2,500 Grub + 2,500 Fit objects exist as structured, duplicate-gated, deliberately quarantined candidate universes; commissioned counts remain downstream evidence-led.');
