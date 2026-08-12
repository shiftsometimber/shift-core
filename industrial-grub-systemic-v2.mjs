import fs from 'node:fs';
import {buildIndustrialCatalogue} from './industrial-catalogue-v5.js';
const index=JSON.parse(fs.readFileSync(process.env.COFID_INDEX||'/tmp/cofid-index.json','utf8'));
const foods=new Map((index.foods||[]).map(f=>[String(f.code),f]));
const APPROVED={
 'olive oil':['17-038','exact'], 'mixed peppers':['13-524','reviewed_proxy'], 'red pepper':['13-524','exact'],
 'rolled oats':['11-788','exact'], 'spinach':['13-521','reviewed_proxy'], 'lettuce':['13-520','exact'],
 'baby potatoes':['13-618','exact'], 'wholemeal bread':['11-981','exact'], 'broccoli':['13-502','exact'], 'onion':['13-499','exact'], 'carrots':['13-496','reviewed_proxy'],
 'brown rice, dry':['11-866','exact'], 'firm tofu':['13-570','reviewed_proxy'], '5% beef mince':['18-508','exact'], 'chicken breast':['18-488','reviewed_proxy'], 'lean pork loin':['18-518','exact'], 'salmon fillet':['16-356','exact'],
 'sweetcorn':['13-529','reviewed_proxy'], 'cherry tomatoes':['13-519','exact'], 'wholewheat pasta, dry':['11-718','reviewed_proxy'], 'tuna in spring water, drained':['16-416','reviewed_proxy'],
 'spring onion':['13-351','reviewed_proxy'], 'courgette':['13-627','exact'], 'kidney beans':['13-660','reviewed_proxy'], 'basmati rice, dry':['11-857','exact'], 'peas':['13-527','reviewed_proxy'], 'potatoes':['13-489','reviewed_proxy'],
 'raw king prawns':['16-387','exact'], 'cooked green lentils':['13-661','exact'], 'roast potatoes':['13-619','reviewed_proxy'], 'oven chips':['13-487','exact'], 'individual pizza base':['11-1016','exact'], 'wholemeal burger bun':['11-986','reviewed_proxy'],
 'paprika':['13-879','exact'], 'chilli powder':['13-873','exact'], 'garlic powder':['13-830','exact'], 'dried parsley':['13-845','exact'], 'dried oregano':['13-878','exact'], 'wholegrain mustard':['17-365','exact'], 'reduced-fat mayonnaise':['17-679','exact'], 'tomato ketchup':['17-709','exact'], 'lemon juice':['14-277','reviewed_proxy'], 'cider vinegar':['17-339','reviewed_proxy'],
 'mushrooms':['13-505','reviewed_proxy'], 'baked beans':['13-532','reviewed_proxy'], 'tikka masala sauce':['17-626','reviewed_proxy'], 'reduced-sugar BBQ sauce':['17-705','reviewed_proxy'], 'reduced-sugar BBQ glaze':['17-705','reviewed_proxy']
};
const PORTION_G={
 'wholemeal bread':80,'wholemeal wrap':65,'brown rice, dry':75,'basmati rice, dry':75,'wholewheat noodles':70,'baking potato':250,'wholemeal bap':80,'wholemeal burger bun':80,'wholemeal bagel':90,'wholemeal flatbread':70,'oven chips':250,'individual pizza base':150,'roast potatoes':220
};
const EACH_G={'boiled eggs':50,'large eggs':60,'egg':60};
const norm=s=>String(s||'').trim();
function grams(amount,item){const s=norm(amount).toLowerCase();const g=s.match(/(\d+(?:\.\d+)?)\s*g\b/);if(g)return Number(g[1]);const ml=s.match(/(\d+(?:\.\d+)?)\s*ml\b/);if(ml)return Number(ml[1])*(item==='olive oil'?0.92:1);if(/portion/.test(s)&&PORTION_G[item])return PORTION_G[item];if(/^\d+(?:\.\d+)?$/.test(s)&&EACH_G[item])return Number(s)*EACH_G[item];return null}
function foodFor(item){const x=APPROVED[item];if(!x)return null;const f=foods.get(x[0]);return f?{food:f,state:x[1]}:null}
const recipes=buildIndustrialCatalogue().recipes;const failures=[];let valid=0,exactOnly=0,proxyUsed=0;const blocked=new Map();const mappedItems=new Set();
for(const r of recipes){let ok=true,hasProxy=false;for(const ing of r.ingredients||[]){const item=norm(ing.item);const hit=foodFor(item),g=grams(ing.amount,item);if(!hit){ok=false;blocked.set(`unmapped:${item}`,(blocked.get(`unmapped:${item}`)||0)+1);continue}mappedItems.add(item);if(hit.state!=='exact')hasProxy=true;if(!(g>0)){ok=false;blocked.set(`amount:${item}:${ing.amount}`,(blocked.get(`amount:${item}:${ing.amount}`)||0)+1)}}if(ok){valid++;if(hasProxy)proxyUsed++;else exactOnly++}else failures.push(r.id)}
const top=[...blocked].sort((a,b)=>b[1]-a[1]).slice(0,50).map(([reason,count])=>({reason,count}));
console.log(JSON.stringify({recipes:recipes.length,approvedCanonicalMappings:Object.keys(APPROVED).length,approvedMappingsActuallyUsed:mappedItems.size,nutritionEligible:valid,exactOnly,reviewedProxyUsed:proxyUsed,quarantined:recipes.length-valid,topBlockers:top},null,2));
if(valid<70)throw new Error(`systemic mapping regressed below current 70 industrial valid: ${valid}`);
console.log(`PASS systemic Grub propagation: ${valid}/${recipes.length} recipes become nutrition-calculation eligible from ${mappedItems.size} reused approved ingredient decisions; ${recipes.length-valid} remain quarantined.`);
