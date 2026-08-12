import fs from 'node:fs';
let failed=false;const fail=m=>{console.error(m);failed=true};
const src=fs.readFileSync('member-product-v4.js','utf8');
const learning=fs.readFileSync('member-product-v5.js','utf8');
const brain=fs.readFileSync('member-product-v6.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');

if(!entry.includes("memberProductV6Routes"))fail('Production entrypoint is not wired to member product V6');
if(!brain.includes("memberProductV5Routes"))fail('V6 Brain wrapper is not delegating to V5 learning layer');
if(!learning.includes("memberProductV4Routes"))fail('V5 learning layer is not delegating to V4 composer');
if(!src.includes("exact_quantities:true"))fail('Grub V4 must declare exact quantities');
if(!src.includes("nutrition_basis:'curated_estimate'"))fail('Grub nutrition basis must be explicit, not implied precision');
if(!src.includes("Creamy garlic chicken pasta"))fail('Commissioning reference recipe missing');
if(!src.includes("150g, diced")||!src.includes("75g")||!src.includes("10–12 minutes"))fail('Reference pasta recipe is not independently cookable');
if(!src.includes("session_composer:true")||!src.includes("no_time_padding:true"))fail('Fit V4 session-composer contract missing');
if(!src.includes("requested_minutes")||!src.includes("estimated_minutes"))fail('Fit sessions must expose requested versus composed duration');
if(!src.includes("limitations")||!src.includes("equipment")||!src.includes("location"))fail('Fit context must account for limitations/location/equipment');
if(!src.includes("Stop if you develop chest pain"))fail('Fit safety stop rule missing');
const recipes=(src.match(/R\('/g)||[]).length;
const exercises=(src.match(/X\('/g)||[]).length;
if(recipes<16)fail(`Structured recipe starter catalogue too small: ${recipes}`);
if(exercises<12)fail(`Structured exercise starter catalogue too small: ${exercises}`);

if(failed)process.exit(1);
console.log(`Gate 2 product source gate passed: ${recipes} structured recipes, ${exercises} structured exercises, V6 Brain -> V5 learning -> V4 composer chain active.`);
